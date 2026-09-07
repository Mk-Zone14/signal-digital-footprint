import { useState, useEffect, useCallback, useMemo } from 'react';
import { Activity, Category, DateRange, DemoData, FilterState } from '../types';
import { demoData as defaultDemoData } from '../data/demoData';
import {
  getFilteredActivities,
  calculateSignalScore,
  calculateArchetype,
  calculatePeakHours,
  calculateDigitalDNA,
  calculateMomentum,
  calculateInterestStrength,
  calculateSkillGrowth,
  getHeatmapData,
  searchActivities,
} from '../analytics';

export function useSignalData() {
  const [data, setData] = useState<DemoData>(defaultDemoData);
  const [isLoading, setIsLoading] = useState(true);
  const [isCustomData, setIsCustomData] = useState(false);

  useEffect(() => {
    // Simulate brief initialization for consistent loading state
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const loadDemoData = useCallback(() => {
    setIsLoading(true);
    setData(defaultDemoData);
    setIsCustomData(false);
    setTimeout(() => setIsLoading(false), 300);
  }, []);

  const loadCustomData = useCallback((customData: DemoData) => {
    setIsLoading(true);
    setData(customData);
    setIsCustomData(true);
    setTimeout(() => setIsLoading(false), 300);
  }, []);

  const exportData = useCallback(() => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'signal-data.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [data]);

  return {
    data,
    isLoading,
    isCustomData,
    loadDemoData,
    loadCustomData,
    exportData,
  };
}

export function useAnalytics(data: DemoData, filters: FilterState) {
  const filteredActivities = useMemo(
    () => getFilteredActivities(data.activities, filters.dateRange, filters.categories),
    [data.activities, filters.dateRange, filters.categories]
  );

  const signalScore = useMemo(() => calculateSignalScore(filteredActivities), [filteredActivities]);
  const archetype = useMemo(() => calculateArchetype(filteredActivities), [filteredActivities]);
  const peakHours = useMemo(() => calculatePeakHours(filteredActivities), [filteredActivities]);

  const interests = useMemo(
    () => calculateInterestStrength(filteredActivities, data.interests),
    [filteredActivities, data.interests]
  );

  const digitalDNA = useMemo(
    () => calculateDigitalDNA(filteredActivities, interests),
    [filteredActivities, interests]
  );

  const momentum = useMemo(
    () => calculateMomentum(filteredActivities, interests),
    [filteredActivities, interests]
  );

  const skills = useMemo(
    () => calculateSkillGrowth(data.skills, filteredActivities),
    [data.skills, filteredActivities]
  );

  const heatmapData = useMemo(
    () => getHeatmapData(filteredActivities),
    [filteredActivities]
  );

  const searchResults = useMemo(() => {
    if (!filters.searchQuery || filters.searchQuery.trim() === '') return null;
    return searchActivities(filters.searchQuery, filteredActivities, skills, data.timelineEvents, interests);
  }, [filters.searchQuery, filteredActivities, skills, data.timelineEvents, interests]);

  return {
    filteredActivities,
    signalScore,
    archetype,
    peakHours,
    interests,
    digitalDNA,
    momentum,
    skills,
    heatmapData,
    searchResults,
  };
}

export function useFilters() {
  const [filters, setFilters] = useState<FilterState>({
    dateRange: 'all',
    categories: [],
    searchQuery: '',
  });

  const updateDateRange = useCallback((dateRange: DateRange) => {
    setFilters(prev => ({ ...prev, dateRange }));
  }, []);

  const toggleCategory = useCallback((category: Category) => {
    setFilters(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category],
    }));
  }, []);

  const setCategories = useCallback((categories: Category[]) => {
    setFilters(prev => ({ ...prev, categories }));
  }, []);

  const setSearchQuery = useCallback((searchQuery: string) => {
    setFilters(prev => ({ ...prev, searchQuery }));
  }, []);

  return {
    filters,
    updateDateRange,
    toggleCategory,
    setCategories,
    setSearchQuery,
  };
}

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    const media = window.matchMedia(query);
    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Sync on mount in case it changed
    setMatches(media.matches);

    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [query]);

  return matches;
}

export function useKeyboardShortcut(key: string, callback: () => void, deps: unknown[] = []) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === key && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
          return;
        }
        e.preventDefault();
        callback();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, callback, ...deps]);
}

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}