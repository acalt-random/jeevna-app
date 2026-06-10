# Life KPI Repository Review

## Architecture Overview

Life KPI is an Expo + React Native application using Expo Router for file-based navigation and a single React context for nearly all application state. The repository is primarily frontend-only and persists user data locally with AsyncStorage.

Core architectural layers:

- `app/`: Route screens and navigation structure.
- `context/AppDataContext.tsx`: Primary domain model, business logic, CRUD operations, scoring logic, hydration, and persistence.
- `components/`: Shared UI primitives such as cards, layout wrappers, desktop shell, and contact picker.
- `hooks/`: Device/form-factor helpers and theme hooks.
- `constants/`: Shared theme tokens.
- `docs/`: Product and technical planning artifacts.

Key runtime choices:

- Framework: Expo SDK 54 + React 19 + React Native 0.81
- Routing: `expo-router`
- Storage: `@react-native-async-storage/async-storage`
- Native integrations: `expo-contacts`, haptics, splash screen
- Platforms: mobile + web, with custom desktop-style layout when width >= 1200

Architecturally, the app is simple to bootstrap and easy to reason about at small scale, but it is already showing signs of "single-module gravity": state, business rules, persistence, and several feature workflows are concentrated in a small number of very large files.

## Current Features

The repository currently implements a functional alpha for personal life tracking with an embedded relationship-management layer.

Implemented feature areas:

- KPI category management
  - Add, edit, delete categories
  - Prevent deleting categories that still have KPIs

- KPI management
  - Add, edit, delete KPIs
  - Define KPI name, category, target, unit, and weight
  - Attach repeatable subtasks to KPIs

- Daily tracking
  - Enter daily actual values for each KPI
  - Save or overwrite the current day's entry
  - Compute a daily score out of 100

- Dashboard / home
  - Overall score
  - Category score breakdown
  - Focus area vs strongest area
  - 7-day trend
  - Current and longest streak
  - Testing shortcuts to load sample data and clear all data

- History and weekly review
  - View past daily entries
  - Inspect entry details per KPI
  - View 7-day score trend
  - Weekly average, best day, worst day
  - Weekly category averages
  - Native share summary flow

- Life Buddy assistant
  - Rule-based recommendation screen built from local app data
  - Surfaces today's priorities, weak categories, missing KPI entries, and relationship follow-ups
  - Preserves offline behavior with no external AI dependency

- Template packs
  - Install starter category/KPI packs
  - Duplicate-aware category and KPI insertion
  - Includes a "Balanced Life" pack that activates relationship-oriented flows

- Category detail experience
  - Drill into a category from the dashboard
  - View KPI-by-KPI contribution
  - Track KPI subtasks for the current day
  - Show category completion/progress summary

- Relationship CRM features
  - Add people manually or from device contacts
  - Group people by relationship cluster
  - Track last contact date
  - Compute a relationship "score"
  - Log activities like call, meet, message, date
  - Create person-level recurring or one-time to-dos
  - Create KPI-linked "people to-dos" from contacts
  - Surface people needing attention

Partially implemented or leftover features:

- `app/onboarding.tsx` exists but is not clearly wired into the main flow
- `app/people.tsx` exists as an empty file
- `app/(tabs)/explore.tsx` and `app/modal.tsx` are still starter-template screens, not productized Life KPI experiences

## Data Models

Primary models are declared in `context/AppDataContext.tsx`.

### Core tracking models

- `Category`
  - `id`
  - `name`

- `KPI`
  - `id`
  - `name`
  - `category`
  - `target`
  - `unit`
  - `weight`

- `DayEntry`
  - `id`
  - `date`
  - `actuals: Record<string, string>` keyed by KPI id
  - `totalScore`

### KPI execution models

- `Subtask`
  - `id`
  - `kpiId`
  - `name`
  - `frequency`
  - `targetCount`

- `SubtaskLog`
  - `id`
  - `subtaskId`
  - `date`
  - `completed`

### Template model

- `TemplatePackPayload`
  - `categories: string[]`
  - `kpis[]` with `name`, `category`, `target`, `unit`, `weight`

### Relationship / CRM models

- `SavedContact`
  - `id`
  - `kpiId`
  - `contactId`
  - `name`
  - `phoneNumber?`
  - `email?`

- `PeopleTodo`
  - extends `Subtask`
  - `type: 'people'`
  - `contactId`
  - `contactName`
  - `contactPhone?`
  - `contactEmail?`
  - `activityType`

- `Person`
  - `id`
  - `name`
  - `relationshipType`
  - `groupName`
  - `phone?`
  - `notes?`
  - `lastContactDate?`

- `PersonActivity`
  - `id`
  - `personId`
  - `activityType`
  - `date`
  - `notes?`

- `PersonTodo`
  - `id`
  - `personId`
  - `title`
  - `frequency`
  - `dueDate?`
  - `completed`
  - `completedDate?`
  - `notes?`

