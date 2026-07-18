import React, { Fragment } from 'react';
import { Listbox, Transition } from '@headlessui/react';
import { Check, ChevronDown } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function Select({ 
  value, 
  onChange, 
  options = [], 
  className = '', 
  placeholder = 'Select an option',
  disabled = false,
  variant = 'default',
}) {
  const selectedOption = options.find(opt => opt.value === value) || null;

  const buttonClasses = {
    default: clsx(
      "px-4 py-2.5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800/60 rounded-xl shadow-sm hover:border-blue-500/30",
      "text-sm font-medium text-slate-800 dark:text-slate-200",
      "focus:ring-2 focus:ring-blue-500/20"
    ),
    ghost: clsx(
      "px-1 py-1 bg-transparent border-none shadow-none",
      "text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white",
      "focus:ring-0"
    )
  };

  return (
    <Listbox value={value} onChange={onChange} disabled={disabled}>
      <div className={twMerge("relative z-[99]", className)}>
        <Listbox.Button
          className={({ open }) => clsx(
            "relative w-full flex items-center justify-between gap-2 transition-all duration-200 outline-none",
            buttonClasses[variant],
            disabled && "opacity-50 cursor-not-allowed",
            open && variant === 'default' && "border-blue-500/50 dark:border-blue-500/50 ring-2 ring-blue-500/10",
            open && variant === 'ghost' && "text-slate-900 dark:text-white"
          )}
        >
          <span className="block truncate text-left w-full">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown
            className={clsx(
              "pointer-events-none shrink-0 transition-transform duration-200",
              variant === 'ghost' ? "w-3 h-3 text-slate-400" : "w-4 h-4 text-slate-400"
            )}
            style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
            aria-hidden="true"
          />
        </Listbox.Button>
        <Transition
          as={Fragment}
          enter="transition ease-out duration-200"
          enterFrom="opacity-0 translate-y-2 scale-95"
          enterTo="opacity-100 translate-y-0 scale-100"
          leave="transition ease-in duration-150"
          leaveFrom="opacity-100 translate-y-0 scale-100"
          leaveTo="opacity-0 translate-y-1 scale-95"
        >
          <Listbox.Options
            anchor="bottom start"
            className={clsx(
              "absolute mt-2 max-h-60 w-[max-content] min-w-[var(--button-width)] overflow-auto rounded-xl p-1",
              "bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl",
              "border border-slate-200/50 dark:border-slate-800/50",
              "shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.3)]",
              "focus:outline-none z-[9999] text-sm",
              "scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700",
              variant === 'ghost' && "left-0"
            )}
          >
            {options.map((option, idx) => (
              <Listbox.Option
                key={option.value || idx}
                className={({ active }) => clsx(
                  "relative cursor-pointer select-none py-2.5 pl-10 pr-4 rounded-lg transition-colors",
                  active ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400" : "text-slate-700 dark:text-slate-300"
                )}
                value={option.value}
              >
                {({ selected, active }) => (
                  <>
                    <span className={clsx("block truncate", selected ? "font-semibold" : "font-medium")}>
                      {option.label}
                    </span>
                    {selected ? (
                      <span className={clsx(
                        "absolute inset-y-0 left-0 flex items-center pl-3",
                        active ? "text-blue-600 dark:text-blue-400" : "text-blue-500"
                      )}>
                        <Check className="w-4 h-4" aria-hidden="true" />
                      </span>
                    ) : null}
                  </>
                )}
              </Listbox.Option>
            ))}
          </Listbox.Options>
        </Transition>
      </div>
    </Listbox>
  );
}

export default Select;
