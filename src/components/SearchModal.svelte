<script lang="ts">
    /**
     * SearchModal Component
     * 
     * Advanced search interface that provides:
     * - Category selection (projects, tags, languages, tools)
     * - Real-time suggestions as user types
     * - Keyboard navigation (Enter to search, Esc to close)
     * - Smart behavior: direct navigation for projects, search results for others
     * - Click-outside-to-close with delay to prevent immediate closure
     */
    
    import { createEventDispatcher } from 'svelte';
    import { Search, ChevronDown, X } from '@lucide/svelte';
    import { searchProjects, getSuggestions, type SearchCategory, type SearchResult } from '../lib/searchUtils';
    import type { Project } from '../types';

    const dispatch = createEventDispatcher<{
        searchResults: SearchResult;
        close: void;
    }>();

    export let isOpen = false;

    let selectedCategory: SearchCategory = 'projects';
    let searchInput = '';
    let suggestions: string[] = [];
    let showSuggestions = false;
    let categoryDropdownOpen = false;
    let searchInputElement: HTMLInputElement;

    const categories = [
        { id: 'projects', label: 'Project Names', icon: '📁' },
        { id: 'tags', label: 'Tags', icon: '🏷️' },
        { id: 'languages', label: 'Languages', icon: '💻' },
        { id: 'tools', label: 'Tools', icon: '🛠️' }
    ] as const;

    // Focus input when modal opens
    $: if (isOpen && searchInputElement) {
        searchInputElement.focus();
    }

    $: currentCategory = categories.find(cat => cat.id === selectedCategory);

    // Update suggestions when input or category changes
    $: if (selectedCategory) {
        suggestions = getSuggestions(selectedCategory, searchInput);
        showSuggestions = true; // Always show suggestions when a category is selected
    }

    function handleCategorySelect(category: SearchCategory, event: MouseEvent) {
        event.stopPropagation();
        selectedCategory = category;
        categoryDropdownOpen = false;
        searchInput = '';
        showSuggestions = true;
        updateSuggestions();
    }

    let categoryButtonElement: HTMLButtonElement;

    function toggleCategoryDropdown(event: MouseEvent) {
        event.stopPropagation();
        categoryDropdownOpen = !categoryDropdownOpen;
        
        // Position dropdown
        if (categoryDropdownOpen && categoryButtonElement) {
            setTimeout(() => {
                const dropdown = document.querySelector('.category-dropdown') as HTMLElement;
                if (dropdown) {
                    const rect = categoryButtonElement.getBoundingClientRect();
                    dropdown.style.top = `${rect.bottom + 4}px`;
                    dropdown.style.left = `${rect.left}px`;
                }
            }, 0);
        }
    }

    function updateSuggestions() {
        suggestions = getSuggestions(selectedCategory, searchInput);
    }

    function handleSuggestionClick(suggestion: string) {
        console.log('Suggestion clicked:', suggestion, 'Category:', selectedCategory);
        searchInput = suggestion;
        
        // If it's a project name and we find an exact match, navigate directly
        if (selectedCategory === 'projects') {
            const projects = import.meta.glob("../projects/*/*.json", { eager: true }) as Record<string, { default: Project }>;
            const allProjects = Object.values(projects).map(m => m.default);
            const exactMatch = allProjects.find(p => p.title === suggestion);
            if (exactMatch) {
                console.log('Direct navigation to project:', exactMatch.slug);
                // Import the router and navigate
                import('svelte-spa-router').then(({ push }) => {
                    push(`/${exactMatch.slug}`);
                });
                closeSearch();
                return;
            }
        }
        
        // Otherwise, perform search to show results
        performSearch();
    }

    function performSearch() {
        const trimmedInput = searchInput.trim();
        console.log('Performing search:', trimmedInput, 'Category:', selectedCategory);
        if (!trimmedInput) return;
        
        const results = searchProjects(selectedCategory, trimmedInput);
        console.log('Search results:', results);
        dispatch('searchResults', results);
        closeSearch();
    }

    function closeSearch() {
        isOpen = false;
        searchInput = '';
        showSuggestions = false;
        categoryDropdownOpen = false;
        dispatch('close');
    }

    function handleKeyDown(event: KeyboardEvent) {
        if (event.key === 'Enter') {
            performSearch();
        } else if (event.key === 'Escape') {
            closeSearch();
        }
    }

    let clickOutsideEnabled = false;

    // Enable click outside after a short delay to prevent immediate closure
    $: if (isOpen) {
        setTimeout(() => {
            clickOutsideEnabled = true;
        }, 100);
    } else {
        clickOutsideEnabled = false;
    }

    function handleClickOutside(event: MouseEvent) {
        if (!clickOutsideEnabled) return;
        
        const target = event.target as HTMLElement;
        if (!target.closest('.search-container')) {
            closeSearch();
        }
    }
</script>

<svelte:window on:click={handleClickOutside} />

