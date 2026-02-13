<script>
  import Router from "svelte-spa-router";
  import Home from "./routes/Home.svelte";
  import Project from "./routes/ProjectPage.svelte";
  import Header from "./components/SiteWideComponents/header.svelte";
  import Footer from "./components/SiteWideComponents/footer.svelte";
  import TabNavigation from "./components/TabNavigation.svelte";
  import Dock from "./components/overlay.svelte";
  import { useTabNavigation } from "./lib/navigationStore";
  import { location } from "svelte-spa-router";

  // Route table: specific routes first, then catch-all for projects
  const routes = {
    "/": Home,
    "/projects": Home,
    "/experiments": Home,
    "/eindhoven": Home,
    "/:slug": Project,
  };

  // Control navigation style based on current route
  $: {
    const isHomePage = $location === "/" || 
                      $location === "/projects" || 
                      $location === "/experiments" || 
                      $location === "/eindhoven";
    $useTabNavigation = isHomePage;
  }

  // Scroll to top on route change
  $: if ($location) {
    window.scrollTo(0, 0);
  }

  // Manual toggle for dock (set to false to disable dock completely)
  const showDock = false;
</script>

<Header />
{#if $useTabNavigation}
  <div class="nav-container">
    <TabNavigation />
  </div>
{/if}
<Router {routes} />
<Footer />
{#if showDock}
  <Dock />
{/if}

<style>
  .nav-container {
    max-width: 80%;
    margin: 6rem auto 0; /* push down beneath header area */
  }

  /* Hide header and navigation in print when canvas is fullscreen */
  @media print {
    :global(header),
    :global(footer),
    .nav-container {
      display: none !important;
    }
  }
</style>