# Life Buddy Scoring Framework v1.0

## Purpose

Life Buddy exists to answer one question:

> What should I do next to improve my life the most?

The scoring framework converts goals, KPIs, activities, relationships, and to-dos into a prioritized action list.

The framework is transparent, configurable, and user-controlled.

---

# Core Philosophy

Not all actions are equally important.

Examples:

* Calling a parent may be more important than reading a book.
* Logging a workout may be more important than organizing files.
* Paying a credit card bill may be more important than watching a course video.

Life Buddy prioritizes actions based on:

1. Importance
2. Urgency
3. Impact

---

# Priority Formula

```text
Priority Score =
Importance × Urgency × Impact
```

Future versions may include Effort.

```text
Priority Score =
(Importance × Urgency × Impact) / Effort
```

---

# Factor 1: Importance

Importance represents how important an area is to the user.

Importance is fully user-configurable.

## Category Importance

Default Values

| Category        | Weight |
| --------------- | ------ |
| Health          | 10     |
| Relationships   | 10     |
| Finance         | 8      |
| Career          | 8      |
| Learning        | 6      |
| Personal Growth | 6      |
| Spirituality    | 5      |
| Recreation      | 4      |
| Other           | 5      |

Users can modify these values in Preferences.

---

# Factor 2: Relationship Importance

Relationship priority is based on relationship type.

Default Values

| Relationship Type | Weight |
| ----------------- | ------ |
| Partner           | 10     |
| Parent            | 10     |
| Child             | 10     |
| Sibling           | 8      |
| Best Friend       | 8      |
| Friend            | 6      |
| Mentor            | 7      |
| Colleague         | 4      |
| Acquaintance      | 2      |
| Other             | 5      |

Users can override these defaults.

Future versions may allow person-level overrides:

Examples:

* Mom = Critical
* Dad = Critical
* Rahul = High
* Former Colleague = Low

---

# Factor 3: Urgency

Urgency measures how overdue an item is.

Default Values

| Condition           | Weight |
| ------------------- | ------ |
| Due Today           | 10     |
| 1-3 Days Overdue    | 8      |
| 4-7 Days Overdue    | 9      |
| 8-14 Days Overdue   | 10     |
| No Contact 14+ Days | 8      |
| No Contact 30+ Days | 10     |
| KPI Missed 3 Days   | 5      |
| KPI Missed 7 Days   | 8      |
| KPI Missed 14 Days  | 10     |

Users can modify urgency weights.

---

# Factor 4: Impact

Impact measures expected life improvement after completing the action.

Default Values

| Action Type          | Weight |
| -------------------- | ------ |
| Parent Relationship  | 10     |
| Partner Relationship | 10     |
| Child Relationship   | 10     |
| Health KPI           | 10     |
| Financial KPI        | 9      |
| Career KPI           | 8      |
| Friend Relationship  | 7      |
| Learning KPI         | 6      |
| Habit KPI            | 5      |
| Recreation KPI       | 3      |

Users can customize impact values.

---

# Example Calculations

## Example 1

Call Mom

Importance = 10

Urgency = 8

Impact = 10

```text
10 × 8 × 10 = 800
```

Priority Level:

Critical

---

## Example 2

Review Budget

Importance = 8

Urgency = 7

Impact = 9

```text
8 × 7 × 9 = 504
```

Priority Level:

Very High

---

## Example 3

Read Book

Importance = 6

Urgency = 4

Impact = 6

```text
6 × 4 × 6 = 144
```

Priority Level:

Low

---

# Priority Bands

| Score    | Priority  |
| -------- | --------- |
| 700+     | Critical  |
| 500-699  | Very High |
| 300-499  | High      |
| 150-299  | Medium    |
| 50-149   | Low       |
| Below 50 | Optional  |

---

# Life Buddy Workflow

Life Buddy collects:

* KPI data
* Category scores
* Relationship scores
* Activities
* To-Dos
* Missed actions

Life Buddy generates candidate actions.

Each action receives:

* Importance
* Urgency
* Impact

The Priority Score is calculated.

Actions are sorted descending.

Life Buddy displays:

1. Today's Priorities
2. People Needing Attention
3. Overdue To-Dos
4. Weakest Categories
5. Suggested Next Actions

---

# User Control

All weights should be editable from:

Preferences → Life Buddy Settings

Users can:

* Change category importance
* Change relationship importance
* Change urgency values
* Change impact values
* Reset to defaults

Life Buddy must remain transparent and explainable.

Users should always be able to understand why an action received a specific score.

---

# Future Versions

## Version 2

Add Effort

```text
Priority =
(Importance × Urgency × Impact)
÷ Effort
```

This favors high-value, low-effort actions.

---

## Version 3

AI-Assisted Prioritization

Life Buddy AI can:

* Learn user behavior
* Adjust weights
* Predict impact
* Recommend actions

while still respecting user-defined preferences.

---

# Guiding Principle

Life Buddy is not a task manager.

Life Buddy is a personal decision-support system that helps users focus on the actions that most improve their lives.
