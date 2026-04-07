import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Eye } from 'lucide-react';

const NotePreview = ({ content }) => {
  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50 dark:bg-slate-900/50">
      <div className="flex items-center gap-2 p-3 lg:p-4 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
        <Eye size={16} className="text-primary-500" />
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Live Preview</span>
      </div>
      <div className="flex-1 p-8 lg:p-12 overflow-y-auto custom-scrollbar bg-white dark:bg-slate-900 shadow-inner">
        <div className="prose prose-slate dark:prose-invert max-w-none prose-sm lg:prose-base prose-headings:font-black prose-a:text-primary-500 prose-code:text-primary-500 prose-pre:bg-slate-900 prose-pre:rounded-2xl prose-pre:shadow-2xl">
          <ReactMarkdown>
            {content || '*No content to preview. Start typing in the editor.*'}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
};

export default NotePreview;
