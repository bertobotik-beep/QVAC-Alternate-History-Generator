# QVAC Alternate History Generator

Enter a real historical event and an on-device AI writes a short speculative "what if it had gone differently" paragraph — clearly framed as fiction/speculation, never as a factual claim. No cloud call, no API key.

## How it works

1. You type a real historical event (e.g. `the invention of the printing press`) into the input field and submit.
2. The server asks the on-device model for a short speculative paragraph imagining a different outcome, instructed to open with "What if" so the framing is unmistakably fictional.
3. The reply is streamed token-by-token and cleaned up (stripped of quotes and preambles like "Here's...").
4. `logic.js` validates the result: it must actually reference the event (`isGrounded`) and not be a refusal, otherwise a guaranteed on-topic fallback is used. As a deterministic safety net, if the final text still doesn't start with a speculative phrase like "What if" or "Imagine if", the code itself prepends one — so the output can never read as a factual claim, regardless of what the model produced.

### Example

- Input: `the invention of the printing press`
- Typical output: `"What if the printing press had never spread beyond a single workshop? Books might have stayed rare, hand-copied treasures for centuries longer..."`

### QVAC functions used

- `loadModel({ modelSrc: LLAMA_3_2_1B_INST_Q4_0 })` — loads the model on-device at startup (`src/gui.js`).
- `completion({ modelId, history, stream: true, completionOpts })` — generates the speculative paragraph, streamed via `run.tokenStream` (`src/logic.js`).
- `unloadModel({ modelId })` — releases the model when the server shuts down (`src/gui.js`).

## Run

```bash
npm install
npm start
```

Then open http://localhost:31025

The port can be overridden with the `PORT` environment variable.

## QVAC SDK version

`@qvac/sdk` ^0.19.0 (see `package.json`).

## License

MIT
