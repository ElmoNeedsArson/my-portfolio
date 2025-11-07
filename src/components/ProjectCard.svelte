<script lang="ts">
  // ProjectCard component
  // - Receives a `project` prop containing metadata loaded from a JSON file
  // - Subscribes to the global `darkMode` store to pick the appropriate image
  // The reactive statement below updates `imageUrl` whenever $darkMode or the
  // `project` object changes.
  import type { Project } from "../types";
  import { darkMode } from "../lib/darkModeStore";
  export let project: Project;

  // Helpers: thumbnails may be a string or an object { src, alt, caption }
  function getSrc(img: string | { src?: string } | undefined) {
    if (!img) return undefined;
    return typeof img === "string" ? img : img.src;
  }

  // If a light-mode thumbnail is provided (project.thumbnailLight) and the app
  // is currently in light mode, use it; otherwise use the default `thumbnail`.
  $: selectedThumb =
    $darkMode || !project.thumbnailLight
      ? project.thumbnail
      : project.thumbnailLight;
  $: imageUrl = getSrc(selectedThumb) ?? "";
</script>

<!--
  Card layout
  - The image is applied as a CSS background on `.card-bg` so we can overlay
  - content (title, date, tags) on top of it. The overlay sits at the bottom
  - of the card to match the requested design.
-->
<article class="card">
  <!-- background image container; `imageUrl` is reactive to theme changes -->
  <div class="card-bg" style="background-image: url('{imageUrl}')">
    <span class="date">{project.date.slice(0, 4)}</span>

    <div class="tags">
      {#each project.tags.slice(0, 3) as tag}
        <span class="tag">{tag}</span>
      {/each}
    </div>
    <!-- overlay that contains meta (date + tags) and the title -->
    <div class="overlay-content">
      <div class="meta"></div>
      <h2>{project.title}</h2>
    </div>
  </div>
</article>

<style>
  .card {
    position: relative;
    border-radius: 1rem;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
    overflow: hidden;
    text-decoration: none;
    color: #fff;
    transition:
      transform 0.2s ease,
      box-shadow 0.2s ease;
    cursor: pointer;
    background: #222;
    border: solid 2px var(--border-color);
  }

  .card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 18px rgba(0, 0, 0, 0.1);
    border: solid 2px var(--secondary-text-color);
  }

  .card-bg {
    width: 100%;
    aspect-ratio: 1 / 1;
    background-size: cover;
    background-position: center;
    position: relative;
    display: flex;
    align-items: flex-end;
    /* min-height: 300px; */
  }

  .overlay-content {
    width: 100%;
    /* background: linear-gradient(
      0deg,
      rgba(0, 0, 0, 0.7) 70%,
      rgba(0, 0, 0, 0.2) 100%,
      rgba(0, 0, 0, 0) 100%
    ); */
    padding: 1.2rem 1.4rem 1.4rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  h2 {
    font-size: 1.1rem;
    margin: 0;
    font-weight: 600;
    color: #fff;
    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.7);
  }

  .meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.8rem;
    margin-bottom: 0.3rem;
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

  /* .tags {
    display: flex;
    gap: 0.3rem;
  } */

  .tags {
    position: absolute;
    bottom: 8px; /* just below the date */
    right: 12px;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    align-items: flex-end; /* keep them aligned with the right edge */
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
  }

  @media (hover: hover) {
    .tag:hover {
      background: rgba(255, 255, 255, 0.3);
    }
  }
</style>
