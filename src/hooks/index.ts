import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { Category, DateRange, DemoData, FilterState } from '../types';
import { demoData as defaultDemoData, DEMO_REFERENCE_DATE } from '../data/demoData';
import { validateImportedData, type ImportValidationResult } from '../data/importData';
import {
  selectActivityScopes,
  searchActivities,
  getV2Analytics,
} from '../analytics';

export function useSignalData() {
  const [data, setData] = useState<DemoData>(defaultDemoData);
  const [isLoading, setIsLoading] = useState(true);
  const [isCustomData, setIsCustomData] = useState(false);
  const [referenceDate, setReferenceDate] = useState<Date>(() => new Date(DEMO_REFERENCE_DATE));
  const loadingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Simulate brief initialization for consistent loading state
    loadingTimerRef.current = setTimeout(() => {
      setIsLoading(false);
    }, 300);
    return () => {
      if (loadingTimerRef.current) clearTimeout(loadingTimerRef.current);
    };
  }, []);

  const finishLoadingSoon = useCallback(() => {
    if (loadingTimerRef.current) clearTimeout(loadingTimerRef.current);
    loadingTimerRef.current = setTimeout(() => setIsLoading(false), 300);
  }, []);

  const loadDemoData = useCallback(() => {
    setIsLoading(true);
    setData(defaultDemoData);
    setIsCustomData(false);
    setReferenceDate(new Date(DEMO_REFERENCE_DATE));
    finishLoadingSoon();
  }, [finishLoadingSoon]);

  const loadCustomData = useCallback((payload: unknown): ImportValidationResult => {
    const result = validateImportedData(payload);
    if (!result.ok) return result;

    setIsLoading(true);
    setData(result.value.data);
    setIsCustomData(true);
    setReferenceDate(new Date(result.value.referenceDate));
    finishLoadingSoon();
    return result;
  }, [finishLoadingSoon]);

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
    referenceDate,
    loadDemoData,
    loadCustomData,
    exportData,
  };
}

export function useAnalytics(data: DemoData, filters: FilterState, referenceDate: Date) {
  const activityScopes = useMemo(
    () => selectActivityScopes(
      data.activities,
      filters.dateRange,
      filters.categories,
      referenceDate
    ),
    [data.activities, filters.dateRange, filters.categories, referenceDate]
  );

  const v2Analytics = useMemo(
    () => getV2Analytics(activityScopes.visibleActivities, {
      referenceDate,
      comparisonActivities: activityScopes.comparisonSourceActivities,
      historyActivities: activityScopes.analyticsSourceActivities,
      comparisonWindowDays: activityScopes.comparisonWindowDays,
    }),
    [activityScopes, referenceDate]
  );

  const searchResults = useMemo(() => {
    if (!filters.searchQuery || filters.searchQuery.trim() === '') return null;
    return searchActivities(filters.searchQuery, activityScopes.visibleActivities, [], [], []);
  }, [filters.searchQuery, activityScopes.visibleActivities]);

  return {
    filteredActivities: activityScopes.visibleActivities,
    ...activityScopes,
    referenceDate,
    v2Analytics,
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
