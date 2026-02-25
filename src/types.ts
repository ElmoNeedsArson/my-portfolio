export interface ImageObject {
  type: 'image';
  src: string;
  alt?: string;
  caption?: string;
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
}

export interface ProjectSection {
  title: string;
  // subtitle for the section
  subtitle?: string;
  // text is optional so a section can be an image or gallery-only
  text?: string;
  // single image (string path or object with alt/caption)
  image?: ImageObject;
  // gallery of images with optional overall caption
  gallery?: GalleryObject;
  // video object with src, type, and optional caption
  video?: VideoObject;
  // embedded PDF document with optional caption and filename hint
  pdf?: PdfObject;
  // Path to a Three.js scene file
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
  thumbnail: ImageObject;
  thumbnailLight?: ImageObject; // Optional: image for light mode
  projectPageThumbnail?: ImageObject; // Optional: different image for project page header
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
  // Main content (optional when using tabbed content)
  content?: ContentBlock;
  // Optional structured tabs container (alternative to top-level tab1/tab2...)
  tabs?: Record<string, ContentBlock>;
}
