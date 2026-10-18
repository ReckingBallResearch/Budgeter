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

## Reading screenshots with Claude
**Import statement** can read screenshots or photos of a statement or banking app, and pasted statement text. On this Mac that needs your own Anthropic API key:
1. Create a key at https://console.anthropic.com/settings/keys (it's billed to your Anthropic account, separate from a Claude subscription; usually a few cents per screenshot).
2. In Budgeter, open **Spending → Import statement**, paste the key and click **Save key**.

The key is encrypted with your Mac's Keychain, stays in the app's main process, and is only sent to Anthropic. **Remove key** in the same dialog deletes it.

## Differences from the web version
- No account sync: data lives on this computer only.
- Reading screenshots and statement text with Claude uses your Anthropic API key instead of your Claude account. CSV import works the same.
- Fonts fall back to the system font when offline.
