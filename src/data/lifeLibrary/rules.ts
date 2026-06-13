import {
  OnboardingOption,
  OnboardingStep,
  RelationshipTrackerTemplate,
  LifeLibraryRule,
} from '@/types/onboarding';
import { countries } from '@/src/data/countries';
import { localeDefinitions } from '@/src/data/locales';

function option(
  id: string,
  label: string,
  description?: string,
  icon?: string,
  groupLabel?: string,
  searchText?: string
): OnboardingOption {
  return {
    id,
    label,
    description,
    groupLabel,
    icon,
    searchText,
  };
}

export const localeOptions: OnboardingOption[] = [...localeDefinitions]
  .sort((left, right) => {
    if (Boolean(left.recommended) !== Boolean(right.recommended)) {
      return left.recommended ? -1 : 1;
    }
    return left.id.localeCompare(right.id);
  })
  .map((locale) =>
    option(
      locale.id,
      `${locale.nativeName}\n${locale.englishName} - ${locale.countryName}`,
      `Use ${locale.englishName} for ${locale.countryName}. Currency ${locale.currencyCode}. Timezone ${locale.timezone}.`,
      'language',
      locale.recommended ? 'Recommended Locales' : 'All Locales',
      `${locale.nativeName} ${locale.englishName} ${locale.countryName} ${locale.id}`
    )
  );

const topLanguageIds = ['en', 'hi', 'kn', 'ta', 'te'];
const regionDisplayNames: Record<string, string> = {
  IN: 'India',
  US: 'United States',
  GB: 'United Kingdom',
  CA: 'Canada',
  AU: 'Australia',
  SG: 'Singapore',
  AE: 'UAE',
  ES: 'Spain',
  MX: 'Mexico',
  AR: 'Argentina',
  CO: 'Colombia',
  FR: 'France',
  DE: 'Germany',
  BR: 'Brazil',
  PT: 'Portugal',
  CN: 'China',
  TW: 'Taiwan',
  RU: 'Russia',
  JP: 'Japan',
  KR: 'South Korea',
  SA: 'Saudi Arabia',
  TR: 'Turkey',
  ID: 'Indonesia',
  PL: 'Poland',
  IT: 'Italy',
  NL: 'Netherlands',
};
const languageDefinitions = Array.from(
  new Map(localeDefinitions.map((locale) => [locale.languageCode, locale])).values()
).sort((left, right) => {
  const leftIndex = topLanguageIds.indexOf(left.languageCode);
  const rightIndex = topLanguageIds.indexOf(right.languageCode);

  if (leftIndex !== -1 || rightIndex !== -1) {
    if (leftIndex === -1) return 1;
    if (rightIndex === -1) return -1;
    return leftIndex - rightIndex;
  }

  return left.englishName.localeCompare(right.englishName);
});

export const languageOptions: OnboardingOption[] = languageDefinitions.map((locale) =>
  option(
    locale.languageCode,
    locale.nativeName,
    locale.englishName === locale.nativeName
      ? `Use ${locale.englishName} throughout Life KPI.`
      : `Use ${locale.englishName} (${locale.nativeName}) throughout Life KPI.`,
    'translate',
    topLanguageIds.includes(locale.languageCode) ? 'Top Languages' : 'More Languages',
    `${locale.nativeName} ${locale.englishName} ${locale.languageCode}`
  )
);

const recommendedRegionCodes = ['IN', 'US', 'GB', 'CA', 'AU', 'SG', 'AE'];

export const regionOptions: OnboardingOption[] = countries
  .filter((country) => recommendedRegionCodes.includes(country.code))
  .map((country) =>
    option(
      country.code,
      regionDisplayNames[country.code] ?? country.code,
      `Defaults for ${country.defaultCurrencyCode} and ${country.defaultTimezone}.`,
      'public',
      'Recommended Regions',
      `${country.code} ${country.defaultLocale} ${country.defaultCurrencyCode} ${country.defaultTimezone}`
    )
  );

export const moreRegionOptions: OnboardingOption[] = countries
  .filter((country) => !recommendedRegionCodes.includes(country.code))
  .map((country) =>
    option(
      country.code,
      regionDisplayNames[country.code] ?? country.code,
      `Defaults for ${country.defaultCurrencyCode} and ${country.defaultTimezone}.`,
      'public',
      'More Regions',
      `${country.code} ${country.defaultLocale} ${country.defaultCurrencyCode} ${country.defaultTimezone}`
    )
  );

