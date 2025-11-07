<script lang="ts">
    // Header component script with search functionality
    // - Imports icons from lucide and the project logo asset
    // - Imports the shared `darkMode` store so we can read/update global theme state
    // - Manages search modal state and results display
    import { Linkedin, Github, Moon, Sun, Search } from "@lucide/svelte";
    import logo from "../assets/logos/logoJS.svg";
    import { darkMode } from '../lib/darkModeStore';
    import SearchModal from './SearchModal.svelte';
    import SearchResults from './SearchResults.svelte';
    import type { SearchResult } from '../lib/searchUtils';
    import { subscribeToSearchResults, closeSearchResults } from '../lib/searchNavigation';
    import { onDestroy } from 'svelte';

    // State variables for managing search functionality
    let showSearchModal = false;    // Controls when the search modal is visible
    let showSearchResults = false;  // Controls when the results modal is visible
    let searchResult: SearchResult | null = null; // Stores the search results data

    // Subscribe to global search navigation events
    // This allows other components (ProjectCard, Project page) to trigger search results
    const unsubscribe = subscribeToSearchResults((result, show) => {
        searchResult = result;
        showSearchResults = show;
        if (show) {
            showSearchModal = false; // Close search modal if results are being shown
        }
    });

    // Clean up subscription when component is destroyed
    onDestroy(() => {
        unsubscribe();
    });

    // Simple click handler used for the social icon buttons (placeholder)
    const handleClick = () => {
        console.log("Icon clicked");
    };

    // Toggle the global dark mode store. Other components subscribed to the store
    // will react automatically when this updates.
    function toggleDarkMode() {
        darkMode.update(v => !v);
    }

    /**
     * Open the search modal
     * Prevents event bubbling to avoid immediate closure by click-outside handlers
     */
    function openSearch(event: MouseEvent) {
        event.stopPropagation(); // Prevent the click from bubbling up
        showSearchModal = true;
    }

    /**
     * Handle keyboard shortcuts for opening search
     * Supports Ctrl+K and Ctrl+/ (common search shortcuts)
     */
    function handleKeydown(event: KeyboardEvent) {
        // Check for Ctrl+K or Ctrl+/ (or Cmd on Mac)
        if ((event.ctrlKey || event.metaKey) && (event.key === 'k' || event.key === '/')) {
            event.preventDefault(); // Prevent default browser behavior
            showSearchModal = true; // Open search modal
        }
    }

    /**
     * Handle search results from the SearchModal component
     * This is called when user performs a search in the modal
     */
    function handleSearchResults(event: CustomEvent<SearchResult>) {
        searchResult = event.detail;    // Store the search results
        showSearchModal = false;        // Close the search modal
        showSearchResults = true;       // Show the results modal
    }

    /**
     * Close the search modal (called when user cancels search)
     */
    function handleSearchClose() {
        showSearchModal = false;
    }

    /**
     * Close the results modal (called when user closes results)
     */
    function handleResultsClose() {
        closeSearchResults(); // Use global function to close results
    }

    /**
     * Go back from results to search modal (allows user to refine search)
     */
    function handleBackToSearch() {
        showSearchResults = false;  // Hide results
        showSearchModal = true;     // Show search modal again
    }
</script>

<!--
  Header markup
  - Shows a small logo on the left and action icons on the right
  - The mode toggle button reads `$darkMode` (auto-subscription) to pick the icon
