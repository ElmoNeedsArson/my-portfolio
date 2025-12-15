<script lang="ts">
    import { push } from "svelte-spa-router";
    import type { Project } from "../../types";

    export let projects: Project[] = [];

    const expertiseAreas = [
        "Math, Data and Computing",
        "Technology and Realization",
        "Creativity and Aesthetics",
        "User and Society",
        "Business and Entrepreneurship"
    ];

    const areaColors: { [key: string]: string } = {
        "Math, Data and Computing": "#3b82f6",
        "Technology and Realization": "#8b5cf6",
        "Creativity and Aesthetics": "#ec4899",
        "User and Society": "#10b981",
        "Business and Entrepreneurship": "#f59e0b"
    };

    let activeTab = 0;

    interface RankedProject {
        project: Project;
        rating: number;
        reason: string;
    }

    function getProjectsForArea(area: string): RankedProject[] {
        const ranked: RankedProject[] = [];

        projects.forEach(project => {
            if (project.expertise) {
                const exp = project.expertise.find(e => e.area === area);
                if (exp && exp.rating > 0) {
                    ranked.push({
                        project,
                        rating: exp.rating,
                        reason: exp.reason || ''
                    });
                }
            }
        });

        // Sort by rating descending
        return ranked.sort((a, b) => b.rating - a.rating);
    }

    function formatDate(dateStr: string): string {
        return new Date(dateStr).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short' 
        });
    }

    function getRatingColor(rating: number): string {
        if (rating >= 8) return '#22c55e';
        if (rating >= 6) return '#eab308';
        if (rating >= 4) return '#f97316';
        return '#ef4444';
    }

    function getShortArea(area: string): string {
        const map: { [key: string]: string } = {
            "Math, Data & Computing": "Math/Data",
            "Technology & Realization": "Technology",
            "Creativity & Aesthetics": "Creativity",
            "User & Society": "User/Society",
            "Business & Entrepreneurship": "Business"
        };
        return map[area] || area;
    }

    $: rankedProjects = getProjectsForArea(expertiseAreas[activeTab]);

    function navigateToProject(slug: string) {
        push(`/${slug}`);
    }
</script>

