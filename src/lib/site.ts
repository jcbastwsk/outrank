export const SITE_HOST = "outrank.coach";
export const SITE_URL = "https://outrank.coach";

export function appUrl() {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  if (process.env.VERCEL_ENV === "production") return SITE_URL;
  return "http://localhost:3000";
}
