import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import {
  FolderOpen, 
  ChevronRight, 
  ArrowLeft,
  BookOpen,
  Youtube,
  Layers,
  FileSearch,
  Pencil,
  Trash2,
  X,
  FolderTree
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { useStorage } from '../../hooks/useStorage';
import { STORAGE_KEYS } from '../../services/storage';
import { useAuth } from '../../context/AuthContext';
import { storage as firebaseStorage } from '../../services/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { nanoid } from 'nanoid';
import toast from 'react-hot-toast';

// Sub-components
import ResourceItem from './components/ResourceItem';
import ResourceForm from './components/ResourceForm';
import ResourceFilter from './components/ResourceFilter';
import ConfirmModal from '../../components/ConfirmModal';

const Resources = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  // 1. State Management
  const [resources, setResources] = useStorage(STORAGE_KEYS.RESOURCES, []);
  const [papers, setPapers] = useStorage(STORAGE_KEYS.PAPERS, []);
  const [folders, setFolders] = useStorage(STORAGE_KEYS.FOLDERS, []);
  const [courses] = useStorage(STORAGE_KEYS.COURSES, []);
  const [videos] = useStorage(STORAGE_KEYS.VIDEOS, []);

  const [currentFolderId, setCurrentFolderId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [groupBy, setGroupBy] = useState('type'); // 'type' | 'course' | 'video' | 'folder'
  
  const [isResourceModalOpen, setIsResourceModalOpen] = useState(false);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editingFolder, setEditingFolder] = useState(null);
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadFileName, setUploadFileName] = useState('');
  const [uploadQueue, setUploadQueue] = useState([]);
  const uploadTasksRef = useRef({});
  const [selectedResourceIds, setSelectedResourceIds] = useState([]);
  const [bulkTargetFolder, setBulkTargetFolder] = useState('');
  const [bulkTagInput, setBulkTagInput] = useState('');
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, onConfirm: () => {}, message: '' });

  const [resourceForm, setResourceForm] = useState({
    name: '',
    url: '',
    type: 'Link',
    description: '',
    tags: '',
    associatedId: '',
    associatedType: 'None'
  });
  const [folderForm, setFolderForm] = useState({ name: '' });

  const fileInputRef = useRef(null);
  const isPapersView = useMemo(() => new URLSearchParams(location.search).get('view') === 'papers', [location.search]);
  const [viewMode, setViewMode] = useState(isPapersView ? 'papers' : 'all');

  useEffect(() => {
    setViewMode(isPapersView ? 'papers' : 'all');
  }, [isPapersView]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (viewMode === 'papers') params.set('view', 'papers');
    else params.delete('view');
    const nextSearch = params.toString() ? `?${params.toString()}` : '';
    if (nextSearch !== location.search) {
      navigate({ pathname: '/resources', search: nextSearch }, { replace: true });
    }
  }, [viewMode, navigate, location.search]);

  useEffect(() => {
    if (!Array.isArray(papers) || papers.length === 0) return;
    setResources((prev) => {
      const existingSourceIds = new Set(prev.map((r) => r.sourcePaperId).filter(Boolean));
      const migrated = papers
        .filter((p) => p?.id && !existingSourceIds.has(p.id))
        .map((paper) => ({
          id: nanoid(),
          sourcePaperId: paper.id,
          name: paper.name || 'Untitled Paper',
          url: paper.url || '',
          type: paper.type || 'PDF',
          description: paper.summary || '',
          tags: ['paper', ...(paper.important ? ['important'] : [])],
          associatedType: 'None',
          associatedId: '',
          folderId: null,
          category: 'paper',
          pages: Number(paper.pages || 0),
          readPages: Number(paper.readPages || 0),
          important: Boolean(paper.important),
          completed: Boolean(paper.completed),
          createdAt: paper.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }));
      return migrated.length > 0 ? [...migrated, ...prev] : prev;
    });
    setPapers([]);
    toast.success('Papers merged into Resources');
  }, [papers, setPapers, setResources]);

  const currentFolder = useMemo(
    () => folders.find((f) => f.id === currentFolderId) || null,
    [folders, currentFolderId]
  );

  const getFolderPath = useCallback((folderId) => {
    const path = [];
    let cursor = folders.find((f) => f.id === folderId) || null;
    let guard = 0;
    while (cursor && guard < 30) {
      path.unshift(cursor);
      cursor = folders.find((f) => f.id === cursor.parentId) || null;
      guard += 1;
    }
    return path;
  }, [folders]);

  const getFolderPathLabel = useCallback((folderId) => {
    const path = getFolderPath(folderId);
    return path.map((f) => f.name).join(' / ');
  }, [getFolderPath]);

  const isDescendant = useCallback((maybeChildId, maybeParentId) => {
    if (!maybeChildId || !maybeParentId) return false;
    let cursor = folders.find((f) => f.id === maybeChildId) || null;
    let guard = 0;
    while (cursor && guard < 40) {
      if (cursor.parentId === maybeParentId) return true;
      cursor = folders.find((f) => f.id === cursor.parentId) || null;
      guard += 1;
    }
    return false;
  }, [folders]);

  // 2. Search & Filtering (Derived State)
  const filteredData = useMemo(() => {
    const query = searchTerm.toLowerCase().trim();

    const scopedResources = currentFolderId
      ? resources.filter((r) => r.folderId === currentFolderId)
      : resources;
    const isPaperResource = (r) => r?.category === 'paper' || Boolean(r?.sourcePaperId) || r?.type === 'PDF' || (Array.isArray(r?.tags) && r.tags.includes('paper'));
    const viewScopedResources = viewMode === 'papers' ? scopedResources.filter(isPaperResource) : scopedResources;

    const scopedFolders = folders.filter((f) => (f.parentId || null) === (currentFolderId || null));

    const fResources = viewScopedResources.filter(r =>
      r.name.toLowerCase().includes(query) ||
      r.description?.toLowerCase().includes(query) ||
      r.tags?.some(t => t.toLowerCase().includes(query))
    );

    const fFolders = scopedFolders.filter(f => 
      f.name.toLowerCase().includes(query)
    );

    return { resources: fResources, folders: fFolders };
  }, [resources, folders, searchTerm, currentFolderId, viewMode]);

  // 3. Grouping Logic
  const groupedResources = useMemo(() => {
    const data = filteredData.resources;
    const groups = {};

    if (groupBy === 'folder' || searchTerm) {
      // Flat view if searching or in folder mode
      return { 'All Assets': data };
    }

    data.forEach(res => {
      let key = 'Unlinked';
      if (groupBy === 'type') key = res.type;
      else if (groupBy === 'course' && res.associatedType === 'Course') {
        const course = courses.find(c => c.id === res.associatedId);
        key = course ? course.title : 'Unlinked Courses';
      }
      else if (groupBy === 'video' && res.associatedType === 'Video') {
        const video = videos.find(v => v.id === res.associatedId);
        key = video ? video.title : 'Unlinked Videos';
      }

      if (!groups[key]) groups[key] = [];
      groups[key].push(res);
    });

    return groups;
  }, [filteredData.resources, groupBy, searchTerm, courses, videos]);

  // 4. CRUD Handlers
  const handleResourceSubmit = (e) => {
    e.preventDefault();
    const tagsArray = typeof resourceForm.tags === 'string' 
      ? resourceForm.tags.split(',').map(t => t.trim()).filter(t => t)
      : resourceForm.tags;
    
    const resourceData = {
      ...resourceForm,
      tags: tagsArray,
      folderId: currentFolderId,
      updatedAt: new Date().toISOString()
    };

    if (editingItem?.type === 'resource') {
      setResources(resources.map(r => r.id === editingItem.data.id ? { ...r, ...resourceData } : r));
      toast.success('Asset refined');
    } else {
      setResources([{ ...resourceData, id: nanoid(), createdAt: new Date().toISOString() }, ...resources]);
      toast.success('Asset launched');
    }

    closeResourceModal();
  };

  const closeResourceModal = () => {
    setIsResourceModalOpen(false);
    setEditingItem(null);
    setResourceForm({
      name: '', url: '', type: 'Link', description: '', tags: '', associatedId: '', associatedType: 'None'
    });
  };

  const startUpload = useCallback((queueItemId, file) => {
    if (!file || !user) return;
    const fileName = `${nanoid()}_${file.name}`;
    const storageRef = ref(firebaseStorage, `users/${user.id}/resources/${fileName}`);
    const uploadTask = uploadBytesResumable(storageRef, file);
    uploadTasksRef.current[queueItemId] = uploadTask;

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        setUploadQueue((prev) => prev.map((item) => (item.id === queueItemId ? { ...item, status: 'uploading', progress } : item)));
        setUploadProgress(progress);
        setUploadFileName(file.name);
      },
      (err) => {
        setUploadQueue((prev) => prev.map((item) => (item.id === queueItemId ? { ...item, status: 'failed', error: err?.message || 'Upload failed' } : item)));
      },
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        const resourceType = file.type.includes('pdf')
          ? 'PDF'
          : file.type.includes('presentation') || file.name.endsWith('.pptx')
            ? 'Slides'
            : file.type.includes('word') || file.name.endsWith('.docx')
              ? 'Docs'
              : 'File';

        const uploadedResource = {
          id: nanoid(),
          name: file.name,
          url: downloadURL,
          type: resourceType,
          isLocal: true,
          size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
          folderId: currentFolderId,
          createdAt: new Date().toISOString(),
          tags: [],
          description: '',
          associatedType: 'None',
          associatedId: '',
          storagePath: storageRef.fullPath
        };

        setResources((prev) => [uploadedResource, ...prev]);
        setUploadQueue((prev) => prev.map((item) => (item.id === queueItemId ? { ...item, status: 'completed', progress: 100 } : item)));
        toast.success(`Uploaded ${file.name}`);
      }
    );
  }, [user, currentFolderId, setResources]);

  const handleFileUpload = useCallback((e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length || !user) return;
    const items = files.map((file) => ({
      id: nanoid(),
      name: file.name,
      file,
      progress: 0,
      status: 'queued',
      error: ''
    }));
    setUploadQueue((prev) => [...items, ...prev]);
    items.forEach((item) => startUpload(item.id, item.file));
  }, [user, startUpload]);

  useEffect(() => {
    const active = uploadQueue.some((item) => item.status === 'queued' || item.status === 'uploading');
    setIsUploading(active);
  }, [uploadQueue]);

  const deleteResource = (id) => {
    setConfirmConfig({
      isOpen: true,
      message: 'Archive this knowledge asset?',
      onConfirm: () => {
        setResources(resources.filter(r => r.id !== id));
        toast.success('Asset archived');
      }
    });
  };

  const openFolderModal = (folder = null) => {
    setEditingFolder(folder);
    setFolderForm({ name: folder?.name || '' });
    setIsFolderModalOpen(true);
  };

  const closeFolderModal = () => {
    setIsFolderModalOpen(false);
    setEditingFolder(null);
    setFolderForm({ name: '' });
  };

  const handleFolderSubmit = (e) => {
    e.preventDefault();
    const name = folderForm.name.trim();
    if (!name) {
      toast.error('Folder name is required');
      return;
    }
    const duplicate = folders.some(
      (f) => f.name.toLowerCase() === name.toLowerCase() && f.id !== editingFolder?.id
    );
    if (duplicate) {
      toast.error('Folder with this name already exists');
      return;
    }

    if (editingFolder) {
      setFolders((prev) => prev.map((f) => (f.id === editingFolder.id ? { ...f, name, updatedAt: new Date().toISOString() } : f)));
      toast.success('Folder updated');
    } else {
      const newFolder = { id: nanoid(), name, parentId: currentFolderId || null, createdAt: new Date().toISOString() };
      setFolders((prev) => [newFolder, ...prev]);
      toast.success('Folder created');
    }
    closeFolderModal();
  };

  const handleDeleteFolder = (folderId) => {
    const folder = folders.find((f) => f.id === folderId);
    const collectDescendants = (rootId) => {
      const ids = [];
      const walk = (id) => {
        folders
          .filter((f) => f.parentId === id)
          .forEach((child) => {
            ids.push(child.id);
            walk(child.id);
          });
      };
      walk(rootId);
      return ids;
    };
    const descendants = collectDescendants(folderId);
    const toDelete = new Set([folderId, ...descendants]);
    const targetParent = folder?.parentId || null;
    setConfirmConfig({
      isOpen: true,
      message: `Delete folder "${folder?.name || 'folder'}" and ${descendants.length} subfolder(s)? Assets will be moved to parent.`,
      onConfirm: () => {
        setFolders((prev) => prev.filter((f) => !toDelete.has(f.id)));
        setResources((prev) => prev.map((r) => (toDelete.has(r.folderId) ? { ...r, folderId: targetParent } : r)));
        if (toDelete.has(currentFolderId)) {
          setCurrentFolderId(targetParent);
        }
        toast.success('Folder deleted and assets moved');
      }
    });
  };

  const moveResourceToFolder = (resourceId, targetFolderId) => {
    setResources((prev) => prev.map((r) => (r.id === resourceId ? { ...r, folderId: targetFolderId || null } : r)));
    toast.success('Asset moved');
  };

  const moveFolderToParent = (folderId, nextParentId) => {
    if (folderId === nextParentId) {
      toast.error('Folder cannot be moved into itself');
      return;
    }
    if (isDescendant(nextParentId, folderId)) {
      toast.error('Folder cannot be moved into its descendant');
      return;
    }
    setFolders((prev) => prev.map((f) => (f.id === folderId ? { ...f, parentId: nextParentId || null, updatedAt: new Date().toISOString() } : f)));
    toast.success('Folder moved');
  };

  const handleDragStart = (event, payload) => {
    event.dataTransfer.setData('application/studyos-resource', JSON.stringify(payload));
  };

  const handleDropOnFolder = (event, folderId) => {
    event.preventDefault();
    const raw = event.dataTransfer.getData('application/studyos-resource');
    if (!raw) return;
    const payload = JSON.parse(raw);
    if (payload.type === 'resource') {
      moveResourceToFolder(payload.id, folderId || null);
    }
    if (payload.type === 'folder') {
      moveFolderToParent(payload.id, folderId || null);
    }
  };

  const toggleResourceSelection = (resourceId) => {
    setSelectedResourceIds((prev) => (
      prev.includes(resourceId) ? prev.filter((id) => id !== resourceId) : [...prev, resourceId]
    ));
  };

  const clearSelection = () => setSelectedResourceIds([]);

  const applyBulkMove = () => {
    if (!selectedResourceIds.length) return;
    const selected = new Set(selectedResourceIds);
    setResources((prev) => prev.map((r) => (selected.has(r.id) ? { ...r, folderId: bulkTargetFolder || null } : r)));
    toast.success(`Moved ${selectedResourceIds.length} asset(s)`);
    clearSelection();
  };

  const applyBulkDelete = () => {
    if (!selectedResourceIds.length) return;
    const selected = new Set(selectedResourceIds);
    setResources((prev) => prev.filter((r) => !selected.has(r.id)));
    toast.success(`Deleted ${selectedResourceIds.length} asset(s)`);
    clearSelection();
  };

  const applyBulkTag = () => {
    const tag = bulkTagInput.trim().toLowerCase();
    if (!selectedResourceIds.length || !tag) return;
    const selected = new Set(selectedResourceIds);
    setResources((prev) => prev.map((r) => {
      if (!selected.has(r.id)) return r;
      const tags = Array.isArray(r.tags) ? r.tags : [];
      return tags.includes(tag) ? r : { ...r, tags: [...tags, tag] };
    }));
    toast.success(`Tagged ${selectedResourceIds.length} asset(s)`);
    setBulkTagInput('');
  };

  const cancelQueueItem = (queueId) => {
    uploadTasksRef.current[queueId]?.cancel();
    setUploadQueue((prev) => prev.map((q) => (q.id === queueId ? { ...q, status: 'cancelled', error: 'Cancelled by user' } : q)));
  };

  const retryQueueItem = (queueId) => {
    const item = uploadQueue.find((q) => q.id === queueId);
    if (!item?.file) return;
    setUploadQueue((prev) => prev.map((q) => (q.id === queueId ? { ...q, status: 'queued', progress: 0, error: '' } : q)));
    startUpload(queueId, item.file);
  };

  const folderOptions = useMemo(
    () => folders.map((f) => ({ id: f.id, pathLabel: getFolderPathLabel(f.id) || f.name })),
    [folders, getFolderPathLabel]
  );

  const renderFolderTree = (parentId = null, depth = 0) => {
    const nodes = folders
      .filter((f) => (f.parentId || null) === (parentId || null))
      .sort((a, b) => a.name.localeCompare(b.name));
    return nodes.map((node) => (
      <div key={`tree-${node.id}`}>
        <button
          onClick={() => setCurrentFolderId(node.id)}
          onDrop={(e) => handleDropOnFolder(e, node.id)}
          onDragOver={(e) => e.preventDefault()}
          className={`w-full text-left px-2 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 ${
            currentFolderId === node.id
              ? 'bg-primary-500 text-white'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          style={{ paddingLeft: `${8 + depth * 14}px` }}
        >
          <FolderOpen size={12} />
          <span className="truncate">{node.name}</span>
        </button>
        {renderFolderTree(node.id, depth + 1)}
      </div>
    ));
  };

  return (
    <div className="max-w-7xl mx-auto pb-12">
      {/* Header Title Section */}
      <div className="mb-12 space-y-2">
        <h1 className="text-4xl font-black text-slate-800 dark:text-white flex items-center gap-4">
          <div className="p-3 rounded-[1.5rem] bg-primary-500 text-white shadow-xl shadow-primary-500/20">
            <Layers size={32} />
          </div>
          {isPapersView ? 'Reading Library (Merged)' : 'Knowledge Base'}
        </h1>
        <p className="text-slate-400 font-bold ml-20 uppercase tracking-widest text-xs">
          {isPapersView ? 'Papers are now part of unified resources' : 'Manage your learning assets and associations'}
        </p>
      </div>

      <ResourceFilter 
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        groupBy={groupBy}
        setGroupBy={setGroupBy}
        onNewFolder={() => openFolderModal()}
        onUpload={() => fileInputRef.current?.click()}
        onAddLink={() => setIsResourceModalOpen(true)}
        isUploading={isUploading}
        itemCount={resources.length}
        viewMode={viewMode}
        setViewMode={setViewMode}
      />

      <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} multiple />

      {/* Upload Status Overlay */}
      <AnimatePresence>
        {isUploading && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-8 right-8 z-[60] w-80"
          >
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-2xl border border-primary-100 dark:border-primary-500/20">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center text-primary-500">
                  <Layers size={20} className="animate-pulse" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-black text-slate-800 dark:text-white truncate uppercase tracking-tighter">{uploadFileName}</p>
                  <p className="text-[9px] font-black text-primary-500 uppercase tracking-widest mt-0.5">Syncing to Cloud...</p>
                </div>
              </div>
              <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${uploadProgress}%` }}
                  className="h-full bg-primary-500 rounded-full"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {uploadQueue.length > 0 && (
        <div className="mb-6 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Upload Queue</p>
          <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
            {uploadQueue.map((q) => (
              <div key={q.id} className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-bold truncate">{q.name}</p>
                  <p className="text-[10px] text-slate-400 uppercase">{q.status}{q.error ? ` • ${q.error}` : ''}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-slate-500">{q.progress || 0}%</span>
                  {q.status === 'uploading' && <button onClick={() => cancelQueueItem(q.id)} className="px-2 py-1 rounded-lg text-[10px] bg-rose-100 text-rose-700">Cancel</button>}
                  {q.status === 'failed' && <button onClick={() => retryQueueItem(q.id)} className="px-2 py-1 rounded-lg text-[10px] bg-amber-100 text-amber-700">Retry</button>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedResourceIds.length > 0 && (
        <div className="mb-6 p-4 rounded-2xl border border-primary-200 dark:border-primary-800 bg-primary-50/70 dark:bg-primary-900/20 flex flex-wrap items-center gap-2">
          <span className="text-xs font-black text-primary-700 dark:text-primary-300">{selectedResourceIds.length} selected</span>
          <select value={bulkTargetFolder} onChange={(e) => setBulkTargetFolder(e.target.value)} className="px-2 py-1 rounded-lg text-xs">
            <option value="">Move to Root</option>
            {folderOptions.map((opt) => <option key={`bulk-${opt.id}`} value={opt.id}>{opt.pathLabel}</option>)}
          </select>
          <button onClick={applyBulkMove} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-100 text-blue-700">Move</button>
          <input value={bulkTagInput} onChange={(e) => setBulkTagInput(e.target.value)} placeholder="tag" className="px-2 py-1 rounded-lg text-xs w-24" />
          <button onClick={applyBulkTag} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-100 text-indigo-700">Tag</button>
          <button onClick={applyBulkDelete} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-100 text-rose-700">Delete</button>
          <button onClick={clearSelection} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-200 text-slate-700">Clear</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <aside className="lg:col-span-3">
          <div className="card p-4 space-y-3 sticky top-24">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
              <FolderTree size={14} />
              Explorer
            </div>
            <button
              onClick={() => setCurrentFolderId(null)}
              onDrop={(e) => handleDropOnFolder(e, null)}
              onDragOver={(e) => e.preventDefault()}
              className={`w-full text-left px-2 py-1.5 rounded-lg text-xs font-bold ${
                currentFolderId === null
                  ? 'bg-primary-500 text-white'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Root
            </button>
            <div className="max-h-[60vh] overflow-y-auto custom-scrollbar pr-1 space-y-1">
              {renderFolderTree(null, 0)}
            </div>
          </div>
        </aside>

        <section className="lg:col-span-9">
      {/* Grouped Resource Display */}
      <div className="mb-10 space-y-4">
        <div className="flex flex-wrap items-center gap-2 text-xs font-black uppercase tracking-widest">
          <button
            onClick={() => setCurrentFolderId(null)}
            className={`px-3 py-1.5 rounded-lg ${currentFolderId === null ? 'bg-primary-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}
          >
            Root
          </button>
          {getFolderPath(currentFolderId).map((node, idx, arr) => (
            <React.Fragment key={`crumb-${node.id}`}>
              <ChevronRight size={12} className="text-slate-400" />
              <button
                onClick={() => setCurrentFolderId(node.id)}
                className={`px-3 py-1.5 rounded-lg ${idx === arr.length - 1 ? 'bg-primary-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}
              >
                {node.name}
              </button>
            </React.Fragment>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {filteredData.folders.map((folder) => (
            <button
              key={folder.id}
              onClick={() => setCurrentFolderId(folder.id)}
              onDrop={(e) => handleDropOnFolder(e, folder.id)}
              onDragOver={(e) => e.preventDefault()}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest inline-flex items-center gap-2 transition ${
                currentFolderId === folder.id
                  ? 'bg-primary-500 text-white'
                  : 'bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-500'
              }`}
            >
              <FolderOpen size={14} />
              {folder.name}
            </button>
          ))}
        </div>
        {filteredData.folders.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredData.folders.map((folder) => (
              <div
                key={`manage-${folder.id}`}
                draggable
                onDragStart={(e) => handleDragStart(e, { type: 'folder', id: folder.id })}
                onDrop={(e) => handleDropOnFolder(e, folder.id)}
                onDragOver={(e) => e.preventDefault()}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <FolderOpen size={16} className="text-primary-500" />
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{folder.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => openFolderModal(folder)} className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-500">
                    <Pencil size={14} />
                  </button>
                  <select
                    value={folder.parentId || ''}
                    onChange={(e) => moveFolderToParent(folder.id, e.target.value || null)}
                    className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700"
                    title="Move folder"
                  >
                    <option value="">Root</option>
                    {folderOptions
                      .filter((opt) => opt.id !== folder.id && !isDescendant(opt.id, folder.id))
                      .map((opt) => (
                        <option key={`parent-${folder.id}-${opt.id}`} value={opt.id}>
                          {opt.pathLabel}
                        </option>
                      ))}
                  </select>
                  <button onClick={() => handleDeleteFolder(folder.id)} className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-rose-500">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-12">
        {Object.entries(groupedResources).map(([groupName, items]) => (
          <div key={groupName} className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center gap-4">
              <h3 className="text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-primary-500" />
                {groupName}
              </h3>
              <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{items.length} Units</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              <AnimatePresence mode="popLayout">
                {items.map(res => (
                  <ResourceItem 
                    key={res.id}
                    res={res}
                    folderOptions={folderOptions.filter((opt) => opt.id !== (res.folderId || ''))}
                    onMove={moveResourceToFolder}
                    selected={selectedResourceIds.includes(res.id)}
                    onToggleSelect={toggleResourceSelection}
                    onDragStart={handleDragStart}
                    courses={courses}
                    videos={videos}
                    onDelete={deleteResource}
                    onEdit={(r) => {
                      setEditingItem({ type: 'resource', data: r });
                      setResourceForm({...r, tags: r.tags?.join(', ') || ''});
                      setIsResourceModalOpen(true);
                    }}
                  />
                ))}
              </AnimatePresence>
            </div>
          </div>
        ))}

        {filteredData.resources.length === 0 && filteredData.folders.length === 0 && (
            <div className="py-20 text-center space-y-6 bg-white dark:bg-slate-900 rounded-[3rem] border-2 border-dashed border-slate-100 dark:border-slate-800">
            <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800/50 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-inner">
              <FileSearch size={48} className="text-slate-200 dark:text-slate-700" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-slate-800 dark:text-white">Nothing Here Yet</h3>
              <p className="text-slate-400 max-w-sm mx-auto">Start with a folder, upload your first file, or add a link to build your knowledge base.</p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button onClick={() => openFolderModal()} className="px-5 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold">Create Folder</button>
              <button onClick={() => fileInputRef.current?.click()} className="px-5 py-3 rounded-xl bg-primary-500 text-white font-bold">Upload First File</button>
              <button onClick={() => setIsResourceModalOpen(true)} className="px-5 py-3 rounded-xl bg-emerald-500 text-white font-bold">Link First Asset</button>
            </div>
          </div>
        )}
      </div>
      </section>
      </div>

      {/* Resource Modal */}
      <AnimatePresence>
        {isResourceModalOpen && (
          <ResourceForm 
            editingItem={editingItem}
            resourceForm={resourceForm}
            setResourceForm={setResourceForm}
            onSubmit={handleResourceSubmit}
            onClose={closeResourceModal}
            courses={courses}
            videos={videos}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isFolderModalOpen && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeFolderModal}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.form
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              onSubmit={handleFolderSubmit}
              className="relative w-full max-w-md rounded-[2rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-2xl p-6 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black text-slate-800 dark:text-white">
                  {editingFolder ? 'Rename Folder' : 'Create Folder'}
                </h3>
                <button type="button" onClick={closeFolderModal} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                  <X size={16} className="text-slate-400" />
                </button>
              </div>
              <input
                autoFocus
                value={folderForm.name}
                onChange={(e) => setFolderForm({ name: e.target.value })}
                placeholder="Folder name"
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700"
              />
              <div className="flex gap-2">
                <button type="button" onClick={closeFolderModal} className="flex-1 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold">
                  Cancel
                </button>
                <button type="submit" className="flex-1 py-3 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-bold">
                  {editingFolder ? 'Save' : 'Create'}
                </button>
              </div>
            </motion.form>
          </div>
        )}
      </AnimatePresence>

      <ConfirmModal 
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig({ ...confirmConfig, isOpen: false })}
        onConfirm={confirmConfig.onConfirm}
        message={confirmConfig.message}
        title="Archive Asset"
      />
    </div>
  );
};

export default Resources;