Observations:

- Relationships are modeled as a separate mini-CRM, but the app surface still binds them to category naming conventions rather than a dedicated domain route.
- Several date fields are stored as plain strings without validation or migration safeguards.
- `SavedContact` is persisted and exposed by context but appears lightly used relative to the newer people/CRM flow.

## Navigation Structure

The app uses Expo Router with a root stack and tab-based primary navigation.

### Root navigation

- `app/_layout.tsx`
  - Wraps the app in `AppDataProvider`
  - Applies theme provider
  - Defines:
    - `(tabs)` as main shell
    - `modal` as a stack modal

### Tab navigation

- `app/(tabs)/_layout.tsx`
  - `index` -> Home
  - `explore` -> leftover starter screen
  - `templates`
  - `categories`
  - `kpis`
  - `history`
  - `weekly`

### Other routes

- `app/category/[categoryName].tsx`
  - Category detail page
  - Also hosts relationship CRM when category name includes "relationship", "people", or "social"

- `app/life-buddy.tsx`
  - Rule-based assistant screen for priorities, suggestions, and follow-up prompts

- `app/onboarding.tsx`
  - Welcome screen pointing to `/templates`

- `app/modal.tsx`
  - Default Expo sample modal

### Desktop navigation

For large widths, the bottom tab bar is hidden and replaced by `DesktopShell`, which renders a sidebar with links to:

- Home
- Entry
- KPIs
- Categories
- History
- Weekly
- Templates

Navigation gaps:

- `entry` exists as a tab route but is not listed in the mobile tab bar
- The desktop shell does not include a dedicated people/relationships destination
- `app/people.tsx` suggests an intended route that has not been built
- Starter routes remain visible in code and may confuse future contributors

## State Management

State management is centralized in `AppDataProvider` and exposed via `useAppData()`.

What the context owns:

- categories
- kpis
- entries
- latest actuals and latest score
- subtasks and subtask logs
- saved contacts
- people to-dos
- people
- person activities
- person to-dos
- all CRUD actions and helper selectors
- sample-data loading and full reset utilities

Patterns in use:

- `useState` for each domain slice
- `useEffect` hydration from AsyncStorage on mount
- `useEffect` persistence back to AsyncStorage after hydration
- local per-screen UI state for forms, modals, filters, and edit mode

Strengths:

- Very low conceptual overhead
- Easy to trace where data comes from
- No external state library dependency

Weaknesses:

- The context has become a monolith at roughly 875 lines
- Business logic, persistence, sample data, selectors, and domain models all live together
- Screen components repeat calculation helpers instead of sharing domain utilities
- Any update to the provider can trigger wide rerender pressure as the app grows

## Storage Strategy

The app is currently local-first and single-device.

Storage backend:

- AsyncStorage only

Persisted keys:

- `categories`
- `kpis`
- `entries`
- `latestActuals`
- `latestScore`
- `subtasks`
- `subtaskLogs`
- `savedContacts`
- `peopleTodos`
- `people`
- `personActivities`
- `personTodos`

Hydration approach:

- On app mount, the provider sequentially reads each key from AsyncStorage
- Hydration sets `isHydrated` before persistence effects begin

Persistence approach:

- Most state slices are persisted through dedicated `useEffect` blocks
- `people` is an exception: it is written directly inside `addPerson`, `updatePerson`, and `deletePerson`

Implications:

- Data is offline-friendly
- There is no sync, backup, conflict handling, or authentication
- There is no schema versioning or migration layer
- Storage writes are frequent and per-slice, which is manageable at alpha scale but brittle for model evolution

## Relationship CRM Features

The relationship-management layer is the most distinctive part of the repository beyond generic KPI tracking.

Current CRM capabilities:

- Relationship activation by category context
  - CRM UI appears when a category name contains "relationship", "people", or "social"

- People records
  - Manual creation
  - Import from device contacts
  - Grouping via predefined groups like Family, School Friends, College, Workplace, etc.
  - Relationship type tagging
  - Notes and phone capture
  - Last contact date tracking

- Relationship health scoring
  - Score derived from days since last contact
  - Linear decay toward zero over a 90-day window
  - "People needing attention" list for low scores

- Activity tracking
  - Log calls, meets, messages, dates, or other activities
  - Update last contact date from logged activity or quick action
  - Show recent activity snippets inside person cards

- Person to-dos
  - Add recurring or one-time follow-up tasks
  - Toggle completion
  - Optional due dates and notes

- KPI-linked people to-dos
  - Select a phone contact
  - Convert into a people-oriented todo attached to a KPI
  - Track contact method and target frequency/count

Assessment:

- The CRM direction is promising and differentiates the product from a simple habit/KPI app.
- The current implementation is tightly coupled to one oversized screen and category-name heuristics.
- The model is rich enough to justify its own feature area in a future release.

