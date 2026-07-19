import React from 'react';
import { Calendar, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import AssignmentItem from './AssignmentItem';

const AssignmentTimeline = ({ assignments, onEdit, onDelete, onOpen, courses, selectedAssignmentIds, toggleSelectionId }) => {
  // Sort assignments strictly by deadline
  const sortedAssignments = [...assignments]
    .filter(a => a.deadline)
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
    
  const noDeadlineAssignments = assignments.filter(a => !a.deadline);

  // Group by relative time (Overdue, Today, This Week, Later)
  const grouped = {
    'Overdue': [],
    'Today': [],
    'This Week': [],
    'Later': []
  };

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  sortedAssignments.forEach(a => {
    const deadline = new Date(a.deadline);
    deadline.setHours(0, 0, 0, 0);
    const diffDays = Math.round((deadline - now) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) grouped['Overdue'].push(a);
    else if (diffDays === 0) grouped['Today'].push(a);
    else if (diffDays <= 7) grouped['This Week'].push(a);
    else grouped['Later'].push(a);
  });

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      {Object.entries(grouped).map(([groupName, groupAssignments]) => {
        if (groupAssignments.length === 0) return null;
        
        let colorClass = 'text-blue-500';
        let bgClass = 'bg-blue-500/10';
        let Icon = Calendar;

        if (groupName === 'Overdue') { colorClass = 'text-red-500'; bgClass = 'bg-red-500/10'; Icon = AlertCircle; }
        if (groupName === 'Today') { colorClass = 'text-yellow-500'; bgClass = 'bg-yellow-500/10'; Icon = Clock; }

        return (
          <div key={groupName} className="relative">
            <div className="flex items-center gap-4 mb-6 sticky top-20 z-10 bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur py-2">
              <div className={`p-2 rounded-xl ${bgClass} ${colorClass}`}>
                <Icon size={20} />
              </div>
              <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-wider">{groupName}</h2>
              <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1 ml-4"></div>
            </div>

            <div className="pl-6 border-l-2 border-slate-200 dark:border-slate-800 ml-5 space-y-6">
              {groupAssignments.map(assignment => (
                <div key={assignment.id} className="relative">
                  <div className={`absolute -left-[31px] top-8 w-4 h-4 rounded-full border-4 border-slate-50 dark:border-slate-950 bg-slate-300 dark:bg-slate-700`}></div>
                  <AssignmentItem
                    assignment={assignment}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onOpen={onOpen}
                    courses={courses}
                    isSelected={selectedAssignmentIds.includes(assignment.id)}
                    onSelect={() => toggleSelectionId(assignment.id)}
                    viewMode="timeline"
                  />
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {noDeadlineAssignments.length > 0 && (
        <div className="relative">
          <div className="flex items-center gap-4 mb-6 sticky top-20 z-10 bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur py-2">
            <div className={`p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500`}>
              <CheckCircle2 size={20} />
            </div>
            <h2 className="text-xl font-black text-slate-500 uppercase tracking-wider">No Deadline</h2>
            <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1 ml-4"></div>
          </div>

          <div className="pl-6 border-l-2 border-slate-200 dark:border-slate-800 ml-5 space-y-6">
            {noDeadlineAssignments.map(assignment => (
              <div key={assignment.id} className="relative">
                <div className={`absolute -left-[31px] top-8 w-4 h-4 rounded-full border-4 border-slate-50 dark:border-slate-950 bg-slate-300 dark:bg-slate-700`}></div>
                <AssignmentItem
                  assignment={assignment}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onOpen={onOpen}
                  courses={courses}
                  isSelected={selectedAssignmentIds.includes(assignment.id)}
                  onSelect={() => toggleSelectionId(assignment.id)}
                  viewMode="timeline"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignmentTimeline;