<div class="visualization-container">
    <!-- <h3>Projects by Expertise Area</h3>
    <p class="description">Browse projects ranked by their rating in each expertise dimension</p> -->

    <!-- Expertise tabs -->
    <div class="tabs-container">
        {#each expertiseAreas as area, index}
            <button
                class="expertise-tab"
                class:active={activeTab === index}
                style="--tab-color: {areaColors[area]}"
                on:click={() => activeTab = index}
            >
                <span class="tab-title">{getShortArea(area)}</span>
                <span class="tab-count">{getProjectsForArea(area).length}</span>
            </button>
        {/each}
    </div>

    <!-- Projects list -->
    <div class="projects-list">
        {#if rankedProjects.length === 0}
            <div class="empty-state">
                <p>No projects found for this expertise area</p>
            </div>
        {:else}
            {#each rankedProjects as ranked, index}
                <div 
                    class="project-item" 
                    style="--item-color: {areaColors[expertiseAreas[activeTab]]}"
                    on:click={() => navigateToProject(ranked.project.slug)}
                    on:keydown={(e) => e.key === 'Enter' && navigateToProject(ranked.project.slug)}
                    role="button"
                    tabindex="0"
                >
                    <!-- Rank badge -->
                    <div class="rank-badge" style="background-color: {areaColors[expertiseAreas[activeTab]]}">
                        #{index + 1}
                    </div>

                    <!-- Project info -->
                    <div class="project-info">
                        <div class="project-header">
                            <h4 class="project-title">{ranked.project.title}</h4>
                            <div class="project-meta">
                                <span class="project-date">{formatDate(ranked.project.date)}</span>
                                <span class="project-type">{ranked.project.type}</span>
                            </div>
                        </div>

                        <!-- Rating bar -->
                        <div class="rating-container">
                            <div class="rating-label">Rating</div>
                            <div class="rating-bar-bg">
                                <div 
                                    class="rating-bar-fill" 
                                    style="width: {(ranked.rating / 10) * 100}%; background-color: {getRatingColor(ranked.rating)}"
                                ></div>
                            </div>
                            <div class="rating-value" style="color: {getRatingColor(ranked.rating)}">
                                {ranked.rating.toFixed(1)}
                            </div>
                        </div>

                        <!-- Reason -->
                        {#if ranked.reason}
                            <div class="reason-text">
                                <strong>Why:</strong> {ranked.reason}
                            </div>
                        {/if}

                        <!-- Tags and Tech Stack side by side -->
                        <div class="bottom-row">
                            <!-- Tags -->
                            <div class="project-tags">
                                {#each ranked.project.tags.slice(0, 5) as tag}
                                    <span class="tag">{tag}</span>
                                {/each}
                            </div>

                            <!-- Languages & Tools -->
                            <div class="tech-stack">
                                {#if ranked.project.languages.length > 0}
                                    <div class="tech-group">
                                        <span class="tech-label">Languages:</span>
                                        <span class="tech-items">{ranked.project.languages.join(', ')}</span>
                                    </div>
                                {/if}
                                {#if ranked.project.tools.length > 0}
                                    <div class="tech-group">
                                        <span class="tech-label">Tools:</span>
                                        <span class="tech-items">{ranked.project.tools.join(', ')}</span>
                                    </div>
                                {/if}
                            </div>
                        </div>
                    </div>
                </div>
            {/each}
        {/if}
    </div>
</div>

<style>
    .visualization-container {
        width: 100%;
        max-width: 100%;
        padding: 1rem 0.5rem;
        box-sizing: border-box;
    }

    h3 {
        font-size: 1.25rem;
        font-weight: 500;
        margin-bottom: 0.5rem;
        color: var(--primary-text-color);
        max-width: 100%;
    }

    .tabs-container {
        display: flex;
        gap: 0.5rem;
        margin-bottom: 0.5rem;
        border-bottom: 2px solid var(--border-color);
        padding-bottom: 0.5rem;
        overflow-x: visible;
    }

    .expertise-tab {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 0.25rem;
        padding: 0.5rem 0.25rem;
        background: transparent;
        border: 2px solid var(--border-color);
        border-radius: 8px 8px 0 0;
        color: var(--muted-color);
        font-size: 0.7rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
        white-space: normal;
        text-align: center;
        line-height: 1.2;
        flex: 1;
        min-width: 0;
        word-wrap: break-word;
    }

    .expertise-tab:hover {
        background: var(--hover-color);
        border-color: var(--tab-color);
        color: var(--primary-text-color);
    }

    .expertise-tab.active {
        background: var(--tab-color);
        border-color: var(--tab-color);
        color: white;
        transform: translateY(2px);
    }

    .tab-title {
        font-weight: 600;
    }

    .tab-count {
        background: rgba(255, 255, 255, 0.2);
        padding: 0.125rem 0.5rem;
        border-radius: 12px;
        font-size: 0.75rem;
        font-weight: 700;
    }

    .expertise-tab.active .tab-count {
        background: rgba(255, 255, 255, 0.3);
    }

    .projects-list {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        max-height: 300px;
        overflow-y: auto;
        padding-right: 0.5rem;
        width: 100%;
        max-width: 100%;
        box-sizing: border-box;
    }

    /* Custom scrollbar */
    .projects-list::-webkit-scrollbar {
        width: 8px;
    }

    .projects-list::-webkit-scrollbar-track {
        background: var(--background-color);
        border-radius: 4px;
    }

    .projects-list::-webkit-scrollbar-thumb {
        background: var(--border-color);
        border-radius: 4px;
    }

    .projects-list::-webkit-scrollbar-thumb:hover {
        background: var(--muted-color);
    }

    .empty-state {
        text-align: center;
        padding: 3rem;
        color: var(--muted-color);
    }

    .project-item {
        display: flex;
        gap: 0.75rem;
        background: var(--background-color);
        border: 2px solid var(--border-color);
        border-left: 4px solid var(--item-color);
        border-radius: 8px;
        padding: 0.875rem;
        transition: all 0.2s ease;
        cursor: pointer;
        box-sizing: border-box;
    }

    .project-item:hover {
        border-color: var(--item-color);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .rank-badge {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        border-radius: 6px;
        color: white;
        font-size: 1.1rem;
        font-weight: 700;
        flex-shrink: 0;
    }

    .project-info {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        min-width: 0;
        max-width: 100%;
        overflow: hidden;
    }

    .project-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 1rem;
    }

    .project-title {
        margin: 0;
        font-size: 0.95rem;
        font-weight: 600;
        color: var(--primary-text-color);
    }

    .project-meta {
        display: flex;
        gap: 0.75rem;
        align-items: center;
        flex-shrink: 0;
    }

    .project-date {
        font-size: 0.75rem;
        color: var(--muted-color);
    }

    .project-type {
        font-size: 0.7rem;
        padding: 0.25rem 0.5rem;
        background: var(--hover-color);
        border-radius: 4px;
        color: var(--primary-text-color);
        text-transform: uppercase;
        font-weight: 600;
    }

    .rating-container {
        display: grid;
        grid-template-columns: 55px 1fr 45px;
        align-items: center;
        gap: 0.5rem;
    }

    .rating-label {
        font-size: 0.7rem;
        font-weight: 600;
        color: var(--muted-color);
    }

    .rating-bar-bg {
        height: 10px;
        background: #2a2a2a;
        border-radius: 5px;
        overflow: hidden;
    }

    .rating-bar-fill {
        height: 100%;
        border-radius: 6px;
        transition: width 0.5s ease;
    }

    .rating-value {
        font-size: 0.9rem;
        font-weight: 700;
        text-align: right;
    }

    .reason-text {
        font-size: 0.8rem;
        color: var(--muted-color);
        font-style: italic;
        line-height: 1.4;
    }

    .reason-text strong {
        color: var(--primary-text-color);
        font-style: normal;
    }

    .bottom-row {
        display: flex;
        gap: 0.75rem;
        align-items: flex-start;
        max-width: 100%;
    }

    .project-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        flex: 1;
        min-width: 0;
    }

    .tag {
        font-size: 0.7rem;
        padding: 0.25rem 0.625rem;
        background: var(--hover-color);
        border: 1px solid var(--border-color);
        border-radius: 12px;
        color: var(--primary-text-color);
        flex-shrink: 0;
    }

    .tech-stack {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        font-size: 0.75rem;
    }

    .tech-group {
        display: flex;
        gap: 0.5rem;
        max-width: 100%;
    }

    .tech-label {
        color: var(--muted-color);
        font-weight: 600;
        min-width: 80px;
        flex-shrink: 0;
    }

    .tech-items {
        color: var(--primary-text-color);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    @media (max-width: 768px) {
        .project-item {
            flex-direction: column;
        }

        .rank-badge {
            width: 100%;
            height: 36px;
        }

        .project-header {
            flex-direction: column;
            gap: 0.5rem;
        }

        .rating-container {
            grid-template-columns: 50px 1fr 45px;
        }
    }
</style>
