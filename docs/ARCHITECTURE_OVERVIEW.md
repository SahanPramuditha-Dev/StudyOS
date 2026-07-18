# Architecture Overview

This document provides a high-level view of how StudyOS is structured.

## Frontend (React)

Main entry points:
- `src/main.jsx`
- `src/App.jsx`

Key directories:
- `src/features/`: feature modules (e.g. Dashboard, Notes, Courses, Reminders, etc.)
- `src/components/`: shared UI components (e.g. modals, page header, sidebar, footer)
- `src/context/`: React context providers (Auth, Theme, Reminders, Google Calendar)
- `src/services/`: integration logic (Firebase, Firestore, Google Calendar, Storage)
- `src/hooks/`: reusable hooks (online status, Google Calendar, storage)
- `src/utils/`: shared utilities (date helpers, notification builders, entity ops)

## Data layer

StudyOS uses Firebase:
- `src/services/firestore.js`
- `src/services/firebase.js`
- `src/services/firebaseStorage.js`

Security is enforced by:
- `firestore.rules`
- `storage.rules`

Indexes (if needed):
- `firestore.indexes.json`

## Authentication

Auth is managed by an `AuthContext`:
- `src/context/AuthContext.jsx`

Cloud-side provider setup is referenced by repo docs:
- `GITHUB_OAUTH_SETUP.md`

## Reminders / Calendar

Calendar-related code:
- `src/context/GoogleCalendarContext.jsx`
- `src/services/googleCalendar.js`
- Reminders feature under `src/features/Reminders/`

## Backend / Cloud Functions

If deployed, functions are under:
- `functions/`
- `functions/index.js`

## Styling / UI system

Styling is driven by:
- `tailwind.config.js`
- `src/index.css` and `src/App.css`

Material UI (if used) is wrapped by:
- `src/theme/MuiDesignSystemProvider.jsx`
- `src/theme/muiTheme.js`

UI guidelines:
- `docs/UI_SYSTEM_GUIDELINES.md`

## Directory map (quick)

- `src/features/*`: user-facing feature areas
- `src/components/*`: reusable components
- `src/context/*`: shared state providers
- `src/services/*`: external integration layer
- `src/utils/*`: cross-feature helpers

## How to understand changes

When making a change:
1. Identify the feature entry in `src/features/*`.
2. Trace data flow to `src/services/*` and corresponding contexts.
3. If rules/indexes are impacted, update `firestore.rules`, `storage.rules`, or `firestore.indexes.json`.

