import React from 'react';
import { Plus, FileText, Filter } from 'lucide-react';
import SearchBar from './SearchBar';
import NoteItem from './NoteItem';
import EmptyState from '../../../components/EmptyState';

const NotesList = ({
  notes,
  activeNote,
  onSelect,
  onCreate,
  onDelete,
  searchTerm,
  setSearchTerm,
  courses,
  videos,
  selectedNoteIds = [],
  onToggleSelect,
  onTogglePin,
  showArchived,
  setShowArchived,
  showPinnedOnly,
  setShowPinnedOnly
}) => {
  return (
    <div className="flex flex-col gap-6 h-full">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary-50 dark:bg-primary-500/10 text-primary-500">
            <FileText size={24} />
          </div>
          Knowledge Library
        </h2>
        <button 
          onClick={onCreate}
          className="p-2.5 rounded-2xl bg-primary-500 hover:bg-primary-600 text-white shadow-xl shadow-primary-500/20 transition-all active:scale-95 flex items-center gap-2 group"
          title="Create New Note"
        >
          <Plus size={20} className="group-hover:rotate-90 transition-transform" />
        </button>
      </div>

      <div className="space-y-4">
        <SearchBar 
          value={searchTerm} 
          onChange={setSearchTerm} 
          onClear={() => setSearchTerm('')} 
        />
        
        <div className="flex items-center gap-2 px-1">
          <Filter size={14} className="text-slate-400" />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            {notes.length} Total Notes
          </span>
          <button
            onClick={() => setShowArchived?.(!showArchived)}
            className={`ml-auto px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
              showArchived ? 'bg-slate-900 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
            }`}
          >
            {showArchived ? 'Archived On' : 'Archived Off'}
          </button>
          <button
            onClick={() => setShowPinnedOnly?.(!showPinnedOnly)}
            className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
              showPinnedOnly ? 'bg-amber-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
            }`}
          >
            {showPinnedOnly ? 'Pinned Only' : 'All Notes'}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
        {notes.map((note) => (
          <NoteItem 
            key={note.id}
            note={note}
            isActive={activeNote?.id === note.id}
            onClick={onSelect}
            onDelete={onDelete}
            courses={courses}
            videos={videos}
            selected={selectedNoteIds.includes(note.id)}
            onToggleSelect={onToggleSelect}
            onTogglePin={onTogglePin}
          />
        ))}
        {notes.length === 0 && (
          <EmptyState
            compact
            icon={<FileText size={32} />}
            title="Empty Library"
            description="Start documenting your learning journey today."
          />
        )}
      </div>
    </div>
  );
};

export default NotesList;
