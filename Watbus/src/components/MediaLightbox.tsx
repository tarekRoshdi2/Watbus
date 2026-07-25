/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface MediaLightboxProps {
  imageUrl: string | null;
  onClose: () => void;
}

export default function MediaLightbox({ imageUrl, onClose }: MediaLightboxProps) {
  return (
    <AnimatePresence>
      {imageUrl && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 p-4"
        >
          {/* Top Header */}
          <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4 text-white">
            <span className="text-sm font-medium">Shared Image View</span>
            <button
              onClick={onClose}
              className="rounded-full p-2 hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Close image expand"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Main Image Body */}
          <motion.img
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            src={imageUrl}
            alt="Expanded shared chat media"
            className="max-w-full max-h-[85vh] rounded-lg shadow-2xl object-contain"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
