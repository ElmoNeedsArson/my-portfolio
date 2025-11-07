<script lang="ts">
    /**
     * SearchResults Component
     * 
     * Displays search results in a modal overlay:
     * - Shows filtered projects based on search criteria
     * - Displays search term and category context
     * - Provides navigation to individual project pages
     * - Handles empty results with helpful messaging
     * - Allows going back to refine search
     * - Click-outside-to-close with delay protection
     */
    
    import { createEventDispatcher } from 'svelte';
    import { X, ArrowLeft } from '@lucide/svelte';
    import { link } from 'svelte-spa-router';
    import ProjectCard from './ProjectCard.svelte';
    import type { SearchResult } from '../lib/searchUtils';

    // Event dispatcher for parent communication
    const dispatch = createEventDispatcher<{
        close: void;        // Close the results modal
        backToSearch: void; // Return to search modal for refinement
    }>();

    // Props from parent
    export let searchResult: SearchResult; // Search results data

    // Delay click-outside functionality to prevent immediate closure when modal opens
    let clickOutsideEnabled = false;
    setTimeout(() => {
        clickOutsideEnabled = true;
    }, 150);

    // Display labels for search categories
    const categoryLabels = {
        projects: 'Project Names',
        tags: 'Tags',
        languages: 'Languages',
        tools: 'Tools'
    };

    // Icons for each category type
    const categoryIcons = {
        projects: '📁',
        tags: '🏷️',
        languages: '💻',
        tools: '🛠️'
    };

    /**
     * Close the results modal completely
     */
    function handleClose() {
        dispatch('close');
    }

    /**
     * Go back to search modal to refine search
     */
    function handleBackToSearch() {
        dispatch('backToSearch');
    }

    /**
     * Handle clicks outside modal to close it
     * Delayed activation prevents immediate closure
     */
    function handleClickOutside(event: MouseEvent) {
        if (!clickOutsideEnabled) return;
        
        const target = event.target as HTMLElement;
        if (!target.closest('.results-container')) {
            handleClose();
        }
    }
</script>

<svelte:window on:click={handleClickOutside} />

<div class="results-overlay">
    <div class="results-container">
        <div class="results-header">
            <button class="back-button" on:click={handleBackToSearch}>
                <ArrowLeft size={20} />
                <span>Back to Search</span>
            </button>

            <div class="search-info">
                <span class="search-category-icon">
                    {categoryIcons[searchResult.category]}
                </span>
                <div class="search-details">
                    <span class="search-term">"{searchResult.searchTerm}"</span>
                    <span class="search-category">in {categoryLabels[searchResult.category]}</span>
                </div>
            </div>

            <button class="close-button" on:click={handleClose}>
                <X size={20} />
            </button>
        </div>

        <div class="results-content">
            <div class="results-summary">
                <h2>Search Results</h2>
                <p class="results-count">
                    {searchResult.projects.length} project{searchResult.projects.length !== 1 ? 's' : ''} found
                    {#if searchResult.projects.length === 0}
                        matching your search.
                    {:else}
                        for <strong>"{searchResult.searchTerm}"</strong> in {categoryLabels[searchResult.category].toLowerCase()}.
                    {/if}
                </p>
            </div>

            {#if searchResult.projects.length === 0}
                <div class="no-results">
                    <div class="no-results-icon">🔍</div>
                    <h3>No projects found</h3>
                    <p>Try searching with different keywords or check another category.</p>
                    <button class="try-again-button" on:click={handleBackToSearch}>
                        Try Another Search
                    </button>
                </div>
            {:else}
                <div class="projects-grid">
                    {#each searchResult.projects as project}
                        <a href={`/${project.slug}`} use:link on:click={handleClose}>
                            <ProjectCard {project} />
                        </a>
                    {/each}
                </div>
            {/if}
        </div>
    </div>
</div>

<style>
    .results-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(4px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        padding: 2rem;
    }

    .results-container {
        background-color: var(--background-color);
        border: 1px solid var(--border-color);
        border-radius: 12px;
        width: 100%;
        max-width: 1200px;
        max-height: 90vh;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
        display: flex;
        flex-direction: column;
        overflow: hidden;
    }

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
        font-size: 1.25rem;
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
        background-color: var(--accent-color);
        color: white;
        border: none;
        border-radius: 6px;
        font-size: 0.925rem;
        font-weight: 500;
        cursor: pointer;
        transition: background-color 0.2s ease;
    }

    .try-again-button:hover {
        background-color: var(--accent-hover-color, var(--accent-color));
        filter: brightness(110%);
    }

    .projects-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 1.5rem;
        margin-top: 1rem;
    }

    .projects-grid a {
        text-decoration: none;
        color: inherit;
        transition: transform 0.2s ease;
    }

    .projects-grid a:hover {
        transform: translateY(-2px);
    }

    @media (max-width: 768px) {
        .results-overlay {
            padding: 1rem;
        }

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