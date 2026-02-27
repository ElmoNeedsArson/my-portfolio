<script lang="ts">
  import { onMount, onDestroy, tick } from "svelte";
  import CanvasCard from "./CanvasCard.svelte";
  import CanvasArrow from "./CanvasArrow.svelte";
  import CanvasNavigation from "./CanvasNavigation.svelte";
  import {
    X,
    Maximize2,
    Moon,
    Sun,
    FileText,
    ArrowLeft,
    ArrowRight,
  } from "@lucide/svelte";

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

  type CardSection = {
    type: "content" | "images";
    content?: string;
    images?: Array<{ src: string; alt: string }>;
    caption?: string;
    cols?: number;
  };

  type CardDefinition = {
    id: string;
    title: string;
    x: number;
    y: number;
    width: number;
    color: string;
    sections: CardSection[];
    hideHeader?: boolean;
    contentAlign?: "left" | "center";
    introTitle?: string;
    introSubtitle?: string;
    introLarge?: boolean;
    initialCenterMode?: "top" | "middle";
  };

  type CardDefinitionInput = Omit<CardDefinition, "x" | "y"> & {
    x?: number;
    y?: number;
    offsetX?: number | string;
    offsetY?: number | string;
    relativeToCardId?: string;
  };

  type Waypoint = {
    relativeTo: "from" | "to";
    offsetX: number;
    offsetY: number;
  };

  type Connection = {
    from: string;
    fromSide: "top" | "bottom" | "left" | "right";
    to: string;
    toSide: "top" | "bottom" | "left" | "right";
    waypoints?: Waypoint[];
  };

  const cardModules = import.meta.glob("./canvasCards/*.json", {
    eager: true,
    import: "default",
  }) as Record<string, CardDefinitionInput>;

  const cardDefinitionsInput: CardDefinitionInput[] = Object.entries(cardModules)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, card]) => card);

  function resolveOffsetValue(
    rawOffset: number | string | undefined,
    card: CardDefinitionInput,
    cardHeight: number,
    anchorCard: CardDefinition | null,
    anchorCardHeight: number,
  ): number {
    if (typeof rawOffset === "number") {
      return rawOffset;
    }

    if (typeof rawOffset !== "string") {
      return 0;
    }

    const normalizedOffset = rawOffset
      .trim()
      .toLowerCase()
      .replace(/,/g, ".")
      .replace(/\s+/g, "");

    const terms = normalizedOffset.match(/[+-]?[^+-]+/g);

    if (terms) {
      let total = 0;

      for (const term of terms) {
        const match = term.match(/^([+-]?\d*\.?\d+)(ch|cw|ph|pw)?$/);

        if (!match) {
          const parsedNumber = Number(normalizedOffset);
          return Number.isNaN(parsedNumber) ? 0 : parsedNumber;
        }

        const factor = Number(match[1]);
        const unit = match[2];

        if (Number.isNaN(factor)) {
          return 0;
        }

        if (!unit) {
          total += factor;
          continue;
        }

        if (unit === "ch") {
          total += factor * cardHeight;
          continue;
        }

        if (unit === "cw") {
          total += factor * card.width;
          continue;
        }

        if (unit === "ph") {
          total += factor * anchorCardHeight;
          continue;
        }

        total += factor * (anchorCard?.width ?? 0);
      }

      return total;
    }

    const parsedNumber = Number(normalizedOffset);
    return Number.isNaN(parsedNumber) ? 0 : parsedNumber;
  }

  function resolveCardDefinitions(
    definitions: CardDefinitionInput[],
    measuredHeights: Record<string, number>,
  ): CardDefinition[] {
    return definitions.reduce<CardDefinition[]>((resolvedCards, card) => {
      let anchorCard: CardDefinition | null = null;
      let baseX = 0;
      let baseY = 0;
      const cardHeight = measuredHeights[card.id] ?? 300;
      let anchorCardHeight = 300;

      if (card.relativeToCardId) {
        anchorCard =
          resolvedCards.find((resolved) => resolved.id === card.relativeToCardId) ??
          null;
      } else if (resolvedCards.length > 0) {
        anchorCard = resolvedCards[resolvedCards.length - 1];
      }

      if (anchorCard) {
        baseX = anchorCard.x;
        baseY = anchorCard.y;
        anchorCardHeight = measuredHeights[anchorCard.id] ?? 300;
      }

      let resolvedX = baseX + resolveOffsetValue(
        card.offsetX,
        card,
        cardHeight,
        anchorCard,
        anchorCardHeight,
      );
      if (typeof card.x === "number") {
        resolvedX = card.x;
      }

      let resolvedY = baseY + resolveOffsetValue(
        card.offsetY,
        card,
        cardHeight,
        anchorCard,
        anchorCardHeight,
      );
      if (typeof card.y === "number") {
        resolvedY = card.y;
      }

      const {
        x,
        y,
        offsetX,
        offsetY,
        relativeToCardId,
        ...rest
      } = card;

      resolvedCards.push({
        ...rest,
        x: resolvedX,
        y: resolvedY,
      });

      return resolvedCards;
    }, []);
  }

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

  function getCountedWords(text: string): string[] {
    const cleanedText = text
      .replace(/\*\*/g, " ")
      .replace(/[`#>*_\[\]()\-–—]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (!cleanedText) return [];
    return cleanedText.split(" ").filter(Boolean);
  }

  function countWords(text: string): number {
    return getCountedWords(text).length;
  }

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

  $: wordCountStats = cards.reduce(
    (stats, card) => {
      stats.titleWords += countWords(card.title);

      for (const section of card.sections) {
        if (section.type === "content" && section.content) {
          stats.contentWords += countWords(section.content);
        }
        if (section.caption) {
          stats.captionWords += countWords(section.caption);
          stats.captionCount += 1;
        }
      }
      return stats;
    },
    { titleWords: 0, contentWords: 0, captionWords: 0, captionCount: 0 },
  );

  $: nonCaptionNonTitleWordTotal = wordCountStats.contentWords;

  // Arrow connections - connect cards by their IDs with edge positions and optional waypoints
  const connections: Connection[] = [
    {
      from: "intro-overview",
      fromSide: "right" as const,
      to: "vision",
      toSide: "left" as const,
      waypoints: [],
    },
    {
      from: "vision",
      fromSide: "right" as const,
      to: "professional-identity",
      toSide: "left" as const,
      waypoints: [
        { relativeTo: "from", offsetX: 1250, offsetY: 1212 },
        { relativeTo: "from", offsetX: 1250, offsetY: 511 },
      ],
    },

    {
      from: "professional-identity",
      fromSide: "right" as const,
      to: "future-development",
      toSide: "top" as const,
      waypoints: [
        { relativeTo: "from", offsetX: 1900, offsetY: 511 },
      ],
    },
    // Future Development → Long Term (vertical, same column)
    {
      from: "future-development",
      fromSide: "bottom" as const,
      to: "long-term",
      toSide: "top" as const,
      waypoints: [],
    },

    {
      from: "future-development",
      fromSide: "bottom" as const,
      to: "short-term",
      toSide: "top" as const,
      waypoints: [
        { relativeTo: "from", offsetX: 600, offsetY: 448 },
        { relativeTo: "from", offsetX: -700, offsetY: 448 },
      ],
    },

    {
      from: "future-development",
      fromSide: "bottom" as const,
      to: "beyond-education",
      toSide: "top" as const,
      waypoints: [
        { relativeTo: "from", offsetX: 600, offsetY: 448 },
        { relativeTo: "from", offsetX: 1900, offsetY: 448 },
      ],
    },

    // Long Term → Courses Year 1 (vertical, same column)
    {
      from: "long-term",
      fromSide: "bottom" as const,
      to: "courses-year-1",
      toSide: "top" as const,
      waypoints: [],
    },

    // Courses Year 1 → Year 2 (vertical)
    {
      from: "courses-year-1",
      fromSide: "bottom" as const,
      to: "courses-year-2",
      toSide: "top" as const,
      waypoints: [],
    },
  ];

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

  function handleWheel(e: WheelEvent) {
    e.preventDefault();

    // Get mouse position relative to canvas
    const rect = canvasElement.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Calculate position in canvas coordinates before zoom
    const canvasXBefore = (mouseX - panX) / zoom;
    const canvasYBefore = (mouseY - panY) / zoom;

    // Update zoom with min/max limits
    const zoomDelta = -e.deltaY * 0.001;
    const newZoom = Math.max(0.15, Math.min(3, zoom + zoomDelta));

    // Calculate position in canvas coordinates after zoom
    const canvasXAfter = (mouseX - panX) / newZoom;
    const canvasYAfter = (mouseY - panY) / newZoom;

    // Adjust pan to keep mouse position consistent
    panX += (canvasXAfter - canvasXBefore) * newZoom;
    panY += (canvasYAfter - canvasYBefore) * newZoom;

    zoom = newZoom;
  }

  function handleMouseDown(e: MouseEvent) {
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
      
      // Calculate canvas position before zoom
      const canvasXBefore = (centerX - panX) / zoom;
      const canvasYBefore = (centerY - panY) / zoom;
      
      // Calculate new zoom based on distance change
      const scale = currentDistance / touchStartDistance;
      const newZoom = Math.max(0.15, Math.min(3, touchStartZoom * scale));
      
      // Calculate canvas position after zoom
      const canvasXAfter = (centerX - panX) / newZoom;
      const canvasYAfter = (centerY - panY) / newZoom;
      
      // Adjust pan to keep center position consistent
      panX += (canvasXAfter - canvasXBefore) * newZoom;
      panY += (canvasYAfter - canvasYBefore) * newZoom;
      
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
    const anchorId =
      waypoint.relativeTo === "from" ? connection.from : connection.to;
    const anchorCard = cards.find((card) => card.id === anchorId);

    if (anchorCard) {
      return {
        x: anchorCard.x + waypoint.offsetX,
        y: anchorCard.y + waypoint.offsetY,
      };
    }

    return { x: 0, y: 0 };
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

    // Calculate target position
    const targetZoomLevel = 0.6; // Zoom level to view the card
    const cardCenterX = card.x + card.width / 2;
    const cardTopY = card.y;
    const actualHeight = cardElement?.offsetHeight || 300;
    const cardCenterY = card.y + actualHeight / 2;
    const centerMode = card.initialCenterMode || "top";

    // Center horizontally, and either top-align or middle-align vertically per card config
    targetPanX = rect.width / 2 - cardCenterX * targetZoomLevel;
    targetPanY =
      centerMode === "middle"
        ? rect.height / 2 - cardCenterY * targetZoomLevel
        : rect.height * 0.15 - cardTopY * targetZoomLevel;

    targetZoom = targetZoomLevel;

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
    const targetZoomLevel = 0.6;
    const cardCenterX = card.x + card.width / 2;
    const cardTopY = card.y;
    const cardElement = canvasContentElement?.querySelector(
      `[data-card-id="${cardId}"]`,
    ) as HTMLElement | null;
    const actualHeight = cardElement?.offsetHeight || 300;
    const cardCenterY = card.y + actualHeight / 2;
    const centerMode = card.initialCenterMode || "top";

    zoom = targetZoomLevel;
    panX = rect.width / 2 - cardCenterX * targetZoomLevel;
    panY =
      centerMode === "middle"
        ? rect.height / 2 - cardCenterY * targetZoomLevel
        : rect.height * 0.15 - cardTopY * targetZoomLevel;
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
      <button
        class="canvas-action-button enlarge"
        on:click={toggleFullscreen}
        type="button"
      >
        <Maximize2 size={16} />
        Enlarge
      </button>
    {/if}

    {#if isFullscreen}
      <div class="canvas-top-actions">
        <button
          class="canvas-action-button word-count"
          on:click={toggleWordCountOverlay}
          type="button"
          aria-label="Show canvas word count"
          title="Show canvas word count"
        >
          <FileText size={18} />
          Words
        </button>

        <button
          class="canvas-action-button theme-toggle"
          on:click={toggleDarkMode}
          type="button"
          aria-label="Toggle day and night mode"
          title="Toggle day and night mode"
        >
          {#if isCanvasDarkMode}
            <Sun size={20} />
          {:else}
            <Moon size={20} />
          {/if}
        </button>

        <button
          class="canvas-action-button close"
          on:click={toggleFullscreen}
          type="button"
          aria-label="Close fullscreen canvas"
        >
          <X size={20} />
        </button>
      </div>

      {#if showWordCountOverlay}
        <div class="word-count-overlay" role="status" aria-live="polite">
          <h4>Canvas Word Count</h4>
          <p class="word-count-total">Total (excluding captions and titles): {nonCaptionNonTitleWordTotal}</p>
          <div class="word-count-details">
            <p>Titles: {wordCountStats.titleWords}</p>
            <p>Image captions ({wordCountStats.captionCount}): {wordCountStats.captionWords}</p>
          </div>
        </div>
      {/if}
    {/if}

    <div class="canvas-sequential-nav">
      <button
        class="canvas-action-button canvas-sequential-nav-button"
        on:click={() => navigateToAdjacentCard(-1)}
        on:mousedown|stopPropagation
        on:touchstart|stopPropagation
        type="button"
        aria-label="Go to previous card"
        title="Previous card"
        disabled={!canNavigatePrevious}
      >
        <ArrowLeft size={22} strokeWidth={2.8} />
      </button>

      <button
        class="canvas-action-button canvas-sequential-nav-button"
        on:click={() => navigateToAdjacentCard(1)}
        on:mousedown|stopPropagation
        on:touchstart|stopPropagation
        type="button"
        aria-label="Go to next card"
        title="Next card"
        disabled={!canNavigateNext}
      >
        <ArrowRight size={22} strokeWidth={2.8} />
      </button>
    </div>

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

  .canvas-action-button {
    z-index: 10;
    padding: 0.5rem 1rem;
    border-radius: 999px;
    border: 1px solid var(--border-color);
    background: var(--hover-color);
    backdrop-filter: blur(10px);
    color: var(--primary-text-color);
    font-size: 0.85rem;
    letter-spacing: 0.4px;
    text-transform: uppercase;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .canvas-action-button:hover {
    background: var(--secondary-background-color);
    border-color: var(--secondary-text-color);
  }

  .canvas-action-button.enlarge {
    position: absolute;
    top: 1.25rem;
    right: 1.25rem;
    animation: enlargePulse 1.8s ease-in-out infinite;
  }

  .canvas-action-button.close {
    padding: 0.5rem;
  }

  .canvas-action-button.theme-toggle {
    padding: 0.5rem;
    /* right: 10px; */
  }

  .canvas-action-button.word-count {
    padding: 0.5rem 0.75rem;
    /* right:40px; */
  }

  .canvas-top-actions {
    position: absolute;
    top: 1.25rem;
    right: 1.25rem;
    z-index: 10;
    display: flex;
    flex-direction: row;
    gap: 0.5rem;
    align-items: center;
  }

  .canvas-top-actions .canvas-action-button {
    position: static;
    z-index: auto;
  }

  .canvas-sequential-nav {
    position: absolute;
    left: 50%;
    bottom: 1.25rem;
    transform: translateX(-50%);
    z-index: 10;
    display: flex;
    align-items: center;
    gap: 0.85rem;
  }

  .canvas-sequential-nav-button {
    width: 3rem;
    height: 3rem;
    padding: 0;
    border-radius: 50%;
    justify-content: center;
    box-shadow: 0 10px 28px color-mix(in srgb, var(--canvas-card-shadow) 85%, transparent);
    border: 1px solid var(--border-color);
    background: var(--secondary-background-color);
    backdrop-filter: blur(10px);
    transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.2s ease, background 0.2s ease;
  }

  .canvas-sequential-nav-button:hover {
    transform: translateY(-1px) scale(1.03);
    box-shadow: 0 14px 34px color-mix(in srgb, var(--canvas-card-shadow) 95%, transparent);
  }

  .canvas-sequential-nav-button:disabled {
    opacity: 0.45;
    cursor: not-allowed;
    border-color: var(--border-color);
    box-shadow: none;
    transform: none;
  }

  .canvas-sequential-nav-button:disabled:hover {
    background: var(--hover-color);
    border-color: var(--border-color);
  }

  .word-count-overlay {
    position: absolute;
    top: 5rem;
    right: 3rem;
    z-index: 1001;
    min-width: 260px;
    padding: 0.85rem 1rem;
    border-radius: 10px;
    border: 1px solid var(--border-color);
    background: var(--background-color);
    color: var(--primary-text-color);
    box-shadow: 0 14px 36px rgba(0, 0, 0, 0.3);
  }

  .word-count-overlay h4 {
    margin: 0 0 0.6rem 0;
    font-size: 0.9rem;
    letter-spacing: 0.02em;
  }

  .word-count-overlay p {
    margin: 0.35rem 0;
    font-size: 0.88rem;
    line-height: 1.35;
  }

  .word-count-total {
    display: inline-block;
    border-bottom: 1px solid color-mix(in srgb, var(--muted-color) 35%, transparent);
    padding-bottom: 0.45rem;
    margin-bottom: 0.35rem;
  }

  .word-count-details {
    display: block;
    width: fit-content;
    padding-top: 0.1rem;
  }

  .infinite-canvas:active {
    cursor: grabbing;
  }

  @keyframes enlargePulse {
    0% {
      transform: scale(1);
      box-shadow: 0 0 0 0 rgba(249, 103, 67, 0.45);
    }
    65% {
      transform: scale(1.06);
      box-shadow: 0 0 0 14px rgba(249, 103, 67, 0);
    }
    100% {
      transform: scale(1);
      box-shadow: 0 0 0 0 rgba(249, 103, 67, 0);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .canvas-action-button.enlarge {
      animation: none;
    }
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

    .canvas-action-button,
    :global(.canvas-navigation) {
      display: none !important;
    }
  }
</style>
