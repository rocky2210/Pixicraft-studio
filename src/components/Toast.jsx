import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, Info } from 'lucide-react';

const Toast = ({ message, type = 'info', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000); // Auto-close after 3 seconds

    return () => clearTimeout(timer);
  }, [onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle size={18} className="text-green-400" />;
      case 'error':
        return <AlertCircle size={18} className="text-red-400" />;
      default:
        return <Info size={18} className="text-blue-400" />;
    }
  };

  const getBgColor = () => {
    switch (type) {
      case 'success':
        return 'bg-neutral-800 border-green-500/30';
      case 'error':
        return 'bg-neutral-800 border-red-500/30';
      default:
        return 'bg-neutral-800 border-blue-500/30';
    }
  };

  return (
    <div
      className={`fixed bottom-12 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-2xl border ${getBgColor()} text-white animate-in slide-in-from-bottom-5 fade-in duration-300`}
    >
      {getIcon()}
      <span className="text-sm font-medium">{message}</span>
    </div>
  );
};

export default Toast;