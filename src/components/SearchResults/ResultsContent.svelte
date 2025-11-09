<script lang="ts">
    import { Search } from "@lucide/svelte";
    import ProjectCard from "../ProjectCard.svelte";
    import { link } from "svelte-spa-router";
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

    function handleBackToSearch() {
        dispatch("backToSearch");
    }
</script>

<div class="results-content">
    <div class="results-summary">
        <h2>Search Results</h2>
        <p class="results-count">
            {searchResult.projects.length} project{searchResult.projects
                .length !== 1
                ? "s"
                : ""} found
            {#if searchResult.projects.length === 0}
                matching your search.
            {:else}
                for <strong>"{searchResult.searchTerm}"</strong> in
                {getCategoryById(searchResult.category).label.toLowerCase()}.
            {/if}
        </p>
    </div>

    {#if searchResult.projects.length === 0}
        <div class="no-results">
            <div class="no-results-icon"><Search size={40} /></div>
            <h3>No projects found</h3>
            <p>
                Try searching with different keywords or check another category.
            </p>
            <button class="try-again-button" on:click={handleBackToSearch}>
                Try Another Search
            </button>
        </div>
    {:else}
        <div class="projects-grid">
            {#each searchResult.projects as project}
                <ProjectCard {project} showPinIcon={false} on:cardClick={handleClose} />
            {/each}
        </div>
    {/if}
</div>

<style>
    .results-content {
        flex: 1;
        overflow-y: auto;
        padding: 1.5rem;
    }

    .results-summary {
        margin-bottom: 2rem;
    }

    .results-summary h2 {
        margin: 0 0 0.5rem 0;
        color: var(--primary-text-color);
        font-size: 1.5rem;
    }

    .results-count {
        margin: 0;
        color: var(--secondary-text-color);
        font-size: 1rem;
    }

    .results-count strong {
        color: var(--primary-text-color);
    }

    .no-results {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        padding: 3rem 2rem;
    }

    .no-results-icon {
        color: var(--muted-color);
        font-size: 3rem;
        margin-bottom: 1rem;
        opacity: 0.7;
    }

    .no-results h3 {
        margin: 0 0 0.5rem 0;
        color: var(--primary-text-color);
        font-size: 1.25rem;
    }

    .no-results p {
        margin: 0 0 1.5rem 0;
        color: var(--secondary-text-color);
    }

    .try-again-button {
        padding: 0.75rem 1.5rem;
        background-color: var(--secondary-text-color);
        color: white;
        border: none;
        border-radius: 6px;
        font-size: 0.925rem;
        font-weight: 500;
        cursor: pointer;
        transition: background-color 0.2s ease;
    }

    .projects-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 1.5rem;
        margin-top: 1rem;
    }

    /* .projects-grid a {
        text-decoration: none;
        color: inherit;
        transition: transform 0.2s ease;
    } */

    @media (hover: hover) {
        /* hover styles only for non-touch devices */
        .try-again-button:hover {
            background-color: var(
                --secondary-text-color,
                var(--secondary-text-color)
            );
            filter: brightness(110%);
        }

        /* .projects-grid a:hover {
            transform: translateY(-2px);
        } */
    }

    @media (max-width: 768px) {
        .projects-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
        }

        .results-content {
            padding: 1rem;
        }

        .no-results {
            padding: 2rem 1rem;
        }
    }
</style>
