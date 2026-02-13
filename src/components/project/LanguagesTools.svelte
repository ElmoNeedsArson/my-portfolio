<script lang="ts">
    import { navigateToSearch } from "../../lib/searchNavigation";
    import { getCategoryById } from "../../lib/searchCategories";

    export let languages: string[] = [];
    export let tools: string[] = [];

    const languagesCategory = getCategoryById("languages");
    const toolsCategory = getCategoryById("tools");

    function handleLanguageClick(event: MouseEvent, language: string) {
        event.stopPropagation();
        navigateToSearch(language, "languages");
    }

    function handleToolClick(event: MouseEvent, tool: string) {
        event.stopPropagation();
        navigateToSearch(tool, "tools");
    }
</script>

{#if languages.length > 0 || tools.length > 0}
    <div class="meta-info">
        {#if languages.length > 0}
            <div class="languages">
                <h3>Languages</h3>
                <div class="chips">
                    {#each languages as language}
                        <button
                            class="chip language-chip"
                            on:click={(e) => handleLanguageClick(e, language)}
                        >
                            <svelte:component
                                this={languagesCategory.icon}
                                size="16"
                            />
                            {language}
                        </button>
                    {/each}
                </div>
            </div>
        {/if}
        {#if tools.length > 0}
            <div class="tools">
                <h3>Tools</h3>
                <div class="chips">
                    {#each tools as tool}
                        <button
                            class="chip tool-chip"
                            on:click={(e) => handleToolClick(e, tool)}
                        >
                            <svelte:component this={toolsCategory.icon} size="16" />
                            {tool}
                        </button>
                    {/each}
                </div>
            </div>
        {/if}
    </div>
{/if}

<style>
    .meta-info {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 2rem;
        margin: 2rem 0;
    }

    .languages,
    .tools {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }

    .languages h3,
    .tools h3 {
        margin: 0;
        font-size: 1rem;
        color: var(--secondary-text-color);
        font-weight: 600;
    }

    .chips {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
    }

    .chip {
        background: var(--secondary-background-color);
        border: 1px solid var(--border-color);
        border-radius: 6px;
        padding: 0.4rem 0.75rem;
        font-size: 0.85rem;
        color: var(--primary-text-color);
        cursor: pointer;
        font-family: inherit;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        gap: 0.25rem;
    }

    @media (hover: hover) {
        .chip:hover {
            background: var(--hover-color);
            border-color: var(--secondary-text-color);
            transform: translateY(-1px);
        }

        .language-chip:hover {
            border-color: #61dafb;
        }

        .tool-chip:hover {
            border-color: #ff6b35;
        }
    }

    @media (max-width: 768px) {
        .meta-info {
            grid-template-columns: 1fr;
            gap: 1.5rem;
        }
    }
</style>
