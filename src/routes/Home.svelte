<script lang="ts">
    import { ToyBrick, Pin, MapPin } from "@lucide/svelte";
    import ProjectCard from "../components/ProjectCard.svelte";
    import ProjectBar from "../components/ProjectBar.svelte";
    import { link, location } from "svelte-spa-router";
    import type { Project } from "../types";
    import {
        loadCardProjects,
        loadBarProjects,
        loadOldProjects,
    } from "../lib/searchUtils";
    import { fade } from "svelte/transition";
    import { onMount } from "svelte";
    import { useTabNavigation, lastVisitedTab } from "../lib/navigationStore";
    import Eindhoven from "./Eindhoven.svelte";

    // Determine page type based on current route or active tab
    $: isExperimentsPage = $location === "/experiments";
    $: isEindhovenPage = $location === "/eindhoven";
    $: isProjectsPage = $location === "/projects" || $location === "/";
    $: pageType = isExperimentsPage
        ? "experiments"
        : isEindhovenPage
          ? "eindhoven"
          : "projects";
    $: pageTitle = isExperimentsPage
        ? "EXPERIMENTS"
        : isEindhovenPage
          ? "EINDHOVEN"
          : "PROJECTS";
    $: IconComponent = isExperimentsPage
        ? Pin
        : isEindhovenPage
          ? MapPin
          : ToyBrick;

    // Only update the last visited tab when we're actually on a tab page (not on a project page)
    $: {
        const isOnTabPage =
            isExperimentsPage || isEindhovenPage || isProjectsPage;
        if (isOnTabPage && pageType) {
            console.log(`[Home] setting last visited tab to ${pageType}`);
            lastVisitedTab.set(pageType);
        }
    }

    // Load appropriate projects based on page type
    let projects: Project[] = [];
    let old_Uni_Projects: Project[] = [];
    let allProjects: Project[] = [];
    let oldProjects: Project[] = [];

    // Reactive statement to load projects when page type changes
    $: {
        if (isExperimentsPage) {
            projects = loadBarProjects();
            oldProjects = loadOldProjects();
        } else if (isEindhovenPage) {
            projects = []; // Eindhoven has no projects, just placeholder content
        } else {
            projects = loadCardProjects();
        }
    }

    // Debug: log page mapping when location changes
    $: if ($location !== undefined) {
        console.debug("[Home] route changed", {
            location: $location,
            pageType,
        });
    }

    console.log(`[Home] Loaded ${pageType}:`, projects);
</script>

<main>
    <div class="container">
        {#if !$useTabNavigation}
            <!-- Traditional Title Container -->
            <div class="titleContainer">
                <div class="pageTitle">
                    <div class="titleIcon">
                        {#key pageType}
                            <svelte:component
                                this={IconComponent}
                                size="48"
                                class="titleElement"
                            />
                        {/key}
                    </div>
                    {#key pageType}
                        <h2 class="titleElement">
                            {pageTitle}
                        </h2>
                    {/key}
                </div>
            </div>
        {/if}

        {#if isEindhovenPage}
            <!-- Eindhoven content -->
            <!-- <section class="experiments-list">
                {#if projects.length === 0}
                    <div class="no-content">
                        <p>Welcome to the Eindhoven section.</p>
                        <p>This page is currently under construction.</p>
                        
                    </div>
                {/if}
            </section> -->
            <Eindhoven />
        {:else if isExperimentsPage}
            <!-- Experiments list -->
            <section class="experiments-list">
                {#each projects as project, i}
                    <div>
                        <ProjectBar {project} showDescription={true} />
                    </div>
                {/each}

                {#if projects.length === 0}
                    <div class="no-content">
                        <p>No experiments available yet. Check back soon!</p>
                    </div>
                {/if}
            </section>
            {#if oldProjects.length > 0}
                <section class="old-projects-list">
                    <h2 class="subtitleElement">TWENTE - UNIVERSITY PROJECTS</h2>
                    {#each oldProjects as project, i}
                        <div>
                            <div>
                                <ProjectBar {project} showDescription={true} />
                            </div>
                        </div>
                    {/each}
                </section>
            {/if}
        {:else}
            <!-- Projects grid -->
            <section class="grid">
                {#each projects as project, i}
                    <div>
                        <ProjectCard {project} />
                    </div>
                {/each}

                {#if projects.length === 0}
                    <div class="no-content">
                        <p>No projects available yet. Check back soon!</p>
                    </div>
                {/if}
            </section>
        {/if}
    </div>
</main>

<style>
    main {
        background-color: var(--background-color);
        color: var(--primary-text-color);
        padding: 1px;
        /* min-height: 100vh; */
    }

    .container {
        max-width: 80%;
        margin: 2rem auto;
    }

    .grid {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        gap: 10px;
    }

    .experiments-list {
        max-width: 100%;
        margin: 0 auto;
        padding-bottom: 2rem; /* Space for dock */
    }

    .no-content {
        text-align: center;
        padding: 4rem 2rem;
        color: var(--muted-color);
        font-size: 1.2rem;
    }

    .no-content p {
        font-size: 1.2rem;
        margin-bottom: 1rem;
        line-height: 1.6;
    }

    /* removed unused .transition-placeholder and .loading-indicator */

    @keyframes spin {
        0% {
            transform: rotate(0deg);
        }
        100% {
            transform: rotate(360deg);
        }
    }

    .titleContainer {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 20px;
    }

    .pageTitle {
        display: block;
        margin-top: 10vh;
        margin-bottom: 20px;
        display: flex;
        align-items: center;
        letter-spacing: 0.1rem;
        border-bottom: 2px solid var(--secondary-text-color);
    }

    .titleElement {
        padding: 10px;
        font-size: 3rem;
        font-weight: 500;
        margin: 0px;
    }

    .subtitleElement {
        padding: 10px 0px;
        font-size: 2rem;
        font-weight: 500;
        margin: 0px;
        margin-left: 2rem;
    }

    .titleIcon {
        color: var(--muted-color);
    }

    @media (max-width: 768px) {
        .grid {
            grid-template-columns: 1fr;
        }
    }
</style>
