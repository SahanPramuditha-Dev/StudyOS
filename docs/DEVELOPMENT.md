# Development

This document describes how to run and work on StudyOS locally.

## Prerequisites

- Node.js (LTS recommended)
- npm
- Firebase credentials (service account or local auth) as required by your setup

## Project overview

StudyOS appears to include:
- A Vite/React frontend (`src/`)
- Firebase/Firestore usage (see `src/services/` and `firestore.rules`)
- Cloud Functions (`functions/`)
- A server folder (`server/`) if used for any backend tasks

## Install dependencies

At the repo root:

```bash
npm install
```

If the project uses functions/server with separate package manifests, install those too:

```bash
cd functions
npm install

cd ../server
npm install

cd ..
```

## Environment variables

Check the repo for environment variable usage:

- Look for `import.meta.env` / `process.env` usage in `src/` and `functions/`
- Check `.env` / `.env.example` files if present

If no `.env.example` exists, create one based on required variables by searching for `process.env` and `import.meta.env`.

## Run locally (frontend)

```bash
npm run dev
```

Then open the local URL printed by the command.

## Run tests (if available)

```bash
npm test
```

or for Vitest specifically:

```bash
npm run vitest
```

Use the available scripts from `package.json`.

## Lint / formatting

Common scripts (verify in `package.json`):

```bash
npm run lint
```

## Useful tips

- Keep an eye on browser console/network logs for auth + Firestore issues.
- When changing Firestore rules or indexes, validate updates in Firebase.

