<script lang="ts">
    import { push } from "svelte-spa-router";
    import { createEventDispatcher } from "svelte";

    const dispatch = createEventDispatcher<{
        openLightbox: { src: string; alt: string; caption?: string };
    }>();

    const projectBackUrlStorageKey = "project-page-back-url-v1";

    type ProjectBackTarget = {
        route: string;
        fullscreen: boolean;
    };

    export let cardId: string;
    export let x: number;
    export let y: number;
    export let zoomLevel: number = 1;
    export let lowDetailMode: boolean = false;
    export let ultraLowDetailMode: boolean = false;
    export let width: number;
    export let title: string;
    export let color: string = "rgba(255, 255, 255, 0.18)";
    export let hideHeader: boolean = false;
    export let contentAlign: "left" | "center" = "left";
    export let introTitle: string | undefined = undefined;
    export let introSubtitle: string | undefined = undefined;
    export let introLarge: boolean = false;
    type SectionImage = {
        src: string;
        alt: string;
        title?: string;
        caption?: string;
        imageFit?: "cover" | "contain";
        imageHeight?: number;
        colSpan?: number;
    };

    type CanvasSection = {
        type: "content" | "images" | "row";
        // content
        content?: string;
        // images
        title?: string;
        images?: SectionImage[];
        caption?: string;
        cols?: number;
        imageFit?: "cover" | "contain";
        imageHeight?: number;
        // row
        sections?: CanvasSection[];
        gap?: string;
        // layout
        flex?: number;
        width?: string;
        imageFrame?: "browser" | "none";
    };

    export let sections: CanvasSection[] = [];

    // Helper function to detect if content has multiple goals (for grid layout)
    function hasGoalsGrid(content: string): boolean {
        const goalHeaderMatches =
            content.match(/<(?:b|strong)>\s*[^<]+:\s*<\/(?:b|strong)>/gi) ||
            [];

        return goalHeaderMatches.length >= 4;
    }

    // Parse goals into grid items if detected
    function parseGoals(content: string) {
        return content
            .split("\n\n")
            .filter((p) => p.trim())
            .map((p) => {
                const match = p.match(
                    /^<(?:b|strong)>\s*([^:<]+):\s*<\/(?:b|strong)>\s*([\s\S]+)/i,
                );
                if (match) {
                    return {
                        title: match[1].trim(),
                        description: renderTextWithLinks(match[2].trim()),
                    };
                }
                return null;
            })
            .filter((g) => g !== null);
    }

    // Split content by double newlines and detect quotes
    function parseParagraphs(content: string) {
        return content
            .split("\n\n")
            .filter((p) => p.trim())
            .map((p) => {
                const isQuote =
                    p.trim().startsWith('"') && p.trim().endsWith('"');
                return { text: renderTextWithLinks(p), isQuote };
            });
    }

    function renderTextWithLinks(text: string): string {
        return text.replace(
            /\[([^\]]+)\]\((\/[^)\s]+)\)/g,
            '<button type="button" class="inline-link" data-slug="$2" tabindex="0" aria-label="Navigate to $1">$1</button>',
        );
    }

    function handleImageClick(image: SectionImage) {
        dispatch("openLightbox", {
            src: image.src,
            alt: image.alt,
            caption: image.caption,
        });
    }

    function clearCanvasFullscreenQueryParam() {
        const url = new URL(window.location.href);

        if (url.searchParams.get("canvas") !== "fullscreen") {
            return;
        }

        url.searchParams.delete("canvas");
        const nextUrl = `${url.pathname}${url.search}${url.hash}`;
        window.history.replaceState(window.history.state, "", nextUrl);
    }

    function canvasContentLinkHandler(node: HTMLElement) {
        function handleClick(event: MouseEvent) {
            const target = event.target as HTMLElement;
            const button = target.closest(
                "button.inline-link[data-slug]",
            ) as HTMLButtonElement | null;

            if (!button || !node.contains(button)) {
                return;
            }

            event.preventDefault();
            const slug = button.getAttribute("data-slug");
            if (!slug) {
                return;
            }

            const routeFromHash = window.location.hash.startsWith("#/")
                ? window.location.hash.slice(1)
                : "/eindhoven";
            const fullscreen =
                new URLSearchParams(window.location.search).get("canvas") ===
                "fullscreen";

            const backTarget: ProjectBackTarget = {
                route: routeFromHash,
                fullscreen,
            };

            window.sessionStorage.setItem(
                projectBackUrlStorageKey,
                JSON.stringify(backTarget),
            );

            clearCanvasFullscreenQueryParam();
            push(slug.startsWith("/") ? slug : `/${slug}`);
        }

        node.addEventListener("click", handleClick);

        return {
            destroy() {
                node.removeEventListener("click", handleClick);
            },
        };
    }
