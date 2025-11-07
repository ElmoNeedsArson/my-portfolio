<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { X, ArrowLeft, Search } from "@lucide/svelte";
    import { link } from "svelte-spa-router";
    import ProjectCard from "./ProjectCard.svelte";
    import type { SearchResult } from "../lib/searchUtils";
    import { getCategoryById } from "../lib/searchCategories";
    import ResultsHeader from "./SearchResults/ResultsHeader.svelte";
    import ResultsContent from "./SearchResults/ResultsContent.svelte";

    const dispatch = createEventDispatcher<{
        close: void;
        backToSearch: void;
    }>();
    export let searchResult: SearchResult; // Search results data
    function handleClose() {dispatch("close");}
    function handleBackToSearch() {dispatch("backToSearch");}

    function handleClickOutside(event: MouseEvent) {
        const target = event.target as HTMLElement;
        if (!target.closest(".results-container")) { handleClose(); }
    }
</script>

<svelte:window on:click={handleClickOutside} />

<div class="results-overlay">
    <div class="results-container">
        <ResultsHeader
            {searchResult}
            on:close={handleClose}
            on:backToSearch={handleBackToSearch}
        />

        <ResultsContent
            {searchResult}
            on:close={handleClose}
            on:backToSearch={handleBackToSearch}
        />
    </div>
</div>

<style>
    .results-overlay {
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

    .results-container {
        background-color: var(--background-color);
        border: 1px solid var(--border-color);
        border-radius: 12px;
        width: 100%;
        max-width: 1200px;
        max-height: 90vh;
        box-shadow: 0 20px 40px var(--box-shadow);
        display: flex;
        flex-direction: column;
        overflow: hidden;
    }

    @media (max-width: 768px) {
        .results-overlay {
            padding: 1rem;
        }
    } 
</style>