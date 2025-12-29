import { useState, useEffect, useCallback } from 'react';

interface LessonProgress {
  lessonId: string;
  completed: boolean;
  completedAt?: string;
  watchedSeconds?: number;
  lastWatchedAt?: string;
}

interface ModuleProgress {
  moduleId: string;
  completedLessons: number;
  totalLessons: number;
  lastAccessedAt?: string;
}

interface CourseProgress {
  lessonProgress: Record<string, LessonProgress>;
  moduleProgress: Record<string, ModuleProgress>;
  lastViewedLesson?: string;
  totalCompletedLessons: number;
  lastActivityAt?: string;
}

const STORAGE_KEY = 'coins_signals_course_progress';

const getInitialProgress = (): CourseProgress => ({
  lessonProgress: {},
  moduleProgress: {},
  totalCompletedLessons: 0,
});

export function useCourseProgress() {
  const [progress, setProgress] = useState<CourseProgress>(getInitialProgress);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load progress from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setProgress(parsed);
      }
    } catch (error) {
      console.error('Error loading course progress:', error);
    }
    setIsLoaded(true);
  }, []);

  // Save progress to localStorage whenever it changes
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
      } catch (error) {
        console.error('Error saving course progress:', error);
      }
    }
  }, [progress, isLoaded]);

  // Mark a lesson as completed
  const markLessonCompleted = useCallback((lessonId: string, moduleId?: string) => {
    setProgress(prev => {
      const newLessonProgress = {
        ...prev.lessonProgress,
        [lessonId]: {
          lessonId,
          completed: true,
          completedAt: new Date().toISOString(),
          lastWatchedAt: new Date().toISOString(),
        }
      };

      // Update module progress if moduleId is provided
      let newModuleProgress = { ...prev.moduleProgress };
      if (moduleId) {
        const currentModule = prev.moduleProgress[moduleId] || { 
          moduleId, 
          completedLessons: 0, 
          totalLessons: 0 
        };
        
        // Only increment if this lesson wasn't already completed
        if (!prev.lessonProgress[lessonId]?.completed) {
          newModuleProgress[moduleId] = {
            ...currentModule,
            completedLessons: currentModule.completedLessons + 1,
            lastAccessedAt: new Date().toISOString(),
          };
        }
      }

      const totalCompleted = Object.values(newLessonProgress).filter(l => l.completed).length;

      return {
        ...prev,
        lessonProgress: newLessonProgress,
        moduleProgress: newModuleProgress,
        totalCompletedLessons: totalCompleted,
        lastActivityAt: new Date().toISOString(),
      };
    });
  }, []);

  // Mark a lesson as not completed
  const markLessonIncomplete = useCallback((lessonId: string, moduleId?: string) => {
    setProgress(prev => {
      const newLessonProgress = {
        ...prev.lessonProgress,
        [lessonId]: {
          ...prev.lessonProgress[lessonId],
          lessonId,
          completed: false,
          completedAt: undefined,
        }
      };

      // Update module progress if moduleId is provided
      let newModuleProgress = { ...prev.moduleProgress };
      if (moduleId && prev.lessonProgress[lessonId]?.completed) {
        const currentModule = prev.moduleProgress[moduleId];
        if (currentModule) {
          newModuleProgress[moduleId] = {
            ...currentModule,
            completedLessons: Math.max(0, currentModule.completedLessons - 1),
          };
        }
      }

      const totalCompleted = Object.values(newLessonProgress).filter(l => l.completed).length;

      return {
        ...prev,
        lessonProgress: newLessonProgress,
        moduleProgress: newModuleProgress,
        totalCompletedLessons: totalCompleted,
        lastActivityAt: new Date().toISOString(),
      };
    });
  }, []);

  // Toggle lesson completion status
  const toggleLessonComplete = useCallback((lessonId: string, moduleId?: string) => {
    const isCompleted = progress.lessonProgress[lessonId]?.completed;
    if (isCompleted) {
      markLessonIncomplete(lessonId, moduleId);
    } else {
      markLessonCompleted(lessonId, moduleId);
    }
  }, [progress.lessonProgress, markLessonCompleted, markLessonIncomplete]);

  // Update watch progress for a lesson
  const updateWatchProgress = useCallback((lessonId: string, watchedSeconds: number) => {
    setProgress(prev => ({
      ...prev,
      lessonProgress: {
        ...prev.lessonProgress,
        [lessonId]: {
          ...prev.lessonProgress[lessonId],
          lessonId,
          completed: prev.lessonProgress[lessonId]?.completed || false,
          watchedSeconds,
          lastWatchedAt: new Date().toISOString(),
        }
      },
      lastViewedLesson: lessonId,
      lastActivityAt: new Date().toISOString(),
    }));
  }, []);

  // Set the last viewed lesson
  const setLastViewedLesson = useCallback((lessonId: string) => {
    setProgress(prev => ({
      ...prev,
      lastViewedLesson: lessonId,
      lastActivityAt: new Date().toISOString(),
    }));
  }, []);

  // Initialize module with total lessons count
  const initializeModule = useCallback((moduleId: string, totalLessons: number) => {
    setProgress(prev => {
      if (prev.moduleProgress[moduleId]) {
        return {
          ...prev,
          moduleProgress: {
            ...prev.moduleProgress,
            [moduleId]: {
              ...prev.moduleProgress[moduleId],
              totalLessons,
            }
          }
        };
      }
      return {
        ...prev,
        moduleProgress: {
          ...prev.moduleProgress,
          [moduleId]: {
            moduleId,
            completedLessons: 0,
            totalLessons,
          }
        }
      };
    });
  }, []);

  // Check if a lesson is completed
  const isLessonCompleted = useCallback((lessonId: string): boolean => {
    return progress.lessonProgress[lessonId]?.completed || false;
  }, [progress.lessonProgress]);

  // Get lesson progress
  const getLessonProgress = useCallback((lessonId: string): LessonProgress | undefined => {
    return progress.lessonProgress[lessonId];
  }, [progress.lessonProgress]);

  // Get module progress
  const getModuleProgress = useCallback((moduleId: string): ModuleProgress | undefined => {
    return progress.moduleProgress[moduleId];
  }, [progress.moduleProgress]);

  // Get module completion percentage
  const getModulePercentage = useCallback((moduleId: string): number => {
    const module = progress.moduleProgress[moduleId];
    if (!module || module.totalLessons === 0) return 0;
    return Math.round((module.completedLessons / module.totalLessons) * 100);
  }, [progress.moduleProgress]);

  // Reset all progress
  const resetProgress = useCallback(() => {
    setProgress(getInitialProgress());
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return {
    progress,
    isLoaded,
    markLessonCompleted,
    markLessonIncomplete,
    toggleLessonComplete,
    updateWatchProgress,
    setLastViewedLesson,
    initializeModule,
    isLessonCompleted,
    getLessonProgress,
    getModuleProgress,
    getModulePercentage,
    resetProgress,
  };
}
