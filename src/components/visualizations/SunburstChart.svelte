<script lang="ts">
    import { onMount } from "svelte";
    import * as d3 from "d3";
    import { loadAllProjects, searchProjects } from "../../lib/searchUtils";
    import { buildSkillsHierarchy, type SkillNode } from "../../lib/skillsMapper";
    import { navigateToSearch } from "../../lib/searchNavigation";
    import { getAllTermsForLabel } from "../../lib/skillsTaxonomy";

    type ArcNode = d3.HierarchyRectangularNode<SkillNode>;
    type TextSel = d3.Selection<SVGTextElement, ArcNode, null, unknown>;

    const RADIUS = 93;
    const VIEWBOX_PAD = 18;

    const RING_W1 = 1.6;
    const RING_W2 = 1.2;
    const RING_W3 = 1.0;

    const ringEdges = [
        RADIUS,
        RADIUS * (1 + RING_W1),
        RADIUS * (1 + RING_W1 + RING_W2),
        RADIUS * (1 + RING_W1 + RING_W2 + RING_W3),
    ];

    const CHAR_WIDTHS = [1, 0, 6.0];

    const CATEGORY_COLORS: Record<string, string> = {
        Programming: "#D4703A",
        "3D & Visualization": "#C86840",
        "Data & Analysis": "#C8A030",
        "AI & Machine Learning": "#D4901C",
        "Electronics & Hardware": "#C05030",
        Fabrication: "#B83820",
        "Game Development": "#C87040",
        "Infrastructure": "#7A6850",
        "Creative Tools": "#D49828",
    };

    let container: HTMLDivElement;
    let showOuterRing = true;
    let outerRingEl: SVGGElement | null = null;
    let outerLabelEl: SVGGElement | null = null;

    let tooltipVisible = false;
    let tooltipX = 0;
    let tooltipY = 0;
    let tooltipName = "";
    let tooltipCount = 0;
    let tooltipProjects: string[] = [];

    $: if (outerRingEl && outerLabelEl) {
        const display = showOuterRing ? "" : "none";
        outerRingEl.style.display = display;
        outerLabelEl.style.display = display;
    }

    function getNodeColor(d: ArcNode): string {
        const cat = d.ancestors().find((n) => n.depth === 1) ?? d;
        const base = CATEGORY_COLORS[cat.data.name] ?? "#6b7280";
        if (d.depth <= 1) return base;
        return d3.interpolateRgb(base, "#ffffff")(((d.depth - 1) / 4) * 0.55);
    }

    onMount(() => {
        const root = d3
            .partition<SkillNode>()
            .size([2 * Math.PI, 4])(
                d3.hierarchy<SkillNode>(buildSkillsHierarchy(loadAllProjects()))
                    .sum((d) => d.value ?? 0)
                    .sort((a, b) => (b.value ?? 0) - (a.value ?? 0)),
            );

        const arc = d3
            .arc<any>()
            .startAngle((d) => d.x0)
            .endAngle((d) => d.x1)
            .padAngle((d) => Math.min((d.x1 - d.x0) / 2, 0.005))
            .padRadius(ringEdges[1])
            .innerRadius((d) => ringEdges[d.depth - 1] ?? 0)
            .outerRadius((d) => (ringEdges[d.depth] ?? 0) - 1);

        function wrapLabel(el: TextSel, d: ArcNode): void {
            const text = d.data.name;
            const charWidth = CHAR_WIDTHS[d.depth - 1] ?? 0;
            const midR = (ringEdges[d.depth - 1] + ringEdges[d.depth]) / 2;
            if (text.length * charWidth <= midR * (d.x1 - d.x0) || !text.includes(" ")) {
                el.text(text);
                return;
            }
            const words = text.split(" ");
            let bestSplit = 1;
            let bestMax = Infinity;
            for (let i = 1; i < words.length; i++) {
                const max = Math.max(
                    words.slice(0, i).join(" ").length,
                    words.slice(i).join(" ").length,
                );
                if (max < bestMax) { bestMax = max; bestSplit = i; }
            }
            el.text(null);
            el.append("tspan").attr("x", 0).attr("dy", "-0.55em").text(words.slice(0, bestSplit).join(" "));
            el.append("tspan").attr("x", 0).attr("dy", "1.1em").text(words.slice(bestSplit).join(" "));
        }

        function labelTransform(d: ArcNode): string {
            const x = (((d.x0 + d.x1) / 2) * 180) / Math.PI;
            const y = (ringEdges[d.depth - 1] + ringEdges[d.depth]) / 2;
            return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})`;
        }

        function onClick(event: MouseEvent, d: ArcNode) {
            event.stopPropagation();
            if (d.depth <= 1) return;
            const terms = getAllTermsForLabel(d.data.name);
            const inTools = searchProjects("tools", terms, { exactMatch: true }).projects.length > 0;
            navigateToSearch(terms, inTools ? "tools" : "languages");
        }

        function setTooltip(d: ArcNode) {
            tooltipName = d.data.name;
            const titles = [...new Set(d.descendants().flatMap((n) => n.data.projectTitles ?? []))];
            tooltipCount = titles.length;
            tooltipProjects = titles.slice(0, 6);
            tooltipVisible = true;
        }

        function onArcMove(event: MouseEvent) {
            const rect = container.getBoundingClientRect();
            const zoom = rect.width / container.offsetWidth || 1;
            tooltipX = (event.clientX - rect.left) / zoom + 28;
            tooltipY = (event.clientY - rect.top) / zoom + 15;
        }

        function onArcEnter(event: MouseEvent, d: ArcNode) {
            d3.select(event.currentTarget as SVGPathElement)
                .style("filter", "brightness(1.3)");
            setTooltip(d);
        }

        function onArcLeave(event: MouseEvent) {
            d3.select(event.currentTarget as SVGPathElement).style("filter", null);
            tooltipVisible = false;
        }

        function onOuterEnter(event: MouseEvent, d: ArcNode) {
            d3.select(event.currentTarget as SVGPathElement)
                .attr("fill", "rgba(255,255,255,0.07)");
            setTooltip(d);
        }

        function onOuterLeave(event: MouseEvent) {
            d3.select(event.currentTarget as SVGPathElement).attr("fill", "none");
            tooltipVisible = false;
        }

        const vbHalf = ringEdges[3] + VIEWBOX_PAD;
        const vbSize = vbHalf * 2;
        const nodes = root.descendants().filter((d) => d.x1 > d.x0);
        const innerNodes = nodes.filter((d) => d.depth >= 1 && d.depth <= 2);
        const outerNodes = nodes.filter((d) => d.depth === 3);

        const svg = d3
            .select(container)
            .append("svg")
            .attr("viewBox", [-vbHalf, -vbHalf, vbSize, vbSize].join(" "))
            .style("width", "100%")
            .style("max-width", `${vbSize}px`)
            .style("display", "block")
            .style("margin", "0 auto");

        const defs = svg.append("defs");
        const domeGrad = defs.append("radialGradient")
            .attr("id", "sg-dome").attr("cx", "50%").attr("cy", "38%").attr("r", "62%");
        domeGrad.append("stop").attr("offset", "0%")
            .attr("stop-color", "white").attr("stop-opacity", 0.18);
        domeGrad.append("stop").attr("offset", "100%")
            .attr("stop-color", "white").attr("stop-opacity", 0.0);

        const g = svg.append("g");

        ringEdges.slice(0, 3).forEach((r) => {
            g.append("circle").attr("r", r)
                .attr("fill", "none")
                .attr("stroke", "rgba(255,255,255,0.13)")
                .attr("stroke-width", 1)
                .attr("pointer-events", "none");
        });

        g.append("g")
            .selectAll<SVGPathElement, ArcNode>("path")
            .data(innerNodes)
            .join("path")
            .attr("fill", getNodeColor)
            .attr("fill-opacity", (d) => (d.depth === 1 ? 1.0 : 0.85))
            .attr("stroke", "rgba(0,0,0,0.18)")
            .attr("stroke-width", 0.5)
            .attr("d", arc)
            .style("cursor", (d) => d.depth > 1 ? "pointer" : "default")
            .on("mousedown", (event: MouseEvent, d: ArcNode) => { if (d.depth > 1) event.stopPropagation(); })
            .on("mouseenter", onArcEnter)
            .on("mousemove", onArcMove)
            .on("mouseleave", onArcLeave)
            .on("click", onClick);

        const outerGroup = g.append("g");
        outerRingEl = outerGroup.node();
        outerGroup
            .selectAll<SVGPathElement, ArcNode>("path")
            .data(outerNodes)
            .join("path")
            .attr("fill", "none")
            .attr("pointer-events", "all")
            .style("cursor", "pointer")
            .attr("d", arc)
            .on("mousedown", (event: MouseEvent) => event.stopPropagation())
            .on("mouseenter", onOuterEnter)
            .on("mousemove", onArcMove)
            .on("mouseleave", onOuterLeave)
            .on("click", onClick);

        g.append("g")
            .attr("pointer-events", "none")
            .attr("text-anchor", "middle")
            .style("user-select", "none")
            .selectAll<SVGTextElement, ArcNode>("text")
            .data(innerNodes)
            .join("text")
            .attr("dy", "0.35em")
            .attr("fill", "white")
            .attr("transform", labelTransform)
            .style("font-size", "11px")
            .style("font-weight", "600")
            .each(function (d) { wrapLabel(d3.select<SVGTextElement, ArcNode>(this), d); });

        const outerLabelGroup = g.append("g")
            .attr("pointer-events", "none")
            .attr("text-anchor", "middle")
            .style("user-select", "none");
        outerLabelGroup
            .selectAll<SVGTextElement, ArcNode>("text")
            .data(outerNodes)
            .join("text")
            .attr("dy", "0.35em")
            .attr("fill", "var(--primary-text-color, #e2e8f0)")
            .attr("opacity", 0.75)
            .attr("transform", labelTransform)
            .style("font-size", "10px")
            .style("font-weight", "600")
            .each(function (d) { wrapLabel(d3.select<SVGTextElement, ArcNode>(this), d); });
        outerLabelEl = outerLabelGroup.node();

        g.append("circle").attr("r", ringEdges[2])
            .attr("fill", "url(#sg-dome)").attr("pointer-events", "none");

        g.append("circle").attr("r", RADIUS - 4)
            .attr("fill", "rgba(8, 12, 20, 0.72)").attr("pointer-events", "none");

        g.append("text")
            .attr("text-anchor", "middle").attr("dy", "0.35em")
            .attr("fill", "rgba(255,255,255,0.88)")
            .style("font-size", "12px").style("font-weight", "600")
            .style("pointer-events", "none")
            .text("All Skills");

        g.attr("transform", "scale(0.04)")
            .transition().duration(720).ease(d3.easeBackOut)
            .attr("transform", "scale(1)");
    });
</script>

<div class="sunburst-wrapper">
    <div class="toggle-row">
        <label class="toggle-label">
            <input type="checkbox" bind:checked={showOuterRing} />
            Details
        </label>
    </div>

    <div class="chart-container" bind:this={container}></div>

    {#if tooltipVisible}
        <div class="tooltip" style="left: {tooltipX}px; top: {tooltipY}px;">
            <div class="tooltip-name">{tooltipName}</div>
            <div class="tooltip-count">
                {tooltipCount}
                {tooltipCount === 1 ? "project" : "projects"}
            </div>
            {#if tooltipProjects.length > 0}
                <ul class="tooltip-projects">
                    {#each tooltipProjects as title}
                        <li>{title}</li>
                    {/each}
                </ul>
            {/if}
        </div>
    {/if}
</div>

<style>
    .sunburst-wrapper {
        position: relative;
        width: 100%;
        padding: 0.5rem 0;
    }

    .toggle-row {
        display: flex;
        justify-content: flex-end;
        padding-bottom: 0.5rem;
    }

    .toggle-label {
        display: flex;
        align-items: center;
        gap: 0.35rem;
        font-size: 0.8rem;
        color: var(--muted-color, rgba(0, 0, 0, 0.55));
        cursor: pointer;
        user-select: none;
    }

    .chart-container {
        width: 100%;
        margin: 0 auto;
    }

    .chart-container :global(path) {
        transition: filter 0.15s ease;
    }

    .tooltip {
        position: absolute;
        pointer-events: none;
        background: rgba(15, 15, 25, 0.92);
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 8px;
        padding: 0.6rem 0.85rem;
        font-size: 0.88rem;
        z-index: 100;
        max-width: 220px;
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
    }

    .tooltip-name {
        font-weight: 700;
        color: white;
        margin-bottom: 0.2rem;
        font-size: 0.92rem;
    }

    .tooltip-count {
        color: rgba(255, 255, 255, 0.65);
        font-size: 0.82rem;
        margin-bottom: 0.4rem;
    }

    .tooltip-projects {
        margin: 0;
        padding: 0;
        list-style: none;
        display: flex;
        flex-direction: column;
        gap: 0.18rem;
    }

    .tooltip-projects li {
        color: rgba(255, 255, 255, 0.8);
        font-size: 0.8rem;
        line-height: 1.3;
    }

    .tooltip-projects li::before {
        content: "· ";
        color: rgba(255, 255, 255, 0.4);
    }
</style>
