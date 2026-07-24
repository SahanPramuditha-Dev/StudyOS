import React, { useState, useEffect } from 'react';
import { StorageService, STORAGE_KEYS } from '../services/storage';
import { Trash2, FileText, Image as ImageIcon, HardDrive } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const MediaManager = () => {
  const { user } = useAuth();
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    loadAssets();
  }, [user?.id]);

  const extractBase64Assets = (contentString) => {
    const assets = [];
    if (typeof contentString !== 'string') return assets;
    // Very naive regex for base64 images in markdown/html
    const regex = /data:(image\/[^;]+|application\/pdf);base64,([^"'\s\)\>]+)/g;
    let match;
    while ((match = regex.exec(contentString)) !== null) {
      assets.push({
        type: match[1].includes('pdf') ? 'pdf' : 'image',
        mime: match[1],
        data: match[2],
        fullString: match[0],
        sizeMB: (match[2].length * (3/4)) / (1024 * 1024)
      });
    }
    return assets;
  };

  const loadAssets = async () => {
    setLoading(true);
    try {
      const allAssets = [];
      
      const notes = await StorageService.getCollection(user.id, STORAGE_KEYS.NOTES) || [];
      notes.forEach(note => {
        if (note.content) {
          const extracted = extractBase64Assets(note.content);
          extracted.forEach(ast => {
            allAssets.push({
              ...ast,
              sourceId: note.id,
              sourceType: 'note',
              sourceTitle: note.title || 'Untitled Note'
            });
          });
        }
      });

      const resources = await StorageService.getCollection(user.id, STORAGE_KEYS.RESOURCES) || [];
      resources.forEach(res => {
        if (res.content) {
          const extracted = extractBase64Assets(res.content);
          extracted.forEach(ast => {
            allAssets.push({
              ...ast,
              sourceId: res.id,
              sourceType: 'resource',
              sourceTitle: res.title || 'Untitled Resource'
            });
          });
        }
      });

      // Sort by size descending
      allAssets.sort((a, b) => b.sizeMB - a.sizeMB);
      setAssets(allAssets);
    } catch (error) {
      console.error('Failed to load assets', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (asset) => {
    if (!window.confirm('Are you sure? This will remove the file permanently from the document.')) return;
    
    try {
      const collectionKey = asset.sourceType === 'note' ? STORAGE_KEYS.NOTES : STORAGE_KEYS.RESOURCES;
      const collection = await StorageService.getCollection(user.id, collectionKey);
      
      const itemIndex = collection.findIndex(item => item.id === asset.sourceId);
      if (itemIndex > -1) {
        // Remove the base64 string from content (and possibly surrounding markdown img syntax)
        // Here we do a simple string replace for the data URI
        collection[itemIndex].content = collection[itemIndex].content.replace(asset.fullString, '');
        
        await StorageService.saveCollection(user.id, collectionKey, collection);
        toast.success('Asset deleted successfully');
        loadAssets(); // Reload
      }
    } catch (e) {
      toast.error('Failed to delete asset');
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500 font-bold">Scanning personal storage...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
        {assets.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-400">
            <HardDrive size={32} className="mx-auto mb-4 opacity-50" />
            <p>No large media assets found in your notes or resources.</p>
          </div>
        )}
        
        {assets.map((asset, idx) => (
          <div key={idx} className="relative group rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 aspect-square flex flex-col shadow-sm">
            <div className="flex-1 flex items-center justify-center bg-slate-100 dark:bg-slate-900/50 p-4 relative overflow-hidden">
              {asset.type === 'image' ? (
                <img src={asset.fullString} alt="Asset" className="max-h-full max-w-full object-contain rounded-lg" />
              ) : (
                <FileText size={48} className="text-slate-400" />
              )}
            </div>
            
            <div className="p-3 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700/50">
              <p className="text-xs font-bold truncate text-slate-800 dark:text-slate-200">{asset.sourceTitle}</p>
              <p className="text-[10px] text-slate-500 flex justify-between mt-1">
                <span className="uppercase tracking-widest">{asset.sourceType}</span>
                <span className="font-bold">{asset.sizeMB.toFixed(2)} MB</span>
              </p>
            </div>

            <button
              onClick={() => handleDelete(asset)}
              className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-xl opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-600"
              title="Delete Asset"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MediaManager;
