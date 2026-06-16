import type { Project } from '../types';
import { skillsTaxonomy, type TaxonomyNode } from './skillsTaxonomy';

export type SkillNode = {
  name: string;
  children?: SkillNode[];
  value?: number;
  projectTitles?: string[];
};

function nodeMatches(node: TaxonomyNode, value: string): boolean {
  const v = value.toLowerCase();
  if (node.label.toLowerCase() === v) return true;
  if (node.matches) {
    return node.matches.some(m => m.toLowerCase() === v);
  }
  return false;
}

function getProjectTerms(project: Project): string[] {
  return [...project.languages, ...project.tools];
}

function buildNode(
  taxNode: TaxonomyNode,
  projects: Project[],
): SkillNode {
  const matchingProjects = projects.filter(p =>
    getProjectTerms(p).some(term => nodeMatches(taxNode, term))
  );

  if (!taxNode.children || taxNode.children.length === 0) {
    return {
      name: taxNode.label,
      value: matchingProjects.length,
      projectTitles: matchingProjects.map(p => p.title),
    };
  }

  const children = taxNode.children.map(child => buildNode(child, projects));

  function collectChildSlugs(childTaxNode: TaxonomyNode): Set<string> {
    const slugs = new Set<string>();
    projects.forEach(p => {
      if (getProjectTerms(p).some(term => nodeMatches(childTaxNode, term))) {
        slugs.add(p.slug);
      }
    });
    if (childTaxNode.children) {
      childTaxNode.children.forEach(grandchild => {
        collectChildSlugs(grandchild).forEach(s => slugs.add(s));
      });
    }
    return slugs;
  }

  const allChildSlugs = new Set<string>();
  taxNode.children.forEach(child => {
    collectChildSlugs(child).forEach(s => allChildSlugs.add(s));
  });

  const directProjects = matchingProjects.filter(p => !allChildSlugs.has(p.slug));

  const nonEmptyChildren = children.filter(c => (c.value ?? 0) > 0 || (c.children && c.children.length > 0));

  return {
    name: taxNode.label,
    children: nonEmptyChildren.length > 0 ? nonEmptyChildren : undefined,
    value: directProjects.length > 0 ? directProjects.length : undefined,
    projectTitles: directProjects.map(p => p.title),
  };
}

function buildRootNode(projects: Project[], taxonomy: TaxonomyNode[]): SkillNode {
  const children = taxonomy
    .map(cat => buildNode(cat, projects))
    .filter(node => {
      if (node.value && node.value > 0) return true;
      if (node.children && node.children.length > 0) return true;
      return false;
    });

  return {
    name: 'All Skills',
    children,
  };
}

export function buildSkillsHierarchy(projects: Project[]): SkillNode {
  return buildRootNode(projects, skillsTaxonomy);
}
