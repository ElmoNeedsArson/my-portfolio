<script lang="ts">
  import type { Project } from "../types";
  import { darkMode } from "../lib/darkModeStore";
  import { navigateToSearch } from "../lib/searchNavigation";
  import { CloudDownload, Pin } from "@lucide/svelte";
  import { link } from "svelte-spa-router";
  import { createEventDispatcher, onMount, tick } from "svelte";

  export let project: Project;
  export let showPinIcon: boolean = true;

  const dispatch = createEventDispatcher<{
    cardClick: void;
  }>();

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
  $: imageFilter = selectedThumb?.invert ? "invert(0.9)" : "none";

  let liveInstallations: number | null = null;
  let metaRowElement: HTMLDivElement | null = null;
  let tagsElement: HTMLDivElement | null = null;
  let counterElement: HTMLDivElement | null = null;
  let fullCounterMeasureElement: HTMLSpanElement | null = null;
  let showDownloadWord = true;

  $: isObsidian3DPlugin = project.slug === "obsidian-plugin";
  $: displayInstallations =
    isObsidian3DPlugin && liveInstallations !== null
      ? liveInstallations
      : project.installations;
  $: hasInstallations = typeof displayInstallations === "number";
  $: installationCount = hasInstallations
    ? displayInstallations.toLocaleString()
    : "";

  function updateDownloadWordVisibility() {
    if (
      !hasInstallations ||
      !metaRowElement ||
      !tagsElement ||
      !fullCounterMeasureElement
    ) {
      showDownloadWord = true;
      return;
    }

    const rowStyles = getComputedStyle(metaRowElement);
    const rowGap = Number.parseFloat(rowStyles.columnGap || rowStyles.gap || "0") || 0;

    const tags = Array.from(tagsElement.querySelectorAll<HTMLElement>(".tag"));
    const tagsWidth = tags.reduce((sum, tag) => sum + tag.offsetWidth, 0);
    const tagsGap = tags.length > 1 ? (tags.length - 1) * 6.4 : 0;

    const fullCounterWidth = 14 + 5.6 + fullCounterMeasureElement.offsetWidth;
    const requiredWidth = tagsWidth + tagsGap + rowGap + fullCounterWidth;

    showDownloadWord = metaRowElement.clientWidth >= requiredWidth;
  }

  $: if (hasInstallations) {
    tick().then(updateDownloadWordVisibility);
  }

  onMount(() => {
    if (!isObsidian3DPlugin) {
      return;
    }

    let isDisposed = false;

    const loadInstallations = async () => {
      try {
        const response = await fetch("/api/obsidian-downloads");
        if (!response.ok) {
          return;
        }

        const payload = await response.json();
        const downloads = payload?.downloads;

        if (
          !isDisposed &&
          typeof downloads === "number" &&
          Number.isFinite(downloads) &&
          downloads > 0
        ) {
          liveInstallations = downloads;
        }
      } catch {
        // keep JSON fallback when API is unavailable
      }
    };

    loadInstallations();

    const resizeObserver = new ResizeObserver(() => {
      updateDownloadWordVisibility();
    });

    if (metaRowElement) {
      resizeObserver.observe(metaRowElement);
    }

    if (tagsElement) {
      resizeObserver.observe(tagsElement);
    }

    return () => {
      isDisposed = true;
      resizeObserver.disconnect();
    };
  });

  function handleTagClick(event: MouseEvent, tag: string) {
    event.preventDefault();
    event.stopPropagation();
    navigateToSearch(tag, "tags");
  }

  function handleCardClick() {
    dispatch("cardClick");
  }
</script>

<a href={`/${project.slug}`} use:link on:click={handleCardClick}>
  <article class="card">
    <div class="card-bg">
      <div
        class="card-image"
        style="background-image: url('{imageUrl}'); filter: {imageFilter};"
        aria-hidden="true"
      ></div>
      <span class="date">{project.date.slice(0, 4)}</span>

      <div class="overlay-content">
        <h1>{project.title}</h1>
        <div class="meta-row" bind:this={metaRowElement}>
          <div class="tags" bind:this={tagsElement}>
            {#each project.tags.slice(0, 3) as tag}
              <button class="tag" on:click={(e) => handleTagClick(e, tag)}>
                {tag}
              </button>
            {/each}
          </div>
          {#if hasInstallations}
            <div
              class="installation-counter"
              aria-label="Project installations"
              bind:this={counterElement}
            >
              <CloudDownload size={14} />
              <span class="installation-counter-text">
                <span>{installationCount}</span>
                {#if showDownloadWord}
                  <span>downloads</span>
                {/if}
              </span>
              <span
                class="installation-counter-measure"
                aria-hidden="true"
                bind:this={fullCounterMeasureElement}
              >
                {installationCount} downloads
              </span>
            </div>
          {/if}
        </div>
      </div>
      {#if project.pinned && showPinIcon}
        <div class="pinIcon">
          <Pin />
        </div>
      {/if}
    </div>
  </article>
</a>

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
    position: relative;
    display: flex;
    align-items: flex-end;
  }

  .card-image {
    position: absolute;
    inset: 0;
    background-size: cover;
    background-position: center;
    z-index: 0;
  }

  .overlay-content {
    width: 100%;
    padding: 1.2rem 12px 12px 12px;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    position: relative;
    z-index: 1;
    background: linear-gradient(
      in oklch,
      transparent 0%,
      oklch(25.5% 0.021 279.29) 100%
    );
  }

  h1 {
    font-size: 2.6rem;
    margin: 0;
    font-weight: 800;
    /* color: var(--primary-text-color); */
    color: #ffffff;
    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.7);
  }

  .date {
    /* color: var(--muted-color); */
    color: #a1a4aa;
    text-shadow: 0 1px 4px rgba(0, 0, 0, 0.7);
    font-weight: 500;
    font-size: 1.2rem;
    position: absolute;
    top: 8px;
    right: 12px;
    z-index: 1;
  }

  .tags {
    display: flex;
    flex-direction: row;
    gap: 0.4rem;
    align-items: center;
    min-width: 0;
    flex-wrap: wrap;
    flex: 1 1 auto;
  }

  .meta-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    width: 100%;
    min-width: 0;
  }

  .pinIcon {
    position: absolute;
    top: 8px;
    left: 12px;
    /* color: var(--muted-color); */
    color: #a1a4aa;
    z-index: 1;
  }

  .tag {
    background: rgba(255, 255, 255, 0.15);
    border-radius: 999px;
    padding: 0.2rem 0.6rem;
    font-size: 0.75rem;
    /* text-transform: lowercase; */
    /* color: var(--primary-text-color); */
    color: #ffffff;
    /* text-shadow: 0 1px 4px rgba(0, 0, 0, 0.7); */
    border: 1px solid rgba(255, 255, 255, 0.2);
    cursor: pointer;
    transition: background-color 0.2s ease;
    font-family: inherit;
  }

  .installation-counter {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    color: var(--secondary-text-color);
    font-size: 0.82rem;
    text-shadow: 0 1px 4px rgba(0, 0, 0, 0.7);
    width: fit-content;
    margin-left: auto;
    white-space: nowrap;
    line-height: 1.1;
    flex: 0 1 auto;
    min-width: 0;
    position: relative;
  }

  .installation-counter-text {
    display: inline-flex;
    align-items: baseline;
    gap: 0.2rem;
    text-align: right;
    white-space: nowrap;
  }

  .installation-counter-measure {
    position: absolute;
    visibility: hidden;
    pointer-events: none;
    white-space: nowrap;
    height: 0;
    overflow: hidden;
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
