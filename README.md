# Budgeter (desktop)

Your data is saved on this Mac only, in Budgeter's app data folder. Use **Download backup** in the app regularly.

## Install or update
In Terminal:
```
bash ~/Budgeter/install.sh
```
It installs Node.js if needed, builds the app, puts it in /Applications and opens it. Run it again any time to rebuild. Your data is kept.

## Upgrading from Monthly planner (version 1)
Version 2 is the full Budgeter app: Spending, Debt and Trends tabs, kickoff, quick logging, tags and net worth history. The first time it opens, it moves your existing data over by itself. Loan payments you set up on the account move to the Bills tab. Old Monthly planner backups also restore.

## Moving your data from the web version
1. In the web version, click **Download backup** at the bottom of the page.
2. In the desktop app, click **Restore from backup** and pick that file.

## Updating the app
The app is `~/Budgeter/app/index.html`, the same file that runs as the Budgeter artifact on claude.ai. After changing it, run `bash ~/Budgeter/install.sh`.

## Differences from the web version
- No account sync: data lives on this computer only.
- "Read with Claude" for pasted PDF statement text isn't available. CSV import works the same.
- Fonts fall back to the system font when offline.
