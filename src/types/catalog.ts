export type CategoryIconKey = "play" | "gamepad" | "globe" | "spark" | "grid";

export type LinkIconKey =
  | "screen"
  | "controller"
  | "headline"
  | "bookmark"
  | "toolbox";

export interface Category {
  id: string;
  name: string;
  description: string;
  icon: CategoryIconKey;
  accentColor: string;
}

export interface LinkItem {
  id: string;
  categoryId: string;
  name: string;
  url: string;
  description: string;
  iconKey: LinkIconKey;
  tags: string[];
}

export interface CatalogData {
  categories: Category[];
  links: LinkItem[];
}
