---
name: page-architecture
description: Use this skill whenever creating a new page, redesigning an existing page, or adding a new management module. This ensures every page follows the StudyOS design system and layout architecture.
---

# StudyOS Page Architecture

## Goal

The existing **Learning Streams (Courses)** page is the design reference for the entire application.

Whenever creating a new page, always follow the exact same visual hierarchy, layout structure, spacing, styling, animations, and component architecture as the Learning Streams page unless explicitly instructed otherwise.

The objective is to maintain a consistent design system across the entire application.

---

# Page Layout Order

Every management page must follow this exact order.

## 1. Page Header

Display:

- Large page title
- Supporting subtitle

Use the same typography, spacing, margins and alignment as the Learning Streams page.

---

## 2. Statistics Cards

Directly below the page header.

Reuse the exact same statistics card component.

Keep the same:

- dimensions
- spacing
- colors
- typography
- icons
- hover effects
- animations

Only the content changes according to the page.

Examples:

Students

- Total Students
- Active
- Graduated
- Average Attendance
- Study Hours

Assignments

- Total Assignments
- Pending
- Submitted
- Overdue
- Average Grade

Resources

- Total Resources
- Downloads
- Categories
- Storage Used
- Favorites

---

## 3. Search & Action Section

Reuse the same container design.

Include:

- Search input
- Refresh button
- Primary "Add" button

Maintain identical spacing, border radius, shadows, colors and sizing.

---

## 4. Filters

Reuse the existing filter section.

Examples:

- Status
- Category
- Difficulty
- Semester
- Department
- Priority
- Type

Only include filters that are relevant for the current page.

---

## 5. View Controls

Reuse the existing controls.

Include:

- Grid/List toggle
- Sorting
- Results counter

Do not redesign these components.

---

## 6. Content Area

Reuse the exact same card architecture used by the Learning Streams page.

Maintain identical:

- card dimensions
- padding
- spacing
- border radius
- shadows
- typography
- badges
- buttons
- hover effects
- animations
- dropdown menus
- progress indicators
- icon styling

Only the displayed information should change depending on the page.

---

# Component Reuse

Always reuse existing shared components whenever possible.

Avoid creating duplicate UI components.

Extract reusable functionality into shared components.

---

# Design System

Always follow the existing StudyOS design language.

Reuse:

- color palette
- typography
- spacing scale
- border radius
- shadows
- transitions
- animations
- iconography
- button styles
- badges
- cards
- inputs
- dropdowns

Do not introduce a different design style.

---

# Responsive Design

Every page must work correctly on:

- Desktop
- Tablet
- Mobile

Maintain the same layout hierarchy while adapting responsively.

---

# Page-Specific Features

While every page should share the same architecture and styling, each page must include functionality specific to its purpose.

Examples:

Students

- GPA
- Attendance
- Batch
- Enrollment

Assignments

- Due dates
- Submission status
- Grades

Resources

- Downloads
- File type
- File size
- Tags

Teachers

- Department
- Courses
- Availability
- Experience

Only these page-specific features should change.

The overall UI architecture should remain consistent.

---

# Consistency Rules

Whenever generating a page:

- Follow the Learning Streams page structure.
- Preserve the exact section order.
- Use `w-full max-w-[1680px] mx-auto pb-12` as the top-level container for all pages to ensure consistent page width.
- Match spacing and alignment.
- Match component styling.
- Match button styling.
- Match animations.
- Match typography.
- Match color usage.
- Match card layouts.
- Match interaction patterns.
- Match responsive behavior.

The Learning Streams page is the design standard for the project.

Unless explicitly instructed otherwise, every newly created page should feel like it belongs to the same application and design system.
