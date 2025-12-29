/**
 * Cookie Helper Functions for CineLunatic
 * Specific helpers for common use cases
 */

import { getCookie, setCookie, deleteCookie } from './cookies';

// ==================== SEARCH PREFERENCES ====================

export interface SearchPreferences {
  defaultType: 'movie' | 'tv';
  defaultGenre: string;
  defaultDecade: string;
  filtersOpen: boolean;
}

const SEARCH_PREFS_COOKIE = 'cinelunatic:search_prefs';
const SEARCH_PREFS_EXPIRES = 30; // 30 days

export function getSearchPreferences(): SearchPreferences {
  const cookie = getCookie(SEARCH_PREFS_COOKIE);
  if (!cookie) {
    return {
      defaultType: 'movie',
      defaultGenre: 'All',
      defaultDecade: 'All',
      filtersOpen: false
    };
  }
  
  try {
    return JSON.parse(cookie);
  } catch {
    return {
      defaultType: 'movie',
      defaultGenre: 'All',
      defaultDecade: 'All',
      filtersOpen: false
    };
  }
}

export function setSearchPreferences(prefs: Partial<SearchPreferences>): void {
  const current = getSearchPreferences();
  const updated = { ...current, ...prefs };
  setCookie(SEARCH_PREFS_COOKIE, JSON.stringify(updated), {
    expires: SEARCH_PREFS_EXPIRES
  });
}

// ==================== RECENTLY VIEWED ====================

export interface RecentViewedItem {
  id: number;
  title: string;
  mediaType: 'movie' | 'tv';
  posterUrl?: string;
  viewedAt: string;
}

const RECENT_VIEWED_COOKIE = 'cinelunatic:recent_viewed';
const RECENT_VIEWED_MAX = 10;
const RECENT_VIEWED_EXPIRES = 90; // 90 days

export function getRecentViewed(): RecentViewedItem[] {
  const cookie = getCookie(RECENT_VIEWED_COOKIE);
  if (!cookie) return [];
  
  try {
    return JSON.parse(cookie);
  } catch {
    return [];
  }
}

export function addRecentViewed(item: Omit<RecentViewedItem, 'viewedAt'>): void {
  const recent = getRecentViewed();
  
  // Remove if already exists
  const filtered = recent.filter(
    r => !(r.id === item.id && r.mediaType === item.mediaType)
  );
  
  // Add to beginning
  const updated: RecentViewedItem[] = [
    { ...item, viewedAt: new Date().toISOString() },
    ...filtered
  ].slice(0, RECENT_VIEWED_MAX);
  
  setCookie(RECENT_VIEWED_COOKIE, JSON.stringify(updated), {
    expires: RECENT_VIEWED_EXPIRES
  });
}

export function clearRecentViewed(): void {
  deleteCookie(RECENT_VIEWED_COOKIE);
}

// ==================== VIEW PREFERENCES ====================

export interface ViewPreferences {
  diaryView: 'grid' | 'list' | 'timeline';
  listView: 'grid' | 'list';
  cardSize: 'sm' | 'md' | 'lg';
}

const VIEW_PREFS_COOKIE = 'cinelunatic:view_prefs';
const VIEW_PREFS_EXPIRES = 365; // 1 year

export function getViewPreferences(): ViewPreferences {
  const cookie = getCookie(VIEW_PREFS_COOKIE);
  if (!cookie) {
    return {
      diaryView: 'list',
      listView: 'grid',
      cardSize: 'md'
    };
  }
  
  try {
    return JSON.parse(cookie);
  } catch {
    return {
      diaryView: 'list',
      listView: 'grid',
      cardSize: 'md'
    };
  }
}

export function setViewPreferences(prefs: Partial<ViewPreferences>): void {
  const current = getViewPreferences();
  const updated = { ...current, ...prefs };
  setCookie(VIEW_PREFS_COOKIE, JSON.stringify(updated), {
    expires: VIEW_PREFS_EXPIRES
  });
}
