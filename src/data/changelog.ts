export interface ChangelogEntry {
  version: string;
  date: string;
  type: 'feature' | 'fix' | 'improvement' | 'announcement';
  title: string;
  description: string;
  items?: string[];
}

export const changelog: ChangelogEntry[] = [
  {
    version: '1.2.0',
    date: '2026-01-15',
    type: 'feature',
    title: 'System Status Dashboard',
    description: 'New comprehensive status page with real-time metrics and platform health monitoring.',
    items: [
      'Real-time API status monitoring',
      'Platform health indicators',
      'Changelog and version history',
      'Activity metrics dashboard'
    ]
  },
  {
    version: '1.1.5',
    date: '2026-01-10',
    type: 'improvement',
    title: 'Performance Optimizations',
    description: 'Enhanced database queries and reduced load times across the platform.',
    items: [
      'Optimized Firestore queries',
      'Improved image loading',
      'Reduced bundle size',
      'Faster page transitions'
    ]
  },
  {
    version: '1.1.0',
    date: '2025-12-20',
    type: 'feature',
    title: 'TV Show Integration',
    description: 'Full support for TV series logging and tracking.',
    items: [
      'TV show detail pages',
      'Season and episode tracking',
      'Completion percentage tracking',
      'TV-specific trending sections'
    ]
  },
  {
    version: '1.0.8',
    date: '2025-12-05',
    type: 'fix',
    title: 'Bug Fixes',
    description: 'Resolved several issues reported by the community.',
    items: [
      'Fixed connection request notifications',
      'Resolved search filter persistence',
      'Fixed profile stats calculation',
      'Improved error handling'
    ]
  },
  {
    version: '1.0.5',
    date: '2025-11-18',
    type: 'feature',
    title: 'Community Features',
    description: 'Enhanced social interactions and community engagement.',
    items: [
      'Activity feed improvements',
      'Enhanced review system',
      'Community lists discovery',
      'User recommendations'
    ]
  },
  {
    version: '1.0.0',
    date: '2025-10-01',
    type: 'announcement',
    title: 'CineLunatic Launch',
    description: 'The initial release of CineLunatic - A quiet place to keep your films.',
    items: [
      'Movie logging and diary',
      'Rating and review system',
      'Lists and collections',
      'Social connections',
      'Stats and analytics'
    ]
  }
];

export const roadmap = [
  {
    quarter: 'Q1 2026',
    items: [
      'Mobile app (iOS & Android)',
      'Advanced analytics dashboard',
      'Export to Letterboxd',
      'Watch party features'
    ]
  },
  {
    quarter: 'Q2 2026',
    items: [
      'AI-powered recommendations',
      'Custom themes',
      'API for developers',
      'Enhanced social features'
    ]
  },
  {
    quarter: 'Q3 2026',
    items: [
      'Internationalization (i18n)',
      'Offline mode',
      'Advanced filtering',
      'Collaborative lists'
    ]
  }
];
