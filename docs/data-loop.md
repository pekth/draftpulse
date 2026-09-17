# Calibration data loop

Making “viral potential” good means **fitting weights to outcomes**, not stuffing thousands of tweets into Jev’s small context window.

## What to collect (per post)

| Field | Why |
| --- | --- |
| `text` | Same input the analyzer sees |
| `author_followers` | Normalize engagement |
| `posted_at` | Freshness / cohort |
| `likes`, `replies`, `reposts`, `quotes`, `bookmarks`, `views` | Labels |
| `media` (bool / type) | Optional stratum |

**Derived label (example):**

```text
engagement_rate = (replies*3 + reposts*2 + quotes*2 + bookmarks*2 + likes) / max(followers, 1)
```

Prefer reply/share-weighted labels — closer to X ranking signals than likes alone.

## Legal sources (allowed)

1. **X API** — your own posts, and whatever your access tier permits.
2. **First-party outcomes** — drafts you posted after using this tool (best feedback loop).
3. **Public research archives / licensed datasets** — only with clear redistribution rights.

## Not allowed

- Bulk scraping of X HTML/mobile APIs in violation of ToS
- Purchased “tweet dumps” of unclear provenance
- Impersonation / credential stuffing

## How Jev fits

1. Run the **same** question set in `server/analyze.ts` offline over the corpus.
2. Store per-dimension scores + composite under current `WEIGHTS`.
3. Fit new weights (regression / simple search) so composite correlates with `engagement_rate` within follower buckets.
4. Update `server/weights.ts` only — no prompt stuffing required.

Optional later: treat Jev probabilities as features for a small classical model ([TypeSafe AutoResearch cookbook](https://docs.typesafe.ai/cookbooks/autoresearch_feature_discovery.md)).

## Similarity panel (phase 2+)

Once you have a corpus with embeddings or category + score fingerprints, surface nearest neighbors in the right-hand “Similar posts” stub. Retrieval stays in code; Jev stays for judgments.
