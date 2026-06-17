<script lang="ts">
    import { Linkedin, Github, Moon, Sun, Search } from "@lucide/svelte";
    import { darkMode } from "../../lib/darkModeStore";
    import SearchModal from "./../SearchModal.svelte";
    import SearchResults from "./../SearchResults.svelte";
    import type { SearchResult } from "../../lib/searchUtils";
    import {
        searchResultStore,
        showSearchResultsStore,
        closeSearchResults,
    } from "../../lib/searchNavigation";

    let showSearchModal = false; 
    $: if ($showSearchResultsStore) {
        showSearchModal = false; 
    }

    const handleClick = (url: string) => {
        window.open(url, "_blank");
    };

    function toggleDarkMode() {
        darkMode.update((v) => !v);
    }

    function openSearch(event: MouseEvent) {
        event.stopPropagation();
        showSearchModal = true;
    }

    function handleKeydown(event: KeyboardEvent) {
        // Check for Ctrl+K or Ctrl+/
        if (
            (event.ctrlKey || event.metaKey) &&
            (event.key === "k" || event.key === "/")
        ) {
            event.preventDefault(); 
            showSearchModal = true;
        }
    }

    function handleSearchResults(event: CustomEvent<SearchResult>) {
        searchResultStore.set(event.detail);
        showSearchModal = false; 
        showSearchResultsStore.set(true); 
    }

    function handleResultsClose() {
        //console.log("Closing search results");
        closeSearchResults(); 
    }

    function handleBackToSearch() {
        //console.log("Going back to search modal");
        showSearchResultsStore.set(false); 
        showSearchModal = true; 
    }
</script>

<header>

    <div class="icons">
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

        <button class="mode-toggle" on:click={toggleDarkMode}>
            {#if $darkMode}
                <Sun />
            {:else}
                <Moon />
            {/if}
        </button>
    </div>
</header>

<SearchModal
    bind:isOpen={showSearchModal}
    on:searchResults={handleSearchResults}
/>

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
        background-color: transparent;
        margin: 0px;
        color: var(--primary-text-color);
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
