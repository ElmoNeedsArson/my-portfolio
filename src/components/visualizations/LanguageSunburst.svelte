<script lang="ts">
    import type { Project } from "../../types";

    export let projects: Project[] = [];

    interface LanguageGroup {
        language: string;
        count: number;
        projects: { title: string; slug: string }[];
    }

    let languageGroups: LanguageGroup[] = [];
    let hoveredSegment: string | null = null;
    let totalProjects = 0;

    $: {
        const langMap = new Map<string, { title: string; slug: string }[]>();
        
        projects.forEach(project => {
            project.languages.forEach(lang => {
                if (!langMap.has(lang)) {
                    langMap.set(lang, []);
                }
                langMap.get(lang)!.push({ title: project.title, slug: project.slug });
            });
        });

        languageGroups = Array.from(langMap.entries())
            .map(([language, projects]) => ({
                language,
                count: projects.length,
                projects
            }))
            .sort((a, b) => b.count - a.count);

        totalProjects = projects.length;
    }

    function getColor(index: number): string {
        const colors = [
            "#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6", "#f59e0b",
            "#6366f1", "#a855f7", "#06b6d4", "#10b981", "#f97316",
            "#0ea5e9", "#d946ef", "#84cc16"
        ];
        return colors[index % colors.length];
    }

    function getSunburstPath(index: number, level: number, totalInLevel: number, isOuter: boolean): string {
        const centerX = 200;
        const centerY = 200;
        const innerRadius = isOuter ? 100 : 50;
        const outerRadius = isOuter ? 150 : 100;
        
        const anglePerSegment = (2 * Math.PI) / totalInLevel;
        const startAngle = index * anglePerSegment - Math.PI / 2;
        const endAngle = startAngle + anglePerSegment;

        const x1 = centerX + innerRadius * Math.cos(startAngle);
        const y1 = centerY + innerRadius * Math.sin(startAngle);
        const x2 = centerX + outerRadius * Math.cos(startAngle);
        const y2 = centerY + outerRadius * Math.sin(startAngle);
        const x3 = centerX + outerRadius * Math.cos(endAngle);
        const y3 = centerY + outerRadius * Math.sin(endAngle);
        const x4 = centerX + innerRadius * Math.cos(endAngle);
        const y4 = centerY + innerRadius * Math.sin(endAngle);

        const largeArc = anglePerSegment > Math.PI ? 1 : 0;

        return `M ${x1} ${y1} L ${x2} ${y2} A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${x3} ${y3} L ${x4} ${y4} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x1} ${y1} Z`;
    }

    function getProjectPath(langIndex: number, projectIndex: number, totalProjects: number, parentCount: number): string {
        const centerX = 200;
        const centerY = 200;
        const innerRadius = 100;
        const outerRadius = 150;
        
        const anglePerLang = (2 * Math.PI) / languageGroups.length;
        const langStartAngle = langIndex * anglePerLang - Math.PI / 2;
        
        const anglePerProject = anglePerLang / totalProjects;
        const startAngle = langStartAngle + projectIndex * anglePerProject;
        const endAngle = startAngle + anglePerProject;

        const x1 = centerX + innerRadius * Math.cos(startAngle);
        const y1 = centerY + innerRadius * Math.sin(startAngle);
        const x2 = centerX + outerRadius * Math.cos(startAngle);
        const y2 = centerY + outerRadius * Math.sin(startAngle);
        const x3 = centerX + outerRadius * Math.cos(endAngle);
        const y3 = centerY + outerRadius * Math.sin(endAngle);
        const x4 = centerX + innerRadius * Math.cos(endAngle);
        const y4 = centerY + innerRadius * Math.sin(endAngle);

        const largeArc = anglePerProject > Math.PI ? 1 : 0;

        return `M ${x1} ${y1} L ${x2} ${y2} A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${x3} ${y3} L ${x4} ${y4} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x1} ${y1} Z`;
    }
</script>

