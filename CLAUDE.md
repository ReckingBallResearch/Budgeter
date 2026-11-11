# Budgeter

Monthly budget planner. The whole app is one file, `app/index.html` (HTML, CSS and vanilla JS, no build step). The same file runs in two places:

- **claude.ai artifact** "Budgeter": https://claude.ai/artifact/JNg9Q5Q8WCvU4tBUzzCRXM, published with capabilities `db`, `downloads`, `sample`, `user`. Data syncs to the viewer's account (`data/users/<id>/plan` and `tx-YYYY-MM` docs) and is also copied to localStorage.
- **macOS desktop app** (Electron, `main.js`). `window.claude` doesn't exist there, so the app falls back to localStorage only and saves files with an `<a download>` link. AI features (reading PDFs, screenshots and statement text; Ask about your spending) use a local model, `gemma3:4b`, through Ollama on 127.0.0.1:11434. The page reaches it through `window.budgeterDesktop` (`preload.js`); `main.js` makes the Ollama calls (JSON-schema output for transactions, streamed chat for questions) and pulls PDF text with `pdfjs-dist`. In the page, `sampleCaps()` hides the difference between Claude on the web and Ollama on desktop: `s.json()` reads transactions and `chat()` answers questions.
- **Ay-Zee purchases** (desktop only): purchases said to the RB Home voice assistant wait on the RB Hub (github.com/ReckingBallResearch/RB-HOME, `hub/rbhub/purchases.py`). `main.js` calls the Hub's `GET /api/purchases` and `POST /api/purchases/done` with the budgeter token, kept in `userData/ayzee.json` (never in the plan or backups); the page reaches it through `window.budgeterDesktop.hub`. The page polls every minute, shows them for a check (`azReview()`), adds them as normal transactions, and remembers added ids in `budgeter:ayzee-taken` so a purchase is never added twice if clearing it on the Hub fails. Keep it in sync with the Hub's API.

This folder is the source of truth. Edit `app/index.html` here, then ship it to one or both targets.

## Rules for changes
- Every `claude.use(...)` call must keep working when it resolves `null` or `window.claude` is missing. The desktop app depends on that.
- Don't break saved data: the localStorage prefix is `budgeter:`, backups are `{app:'budgeter',version:2,plan,tx}`, and restore also accepts the old `monthly-planner` v1 backups. Put schema changes in `upgrade(p)`, which runs on load and on restore.
- Keep the light/dark tokens on `:root` and the phone layout (≤640px) working.
- Don't trust a small model with signs or arithmetic: the AI copies amounts as printed and the app sets the sign (`fromClaude`); for questions the app computes every total in `spendingFacts()` and the AI only explains them.

## Run
- Browser preview: the `budgeter` config in `.claude/launch.json` serves `app/` on port 8765 (localStorage-only mode, same as desktop).
- Desktop dev: `npm start`. Install or update the Mac app: `bash install.sh` (builds with electron-builder and copies to /Applications).
- Web: republish `app/index.html` to the artifact URL above, without changing its capabilities.

## History
Monthly planner (https://claude.ai/artifact/92K1s89g3tRGJrnNWMTiHD) is the v1 ancestor. The first git commit is the old desktop build of it.
