# FilmLogger Performance & UX Issues Analysis

## 🔴 Critical Performance Issues

### 1. MovieCard - API Calls on Hover
**Severity:** Critical  
**Location:** `src/components/movies/MovieCard.tsx:31-47`

**Problem:**
```typescript
useEffect(() => {
  async function checkStatus() {
    if (user && isHovered) {
      const [fav, logs] = await Promise.all([
        isFavorite(user.uid, movie.id, movie.mediaType || 'movie'),
        getMovieLogs(user.uid, movie.id, movie.mediaType || 'movie')
      ]);
      // ...
    }
  }
  checkStatus();
}, [user, movie.id, movie.mediaType, isHovered]);
```

**Impact:**
- ❌ **API call on every hover** - Makes 2 database queries per card hover
- ❌ **Race conditions** - Multiple rapid hovers trigger concurrent requests
- ❌ **Poor UX** - Network delay on hover interaction
- ❌ **Server load** - In lists with 20+ cards, hundreds of requests possible

**Solution:**
- Fetch status once on mount or use parent-provided data
- Cache results in component state or React Query
- Use debouncing if hover-based fetching is necessary

---

### 2. MovieCard Not Memoized
**Severity:** High  
**Location:** `src/components/movies/MovieCard.tsx:20`

**Problem:**
- Component renders in lists (Home, Search, etc.) but not wrapped in `React.memo()`
- Re-renders when parent state changes even if props unchanged

**Impact:**
- ❌ Unnecessary re-renders of all cards when list updates
- ❌ Poor performance in grids with 50+ items
- ❌ Wasted computation on hover animations

**Solution:**
```typescript
export const MovieCard = React.memo(function MovieCard({ movie, ... }) {
  // ...
}, (prevProps, nextProps) => prevProps.movie.id === nextProps.movie.id);
```

---

### 3. Diary Page - Unmemoized groupedLogs
**Severity:** High  
**Location:** `src/pages/Diary.tsx:45-53`

**Problem:**
```typescript
const groupedLogs = logs.reduce((acc, log) => {
  // ... expensive computation
}, {} as Record<string, LogEntry[]>);
```

**Impact:**
- ❌ Re-computes on every render
- ❌ Runs expensive reduce operation even when logs unchanged
- ❌ Poor performance with 500+ logs

**Solution:**
```typescript
const groupedLogs = useMemo(() => {
  return logs.reduce((acc, log) => {
    // ... computation
  }, {} as Record<string, LogEntry[]>);
}, [logs]);
```

---

### 4. Scroll Listener Without Throttling
**Severity:** High  
**Location:** `src/pages/MovieDetail.tsx:50-61`

**Problem:**
```typescript
useEffect(() => {
  const handleScroll = () => {
    if (backdropRef.current) {
      const scrolled = window.pageYOffset;
      backdropRef.current.style.transform = `translateY(${scrolled * 0.5}px)`;
    }
  };
  window.addEventListener('scroll', handleScroll);
  // ...
}, []);
```

**Impact:**
- ❌ Fires on **every scroll event** (100+ times per second)
- ❌ Main thread blocking during scroll
- ❌ Poor scroll performance on low-end devices
- ❌ Battery drain

**Solution:**
- Use `requestAnimationFrame` for scroll-based animations
- Throttle/debounce scroll handlers
- Use CSS transforms with `will-change` hint

---

### 5. Large Lists Without Virtualization
**Severity:** High  
**Location:** Multiple pages (Diary, Search, Community)

**Problem:**
- `react-window` is installed but **not used**
- Lists render all items at once (500+ in Diary, unlimited in Search)
- All DOM nodes created upfront

**Impact:**
- ❌ Slow initial render with large datasets
- ❌ High memory usage
- ❌ Poor scroll performance
- ❌ Mobile devices struggle with 100+ DOM elements

**Affected Components:**
- `Diary.tsx` - Renders 500 logs
- `Search.tsx` - Can render 100+ movie cards
- `Community.tsx` - Renders multiple lists

**Solution:**
```typescript
import { FixedSizeList } from 'react-window';
// Or use VariableSizeList for dynamic heights
```

---

## 🟠 High Priority Performance Issues

### 6. Missing useCallback for Event Handlers
**Severity:** Medium-High  
**Location:** Multiple components

**Problem:**
- Inline arrow functions passed as props
- Created on every render
- Causes child re-renders

**Examples:**
```typescript
// MovieCard.tsx
onClick={() => setIsAddToListOpen(false)}  // ❌ New function every render

// Home.tsx - HorizontalScroll
scroll={() => { /* ... */ }}  // ❌ New function
```

**Impact:**
- Unnecessary re-renders of child components
- Wasted computation

**Solution:**
```typescript
const handleClose = useCallback(() => {
  setIsAddToListOpen(false);
}, []);
```

---

### 7. Home Page - Too Many State Variables
**Severity:** Medium  
**Location:** `src/pages/Home.tsx:103-121`

**Problem:**
- 15+ state variables in single component
- Complex dependency chains
- Multiple `useEffect` hooks

**Impact:**
- ❌ Hard to optimize re-renders
- ❌ Complex state management
- ❌ Difficult to track what triggers updates

**Solution:**
- Split into smaller components
- Use `useReducer` for related state
- Extract custom hooks for data fetching

---

### 8. Diary Page - Fetches 500 Logs Upfront
**Severity:** Medium  
**Location:** `src/pages/Diary.tsx:23`

**Problem:**
```typescript
const fetchedLogs = await getUserLogs(user.uid, { limitCount: 500 });
```

