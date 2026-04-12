import React from 'react';

const EmptyState = ({
  icon,
  title,
  description = '',
  actions = null,
  compact = false,
  className = '',
  cardClassName = ''
}) => {
  const iconShell = compact
    ? 'w-16 h-16 rounded-3xl'
    : 'w-24 h-24 rounded-[2.5rem]';
  const titleClass = compact
    ? 'font-bold text-slate-800 dark:text-white'
    : 'text-2xl font-black text-slate-800 dark:text-white';
  const descriptionClass = compact
    ? 'text-xs text-slate-400'
    : 'text-sm text-slate-400 max-w-sm mx-auto';

  return (
    <div
      className={`text-center space-y-4 bg-white dark:bg-slate-900 rounded-[2.5rem] border-2 border-dashed border-slate-100 dark:border-slate-800 ${compact ? 'py-24' : 'py-20'} ${className}`.trim()}
    >
      <div className={`${iconShell} bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center mx-auto text-slate-300 shadow-inner`}>
        {icon}
      </div>
      <div className={`space-y-1 ${compact ? 'px-6' : ''} ${cardClassName}`.trim()}>
        <p className={titleClass}>{title}</p>
        {description && <p className={descriptionClass}>{description}</p>}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center justify-center gap-2">
          {actions}
        </div>
      )}
    </div>
  );
};

export default EmptyState;
