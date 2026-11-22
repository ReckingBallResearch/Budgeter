# Budgeter

Monthly budget planner. The whole app is one file, `app/index.html` (HTML, CSS and vanilla JS, no build step). The same file runs in two places:

- **claude.ai artifact** "Budgeter": https://claude.ai/artifact/JNg9Q5Q8WCvU4tBUzzCRXM, published with capabilities `db`, `downloads`, `sample`, `user`. Data syncs to the viewer's account (`data/users/<id>/plan` and `tx-YYYY-MM` docs) and is also copied to localStorage.
- **macOS desktop app** (Electron, `main.js`). `window.claude` doesn't exist there, so the app falls back to localStorage only and saves files with an `<a download>` link. AI features (reading PDFs, screenshots and statement text; Ask about your spending) use a local model, `gemma3:4b`, through Ollama on 127.0.0.1:11434. The page reaches it through `window.budgeterDesktop` (`preload.js`); `main.js` makes the Ollama calls (JSON-schema output for transactions, streamed chat for questions) and pulls PDF text with `pdfjs-dist`. In the page, `sampleCaps()` hides the difference between Claude on the web and Ollama on desktop: `s.json()` reads transactions and `chat()` answers questions.

This folder is the source of truth. Edit `app/index.html` here, then ship it to one or both targets.

## Rules for changes
- Every `claude.use(...)` call must keep working when it resolves `null` or `window.claude` is missing. The desktop app depends on that.
- Don't break saved data: the localStorage prefix is `budgeter:`, backups are `{app:'budgeter',version:2,plan,tx}`, and restore also accepts the old `monthly-planner` v1 backups. Put schema changes in `upgrade(p)`, which runs on load and on restore.
- Keep the light/dark tokens on `:root` and the phone layout (≤640px) working.
- Don't trust a small model with signs or arithmetic: the AI copies amounts as printed and the app sets the sign (`fromClaude`); for questions the app computes every total in `spendingFacts()` and the AI only explains them.
- Statement imports read the account box first (`stmtAcct`). With statement text, `stmtInfo` keeps a value only where it's printed next to its label and reads the last 4 digits itself; `findAcct` matches by last 4, then file name, then name words (issuer nicknames like BofA and Amex count). Account changes are checkboxes the user sees before import, and older statements default off. The preview lists every row found; rows that match a saved transaction (same date, description and amount), summary lines (`SUMMARY_ROW`) and overlapping-screenshot repeats start unticked. Duplicates are checked only against saved transactions, so deleting one makes it importable again.

- Categories: `PERM` ones (Transport) are always on the list and can't be removed; `upgrade(p)` re-adds them. Merchant memory never lets "Uncategorized" override a rule, and `catFor` falls back to the built-in `TRANSPORT` words after the user's rules. `recatOnce()` runs once per `plan.catv` and files old uncategorized purchases. Saving rules adds any category they name that doesn't exist yet.
- Your charts (`plan.charts`, Trends tab): each one counts a purchase that matches any of its merchant words, tags or categories, excluding Transfer and Income. The app computes every number, and `spendingFacts()` passes the charts to Ask.

## Run
- Browser preview: the `budgeter` config in `.claude/launch.json` serves `app/` on port 8765 (localStorage-only mode, same as desktop).
- Desktop dev: `npm start`. Install or update the Mac app: `bash install.sh` (builds with electron-builder and copies to /Applications).
- Web: republish `app/index.html` to the artifact URL above, without changing its capabilities.

## History
Monthly planner (https://claude.ai/artifact/92K1s89g3tRGJrnNWMTiHD) is the v1 ancestor. The first git commit is the old desktop build of it.