export const roleOptions: OnboardingOption[] = [
  option('employee', 'Employee', 'Stay effective at work and manage your workload well.', 'badge', 'Career & Work'),
  option('manager', 'Manager', 'Lead people, follow through on meetings, and keep responsibilities visible.', 'supervisor-account', 'Career & Work'),
  option('business_owner', 'Business Owner', 'Lead work, growth, and responsibility with intention.', 'business-center', 'Career & Work'),
  option('founder', 'Founder', 'Balance building, decision making, and long-horizon execution.', 'emoji-objects', 'Career & Work'),
  option('freelancer', 'Freelancer', 'Manage client work, pipeline, and self-direction.', 'work', 'Career & Work'),
  option('consultant', 'Consultant', 'Track delivery, client relationships, and follow-through.', 'assessment', 'Career & Work'),
  option('creator', 'Creator', 'Support publishing rhythm, content systems, and creative momentum.', 'color-lens', 'Career & Work'),
  option('sales_professional', 'Sales Professional', 'Stay consistent with outreach, pipeline, and relationship follow-up.', 'trending-up', 'Career & Work'),
  option('software_professional', 'Software Professional', 'Protect deep work, learning, and delivery habits.', 'code', 'Career & Work'),
  option('finance_professional', 'Finance Professional', 'Support precision, review cycles, and structured execution.', 'account-balance', 'Career & Work'),
  option('auditor', 'Auditor', 'Keep review, documentation, and follow-up clean and timely.', 'assignment-turned-in', 'Career & Work'),
  option('lawyer', 'Lawyer', 'Support casework, deadlines, and documentation follow-through.', 'gavel', 'Career & Work'),
  option('doctor', 'Doctor', 'Balance demanding work, health, and personal accountability.', 'local-hospital', 'Career & Work'),
  option('teacher', 'Teacher', 'Support planning, teaching energy, and meaningful routines.', 'school', 'Career & Work'),
  option('government_employee', 'Government Employee', 'Stay on top of structured work, duties, and long-term responsibilities.', 'account-balance', 'Career & Work'),
  option('student', 'Student', 'Balance classes, study, and long-term learning.', 'book', 'Education'),
  option('college_student', 'College Student', 'Handle academics, relationships, and independent routines.', 'school', 'Education'),
  option('exam_aspirant', 'Exam Aspirant', 'Create structure for revision, practice, and consistency.', 'assignment', 'Education'),
  option('researcher', 'Researcher', 'Support deep focus, learning systems, and long-form work.', 'science', 'Education'),
  option('intern', 'Intern', 'Build early-career habits, learning, and follow-through.', 'work', 'Education'),
  option('gym_member', 'Gym Member', 'You want exercise and fitness to be part of the system.', 'fitness-center', 'Health & Lifestyle'),
  option('runner', 'Runner', 'Support training rhythm, recovery, and performance consistency.', 'directions-run', 'Health & Lifestyle'),
  option('cyclist', 'Cyclist', 'Track rides, recovery, and equipment care.', 'directions-bike', 'Health & Lifestyle'),
  option('sportsperson', 'Sportsperson', 'Build reliable practice, performance, and recovery loops.', 'sports-basketball', 'Health & Lifestyle'),
  option('yoga_practitioner', 'Yoga Practitioner', 'Support mindful movement, recovery, and calm routines.', 'self-improvement', 'Health & Lifestyle'),
];

export const lifeStageOptions: OnboardingOption[] = [
  option('student', 'Student', 'Study, routines, exams, skills and career prep.', 'school'),
  option('early_career', 'Early Career', 'Build identity, momentum, and foundational habits.', 'flag'),
  option('mid_career', 'Mid Career', 'Balance performance, growth, and wider life responsibilities.', 'timeline'),
  option('senior_professional', 'Senior Professional', 'Support leadership, energy management, and long-horizon priorities.', 'stars'),
  option('business_owner', 'Business Owner', 'Build work systems, financial clarity and execution rhythm.', 'business-center'),
  option('parent', 'Parent', 'Family, children, routines, finances and care responsibilities.', 'family-restroom'),
  option('home_owner', 'Home Owner', 'Home upkeep, finances, long-term maintenance and stability.', 'home'),
  option('retired', 'Retired', 'Build a steady rhythm for health, relationships, and meaningful routines.', 'weekend'),
];

export const relationshipOptions: OnboardingOption[] = [
  option('partner', 'Partner', 'Protect the rhythm of your closest relationship.', 'favorite'),
  option('parents', 'Parents', 'Stay meaningfully connected with your parents.', 'people'),
  option('children', 'Children', 'Build in quality family time and support.', 'child-care'),
  option('siblings', 'Siblings', 'Keep sibling bonds warm and active.', 'diversity-3'),
  option('close_friends', 'Close Friends', 'Keep friendships active instead of accidental.', 'group'),
  option('extended_family', 'Extended Family', 'Stay connected beyond the immediate family unit.', 'family-restroom'),
  option('mentor', 'Mentor', 'Protect guidance, check-ins, and grateful follow-up.', 'school'),
  option('mentee', 'Mentee', 'Create room for coaching and structured support.', 'handshake'),
];

export const responsibilityOptions: OnboardingOption[] = [
  option('partner', 'Partner', 'Keep your closest relationship active and cared for.', 'favorite'),
  option('parents', 'Parents', 'Stay present with your parents through regular follow-through.', 'people'),
  option('children', 'Children', 'Protect family time, coordination, and care routines.', 'child-care'),
  option('parent', 'Parent', 'Build steadier support for family, coordination, and attention.', 'people'),
  option('pet_owner', 'Pet Owner', 'Build routines for care, movement, and health.', 'pets'),
  option('caregiver', 'Caregiver', 'Support recurring care, check-ins, and life admin for others.', 'favorite'),
  option('elder_care', 'Elder Care', 'Track care, medical coordination, and support for elders.', 'elderly'),
  option('dependent_family_member', 'Dependent Family Member', 'Support someone who relies on your follow-through.', 'family-restroom'),
  option('special_needs_dependent', 'Special Needs Dependent', 'Create more deliberate care, review, and readiness systems.', 'accessible'),
  option('community_responsibility', 'Community Responsibility', 'Show up consistently for people, groups, or causes beyond home.', 'volunteer-activism'),
  option('horse_owner', 'Animal Care or Horse Care', 'Support care, grooming, movement, and veterinary follow-through.', 'pets', 'More Responsibilities'),
  option('livestock_owner', 'Farm / Livestock Care', 'Track recurring care, supplies, and readiness for animals you manage.', 'agriculture', 'More Responsibilities'),
];

