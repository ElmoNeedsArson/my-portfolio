<script lang="ts">
  import type { Project } from "../types";
  import { darkMode } from "../lib/darkModeStore";
  import { navigateToSearch } from "../lib/searchNavigation";
  import { link } from "svelte-spa-router";

  export let project: Project;

  // Helpers: thumbnails may be a string or an object { src, alt, caption }
  function getSrc(img?: { src?: string }) {
    return img?.src;
  }

  //reactive meaning if anything on the right side changes, it updates
  //If either darkmode is true, or if there is no light thumbnail, use default, otherwise use the light one
  $: selectedThumb =
    $darkMode || !project.thumbnailLight
      ? project.thumbnail
      : project.thumbnailLight;
  $: console.log(
    "Selected thumbnail for project",
    project.title,
    "is",
    selectedThumb,
  );
  $: imageUrl = getSrc(selectedThumb) ?? "";

  function handleTagClick(event: MouseEvent, tag: string) {
    event.preventDefault(); //even though stoppropagation is called, this ensures the link is not followed
    event.stopPropagation();
    navigateToSearch(tag, "tags");
  }
</script>

<!-- <a href={`/${project.slug}`} use:link> -->
  <article class="card">
    <!-- background image container; `imageUrl` is reactive to theme changes -->
    <div class="card-bg" style="background-image: url('{imageUrl}')">
      <span class="date">{project.date.slice(0, 4)}</span>

      <div class="tags">
        {#each project.tags.slice(0, 3) as tag}
          <button class="tag" on:click={(e) => handleTagClick(e, tag)}>
            {tag}
          </button>
        {/each}
      </div>
      <div class="overlay-content">
        <h2>{project.title}</h2>
      </div>
    </div>
  </article>
<!-- </a> -->

<style>
  .card {
    position: relative;
    border-radius: 1rem;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
    overflow: hidden;
    text-decoration: none;
    color: var(--primary-text-color);
    transition:
      transform 0.2s ease,
      box-shadow 0.2s ease;
    cursor: pointer;
    background: #222;
    border: solid 2px var(--border-color);
  }

  a {
    text-decoration: none;
    color: inherit;
  }

  .card-bg {
    width: 100%;
    aspect-ratio: 1 / 1;
    background-size: cover;
    background-position: center;
    position: relative;
    display: flex;
    align-items: flex-end;
  }

  .overlay-content {
    width: 100%;
    padding: 1.2rem 1.4rem 1.4rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  h2 {
    font-size: 1.1rem;
    margin: 0;
    font-weight: 600;
    color: var(--primary-text-color);
    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.7);
  }

  .date {
    color: var(--muted-color);
    text-shadow: 0 1px 4px rgba(0, 0, 0, 0.7);
    font-weight: 500;
    font-size: 1.2rem;
    position: absolute;
    top: 8px;
    right: 12px;
  }

  .tags {
    position: absolute;
    bottom: 8px;
    right: 12px;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    align-items: flex-end;
  }

  .tag {
    background: rgba(255, 255, 255, 0.15);
    border-radius: 999px;
    padding: 0.2rem 0.6rem;
    font-size: 0.75rem;
    text-transform: lowercase;
    color: var(--primary-text-color);
    /* text-shadow: 0 1px 4px rgba(0, 0, 0, 0.7); */
    border: 1px solid rgba(255, 255, 255, 0.2);
    cursor: pointer;
    transition: background-color 0.2s ease;
    font-family: inherit;
  }

  @media (hover: hover) {
    /* hover styles only for non-touch devices */
    .tag:hover {
      background: rgba(255, 255, 255, 0.3);
      transform: scale(1.05);
    }

    .card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 18px rgba(0, 0, 0, 0.1);
      border: solid 2px var(--secondary-text-color);
    }
  }
</style>
