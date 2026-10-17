# Budgeter (desktop)

Your data is saved on this Mac only, in Budgeter's app data folder. Use **Download backup** in the app regularly.

## Install or update
In Terminal:
```
bash ~/Downloads/Budgeter/install.sh
```
It installs Node.js if needed, builds the app, puts it in /Applications and opens it.
Run `bash ~/Budgeter/install.sh` any time to rebuild. Your data is kept.

## Moving your data from the web version
1. In the web version, click **Download backup** at the bottom of the page.
2. In the desktop app, click **Restore from backup** and pick that file.

## Updating the app
Replace `~/Budgeter/app/index.html` with the new version, then run `bash ~/Budgeter/install.sh`.

## Differences from the web version
- No account sync: data lives on this computer only.
- "Read with Claude" for pasted PDF statement text isn't available. CSV import works the same.
- Fonts fall back to the system font when offline.
