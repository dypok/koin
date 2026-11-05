import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

interface ModalPortalProps {
  children: React.ReactNode;
}

/**
 * ModalPortal renders modal dialogs directly into document.body.
 * This ensures the backdrop overlay covers 100% of the viewport (full width & height),
 * escaping any ancestor transforms, CSS animations, or layout stacking contexts.
 */
export const ModalPortal: React.FC<ModalPortalProps> = ({ children }) => {
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  if (typeof document === 'undefined') {
    return null;
  }

  return createPortal(children, document.body);
};
