<script lang="ts">
  import { params, link } from "svelte-spa-router";
  import type {
    Project,
    GalleryObject,
    ImageObject,
    VideoObject,
    MediaObject,
  } from "../types";
  import Header from "../components/header.svelte";
  import Footer from "../components/footer.svelte";
  import Dock from "../components/Dock.svelte";
  import ProjectOutline from "../components/ProjectOutline.svelte";
  import { navigateToSearch } from "../lib/searchNavigation";
  import { findProjectBySlug } from "../lib/searchUtils";
  import { getCategoryById } from "../lib/searchCategories";

  // Reactive slug value derived from the router params. `$params` is provided
  // by svelte-spa-router and is reactive.
  let slug: string = "";
  $: slug = $params?.slug ?? "";

  // Reactive project lookup using the shared utility function
  let project: Project | undefined;
  $: project = findProjectBySlug(slug);

  // Get category icons
  const languagesCategory = getCategoryById("languages");
  const toolsCategory = getCategoryById("tools");
  const tagsCategory = getCategoryById("tags");

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

  // URL utility functions
  function isYouTubeUrl(url: string): boolean {
    return /(?:youtube\.com\/watch\?v=|youtu\.be\/)/.test(url);
  }

  function getYouTubeEmbedUrl(url: string): string {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    return match ? `https://www.youtube.com/embed/${match[1]}` : url;
  }

  function isVideoFile(url: string): boolean {
    return /\.(mp4|webm|ogg|mov|avi|mkv)$/i.test(url);
  }

  // Utility functions for media objects (images or videos)
  function isVideoObject(media: MediaObject): media is VideoObject {
    // Check if it has video-specific properties
    const hasVideoProps =
      "autoplay" in media ||
      "loop" in media ||
      "muted" in media ||
      "controls" in media;
    
    // Check if it's a YouTube URL or local video file
    const isVideo = isYouTubeUrl(media.src) || isVideoFile(media.src);
    
    return hasVideoProps || isVideo;
  }

  function getGalleryData(
    gallery: MediaObject[] | GalleryObject | undefined,
  ): GalleryObject {
    if (!gallery) return { media: [], caption: undefined, columns: 2 };

    if (Array.isArray(gallery)) {
      return {
        media: gallery,
        caption: undefined,
        columns: 2,
      };
    }

    // Here gallery is a GalleryObject
    return {
      media: gallery.media ?? [],
      caption: gallery.caption,
      columns: gallery.columns ?? 2,
    };
  }

  function handleTagClick(event: MouseEvent, tag: string) {
    event.stopPropagation();
    navigateToSearch(tag, "tags");
  }

  function handleLanguageClick(event: MouseEvent, language: string) {
    event.stopPropagation();
    navigateToSearch(language, "languages");
  }

  function handleToolClick(event: MouseEvent, tool: string) {
    event.stopPropagation();
    navigateToSearch(tool, "tools");
  }

  /**
   * Process text with HTML links and convert line breaks
   * Allows direct HTML <a> tags in JSON content while preserving line breaks
   */
  function renderTextWithLinks(text: string): string {
    // Convert \n line breaks to <br> tags for proper display
    return text.replace(/\n/g, "<br>");
  }
</script>

