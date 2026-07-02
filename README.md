# Field Notes — Memory Match

A responsive memory card matching game built with React + Vite. Flip specimen
cards, find every pair, and try to beat your best time.

## Features

- 4×4 grid (8 pairs) by default, with **Easy** (6 pairs) and **Hard** (12 pairs) modes
- Cards shuffle randomly every new game
- Reveal 2 cards at a time; non-matches flip back automatically
- Move counter + live timer
- "Collection Complete" win screen with final time and moves
- Best score tracked per difficulty in `localStorage`
- Smooth 3D flip animation, respects `prefers-reduced-motion`
- Fully responsive, keyboard accessible (Tab + Enter/Space to flip cards)

## Run locally

```bash
npm install
npm run dev
```

## Build for production

```bash
npm run build
npm run preview
```

## Deploy to Vercel

1. Push this project to a new GitHub repository.
2. Go to [vercel.com](https://vercel.com) → **Add New Project** → import the repo.
3. Framework preset: **Vite**. Build command `npm run build`, output directory `dist`
   (Vercel auto-detects these).
4. Click **Deploy**. Vercel will give you a live URL.

Alternatively, from the CLI:

```bash
npm install -g vercel
vercel
```

## Tech

- React 18 (functional components + hooks: `useState`, `useEffect`, `useRef`, `useCallback`)
- Vite
- Plain CSS (no framework) — custom "field notebook" design system
