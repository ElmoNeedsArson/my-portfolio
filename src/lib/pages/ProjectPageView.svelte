<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { ArrowLeft, Home } from '@lucide/svelte';
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
  let projectMetadataTerms = $derived(getProjectMetadataTerms(project));
  let projectStructuredData = $derived(getProjectStructuredData(project, canonicalUrl, pageDescription, projectMetadataTerms));
  let topNavElement: HTMLElement | null = $state(null);
  let showFloatingNav = $state(false);

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

  onMount(() => {
    if (!topNavElement) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        showFloatingNav = !entry.isIntersecting;
      },
      { threshold: 0 }
    );

    observer.observe(topNavElement);
    return () => observer.disconnect();
  });

  function getTabLabel(project: Project, tabSlug: string | undefined): string | undefined {
    return getProjectTabBySlug(project, tabSlug)?.label;
  }

  function getPageDescription(project: Project, tabLabel: string | undefined): string {
    const fallback = project.shortDesc || 'Portfolio of Jesse Strijker.';
    const metadataTerms = getProjectMetadataTerms(project);
    const metadataSummary = metadataTerms.length ? ` Includes ${metadataTerms.slice(0, 10).join(', ')}.` : '';

    if (!tabLabel) {
      return `${fallback}${metadataSummary}`;
    }

    return `${tabLabel} for ${project.title}. ${fallback}${metadataSummary}`;
  }

  function getProjectMetadataTerms(project: Project) {
    return Array.from(new Set([...project.tags, ...project.languages, ...project.tools].filter(Boolean)));
  }

  function getProjectStructuredData(
    project: Project,
    canonicalUrl: string,
    pageDescription: string,
    metadataTerms: string[]
  ) {
    const data = {
      '@context': 'https://schema.org',
      '@type': 'CreativeWork',
      name: project.title,
      description: pageDescription,
      url: canonicalUrl,
      dateCreated: project.date,
      image: project.projectPageThumbnail?.src
        ? siteUrl(project.projectPageThumbnail.src)
        : project.thumbnail?.src
          ? siteUrl(project.thumbnail.src)
          : undefined,
      keywords: metadataTerms,
      about: project.tags.map((tag) => ({ '@type': 'Thing', name: tag })),
      mentions: [...project.languages, ...project.tools].map((term) => ({ '@type': 'Thing', name: term })),
    };

    return JSON.stringify(data).replace(/</g, '\\u003c');
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

  function handleHomeClick(event: MouseEvent) {
    event.preventDefault();
    window.sessionStorage.removeItem(canvasFullscreenRestoreKey);
    goto('/');
  }
</script>

<svelte:head>
  <title>{pageTitle}</title>
  <meta name="description" content={pageDescription} />
  <link rel="canonical" href={canonicalUrl} />
  {#each projectMetadataTerms as term}
    <meta property="article:tag" content={term} />
  {/each}
  <meta property="og:title" content={pageTitle} />
  <meta property="og:description" content={pageDescription} />
  <meta property="og:url" content={canonicalUrl} />
  <meta property="og:image" content={previewImageUrl} />
  <meta property="og:type" content="website" />
  <meta name="twitter:title" content={pageTitle} />
  <meta name="twitter:description" content={pageDescription} />
  <meta name="twitter:image" content={previewImageUrl} />
  <script type="application/ld+json">{@html projectStructuredData}</script>
</svelte:head>

<main>
  <ProjectOutline {project} contentOverride={activeContent} />
  <!-- {#if project.expertise && project.expertise.length > 0}
    <ExpertiseRadarChart {project} />
  {/if} -->

  {#if showFloatingNav}
    <nav class="project-floating-nav" aria-label="Project navigation">
      <button class="nav-icon-button" type="button" title="Home" aria-label="Go to homepage" onclick={handleHomeClick}>
        <Home size="20" aria-hidden="true" />
      </button>
      <button class="nav-icon-button" type="button" title="Back" aria-label="Go back" onclick={handleBackClick}>
        <ArrowLeft size="20" aria-hidden="true" />
      </button>
    </nav>
  {/if}

  <article class="project-page">
    <nav class="project-top-nav" bind:this={topNavElement} aria-label="Project navigation">
      <button class="nav-icon-button" type="button" title="Home" aria-label="Go to homepage" onclick={handleHomeClick}>
        <Home size="20" aria-hidden="true" />
      </button>
      <button class="nav-icon-button" type="button" title="Back" aria-label="Go back" onclick={handleBackClick}>
        <ArrowLeft size="20" aria-hidden="true" />
      </button>
    </nav>
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

  .project-top-nav,
  .project-floating-nav {
    display: flex;
    align-items: center;
    gap: 0.45rem;
  }

  .project-top-nav {
    margin-bottom: 2rem;
  }

  .project-floating-nav {
    position: fixed;
    top: 0;
    left: 5px;
    z-index: 100;
    padding: 1rem;
    color: var(--muted-color);
  }

  .nav-icon-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 34px;
    padding: 5px;
    border: none;
    border-radius: 6px;
    background: transparent;
    color: var(--muted-color);
    cursor: pointer;
    transition:
      color 0.2s ease,
      background-color 0.2s ease,
      transform 0.2s ease;
  }

  @media (hover: hover) {
    .nav-icon-button:hover {
      color: var(--secondary-text-color);
      background-color: var(--hover-color);
      transform: translateY(-1px);
    }
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
