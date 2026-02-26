<script lang="ts">
    export let cardId: string;
    export let x: number;
    export let y: number;
    export let width: number;
    export let title: string;
    export let color: string = "rgba(255, 255, 255, 0.18)";
    export let sections: Array<{
        type: "content" | "images";
        content?: string;
        images?: Array<{ src: string; alt: string }>;
        caption?: string;
        cols?: number;
    }> = [];

    // Helper function to detect if content has multiple goals (for grid layout)
    function hasGoalsGrid(content: string): boolean {
        return (
            content.includes("**Independence:**") ||
            (content.match(/\*\*[^*]+:\*\*/g) || []).length >= 4
        );
    }

    // Parse goals into grid items if detected
    function parseGoals(content: string) {
        return content
            .split("\n\n")
            .filter((p) => p.trim())
            .map((p) => {
                const match = p.match(/\*\*([^:]+):\*\*\s*(.+)/s);
                if (match) {
                    return { title: match[1], description: match[2] };
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
                return { text: p, isQuote };
            });
    }
</script>

<div
    class="canvas-card"
    data-card-id={cardId}
    style="
        left: {x}px;
        top: {y}px;
        width: {width}px;
        --card-color: {color};
    "
>
    <div class="card-header">
        <h3>{title}</h3>
    </div>
    <div class="card-content">
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
                                    {goal.description}
                                </p>
                            </div>
                        {/each}
                    </div>
                {:else}
                    {@const paragraphs = parseParagraphs(section.content)}
                    {#each paragraphs as paragraph}
                        {#if paragraph.isQuote}
                            <div class="quote">
                                <p>{paragraph.text}</p>
                            </div>
                        {:else}
                            <p>{paragraph.text}</p>
                        {/if}
                    {/each}
                {/if}
            {:else if section.type === "images" && section.images}
                <div
                    class="image-gallery"
                    style="grid-template-columns: repeat({section.cols ||
                        3}, 1fr);"
                >
                    {#each section.images as image}
                        <div class="gallery-item">
                            <img
                                src={image.src}
                                alt={image.alt}
                                draggable="false"
                            />
                        </div>
                    {/each}
                </div>
                {#if section.caption}
                    <p class="image-caption"><i>{section.caption}</i></p>
                {/if}
            {/if}
        {/each}
    </div>
</div>

<style>
    .canvas-card {
        position: absolute;
        border-radius: 16px;
        background: var(--canvas-card-background);
        box-shadow: 0 12px 32px var(--canvas-card-shadow);
        backdrop-filter: blur(10px);
        overflow: hidden;
        transition: all 0.3s ease;
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

    .image-gallery {
        display: grid;
        gap: 1rem;
        margin: 1.5rem 0;
    }

    .gallery-item {
        border-radius: 8px;
        overflow: hidden;
        background: rgba(0, 0, 0, 0.2);
        height: 250px;
    }

    .gallery-item img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
    }

    .image-caption {
        font-size: 0.9rem;
        color: var(--muted-color);
        margin-top: -0.5rem !important;
    }

    @media print {
        .canvas-card {
            backdrop-filter: none !important;
        }
    }
</style>
