<script lang="ts">
  import { params, push } from "svelte-spa-router";
  import type { Project, ContentBlock } from "../types";
  import ProjectOutline from "../components/ProjectPageNavigator.svelte";
  import ExpertiseRadarChart from "../components/visualizations/ExpertiseRadarChart.svelte";
  import ProjectHero from "../components/project/ProjectHero.svelte";
  import ProjectTagList from "../components/project/ProjectTagList.svelte";
  import ProjectLanguagesTools from "../components/project/LanguagesTools.svelte";
  import ProjectTabs from "../components/project/ProjectTabs.svelte";
  import ContentRenderer from "../components/project/ContentRenderer.svelte";
  import { findProjectBySlug } from "../lib/searchUtils";
  import { lastVisitedTab } from "../lib/navigationStore";

  let slug: string = "";
  $: slug = $params?.slug ?? "";
  let project: Project | undefined;
  $: project = findProjectBySlug(slug);

  // Active content provided by ProjectTabs component
  let activeContent: ContentBlock | undefined;

  // Get the back URL based on the last visited tab
  $: backUrl =
    $lastVisitedTab === "experiments"
      ? "/experiments"
      : $lastVisitedTab === "eindhoven"
        ? "/eindhoven"
        : "/projects";

  // Handle back button functionality
  function handleBackClick(event: MouseEvent) {
    event.preventDefault();
    if (window.history.length > 1) {
      window.history.back();
    } else {
      push(backUrl);
    }
  }
</script>

<main>
  {#if project}
    <!-- Floating Components: Project outline/overview widget + radar chart -->
    <ProjectOutline {project} contentOverride={activeContent} />
    {#if project.expertise && project.expertise.length > 0}
      <ExpertiseRadarChart {project} />
    {/if}

    <article class="project-page">
      <button class="back" on:click={handleBackClick}>← Back</button>
      <h1>{project.title}</h1>
      <p class="date">{project.date}</p>

      <!-- Project hero image -->
      <ProjectHero thumbnail={project.projectPageThumbnail} title={project.title}/>

      <!-- Tag list, languages, tools, and optionally tabs -->
      <ProjectTagList tags={project.tags} />
      <ProjectLanguagesTools languages={project.languages} tools={project.tools}/>
      <ProjectTabs {project} onContentChange={(c) => (activeContent = c)}/>

      <!-- Actual content -->
      <ContentRenderer content={activeContent} />
    </article>
  {:else}
    <!-- Shown when no project matches the current url slug -->
    <p>Project not found.</p>
  {/if}
</main>

<style>
  main {
    background-color: var(--background-color);
    color: var(--primary-text-color);
    padding: 1px;
  }

  .project-page {
    max-width: 55%;
    margin: 2rem auto;
    padding: 0 1rem;
  }

  .back {
    display: inline-block;
    margin-bottom: 2rem;
    color: inherit;
    text-decoration: none;
    background: none;
    border: none;
    font: inherit;
    cursor: pointer;
    padding: 0;
  }

  .back:hover {
    text-decoration: underline;
  }

  .date {
    color: var(--muted-color);
    font-size: 0.9rem;
  }

  @media (max-width: 768px) {
    .project-page {
      max-width: 90%;
    }
  }
</style>