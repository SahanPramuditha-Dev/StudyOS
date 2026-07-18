# Security

This document describes the key security model used in StudyOS.

## Authentication model

Frontend code uses Firebase Auth (see `src/context/AuthContext.jsx`). All sensitive data access should be gated by security rules.

## Firestore security rules

- Location: `firestore.rules`
- Storage: `storage.rules`

Rules should enforce:
- Users can only read/write documents they own (usually via `request.auth.uid`).
- No client can bypass authorization by changing IDs in requests.
- Limit exposure of private collections.

## Storage security rules

- Location: `storage.rules`

Rules should enforce:
- Only authenticated/authorized users can access user-specific paths.
- No public write access.

## Principle of least privilege

- Keep Firestore rule permissions minimal.
- Avoid broad queries that can expose other users’ data.

## Secrets

- Never commit secrets to the repo.
- If using environment variables, keep them in Firebase/CI secret stores.

## Common gotchas

- Firestore queries must be backed by rules that match the query patterns (and required indexes).
- If a query fails unexpectedly in production, verify rules and indexes.
- For file uploads, validate content type and path structure in rules.

