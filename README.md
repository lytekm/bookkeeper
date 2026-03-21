# Bookkeeping CSV Prototype

Frontend-only Next.js prototype for ingesting a bank statement CSV, mapping columns, and reviewing journal-ready transactions.

## Features
- Upload a CSV bank statement and preview rows
- Auto-detect and manually map columns
- Normalize transactions and compute running balance
- Assign opposite-side accounts from a hardcoded chart of accounts
- Journal entry preview using Business Checking as the bank account
- Summary analytics: totals in/out, ending balance, totals by account
- Keyword-based account suggestions
- Persist demo state in localStorage with reset

## Quick start
```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Demo data
Use the "Load demo data" button or upload `public/demo-bank-statement.csv`.

## Project structure
- `src/app/page.tsx` main UI
- `src/components/` reusable UI components
- `src/lib/` CSV parsing, mapping, accounting, suggestions, storage
- `public/demo-bank-statement.csv` sample statement

## Deploy
This is ready for Vercel. Push the repo and deploy with the default Next.js settings.
