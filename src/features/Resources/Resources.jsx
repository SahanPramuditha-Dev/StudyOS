import React, { useState, useRef, useMemo, useCallback } from 'react';
import { 
  FolderOpen, 
  ChevronRight, 
  ArrowLeft,
  BookOpen,
  Youtube,
  Layers,
  FileSearch
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
  
  // 1. State Management
  const [resources, setResources] = useStorage(STORAGE_KEYS.RESOURCES, []);
  const [folders, setFolders] = useStorage(STORAGE_KEYS.FOLDERS, []);
  const [courses] = useStorage(STORAGE_KEYS.COURSES, []);
  const [videos] = useStorage(STORAGE_KEYS.VIDEOS, []);

  const [currentFolderId, setCurrentFolderId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [groupBy, setGroupBy] = useState('type'); // 'type' | 'course' | 'video' | 'folder'
  
  const [isResourceModalOpen, setIsResourceModalOpen] = useState(false);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadFileName, setUploadFileName] = useState('');
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

  // 2. Search & Filtering (Derived State)
  const filteredData = useMemo(() => {
    const query = searchTerm.toLowerCase().trim();
    
    const fResources = resources.filter(r => 
      r.name.toLowerCase().includes(query) ||
      r.description?.toLowerCase().includes(query) ||
      r.tags?.some(t => t.toLowerCase().includes(query))
    );

    const fFolders = folders.filter(f => 
      f.name.toLowerCase().includes(query)
    );

    return { resources: fResources, folders: fFolders };
  }, [resources, folders, searchTerm]);

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

  const handleFileUpload = useCallback((e) => {
    const file = e.target.files[0];
    if (!file || !user) return;

    setIsUploading(true);
    setUploadProgress(0);
    setUploadFileName(file.name);

    const fileName = `${nanoid()}_${file.name}`;
    const storageRef = ref(firebaseStorage, `users/${user.id}/resources/${fileName}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on('state_changed', 
      (snapshot) => setUploadProgress(Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100)),
      (err) => { toast.error("Sync failed"); setIsUploading(false); },
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        const resourceType = file.type.includes('pdf') ? 'PDF' : 
                            file.type.includes('presentation') || file.name.endsWith('.pptx') ? 'Slides' :
                            file.type.includes('word') || file.name.endsWith('.docx') ? 'Docs' : 'File';
        
        const uploadedResource = {
          id: nanoid(),
          name: file.name,
          url: downloadURL,
          type: resourceType,
          isLocal: true,
          size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
          folderId: currentFolderId,
          createdAt: new Date().toISOString(),
          tags: [],
          description: '',
          associatedType: 'None',
          associatedId: '',
          storagePath: storageRef.fullPath
        };

        setResources([uploadedResource, ...resources]);
        setIsUploading(false);
        toast.success('Cloud sync complete');
      }
    );
  }, [user, currentFolderId, resources, setResources]);

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

  return (
    <div className="max-w-7xl mx-auto pb-12">
      {/* Header Title Section */}
      <div className="mb-12 space-y-2">
        <h1 className="text-4xl font-black text-slate-800 dark:text-white flex items-center gap-4">
          <div className="p-3 rounded-[1.5rem] bg-primary-500 text-white shadow-xl shadow-primary-500/20">
            <Layers size={32} />
          </div>
          Knowledge Base
        </h1>
        <p className="text-slate-400 font-bold ml-20 uppercase tracking-widest text-xs">Manage your learning assets and associations</p>
      </div>

      <ResourceFilter 
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        groupBy={groupBy}
        setGroupBy={setGroupBy}
        onNewFolder={() => setIsFolderModalOpen(true)}
        onUpload={() => fileInputRef.current?.click()}
        onAddLink={() => setIsResourceModalOpen(true)}
        isUploading={isUploading}
        itemCount={resources.length}
      />

      <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />

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

      {/* Grouped Resource Display */}
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

        {resources.length === 0 && (
          <div className="py-32 text-center space-y-6 bg-white dark:bg-slate-900 rounded-[3rem] border-2 border-dashed border-slate-100 dark:border-slate-800">
            <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800/50 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-inner">
              <FileSearch size={48} className="text-slate-200 dark:text-slate-700" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-slate-800 dark:text-white">Empty Repository</h3>
              <p className="text-slate-400 max-w-sm mx-auto">Upload documents or link external research to build your master knowledge base.</p>
            </div>
            <button 
              onClick={() => setIsResourceModalOpen(true)}
              className="px-8 py-4 rounded-2xl bg-primary-500 text-white font-black hover:bg-primary-600 shadow-xl shadow-primary-500/20 transition-all active:scale-95"
            >
              Add First Asset
            </button>
          </div>
        )}
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
