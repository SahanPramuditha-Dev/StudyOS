# StudyOS Projects Feature - Developer Documentation

## Architecture Overview

The Projects feature is built with a modular, scalable architecture that separates concerns across multiple components.

```
Projects System
├── Main View (Projects.jsx)
│   ├── List View: Display all projects
│   └── Detail View: ProjectDetail.jsx
│       ├── Overview Tab
│       ├── Files Tab → FileManager.jsx
│       ├── GitHub Tab → GitHubIntegration.jsx
│       ├── Docs Tab → DocumentationEditor.jsx
│       ├── Tasks Tab → TaskManager.jsx
│       ├── Submissions Tab → SubmissionTracker.jsx
│       ├── Issues Tab → BugTracker.jsx
│       ├── Snippets Tab → CodeSnippets.jsx
│       ├── Notes Tab → NotesIdeapad.jsx
│       └── Activity Tab → ActivityLog.jsx
└── Utilities
    └── projectUtils.js (Helper functions)
```

## Data Flow

```
User Action
↓
Component Handler
↓
State Update (via onUpdate callback)
↓
Activity Logged (if applicable)
↓
Toast Notification
↓
Projects.jsx updates state
↓
Project stored in useStorage
↓
Component re-renders with new data
```

## Adding New Features

### Method 1: Add a New Tab

1. **Create new tab component:**
```javascript
// src/features/Projects/components/tabs/NewFeature.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';

const NewFeature = ({ project, onUpdate, onActivityAdd }) => {
  // Component logic here
  return (
    <div className="space-y-6">
      {/* Your feature JSX */}
    </div>
  );
};

export default NewFeature;
```

2. **Import in ProjectDetail.jsx:**
```javascript
import NewFeature from './tabs/NewFeature';
```

3. **Add to tabs array:**
```javascript
const tabs = [
  // ... existing tabs
  { id: 'newfeature', label: 'New Feature', icon: IconName }
];
```

4. **Add tab content renderer:**
```javascript
{activeTab === 'newfeature' && <NewFeature project={project} onUpdate={onUpdate} onActivityAdd={handleAddActivity} />}
```

### Method 2: Extend Activity Logging

Add new activity type to `ActivityLog.jsx`:

```javascript
const getActivityIcon = (type) => {
  const icons = {
    // ... existing types
    'your_new_type': { 
      icon: YourIcon, 
      color: 'text-your-color-500', 
      bg: 'bg-your-color-100 dark:bg-your-color-500/10' 
    }
  };
  return icons[type] || defaultIcon;
};

const getActivityLabel = (type) => {
  const labels = {
    // ... existing labels
    'your_new_type': '🎉 Your Activity Label'
  };
  return labels[type] || 'Activity';
};
```

### Method 3: Add Utility Function

Add helpers to `projectUtils.js`:

```javascript
export const yourNewFunction = (data) => {
  // Your logic
  return result;
};
```

## Component Props

### ProjectDetail.jsx
```javascript
{
  project: {
    id: string,
    name: string,
    // ... all project fields
  },
  onBack: () => void,
  onUpdate: (updatedProject) => void
}
```

### Tab Components
```javascript
{
  project: ProjectObject,
  onUpdate: (updatedProject) => void,
  onActivityAdd: (type: string, detail: string) => void
}
```

## State Management Pattern

### In Tab Components
```javascript
// Get initial state from project
const [items, setItems] = useState(project.items || []);

// Update local state
setItems(newItems);

// Update parent and persist
onUpdate({ ...project, items: newItems });

// Log activity
onActivityAdd('item_created', `Created: ${item.name}`);
```

### Activity Logging
Always log important user actions:
```javascript
onActivityAdd('action_type', 'Human-readable description');
```

Predefined types:
- `file_upload` - File uploaded
- `doc_created` - Documentation created
- `doc_updated` - Documentation updated
- `doc_deleted` - Documentation deleted
- `task_created` - Task created
- `submission_uploaded` - Submission uploaded
- `bug_created` - Bug reported
- `bug_status_changed` - Bug status changed
- `note_created` - Note created
- `note_updated` - Note updated
- `access_changed` - Access level changed
- `snippet_created` - Code snippet saved

## Storage Keys

Project data stored in browser storage:
```javascript
STORAGE_KEYS.PROJECTS // All projects array
// Each project has access control stored at: project_access_${projectId}
```

## Styling Conventions

### Colors
- Primary actions: `bg-primary-500 text-white`
- Success: `bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400`
- Warning: `bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400`
- Danger: `bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400`
- Info: `bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400`

### Spacing
- Container: `max-w-7xl mx-auto pb-12`
- Section gaps: `space-y-8`
- Item gaps: `gap-6`
- Padding: `p-6`
- Rounded: `rounded-2xl` (containers), `rounded-xl` (items), `rounded-lg` (inputs)

## Icon Usage

Import from lucide-react:
```javascript
import { Plus, Edit3, Trash2, Download, Check } from 'lucide-react';

// Use in JSX
<Plus size={20} className="your-classes" />
```

## Animation Patterns

Using Framer Motion:
```javascript
// Container animation
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -10 }}
  transition={{ duration: 0.3 }}
>

// List item animation with stagger
<AnimatePresence mode="popLayout">
  {items.map((item, idx) => (
    <motion.div
      key={item.id}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: idx * 0.05 }}
    >
      {item.content}
    </motion.div>
  ))}
</AnimatePresence>
```

