<script lang="ts">
    export let points: Array<{ x: number; y: number }>;
    
    const cornerRadius = 30; // Adjust this to make corners more or less rounded

    // Build path from multiple points with rounded corners
    $: pathD = (() => {
        if (points.length === 0) return '';
        if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
        if (points.length === 2) {
            return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;
        }
        
        // Start at first point
        let path = `M ${points[0].x} ${points[0].y}`;
        
        // Process each segment, adding rounded corners at waypoints
        for (let i = 1; i < points.length - 1; i++) {
            const prev = points[i - 1];
            const current = points[i];
            const next = points[i + 1];
            
            // Calculate vectors
            const dx1 = current.x - prev.x;
            const dy1 = current.y - prev.y;
            const dx2 = next.x - current.x;
            const dy2 = next.y - current.y;
            
            // Calculate distances
            const dist1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);
            const dist2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
            
            // Use smaller of the two distances or cornerRadius
            const radius = Math.min(cornerRadius, dist1 / 2, dist2 / 2);
            
            // Calculate the point before the corner
            const beforeCorner = {
                x: current.x - (dx1 / dist1) * radius,
                y: current.y - (dy1 / dist1) * radius
            };
            
            // Calculate the point after the corner
            const afterCorner = {
                x: current.x + (dx2 / dist2) * radius,
                y: current.y + (dy2 / dist2) * radius
            };
            
            // Draw line to before corner, then quadratic curve through corner
            path += ` L ${beforeCorner.x} ${beforeCorner.y}`;
            path += ` Q ${current.x} ${current.y} ${afterCorner.x} ${afterCorner.y}`;
        }
        
        // Draw line to final point
        path += ` L ${points[points.length - 1].x} ${points[points.length - 1].y}`;
        
        return path;
    })();

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
        stroke="rgba(130, 130, 130, 1)"
        stroke-width="5"
        stroke-dasharray="5,5"
    />

    <!-- Arrowhead at the last point -->
    {#if points.length > 0}
        <polygon
            points="-8,-4 0,0 -8,4"
            fill="rgba(255, 255, 255, 1)"
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

    /* Print styles for PDF export */
    @media print {
        .arrow path,
        .arrow polygon {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
    }
</style>
