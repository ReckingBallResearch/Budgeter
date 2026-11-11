# Budgeter

Monthly budget planner. The whole app is one file, `app/index.html` (HTML, CSS and vanilla JS, no build step). The same file runs in two places:

- **claude.ai artifact** "Budgeter": https://claude.ai/artifact/JNg9Q5Q8WCvU4tBUzzCRXM, published with capabilities `db`, `downloads`, `sample`, `user`. Data syncs to the viewer's account (`data/users/<id>/plan` and `tx-YYYY-MM` docs) and is also copied to localStorage.
- **macOS desktop app** (Electron, `main.js`). `window.claude` doesn't exist there, so the app falls back to localStorage only and saves files with an `<a download>` link. AI features (reading PDFs, screenshots and statement text; Ask about your spending) use a local model, `gemma3:4b`, through Ollama on 127.0.0.1:11434. The page reaches it through `window.budgeterDesktop` (`preload.js`); `main.js` makes the Ollama calls (JSON-schema output for transactions, streamed chat for questions) and pulls PDF text with `pdfjs-dist`. In the page, `sampleCaps()` hides the difference between Claude on the web and Ollama on desktop: `s.json()` reads transactions and `chat()` answers questions.

- **RB Hub on the NAS** (`/budget`, served by github.com/ReckingBallResearch/RB-HOME `hub/rbhub/budget.py`): a budget per household member, each signed in with their own token (`?token=`). The Hub injects `window.budgeterServer={person,api}`; then `S.db` is `hubDb` (the same calls as `claude.use('db')`), saving `plan` and `tx-YYYY-MM` on the Hub, and this device's copy is kept under `budgeter@<person>:`. The AI is Ay-Zee's model on the home AI engine, through the Hub (`hubSample`, `hubChat`; no PDF reading). Purchases said to Ay-Zee are added by `azMerge()` (each marked with its `az` id, so none is added twice). Keep it in sync with `budget.py`.

This folder is the source of truth. Edit `app/index.html` here, then ship it to one or both targets.

## Rules for changes
- Every `claude.use(...)` call must keep working when it resolves `null` or `window.claude` is missing. The desktop app depends on that.
- Don't break saved data: the localStorage prefix is `budgeter:`, backups are `{app:'budgeter',version:2,plan,tx}`, and restore also accepts the old `monthly-planner` v1 backups. Put schema changes in `upgrade(p)`, which runs on load and on restore.
- Keep the light/dark tokens on `:root` and the phone layout (≤640px) working.
- On the RB Hub the page may load nothing from the internet (its network has none, and the Hub's Content-Security-Policy blocks it): no new CDNs or remote requests; the fonts already fall back to system fonts.
- Don't trust a small model with signs or arithmetic: the AI copies amounts as printed and the app sets the sign (`fromClaude`); for questions the app computes every total in `spendingFacts()` and the AI only explains them.

## Run
- Browser preview: the `budgeter` config in `.claude/launch.json` serves `app/` on port 8765 (localStorage-only mode, same as desktop).
- Desktop dev: `npm start`. Install or update the Mac app: `bash install.sh` (builds with electron-builder and copies to /Applications).
- Web: republish `app/index.html` to the artifact URL above, without changing its capabilities.
- RB Hub: copy `app/index.html` to the NAS (see RB-HOME `docs/deploy.md`); the Hub reads it on every page load. To try it locally, run the Hub with `[budget] app` pointing at this file and open `http://127.0.0.1:8700/budget?person=<name>`.

## History
Monthly planner (https://claude.ai/artifact/92K1s89g3tRGJrnNWMTiHD) is the v1 ancestor. The first git commit is the old desktop build of it.
