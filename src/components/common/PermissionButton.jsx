import React from 'react';
import { Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const PermissionButton = ({
  module,
  action,
  children,
  onClick,
  className = '',
  disabled = false,
  tooltip,
  ...props
}) => {
  const { hasPermission, profile, isAdmin } = useAuth();

  const moduleGranted = module ? hasPermission(module) : true;
  const actionGranted = action && profile?.actions ? profile.actions.includes(action) : true;
  
  const isPermitted = isAdmin || (moduleGranted && actionGranted);

  if (!isPermitted) {
    return (
      <button
        disabled
        title={tooltip || `Requires ${action || 'access'} permission for ${module || 'this action'}`}
        className={`opacity-50 cursor-not-allowed flex items-center gap-1.5 ${className}`}
        {...props}
      >
        <Lock size={12} className="text-amber-500" />
        {children}
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={className}
      {...props}
    >
      {children}
    </button>
  );
};

export default PermissionButton;
