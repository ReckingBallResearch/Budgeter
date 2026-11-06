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

## Local AI with Ollama
The Mac app reads statements and answers questions about your spending with a small AI model that runs on this Mac through [Ollama](https://ollama.com). Nothing is sent anywhere.

- **Spending → Import statement**: choose a PDF statement, screenshots, or paste statement text, and the local AI finds the transactions. You check them before anything is imported. If money in and out come out backwards, click **Flip them**.
- **Trends → Ask about your spending**: ask questions like "Where did my money go this month?". The app works out the totals and the AI explains them, so double-check anything important.

It needs the Ollama app running and the `gemma3:4b` model (about 3.4 GB):
```
ollama pull gemma3:4b
```
A one-page statement takes about 20 seconds. The first request after a while takes a little longer while the model loads. Scanned PDFs have no text in them; take screenshots of their pages instead.

## Differences from the web version
- No account sync: data lives on this computer only.
- Statements and spending questions are handled by the local AI instead of Claude. PDF import is Mac-only. CSV import works the same.
- Fonts fall back to the system font when offline.
