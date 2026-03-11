<script lang="ts">
    import { List } from "@lucide/svelte";
    
    export let cards: Array<{id: string, title: string, x: number, y: number, width: number}> = [];
    export let onNavigate: (cardId: string) => void;
    export let isFullscreen: boolean = false;

    const MOBILE_BREAKPOINT = 1100;
    let viewportWidth = 0;
    
    let isDragging = false;
    let hasDragged = false; // Track if actual dragging occurred
    let dragStartX = 0;
    let dragStartY = 0;
    let initialClickX = 0;
    let initialClickY = 0;
    let navElement: HTMLElement;
    let posX: number | null = null; // Position from left (null = use right positioning)
    let posY: number | null = null; // Position from top (null = use bottom positioning)
    let isExpanded = false;
    
    // Start in bottom right
    let rightOffset = 20;
    let bottomOffset = 20;

    $: isCompactViewport = viewportWidth <= MOBILE_BREAKPOINT;
    
    const DRAG_THRESHOLD = 5; // Minimum pixels to move before considered a drag
    
    // Reset position when fullscreen mode changes
    $: isFullscreen, resetPosition();

    $: if (isCompactViewport) {
        // Keep compact mode anchored and predictable after rotation/resizing.
        posX = null;
        posY = null;
    }
    
    function resetPosition() {
        posX = null;
        posY = null;
    }
    
    function handleMouseDown(event: MouseEvent) {
        // Stop event from reaching canvas (prevent canvas pan)
        event.stopPropagation();

        // On compact/mobile, prioritize tap-to-open over dragging the widget.
        if (isCompactViewport) {
            return;
        }
        
        if ((event.target as HTMLElement).closest('.nav-item')) {
            return; // Don't drag when clicking nav items
        }
        
        isDragging = true;
        hasDragged = false;
        initialClickX = event.clientX;
        initialClickY = event.clientY;
        
        if (!navElement) return;
        
        const rect = navElement.getBoundingClientRect();
        const parent = navElement.parentElement?.getBoundingClientRect();
        if (!parent) return;
        
        // Convert to left/top positioning for dragging
        posX = rect.left - parent.left;
        posY = rect.top - parent.top;
        
        dragStartX = event.clientX - posX;
        dragStartY = event.clientY - posY;
        event.preventDefault();
    }
    
    function handleMouseMove(event: MouseEvent) {
        if (!isDragging) return;
        
        // Check if moved beyond threshold
        const deltaX = Math.abs(event.clientX - initialClickX);
        const deltaY = Math.abs(event.clientY - initialClickY);
        
        if (deltaX > DRAG_THRESHOLD || deltaY > DRAG_THRESHOLD) {
            if (!hasDragged) {
                // First time exceeding threshold - collapse menu
                isExpanded = false;
                hasDragged = true;
            }
            
            if (posX !== null && posY !== null) {
                posX = event.clientX - dragStartX;
                posY = event.clientY - dragStartY;
            }
        }
    }
    
    function handleMouseUp() {
        isDragging = false;
    }
    
    function handleHeaderClick() {
        // Only toggle if we didn't drag
        if (!hasDragged) {
            isExpanded = !isExpanded;
        }
        hasDragged = false;
    }
    
    function handleNavigate(cardId: string) {
        onNavigate(cardId);

        if (isCompactViewport) {
            isExpanded = false;
        }
    }
    
    function handleWheel(event: WheelEvent) {
        // Stop wheel events from reaching the canvas (prevent zoom)
        event.stopPropagation();
    }

    function handleTouchStart(event: TouchEvent) {
        // Stop event from reaching canvas (prevent canvas pan)
        event.stopPropagation();

        // On compact/mobile, prioritize tap-to-open over dragging the widget.
        if (isCompactViewport) {
            return;
        }
        
        if ((event.target as HTMLElement).closest('.nav-item')) {
            return; // Don't drag when touching nav items
        }
        
        const touch = event.touches[0];
        isDragging = true;
        hasDragged = false;
        initialClickX = touch.clientX;
        initialClickY = touch.clientY;
        
        if (!navElement) return;
        
        const rect = navElement.getBoundingClientRect();
        const parent = navElement.parentElement?.getBoundingClientRect();
        if (!parent) return;
        
        // Convert to left/top positioning for dragging
        posX = rect.left - parent.left;
        posY = rect.top - parent.top;
        
        dragStartX = touch.clientX - posX;
        dragStartY = touch.clientY - posY;
    }

    function handleTouchMove(event: TouchEvent) {
        if (!isDragging || event.touches.length === 0) return;
        
        const touch = event.touches[0];
        
        // Check if moved beyond threshold
        const deltaX = Math.abs(touch.clientX - initialClickX);
        const deltaY = Math.abs(touch.clientY - initialClickY);
        
        if (deltaX > DRAG_THRESHOLD || deltaY > DRAG_THRESHOLD) {
            event.preventDefault(); // Prevent scrolling
            
            if (!hasDragged) {
                // First time exceeding threshold - collapse menu
                isExpanded = false;
                hasDragged = true;
            }
            
            if (posX !== null && posY !== null) {
                posX = touch.clientX - dragStartX;
                posY = touch.clientY - dragStartY;
            }
        }
    }

    function handleTouchEnd() {
        isDragging = false;
    }

    function closeMobileNavigation(event?: Event) {
        event?.stopPropagation();
        isExpanded = false;
    }

    function handleKeydown(event: KeyboardEvent) {
        if (event.key === "Escape" && isExpanded) {
            isExpanded = false;
        }
    }
