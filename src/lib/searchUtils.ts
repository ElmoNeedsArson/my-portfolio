import type { Project } from '$lib/types';

export type SearchCategory = 'projects' | 'tags' | 'languages' | 'tools';

export interface SearchResult {
    projects: Project[];
    searchTerm: string;
    category: SearchCategory;
}

export interface SearchOptions {
    exactMatch?: boolean;
}

const sortProjectsByDate = (projects: Project[]): Project[] => {
    const pinnedProjects = projects.filter(project => project.pinned);
    const unpinnedProjects = projects.filter(project => !project.pinned);

    const sortByDate = (a: Project, b: Project) => {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
    };

    pinnedProjects.sort(sortByDate);
    unpinnedProjects.sort(sortByDate);

    return [...pinnedProjects, ...unpinnedProjects];
};

const loadAllProjectsRaw = (): Project[] => {
    const jsonModules = import.meta.glob("../projects/*.json", {
        eager: true,
    }) as Record<string, { default: Project }>;

    return Object.values(jsonModules).map(m => m.default);
};

export const loadAllProjects = (): Project[] => {
    const projects = loadAllProjectsRaw();
    return sortProjectsByDate(projects);
};

export const loadProjectsByType = (type: 'card' | 'bar' | 'twente' | 'eindhoven'): Project[] => {
    const allProjects = loadAllProjectsRaw();
    const filteredProjects = allProjects.filter(project => project.type === type);
    return sortProjectsByDate(filteredProjects);
};

export const loadCardProjects = (): Project[] => {
    return loadProjectsByType('card');
};

export const loadBarProjects = (): Project[] => {
    return loadProjectsByType('bar');
};

export const loadTwenteProjects = (): Project[] => {
    return loadProjectsByType('twente');
};

export const loadEindhovenProjects = (): Project[] => {
    return loadProjectsByType('eindhoven');
};

export const findProjectBySlug = (slug: string): Project | undefined => {
    const projects = loadAllProjectsRaw();
    return projects.find(project => project.slug === slug);
};

export const getAllCategoryValues = (category: SearchCategory): string[] => {
    const projects = loadAllProjectsRaw();

    const values = new Set<string>();

    projects.forEach(project => {
        switch (category) {
            case 'projects':
                values.add(project.title);
                break;
            case 'tags':
                project.tags.forEach(tag => values.add(tag));
                break;
            case 'languages':
                project.languages.forEach(lang => values.add(lang));
                break;
            case 'tools':
                project.tools.forEach(tool => values.add(tool));
                break;
        }
    });

    return Array.from(values).sort();
};

export const searchProjects = (
    category: SearchCategory,
    searchTerm: string | string[],
    options: SearchOptions = {}
): SearchResult => {
    const projects = loadAllProjectsRaw();
    const terms = (Array.isArray(searchTerm) ? searchTerm : [searchTerm])
        .map(t => t.toLowerCase().trim());
    const useExactMatch = options.exactMatch ?? false;

    const matchesAnyTerm = (value: string) =>
        terms.some(t => useExactMatch ? value.toLowerCase() === t : value.toLowerCase().includes(t));

    const filteredProjects = projects.filter(project => {
        switch (category) {
            case 'projects':
                return terms.some(t =>
                    project.title.toLowerCase().includes(t) ||
                    project.description.toLowerCase().includes(t)
                );
            case 'tags':
                return project.tags.some(tag => matchesAnyTerm(tag));
            case 'languages':
                return project.languages.some(lang =>
                    terms.some(t => lang.toLowerCase() === t)
                );
            case 'tools':
                return project.tools.some(tool => matchesAnyTerm(tool));
            default:
                return false;
        }
    });

    const sortedProjects = sortProjectsByDate(filteredProjects);

    return {
        projects: sortedProjects,
        searchTerm: Array.isArray(searchTerm) ? searchTerm[0] : searchTerm,
        category
    };
};


export const getSuggestions = (category: SearchCategory, partialInput: string): string[] => {
    const allValues = getAllCategoryValues(category);
    const normalizedInput = partialInput.toLowerCase().trim();

    if (!normalizedInput) return allValues;

    return allValues.filter(value =>
        value.toLowerCase().includes(normalizedInput)
    )
};
