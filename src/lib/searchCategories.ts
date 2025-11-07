import { Folder, Tag, Code2, ToolCase } from '@lucide/svelte';
import type { SearchCategory } from './searchUtils';

export interface CategoryDefinition {
    id: SearchCategory;
    label: string;
    icon: any; // Lucide icon component idk what type to use here
}

export const SEARCH_CATEGORIES: readonly CategoryDefinition[] = [
    { id: "projects", label: "Project Names", icon: Folder },
    { id: "tags", label: "Tags", icon: Tag },
    { id: "languages", label: "Languages", icon: Code2 },
    { id: "tools", label: "Tools", icon: ToolCase },
] as const;

export function getCategoryById(categoryId: SearchCategory): CategoryDefinition {
    const category = SEARCH_CATEGORIES.find(cat => cat.id === categoryId);
    if (!category) {
        throw new Error(`Unknown category: ${categoryId}`);
    }
    return category;
}