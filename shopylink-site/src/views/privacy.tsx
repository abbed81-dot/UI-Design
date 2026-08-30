import type { Metadata } from "next";

import { LegalDocument } from "@/components/site/legal-document";
import { generateMetadata } from "@/utils/seo/generate-page-metadata";

/**
 * Privacy policy — a Server Component wrapping one client leaf.
 *
 * The metadata is built HERE rather than in the route, because a route may
 * import only from `@/views` (ADR-0003, enforced by verify.sh).
 */
export const privacyMetadata: Metadata = generateMetadata({
  title: "سياسة الخصوصية · Privacy Policy — ShopyLink",
  description:
    "أي بيانات نجمعها عنك، ولماذا، ومع من نتشاركها، وما هي حقوقك عليها. · What we collect, why, who we share it with, and your rights.",
});

export const PrivacyView = () => {
  return (
    <main className="min-h-lvh bg-background">
      <LegalDocument />
    </main>
  );
};
