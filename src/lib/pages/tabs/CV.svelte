<script lang="ts">
  import { Download } from '@lucide/svelte';
  import cvData from '$lib/generated/cvData.json';
  import { navigateToSearch } from '$lib/searchNavigation';
  import { getAllCategoryValues, type SearchCategory } from '$lib/searchUtils';

  type SidebarItem = {
    text: string;
    href?: string;
  };

  type SidebarGroup = {
    name: string;
    text: string;
  };

  type SidebarSection = {
    title: string;
    items?: SidebarItem[];
    groups?: SidebarGroup[];
  };

  type CvItem = {
    title: string;
    place?: string;
    date?: string;
    body?: string;
  };

  type Publication = {
    title: string;
    text: string;
  };

  type SkillSegment = {
    text: string;
    match?: {
      term: string;
      category: SearchCategory;
    };
  };

  const nameParts = String(cvData.name ?? 'Jesse Strijker').split(/\s+/);
  const firstName = nameParts.slice(0, -1).join(' ') || nameParts[0] || 'Jesse';
  const lastName = nameParts.length > 1 ? nameParts.at(-1) : 'Strijker';
  const sidebarSections = cvData.sidebarSections as SidebarSection[];
  const education = cvData.education as CvItem[];
  const experience = cvData.experience as CvItem[];
  const awards = (cvData.awards ?? []) as Publication[];
  const publications = cvData.publications as Publication[];
  const pdfPath = cvData.pdfPath || '/CV_Jesse_Strijker.pdf';
  const sheetWidth = 1060;
  let sheetHeight = $state(1410);
  let viewportWidth = $state(sheetWidth);
  const cvScale = $derived(Math.min(1, viewportWidth / sheetWidth));
  const searchableSkillTerms = buildSearchableSkillTerms();

  function buildSearchableSkillTerms() {
    return (['languages', 'tools', 'tags'] as SearchCategory[])
      .flatMap((category) =>
        getAllCategoryValues(category).map((term) => ({
          term,
          category,
          normalized: normalizeSkillTerm(term),
        }))
      )
      .sort((a, b) => b.normalized.length - a.normalized.length);
  }

  function normalizeSkillTerm(value: string) {
    return value.toLowerCase();
  }

  function hasSkillBoundary(text: string, start: number, end: number) {
    const before = text[start - 1] ?? '';
    const after = text[end] ?? '';
    return !/[a-z0-9+#.]/i.test(before) && !/[a-z0-9+#.]/i.test(after);
  }

  function getSkillSegments(text: string): SkillSegment[] {
    const segments: SkillSegment[] = [];
    const normalizedText = normalizeSkillTerm(text);
    let index = 0;

    while (index < text.length) {
      const match = searchableSkillTerms.find((term) => {
        const end = index + term.normalized.length;
        return (
          normalizedText.startsWith(term.normalized, index) &&
          hasSkillBoundary(text, index, end)
        );
      });

      if (match) {
        segments.push({
          text: text.slice(index, index + match.normalized.length),
          match: {
            term: match.term,
            category: match.category,
          },
        });
        index += match.normalized.length;
      } else {
        const nextMatchedIndex = searchableSkillTerms
          .map((term) => normalizedText.indexOf(term.normalized, index + 1))
          .filter((termIndex) => termIndex >= 0)
          .sort((a, b) => a - b)[0];
        const nextIndex = nextMatchedIndex ?? text.length;
        segments.push({ text: text.slice(index, nextIndex) });
        index = nextIndex;
      }
    }

    return segments;
  }

  function handleSkillClick(event: MouseEvent, segment: SkillSegment) {
    event.stopPropagation();
    if (!segment.match) return;
    navigateToSearch(segment.match.term, 'all');
  }
</script>

<section class="cv-page" aria-labelledby="cv-heading">
  <div
    class="cv-viewport"
    bind:clientWidth={viewportWidth}
    style:height={`${sheetHeight * cvScale}px`}
  >
    <article class="cv-sheet" bind:clientHeight={sheetHeight} style:transform={`scale(${cvScale})`}>
      <aside class="cv-sidebar">
        <h1 id="cv-heading"><span>{firstName}</span> <strong>{lastName}</strong></h1>

        {#each sidebarSections as section}
          <section class="sidebar-section">
            <h2>{section.title}</h2>

            {#if section.groups}
              <div class="skill-groups">
                {#each section.groups as group}
                  <div class="skill-group">
                    <h3>{group.name}</h3>
                    <p>
                      {#each getSkillSegments(group.text) as segment}
                        {#if segment.match}
                          <button
                            type="button"
                            class="cv-skill-link"
                            title={`Click to see projects with ${segment.match.term}`}
                            aria-label={`See projects with ${segment.match.term}`}
                            onclick={(event) => handleSkillClick(event, segment)}
                          >
                            {segment.text}
                          </button>
                        {:else}
                          {segment.text}
                        {/if}
                      {/each}
                    </p>
                  </div>
                {/each}
              </div>
            {:else if section.items}
              <ul>
                {#each section.items as item}
                  <li>
                    {#if item.href}
                      <a
                        href={item.href}
                        target={item.href.startsWith('http') ? '_blank' : undefined}
                        rel={item.href.startsWith('http') ? 'noreferrer' : undefined}
                      >
                        {item.text}
                      </a>
                    {:else}
                      {item.text}
                    {/if}
                  </li>
                {/each}
              </ul>
            {/if}
          </section>
        {/each}
      </aside>

      <div class="cv-main">
        <section class="main-section">
          <h2>Education</h2>
          {#each education as item}
            <div class="cv-item">
              <div class="item-heading">
                <h3>{item.title}</h3>
                <span>{item.date}</span>
              </div>
              <p class="place">{item.place}</p>
              {#if item.body}
                <p>{item.body}</p>
              {/if}
            </div>
          {/each}
        </section>

        <section class="main-section">
          <h2>Experience</h2>
          {#each experience as item}
            <div class="cv-item">
              <div class="item-heading">
                <h3>{item.title}</h3>
                <span>{item.date}</span>
              </div>
              {#if item.place}
                <p class="place">{item.place}</p>
              {/if}
              {#if item.body}
                <p>{item.body}</p>
              {/if}
            </div>
          {/each}
        </section>

        {#if awards.length}
          <section class="main-section">
            <h2>Awards</h2>
            {#each awards as item}
              <p class="publication"><strong>{item.title}</strong> - {item.text}</p>
            {/each}
          </section>
        {/if}

        <section class="main-section">
          <h2>Publications</h2>
          {#each publications as item}
            <p class="publication"><strong>{item.title}</strong> - {item.text}</p>
          {/each}
        </section>
      </div>
    </article>
  </div>

  <a class="download-link" href={pdfPath} download>
    <Download size="20" aria-hidden="true" />
    Download PDF CV
  </a>
</section>

<style>
  .cv-page {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.75rem;
    margin: 0 auto;
    overflow-x: hidden;
    padding-bottom: 0.5rem;
  }

  .cv-viewport {
    width: min(1060px, 100%);
    position: relative;
  }

  .cv-sheet {
    --cv-accent: var(--secondary-text-color);
    --cv-sidebar: var(--header-color);
    --cv-ink: #26323a;
    --cv-muted: #6f7478;
    --cv-paper: #f8f8f6;

    width: 1060px;
    display: grid;
    grid-template-columns: minmax(210px, 30%) 1fr;
    background: var(--cv-paper);
    color: var(--cv-ink);
    box-shadow: 0 22px 80px rgba(0, 0, 0, 0.35);
    min-height: 1410px;
    transform-origin: top left;
  }

  .cv-sidebar {
    background: var(--cv-sidebar);
    color: #f4f7f8;
    padding: 2.25rem 1.75rem;
  }

  h1, h2, h3, p, ul {
    margin: 0;
  }

  h1 {
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
    margin-bottom: 2.2rem;
    font-size: clamp(2rem, 3vw, 2.9rem);
    line-height: 1;
    text-transform: uppercase;
    letter-spacing: 0;
  }

  h1 strong {
    color: var(--cv-accent);
  }

  .sidebar-section {
    margin-top: 2rem;
  }

  .sidebar-section h2, .main-section h2 {
    font-size: 0.98rem;
    line-height: 1.3;
    letter-spacing: 0.18rem;
    text-transform: uppercase;
    padding-bottom: 0.45rem;
    border-bottom: 2px solid var(--cv-accent);
  }

  .sidebar-section h2 {
    color: var(--cv-accent);
  }

  .sidebar-section ul {
    list-style: none;
    padding: 0;
    margin-top: 0.9rem;
    display: grid;
    gap: 0.65rem;
  }

  .sidebar-section li, .skill-group p {
    color: rgba(244, 247, 248, 0.86);
    font-size: 0.8rem;
    line-height: 1.55;
  }

  .sidebar-section a {
    color: inherit;
    text-decoration: underline;
    text-underline-offset: 0.16em;
  }

  .skill-groups {
    display: grid;
    gap: 1rem;
    margin-top: 1rem;
  }

  .skill-group h3 {
    color: #fff;
    font-size: 0.85rem;
    line-height: 1.35;
    margin-bottom: 0.25rem;
  }

  .cv-skill-link {
    appearance: none;
    border: 0;
    border-radius: 0;
    background: transparent;
    color: inherit;
    cursor: pointer;
    font: inherit;
    line-height: inherit;
    margin: 0;
    padding: 0;
    text-decoration: underline;
    text-decoration-color: transparent;
    text-underline-offset: 0.18em;
    transition:
      color 0.16s ease,
      text-decoration-color 0.16s ease;
  }

  .cv-skill-link:focus-visible {
    outline: 1px solid currentColor;
    outline-offset: 2px;
  }

  @media (hover: hover) {
    .cv-skill-link:hover {
      color: #fff;
      text-decoration-color: currentColor;
    }
  }

  .cv-main {
    padding: 3.3rem 2.35rem 2.4rem;
  }

  .main-section + .main-section {
    margin-top: 2rem;
  }

  .main-section h2 {
    color: var(--cv-ink);
    margin-bottom: 1.05rem;
  }

  .cv-item + .cv-item {
    margin-top: 1rem;
  }

  .item-heading {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 1rem;
    align-items: baseline;
  }

  .item-heading h3 {
    font-size: 1rem;
    line-height: 1.35;
    color: var(--cv-ink);
  }

  .item-heading span {
    color: var(--cv-muted);
    font-size: 0.8rem;
    font-style: italic;
    white-space: nowrap;
  }

  .cv-item p, .publication {
    font-size: 0.84rem;
    line-height: 1.58;
    color: #3c4449;
  }

  .cv-item .place {
    color: var(--cv-accent);
    font-weight: 700;
    margin: 0.1rem 0 0.25rem;
  }

  .publication + .publication {
    margin-top: 0.45rem;
  }

  .download-link {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.55rem;
    min-height: 44px;
    padding: 0.8rem 1.1rem;
    border: 1px solid var(--secondary-text-color);
    border-radius: 9px;
    color: var(--primary-text-color);
    background: transparent;
    text-decoration: none;
    font-weight: 600;
    transition:
      color 0.2s ease,
      background 0.2s ease,
      transform 0.2s ease;
  }

  .download-link:hover {
    background: var(--secondary-text-color);
    color: #fff;
    transform: translateY(-1px);
  }

  @media print {
    .cv-page {
      display: block;
    }

    .cv-viewport {
      width: 100%;
      height: auto !important;
    }

    .cv-sheet {
      width: 100%;
      min-height: 100vh;
      box-shadow: none;
      transform: none !important;
    }

    .download-link {
      display: none;
    }
  }
</style>
