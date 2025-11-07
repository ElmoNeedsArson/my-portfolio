/**
 * PORTFOLIO SEARCH FEATURE - ARCHITECTURE OVERVIEW
 * 
 * This search feature provides comprehensive project discovery across multiple categories.
 * Here's how all the components work together:
 * 
 * ==================================================================================
 * COMPONENT HIERARCHY & DATA FLOW
 * ==================================================================================
 * 
 * 1. Header.svelte (Main Controller)
 *    ├── Manages search modal visibility
 *    ├── Handles keyboard shortcuts (Ctrl+K, Ctrl+/)
 *    ├── Receives search results and displays results modal
 *    └── Controls navigation between search and results
 * 
 * 2. SearchModal.svelte (Search Interface)
 *    ├── Category selection dropdown (Projects/Tags/Languages/Tools)
 *    ├── Real-time suggestions as user types
 *    ├── Smart behavior: direct navigation for projects, search for others
 *    └── Dispatches search results to Header
 * 
 * 3. SearchResults.svelte (Results Display)
 *    ├── Shows filtered projects in a grid
 *    ├── Displays search context (term + category)
 *    ├── Handles empty results gracefully
 *    └── Provides navigation to project pages
 * 
 * 4. searchUtils.ts (Core Logic & Shared Utilities)
 *    ├── loadAllProjects() - SHARED project loading function
 *    ├── findProjectBySlug() - Convenience function for single project lookup
 *    ├── Extracts unique values for suggestions
 *    ├── Performs filtering across different data fields
 *    └── Returns structured search results
 * 
 * IMPORTANT: All project loading now uses the shared loadAllProjects() function
 * to eliminate code duplication across Home.svelte, Project.svelte, and search features.
 * 
 * ==================================================================================
 * USER INTERACTION FLOWS
 * ==================================================================================
 * 
 * FLOW 1: Project Name Search (Direct Navigation)
 * User clicks search → Selects "Project Names" → Clicks project → Navigate to page
 * 
 * FLOW 2: Tag/Language/Tool Search (Results Display)
 * User clicks search → Selects category → Clicks tag → See projects → Click project
 * 
 * FLOW 3: Keyboard Shortcuts
 * User presses Ctrl+K → Search modal opens → Type and search → Navigate
 * 
 * ==================================================================================
 * KEY TECHNICAL FEATURES
 * ==================================================================================
 * 
 * • Dynamic Project Loading: Uses Vite's import.meta.glob to load all project JSONs
 * • Real-time Suggestions: Updates as user types, shows all options when empty
 * • Event Bubbling Prevention: Stops clicks from immediately closing modals
 * • Delayed Click-Outside: Prevents immediate closure when modals open
 * • Responsive Design: Works on desktop and mobile devices
 * • Keyboard Navigation: Full keyboard support for accessibility
 * • Smart Navigation: Project names navigate directly, others show results
 * • Theme Integration: Uses existing CSS variables for consistent styling
 * 
 * ==================================================================================
 * DATA STRUCTURE
 * ==================================================================================
 * 
 * Projects are loaded from: src/projects/*/project_name.json
 * 
 * Each project contains:
 * - title: String (searchable under "Projects")
 * - description: String (searchable under "Projects") 
 * - tags: String[] (searchable under "Tags")
 * - languages: String[] (searchable under "Languages")
 * - tools: String[] (searchable under "Tools")
 * - slug: String (used for navigation)
 * 
 * Search Results Format:
 * {
 *   projects: Project[],     // Filtered projects
 *   searchTerm: string,      // What user searched for
 *   category: SearchCategory // Which category was used
 * }
 * 
 * ==================================================================================
 * STYLING APPROACH
 * ==================================================================================
 * 
 * • Uses existing CSS custom properties (--primary-text-color, etc.)
 * • High z-index (1000+) for modal overlays
 * • Backdrop blur effects for modern appearance
 * • Consistent spacing and border radius with existing design
 * • Hover states and transitions for smooth interactions
 * • Fixed positioning for category dropdown to avoid clipping
 * 
 * ==================================================================================
 * CODE ORGANIZATION & REUSABILITY
 * ==================================================================================
 * 
 * SHARED PROJECT LOADING:
 * All components now use the centralized loadAllProjects() function from searchUtils.ts:
 * 
 * • Home.svelte: Uses loadAllProjects() to display project grid
 * • Project.svelte: Uses findProjectBySlug() (which calls loadAllProjects())
 * • SearchModal.svelte: Uses loadAllProjects() for direct project navigation
 * • Search functions: Use loadAllProjects() for filtering and suggestions
 * 
 * This eliminates code duplication and ensures consistent project loading behavior.
 * 
 * BENEFITS:
 * • Single source of truth for project loading logic
 * • Easier maintenance and debugging
 * • Consistent error handling across components
 * • Better performance through shared caching opportunities
 * 
 * ==================================================================================
 * EXTENSIBILITY
 * ==================================================================================
 * 
 * To add new search categories:
 * 1. Add new category to SearchCategory type in searchUtils.ts
 * 2. Update getAllCategoryValues() to extract the new data field
 * 3. Update searchProjects() filtering logic
 * 4. Add category to the categories array in SearchModal.svelte
 * 5. Add display label and icon to SearchResults.svelte
 * 
 * To modify search behavior:
 * - Edit filtering logic in searchProjects() function
 * - Adjust suggestion limits in getSuggestions() function
 * - Customize navigation logic in handleSuggestionClick()
 */