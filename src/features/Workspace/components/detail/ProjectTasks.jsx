import React from 'react';
import { 
  DndContext, 
  closestCorners, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import { 
  SortableContext, 
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { 
  Plus, 
  CheckCircle2, 
  Clock, 
  Bell,
  MoreVertical,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { CSS } from '@dnd-kit/utilities';
import { useSortable } from '@dnd-kit/sortable';

const COLUMNS = [
  { id: 'todo', title: 'To Do', color: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400' },
  { id: 'doing', title: 'In Progress', color: 'bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400' },
  { id: 'done', title: 'Completed', color: 'bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-green-400' }
];

const SortableTask = ({ task, onDelete, onReminder }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...listeners}
      className="bg-white dark:bg-slate-800 p-5 mb-4 rounded-[1.5rem] border border-slate-50 dark:border-slate-700/50 cursor-grab active:cursor-grabbing hover:border-primary-200 dark:hover:border-primary-500/30 transition-all group shadow-sm hover:shadow-md"
    >
      <div className="flex justify-between items-start mb-3">
        <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
          task.priority === 'High' ? 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400' : 
          task.priority === 'Medium' ? 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400' : 
          'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400'
        }`}>
          {task.priority || 'Medium'}
        </span>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
          <button 
            onClick={(e) => { e.stopPropagation(); onReminder(task); }}
            className="p-1.5 hover:bg-primary-50 dark:hover:bg-primary-500/10 rounded-lg text-primary-500 transition-all"
          >
            <Bell size={14} />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
            className="p-1.5 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg text-red-500 transition-all"
          >
            <AlertCircle size={14} />
          </button>
        </div>
      </div>
      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-4 leading-relaxed">{task.content}</h4>
      <div className="flex items-center justify-between pt-4 border-t border-slate-50 dark:border-slate-700/50">
        <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-300 dark:text-slate-500 uppercase tracking-widest">
          <Calendar size={12} />
          {new Date(task.createdAt).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
};

const ProjectTasks = ({ project, sensors, onDragStart, onDragEnd, activeId, onDeleteTask, onQuickReminder, onNewTask }) => {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest ml-4">Execution Pipeline</h3>
        <button 
          onClick={onNewTask}
          className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-primary-500 text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-primary-500/20 hover:bg-primary-600 transition-all active:scale-95 group"
        >
          <Plus size={18} className="group-hover:rotate-90 transition-transform" />
          Deploy Task
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <DndContext 
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
        >
          {COLUMNS.map((column) => (
            <div key={column.id} className="flex flex-col gap-6">
              <div className="flex items-center justify-between px-4">
                <div className="flex items-center gap-3">
                  <div className={`px-4 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm ${column.color}`}>
                    {column.title}
                  </div>
                  <span className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest">
                    {project.board?.[column.id]?.length || 0}
                  </span>
                </div>
              </div>

              <div className="bg-slate-50/50 dark:bg-slate-900/50 p-5 rounded-[2.5rem] min-h-[600px] border-2 border-dashed border-slate-100 dark:border-slate-800/50">
                <SortableContext 
                  items={project.board?.[column.id] || []}
                  strategy={verticalListSortingStrategy}
                >
                  {(project.board?.[column.id] || []).map((task) => (
                    <SortableTask 
                      key={task.id} 
                      task={task} 
                      onDelete={onDeleteTask} 
                      onReminder={onQuickReminder} 
                    />
                  ))}
                </SortableContext>
                
                {(project.board?.[column.id]?.length || 0) === 0 && (
                  <div className="py-32 text-center opacity-20">
                    <p className="text-[10px] font-black uppercase tracking-widest dark:text-slate-500">Pipeline Clear</p>
                  </div>
                )}
              </div>
            </div>
          ))}
          
          <DragOverlay>
            {activeId ? (
              <div className="bg-white dark:bg-slate-800 p-6 rounded-[1.5rem] shadow-2xl border-2 border-primary-500/20 rotate-3 scale-105">
                <h4 className="text-sm font-black text-slate-800 dark:text-white">
                  {Object.values(project.board).flat().find(t => t.id === activeId)?.content}
                </h4>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
};

export default ProjectTasks;