<Header />
<main>
  {#if project}
    <!-- Project outline component -->
    <ProjectOutline {project} />

    <!-- Project detail layout. Renders when a matching project is found. -->
    <article class="project-page">
      <!-- Back link to the list page -->
      <a href="/" class="back" use:link>← Back</a>
      <h1>{project.title}</h1>
      <p class="date">{project.date}</p>

      <!-- Project hero image (uses the default thumbnail) -->
      {#if project.projectPageThumbnail}
        <div class="thumbnail">
          <img
            src={getSrc(project.projectPageThumbnail)}
            alt={getAlt(project.projectPageThumbnail, project.title)}
          />
          {#if getCaption(project.projectPageThumbnail)}
            <p class="caption">{getCaption(project.projectPageThumbnail)}</p>
          {/if}
        </div>
      {/if}

      <!-- Tag list -->
      {#if project.tags.length > 0}
        <div class="tags">
          {#each project.tags as tag}
            <button class="tag" on:click={(e) => handleTagClick(e, tag)}>
              <svelte:component this={tagsCategory.icon} size="14" />
              {tag}
            </button>
          {/each}
        </div>
      {/if}

      <!-- Languages and Tools -->
      {#if project.languages.length > 0 || project.tools.length > 0}
        <div class="meta-info">
          {#if project.languages.length > 0}
            <div class="languages">
              <h3>Languages</h3>
              <div class="chips">
                {#each project.languages as language}
                  <button
                    class="chip language-chip"
                    on:click={(e) => handleLanguageClick(e, language)}
                  >
                    <svelte:component this={languagesCategory.icon} size="16" />
                    {language}
                  </button>
                {/each}
              </div>
            </div>
          {/if}
          {#if project.tools.length > 0}
            <div class="tools">
              <h3>Tools</h3>
              <div class="chips">
                {#each project.tools as tool}
                  <button
                    class="chip tool-chip"
                    on:click={(e) => handleToolClick(e, tool)}
                  >
                    <svelte:component this={toolsCategory.icon} size="16" />
                    {tool}
                  </button>
                {/each}
              </div>
            </div>
          {/if}
        </div>
      {/if}

      <!-- Content sections: overview, key features, and any additional sections -->
      <div class="content">
        {#if project.content.overview}
          <div id="overview" class="overview-text">
            {@html renderTextWithLinks(project.content.overview)}
          </div>
        {/if}

        {#if project.content.keyFeatures.length > 0}
          <h2 id="key-features">Key Features</h2>
          <ul class="features">
            {#each project.content.keyFeatures as feature}
              <li>{feature}</li>
            {/each}
          </ul>
        {/if}

        {#each project.content.sections as section, index}
          {#if section.title}
            <h2 id="section-{index}"># {section.title}</h2>
          {/if}

          {#if section.subtitle}
            <h4 id="section-subtitle-{index}"># {section.subtitle}</h4>
          {/if}

          {#if section.text}
            <div class="section-text">
              {@html renderTextWithLinks(section.text)}
            </div>
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

          {#if section.video}
            <div class="video-container">
              {#if isYouTubeUrl(section.video.src)}
                <!-- YouTube iframe -->
                <iframe
                  src={getYouTubeEmbedUrl(section.video.src)}
                  title={section.video.caption || section.title || "Video"}
                  allowfullscreen
                  frameborder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                ></iframe>
              {:else}
                <!-- Regular video element for local files -->
                <video
                  src={section.video.src}
                  autoplay={section.video.autoplay}
                  loop={section.video.loop}
                  muted={section.video.muted}
                  controls={section.video.controls}
                  playsinline
                >
                  Your browser does not support the video tag.
                </video>
              {/if}
              {#if section.video.caption}
                <p class="caption">{section.video.caption}</p>
              {/if}
            </div>
          {/if}

          {#if section.gallery}
            {@const galleryData = getGalleryData(section.gallery)}
            <div
              class="gallery"
              style={`grid-template-columns: repeat(${galleryData.columns ?? 2}, 1fr);`}
            >
              {#each galleryData.media as item}
                <div class="gallery-item">
                  {#if isVideoObject(item)}
                    {#if isYouTubeUrl(item.src)}
                      <!-- YouTube iframe -->
                      <iframe
                        src={getYouTubeEmbedUrl(item.src)}
                        title={item.caption || section.title || "Video"}
                        allowfullscreen
                        frameborder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      ></iframe>
                    {:else}
                      <!-- Regular video element for local files -->
                      <video
                        src={item.src}
                        autoplay={item.autoplay}
                        loop={item.loop}
                        muted={item.muted}
                        controls={item.controls ?? true}
                        playsinline
                      >
                        Your browser does not support the video tag.
                      </video>
                    {/if}
                  {:else}
                    <!-- Image element for local images -->
                    <img src={item.src} alt={getAlt(item, section.title)} />
                  {/if}
                  {#if item.caption}
                    <p class="caption">{item.caption}</p>
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
<Dock />

<style>
  main {
    background-color: var(--background-color);
    color: var(--primary-text-color);
    padding: 1px;
  }

  .project-page {
    max-width: 55%;
    margin: 2rem auto;
    padding: 0 1rem;
  }

  .thumbnail {
    justify-self: center;
  }

  img,
  video,
  iframe {
    max-width: 100%;
  }

  iframe {
    width: 100%;
    border-radius: 6px;
    aspect-ratio: 16 / 9;
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
    flex-wrap: wrap;
    gap: 0.5rem;
    margin: 1rem 0;
  }

  .tag {
    background: transparent;
    padding: 0.2rem 0.6rem;
    border-radius: 999px;
    font-size: 0.8rem;
    outline: var(--border-color) 1px solid;
    border: none;
    color: var(--primary-text-color);
    cursor: pointer;
    font-family: inherit;
    transition: all 0.2s ease;
    align-items: center;
    display: flex;
    gap: 4px;
  }

  .meta-info {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
    margin: 2rem 0;
  }

  .languages,
  .tools {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .languages h3,
  .tools h3 {
    margin: 0;
    font-size: 1rem;
    color: var(--secondary-text-color);
    font-weight: 600;
  }

  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .chip {
    background: var(--secondary-background-color);
    border: 1px solid var(--border-color);
    border-radius: 6px;
    padding: 0.4rem 0.75rem;
    font-size: 0.85rem;
    color: var(--primary-text-color);
    cursor: pointer;
    font-family: inherit;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  @media (hover: hover) {
    /* hover styles only for non-touch devices */
    .tag:hover {
      background: var(--hover-color);
      transform: translateY(-1px);
    }

    .chip:hover {
      background: var(--hover-color);
      border-color: var(--secondary-text-color);
      transform: translateY(-1px);
    }

    .language-chip:hover {
      border-color: #61dafb; /* Blue for languages */
    }

    .tool-chip:hover {
      border-color: #ff6b35; /* Orange for tools */
    }
  }

  @media (max-width: 768px) {
    .meta-info {
      grid-template-columns: 1fr;
      gap: 1.5rem;
    }
  }

  .content {
    /* margin-top: 2rem; */
    line-height: 1.6;
  }

  .overview-text {
    font-size: 1.1rem;
    color: var(--muted-color);
    margin-bottom: 2rem;
  }

  .section-text {
    line-height: 1.6;
    margin-bottom: 1rem;
  }

  /* Style for links within text content */
  .overview-text :global(a),
  .section-text :global(a) {
    color: var(--secondary-text-color);
    text-decoration: none;
    border-bottom: 1px solid transparent;
    transition: border-color 0.2s ease;
  }

  .overview-text :global(a:hover),
  .section-text :global(a:hover) {
    border-bottom-color: var(--secondary-text-color);
  }

  /* Ensure paragraphs from markdown have proper spacing */
  .overview-text :global(p),
  .section-text :global(p) {
    margin: 1rem 0;
  }

  .overview-text :global(p:first-child),
  .section-text :global(p:first-child) {
    margin-top: 0;
  }

  .overview-text :global(p:last-child),
  .section-text :global(p:last-child) {
    margin-bottom: 0;
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
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    margin-top: 1rem;
    align-items: stretch; /* key: make each cell stretch equally tall */
  }

  .gallery-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    overflow: hidden;
    border-radius: 6px;
  }

  .gallery-item img,
  .gallery-item video,
  .gallery-item iframe {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    border-radius: 6px;
  }

  .gallery-item iframe {
    object-fit: unset; /* iframes don't need object-fit */
  }

  .caption {
    font-size: 0.9rem;
    color: var(--muted-color);
    margin-top: 0.5rem;
    text-align: center;
    margin-bottom: 0.5rem;
    /* padding: 0 0.5rem 0.75rem; */
  }

  .gallery-caption {
    width: 100%;
    text-align: center;
    margin-top: 1rem;
    font-style: italic;
    color: var(--muted-color);
    grid-column: 1 / -1;
    margin-top: 0px;
  }

  .image-container {
    margin: 1rem 0;
  }

  .video-container {
    margin: 1rem 0;
    height: 100%;
  }
</style>