**Impact:**
- ❌ Slow initial load for users with many logs
- ❌ Unnecessary data transfer
- ❌ Large initial render

**Solution:**
- Implement pagination
- Load on scroll
- Start with last 50 logs, lazy load older ones

---

### 9. Inline Object Creation in JSX
**Severity:** Medium  
**Location:** Multiple components

**Problem:**
```typescript
<MovieCard
  movie={movie}
  showRating={true}  // ✅ OK
  style={{ margin: '10px' }}  // ❌ New object every render
/>
```

**Impact:**
- Wasted memory allocation
- Potential child re-renders if using `React.memo` with shallow comparison

---

## 🟡 UI/UX Issues

### 10. Inconsistent Loading States
**Severity:** Medium  
**Location:** Multiple pages

**Problem:**
- Some pages use `Loader2` spinner
- Some use skeleton screens
- No unified loading component
- Different loading UI patterns

**Impact:**
- ❌ Inconsistent user experience
- ❌ Users don't know what to expect

**Solution:**
- Create unified `<LoadingSpinner />` component
- Use skeleton screens for content previews
- Consistent loading patterns across app

---

### 11. Missing Empty States
**Severity:** Medium  
**Location:** Some pages

**Problem:**
- Some pages show blank space when empty
- No clear call-to-action
- Inconsistent empty state design

**Examples:**
- Diary has good empty state ✅
- Search might need better empty state
- Lists need consistent empty states

**Solution:**
- Consistent empty state component
- Clear CTAs
- Helpful messaging

---

### 12. No Optimistic UI Updates
**Severity:** Medium  
**Location:** MovieCard, various forms

**Problem:**
- UI waits for API response before updating
- No immediate feedback on actions

**Impact:**
- ❌ Feels slow even if fast
- ❌ Users might click multiple times
- ❌ Poor perceived performance

**Solution:**
- Update UI immediately
- Rollback on error
- Show loading state during request

---

### 13. Accessibility Issues
**Severity:** Medium  
**Location:** Multiple components

**Potential Issues:**
- Missing ARIA labels on interactive elements
- Keyboard navigation not verified
- Focus management in modals
- Screen reader support unknown

**Solution:**
- Audit with screen reader
- Test keyboard navigation
- Add proper ARIA attributes
- Manage focus in dialogs

---

### 14. Image Loading Performance
**Severity:** Low-Medium  
**Location:** MovieCard, MovieDetail

**Problem:**
- Images use `loading="lazy"` ✅ Good
- No `srcset` for responsive images
- No WebP/AVIF support
- All images same size regardless of viewport

**Impact:**
- ❌ Larger images than needed on mobile
- ❌ Missing next-gen format benefits

**Solution:**
- Implement `srcset` for responsive images
- Use WebP with fallback
- Consider blur-up placeholder

---

## 🟢 Low Priority / Optimization Opportunities

### 15. Home Page - HorizontalScroll useEffect Dependency
**Severity:** Low  
**Location:** `src/pages/Home.tsx:63-70`

**Problem:**
```typescript
useEffect(() => {
  checkScroll();
  const ref = scrollRef.current;
  if (ref) {
    ref.addEventListener('scroll', checkScroll);
    return () => ref.removeEventListener('scroll', checkScroll);
  }
}, [children]);  // ⚠️ children changes on every render
```

**Impact:**
- Re-attaches scroll listener unnecessarily

**Solution:**
- Remove `children` from dependency array
- Use ref callback or stable reference

---

### 16. MovieDetail - Auto-carousel Missing Cleanup Check
**Severity:** Low  
**Location:** `src/pages/MovieDetail.tsx:64-76`

**Current:** Cleanup looks good ✅

---

### 17. Missing Debounce on Search Input
**Severity:** Low  
**Location:** `src/pages/Search.tsx`

**Impact:**
- API calls on every keystroke (if implemented)
- Could benefit from debouncing

---

## 📊 Performance Impact Summary

### Current Issues Affecting Core Web Vitals:

1. **LCP (Largest Contentful Paint):**
   - ⚠️ Large initial data fetches (500 logs)
   - ⚠️ All images loaded upfront in lists

2. **FID (First Input Delay):**
   - ❌ Scroll handlers blocking main thread
   - ⚠️ Large component re-renders

3. **CLS (Cumulative Layout Shift):**
   - ⚠️ Images without dimensions (some)
   - ✅ Most images use aspect ratio containers

4. **TTI (Time to Interactive):**
   - ❌ API calls on hover delaying interactions
   - ⚠️ Large lists rendering everything upfront

---

## 🎯 Recommended Fix Priority

### Immediate (This Week):
1. ✅ **Fix MovieCard hover API calls** (Critical)
2. ✅ **Memoize MovieCard component** (High)
3. ✅ **Memoize Diary groupedLogs** (High)
4. ✅ **Throttle scroll listener** (High)

### Short Term (Next Week):
5. Implement virtualization for large lists
6. Add useCallback to event handlers
7. Implement pagination in Diary

### Medium Term:
8. Split Home page into smaller components
9. Add optimistic UI updates
10. Improve loading states consistency

### Long Term:
11. Image optimization (WebP, srcset)
12. Accessibility audit
13. Performance monitoring setup

---

## 🔧 Quick Wins (1-2 hours total):

1. **Memoize MovieCard** (15 min)
2. **Memoize groupedLogs** (5 min)
3. **Throttle scroll handler** (10 min)
4. **Remove hover API calls** (30 min)

**Total Estimated Impact:** 
- 40-60% reduction in unnecessary re-renders
- 80% reduction in API calls on hover
- Smoother scroll performance

---

*Generated: 2025-01-27*
