/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Plus, Image, Type, X, Eye, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User, StatusStory } from '../types.js';

interface StatusFeedProps {
  currentUser: User;
  statuses: StatusStory[];
  onAddStatus: (type: 'text' | 'image', content: string, bgColor?: string) => void;
  onViewStatus: (statusId: string) => void;
}

const STATUS_COLORS = [
  'bg-emerald-600',
  'bg-purple-600',
  'bg-rose-600',
  'bg-blue-600',
  'bg-slate-800',
  'bg-amber-600'
];

export default function StatusFeed({
  currentUser,
  statuses,
  onAddStatus,
  onViewStatus
}: StatusFeedProps) {
  const [showPublisher, setShowPublisher] = useState<boolean>(false);
  const [publishType, setPublishType] = useState<'text' | 'image'>('text');
  const [textContent, setTextContent] = useState<string>('');
  const [selectedBgIndex, setSelectedBgIndex] = useState<number>(0);
  const [imageContent, setImageContent] = useState<string>(''); // Base64 or URL

  // Viewing status states
  const [activeStoryUser, setActiveStoryUser] = useState<string | null>(null); // userId of active stories being viewed
  const [activeStoryIndex, setActiveStoryIndex] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [storyProgress, setStoryProgress] = useState<number>(0);
  
  const progressTimerRef = useRef<number | null>(null);

  // Group statuses by user
  const groupedStatuses = statuses.reduce<Record<string, StatusStory[]>>((acc, s) => {
    if (!acc[s.userId]) acc[s.userId] = [];
    acc[s.userId].push(s);
    return acc;
  }, {});

  // Sort each user's statuses by timestamp
  Object.keys(groupedStatuses).forEach((userId) => {
    groupedStatuses[userId].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  });

  const userStoryList = Object.entries(groupedStatuses).map(([userId, stories]) => ({
    userId,
    username: stories[0].username,
    avatarUrl: stories[0].avatarUrl,
    stories
  }));

  // Separate current user's stories from others
  const myStories = groupedStatuses[currentUser.id] || [];
  const otherUsersStories = userStoryList.filter((item) => item.userId !== currentUser.id);

  // Handle active story progression
  const currentStoriesToPlay = activeStoryUser ? groupedStatuses[activeStoryUser] || [] : [];
  const currentPlayingStory = currentStoriesToPlay[activeStoryIndex];

  useEffect(() => {
    if (!activeStoryUser || currentStoriesToPlay.length === 0) return;

    setStoryProgress(0);
    
    // Register visual read receipt for unviewed statuses
    if (currentPlayingStory && !currentPlayingStory.viewers.includes(currentUser.id) && currentPlayingStory.userId !== currentUser.id) {
      onViewStatus(currentPlayingStory.id);
    }

    const intervalTime = 50; // Update progress every 50ms
    const totalTime = 4000;  // 4 seconds per story
    const increment = (intervalTime / totalTime) * 100;

    const timer = setInterval(() => {
      if (!isPaused) {
        setStoryProgress((prev) => {
          if (prev >= 100) {
            // Move to next story
            if (activeStoryIndex < currentStoriesToPlay.length - 1) {
              setActiveStoryIndex((idx) => idx + 1);
            } else {
              // Finished all stories for this user
              closeStoryViewer();
            }
            return 0;
          }
          return prev + increment;
        });
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, [activeStoryUser, activeStoryIndex, isPaused]);

  const closeStoryViewer = () => {
    setActiveStoryUser(null);
    setActiveStoryIndex(0);
    setStoryProgress(0);
    setIsPaused(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageContent(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePublish = () => {
    if (publishType === 'text') {
      if (!textContent.trim()) return;
      onAddStatus('text', textContent, STATUS_COLORS[selectedBgIndex]);
      setTextContent('');
    } else {
      if (!imageContent) return;
      onAddStatus('image', imageContent);
      setImageContent('');
    }
    setShowPublisher(false);
  };

  return (
    <div className="w-full bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Recent Status Updates</h3>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setPublishType('text');
              setShowPublisher(true);
            }}
            className="p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 cursor-pointer"
            title="Post text status"
          >
            <Type className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setPublishType('image');
              setShowPublisher(true);
            }}
            className="p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 cursor-pointer"
            title="Post image status"
          >
            <Image className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4 overflow-x-auto pb-2 scrollbar-none">
        {/* Current User Status Circle */}
        <div className="flex flex-col items-center flex-shrink-0">
          <div className="relative">
            <button
              onClick={() => {
                if (myStories.length > 0) {
                  setActiveStoryUser(currentUser.id);
                  setActiveStoryIndex(0);
                } else {
                  setPublishType('text');
                  setShowPublisher(true);
                }
              }}
              className="w-12 h-12 rounded-full p-[2px] border-2 border-emerald-500 cursor-pointer flex items-center justify-center overflow-hidden"
            >
              <img
                src={currentUser.avatarUrl}
                alt="My Profile"
                referrerPolicy="no-referrer"
                className="w-full h-full rounded-full object-cover"
              />
            </button>
            <button
              onClick={() => {
                setPublishType('image');
                setShowPublisher(true);
              }}
              className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full p-1 border-2 border-white dark:border-zinc-900 hover:bg-emerald-600 transition-colors cursor-pointer"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
          <span className="text-xs text-zinc-500 mt-1">My Status</span>
        </div>

        {/* Other Users' Statuses */}
        {otherUsersStories.map((item) => {
          // Check if any stories in the stack are unviewed by current user
          const hasUnviewed = item.stories.some((s) => !s.viewers.includes(currentUser.id));
          return (
            <div key={item.userId} className="flex flex-col items-center flex-shrink-0">
              <button
                onClick={() => {
                  setActiveStoryUser(item.userId);
                  setActiveStoryIndex(0);
                }}
                className={`w-12 h-12 rounded-full p-[2px] cursor-pointer flex items-center justify-center overflow-hidden border-2 ${
                  hasUnviewed ? 'border-emerald-500 scale-105 shadow-sm' : 'border-zinc-200 dark:border-zinc-700'
                }`}
              >
                <img
                  src={item.avatarUrl}
                  alt={item.username}
                  referrerPolicy="no-referrer"
                  className="w-full h-full rounded-full object-cover"
                />
              </button>
              <span className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 truncate max-w-[64px]">{item.username}</span>
            </div>
          );
        })}

        {otherUsersStories.length === 0 && (
          <p className="text-xs text-zinc-400 py-3 italic">No recent status updates from friends.</p>
        )}
      </div>

      {/* Full-screen Status Viewer */}
      <AnimatePresence>
        {activeStoryUser && currentPlayingStory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-zinc-950 p-4"
          >
            {/* Main Stories Container (Mobile Frame styled) */}
            <div
              className="relative w-full max-w-md h-[90vh] rounded-2xl overflow-hidden shadow-2xl flex flex-col bg-zinc-900"
              onMouseDown={() => setIsPaused(true)}
              onMouseUp={() => setIsPaused(false)}
              onTouchStart={() => setIsPaused(true)}
              onTouchEnd={() => setIsPaused(false)}
            >
              {/* Progress Bars Stack */}
              <div className="absolute top-3 left-3 right-3 flex gap-1 z-20">
                {currentStoriesToPlay.map((story, idx) => (
                  <div key={story.id} className="h-1 bg-white/30 rounded-full flex-1 overflow-hidden">
                    <div
                      className="h-full bg-white transition-all duration-50"
                      style={{
                        width:
                          idx < activeStoryIndex
                            ? '100%'
                            : idx === activeStoryIndex
                            ? `${storyProgress}%`
                            : '0%'
                      }}
                    />
                  </div>
                ))}
              </div>

              {/* Status Header */}
              <div className="absolute top-6 left-4 right-4 flex items-center justify-between z-20 text-white">
                <div className="flex items-center gap-3">
                  <img
                    src={currentPlayingStory.avatarUrl}
                    alt={currentPlayingStory.username}
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 rounded-full object-cover border border-white/20"
                  />
                  <div>
                    <h4 className="font-semibold text-sm">{currentPlayingStory.username}</h4>
                    <span className="text-xs text-white/60">
                      {new Date(currentPlayingStory.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
                <button
                  onClick={closeStoryViewer}
                  className="rounded-full p-2 bg-black/40 hover:bg-black/60 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Story Content View */}
              <div className="flex-1 flex items-center justify-center relative select-none">
                {currentPlayingStory.type === 'text' ? (
                  <div
                    className={`w-full h-full flex items-center justify-center p-8 text-center ${
                      currentPlayingStory.bgColor || 'bg-emerald-600'
                    }`}
                  >
                    <p className="text-2xl font-medium text-white max-w-[90%] leading-relaxed tracking-wide drop-shadow-sm">
                      {currentPlayingStory.content}
                    </p>
                  </div>
                ) : (
                  <img
                    src={currentPlayingStory.content}
                    alt="Status Image"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-contain"
                  />
                )}

                {/* Left/Right click triggers */}
                <button
                  onClick={() => {
                    if (activeStoryIndex > 0) {
                      setActiveStoryIndex((idx) => idx - 1);
                    }
                  }}
                  className="absolute left-0 top-0 bottom-0 w-1/4 cursor-pointer"
                  title="Previous status"
                />
                <button
                  onClick={() => {
                    if (activeStoryIndex < currentStoriesToPlay.length - 1) {
                      setActiveStoryIndex((idx) => idx + 1);
                    } else {
                      closeStoryViewer();
                    }
                  }}
                  className="absolute right-0 top-0 bottom-0 w-1/4 cursor-pointer"
                  title="Next status"
                />
              </div>

              {/* Viewers tracking bar (Visible only to the author) */}
              {currentPlayingStory.userId === currentUser.id && (
                <div className="absolute bottom-4 left-0 right-0 flex justify-center z-20">
                  <div className="bg-black/60 text-white rounded-full px-4 py-1.5 flex items-center gap-2 text-xs border border-white/10">
                    <Eye className="w-4 h-4 text-emerald-400" />
                    <span>Viewed by {currentPlayingStory.viewers.length} friends</span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Status Publisher Modal */}
      <AnimatePresence>
        {showPublisher && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-md p-6 relative shadow-xl overflow-hidden border border-zinc-100 dark:border-zinc-800"
            >
              <button
                onClick={() => {
                  setShowPublisher(false);
                  setImageContent('');
                  setTextContent('');
                }}
                className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-200 mb-4">
                Share New Status
              </h3>

              {/* Publisher tab selectors */}
              <div className="flex border-b border-zinc-100 dark:border-zinc-800 mb-5">
                <button
                  onClick={() => setPublishType('text')}
                  className={`flex-1 pb-2.5 text-sm font-semibold cursor-pointer ${
                    publishType === 'text'
                      ? 'text-emerald-500 border-b-2 border-emerald-500'
                      : 'text-zinc-400'
                  }`}
                >
                  Text Status
                </button>
                <button
                  onClick={() => setPublishType('image')}
                  className={`flex-1 pb-2.5 text-sm font-semibold cursor-pointer ${
                    publishType === 'image'
                      ? 'text-emerald-500 border-b-2 border-emerald-500'
                      : 'text-zinc-400'
                  }`}
                >
                  Image Status
                </button>
              </div>

              {publishType === 'text' ? (
                <div>
                  <div className={`w-full rounded-xl p-6 ${STATUS_COLORS[selectedBgIndex]} min-h-[160px] flex flex-col justify-between mb-4 transition-colors`}>
                    <textarea
                      value={textContent}
                      onChange={(e) => setTextContent(e.target.value)}
                      placeholder="Type status message..."
                      className="w-full bg-transparent border-none outline-none resize-none text-white text-lg font-medium text-center placeholder-white/60 h-24"
                    />
                    <div className="flex justify-between items-center text-white/80">
                      <span className="text-xs">Background</span>
                      <div className="flex gap-1.5">
                        {STATUS_COLORS.map((col, index) => (
                          <button
                            key={col}
                            onClick={() => setSelectedBgIndex(index)}
                            className={`w-5 h-5 rounded-full border-2 ${col} cursor-pointer ${
                              selectedBgIndex === index ? 'border-white scale-110' : 'border-transparent'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {imageContent ? (
                    <div className="relative rounded-xl overflow-hidden max-h-[220px] border border-zinc-100 dark:border-zinc-800 flex justify-center bg-zinc-50 dark:bg-zinc-950">
                      <img src={imageContent} alt="Pending upload" className="max-h-[220px] object-contain" />
                      <button
                        onClick={() => setImageContent('')}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl p-8 flex flex-col items-center justify-center hover:border-emerald-400 transition-colors cursor-pointer bg-zinc-50 dark:bg-zinc-950/50">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        id="status-image-file"
                      />
                      <label htmlFor="status-image-file" className="flex flex-col items-center cursor-pointer">
                        <Image className="w-10 h-10 text-zinc-400 mb-2" />
                        <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Click to Select Image</span>
                        <span className="text-xs text-zinc-400 mt-1">Supports PNG, JPG, GIF</span>
                      </label>
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1">Or Paste Image URL</label>
                    <input
                      type="text"
                      placeholder="https://images.unsplash.com/photo-..."
                      onChange={(e) => setImageContent(e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              )}

              <button
                onClick={handlePublish}
                disabled={publishType === 'text' ? !textContent.trim() : !imageContent}
                className="w-full mt-4 bg-emerald-500 hover:bg-emerald-600 disabled:bg-zinc-200 dark:disabled:bg-zinc-800 disabled:text-zinc-400 text-white font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
              >
                <Check className="w-5 h-5" />
                <span>Publish Update</span>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
