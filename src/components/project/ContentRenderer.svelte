<script lang="ts">
    import { push } from "svelte-spa-router";
    import type { ContentBlock, GalleryObject, MediaObject } from "../../types";

    export let content: ContentBlock | undefined;

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

    function isYouTubeUrl(url: string): boolean {
        return /(?:youtube\.com\/watch\?v=|youtu\.be\/)/.test(url);
    }

    function getYouTubeEmbedUrl(url: string): string {
        const match = url.match(
            /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
        );
        return match ? `https://www.youtube.com/embed/${match[1]}` : url;
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

        return {
            media: gallery.media ?? [],
            caption: gallery.caption,
            columns: gallery.columns ?? 2,
        };
    }

    function renderTextWithLinks(text: string): string {
        let processed = text.replace(
            /\[([^\]]+)\]\(\/([^)]+)\)/g,
            '<button type="button" class="inline-link" data-slug="$2" tabindex="0" aria-label="Navigate to $1">$1</button>',
        );
        return processed.replace(/\n/g, "<br>");
    }

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
</script>

<div class="content" use:contentLinkHandler>
    {#if content?.overview}
        <div id="overview" class="overview-text">
            {@html renderTextWithLinks(content.overview)}
        </div>
    {/if}

    {#if content?.keyFeatures}
        {#if content && content.keyFeatures.length > 0}
            <h2 id="key-features">Key Features</h2>
            <ul class="features">
                {#each content.keyFeatures as feature}
                    <li>{feature}</li>
                {/each}
            </ul>
        {/if}
    {/if}

    {#if content}
        {#each content.sections as section, index}
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
                        <iframe
                            src={getYouTubeEmbedUrl(section.video.src)}
                            title={section.video.caption ||
                                section.title ||
                                "Video"}
                            allowfullscreen
                            frameborder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        ></iframe>
                    {:else}
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
                                    <iframe
                                        src={getYouTubeEmbedUrl(item.src)}
                                        title={item.caption ||
                                            section.title ||
                                            "Video"}
                                        allowfullscreen
                                        frameborder="0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    ></iframe>
                                {:else}
                                    <video
                                        src={item.src}
                                        autoplay={item.autoplay}
                                        loop={item.loop}
                                        muted={item.muted}
                                        controls={item.controls ?? true}
                                        playsinline
                                    >
                                        Your browser does not support the video
                                        tag.
                                    </video>
                                {/if}
                            {:else if item.type === "threejs" && item.src != ""}
                                <iframe
                                    src={item.src}
                                    title={item.caption ||
                                        section.title ||
                                        "3D Scene"}
                                    frameborder="0"
                                    allowfullscreen
                                ></iframe>
                            {:else if item.type === "image" && item.src != ""}
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

<style>
    .content {
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
        align-items: stretch;
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

    .caption {
        text-align: center;
        font-size: 0.85rem;
        color: var(--muted-color);
        margin-top: 0.5rem;
        font-style: italic;
    }

    .gallery-caption {
        grid-column: 1 / -1;
        text-align: center;
        font-size: 0.9rem;
        color: var(--muted-color);
        margin-top: 0.5rem;
        font-style: italic;
    }

    img,
    video,
    iframe {
        max-width: 100%;
        border-radius: 6px;
    }

    iframe {
        width: 100%;
        aspect-ratio: 16 / 9;
    }
</style>
