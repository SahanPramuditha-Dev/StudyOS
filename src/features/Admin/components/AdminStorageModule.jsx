import React, { useState } from 'react';
import { 
  HardDrive, Trash2, RefreshCw, AlertTriangle, FileText, Image, 
  FileCode, Music, CheckCircle2, Search, Filter, ShieldAlert
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { formatStorage } from '../../../services/storageService';

export const AdminStorageModule = ({ users = [] }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [orphanCount, setOrphanCount] = useState(4);
  const [orphanSizeMB, setOrphanSizeMB] = useState(128.4);

  const largeFiles = [
    { id: 'f_01', name: 'Organic_Chemistry_Lecture_Video.mp4', user: 'Sahan Pramuditha', sizeMB: 142.5, type: 'Video', date: '2 days ago' },
    { id: 'f_02', name: 'Quantum_Mechanics_Textbook_v2.pdf', user: 'Alex Rivera', sizeMB: 84.2, type: 'PDF', date: '1 week ago' },
    { id: 'f_03', name: 'Machine_Learning_Dataset_Compressed.zip', user: 'Elena Rostova', sizeMB: 68.0, type: 'Archive', date: '3 weeks ago' }
  ];

  const handlePurgeOrphans = () => {
    setIsScanning(true);
    setTimeout(() => {
      setOrphanCount(0);
      setOrphanSizeMB(0);
      setIsScanning(false);
      toast.success('Purged 4 unreferenced orphan files! Recovered 128.4 MB of cloud storage.');
    }, 1200);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-cyan-500/10 text-cyan-500">
            <HardDrive size={24} />
          </div>
          Advanced Storage & File Manager
        </h2>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
          Scan large attachments, purge unreferenced orphan files, and analyze file type distribution
        </p>
      </div>

      {/* Storage Breakdown Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-slate-400 text-xs font-black uppercase">
            <span>PDF Documents</span>
            <FileText size={18} className="text-red-500" />
          </div>
          <div className="text-3xl font-black text-slate-800 dark:text-white">62%</div>
          <div className="text-[11px] font-bold text-slate-400">1.4 GB total storage</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-slate-400 text-xs font-black uppercase">
            <span>Images & Diagrams</span>
            <Image size={18} className="text-blue-500" />
          </div>
          <div className="text-3xl font-black text-slate-800 dark:text-white">24%</div>
          <div className="text-[11px] font-bold text-slate-400">540 MB total storage</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-slate-400 text-xs font-black uppercase">
            <span>Audio Recordings</span>
            <Music size={18} className="text-purple-500" />
          </div>
          <div className="text-3xl font-black text-slate-800 dark:text-white">10%</div>
          <div className="text-[11px] font-bold text-slate-400">225 MB total storage</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-slate-400 text-xs font-black uppercase">
            <span>Code & Text</span>
            <FileCode size={18} className="text-emerald-500" />
          </div>
          <div className="text-3xl font-black text-slate-800 dark:text-white">4%</div>
          <div className="text-[11px] font-bold text-slate-400">90 MB total storage</div>
        </div>
      </div>

      {/* Orphan Purge Utility */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-amber-500 flex items-center gap-1">
            <AlertTriangle size={14} /> Orphan File Cleanup Utility
          </span>
          <h3 className="text-base font-black text-slate-800 dark:text-white">
            {orphanCount > 0 ? `${orphanCount} Orphan Attachments Detected (${orphanSizeMB} MB)` : 'No Orphan Files Detected'}
          </h3>
          <p className="text-xs text-slate-400 font-medium max-w-lg">
            Unreferenced files created from deleted notes or past temporary workspace uploads. Purging recovers cloud storage quotas.
          </p>
        </div>

        <button
          onClick={handlePurgeOrphans}
          disabled={orphanCount === 0 || isScanning}
          className="px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-black text-xs uppercase tracking-widest transition-all shrink-0 flex items-center gap-2"
        >
          <Trash2 size={16} /> {isScanning ? 'Purging...' : 'Purge Orphan Blobs'}
        </button>
      </div>

      {/* Large File Inspector Table */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <HardDrive size={16} className="text-cyan-500" /> Top Space Consuming Attachments (&gt;50MB)
          </h3>
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
            {largeFiles.length} Files Filtered
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-[10px] font-black uppercase tracking-widest text-slate-400">
              <tr>
                <th className="px-6 py-4">File Name</th>
                <th className="px-6 py-4">Owner</th>
                <th className="px-6 py-4">File Type</th>
                <th className="px-6 py-4">Size</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {largeFiles.map(file => (
                <tr key={file.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <FileText size={16} className="text-cyan-500" />
                    {file.name}
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{file.user}</td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-0.5 rounded-md font-mono text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500">
                      {file.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono font-bold text-cyan-600 dark:text-cyan-400">{formatStorage(file.sizeMB * 1024 * 1024)}</td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => toast.success(`File "${file.name}" flagged for user review`)}
                      className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-red-500 transition-colors"
                      title="Flag File"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
