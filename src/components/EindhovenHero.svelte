<div class="eindhoven-hero">
    <div class="eindhoven-hero-content">
        <div class="hero-box large"></div>
        <div class="hero-box tall"></div>
        <div class="hero-box"></div>
        <div class="hero-box wide"></div>
        <div class="hero-box"></div>
    </div>
    <div class="eindhoven-hero-blur"></div>
    <button class="eindhoven-hero-enlarge" type="button">
        Enlarge
    </button>
</div>

<style>
    .eindhoven-hero {
        position: relative;
        min-height: 100vh;
        background: radial-gradient(
                120% 120% at 50% 10%,
                rgba(255, 255, 255, 0.08),
                transparent 55%
            ),
            linear-gradient(
                135deg,
                rgba(249, 103, 67, 0.08),
                rgba(74, 144, 226, 0.12)
            );
        border-radius: 0;
        overflow: hidden;
        margin-bottom: 2.5rem;
    }

    .eindhoven-hero-content {
        position: absolute;
        inset: 2rem 3rem;
        display: grid;
        grid-template-columns: repeat(12, 1fr);
        grid-auto-rows: minmax(120px, 1fr);
        gap: 1.5rem;
        z-index: 0;
    }

    .hero-box {
        border-radius: 16px;
        background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.18),
            rgba(255, 255, 255, 0.04)
        );
        border: 1px solid rgba(255, 255, 255, 0.15);
        box-shadow: 0 12px 32px rgba(0, 0, 0, 0.25);
    }

    .hero-box.large {
        grid-column: span 7;
        grid-row: span 2;
        background: linear-gradient(
            135deg,
            rgba(74, 144, 226, 0.35),
            rgba(249, 103, 67, 0.2)
        );
    }

    .hero-box.tall {
        grid-column: span 5;
        grid-row: span 3;
        background: linear-gradient(
            180deg,
            rgba(249, 103, 67, 0.35),
            rgba(255, 255, 255, 0.06)
        );
    }

    .hero-box.wide {
        grid-column: span 8;
        grid-row: span 1;
        background: linear-gradient(
            120deg,
            rgba(155, 89, 182, 0.35),
            rgba(74, 144, 226, 0.2)
        );
    }

    .eindhoven-hero-blur {
        position: absolute;
        inset: 0;
        background: rgba(0, 0, 0, 0.25);
        backdrop-filter: blur(14px);
        z-index: 1;
    }

    .eindhoven-hero-enlarge {
        position: absolute;
        top: 1.25rem;
        right: 1.25rem;
        z-index: 2;
        padding: 0.5rem 1rem;
        border-radius: 999px;
        border: 1px solid var(--border-color);
        background: rgba(0, 0, 0, 0.35);
        color: var(--primary-text-color);
        font-size: 0.85rem;
        letter-spacing: 0.4px;
        text-transform: uppercase;
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .eindhoven-hero-enlarge:hover {
        background: rgba(0, 0, 0, 0.55);
        border-color: var(--secondary-text-color);
    }
</style>
