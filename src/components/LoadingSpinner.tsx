import { memo } from 'react'
import './LoadingSpinner.css';

interface LoadingSpinnerProps {
  fullScreen?: boolean;
  size?: 'small' | 'medium' | 'large';
}

const LoadingSpinner = memo(function LoadingSpinner({ fullScreen = false, size = 'medium' }: LoadingSpinnerProps) {
  const sizeClasses = {
    small: { width: '12px', height: '12px', gap: '3px' },
    medium: { width: '16px', height: '16px', gap: '4px' },
    large: { width: '20px', height: '20px', gap: '5px' }
  };

  const containerClass = fullScreen 
    ? 'fixed top-0 left-0 w-full h-full bg-white flex justify-center items-center z-50'
    : 'flex justify-center items-center p-4';

  const { width, height, gap } = sizeClasses[size];

  return (
    <div className={containerClass}>
      <div className="brutalist-spinner" style={{ gap }}>
        <div 
          className="brutalist-block" 
          style={{ width, height }}
        ></div>
        <div 
          className="brutalist-block" 
          style={{ width, height }}
        ></div>
        <div 
          className="brutalist-block" 
          style={{ width, height }}
        ></div>
        <div 
          className="brutalist-block" 
          style={{ width, height }}
        ></div>
      </div>
    </div>
  );
})

export default LoadingSpinner