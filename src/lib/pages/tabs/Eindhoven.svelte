<script lang="ts">
    import { onMount } from "svelte";
    import InfiniteCanvas from "$lib/components/canvas/InfiniteCanvas.svelte";

    const canvasFullscreenRestoreKey = "canvas-fullscreen-restore-v1";
    let startFullscreen = false;
    let mounted = false;

    onMount(() => {
        const params = new URLSearchParams(window.location.search);
        const startFullscreenFromQuery = params.get("canvas") === "fullscreen";
        const startFullscreenFromRestore =
            window.sessionStorage.getItem(canvasFullscreenRestoreKey) === "1";

        startFullscreen = startFullscreenFromQuery || startFullscreenFromRestore;

        if (startFullscreenFromRestore) {
            window.sessionStorage.removeItem(canvasFullscreenRestoreKey);
        }

        mounted = true;
    });
</script>

<p>
Left click and drag to move around the canvas. Or use the navigation in the top right.
</p>

{#if mounted}
    <InfiniteCanvas {startFullscreen} />
{/if}

<style>
    p {
        text-align: justify;
        font-size: 0.94rem;
        line-height: 1.5rem;
        margin-bottom: 1.5rem;
        letter-spacing: 0.5px;
    }

    /* Responsive adjustments */
    @media (max-width: 768px) {
        p {
            margin-right: 1.5rem;
        }
    }
</style>
