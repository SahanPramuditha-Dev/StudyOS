import React from 'react';
import { motion } from 'framer-motion';
import { Check, Edit, Trash2, ChevronRight, AlertCircle, Clock, CheckCircle2 } from 'lucide-react';

const AssignmentTable = ({ assignments, onEdit, onDelete, onOpen, onUpdateStatus, courses, selectedAssignmentIds, toggleSelectionId }) => {
  
  const getStatusConfig = (status) => {
    const configs = {
      'Not Started': { icon: AlertCircle, color: 'text-blue-500', bg: 'bg-blue-50' },
      'In Progress': { icon: Clock, color: 'text-yellow-500', bg: 'bg-yellow-50' },
      'Submitted': { icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-50' },
      'Late': { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50' }
    };
    return configs[status] || configs['Not Started'];
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/50 text-[10px] uppercase font-black tracking-widest text-slate-500">
              <th className="p-4 w-12 text-center"></th>
              <th className="p-4 min-w-[200px]">Title</th>
              <th className="p-4">Course</th>
              <th className="p-4">Status</th>
              <th className="p-4">Deadline</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {assignments.map(assignment => {
              const isSelected = selectedAssignmentIds.includes(assignment.id);
              const statusConfig = getStatusConfig(assignment.status);
              const StatusIcon = statusConfig.icon;
              const courseName = assignment.courseId 
                ? courses.find(c => c.id === assignment.courseId)?.title 
                : '-';

              return (
                <motion.tr 
                  key={assignment.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={`border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group ${isSelected ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                >
                  <td className="p-4 text-center">
                    <label className="cursor-pointer relative inline-block">
                      <input 
                        type="checkbox" 
                        checked={isSelected}
                        onChange={() => toggleSelectionId(assignment.id)}
                        className="peer appearance-none w-5 h-5 rounded border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 checked:bg-blue-500 checked:border-blue-500 transition-all cursor-pointer"
                      />
                      <Check size={14} strokeWidth={4} className="absolute inset-0 m-auto text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" />
                    </label>
                  </td>
                  <td className="p-4">
                    <button onClick={() => onOpen(assignment.id)} className="font-bold text-slate-800 dark:text-white hover:text-blue-500 transition-colors text-left">
                      {assignment.title}
                    </button>
                    {assignment.subject && (
                      <p className="text-xs text-slate-500 mt-1">{assignment.subject}</p>
                    )}
                  </td>
                  <td className="p-4 text-sm font-bold text-slate-600 dark:text-slate-400">
                    {courseName}
                  </td>
                  <td className="p-4">
                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest ${statusConfig.bg} dark:bg-opacity-20 ${statusConfig.color}`}>
                      <StatusIcon size={14} />
                      {assignment.status}
                    </div>
                  </td>
                  <td className="p-4 text-sm text-slate-600 dark:text-slate-400 font-medium">
                    {assignment.deadline ? new Date(assignment.deadline).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    }) : '-'}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {assignment.status !== 'Submitted' && (
                        <button
                          onClick={() => onUpdateStatus && onUpdateStatus(assignment.id, 'Submitted')}
                          className="p-2 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 text-green-600 dark:text-green-400 transition-colors"
                          title="Mark as Done"
                        >
                          <Check size={16} strokeWidth={3} />
                        </button>
                      )}
                      <button
                        onClick={() => onEdit(assignment)}
                        className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition-colors"
                        title="Edit"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => onDelete(assignment.id)}
                        className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                      <button
                        onClick={() => onOpen(assignment.id)}
                        className="p-2 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 transition-colors"
                        title="Open"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
        {assignments.length === 0 && (
          <div className="p-12 text-center text-slate-500">
            No assignments found.
          </div>
        )}
      </div>
    </div>
  );
};

export default AssignmentTable;
