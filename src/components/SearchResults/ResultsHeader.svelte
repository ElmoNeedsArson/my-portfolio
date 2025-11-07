<script lang="ts">
    import { ArrowLeft, X } from "@lucide/svelte";
    import { getCategoryById } from "../../lib/searchCategories";
    import type { SearchResult } from "../../lib/searchUtils";
    import { createEventDispatcher } from "svelte";

    export let searchResult: SearchResult;

    const dispatch = createEventDispatcher<{
        close: void;
        backToSearch: void;
    }>();

    function handleClose() {
        dispatch("close");
    }

    function handleBackToSearch(event: MouseEvent) {
        event.stopPropagation(); // Prevents immediate closing of search modal
        dispatch("backToSearch");
    }
</script>

<div class="results-header">
    <button class="back-button" on:click={handleBackToSearch}>
        <ArrowLeft size={20} />
        <span>Back to Search</span>
    </button>

    <div class="search-info">
        <span class="search-category-icon">
            <svelte:component
                this={getCategoryById(searchResult.category).icon}
                size="20"
            />
        </span>
        <div class="search-details">
            <span class="search-term">"{searchResult.searchTerm}"</span>
            <span class="search-category">
                in {getCategoryById(searchResult.category).label}
            </span>
        </div>
    </div>

    <button class="close-button" on:click={handleClose}>
        <X size={20} />
    </button>
</div>

<style>
     .results-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 1rem 1.5rem;
        border-bottom: 1px solid var(--border-color);
        background-color: var(--secondary-background-color);
    }

    .back-button {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 0.75rem;
        background-color: var(--background-color);
        border: 1px solid var(--border-color);
        border-radius: 6px;
        color: var(--primary-text-color);
        cursor: pointer;
        transition: all 0.2s ease;
        font-size: 0.875rem;
    }

    .back-button:hover {
        background-color: var(--hover-color);
    }

    .search-info {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        flex: 1;
        justify-content: center;
    }

    .search-category-icon {
        color: var(--muted-color);
    }

        .search-details {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
    }

    .search-term {
        font-weight: 600;
        font-size: 1rem;
        color: var(--primary-text-color);
    }

    .search-category {
        font-size: 0.875rem;
        color: var(--muted-color);
    }

    .close-button {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0.5rem;
        background: none;
        border: none;
        color: var(--muted-color);
        cursor: pointer;
        border-radius: 4px;
        transition: color 0.2s ease;
    }

    .close-button:hover {
        color: var(--primary-text-color);
        background-color: var(--hover-color);
    }

     @media (max-width: 768px) {
        .results-header {
            padding: 1rem;
            flex-direction: column;
            gap: 1rem;
        }

        .search-info {
            order: -1;
        }

        .back-button,
        .close-button {
            flex-shrink: 0;
        }
    } 
</style>
