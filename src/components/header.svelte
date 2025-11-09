<script lang="ts">
    import { Linkedin, Github, Moon, Sun, Search } from "@lucide/svelte";
    import { darkMode } from "../lib/darkModeStore";
    import SearchModal from "./SearchModal.svelte";
    import SearchResults from "./SearchResults.svelte";
    import type { SearchResult } from "../lib/searchUtils";
    import {
        searchResultStore,
        showSearchResultsStore,
        closeSearchResults,
    } from "../lib/searchNavigation";
    import { fade, scale, fly } from "svelte/transition";

    // State variables for managing search functionality
    let showSearchModal = false; // Controls when the search modal is visible

    // Reactive statements using Svelte store subscriptions with $ syntax
    // These automatically update when the stores change
    $: if ($showSearchResultsStore) {
        showSearchModal = false; // Close search modal if results are being shown
    }

    // Simple click handler used for the social icon buttons (placeholder)
    const handleClick = (url: string) => {
        window.open(url, "_blank");
    };

    // Toggle the global dark mode store. Other components subscribed to the store
    // will react automatically when this updates.
    function toggleDarkMode() {
        darkMode.update((v) => !v);
    }

    function openSearch(event: MouseEvent) {
        event.stopPropagation(); // Prevent the click from bubbling up
        showSearchModal = true;
    }

    function handleKeydown(event: KeyboardEvent) {
        // Check for Ctrl+K or Ctrl+/ (or Cmd on Mac)
        if (
            (event.ctrlKey || event.metaKey) &&
            (event.key === "k" || event.key === "/")
        ) {
            event.preventDefault(); // Prevent default browser behavior
            showSearchModal = true; // Open search modal
        }
    }

    function handleSearchResults(event: CustomEvent<SearchResult>) {
        searchResultStore.set(event.detail); // Store the search results
        showSearchModal = false; // Close the search modal
        showSearchResultsStore.set(true); // Show the results modal
    }

    function handleResultsClose() {
        console.log("Closing search results");
        closeSearchResults(); // Use global function to close results
    }

    function handleBackToSearch() {
        console.log("Going back to search modal");
        showSearchResultsStore.set(false); // Hide results
        showSearchModal = true; // Show search modal again
    }
</script>

<header>
    <!-- Brand/logo -->
    <!-- <img src={logo} alt="Logo" /> -->

    <!-- Right-side controls: search, social icons + theme toggle -->
    <div class="icons">
        <!-- Search button -->
        <button
            class="icon search-button"
            on:click={openSearch}
            title="Search projects (Ctrl+K)"
        >
            <Search />
        </button>

        <button
            class="icon"
            on:click={() =>
                handleClick("https://www.linkedin.com/in/jesse-strijker/")}
        >
            <Linkedin />
        </button>
        <button
            class="icon"
            on:click={() => handleClick("https://github.com/ElmoNeedsArson")}
        >
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
/>

<!-- Global keyboard event listener for search shortcuts -->
<svelte:window on:keydown={handleKeydown} />

{#if $showSearchResultsStore && $searchResultStore}
    <SearchResults
        searchResult={$searchResultStore}
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
        /* box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); */
        margin: 0px;
        color: var(--primary-text-color);
        /* border-bottom: solid 1px var(--border-color); */
    }

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

    .search-button {
        margin-right: 0.5rem;
    }

    .divider {
        display: inline-block;
        width: 1px;
        height: 24px;
        background-color: var(--secondary-text-color);
        margin: 0 0.5rem;
        vertical-align: middle;
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

    @media (hover: hover) {
        /* hover styles only for non-touch devices */
        .icon:hover {
            color: var(--secondary-text-color);
            cursor: pointer;
        }
        .search-button:hover {
            color: var(--secondary-text-color);
            transform: scale(1.05);
        }
        .mode-toggle:hover {
            color: var(--secondary-text-color);
            cursor: pointer;
        }
    }
</style>
