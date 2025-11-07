<script lang="ts">
  import { params, link } from "svelte-spa-router";
  import type { Project } from "../types";
  import Header from "../components/header.svelte";
  import Footer from "../components/footer.svelte";

  // same import as i do in home.svelte
  const jsonModules = import.meta.glob("../projects/*/*.json", {
    eager: true,
  }) as Record<string, { default: Project }>;

  // Reactive slug value derived from the router params. `$params` is provided
  // by svelte-spa-router and is reactive.
  let slug: string = "";
  $: slug = $params?.slug ?? "";

  // Reactive project lookup: map modules to their `.default` exports and find
  // the one that matches the current slug.
  let project: Project | undefined;
  $: project = Object.values(jsonModules)
    .map((m) => m.default)
    .find((p) => p.slug === slug);

  function getSrc(img: string | { src?: string } | undefined) {
    if (!img) return undefined;
    return typeof img === "string" ? img : img.src;
  }

  function getAlt(img: string | { alt?: string } | undefined, fallback = "") {
    if (!img) return fallback;
    return typeof img === "string" ? fallback : (img.alt ?? fallback);
  }

  function getCaption(img: string | { caption?: string } | undefined) {
    if (!img || typeof img === "string") return undefined;
    return img.caption;
  }

  function getGalleryData(
    gallery:
      | string[]
      | { src: string }[]
      | { images: any[]; caption?: string }
      | undefined,
  ) {
    if (!gallery) return { images: [], caption: undefined };
    if (Array.isArray(gallery)) return { images: gallery, caption: undefined };
    if ("images" in gallery) return gallery;
    return { images: [], caption: undefined };
  }
</script>

<Header />
<main>
  {#if project}
    <!-- Project detail layout. Renders when a matching project is found. -->
    <article class="project-page">
      <!-- Back link to the list page -->
      <a href="/" class="back" use:link>← Back</a>
      <h1>{project.title}</h1>
      <p class="date">{project.date}</p>

      <!-- Project hero image (uses the default thumbnail) -->
      <div class="thumbnail">
        <img
          src={getSrc(project.thumbnail)}
          alt={getAlt(project.thumbnail, project.title)}
        />
        {#if getCaption(project.thumbnail)}
          <p class="caption">{getCaption(project.thumbnail)}</p>
        {/if}
      </div>

      <!-- Tag list -->
      <div class="tags">
        {#each project.tags as tag}
          <span class="tag">{tag}</span>
        {/each}
      </div>

      <!-- Content sections: overview, key features, and any additional sections -->
      <div class="content">
        <p class="overview">{project.content.overview}</p>

        <h2>Key Features</h2>
        <ul class="features">
          {#each project.content.keyFeatures as feature}
            <li>{feature}</li>
          {/each}
        </ul>

        {#each project.content.sections as section}
          <h2>{section.title}</h2>

          {#if section.text}
            <p>{section.text}</p>
          {/if}

          {#if section.image}
            <div class="image-container">
              <img
                src={getSrc(section.image)}
                alt={getAlt(section.image, section.title)}
              />
              {#if getCaption(section.image)}
                <p class="caption">{getCaption(section.image)}</p>
              {/if}
            </div>
          {/if}

          {#if section.gallery}
            {@const galleryData = getGalleryData(section.gallery)}
            <div class="gallery">
              {#each galleryData.images as img}
                <div class="gallery-item">
                  <img src={getSrc(img)} alt={getAlt(img, section.title)} />
                  {#if getCaption(img)}
                    <p class="caption">{getCaption(img)}</p>
                  {/if}
                </div>
              {/each}
              {#if galleryData.caption}
                <p class="gallery-caption">{galleryData.caption}</p>
              {/if}
            </div>
          {/if}
        {/each}
      </div>
    </article>
  {:else}
    <!-- Shown when no project matches the current slug -->
    <p>Project not found.</p>
  {/if}
</main>
<Footer />

<style>
  main {
    background-color: var(--background-color);
    color: var(--primary-text-color);
    padding: 1px;
  }

  .project-page {
    max-width: 80%;
    margin: 2rem auto;
    padding: 0 1rem;
  }

  img {
    max-width: 100%;
  }

  .back {
    display: inline-block;
    margin-bottom: 2rem;
    color: inherit;
    text-decoration: none;
  }

  .date {
    color: var(--muted-color);
    font-size: 0.9rem;
  }

  .tags {
    display: flex;
    gap: 0.5rem;
    margin: 1rem 0;
  }

  .tag {
    background: transparent;
    padding: 0.2rem 0.6rem;
    border-radius: 999px;
    font-size: 0.8rem;
    outline: var(--border-color) 1px solid;
  }

  .content {
    margin-top: 2rem;
    line-height: 1.6;
  }

  .overview {
    font-size: 1.1rem;
    color: var(--muted-color);
    margin-bottom: 2rem;
  }

  h2 {
    margin: 2rem 0 1rem;
    font-size: 1.5rem;
  }

  .features {
    list-style: disc;
    padding-left: 1.5rem;
    margin: 1rem 0;
  }

  .features li {
    margin: 0.5rem 0;
  }

  .gallery {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    margin-top: 1rem;
  }

  .gallery-item {
    max-width: 200px;
    width: 100%;
  }

  .gallery img {
    width: 100%;
    height: auto;
    object-fit: cover;
    border-radius: 6px;
  }

  .caption {
    font-size: 0.9rem;
    color: var(--muted-color);
    margin-top: 0.5rem;
    text-align: center;
  }

  .gallery-caption {
    width: 100%;
    text-align: center;
    margin-top: 1rem;
    font-style: italic;
    color: var(--muted-color);
  }

  .image-container {
    margin: 1rem 0;
  }

  .thumbnail {
    margin: 1rem 0;
  }
</style>
