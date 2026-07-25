# Changelog

All notable changes to StudyOS will be documented in this file.

## [1.2.0] - 2026-07-25

### Added
- **Dynamic YouTube API Integration**:
  - Integrated `youtubeChapterFetcher.js` querying YouTube API (`videos?part=snippet`) to parse real video chapter timestamps directly from YouTube descriptions.
  - Integrated `youtubeCommentsFetcher.js` fetching real top YouTube comments, profile avatars, upvotes, and relative published dates.
  - Integrated `youtubeRelatedFetcher.js` fetching topic-related YouTube video lectures.
- **Full Bookmark CRUD Management Workspace**:
  - Added `+ Bookmark Now` shortcut button to mark current playback position.
  - Added inline timestamp editing (`HH:MM:SS`), bookmark note/title editing, direct seek play, and delete bookmark controls (`Trash2`).
- **Rich Formatted Notes Workspace**:
  - Added rendered HTML preview mode converting raw markdown (`###`, `**bold**`, `* lists`) into rich styled React elements by default.
  - Added **`Edit Raw Notes`** toggle mode for markdown editing with rich text toolbar controls (`Bold`, `Italic`, `Code`, `Lists`, `AI Summary`).
- **Quiz LaTeX Math & Bold Rendering**:
  - Formatted active recall quiz items with inline LaTeX math rendering (`$f(n)$`) and bold text (`**Search Algorithms**`).
- **Dedicated Table of Contents Tab**:
  - Created a dedicated `CONTENTS` top navigation tab displaying subchapter timestamp trees and play jump indicators.
- **Glassmorphic Learning Dock**:
  - Upgraded bottom dock with exact timestamp ratio calculation, dynamic `Next Up` section preview, last watched time, 7-day streak indicator, and multi-stop gradient play button.

### Removed
- Removed 35MB temporary log `build-errors.txt` and unused root image artifacts.
- Removed unused header controls (`Banner Mode`, `Dark Mode` pill toggle, `...` menu button).
