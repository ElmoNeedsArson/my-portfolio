import type { Project } from '../types';

// Define the possible search categories
export type SearchCategory = 'projects' | 'tags' | 'languages' | 'tools';

// Interface for search results returned to components
export interface SearchResult {
    projects: Project[];     // Array of projects matching the search
    searchTerm: string;     // What the user searched for
    category: SearchCategory; // Which category they searched in
}

/**
 * Load all projects dynamically using Vite's import.meta.glob
 * This scans the projects folder and imports all JSON files
 */
const loadAllProjects = (): Project[] => {
    // Vite's glob import - loads all .json files in projects subdirectories
    const jsonModules = import.meta.glob("../projects/*/*.json", {
        eager: true, // Load immediately, not lazy
    }) as Record<string, { default: Project }>;
    
    // Extract the default export (the project data) from each module
    return Object.values(jsonModules).map(m => m.default);
};

/**
 * Get all unique values for a specific search category
 * This powers the suggestion dropdowns
 */
export const getAllCategoryValues = (category: SearchCategory): string[] => {
    const projects = loadAllProjects();
    const values = new Set<string>(); // Use Set to automatically handle duplicates

    // Extract values based on the selected category
    projects.forEach(project => {
        switch (category) {
            case 'projects':
                values.add(project.title); // Add project titles
                break;
            case 'tags':
                project.tags.forEach(tag => values.add(tag)); // Add each tag
                break;
            case 'languages':
                project.languages.forEach(lang => values.add(lang)); // Add each language
                break;
            case 'tools':
                project.tools.forEach(tool => values.add(tool)); // Add each tool
                break;
        }
    });

    // Convert Set to sorted Array for consistent ordering
    return Array.from(values).sort();
};

/**
 * Search projects by category and term
 * Returns projects that match the search criteria
 */
export const searchProjects = (category: SearchCategory, searchTerm: string): SearchResult => {
    const projects = loadAllProjects();
    const normalizedSearch = searchTerm.toLowerCase().trim(); // Case-insensitive search
    
    // Filter projects based on search category and term
    const filteredProjects = projects.filter(project => {
        switch (category) {
            case 'projects':
                // Search in project title and description
                return project.title.toLowerCase().includes(normalizedSearch) ||
                       project.description.toLowerCase().includes(normalizedSearch);
            case 'tags':
                // Check if any tag contains the search term
                return project.tags.some(tag => 
                    tag.toLowerCase().includes(normalizedSearch)
                );
            case 'languages':
                // Check if any language contains the search term
                return project.languages.some(lang => 
                    lang.toLowerCase().includes(normalizedSearch)
                );
            case 'tools':
                // Check if any tool contains the search term
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

/**
 * Get search suggestions based on partial user input
 * Used for the real-time suggestions dropdown
 */
export const getSuggestions = (category: SearchCategory, partialInput: string): string[] => {
    const allValues = getAllCategoryValues(category);
    const normalizedInput = partialInput.toLowerCase().trim();
    
    // If no input, show first 12 items as initial suggestions
    if (!normalizedInput) return allValues.slice(0, 12);
    
    // Filter suggestions that contain the user's input and limit results
    return allValues.filter(value => 
        value.toLowerCase().includes(normalizedInput)
    ).slice(0, 12); // Limit to 12 suggestions for performance
};