import React, { useMemo } from 'react';
import {
  FileText,
  Plus,
  Trash2,
  Edit3,
  Upload,
  CheckCircle2,
  Clock,
  AlertCircle,
  Users,
  Zap
} from 'lucide-react';
import { motion } from 'framer-motion';

const ActivityTab = ({ assignment }) => {
  // Generate activity log from all events
  const activities = useMemo(() => {
    const events = [];

    // Assignment created
    if (assignment.createdAt) {
      events.push({
        id: 'created',
        type: 'assignment_created',
        detail: 'Assignment created',
        timestamp: assignment.createdAt,
        icon: Plus
      });
    }

    // Submissions
    if (assignment.submissions && assignment.submissions.length > 0) {
      assignment.submissions.forEach(sub => {
        events.push({
          id: sub.id,
          type: 'submission',
          detail: `${sub.status === 'Submitted' ? 'Final' : 'Draft'} submission: ${sub.fileName}`,
          timestamp: sub.submittedAt,
          icon: Upload
        });
      });
    }

    // Tasks
    if (assignment.tasks && assignment.tasks.length > 0) {
      assignment.tasks.forEach(task => {
        events.push({
          id: `task-${task.id}`,
          type: 'task_created',
          detail: `Task created: ${task.title}`,
          timestamp: task.createdAt,
          icon: CheckCircle2
        });

        if (task.status === 'done') {
          events.push({
            id: `task-done-${task.id}`,
            type: 'task_completed',
            detail: `Task completed: ${task.title}`,
            timestamp: task.createdAt,
            icon: CheckCircle2
          });
        }
      });
    }

    // Notes
    if (assignment.notes && assignment.notes.length > 0) {
      assignment.notes.forEach(note => {
        events.push({
          id: `note-${note.id}`,
          type: 'note_created',
          detail: `Note added: ${note.title}`,
          timestamp: note.createdAt,
          icon: FileText
        });
      });
    }

    // Resources
    if (assignment.resources && assignment.resources.length > 0) {
      assignment.resources.forEach(resource => {
        events.push({
          id: `resource-${resource.id}`,
          type: 'resource_added',
          detail: `Resource added: ${resource.title}`,
          timestamp: resource.createdAt,
          icon: Zap
        });
      });
    }

    // Sort by timestamp descending (newest first)
    return events.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }, [assignment]);

  const getActivityColor = (type) => {
    const colors = {
      'assignment_created': 'from-blue-400 to-blue-600',
      'submission': 'from-green-400 to-green-600',
      'task_created': 'from-purple-400 to-purple-600',
      'task_completed': 'from-green-400 to-green-600',
      'note_created': 'from-yellow-400 to-yellow-600',
      'resource_added': 'from-cyan-400 to-cyan-600'
    };
    return colors[type] || colors.assignment_created;
  };

  const getActivityIcon = (type) => {
    const icons = {
      'assignment_created': Plus,
      'submission': Upload,
      'task_created': CheckCircle2,
      'task_completed': CheckCircle2,
      'note_created': FileText,
      'resource_added': Zap
    };
    return icons[type] || Plus;
  };

  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const date = new Date(timestamp);
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <motion.div className="space-y-8">
      {activities.length > 0 ? (
        <div className="relative">
          {/* Timeline */}
          <div className="space-y-0">
            {activities.map((activity, idx) => {
              const ActivityIcon = getActivityIcon(activity.type);
              const gradient = getActivityColor(activity.type);

              return (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="relative flex gap-6 pb-8"
                >
                  {/* Vertical Line */}
                  {idx < activities.length - 1 && (
                    <div className="absolute left-8 top-20 bottom-0 w-0.5 bg-gradient-to-b from-slate-200 to-transparent dark:from-slate-700"></div>
                  )}

                  {/* Icon Circle */}
                  <div className={`relative mt-1 flex-shrink-0 w-16 h-16 rounded-full bg-gradient-to-br ${gradient} p-1 shadow-lg flex items-center justify-center`}>
                    <div className="w-14 h-14 rounded-full bg-white dark:bg-slate-900 flex items-center justify-center">
                      <ActivityIcon size={24} className="text-slate-700 dark:text-slate-200" />
                    </div>
                  </div>

                  {/* Content Card */}
                  <div className="flex-1 pt-2">
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-100 dark:border-slate-800 hover:shadow-lg transition-all"
                    >
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <h3 className="font-black text-slate-800 dark:text-white text-base flex-1">
                          {activity.detail}
                        </h3>
                        <span className="text-xs font-bold text-slate-500 whitespace-nowrap">
                          {getTimeAgo(activity.timestamp)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {new Date(activity.timestamp).toLocaleDateString('en-US', {
                          weekday: 'long',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </motion.div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="py-16 text-center bg-slate-50 dark:bg-slate-900/50 rounded-[2rem] border border-dashed border-slate-200 dark:border-slate-700"
        >
          <Clock size={48} className="mx-auto mb-4 text-slate-300" />
          <p className="text-slate-500 font-bold">No activity yet</p>
          <p className="text-sm text-slate-400 mt-1">Activity will appear as you work on this assignment</p>
        </motion.div>
      )}

      {/* Activity Summary Stats */}
      {activities.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-blue-50 dark:bg-blue-500/10 rounded-xl p-4 border border-blue-100 dark:border-blue-500/20"
          >
            <p className="text-[9px] font-black uppercase tracking-widest text-blue-700 dark:text-blue-400 mb-2">
              Total Events
            </p>
            <p className="text-2xl font-black text-blue-600 dark:text-blue-300">{activities.length}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-green-50 dark:bg-green-500/10 rounded-xl p-4 border border-green-100 dark:border-green-500/20"
          >
            <p className="text-[9px] font-black uppercase tracking-widest text-green-700 dark:text-green-400 mb-2">
              Submissions
            </p>
            <p className="text-2xl font-black text-green-600 dark:text-green-300">
              {assignment.submissions?.length || 0}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-purple-50 dark:bg-purple-500/10 rounded-xl p-4 border border-purple-100 dark:border-purple-500/20"
          >
            <p className="text-[9px] font-black uppercase tracking-widest text-purple-700 dark:text-purple-400 mb-2">
              Tasks
            </p>
            <p className="text-2xl font-black text-purple-600 dark:text-purple-300">
              {assignment.tasks?.length || 0}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-yellow-50 dark:bg-yellow-500/10 rounded-xl p-4 border border-yellow-100 dark:border-yellow-500/20"
          >
            <p className="text-[9px] font-black uppercase tracking-widest text-yellow-700 dark:text-yellow-400 mb-2">
              Notes & Resources
            </p>
            <p className="text-2xl font-black text-yellow-600 dark:text-yellow-300">
              {(assignment.notes?.length || 0) + (assignment.resources?.length || 0)}
            </p>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default ActivityTab;
