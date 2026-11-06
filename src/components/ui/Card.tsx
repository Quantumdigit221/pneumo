import React, { ElementType } from 'react';
import { TrendingUp, TrendingDown, Divide } from 'lucide-react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div className={`bg-white border border-slate-100 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow ${className}`}>
      {children}
    </div>
  );
};

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ElementType;
  trend?: string;
  trendType?: 'up' | 'down' | 'warning' | 'neutral';
  iconColor?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  trend,
  trendType = 'neutral',
  iconColor = 'bg-slate-100',
  size = 'md'
}) => {
  const getTrendColor = () => {
    switch (trendType) {
      case 'up':
        return 'text-emerald-600 bg-emerald-50';
      case 'down':
        return 'text-red-600 bg-red-50';
      case 'warning':
        return 'text-amber-600 bg-amber-50';
      default:
        return 'text-slate-500 bg-slate-50';
    }
  };

  const getTrendIcon = () => {
    if (trendType === 'up') return <TrendingUp className="w-3.5 h-3.5 mr-0.5 inline" />;
    if (trendType === 'down') return <TrendingDown className="w-3.5 h-3.5 mr-0.5 inline" />;
    return null;
  };

  return (
    <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm flex items-start justify-between hover:shadow-md transition-shadow">
      <div className="flex-1">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
          {title}
        </span>
        <h3 className="text-2xl font-bold text-slate-800 tracking-tight leading-none mb-2">
          {value}
        </h3>
        {trend && (
          <div className="flex items-center">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getTrendColor()}`}>
              {getTrendIcon()}
              {trend}
            </span>
          </div>
        )}
      </div>
      <div className={`p-3 rounded-lg flex items-center justify-center ${iconColor} text-slate-700`}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
  );
};
