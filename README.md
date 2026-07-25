# StudyOS

StudyOS is a role-gated study workspace for students and developers. It combines course and assignment management, project planning, notes, video study tools, reminders, analytics, chat, budgeting, and admin controls in a single React + Firebase app.

## What It Includes

- Dashboard, global search, settings, auth, legal pages, and role-aware navigation.
- Courses, assignments, grades, and review flows for academic tracking.
- Projects and workspace tooling for docs, code snippets, files, tasks, submissions, and GitHub-linked work.
- Notes, resources, papers, and video study tools with transcript/chapter/comment helpers.
- Planner, reminders, timer, goals, budget tracking, and weekly planning.
- Analytics, learning charts, heatmaps, AI insights, chat, and admin tooling.
- Firebase-backed authentication, Firestore, Storage, Hosting, and Cloud Functions.

## Stack

- React 19 + Vite
- React Router
- Firebase Auth, Firestore, Storage, Hosting, Functions
- Tailwind CSS, MUI, Emotion
- Framer Motion
- TanStack Query
- DnD Kit
- Recharts
- React Markdown, React Player, PDF tooling, file import/export helpers
- Google OAuth, Google Calendar integration, GitHub integration, PostHog, Sentry

## Getting Started

### Prerequisites

- Node.js 18 or newer
- npm
- A Firebase project with Auth, Firestore, and Storage enabled
- Google OAuth credentials for sign-in and Calendar features
- Optional: GitHub OAuth, Stripe, PostHog, Sentry, SMTP for Functions

### Install

```bash
npm install
```

### Environment

Create a local `.env.local` file with the values your setup needs. The app currently reads these frontend variables:

```bash
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_DATABASE_URL=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=
VITE_GOOGLE_CLIENT_ID=
VITE_GITHUB_CLIENT_ID=
VITE_STRIPE_PRO_PRICE_ID=
VITE_POSTHOG_KEY=
VITE_POSTHOG_HOST=
VITE_SENTRY_DSN=
VITE_RECAPTCHA_SITE_KEY=
```

The Cloud Functions layer also uses server-side secrets such as:

```bash
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
GITHUB_CLIENT_SECRET=
FRONTEND_URL=
```

### Run Locally

```bash
npm run dev
```

Open the local Vite URL printed in the terminal.

## Scripts

```bash
npm run dev      # Start the Vite dev server
npm run build    # Production build
npm run lint     # ESLint
npm run preview  # Preview the production build locally
npm run test     # Vitest
```

## Project Layout

```text
src/
  components/    shared UI, modals, layout, error boundary, Orion companion
  context/        auth, theme, reminders, Google Calendar, Orion state
  features/       dashboard modules for courses, notes, projects, videos, chat, admin, and more
  hooks/          storage, platform, online, gamification, Google Calendar hooks
  services/       Firebase, Firestore, storage, Google Calendar, email, AI, metrics
  theme/          MUI theme and design-system provider
  utils/          helpers and export utilities
functions/        Firebase Cloud Functions
server/           optional Node scaffold
public/           hosted app assets and SPA redirects
docs/             architecture, development, deployment, testing, UI guidance
```

## Key Modules

- [src/App.jsx](src/App.jsx) wires routing, auth gating, notifications, and the app shell.
- [src/features/Dashboard/Dashboard.jsx](src/features/Dashboard/Dashboard.jsx) is the landing workspace.
- [src/features/Courses/Courses.jsx](src/features/Courses/Courses.jsx), [src/features/Assignments/Assignments.jsx](src/features/Assignments/Assignments.jsx), [src/features/Projects/Projects.jsx](src/features/Projects/Projects.jsx), and [src/features/Workspace/Workspace.jsx](src/features/Workspace/Workspace.jsx) cover the main productivity flows.
- [src/features/Notes/Notes.jsx](src/features/Notes/Notes.jsx), [src/features/Resources/Resources.jsx](src/features/Resources/Resources.jsx), [src/features/Papers/Papers.jsx](src/features/Papers/Papers.jsx), and [src/features/Videos/Videos.jsx](src/features/Videos/Videos.jsx) cover study content management.
- [src/features/Analytics/Analytics.jsx](src/features/Analytics/Analytics.jsx), [src/features/Goals/Goals.jsx](src/features/Goals/Goals.jsx), [src/features/Budget/index.jsx](src/features/Budget/index.jsx), [src/features/Planner/WeeklyPlanner.jsx](src/features/Planner/WeeklyPlanner.jsx), [src/features/Reminders/Reminders.jsx](src/features/Reminders/Reminders.jsx), [src/features/Timer/Timer.jsx](src/features/Timer/Timer.jsx), and [src/features/Grades/Grades.jsx](src/features/Grades/Grades.jsx) cover planning and progress tracking.
- [src/features/Chat/Chat.jsx](src/features/Chat/Chat.jsx), [src/features/Admin/Admin.jsx](src/features/Admin/Admin.jsx), [src/features/Search/Search.jsx](src/features/Search/Search.jsx), [src/features/Settings/Settings.jsx](src/features/Settings/Settings.jsx), and [src/features/Legal/Legal.jsx](src/features/Legal/Legal.jsx) handle collaboration, administration, and account pages.

