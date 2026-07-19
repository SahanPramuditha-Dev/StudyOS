import React, { useRef, useState } from 'react';
import Toolbar from './Toolbar';
import AIToolbar from './AIToolbar';
import { summarizeText, explainText, fixGrammar, generateFlashcards, expandText } from '../../../services/aiService';
import toast from 'react-hot-toast';

const NoteEditor = ({ content, onChange, onToolbarAction }) => {
  const textareaRef = useRef(null);
  const [isProcessing, setIsProcessing] = useState(false);

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

  const handleAIAction = async (action) => {
    if (!textareaRef.current || isProcessing) return;
    
    const { selectionStart, selectionEnd } = textareaRef.current;
    const hasSelection = selectionStart !== selectionEnd;
    const targetText = hasSelection 
      ? content.substring(selectionStart, selectionEnd)
      : content;
      
    if (!targetText.trim()) {
      toast.error('No text to process. Please write something or select text first.');
      return;
    }

    setIsProcessing(true);
    let result = '';
    
    try {
      switch (action) {
        case 'summarize':
          result = await summarizeText(targetText);
          break;
        case 'explain':
          result = await explainText(targetText);
          break;
        case 'expand':
          result = await expandText(targetText);
          break;
        case 'grammar':
          result = await fixGrammar(targetText);
          break;
        case 'flashcards':
          result = await generateFlashcards(targetText);
          break;
        default:
          return;
      }
      
      const before = content.substring(0, selectionStart);
      const after = content.substring(selectionEnd);
      
      let newContent = '';
      if (hasSelection) {
        // If text was selected, replace it with the AI result
        newContent = `${before}${result}${after}`;
      } else {
        // If no text selected, append the AI result at the end
        newContent = `${content}\n\n---\n**AI ${action}:**\n${result}\n`;
      }
      
      onChange(newContent);
      toast.success('AI processing complete');
      
    } catch (error) {
      console.error(error);
      toast.error('AI processing failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const insertImageMarkdown = (base64, filename) => {
    if (!textareaRef.current) return;
    const { selectionStart, selectionEnd } = textareaRef.current;
    const before = content.substring(0, selectionStart);
    const after = content.substring(selectionEnd);
    const imageMarkdown = `\n![${filename}](${base64})\n`;
    
    onChange(`${before}${imageMarkdown}${after}`);
    
    setTimeout(() => {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(
        selectionStart + imageMarkdown.length,
        selectionStart + imageMarkdown.length
      );
    }, 0);
  };

  const handleImageFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      insertImageMarkdown(e.target.result, file.name || 'image');
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleImageFile(e.dataTransfer.files[0]);
    }
  };

  const handlePaste = (e) => {
    if (e.clipboardData.files && e.clipboardData.files.length > 0) {
      handleImageFile(e.clipboardData.files[0]);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-white dark:bg-slate-900">
      <AIToolbar onAction={handleAIAction} isProcessing={isProcessing} />
      <Toolbar onAction={handleToolbarAction} />
      <div className="flex-1 p-6 lg:p-10 overflow-y-auto custom-scrollbar">
        <textarea 
          ref={textareaRef}
          className="w-full h-full bg-transparent border-none outline-none focus:outline-none focus:ring-0 resize-none font-mono text-slate-700 dark:text-slate-300 text-base lg:text-lg leading-relaxed placeholder:text-slate-300 dark:placeholder:text-slate-700"
          placeholder="Start writing your thoughts in Markdown...\nYou can paste or drag & drop images here."
          value={content}
          onChange={(e) => onChange(e.target.value)}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onPaste={handlePaste}
        />
      </div>
    </div>
  );
};

export default NoteEditor;
