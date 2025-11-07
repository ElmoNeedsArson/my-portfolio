/**
 * Search Navigation Utilities
 * 
 * Provides functions for navigating to search results from clickable tags,
 * languages, and tools throughout the application.
 */

import { searchProjects, type SearchCategory, type SearchResult } from './searchUtils';

// Store for managing search results display
let globalSearchResult: SearchResult | null = null;
let globalShowSearchResults = false;
let subscribers: Array<(result: SearchResult | null, show: boolean) => void> = [];

/**
 * Subscribe to search result changes
 * Used by components that need to show/hide search results
 */
export function subscribeToSearchResults(callback: (result: SearchResult | null, show: boolean) => void) {
    subscribers.push(callback);
    // Return unsubscribe function
    return () => {
        const index = subscribers.indexOf(callback);
        if (index > -1) {
            subscribers.splice(index, 1);
        }
    };
}

/**
 * Navigate to search results for a specific term and category
 * This function can be called from any component to show search results
 */
export function navigateToSearch(searchTerm: string, category: SearchCategory) {
    // Perform the search
    const results = searchProjects(category, searchTerm);
    
    // Update global state
    globalSearchResult = results;
    globalShowSearchResults = true;
    
    // Notify all subscribers
    subscribers.forEach(callback => {
        callback(globalSearchResult, globalShowSearchResults);
    });
}

/**
 * Close search results
 */
export function closeSearchResults() {
    globalSearchResult = null;
    globalShowSearchResults = false;
    
    // Notify all subscribers
    subscribers.forEach(callback => {
        callback(null, false);
    });
}

/**
 * Get current search state
 */
export function getSearchState() {
    return {
        searchResult: globalSearchResult,
        showSearchResults: globalShowSearchResults
    };
}