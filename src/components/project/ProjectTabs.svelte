<script lang="ts">
    import { onMount } from "svelte";
    import type { Project, ContentBlock } from "../../types";

    export let project: Project | undefined;
    export let onContentChange: (content: ContentBlock | undefined) => void;

    type TabDef = { id: string; label: string; content: ContentBlock };
    let tabs: TabDef[] = [];
    let activeTabIndex = 0;

    // Build tabs from project data
    $: tabs = (() => {
        if (!project) return [];
        const result: TabDef[] = [];
        const pAny: any = project as any;
        
        // Prefer structured tabs object if present
        const fromMap = project.tabs ?? undefined;
        if (fromMap && typeof fromMap === "object") {
            for (const [key, value] of Object.entries(fromMap)) {
                if (value && typeof value === "object") {
                    const cb = value as ContentBlock;
                    result.push({ id: key, label: cb.name ?? key, content: cb });
                }
            }
        }
        
        // Also look for top-level tabN keys
        for (const key of Object.keys(pAny)) {
            if (/^tab\d+$/i.test(key)) {
                const content = pAny[key] as ContentBlock;
                if (content) {
                    const fallback = key.replace(/tab/i, "Tab ");
                    result.push({ id: key, label: content.name ?? fallback, content });
                }
            }
        }
        
        // Sort tabs by numeric suffix if using tabN
        result.sort((a, b) => {
            const na = parseInt(a.id.replace(/\D/g, "")) || 0;
            const nb = parseInt(b.id.replace(/\D/g, "")) || 0;
            return na - nb;
        });
        return result;
    })();

    // Ensure activeTabIndex stays in bounds
    $: if (activeTabIndex >= tabs.length) activeTabIndex = 0;

    // Notify parent when active content changes
    $: activeContent = tabs.length > 0 ? tabs[activeTabIndex].content : project?.content;
    $: onContentChange(activeContent);

    let tabContainerEl: HTMLElement;
    let tabRefs: HTMLElement[] = [];
    let underlineEl: HTMLElement | null = null;

    // Underline positioning based on actual button sizes
    function moveUnderline() {
        if (!tabContainerEl || !underlineEl || tabs.length === 0) return;
        const btn = tabRefs[activeTabIndex];
        if (!btn) return;
        const cRect = tabContainerEl.getBoundingClientRect();
        const bRect = btn.getBoundingClientRect();
        const left = bRect.left - cRect.left;
        const width = bRect.width;
        underlineEl.style.opacity = "1";
        underlineEl.style.width = `${width}px`;
        underlineEl.style.transform = `translateX(${left}px)`;
    }

    $: if (tabs && tabs.length) moveUnderline();
    $: if (activeTabIndex >= 0) moveUnderline();

    onMount(() => {
        const onResize = () => moveUnderline();
        window.addEventListener("resize", onResize);
        setTimeout(moveUnderline, 0);
        return () => window.removeEventListener("resize", onResize);
    });

    function handleTabClick(index: number) {
        activeTabIndex = index;
        moveUnderline();
    }
</script>

{#if tabs.length > 0}
    <nav class="tabs">
        <div class="tab-container" bind:this={tabContainerEl}>
            {#each tabs as tab, i}
                <button
                    class="tab"
                    class:active={i === activeTabIndex}
                    on:click={() => handleTabClick(i)}
                    bind:this={tabRefs[i]}
                >
                    {tab.label}
                </button>
            {/each}
            <div class="underline" bind:this={underlineEl} style="opacity:0"></div>
        </div>
    </nav>
{/if}

<style>
    .tabs {
        margin: 2rem 0;
        border-bottom: 1px solid var(--border-color);
    }

    .tab-container {
        display: flex;
        gap: 0.5rem;
        position: relative;
        overflow-x: auto;
        overflow-y: hidden;
        scrollbar-width: none; /* Hide scrollbar for Firefox */
    }

    /* Hide scrollbar for Chrome/Safari */
    .tab-container::-webkit-scrollbar {
        display: none;
    }

    .tab {
        background: none;
        border: none;
        color: var(--muted-color);
        cursor: pointer;
        font: inherit;
        font-size: 1rem;
        padding: 0.75rem 1.25rem;
        transition: color 0.2s ease;
        white-space: nowrap;
        position: relative;
        flex: 1;
        text-align: center;
    }

    .tab.active {
        color: var(--primary-text-color);
    }

    .tab:hover {
        color: var(--primary-text-color);
    }

    .underline {
        position: absolute;
        bottom: -1px;
        height: 2px;
        background: var(--secondary-text-color);
        transition:
            transform 0.3s ease,
            width 0.3s ease;
        pointer-events: none;
    }
</style>
