import type { Project } from '../types';

// possible search categories
export type SearchCategory = 'projects' | 'tags' | 'languages' | 'tools';

// Interface for search results returned
export interface SearchResult {
    projects: Project[];
    searchTerm: string;    
    category: SearchCategory;
}

// Sort projects by date, with pinned projects first
const sortProjectsByDate = (projects: Project[]): Project[] => {
    // Separate pinned and unpinned projects
    const pinnedProjects = projects.filter(project => project.pinned);
    const unpinnedProjects = projects.filter(project => !project.pinned);
    
    // Sort both groups by date (newest first)
    const sortByDate = (a: Project, b: Project) => {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
    };
    
    pinnedProjects.sort(sortByDate);
    unpinnedProjects.sort(sortByDate);
    
    // Return pinned projects first, then unpinned
    return [...pinnedProjects, ...unpinnedProjects];
};

// Sort projects alphabetically by title (for search results)
const sortProjectsAlphabetically = (projects: Project[]): Project[] => {
    return [...projects].sort((a, b) => a.title.localeCompare(b.title));
};

// Load all projects without any sorting (raw data)
const loadAllProjectsRaw = (): Project[] => {
    const jsonModules = import.meta.glob("../projects/*/*.json", {
        eager: true,
    }) as Record<string, { default: Project }>;
    
    // Extract the default export (the project data) from each module
    return Object.values(jsonModules).map(m => m.default);
};

// Load all projects dynamically using Vite's import.meta.glob (sorted for homepage)
export const loadAllProjects = (): Project[] => {
    const projects = loadAllProjectsRaw();
    // Sort projects by date with pinned projects first
    return sortProjectsByDate(projects);
};

// Load projects filtered by type
export const loadProjectsByType = (type: 'card' | 'bar'): Project[] => {
    const allProjects = loadAllProjectsRaw();
    const filteredProjects = allProjects.filter(project => project.type === type);
    return sortProjectsByDate(filteredProjects);
};

// Load projects for cards (Projects page)
export const loadCardProjects = (): Project[] => {
    return loadProjectsByType('card');
};

// Load projects for bars (Experiments page)
export const loadBarProjects = (): Project[] => {
    return loadProjectsByType('bar');
};

export const findProjectBySlug = (slug: string): Project | undefined => {
    const projects = loadAllProjectsRaw();
    return projects.find(project => project.slug === slug);
};

//Get all unique values for a specific search category - used for suggestions in search
export const getAllCategoryValues = (category: SearchCategory): string[] => {
    const projects = loadAllProjectsRaw();

    //Very cool js function gpt told me about, set makes it so you wont have duplicates
    const values = new Set<string>();

    // based on category, add everything from all projects to the set. (Its automatically unique, bc of set)
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

    // sort alphabetically and return as array
    return Array.from(values).sort();
};

// Filter projects based on search category and term
export const searchProjects = (category: SearchCategory, searchTerm: string): SearchResult => {
    const projects = loadAllProjectsRaw();
    const normalizedSearch = searchTerm.toLowerCase().trim();
    
    const filteredProjects = projects.filter(project => {
        switch (category) {
            case 'projects':
                return project.title.toLowerCase().includes(normalizedSearch) ||
                       project.description.toLowerCase().includes(normalizedSearch);
            case 'tags':
                return project.tags.some(tag => 
                    tag.toLowerCase().includes(normalizedSearch)
                );
            case 'languages':
                return project.languages.some(lang => 
                    lang.toLowerCase().includes(normalizedSearch)
                );
            case 'tools':
                return project.tools.some(tool => 
                    tool.toLowerCase().includes(normalizedSearch)
                );
            default:
                return false;
        }
    });

    // Sort alphabetically for search results
    const sortedProjects = sortProjectsAlphabetically(filteredProjects);

    // Return structured result object
    return {
        projects: sortedProjects,
        searchTerm,
        category
    };
};


//Get search suggestions based on partial user input
export const getSuggestions = (category: SearchCategory, partialInput: string): string[] => {
    const allValues = getAllCategoryValues(category); // returns arrays of all projects or all tags, etc. 
    const normalizedInput = partialInput.toLowerCase().trim();
    
    // if no input just show first 12 items
    if (!normalizedInput) return allValues.slice(0, 12);
    
    // otherwise show filtered suggestions
    return allValues.filter(value => 
        value.toLowerCase().includes(normalizedInput)
    ).slice(0, 12); // max 12
};