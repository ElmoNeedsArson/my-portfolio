<script lang="ts">
    import { location } from "svelte-spa-router";
        import {
            DEFAULT_TAB_ID,
            getTabIdByPath,
            lastVisitedTab,
            type TabId,
        } from "../lib/navigationStore";
    import Eindhoven from "./tabs/Eindhoven.svelte";
    import Experiments from "./tabs/Experiments.svelte";
    import Projects from "./tabs/Projects.svelte";

    // Determine page type based on current route or active tab
        $: pageType = (getTabIdByPath($location) ?? DEFAULT_TAB_ID) as TabId;
    
    $: isExperimentsPage = pageType === "experiments";
    $: isEindhovenPage = pageType === "eindhoven";
    $: isProjectsPage = pageType === "projects";

    // Update the last visited tab when navigating between tabs
    $: lastVisitedTab.set(pageType);
</script>

<main>
    <div class="container">
        {#if isEindhovenPage}
            <Eindhoven />
        {:else if isExperimentsPage}
            <Experiments />
        {:else if isProjectsPage}
            <Projects />
        {/if}
    </div>
</main>

<style>
    main {
        background-color: var(--background-color);
        color: var(--primary-text-color);
        padding: 1px;
    }

    .container {
        max-width: 80%;
        margin: 2rem auto;
    }
</style>