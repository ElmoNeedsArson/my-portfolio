<script lang="ts">
  import ProjectBar from "../../components/ProjectBar.svelte";
  import type { Project } from "../../types";
  import {
    loadBarProjects,
    loadTwenteProjects,
    loadEindhovenProjects,
  } from "../../lib/searchUtils";

  let projects: Project[] = loadBarProjects();
  let twenteProjects: Project[] = loadTwenteProjects();
  let eindhovenProjects: Project[] = loadEindhovenProjects();
</script>

{#if projects.length > 0}
  <section class="experiments-list">
    <h2 class="subtitleElement">EXTRACURRICULAR PROJECTS</h2>
    {#each projects as project}
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
{/if}

{#if eindhovenProjects.length > 0}
  <section class="eindhoven-projects-list uni-projects-list">
    <h2 class="subtitleElement">EINDHOVEN - UNIVERSITY PROJECTS</h2>
    {#each eindhovenProjects as project}
      <div>
        <div>
          <ProjectBar {project} showDescription={true} />
        </div>
      </div>
    {/each}
  </section>
{/if}

{#if twenteProjects.length > 0}
  <section class="twente-projects-list uni-projects-list">
    <h2 class="subtitleElement">TWENTE - UNIVERSITY PROJECTS</h2>
    {#each twenteProjects as project}
      <div>
        <div>
          <ProjectBar {project} showDescription={true} />
        </div>
      </div>
    {/each}
  </section>
{/if}

<style>
  .experiments-list,
  .uni-projects-list {
    max-width: 100%;
    margin: 0 auto;
    padding-bottom: 2rem;
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

  .subtitleElement {
    padding: 10px 0px;
    font-size: 2rem;
    font-weight: 500;
    margin: 0px;
    margin-left: 2rem;
  }
</style>
