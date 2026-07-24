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
  { id: 'todo', title: 'To Do', color: 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400' },
  { id: 'doing', title: 'In Progress', color: 'bg-blue-105 dark:bg-blue-500/10 text-blue-500 dark:text-blue-400' },
  { id: 'done', title: 'Completed', color: 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-500 dark:text-emerald-400' }
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
      className="bg-white/70 dark:bg-slate-900/60 p-4 mb-3 rounded-2xl border border-slate-150 dark:border-slate-800/80 cursor-grab active:cursor-grabbing hover:border-primary-400 dark:hover:border-primary-500/30 transition-all group shadow-sm hover:shadow-md"
    >
      <div className="flex justify-between items-start mb-2.5">
        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
          task.priority === 'High' ? 'bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400' : 
          task.priority === 'Medium' ? 'bg-amber-50 text-amber-500 dark:bg-amber-500/10 dark:text-amber-400' : 
          'bg-blue-50 text-blue-500 dark:bg-blue-500/10 dark:text-blue-400'
        }`}>
          {task.priority || 'Medium'}
        </span>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
          <button 
            onClick={(e) => { e.stopPropagation(); onReminder(task); }}
            className="p-1 hover:bg-primary-50 dark:hover:bg-primary-500/10 rounded-lg text-primary-500 transition-all"
          >
            <Bell size={12} />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
            className="p-1 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg text-red-505 transition-all"
          >
            <AlertCircle size={12} />
          </button>
        </div>
      </div>
      <h4 className="text-xs font-bold text-slate-700 dark:text-slate-100 mb-3 leading-relaxed">{task.content}</h4>
      <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-1 text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
          <Calendar size={10} />
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
        <h3 className="text-[10px] font-black text-slate-450 uppercase tracking-widest ml-4">Execution Pipeline</h3>
        <button 
          onClick={onNewTask}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary-500 text-white font-black text-[10px] uppercase tracking-widest shadow-md shadow-primary-500/20 hover:bg-primary-600 transition-all active:scale-95 group"
        >
          <Plus size={14} className="group-hover:rotate-90 transition-transform" />
          Deploy Task
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <DndContext 
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
        >
          {COLUMNS.map((column) => (
            <div key={column.id} className="flex flex-col gap-4">
              <div className="flex items-center justify-between px-3">
                <div className="flex items-center gap-2">
                  <div className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-xs ${column.color}`}>
                    {column.title}
                  </div>
                  <span className="text-[9px] font-black text-slate-400 dark:text-slate-550 uppercase tracking-widest">
                    {project.board?.[column.id]?.length || 0}
                  </span>
                </div>
              </div>

              <div className="bg-white/30 dark:bg-slate-900/30 p-4 rounded-3xl min-h-[500px] border border-slate-100 dark:border-slate-800 shadow-inner flex flex-col justify-start">
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
                  <div className="py-24 text-center opacity-25 my-auto">
                    <p className="text-[9px] font-black uppercase tracking-widest dark:text-slate-500">Pipeline Clear</p>
                  </div>
                )}
              </div>
            </div>
          ))}
          
          <DragOverlay>
            {activeId ? (
              <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-xl border border-primary-500/20 rotate-2 scale-102">
                <h4 className="text-xs font-black text-slate-800 dark:text-white">
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
