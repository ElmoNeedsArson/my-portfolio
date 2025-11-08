export interface ImageObject {
  src: string;
  alt?: string;
  caption?: string;
}

export interface VideoObject {
  src: string;
  caption?: string;
  autoplay?: boolean;
  loop?: boolean;
  muted?: boolean;
  controls?: boolean;
}

export type MediaObject = ImageObject | VideoObject;

export interface GalleryObject {
  media: Array<MediaObject>;
  columns?: number;
  caption?: string;
}

interface ProjectSection {
  title: string;
  // text is optional so a section can be an image or gallery-only
  text?: string;
  // single image (string path or object with alt/caption)
  image?: ImageObject;
  // gallery of images with optional overall caption
  gallery?: ImageObject[] | GalleryObject;
  // video object with src, type, and optional caption
  video?: VideoObject;
}

export interface Project {
  slug: string;
  title: string;
  description: string;
  thumbnail: ImageObject;
  thumbnailLight?: ImageObject; // Optional: image for light mode
  date: string;
  languages: string[];
  tools: string[];
  tags: string[];
  repoUrl?: string;
  demoLink?: string;
  featured?: boolean;
  content: {
    overview: string;
    keyFeatures: string[];
    sections: ProjectSection[];
  };
}
