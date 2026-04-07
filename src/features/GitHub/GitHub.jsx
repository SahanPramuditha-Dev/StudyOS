import React, { useState } from 'react';
import { Plus, Github as GithubIcon, Trash2, ExternalLink, Code, Activity, Star, GitBranch } from 'lucide-react';
import { useStorage } from '../../hooks/useStorage';
import { STORAGE_KEYS } from '../../services/storage';
import { nanoid } from 'nanoid';

const GitHub = () => {
  const [projects, setProjects] = useStorage(STORAGE_KEYS.PROJECTS, []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', repo: '', stack: '', status: 'Active' });

  const addProject = (e) => {
    e.preventDefault();
    setProjects([...projects, { ...newProject, id: nanoid() }]);
    setIsModalOpen(false);
    setNewProject({ name: '', repo: '', stack: '', status: 'Active' });
  };

  return (
    <div className="max-w-7xl mx-auto pb-12 space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
          <GithubIcon size={32} />
          GitHub Project Manager
        </h2>
        <button onClick={() => setIsModalOpen(true)} className="px-6 py-2.5 rounded-xl bg-slate-900 text-white font-bold flex items-center gap-2 shadow-lg shadow-slate-900/20">
          <Plus size={20} /> Add Project
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {projects.map(project => (
          <div key={project.id} className="card p-8 border-slate-100 hover:border-slate-200 transition-all">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-700">
                  <Code size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800">{project.name}</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{project.stack}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                  project.status === 'Active' ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'
                }`}>
                  {project.status}
                </span>
                <button onClick={() => setProjects(projects.filter(p => p.id !== project.id))} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="flex flex-col items-center p-3 rounded-2xl bg-slate-50">
                <Star size={16} className="text-orange-400 mb-1" />
                <span className="text-xs font-bold text-slate-800">12</span>
                <span className="text-[10px] text-slate-400 font-bold uppercase">Stars</span>
              </div>
              <div className="flex flex-col items-center p-3 rounded-2xl bg-slate-50">
                <GitBranch size={16} className="text-blue-400 mb-1" />
                <span className="text-xs font-bold text-slate-800">4</span>
                <span className="text-[10px] text-slate-400 font-bold uppercase">Forks</span>
              </div>
              <div className="flex flex-col items-center p-3 rounded-2xl bg-slate-50">
                <Activity size={16} className="text-green-400 mb-1" />
                <span className="text-xs font-bold text-slate-800">Active</span>
                <span className="text-[10px] text-slate-400 font-bold uppercase">Health</span>
              </div>
            </div>

            <a href={project.repo} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 transition-all">
              <GithubIcon size={18} /> View Repository
            </a>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 w-full max-w-lg shadow-2xl space-y-6 border dark:border-slate-800">
            <h2 className="text-2xl font-bold dark:text-white">Add GitHub Project</h2>
            <form onSubmit={addProject} className="space-y-4">
              <input required className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 ring-primary-500/20" placeholder="Project Name" value={newProject.name} onChange={e => setNewProject({...newProject, name: e.target.value})} />
              <input required className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 ring-primary-500/20" placeholder="Repository URL" value={newProject.repo} onChange={e => setNewProject({...newProject, repo: e.target.value})} />
              <input required className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 ring-primary-500/20" placeholder="Tech Stack (e.g. Next.js, Tailwind)" value={newProject.stack} onChange={e => setNewProject({...newProject, stack: e.target.value})} />
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-800 font-bold text-slate-600 dark:text-slate-400 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 py-3 rounded-xl bg-slate-900 dark:bg-slate-800 text-white font-bold hover:bg-slate-800 dark:hover:bg-slate-700 transition-all">Add Project</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GitHub;
