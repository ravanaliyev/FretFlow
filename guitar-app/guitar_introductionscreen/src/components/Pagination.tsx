import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  const canGoPrev = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-center gap-4 mt-8"
    >
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={!canGoPrev}
        className={`glass-panel px-4 py-3 rounded-xl flex items-center gap-2 transition-all ${
          canGoPrev
            ? 'hover:bg-white/10 cursor-pointer text-white'
            : 'opacity-40 cursor-not-allowed text-gray-500'
        }`}
      >
        <ChevronLeft className="w-5 h-5" />
        <span className="font-medium">Previous</span>
      </button>

      <div className="flex items-center gap-2">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`w-10 h-10 rounded-xl font-bold transition-all ${
              page === currentPage
                ? 'bg-primary-500 text-dark-900 shadow-[0_0_15px_rgba(57,255,20,0.4)]'
                : 'glass-panel hover:bg-white/10 text-gray-400 hover:text-white'
            }`}
          >
            {page}
          </button>
        ))}
      </div>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={!canGoNext}
        className={`glass-panel px-4 py-3 rounded-xl flex items-center gap-2 transition-all ${
          canGoNext
            ? 'hover:bg-white/10 cursor-pointer text-white'
            : 'opacity-40 cursor-not-allowed text-gray-500'
        }`}
      >
        <span className="font-medium">Next</span>
        <ChevronRight className="w-5 h-5" />
      </button>
    </motion.div>
  );
};

export default Pagination;