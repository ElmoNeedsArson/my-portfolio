<script lang="ts">
  import { onMount, onDestroy, tick } from "svelte";
  import CanvasCard from "./CanvasCard.svelte";
  import CanvasArrow from "./CanvasArrow.svelte";
  import CanvasNavigation from "./CanvasNavigation.svelte";
  import CanvasEnlargeButton from "./controls/CanvasEnlargeButton.svelte";
  import CanvasTopActions from "./controls/CanvasTopActions.svelte";
  import CanvasWordCountOverlay from "./controls/CanvasWordCountOverlay.svelte";
  import CanvasSequentialNav from "./controls/CanvasSequentialNav.svelte";
  import { connections } from "./canvasConnections";
  import {
    adjustPanForZoomAtPoint,
    computeWordCountStats,
    getCountedWords,
    getNavigationTarget,
    resolveCardDefinitions,
  } from "./infiniteCanvasUtils";
  import type {
    CardDefinition,
    CardDefinitionInput,
    Connection,
    Waypoint,
  } from "./infiniteCanvasTypes";

  export let isPreview = true;
  export let startFullscreen = false;

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
  let currentCardIndex = 0;

  const cardModules = import.meta.glob("./canvasCards/*.json", {
    eager: true,
    import: "default",
  }) as Record<string, CardDefinitionInput>;

  const cardDefinitionsInput: CardDefinitionInput[] = Object.entries(cardModules)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, card]) => card);


  let resolvedCardDefinitions: CardDefinition[] = [];

  $: cardLayoutVersion,
    (resolvedCardDefinitions = resolveCardDefinitions(
      cardDefinitionsInput,
      cardHeights,
    ));

  // Compute final card positions
  $: cards = resolvedCardDefinitions;

  $: canNavigatePrevious = currentCardIndex > 0;
  $: canNavigateNext = currentCardIndex < cards.length - 1;

  function logTitleWordBreakdown() {
    const titleBreakdown = cards.map((card) => {
      const words = getCountedWords(card.title);
      return {
        title: card.title,
        count: words.length,
        words,
      };
    });

    const total = titleBreakdown.reduce((sum, item) => sum + item.count, 0);

    console.groupCollapsed("Canvas title word count breakdown");
    titleBreakdown.forEach((item) => {
      console.log(`[${item.count}] ${item.title}:`, item.words);
    });
    console.log("Total title words:", total);
    console.groupEnd();
  }

  $: wordCountStats = computeWordCountStats(cards);

  $: nonCaptionNonTitleWordTotal = wordCountStats.contentWords;

  // Reactive arrow points - recalculate when cards are mounted and card layout changes
  $: cardLayoutVersion,
    (arrowData = cardsMounted
      ? connections.map((connection) => ({
          connection,
          points: getArrowPoints(connection),
        }))
      : []);

  function scheduleLayoutRecalculation() {
    if (layoutUpdateFrame !== null) {
      cancelAnimationFrame(layoutUpdateFrame);
    }

    layoutUpdateFrame = requestAnimationFrame(() => {
      cardLayoutVersion += 1;
      layoutUpdateFrame = null;
    });
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

    console.log("Pan start:", { startX, startY });
  }

  function handleMouseMove(e: MouseEvent) {
    if (!isPanning) return;

    panX = e.clientX - startX;
    panY = e.clientY - startY;

    console.log("Panning:", { panX, panY });
  }

  function handleMouseUp() {
    isPanning = false;
    canvasElement.style.cursor = "grab";
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
      
      // Calculate zoom center (midpoint between fingers)
      const rect = canvasElement.getBoundingClientRect();
      const centerX = ((touch1.clientX + touch2.clientX) / 2) - rect.left;
      const centerY = ((touch1.clientY + touch2.clientY) / 2) - rect.top;
      
      // Calculate new zoom based on distance change
      const scale = currentDistance / touchStartDistance;
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
      lastTouchDistance = currentDistance;
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
  }

  function syncFullscreenUrl(fullscreen: boolean) {
    const url = new URL(window.location.href);

    if (fullscreen) {
      url.searchParams.set("canvas", "fullscreen");
    } else if (url.searchParams.get("canvas") === "fullscreen") {
      url.searchParams.delete("canvas");
    }

    const nextUrl = `${url.pathname}${url.search}${url.hash}`;
    window.history.replaceState(window.history.state, "", nextUrl);
  }

  function clearActiveElementFocus() {
    const activeElement = document.activeElement as HTMLElement | null;
    if (activeElement && activeElement !== document.body) {
      activeElement.blur();
    }
  }

  async function toggleFullscreen() {
    isFullscreen = !isFullscreen;
    syncFullscreenUrl(isFullscreen);

    // Hide body scrollbar when fullscreen
    if (isFullscreen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      showWordCountOverlay = false;
    }

    if (animationFrame !== null) {
      cancelAnimationFrame(animationFrame);
      animationFrame = null;
    }
    targetPanX = null;
    targetPanY = null;
    targetZoom = null;

    await tick();

    const currentCardId = cards[currentCardIndex]?.id || "intro-overview";
    centerOnCardInstant(currentCardId);
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

  function navigateToCard(cardId: string) {
    const card = cards.find((c) => c.id === cardId);
    if (!card || !canvasElement) return;

    const cardIndex = cards.findIndex((c) => c.id === cardId);
    if (cardIndex >= 0) {
      currentCardIndex = cardIndex;
    }

    const rect = canvasElement.getBoundingClientRect();
    const cardElement = canvasContentElement?.querySelector(
      `[data-card-id="${cardId}"]`,
    ) as HTMLElement | null;

    const actualHeight = cardElement?.offsetHeight || 300;
    const target = getNavigationTarget({
      card,
      cardHeight: actualHeight,
      viewportWidth: rect.width,
      viewportHeight: rect.height,
    });

    targetPanX = target.panX;
    targetPanY = target.panY;
    targetZoom = target.zoom;

    // Start animation if not already running
    if (animationFrame === null) {
      animationFrame = requestAnimationFrame(animateToTarget);
    }
  }

  function navigateToAdjacentCard(direction: -1 | 1) {
    const nextIndex = currentCardIndex + direction;
    if (nextIndex < 0 || nextIndex >= cards.length) return;

    navigateToCard(cards[nextIndex].id);
  }

  function centerOnCardInstant(cardId: string) {
    const card = cards.find((c) => c.id === cardId);
    if (!card || !canvasElement) return;

    const cardIndex = cards.findIndex((c) => c.id === cardId);
    if (cardIndex >= 0) {
      currentCardIndex = cardIndex;
    }

    const rect = canvasElement.getBoundingClientRect();
    const cardElement = canvasContentElement?.querySelector(
      `[data-card-id="${cardId}"]`,
    ) as HTMLElement | null;
    const actualHeight = cardElement?.offsetHeight || 300;
    const target = getNavigationTarget({
      card,
      cardHeight: actualHeight,
      viewportWidth: rect.width,
      viewportHeight: rect.height,
    });

    zoom = target.zoom;
    panX = target.panX;
    panY = target.panY;
  }

  onMount(async () => {
    logTitleWordBreakdown();

    if (startFullscreen) {
      isFullscreen = true;
      document.body.style.overflow = "hidden";
      syncFullscreenUrl(true);
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

    window.addEventListener("resize", scheduleLayoutRecalculation);
    scheduleLayoutRecalculation();

    await tick();

    centerOnCardInstant("intro-overview");
  });

  onDestroy(() => {
    if (animationFrame !== null) {
      cancelAnimationFrame(animationFrame);
    }

    if (layoutUpdateFrame !== null) {
      cancelAnimationFrame(layoutUpdateFrame);
    }

    cardResizeObserver?.disconnect();
    window.removeEventListener("resize", scheduleLayoutRecalculation);
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
      style="transform: translate({panX}px, {panY}px) scale({zoom})"
    ></div>

    <!-- Canvas content with transformation -->
    <div
      bind:this={canvasContentElement}
      class="canvas-content"
      style="transform: translate({panX}px, {panY}px) scale({zoom})"
    >
      <!-- Arrows (rendered first so they appear below cards) -->
      <svg class="arrows-layer">
        {#if arrowData}
          {#each arrowData as {points}}
            <CanvasArrow {points} />
          {/each}
        {/if}
      </svg>

      <!-- Cards -->
      {#each cards as card (card.id)}
        <CanvasCard
          cardId={card.id}
          x={card.x}
          y={card.y}
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
    <CanvasNavigation {cards} onNavigate={navigateToCard} {isFullscreen} />
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
    width: 20000px;
    height: 20000px;
    background-image: radial-gradient(
      circle,
      var(--muted-color) 2px,
      transparent 1.5px
    );
    background-size: 40px 40px;
    background-position: 0 0;
    transform-origin: 10000px 10000px;
    pointer-events: none;
  }

  .canvas-content {
    position: absolute;
    top: 0;
    left: 0;
    transform-origin: 0 0;
    width: 100%;
    height: 100%;
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
