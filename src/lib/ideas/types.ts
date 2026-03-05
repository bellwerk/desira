export type IdeaCategory =
  | "tech"
  | "beauty"
  | "fashion"
  | "home"
  | "books"
  | "gaming"
  | "kids"
  | "other";

export type IdeaSuggestion = {
  id: string;
  title: string;
  imageUrl: string | null;
  priceCents: number | null;
  currency: string | null;
  notePublic: string | null;
  category: IdeaCategory;
};

export type IdeaCategoryFilter = {
  id: IdeaCategory | "all";
  label: string;
};

export const IDEA_CATEGORY_FILTERS: IdeaCategoryFilter[] = [
  { id: "all", label: "All" },
  { id: "tech", label: "Tech" },
  { id: "beauty", label: "Beauty" },
  { id: "fashion", label: "Fashion" },
  { id: "home", label: "Home" },
  { id: "books", label: "Books" },
  { id: "gaming", label: "Gaming" },
  { id: "kids", label: "Kids" },
];

export function parseIdeaCategoryFilter(value: string | undefined): IdeaCategory | "all" {
  switch (value) {
    case "tech":
    case "beauty":
    case "fashion":
    case "home":
    case "books":
    case "gaming":
    case "kids":
    case "all":
      return value;
    default:
      return "all";
  }
}