</script>

<svelte:window 
    bind:innerWidth={viewportWidth}
    on:mousemove={handleMouseMove} 
    on:mouseup={handleMouseUp}
    on:touchmove={handleTouchMove}
    on:touchend={handleTouchEnd}
    on:touchcancel={handleTouchEnd}
    on:keydown={handleKeydown}
/>

{#if isCompactViewport && isExpanded}
    <button
        class="nav-backdrop"
        type="button"
        aria-label="Close navigation"
        on:click={closeMobileNavigation}
    ></button>
{/if}

<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div 
    bind:this={navElement}
    class="canvas-navigation"
    class:compact={isCompactViewport}
    class:dragging={isDragging}
    class:expanded={isExpanded}
    style="{isCompactViewport
        ? ''
        : `${posX !== null ? `left: ${posX}px;` : `left: ${rightOffset}px;`} ${posY !== null ? `top: ${posY}px;` : `top: ${bottomOffset}px;`}` }"
    on:mousedown={handleMouseDown}
    on:wheel={handleWheel}
    on:touchstart={handleTouchStart}
    role="navigation"
    aria-label="Canvas navigation"
>
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div 
        class="nav-header" 
        on:click={handleHeaderClick}
        role="button"
        tabindex="0"
    >
        <List size={20} />
        <span>Navigation</span>
    </div>
    
    {#if isExpanded && !isCompactViewport}
        <div class="nav-content">
            {#each cards as card}
                <button 
                    class="nav-item" 
                    on:click={() => handleNavigate(card.id)}
                >
                    {card.title}
                </button>
            {/each}
        </div>
    {/if}
</div>

{#if isCompactViewport && isExpanded}
    <div
        class="compact-nav-panel"
        on:wheel|stopPropagation
        on:touchstart|stopPropagation
        on:touchmove|stopPropagation
    >
        {#each cards as card}
            <button
                class="nav-item"
                on:click={() => handleNavigate(card.id)}
            >
                {card.title}
            </button>
        {/each}
    </div>
{/if}

<style>
    .nav-backdrop {
        position: fixed;
        inset: 0;
        z-index: 995;
        border: none;
        padding: 0;
        margin: 0;
        background: rgba(0, 0, 0, 0.24);
        backdrop-filter: blur(2px);
    }

    .canvas-navigation {
        position: absolute;
        z-index: 1000;
        background: var(--secondary-background-color);
        border: 1px solid var(--border-color);
        border-radius: 12px;
        backdrop-filter: blur(10px);
        box-shadow: 0 8px 32px var(--box-shadow);
        min-width: 200px;
        max-width: 300px;
        user-select: none;
        transition: box-shadow 0.2s ease;
    }
    
    .canvas-navigation:hover {
        box-shadow: 0 12px 48px rgba(0, 0, 0, 0.5);
    }
    
    .canvas-navigation.dragging {
        cursor: grabbing;
        box-shadow: 0 16px 64px rgba(0, 0, 0, 0.6);
    }
    
    .nav-header {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.875rem 1rem;
        cursor: grab;
        color: var(--primary-text-color);
        font-weight: 600;
        font-size: 0.95rem;
        border-bottom: 1px solid var(--border-color);
        transition: background 0.2s ease;
    }
    
    .nav-header:hover {
        background: rgba(255, 255, 255, 0.05);
    }
    
    .nav-header:active {
        cursor: grabbing;
    }

    .nav-header:focus-visible {
        outline: 2px solid var(--secondary-text-color);
        outline-offset: 2px;
    }
    
    .nav-content {
        padding: 0.5rem;
        max-height: 60vh;
        overflow-y: auto;
    }
    
    .nav-content::-webkit-scrollbar {
        width: 6px;
    }
    
    .nav-content::-webkit-scrollbar-track {
        background: var(--hover-color);
        border-radius: 3px;
    }
    
    .nav-content::-webkit-scrollbar-thumb {
        background: var(--border-color);
        border-radius: 3px;
    }
    
    .nav-content::-webkit-scrollbar-thumb:hover {
        background: var(--muted-color);
    }
    
    .nav-item {
        display: block;
        width: 100%;
        padding: 0.75rem 1rem;
        background: var(--hover-color);
        border: 1px solid var(--border-color);
        border-radius: 6px;
        color: var(--primary-text-color);
        font-size: 0.9rem;
        text-align: left;
        cursor: pointer;
        transition: all 0.2s ease;
        margin-bottom: 0.5rem;
    }
    
    .nav-item:last-child {
        margin-bottom: 0;
    }
    
    .nav-item:hover {
        background: var(--secondary-background-color);
        border-color: var(--secondary-text-color);
        color: var(--secondary-text-color);
        transform: translateX(4px);
    }
    
    .nav-item:active {
        transform: translateX(4px) scale(0.98);
    }

    .canvas-navigation.compact {
        left: 0.75rem;
        top: 0.75rem;
        right: auto;
        min-width: auto;
        max-width: none;
        width: 2.9rem;
        height: 2.9rem;
        border-radius: 999px;
    }

    .canvas-navigation.compact .nav-header {
        cursor: pointer;
        border-bottom: none;
        border-radius: 999px;
        width: 100%;
        height: 100%;
        padding: 0;
        min-width: 0;
        justify-content: center;
        background: var(--secondary-background-color);
    }

    .canvas-navigation.compact .nav-header span {
        display: none;
    }

    .compact-nav-panel {
        position: fixed;
        left: 0.75rem;
        right: 0.75rem;
        top: calc(0.75rem + 3.35rem);
        z-index: 1001;
        width: auto;
        max-width: 360px;
        margin-left: auto;
        margin-right: auto;
        max-height: min(58vh, 420px);
        background: var(--secondary-background-color);
        border: 1px solid var(--border-color);
        border-radius: 12px;
        box-shadow: 0 16px 40px rgba(0, 0, 0, 0.32);
        padding: 0.6rem;
        overflow-y: auto;
        overflow-x: hidden;
        scrollbar-gutter: stable;
    }

    .compact-nav-panel::-webkit-scrollbar {
        width: 6px;
    }

    .compact-nav-panel::-webkit-scrollbar-track {
        background: var(--hover-color);
        border-radius: 999px;
    }

    .compact-nav-panel::-webkit-scrollbar-thumb {
        background: var(--border-color);
        border-radius: 999px;
    }

    .compact-nav-panel::-webkit-scrollbar-thumb:hover {
        background: var(--muted-color);
    }

    @media (min-width: 1101px) {
        .compact-nav-panel {
            display: none;
        }
    }
</style>
