export interface ImageObject {
  type: 'image';
  src: string;
  alt?: string;
  caption?: string;
  invert?: boolean;
}

export interface VideoObject {
  type: 'video';
  src: string;
  caption?: string;
  autoplay?: boolean;
  loop?: boolean;
  muted?: boolean;
  controls?: boolean;
}

export interface ThreeJSObject {
  type: 'threejs';
  src: string;
  caption?: string;
}

export interface PdfObject {
  type: 'pdf';
  src: string;
  caption?: string;
  downloadName?: string;
}

export type MediaObject = ImageObject | VideoObject | ThreeJSObject;

export interface GalleryObject {
  media: Array<MediaObject>;
  columns?: number;
  caption?: string;
  maxWidth?: string;
}

export interface ProjectSection {
  title: string;
  subtitle?: string;
  text?: string;
  image?: ImageObject;
  gallery?: GalleryObject;
  video?: VideoObject;
  pdf?: PdfObject;
  ThreeJSScene?: ThreeJSObject; 
}

export interface ContentBlock {
  // Optional display name for tabbed content
  name?: string;
  overview: string;
  keyFeatures: string[];
  sections: ProjectSection[];
}

export interface Project {
  pinned: boolean;
  slug: string;
  title: string;
  type: 'card' | 'bar' | 'twente' | 'eindhoven';
  shortDesc: string;
  description: string;
  installations?: number;
  thumbnail: ImageObject;
  thumbnailLight?: ImageObject; // Optional: image for light mode
  projectPageThumbnail?: ImageObject; // Optional: different image for project page header
  projectPageThumbnailHeight?: number;
  date: string;
  languages: string[];
  tools: string[];
  tags: string[];
  expertise?: Array<{
    area: string;
    rating: number;
    reason: string;
  }>;
  repoUrl?: string;
  demoLink?: string;
  featured?: boolean;
  content?: ContentBlock;
  tabs?: Record<string, ContentBlock>;
}