## Form Handling

Standard form pattern:
```javascript
const [formData, setFormData] = useState({
  title: '',
  description: '',
  dueDate: ''
});

const handleSubmit = (e) => {
  e.preventDefault();
  
  if (!formData.title.trim()) {
    toast.error('Title is required');
    return;
  }

  const newItem = {
    id: nanoid(),
    ...formData,
    createdAt: new Date().toISOString()
  };

  updateProject({ ...project, items: [newItem, ...project.items] });
  onActivityAdd('item_created', `Created: ${formData.title}`);
  toast.success('Item created');

  setFormData({ title: '', description: '', dueDate: '' });
};
```

## Error Handling

Pattern for error handling:
```javascript
try {
  // Operation
  const result = validateData(data);
  setData(result);
  toast.success('Success message');
} catch (error) {
  console.error('Context:', error);
  toast.error(error.message || 'Something went wrong');
}
```

## Performance Optimization

### useMemo for filtering
```javascript
const filteredItems = useMemo(() => {
  return items.filter(item => 
    item.title.includes(searchQuery) && 
    (status === 'All' || item.status === status)
  );
}, [items, searchQuery, status]);
```

### Lazy loading images
```javascript
import { lazy, Suspense } from 'react';

const HeavyComponent = lazy(() => import('./HeavyComponent'));

<Suspense fallback={<Loading />}>
  <HeavyComponent />
</Suspense>
```

## Firebase Integration (When Ready)

### File Storage
```javascript
import { storage } from '../services/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const uploadFile = async (file, projectId) => {
  const fileRef = ref(storage, `projects/${projectId}/${file.name}`);
  await uploadBytes(fileRef, file);
  const url = await getDownloadURL(fileRef);
  return url;
};
```

### Cloudy Messages
```javascript
import { messaging } from '../services/firebase';
import { getToken } from 'firebase/messaging';

const notifyUsers = async (message) => {
  const token = await getToken(messaging);
  // Send to backend for broadcast
};
```

## Testing

### Test File Structure
```javascript
// __tests__/ProjectDetail.test.jsx
import { render, screen } from '@testing-library/react';
import ProjectDetail from '../ProjectDetail';

describe('ProjectDetail', () => {
  it('should render project name', () => {
    const project = { id: '1', name: 'Test Project' };
    render(<ProjectDetail project={project} onBack={() => {}} onUpdate={() => {}} />);
    expect(screen.getByText('Test Project')).toBeInTheDocument();
  });
});
```

## Dark Mode Support

Ensure all components use:
- `dark:` prefix for dark mode styles
- `dark:bg-slate-900` for backgrounds
- `dark:text-white` for text
- `dark:border-slate-800` for borders

Example:
```javascript
<div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-100 dark:border-slate-800">
  <h2 className="text-slate-900 dark:text-white">Title</h2>
</div>
```

## Accessibility (a11y)

Important practices:
```javascript
// Use semantic HTML
<button onClick={handleClick} title="Click to perform action">
  <Icon size={20} />
  Action
</button>

// Proper img alt text
<img src="path" alt="Descriptive text" />

// Use labels
<label htmlFor="input-id">Label Text</label>
<input id="input-id" type="text" />

// Use aria attributes when needed
<div role="progressbar" aria-valuenow={50} aria-valuemin={0} aria-valuemax={100} />
```

## Debugging

### Console Logging
```javascript
console.log('Context:', { project, action, error });
```

### React DevTools
- Use React DevTools Chrome extension to inspect component tree
- Check state changes in real-time
- Profile component render performance

### Storage Debugging
```javascript
// Check localStorage
Object.keys(localStorage)
localStorage.getItem('PROJECTS')
```

## Common Patterns

### Confirmation Dialog
```javascript
const handleDelete = () => {
  setConfirmConfig({
    isOpen: true,
    message: 'Are you sure?',
    onConfirm: () => {
      performDelete();
      toast.success('Deleted');
    }
  });
};
```

### Loading States
```javascript
const [isLoading, setIsLoading] = useState(false);

const handleAsync = async () => {
  setIsLoading(true);
  try {
    const result = await asyncOperation();
    setData(result);
    toast.success('Done');
  } finally {
    setIsLoading(false);
  }
};
```

### Empty States
```javascript
{items.length === 0 ? (
  <motion.div className="py-12 text-center">
    <Icon size={48} className="mx-auto text-slate-300 mb-4" />
    <p className="text-slate-500 font-bold mb-2">No items found</p>
    <p className="text-sm text-slate-400">Create one to get started</p>
  </motion.div>
) : (
  // Items list
)}
```

## Future Enhancements

### High Priority
- [ ] Firebase cloud storage integration
- [ ] Real-time collaboration
- [ ] Email notifications
- [ ] PDF export for submissions

### Medium Priority
- [ ] Offline mode support
- [ ] Advanced analytics
- [ ] Custom categories
- [ ] Shortcuts/favorites

### Low Priority
- [ ] AI suggestions
- [ ] Image OCR for notes
- [ ] Voice notes
- [ ] VR collaboration space

---

**Happy Coding!** 🚀

For questions or contributions, please refer to the main README or contact the development team.
