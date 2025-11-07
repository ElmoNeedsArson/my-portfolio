<script>
  import Router from "svelte-spa-router";
  import Home from "./routes/Home.svelte";
  import Project from "./routes/Project.svelte";

  // Route table: root renders the Home page, /project/:slug renders a Project page
  const routes = {
    "/": Home,
    "/:slug": Project,
  };
</script>

<Router {routes} />