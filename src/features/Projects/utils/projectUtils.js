/**
 * Project Utilities - Helper functions for project operations
 * Location: src/features/Projects/utils/projectUtils.js
 */

/**
 * Calculate project stats from tasks
 */
export const calculateProjectStats = (project) => {
  if (!project || !project.board) {
    return {
      totalTasks: 0,
      completedTasks: 0,
      inProgressTasks: 0,
      pendingTasks: 0,
      progressPercentage: 0
    };
  }

  const todo = project.board.todo?.length || 0;
  const doing = project.board.doing?.length || 0;
  const done = project.board.done?.length || 0;
  const totalTasks = todo + doing + done;

  return {
    totalTasks,
    completedTasks: done,
    inProgressTasks: doing,
    pendingTasks: todo,
    progressPercentage: totalTasks > 0 ? Math.round((done / totalTasks) * 100) : 0
  };
};

/**
 * Get remaining days until deadline
 */
export const getDaysUntilDeadline = (deadline) => {
  if (!deadline) return null;
  const deadlineDate = new Date(deadline);
  const today = new Date();
  const diffTime = deadlineDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

/**
 * Get deadline status with color
 */
export const getDeadlineStatus = (deadline) => {
  const daysLeft = getDaysUntilDeadline(deadline);
  
  if (daysLeft === null) return { status: 'No Deadline', color: 'text-slate-400', bgColor: 'bg-slate-100' };
  if (daysLeft < 0) return { status: 'Overdue', color: 'text-red-600', bgColor: 'bg-red-100' };
  if (daysLeft === 0) return { status: 'Due Today', color: 'text-orange-600', bgColor: 'bg-orange-100' };
  if (daysLeft === 1) return { status: '1 Day Left', color: 'text-orange-600', bgColor: 'bg-orange-100' };
  if (daysLeft <= 7) return { status: `${daysLeft} Days Left`, color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
  return { status: `${daysLeft} Days Left`, color: 'text-green-600', bgColor: 'bg-green-100' };
};

/**
 * Calculate total file storage in MB
 */
export const calculateStorageUsage = (files) => {
  if (!files || files.length === 0) return 0;
  const totalBytes = files.reduce((acc, file) => acc + (file.size || 0), 0);
  return (totalBytes / (1024 * 1024)).toFixed(2);
};

/**
 * Format file size to human readable format
 */
export const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Get color for status
 */
export const getStatusColor = (status) => {
  const colors = {
    'Ongoing': 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400',
    'Submitted': 'bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400',
    'Completed': 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400',
    'Archived': 'bg-slate-100 text-slate-700 dark:bg-slate-500/10 dark:text-slate-400'
  };
  return colors[status] || colors['Ongoing'];
};

/**
 * Get color for priority
 */
export const getPriorityColor = (priority) => {
  const colors = {
    'High': 'text-red-600 bg-red-100 dark:bg-red-500/10 dark:text-red-400',
    'Medium': 'text-amber-600 bg-amber-100 dark:bg-amber-500/10 dark:text-amber-400',
    'Low': 'text-blue-600 bg-blue-100 dark:bg-blue-500/10 dark:text-blue-400'
  };
  return colors[priority] || colors['Medium'];
};

/**
 * Get status color for bug/issue
 */
export const getBugStatusColor = (status) => {
  const colors = {
    'Open': 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400',
    'In Progress': 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400',
    'Fixed': 'bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400',
    'Closed': 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400'
  };
  return colors[status] || colors['Open'];
};

/**
 * Get severity color for bug
 */
export const getSeverityColor = (severity) => {
  const colors = {
    'Critical': 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400',
    'High': 'bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400',
    'Medium': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400',
    'Low': 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400'
  };
  return colors[severity] || colors['Medium'];
};

/**
 * Get relative time string (e.g., "2 hours ago")
 */
export const getTimeAgo = (date) => {
  if (!date) return 'Unknown';
  
  const now = new Date();
  const givenDate = new Date(date);
  const seconds = Math.floor((now - givenDate) / 1000);

  if (seconds < 60) return 'just now';
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  
  const years = Math.floor(months / 12);
  return `${years}y ago`;
};

/**
 * Format date to readable string
 */
export const formatDate = (date) => {
  if (!date) return 'No date';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

/**
 * Format date with time
 */
export const formatDateTime = (date) => {
  if (!date) return 'No date';
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Validate GitHub URL
 */
export const isValidGitHubUrl = (url) => {
  return url && url.includes('github.com') && url.includes('/');
};

/**
 * Extract owner and repo from GitHub URL
 */
export const parseGitHubUrl = (url) => {
  if (!isValidGitHubUrl(url)) return null;
  const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
  if (!match) return null;
  return { owner: match[1], repo: match[2].replace('.git', '') };
};

/**
 * Group array by property
 */
export const groupBy = (array, property) => {
  return array.reduce((acc, obj) => {
    const key = obj[property];
    if (!acc[key]) acc[key] = [];
    acc[key].push(obj);
    return acc;
  }, {});
};

/**
 * Sort projects by date
 */
export const sortProjectsByDate = (projects, order = 'desc') => {
  return [...projects].sort((a, b) => {
    const dateA = new Date(a.createdAt || 0);
    const dateB = new Date(b.createdAt || 0);
    return order === 'desc' ? dateB - dateA : dateA - dateB;
  });
};

/**
 * Filter projects by status
 */
export const filterProjectsByStatus = (projects, status) => {
  if (status === 'All') return projects;
  return projects.filter(p => p.status === status);
};

/**
 * Search projects
 */
export const searchProjects = (projects, query) => {
  if (!query) return projects;
  const lowerQuery = query.toLowerCase();
  return projects.filter(p =>
    p.name.toLowerCase().includes(lowerQuery) ||
    p.subject?.toLowerCase().includes(lowerQuery) ||
    p.stack?.toLowerCase().includes(lowerQuery) ||
    p.description?.toLowerCase().includes(lowerQuery)
  );
};

/**
 * Export project as JSON
 */
export const exportProjectAsJSON = (project) => {
  const dataStr = JSON.stringify(project, null, 2);
  const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
  
  const exportFileDefaultName = `${project.name}_${new Date().toISOString().split('T')[0]}.json`;
  
  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', exportFileDefaultName);
  linkElement.click();
};

/**
 * Check if project is almost due
 */
export const isProjectAlmostDue = (deadline, daysThreshold = 3) => {
  const daysLeft = getDaysUntilDeadline(deadline);
  return daysLeft !== null && daysLeft >= 0 && daysLeft <= daysThreshold;
};

/**
 * Check if project is overdue
 */
export const isProjectOverdue = (deadline) => {
  const daysLeft = getDaysUntilDeadline(deadline);
  return daysLeft !== null && daysLeft < 0;
};