export const assetOptions: OnboardingOption[] = [
  option('home_owner', 'Home Owner', 'Your home needs recurring care and maintenance.', 'home', 'Housing'),
  option('apartment_owner', 'Apartment Owner', 'Track apartment maintenance, upkeep, and property admin.', 'apartment', 'Housing'),
  option('tenant', 'Tenant / Renter', 'Track household maintenance, documents, and rental responsibilities.', 'home-work', 'Housing'),
  option('rental_property_owner', 'Rental Property Owner', 'Manage rentals, upkeep, and property admin.', 'real-estate-agent', 'Housing'),
  option('land_owner', 'Land Owner', 'Track land-related documents, upkeep, and planning.', 'terrain', 'Housing'),
  option('second_home_owner', 'Second Home Owner', 'Stay on top of recurring care for another property.', 'holiday-village', 'Housing'),
  option('property_investor', 'Property Investor', 'Combine property readiness with investment discipline.', 'domain', 'Housing'),
  option('car_owner', 'Car Owner', 'Track car upkeep and preventive maintenance.', 'directions-car', 'Vehicles'),
  option('motorcycle_owner', 'Motorcycle Owner', 'Track bike cleaning, chain care, and service.', 'two-wheeler', 'Vehicles'),
  option('bicycle_owner', 'Bicycle Owner', 'Keep your bicycle ready, safe, and well maintained.', 'pedal-bike', 'Vehicles'),
  option('ev_owner', 'EV Owner', 'Support charging, service, and battery-health follow-through.', 'electric-car', 'Vehicles'),
  option('multiple_vehicle_owner', 'Multiple Vehicle Owner', 'Manage upkeep across more than one vehicle.', 'airport-shuttle', 'Vehicles'),
  option('boat_owner', 'Boat Owner', 'Track servicing, safety, and registration for your boat.', 'sailing', 'Vehicles'),
  option('investor', 'Investor', 'You want a real investing rhythm, not good intentions.', 'insert-chart', 'Financial Assets'),
  option('stock_investor', 'Stock Investor', 'Track review, allocation, and stock investing discipline.', 'show-chart', 'Financial Assets'),
  option('mutual_fund_investor', 'Mutual Fund Investor', 'Stay regular with SIPs, reviews, and fund hygiene.', 'stacked-line-chart', 'Financial Assets'),
  option('real_estate_investor', 'Real Estate Investor', 'Combine property and investing systems.', 'maps-home-work', 'Financial Assets'),
  option('crypto_investor', 'Crypto Investor', 'Track risk, reviews, and security habits carefully.', 'currency-bitcoin', 'Financial Assets'),
  option('retirement_planner', 'Retirement Planner', 'Support long-term financial planning and check-ins.', 'account-balance-wallet', 'Financial Assets'),
  option('business_owner', 'Business Owner', 'You manage business operations, finances, and follow-through.', 'business-center', 'Business / Digital Assets'),
  option('freelancer', 'Freelancer', 'You run your own client work and delivery systems.', 'work', 'Business / Digital Assets'),
  option('consultant', 'Consultant', 'You manage delivery, follow-up, and reputation across clients.', 'assessment', 'Business / Digital Assets'),
  option('landlord', 'Landlord', 'You manage tenants, upkeep, and rental operations.', 'real-estate-agent', 'Business / Digital Assets'),
  option('website_owner', 'Website Owner', 'Keep your website healthy, updated, and protected.', 'language', 'Business / Digital Assets'),
  option('domain_owner', 'Domain Owner', 'Track renewals and digital ownership readiness.', 'dns', 'Business / Digital Assets'),
  option('content_creator', 'Content Creator', 'Support publishing systems and digital asset follow-through.', 'perm-media', 'Business / Digital Assets'),
  option('youtube_channel_owner', 'YouTube Channel Owner', 'Create rhythm for publishing and channel upkeep.', 'smart-display', 'Business / Digital Assets'),
  option('newsletter_owner', 'Newsletter Owner', 'Maintain writing cadence and subscriber-focused systems.', 'mail', 'Business / Digital Assets'),
  option('online_store_owner', 'Online Store Owner', 'Support store operations, review cycles, and digital hygiene.', 'storefront', 'Business / Digital Assets'),
];

export const interestOptions: OnboardingOption[] = [
  option('fitness', 'Fitness', 'Movement, training, and feeling stronger matter to you.', 'fitness-center'),
  option('investor', 'Investing', 'You care about money growth, planning, and long-term stability.', 'show-chart'),
  option('learning', 'Reading', 'Books, learning, and knowledge feel naturally rewarding.', 'menu-book'),
  option('technology', 'Technology', 'Apps, tools, and digital systems interest you.', 'devices'),
  option('motorcycles', 'Motorcycles', 'Rides, maintenance, and riding culture matter to you.', 'two-wheeler'),
  option('travel_enthusiast', 'Travel', 'Trips and travel readiness are part of your life.', 'travel-explore'),
  option('cooking', 'Cooking', 'Food, meal prep, and home cooking matter to you.', 'restaurant'),
  option('music', 'Music', 'Practice, listening, and creative expression matter to you.', 'music-note'),
  option('photography', 'Photography', 'Capturing moments and creative craft matter to you.', 'photo-camera'),
  option('gaming', 'Gaming', 'Play, community, and digital recreation matter to you.', 'sports-esports'),
  option('spirituality', 'Spirituality', 'You want space for spiritual or reflective practice.', 'self-improvement'),
  option('volunteering', 'Volunteering', 'You want to contribute to people and causes consistently.', 'volunteer-activism'),
];

