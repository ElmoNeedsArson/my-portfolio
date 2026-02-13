<script lang="ts">
    export let thumbnail: string | { src?: string; alt?: string; caption?: string } | undefined;
    export let title: string;

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
</script>

{#if thumbnail}
    <div class="thumbnail">
        <img
            src={getSrc(thumbnail)}
            alt={getAlt(thumbnail, title)}
        />
        {#if getCaption(thumbnail)}
            <p class="caption">{getCaption(thumbnail)}</p>
        {/if}
    </div>
{/if}

<style>
    .thumbnail {
        justify-self: center;
    }

    img {
        max-width: 100%;
        border-radius: 6px;
    }

    .caption {
        font-size: 0.9rem;
        color: var(--muted-color);
        margin-top: 0.5rem;
        text-align: center;
        margin-bottom: 0.5rem;
    }
</style>
