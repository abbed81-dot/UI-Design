import { z } from "zod";

import { getServerEnv } from "@/env";
import { ApiError, handle } from "@/lib/api";

/**
 * Example `app/api` endpoint — a contact / lead submission.
 *
 * Demonstrates the convention: the handler owns the work — it validates input,
 * reads a secret env var, and calls an upstream service inline. Secrets are
 * safe here because `route.ts` is never bundled to the browser.
 */

// Request schema — kept in the route since it isn't shared. Lift to a shared
// module only once another route needs it.
const contactSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.email(),
  message: z.string().min(1).max(2000),
});

export const POST = handle(async (req) => {
  const input = contactSchema.parse(await req.json());

  const { CONTACT_ENDPOINT } = getServerEnv();

  if (CONTACT_ENDPOINT) {
    // Forward the lead to the configured upstream (CRM, webhook, …).
    const upstream = await fetch(CONTACT_ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!upstream.ok) {
      throw new ApiError(502, "upstream_error", "Failed to deliver the message.");
    }
  } else {
    // No upstream configured — log server-side so the starter runs as-is.
    console.log("[api/contact] submission:", input);
  }

  return { received: true };
});