export const currentFocusOptions: OnboardingOption[] = [
  option('lose_weight', 'Lose Weight', 'Create steady health momentum and better routines.', 'monitor-weight'),
  option('build_muscle', 'Build Muscle', 'Focus on strength, recovery, and training consistency.', 'fitness-center'),
  option('save_more_money', 'Save More Money', 'Build savings discipline and cleaner money habits.', 'savings'),
  option('reduce_debt', 'Reduce Debt', 'Bring more control and calm to financial obligations.', 'credit-score'),
  option('career_growth', 'Career Growth', 'Create momentum in work, learning, and opportunity.', 'trending-up'),
  option('better_relationships', 'Better Relationships', 'Be more present and consistent with important people.', 'favorite'),
  option('mental_wellbeing', 'Mental Wellbeing', 'Protect recovery, calm, and emotional steadiness.', 'spa'),
  option('productivity_focus', 'Productivity', 'Reduce friction and get more done with less chaos.', 'task-alt'),
  option('learning_focus', 'Learning', 'Create a real rhythm for study, reading, and growth.', 'school'),
  option('travel_focus', 'Travel', 'Stay ready for trips, planning, and travel admin.', 'travel-explore'),
  option('better_sleep', 'Better Sleep', 'Improve energy, recovery, and consistency.', 'bedtime'),
  option('digital_discipline', 'Digital Discipline', 'Bring order to devices, files, and digital habits.', 'devices'),
  option('family_time', 'Family Time', 'Protect connection, presence, and shared routines.', 'family-restroom'),
  option('home_organization', 'Home Organization', 'Create more calm through home systems and upkeep.', 'home'),
];

export const priorityOptions = currentFocusOptions;

export const onboardingSteps: OnboardingStep[] = [
  {
    id: 'language',
    title: 'Language',
    subtitle: 'Choose the language you want to use every day.',
    helperText: 'Top languages are shown first. More languages stay one tap away.',
    singleSelect: true,
    options: languageOptions,
  },
  {
    id: 'region',
    title: 'Region',
    subtitle: 'Pick the country that should shape your defaults.',
    helperText: 'We use this for locale, currency, and timezone defaults.',
    singleSelect: true,
    options: [...regionOptions, ...moreRegionOptions],
  },
  {
    id: 'lifeStages',
    title: 'Life Stage',
    subtitle: 'What season of life are you in right now?',
    helperText: 'Choose the one that best fits right now.',
    options: lifeStageOptions,
  },
  {
    id: 'responsibilities',
    title: 'Responsibilities',
    subtitle: 'Who or what do you take care of?',
    helperText: 'These add relationship trackers, recurring care, and readiness routines.',
    options: responsibilityOptions,
  },
  {
    id: 'assets',
    title: 'Assets & Ownership',
    subtitle: 'What do you own or manage that needs recurring care?',
    helperText: 'Assets unlock maintenance, readiness, and digital ownership routines.',
    options: assetOptions,
  },
  {
    id: 'currentFocus',
    title: 'Current Focus',
    subtitle: 'What would make the biggest difference right now?',
    helperText: 'Choose up to three.',
    options: currentFocusOptions,
    maxSelections: 3,
  },
  {
    id: 'interests',
    title: 'Interests',
    subtitle: 'What areas do you naturally care about improving?',
    helperText: 'These help personalize the system beyond basic responsibilities.',
    options: interestOptions,
  },
];

export const relationshipTrackerTemplates: RelationshipTrackerTemplate[] = [
  {
    trigger: 'partner',
    nameKey: 'library.relationshipTypes.partner',
    relationshipTypeKey: 'library.relationshipTypes.partner',
    groupNameKey: 'library.relationshipGroups.family',
    frequency: 'weekly',
    todoTitleKey: 'library.activities.activity-relationships-quality-time.name',
    notesKey: 'library.trackerNotes.generated',
  },
  {
    trigger: 'parents',
    nameKey: 'library.categories.parents.name',
    relationshipTypeKey: 'library.relationshipTypes.parent',
    groupNameKey: 'library.relationshipGroups.family',
    frequency: 'weekly',
    todoTitleKey: 'library.activities.activity-parents-call.name',
    notesKey: 'library.trackerNotes.generated',
  },
  {
    trigger: 'children',
    nameKey: 'library.relationshipTypes.child',
    relationshipTypeKey: 'library.relationshipTypes.child',
    groupNameKey: 'library.relationshipGroups.family',
    frequency: 'weekly',
    todoTitleKey: 'library.activities.activity-family-catchup.name',
    notesKey: 'library.trackerNotes.generated',
  },
  {
    trigger: 'close_friends',
    nameKey: 'library.categories.friends.name',
    relationshipTypeKey: 'library.relationshipTypes.friend',
    groupNameKey: 'library.relationshipGroups.college',
    frequency: 'monthly',
    todoTitleKey: 'library.activities.activity-friends-meetup.name',
    notesKey: 'library.trackerNotes.generated',
  },
];

function cloneRule(trigger: string, source: LifeLibraryRule): LifeLibraryRule {
  return {
    trigger,
    categories: [...source.categories],
    kpis: [...source.kpis],
    activities: [...source.activities],
  };
}

const motorcycleOwnerRule: LifeLibraryRule = {
  trigger: 'motorcycle_owner',
  categories: ['vehicle', 'insurance', 'documents', 'emergency-preparedness'],
  kpis: [
    'vehicle-maintenance-rhythm',
    'vehicle-service-readiness',
    'insurance-renewal-readiness',
    'documents-organization',
    'emergency-go-bag-readiness',
  ],
  activities: [
    'activity-vehicle-wash',
    'activity-vehicle-clean-bike-chain',
    'activity-vehicle-tyre-check',
    'activity-vehicle-service-schedule',
    'activity-vehicle-registration-check',
    'activity-vehicle-pollution-doc-check',
    'activity-insurance-vehicle-policy',
    'activity-documents-vehicle-doc-check',
    'activity-emergency-med-kit-check',
  ],
};

const carOwnerRule: LifeLibraryRule = {
  trigger: 'car_owner',
  categories: ['vehicle', 'insurance', 'documents', 'emergency-preparedness'],
  kpis: [
    'vehicle-maintenance-rhythm',
    'vehicle-service-readiness',
    'insurance-renewal-readiness',
    'documents-organization',
    'emergency-go-bag-readiness',
  ],
  activities: [
    'activity-vehicle-wash',
    'activity-vehicle-tyre-check',
    'activity-vehicle-service-schedule',
    'activity-vehicle-battery-check',
    'activity-vehicle-registration-check',
    'activity-insurance-renewal-date',
    'activity-insurance-vehicle-policy',
    'activity-documents-vehicle-doc-check',
    'activity-emergency-power-check',
  ],
};

