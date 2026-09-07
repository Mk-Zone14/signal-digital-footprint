import { useState, useEffect, useCallback, useMemo } from 'react';
import { Activity, TimelineEvent, Interest, Skill, Category, DateRange, DemoData, FilterState, Archetype, SignalScore, PeakHoursData, DigitalDNA, MomentumData } from '../types';
import { demoData as defaultDemoData } from '../data/demoData';
import {
  calculateSignalScore,
  calculateArchetype,
  calculatePeakHours,
  calculateDigitalDNA,
  calculateMomentum,
  calculateInterestStrength,
  calculateSkillGrowth,
  getFilteredActivities,
  getHeatmapData,
  searchActivities,
} from '../analytics';

export function useSignalData() {
  const [data, setData] = useState<DemoData>(defaultDemoData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLoadedData, setHasLoadedData] = useState(true);

  const loadDemoData = useCallback(() => {
    setIsLoading(true);
    setError(null);
    setTimeout(() => {
      setData(defaultDemoData);
      setHasLoadedData(true);
      setIsLoading(false);
    }, 300);
  }, []);

  const loadCustomData = useCallback(async (file: File) => {
    setIsLoading(true);
    setError(null);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);

      if (!parsed.activities || !Array.isArray(parsed.activities)) {
        throw new Error('Invalid data format: missing activities array');
      }

      const newData: DemoData = {
        activities: parsed.activities,
        timelineEvents: parsed.timelineEvents || [],
        interests: parsed.interests || [],
        skills: parsed.skills || [],
      };

      setData(newData);
      setHasLoadedData(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse file');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearData = useCallback(() => {
    setData({ activities: [], timelineEvents: [], interests: [], skills: [] });
    setHasLoadedData(false);
  }, []);

  return {
    data,
    isLoading,
    error,
    hasLoadedData,
    loadDemoData,
    loadCustomData,
    clearData,
  };
}

export function useFilters() {
  const [filters, setFilters] = useState<FilterState>({
    dateRange: '6m',
    categories: [],
    searchQuery: '',
  });

  const updateDateRange = useCallback((range: DateRange) => {
    setFilters(prev => ({ ...prev, dateRange: range }));
  }, []);

  const toggleCategory = useCallback((category: Category) => {
    setFilters(prev => {
      const categories = prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category];
      return { ...prev, categories };
    });
  }, []);

  const setCategories = useCallback((categories: Category[]) => {
    setFilters(prev => ({ ...prev, categories }));
  }, []);

  const setSearchQuery = useCallback((query: string) => {
    setFilters(prev => ({ ...prev, searchQuery: query }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({ dateRange: '6m', categories: [], searchQuery: '' });
  }, []);

  return {
    filters,
    updateDateRange,
    toggleCategory,
    setCategories,
    setSearchQuery,
    clearFilters,
  };
}

export function useAnalytics(data: DemoData, filters: FilterState) {
  const filteredActivities = useMemo(
    () => getFilteredActivities(filters.dateRange, filters.categories),
    [data.activities, filters.dateRange, filters.categories]
  );

  const signalScore = useMemo(
    () => calculateSignalScore(filteredActivities),
    [filteredActivities]
  );

  const archetype = useMemo(
    () => calculateArchetype(filteredActivities),
    [filteredActivities]
  );

  const peakHours = useMemo(
    () => calculatePeakHours(filteredActivities),
    [filteredActivities]
  );

  const digitalDNA = useMemo(
    () => calculateDigitalDNA(filteredActivities, data.interests),
    [filteredActivities, data.interests]
  );

  const momentum = useMemo(
    () => calculateMomentum(filteredActivities, data.interests),
    [filteredActivities, data.interests]
  );

  const enhancedInterests = useMemo(
    () => calculateInterestStrength(filteredActivities, data.interests),
    [filteredActivities, data.interests]
  );

  const enhancedSkills = useMemo(
    () => calculateSkillGrowth(data.skills, filteredActivities),
    [data.skills, filteredActivities]
  );

  const heatmapData = useMemo(
    () => getHeatmapData(filteredActivities),
    [filteredActivities]
  );

  const searchResults = useMemo(
    () => {
      if (!filters.searchQuery.trim()) return null;
      return searchActivities(filters.searchQuery, data.activities, data.skills, data.timelineEvents, data.interests);
    },
    [filters.searchQuery, data.activities, data.skills, data.timelineEvents, data.interests]
  );

  return {
    filteredActivities,
    signalScore,
    archetype,
    peakHours,
    digitalDNA,
    momentum,
    interests: enhancedInterests,
    skills: enhancedSkills,
    heatmapData,
    searchResults,
  };
}

export function useKeyboardShortcuts(callbacks: Record<string, () => void>) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        if (e.key === 'Escape') {
          (e.target as HTMLElement).blur();
        }
        return;
      }

      if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        callbacks.openSearch?.();
      }

      if (e.key === 'Escape') {
        callbacks.closeSearch?.();
        callbacks.closeModals?.();
      }

      if (e.key === '1' && e.metaKey) {
        e.preventDefault();
        callbacks.goToOverview?.();
      }
      if (e.key === '2' && e.metaKey) {
        e.preventDefault();
        callbacks.goToActivity?.();
      }
      if (e.key === '3' && e.metaKey) {
        e.preventDefault();
        callbacks.goToInterests?.();
      }
      if (e.key === '4' && e.metaKey) {
        e.preventDefault();
        callbacks.goToSkills?.();
      }
      if (e.key === '5' && e.metaKey) {
        e.preventDefault();
        callbacks.goToTimeline?.();
      }
      if (e.key === '6' && e.metaKey) {
        e.preventDefault();
        callbacks.goToIdentity?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [callbacks]);
}

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }, [key, storedValue]);

  return [storedValue, setValue] as const;
}

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [matches, query]);

  return matches;
}