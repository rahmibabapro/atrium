import type { Metadata } from "next";
import { WikiApp } from "@/components/WikiApp";
import { site, wiki } from "@/lib/content";
import { requireFeature } from "@/lib/features";

export const metadata: Metadata = {
  title: "Wiki",
  description: `${site.brand} knowledge base`,
};

export default function WikiPage() {
  requireFeature("wiki");
  return <WikiApp groups={wiki.groups} />;
}
