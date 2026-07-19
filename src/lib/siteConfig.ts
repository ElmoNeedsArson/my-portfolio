import siteConfig from '../../site.config.json';

export const siteOrigin = siteConfig.siteUrl.replace(/\/+$/, '');

export function siteUrl(pathname = '/') {
  const path = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return new URL(path, `${siteOrigin}/`).toString();
}
