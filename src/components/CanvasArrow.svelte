<script lang="ts">
    export let points: Array<{ x: number; y: number }>;

    // Build path from multiple points
    $: pathD = points.length > 0
        ? `M ${points[0].x} ${points[0].y} ` +
          points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ')
        : '';

    // Calculate arrowhead angle from last two points
    $: lastPoint = points[points.length - 1];
    $: secondLastPoint = points[points.length - 2] || lastPoint;
    $: angle = Math.atan2(
        lastPoint.y - secondLastPoint.y,
        lastPoint.x - secondLastPoint.x
    ) * (180 / Math.PI);
</script>

<g class="arrow">
    <!-- Arrow path -->
    <path
        d={pathD}
        fill="none"
        stroke="rgba(255, 255, 255, 0.3)"
        stroke-width="2"
        stroke-dasharray="5,5"
    />

    <!-- Arrowhead at the last point -->
    {#if points.length > 0}
        <polygon
            points="-8,-4 0,0 -8,4"
            fill="rgba(255, 255, 255, 0.3)"
            transform="translate({lastPoint.x}, {lastPoint.y}) rotate({angle})"
        />
    {/if}
</g>

<style>
    .arrow {
        pointer-events: none;
    }

    .arrow path {
        transition: stroke 0.3s ease;
    }

    .arrow:hover path {
        stroke: rgba(255, 255, 255, 0.5);
    }
</style>
