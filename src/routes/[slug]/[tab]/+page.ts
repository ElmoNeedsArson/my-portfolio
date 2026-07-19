import { redirect } from '@sveltejs/kit';
import { getDefaultProjectTab, getProjectTabBySlug } from '$lib/projectTabs';
import { findProjectBySlug } from '$lib/searchUtils';
import type { PageLoad } from './$types';

export const load: PageLoad = ({ params }) => {
  const project = findProjectBySlug(params.slug);

  if (!project) {
    redirect(308, '/highlights');
  }

  const tab = getProjectTabBySlug(project, params.tab);
  if (!tab) {
    const defaultTab = getDefaultProjectTab(project);
    if (defaultTab) {
      redirect(308, `/${project.slug}/${defaultTab.slug}`);
    }
  }

  return {
    project,
    initialTabId: params.tab
  };
};
