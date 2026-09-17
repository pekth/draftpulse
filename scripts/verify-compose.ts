import assert from "node:assert/strict";
import { analyzeMock, compose } from "../server/analyze.ts";

const dims = {
  hook: 0.8,
  specificity: 0.7,
  reply_magnet: 0.6,
  shareability: 0.5,
  dwell_structure: 0.4,
  anti_slop: 0.9,
};

const { composite, tips } = compose(dims, "how_to", 0.8);
assert.ok(composite > 0.5 && composite < 0.9, `composite=${composite}`);
assert.ok(tips.length >= 1);

const mock = analyzeMock(
  "I shipped 3 checklists last week.\n\nHere is the playbook:\n1. Hook\n2. Proof\n3. Ask\n\nWhat would you cut?",
);
assert.equal(mock.mode, "mock");
assert.ok(mock.composite > 0.3, `mock composite=${mock.composite}`);
assert.ok(mock.dimensions.reply_magnet > 0.3);

console.log("verify-compose ok", {
  composite,
  mockComposite: mock.composite,
  category: mock.category,
});
