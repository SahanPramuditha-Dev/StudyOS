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
  FolderTree,
  Link2,
  HardDrive,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { useStorage } from '../../hooks/useStorage';
import { STORAGE_KEYS } from '../../services/storage';
import { useAuth } from '../../context/AuthContext';
import { storage as firebaseStorage } from '../../services/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { nanoid } from 'nanoid';
import JSZip from 'jszip';
import toast from 'react-hot-toast';

// Sub-components
import ResourceItem from './components/ResourceItem';
import ResourceDetailSidebar from './components/ResourceDetailSidebar';
import ResourceFilter from './components/ResourceFilter';
import ConfirmModal from '../../components/ConfirmModal';
import BulkActionBar from '../../components/BulkActionBar';
import { toggleSelectionId, toggleSelectAll, softArchiveByIds, restoreByIds, hardDeleteByIds } from '../../utils/entityOps';
import PageHeader from '../../components/PageHeader';
import EmptyState from '../../components/EmptyState';
import Select from '../../components/ui/Select';

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
  const [projects] = useStorage(STORAGE_KEYS.PROJECTS, []);
  const [assignments] = useStorage(STORAGE_KEYS.ASSIGNMENTS, []);
  const [notes] = useStorage(STORAGE_KEYS.NOTES, []);

  const [currentFolderId, setCurrentFolderId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [groupBy, setGroupBy] = useState('type'); // 'type' | 'course' | 'video' | 'folder'
  const [dateRange, setDateRange] = useState('all');
  const [sizeFilter, setSizeFilter] = useState('all');
  const [assocFilter, setAssocFilter] = useState('all');
  
  const [selectedResourceDetail, setSelectedResourceDetail] = useState(null);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState(null);
  
  const [displayMode, setDisplayMode] = useState('grid');
  
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadFileName, setUploadFileName] = useState('');
  const [uploadQueue, setUploadQueue] = useState([]);
  const uploadTasksRef = useRef({});
  const [selectedResourceIds, setSelectedResourceIds] = useState([]);
  const [bulkTargetFolder, setBulkTargetFolder] = useState('');
  const [bulkTagInput, setBulkTagInput] = useState('');
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, onConfirm: () => {}, message: '' });

  const [folderForm, setFolderForm] = useState({ name: '' });

  const fileInputRef = useRef(null);
  const isPapersView = useMemo(() => new URLSearchParams(location.search).get('view') === 'papers', [location.search]);
  const viewMode = isPapersView ? 'papers' : 'all';
  const setViewMode = useCallback((nextMode) => {
    const params = new URLSearchParams(location.search);
    if (nextMode === 'papers') params.set('view', 'papers');
    else params.delete('view');
    const nextSearch = params.toString() ? `?${params.toString()}` : '';
    navigate({ pathname: '/resources', search: nextSearch }, { replace: true });
  }, [location.search, navigate]);

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

    let fResources = viewScopedResources.filter(r =>
      r.name.toLowerCase().includes(query) ||
      r.description?.toLowerCase().includes(query) ||
      r.tags?.some(t => t.toLowerCase().includes(query))
    );

    // Advanced filters
    const now = new Date();
    if (dateRange !== 'all') {
      const cutoff = dateRange === 'week' ? now - 7*24*60*60*1000
        : dateRange === 'month' ? now - 30*24*60*60*1000
        : dateRange === 'year' ? now - 365*24*60*60*1000 : 0;
      fResources = fResources.filter(r => new Date(r.createdAt) > new Date(cutoff));
    }

    if (sizeFilter !== 'all') {
      fResources = fResources.filter(r => {
        const sizeMB = parseFloat(r.size) || 0;
        if (sizeFilter === 'small' && sizeMB > 1) return false;
        if (sizeFilter === 'medium' && sizeMB > 10) return false;
        if (sizeFilter === 'large' && sizeMB > 100) return false;
        return true;
      });
    }

    if (assocFilter !== 'all') {
      if (assocFilter === 'none') fResources = fResources.filter(r => r.associatedType === 'None');
      else fResources = fResources.filter(r => r.associatedType === assocFilter);
    }

    const fFolders = scopedFolders.filter(f => 
      f.name.toLowerCase().includes(query)
    );

    return { resources: fResources, folders: fFolders };
  }, [resources, folders, searchTerm, currentFolderId, viewMode, dateRange, sizeFilter, assocFilter]);

  const exportZip = useCallback(async () => {
    const zip = new JSZip();
    const filtered = filteredData.resources;

    filtered.forEach(r => {
      if (r.isLocal && r.storagePath) {
        zip.file(r.name, `Download: ${r.name} (${r.url})`);
      } else {
        zip.file(r.name + '.txt', `Name: ${r.name}\nType: ${r.type}\nURL: ${r.url}\nDesc: ${r.description}`);
      }
    });

    const content = await zip.generateAsync({ type: 'blob' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(content);
    link.download = `studyos-resources-${new Date().toISOString().split('T')[0]}.zip`;
    link.click();
    toast.success(`Exported ${filtered.length} resources`);
  }, [filteredData.resources]);

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

  const updateResource = (updates) => {
    setSelectedResourceDetail(prev => ({ ...prev, ...updates }));
    setResources(prev => prev.map(r => 
      r.id === selectedResourceDetail?.id ? { ...r, ...updates, updatedAt: new Date().toISOString() } : r
    ));
  };

  const handleCreateLink = () => {
    const newResource = {
      id: nanoid(),
      name: 'New Link',
      url: '',
      type: 'Link',
      description: '',
      tags: [],
      folderId: currentFolderId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setResources(prev => [newResource, ...prev]);
    setSelectedResourceDetail(newResource);
  };

  const closeResourceModal = () => {
    setSelectedResourceDetail(null);
  };

  const startUpload = useCallback((queueItemId, file) => {
    if (!file || !user) return;
    const fileName = `${nanoid()}_${file.name}`;
    const storageRef = ref(firebaseStorage, `users/${user.id}/resources/${fileName}`);
    const metadata = {
      cacheControl: 'public, max-age=31536000',
    };
    const uploadTask = uploadBytesResumable(storageRef, file, metadata);
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

  const isUploading = uploadQueue.some((item) => item.status === 'queued' || item.status === 'uploading');

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

  // Analytics tracker for resource opens (fixes ESLint no-undef)
  const trackOpen = useCallback((resourceId) => {
    console.log('[Resources] Opened resource:', resourceId);
    // Optional: usageMetrics.track('resource_open', { resourceId });
  }, []);

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

  const resourceStats = useMemo(() => {
    const total = resources.length;
    const links = resources.filter(r => r.type === 'Link').length;
    const papers = resources.filter(r => r.category === 'paper' || Boolean(r.sourcePaperId) || r.type === 'PDF' || (Array.isArray(r.tags) && r.tags.includes('paper'))).length;
    const totalSizeMB = resources.reduce((acc, r) => {
      if (!r.size) return acc;
      const sizeStr = String(r.size).toUpperCase();
      const val = parseFloat(r.size) || 0;
      if (sizeStr.includes('GB')) return acc + val * 1024;
      if (sizeStr.includes('MB')) return acc + val;
      if (sizeStr.includes('KB')) return acc + val / 1024;
      // Default to assuming raw numbers or 'B'/'BYTES' are in bytes
      return acc + val / (1024 * 1024);
    }, 0);
    return {
      total,
      folders: folders.length,
      links,
      papers,
      size: totalSizeMB > 1024 ? `${(totalSizeMB / 1024).toFixed(2)} GB` : `${totalSizeMB.toFixed(2)} MB`
    };
  }, [resources, folders]);

  const toggleSelectAllVisible = () => {
    const visibleIds = filteredData.resources.map((n) => n.id);
    setSelectedResourceIds((prev) => toggleSelectAll(prev, visibleIds));
  };

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
          className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${
            currentFolderId === node.id
              ? 'bg-primary-500 text-white shadow-md shadow-primary-500/20'
              : 'text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm'
          }`}
          style={{ paddingLeft: `${12 + depth * 16}px` }}
        >
          <FolderOpen size={14} className={currentFolderId === node.id ? 'text-white' : 'text-slate-400'} />
          <span className="truncate">{node.name}</span>
        </button>
        {renderFolderTree(node.id, depth + 1)}
      </div>
    ));
  };

  return (
    <div className="w-full max-w-[1680px] mx-auto pb-12">
      {/* Header Title Section */}
      <PageHeader
        title={isPapersView ? 'Reading Library (Merged)' : 'Knowledge Base'}
        description={isPapersView ? 'Papers are now part of unified resources' : 'Manage your learning assets and associations'}
        icon={<Layers size={32} />}
        actions={[
          <button 
            key="export" 
            onClick={async () => exportZip()} 
            className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase text-sm shadow-lg shadow-emerald-500/25 transition-all"
          >
            Export ZIP
          </button>
        ]}
        className="mb-8"
      />

      {/* Top Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Assets', value: resourceStats.total, icon: Layers, tint: 'text-sky-500', bg: 'bg-sky-500/10' },
          { label: 'Total Folders', value: resourceStats.folders, icon: FolderOpen, tint: 'text-amber-500', bg: 'bg-amber-500/10' },
          { label: 'Web Links', value: resourceStats.links, icon: Link2, tint: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          { label: 'Total Size', value: resourceStats.size, icon: HardDrive, tint: 'text-violet-500', bg: 'bg-violet-500/10' }
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

<ResourceFilter 
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        groupBy={groupBy}
        setGroupBy={setGroupBy}
        dateRange={dateRange}
        setDateRange={setDateRange}
        sizeFilter={sizeFilter}
        setSizeFilter={setSizeFilter}
        assocFilter={assocFilter}
        setAssocFilter={setAssocFilter}
        onNewFolder={() => openFolderModal()}
        onUpload={() => fileInputRef.current?.click()}
        onAddLink={handleCreateLink}
        isUploading={isUploading}
        itemCount={resources.length}
        viewMode={viewMode}
        setViewMode={setViewMode}
        displayMode={displayMode}
        setDisplayMode={setDisplayMode}
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
        <BulkActionBar selectedCount={selectedResourceIds.length} onSelectVisible={toggleSelectAllVisible} onClear={clearSelection} className="mb-6">
          <Select 
            variant="ghost"
            value={bulkTargetFolder} 
            onChange={(e) => setBulkTargetFolder(e.target.value)} 
            options={[
              { label: 'Move to Root', value: '' },
              ...folderOptions.map(opt => ({ label: opt.pathLabel, value: opt.id }))
            ]}
          />
          <button onClick={applyBulkMove} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-100 text-blue-700">Move</button>
          <input value={bulkTagInput} onChange={(e) => setBulkTagInput(e.target.value)} placeholder="tag" className="px-2 py-1 rounded-lg text-xs w-24" />
          <button onClick={applyBulkTag} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-100 text-indigo-700">Tag</button>
          <button onClick={applyBulkDelete} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-100 text-rose-700">Delete</button>
        </BulkActionBar>
      )}

      <div className="w-full">

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
        {filteredData.folders.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mt-4">
            {filteredData.folders.map((folder) => (
              <div
                key={`manage-${folder.id}`}
                draggable
                onDragStart={(e) => handleDragStart(e, { type: 'folder', id: folder.id })}
                onDrop={(e) => handleDropOnFolder(e, folder.id)}
                onDragOver={(e) => e.preventDefault()}
                className="group p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex flex-col gap-3 shadow-sm hover:shadow-md transition-all"
              >
                <button 
                  onClick={() => setCurrentFolderId(folder.id)}
                  className="flex items-center gap-3 text-left hover:text-primary-500 transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center text-primary-500 shrink-0 group-hover:scale-110 transition-transform">
                    <FolderOpen size={20} />
                  </div>
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{folder.name}</span>
                </button>
                <div className="flex items-center justify-between gap-1 opacity-0 group-hover:opacity-100 transition-opacity mt-auto pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button onClick={() => openFolderModal(folder)} className="p-1.5 rounded-lg text-slate-400 hover:text-primary-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    <Pencil size={14} />
                  </button>
                  <Select
                    variant="ghost"
                    value={folder.parentId || ''}
                    onChange={(e) => moveFolderToParent(folder.id, e.target.value || null)}
                    title="Move folder"
                    className="flex-1 text-[10px] w-full max-w-[80px]"
                    options={[
                      { label: 'Root', value: '' },
                      ...folderOptions
                        .filter((opt) => opt.id !== folder.id && !isDescendant(opt.id, folder.id))
                        .map((opt) => ({ label: opt.pathLabel, value: opt.id }))
                    ]}
                  />
                  <button onClick={() => handleDeleteFolder(folder.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
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
              <h3 className="text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] flex items-center gap-3 min-w-0">
                <div className="w-2 h-2 rounded-full bg-primary-500 shrink-0" />
                <span className="truncate">{groupName}</span>
              </h3>
              <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{items.length} Units</span>
            </div>

            {displayMode === 'grid' ? (
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
                      onOpen={trackOpen}
                      courses={courses}
                      videos={videos}
                      onDelete={deleteResource}
                      onEdit={(r) => {
                        setSelectedResourceDetail(r);
                      }}
                    />
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                <table className="w-full min-w-[920px] text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                    <tr className="text-[10px] uppercase tracking-widest text-slate-500">
                      <th className="px-4 py-3 w-12">Sel</th>
                      <th className="px-4 py-3">Asset Name</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Tags</th>
                      <th className="px-4 py-3">Added</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map(res => (
                      <tr key={res.id} className="border-b border-slate-100 dark:border-slate-800 text-sm text-slate-700 dark:text-slate-200">
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedResourceIds.includes(res.id)}
                            onChange={() => toggleResourceSelection(res.id)}
                            className="w-4 h-4 rounded border-slate-300 text-primary-500 focus:ring-primary-500"
                          />
                        </td>
                        <td className="px-4 py-3 font-bold">
                          {res.name || 'Untitled'}
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[9px] font-black uppercase tracking-widest">
                            {res.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500">
                          {(res.tags || []).join(', ') || '-'}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500">
                          {new Date(res.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => {
                              trackOpen(res.id);
                              window.open(res.url, '_blank');
                            }} className="px-2.5 py-1.5 rounded-lg bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 text-xs font-bold hover:bg-primary-100 transition-colors">
                              Open
                            </button>
                            <button onClick={() => {
                              setSelectedResourceDetail(res);
                            }} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400">
                              <Pencil size={14} />
                            </button>
                            <button onClick={() => deleteResource(res.id)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-rose-400">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}

        {filteredData.resources.length === 0 && filteredData.folders.length === 0 && (
          <div className="flex flex-col items-center justify-center p-12 overflow-hidden bg-slate-50/50 dark:bg-slate-900/30 rounded-[2rem] border border-slate-100 dark:border-slate-800/50 min-h-[400px]">
            <div className="w-24 h-24 bg-primary-50 dark:bg-primary-900/20 rounded-full flex items-center justify-center mb-6 relative">
              <div className="absolute inset-0 border-4 border-white dark:border-slate-800 rounded-full blur-sm opacity-50 mix-blend-overlay"></div>
              <FileSearch size={36} className="text-primary-500 relative z-10" />
            </div>
            <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-3 tracking-tight">
              Knowledge Base Empty
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-center max-w-md text-sm leading-relaxed mb-8 font-medium">
              Start building your personal library. Create folders to organize, upload local files, or link to external assets.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button 
                onClick={() => openFolderModal()} 
                className="px-6 py-3 rounded-2xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold border border-slate-200 dark:border-slate-700 hover:border-primary-300 transition-colors shadow-sm"
              >
                Create Folder
              </button>
              <button 
                onClick={() => fileInputRef.current?.click()} 
                className="px-6 py-3 rounded-2xl bg-primary-500 hover:bg-primary-600 text-white font-bold transition-colors shadow-lg shadow-primary-500/20"
              >
                Upload File
              </button>
            </div>
          </div>
        )}
      </div>
      </div>

      <AnimatePresence>
        {selectedResourceDetail && (
          <ResourceDetailSidebar 
            selectedResourceDetail={selectedResourceDetail}
            setSelectedResourceDetail={setSelectedResourceDetail}
            updateResource={updateResource}
            courses={courses}
            videos={videos}
            projects={projects}
            assignments={assignments}
            notes={notes}
            folders={folders}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isFolderModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
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
