<script lang="ts">
    import Header from "../components/header.svelte";
    import Footer from "../components/footer.svelte";
    import { ToyBrick } from "@lucide/svelte";
    import ProjectCard from "../components/ProjectCard.svelte";
    import { link } from "svelte-spa-router";
    import type { Project } from "../types";
    import { loadAllProjects } from "../lib/searchUtils";

    // Load all projects using the shared utility function
    const projects: Project[] = loadAllProjects();

    console.log("Loaded projects:", projects);
    console.table(projects);
</script>

<Header />
<main>
    <div class="container">
        <div class="titleContainer">
            <div class="pageTitle">
                <div class="titleIcon">
                    <ToyBrick size="48" class="titleElement" />
                </div>
                <h2 class="titleElement">PROJECTS</h2>
            </div>
        </div>
        <!-- Projects grid: each project becomes a linked ProjectCard -->
        <section class="grid">
            {#each projects as project}
                <a href={`/${project.slug}`} use:link>
                    <ProjectCard {project} />
                </a>
            {/each}
        </section>
    </div>
</main>
<Footer />

<style>
    main {
        background-color: var(--background-color);
        color: var(--primary-text-color);
        padding: 1px;
        min-height: 100vh;
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

    .titleIcon {
        color: var(--muted-color);
    }
</style>
