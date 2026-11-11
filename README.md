# Budgeter

A monthly budget planner that keeps your data on your own computer. No account, no sync, no ads.

- **Overview:** income − bills − goals = spending money for the month, what's left to spend per day, a calendar of money in and out, and projected account balances. It warns you when a bill would overdraw an account and when to move money.
- **Bills and income** on any schedule (weekly, every 2 weeks, twice a month, monthly, yearly…), including variable bills like energy and water: enter each month's amount when the bill arrives.
- **Spending:** quick logging, CSV import from your bank, category rules, tags, and budgets per category (drag to reorder).
- **Accounts:** checking, savings, credit cards (statement and due-date tracking), loans, investments, retirement and HSA (contributions, employer match, debit card spending, yearly IRS limit).
- **Debt payoff planner** (avalanche or snowball), **trends** by category, and **net worth** over time.
- **Optional local AI** on the Mac app: read PDF statements and screenshots, and ask questions about your spending. It runs on your Mac through [Ollama](https://ollama.com), so nothing leaves your computer.

## Two ways to use it

### 1. In your browser (any computer)
Download this repo (**Code → Download ZIP**), unzip it, and open `app/index.html` in Chrome, Safari, Firefox or Edge. That's it.

Your data is saved in that browser on that computer. Use the same browser each time, and don't clear its site data. The AI features aren't available in the browser version.

### 2. Mac app
Built and tested on Apple Silicon Macs; Intel Macs should work too. In Terminal:
```
git clone https://github.com/ReckingBallResearch/Budgeter.git
cd Budgeter
bash install.sh
```
It installs Node.js if you don't have it (you'll be asked for your Mac password), builds the app, puts it in /Applications and opens it. The first build takes a few minutes. To update later, run `git pull` and then `bash install.sh` again. Your data is kept.

The app is built and signed on your own Mac, so macOS doesn't show the "unidentified developer" warning.

## Optional: local AI (Mac app)
Reading PDF statements and screenshots, and the **Ask about your spending** panel on the Trends tab, use a small AI model running on your Mac. Everything else works without it.

1. Install [Ollama](https://ollama.com) and open it.
2. In Terminal, download the model (about 3.4 GB):
   ```
   ollama pull gemma3:4b
   ```
3. In Budgeter, open **Spending → Import statement**. It should say the local AI is ready.

A Mac with 16 GB of memory runs it comfortably; with 8 GB it's slower. A one-page statement takes about 20 seconds. Small models make mistakes, so you check every transaction before it's imported (with a **Flip them** link if money in and out come out backwards), and for spending questions the app does all the math while the AI only explains it. Scanned PDFs are pictures with no text in them; take screenshots of their pages instead.

## Optional: purchases by voice with Ay-Zee (Mac app)
If you run the RB Home voice assistant, you can say "Add a purchase: Kukje Grocery for 34.17 and Kukje Bakery for 13.78". The purchases wait on your RB Hub until Budgeter collects them over your home network (every minute while it's open). **Spending** shows how many are waiting; you check each one (speech can mishear names and amounts), pick a category and card, and add them. Unticked ones stay on the Hub for later; **×** discards one.

1. Ask your Hub admin for the `budgeter_token` (in the Hub's `config.toml`, under `[admin]`).
2. In Budgeter, open **Spending → Ay-Zee** and enter the Hub address (`http://192.168.30.11:8700`) and the token.

The token opens only the purchase list on the Hub. The address and token stay on this Mac and aren't in backups.

## Your data
- **Back up regularly:** **Download backup** at the bottom of the page saves everything to a file. **Restore from backup** loads it, including into the other version (browser ↔ Mac app).
- The Mac app keeps its data in `~/Library/Application Support/Budgeter`.
- Nothing is sent anywhere. The only network requests are for fonts (it falls back to system fonts offline) and, if you set them up, to Ollama on your own Mac and to your RB Hub on your home network (which only sends purchases to Budgeter).

## Other systems
The installer is Mac-only. On Windows or Linux, use the browser version. If you're comfortable with Node.js, `npm install` and `npm start` should also run the desktop app there, but that isn't tested.

## Development
The whole app is one file, `app/index.html` (HTML, CSS and plain JavaScript, no build step). `main.js` and `preload.js` are the Electron wrapper and the local AI and PDF bridge. See `CLAUDE.md` for how the pieces fit together.

## License
[MIT](LICENSE)
