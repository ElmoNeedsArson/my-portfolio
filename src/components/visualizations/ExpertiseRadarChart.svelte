<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import { Chart, RadarController, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend } from "chart.js";
    import type { Project } from "../../types";

    // Register Chart.js components
    Chart.register(RadarController, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

    export let project: Project;

    let canvasElement: HTMLCanvasElement;
    let chart: Chart | null = null;
    let isHovered = false;

    const expertiseAreas = [
        "Math, Data and Computing",
        "Technology and Realization",
        "Creativity and Aesthetics",
        "User and Society",
        "Business and Entrepreneurship"
    ];

    const areaColors: { [key: string]: string } = {
        "Math, Data and Computing": "#3b82f6",
        "Technology and Realization": "#8b5cf6",
        "Creativity and Aesthetics": "#ec4899",
        "User and Society": "#10b981",
        "Business and Entrepreneurship": "#f59e0b"
    };

    function getShortLabel(area: string): string {
        const map: { [key: string]: string } = {
            "Math, Data and Computing": "Math/Data",
            "Technology and Realization": "Technology",
            "Creativity and Aesthetics": "Creativity",
            "User and Society": "User/Society",
            "Business and Entrepreneurship": "Business"
        };
        return map[area] || area;
    }

    function createChart() {
        if (!canvasElement) return;

        const expertiseData = project.expertise || [];
        const dataValues = expertiseAreas.map(area => {
            const expertise = expertiseData.find(e => e.area === area);
            return expertise?.rating || 0;
        });

        const ctx = canvasElement.getContext("2d");
        if (!ctx) return;

        // Get CSS variable colors
        const styles = getComputedStyle(document.documentElement);
        const borderColor = styles.getPropertyValue('--border-color').trim() || '#ddd';
        const textColor = styles.getPropertyValue('--primary-text-color').trim() || '#fff';

        chart = new Chart(ctx, {
            type: "radar",
            data: {
                labels: expertiseAreas.map(area => getShortLabel(area)),
                datasets: [{
                    label: "Expertise Rating",
                    data: dataValues,
                    backgroundColor: "rgba(255, 255, 255, 0.2)",
                    borderColor: textColor,
                    borderWidth: 2.5,
                    pointBackgroundColor: expertiseAreas.map(area => areaColors[area]),
                    pointBorderColor: "#fff",
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `Rating: ${context.parsed.r.toFixed(1)}/10`;
                            }
                        }
                    }
                },
                scales: {
                    r: {
                        min: 0,
                        max: 10,
                        ticks: {
                            stepSize: 2,
                            color: borderColor,
                            backdropColor: "transparent",
                            font: {
                                size: 9
                            }
                        },
                        grid: {
                            color: borderColor,
                            lineWidth: 1.5
                        },
                        pointLabels: {
                            color: (context: any) => {
                                const index = context.index;
                                return areaColors[expertiseAreas[index]] || textColor;
                            },
                            font: {
                                size: 9,
                                weight: 600 as any
                            }
                        },
                        angleLines: {
                            color: borderColor,
                            lineWidth: 1.5
                        }
                    }
                }
            }
        });
    }

    function updateChart() {
        // Labels remain constant, no update needed
    }

    onMount(() => {
        createChart();
    });

    onDestroy(() => {
        if (chart) {
            chart.destroy();
        }
    });

    $: if (chart) {
        isHovered;
        updateChart();
    }
</script>

<div 
    class="radar-container"
    on:mouseenter={() => isHovered = true}
    on:mouseleave={() => isHovered = false}
    role="img"
    aria-label="Expertise radar chart showing ratings across five areas"
>
    <h4>Expertise Area's</h4>
    <canvas bind:this={canvasElement} aria-label="Interactive radar chart"></canvas>
</div>

<style>
    .radar-container {
        position: fixed;
        top: 50%;
        transform: translateY(-50%);
        left: 2rem;
        width: 230px;
        height: 250px;
        min-width: 230px;
        max-width: 320px;
        background: var(--background-color);
        border: 2px solid var(--border-color);
        border-radius: 12px;
        padding: 0.75rem;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        z-index: 100;
        transition: width 0.4s ease, height 0.4s ease;
    }

    .radar-container:hover {
        width: 320px;
        height: 340px;
    }

    h4 {
        margin: 0 0 0.5rem 0;
        font-size: 0.85rem;
        font-weight: 600;
        color: var(--primary-text-color);
        text-align: center;
    }

    canvas {
        width: 100%;
        height: auto;
    }

    @media (max-width: 1200px) {
        .radar-container {
            position: static;
            margin: 1rem auto;
            max-width: 250px;
        }

        .radar-container:hover {
            max-width: 300px;
        }
    }

    @media (max-width: 768px) {
        .radar-container {
            display: none;
        }
    }
</style>
