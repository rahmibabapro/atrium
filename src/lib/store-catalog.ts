import catalogJson from "../../content/store-catalog.json";
import type { Localized } from "./site-types";

export type StoreProduct = {
  id: string;
  title: Localized;
  blurb: Localized;
  category: string;
  priceLabel: Localized;
  image: string;
  popular?: boolean;
  badge?: Localized;
};

export type StoreCatalog = {
  currency: string;
  hero: {
    eyebrow: Localized;
    title: Localized;
    subtitle: Localized;
  };
  categories: Array<{ id: string; label: Localized }>;
  featuredId?: string;
  products: StoreProduct[];
  notes?: Localized;
};

export const storeCatalog = catalogJson as StoreCatalog;