</script>

<div
    class="canvas-card"
    class:no-header={hideHeader}
    class:low-zoom={zoomLevel <= 0.5 || lowDetailMode}
    class:ultra-low-zoom={ultraLowDetailMode}
    data-card-id={cardId}
    style="
        left: {x}px;
        top: {y}px;
        width: {width}px;
        --card-color: {color};
    "
>
    {#if !hideHeader}
        <div class="card-header">
            <h3>{title}</h3>
        </div>
    {/if}
    <div
        class="card-content"
        class:centered-content={contentAlign === "center"}
        class:intro-layout={!!introTitle}
        class:intro-large={introLarge}
        use:canvasContentLinkHandler
    >
        {#if introTitle}
            <div class="intro-content-block">
                <h2 class="intro-title">{introTitle}</h2>
                {#if introSubtitle}
                    <p class="intro-subtitle">{introSubtitle}</p>
                {/if}
            </div>
        {:else}
            {#each sections as section}
                {#if section.type === "content" && section.content}
                    {@const isGoalsGrid = hasGoalsGrid(section.content)}
                    {#if isGoalsGrid}
                        {@const goals = parseGoals(section.content)}
                        <div class="goals-grid">
                            {#each goals as goal}
                                <div class="goal-item">
                                    <h4 class="goal-title">{goal.title}</h4>
                                    <p class="goal-description">
                                        {@html goal.description}
                                    </p>
                                </div>
                            {/each}
                        </div>
                    {:else}
                        {@const paragraphs = parseParagraphs(section.content)}
                        {#each paragraphs as paragraph}
                            {#if paragraph.isQuote}
                                <div class="quote">
                                    <p>{@html paragraph.text}</p>
                                </div>
                            {:else}
                                <p>{@html paragraph.text}</p>
                            {/if}
                        {/each}
                    {/if}
                {:else if section.type === "images" && section.images}
                    <div class="images-section-block">
                        <div class="images-section-top">
                            {#if section.title}
                                <p class="image-section-title"><strong>{@html renderTextWithLinks(section.title)}</strong></p>
                            {/if}
                            <div
                                class="image-gallery"
                                class:single-image-gallery={(section.cols || 3) === 1 &&
                                    section.images.length === 1}
                                style="grid-template-columns: repeat({section.cols || 3}, 1fr);"
                            >
                                {#each section.images as image}
                                    {@const resolvedFit = image.imageFit || section.imageFit || "cover"}
                                    {@const resolvedHeight = image.imageHeight || section.imageHeight || 250}
                                    <div class="gallery-entry" class:has-browser-frame={section.imageFrame === "browser"} style={image.colSpan ? `grid-column: span ${image.colSpan}` : ""}>
                                        {#if section.imageFrame === "browser"}
                                            <div class="browser-chrome">
                                                <span class="chrome-dot chrome-dot-red"></span>
                                                <span class="chrome-dot chrome-dot-yellow"></span>
                                                <span class="chrome-dot chrome-dot-green"></span>
                                            </div>
                                        {/if}
                                        {#if image.title}
                                            <p class="image-source-title">
                                                <strong>{@html renderTextWithLinks(image.title)}</strong>
                                            </p>
                                        {/if}
                                        <div
                                            class="gallery-item"
                                            class:image-fit-contain={resolvedFit === "contain"}
                                            style="--gallery-image-height: {resolvedHeight}px;"
                                            role="button"
                                            tabindex="0"
                                            aria-label="View image: {image.alt}"
                                            on:click={() => handleImageClick(image)}
                                            on:keydown={(e) => e.key === "Enter" && handleImageClick(image)}
                                        >
                                            <img
                                                src={image.src}
                                                alt={image.alt}
                                                draggable="false"
                                            />
                                        </div>
                                        {#if image.caption}
                                            <p class="image-source-caption">
                                                <i>{@html renderTextWithLinks(image.caption)}</i>
                                            </p>
                                        {/if}
                                    </div>
                                {/each}
                            </div>
                        </div>
                        {#if section.caption}
                            <p class="image-caption">
                                <i>{@html renderTextWithLinks(section.caption)}</i>
                            </p>
                        {/if}
                    </div>
                {:else if section.type === "row" && section.sections}
                    {@const _gap = section.gap || "1.5rem"}
                    {@const _n = section.sections.length}
                    {@const gridCols = section.sections.map(c =>
                        c.width?.endsWith("%")
                            ? `calc(${c.width} - ${_gap} * ${_n - 1} / ${_n})`
                            : c.width ? c.width : c.flex ? `${c.flex}fr` : "1fr"
                    ).join(" ")}
                    <div
                        class="section-row"
                        style="grid-template-columns: {gridCols};{section.gap ? ` gap: ${section.gap}` : ''}"
                    >
                        {#each section.sections as child}
                            <div class="section-row-item">
                                {#if child.type === "content" && child.content}
                                    {@const isGoalsGrid = hasGoalsGrid(child.content)}
                                    {#if isGoalsGrid}
                                        {@const goals = parseGoals(child.content)}
                                        <div class="goals-grid">
                                            {#each goals as goal}
                                                <div class="goal-item">
                                                    <h4 class="goal-title">{goal.title}</h4>
                                                    <p class="goal-description">
                                                        {@html goal.description}
                                                    </p>
                                                </div>
                                            {/each}
                                        </div>
                                    {:else}
                                        {@const paragraphs = parseParagraphs(child.content)}
                                        {#each paragraphs as paragraph}
                                            {#if paragraph.isQuote}
                                                <div class="quote">
                                                    <p>{@html paragraph.text}</p>
                                                </div>
                                            {:else}
                                                <p>{@html paragraph.text}</p>
                                            {/if}
                                        {/each}
                                    {/if}
                                {:else if child.type === "images" && child.images}
                                    <div class="images-section-block">
                                        <div class="images-section-top">
                                            {#if child.title}
                                                <p class="image-section-title"><strong>{@html renderTextWithLinks(child.title)}</strong></p>
                                            {/if}
                                            <div
                                                class="image-gallery"
                                                class:single-image-gallery={(child.cols || 3) === 1 && child.images.length === 1}
                                                style="grid-template-columns: repeat({child.cols || 3}, 1fr);"
                                            >
                                                {#each child.images as image}
                                                    {@const resolvedFit = image.imageFit || child.imageFit || "cover"}
                                                    {@const resolvedHeight = image.imageHeight || child.imageHeight || 250}
                                                    <div class="gallery-entry" class:has-browser-frame={child.imageFrame === "browser"} style={image.colSpan ? `grid-column: span ${image.colSpan}` : ""}>
                                                        {#if child.imageFrame === "browser"}
                                                            <div class="browser-chrome">
                                                                <span class="chrome-dot chrome-dot-red"></span>
                                                                <span class="chrome-dot chrome-dot-yellow"></span>
                                                                <span class="chrome-dot chrome-dot-green"></span>
                                                            </div>
                                                        {/if}
                                                        {#if image.title}
                                                            <p class="image-source-title">
                                                                <strong>{@html renderTextWithLinks(image.title)}</strong>
                                                            </p>
                                                        {/if}
                                                        <div
                                                            class="gallery-item"
                                                            class:image-fit-contain={resolvedFit === "contain"}
                                                            style="--gallery-image-height: {resolvedHeight}px;"
                                                            role="button"
                                                            tabindex="0"
                                                            aria-label="View image: {image.alt}"
                                                            on:click={() => handleImageClick(image)}
                                                            on:keydown={(e) => e.key === "Enter" && handleImageClick(image)}
                                                        >
                                                            <img src={image.src} alt={image.alt} draggable="false" />
                                                        </div>
                                                        {#if image.caption}
                                                            <p class="image-source-caption">
                                                                <i>{@html renderTextWithLinks(image.caption)}</i>
                                                            </p>
                                                        {/if}
                                                    </div>
                                                {/each}
                                            </div>
                                        </div>
                                        {#if child.caption}
                                            <p class="image-caption">
                                                <i>{@html renderTextWithLinks(child.caption)}</i>
                                            </p>
                                        {/if}
                                    </div>
                                {/if}
                            </div>
                        {/each}
                    </div>
                {/if}
            {/each}
        {/if}
    </div>
</div>

<style>
    .canvas-card {
        position: absolute;
        border-radius: 16px;
        background: var(--canvas-card-background);
        box-shadow: 0 12px 32px var(--canvas-card-shadow);
        -webkit-backdrop-filter: blur(10px);
        backdrop-filter: blur(10px);
        overflow: hidden;
        transition: all 0.3s ease;
        transform: translateZ(0);
        backface-visibility: hidden;
        isolation: isolate;
    }

    .canvas-card.low-zoom {
        -webkit-backdrop-filter: none;
        backdrop-filter: none;
        box-shadow: 0 8px 20px var(--canvas-card-shadow);
    }

    .canvas-card.ultra-low-zoom {
        background: var(--canvas-card-solid-background, #ffffff);
        box-shadow: none;
        transition: none;
    }

    .canvas-card:hover {
        box-shadow: 0 16px 48px rgba(0, 0, 0, 0.35);
        border-color: rgba(255, 255, 255, 0.25);
    }

    .card-header {
        padding: 1.25rem 1.5rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        background: var(--card-color);
    }

    .card-header h3 {
        margin: 0;
        font-size: 1.3rem;
        font-weight: 600;
        color: var(--primary-text-color);
        letter-spacing: 0.3px;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    }

    .card-content {
        padding: 1.5rem;
        background: transparent;
    }

    .card-content.centered-content {
        text-align: center;
    }

    .card-content.intro-layout {
        min-height: 260px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .intro-content-block {
        width: 100%;
    }

    .intro-title {
        margin: 0;
        font-size: 2.1rem;
        line-height: 1.15;
        font-weight: 700;
        color: var(--primary-text-color);
    }

    .intro-subtitle {
        margin: 0.8rem 0 0 0;
        font-size: 1.05rem;
        line-height: 1.55;
        color: var(--muted-color);
        white-space: pre-line;
    }

    .card-content.intro-large .intro-title {
        font-size: 2.45rem;
    }

    .card-content.intro-large .intro-subtitle {
        font-size: 1.12rem;
    }

    .card-content p {
        margin: 0 0 1rem 0;
        font-size: 1.05rem;
        line-height: 1.7;
        color: var(--primary-text-color);
        opacity: 0.9;
    }

    .card-content p:last-child {
        margin-bottom: 0;
    }

    .quote {
        border-left: 4px solid rgba(255, 255, 255, 0.2);
        padding-left: 1rem;
        margin: 1.5rem 0;
    }

    .quote p {
        color: var(--muted-color);
        font-style: italic;
        margin: 0;
    }

    .card-content :global(a) {
        color: var(--primary-text-color);
        text-decoration: underline;
        text-underline-offset: 2px;
    }

    .card-content :global(a:hover) {
        opacity: 0.85;
    }

    .card-content :global(.inline-link) {
        border: 0;
        padding: 0;
        margin: 0;
        background: transparent;
        font: inherit;
        color: var(--primary-text-color);
        text-decoration: underline;
        text-underline-offset: 2px;
        cursor: pointer;
    }

    .card-content :global(.inline-link:hover) {
        opacity: 0.85;
    }

    .card-content :global(strong) {
        font-weight: 700;
    }

    .goals-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 1rem;
        margin: 0;
    }

    .goal-item {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        padding: 1rem;
        transition: all 0.2s ease;
    }

    .goal-item:hover {
        background: rgba(255, 255, 255, 0.08);
        border-color: rgba(255, 255, 255, 0.2);
        transform: translateY(-2px);
    }

    .goal-title {
        margin: 0 0 0.5rem 0;
        font-size: 1.1rem;
        font-weight: 600;
        color: var(--primary-text-color);
    }

    .goal-description {
        margin: 0;
        font-size: 0.95rem;
        line-height: 1.6;
        color: var(--primary-text-color);
        opacity: 0.8;
    }

    .images-section-block {
        background: rgba(255, 255, 255, 0.028);
        border: 1px solid rgba(255, 255, 255, 0.06);
        border-radius: 10px;
        padding: 0.875rem 0;
        margin: 0.5rem 0;
        display: flex;
        flex-direction: column;
        overflow: hidden;
    }

    .section-row-item .images-section-block {
        margin: 0;
        flex: 1;
    }

    .images-section-top {
        flex: 1;
    }

    .images-section-block .image-section-title {
        margin-top: 0;
        padding: 0 1rem;
    }

    .images-section-block .image-gallery {
        margin-top: 0.75rem;
        margin-bottom: 0;
    }


    .image-gallery {
        display: grid;
        gap: 1.5rem;
        margin: 1.5rem 0;
    }

    .gallery-entry {
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
    }

    /* Browser frame wrapper */
    .has-browser-frame {
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 10px;
        overflow: hidden;
        background: rgba(0, 0, 0, 0.15);
        gap: 0;
    }

    .browser-chrome {
        height: 26px;
        background: rgba(255, 255, 255, 0.07);
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        display: flex;
        align-items: center;
        padding: 0 10px;
        gap: 5px;
        flex-shrink: 0;
    }

    .chrome-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        flex-shrink: 0;
    }

    .chrome-dot-red    { background: rgba(255, 95,  87,  0.75); }
    .chrome-dot-yellow { background: rgba(255, 189, 46,  0.75); }
    .chrome-dot-green  { background: rgba(40,  201, 64,  0.75); }

    .has-browser-frame .gallery-item {
        border-radius: 0;
    }

    .gallery-item {
        border-radius: 8px;
        overflow: hidden;
        background: rgba(0, 0, 0, 0.2);
        border: 1px solid rgba(255, 255, 255, 0.06);
        height: var(--gallery-image-height, 250px);
        cursor: zoom-in;
        transition: opacity 0.15s ease;
    }

    .gallery-item:hover {
        opacity: 0.88;
    }

    .gallery-item img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
    }

    .gallery-item.image-fit-contain img {
        object-fit: contain;
    }

    .gallery-item.image-fit-contain {
        background: var(--canvas-card-background);
    }

    .single-image-gallery .gallery-item {
        height: auto;
        background: transparent;
    }

    .single-image-gallery .gallery-item img {
        height: auto;
        object-fit: initial;
    }

    .image-caption {
        font-size: 0.9rem;
        color: var(--muted-color);
        padding: 0.75rem 1rem 0;
    }

    .image-source-caption {
        margin: 0;
        font-size: 0.82rem;
        line-height: 1.35;
        color: var(--muted-color);
        opacity: 0.95;
    }

    .image-source-title {
        margin: 0;
        font-size: 1.3rem;
        line-height: 1.35;
        color: var(--primary-text-color);
    }

    .section-row {
        display: grid;
        gap: 1.5rem;
        align-items: stretch;
        margin: 0.5rem 0;
    }

    .section-row-item {
        min-width: 0;
        display: flex;
        flex-direction: column;
    }

    .image-section-title {
        margin: 1.25rem 0 0 0;
        font-size: 1.15rem;
        line-height: 1.35;
        color: var(--primary-text-color);
        border-bottom: 1px solid rgba(255, 255, 255, 0.12);
        padding-bottom: 0.4rem;
    }

    .image-section-title:first-child {
        margin-top: 0;
    }

    @media (hover: none), (pointer: coarse), (max-width: 900px) {
        .canvas-card {
            -webkit-backdrop-filter: none;
            backdrop-filter: none;
        }
    }

    @media print {
        .canvas-card {
            -webkit-backdrop-filter: none !important;
            backdrop-filter: none !important;
        }
    }
</style>
