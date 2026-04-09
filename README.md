# StudyOS 🧠

[![npm](https://img.shields.io/npm/v/studyos?color=orange)](https://www.npmjs.com/package/studyos)
[![Vite](https://img.shields.io/badge/vite-%23000000.svg?style=for-the-badge&logo=vite&logoColor=%2361DAEF)](https://vitejs.dev)
[![Firebase](https://img.shields.io/badge/Firebase-039383?style=for-the-badge&logo=Firebase&logoColor=white)](https://firebase.google.com)
[![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338BDF8.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)](https://reactjs.org)

**StudyOS** is a comprehensive, modern study workspace for students and developers. Manage courses, assignments, projects, notes, reminders, analytics, and more with seamless GitHub/Google Calendar integrations and role-based access. Built for productivity with real-time collaboration and advanced tools.

## ✨ Features

| Feature | Description |
|---------|-------------|
| **📚 Courses & Assignments** | Create/track assignments with progress trackers, resources, notes, task breakdowns, submissions, activity logs. |
| **🚀 Projects Hub** | Full project lifecycle: Task manager, bug tracker, code snippets, docs editor, GitHub sync, file manager, submission tracking, notes. |
| **📝 Smart Notes** | Rich editor, search, previews, lists with toolbar for organized study notes. |
| **⏰ Reminders & Planner** | Calendar views, event modals, Google Calendar sync, weekly planner. |
| **📊 Analytics** | Learning charts, heatmaps, stats cards for performance insights. |
| **💻 Workspace** | Multi-panel workspace with project selectors, code/docs/files/tasks/submissions views. |
| **🔍 Search & Admin** | Global search, admin dashboard, bulk actions, role-based access (Firestore rules). |
| **🎯 Integrations** | GitHub repos, Google Calendar, Firebase email/notifications, offline support. |
| **More** | Resources/videos/papers/review, error boundaries, themes, Google Auth. |

## 🖼️ Screenshots

![Dashboard](src/assets/hero.png)
![Projects](public/logo.svg) <!-- Replace with actual screenshots -->
![Analytics Heatmap] <!-- Add hero.png cropped etc. -->

Live Demo: [Open in Browser](http://localhost:5173) after `npm run dev`

## 🛠️ Tech Stack

```
Frontend: React 19 + Vite + Tailwind CSS + Framer Motion
Backend: Firebase (Auth/Firestore/Storage/Functions/Analytics)
Services: Google Calendar API, GitHub API, SMTP Email (Functions)
Hooks: Custom (useGoogleCalendar, useOnline, useStorage)
Testing: Vitest
Quality: ESLint + Prettier
```

## 🚀 Quick Start

```bash
git clone https://github.com/yourusername/studyos.git
cd studyos
npm install
cp .env.example .env  # Fill Firebase config
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

### Environment Setup

Copy `.env.example` to `.env.local` and add:
```
VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_AUTH_DOMAIN=yourproject.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=yourproject
VITE_FIREBASE_STORAGE_BUCKET=yourproject.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123
VITE_FIREBASE_APP_ID=your_app_id
GOOGLE_CALENDAR_API_KEY=your_gc_key
```

## 📁 Project Structure

```
StudyOS/
├── public/          # Assets (logo/favicon)
├── src/
│   ├── components/  # UI (Sidebar/Footer/Modals)
│   ├── context/     # Auth/Theme/Reminder/GoogleCalendar
│   ├── features/    # Core modules (Assignments/Projects/Notes/Reminders/Analytics/Workspace)
│   ├── hooks/       # Custom hooks
│   ├── services/    # Firebase/Email/GoogleCalendar
│   └── utils/       # Helpers
├── functions/       # Cloud Functions (email)
├── server/          # Node (if extended)
├── firebase.json    # Hosting/Functions config
└── README.md
```

Detailed: [Projects Guide](src/features/Projects/PROJECTS_GUIDE.md), [Projects Summary](PROJECTS_FEATURE_SUMMARY.md)

## 🔍 Quality & Build

```bash
npm run lint      # ESLint
npm run build     # Production build
npm run preview   # Local prod server
npm run test      # Vitest
```

## ☁️ Deployment (Firebase)

1. `npm run build`
2. `firebase deploy --only hosting`
3. Deploy Functions: `firebase deploy --only functions`
4. Update Firestore rules: `firebase deploy --only firestore:rules`
5. Config Auth providers/domains in Firebase Console.

See [firebase.json](firebase.json), [firestore.rules](firestore.rules).

**Production Notes**:
- Role-based access via Firestore rules (no hardcoded emails).
- Email via Functions `sendEmail` (SMTP secrets).
- Profile/account ops via shared services.

## 🤝 Contributing

1. Fork & clone.
2. Create feature branch `feat/your-feature`.
3. Commit: `git commit -m 'feat: add X'`.
4. PR to `main` with tests.

Issues: [Create New](https://github.com/yourusername/studyos/issues/new)  
Code of Conduct: Standard.

## 📄 License

MIT License - see [LICENSE](LICENSE) (add if missing).

## 🚀 Roadmap

- [ ] Demo video/GIFs.
- [ ] PWA support.
- [ ] Mobile app (Capacitor).
- [ ] AI study assistant.

## 📞 Support

- 💬 Discord/Forum (TBD)
- 🐛 [Issues](https://github.com/yourusername/studyos/issues)
- 📧 Email via app contact form.

⭐ **Star on GitHub** if helpful!  
[DEVELOPER_GUIDE](src/features/Projects/DEVELOPER_GUIDE.md) for advanced setup.

---

Built with ❤️ for students worldwide.

