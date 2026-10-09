# Ramayana Utsav 🏹

A quiz-show style site for a Balvikas Ramayana event: 4 teams, a lucky-number toss,
**Chitra Katha** (jumbled picture puzzle) and **Main Kaun Hoon?** (Who Am I?).

## Run locally
    npm install
    npm run dev

## Deploy to Vercel
Push this folder to GitHub and import it in Vercel (framework is detected as Vite automatically), or run `npx vercel`.

## Admin
Open `#/admin` (PIN **1234**, can be changed in Settings). You can edit the agenda, teams, scenes, cards, scoring rules and live scores there.
Edits are saved in the browser. Use *Settings & Data → Download backup* to move them to another laptop.
To change the built-in defaults for everyone, edit `src/lib/defaults.js`, `scenes.js` and `cards.js`.

## Pictures
See `public/images/README.md`.
