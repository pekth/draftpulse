export type Category =
  | "hot_take"
  | "how_to"
  | "story"
  | "question"
  | "announcement"
  | "humor"
  | "other";

export type DimensionScores = {
  hook: number;
  specificity: number;
  reply_magnet: number;
  shareability: number;
  dwell_structure: number;
  anti_slop: number;
};

export type AnalyzeResult = {
  mode: "live" | "mock";
  category: Category;
  categoryConfidence: number;
  dimensions: DimensionScores;
  composite: number;
  tips: string[];
  model?: string;
};

export const DIMENSION_LABELS: Record<keyof DimensionScores, string> = {
  hook: "Hook",
  specificity: "Specificity",
  reply_magnet: "Reply magnet",
  shareability: "Shareability",
  dwell_structure: "Dwell structure",
  anti_slop: "Anti-slop",
};

export const CATEGORY_LABELS: Record<Category, string> = {
  hot_take: "Hot take",
  how_to: "How-to",
  story: "Story",
  question: "Question",
  announcement: "Announcement",
  humor: "Humor",
  other: "Other",
};
