export type BookFormat = "epub" | "pdf" | "txt" | "fb2";

export type ParsedTextResult = {
  pages: string[];
  totalPages: number;
};
