export type HelpSection = "catalog" | "title-detail" | "reader";

export const HELP_TITLES: Record<HelpSection, string> = {
  catalog: "Справка: каталог записей",
  "title-detail": "Справка: страница тайтла",
  reader: "Справка: читалка",
};

export function getHelpSection(pathname: string): HelpSection {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.at(-1) === "read") {
    return "reader";
  }
  if (segments.length === 2) {
    return "title-detail";
  }
  return "catalog";
}