<div class="visualization-container">
    <h3>Language Evolution Sunburst</h3>
    <p class="description">Hierarchical view of languages and the projects that use them</p>

    <div class="sunburst-wrapper">
        <svg width="400" height="400" viewBox="0 0 400 400" class="sunburst-svg">
            <!-- Center circle -->
            <circle cx="200" cy="200" r="50" fill="var(--background-color)" stroke="var(--border-color)" stroke-width="2"/>
            <text x="200" y="195" text-anchor="middle" class="center-label">Languages</text>
            <text x="200" y="210" text-anchor="middle" class="center-count">{languageGroups.length}</text>

            <!-- Inner ring: Languages -->
            {#each languageGroups as langGroup, i}
                <g
                    on:mouseenter={() => hoveredSegment = langGroup.language}
                    on:mouseleave={() => hoveredSegment = null}
                    role="button"
                    tabindex="0"
                >
                    <path
                        d={getSunburstPath(i, 1, languageGroups.length, false)}
                        fill={getColor(i)}
                        opacity={hoveredSegment === null || hoveredSegment === langGroup.language ? 0.7 : 0.2}
                        stroke="var(--background-color)"
                        stroke-width="2"
                        class="segment"
                    />
                </g>
            {/each}

            <!-- Outer ring: Projects -->
            {#each languageGroups as langGroup, langIndex}
                {#each langGroup.projects as project, projIndex}
                    <g
                        on:mouseenter={() => hoveredSegment = `${langGroup.language}-${project.title}`}
                        on:mouseleave={() => hoveredSegment = null}
                        role="button"
                        tabindex="0"
                    >
                        <path
                            d={getProjectPath(langIndex, projIndex, langGroup.projects.length, languageGroups.length)}
                            fill={getColor(langIndex)}
                            opacity={hoveredSegment === null || hoveredSegment.startsWith(langGroup.language) || hoveredSegment === `${langGroup.language}-${project.title}` ? 0.5 : 0.1}
                            stroke="var(--background-color)"
                            stroke-width="1"
                            class="segment"
                        />
                    </g>
                {/each}
            {/each}
        </svg>

        {#if hoveredSegment}
            {@const lang = languageGroups.find(lg => hoveredSegment === lg.language || hoveredSegment?.startsWith(lg.language + "-"))}
            {#if lang}
                <div class="tooltip">
                    {#if hoveredSegment === lang.language}
                        <strong>{lang.language}</strong>
                        <p>{lang.count} projects</p>
                    {:else}
                        {@const projectTitle = hoveredSegment?.split('-')[1]}
                        <strong>{projectTitle}</strong>
                        <p>Uses {lang.language}</p>
                    {/if}
                </div>
            {/if}
        {/if}
    </div>

    <div class="legend">
        <div class="legend-items">
            {#each languageGroups.slice(0, 8) as lang, i}
                <div class="legend-item">
                    <div class="legend-color" style="background-color: {getColor(i)};"></div>
                    <span>{lang.language} ({lang.count})</span>
                </div>
            {/each}
        </div>
        <p class="legend-note">Inner ring: Languages • Outer ring: Individual projects</p>
    </div>
</div>

<style>
    .visualization-container {
        width: 100%;
        padding: 1rem;
    }

    h3 {
        font-size: 1.25rem;
        font-weight: 500;
        margin-bottom: 0.5rem;
        color: var(--primary-text-color);
    }

    .description {
        font-size: 0.85rem;
        color: var(--muted-color);
        margin-bottom: 1.5rem;
    }

    .sunburst-wrapper {
        background-color: var(--background-color);
        border: 1px solid var(--border-color);
        border-radius: 8px;
        padding: 1.5rem;
        position: relative;
        display: flex;
        justify-content: center;
    }

    .sunburst-svg {
        max-width: 100%;
        height: auto;
    }

    .segment {
        cursor: pointer;
        transition: opacity 0.2s;
    }

    .center-label {
        font-size: 0.85rem;
        font-weight: 600;
        fill: var(--primary-text-color);
    }

    .center-count {
        font-size: 1.25rem;
        font-weight: 700;
        fill: var(--primary-text-color);
    }

    .tooltip {
        position: absolute;
        bottom: 1rem;
        left: 50%;
        transform: translateX(-50%);
        background-color: var(--background-color);
        border: 1px solid var(--border-color);
        border-radius: 6px;
        padding: 0.75rem 1rem;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        text-align: center;
    }

    .tooltip strong {
        display: block;
        font-size: 0.9rem;
        color: var(--primary-text-color);
        margin-bottom: 0.25rem;
    }

    .tooltip p {
        margin: 0;
        font-size: 0.8rem;
        color: var(--muted-color);
    }

    .legend {
        margin-top: 1rem;
        padding-top: 1rem;
        border-top: 1px solid var(--border-color);
    }

    .legend-items {
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
        margin-bottom: 0.75rem;
    }

    .legend-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.85rem;
        color: var(--primary-text-color);
    }

    .legend-color {
        width: 14px;
        height: 14px;
        border-radius: 3px;
    }

    .legend-note {
        margin: 0;
        font-size: 0.75rem;
        color: var(--muted-color);
        font-style: italic;
    }
</style>
