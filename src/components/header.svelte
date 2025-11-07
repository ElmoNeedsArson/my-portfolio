<script>
    // Header component script
    // - Imports icons from lucide and the project logo asset
    // - Imports the shared `darkMode` store so we can read/update global theme state
    import { Linkedin, Github, Moon, Sun } from "@lucide/svelte";
    import logo from "../assets/logos/logoJS.svg";
    import { darkMode } from '../lib/darkModeStore';

    // Simple click handler used for the social icon buttons (placeholder)
    const handleClick = () => {
        console.log("Icon clicked");
    };

    // Toggle the global dark mode store. Other components subscribed to the store
    // will react automatically when this updates.
    function toggleDarkMode() {
        darkMode.update(v => !v);
    }
</script>

<!--
  Header markup
  - Shows a small logo on the left and action icons on the right
  - The mode toggle button reads `$darkMode` (auto-subscription) to pick the icon
-->
<header>
    <!-- Brand/logo -->
    <!-- <img src={logo} alt="Logo" /> -->

    <!-- Right-side controls: social icons + theme toggle -->
    <div class="icons">
        <button class="icon" on:click={handleClick}>
            <Linkedin />
        </button>
        <button class="icon" on:click={handleClick}>
            <Github />
        </button>
        <div class="divider"></div>

        <!-- Toggle the global theme. We read $darkMode to render the correct icon. -->
        <button class="mode-toggle" on:click={toggleDarkMode}>
            {#if $darkMode}
                <Sun />
            {:else}
                <Moon />
            {/if}
        </button>
    </div>
</header>

<style>
    header {
        position: fixed;
        top: 0px;
        right: 5px;
        z-index: 100;
        display: flex;
        align-items: center;
        padding: 1rem;
        /* background-color: var(--background-color); */
        background-color: transparent;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        margin: 0px;
        color: var(--primary-text-color);
        /* border-bottom: solid 1px var(--border-color); */
    }

    /* img {
        height: 30px;
        margin-right: 1rem;
    } */

    .icons {
        display: flex;
        align-items: center;
        margin-left: auto;
        color: var(--muted-color);
    }

    .icon {
        background-color: transparent;
        border: none;
        /* box-shadow: none; */
        color: var(--muted-color);
        padding: 5px;
    }

    .icon:hover {
        color: var(--secondary-text-color);
        cursor: pointer;
    }

    .divider {
        display: inline-block;
        width: 1px; /* thickness of the line */
        height: 24px; /* match your icons' height */
        /* background-color: var(--muted-color); */
        background-color: var(--secondary-text-color);
        margin: 0 0.5rem; /* spacing around the divider */
        vertical-align: middle; /* align with buttons */
    }

    .mode-toggle {
        padding: 5px;
        background-color: transparent;
        border: none;
        color: var(--muted-color);
        align-items: center;
        align-self: center;
        align-content: center;
        justify-content: center;
        justify-items: center;
        justify-self: center;
    }

    .mode-toggle:hover {
        color: var(--secondary-text-color);
        cursor: pointer;
    }
</style>
