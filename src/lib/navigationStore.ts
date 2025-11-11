import { writable } from 'svelte/store';

// Global toggle for navigation style
export const useTabNavigation = writable(true); // Set to true to use tabs, false for dock

// Current active tab for tab navigation
export const activeTab = writable('projects');

// Store to remember the last visited tab before navigating to a project
export const lastVisitedTab = writable('projects');

// Tab definitions
export const tabs = [
    { id: 'projects', label: 'Projects', icon: 'ToyBrick' },
    { id: 'experiments', label: 'Experiments', icon: 'Pin' },
    { id: 'eindhoven', label: 'Eindhoven', icon: 'MapPin' }
];