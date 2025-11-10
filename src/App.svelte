<script>
  import Router from "svelte-spa-router";
  import Home from "./routes/Home.svelte";
  import Project from "./routes/Project.svelte";
  import Header from "./components/header.svelte";
  import Footer from "./components/footer.svelte";
  import TabNavigation from "./components/TabNavigation.svelte";
  import { useTabNavigation } from "./lib/navigationStore";

  // Route table: specific routes first, then catch-all for projects
  const routes = {
    "/": Home,
    "/projects": Home,
    "/experiments": Home,
    "/eindhoven": Home,
    "/:slug": Project,
  };
</script>

<Header />
{#if $useTabNavigation}
  <div class="nav-container">
    <TabNavigation />
  </div>
{/if}
<Router {routes} />
<Footer />

<style>
  .nav-container {
    max-width: 80%;
    margin: 6rem auto 0; /* push down beneath header area */
  }
</style>