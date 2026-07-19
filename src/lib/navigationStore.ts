import { writable } from 'svelte/store';

export type TabId = 'projects' | 'projectArchive' | 'cv' | 'eindhoven';

export interface TabDefinition {
    id: TabId;
    label: string;
    icon: 'ToyBrick' | 'Pin' | 'FileText';
    slug: string;
}

export const lastVisitedTab = writable<TabId>('projects');

// Tab definitions
export const tabs: readonly TabDefinition[] = [
    { id: 'projects', label: 'Highlights', icon: 'ToyBrick', slug: 'highlights' },
    {
        id: 'projectArchive',
        label: 'Projects',
        icon: 'Pin',
        slug: 'projects',
    },
    { id: 'cv', label: 'CV', icon: 'FileText', slug: 'cv' }
];

export const DEFAULT_TAB_ID: TabId = 'projects';

export function getTabById(id: TabId): TabDefinition {
    const tab = tabs.find((item) => item.id === id);
    if (!tab) {
        return tabs[0];
    }
    return tab;
}

export function getTabPathById(id: TabId): string {
    return `/${getTabById(id).slug}`;
}

export function getTabIdByPath(pathname: string): TabId | null {
    const normalizedPath = pathname.toLowerCase().replace(/\/+$/, '') || '/';

    if (normalizedPath === '/') {
        return DEFAULT_TAB_ID;
    }

    const normalizedSlug = normalizedPath.startsWith('/')
        ? normalizedPath.slice(1)
        : normalizedPath;

    const matchingTab = tabs.find((tab) => tab.slug.toLowerCase() === normalizedSlug);

    return matchingTab?.id ?? null;
}

export function isTabPath(pathname: string): boolean {
    return getTabIdByPath(pathname) !== null;
}
