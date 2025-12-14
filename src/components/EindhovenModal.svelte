<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { X } from "@lucide/svelte";

    const dispatch = createEventDispatcher<{
        close: void;
    }>();

    export let isOpen = false;
    export let title = "Modal Title";

    function handleClose() {
        dispatch("close");
    }

    function handleClickOutside(event: MouseEvent) {
        if (!isOpen) return;
        const target = event.target as HTMLElement;
        if (!target.closest(".modal-container")) {
            handleClose();
        }
    }

    function handleModalClick(event: MouseEvent) {
        event.stopPropagation();
    }
</script>

<svelte:window on:click={handleClickOutside} />

{#if isOpen}
    <div class="modal-overlay">
        <div class="modal-container" on:click={handleModalClick}>
            <div class="modal-header">
                <h3>{title}</h3>
                <button class="close-button" on:click={handleClose}>
                    <X size={20} />
                </button>
            </div>

            <div class="modal-content">
                <slot />
            </div>
        </div>
    </div>
{/if}

<style>
    .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: var(--transparent-overlay);
        backdrop-filter: blur(4px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        padding: 2rem;
    }

    .modal-container {
        background-color: var(--background-color);
        border: 1px solid var(--border-color);
        border-radius: 12px;
        width: 90%;
        height: 90%;
        box-shadow: 0 20px 40px var(--box-shadow);
        display: flex;
        flex-direction: column;
        overflow: hidden;
    }

    .modal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 1rem 1.5rem;
        border-bottom: 1px solid var(--border-color);
        background-color: var(--background-color);
    }

    .modal-header h3 {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 500;
        color: var(--primary-text-color);
    }

    .close-button {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        border: none;
        background: transparent;
        color: var(--muted-color);
        cursor: pointer;
        border-radius: 6px;
        transition: all 0.2s ease;
    }

    .close-button:hover {
        background-color: var(--hover-color);
        color: var(--primary-text-color);
    }

    .modal-content {
        flex: 1;
        padding: 1.5rem;
        overflow-y: auto;
    }

    @media (max-width: 768px) {
        .modal-overlay {
            padding: 1rem;
        }

        .modal-container {
            width: 95%;
            height: 85%;
        }
    }
</style>
