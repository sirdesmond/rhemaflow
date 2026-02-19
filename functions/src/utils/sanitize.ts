const VALID_CATEGORIES = [
  "Health & Healing",
  "Wealth & Prosperity",
  "Identity",
  "Success & Victory",
  "Protection & Fearlessness",
  "Wisdom & Guidance",
  "Marriage & Family",
  "Favor & Open Doors",
  "Peace & Rest",
  "Children & Fruitfulness",
  "General",
];

/**
 * Sanitize text input: trim, limit length, strip control characters.
 */
export function sanitizeText(input: unknown, maxLength = 500): string {
  if (typeof input !== "string") return "";
  return input
    .trim()
    .slice(0, maxLength)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
}

/**
 * Validate category against known DeclarationCategory values.
 * Returns "General" if invalid.
 */
export function sanitizeCategory(input: unknown): string {
  if (typeof input !== "string") return "General";
  return VALID_CATEGORIES.includes(input) ? input : "General";
}

/**
 * Validate gender input. Returns "male", "female", or null.
 */
export function sanitizeGender(input: unknown): "male" | "female" | null {
  if (input === "male" || input === "female") return input;
  return null;
}

/**
 * Validate marital status input.
 */
export function sanitizeMaritalStatus(input: unknown): "single" | "married" | null {
  if (input === "single" || input === "married") return input;
  return null;
}

/**
 * Validate voice gender input. Returns "male" or "female", defaults to "female".
 */
export function sanitizeVoiceGender(input: unknown): "male" | "female" {
  if (input === "male" || input === "female") return input;
  return "female";
}
