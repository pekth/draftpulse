import { choice, noul, score, TypeSafeClient } from "@typesafe-ai/sdk";
import { SCORE_MAX, WEIGHTS } from "./weights.js";

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

const QUESTIONS = {
  category: choice("Which X/Twitter post category best fits `draft.text`?", {
    hot_take: {
      what: "Strong opinion, contrarian claim, or stance",
      not_for: "Neutral how-to, personal story, or pure question",
    },
    how_to: {
      what: "Playbook, checklist, steps, or tactical advice",
      not_for: "Opinion without actionable steps",
    },
    story: {
      what: "Personal narrative, anecdote, or lived experience",
      not_for: "Generic advice with no personal specifics",
    },
    question: {
      what: "Primary goal is to solicit replies or discussion",
      not_for: "Rhetorical question buried in a take",
    },
    announcement: {
      what: "Launch, shipping update, hire, or product news",
      not_for: "Commentary on someone else's news",
    },
    humor: {
      what: "Joke, meme energy, or playful bit",
      not_for: "Serious advice framed lightly",
    },
    other: {
      what: "Does not fit the other categories",
      not_for: "Clear match to another label",
    },
  }),
  hook: score(
    "How strong is the opening hook of `draft.text` for stopping a scroll?",
    [
      "No hook; starts vague or buried",
      "Weak opener; reader can skip safely",
      "Decent opener; some curiosity",
      "Strong hook; clear tension or promise",
      "Excellent hook; hard to scroll past",
    ],
  ),
  specificity: score(
    "How specific and concrete is `draft.text` (numbers, names, scenes) vs vague claims?",
    [
      "Entirely vague or generic",
      "Mostly generic with a thin detail",
      "Some concrete details",
      "Mostly specific and grounded",
      "Highly specific; hard to confuse with AI filler",
    ],
  ),
  reply_magnet: score(
    "How likely is `draft.text` to earn replies (stance, question, incomplete thought others finish)?",
    [
      "No reply incentive",
      "Mild invitation",
      "Moderate reply pull",
      "Strong reply magnet",
      "Extremely reply-baiting in a good way",
    ],
  ),
  shareability: score(
    "How worth sharing via DM or repost is `draft.text` (useful, quotable, save-worthy)?",
    [
      "Not share-worthy",
      "Slightly useful to someone",
      "Moderately shareable",
      "Clearly worth sending to a friend",
      "Highly shareable artifact",
    ],
  ),
  dwell_structure: score(
    "How well is `draft.text` structured for dwell (line breaks, payoff, readable pacing)?",
    [
      "Wall of text or empty one-liner",
      "Weak structure",
      "Readable enough",
      "Good pacing and payoff",
      "Excellent structure for holding attention",
    ],
  ),
  slop_risk: noul(
    "Does `draft.text` read like AI slop, engagement bait, or spam that would earn mute/not-interested?",
    {
      true: {
        what: "Generic AI tells, bait, or spammy patterns",
        examples: ["As an AI…", "Comment YES if…", "Unbelievable trick…"],
      },
      false: {
        what: "Sounds human, specific, and non-spammy",
        examples: ["Concrete shipping note", "Personal failure with a lesson"],
      },
    },
  ),
};

function tipFrom(dimensions: DimensionScores, category: Category): string[] {
  const tips: string[] = [];
  const ranked = (
    Object.entries(dimensions) as [keyof DimensionScores, number][]
  )
    .filter(([k]) => k !== "anti_slop")
    .sort((a, b) => a[1] - b[1]);

  const weakest = ranked[0]?.[0];
  if (weakest === "hook" && dimensions.hook < 0.55) {
    tips.push("Lead with tension, a concrete claim, or an unexpected number.");
  }
  if (weakest === "specificity" && dimensions.specificity < 0.55) {
    tips.push("Swap abstractions for one named detail, number, or scene.");
  }
  if (weakest === "reply_magnet" && dimensions.reply_magnet < 0.55) {
    tips.push("End with a real question or a stance people will argue with.");
  }
  if (weakest === "shareability" && dimensions.shareability < 0.55) {
    tips.push("Make it sendable: a checklist, ratio, or playbook someone DMs.");
  }
  if (weakest === "dwell_structure" && dimensions.dwell_structure < 0.55) {
    tips.push("Break lines. Hook → tension → payoff. Kill the wall of text.");
  }
  if (dimensions.anti_slop < 0.5) {
    tips.push("Cut bait phrases and generic AI filler — negative ranking signals hurt.");
  }
  if (category === "announcement") {
    tips.push("Announcements need a human why, not only a ship log.");
  }
  if (tips.length === 0) {
    tips.push("Solid draft. Tighten the first line, then ship.");
  }
  return tips.slice(0, 3);
}

