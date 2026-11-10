import {
  assertSafeQueryText,
  assertSafeText,
  assertSafeTextFields,
  type SafeTextProfile,
} from "./safeTextInput";

const CONTENT_BODY_FIELDS: Array<{
  key: string;
  profile?: SafeTextProfile;
}> = [
  { key: "title" },
  { key: "original_title" },
  { key: "status" },
  { key: "season" },
  { key: "genres" },
  { key: "studio" },
  { key: "release_date" },
  { key: "duration_text" },
  { key: "cover_path", profile: "url" },
  { key: "description" },
  { key: "content_type" },
  { key: "age_rating" },
  { key: "view_start_date" },
  { key: "view_end_date" },
];

export function assertSafeContentBody(body: Record<string, unknown>): void {
  const fields: Record<string, unknown> = {};
  const profiles: Partial<Record<string, SafeTextProfile>> = {};

  for (const { key, profile } of CONTENT_BODY_FIELDS) {
    if (key in body) {
      fields[key] = body[key];
      if (profile) {
        profiles[key] = profile;
      }
    }
  }

  assertSafeTextFields(fields, profiles);
}

export function assertSafeListQuery(query: Record<string, unknown>): void {
  assertSafeQueryText(query.title, "title");
  assertSafeQueryText(query.genres, "genres");
  assertSafeQueryText(query.studio, "studio");
  assertSafeQueryText(query.season, "season");
  assertSafeQueryText(query.year, "year");
  assertSafeQueryText(query.status, "status");
}

export function assertSafeBookmarkBody(body: Record<string, unknown>): void {
  assertSafeText(body.label, "label");
  assertSafeText(body.location, "location", "cfi");
}

export function assertSafeProgressBody(body: Record<string, unknown>): void {
  assertSafeText(body.location, "location", "cfi");
  if (typeof body.theme === "string" && body.theme.trim()) {
    assertSafeText(body.theme, "theme");
  }
}

export function assertSafeShikimoriTitles(
  ruTitle: string,
  originalTitle: string
): void {
  assertSafeText(ruTitle, "target_title_ru");
  assertSafeText(originalTitle, "target_title");
}
