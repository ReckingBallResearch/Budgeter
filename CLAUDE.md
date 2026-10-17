# Budgeter

Monthly budget planner. The whole app is one file, `app/index.html` (HTML, CSS and vanilla JS, no build step). The same file runs in two places:

- **claude.ai artifact** "Budgeter": https://claude.ai/artifact/JNg9Q5Q8WCvU4tBUzzCRXM, published with capabilities `db`, `downloads`, `sample`, `user`. Data syncs to the viewer's account (`data/users/<id>/plan` and `tx-YYYY-MM` docs) and is also copied to localStorage.
- **macOS desktop app** (Electron, `main.js`). `window.claude` doesn't exist there, so the app falls back to localStorage only, saves files with an `<a download>` link, and hides "Read with Claude".

This folder is the source of truth. Edit `app/index.html` here, then ship it to one or both targets.

## Rules for changes
- Every `claude.use(...)` call must keep working when it resolves `null` or `window.claude` is missing. The desktop app depends on that.
- Don't break saved data: the localStorage prefix is `budgeter:`, backups are `{app:'budgeter',version:2,plan,tx}`, and restore also accepts the old `monthly-planner` v1 backups. Put schema changes in `upgrade(p)`, which runs on load and on restore.
- Keep the light/dark tokens on `:root` and the phone layout (≤640px) working.

## Run
- Browser preview: the `budgeter` config in `.claude/launch.json` serves `app/` on port 8765 (localStorage-only mode, same as desktop).
- Desktop dev: `npm start`. Install or update the Mac app: `bash install.sh` (builds with electron-builder and copies to /Applications).
- Web: republish `app/index.html` to the artifact URL above, without changing its capabilities.

## History
Monthly planner (https://claude.ai/artifact/92K1s89g3tRGJrnNWMTiHD) is the v1 ancestor. The first git commit is the old desktop build of it.