export function compose(
  dims: DimensionScores,
  category: Category,
  categoryConfidence: number,
): Pick<AnalyzeResult, "composite" | "tips"> {
  const composite =
    WEIGHTS.hook * dims.hook +
    WEIGHTS.specificity * dims.specificity +
    WEIGHTS.reply_magnet * dims.reply_magnet +
    WEIGHTS.shareability * dims.shareability +
    WEIGHTS.dwell_structure * dims.dwell_structure +
    WEIGHTS.anti_slop * dims.anti_slop;

  return {
    composite: Math.round(composite * 1000) / 1000,
    tips: tipFrom(dims, category),
  };
}

function normalizeScore(raw: number): number {
  return Math.min(1, Math.max(0, raw / SCORE_MAX));
}

export async function analyzeLive(
  text: string,
  signal?: AbortSignal,
): Promise<AnalyzeResult> {
  const client = new TypeSafeClient();
  const response = await client.systemOne(
    {
      state: {
        draft: {
          text,
          platform: "x",
          char_count: text.length,
        },
        ranking_notes: {
          prefer: ["replies", "shares", "dwell", "profile_clicks"],
          avoid: ["not_interested", "mute", "report", "ai_slop"],
        },
      },
      questions: QUESTIONS,
    },
    { signal },
  );

  const a = response.answers;
  const dimensions: DimensionScores = {
    hook: normalizeScore(a.hook.score),
    specificity: normalizeScore(a.specificity.score),
    reply_magnet: normalizeScore(a.reply_magnet.score),
    shareability: normalizeScore(a.shareability.score),
    dwell_structure: normalizeScore(a.dwell_structure.score),
    anti_slop: 1 - a.slop_risk.noul,
  };
  const category = a.category.choice as Category;
  const { composite, tips } = compose(
    dimensions,
    category,
    a.category.confidence,
  );

  return {
    mode: "live",
    category,
    categoryConfidence: a.category.confidence,
    dimensions,
    composite,
    tips,
    model: response.model,
  };
}

/** Deterministic heuristic when no API key — keeps the UX loop working. */
export function analyzeMock(text: string): AnalyzeResult {
  const t = text.trim();
  const lower = t.toLowerCase();
  const lines = t.split(/\n/).filter(Boolean);
  const hasNumber = /\d/.test(t);
  const hasQuestion = /\?/.test(t);
  const wordCount = t.split(/\s+/).filter(Boolean).length;

  const slopHits = [
    "unbelievable",
    "comment yes",
    "as an ai",
    "game changer",
    "you won't believe",
    "thread 🧵",
  ].filter((p) => lower.includes(p)).length;

  const dimensions: DimensionScores = {
    hook: clamp01(
      (t.length > 0 ? 0.35 : 0) +
        (lines[0] && lines[0].length < 90 ? 0.2 : 0) +
        (hasNumber ? 0.15 : 0) +
        (wordCount > 8 ? 0.1 : 0),
    ),
    specificity: clamp01(
      (hasNumber ? 0.35 : 0.1) +
        (/\b(i|we|my)\b/i.test(t) ? 0.2 : 0) +
        (wordCount > 20 ? 0.15 : 0) -
        slopHits * 0.15,
    ),
    reply_magnet: clamp01(
      (hasQuestion ? 0.45 : 0.15) +
        (/\b(wrong|disagree|unpopular|hot take)\b/i.test(t) ? 0.25 : 0) +
        (wordCount > 12 ? 0.1 : 0),
    ),
    shareability: clamp01(
      (/\b(checklist|playbook|template|steps|framework)\b/i.test(t)
        ? 0.4
        : 0.15) +
        (hasNumber ? 0.2 : 0) +
        (lines.length >= 3 ? 0.15 : 0),
    ),
    dwell_structure: clamp01(
      (lines.length >= 3 ? 0.4 : 0.15) +
        (wordCount > 25 && wordCount < 220 ? 0.25 : 0.05) +
        (lines.length >= 5 ? 0.15 : 0),
    ),
    anti_slop: clamp01(1 - slopHits * 0.28 - (wordCount < 4 ? 0.2 : 0)),
  };

  let category: Category = "other";
  if (/\b(shipped|launch|released|hiring)\b/i.test(t)) category = "announcement";
  else if (hasQuestion && wordCount < 40) category = "question";
  else if (/\b(how to|step|checklist|playbook)\b/i.test(t)) category = "how_to";
  else if (/\b(lol|lmao|joke)\b/i.test(t)) category = "humor";
  else if (/\b(i |my |we )\b/i.test(t) && wordCount > 30) category = "story";
  else if (/\b(wrong|unpopular|hot take|stop)\b/i.test(t)) category = "hot_take";

  const { composite, tips } = compose(dimensions, category, 0.55);
  return {
    mode: "mock",
    category,
    categoryConfidence: 0.55,
    dimensions,
    composite,
    tips,
  };
}

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, Math.round(n * 1000) / 1000));
}

export function hasApiKey(): boolean {
  return Boolean(process.env.TYPESAFE_API_KEY?.trim());
}
