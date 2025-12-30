import { useState, useCallback, useRef } from 'react';

export const useConfirmModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState({
    title: 'Confirm Action',
    message: 'Are you sure you want to proceed?',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    variant: 'danger',
  });
  const [isLoading, setIsLoading] = useState(false);
  const resolveRef = useRef(null);

  const show = useCallback(({ 
    title, 
    message, 
    confirmText, 
    cancelText, 
    variant
  }) => {
    return new Promise((resolve) => {
      setConfig({
        title: title || 'Confirm Action',
        message: message || 'Are you sure you want to proceed?',
        confirmText: confirmText || 'Confirm',
        cancelText: cancelText || 'Cancel',
        variant: variant || 'danger',
      });
      resolveRef.current = resolve;
      setIsOpen(true);
    });
  }, []);

  const hide = useCallback(() => {
    if (!isLoading) {
      setIsOpen(false);
      setIsLoading(false);
      if (resolveRef.current) {
        resolveRef.current(false);
        resolveRef.current = null;
      }
    }
  }, [isLoading]);

  const handleConfirm = useCallback(async () => {
    setIsLoading(true);
    try {
      setIsOpen(false);
      if (resolveRef.current) {
        resolveRef.current(true);
        resolveRef.current = null;
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isOpen,
    onClose: hide,
    onConfirm: handleConfirm,
    title: config.title,
    message: config.message,
    confirmText: config.confirmText,
    cancelText: config.cancelText,
    variant: config.variant,
    isLoading,
    show,
    hide,
  };
};
