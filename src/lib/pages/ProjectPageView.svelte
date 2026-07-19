<script lang="ts">
  import { goto } from '$app/navigation';
  import type { Project, ContentBlock } from '$lib/types';
  import ProjectOutline from '$lib/components/ProjectPageNavigator.svelte';
  import ExpertiseRadarChart from '$lib/components/visualizations/ExpertiseRadarChart.svelte';
  import ProjectHero from '$lib/components/project/ProjectHero.svelte';
  import ProjectTagList from '$lib/components/project/ProjectTagList.svelte';
  import ProjectLanguagesTools from '$lib/components/project/LanguagesTools.svelte';
  import ProjectTabs from '$lib/components/project/ProjectTabs.svelte';
  import ContentRenderer from '$lib/components/project/ContentRenderer.svelte';
  import { getTabPathById, lastVisitedTab } from '../navigationStore';
  import { getProjectTabBySlug } from '$lib/projectTabs';
  import { siteUrl } from '$lib/siteConfig';

  type Props = {
    project: Project;
    initialTabId?: string;
  };

  let { project, initialTabId }: Props = $props();

  let activeContent: ContentBlock | undefined = $state();
  let backUrl = $derived(getTabPathById($lastVisitedTab));
  let canonicalUrl = $derived(siteUrl(`/${project.slug}${initialTabId ? `/${initialTabId}` : ''}`));
  let previewImageUrl = $derived(siteUrl('/logo.svg'));
  let tabLabel = $derived(getTabLabel(project, initialTabId));
  let pageTitle = $derived(tabLabel ? `${project.title} - ${tabLabel} | Jesse Strijker` : `${project.title} | Jesse Strijker`);
  let pageDescription = $derived(getPageDescription(project, tabLabel));

  const projectBackUrlStorageKey = 'project-page-back-url-v1';
  const canvasFullscreenRestoreKey = 'canvas-fullscreen-restore-v1';

  type ProjectBackTarget = {
    route: string;
    fullscreen: boolean;
  };

  function handleTabChange(tabId: string) {
    goto(`/${project.slug}/${tabId}`, {
      replaceState: true,
      noScroll: true
    });
  }

  function getTabLabel(project: Project, tabSlug: string | undefined): string | undefined {
    return getProjectTabBySlug(project, tabSlug)?.label;
  }

  function getPageDescription(project: Project, tabLabel: string | undefined): string {
    const fallback = project.shortDesc || 'Portfolio of Jesse Strijker.';

    if (!tabLabel) {
      return fallback;
    }

    return `${tabLabel} for ${project.title}. ${fallback}`;
  }

  function handleBackClick(event: MouseEvent) {
    event.preventDefault();

    const storedBackUrl = window.sessionStorage.getItem(projectBackUrlStorageKey);
    if (storedBackUrl) {
      window.sessionStorage.removeItem(projectBackUrlStorageKey);

      try {
        const parsed = JSON.parse(storedBackUrl) as Partial<ProjectBackTarget>;
        const targetRoute =
          typeof parsed.route === 'string' && parsed.route.startsWith('/')
            ? parsed.route
            : '/eindhoven';

        if (parsed.fullscreen === true) {
          window.sessionStorage.setItem(canvasFullscreenRestoreKey, '1');
        } else {
          window.sessionStorage.removeItem(canvasFullscreenRestoreKey);
        }

        goto(targetRoute);
        return;
      } catch {
        window.sessionStorage.removeItem(canvasFullscreenRestoreKey);
        goto('/eindhoven');
        return;
      }
    }

    if (window.history.length > 1) {
      window.history.back();
    } else {
      goto(backUrl);
    }
  }
</script>

<svelte:head>
  <title>{pageTitle}</title>
  <meta name="description" content={pageDescription} />
  <link rel="canonical" href={canonicalUrl} />
  <meta property="og:title" content={pageTitle} />
  <meta property="og:description" content={pageDescription} />
  <meta property="og:url" content={canonicalUrl} />
  <meta property="og:image" content={previewImageUrl} />
  <meta property="og:type" content="website" />
  <meta name="twitter:title" content={pageTitle} />
  <meta name="twitter:description" content={pageDescription} />
  <meta name="twitter:image" content={previewImageUrl} />
</svelte:head>

<main>
  <ProjectOutline {project} contentOverride={activeContent} />
  {#if project.expertise && project.expertise.length > 0}
    <ExpertiseRadarChart {project} />
  {/if}

  <article class="project-page">
    <button class="back" onclick={handleBackClick}>Back</button>
    <h1>{project.title}</h1>
    <p class="date">{project.date}</p>

    <ProjectHero
      thumbnail={project.projectPageThumbnail}
      title={project.title}
      thumbnailHeight={project.projectPageThumbnailHeight}
    />

    <ProjectTagList tags={project.tags} />
    <ProjectLanguagesTools languages={project.languages} tools={project.tools} />
    <ProjectTabs
      {project}
      {initialTabId}
      onContentChange={(content) => (activeContent = content)}
      onTabChange={handleTabChange}
    />

    <ContentRenderer
      content={activeContent}
      statsProject={project.slug === 'obsidian-plugin' || project.slug === 'portfolio-website-svelte' ? project : undefined}
    />
  </article>
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

  .back::before {
    content: '<- ';
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