## Technical Debt

### 1. Oversized, mixed-responsibility files

- `context/AppDataContext.tsx` is a large all-in-one provider
- `app/category/[categoryName].tsx` is extremely large at roughly 1,628 lines

This makes changes slower, testing harder, and regressions more likely.

### 2. Repeated business logic

Score and date helpers are reimplemented across multiple screens:

- KPI contribution logic
- daily score calculations
- date formatting / date-key helpers
- trend and category score calculations

This invites drift between screens.

### 3. Feature activation by string matching

The relationship CRM is enabled by checking whether a category name includes words like "relationship", "people", or "social".

That is fragile because:

- renaming a category can change app behavior
- user-created naming affects feature availability
- it mixes domain semantics with display labels

### 4. Inconsistent persistence patterns

Most entities are persisted via effects, while `people` is persisted manually inside action handlers. That inconsistency increases maintenance risk and makes future refactors trickier.

### 5. Unfinished or leftover scaffold routes

- `app/people.tsx` is empty
- `app/(tabs)/explore.tsx` is still the Expo starter screen
- `app/modal.tsx` is still the Expo sample modal
- `README.md` is still the default Expo README

This creates noise for both product quality and maintainability.

### 6. No validation or schema evolution strategy

Dates, numeric strings, and many form inputs are accepted with minimal guarding. There is no migration system for storage schema changes.

### 7. No visible automated test coverage

The repository does not currently show unit, integration, or end-to-end test structure for core logic.

### 8. Desktop/web adaptation is UI-level, not architecture-level

Desktop behavior is mostly handled through `useDeviceType()` and alternate layout wrappers. It works, but a growing feature set will likely need more deliberate route and component separation.

## Recommended Next Features

### 1. Promote Relationships to a first-class product area

Add a dedicated route and navigation entry for relationships instead of hiding the CRM behind category naming. This is the clearest product and architecture win.

### 2. Split the state layer by domain

Refactor the monolithic provider into smaller modules such as:

- KPI data/store
- entry/history analytics
- relationships CRM
- templates/sample data

Even if still exposed through one root provider, separating modules will reduce cognitive load.

### 3. Extract shared domain utilities

Create reusable helpers for:

- score calculation
- category scoring
- streak logic
- date normalization
- weekly summaries

This would reduce duplication and align behavior across screens.

### 4. Add storage schema versioning

Introduce a persisted schema version and migration flow before expanding the data model further.

### 5. Build a real onboarding flow

Current onboarding is minimal. A stronger alpha onboarding could:

- explain categories/KPIs/templates
- offer starter pack selection
- optionally guide users into relationship tracking

### 6. Add export / backup

Even basic JSON export/import would materially reduce the risk of user data loss in an AsyncStorage-only app.

### 7. Add search, filters, and sorting in CRM

As relationship records grow, the CRM will need:

- name search
- activity recency sorting
- follow-up filters
- overdue to-do views

### 8. Product cleanup pass

Remove or replace the starter Expo routes and README, and either implement or delete the empty `people.tsx` route.

## Known Risks

### 1. Local-only data loss risk

All user data lives in AsyncStorage. App reinstall, storage corruption, or device changes can lose everything.

### 2. Schema-change breakage risk

Without migrations, future model changes may break existing installations or silently produce malformed data.

### 3. Behavior coupled to category names

Relationship features can disappear or behave unexpectedly if users rename categories away from recognized keywords.

### 4. Timezone and date consistency risk

The code mixes local-date helpers with `toISOString().split('T')[0]` style logic. That can create off-by-one-day behavior around timezone boundaries.

### 5. Maintainability risk from mega-files

The category detail screen and the global provider are already large enough that new features will likely introduce regressions unless the code is modularized.

### 6. Performance risk as data grows

Context-wide updates, repeated filtering in render paths, and frequent serialization may become noticeable with larger datasets.

### 7. Incomplete navigation risk

There are visible signs of unfinished routing:

- mobile has no direct tab for `entry`
- desktop has no first-class relationships route
- `people.tsx` is empty
- starter routes remain in the tab tree

### 8. Product ambiguity risk

The app currently mixes three identities:

- KPI tracker
- habit/subtask manager
- relationship CRM

That can be a strength, but the current IA does not yet make the product hierarchy explicit.

## Overall Assessment

Life KPI is a credible alpha with a stronger product idea than a typical tracker app, especially because of the relationship CRM layer. The codebase is still simple enough to reshape, but it is at the point where the current "one context + one mega-screen" approach will slow development if left untouched.

The best next step is not a wholesale rewrite. It is a focused consolidation pass:

- give relationships a first-class home
- extract shared business logic
- modularize state and storage
- clean out leftover scaffold code

That would make the repository much easier to extend toward a real v1.
