import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Search, Music, ChevronUp, ChevronDown, Edit2, CheckCircle, Lock, PlayCircle, Plus } from 'lucide-react';
import type { Lesson } from '../Dashboard';

/**
 * Properties for the LessonGrid component.
 * @property navigate - Callback for UI screen routing.
 * @property searchTerm - Text input search query for filtering lessons.
 * @property setSearchTerm - Setter function updating search query state.
 * @property difficultyFilter - Standard filter ('all', 'easy', 'medium', 'hard').
 * @property setDifficultyFilter - Setter function updating difficulty filter.
 * @property filteredLessons - Resulting list of lessons satisfying active search/filter queries.
 * @property startPractice - Callback when a student clicks on "Start Lesson" / "Review Lesson".
 * @property userRole - Role of currently logged in user ('ADMIN' or 'STUDENT').
 * @property onAdd - Administrator trigger to display lesson addition modal.
 * @property onEdit - Administrator trigger to edit an existing lesson.
 * @property onReorder - Administrator trigger to shift lesson sequencing order (up/down).
 * @property lessons - Baseline curriculum lessons catalog.
 */
export interface LessonGridProps {
  navigate: (path: string) => void;
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  difficultyFilter: string;
  setDifficultyFilter: (val: string) => void;
  filteredLessons: Lesson[];
  startPractice: (lesson: Lesson) => void;
  userRole: string;
  onAdd: () => void;
  onEdit: (lesson: Lesson) => void;
  onReorder: (lessonId: number, direction: 'up' | 'down') => void;
  lessons: Lesson[];
}

/**
 * LessonGrid Component
 * Displays available curriculum lessons for a selected level inside a responsive CSS grid layout.
 * Includes search bars and difficulty dropdown menus.
 * Automatically injects administrator controls (move lessons up/down, edit details, append new items) if the active user holds ADMIN privileges.
 */
