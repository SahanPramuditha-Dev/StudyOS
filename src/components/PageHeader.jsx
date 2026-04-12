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
    <div className={`flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between ${className}`.trim()}>
      <div className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-black text-slate-800 dark:text-white flex items-center gap-4">
          <div className={`p-3 rounded-[1.5rem] ${iconClassName}`}>
            {icon}
          </div>
          {title}
        </h1>
        {description && (
          <p className="text-slate-400 font-medium md:ml-20">
            {description}
          </p>
        )}
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
