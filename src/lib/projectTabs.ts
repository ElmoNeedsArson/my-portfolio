import type { ContentBlock, Project } from '$lib/types';

export type ProjectTabDefinition = {
  id: string;
  label: string;
  slug: string;
  content: ContentBlock;
};

export function labelToSlug(label: string): string {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

export function getProjectTabs(project: Project | undefined): ProjectTabDefinition[] {
  if (!project) return [];

  const result: ProjectTabDefinition[] = [];
  const projectWithLegacyTabs = project as Project & Record<string, ContentBlock | unknown>;

  if (project.tabs && typeof project.tabs === 'object') {
    for (const [key, value] of Object.entries(project.tabs)) {
      if (value && typeof value === 'object') {
        const content = value as ContentBlock;
        const label = content.name ?? key;
        result.push({ id: key, label, slug: labelToSlug(label), content });
      }
    }
  }

  for (const key of Object.keys(projectWithLegacyTabs)) {
    if (/^tab\d+$/i.test(key)) {
      const content = projectWithLegacyTabs[key] as ContentBlock;
      if (content) {
        const label = content.name ?? key.replace(/tab/i, 'Tab ');
        result.push({ id: key, label, slug: labelToSlug(label), content });
      }
    }
  }

  result.sort((a, b) => {
    const aIndex = parseInt(a.id.replace(/\D/g, ''), 10) || 0;
    const bIndex = parseInt(b.id.replace(/\D/g, ''), 10) || 0;
    return aIndex - bIndex;
  });

  return result;
}

export function getProjectTabBySlug(project: Project, tabSlug: string | undefined): ProjectTabDefinition | undefined {
  if (!tabSlug) return undefined;
  return getProjectTabs(project).find((tab) => tab.slug === tabSlug);
}

export function getDefaultProjectTab(project: Project): ProjectTabDefinition | undefined {
  return getProjectTabs(project)[0];
}

export function getProjectPath(project: Project): string {
  const defaultTab = getDefaultProjectTab(project);
  return defaultTab ? `/${project.slug}/${defaultTab.slug}` : `/${project.slug}`;
}
