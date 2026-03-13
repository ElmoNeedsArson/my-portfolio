<script lang="ts">
  import { onMount, onDestroy, tick } from "svelte";
  import CanvasCard from "./CanvasCard.svelte";
  import CanvasArrow from "./CanvasArrow.svelte";
  import CanvasNavigation from "./CanvasNavigation.svelte";
  import CanvasEnlargeButton from "./controls/CanvasEnlargeButton.svelte";
  import CanvasTopActions from "./controls/CanvasTopActions.svelte";
  import CanvasWordCountOverlay from "./controls/CanvasWordCountOverlay.svelte";
  import CanvasSequentialNav from "./controls/CanvasSequentialNav.svelte";
  import { cardGroups } from "./canvasGroups";
  import { connections } from "./canvasConnections";
  import {
    adjustPanForZoomAtPoint,
    computeWordCountStats,
    getCountedWords,
    resolveCardDefinitions,
    resolveCardGroups,
  } from "./infiniteCanvasUtils";
  import type {
    CardDefinition,
    CardDefinitionInput,
    Connection,
    ResolvedCardGroup,
    Waypoint,
  } from "./infiniteCanvasTypes";

  export let isPreview = true;
  export let startFullscreen = false;
  export let showGroups = false;

  let isFullscreen = false;
  let isCanvasDarkMode = false;
  let showWordCountOverlay = false;
  let canvasElement: HTMLElement;
  let canvasContentElement: HTMLElement;
  let zoom = 0.58;
  let panX = 800;
  let panY = 4;
  let isPanning = false;
  let startX = 0;
  let startY = 0;
  let cardsMounted = false;

  // Touch interaction state
  let touchStartDistance = 0;
  let touchStartZoom = 0;
  let lastTouchDistance = 0;

  // Target positions for smooth animation
  let targetPanX: number | null = null;
  let targetPanY: number | null = null;
  let targetZoom: number | null = null;
  let animationFrame: number | null = null;
  let layoutUpdateFrame: number | null = null;
  let cardResizeObserver: ResizeObserver | null = null;
  let cardHeights: Record<string, number> = {};
  let cardLayoutVersion = 0;
  let arrowData = [];
  let canvasViewportArea = 1280 * 720;
  let prefersMobileSafeRendering = false;
  let currentNavigationCardId = "intro-overview";
  let hasHydratedCanvasViewState = false;
  const canvasViewStateStorageKey = "infinite-canvas-view-state-v1";

  type CanvasViewState = {
    version: 1;
    panX: number;
    panY: number;
    zoom: number;
    currentNavigationCardId: string;
  };

  const cardModules = import.meta.glob("./canvasCards/*.json", {
    eager: true,
    import: "default",
  }) as Record<string, CardDefinitionInput>;

  const cardDefinitionsInput: CardDefinitionInput[] = Object.entries(cardModules)
    .map(([, card]) => ({ card }))
    .sort((a, b) => {
      const aOrder = a.card.numberOrder ?? Number.POSITIVE_INFINITY;
      const bOrder = b.card.numberOrder ?? Number.POSITIVE_INFINITY;

      return aOrder - bOrder;
    })
    .map(({ card }) => card)
    .filter((card) => !card.hide);


  let resolvedCardDefinitions: CardDefinition[] = [];
  let resolvedCardGroups: ResolvedCardGroup[] = [];

  $: cardLayoutVersion,
    (resolvedCardDefinitions = resolveCardDefinitions(
      cardDefinitionsInput,
      cardHeights,
    ));

  // Compute final card positions
  $: cards = resolvedCardDefinitions;

  $: resolvedCardGroups = showGroups
    ? resolveCardGroups(cards, cardHeights, cardGroups)
    : [];

  $: availableCardIds = new Set(cards.map((card) => card.id));

  $: sequentialCardIds = cards
    .filter((card) => {
      if (!card.id.endsWith("-img")) {
        return true;
      }

      const baseCardId = card.id.slice(0, -4);
      return !availableCardIds.has(baseCardId);
    })
    .map((card) => card.id);

  $: navigationCards = cards.filter((card) => {
    if (!card.id.endsWith("-img")) {
      return true;
    }

    const baseCardId = card.id.slice(0, -4);
    return !availableCardIds.has(baseCardId);
  });

  $: {
    const normalizedCurrentCardId = getPrimaryNavigationCardId(
      currentNavigationCardId,
    );

    if (!sequentialCardIds.includes(normalizedCurrentCardId)) {
      currentNavigationCardId = sequentialCardIds[0] || "intro-overview";
    } else {
      currentNavigationCardId = normalizedCurrentCardId;
    }
  }

  $: currentSequentialIndex = sequentialCardIds.indexOf(
    getPrimaryNavigationCardId(currentNavigationCardId),
  );

  $: canNavigatePrevious = currentSequentialIndex > 0;
  $: canNavigateNext =
    currentSequentialIndex >= 0 &&
    currentSequentialIndex < sequentialCardIds.length - 1;

  $: wordCountStats = computeWordCountStats(cards);

  $: nonCaptionNonTitleWordTotal = wordCountStats.contentWords;

  $: visibleCardIds = new Set(cards.map((card) => card.id));

  $: normalizedZoom =
    zoom *
    Math.sqrt(
      (1280 * 720) / Math.max(canvasViewportArea, 1),
    );

  $: lowDetailMode = prefersMobileSafeRendering || normalizedZoom <= 0.42;

  $: ultraLowDetailMode =
    prefersMobileSafeRendering ||
    (isFullscreen && normalizedZoom <= 0.24);

  $: useSafe2DTransform = lowDetailMode || ultraLowDetailMode;

  $: contentTransform = useSafe2DTransform
    ? `translate(${panX}px, ${panY}px) scale(${zoom})`
    : `translate3d(${panX}px, ${panY}px, 0) scale(${zoom})`;

  // Reactive arrow points - recalculate when cards are mounted and card layout changes
  $: cardLayoutVersion,
    (arrowData = cardsMounted
      ? connections
          .filter(
            (connection) =>
              visibleCardIds.has(connection.from) &&
              visibleCardIds.has(connection.to),
          )
          .map((connection) => ({
          connection,
          points: getArrowPoints(connection),
        }))
      : []);

  function scheduleLayoutRecalculation() {
    if (layoutUpdateFrame !== null) {
      cancelAnimationFrame(layoutUpdateFrame);
    }

    layoutUpdateFrame = requestAnimationFrame(() => {
      if (canvasElement) {
        const rect = canvasElement.getBoundingClientRect();
        canvasViewportArea = rect.width * rect.height;
      }

      cardLayoutVersion += 1;
      layoutUpdateFrame = null;
    });
  }

  function detectMobileSafeRenderingMode(): boolean {
    if (typeof window === "undefined") {
      return false;
    }

    const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
    const noHover = window.matchMedia("(hover: none)").matches;
    const narrowViewport = window.innerWidth <= 900;

    return (coarsePointer && noHover) || narrowViewport;
  }

  function handleWindowResize() {
    prefersMobileSafeRendering = detectMobileSafeRenderingMode();
    scheduleLayoutRecalculation();
  }

  function cancelNavigationAnimation() {
    if (animationFrame !== null) {
      cancelAnimationFrame(animationFrame);
      animationFrame = null;
    }

    targetPanX = null;
    targetPanY = null;
    targetZoom = null;
  }

  function handleWheel(e: WheelEvent) {
    cancelNavigationAnimation();
    clearActiveElementFocus();
    e.preventDefault();

    if (!e.ctrlKey) {
      panY -= e.deltaY;

      if (hasHydratedCanvasViewState) {
        saveCanvasViewState();
      }

      return;
    }

    // Get mouse position relative to canvas
    const rect = canvasElement.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Update zoom with min/max limits
    const zoomDelta = -e.deltaY * 0.001;
    const newZoom = Math.max(0.15, Math.min(3, zoom + zoomDelta));

    const nextPan = adjustPanForZoomAtPoint({
      focusX: mouseX,
      focusY: mouseY,
      panX,
      panY,
      oldZoom: zoom,
      newZoom,
    });

    panX = nextPan.panX;
    panY = nextPan.panY;

    zoom = newZoom;

    if (hasHydratedCanvasViewState) {
      saveCanvasViewState();
    }
  }

  function handleMouseDown(e: MouseEvent) {
    cancelNavigationAnimation();
    clearActiveElementFocus();
    // Only pan with left mouse button
    if (e.button !== 0) return;

    isPanning = true;
    startX = e.clientX - panX;
    startY = e.clientY - panY;
    canvasElement.style.cursor = "grabbing";

    //console.log("Pan start:", { startX, startY });
  }

  function handleMouseMove(e: MouseEvent) {
    if (!isPanning) return;

    panX = e.clientX - startX;
    panY = e.clientY - startY;

    //console.log("Panning:", { panX, panY });
  }

  function handleMouseUp() {
    isPanning = false;
    canvasElement.style.cursor = "grab";

    if (hasHydratedCanvasViewState) {
      saveCanvasViewState();
    }
  }

  function handleTouchStart(e: TouchEvent) {
    cancelNavigationAnimation();
    clearActiveElementFocus();
    if (e.touches.length === 1) {
      // Single finger - pan
      isPanning = true;
      const touch = e.touches[0];
      startX = touch.clientX - panX;
      startY = touch.clientY - panY;
    } else if (e.touches.length === 2) {
      // Two fingers - prepare for pinch zoom
      isPanning = false;
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const dx = touch2.clientX - touch1.clientX;
      const dy = touch2.clientY - touch1.clientY;
      touchStartDistance = Math.sqrt(dx * dx + dy * dy);
      lastTouchDistance = touchStartDistance;
      touchStartZoom = zoom;
    }
  }

  function handleTouchMove(e: TouchEvent) {
    e.preventDefault();
    
    if (e.touches.length === 1 && isPanning) {
      // Single finger pan
      const touch = e.touches[0];
      panX = touch.clientX - startX;
      panY = touch.clientY - startY;
    } else if (e.touches.length === 2) {
      // Two finger pinch zoom
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      
      // Calculate current distance between fingers
      const dx = touch2.clientX - touch1.clientX;
      const dy = touch2.clientY - touch1.clientY;
      const currentDistance = Math.sqrt(dx * dx + dy * dy);
      const smoothedDistance =
        lastTouchDistance > 0
          ? lastTouchDistance * 0.7 + currentDistance * 0.3
          : currentDistance;
      
      // Calculate zoom center (midpoint between fingers)
      const rect = canvasElement.getBoundingClientRect();
      const centerX = ((touch1.clientX + touch2.clientX) / 2) - rect.left;
      const centerY = ((touch1.clientY + touch2.clientY) / 2) - rect.top;
      
      // Calculate new zoom based on distance change
      const scale = smoothedDistance / touchStartDistance;
      const newZoom = Math.max(0.15, Math.min(3, touchStartZoom * scale));

      const nextPan = adjustPanForZoomAtPoint({
        focusX: centerX,
        focusY: centerY,
        panX,
        panY,
        oldZoom: zoom,
        newZoom,
      });

      panX = nextPan.panX;
      panY = nextPan.panY;
      
      zoom = newZoom;
      lastTouchDistance = smoothedDistance;
    }
  }

  function handleTouchEnd(e: TouchEvent) {
    if (e.touches.length === 0) {
      isPanning = false;
      touchStartDistance = 0;
      touchStartZoom = 0;
    } else if (e.touches.length === 1) {
      // Went from 2 fingers to 1, restart pan
      isPanning = true;
      const touch = e.touches[0];
      startX = touch.clientX - panX;
      startY = touch.clientY - panY;
      touchStartDistance = 0;
    }

    if (hasHydratedCanvasViewState) {
      saveCanvasViewState();
    }
  }

  function handlePageUnload() {
    if (!hasHydratedCanvasViewState) {
      return;
    }

    saveCanvasViewState();
  }

  function syncFullscreenUrl(
    fullscreen: boolean,
    mode: "replace" | "push" = "replace",
  ) {
    const url = new URL(window.location.href);

    if (fullscreen) {
      url.searchParams.set("canvas", "fullscreen");
    } else if (url.searchParams.get("canvas") === "fullscreen") {
      url.searchParams.delete("canvas");
    }

    const nextUrl = `${url.pathname}${url.search}${url.hash}`;
    const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;

    if (nextUrl === currentUrl) {
      return;
    }

    if (mode === "push") {
      window.history.pushState(window.history.state, "", nextUrl);
      return;
    }

    window.history.replaceState(window.history.state, "", nextUrl);
  }

  function applyFullscreenUiState(fullscreen: boolean) {
    if (fullscreen) {
      document.body.style.overflow = "hidden";
      return;
    }

    document.body.style.overflow = "";
    showWordCountOverlay = false;
  }

  async function recenterAfterFullscreenChange() {
    cancelNavigationAnimation();
    await tick();

    const currentCardId = currentNavigationCardId || "intro-overview";
    centerOnCardInstant(currentCardId);
  }

  async function syncFullscreenStateFromUrl() {
    if (typeof window === "undefined") {
      return;
    }

    const shouldBeFullscreen =
      new URLSearchParams(window.location.search).get("canvas") ===
      "fullscreen";

    if (shouldBeFullscreen === isFullscreen) {
      return;
    }

    isFullscreen = shouldBeFullscreen;
    applyFullscreenUiState(isFullscreen);
    await recenterAfterFullscreenChange();
  }

  function clearActiveElementFocus() {
    const activeElement = document.activeElement as HTMLElement | null;
    if (activeElement && activeElement !== document.body) {
      activeElement.blur();
    }
  }

  function loadCanvasViewState(): CanvasViewState | null {
    if (typeof window === "undefined") {
      return null;
    }

    const rawState = window.sessionStorage.getItem(canvasViewStateStorageKey);
    if (!rawState) {
      return null;
    }

    try {
      const parsed = JSON.parse(rawState) as Partial<CanvasViewState>;

      if (
        parsed.version !== 1 ||
        typeof parsed.panX !== "number" ||
        typeof parsed.panY !== "number" ||
        typeof parsed.zoom !== "number" ||
        !Number.isFinite(parsed.panX) ||
        !Number.isFinite(parsed.panY) ||
        !Number.isFinite(parsed.zoom)
      ) {
        return null;
      }

      return {
        version: 1,
        panX: parsed.panX,
        panY: parsed.panY,
        zoom: Math.max(0.15, Math.min(3, parsed.zoom)),
        currentNavigationCardId:
          typeof parsed.currentNavigationCardId === "string"
            ? parsed.currentNavigationCardId
            : "intro-overview",
      };
    } catch {
      return null;
    }
  }

  function saveCanvasViewState() {
    if (typeof window === "undefined") {
      return;
    }

    const state: CanvasViewState = {
      version: 1,
      panX,
      panY,
      zoom,
      currentNavigationCardId,
    };

    window.sessionStorage.setItem(
      canvasViewStateStorageKey,
      JSON.stringify(state),
    );
  }

  async function toggleFullscreen() {
    isFullscreen = !isFullscreen;
    syncFullscreenUrl(isFullscreen, isFullscreen ? "push" : "replace");
    applyFullscreenUiState(isFullscreen);
    await recenterAfterFullscreenChange();
  }

  function toggleDarkMode() {
    isCanvasDarkMode = !isCanvasDarkMode;
  }

  function toggleWordCountOverlay() {
    showWordCountOverlay = !showWordCountOverlay;
  }

  function getCardEdgePoint(
    cardId: string,
    side: "top" | "bottom" | "left" | "right",
  ): { x: number; y: number } {
    const card = cards.find((c) => c.id === cardId);
    if (!card) return { x: 0, y: 0 };

    const cardElement = cardsMounted
      ? (canvasContentElement?.querySelector(
          `[data-card-id="${cardId}"]`,
        ) as HTMLElement)
      : null;
    const actualHeight = cardElement?.offsetHeight || 300;

    switch (side) {
      case "top":
        return { x: card.x + card.width / 2, y: card.y };
      case "bottom":
        return { x: card.x + card.width / 2, y: card.y + actualHeight };
      case "left":
        return { x: card.x, y: card.y + actualHeight / 2 };
      case "right":
        return { x: card.x + card.width, y: card.y + actualHeight / 2 };
    }
  }

  function resolveWaypointPoint(
    waypoint: Waypoint,
    connection: Connection,
  ): { x: number; y: number } {
    const anchorPoint =
      waypoint.relativeTo === "from"
        ? getCardEdgePoint(connection.from, connection.fromSide)
        : getCardEdgePoint(connection.to, connection.toSide);

    return {
      x: anchorPoint.x + waypoint.offsetX,
      y: anchorPoint.y + waypoint.offsetY,
    };
  }

  function getArrowPoints(
    connection: Connection,
  ): Array<{ x: number; y: number }> {
    const start = getCardEdgePoint(connection.from, connection.fromSide);
    const end = getCardEdgePoint(connection.to, connection.toSide);

    return [
      start,
      ...(connection.waypoints || []).map((waypoint) =>
        resolveWaypointPoint(waypoint, connection),
      ),
      end,
    ];
  }

  function animateToTarget() {
    if (targetPanX === null || targetPanY === null || targetZoom === null) {
      animationFrame = null;
      return;
    }

    const easeSpeed = 0.1; // Adjust for faster/slower animation
    const threshold = 0.5; // Stop animating when close enough

    const panXDiff = targetPanX - panX;
    const panYDiff = targetPanY - panY;
    const zoomDiff = targetZoom - zoom;

    if (
      Math.abs(panXDiff) < threshold &&
      Math.abs(panYDiff) < threshold &&
      Math.abs(zoomDiff) < 0.01
    ) {
      // Animation complete
      panX = targetPanX;
      panY = targetPanY;
      zoom = targetZoom;
      targetPanX = null;
      targetPanY = null;
      targetZoom = null;
      animationFrame = null;
      return;
    }

    // Ease towards target
    panX += panXDiff * easeSpeed;
    panY += panYDiff * easeSpeed;
    zoom += zoomDiff * easeSpeed;

    animationFrame = requestAnimationFrame(animateToTarget);
  }

  function getPrimaryNavigationCardId(cardId: string): string {
    if (!cardId.endsWith("-img")) {
      return cardId;
    }

    const baseCardId = cardId.slice(0, -4);
    return availableCardIds.has(baseCardId) ? baseCardId : cardId;
  }

  function getNavigationFrameCardIds(cardId: string): string[] {
    const primaryCardId = getPrimaryNavigationCardId(cardId);
    const companionImageCardId = `${primaryCardId}-img`;

    if (availableCardIds.has(companionImageCardId)) {
      return [primaryCardId, companionImageCardId];
    }

    return [primaryCardId];
  }

  function getNavigationFrame(cardId: string): {
    x: number;
    y: number;
    width: number;
    height: number;
    centerMode: "top" | "middle";
    fitToFrame: boolean;
    maxZoom: number;
  } | null {
    const frameCardIds = getNavigationFrameCardIds(cardId);
    const frameCards = frameCardIds
      .map((id) => cards.find((card) => card.id === id))
      .filter(Boolean);
    const primaryCard = cards.find((card) => card.id === cardId);

    if (!frameCards.length) {
      return null;
    }

    const bounds = frameCards.reduce(
      (acc, card) => {
        const cardElement = canvasContentElement?.querySelector(
          `[data-card-id="${card.id}"]`,
        ) as HTMLElement | null;
        const cardHeight = cardElement?.offsetHeight || 300;
        const rightEdge = card.x + card.width;
        const bottomEdge = card.y + cardHeight;

        return {
          minX: Math.min(acc.minX, card.x),
          minY: Math.min(acc.minY, card.y),
          maxX: Math.max(acc.maxX, rightEdge),
          maxY: Math.max(acc.maxY, bottomEdge),
        };
      },
      {
        minX: Number.POSITIVE_INFINITY,
        minY: Number.POSITIVE_INFINITY,
        maxX: Number.NEGATIVE_INFINITY,
        maxY: Number.NEGATIVE_INFINITY,
      },
    );

    const hasCompanionImage = frameCards.length > 1;

    return {
      x: bounds.minX,
      y: bounds.minY,
      width: bounds.maxX - bounds.minX,
      height: bounds.maxY - bounds.minY,
      centerMode: hasCompanionImage
        ? "middle"
        : (frameCards[0].initialCenterMode || "top"),
      fitToFrame: primaryCard?.navigationFitToFrame ?? false,
      maxZoom: primaryCard?.navigationMaxZoom ?? 0.6,
    };
  }

  function getNavigationTargetFromFrame(
    frame: {
      x: number;
      y: number;
      width: number;
      height: number;
      centerMode: "top" | "middle";
      fitToFrame: boolean;
      maxZoom: number;
    },
    viewportWidth: number,
    viewportHeight: number,
  ): { panX: number; panY: number; zoom: number } {
    const isPhoneViewport = viewportWidth <= 640;
    const isTabletViewport = viewportWidth > 640 && viewportWidth <= 1100;
    const isCompanionFrame = frame.centerMode === "middle";
    const widthFitZoom = (viewportWidth * 0.9) / Math.max(frame.width, 1);
    const heightFitZoom = (viewportHeight * 0.95) / Math.max(frame.height, 1);
    const frameFitZoom = Math.min(widthFitZoom, heightFitZoom);
    const shouldAutoFit =
      frame.fitToFrame ||
      isPhoneViewport ||
      (isTabletViewport && isCompanionFrame);
    const resolvedZoom = shouldAutoFit
      ? Math.max(0.15, Math.min(frame.maxZoom, frameFitZoom))
      : frame.maxZoom;

    const frameCenterX = frame.x + frame.width / 2;
    const frameCenterY = frame.y + frame.height / 2;

    const panX = viewportWidth / 2 - frameCenterX * resolvedZoom;
    const panY =
      frame.centerMode === "middle"
        ? viewportHeight / 2 - frameCenterY * resolvedZoom
        : viewportHeight * 0.15 - frame.y * resolvedZoom;

    return {
      panX,
      panY,
      zoom: resolvedZoom,
    };
  }

  function navigateToCard(cardId: string) {
    if (!canvasElement) return;

    const navigationCardId = getPrimaryNavigationCardId(cardId);
    const frame = getNavigationFrame(navigationCardId);
    if (!frame) return;

    currentNavigationCardId = navigationCardId;

    const rect = canvasElement.getBoundingClientRect();
    const target = getNavigationTargetFromFrame(frame, rect.width, rect.height);

    targetPanX = target.panX;
    targetPanY = target.panY;
    targetZoom = target.zoom;

    // Start animation if not already running
    if (animationFrame === null) {
      animationFrame = requestAnimationFrame(animateToTarget);
    }
  }

  function navigateToAdjacentCard(direction: -1 | 1) {
    if (currentSequentialIndex < 0) return;

    const nextIndex = currentSequentialIndex + direction;
    if (nextIndex < 0 || nextIndex >= sequentialCardIds.length) return;

    navigateToCard(sequentialCardIds[nextIndex]);
  }

  function centerOnCardInstant(cardId: string) {
    if (!canvasElement) return;

    const navigationCardId = getPrimaryNavigationCardId(cardId);
    const frame = getNavigationFrame(navigationCardId);
    if (!frame) return;

    currentNavigationCardId = navigationCardId;

    const rect = canvasElement.getBoundingClientRect();
    const target = getNavigationTargetFromFrame(frame, rect.width, rect.height);

    zoom = target.zoom;
    panX = target.panX;
    panY = target.panY;
  }

  onMount(async () => {
    prefersMobileSafeRendering = detectMobileSafeRenderingMode();

    isFullscreen = startFullscreen;
    applyFullscreenUiState(isFullscreen);

    if (isFullscreen) {
      syncFullscreenUrl(true, "push");
    }

    // Wait for cards to be in DOM
    await tick();
    cardsMounted = true;

    const cardElements = canvasContentElement?.querySelectorAll("[data-card-id]");
    if (cardElements && cardElements.length > 0) {
      cardResizeObserver = new ResizeObserver(() => {
        cardElements.forEach((cardElement) => {
          const element = cardElement as HTMLElement;
          const cardId = element.dataset.cardId;
          if (cardId) {
            cardHeights[cardId] = element.offsetHeight;
          }
        });

        scheduleLayoutRecalculation();
      });

      cardElements.forEach((cardElement) => {
        const element = cardElement as HTMLElement;
        const cardId = element.dataset.cardId;
        if (cardId) {
          cardHeights[cardId] = element.offsetHeight;
        }

        cardResizeObserver?.observe(cardElement);
      });
    }

    window.addEventListener("resize", handleWindowResize);
    window.addEventListener("popstate", syncFullscreenStateFromUrl);
    window.addEventListener("hashchange", syncFullscreenStateFromUrl);
    window.addEventListener("pagehide", handlePageUnload);
    window.addEventListener("beforeunload", handlePageUnload);
    scheduleLayoutRecalculation();

    await tick();

    const persistedState = loadCanvasViewState();
    if (persistedState) {
      panX = persistedState.panX;
      panY = persistedState.panY;
      zoom = persistedState.zoom;
      currentNavigationCardId = persistedState.currentNavigationCardId;
    } else {
      centerOnCardInstant("intro-overview");
    }

    hasHydratedCanvasViewState = true;
  });

  onDestroy(() => {
    if (animationFrame !== null) {
      cancelAnimationFrame(animationFrame);
    }

    if (layoutUpdateFrame !== null) {
      cancelAnimationFrame(layoutUpdateFrame);
    }

    cardResizeObserver?.disconnect();
    window.removeEventListener("resize", handleWindowResize);
    window.removeEventListener("popstate", syncFullscreenStateFromUrl);
    window.removeEventListener("hashchange", syncFullscreenStateFromUrl);
    window.removeEventListener("pagehide", handlePageUnload);
    window.removeEventListener("beforeunload", handlePageUnload);
    if (hasHydratedCanvasViewState) {
      saveCanvasViewState();
    }
    document.body.style.overflow = "";
  });
