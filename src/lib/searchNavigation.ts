import { writable, derived } from 'svelte/store';
import { searchProjects, type SearchCategory, type SearchResult } from './searchUtils';

export const searchResultStore = writable<SearchResult | null>(null);
export const showSearchResultsStore = writable<boolean>(false);

export const searchState = derived(
    [searchResultStore, showSearchResultsStore],
    ([$searchResult, $showSearchResults]) => ({
        searchResult: $searchResult,
        showSearchResults: $showSearchResults
    })
);

export function navigateToSearch(searchTerm: string | string[], category: SearchCategory) {
    const results = searchProjects(category, searchTerm, { exactMatch: true });
    
    searchResultStore.set(results);
    showSearchResultsStore.set(true);
}

export function closeSearchResults() {
    searchResultStore.set(null);
    showSearchResultsStore.set(false);
}