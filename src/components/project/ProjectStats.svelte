<script lang="ts">
    import { onMount } from "svelte";
    import { CloudDownload, Eye, Github } from "@lucide/svelte";
    import type { Project } from "../../types";

    export let project: Project;

    $: isObsidianPlugin = project.slug === "obsidian-plugin";
    $: isPortfolioWebsite = project.slug === "portfolio-website-svelte";

    let liveInstallations: number | null = null;
    let liveVisits: number | null = null;

    $: displayCount =
        isObsidianPlugin && liveInstallations !== null
            ? liveInstallations
            : isPortfolioWebsite && liveVisits !== null
            ? liveVisits
            : project.installations;
    $: hasCount = typeof displayCount === "number";
    $: countLabel = isPortfolioWebsite ? "visits" : "downloads";

    onMount(() => {
        if (!isObsidianPlugin && !isPortfolioWebsite) return;

        const endpoint = isObsidianPlugin
            ? "/api/obsidian-downloads"
            : "/api/site-visits";
        const key = isObsidianPlugin ? "downloads" : "total visits";

        (async () => {
            try {
                const res = await fetch(endpoint);
                if (!res.ok) return;
                const value = (await res.json())?.[key];
                if (typeof value !== "number" || !Number.isFinite(value)) return;
                if (isObsidianPlugin) {
                    if (value > 0) liveInstallations = value;
                } else {
                    liveVisits = value;
                }
            } catch {}
        })();
    });
</script>

{#if hasCount}
    <div class="stats">
        <div class="stat">
            {#if isPortfolioWebsite}
                <Eye size={14} />
            {:else}
                <CloudDownload size={14} />
            {/if}
            <span class="stat-count">{(displayCount ?? 0).toLocaleString()}</span>
            <span class="stat-label">{countLabel}</span>
        </div>
        {#if isObsidianPlugin}
            <div class="stat">
                <Github size={14} />
                <span class="stat-count">47</span>
                <span class="stat-label">github stars</span>
            </div>
        {/if}
    </div>
{/if}

<style>
    .stats {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.5rem;
        margin: 1rem 0;
    }

    .stat {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 0.35rem 0.9rem;
        border-radius: 999px;
        font-size: 1rem;
        outline: var(--secondary-text-color) 1px solid;
        color: var(--primary-text-color);
    }

    .stat-count {
        font-weight: 600;
    }

    .stat-label {
        color: var(--muted-color);
    }
</style>
