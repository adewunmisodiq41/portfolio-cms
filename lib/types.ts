export type SettingsDTO = {
  name: string;
  title: string;
  greeting: string;
  locationPrefix: string;
  location: string;
  availability: string;
  bio: string;
  portraitUrl: string;
  bookingUrl: string;
  bookingLabel: string;
  ratingScore: string;
  ratingText: string;
  showRating: boolean;
  showBooking: boolean;
  mobilePhotoSide: string;
  workspaceLabel: string;
  footerText: string;
  seoTitle: string;
  seoDescription: string;
  accentColor: string;
  bgColor: string;
};

export type StatDTO = { value: string; label: string };
export type SocialDTO = { label: string; name: string; url: string };

export type ProjectDTO = {
  id: number;
  categoryId: number;
  title: string;
  meta: string;
  description: string;
  imageUrl: string;
  linkUrl: string;
  tall: boolean;
  order: number;
  published: boolean;
};

export type CategoryDTO = {
  id: number;
  slug: string;
  name: string;
  intro: string;
  color1: string;
  color2: string;
  order: number;
  published: boolean;
};

export type SiteData = {
  settings: SettingsDTO;
  stats: StatDTO[];
  socials: SocialDTO[];
  categories: (CategoryDTO & { projects: ProjectDTO[] })[];
};
