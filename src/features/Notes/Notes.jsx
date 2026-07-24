import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  FileText,
  Clock,
  CheckCircle2,
  BookOpen,
  Tag as TagIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStorage } from '../../hooks/useStorage';
import { STORAGE_KEYS } from '../../services/storage';
import { toggleSelectionId, toggleSelectAll, softArchiveByIds, restoreByIds, hardDeleteByIds } from '../../utils/entityOps';
import { nanoid } from 'nanoid';
import toast from 'react-hot-toast';

import NoteItem from './components/NoteItem';
import NoteFilter from './components/NoteFilter';
import NoteDetailSidebar from './components/NoteDetailSidebar';
import ConfirmModal from '../../components/ConfirmModal';
import BulkActionBar from '../../components/BulkActionBar';
import PageHeader from '../../components/PageHeader';
import EmptyState from '../../components/EmptyState';
import SmartNoteImporter from './components/SmartNoteImporter';

const Notes = () => {
  const [notes, setNotes] = useStorage(STORAGE_KEYS.NOTES, []);
  const [folders, setFolders] = useStorage(STORAGE_KEYS.NOTE_FOLDERS, []);
  const [courses] = useStorage(STORAGE_KEYS.COURSES, []);
  const [videos] = useStorage(STORAGE_KEYS.VIDEOS, []);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterFolderId, setFilterFolderId] = useState('all'); // 'all', 'favorites', or specific folderId
  const [sortBy, setSortBy] = useState('updated');
  const [viewMode, setViewMode] = useState('grid');
  const [showArchived, setShowArchived] = useState(false);
  const [showInitialSkeleton, setShowInitialSkeleton] = useState(true);
  const [importerOpen, setImporterOpen] = useState(false);

  const [selectedNoteIds, setSelectedNoteIds] = useState([]);

  const handleImportComplete = (newNote) => {
    setNotes([newNote, ...notes]);
    setSelectedNoteDetail(newNote);
  };
  const [bulkTagInput, setBulkTagInput] = useState('');

  const [selectedNoteDetail, setSelectedNoteDetail] = useState(null);
  const [editorViewMode, setEditorViewMode] = useState('split');
  
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, onConfirm: () => {}, message: '', title: '' });

  const [visibleCount, setVisibleCount] = useState(12);
  const loadMoreRef = useRef(null);

  useEffect(() => {
    setVisibleCount(12);
  }, [searchTerm, filterFolderId, sortBy, viewMode, showArchived]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((prev) => prev + 12);
        }
      },
      { threshold: 0.1 }
    );
    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => setShowInitialSkeleton(false), 450);
    return () => clearTimeout(timeout);
  }, []);

  const handleCreateNote = () => {
    const baseTitle = 'New Insight';
    const existingTitles = new Set(notes.map((n) => String(n.title || '').trim().toLowerCase()));
    let nextTitle = baseTitle;
    let counter = 2;
    while (existingTitles.has(nextTitle.toLowerCase())) {
      nextTitle = `${baseTitle} ${counter}`;
      counter += 1;
    }
    const newNote = {
      id: nanoid(),
      title: nextTitle,
      content: '',
      tags: [],
      courseId: '',
      videoId: '',
      folderId: filterFolderId !== 'all' && filterFolderId !== 'favorites' ? filterFolderId : '',
      pinned: filterFolderId === 'favorites',
      archived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setNotes([newNote, ...notes]);
    setSelectedNoteDetail(newNote);
    toast.success('Draft created');
  };

  const updateSelectedNote = useCallback((updates) => {
    if (!selectedNoteDetail) return;
    
    const timestamp = new Date().toISOString();
    
    setNotes(prev => prev.map(n => {
      if (n.id === selectedNoteDetail.id) {
        return { ...n, ...updates, updatedAt: timestamp };
      }
      return n;
    }));
    
    setSelectedNoteDetail(prev => {
      if (!prev) return prev;
      return { ...prev, ...updates, updatedAt: timestamp };
    });
  }, [selectedNoteDetail, setNotes]);

  const filteredAndSortedNotes = useMemo(() => {
    const result = notes.filter((note) => {
      const query = searchTerm.toLowerCase();
      const isArchived = note.archived === true;
      
      if (!showArchived && isArchived) return false;
      if (showArchived && !isArchived) return false;

      const matchesSearch =
        (note.title || '').toLowerCase().includes(query) ||
        (note.content || '').toLowerCase().includes(query) ||
        (note.tags || []).some((tag) => tag.toLowerCase().includes(query));

      let matchesFolder = true;
      if (filterFolderId === 'favorites') {
        matchesFolder = note.pinned === true;
      } else if (filterFolderId !== 'all') {
        matchesFolder = note.folderId === filterFolderId;
      }

      return matchesSearch && matchesFolder;
    });

    return result.sort((a, b) => {
      if (sortBy === 'title') return (a.title || '').localeCompare(b.title || '');
      if (sortBy === 'created') return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      // default: updated
      return new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime();
    });
  }, [notes, searchTerm, filterFolderId, showArchived, sortBy]);

  const noteStats = useMemo(() => {
    const activeNotes = notes.filter(n => !n.archived);
    return {
      total: activeNotes.length,
      favorites: activeNotes.filter(n => n.pinned).length,
      linked: activeNotes.filter(n => n.courseId || n.videoId).length,
      words: activeNotes.reduce((acc, note) => acc + (note.content?.split(/\s+/).filter(Boolean).length || 0), 0)
    };
  }, [notes]);

  const toggleNoteSelection = (id) => setSelectedNoteIds((prev) => toggleSelectionId(prev, id));
  
  const toggleSelectAllVisible = () => {
    const visibleIds = filteredAndSortedNotes.map((n) => n.id);
    setSelectedNoteIds((prev) => toggleSelectAll(prev, visibleIds));
  };
  
  const clearSelection = () => setSelectedNoteIds([]);

  const applyBulkTag = () => {
    const tag = bulkTagInput.trim().toLowerCase();
    if (!selectedNoteIds.length || !tag) return;
    const selected = new Set(selectedNoteIds);
    setNotes((prev) => prev.map((n) => {
      if (!selected.has(n.id)) return n;
      const tags = Array.isArray(n.tags) ? n.tags : [];
      if (tags.includes(tag)) return n;
      return { ...n, tags: [...tags, tag], updatedAt: new Date().toISOString() };
    }));
    toast.success(`Tagged ${selectedNoteIds.length} note(s)`);
    setBulkTagInput('');
  };

  const handleBulkArchive = () => {
    if (!selectedNoteIds.length) return;
    setNotes((prev) => softArchiveByIds(prev, selectedNoteIds));
    toast.success('Notes moved to trash');
    clearSelection();
  };

  const handleBulkRestore = () => {
    if (!selectedNoteIds.length) return;
    setNotes((prev) => restoreByIds(prev, selectedNoteIds));
    toast.success(`Restored ${selectedNoteIds.length} note(s)`);
    clearSelection();
  };

  const handleBulkHardDelete = () => {
    if (!selectedNoteIds.length) return;
    setConfirmConfig({
      isOpen: true,
      title: 'Delete Permanently',
      message: `Permanently delete ${selectedNoteIds.length} selected note(s)? This cannot be undone.`,
      onConfirm: () => {
        setNotes((prev) => hardDeleteByIds(prev, selectedNoteIds));
        toast.success('Notes deleted permanently');
        clearSelection();
      }
    });
  };

  const handleDelete = (id) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Delete Permanently',
      message: 'Permanently delete this note? This cannot be undone.',
      onConfirm: () => {
        setNotes((prev) => hardDeleteByIds(prev, [id]));
        toast.success('Note deleted permanently');
      }
    });
  };

  const handleToggleArchive = (note) => {
    const nextArchived = !(note.archived === true);
    setNotes(prev => prev.map(n => n.id === note.id ? { ...n, archived: nextArchived, updatedAt: new Date().toISOString() } : n));
    toast.success(nextArchived ? 'Note moved to trash' : 'Note restored');
  };

  const handleTogglePin = (id) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, pinned: !n.pinned, updatedAt: new Date().toISOString() } : n));
  };

  const hasActiveFilters = Boolean(searchTerm.trim()) || filterFolderId !== 'all' || showArchived;
  const clearFilters = () => {
    setSearchTerm('');
    setFilterFolderId('all');
    setShowArchived(false);
  };

  return (
    <div className="w-full max-w-[1680px] mx-auto pb-12">
      <PageHeader
        title="Knowledge Library"
        description="Capture ideas, document code, and build your personal study wiki"
        icon={<FileText size={32} />}
        className="mb-8"
      />

      {/* Top Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Notes', value: noteStats.total, icon: FileText, tint: 'text-sky-500', bg: 'bg-sky-500/10' },
          { label: 'Favorites', value: noteStats.favorites, icon: CheckCircle2, tint: 'text-amber-500', bg: 'bg-amber-500/10' },
          { label: 'Linked Notes', value: noteStats.linked, icon: BookOpen, tint: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          { label: 'Words Written', value: noteStats.words, icon: TagIcon, tint: 'text-violet-500', bg: 'bg-violet-500/10' }
        ].map((stat) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{stat.label}</p>
                <p className="text-2xl font-black text-slate-800 dark:text-white mt-1">{stat.value}</p>
              </div>
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${stat.bg} ${stat.tint}`}>
                <stat.icon size={20} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <NoteFilter
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filterFolderId={filterFolderId}
        setFilterFolderId={setFilterFolderId}
        folders={folders}
        sortBy={sortBy}
        setSortBy={setSortBy}
        onAdd={handleCreateNote}
        onImport={() => setImporterOpen(true)}
        noteCount={filteredAndSortedNotes.length}
        showArchived={showArchived}
        setShowArchived={setShowArchived}
        viewMode={viewMode}
        setViewMode={setViewMode}
      />

      {selectedNoteIds.length > 0 && (
        <BulkActionBar selectedCount={selectedNoteIds.length} onSelectVisible={toggleSelectAllVisible} onClear={clearSelection} className="mb-6">
          <input value={bulkTagInput} onChange={(e) => setBulkTagInput(e.target.value)} placeholder="tag" className="px-2 py-1 rounded-lg text-xs w-28" />
          <button onClick={applyBulkTag} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-100 text-indigo-700">Add tag</button>
          <button onClick={handleBulkRestore} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-700">Restore</button>
          <button onClick={handleBulkArchive} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-100 text-rose-700">Trash</button>
          <button onClick={handleBulkHardDelete} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-900 text-white">Hard delete</button>
        </BulkActionBar>
      )}

      {viewMode === 'grid' ? (
        <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
          <AnimatePresence mode="popLayout">
            {filteredAndSortedNotes.slice(0, visibleCount).map((note) => (
              <NoteItem
                key={note.id}
                note={note}
                onEdit={setSelectedNoteDetail}
                onDelete={handleDelete}
                onToggleArchive={handleToggleArchive}
                onTogglePin={handleTogglePin}
                courses={courses}
                videos={videos}
                selected={selectedNoteIds.includes(note.id)}
                onToggleSelect={toggleNoteSelection}
                viewMode="grid"
              />
            ))}
          </AnimatePresence>

          {showInitialSkeleton && notes.length === 0 &&
            [...Array(3)].map((_, index) => (
              <div key={`skeleton-${index}`} className="rounded-[2rem] p-6 border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm animate-pulse">
                <div className="flex justify-between mb-4">
                  <div className="h-4 w-6 rounded bg-slate-200 dark:bg-slate-800" />
                  <div className="h-4 w-4 rounded bg-slate-200 dark:bg-slate-800" />
                </div>
                <div className="h-6 w-3/4 rounded bg-slate-200 dark:bg-slate-800 mb-3" />
                <div className="h-16 w-full rounded-2xl bg-slate-100 dark:bg-slate-800 mb-5" />
                <div className="h-8 w-1/3 rounded bg-slate-200 dark:bg-slate-800" />
              </div>
            ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <table className="w-full min-w-[920px] text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
              <tr className="text-[10px] uppercase tracking-widest text-slate-500">
                <th className="px-4 py-3">Sel</th>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Tags</th>
                <th className="px-4 py-3">Linked</th>
                <th className="px-4 py-3">Updated</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedNotes.slice(0, visibleCount).map((note) => {
                const c = courses.find(cr => cr.id === note.courseId);
                const v = videos.find(vr => vr.id === note.videoId);
                return (
                  <tr key={note.id} className="border-b border-slate-100 dark:border-slate-800 text-sm text-slate-700 dark:text-slate-200">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedNoteIds.includes(note.id)}
                        onChange={() => toggleNoteSelection(note.id)}
                        className="w-4 h-4 rounded border-slate-300 text-primary-500 focus:ring-primary-500"
                      />
                    </td>
                    <td className="px-4 py-3 font-bold flex items-center gap-2">
                      {note.title || 'Untitled Note'}
                      {note.pinned && <span className="text-[10px] text-amber-500 uppercase font-black">Pinned</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {(note.tags || []).join(', ') || '-'}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {c ? c.title : v ? v.title : '-'}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {new Date(note.updatedAt || note.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => setSelectedNoteDetail(note)} className="px-2.5 py-1.5 rounded-lg bg-primary-500 text-white text-xs font-bold">Open</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {visibleCount < filteredAndSortedNotes.length && (
        <div ref={loadMoreRef} className="h-20 w-full flex items-center justify-center mt-6">
          <div className="w-8 h-8 rounded-full border-2 border-primary-500 border-t-transparent animate-spin" />
        </div>
      )}

      {!showInitialSkeleton && filteredAndSortedNotes.length === 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
          <EmptyState
            icon={<FileText size={48} className="text-slate-200 dark:text-slate-700" />}
            title={hasActiveFilters ? 'No Notes Match Your Filters' : 'Knowledge Library Empty'}
            description={hasActiveFilters
              ? 'Try clearing filters or search to reveal more notes.'
              : 'Create your first note to start building your personal wiki.'}
            actions={(
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button onClick={handleCreateNote} className="px-8 py-4 rounded-2xl bg-primary-500 text-white font-black hover:bg-primary-600 shadow-xl shadow-primary-500/20 transition-all active:scale-95">
                  Start First Note
                </button>
                {hasActiveFilters && (
                  <button onClick={clearFilters} className="px-8 py-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-black transition-all active:scale-95">
                    Clear Filters
                  </button>
                )}
              </div>
            )}
          />
        </motion.div>
      )}

      <AnimatePresence>
        {selectedNoteDetail && (
          <NoteDetailSidebar
            selectedNoteDetail={selectedNoteDetail}
            setSelectedNoteDetail={setSelectedNoteDetail}
            updateNote={updateSelectedNote}
            viewMode={editorViewMode}
            setViewMode={setEditorViewMode}
            courses={courses}
            videos={videos}
          />
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmConfig.onConfirm}
        message={confirmConfig.message}
        title={confirmConfig.title}
        type="danger"
      />

      <SmartNoteImporter 
        isOpen={importerOpen}
        onClose={() => setImporterOpen(false)}
        onImportComplete={handleImportComplete}
      />
    </div>
  );
};

export default Notes;
