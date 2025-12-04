import './Loading.css';

interface LoadingProps {
  size?: 'small' | 'medium' | 'large';
  text?: string;
}

/**
 * Loading spinner component
 * Requirement 4.3: Provide visual feedback during loading states
 */
export function Loading({ size = 'medium', text }: LoadingProps) {
  return (
    <div className="loading-container">
      <div className={`loading-spinner loading-spinner-${size}`}>
        <div className="spinner-circle"></div>
      </div>
      {text && <p className="loading-text">{text}</p>}
    </div>
  );
}