{#if isOpen}
    <div class="search-overlay">
        <div class="search-container">
            <div class="search-header">
                <div class="category-selector">
                    <button 
                        bind:this={categoryButtonElement}
                        class="category-button"
                        class:open={categoryDropdownOpen}
                        on:click={toggleCategoryDropdown}
                    >
                        <span class="category-icon">{currentCategory?.icon}</span>
                        <span class="category-label">{currentCategory?.label}</span>
                        <ChevronDown size={16} class={categoryDropdownOpen ? 'rotate' : ''} />
                    </button>

                    {#if categoryDropdownOpen}
                        <div class="category-dropdown" on:click|stopPropagation>
                            {#each categories as category}
                                <button
                                    class="category-option"
                                    class:selected={category.id === selectedCategory}
                                    on:click={(event) => handleCategorySelect(category.id, event)}
                                >
                                    <span class="category-icon">{category.icon}</span>
                                    <span>{category.label}</span>
                                </button>
                            {/each}
                        </div>
                    {/if}
                </div>

                <div class="search-input-container">
                    <Search size={20} class="search-icon" />
                    <input
                        bind:this={searchInputElement}
                        type="text"
                        bind:value={searchInput}
                        on:keydown={handleKeyDown}
                        on:input={updateSuggestions}
                        placeholder={`Search ${currentCategory?.label.toLowerCase()}...`}
                        class="search-input"
                    />
                    />
                </div>

                <button class="close-button" on:click={closeSearch}>
                    <X size={20} />
                </button>
            </div>

            {#if showSuggestions && suggestions.length > 0}
                <div class="suggestions-container">
                    <div class="suggestions-header">
                        <span class="suggestions-title">Suggestions</span>
                        <span class="suggestions-count">{suggestions.length}</span>
                    </div>
                    <div class="suggestions-list">
                        {#each suggestions as suggestion}
                            <button
                                class="suggestion-item"
                                on:click={() => handleSuggestionClick(suggestion)}
                            >
                                <span class="suggestion-icon">{currentCategory?.icon}</span>
                                <span class="suggestion-text">{suggestion}</span>
                            </button>
                        {/each}
                    </div>
                </div>
            {/if}

            <div class="search-footer">
                <span class="search-hint">
                    Press <kbd>Enter</kbd> to search or <kbd>Esc</kbd> to cancel
                </span>
            </div>
        </div>
    </div>
{/if}

<style>
    .search-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(4px);
        display: flex;
        align-items: flex-start;
        justify-content: center;
        padding-top: 10vh;
        z-index: 1000;
    }

    .search-container {
        background-color: var(--background-color);
        border: 1px solid var(--border-color);
        border-radius: 12px;
        width: 90%;
        max-width: 600px;
        max-height: 400px;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
        overflow: hidden;
        display: flex;
        flex-direction: column;
    }

    .search-header {
        display: flex;
        align-items: center;
        padding: 1rem;
        border-bottom: 1px solid var(--border-color);
        gap: 0.75rem;
    }

    .category-selector {
        position: relative;
    }

    .category-button {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 0.75rem;
        background-color: var(--secondary-background-color);
        border: 1px solid var(--border-color);
        border-radius: 6px;
        color: var(--primary-text-color);
        cursor: pointer;
        transition: all 0.2s ease;
        white-space: nowrap;
    }

    .category-button:hover {
        background-color: var(--hover-color);
    }

    .category-button.open {
        background-color: var(--hover-color);
    }

    .category-icon {
        font-size: 0.875rem;
    }

    .category-label {
        font-size: 0.875rem;
        font-weight: 500;
    }

    .category-button :global(.rotate) {
        transform: rotate(180deg);
        transition: transform 0.2s ease;
    }

    .category-dropdown {
        position: fixed;
        background-color: var(--background-color);
        border: 1px solid var(--border-color);
        border-radius: 6px;
        margin-top: 0.25rem;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 1001;
        min-width: 180px;
    }

    .category-option {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        width: 100%;
        padding: 0.75rem;
        background: none;
        border: none;
        color: var(--primary-text-color);
        cursor: pointer;
        transition: background-color 0.2s ease;
        text-align: left;
    }

    .category-option:hover {
        background-color: var(--hover-color);
    }

    .category-option.selected {
        background-color: var(--accent-color);
        color: white;
    }

    .search-input-container {
        flex: 1;
        position: relative;
        display: flex;
        align-items: center;
    }

    .search-input {
        width: 100%;
        padding: 0.75rem 1rem 0.75rem 2.5rem;
        background-color: var(--secondary-background-color);
        border: 1px solid var(--border-color);
        border-radius: 6px;
        color: var(--primary-text-color);
        font-size: 1rem;
        outline: none;
        transition: border-color 0.2s ease;
    }

    .search-input:focus {
        border-color: var(--accent-color);
    }

    .search-input::placeholder {
        color: var(--muted-color);
    }

    .search-input-container :global(.search-icon) {
        position: absolute;
        left: 0.75rem;
        color: var(--muted-color);
        pointer-events: none;
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

    .suggestions-container {
        border-bottom: 1px solid var(--border-color);
        flex: 1;
        overflow: hidden;
        display: flex;
        flex-direction: column;
    }

    .suggestions-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.75rem 1rem 0.5rem;
    }

    .suggestions-title {
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--secondary-text-color);
    }

    .suggestions-count {
        font-size: 0.75rem;
        color: var(--muted-color);
        background-color: var(--secondary-background-color);
        padding: 0.25rem 0.5rem;
        border-radius: 12px;
    }

    .suggestions-list {
        flex: 1;
        overflow-y: auto;
    }

    .suggestion-item {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        width: 100%;
        padding: 0.75rem 1rem;
        background: none;
        border: none;
        color: var(--primary-text-color);
        cursor: pointer;
        transition: background-color 0.2s ease;
        text-align: left;
    }

    .suggestion-item:hover {
        background-color: var(--hover-color);
    }

    .suggestion-text {
        font-size: 0.925rem;
    }

    .search-footer {
        padding: 0.75rem 1rem;
        background-color: var(--secondary-background-color);
    }

    .search-hint {
        font-size: 0.75rem;
        color: var(--muted-color);
    }

    kbd {
        background-color: var(--background-color);
        border: 1px solid var(--border-color);
        border-radius: 3px;
        padding: 0.125rem 0.25rem;
        font-size: 0.75rem;
        font-family: monospace;
    }
</style>