const homeOwnerRule: LifeLibraryRule = {
  trigger: 'home_owner',
  categories: ['home', 'documents', 'insurance', 'emergency-preparedness', 'personal-admin'],
  kpis: [
    'home-cleaning-rhythm',
    'home-maintenance-readiness',
    'documents-validity-check',
    'insurance-policy-review',
    'emergency-go-bag-readiness',
    'admin-monthly-reset',
  ],
  activities: [
    'activity-home-deep-clean',
    'activity-home-ac-service',
    'activity-home-water-filter',
    'activity-home-plumbing-check',
    'activity-home-electrical-check',
    'activity-home-fire-safety',
    'activity-documents-expiry-review',
    'activity-insurance-policy-summary',
    'activity-emergency-supplies-review',
    'activity-admin-renewal-list',
  ],
};

const investorRule: LifeLibraryRule = {
  trigger: 'investor',
  categories: ['finance', 'investments', 'documents', 'insurance', 'digital-life'],
  kpis: [
    'finance-savings-progress',
    'finance-budget-review',
    'investments-portfolio-review',
    'investments-investing-consistency',
    'documents-organization',
    'digital-life-backup-rhythm',
  ],
  activities: [
    'activity-finance-transfer',
    'activity-finance-expense-review',
    'activity-investments-review',
    'activity-investments-contribution',
    'activity-investments-thesis-review',
    'activity-investments-goal-review',
    'activity-documents-scan-backup',
    'activity-digital-life-backup',
  ],
};

const petOwnerRule: LifeLibraryRule = {
  trigger: 'pet_owner',
  categories: ['pets', 'medical', 'insurance', 'documents', 'emergency-preparedness'],
  kpis: [
    'pets-care-rhythm',
    'pets-health-readiness',
    'medical-preventive-care',
    'insurance-policy-review',
    'documents-organization',
  ],
  activities: [
    'activity-pets-walk',
    'activity-pets-vet-reminder',
    'activity-pets-grooming',
    'activity-medical-checkup',
    'activity-insurance-policy-summary',
    'activity-documents-medical-records',
  ],
};

