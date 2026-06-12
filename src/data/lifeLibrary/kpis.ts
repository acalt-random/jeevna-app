import { LifeLibraryKpiTemplate } from '@/types/onboarding';

export const lifeLibraryKpis: LifeLibraryKpiTemplate[] = [
  { id: 'health-sleep-rhythm', categoryId: 'health', name: 'Sleep Rhythm', target: 7, unit: 'nights/week', weight: 8, recommendedFrequency: 'daily' },
  { id: 'health-recovery-check', categoryId: 'health', name: 'Recovery Check', target: 5, unit: 'check-ins/week', weight: 6, recommendedFrequency: 'daily' },

  { id: 'fitness-workout-consistency', categoryId: 'fitness', name: 'Workout Consistency', target: 4, unit: 'sessions/week', weight: 10, recommendedFrequency: 'weekly' },
  { id: 'fitness-mobility-consistency', categoryId: 'fitness', name: 'Mobility Consistency', target: 5, unit: 'sessions/week', weight: 7, recommendedFrequency: 'daily' },

  { id: 'finance-budget-review', categoryId: 'finance', name: 'Budget Review', target: 1, unit: 'review/week', weight: 8, recommendedFrequency: 'weekly' },
  { id: 'finance-savings-progress', categoryId: 'finance', name: 'Savings Progress', target: 1, unit: 'transfer/week', weight: 9, recommendedFrequency: 'weekly' },

  { id: 'investments-portfolio-review', categoryId: 'investments', name: 'Portfolio Review', target: 1, unit: 'review/month', weight: 7, recommendedFrequency: 'monthly' },
  { id: 'investments-investing-consistency', categoryId: 'investments', name: 'Investing Consistency', target: 1, unit: 'contribution/month', weight: 8, recommendedFrequency: 'monthly' },

  { id: 'career-deep-work', categoryId: 'career', name: 'Deep Work Hours', target: 5, unit: 'sessions/week', weight: 9, recommendedFrequency: 'daily' },
  { id: 'career-growth-actions', categoryId: 'career', name: 'Career Growth Actions', target: 2, unit: 'actions/week', weight: 8, recommendedFrequency: 'weekly' },

  { id: 'learning-reading-rhythm', categoryId: 'learning', name: 'Reading Rhythm', target: 5, unit: 'sessions/week', weight: 6, recommendedFrequency: 'daily' },
  { id: 'learning-study-consistency', categoryId: 'learning', name: 'Study Consistency', target: 3, unit: 'sessions/week', weight: 7, recommendedFrequency: 'weekly' },

  { id: 'relationships-touchpoints', categoryId: 'relationships', name: 'Relationship Touchpoints', target: 3, unit: 'touchpoints/week', weight: 10, recommendedFrequency: 'weekly' },
  { id: 'relationships-quality-time', categoryId: 'relationships', name: 'Quality Time', target: 2, unit: 'moments/week', weight: 8, recommendedFrequency: 'weekly' },

  { id: 'parents-connection-rhythm', categoryId: 'parents', name: 'Parent Connection Rhythm', target: 1, unit: 'touchpoint/week', weight: 10, recommendedFrequency: 'weekly' },
  { id: 'parents-support-actions', categoryId: 'parents', name: 'Parent Support Actions', target: 2, unit: 'actions/month', weight: 7, recommendedFrequency: 'monthly' },

  { id: 'friends-social-rhythm', categoryId: 'friends', name: 'Friendship Rhythm', target: 2, unit: 'touchpoints/week', weight: 7, recommendedFrequency: 'weekly' },
  { id: 'friends-meetups', categoryId: 'friends', name: 'Friend Meetups', target: 1, unit: 'meetup/month', weight: 6, recommendedFrequency: 'monthly' },

  { id: 'family-quality-time', categoryId: 'family', name: 'Family Quality Time', target: 2, unit: 'moments/week', weight: 8, recommendedFrequency: 'weekly' },
  { id: 'family-coordination', categoryId: 'family', name: 'Family Coordination', target: 1, unit: 'planning/week', weight: 5, recommendedFrequency: 'weekly' },

  { id: 'vehicle-maintenance-rhythm', categoryId: 'vehicle', name: 'Vehicle Maintenance Rhythm', target: 2, unit: 'tasks/month', weight: 5, recommendedFrequency: 'monthly' },
  { id: 'vehicle-service-readiness', categoryId: 'vehicle', name: 'Service Readiness', target: 1, unit: 'check/quarter', weight: 5, recommendedFrequency: 'quarterly' },

  { id: 'home-cleaning-rhythm', categoryId: 'home', name: 'Home Cleaning Rhythm', target: 1, unit: 'deep-clean/month', weight: 6, recommendedFrequency: 'monthly' },
  { id: 'home-maintenance-readiness', categoryId: 'home', name: 'Home Maintenance Readiness', target: 2, unit: 'tasks/quarter', weight: 6, recommendedFrequency: 'quarterly' },

  { id: 'admin-weekly-control', categoryId: 'personal-admin', name: 'Weekly Admin Control', target: 1, unit: 'session/week', weight: 6, recommendedFrequency: 'weekly' },
  { id: 'admin-monthly-reset', categoryId: 'personal-admin', name: 'Monthly Reset', target: 1, unit: 'reset/month', weight: 5, recommendedFrequency: 'monthly' },

  { id: 'documents-validity-check', categoryId: 'documents', name: 'Document Validity Check', target: 1, unit: 'review/quarter', weight: 4, recommendedFrequency: 'quarterly' },
  { id: 'documents-organization', categoryId: 'documents', name: 'Document Organization', target: 1, unit: 'session/month', weight: 4, recommendedFrequency: 'monthly' },

  { id: 'insurance-policy-review', categoryId: 'insurance', name: 'Policy Review', target: 1, unit: 'review/quarter', weight: 5, recommendedFrequency: 'quarterly' },
  { id: 'insurance-renewal-readiness', categoryId: 'insurance', name: 'Renewal Readiness', target: 1, unit: 'check/month', weight: 5, recommendedFrequency: 'monthly' },

  { id: 'medical-preventive-care', categoryId: 'medical', name: 'Preventive Care Rhythm', target: 1, unit: 'check/month', weight: 7, recommendedFrequency: 'monthly' },
  { id: 'medical-treatment-followthrough', categoryId: 'medical', name: 'Treatment Follow-Through', target: 1, unit: 'review/week', weight: 7, recommendedFrequency: 'weekly' },

  { id: 'mental-wellness-recovery', categoryId: 'mental-wellness', name: 'Mental Recovery Rhythm', target: 5, unit: 'sessions/week', weight: 8, recommendedFrequency: 'daily' },
  { id: 'mental-wellness-reflection', categoryId: 'mental-wellness', name: 'Reflection Practice', target: 3, unit: 'sessions/week', weight: 6, recommendedFrequency: 'weekly' },

  { id: 'travel-readiness', categoryId: 'travel', name: 'Travel Readiness', target: 1, unit: 'review/month', weight: 4, recommendedFrequency: 'monthly' },
  { id: 'travel-planning-rhythm', categoryId: 'travel', name: 'Travel Planning Rhythm', target: 1, unit: 'session/month', weight: 4, recommendedFrequency: 'monthly' },

  { id: 'pets-care-rhythm', categoryId: 'pets', name: 'Pet Care Rhythm', target: 7, unit: 'care actions/week', weight: 7, recommendedFrequency: 'daily' },
  { id: 'pets-health-readiness', categoryId: 'pets', name: 'Pet Health Readiness', target: 1, unit: 'check/month', weight: 6, recommendedFrequency: 'monthly' },

  { id: 'productivity-daily-planning', categoryId: 'productivity', name: 'Daily Planning', target: 5, unit: 'plans/week', weight: 8, recommendedFrequency: 'daily' },
  { id: 'productivity-weekly-review', categoryId: 'productivity', name: 'Weekly Review', target: 1, unit: 'review/week', weight: 8, recommendedFrequency: 'weekly' },

  { id: 'digital-life-backup-rhythm', categoryId: 'digital-life', name: 'Backup Rhythm', target: 1, unit: 'backup/month', weight: 5, recommendedFrequency: 'monthly' },
  { id: 'digital-life-digital-hygiene', categoryId: 'digital-life', name: 'Digital Hygiene', target: 2, unit: 'sessions/month', weight: 4, recommendedFrequency: 'monthly' },

  { id: 'community-participation', categoryId: 'community', name: 'Community Participation', target: 2, unit: 'touchpoints/month', weight: 4, recommendedFrequency: 'monthly' },
  { id: 'community-service-rhythm', categoryId: 'community', name: 'Contribution Rhythm', target: 1, unit: 'action/month', weight: 4, recommendedFrequency: 'monthly' },

  { id: 'hobbies-creative-time', categoryId: 'hobbies', name: 'Creative Time', target: 2, unit: 'sessions/week', weight: 4, recommendedFrequency: 'weekly' },
  { id: 'hobbies-recreation-rhythm', categoryId: 'hobbies', name: 'Recreation Rhythm', target: 1, unit: 'session/week', weight: 3, recommendedFrequency: 'weekly' },

  { id: 'emergency-go-bag-readiness', categoryId: 'emergency-preparedness', name: 'Go-Bag Readiness', target: 1, unit: 'check/quarter', weight: 5, recommendedFrequency: 'quarterly' },
  { id: 'emergency-emergency-contacts', categoryId: 'emergency-preparedness', name: 'Emergency Contact Readiness', target: 1, unit: 'review/quarter', weight: 5, recommendedFrequency: 'quarterly' },

  { id: 'spirituality-practice-rhythm', categoryId: 'spirituality', name: 'Practice Rhythm', target: 5, unit: 'sessions/week', weight: 5, recommendedFrequency: 'daily' },
  { id: 'spirituality-reflection-rhythm', categoryId: 'spirituality', name: 'Reflection Rhythm', target: 1, unit: 'session/week', weight: 4, recommendedFrequency: 'weekly' },
];
