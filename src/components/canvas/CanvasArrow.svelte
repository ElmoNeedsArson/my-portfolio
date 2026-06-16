<script lang="ts">
    export let points: Array<{ x: number; y: number }>;
    export let dashed = false;
    export let fromSide: 'top' | 'bottom' | 'left' | 'right' | undefined = undefined;
    export let toSide: 'top' | 'bottom' | 'left' | 'right' | undefined = undefined;

    function sideDir(side: string): { x: number; y: number } {
        switch (side) {
            case 'right':  return { x:  1, y:  0 };
            case 'left':   return { x: -1, y:  0 };
            case 'bottom': return { x:  0, y:  1 };
            case 'top':    return { x:  0, y: -1 };
            default:       return { x:  1, y:  0 };
        }
    }

    let pathD = '';
    let lastCP2: { x: number; y: number } | null = null;

    $: {
        lastCP2 = null;

        if (points.length === 0) {
            pathD = '';
        } else if (points.length === 1) {
            pathD = `M ${points[0].x} ${points[0].y}`;
        } else if (points.length === 2 && fromSide && toSide) {
            const p0 = points[0];
            const p1 = points[1];
            const d0 = sideDir(fromSide);
            const d1 = sideDir(toSide);

            const dx = Math.abs(p1.x - p0.x);
            const dy = Math.abs(p1.y - p0.y);
            const s0 = Math.max((Math.abs(d0.x) > 0 ? dx : dy) * 0.4, 100);
            const s1 = Math.max((Math.abs(d1.x) > 0 ? dx : dy) * 0.4, 100);

            const cp1 = { x: p0.x + d0.x * s0, y: p0.y + d0.y * s0 };
            const cp2 = { x: p1.x + d1.x * s1, y: p1.y + d1.y * s1 };
            lastCP2 = cp2;
            pathD = `M ${p0.x} ${p0.y} C ${cp1.x} ${cp1.y} ${cp2.x} ${cp2.y} ${p1.x} ${p1.y}`;
        } else {
            const n = points.length;
            let path = `M ${points[0].x} ${points[0].y}`;

            for (let i = 0; i < n - 1; i++) {
                const p0 = i > 0 ? points[i - 1] : points[0];
                const p1 = points[i];
                const p2 = points[i + 1];
                const p3 = i + 2 < n ? points[i + 2] : points[n - 1];

                let cp1x: number, cp1y: number;
                if (i === 0 && fromSide) {
                    const d0 = sideDir(fromSide);
                    const dx = Math.abs(p2.x - p1.x);
                    const dy = Math.abs(p2.y - p1.y);
                    const s = Math.max(dx, dy) * 0.35;
                    cp1x = p1.x + d0.x * s;
                    cp1y = p1.y + d0.y * s;
                } else {
                    cp1x = p1.x + (p2.x - p0.x) / 6;
                    cp1y = p1.y + (p2.y - p0.y) / 6;
                }

                let cp2x: number, cp2y: number;
                if (i === n - 2 && toSide) {
                    const d1 = sideDir(toSide);
                    const dx = Math.abs(p2.x - p1.x);
                    const dy = Math.abs(p2.y - p1.y);
                    const s = Math.max(dx, dy) * 0.35;
                    cp2x = p2.x + d1.x * s;
                    cp2y = p2.y + d1.y * s;
                } else {
                    cp2x = p2.x - (p3.x - p1.x) / 6;
                    cp2y = p2.y - (p3.y - p1.y) / 6;
                }

                path += ` C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${p2.x} ${p2.y}`;
                if (i === n - 2) lastCP2 = { x: cp2x, y: cp2y };
            }

            pathD = path;
        }
    }

    $: lastPoint = points[points.length - 1];
    $: angle = (() => {
        if (!lastPoint) return 0;
        const ref = lastCP2 ?? (points.length >= 2 ? points[points.length - 2] : lastPoint);
        return Math.atan2(lastPoint.y - ref.y, lastPoint.x - ref.x) * (180 / Math.PI);
    })();
</script>

<g class="arrow">
    <path
        d={pathD}
        fill="none"
        stroke="currentColor"
        stroke-opacity={dashed ? 0.45 : 0.7}
        stroke-width={dashed ? 5 : 10}
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-dasharray={dashed ? "14,9" : undefined} />

    {#if points.length > 0}
        <polygon
            points={dashed ? "-8,-4 0,0 -8,4" : "-13,-6.5 0,0 -13,6.5"}
            fill="currentColor"
            fill-opacity={dashed ? 0.6 : 0.95}
            transform="translate({lastPoint.x}, {lastPoint.y}) rotate({angle})"
        />
    {/if}
</g>

<style>
    .arrow {
        pointer-events: none;
        color: var(--primary-text-color);
    }

    .arrow path {
        transition: stroke 0.3s ease;
    }

    .arrow:hover path {
        stroke-opacity: 1;
    }

    @media print {
        .arrow path,
        .arrow polygon {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
    }
</style>
