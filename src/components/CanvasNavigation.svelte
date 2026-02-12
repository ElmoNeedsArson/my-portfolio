<script lang="ts">
    import { List } from "@lucide/svelte";
    import { onMount } from "svelte";
    
    export let cards: Array<{id: string, title: string, x: number, y: number, width: number}> = [];
    export let onNavigate: (cardId: string) => void;
    export let isFullscreen: boolean = false;
    
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
    let bottomOffset = 80;
    
    const DRAG_THRESHOLD = 5; // Minimum pixels to move before considered a drag
    
    // Reset position when mode changes
    $: if (isFullscreen !== undefined) {
        resetPosition();
    }
    
    function resetPosition() {
        posX = null;
        posY = null;
    }
    
    function handleMouseDown(event: MouseEvent) {
        // Stop event from reaching canvas (prevent canvas pan)
        event.stopPropagation();
        
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
    }
    
    function handleWheel(event: WheelEvent) {
        // Stop wheel events from reaching the canvas (prevent zoom)
        event.stopPropagation();
    }
</script>

<svelte:window 
    on:mousemove={handleMouseMove} 
    on:mouseup={handleMouseUp} 
/>

<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div 
    bind:this={navElement}
    class="canvas-navigation"
    class:dragging={isDragging}
    class:expanded={isExpanded}
    style="{posX !== null ? `left: ${posX}px;` : `right: ${rightOffset}px;`} {posY !== null ? `top: ${posY}px;` : `top: ${bottomOffset}px;`}"
    on:mousedown={handleMouseDown}
    on:wheel={handleWheel}
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
    
    {#if isExpanded}
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

<style>
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
</style>
