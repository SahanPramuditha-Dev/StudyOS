# Changelog

All notable changes to StudyOS will be documented in this file.  
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [1.2.0] — 2026-07-25

### Added
- **Dynamic YouTube API Integration**
  - `youtubeChapterFetcher.js` — parses real video chapter timestamps from YouTube descriptions via `videos?part=snippet`.
  - `youtubeCommentsFetcher.js` — fetches top YouTube comments with profile avatars, upvote counts, and relative dates.
  - `youtubeRelatedFetcher.js` — fetches topic-related YouTube video lectures.
- **Bookmark CRUD Workspace** in Video Tracker
  - `+ Bookmark Now` shortcut to mark current playback position.
  - Inline timestamp editing (`HH:MM:SS`), note/title editing, direct seek-play, and trash deletion.
- **Rich Formatted Notes Workspace**
  - Default rendered HTML preview converting Markdown (`###`, `**bold**`, `* lists`) into styled React elements.
  - `Edit Raw Notes` toggle for markdown editing with a rich text toolbar (Bold, Italic, Code, Lists, AI Summary).
- **Quiz LaTeX & Bold Rendering**
  - Active recall quiz items now render inline LaTeX math (`$f(n)$`) and bold text (`**Search Algorithms**`).
- **Dedicated Table of Contents Tab (CONTENTS)**
  - Displays subchapter timestamp trees with jump-to-play indicators.
- **Glassmorphic Learning Dock**
  - Exact timestamp ratio progress gauge, `Next Up` section preview, last-watched time, 7-day streak indicator, and multi-stop gradient play button.
- **Video Tracker Action Buttons**
  - Per-video quick-action buttons for tracking watch status and progress.

### Removed
- Removed 35 MB temporary log `build-errors.txt` and unused root image artifacts.
- Removed unused header controls (Banner Mode toggle, Dark Mode pill toggle, `...` menu button).

---

## [1.1.0] — 2026-07-24

### Added
- **Projects Hub** — Full project lifecycle management with kanban task board, bug tracker, code snippets library, file manager, GitHub repo sync, SRS documentation editor, and submission version tracker.
- **Review Hub** — Consolidated review flows for academic content.
- **Tasks page** — Global standalone task management view.
- **Storage Architecture** — Unified Firebase Storage service with quota tracking and upload management.
- **Admin Panel** — Role-based access control portal for managing users and system settings.
- **Settings page redesign** — New tabbed settings interface for profile, appearance, notifications, and integrations.

### Changed
- Upgraded to React 19 and latest Firebase SDK.
- Migrated routing to React Router v7.

---

## [1.0.0] — 2026-07-01

### Added
- Initial release of StudyOS.
- Firebase Auth (Google OAuth & email/password), Firestore, Storage, Hosting, Cloud Functions.
- Dashboard, Courses, Assignments, Notes, Resources, Papers, Planner, Timer, Goals, Budget, Analytics, Grades, Chat, and Orion AI companion.
- Google Calendar integration and PostHog analytics.
