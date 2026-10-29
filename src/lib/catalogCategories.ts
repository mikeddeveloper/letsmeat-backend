// Categories are a fixed, hand-picked taxonomy (see admin's
// CategoryFormDialog) — exactly these seven, never more. Stray rows left
// over from seeding/testing (e.g. "fresh-egg", "tail") must never surface
// to either the admin console or the public catalog, so every catalog read
// filters down to this allowlist rather than trusting whatever is in the
// AnimalCategory table.
export const CANONICAL_CATEGORY_SLUGS = [
  "poultry",
  "red-meat",
  "seafood",
  "fish",
  "eggs",
  "processed-specialty-meats",
  "organ-offals",
] as const;
