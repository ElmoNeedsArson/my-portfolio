<script>
  import { link } from "svelte-spa-router";
  import { fade, scale, fly } from "svelte/transition";
  import { quintOut } from "svelte/easing";

  let isMenuOpen = false;

  function toggleMenu() {
    isMenuOpen = !isMenuOpen;
  }

  function closeMenu() {
    isMenuOpen = false;
  }

  function navigateAndClose(path) {
    // Add slight delay for smooth transition feeling
    setTimeout(() => {
      closeMenu();
    }, 150);
  }

  // Navigation items
  const navItems = [
    { label: "Projects", path: "/projects" },
    { label: "Experiments", path: "/experiments" },
    { label: "Eindhoven", path: "/eindhoven" },
  ];
</script>

<!-- Navigation Menu Overlay -->
{#if isMenuOpen}
  <div
    class="menu-overlay"
    in:fade={{ duration: 400 }}
    out:fade={{ duration: 300 }}
    on:click={closeMenu}
    on:keydown={(e) => e.key === "Escape" && closeMenu()}
    role="button"
    tabindex="0"
  >
    <div
      class="menu-container"
      in:fly={{ y: 50, duration: 500, easing: quintOut }}
      out:fly={{ y: -30, duration: 300 }}
    >
      <nav class="navigation-menu">
        {#each navItems as item, i}
          <a
            href={item.path}
            use:link
            class="nav-item"
            on:click={() => navigateAndClose(item.path)}
            in:fly={{
              y: 30,
              duration: 400,
              delay: 150 + i * 100,
              easing: quintOut,
            }}
            out:fly={{
              y: -20,
              duration: 200,
              delay: i * 50,
            }}
          >
            {item.label}
          </a>
        {/each}
      </nav>
    </div>
  </div>

  <!-- Close Text -->
  <!-- <div
    class="close-text"
    in:fade={{ duration: 300, delay: 200 }}
    out:fade={{ duration: 200 }}
  >
    Close
  </div> -->
{/if}

<!-- Dock Container -->
<div
  class="dock-container"
  on:click={toggleMenu}
  on:keydown={(e) => (e.key === "Enter" || e.key === " ") && toggleMenu()}
  role="button"
  tabindex="0"
  aria-label="Navigation menu toggle"
>
  <!-- Menu Text (when closed) -->

  <!-- Fixed Dock Bar -->
  <div class="dock">
    <div class="dock-bar"></div>
  </div>

  {#if !isMenuOpen}
    <div class="menu-text" >Menu</div>
  {/if}
  {#if isMenuOpen}
    <div
      class="close-text"
      
    >
      Close
    </div>
  {/if}
</div>

<style>
  .dock-container {
    position: fixed;
    top: 10px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 1000;
    cursor: pointer;
    /* Ensure container has enough height for menu text */
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .dock {
    padding: 10px;
  }

  .dock-bar {
    width: 140px;
    height: 5px;
    background: white;
    border-radius: 2px;
    transition: all 0.3s ease;
  }

  .dock-container:hover .dock-bar {
    transform: scaleY(1.2) scaleX(1.3);
  }

  /* .menu-text:hover + .dock .dock-bar {
    transform: scaleY(1.2) scaleX(1.3);
  } */

  /* .close-text {
    position: fixed;
    top: 35px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 1001;
    color: var(--muted-color);
    font-size: 14px;
    font-weight: 500;
    pointer-events: none;
    user-select: none;
  } */

  .menu-text, .close-text {
    color: var(--muted-color);
    font-size: 14px;
    font-weight: 500;
    user-select: none;
    margin-bottom: 8px;
  }

  .menu-overlay {
    position: fixed;
    /* inset: 0; */
    background: rgba(20, 20, 20, 0.55); /* darker base tint */
    backdrop-filter: blur(40px) saturate(160%) contrast(120%);
    -webkit-backdrop-filter: blur(40px) saturate(160%) contrast(120%);
    z-index: 999;
    display: flex;
    height: 100vh;
    top: 0;
    left: 0;
    right: 0;
    align-items: center;
    justify-content: center;
    transition: background 0.3s ease;
  }

  .menu-overlay::before {
    content: "";
    position: absolute;
    inset: 0;
    background: radial-gradient(
      circle at center,
      rgba(255, 120, 40, 0.2),
      transparent 70%
    );
    pointer-events: none;
  }

  .menu-container {
    width: 60%;
    max-width: 600px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .navigation-menu {
    display: flex;
    flex-direction: column;
    gap: 2rem;
    align-items: center;
  }

  .nav-item {
    font-size: 2.5rem;
    font-weight: 600;
    color: white;
    text-decoration: none;
    padding: 1rem 2rem;
    border-radius: 16px;
    /* background: rgba(255, 255, 255, 0.08); */
    /* border: 1px solid rgba(255, 255, 255, 0.15); */
    /* backdrop-filter: blur(15px) saturate(150%); */
    /* -webkit-backdrop-filter: blur(15px) saturate(150%); */
    transition: all 0.3s ease;
  }

  .nav-item:hover {
    background: rgba(255, 255, 255, 0.18);
    box-shadow: 0 4px 40px rgba(255, 255, 255, 0.08);
    transform: translateY(-2px);
  }

  /* Mobile responsiveness */
  @media (max-width: 768px) {
    .menu-container {
      width: 80%;
    }

    .nav-item {
      font-size: 2rem;
      padding: 0.8rem 1.5rem;
    }
  }

  @media (max-width: 480px) {
    .menu-container {
      width: 90%;
    }

    .nav-item {
      font-size: 1.5rem;
      padding: 0.6rem 1rem;
    }
  }
</style>
