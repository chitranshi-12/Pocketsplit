import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ size = 'md', showTagline = false }) => {
  const textSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl',
  };

  return (
    <div className="flex flex-col select-none">
      <div className={`font-black tracking-tight text-slate-900 dark:text-white ${textSizes[size]}`}>
        Pocket<span className="text-emerald-500 font-black">split</span>
      </div>
      {showTagline && (
        <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
          Split bills, not friendships
        </span>
      )}
    </div>
  );
};
