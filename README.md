# Thrymnor Prototype (Static, Personal Use)

Local-only demo for a medieval fantasy RPG focused on **actions & consequences**.

## Features
- World map with 5 locations
- Action bar (fight, talk, sneak, negotiate, forage, rest)
- Morality meters (Order / Mercy)
- Skills list (OSRS-style categories)
- Quest log with branching outcomes (2 sample quests — expand easily)
- Inventory with OSRS-like rarities and item effects (sample pool)
- Save/Load/Reset using localStorage

## Run locally
Just open `index.html` in a browser.

### (Optional) Simple HTTP server
```bash
# Python 3
python -m http.server 5173
# Visit http://localhost:5173
```

## Private on GitHub
1. Create a **new private repository** (name it `thrymnor-prototype`).
2. Push these files:
```bash
git init
git add .
git commit -m "Initial prototype"
git branch -M main
git remote add origin <YOUR_GITHUB_REPO_URL>
git push -u origin main
```
3. Keep the repo private. For *private hosting & sharing*:
   - **Codespaces**: Open in Codespaces, run a local server (e.g., `python -m http.server 5173`), then **Forward Port** and set it to **Private**. Share with specific GitHub users.
   - **Local**: Pull the repo locally and open `index.html`.
   - **DO NOT** use public GitHub Pages if you want it private.

> This project is for **personal use only**; no commercial use intended.
