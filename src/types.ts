interface ImageObject {
  src: string;
  alt?: string;
  caption?: string;
}

interface GalleryObject {
  images: Array<string | ImageObject>;
  caption?: string;
}

interface ProjectSection {
  title: string;
  // text is optional so a section can be an image or gallery-only
  text?: string;
  // single image (string path or object with alt/caption)
  image?: string | ImageObject;
  // gallery of images with optional overall caption
  gallery?: string[] | ImageObject[] | GalleryObject;
}

export interface Project {
  slug: string;
  title: string;
  description: string;
  thumbnail: string | ImageObject;
  thumbnailLight?: string | ImageObject; // Optional: image for light mode
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
