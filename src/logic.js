// QVAC Alternate History Generator — core logic.
// completion() writes a short speculative counterfactual paragraph about a
// real historical event. A deterministic "What if..." framing prefix is
// always enforced in code so the output can never read as a factual claim,
// regardless of what the model produces.

import { completion } from "@qvac/sdk";

const STOPWORDS = new Set([
  "the", "a", "an", "and", "or", "but", "of", "to", "in", "on", "for", "with",
  "at", "as", "is", "are", "was", "were", "when", "that", "this",
]);

function keywords(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 4 && !STOPWORDS.has(w));
}

function looksUnusable(text) {
  if (!text || text.trim().length === 0) return true;
  if (text.length > 700) return true;
  const bad = ["i cannot", "i can't", "as an ai", "i'm not able", "i do not have", "please provide"];
  const lower = text.toLowerCase();
  return bad.some((phrase) => lower.includes(phrase));
}

function isGrounded(text, event) {
  const words = keywords(event);
  if (words.length === 0) return true;
  const lower = text.toLowerCase();
  return words.some((w) => lower.includes(w));
}

const SPECULATIVE_STARTERS = /^(what if|imagine if|picture a world|suppose)/i;

const FALLBACK = (event) =>
  `What if ${event} had unfolded differently? In this speculative timeline, the smallest shift in ` +
  `decisions or timing sends events down an entirely different path, reshaping what came after in ways ` +
  `we can only imagine. This is a fictional "what if" — not a claim about what actually happened.`;

export async function generate(modelId, event) {
  const run = completion({
    modelId,
    history: [
      {
        role: "system",
        content:
          "The user will name a real historical event. Write a short speculative fiction paragraph " +
          "(3-5 sentences) imagining an alternate, different outcome for that event. Begin your reply " +
          "with the words 'What if' to make clear this is imaginative speculation, not a factual claim " +
          "about real history. Reply with ONLY the speculative paragraph, no preamble, no disclaimers " +
          "beyond the 'What if' framing.",
      },
      { role: "user", content: "Historical event: the invention of the printing press" },
      {
        role: "assistant",
        content:
          "What if the printing press had never spread beyond a single workshop? Books might have stayed " +
          "rare, hand-copied treasures for centuries longer, and the pace of scientific and religious change " +
          "across Europe could have slowed to a crawl. Ideas that spread in decades might instead have taken " +
          "generations, leaving many regions locked in older ways of thinking well into a different era.",
      },
      { role: "user", content: `Historical event: ${event}` },
    ],
    stream: true,
    completionOpts: { temperature: 0.85, maxTokens: 220 },
  });

  let text = "";
  for await (const token of run.tokenStream) text += token;
  text = text
    .trim()
    .replace(/^here'?s[^:\n]*:\s*/i, "")
    .trim()
    .replace(/^["'“]|["'”]$/g, "")
    .trim();

  // Fall back to a deterministic, clearly-speculative paragraph whenever the
  // model refused, rambled, or produced text with no keyword overlap with
  // the requested event — this keeps every result grounded and safe even if
  // the on-device model produces a bad completion.
  let speculation = looksUnusable(text) || !isGrounded(text, event) ? FALLBACK(event) : text;

  // Deterministic safety net: never let the output leave without an explicit
  // speculative framing, regardless of what the model produced.
  if (!SPECULATIVE_STARTERS.test(speculation)) {
    speculation = `What if things had gone differently? ${speculation}`;
  }

  return { speculation };
}
