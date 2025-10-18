
import React from 'react';

interface ConfidenceBadgeProps {
  score: number;
}

const ConfidenceBadge: React.FC<ConfidenceBadgeProps> = ({ score }) => {
  const getColor = () => {
    if (score > 85) return 'bg-green-500/80 border-green-400/50';
    if (score > 60) return 'bg-yellow-500/80 border-yellow-400/50';
    return 'bg-red-500/80 border-red-400/50';
  };

  return (
    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold text-white backdrop-blur-sm border ${getColor()}`}>
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-current"></span>
      </span>
      {score}% ID Confidence
    </div>
  );
};

export default ConfidenceBadge;
