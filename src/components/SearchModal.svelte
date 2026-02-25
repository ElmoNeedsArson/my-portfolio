<script lang="ts">
    import { createEventDispatcher, onMount, onDestroy } from "svelte";
    import { Search, ChevronDown, X } from "@lucide/svelte";
    import {
        searchProjects,
        getSuggestions,
        type SearchCategory,
        type SearchResult,
        loadAllProjects,
    } from "../lib/searchUtils";
    import {
        SEARCH_CATEGORIES,
        getCategoryById,
    } from "../lib/searchCategories";

    const dispatch = createEventDispatcher<{
        searchResults: SearchResult;
        close: void;
    }>();

    export let isOpen = false;

    let selectedCategory: SearchCategory = "projects";
    let searchInput = "";
    let suggestions: string[] = [];
    let categoryDropdownOpen = false;
    let searchInputElement: HTMLInputElement;

    let categoryDropdown: HTMLElement;
    let categoryButtonElement: HTMLElement;

    function positionDropdown() {
        if (categoryDropdownOpen && categoryButtonElement && categoryDropdown) {
            const rect = categoryButtonElement.getBoundingClientRect();
            categoryDropdown.style.top = `${rect.bottom + 4}px`;
            categoryDropdown.style.left = `${rect.left}px`;
        }
    }

    //onmount is iets wat svelte heel erg aanraad, want tis beter fzo
    onMount(() => {
        window.addEventListener("resize", positionDropdown);
    });

    onDestroy(() => {
        window.removeEventListener("resize", positionDropdown);
    });

    // Focus on input when modal opens
    $: if (isOpen && searchInputElement) {
        searchInputElement.focus();
    }

    $: currentCategory = getCategoryById(selectedCategory);

    // Update suggestions when input or category changes (reactive!)
    $: if (selectedCategory) {
        suggestions = getSuggestions(selectedCategory, searchInput);
    }

    function handleCategorySelect(category: SearchCategory, event: MouseEvent) {
        event.stopPropagation(); //stops it from closing the modal
        selectedCategory = category; // i love svelte, immediate reactivity
        categoryDropdownOpen = false;
        searchInput = ""; // i think this is more user friendly
    }

    function toggleCategoryDropdown(event: MouseEvent) {
        categoryDropdownOpen = !categoryDropdownOpen;
        if (categoryDropdownOpen) positionDropdown(); //places it in the right spot for a fixed display
    }

    function handleSuggestionClick(suggestion: string) {
        event.stopPropagation(); //otherwise the results modal immediately closes
        console.log(
            "Suggestion clicked: " +
                suggestion +
                ", Category:" +
                selectedCategory,
        );
        searchInput = suggestion; //bc of reactivity this is important

        //If it's a project name and we find an exact match, navigate directly
        if (selectedCategory === "projects") {
            const allProjects = loadAllProjects();
            const exactMatch = allProjects.find((p) => p.title === suggestion);
            if (exactMatch) {
                console.log("Direct navigation to project:", exactMatch.slug);
                // Import the router and navigate
                import("svelte-spa-router").then(({ push }) => {
                    push(`/${exactMatch.slug}`);
                });
                closeSearch();
                return;
            }
        }

        // Otherwise, perform search to show results
        performSearch(true);
    }

    function performSearch(exactMatch = false) {
        console.log(
            "Performing search for:",
            searchInput,
            "in category:",
            selectedCategory,
        );
        const trimmedInput = searchInput.trim();
        if (!trimmedInput) return;
        const results = searchProjects(selectedCategory, trimmedInput, {
            exactMatch,
        });
        dispatch("searchResults", results);
        closeSearch();
    }

    function closeSearch() {
        isOpen = false;
        searchInput = "";
    }

    function handleKeyDown(event: KeyboardEvent) {
        if (event.key === "Enter") {
            performSearch();
        } else if (event.key === "Escape") {
            closeSearch();
        }
    }

    function handleClickOutside(event: MouseEvent) {
        const target = event.target as HTMLElement;
        if (!target.closest(".search-container")) {
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
                        <svelte:component
                            this={currentCategory?.icon}
                            size="20"
                        />
                        <span class="category-label"
                            >{currentCategory?.label}</span
                        >
                        <ChevronDown
                            size={16}
                            class={categoryDropdownOpen ? "rotate" : ""}
                        />
                    </button>

                    {#if categoryDropdownOpen}
                        <div class="category-dropdown">
                            {#each SEARCH_CATEGORIES as category}
                                <button
                                    class="category-option"
                                    class:selected={category.id ===
                                        selectedCategory}
                                    on:click={(event) =>
                                        handleCategorySelect(
                                            category.id,
                                            event,
                                        )}
                                >
                                    <svelte:component
                                        this={category.icon}
                                        size="20"
                                    />
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
                        placeholder={`Search ${currentCategory?.label.toLowerCase()}...`}
                        class="search-input"
                    />
                </div>

                <button class="close-button" on:click={closeSearch}>
                    <X size={20} />
                </button>
            </div>

            {#if suggestions.length > 0}
                <div class="suggestions-container">
                    <div class="suggestions-header">
                        <span class="suggestions-title">Suggestions</span>
                        <span class="suggestions-count"
                            >{suggestions.length}</span
                        >
                    </div>
                    <div class="suggestions-list">
                        {#each suggestions as suggestion}
                            <button
                                class="suggestion-item"
                                on:click={() =>
                                    handleSuggestionClick(suggestion)}
                            >
                                <svelte:component
                                    this={currentCategory?.icon}
                                    size="20"
                                />
                                <span class="suggestion-text">{suggestion}</span
                                >
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
        background-color: var(--transparent-overlay);
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
        box-shadow: 0 20px 40px var(--box-shadow);
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
        align-items: stretch;
    }

    .category-selector {
        position: relative;
        height: auto;
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
        height: 100%;
    }

    .category-button.open {
        background-color: var(--hover-color);
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
        box-shadow: 0 4px 12px var(--box-shadow);
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

    .category-option.selected {
        background-color: var(--secondary-text-color);
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
        border-color: var(--secondary-text-color);
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
        scrollbar-color: var(--secondary-text-color) transparent;
        scrollbar-width: auto;
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

    @media (hover: hover) {
        /* hover styles only for non-touch devices */
        .category-button:hover {
            background-color: var(--hover-color);
        }

        .category-option:hover {
            background-color: var(--hover-color);
        }

        .close-button:hover {
            color: var(--primary-text-color);
            background-color: var(--hover-color);
        }
        .suggestion-item:hover {
            background-color: var(--hover-color);
        }
    }
</style>
