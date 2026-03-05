import type { IdeaCategory } from "./types";

const CATEGORY_KEYWORDS: ReadonlyArray<{
  category: IdeaCategory;
  keywords: readonly string[];
}> = [
  {
    category: "tech",
    keywords: [
      "headphone",
      "earbud",
      "speaker",
      "laptop",
      "keyboard",
      "tablet",
      "phone",
      "camera",
      "smartwatch",
      "watch",
      "gadget",
    ],
  },
  {
    category: "beauty",
    keywords: [
      "skincare",
      "makeup",
      "perfume",
      "fragrance",
      "serum",
      "cream",
      "dyson",
      "hair",
    ],
  },
  {
    category: "fashion",
    keywords: [
      "sneaker",
      "shoe",
      "bag",
      "jacket",
      "hoodie",
      "dress",
      "jewelry",
      "ring",
      "bracelet",
    ],
  },
  {
    category: "home",
    keywords: [
      "kitchen",
      "mug",
      "coffee",
      "blender",
      "vacuum",
      "lamp",
      "blanket",
      "pillow",
      "chair",
      "desk",
    ],
  },
  {
    category: "books",
    keywords: ["book", "kindle", "novel", "author", "reading"],
  },
  {
    category: "gaming",
    keywords: ["game", "gaming", "playstation", "xbox", "nintendo", "switch"],
  },
  {
    category: "kids",
    keywords: ["baby", "kids", "kid", "toddler", "toy", "lego"],
  },
];

export function inferIdeaCategory(title: string, notePublic: string | null): IdeaCategory {
  const haystack = `${title} ${notePublic ?? ""}`.toLowerCase();

  for (const entry of CATEGORY_KEYWORDS) {
    if (entry.keywords.some((keyword) => haystack.includes(keyword))) {
      return entry.category;
    }
  }

  return "other";
}

