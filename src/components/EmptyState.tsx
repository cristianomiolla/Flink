import React from 'react';
import './EmptyState.css';

interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = ''
}) => {
  return (
    <div className={`empty-state ${className}`}>
      <div className="empty-content">
        <div className="empty-icon">{icon}</div>
        <h3 className="empty-title">{title}</h3>
        <p className="empty-description">{description}</p>
        {action && <div className="empty-action">{action}</div>}
      </div>
    </div>
  );
};

export default EmptyState;