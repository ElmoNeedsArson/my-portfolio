<script lang="ts">
    import { push } from "svelte-spa-router";
    import { createEventDispatcher } from "svelte";
    import type { Component } from "svelte";
    import SunburstChart from "../visualizations/SunburstChart.svelte";
    import ReferencesCard from "../visualizations/ReferencesCard.svelte";
    import { citationNumberMap } from "../../lib/citationStore";
    import { figureNumberMap, figureCardMap } from "../../lib/figureStore";
    import { EA_AREAS } from "../../lib/expertiseAreas";

    const EA_SHORT: Record<string, string> = {
        b_e: 'B&E', c_a: 'C&A', m_d_c: 'M,D&C', t_r: 'T&R', u_s: 'U&S',
    };

    const componentRegistry: Record<string, Component> = {
        sunburst: SunburstChart,
        references: ReferencesCard,
    };

    const dispatch = createEventDispatcher<{
        openLightbox: { src: string; alt: string; caption?: string };
        navigateTo: { cardId: string; sourceCardId: string };
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
    export let columns: number | undefined = undefined;
    export let imagesVisible: boolean = true;
    export let paddingY: string | undefined = undefined;
    type SectionImage = {
        src: string;
        alt: string;
        title?: string;
        caption?: string;
        imageFit?: "cover" | "contain";
        imageHeight?: number;
        colSpan?: number;
        figureId?: string;
    };

    type ChipDef = { label: string; color: string };

    type CanvasSection = {
        type: "content" | "images" | "row" | "sveltecomponent" | "chips" | "pullquote";
        chips?: ChipDef[];
        accent?: string;
        content?: string;
        columns?: number;
        title?: string;
        images?: SectionImage[];
        caption?: string;
        cols?: number;
        imageFit?: "cover" | "contain";
        imageHeight?: number;
        homeEA?: string;
        eaTags?: string[];
        sections?: CanvasSection[];
        gap?: string;
        flex?: number;
        width?: string;
        imageFrame?: "browser" | "none";
        figureId?: string;
        componentName?: string;
        component?: Component;
        componentProps?: Record<string, unknown>;
    };

    export let sections: CanvasSection[] = [];

    function hasGoalsGrid(content: string): boolean {
        const goalHeaderMatches =
            content.match(/<(?:b|strong)>\s*[^<]+:\s*<\/(?:b|strong)>/gi) ||
            [];

        return goalHeaderMatches.length >= 4;
    }

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
        const withCitations = text.replace(/\\cite\{([^}]+)\}/g, (_, id) => {
            const num = $citationNumberMap[id];
            const label = num !== undefined ? `[${num}]` : `[?]`;
            const unknownClass = num !== undefined ? "" : " citation-unknown";
            return `<button type="button" class="citation-ref${unknownClass}" data-cite-card="references" tabindex="0">${label}</button>`;
        });
        const withFigureRefs = withCitations.replace(/\\ref\{([^}]+)\}/g, (_, id) => {
            const num = $figureNumberMap[id];
            const targetCardId = $figureCardMap[id];
            const label = num !== undefined ? `Figure ${num}` : `Figure ?`;
            if (targetCardId) {
                return `<button type="button" class="figure-ref" data-figure-card="${targetCardId}" tabindex="0">${label}</button>`;
            }
            return label;
        });
        const withLinks = withFigureRefs.replace(
            /\[([^\]]+)\]\((\/[^)\s]+)\)/g,
            '<button type="button" class="inline-link" data-slug="$2" tabindex="0" aria-label="Navigate to $1">$1</button>',
        );
        const withExternalLinks = withLinks.replace(
            /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g,
            '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>',
        );
        return withExternalLinks.replace(
            /\[hl:([a-z_,]+)\]([\s\S]*?)\[\/hl\]/g,
            (_, eaKeys, innerText) => {
                const keys: string[] = eaKeys.split(',');
                const firstEa = EA_AREAS[keys[0] as keyof typeof EA_AREAS];
                if (!firstEa) return innerText;
                let bg: string;
                if (keys.length === 1) {
                    bg = firstEa.tint.replace(/[\d.]+\)$/, '0.15)');
                } else {
                    const stops = keys.flatMap((key, i) => {
                        const ea = EA_AREAS[key as keyof typeof EA_AREAS];
                        const c = ea ? ea.tint.replace(/[\d.]+\)$/, '0.22)') : 'transparent';
                        const pct = Math.round((i / keys.length) * 100);
                        const pctEnd = Math.round(((i + 1) / keys.length) * 100);
                        return [`${c} ${pct}%`, `${c} ${pctEnd}%`];
                    });
                    bg = `linear-gradient(178deg, ${stops.join(', ')})`;
                }
                const chips = keys.map((key) => {
                    const ea = EA_AREAS[key as keyof typeof EA_AREAS];
                    if (!ea) return '';
                    const short = EA_SHORT[key] ?? key;
                    const chipStyle = `background:${ea.base}30;border:1px solid ${ea.base};color:${ea.base};`;
                    return `<span class="ea-hl-chip" aria-hidden="true" style="${chipStyle}">${short}</span>`;
                }).join('');
                return `<span class="ea-hl" data-ea="${eaKeys}" style="background:${bg};border-radius:3px;">${chips}${innerText}</span>`;
            }
        );
    }

    function hasHighlights(content: string): boolean {
        return content.includes('[hl:');
    }

    function figureLabel(figureId: string | undefined): string {
        if (!figureId) return "";
        const num = $figureNumberMap[figureId];
        return num !== undefined ? `Figure ${num}: ` : "";
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

            const citationButton = target.closest(
                "button.citation-ref[data-cite-card]",
            ) as HTMLButtonElement | null;

            if (citationButton && node.contains(citationButton)) {
                event.preventDefault();
                event.stopPropagation();
                const targetCardId = citationButton.getAttribute("data-cite-card");
                if (targetCardId) dispatch("navigateTo", { cardId: targetCardId, sourceCardId: cardId });
                return;
            }

            const figureButton = target.closest(
                "button.figure-ref[data-figure-card]",
            ) as HTMLButtonElement | null;

            if (figureButton && node.contains(figureButton)) {
                event.preventDefault();
                event.stopPropagation();
                const targetCardId = figureButton.getAttribute("data-figure-card");
                if (targetCardId) dispatch("navigateTo", { cardId: targetCardId, sourceCardId: cardId });
                return;
            }

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
        style={paddingY !== undefined ? `padding-top: ${paddingY}; padding-bottom: ${paddingY};` : undefined}
        use:canvasContentLinkHandler
    >
        {#snippet contentBlock(s: CanvasSection)}
            {@const isGoalsGrid = hasGoalsGrid(s.content ?? "")}
            {#if isGoalsGrid}
                {@const goals = parseGoals(s.content ?? "")}
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
                {@const paragraphs = parseParagraphs(s.content ?? "")}
                {@const effectiveCols = s.columns}
                <div
                    class:multi-col-content={!!effectiveCols}
                    class:has-highlights={hasHighlights(s.content ?? "")}
                    style={effectiveCols ? `column-count: ${effectiveCols}` : undefined}
                >
                    {#each paragraphs as paragraph}
                        {#if paragraph.isQuote}
                            <div class="quote">
                                <p>{@html paragraph.text}</p>
                            </div>
                        {:else}
                            <p>{@html paragraph.text}</p>
                        {/if}
                    {/each}
                </div>
            {/if}
        {/snippet}

        {#snippet imagesBlock(s: CanvasSection)}
            <div class="images-section-block">
                <div class="images-section-top">
                    {#if s.title}
                        <p class="image-section-title"><strong>{@html renderTextWithLinks(s.title)}</strong></p>
                    {/if}
                    <div
                        class="image-gallery"
                        class:single-image-gallery={(s.cols || 3) === 1 &&
                            (s.images?.length ?? 0) === 1}
                        style="grid-template-columns: repeat({s.cols || 3}, 1fr);"
                    >
                        {#each s.images ?? [] as image}
                            {@const resolvedFit = image.imageFit || s.imageFit || "cover"}
                            {@const resolvedHeight = image.imageHeight || s.imageHeight || 250}
                            <div class="gallery-entry" class:has-browser-frame={s.imageFrame === "browser"} style={image.colSpan ? `grid-column: span ${image.colSpan}` : ""}>
                                {#if s.imageFrame === "browser"}
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
                                        decoding="async"
                                        style={imagesVisible ? undefined : "display:none"}
                                    />
                                </div>
                                {#if image.caption}
                                    <p class="image-source-caption">
                                        <i>{@html renderTextWithLinks(figureLabel(image.figureId) + image.caption)}</i>
                                    </p>
                                {/if}
                            </div>
                        {/each}
                    </div>
                </div>
                {#if s.caption}
                    <p class="image-caption">
                        <i>{@html renderTextWithLinks(figureLabel(s.figureId) + s.caption)}</i>
                    </p>
                {/if}
                {#if s.homeEA || (s.eaTags && s.eaTags.length)}
                    <div class="project-ea-chips">
                        {#if s.homeEA && EA_AREAS[s.homeEA as keyof typeof EA_AREAS]}
                            {@const ea = EA_AREAS[s.homeEA as keyof typeof EA_AREAS]}
                            <span class="project-ea-chip chip-home" style="background:{ea.base}30;border:1px solid {ea.base};color:{ea.base};">{EA_SHORT[s.homeEA] ?? s.homeEA}</span>
                        {/if}
                        {#each (s.eaTags ?? []) as key}
                            {#if EA_AREAS[key as keyof typeof EA_AREAS]}
                                {@const ea = EA_AREAS[key as keyof typeof EA_AREAS]}
                                <span class="project-ea-chip chip-cross" style="border:1px dashed {ea.base}88;color:{ea.base}CC;">{EA_SHORT[key] ?? key}</span>
                            {/if}
                        {/each}
                    </div>
                {/if}
            </div>
        {/snippet}

        {#if introTitle}
            <div class="intro-content-block">
                <h2 class="intro-title">{introTitle}</h2>
                {#if introSubtitle}
                    <p class="intro-subtitle">{introSubtitle}</p>
                {/if}
            </div>
        {:else}
            <div class:multi-col-content={!!columns} style={columns ? `column-count: ${columns}` : undefined}>
            {#each sections as section}
                {#if section.type === "content" && section.content}
                    {@render contentBlock(section)}
                {:else if section.type === "images" && section.images}
                    {@render imagesBlock(section)}
                {:else if section.type === "sveltecomponent"}
                    {@const resolvedComponent = section.component ?? (section.componentName ? componentRegistry[section.componentName] : undefined)}
                    {#if resolvedComponent}
                        <svelte:component this={resolvedComponent} {...(section.componentProps ?? {})} />
                    {/if}
                {:else if section.type === "chips" && section.chips}
                    <div class="chip-list">
                        {#each section.chips as chip}
                            <span
                                class="ea-chip"
                                style="background:{chip.color}22;border:1px solid {chip.color}88;color:{chip.color};"
                            >{chip.label}</span>
                        {/each}
                    </div>
                {:else if section.type === "pullquote" && section.content}
                    {@const pqParagraphs = parseParagraphs(section.content)}
                    <div
                        class="pullquote"
                        style={section.accent ? `border-left-color:${section.accent}` : undefined}
                    >
                        {#each pqParagraphs as paragraph}
                            <p>{@html paragraph.text}</p>
                        {/each}
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
                                    {@render contentBlock(child)}
                                {:else if child.type === "images" && child.images}
                                    {@render imagesBlock(child)}
                                {/if}
                            </div>
                        {/each}
                    </div>
                {/if}
            {/each}
            </div>
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
        color: var(--secondary-text-color);
        text-decoration: underline;
        text-underline-offset: 2px;
        border-radius: 9px;
        cursor: pointer;
    }

    .card-content :global(.inline-link:hover) {
        opacity: 0.85;
    }

    .card-content :global(.citation-ref) {
        border: 0;
        padding: 0;
        margin: 0;
        background: transparent;
        font: inherit;
        font-size: inherit;
        font-weight: 600;
        color: var(--secondary-text-color);
        cursor: pointer;
        text-decoration: none;
        vertical-align: baseline;
    }

    .card-content :global(.citation-ref:hover) {
        opacity: 0.7;
    }

    .card-content :global(.citation-unknown) {
        color: var(--muted-color);
    }

    .card-content :global(.figure-ref) {
        border: 0;
        padding: 0;
        margin: 0;
        background: transparent;
        font: inherit;
        font-size: inherit;
        font-weight: inherit;
        color: inherit;
        cursor: pointer;
        text-decoration: underline;
        text-decoration-style: solid;
        text-underline-offset: 2px;
        text-decoration-color: var(--secondary-text-color);
        vertical-align: baseline;
        opacity: 0.85;
    }

    .card-content :global(.figure-ref:hover) {
        opacity: 1;
    }

    .card-content :global(strong) {
        font-weight: 700;
    }

    .chip-list {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        margin-bottom: 1.25rem;
    }

    .ea-chip {
        display: inline-block;
        padding: 0.28rem 0.85rem;
        border-radius: 2rem;
        font-size: 0.82rem;
        font-weight: 600;
        letter-spacing: 0.03em;
    }

    .project-ea-chips {
        display: flex;
        flex-wrap: wrap;
        gap: 0.3rem;
        padding: 0.5rem 1rem 0.2rem;
    }

    .project-ea-chip {
        display: inline-block;
        padding: 0.22rem 0.72rem;
        border-radius: 2rem;
        font-size: 0.86rem;
        font-weight: 600;
        letter-spacing: 0.04em;
    }

    .chip-cross {
        background: transparent;
    }

    .pullquote {
        border-left: 3px solid rgba(255, 255, 255, 0.32);
        padding: 0.6rem 0 0.6rem 1.25rem;
        margin: 0.25rem 0 1.25rem 0;
    }

    .pullquote p {
        font-size: 1.05rem;
        line-height: 1.65;
        font-style: italic;
        color: rgba(255, 255, 255, 0.85);
        margin: 0;
        padding-bottom: 0.5rem;
    }

    .pullquote p:last-child {
        padding-bottom: 0;
    }

    .multi-col-content {
        column-gap: 1.5rem;
    }

    .multi-col-content .quote {
        break-inside: avoid;
    }

    .multi-col-content p {
        padding-bottom: 1rem;
        margin-bottom: 0;
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

    .has-highlights {
        padding-right: 80px;
    }

    .card-content :global(.ea-hl) {
        border-radius: 3px;
    }

    .card-content :global(.ea-hl-chip) {
        float: right;
        clear: right;
        margin-right: -76px;
        display: inline-block;
        padding: 0.18rem 0.6rem;
        border-radius: 2rem;
        font-size: 0.72rem;
        font-weight: 600;
        letter-spacing: 0.04em;
        line-height: 1.6;
        position: relative;
        z-index: 1;
        white-space: nowrap;
    }
</style>
