import React from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import AssignmentItem from './AssignmentItem';

const KanbanColumn = ({ id, title, assignments, onEdit, onDelete, onOpen, courses, selectedIds, onSelectId }) => {
  return (
    <div className="flex flex-col bg-slate-50/50 dark:bg-slate-900/30 rounded-3xl p-4 min-h-[500px]">
      <div className="flex items-center justify-between mb-6 px-2">
        <h3 className="text-sm font-black uppercase tracking-widest text-slate-500">{title}</h3>
        <span className="px-3 py-1 rounded-xl bg-white dark:bg-slate-800 text-xs font-bold shadow-sm">{assignments.length}</span>
      </div>
      <div className="flex-1 flex flex-col gap-4">
        <SortableContext items={assignments.map(a => a.id)} strategy={rectSortingStrategy}>
          {assignments.map(assignment => (
            <SortableAssignment
              key={assignment.id}
              assignment={assignment}
              onEdit={onEdit}
              onDelete={onDelete}
              onOpen={onOpen}
              courses={courses}
              isSelected={selectedIds.includes(assignment.id)}
              onSelect={() => onSelectId(assignment.id)}
            />
          ))}
        </SortableContext>
      </div>
    </div>
  );
};

const SortableAssignment = (props) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: props.assignment.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <AssignmentItem {...props} viewMode="kanban" />
    </div>
  );
};

const AssignmentKanban = ({
  assignments,
  onEdit,
  onDelete,
  onOpen,
  courses,
  selectedAssignmentIds,
  toggleSelectionId,
  setAssignments
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const columns = [
    { id: 'Not Started', title: 'Not Started' },
    { id: 'In Progress', title: 'In Progress' },
    { id: 'Submitted', title: 'Submitted' }
  ];

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over) return;

    if (active.id !== over.id) {
      setAssignments((items) => {
        const activeItem = items.find(item => item.id === active.id);
        const overItem = items.find(item => item.id === over.id);

        if (!activeItem || !overItem) {
          // Check if dragging to empty column
          const overColumnId = columns.find(c => c.id === over.id)?.id;
          if (overColumnId) {
             return items.map(item => item.id === active.id ? { ...item, status: overColumnId } : item);
          }
          return items;
        }

        const activeIndex = items.findIndex(item => item.id === active.id);
        const overIndex = items.findIndex(item => item.id === over.id);

        let newItems = [...items];
        
        // If moving to a different status, update status
        if (activeItem.status !== overItem.status) {
          newItems[activeIndex] = { ...newItems[activeIndex], status: overItem.status };
        }

        return arrayMove(newItems, activeIndex, overIndex);
      });
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        {columns.map(column => (
          <KanbanColumn
            key={column.id}
            id={column.id}
            title={column.title}
            assignments={assignments.filter(a => a.status === column.id)}
            onEdit={onEdit}
            onDelete={onDelete}
            onOpen={onOpen}
            courses={courses}
            selectedIds={selectedAssignmentIds}
            onSelectId={toggleSelectionId}
          />
        ))}
      </DndContext>
    </div>
  );
};

export default AssignmentKanban;
