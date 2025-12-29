import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';

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
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);

  // Listen for auth changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load progress from database or localStorage
  useEffect(() => {
    const loadProgress = async () => {
      if (user) {
        // Load from database
        try {
          const { data, error } = await supabase
            .from('course_progress')
            .select('*')
            .eq('user_id', user.id);

          if (error) {
            console.error('Error loading progress from database:', error);
            // Fall back to localStorage
            loadFromLocalStorage();
            return;
          }

          if (data && data.length > 0) {
            const lessonProgress: Record<string, LessonProgress> = {};
            data.forEach((item) => {
              lessonProgress[item.lesson_id] = {
                lessonId: item.lesson_id,
                completed: item.completed,
                completedAt: item.completed_at || undefined,
                watchedSeconds: item.watched_seconds || undefined,
                lastWatchedAt: item.last_watched_at || undefined,
              };
            });

            const totalCompleted = Object.values(lessonProgress).filter(l => l.completed).length;

            setProgress({
              lessonProgress,
              moduleProgress: {},
              totalCompletedLessons: totalCompleted,
            });
          }
        } catch (error) {
          console.error('Error loading progress:', error);
          loadFromLocalStorage();
        }
      } else {
        // Load from localStorage for anonymous users
        loadFromLocalStorage();
      }
      setIsLoaded(true);
    };

    const loadFromLocalStorage = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          setProgress(parsed);
        }
      } catch (error) {
        console.error('Error loading from localStorage:', error);
      }
    };

    loadProgress();
  }, [user]);

  // Save to localStorage for backup
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
      } catch (error) {
        console.error('Error saving to localStorage:', error);
      }
    }
  }, [progress, isLoaded]);

  // Sync progress to database
  const syncToDatabase = useCallback(async (lessonId: string, data: Partial<LessonProgress>) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('course_progress')
        .upsert({
          user_id: user.id,
          lesson_id: lessonId,
          completed: data.completed || false,
          completed_at: data.completedAt || null,
          watched_seconds: data.watchedSeconds || 0,
          last_watched_at: data.lastWatchedAt || new Date().toISOString(),
        }, {
          onConflict: 'user_id,lesson_id'
        });

      if (error) {
        console.error('Error syncing to database:', error);
      }
    } catch (error) {
      console.error('Error syncing progress:', error);
    }
  }, [user]);

  // Mark a lesson as completed
  const markLessonCompleted = useCallback((lessonId: string, moduleId?: string) => {
    const now = new Date().toISOString();
    
    setProgress(prev => {
      const newLessonProgress = {
        ...prev.lessonProgress,
        [lessonId]: {
          lessonId,
          completed: true,
          completedAt: now,
          lastWatchedAt: now,
        }
      };

      let newModuleProgress = { ...prev.moduleProgress };
      if (moduleId) {
        const currentModule = prev.moduleProgress[moduleId] || { 
          moduleId, 
          completedLessons: 0, 
          totalLessons: 0 
        };
        
        if (!prev.lessonProgress[lessonId]?.completed) {
          newModuleProgress[moduleId] = {
            ...currentModule,
            completedLessons: currentModule.completedLessons + 1,
            lastAccessedAt: now,
          };
        }
      }

      const totalCompleted = Object.values(newLessonProgress).filter(l => l.completed).length;

      return {
        ...prev,
        lessonProgress: newLessonProgress,
        moduleProgress: newModuleProgress,
        totalCompletedLessons: totalCompleted,
        lastActivityAt: now,
      };
    });

    // Sync to database
    syncToDatabase(lessonId, { completed: true, completedAt: now, lastWatchedAt: now });
  }, [syncToDatabase]);

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

    // Sync to database
    syncToDatabase(lessonId, { completed: false, completedAt: undefined });
  }, [syncToDatabase]);

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
    const now = new Date().toISOString();
    
    setProgress(prev => ({
      ...prev,
      lessonProgress: {
        ...prev.lessonProgress,
        [lessonId]: {
          ...prev.lessonProgress[lessonId],
          lessonId,
          completed: prev.lessonProgress[lessonId]?.completed || false,
          watchedSeconds,
          lastWatchedAt: now,
        }
      },
      lastViewedLesson: lessonId,
      lastActivityAt: now,
    }));

    // Sync to database
    syncToDatabase(lessonId, { watchedSeconds, lastWatchedAt: now });
  }, [syncToDatabase]);

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
  const resetProgress = useCallback(async () => {
    setProgress(getInitialProgress());
    localStorage.removeItem(STORAGE_KEY);
    
    if (user) {
      try {
        await supabase
          .from('course_progress')
          .delete()
          .eq('user_id', user.id);
      } catch (error) {
        console.error('Error resetting database progress:', error);
      }
    }
  }, [user]);

  return {
    progress,
    isLoaded,
    user,
    isAuthenticated: !!user,
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
