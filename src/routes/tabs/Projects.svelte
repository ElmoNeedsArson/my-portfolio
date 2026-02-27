<script lang="ts">
    import ProjectCard from "../../components/ProjectCard.svelte";
    import type { Project } from "../../types";
    import { loadCardProjects } from "../../lib/searchUtils";

    let projects: Project[] = loadCardProjects();
</script>

<section class="grid">
    {#each projects as project}
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

<style>
    .grid {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr 1fr ;
        gap: 10px;
    }

    @media (max-width: 1500px) {
        .grid {
            grid-template-columns: 1fr 1fr 1fr;
        }
    }

    @media (max-width: 1150px) {
        .grid {
            grid-template-columns: 1fr 1fr;
        }
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

    @media (max-width: 768px) {
        .grid {
            grid-template-columns: 1fr;
        }
    }
</style>
