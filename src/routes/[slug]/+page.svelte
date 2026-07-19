<script lang="ts">
  import ProjectPageView from '$lib/pages/ProjectPageView.svelte';

  let { data } = $props();
</script>

<ProjectPageView project={data.project} />
