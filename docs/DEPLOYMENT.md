# Deployment

This document lists common deployment steps for StudyOS (Firebase Hosting, Firebase Functions).

> Note: Exact commands may vary depending on the Firebase project configuration in `firebase.json`.

## Prerequisites

- Firebase CLI installed
- Firebase project created
- Authenticated Firebase CLI user

```bash
npm i -g firebase-tools
firebase login
firebase use --add <your-project-id>
```

## Firebase Hosting

```bash
firebase deploy --only hosting
```

If you use Vite, ensure the build output is configured correctly in `firebase.json`.

## Cloud Functions

If functions exist in `functions/`:

```bash
firebase deploy --only functions
```

## Firestore Rules

Rules/config updates are deployed automatically when you deploy rules.

```bash
firebase deploy --only firestore:rules
firebase deploy --only storage:rules
```

## Firestore Indexes

If indexes are updated via `firestore.indexes.json`:

```bash
firebase deploy --only firestore:indexes
```

## Recommended workflow

1. Update code
2. Run tests/build locally
3. Deploy hosting + functions (as needed)
4. Deploy rules/indexes only when changes occur

## Troubleshooting

- Hosting not reflecting changes: verify the configured build directory and run `firebase deploy --only hosting` again.
- Functions failing: check `functions/package.json` engines/deps and inspect logs:

```bash
firebase functions:log
```

