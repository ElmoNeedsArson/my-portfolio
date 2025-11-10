<script lang="ts">
    import Header from "../components/header.svelte";
    import Footer from "../components/footer.svelte";
    import { FlaskConical } from "@lucide/svelte";
    import ProjectBar from "../components/ProjectBar.svelte";
    import type { Project } from "../types";
    import { loadBarProjects } from "../lib/searchUtils";
    import { fade, scale } from "svelte/transition";
    import { onMount } from "svelte";

    // Load bar-type projects for experiments
    let projects: Project[] = [];
    let allProjects: Project[] = loadBarProjects();

    onMount(() => {
        // simulate delayed appearance (could be replaced with real async load)
        setTimeout(() => {
            projects = allProjects;
        }, 50);
    });

    console.log("Loaded experiment projects:", projects);
</script>

<Header />
<main>
    <div class="container">
        <div class="titleContainer">
            <div class="pageTitle">
                <div class="titleIcon">
                    <FlaskConical size="48" class="titleElement" />
                </div>
                <h2 class="titleElement">EXPERIMENTS</h2>
            </div>
        </div>
        <!-- Experiments list: each bar-type project becomes a ProjectBar -->
        <section class="experiments-list">
            {#each projects as project, i}
                <div in:scale={{ start: 0.7, delay: i * 100, duration: 500 }}>
                    <div in:fade={{ delay: i * 100, duration: 500 }}>
                        <ProjectBar {project} />
                    </div>
                </div>
            {/each}
            
            {#if projects.length === 0}
                <div class="no-experiments" in:fade={{ delay: 200, duration: 500 }}>
                    <p>No experiments available yet. Check back soon!</p>
                </div>
            {/if}
        </section>
    </div>
</main>
<Footer />

<style>
    main {
        background-color: var(--background-color);
        color: var(--primary-text-color);
        padding: 1px;
    }

    .container {
        max-width: 55%;
        margin: 2rem auto;
        padding: 0 1rem;
        min-height: calc(100vh - 200px);
    }

    .titleContainer {
        margin-bottom: 3rem;
        text-align: center;
    }

    .pageTitle {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 1rem;
        margin-top: 2rem;
    }

    .titleIcon {
        display: flex;
        align-items: center;
        color: var(--muted-color);
    }

    .titleElement {
        color: var(--primary-text-color);
    }

    h2 {
        font-size: 2.5rem;
        font-weight: 700;
        margin: 0;
        letter-spacing: 0.1em;
        color: var(--primary-text-color);
    }

    .experiments-list {
        max-width: 100%;
        margin: 0 auto;
        padding-bottom: 6rem; /* Space for dock */
    }

    .no-experiments {
        text-align: center;
        padding: 4rem 2rem;
        color: var(--muted-color);
        font-size: 1.2rem;
    }

    /* Mobile responsiveness */
    @media (max-width: 768px) {
        .container {
            max-width: 90%;
            padding: 0 1rem;
        }

        h2 {
            font-size: 2rem;
        }

        .titleIcon :global(.titleElement) {
            width: 36px;
            height: 36px;
        }

        .experiments-list {
            padding-bottom: 5rem;
        }
    }

    @media (max-width: 480px) {
        .container {
            max-width: 95%;
        }

        .pageTitle {
            gap: 0.5rem;
        }

        h2 {
            font-size: 1.5rem;
        }

        .titleIcon :global(.titleElement) {
            width: 32px;
            height: 32px;
        }

        .no-experiments {
            padding: 3rem 1rem;
            font-size: 1rem;
        }
    }
</style>