export const lifeLibraryRules: LifeLibraryRule[] = [
  motorcycleOwnerRule,
  carOwnerRule,
  homeOwnerRule,
  investorRule,
  cloneRule('early_career', { trigger: 'career_focus', categories: ['career', 'learning', 'productivity'], kpis: ['career-deep-work', 'career-growth-actions', 'learning-study-consistency'], activities: ['activity-career-deep-work-block', 'activity-career-network-outreach', 'activity-learning-study-session'] }),
  cloneRule('mid_career', { trigger: 'career_focus', categories: ['career', 'learning', 'productivity'], kpis: ['career-deep-work', 'career-growth-actions', 'learning-study-consistency'], activities: ['activity-career-deep-work-block', 'activity-career-network-outreach', 'activity-learning-study-session'] }),
  cloneRule('senior_professional', { trigger: 'career_focus', categories: ['career', 'learning', 'productivity'], kpis: ['career-deep-work', 'career-growth-actions', 'learning-study-consistency'], activities: ['activity-career-deep-work-block', 'activity-career-network-outreach', 'activity-learning-study-session'] }),
  { trigger: 'retired', categories: ['health', 'relationships', 'home', 'medical'], kpis: ['health-sleep-rhythm', 'relationships-touchpoints', 'home-cleaning-rhythm', 'medical-preventive-care'], activities: ['activity-sleep-same-bedtime', 'activity-relationships-check-in', 'activity-home-deep-clean', 'activity-medical-checkup'] },
  { trigger: 'gym_member', categories: ['health', 'fitness'], kpis: ['fitness-workout-consistency', 'fitness-mobility-consistency', 'health-recovery-check'], activities: ['activity-fitness-gym', 'activity-fitness-cardio', 'activity-mobility-stretch', 'activity-recovery-hydrate'] },
  { trigger: 'partner', categories: ['relationships', 'family'], kpis: ['relationships-quality-time', 'family-quality-time'], activities: ['activity-relationships-quality-time', 'activity-family-meal'] },
  { trigger: 'parents', categories: ['parents', 'relationships', 'medical', 'documents', 'personal-admin'], kpis: ['parents-connection-rhythm', 'parents-support-actions', 'relationships-touchpoints', 'medical-treatment-followthrough', 'documents-organization'], activities: ['activity-parents-call', 'activity-parents-help-task', 'activity-parents-medical-followup', 'activity-parents-bill-help', 'activity-relationships-check-in', 'activity-medical-appointment-followup', 'activity-documents-medical-records'] },
  petOwnerRule,
  { trigger: 'student', categories: ['learning', 'productivity', 'career'], kpis: ['learning-study-consistency', 'learning-reading-rhythm', 'productivity-daily-planning'], activities: ['activity-learning-study-session', 'activity-learning-read', 'activity-productivity-daily-plan'] },
  { trigger: 'employee', categories: ['career', 'productivity', 'digital-life', 'personal-admin', 'documents'], kpis: ['career-deep-work', 'career-growth-actions', 'productivity-weekly-review', 'digital-life-digital-hygiene', 'admin-weekly-control'], activities: ['activity-career-deep-work-block', 'activity-career-skill-practice', 'activity-productivity-weekly-review', 'activity-digital-life-cleanup', 'activity-digital-life-password-review', 'activity-admin-inbox-cleanup'] },
  { trigger: 'business_owner', categories: ['career', 'finance', 'productivity', 'documents', 'insurance', 'digital-life'], kpis: ['career-growth-actions', 'finance-budget-review', 'productivity-weekly-review', 'documents-organization', 'insurance-policy-review'], activities: ['activity-career-network-outreach', 'activity-finance-expense-review', 'activity-finance-bill-calendar', 'activity-productivity-calendar-reset', 'activity-documents-scan-backup', 'activity-insurance-policy-summary', 'activity-digital-life-backup'] },
  { trigger: 'children', categories: ['family', 'relationships'], kpis: ['family-quality-time', 'family-coordination', 'relationships-quality-time'], activities: ['activity-family-catchup', 'activity-family-calendar', 'activity-relationships-quality-time'] },
  { trigger: 'close_friends', categories: ['friends', 'relationships', 'personal-admin'], kpis: ['friends-social-rhythm', 'friends-meetups', 'relationships-touchpoints'], activities: ['activity-friends-message', 'activity-friends-meetup', 'activity-friends-birthday-check', 'activity-relationships-thoughtful-message'] },
  { trigger: 'mentor', categories: ['relationships', 'career'], kpis: ['relationships-touchpoints', 'career-growth-actions'], activities: ['activity-relationships-check-in', 'activity-career-network-outreach'] },
  { trigger: 'mentee', categories: ['relationships', 'career'], kpis: ['relationships-touchpoints', 'career-growth-actions'], activities: ['activity-relationships-thoughtful-message', 'activity-career-skill-practice'] },
  { trigger: 'siblings', categories: ['relationships', 'family'], kpis: ['relationships-touchpoints', 'family-quality-time'], activities: ['activity-relationships-check-in', 'activity-family-catchup'] },
  { trigger: 'extended_family', categories: ['family', 'relationships'], kpis: ['family-coordination', 'relationships-touchpoints'], activities: ['activity-family-calendar', 'activity-relationships-check-in'] },
  { trigger: 'parent', categories: ['family', 'relationships'], kpis: ['family-quality-time', 'family-coordination'], activities: ['activity-family-catchup', 'activity-family-calendar'] },
  { trigger: 'caregiver', categories: ['family', 'medical', 'personal-admin'], kpis: ['family-coordination', 'medical-treatment-followthrough', 'admin-weekly-control'], activities: ['activity-family-calendar', 'activity-medical-appointment-followup', 'activity-admin-task-triage'] },
  { trigger: 'elder_care', categories: ['parents', 'medical', 'documents', 'personal-admin'], kpis: ['parents-support-actions', 'medical-treatment-followthrough', 'documents-organization'], activities: ['activity-parents-medical-followup', 'activity-medical-appointment-followup', 'activity-documents-medical-records'] },
  { trigger: 'dependent_family_member', categories: ['family', 'medical', 'documents'], kpis: ['family-coordination', 'medical-treatment-followthrough', 'documents-organization'], activities: ['activity-family-calendar', 'activity-medical-medication-review', 'activity-documents-medical-records'] },
  { trigger: 'special_needs_dependent', categories: ['family', 'medical', 'documents', 'emergency-preparedness'], kpis: ['family-coordination', 'medical-treatment-followthrough', 'documents-organization', 'emergency-emergency-contacts'], activities: ['activity-family-calendar', 'activity-medical-medication-review', 'activity-documents-medical-records', 'activity-emergency-contact-review'] },
  { trigger: 'livestock_owner', categories: ['pets', 'documents', 'emergency-preparedness'], kpis: ['pets-care-rhythm', 'documents-organization', 'emergency-go-bag-readiness'], activities: ['activity-pets-grooming', 'activity-documents-scan-backup', 'activity-emergency-supplies-review'] },
  { trigger: 'horse_owner', categories: ['pets', 'medical', 'documents'], kpis: ['pets-care-rhythm', 'pets-health-readiness', 'documents-organization'], activities: ['activity-pets-grooming', 'activity-pets-vet-reminder', 'activity-documents-medical-records'] },
  cloneRule('stock_investor', investorRule),
  cloneRule('mutual_fund_investor', investorRule),
  cloneRule('real_estate_investor', investorRule),
  cloneRule('crypto_investor', investorRule),
  cloneRule('retirement_planner', investorRule),
  cloneRule('property_investor', homeOwnerRule),
  cloneRule('rental_property_owner', homeOwnerRule),
  cloneRule('land_owner', homeOwnerRule),
  cloneRule('second_home_owner', homeOwnerRule),
  cloneRule('apartment_owner', homeOwnerRule),
  cloneRule('tenant', homeOwnerRule),
  cloneRule('bicycle_owner', motorcycleOwnerRule),
  cloneRule('ev_owner', carOwnerRule),
  cloneRule('multiple_vehicle_owner', carOwnerRule),
  cloneRule('boat_owner', motorcycleOwnerRule),
  { trigger: 'website_owner', categories: ['digital-life', 'documents', 'personal-admin'], kpis: ['digital-life-digital-hygiene', 'digital-life-backup-rhythm', 'admin-weekly-control'], activities: ['activity-digital-life-device-update', 'activity-digital-life-backup', 'activity-admin-inbox-cleanup'] },
  { trigger: 'domain_owner', categories: ['digital-life', 'documents'], kpis: ['digital-life-digital-hygiene', 'documents-organization'], activities: ['activity-digital-life-password-review', 'activity-documents-scan-backup'] },
  { trigger: 'content_creator', categories: ['career', 'digital-life', 'productivity'], kpis: ['career-growth-actions', 'digital-life-digital-hygiene', 'productivity-weekly-review'], activities: ['activity-career-network-outreach', 'activity-digital-life-backup', 'activity-productivity-calendar-reset'] },
  cloneRule('youtube_channel_owner', { trigger: 'youtube_channel_owner', categories: ['career', 'digital-life', 'productivity'], kpis: ['career-growth-actions', 'digital-life-digital-hygiene', 'productivity-weekly-review'], activities: ['activity-career-network-outreach', 'activity-digital-life-backup', 'activity-productivity-calendar-reset'] }),
  cloneRule('newsletter_owner', { trigger: 'newsletter_owner', categories: ['career', 'digital-life', 'productivity'], kpis: ['career-growth-actions', 'digital-life-digital-hygiene', 'productivity-weekly-review'], activities: ['activity-career-network-outreach', 'activity-digital-life-backup', 'activity-productivity-calendar-reset'] }),
  cloneRule('online_store_owner', { trigger: 'online_store_owner', categories: ['career', 'finance', 'digital-life', 'productivity'], kpis: ['career-growth-actions', 'finance-budget-review', 'digital-life-digital-hygiene', 'productivity-weekly-review'], activities: ['activity-career-network-outreach', 'activity-finance-expense-review', 'activity-digital-life-backup', 'activity-productivity-calendar-reset'] }),
  { trigger: 'learning', categories: ['learning'], kpis: ['learning-reading-rhythm', 'learning-study-consistency'], activities: ['activity-learning-read', 'activity-learning-course-module'] },
  { trigger: 'productivity', categories: ['productivity', 'personal-admin', 'digital-life', 'documents'], kpis: ['productivity-daily-planning', 'productivity-weekly-review', 'admin-weekly-control', 'digital-life-digital-hygiene'], activities: ['activity-productivity-daily-plan', 'activity-productivity-weekly-review', 'activity-admin-weekly-planning', 'activity-admin-task-triage', 'activity-digital-life-cleanup'] },
  { trigger: 'mental_wellness', categories: ['mental-wellness', 'health'], kpis: ['mental-wellness-recovery', 'mental-wellness-reflection', 'health-recovery-check'], activities: ['activity-mental-wellness-breathing', 'activity-mental-wellness-journal', 'activity-recovery-rest'] },
  { trigger: 'travel_enthusiast', categories: ['travel', 'documents', 'insurance', 'finance', 'medical'], kpis: ['travel-readiness', 'travel-planning-rhythm', 'documents-validity-check', 'insurance-policy-review', 'finance-budget-review'], activities: ['activity-travel-documents', 'activity-travel-plan-session', 'activity-travel-budget-check', 'activity-documents-digital-folder', 'activity-insurance-policy-summary', 'activity-medical-vaccination-check'] },
  { trigger: 'spirituality', categories: ['spirituality', 'mental-wellness'], kpis: ['spirituality-practice-rhythm', 'spirituality-reflection-rhythm', 'mental-wellness-reflection'], activities: ['activity-spirituality-practice', 'activity-spirituality-reflection', 'activity-mental-wellness-journal'] },
  { trigger: 'health_focus', categories: ['health', 'fitness', 'medical'], kpis: ['health-sleep-rhythm', 'fitness-workout-consistency', 'medical-preventive-care'], activities: ['activity-sleep-same-bedtime', 'activity-fitness-gym', 'activity-medical-checkup'] },
  cloneRule('lose_weight', { trigger: 'health_focus', categories: ['health', 'fitness', 'medical'], kpis: ['health-sleep-rhythm', 'fitness-workout-consistency', 'medical-preventive-care'], activities: ['activity-sleep-same-bedtime', 'activity-fitness-gym', 'activity-medical-checkup'] }),
  cloneRule('build_muscle', { trigger: 'health_focus', categories: ['health', 'fitness', 'medical'], kpis: ['health-sleep-rhythm', 'fitness-workout-consistency', 'medical-preventive-care'], activities: ['activity-sleep-same-bedtime', 'activity-fitness-gym', 'activity-medical-checkup'] }),
  cloneRule('better_sleep', { trigger: 'health_focus', categories: ['health', 'fitness', 'medical'], kpis: ['health-sleep-rhythm', 'fitness-workout-consistency', 'medical-preventive-care'], activities: ['activity-sleep-same-bedtime', 'activity-fitness-gym', 'activity-medical-checkup'] }),
  { trigger: 'finance_focus', categories: ['finance', 'investments', 'insurance', 'documents', 'personal-admin'], kpis: ['finance-budget-review', 'finance-savings-progress', 'investments-investing-consistency', 'insurance-policy-review', 'documents-organization'], activities: ['activity-finance-expense-review', 'activity-finance-transfer', 'activity-finance-bill-calendar', 'activity-investments-contribution', 'activity-insurance-policy-summary', 'activity-documents-scan-backup'] },
  cloneRule('save_more_money', { trigger: 'finance_focus', categories: ['finance', 'investments', 'insurance', 'documents', 'personal-admin'], kpis: ['finance-budget-review', 'finance-savings-progress', 'investments-investing-consistency', 'insurance-policy-review', 'documents-organization'], activities: ['activity-finance-expense-review', 'activity-finance-transfer', 'activity-finance-bill-calendar', 'activity-investments-contribution', 'activity-insurance-policy-summary', 'activity-documents-scan-backup'] }),
  cloneRule('reduce_debt', { trigger: 'finance_focus', categories: ['finance', 'investments', 'insurance', 'documents', 'personal-admin'], kpis: ['finance-budget-review', 'finance-savings-progress', 'investments-investing-consistency', 'insurance-policy-review', 'documents-organization'], activities: ['activity-finance-expense-review', 'activity-finance-transfer', 'activity-finance-bill-calendar', 'activity-investments-contribution', 'activity-insurance-policy-summary', 'activity-documents-scan-backup'] }),
  { trigger: 'career_focus', categories: ['career', 'learning', 'productivity'], kpis: ['career-deep-work', 'career-growth-actions', 'learning-study-consistency'], activities: ['activity-career-deep-work-block', 'activity-career-network-outreach', 'activity-learning-study-session'] },
  cloneRule('career_growth', { trigger: 'career_focus', categories: ['career', 'learning', 'productivity'], kpis: ['career-deep-work', 'career-growth-actions', 'learning-study-consistency'], activities: ['activity-career-deep-work-block', 'activity-career-network-outreach', 'activity-learning-study-session'] }),
  { trigger: 'relationship_focus', categories: ['relationships', 'parents', 'friends', 'family', 'personal-admin'], kpis: ['relationships-touchpoints', 'relationships-quality-time', 'parents-connection-rhythm', 'friends-social-rhythm', 'family-coordination'], activities: ['activity-relationships-check-in', 'activity-relationships-quality-time', 'activity-parents-call', 'activity-friends-message', 'activity-family-calendar'] },
  cloneRule('better_relationships', { trigger: 'relationship_focus', categories: ['relationships', 'parents', 'friends', 'family', 'personal-admin'], kpis: ['relationships-touchpoints', 'relationships-quality-time', 'parents-connection-rhythm', 'friends-social-rhythm', 'family-coordination'], activities: ['activity-relationships-check-in', 'activity-relationships-quality-time', 'activity-parents-call', 'activity-friends-message', 'activity-family-calendar'] }),
  cloneRule('family_time', { trigger: 'relationship_focus', categories: ['relationships', 'parents', 'friends', 'family', 'personal-admin'], kpis: ['relationships-touchpoints', 'relationships-quality-time', 'parents-connection-rhythm', 'friends-social-rhythm', 'family-coordination'], activities: ['activity-relationships-check-in', 'activity-relationships-quality-time', 'activity-parents-call', 'activity-friends-message', 'activity-family-calendar'] }),
  { trigger: 'home_focus', categories: ['home', 'personal-admin', 'documents', 'insurance', 'emergency-preparedness'], kpis: ['home-cleaning-rhythm', 'home-maintenance-readiness', 'admin-weekly-control', 'documents-validity-check', 'emergency-go-bag-readiness'], activities: ['activity-home-deep-clean', 'activity-home-water-filter', 'activity-home-fire-safety', 'activity-admin-inbox-cleanup', 'activity-documents-expiry-review', 'activity-emergency-supplies-review'] },
  cloneRule('home_organization', { trigger: 'home_focus', categories: ['home', 'personal-admin', 'documents', 'insurance', 'emergency-preparedness'], kpis: ['home-cleaning-rhythm', 'home-maintenance-readiness', 'admin-weekly-control', 'documents-validity-check', 'emergency-go-bag-readiness'], activities: ['activity-home-deep-clean', 'activity-home-water-filter', 'activity-home-fire-safety', 'activity-admin-inbox-cleanup', 'activity-documents-expiry-review', 'activity-emergency-supplies-review'] }),
  { trigger: 'documents_focus', categories: ['documents', 'insurance', 'digital-life', 'medical', 'personal-admin'], kpis: ['documents-validity-check', 'documents-organization', 'insurance-renewal-readiness', 'digital-life-backup-rhythm'], activities: ['activity-documents-expiry-review', 'activity-documents-scan-backup', 'activity-documents-passport-check', 'activity-insurance-renewal-date', 'activity-digital-life-backup'] },
  cloneRule('digital_discipline', { trigger: 'documents_focus', categories: ['documents', 'insurance', 'digital-life', 'medical', 'personal-admin'], kpis: ['documents-validity-check', 'documents-organization', 'insurance-renewal-readiness', 'digital-life-backup-rhythm'], activities: ['activity-documents-expiry-review', 'activity-documents-scan-backup', 'activity-documents-passport-check', 'activity-insurance-renewal-date', 'activity-digital-life-backup'] }),
  { trigger: 'emergency_preparedness', categories: ['emergency-preparedness', 'documents', 'medical', 'insurance', 'home', 'digital-life'], kpis: ['emergency-go-bag-readiness', 'emergency-emergency-contacts', 'documents-organization', 'medical-preventive-care', 'digital-life-backup-rhythm'], activities: ['activity-emergency-bag-check', 'activity-emergency-supplies-review', 'activity-emergency-contact-review', 'activity-emergency-document-pack', 'activity-emergency-home-drill', 'activity-documents-scan-backup', 'activity-medical-medication-review', 'activity-digital-life-backup'] },
  cloneRule('mental_wellbeing', { trigger: 'mental_wellness', categories: ['mental-wellness', 'health'], kpis: ['mental-wellness-recovery', 'mental-wellness-reflection', 'health-recovery-check'], activities: ['activity-mental-wellness-breathing', 'activity-mental-wellness-journal', 'activity-recovery-rest'] }),
  cloneRule('productivity_focus', { trigger: 'productivity', categories: ['productivity', 'personal-admin', 'digital-life', 'documents'], kpis: ['productivity-daily-planning', 'productivity-weekly-review', 'admin-weekly-control', 'digital-life-digital-hygiene'], activities: ['activity-productivity-daily-plan', 'activity-productivity-weekly-review', 'activity-admin-weekly-planning', 'activity-admin-task-triage', 'activity-digital-life-cleanup'] }),
  cloneRule('learning_focus', { trigger: 'learning', categories: ['learning'], kpis: ['learning-reading-rhythm', 'learning-study-consistency'], activities: ['activity-learning-read', 'activity-learning-course-module'] }),
  cloneRule('travel_focus', { trigger: 'travel_enthusiast', categories: ['travel', 'documents', 'insurance', 'finance', 'medical'], kpis: ['travel-readiness', 'travel-planning-rhythm', 'documents-validity-check', 'insurance-policy-review', 'finance-budget-review'], activities: ['activity-travel-documents', 'activity-travel-plan-session', 'activity-travel-budget-check', 'activity-documents-digital-folder', 'activity-insurance-policy-summary', 'activity-medical-vaccination-check'] }),
];
