---
name: component-creation
description: Use this skill whenever creating or modifying a reusable UI component in the StudyOS project. This ensures components are structured consistently, remain highly reusable, and perfectly match the existing design system.
---

# StudyOS Component Creation Guidelines

## Goal
To maintain a robust, reusable, and visually consistent component library across the StudyOS application. All new components must adhere to the existing design system and be built for maximum reusability.

---

## 1. Reusability First
- **Context-Agnostic:** Components should not know where they are being rendered. Do not hardcode margins or absolute positioning that forces the component into a specific layout unless it is a layout wrapper.
- **Configurable via Properties:** Allow variations (e.g., sizes, colors, variants like "primary" or "secondary") to be passed in as properties or data attributes rather than hardcoding them inside the component logic.
- **Single Responsibility:** A component should do one thing well. If a component becomes too complex, break it down into smaller sub-components.

---

## 2. Styling & Design System
- **Use Existing Tokens:** Always reuse the established CSS variables/design tokens for colors, spacing, typography, border-radius, and shadows. Do not invent new hex colors or arbitrary spacing values.
- **Aesthetics:** StudyOS demands premium, vibrant designs. Incorporate subtle hover states, focus outlines, and micro-animations to make the component feel alive and responsive.
- **Scoping:** Ensure CSS classes are scoped properly to the component to avoid style leakage. Use standard naming conventions (like BEM) or CSS Modules depending on the specific file structure in use.

---

## 3. Structure & Organization
When creating a new component:
1. **Naming:** Use clear, descriptive, and PascalCase or kebab-case names depending on the project's standard convention for the specific technology stack.
2. **File Grouping:** Keep the component logic, template/markup, and styles closely grouped together (or in the same file if the framework supports it).
3. **Exports:** Ensure the component is easily importable by standardizing the export format.

---

## 4. Accessibility (a11y)
- **Semantic HTML:** Always use the correct semantic HTML elements (e.g., `<button>` for actions, `<a>` for navigation, `<dialog>` for modals).
- **ARIA Attributes:** Include necessary `aria-` attributes for screen readers, especially on custom interactive elements (e.g., `aria-expanded`, `aria-label`, `role="combobox"`).
- **Keyboard Navigation:** Ensure the component can be fully interacted with using a keyboard (Tab targeting, Enter/Space activation).

---

## 5. Defensive Implementation
- **Fallback Content:** Handle empty states gracefully. If a list component receives no data, it should display a beautifully styled empty state.
- **Error Handling:** If an image fails to load or data is missing, provide a fallback or sensible default rather than breaking the UI.

---

## Checklist Before Completing a Component
- [ ] Does it use existing design system colors and spacing?
- [ ] Does it have interactive states (hover, focus, active, disabled)?
- [ ] Is it easily reusable on a completely different page?
- [ ] Is the HTML semantic and accessible?
- [ ] Are animations smooth and subtle?

Always follow these guidelines to ensure the StudyOS platform remains visually stunning, technically sound, and highly maintainable.