</script>

<div
  class="canvas-wrapper"
  class:fullscreen={isFullscreen}
  style="
    --primary-text-color: {isCanvasDarkMode ? '#ffffff' : '#141414'};
    --secondary-text-color: #F96743;
    --background-color: {isCanvasDarkMode ? '#010409' : '#ffffff'};
    --secondary-background-color: {isCanvasDarkMode ? '#1A1D21' : '#f8f9fa'};
    --muted-color: {isCanvasDarkMode ? '#A1A4AA' : '#666666'};
    --border-color: {isCanvasDarkMode ? '#525252' : '#dddddd'};
    --hover-color: {isCanvasDarkMode ? '#2A2D35' : '#f1f3f4'};
    --canvas-card-background: {isCanvasDarkMode ? 'rgba(26, 29, 33, 0.92)' : 'rgba(255, 255, 255, 0.96)'};
    --canvas-card-solid-background: {isCanvasDarkMode ? '#1A1D21' : '#ffffff'};
    --canvas-card-shadow: {isCanvasDarkMode ? 'rgba(0, 0, 0, 0.25)' : 'rgba(0, 0, 0, 0.12)'};
  "
>
  <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
  <div
    class="infinite-canvas"
    class:preview={isPreview && !isFullscreen}
    bind:this={canvasElement}
    on:wheel={handleWheel}
    on:mousedown={handleMouseDown}
    on:mousemove={handleMouseMove}
    on:mouseup={handleMouseUp}
    on:mouseleave={handleMouseUp}
    on:touchstart={handleTouchStart}
    on:touchmove={handleTouchMove}
    on:touchend={handleTouchEnd}
    on:touchcancel={handleTouchEnd}
    role="application"
    tabindex="0"
    aria-label="Infinite canvas with content cards"
  >
    <!-- Dot grid background -->
    <div
      class="dot-grid"
      class:safe-transform={useSafe2DTransform}
      style="transform: {contentTransform}"
    ></div>

    <!-- Canvas content with transformation -->
    <div
      bind:this={canvasContentElement}
      class="canvas-content"
      class:safe-transform={useSafe2DTransform}
      style="transform: {contentTransform}"
    >
      <!-- Arrows (rendered first so they appear below cards) -->
      <svg class="arrows-layer">
        {#if arrowData}
          {#each arrowData as {points}}
            <CanvasArrow {points} />
          {/each}
        {/if}
      </svg>

      <!-- Groups -->
      {#if showGroups}
        {#each resolvedCardGroups as group (group.id)}
          <div
            class="card-group"
            style="
              left: {group.x}px;
              top: {group.y}px;
              width: {group.width}px;
              height: {group.height}px;
              border-color: {group.borderColor};
              background-color: {group.backgroundColor};
            "
            aria-hidden="true"
          >
            <div
              class="card-group__label"
              style="
                color: {group.labelTextColor};
                background-color: {group.labelBackgroundColor};
              "
            >
              {group.title}
            </div>
          </div>
        {/each}
      {/if}

      <!-- Cards -->
      {#each cards as card (card.id)}
        <CanvasCard
          cardId={card.id}
          x={card.x}
          y={card.y}
          zoomLevel={zoom}
          {lowDetailMode}
          {ultraLowDetailMode}
          width={card.width}
          title={card.title}
          color={card.color}
          sections={card.sections}
          hideHeader={card.hideHeader || false}
          contentAlign={card.contentAlign || "left"}
          introTitle={card.introTitle}
          introSubtitle={card.introSubtitle}
          introLarge={card.introLarge || false}
        />
      {/each}
    </div>

    <!-- Enlarge/Close button -->
    {#if isPreview && !isFullscreen}
      <CanvasEnlargeButton onClick={toggleFullscreen} />
    {/if}

    {#if isFullscreen}
      <CanvasTopActions
        {isCanvasDarkMode}
        onToggleWordCount={toggleWordCountOverlay}
        onToggleDarkMode={toggleDarkMode}
        onClose={toggleFullscreen}
      />

      {#if showWordCountOverlay}
        <CanvasWordCountOverlay
          {nonCaptionNonTitleWordTotal}
          {wordCountStats}
        />
      {/if}
    {/if}

    <CanvasSequentialNav
      {canNavigatePrevious}
      {canNavigateNext}
      onPrevious={() => navigateToAdjacentCard(-1)}
      onNext={() => navigateToAdjacentCard(1)}
    />

    <!-- Canvas Navigation Widget -->
    <CanvasNavigation
      cards={navigationCards}
      onNavigate={navigateToCard}
      {isFullscreen}
    />
  </div>
</div>

<style>
  .canvas-wrapper {
    position: relative;
    width: 100%;
    margin-bottom: 2.5rem;
  }

  .canvas-wrapper.fullscreen {
    position: fixed;
    inset: 0;
    z-index: 1000;
    margin: 0;
    background: var(
      --background-color
    ); 
  }

  .infinite-canvas {
    position: relative;
    width: 100%;
    height: 70vh; /* Preview mode height*/
    overflow: hidden;
    cursor: grab;
    background: var(--secondary-background-color);
    border-radius: 9px;
    user-select: none;
    backface-visibility: hidden;
    transform: translateZ(0);
  }

  .infinite-canvas.preview {
    min-height: 70vh; /* Should match height above */
  }

  .canvas-wrapper.fullscreen .infinite-canvas {
    border-radius: 0;
    height: 100vh;
    height: 100dvh;
  }

  .dot-grid {
    position: absolute;
    left: -10000px;
    top: -10000px;
    width: 40000px;
    height: 40000px;
    background-image: radial-gradient(
      circle,
      var(--muted-color) 2px,
      transparent 1.5px
    );
    background-size: 40px 40px;
    background-position: 0 0;
    transform-origin: 10000px 10000px;
    pointer-events: none;
    will-change: transform;
    backface-visibility: hidden;
  }

  .dot-grid.safe-transform {
    will-change: auto;
    backface-visibility: visible;
  }

  .canvas-content {
    position: absolute;
    top: 0;
    left: 0;
    transform-origin: 0 0;
    width: 100%;
    height: 100%;
    will-change: transform;
    backface-visibility: hidden;
  }

  .canvas-content.safe-transform {
    will-change: auto;
    backface-visibility: visible;
  }

  .arrows-layer {
    position: absolute;
    top: 0;
    left: 0;
    width: 2000px;
    height: 2000px;
    pointer-events: none;
    overflow: visible;
  }

  .card-group {
    position: absolute;
    border: 1.5px solid;
    border-radius: 14px;
    pointer-events: none;
    z-index: 0;
  }

  .card-group__label {
    position: absolute;
    top: 8px;
    left: 8px;
    font-size: 0.66rem;
    letter-spacing: 0.03em;
    text-transform: uppercase;
    font-weight: 650;
    line-height: 1;
    padding: 0.28rem 0.48rem;
    border-radius: 6px;
    border: 1px solid rgba(0, 0, 0, 0.06);
  }

  .infinite-canvas:active {
    cursor: grabbing;
  }

  /* Print styles for PDF export */
  @media print {
    .canvas-wrapper {
      position: static;
      margin: 0;
    }

    .infinite-canvas {
      height: auto !important;
      min-height: 0 !important;
      overflow: visible !important;
      border-radius: 0;
      transform: scale(0.6);
      transform-origin: top left;
    }

    .canvas-content {
      position: static !important;
      transform: none !important;
    }

    .dot-grid {
      display: none;
    }

    :global(.canvas-action-button),
    :global(.canvas-navigation) {
      display: none !important;
    }
  }
</style>
