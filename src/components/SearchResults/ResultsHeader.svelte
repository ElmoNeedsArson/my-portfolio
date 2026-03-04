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

    @media (hover: hover) { /* hover styles only for non-touch devices */
        .back-button:hover {
            background-color: var(--hover-color);
        }

        .close-button:hover {
            color: var(--primary-text-color);
            background-color: var(--hover-color);
        }
    }

    @media (max-width: 768px) and (orientation: portrait) {
        .results-header {
            padding: 0.625rem 0.75rem;
            gap: 0.5rem;
        }

        .back-button {
            padding: 0.375rem 0.5rem;
            font-size: 0.75rem;
            gap: 0.25rem;
            flex-shrink: 0;
        }

        .search-info {
            gap: 0.375rem;
            min-width: 0;
            justify-content: center;
        }

        .search-details {
            display: none;
            flex-direction: row;
            align-items: baseline;
            gap: 0.25rem;
            min-width: 0;
            text-align: left;
        }

        .search-term,
        .search-category {
            font-size: 0.75rem;
            line-height: 1.2;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .search-term {
            max-width: 38vw;
        }

        .search-category {
            max-width: 28vw;
        }

        .close-button {
            padding: 0.375rem;
            flex-shrink: 0;
        }

        .search-category-icon {
            display:none;
        }

        .back-button :global(svg),
        .search-category-icon :global(svg),
        .close-button :global(svg) {
            width: 16px;
            height: 16px;
        }
    }
</style>
