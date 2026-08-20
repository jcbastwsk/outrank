import { SITE_HOST, SITE_URL } from "./site";

/** Inbox that actually gets read. Change this if you stand up legal@outrank.coach. */
export const CONTACT_EMAIL =
  process.env.NEXT_PUBLIC_CONTACT_EMAIL || "hello@outrank.coach";

export const LEGAL = {
  product: "Outrank",
  host: SITE_HOST,
  url: SITE_URL,
  email: CONTACT_EMAIL,
  operator: "the operator of outrank.coach",
  updated: "2026-08-16",
  age: 18,
} as const;
