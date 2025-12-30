import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  target?: string; // CSS selector for the element to highlight
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  page?: string; // Which page this step belongs to
  action?: string; // Optional action to perform
}

interface OnboardingContextType {
  isOnboarding: boolean;
  currentStep: number;
  steps: OnboardingStep[];
  startOnboarding: () => void;
  nextStep: () => void;
  prevStep: () => void;
  skipOnboarding: () => void;
  completeOnboarding: () => void;
  isStepActive: (stepId: string) => boolean;
  hasCompletedOnboarding: boolean;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

const ONBOARDING_STEPS: OnboardingStep[] = [
  // Welcome
  {
    id: 'welcome',
    title: 'Welcome to CineLunatic! 🎬',
    description: 'Your personal cinema diary and community. Let\'s take a quick tour to help you get started.',
    position: 'center',
    page: 'home'
  },

  // Home Page - Hero Section
  {
    id: 'hero-featured',
    title: 'Featured Films',
    description: 'Discover trending movies and shows. Click the arrows to browse through featured content.',
    target: '.hero-section',
    position: 'bottom',
    page: 'home'
  },

  // Home Page - Stats
  {
    id: 'quick-stats',
    title: 'Your Stats at a Glance',
    description: 'Track your day streak, yearly progress, average rating, and total films watched.',
    target: '.stats-bar',
    position: 'bottom',
    page: 'home'
  },

  // Home Page - Discovery
  {
    id: 'discovery-sections',
    title: 'Discover New Content',
    description: 'Scroll through trending, popular, and top-rated films and series. Click any poster to see details.',
    target: '.discovery-section',
    position: 'top',
    page: 'home'
  },

  // Header - Log Button
  {
    id: 'log-button',
    title: 'Log Your Watches',
    description: 'Click the + button to log a movie or show you\'ve watched. Add ratings, reviews, and track your viewing history.',
    target: '[data-onboarding="log-button"]',
    position: 'bottom',
    page: 'home'
  },

  // Header - Search
  {
    id: 'search-explore',
    title: 'Search & Explore',
    description: 'Search for any movie or TV show. Discover new content and add them to your lists.',
    target: '[data-onboarding="search-button"]',
    position: 'bottom',
    page: 'home'
  },

  // Diary Feature
  {
    id: 'diary-intro',
    title: 'Your Personal Diary',
    description: 'Keep track of everything you watch. View your diary to see all your logged entries with dates, ratings, and reviews.',
    position: 'center',
    page: 'home'
  },

  // Lists Feature
  {
    id: 'lists-intro',
    title: 'Create Custom Lists',
    description: 'Organize your favorite films into lists. Make them private, share with friends, or make them public for the community.',
    position: 'center',
    page: 'home'
  },

  // Profile
  {
    id: 'profile-intro',
    title: 'Your Profile',
    description: 'View your profile to see detailed statistics, favorite genres, top directors, and your viewing patterns.',
    target: '[data-onboarding="profile-button"]',
    position: 'bottom',
    page: 'home'
  },

  // Community
  {
    id: 'community-intro',
    title: 'Join the Community',
    description: 'Connect with fellow cinephiles! Create polls, start debates, share lists, and discover what others are watching.',
    position: 'center',
    page: 'home'
  },

  // Watchlist & Favorites
  {
    id: 'watchlist-favorites',
    title: 'Watchlist & Favorites',
    description: 'Save movies to watch later or mark them as favorites. Access them anytime from your profile.',
    position: 'center',
    page: 'home'
  },

  // Social Features
  {
    id: 'social-features',
    title: 'Connect with Friends',
    description: 'Send connection requests, see what your friends are watching, and share your movie journey together.',
    position: 'center',
    page: 'home'
  },

  // Complete
  {
    id: 'complete',
    title: 'You\'re All Set! 🎉',
    description: 'Start logging your movies, create lists, and connect with the community. Enjoy your cinematic journey!',
    position: 'center',
    page: 'home'
  }
];

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  // Check if user has completed onboarding
  useEffect(() => {
    async function checkOnboardingStatus() {
      if (!user) return;

      try {
        const onboardingDoc = await getDoc(doc(db, 'users', user.uid, 'settings', 'onboarding'));
        if (onboardingDoc.exists()) {
          const data = onboardingDoc.data();
          if (data.completed || data.skipped) {
            setHasCompletedOnboarding(true);
            setIsOnboarding(false); // Ensure it's off
            return;
          }
        }

        // Only start if explicitly not completed
        if (!hasCompletedOnboarding) {
          // First time user - start onboarding after a short delay
          const timer = setTimeout(() => {
            setIsOnboarding(true);
          }, 1000);
          return () => clearTimeout(timer);
        }

      } catch (error) {
        console.error('Error checking onboarding status:', error);
      }
    }

    checkOnboardingStatus();
  }, [user]);

  const startOnboarding = () => {
    setIsOnboarding(true);
    setCurrentStep(0);
  };

  const nextStep = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeOnboarding();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const skipOnboarding = async () => {
    setIsOnboarding(false);
    if (user) {
      try {
        await setDoc(doc(db, 'users', user.uid, 'settings', 'onboarding'), {
          completed: true,
          skipped: true,
          completedAt: new Date().toISOString()
        });
      } catch (error) {
        console.error('Error saving onboarding skip:', error);
      }
    }
  };

  const completeOnboarding = async () => {
    setIsOnboarding(false);
    setHasCompletedOnboarding(true);
    if (user) {
      try {
        await setDoc(doc(db, 'users', user.uid, 'settings', 'onboarding'), {
          completed: true,
          skipped: false,
          completedAt: new Date().toISOString()
        });
      } catch (error) {
        console.error('Error saving onboarding completion:', error);
      }
    }
  };

  const isStepActive = (stepId: string) => {
    return isOnboarding && ONBOARDING_STEPS[currentStep]?.id === stepId;
  };

  return (
    <OnboardingContext.Provider
      value={{
        isOnboarding,
        currentStep,
        steps: ONBOARDING_STEPS,
        startOnboarding,
        nextStep,
        prevStep,
        skipOnboarding,
        completeOnboarding,
        isStepActive,
        hasCompletedOnboarding
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}

