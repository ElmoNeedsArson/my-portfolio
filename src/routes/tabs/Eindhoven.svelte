<script lang="ts">
    import InfiniteCanvas from "../../components/canvas/InfiniteCanvas.svelte";

    const params = new URLSearchParams(window.location.search);
    const startFullscreen = params.get("canvas") === "fullscreen";
</script>

<p>
Left click and drag to move around the canvas. Or use the navigation in the top right.
</p>

<InfiniteCanvas {startFullscreen} />

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