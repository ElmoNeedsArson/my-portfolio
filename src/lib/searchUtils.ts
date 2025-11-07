import type { Project } from '../types';

// possible search categories
export type SearchCategory = 'projects' | 'tags' | 'languages' | 'tools';

// Interface for search results returned
export interface SearchResult {
    projects: Project[];
    searchTerm: string;    
    category: SearchCategory;
}

// Load all projects dynamically using Vite's import.meta.glob
export const loadAllProjects = (): Project[] => {
    const jsonModules = import.meta.glob("../projects/*/*.json", {
        eager: true,
    }) as Record<string, { default: Project }>;
    
    // Extract the default export (the project data) from each module
    return Object.values(jsonModules).map(m => m.default);
};

export const findProjectBySlug = (slug: string): Project | undefined => {
    const projects = loadAllProjects();
    return projects.find(project => project.slug === slug);
};

//Get all unique values for a specific search category - used for suggestions in search
export const getAllCategoryValues = (category: SearchCategory): string[] => {
    const projects = loadAllProjects();

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
    const projects = loadAllProjects();
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

    // Return structured result object
    return {
        projects: filteredProjects,
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