-->
<header>
    <!-- Brand/logo -->
    <!-- <img src={logo} alt="Logo" /> -->

    <!-- Right-side controls: search, social icons + theme toggle -->
    <div class="icons">
        <!-- Search button -->
        <button class="icon search-button" on:click={openSearch} title="Search projects (Ctrl+K)">
            <Search />
        </button>
        
        <button class="icon" on:click={handleClick}>
            <Linkedin />
        </button>
        <button class="icon" on:click={handleClick}>
            <Github />
        </button>
        <div class="divider"></div>

        <!-- Toggle the global theme. We read $darkMode to render the correct icon. -->
        <button class="mode-toggle" on:click={toggleDarkMode}>
            {#if $darkMode}
                <Sun />
            {:else}
                <Moon />
            {/if}
        </button>
    </div>
</header>

<!-- Search Modal -->
<SearchModal 
    bind:isOpen={showSearchModal}
    on:searchResults={handleSearchResults}
    on:close={handleSearchClose}
/>

<!-- Global keyboard event listener for search shortcuts -->
<svelte:window on:keydown={handleKeydown} />

<!--
  Header markup
  - Shows a small logo on the left and action icons on the right
  - The mode toggle button reads `$darkMode` (auto-subscription) to pick the icon
  - Includes search functionality with keyboard shortcuts
-->
<header>
    <!-- Brand/logo -->
    <!-- <img src={logo} alt="Logo" /> -->

    <!-- Right-side controls: search, social icons + theme toggle -->
    <div class="icons">
        <!-- Search button - opens search modal, supports Ctrl+K shortcut -->
        <button class="icon search-button" on:click={openSearch} title="Search projects (Ctrl+K)">
            <Search />
        </button>
        
        <!-- Social media links (placeholder functionality) -->
        <button class="icon" on:click={handleClick}>
            <Linkedin />
        </button>
        <button class="icon" on:click={handleClick}>
            <Github />
        </button>
        
        <!-- Visual separator -->
        <div class="divider"></div>

        <!-- Toggle the global theme. We read $darkMode to render the correct icon. -->
        <button class="mode-toggle" on:click={toggleDarkMode}>
            {#if $darkMode}
                <Sun />
            {:else}
                <Moon />
            {/if}
        </button>
    </div>
</header>

<!-- 
  Search Modal Component
  - Appears when user clicks search button or uses keyboard shortcut
  - Handles category selection (projects, tags, languages, tools)
  - Shows real-time suggestions as user types
  - Dispatches search results when user selects/searches
-->
<SearchModal 
    bind:isOpen={showSearchModal}
    on:searchResults={handleSearchResults}
    on:close={handleSearchClose}
/>

<!-- 
  Search Results Modal Component
  - Shows filtered projects based on search criteria
  - Only visible when search results are available
  - Allows navigation to individual projects
  - Provides option to go back and refine search
-->
{#if showSearchResults && searchResult}
    <SearchResults 
        {searchResult}
        on:close={handleResultsClose}
        on:backToSearch={handleBackToSearch}
    />
{/if}

<style>
    header {
        position: fixed;
        top: 0px;
        right: 5px;
        z-index: 100;
        display: flex;
        align-items: center;
        padding: 1rem;
        /* background-color: var(--background-color); */
        background-color: transparent;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        margin: 0px;
        color: var(--primary-text-color);
        /* border-bottom: solid 1px var(--border-color); */
    }

    /* img {
        height: 30px;
        margin-right: 1rem;
    } */

    .icons {
        display: flex;
        align-items: center;
        margin-left: auto;
        color: var(--muted-color);
    }

    .icon {
        background-color: transparent;
        border: none;
        /* box-shadow: none; */
        color: var(--muted-color);
        padding: 5px;
    }

    .icon:hover {
        color: var(--secondary-text-color);
        cursor: pointer;
    }

    .search-button {
        margin-right: 0.5rem;
    }

    .search-button:hover {
        color: var(--accent-color);
        transform: scale(1.05);
    }

    .divider {
        display: inline-block;
        width: 1px; /* thickness of the line */
        height: 24px; /* match your icons' height */
        /* background-color: var(--muted-color); */
        background-color: var(--secondary-text-color);
        margin: 0 0.5rem; /* spacing around the divider */
        vertical-align: middle; /* align with buttons */
    }

    .mode-toggle {
        padding: 5px;
        background-color: transparent;
        border: none;
        color: var(--muted-color);
        align-items: center;
        align-self: center;
        align-content: center;
        justify-content: center;
        justify-items: center;
        justify-self: center;
    }

    .mode-toggle:hover {
        color: var(--secondary-text-color);
        cursor: pointer;
    }
</style>
