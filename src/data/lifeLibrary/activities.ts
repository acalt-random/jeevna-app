import { LifeLibraryActivityTemplate } from '@/types/onboarding';

function activity(
  id: string,
  kpiId: string,
  nameOrFrequency: string,
  frequencyOrTargetCount: LifeLibraryActivityTemplate['frequency'] | number,
  targetCountOrImportanceScore?: number,
  importanceScoreOrRecommended?: number | boolean,
  recommendedOrDefaultFrequency: boolean | LifeLibraryActivityTemplate['frequency'] = true,
  defaultFrequency?: LifeLibraryActivityTemplate['frequency']
): LifeLibraryActivityTemplate {
  const usesCompactSignature = typeof frequencyOrTargetCount === 'string';
  const frequency = usesCompactSignature
    ? frequencyOrTargetCount
    : (nameOrFrequency as LifeLibraryActivityTemplate['frequency']);
  const targetCount = usesCompactSignature
    ? (targetCountOrImportanceScore ?? 1)
    : frequencyOrTargetCount;
  const importanceScore = usesCompactSignature
    ? ((importanceScoreOrRecommended as number | undefined) ?? 5)
    : (targetCountOrImportanceScore ?? 5);
  const recommended = usesCompactSignature
    ? typeof recommendedOrDefaultFrequency === 'boolean'
      ? recommendedOrDefaultFrequency
      : true
    : typeof importanceScoreOrRecommended === 'boolean'
      ? importanceScoreOrRecommended
      : true;
  const resolvedDefaultFrequency =
    defaultFrequency ??
    (typeof recommendedOrDefaultFrequency === 'string'
      ? recommendedOrDefaultFrequency
      : frequency);

  return {
    id,
    kpiId,
    nameKey: `library.activities.${id}.name`,
    frequency,
    targetCount,
    importanceScore,
    recommended,
    defaultFrequency: resolvedDefaultFrequency,
  };
}

