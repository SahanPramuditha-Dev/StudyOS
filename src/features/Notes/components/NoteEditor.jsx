import React, { useRef } from 'react';
import Toolbar from './Toolbar';

const NoteEditor = ({ content, onChange, onToolbarAction }) => {
  const textareaRef = useRef(null);

  const handleToolbarAction = (action) => {
    if (!textareaRef.current) return;
    
    const { selectionStart, selectionEnd } = textareaRef.current;
    const before = content.substring(0, selectionStart);
    const after = content.substring(selectionEnd);
    const selected = content.substring(selectionStart, selectionEnd);
    
    let newContent = '';
    let newCursorPos = 0;

    if (['**', '*', '```\n\n```'].includes(action)) {
      newContent = `${before}${action}${selected}${action}${after}`;
      newCursorPos = selectionStart + action.length + selected.length + action.length;
    } else {
      newContent = `${before}${action}${selected}${after}`;
      newCursorPos = selectionStart + action.length + selected.length;
    }

    onChange(newContent);
    
    // Focus and set cursor position after render
    setTimeout(() => {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-white dark:bg-slate-900">
      <Toolbar onAction={handleToolbarAction} />
      <div className="flex-1 p-6 lg:p-10 overflow-y-auto custom-scrollbar">
        <textarea 
          ref={textareaRef}
          className="w-full h-full bg-transparent border-none focus:ring-0 resize-none font-mono text-slate-700 dark:text-slate-300 text-base lg:text-lg leading-relaxed placeholder:text-slate-300 dark:placeholder:text-slate-700"
          placeholder="Start writing your thoughts in Markdown..."
          value={content}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </div>
  );
};

export default NoteEditor;
