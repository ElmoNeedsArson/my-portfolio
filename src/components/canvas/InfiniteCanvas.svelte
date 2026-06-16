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
  import { ACTS, actForCard } from "../../lib/acts";
  import { eaForCard, EA_AREAS } from "../../lib/expertiseAreas";
  import { buildPentagonConnections, buildPentagonUnitFrames } from "../../lib/pentagonLayout";
  import type { Box as PentagonBox } from "../../lib/pentagonLayout";
  import {
    adjustPanForZoomAtPoint,
    computeWordCountStats,
    getCountedWords,
    resolveCardDefinitions,
    resolveCardGroups,
  } from "./infiniteCanvasUtils";
  import { buildCitations, buildFigures, buildFigureCards, buildCitationCardMap } from "../../lib/citationUtils";
  import { citationNumberMap, citedSources, citationCardMap } from "../../lib/citationStore";
  import { figureNumberMap, figureCardMap } from "../../lib/figureStore";
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

  type LightboxImage = { src: string; alt: string; caption?: string };
  let lightboxImage: LightboxImage | null = null;

  function openLightbox(e: CustomEvent<LightboxImage>) {
    lightboxImage = e.detail;
  }

  function closeLightbox() {
    lightboxImage = null;
  }
  let panX = 800;
  let panY = 4;
  let isPanning = false;
  let startX = 0;
  let startY = 0;
  let cardsMounted = false;

  let touchStartDistance = 0;
  let touchStartZoom = 0;
  let lastTouchDistance = 0;
  let touchWasPinch = false;

  let targetPanX: number | null = null;
  let targetPanY: number | null = null;
  let targetZoom: number | null = null;
  let animationFrame: number | null = null;
  let layoutUpdateFrame: number | null = null;
  let cardResizeObserver: ResizeObserver | null = null;
  let cardHeights: Record<string, number> = {};
  let cardLayoutVersion = 0;
  let arrowData: { connection: Connection; points: Array<{ x: number; y: number }> }[] = [];
  let canvasViewportArea = 1280 * 720;
  let canvasViewportWidth = 1280;
  let canvasViewportHeight = 720;
  let isMoving = false;
  let movingTimer: ReturnType<typeof setTimeout> | null = null;
  let imageVisibleCardIds: Set<string> = new Set();
  let prefersMobileSafeRendering = false;
  let hasDragged = false;
  let mouseDownX = 0;
  let mouseDownY = 0;
  let touchStartClientX = 0;
  let touchStartClientY = 0;
  let touchHasDragged = false;
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

  $: {
    const result = buildCitations(cardDefinitionsInput);
    citationNumberMap.set(result.citationMap);
    citedSources.set(result.orderedSources);
  }

  $: figureNumberMap.set(buildFigures(cardDefinitionsInput));
  $: figureCardMap.set(buildFigureCards(cardDefinitionsInput));
  $: citationCardMap.set(buildCitationCardMap(cardDefinitionsInput));

  let citationReturnCardId: string | null = null;

  $: cards = resolvedCardDefinitions;

  $: resolvedCardGroups = showGroups
    ? resolveCardGroups(cards, cardHeights, cardGroups)
    : [];

  $: availableCardIds = new Set(cards.map((card) => card.id));

  $: sequentialCardIds = cards
    .filter((card) => {
      if (card.id === "references-act1" || card.id === "references-present") {
        return false;
      }

      if (!card.id.endsWith("-img")) {
        return true;
      }

      const baseCardId = card.id.slice(0, -4);
      return !availableCardIds.has(baseCardId);
    })
    .map((card) => card.id);

  $: navigationCards = cards.filter((card) => {
    if (card.id === "references-act1" || card.id === "references-present") {
      return false;
    }

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

  $: wordCountStats = computeWordCountStats(cards.filter((c) => c.id !== "references-act1" && c.id !== "references-present"));

  $: nonCaptionNonTitleWordTotal = wordCountStats.contentWords;

  $: actBands = (() => {
    if (cards.length === 0) return [];
    const PAD_X = 60;
    const PAD_TOP = 600;
    const PAD_BOTTOM = 200;

    let globalMinY = Infinity;
    let globalMaxY = -Infinity;
    for (const card of cards) {
      const height = cardHeights[card.id] ?? 300;
      if (card.y - PAD_TOP < globalMinY) globalMinY = card.y - PAD_TOP;
      if (card.y + height + PAD_BOTTOM > globalMaxY) globalMaxY = card.y + height + PAD_BOTTOM;
    }

    return ACTS.flatMap((act) => {
      const actCards = cards.filter((c) => act.cardIds.includes(c.id));
      if (actCards.length === 0) return [];
      let minX = Infinity;
      let maxX = -Infinity;
      for (const card of actCards) {
        if (card.x - PAD_X < minX) minX = card.x - PAD_X;
        if (card.x + card.width + PAD_X > maxX) maxX = card.x + card.width + PAD_X;
      }
      return [{
        id: act.id,
        label: act.label,
        description: act.description,
        color: act.bandColor,
        x: minX,
        y: globalMinY,
        width: maxX - minX,
        height: globalMaxY - globalMinY,
      }];
    });
  })();

  $: if (cards.length > 0 && imageVisibleCardIds.size === 0) {
    imageVisibleCardIds = new Set(cards.map((c) => c.id));
  }



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

  function getCardBox(cardId: string): PentagonBox | null {
    const card = cards.find((c) => c.id === cardId);
    if (!card) return null;
    const height = cardHeights[card.id] ?? 300;
    return { x: card.x, y: card.y, width: card.width, height };
  }

  $: pentagonHubCenter = (() => {
    const hub = cards.find((c) => c.id === "professional-skills");
    if (!hub) return null;
    const hubHeight = cardHeights[hub.id] ?? 300;
    return { x: hub.x + hub.width / 2, y: hub.y + hubHeight / 2 };
  })();

  $: pentagonConnections = pentagonHubCenter
    ? buildPentagonConnections(pentagonHubCenter, availableCardIds, (key) => EA_AREAS[key].base)
    : [];

  $: pentagonUnitFrames = buildPentagonUnitFrames(availableCardIds, getCardBox);

  $: allConnections = [...connections, ...pentagonConnections];

  $: cardLayoutVersion,
    (arrowData = cardsMounted
      ? allConnections
          .filter(
            (connection) =>
              (connection.fromPoint || availableCardIds.has(connection.from ?? "")) &&
              (connection.toPoint || availableCardIds.has(connection.to ?? "")),
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
        canvasViewportWidth = rect.width;
        canvasViewportHeight = rect.height;
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

  async function handleWindowResize() {
    prefersMobileSafeRendering = detectMobileSafeRenderingMode();
    scheduleLayoutRecalculation();

    // Wait a tick so DOM updates (card sizes/layout) settle, then re-center
    await tick();

    if (currentNavigationCardId) {
      centerOnCardInstant(currentNavigationCardId);
    }
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

  function isCardInViewport(card: CardDefinition): boolean {
    const BUFFER_SCREEN_PX = 600;
    const buf = BUFFER_SCREEN_PX / zoom;
    const cardHeight = cardHeights[card.id] || 600;
    return (
      card.x + card.width > -panX / zoom - buf &&
      card.x < (canvasViewportWidth - panX) / zoom + buf &&
      card.y + cardHeight > -panY / zoom - buf &&
      card.y < (canvasViewportHeight - panY) / zoom + buf
    );
  }

  function markMoving() {
    if (!isMoving) isMoving = true;
    if (movingTimer !== null) clearTimeout(movingTimer);
    movingTimer = setTimeout(() => {
      isMoving = false;
      movingTimer = null;
      imageVisibleCardIds = new Set(
        cards.filter((card) => isCardInViewport(card)).map((c) => c.id),
      );
    }, 200);
  }

  function handleWheel(e: WheelEvent) {
    cancelNavigationAnimation();
    clearActiveElementFocus();
    e.preventDefault();

    if (!e.ctrlKey) {
      panX -= e.deltaX;
      panY -= e.deltaY;
      markMoving();

      if (hasHydratedCanvasViewState) {
        saveCanvasViewState();
      }

      return;
    }

    const rect = canvasElement.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomDelta = -e.deltaY * 0.001;
    const newZoom = Math.max(0.1, Math.min(3, zoom + zoomDelta));

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
    markMoving();

    if (hasHydratedCanvasViewState) {
      saveCanvasViewState();
    }
  }

  function handleMouseDown(e: MouseEvent) {
    cancelNavigationAnimation();
    clearActiveElementFocus();
    if (e.button !== 0) return;

    hasDragged = false;
    mouseDownX = e.clientX;
    mouseDownY = e.clientY;
    isPanning = true;
    startX = e.clientX - panX;
    startY = e.clientY - panY;
    canvasElement.style.cursor = "grabbing";
  }

  function handleMouseMove(e: MouseEvent) {
    if (!isPanning) return;

    if (Math.abs(e.clientX - mouseDownX) > 4 || Math.abs(e.clientY - mouseDownY) > 4) {
      hasDragged = true;
    }

    panX = e.clientX - startX;
    panY = e.clientY - startY;
    markMoving();
  }

  function handleMouseUp(e: MouseEvent) {
    const wasDrag = hasDragged;
    isPanning = false;
    hasDragged = false;
    canvasElement.style.cursor = "grab";

    if (!wasDrag) {
      const element = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
      if (!element?.closest('button, a, input, select, textarea, [role="button"]')) {
        const cardElement = element?.closest("[data-card-id]") as HTMLElement | null;
        if (cardElement?.dataset.cardId) {
          navigateToCard(cardElement.dataset.cardId);
        }
      }
    }

    if (hasHydratedCanvasViewState) {
      saveCanvasViewState();
    }
  }

  function handleMouseLeave() {
    isPanning = false;
    hasDragged = false;
    canvasElement.style.cursor = "grab";

    if (hasHydratedCanvasViewState) {
      saveCanvasViewState();
    }
  }

  function handleTouchStart(e: TouchEvent) {
    cancelNavigationAnimation();
    clearActiveElementFocus();
    if (e.touches.length === 1) {
      touchHasDragged = false;
      isPanning = true;
      const touch = e.touches[0];
      touchStartClientX = touch.clientX;
      touchStartClientY = touch.clientY;
      startX = touch.clientX - panX;
      startY = touch.clientY - panY;
    } else if (e.touches.length === 2) {
      isPanning = false;
      touchWasPinch = true;
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
      const touch = e.touches[0];
      if (Math.abs(touch.clientX - touchStartClientX) > 6 || Math.abs(touch.clientY - touchStartClientY) > 6) {
        touchHasDragged = true;
      }
      panX = touch.clientX - startX;
      panY = touch.clientY - startY;
    } else if (e.touches.length === 2) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];

      const dx = touch2.clientX - touch1.clientX;
      const dy = touch2.clientY - touch1.clientY;
      const currentDistance = Math.sqrt(dx * dx + dy * dy);
      const smoothedDistance =
        lastTouchDistance > 0
          ? lastTouchDistance * 0.7 + currentDistance * 0.3
          : currentDistance;

      const rect = canvasElement.getBoundingClientRect();
      const centerX = ((touch1.clientX + touch2.clientX) / 2) - rect.left;
      const centerY = ((touch1.clientY + touch2.clientY) / 2) - rect.top;

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
    markMoving();
  }

  function handleTouchEnd(e: TouchEvent) {
    if (e.touches.length === 0) {
      if (!touchHasDragged && !touchWasPinch) {
        const changedTouch = e.changedTouches[0];
        const element = document.elementFromPoint(changedTouch.clientX, changedTouch.clientY) as HTMLElement | null;
        if (!element?.closest('button, a, input, select, textarea, [role="button"]')) {
          const cardElement = element?.closest("[data-card-id]") as HTMLElement | null;
          if (cardElement?.dataset.cardId) {
            navigateToCard(cardElement.dataset.cardId);
          }
        }
      }
      isPanning = false;
      touchStartDistance = 0;
      touchStartZoom = 0;
      touchHasDragged = false;
      touchWasPinch = false;
    } else if (e.touches.length === 1) {
      isPanning = true;
      const touch = e.touches[0];
      startX = touch.clientX - panX;
      startY = touch.clientY - panY;
      touchStartClientX = touch.clientX;
      touchStartClientY = touch.clientY;
      touchStartDistance = 0;
      touchHasDragged = false;
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

  function navigateToOverview() {
    if (!canvasElement || cards.length === 0) return;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    for (const card of cards) {
      const cardHeight = cardHeights[card.id] || 600;
      minX = Math.min(minX, card.x);
      minY = Math.min(minY, card.y);
      maxX = Math.max(maxX, card.x + card.width);
      maxY = Math.max(maxY, card.y + cardHeight);
    }

    const PAD = 80;
    const rect = canvasElement.getBoundingClientRect();
    const newZoom = Math.max(0.05, Math.min(
      0.4,
      (rect.width - PAD * 2) / (maxX - minX),
      (rect.height - PAD * 2) / (maxY - minY),
    ));

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    targetPanX = rect.width / 2 - centerX * newZoom;
    targetPanY = rect.height * 0.57 - centerY * newZoom;
    targetZoom = newZoom;

    if (animationFrame === null) {
      animationFrame = requestAnimationFrame(animateToTarget);
    }
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

  function resolveConnectionPoint(
    cardId: string | undefined,
    side: "top" | "bottom" | "left" | "right",
    literalPoint: { x: number; y: number } | undefined,
  ): { x: number; y: number } {
    if (literalPoint) return literalPoint;
    if (cardId) return getCardEdgePoint(cardId, side);
    return { x: 0, y: 0 };
  }

  function resolveWaypointPoint(
    waypoint: Waypoint,
    connection: Connection,
  ): { x: number; y: number } {
    const anchorPoint =
      waypoint.relativeTo === "from"
        ? resolveConnectionPoint(connection.from, connection.fromSide, connection.fromPoint)
        : resolveConnectionPoint(connection.to, connection.toSide, connection.toPoint);

    return {
      x: anchorPoint.x + waypoint.offsetX,
      y: anchorPoint.y + waypoint.offsetY,
    };
  }

  function getArrowPoints(
    connection: Connection,
  ): Array<{ x: number; y: number }> {
    const start = resolveConnectionPoint(connection.from, connection.fromSide, connection.fromPoint);
    const end = resolveConnectionPoint(connection.to, connection.toSide, connection.toPoint);

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

    const easeSpeed = 0.1;
    const threshold = 0.5;

    const panXDiff = targetPanX - panX;
    const panYDiff = targetPanY - panY;
    const zoomDiff = targetZoom - zoom;

    if (
      Math.abs(panXDiff) < threshold &&
      Math.abs(panYDiff) < threshold &&
      Math.abs(zoomDiff) < 0.01
    ) {
      panX = targetPanX;
      panY = targetPanY;
      zoom = targetZoom;
      targetPanX = null;
      targetPanY = null;
      targetZoom = null;
      animationFrame = null;
      return;
    }

    panX += panXDiff * easeSpeed;
    panY += panYDiff * easeSpeed;
    zoom += zoomDiff * easeSpeed;

    markMoving();
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
    topFactor: number;
    primaryFrame: {
      x: number;
      y: number;
      width: number;
      height: number;
      centerMode: "top" | "middle";
    };
  } | null {
    const frameCardIds = getNavigationFrameCardIds(cardId);
    const frameCards = frameCardIds
      .map((id) => cards.find((card) => card.id === id))
      .filter((c): c is CardDefinition => c !== undefined);
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
    const primaryCardElement = canvasContentElement?.querySelector(
      `[data-card-id="${primaryCard?.id}"]`,
    ) as HTMLElement | null;
    const primaryCardHeight = primaryCardElement?.offsetHeight || 300;

    return {
      x: bounds.minX,
      y: bounds.minY,
      width: bounds.maxX - bounds.minX,
      height: bounds.maxY - bounds.minY,
      centerMode: hasCompanionImage
        ? "middle"
        : (frameCards[0]?.initialCenterMode || "top"),
      fitToFrame: primaryCard?.navigationFitToFrame ?? false,
      maxZoom: primaryCard?.navigationMaxZoom ?? 0.6,
      topFactor: primaryCard?.navigationTopFactor ?? 0.22,
      primaryFrame: {
        x: primaryCard?.x ?? 0,
        y: primaryCard?.y ?? 0,
        width: primaryCard?.width ?? 0,
        height: primaryCardHeight,
        centerMode: primaryCard?.initialCenterMode ?? "top",
      },
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
      topFactor: number;
      primaryFrame?: {
        x: number;
        y: number;
        width: number;
        height: number;
        centerMode: "top" | "middle";
      };
    },
    viewportWidth: number,
    viewportHeight: number,
  ): { panX: number; panY: number; zoom: number } {
    const isPhoneViewport = viewportWidth <= 640;
    const isTabletViewport = viewportWidth > 640 && viewportWidth <= 1100;
    const isCompanionFrame = frame.centerMode === "middle";
    const shouldAutoFit =
      frame.fitToFrame ||
      isPhoneViewport ||
      (isTabletViewport && isCompanionFrame);

    const HORIZONTAL_MARGIN = 64;
    const TOP_SAFE_AREA = 86;
    const BOTTOM_SAFE_AREA = 110;
    const widthFitZoom = (viewportWidth - HORIZONTAL_MARGIN * 2) / Math.max(frame.width, 1);
    const heightFitZoom = (viewportHeight - TOP_SAFE_AREA - BOTTOM_SAFE_AREA) / Math.max(frame.height, 1);
    const frameFitZoom = Math.min(widthFitZoom, heightFitZoom);
    const centerYBaseline = isPhoneViewport ? 0.47 : 0.52;

    const resolvedZoom = shouldAutoFit
      ? Math.max(0.15, Math.min(frame.maxZoom, frameFitZoom))
      : frame.maxZoom;

    const frameCenterX = frame.x + frame.width / 2;

    const panX = viewportWidth / 2 - frameCenterX * resolvedZoom;

    const usePrimaryTopAnchor =
      frame.centerMode === "middle" &&
      frame.primaryFrame &&
      frame.primaryFrame.centerMode === "top";

    const panY =
      frame.centerMode === "middle" && frame.primaryFrame
        ? usePrimaryTopAnchor
          ? viewportHeight * frame.topFactor - frame.primaryFrame.y * resolvedZoom
          : viewportHeight * centerYBaseline - (frame.primaryFrame.y + frame.primaryFrame.height / 2) * resolvedZoom
        : viewportHeight * frame.topFactor - frame.y * resolvedZoom;

    const frameTopPos = panY + frame.y * resolvedZoom;
    const frameBottomPos = panY + (frame.y + frame.height) * resolvedZoom;

    if (frameBottomPos > viewportHeight - 22) {
      return {
        panX,
        panY: panY - (frameBottomPos - (viewportHeight - 22)),
        zoom: resolvedZoom,
      };
    }

    if (frameTopPos < 22) {
      return {
        panX,
        panY: panY + (22 - frameTopPos),
        zoom: resolvedZoom,
      };
    }

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

  function handleBeforePrint() {
    if (!canvasContentElement) return;
    const allCards = resolvedCardDefinitions;
    if (allCards.length === 0) return;

    const minX = Math.min(...allCards.map((c) => c.x));
    const minY = Math.min(...allCards.map((c) => c.y));
    const padding = 40;
    const translateX = -minX + padding;
    const translateY = -minY + padding;

    canvasContentElement.style.setProperty(
      "transform",
      `translate(${translateX}px, ${translateY}px)`,
      "important",
    );
  }

  function handleAfterPrint() {
    if (!canvasContentElement) return;
    canvasContentElement.style.removeProperty("transform");
  }

  onMount(async () => {
    prefersMobileSafeRendering = detectMobileSafeRenderingMode();

    isFullscreen = startFullscreen;
    applyFullscreenUiState(isFullscreen);

    if (isFullscreen) {
      syncFullscreenUrl(true, "push");
    }

    await tick();
    cardsMounted = true;

    const cardElements = canvasContentElement?.querySelectorAll("[data-card-id]");
    if (cardElements && cardElements.length > 0) {
      cardResizeObserver = new ResizeObserver((entries) => {
        entries.forEach((entry) => {
          const element = entry.target as HTMLElement;
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
    window.addEventListener("beforeprint", handleBeforePrint);
    window.addEventListener("afterprint", handleAfterPrint);
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
    window.removeEventListener("beforeprint", handleBeforePrint);
    window.removeEventListener("afterprint", handleAfterPrint);
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
    class:moving={isMoving}
    bind:this={canvasElement}
    on:wheel={handleWheel}
    on:mousedown={handleMouseDown}
    on:mousemove={handleMouseMove}
    on:mouseup={handleMouseUp}
    on:mouseleave={handleMouseLeave}
    on:touchstart={handleTouchStart}
    on:touchmove={handleTouchMove}
    on:touchend={handleTouchEnd}
    on:touchcancel={handleTouchEnd}
    role="application"
    tabindex="0"
    aria-label="Infinite canvas with content cards"
  >
    <div
      class="dot-grid"
      class:safe-transform={useSafe2DTransform}
      style="transform: {contentTransform}"
    ></div>

    <div
      bind:this={canvasContentElement}
      class="canvas-content"
      class:safe-transform={useSafe2DTransform}
      style="transform: {contentTransform}"
    >
      {#each actBands as band (band.id)}
        <div
          class="act-band"
          style="left:{band.x}px;top:{band.y}px;width:{band.width}px;height:{band.height}px;background:{band.color};"
          aria-hidden="true"
        >
          <div class="act-band__label">
            <span class="act-band__number">{band.label}</span>
            <span class="act-band__description">{band.description}</span>
          </div>
        </div>
      {/each}

      <svg class="arrows-layer">
        {#if arrowData}
          {#each arrowData as {connection, points}}
            <CanvasArrow
              {points}
              dashed={connection.dashed ?? false}
              fromSide={connection.fromSide}
              toSide={connection.toSide}
              color={connection.color}
              opacity={connection.opacity}
              gradient={connection.gradient}
              straight={connection.straight ?? false}
            />
          {/each}
        {/if}

        {#each pentagonUnitFrames as frame (frame.eaKey)}
          {@const b = frame.box}
          {@const c = 36}
          <g class="unit-bracket" style="color:{EA_AREAS[frame.eaKey].base}">
            <path d="M {b.x} {b.y + c} L {b.x} {b.y} L {b.x + c} {b.y}" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" />
            <path d="M {b.x + b.width - c} {b.y} L {b.x + b.width} {b.y} L {b.x + b.width} {b.y + c}" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" />
            <path d="M {b.x + b.width} {b.y + b.height - c} L {b.x + b.width} {b.y + b.height} L {b.x + b.width - c} {b.y + b.height}" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" />
            <path d="M {b.x + c} {b.y + b.height} L {b.x} {b.y + b.height} L {b.x} {b.y + b.height - c}" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" />
          </g>
        {/each}
      </svg>

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
          columns={card.columns}
          paddingY={card.paddingY}
          imagesVisible={imageVisibleCardIds.has(card.id)}
          on:openLightbox={openLightbox}
          on:navigateTo={(e) => {
            citationReturnCardId = e.detail.sourceCardId;
            navigateToCard(e.detail.cardId);
          }}
        />
      {/each}
    </div>

    {#if isPreview && !isFullscreen}
      <CanvasEnlargeButton onClick={toggleFullscreen} />
    {/if}

    {#if isFullscreen}
      {@const _ctxAct = actForCard(currentNavigationCardId)}
      {@const _ctxEA  = eaForCard(currentNavigationCardId)}
      <div
        class="context-bar"
        style="--ctx-accent:{_ctxEA?.base ?? 'rgba(255,255,255,0.22)'}"
        aria-hidden="true"
      >
        {#if _ctxAct}
          <span class="ctx-act">{_ctxAct.label}</span>
          <span class="ctx-divider">·</span>
          <span class="ctx-desc">{_ctxAct.description}</span>
        {:else}
          <span class="ctx-act">Portfolio</span>
        {/if}
        {#if _ctxEA}
          <span class="ctx-divider">·</span>
          <span class="ctx-ea" style="color:{_ctxEA.base}">{_ctxEA.label}</span>
        {/if}
      </div>

      <CanvasTopActions
        {isCanvasDarkMode}
        onToggleWordCount={toggleWordCountOverlay}
        onToggleDarkMode={toggleDarkMode}
        onClose={toggleFullscreen}
        onViewOverview={navigateToOverview}
      />

      {#if showWordCountOverlay}
        <CanvasWordCountOverlay
          {nonCaptionNonTitleWordTotal}
          {wordCountStats}
        />
      {/if}
    {/if}

    <CanvasSequentialNav
      canNavigatePrevious={canNavigatePrevious || citationReturnCardId !== null}
      {canNavigateNext}
      onPrevious={() => {
        if (citationReturnCardId) {
          const target = citationReturnCardId;
          citationReturnCardId = null;
          navigateToCard(target);
        } else {
          navigateToAdjacentCard(-1);
        }
      }}
      onNext={() => {
        citationReturnCardId = null;
        navigateToAdjacentCard(1);
      }}
    />

    <CanvasNavigation
      cards={navigationCards}
      onNavigate={navigateToCard}
      {isFullscreen}
    />

    <div class="canvas-zoom-hint" aria-hidden="true">ctrl+scroll to zoom</div>
  </div>

  {#if lightboxImage}
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div
      class="lightbox-overlay"
      tabindex="0"
      role="button"
      on:click={closeLightbox}
      on:keydown={(e) => e.key === "Escape" && closeLightbox()}
    >
      <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
      <!-- svelte-ignore a11y-click-events-have-key-events -->
      <div class="lightbox-inner" on:click|stopPropagation>
        <button class="lightbox-close" on:click={closeLightbox} aria-label="Close image">×</button>
        <img src={lightboxImage.src} alt={lightboxImage.alt} class="lightbox-img" draggable="false" />
        {#if lightboxImage.caption}
          <p class="lightbox-caption">{lightboxImage.caption}</p>
        {/if}
      </div>
    </div>
  {/if}
</div>

<svelte:window on:keydown={(e) => e.key === "Escape" && closeLightbox()} />

<style>
  .canvas-wrapper {
    position: relative;
    width: 100%;
    margin-bottom: 2.5rem;
  }

  .lightbox-overlay {
    position: fixed;
    inset: 0;
    z-index: 2000;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.77);
    -webkit-backdrop-filter: blur(12px);
    backdrop-filter: blur(12px);
    cursor: zoom-out;
    animation: lightbox-fade-in 0.18s ease;
  }

  @keyframes lightbox-fade-in {
    from { opacity: 0; }
    to   { opacity: 1; }
  }

  .lightbox-inner {
    position: relative;
    max-width: min(90vw, 1200px);
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    cursor: default;
  }

  .lightbox-img {
    display: block;
    max-width: 100%;
    max-height: 80vh;
    object-fit: contain;
    border-radius: 10px;
    box-shadow: 0 24px 64px rgba(0, 0, 0, 0.6);
  }

  .lightbox-caption {
    margin: 0.75rem 0 0 0;
    font-size: 0.9rem;
    color: rgba(255, 255, 255, 0.7);
    text-align: center;
    max-width: 640px;
    line-height: 1.5;
  }

  .lightbox-close {
    position: absolute;
    top: -2.5rem;
    right: 0;
    background: rgba(255, 255, 255, 0.12);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: #fff;
    font-size: 1.5rem;
    line-height: 1;
    width: 2rem;
    height: 2rem;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.15s ease;
  }

  .lightbox-close:hover {
    background: rgba(255, 255, 255, 0.22);
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
    height: 70vh;
    overflow: hidden;
    cursor: grab;
    background: var(--secondary-background-color);
    border-radius: 9px;
    user-select: none;
    backface-visibility: hidden;
    transform: translateZ(0);
  }

  .infinite-canvas.preview {
    min-height: 70vh;
  }

  .canvas-wrapper.fullscreen .infinite-canvas {
    border-radius: 0;
    height: 100vh;
    height: 100dvh;
  }

  .canvas-zoom-hint {
    position: absolute;
    left: 1rem;
    bottom: 0.8rem;
    z-index: 4;
    color: var(--primary-text-color);
    font-size: 0.72rem;
    line-height: 1;
    letter-spacing: 0;
    pointer-events: none;
    user-select: none;
    background: var(--background-color);
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

  .unit-bracket {
    pointer-events: none;
    opacity: 0.85;
  }

  .context-bar {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 44px;
    z-index: 5;
    display: flex;
    align-items: center;
    padding: 0 1.5rem 0 1.75rem;
    gap: 0.7rem;
    background: rgba(0, 0, 0, 0.42);
    -webkit-backdrop-filter: blur(14px);
    backdrop-filter: blur(14px);
    border-bottom: 1px solid rgba(255, 255, 255, 0.07);
    pointer-events: none;
  }

  .context-bar::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 3px;
    background: var(--ctx-accent);
    transition: background 0.5s ease;
  }

  .ctx-act {
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.75);
  }

  .ctx-divider {
    font-size: 0.72rem;
    color: rgba(255, 255, 255, 0.2);
    user-select: none;
  }

  .ctx-desc {
    font-size: 0.72rem;
    letter-spacing: 0.07em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.38);
  }

  .ctx-ea {
    font-size: 0.72rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    transition: color 0.5s ease;
  }

  .act-band {
    position: absolute;
    border-radius: 20px;
    pointer-events: none;
    z-index: 0;
    border-right: 1px solid rgba(255, 255, 255, 0.06);
  }

  .act-band__label {
    position: absolute;
    top: 2.5rem;
    left: 2.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    opacity: 0.55;
  }

  .act-band__number {
    font-size: 5rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--primary-text-color);
  }

  .act-band__description {
    font-size: 3rem;
    letter-spacing: 0.09em;
    text-transform: uppercase;
    color: var(--muted-color);
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

  .infinite-canvas :global(.canvas-card) {
    cursor: pointer;
  }

  .infinite-canvas:active :global(.canvas-card) {
    cursor: grabbing;
  }

  .infinite-canvas.moving :global(.canvas-card) {
    backdrop-filter: none !important;
    -webkit-backdrop-filter: none !important;
    transition: none !important;
  }

  .infinite-canvas.moving :global(img) {
    image-rendering: pixelated;
  }

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

    .dot-grid {
      display: none;
    }

    :global(.canvas-action-button),
    :global(.canvas-navigation),
    .canvas-zoom-hint {
      display: none !important;
    }
  }
</style>
