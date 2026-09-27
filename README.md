<h1 align="center">DraftPulse</h1>

<p align="center">
  <strong>Live viral-dimension scoring and calibration engine for X posts before publishing.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/platform-Web%20%7C%20Node.js-blue?style=flat-square" alt="Platform: Web | Node.js">
  <img src="https://img.shields.io/badge/stack-React%2018%20%7C%20Vite%20%7C%20Express-orange?style=flat-square" alt="Stack: React | Vite | Express">
  <img src="https://img.shields.io/badge/engine-TypeSafe%20Jev%20%7C%20Deterministic%20Mock-purple?style=flat-square" alt="Engine: TypeSafe Jev | Mock">
  <img src="https://img.shields.io/badge/license-MIT-green?style=flat-square" alt="License: MIT">
</p>

---

### ⚡ TL;DR

**DraftPulse** provides real-time viral-dimension scoring and category classification for social drafts as you type, highlighting structural strengths and AI slop risks before you hit publish.

* **Live Debounced Scoring**: Automatically evaluates drafts on typing pauses (~500ms), giving instant visual feedback without blocking the editor.
* **Six Viral Dimensions**: Scores hook strength, concrete specificity, reply propensity, bookmark shareability, dwell time, and slop risk.
* **TypeSafe Jev Integration**: Evaluates multiple narrow rubric questions in a single structured LLM call via [TypeSafe Jev](https://docs.typesafe.ai/).
* **Deterministic Fallback**: Functions out-of-the-box without an API key using built-in heuristic analysis.
* **Zero-Scraping Data Policy**: Model calibration relies strictly on the official X API, owned posts, or licensed archives—never web scraping.

```bash
npm install && cp .env.example .env && npm run dev
```
> UI launches on http://localhost:5174 with the scoring API on http://localhost:8787.

---

## 🔍 Scoring Dimension Matrix

| Dimension | Focus | Weight Impact | Primary Risk Evaluated |
|---|:---:|:---:|---|
| **Hook Strength** | First 80 characters & visual scroll-stop | High | Buried lede, boring opener |
| **Specificity** | Concrete numbers, exact tools, real facts | Medium-High | Vague generalizations, empty platitudes |
| **Reply Propensity** | Discussion surface & debate catalyst | Medium | Broadcast-only statements with no hook |
| **Shareability** | Bookmark reference value & retweet utility | High | Ephemeral or single-use observations |
| **Dwell Time** | Density of insights per character | Medium | Fluff, filler lines, and padded sentences |
| **Slop Penalty** | AI cliches, em-dashes, boilerplate phrases | Negative Penalty | Overused synthetics and robotic tone |

---

## 🚀 Key Features

* **Composite Scoring Formula** — Combines individual dimension ratings into an overall readiness score using configurable weights in `server/weights.ts`.
* **Category Auto-Detection** — Automatically identifies the post genre (Build in Public, Technical Insight, Hot Take, Story, Question) to apply appropriate evaluation rubrics.
* **Server-Side Key Isolation** — Keeps `TYPESAFE_API_KEY` strictly in the backend Express service; secrets are never bundled or exposed to the client browser.
* **Calibrated Feedback Loops** — Designed around the [data-loop plan](docs/data-loop.md) to continuously refine heuristics based on actual observed post performance.

---

## 🔒 Privacy & Architecture

* **Zero Scraping Policy**: DraftPulse does not scrape X or bypass platform access controls.
* **Local Draft Privacy**: Unsent drafts remain in local application state and are transmitted only to the local scoring proxy endpoint.
* **Isolated Environment Variables**: Secret credentials live in `.env` (gitignored). `.env.example` remains a safe, empty template.

---

## 📦 Installation & Setup

### Prerequisites
* Node.js 18+ and npm
* Optional: TypeSafe API Key (from [TypeSafe](https://docs.typesafe.ai/))

### Quick Start
```bash
# 1. Clone & install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env and supply TYPESAFE_API_KEY (optional for mock mode)

# 3. Launch UI and backend server
npm run dev
```

---

## 💬 Example Requests & Post Checks

- *"Validate this product launch hook before posting."*
- *"Detect AI slop patterns and overused buzzwords in this thread draft."*
- *"Estimate bookmark shareability for this technical guide summary."*

---

## 🧪 Development & Verification

```bash
# Run composition & rubric checks
npm run test:compose

# Typecheck and build frontend
npm run build
```

---

## 📄 License & Attribution

* **License**: [MIT](LICENSE)
* **Disclaimer**: Experimental research prototype. Heuristic scores provide structural feedback and do not guarantee platform reach or algorithmic promotion.
