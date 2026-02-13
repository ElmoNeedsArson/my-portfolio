<script lang="ts">
    import { navigateToSearch } from "../../lib/searchNavigation";
    import { getCategoryById } from "../../lib/searchCategories";

    export let tags: string[] = [];

    const tagsCategory = getCategoryById("tags");

    function handleTagClick(event: MouseEvent, tag: string) {
        event.stopPropagation();
        navigateToSearch(tag, "tags");
    }
</script>

{#if tags.length > 0}
    <div class="tags">
        {#each tags as tag}
            <button class="tag" on:click={(e) => handleTagClick(e, tag)}>
                <svelte:component this={tagsCategory.icon} size="14" />
                {tag}
            </button>
        {/each}
    </div>
{/if}

<style>
    .tags {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        margin: 1rem 0;
    }

    .tag {
        background: transparent;
        padding: 0.2rem 0.6rem;
        border-radius: 999px;
        font-size: 0.8rem;
        outline: var(--border-color) 1px solid;
        border: none;
        color: var(--primary-text-color);
        cursor: pointer;
        font-family: inherit;
        transition: all 0.2s ease;
        align-items: center;
        display: flex;
        gap: 4px;
    }

    @media (hover: hover) {
        .tag:hover {
            background: var(--hover-color);
            transform: translateY(-1px);
        }
    }
</style>
