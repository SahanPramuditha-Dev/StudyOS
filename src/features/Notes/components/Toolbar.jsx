import React from 'react';
import { 
  Bold, 
  Italic, 
  List, 
  ListOrdered, 
  Code, 
  Link, 
  Heading1, 
  Heading2, 
  Quote, 
  Minus 
} from 'lucide-react';

const Toolbar = ({ onAction }) => {
  const tools = [
    { icon: Heading1, action: '# ', label: 'H1' },
    { icon: Heading2, action: '## ', label: 'H2' },
    { icon: Bold, action: '**', label: 'Bold' },
    { icon: Italic, action: '*', label: 'Italic' },
    { icon: List, action: '- ', label: 'List' },
    { icon: ListOrdered, action: '1. ', label: 'Ordered List' },
    { icon: Code, action: '```\n\n```', label: 'Code Block' },
    { icon: Link, action: '[text](url)', label: 'Link' },
    { icon: Quote, action: '> ', label: 'Quote' },
    { icon: Minus, action: '\n---\n', label: 'Horizontal Rule' },
  ];

  return (
    <div className="flex flex-wrap items-center gap-1.5 p-3 lg:p-4 bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
      {tools.map((tool, idx) => (
        <button
          key={idx}
          onClick={() => onAction(tool.action)}
          className="p-2 rounded-xl text-slate-500 hover:text-primary-500 hover:bg-white dark:hover:bg-slate-800 transition-all shadow-sm hover:shadow-md active:scale-95 group"
          title={tool.label}
        >
          <tool.icon size={16} className="group-hover:scale-110 transition-transform" />
        </button>
      ))}
    </div>
  );
};

export default Toolbar;
