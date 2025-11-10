<script lang="ts">
    import Header from "../components/header.svelte";
    import Footer from "../components/footer.svelte";
    import Dock from "../components/Dock.svelte";
    import { MapPin } from "@lucide/svelte";
    import { fade } from "svelte/transition";
    import { onMount } from "svelte";

    let mounted = false;

    onMount(() => {
        setTimeout(() => {
            mounted = true;
        }, 50);
    });
</script>

<Header />
<main>
    <div class="container">
        <div class="titleContainer">
            <div class="pageTitle">
                <div class="titleIcon">
                    <MapPin size="48" class="titleElement" />
                </div>
                <h2 class="titleElement">EINDHOVEN</h2>
            </div>
        </div>
        
        {#if mounted}
            <section class="content" in:fade={{ duration: 500 }}>
                <div class="placeholder-content">
                    <p>Welcome to the Eindhoven section.</p>
                    <p>This page is currently under construction.</p>
                </div>
            </section>
        {/if}
    </div>
</main>
<Footer />
<Dock />

<style>
    main {
        background-color: var(--background-color);
        color: var(--primary-text-color);
        padding: 1px;
    }

    .container {
        max-width: 55%;
        margin: 2rem auto;
        padding: 0 1rem;
        min-height: calc(100vh - 200px);
    }

    .titleContainer {
        margin-bottom: 3rem;
        text-align: center;
    }

    .pageTitle {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 1rem;
        margin-top: 2rem;
    }

    .titleIcon {
        display: flex;
        align-items: center;
        color: var(--muted-color);
    }

    .titleElement {
        color: var(--primary-text-color);
    }

    h2 {
        font-size: 2.5rem;
        font-weight: 700;
        margin: 0;
        letter-spacing: 0.1em;
        color: var(--primary-text-color);
    }

    .content {
        max-width: 100%;
        margin: 0 auto;
        padding-bottom: 6rem; /* Space for dock */
    }

    .placeholder-content {
        text-align: center;
        padding: 4rem 2rem;
        color: var(--muted-color);
    }

    .placeholder-content p {
        font-size: 1.2rem;
        margin-bottom: 1rem;
        line-height: 1.6;
    }

    /* Mobile responsiveness */
    @media (max-width: 768px) {
        .container {
            max-width: 90%;
            padding: 0 1rem;
        }

        h2 {
            font-size: 2rem;
        }

        .titleIcon :global(.titleElement) {
            width: 36px;
            height: 36px;
        }

        .content {
            padding-bottom: 5rem;
        }

        .placeholder-content p {
            font-size: 1rem;
        }
    }

    @media (max-width: 480px) {
        .container {
            max-width: 95%;
        }

        .pageTitle {
            gap: 0.5rem;
        }

        h2 {
            font-size: 1.5rem;
        }

        .titleIcon :global(.titleElement) {
            width: 32px;
            height: 32px;
        }

        .placeholder-content {
            padding: 3rem 1rem;
        }
    }
</style>