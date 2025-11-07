import { writable, derived } from 'svelte/store';
import { searchProjects, type SearchCategory, type SearchResult } from './searchUtils';

export const searchResultStore = writable<SearchResult | null>(null);
export const showSearchResultsStore = writable<boolean>(false);

// combine the 2 from above in one thing that constantly updates
export const searchState = derived(
    [searchResultStore, showSearchResultsStore],
    ([$searchResult, $showSearchResults]) => ({
        searchResult: $searchResult,
        showSearchResults: $showSearchResults
    })
);

// pops up the search results modal
export function navigateToSearch(searchTerm: string, category: SearchCategory) {
    const results = searchProjects(category, searchTerm);
    
    searchResultStore.set(results);
    showSearchResultsStore.set(true);
}

export function closeSearchResults() {
    searchResultStore.set(null);
    showSearchResultsStore.set(false);
}