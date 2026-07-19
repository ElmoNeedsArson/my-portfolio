<script lang="ts">
  import { lastVisitedTab, type TabId } from '../navigationStore';
  import CV from '$lib/pages/tabs/CV.svelte';
  import Eindhoven from '$lib/pages/tabs/Eindhoven.svelte';
  import ProjectArchive from '$lib/pages/tabs/ProjectArchive.svelte';
  import Projects from '$lib/pages/tabs/Projects.svelte';
  import { siteUrl } from '$lib/siteConfig';

  type Props = {
    tab: TabId;
  };

  let { tab }: Props = $props();

  const tabTitles: Record<TabId, string> = {
    projects: 'Highlights | Jesse Strijker',
    projectArchive: 'Projects | Jesse Strijker',
    cv: 'CV | Jesse Strijker',
    eindhoven: 'Eindhoven | Jesse Strijker'
  };

  const tabDescriptions: Record<TabId, string> = {
    projects: 'Selected projects by Jesse Strijker in creative technology, interaction design, and software development.',
    projectArchive: 'Project archive by Jesse Strijker, covering creative technology, interaction design, software, and experiments.',
    cv: 'Curriculum vitae of Jesse Strijker, covering education, experience, publications, skills, and contact details.',
    eindhoven: 'Eindhoven University of Technology work by Jesse Strijker.'
  };

  const canonicalPaths: Record<TabId, string> = {
    projects: '/highlights',
    projectArchive: '/projects',
    cv: '/cv',
    eindhoven: '/eindhoven'
  };

  let title = $derived(tabTitles[tab] ?? 'Jesse Strijker | Portfolio');
  let description = $derived(tabDescriptions[tab] ?? 'Portfolio of Jesse Strijker.');
  let canonicalUrl = $derived(siteUrl(canonicalPaths[tab] ?? '/highlights'));
  let previewImageUrl = $derived(siteUrl('/logo.svg'));

  $effect(() => {
    lastVisitedTab.set(tab);
  });
</script>

<svelte:head>
  <title>{title}</title>
  <meta name="description" content={description} />
  <link rel="canonical" href={canonicalUrl} />
  <meta property="og:title" content={title} />
  <meta property="og:description" content={description} />
  <meta property="og:url" content={canonicalUrl} />
  <meta property="og:image" content={previewImageUrl} />
  <meta property="og:type" content="website" />
  <meta name="twitter:title" content={title} />
  <meta name="twitter:description" content={description} />
  <meta name="twitter:image" content={previewImageUrl} />
</svelte:head>

<main>
  <div class="container">
    {#if tab === 'cv'}
      <CV />
    {:else if tab === 'eindhoven'}
      <Eindhoven />
    {:else if tab === 'projectArchive'}
      <ProjectArchive />
    {:else}
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
