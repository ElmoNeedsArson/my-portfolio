<script lang="ts">
    import { location } from "svelte-spa-router";
    import SvelteSeo from "svelte-seo";
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

    const tabTitles: Record<TabId, string> = {
        projects: "Projects | Jesse Strijker",
        experiments: "Experiments | Jesse Strijker",
        eindhoven: "Eindhoven | Jesse Strijker",
    };
    const tabDescriptions: Record<TabId, string> = {
        projects: "Selected projects by Jesse Strijker in creative technology, interaction design, and software development.",
        experiments: "Experiments and side projects by Jesse Strijker.",
        eindhoven: "Eindhoven University of Technology work by Jesse Strijker.",
    };

    $: title = tabTitles[pageType] ?? "Jesse Strijker | Portfolio";
    $: description = tabDescriptions[pageType] ?? "Portfolio of Jesse Strijker.";
</script>

<SvelteSeo
    {title}
    {description}
    openGraph={{
        title,
        description,
        url: "https://portfolio.jessestrijker.com/",
        type: "website",
    }}
/>

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