export const lifeLibraryActivities: LifeLibraryActivityTemplate[] = [
  activity('activity-sleep-same-bedtime', 'health-sleep-rhythm', 'daily', 1, 9),
  activity('activity-sleep-night-review', 'health-sleep-rhythm', 'daily', 1, 7),
  activity('activity-recovery-hydrate', 'health-recovery-check', 'daily', 1, 7),
  activity('activity-recovery-rest', 'health-recovery-check', 'daily', 1, 6),

  activity('activity-fitness-gym', 'fitness-workout-consistency', 'weekly', 4, 10),
  activity('activity-fitness-cardio', 'fitness-workout-consistency', 'weekly', 2, 7),
  activity('activity-mobility-stretch', 'fitness-mobility-consistency', 'daily', 1, 7),
  activity('activity-mobility-walk', 'fitness-mobility-consistency', 'daily', 1, 8),

  activity('activity-finance-expense-review', 'finance-budget-review', 'Review Expenses', 'weekly', 1, 9),
  activity('activity-finance-budget-adjust', 'finance-budget-review', 'Adjust Weekly Budget', 'weekly', 1, 7),
  activity('activity-finance-transfer', 'finance-savings-progress', 'Savings Transfer', 'weekly', 1, 10),
  activity('activity-finance-cashflow-check', 'finance-savings-progress', 'Cash Flow Check-In', 'weekly', 1, 7),
  activity('activity-finance-bill-calendar', 'finance-budget-review', 'Review Upcoming Bills', 'weekly', 1, 8),
  activity('activity-finance-subscription-audit', 'finance-budget-review', 'Subscription Audit', 'monthly', 1, 6, false),
  activity('activity-finance-no-spend-check', 'finance-savings-progress', 'No-Spend Day Check', 'weekly', 2, 5, false),

  activity('activity-investments-review', 'investments-portfolio-review', 'Portfolio Review', 'monthly', 1, 9),
  activity('activity-investments-rebalance-note', 'investments-portfolio-review', 'Rebalancing Note Review', 'quarterly', 1, 6, false),
  activity('activity-investments-contribution', 'investments-investing-consistency', 'Investment Contribution', 'monthly', 1, 10),
  activity('activity-investments-thesis-review', 'investments-investing-consistency', 'Review Investing Thesis', 'monthly', 1, 7),
  activity('activity-investments-goal-review', 'investments-investing-consistency', 'Goal Allocation Review', 'monthly', 1, 7),
  activity('activity-investments-risk-check', 'investments-portfolio-review', 'Risk Exposure Check', 'quarterly', 1, 6, false),

  activity('activity-career-deep-work-block', 'career-deep-work', 'Deep Work Block', 'daily', 1, 9),
  activity('activity-career-focus-plan', 'career-deep-work', 'Protect Focus Window', 'daily', 1, 8),
  activity('activity-career-skill-practice', 'career-growth-actions', 'Skill Practice Session', 'weekly', 2, 8),
  activity('activity-career-network-outreach', 'career-growth-actions', 'Career Outreach', 'weekly', 1, 7),

  activity('activity-learning-read', 'learning-reading-rhythm', 'Read 20 Pages', 'daily', 1, 8),
  activity('activity-learning-notes', 'learning-reading-rhythm', 'Capture Key Notes', 'weekly', 3, 6),
  activity('activity-learning-study-session', 'learning-study-consistency', 'Study Session', 'weekly', 3, 8),
  activity('activity-learning-course-module', 'learning-study-consistency', 'Complete Course Module', 'weekly', 1, 7),

  activity('activity-relationships-check-in', 'relationships-touchpoints', 'Relationship Check-In', 'weekly', 2, 9),
  activity('activity-relationships-thoughtful-message', 'relationships-touchpoints', 'Send Thoughtful Message', 'weekly', 1, 8),
  activity('activity-relationships-quality-time', 'relationships-quality-time', 'Quality Time Block', 'weekly', 1, 10),
  activity('activity-relationships-device-free-time', 'relationships-quality-time', 'Device-Free Conversation', 'weekly', 1, 8),
  activity('activity-relationships-shared-planning', 'relationships-quality-time', 'Shared Planning Check-In', 'weekly', 1, 7),
  activity('activity-relationships-repair-conversation', 'relationships-touchpoints', 'Repair Small Disconnects', 'weekly', 1, 8, false),

  activity('activity-parents-call', 'parents-connection-rhythm', 'Call Parents', 'weekly', 1, 10),
  activity('activity-parents-visit-plan', 'parents-connection-rhythm', 'Plan Parent Visit', 'monthly', 1, 8),
  activity('activity-parents-help-task', 'parents-support-actions', 'Help with a Parent Task', 'monthly', 1, 9),
  activity('activity-parents-medical-followup', 'parents-support-actions', 'Parent Medical Follow-Up', 'monthly', 1, 9),
  activity('activity-parents-bill-help', 'parents-support-actions', 'Help Review Parent Bills or Documents', 'monthly', 1, 7),
  activity('activity-parents-photo-share', 'parents-connection-rhythm', 'Share Family Update or Photos', 'weekly', 1, 6, false),

  activity('activity-friends-message', 'friends-social-rhythm', 'Message a Friend', 'weekly', 2, 8),
  activity('activity-friends-voice-note', 'friends-social-rhythm', 'Send Voice Note', 'weekly', 1, 6),
  activity('activity-friends-meetup', 'friends-meetups', 'Meet Friends', 'monthly', 1, 9),
  activity('activity-friends-plan-outing', 'friends-meetups', 'Plan an Outing', 'monthly', 1, 7),
  activity('activity-friends-birthday-check', 'friends-social-rhythm', 'Birthday and Important Date Check', 'monthly', 1, 5, false),
  activity('activity-friends-group-catchup', 'friends-meetups', 'Group Catch-Up Planning', 'monthly', 1, 6, false),

  activity('activity-family-meal', 'family-quality-time', 'Family Meal', 'weekly', 1, 8),
  activity('activity-family-catchup', 'family-quality-time', 'Family Catch-Up', 'weekly', 1, 7),
  activity('activity-family-calendar', 'family-coordination', 'Family Calendar Review', 'weekly', 1, 7),
  activity('activity-family-week-plan', 'family-coordination', 'Family Week Plan', 'weekly', 1, 7),

  activity('activity-vehicle-wash', 'vehicle-maintenance-rhythm', 'Wash Vehicle', 'monthly', 1, 6),
  activity('activity-vehicle-tyre-check', 'vehicle-maintenance-rhythm', 'Check Tire Pressure', 'monthly', 1, 8),
  activity('activity-vehicle-service-schedule', 'vehicle-service-readiness', 'Review Service Schedule', 'quarterly', 1, 9),
  activity('activity-vehicle-inspection', 'vehicle-service-readiness', 'Inspect Fluids and Brakes', 'quarterly', 1, 8),
  activity('activity-vehicle-clean-bike-chain', 'vehicle-maintenance-rhythm', 'Clean Bike Chain', 'monthly', 1, 8),
  activity('activity-vehicle-battery-check', 'vehicle-service-readiness', 'Battery Health Check', 'quarterly', 1, 7),
  activity('activity-vehicle-registration-check', 'vehicle-service-readiness', 'Registration Validity Check', 'quarterly', 1, 9),
  activity('activity-vehicle-emissions-check', 'vehicle-service-readiness', 'Emissions Certificate Check', 'yearly', 1, 8),
  activity('activity-vehicle-insurance-renewal-prep', 'vehicle-service-readiness', 'Prepare Vehicle Insurance Renewal', 'monthly', 1, 8),
  activity('activity-vehicle-pollution-doc-check', 'vehicle-service-readiness', 'Pollution Document Check', 'quarterly', 1, 7),

  activity('activity-home-deep-clean', 'home-cleaning-rhythm', 'Deep Cleaning', 'monthly', 1, 8),
  activity('activity-home-kitchen-reset', 'home-cleaning-rhythm', 'Kitchen Reset', 'weekly', 1, 7),
  activity('activity-home-ac-service', 'home-maintenance-readiness', 'AC Service', 'quarterly', 1, 8),
  activity('activity-home-water-filter', 'home-maintenance-readiness', 'Water Filter Replacement', 'quarterly', 1, 9),
  activity('activity-home-plumbing-check', 'home-maintenance-readiness', 'Plumbing Leak Check', 'monthly', 1, 7),
  activity('activity-home-electrical-check', 'home-maintenance-readiness', 'Electrical Safety Check', 'quarterly', 1, 8),
  activity('activity-home-pest-control', 'home-maintenance-readiness', 'Pest Control Review', 'quarterly', 1, 7),
  activity('activity-home-appliance-service', 'home-maintenance-readiness', 'Major Appliance Service Review', 'quarterly', 1, 6),
  activity('activity-home-fire-safety', 'home-maintenance-readiness', 'Fire Safety Equipment Check', 'quarterly', 1, 9),
  activity('activity-home-cleaning-supplies', 'home-cleaning-rhythm', 'Restock Cleaning Supplies', 'monthly', 1, 5, false),

  activity('activity-admin-weekly-planning', 'admin-weekly-control', 'Weekly Planning', 'weekly', 1, 9),
  activity('activity-admin-inbox-cleanup', 'admin-weekly-control', 'Inbox Cleanup', 'weekly', 1, 7),
  activity('activity-admin-monthly-review', 'admin-monthly-reset', 'Monthly Reset Review', 'monthly', 1, 8),
  activity('activity-admin-pending-items', 'admin-monthly-reset', 'Clear Pending Life Admin', 'monthly', 1, 8),
  activity('activity-admin-renewal-list', 'admin-monthly-reset', 'Review Upcoming Renewals', 'monthly', 1, 8),
  activity('activity-admin-task-triage', 'admin-weekly-control', 'Triage Loose Ends', 'weekly', 1, 7),

  activity('activity-documents-expiry-review', 'documents-validity-check', 'Review Expiry Dates', 'quarterly', 1, 10),
  activity('activity-documents-renewal-list', 'documents-validity-check', 'Update Renewal Checklist', 'quarterly', 1, 8),
  activity('activity-documents-digital-folder', 'documents-organization', 'Organize Document Folder', 'monthly', 1, 7),
  activity('activity-documents-scan-backup', 'documents-organization', 'Scan and Backup Important Documents', 'monthly', 1, 9),
  activity('activity-documents-passport-check', 'documents-validity-check', 'Passport Validity Check', 'quarterly', 1, 9),
  activity('activity-documents-id-check', 'documents-validity-check', 'Government ID Check', 'quarterly', 1, 8),
  activity('activity-documents-vehicle-doc-check', 'documents-organization', 'Vehicle Documents Folder Review', 'monthly', 1, 8),
  activity('activity-documents-medical-records', 'documents-organization', 'Medical Records Backup', 'monthly', 1, 7),

  activity('activity-insurance-policy-summary', 'insurance-policy-review', 'Review Policy Summary', 'quarterly', 1, 9),
  activity('activity-insurance-coverage-gap', 'insurance-policy-review', 'Check Coverage Gaps', 'quarterly', 1, 8),
  activity('activity-insurance-renewal-date', 'insurance-renewal-readiness', 'Confirm Renewal Dates', 'monthly', 1, 10),
  activity('activity-insurance-premium-check', 'insurance-renewal-readiness', 'Review Premium Payments', 'monthly', 1, 8),
  activity('activity-insurance-claim-readiness', 'insurance-policy-review', 'Claim Process Readiness Check', 'quarterly', 1, 7),
  activity('activity-insurance-beneficiary-review', 'insurance-policy-review', 'Beneficiary and Nominee Review', 'quarterly', 1, 7),
  activity('activity-insurance-vehicle-policy', 'insurance-renewal-readiness', 'Vehicle Insurance Review', 'monthly', 1, 8),
  activity('activity-insurance-health-policy', 'insurance-renewal-readiness', 'Health Insurance Review', 'monthly', 1, 8),

  activity('activity-medical-checkup', 'medical-preventive-care', 'Schedule Preventive Check', 'monthly', 1, 9),
  activity('activity-medical-lab-followup', 'medical-preventive-care', 'Review Lab or Screening Needs', 'quarterly', 1, 8),
  activity('activity-medical-medication-review', 'medical-treatment-followthrough', 'Medication Review', 'weekly', 1, 8),
  activity('activity-medical-appointment-followup', 'medical-treatment-followthrough', 'Follow Up on Appointments', 'weekly', 1, 9),
  activity('activity-medical-vaccination-check', 'medical-preventive-care', 'Vaccination Record Check', 'quarterly', 1, 7),
  activity('activity-medical-insurance-card', 'medical-treatment-followthrough', 'Medical Insurance Card Check', 'monthly', 1, 6),

  activity('activity-mental-wellness-breathing', 'mental-wellness-recovery', 'Breathing or Calm Reset', 'daily', 1, 7),
  activity('activity-mental-wellness-walk', 'mental-wellness-recovery', 'Mind-Clearing Walk', 'daily', 1, 6),
  activity('activity-mental-wellness-journal', 'mental-wellness-reflection', 'Journal Reflection', 'weekly', 2, 8),
  activity('activity-mental-wellness-therapy-checkin', 'mental-wellness-reflection', 'Therapy or Reflection Check-In', 'weekly', 1, 8),

  activity('activity-travel-documents', 'travel-readiness', 'Travel Documents Check', 'monthly', 1, 8),
  activity('activity-travel-bag-list', 'travel-readiness', 'Packing Checklist Refresh', 'monthly', 1, 6),
  activity('activity-travel-plan-session', 'travel-planning-rhythm', 'Trip Planning Session', 'monthly', 1, 7),
  activity('activity-travel-budget-check', 'travel-planning-rhythm', 'Travel Budget Check', 'monthly', 1, 6),

  activity('activity-pets-walk', 'pets-care-rhythm', 'Pet Walk or Play Session', 'daily', 1, 8),
  activity('activity-pets-feeding-check', 'pets-care-rhythm', 'Pet Care Check-In', 'daily', 1, 8),
  activity('activity-pets-vet-reminder', 'pets-health-readiness', 'Vet Reminder Review', 'monthly', 1, 9),
  activity('activity-pets-grooming', 'pets-health-readiness', 'Grooming or Hygiene Check', 'monthly', 1, 6),

  activity('activity-productivity-daily-plan', 'productivity-daily-planning', 'Plan the Day', 'daily', 1, 9),
  activity('activity-productivity-top-three', 'productivity-daily-planning', 'Choose Top Three Priorities', 'daily', 1, 9),
  activity('activity-productivity-weekly-review', 'productivity-weekly-review', 'Weekly Review', 'weekly', 1, 10),
  activity('activity-productivity-calendar-reset', 'productivity-weekly-review', 'Calendar Reset', 'weekly', 1, 8),

  activity('activity-digital-life-backup', 'digital-life-backup-rhythm', 'Run Backup', 'monthly', 1, 10),
  activity('activity-digital-life-photo-backup', 'digital-life-backup-rhythm', 'Backup Photos and Files', 'monthly', 1, 8),
  activity('activity-digital-life-cleanup', 'digital-life-digital-hygiene', 'Inbox or Desktop Cleanup', 'monthly', 1, 8),
  activity('activity-digital-life-subscription-review', 'digital-life-digital-hygiene', 'Subscription Review', 'monthly', 1, 8),
  activity('activity-digital-life-password-review', 'digital-life-digital-hygiene', 'Password Manager Review', 'quarterly', 1, 9),
  activity('activity-digital-life-storage-check', 'digital-life-backup-rhythm', 'Cloud Storage Check', 'monthly', 1, 7),
  activity('activity-digital-life-device-update', 'digital-life-digital-hygiene', 'Device Update Review', 'monthly', 1, 8),
  activity('activity-digital-life-two-factor-check', 'digital-life-digital-hygiene', 'Two-Factor Authentication Check', 'quarterly', 1, 9),

  activity('activity-community-attend', 'community-participation', 'Attend Community Event', 'monthly', 1, 5),
  activity('activity-community-checkin', 'community-participation', 'Check In with Community Contact', 'monthly', 1, 4),
  activity('activity-community-volunteer', 'community-service-rhythm', 'Volunteer or Help Someone', 'monthly', 1, 4),
  activity('activity-community-contribution', 'community-service-rhythm', 'Make a Small Contribution', 'monthly', 1, 4),

  activity('activity-hobbies-creative-session', 'hobbies-creative-time', 'Creative Hobby Session', 'weekly', 2, 4),
  activity('activity-hobbies-practice-skill', 'hobbies-creative-time', 'Practice Hobby Skill', 'weekly', 1, 4),
  activity('activity-hobbies-fun-block', 'hobbies-recreation-rhythm', 'Fun Block', 'weekly', 1, 3),
  activity('activity-hobbies-social-hobby', 'hobbies-recreation-rhythm', 'Shared Hobby Time', 'monthly', 1, 3),

  activity('activity-emergency-bag-check', 'emergency-go-bag-readiness', 'Go-Bag Check', 'quarterly', 1, 10),
  activity('activity-emergency-supplies-review', 'emergency-go-bag-readiness', 'Emergency Supplies Review', 'quarterly', 1, 9),
  activity('activity-emergency-contact-review', 'emergency-emergency-contacts', 'Emergency Contact Review', 'quarterly', 1, 10),
  activity('activity-emergency-document-pack', 'emergency-emergency-contacts', 'Emergency Document Pack Check', 'quarterly', 1, 9),
  activity('activity-emergency-med-kit-check', 'emergency-go-bag-readiness', 'Medical Kit Check', 'quarterly', 1, 9),
  activity('activity-emergency-power-check', 'emergency-go-bag-readiness', 'Flashlight and Power Backup Check', 'quarterly', 1, 8),
  activity('activity-emergency-home-drill', 'emergency-emergency-contacts', 'Family Emergency Plan Review', 'quarterly', 1, 8),

  activity('activity-spirituality-practice', 'spirituality-practice-rhythm', 'Prayer, Meditation, or Practice', 'daily', 1, 5),
  activity('activity-spirituality-reading', 'spirituality-practice-rhythm', 'Read Spiritual Text', 'weekly', 3, 4),
  activity('activity-spirituality-reflection', 'spirituality-reflection-rhythm', 'Weekly Reflection', 'weekly', 1, 4),
  activity('activity-spirituality-gratitude', 'spirituality-reflection-rhythm', 'Gratitude Practice', 'weekly', 3, 4),
];
