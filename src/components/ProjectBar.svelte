<script lang="ts">
  import type { Project } from "../types";
  import { link } from "svelte-spa-router";
  import { Pin } from "@lucide/svelte";
  import { createEventDispatcher } from "svelte";

  export let project: Project;
  export let showPinIcon: boolean = true;
  export let showDescription: boolean = true;

   const dispatch = createEventDispatcher<{
    cardClick: void;
  }>();

  function handleCardClick() {
    dispatch("cardClick");
  }
</script>

<a
  href={`/${project.slug}`}
  use:link
  class="project-bar"
  on:click={handleCardClick}
>
  <div class="bar-content">
    <div class="bar-left">
      {#if project.pinned && showPinIcon}
        <div class="pinIcon">
          <Pin />
        </div>
      {/if}
      <div class="bar-title">
        {project.title.toLocaleUpperCase()}
      </div>
      <div class="bar-shortdesc">
        {#if project.shortDesc && showDescription}
          {project.shortDesc}
        {/if}
      </div>
    </div>
    <div class="bar-date">
      {project.date.slice(0, 7)}
    </div>
  </div>
</a>

<style>
  .project-bar {
    display: block;
    text-decoration: none;
    /* background: rgba(255, 255, 255, 0.05); */
    background: var(--bar-background-color);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 1rem 2rem;
    margin-bottom: 0.75rem;
    transition: all 0.3s ease;
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
  }

  .project-bar:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.2);
    transform: translateY(-2px);
    box-shadow: 0 8px 32px rgba(255, 255, 255, 0.1);
  }

  .bar-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    flex-wrap: nowrap;
  }

  .bar-left {
    display: flex;
    align-items: center;
    gap: 20px;
    min-width: 0;
    flex: 1 1 auto;
    overflow: hidden;
  }

  .pinIcon {
    color: var(--muted-color);
  }

  .bar-title {
    font-size: 1.7rem;
    font-weight: 600;
    color: var(--primary-text-color);
    white-space: nowrap;
    flex-shrink: 0;
  }

  .bar-shortdesc {
    font-size: 1.2rem;
    color: var(--muted-color);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1 1 auto;
    min-width: 0;
  }

  .bar-date {
    font-size: 1rem;
    color: var(--muted-color);
    font-weight: 400;
    margin-left: 2rem;
    white-space: nowrap;
    flex-shrink: 0;
  }

  /* Mobile responsiveness */
  @media (max-width: 768px) {
    .project-bar {
      padding: 1.2rem 1.5rem;
    }

    .bar-content {
      flex-wrap: nowrap;
      align-items: flex-start;
      gap: 0.5rem;
    }

    .bar-title {
      font-size: 1.3rem;
    }

    .bar-date {
      margin-left: 0;
      font-size: 0.9rem;
    }
  }

  @media (max-width: 480px) {
    .project-bar {
      padding: 1rem;
    }

    .bar-title {
      font-size: 1.1rem;
    }

    .bar-date {
      font-size: 0.8rem;
    }
  }
</style>
