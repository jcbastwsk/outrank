/** Password managers (Dashlane, 1Password) inject data-* before hydrate. */
export const noAutofill = {
  autoComplete: "off" as const,
  "data-1p-ignore": "true",
  "data-lpignore": "true",
  "data-form-type": "other",
  suppressHydrationWarning: true,
};
