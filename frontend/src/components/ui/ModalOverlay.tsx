/**
 * ModalOverlay — Full-screen backdrop + spring-animated content container.
 *
 * Usage:
 *   <ModalOverlay>
 *     <div className="...">modal content</div>
 *   </ModalOverlay>
 *
 * Locks body scroll while mounted and provides a blurred backdrop
 * at z-[999] so it sits above everything including sticky bars.
 */

import { useEffect, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ModalOverlayProps {
  children: ReactNode;
  /** If provided, clicking the backdrop fires this callback. */
  onBackdropClick?: () => void;
}

export function ModalOverlay({ children, onBackdropClick }: ModalOverlayProps) {
  // Lock body scroll while the modal is mounted
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev || 'unset';
    };
  }, []);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4"
        onClick={(e) => {
          // Only fire if user clicked the backdrop itself, not the modal content
          if (e.target === e.currentTarget && onBackdropClick) {
            onBackdropClick();
          }
        }}
      >
        <motion.div
          initial={{ scale: 0.85, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.85, opacity: 0, y: 20 }}
          transition={{
            type: 'spring',
            damping: 25,
            stiffness: 300,
          }}
        >
          {children}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