## Firebase And Deployment

StudyOS is configured for Firebase Hosting and Firebase Functions. The relevant config and rules live in [firebase.json](firebase.json), [firestore.rules](firestore.rules), [storage.rules](storage.rules), [database.rules.json](database.rules.json), and [firestore.indexes.json](firestore.indexes.json).

To deploy the frontend and backend pieces:

```bash
firebase deploy --only hosting
firebase deploy --only functions
firebase deploy --only firestore:rules
firebase deploy --only storage:rules
firebase deploy --only firestore:indexes
```

The hosting setup uses [public/_redirects](public/_redirects) and [firebase-hosting/index.html](firebase-hosting/index.html) for SPA routing.

## Testing

Vitest is configured at the repo root. The test setup lives in [vitest.config.js](vitest.config.js) and [src/test/setup.js](src/test/setup.js).

```bash
npm run test
```

## Documentation

- [docs/ARCHITECTURE_OVERVIEW.md](docs/ARCHITECTURE_OVERVIEW.md)
- [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md)
- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)
- [docs/TESTING.md](docs/TESTING.md)
- [docs/UI_SYSTEM_GUIDELINES.md](docs/UI_SYSTEM_GUIDELINES.md)
- [GITHUB_OAUTH_SETUP.md](GITHUB_OAUTH_SETUP.md)
- [PROJECTS_FEATURE_SUMMARY.md](PROJECTS_FEATURE_SUMMARY.md)
- [src/features/Projects/PROJECTS_GUIDE.md](src/features/Projects/PROJECTS_GUIDE.md)

## Screenshots

A visual tour of StudyOS features:

| Feature | Feature | Feature |
|---------|---------|---------|
| ![Dashboard](Screenshots/Dashboard.png) | ![Courses](Screenshots/Courses.png) | ![Assignments](Screenshots/Assignments.png) |
| **Dashboard** | **Courses** | **Assignments** |
| ![Projects](Screenshots/Projects.png) | ![Workspace](Screenshots/Workspace.png) | ![Notes](Screenshots/Notes.png) |
| **Projects** | **Workspace** | **Notes** |
| ![Resources](Screenshots/Resources.png) | ![Papers](Screenshots/Papers.png) | ![Videos](Screenshots/VideoTracker.png) |
| **Resources** | **Papers** | **Videos** |
| ![Planner](Screenshots/Planner.png) | ![Reminders](Screenshots/Timer.png) | ![Goals](Screenshots/Goals.png) |
| **Planner** | **Timer** | **Goals** |
| ![Analytics](Screenshots/Analytics.png) | ![Grades](Screenshots/Grades.png) | ![Budget](Screenshots/Budget.png) |
| **Analytics** | **Grades** | **Budget** |
| ![Chat](Screenshots/Chat.png) | ![Orion](Screenshots/Orion.png) | ![Settings](Screenshots/Settings.png) |
| **Chat** | **Orion** | **Settings** |
| ![Admin Panel](Screenshots/AdminPanel.png) | ![Sign In](Screenshots/Signin.png) | ![Sign Up](Screenshots/Signup.png) |
| **Admin Panel** | **Sign In** | **Sign Up** |
| ![Calendar](Screenshots/Calender.png) | ![Review Hub](Screenshots/ReviewHub.png) | ![Tasks](Screenshots/Tasks.png) |
| **Calendar** | **Review Hub** | **Tasks** |

## Notes

- The repo includes a separate `server/` package, but the main application flow is the Vite frontend plus Firebase.
- Prettier is not part of the current toolchain; linting is handled with ESLint.
- Some integrations are optional and depend on the env vars you provide.