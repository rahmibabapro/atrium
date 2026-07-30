import type { Metadata } from "next";
import { MapApp } from "@/components/MapApp";
import { atlas, site } from "@/lib/content";
import { requireFeature } from "@/lib/features";

export const metadata: Metadata = {
  title: "Map",
  description: `${site.brand} map module`,
};

export default function MapPage() {
  requireFeature("map");
  return <MapApp data={atlas} />;
}
