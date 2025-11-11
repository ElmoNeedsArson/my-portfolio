<script lang="ts">
  import { params, link, push } from "svelte-spa-router";
  import type {
    Project,
    GalleryObject,
    ImageObject,
    VideoObject,
    ThreeJSObject,
    MediaObject,
    ContentBlock,
  } from "../types";
  import ProjectOutline from "../components/ProjectOutline.svelte";
  import { navigateToSearch } from "../lib/searchNavigation";
  import { findProjectBySlug } from "../lib/searchUtils";
  import { getCategoryById } from "../lib/searchCategories";
  import { lastVisitedTab } from "../lib/navigationStore";

  // Reactive slug value derived from the router params. `$params` is provided
  // by svelte-spa-router and is reactive.
  let slug: string = "";
  $: slug = $params?.slug ?? "";

  // Reactive project lookup using the shared utility function
  let project: Project | undefined;
  $: project = findProjectBySlug(slug);

  // Tabs setup: Support either project.tabs or top-level tab1/tab2/... keys
  type TabDef = { id: string; label: string; content: ContentBlock };
  let tabs: TabDef[] = [];
  let activeTabIndex = 0;
  let tabContainerEl: HTMLElement;
  let tabRefs: HTMLElement[] = [];
  let underlineEl: HTMLElement | null = null;

  $: tabs = (() => {
    if (!project) return [];
    const result: TabDef[] = [];
    // Prefer structured tabs object if present
    const pAny: any = project as any;
    const fromMap = project.tabs ?? undefined;
    if (fromMap && typeof fromMap === "object") {
      for (const [key, value] of Object.entries(fromMap)) {
        if (value && typeof value === "object") {
          const cb = value as ContentBlock;
          result.push({ id: key, label: cb.name ?? key, content: cb });
        }
      }
    }
    // Also look for top-level tabN keys
    for (const key of Object.keys(pAny)) {
      if (/^tab\d+$/i.test(key)) {
        const content = pAny[key] as ContentBlock;
        if (content) {
          const fallback = key.replace(/tab/i, "Tab ");
          result.push({ id: key, label: content.name ?? fallback, content });
        }
      }
    }
    // Sort tabs by numeric suffix if using tabN
    result.sort((a, b) => {
      const na = parseInt(a.id.replace(/\D/g, "")) || 0;
      const nb = parseInt(b.id.replace(/\D/g, "")) || 0;
      return na - nb;
    });
    return result;
  })();

  // Ensure activeTabIndex stays in bounds
  $: if (activeTabIndex >= tabs.length) activeTabIndex = 0;

  // Active content is either selected tab or fallback to project.content
  $: activeContent = (() => {
    if (tabs.length > 0) return tabs[activeTabIndex].content;
    return project?.content;
  })();

  // Underline positioning based on actual button sizes
  function moveUnderline() {
    if (!tabContainerEl || !underlineEl || tabs.length === 0) return;
    const btn = tabRefs[activeTabIndex];
    if (!btn) return;
    const cRect = tabContainerEl.getBoundingClientRect();
    const bRect = btn.getBoundingClientRect();
    const left = bRect.left - cRect.left;
    const width = bRect.width;
    underlineEl.style.opacity = "1";
    underlineEl.style.width = `${width}px`;
    underlineEl.style.transform = `translateX(${left}px)`;
  }

  $: if (tabs && tabs.length) moveUnderline();
  $: if (activeTabIndex >= 0) moveUnderline();

  import { onMount } from "svelte";
  onMount(() => {
    const onResize = () => moveUnderline();
    window.addEventListener("resize", onResize);
    // small async to ensure layout
    setTimeout(moveUnderline, 0);
    return () => window.removeEventListener("resize", onResize);
  });

  // Get the back URL based on the last visited tab
  $: backUrl =
    $lastVisitedTab === "experiments"
      ? "/experiments"
      : $lastVisitedTab === "eindhoven"
        ? "/eindhoven"
        : "/projects";

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
    const match = url.match(
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
    );
    return match ? `https://www.youtube.com/embed/${match[1]}` : url;
  }

  function isVideoFile(url: string): boolean {
    return /\.(mp4|webm|ogg|mov|avi|mkv)$/i.test(url);
  }

  // Utility functions for media objects are no longer needed with explicit types
  // function isVideoObject(media: MediaObject): media is VideoObject {
  //   return media.type === 'video';
  // }

  // function isThreeJSObject(media: MediaObject): media is ThreeJSObject {
  //   return media.type === 'threejs';
  // }

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
   * Process text with markdown-style links and convert line breaks
   * Converts [text](/slug) to proper router links with proper event handling
   */
  function renderTextWithLinks(text: string): string {
    // Convert markdown-style links [text](/slug) to proper button elements for accessibility
    let processed = text.replace(
      /\[([^\]]+)\]\(\/([^)]+)\)/g,
      '<button type="button" class="inline-link" data-slug="$2" tabindex="0" aria-label="Navigate to $1">$1</button>',
    );

    // Convert \n line breaks to <br> tags for proper display
    return processed.replace(/\n/g, "<br>");
  }

  // Svelte action to handle clicks on dynamically generated buttons
  function contentLinkHandler(node: HTMLElement) {
    function handleClick(event: MouseEvent) {
      const target = event.target as HTMLElement;
      if (target.tagName === "BUTTON" && target.hasAttribute("data-slug")) {
        event.preventDefault();
        const slug = target.getAttribute("data-slug");
        if (slug) {
          push(`/${slug}`);
        }
      }
    }

    node.addEventListener("click", handleClick);

    return {
      destroy() {
        node.removeEventListener("click", handleClick);
      },
    };
  }

  // Handle back button functionality
  function handleBackClick(event: MouseEvent) {
    event.preventDefault();

    // Check if we can go back in browser history
    if (window.history.length > 1) {
      window.history.back();
    } else {
      // Fallback to section page if no history
      push(backUrl);
    }
  }
