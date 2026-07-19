<script lang="ts">
  import { browser } from '$app/environment';
  import { afterNavigate } from '$app/navigation';
  import { page } from '$app/state';
  import '../app.css';
  import Footer from '$lib/components/SiteWideComponents/footer.svelte';
  import Header from '$lib/components/SiteWideComponents/header.svelte';
  import TabNavigation from '$lib/components/TabNavigation.svelte';
  import { isTabPath } from '$lib/navigationStore';

  let { children } = $props();

  const showTabNavigation = $derived(isTabPath(page.url.pathname));
  let trackedPageView = false;

  afterNavigate(({ to }) => {
    if (!browser || !to) return;

    window.scrollTo(0, 0);

    if (!trackedPageView && !sessionStorage.getItem('visited')) {
      trackedPageView = true;
      sessionStorage.setItem('visited', '1');
      fetch('/api/pageview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ route: to.url.pathname })
      }).catch(() => {});
    }
  });
</script>

<Header />
{#if showTabNavigation}
  <div class="nav-container">
    <TabNavigation />
  </div>
{/if}

{@render children()}

<Footer />

<style>
  .nav-container {
    max-width: 80%;
    margin: 6rem auto 0;
  }

  @media print {
    :global(header),
    :global(footer),
    .nav-container {
      display: none !important;
    }
  }
</style>