const LessonGrid: React.FC<LessonGridProps> = ({
  navigate,
  searchTerm,
  setSearchTerm,
  difficultyFilter,
  setDifficultyFilter,
  filteredLessons,
  startPractice,
  userRole,
  onAdd,
  onEdit,
  onReorder,
  lessons
}) => (
  <div className="p-6 space-y-6">
    
    {/* Navigation & Search Deck */}
    <div className="flex items-center gap-2 mb-8 relative z-20">
      {/* Return button */}
      <button
        onClick={() => navigate('/dashboard')}
        className="glass-panel flex items-center justify-center w-12 h-12 md:w-auto md:px-6 rounded-2xl text-gray-400 hover:text-white transition-colors shrink-0"
        title="Back to Levels"
      >
        <ArrowLeft size={18} /> <span className="hidden md:inline ml-2">Back</span>
      </button>

      {/* Interactive Search Bar */}
      <div className="flex-1 relative min-w-0">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
        <input
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="glass-input w-full pl-11 pr-4 h-12 rounded-2xl text-xs md:text-sm"
        />
      </div>

      {/* Difficulty Dropdown filter */}
      <div className="shrink-0 flex gap-2 relative">
        <select
          value={difficultyFilter}
          onChange={(e) => setDifficultyFilter(e.target.value)}
          className="glass-panel h-12 pl-4 pr-10 rounded-2xl text-[10px] md:text-sm text-white outline-none cursor-pointer border-white/5 bg-dark-800/50 appearance-none min-w-[120px]"
        >
          <option value="all" disabled hidden>Difficulty</option>
          <option value="all">All</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
      </div>
    </div>

    {/* Staggered Grid Container */}
    <motion.div
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      initial="hidden"
      animate="show"
      variants={{
        hidden: { opacity: 0 },
        show: {
          opacity: 1,
          transition: {
            staggerChildren: 0.1 // Smooth sequenced entry animation
          }
        }
      }}
    >
      {filteredLessons.map(lesson => (
        <motion.div
          key={lesson.id}
          variants={{
            hidden: { opacity: 0, y: 20 },
            show: { opacity: 1, y: 0 }
          }}
          layout
          className={`glass-panel p-6 rounded-3xl flex flex-col group transition-all duration-300 relative overflow-hidden ${lesson.status === 'locked' ? 'opacity-50 grayscale' : 'hover:border-primary-500/30 hover:shadow-2xl hover:shadow-primary-500/5'}`}
        >
          {/* Watermark music icon exclusively for Level 4 (Song list) */}
          {lesson.level === 4 && (
            <div className="absolute top-[43%] -translate-y-1/2 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
              <Music size={80} />
            </div>
          )}

          {/* Card Header showing Difficulty badge, Admin tools, and progress icon */}
          <div className="flex justify-between items-start mb-4">
            <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md ${lesson.difficulty === 'easy' ? 'bg-green-500/20 text-green-500' :
              lesson.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-500' : 'bg-red-500/20 text-red-500'
              }`}>
              {lesson.difficulty}
            </span>
            <div className="flex items-center gap-2">
              {/* Display admin-specific reorder and edit actions */}
              {userRole === 'ADMIN' && (
                <div className="flex items-center gap-1">
                  {/* Shift Upward */}
                  <button
                    onClick={(e) => { e.stopPropagation(); onReorder(lesson.id, 'up'); }}
                    disabled={lessons.findIndex(l => l.id === lesson.id) === 0}
                    className="w-8 h-8 rounded-lg bg-white/5 text-gray-400 hover:text-primary-500 hover:bg-primary-500/10 transition-all flex items-center justify-center disabled:opacity-20 disabled:cursor-not-allowed"
                  >
                    <ChevronUp size={14} />
                  </button>
                  {/* Shift Downward */}
                  <button
                    onClick={(e) => { e.stopPropagation(); onReorder(lesson.id, 'down'); }}
                    disabled={lessons.findIndex(l => l.id === lesson.id) === lessons.length - 1}
                    className="w-8 h-8 rounded-lg bg-white/5 text-gray-400 hover:text-primary-500 hover:bg-primary-500/10 transition-all flex items-center justify-center disabled:opacity-20 disabled:cursor-not-allowed"
                  >
                    <ChevronDown size={14} />
                  </button>
                  {/* Edit Lesson */}
                  <button
                    onClick={(e) => { e.stopPropagation(); onEdit(lesson); }}
                    className="w-8 h-8 rounded-lg bg-white/5 text-gray-400 hover:text-primary-500 hover:bg-primary-500/10 transition-all flex items-center justify-center"
                  >
                    <Edit2 size={14} />
                  </button>
                </div>
              )}
              {/* Progress Icon indicator (Green check if completed, lock icon if locked, play circle if available) */}
              <div className="text-primary-500">
                {lesson.status === 'completed' ? <CheckCircle size={20} className="drop-shadow-[0_0_8px_rgba(57,255,20,0.4)]" /> :
                  lesson.status === 'locked' ? <Lock size={20} className="text-gray-500" /> : <PlayCircle size={20} className="group-hover:scale-110 transition-transform" />}
              </div>
            </div>
          </div>

          {/* Lesson Metadata */}
          <h3 className="text-xl font-bold text-white mb-2 group-hover:text-primary-500 transition-colors flex items-center gap-2">
            {lesson.level === 4 && <Music size={18} className="text-primary-500/70" />}
            {lesson.title}
          </h3>
          <p className="text-sm text-gray-400 mb-6 flex-1">{lesson.desc}</p>
          
          {/* Main Action Trigger */}
          <button
            disabled={lesson.status === 'locked'}
            onClick={() => startPractice(lesson)}
            className={`w-full py-3 rounded-xl font-bold transition-all duration-300 transform active:scale-95 ${lesson.status === 'locked' ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-primary-500 text-dark-900 hover:bg-primary-600 shadow-lg shadow-primary-500/20'
              }`}
          >
            {lesson.status === 'completed' ? 'Review Lesson' : 'Start Lesson'}
          </button>
        </motion.div>
      ))}

      {/* Add New Lesson Button for Administrators */}
      {userRole === 'ADMIN' && (
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 20 },
            show: { opacity: 1, y: 0 }
          }}
          onClick={onAdd}
          className="glass-panel p-6 rounded-3xl flex flex-col items-center justify-center border-dashed border-2 border-white/10 hover:border-primary-500/50 hover:bg-primary-500/5 transition-all cursor-pointer group min-h-[200px]"
        >
          <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-gray-500 group-hover:text-primary-500 group-hover:bg-primary-500/10 transition-all mb-4">
            <Plus size={24} />
          </div>
          <p className="font-bold text-gray-500 group-hover:text-primary-500 transition-colors uppercase tracking-widest text-xs">Add New Lesson</p>
        </motion.div>
      )}
    </motion.div>
  </div>
);

export default LessonGrid;
