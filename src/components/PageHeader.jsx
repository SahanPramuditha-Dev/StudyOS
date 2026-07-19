import React from 'react';

const PageHeader = ({
  title,
  description = '',
  icon,
  action = null,
  iconClassName = 'bg-primary-500 text-white shadow-xl shadow-primary-500/20',
  className = ''
}) => {
  return (
    <div className={`flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between ${className}`.trim()}>
      <div className="flex gap-4 items-center">
        <div className={`p-3 rounded-[1.5rem] shrink-0 flex items-center justify-center ${iconClassName}`}>
          {icon}
        </div>
        <div className="space-y-1">
          <h1 className="text-3xl md:text-4xl font-black text-slate-800 dark:text-white">
            {title}
          </h1>
          {description && (
            <p className="text-slate-400 font-medium">
              {description}
            </p>
          )}
        </div>
      </div>

      {action && (
        <div className="shrink-0">
          {action}
        </div>
      )}
    </div>
  );
};

export default PageHeader;
