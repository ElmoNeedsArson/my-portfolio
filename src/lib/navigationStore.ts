import { writable } from 'svelte/store';

export type TabId = 'projects' | 'experiments' | 'eindhoven';

export interface TabDefinition {
    id: TabId;
    label: string;
    icon: 'ToyBrick' | 'Pin' | 'MapPin';
    slug: string;
    aliases?: string[];
}

// Global toggle for navigation style
export const useTabNavigation = writable(true); // Set to true to use tabs, false for dock

// Current active tab for tab navigation
export const activeTab = writable<TabId>('projects');

// Store to remember the last visited tab before navigating to a project
export const lastVisitedTab = writable<TabId>('projects');

// Tab definitions
export const tabs: readonly TabDefinition[] = [
    { id: 'projects', label: 'Highlights', icon: 'ToyBrick', slug: 'highlights' },
    {
        id: 'experiments',
        label: 'Projects',
        icon: 'Pin',
        slug: 'projects',
        aliases: ['experiments'],
    },
    { id: 'eindhoven', label: 'Eindhoven', icon: 'MapPin', slug: 'eindhoven' }
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

    const matchingTab = tabs.find((tab) => {
        if (tab.slug.toLowerCase() === normalizedSlug) {
            return true;
        }

        return tab.aliases?.some((alias) => alias.toLowerCase() === normalizedSlug);
    });

    return matchingTab?.id ?? null;
}

export function isTabPath(pathname: string): boolean {
    return getTabIdByPath(pathname) !== null;
}

export function getHomeRoutes(): string[] {
    const routes = new Set<string>(['/']);

    for (const tab of tabs) {
        routes.add(`/${tab.slug}`);
        for (const alias of tab.aliases ?? []) {
            routes.add(`/${alias}`);
        }
    }

    return Array.from(routes);
}