</script>

<main>
  {#if project}
    <!-- Project outline component -->
    <ProjectOutline {project} contentOverride={activeContent} />

    <!-- Project detail layout. Renders when a matching project is found. -->
    <article class="project-page">
      <!-- Back link to the list page -->
      <button class="back" on:click={handleBackClick}>← Back</button>
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

      {#if tabs.length > 0}
        <nav class="tabs">
          <div class="tab-container" bind:this={tabContainerEl}>
            {#each tabs as tab, i}
              <button
                class="tab"
                class:active={i === activeTabIndex}
                on:click={() => {
                  activeTabIndex = i;
                  moveUnderline();
                }}
                bind:this={tabRefs[i]}
              >
                {tab.label}
              </button>
            {/each}
            <div
              class="underline"
              bind:this={underlineEl}
              style="opacity:0"
            ></div>
          </div>
        </nav>
      {/if}

      <!-- Content sections: overview, key features, and any additional sections -->
      <div class="content" use:contentLinkHandler>
        {#if activeContent?.overview}
          <div id="overview" class="overview-text">
            {@html renderTextWithLinks(activeContent.overview)}
          </div>
        {/if}

        {#if activeContent && activeContent.keyFeatures.length > 0}
          <h2 id="key-features">Key Features</h2>
          <ul class="features">
            {#each activeContent.keyFeatures as feature}
              <li>{feature}</li>
            {/each}
          </ul>
        {/if}

        {#if activeContent}
          {#each activeContent.sections as section, index}
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

            {#if section.ThreeJSScene && section.ThreeJSScene.src != ""}
              <div class="threejs-container">
                <!-- Three.js Scene iframe -->
                <iframe
                  src={section.ThreeJSScene.src}
                  title={section.ThreeJSScene.caption ||
                    section.title ||
                    "3D Scene"}
                  frameborder="0"
                  allowfullscreen
                ></iframe>
                {#if section.ThreeJSScene.caption}
                  <p class="caption">{section.ThreeJSScene.caption}</p>
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
                    {#if item.type === "video" && item.src != ""}
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
                    {:else if item.type === "threejs" && item.src != ""}
                      <!-- Three.js Scene iframe -->
                      <iframe
                        src={item.src}
                        title={item.caption || section.title || "3D Scene"}
                        frameborder="0"
                        allowfullscreen
                      ></iframe>
                    {:else if item.type === "image" && item.src != ""}
                      <!-- Image element for local images -->
                      <img
                        src={item.src}
                        alt={item.alt || section.title || ""}
                      />
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
        {/if}
      </div>
    </article>
  {:else}
    <!-- Shown when no project matches the current slug -->
    <p>Project not found.</p>
  {/if}
</main>

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
    background: none;
    border: none;
    font: inherit;
    cursor: pointer;
    padding: 0;
  }

  .back:hover {
    text-decoration: underline;
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

  /* Style for inline link buttons */
  .overview-text :global(.inline-link),
  .section-text :global(.inline-link) {
    background: none;
    border: none;
    color: var(--secondary-text-color);
    text-decoration: none;
    border-bottom: 1px solid transparent;
    transition: border-color 0.2s ease;
    cursor: pointer;
    font: inherit;
    padding: 0;
    margin: 0;
    display: inline;
  }

  .overview-text :global(.inline-link:hover),
  .section-text :global(.inline-link:hover),
  .overview-text :global(.inline-link:focus),
  .section-text :global(.inline-link:focus) {
    border-bottom-color: var(--secondary-text-color);
    outline: none;
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
    justify-self: center;
  }

  .video-container {
    margin: 1rem 0;
    height: 100%;
    justify-self: center;
  }

  .threejs-container {
    margin: 1rem 0;
    height: 100%;
  }

  .threejs-container iframe {
    width: 100%;
    height: 500px; /* Default height for 3D scenes */
    border-radius: 6px;
    border: none;
  }

  /* Tabs styling */
  .tabs {
    width: 100%;
    margin: 1rem 0 1.5rem;
  }
  .tab-container {
    display: flex;
    /* Avoid gaps so underline aligns exactly */
    gap: 0;
    border-bottom: 1px solid var(--border-color);
    position: relative;
    width: 100%;
  }
  .tab {
    background: transparent;
    border: none;
    color: var(--muted-color);
    padding: 0.75rem 1rem;
    cursor: pointer;
    font: inherit;
    font-size: 1rem;
    font-weight: 500;
    letter-spacing: 0.05rem;
    flex: 1 1 0;
    text-align: center;
  }
  .tab:hover {
    color: var(--secondary-text-color);
  }
  .tab.active {
    color: var(--primary-text-color);
  }
  .underline {
    position: absolute;
    bottom: 0;
    left: 0;
    height: 2px;
    background: var(--primary-text-color);
    width: calc(100% / var(--n, 1));
    transform: translateX(calc(var(--i, 0) * (100% / var(--n, 1))));
    transition:
      transform 0.3s cubic-bezier(0.35, 0, 0.25, 1.2),
      width 0.3s ease;
  }
</style>
