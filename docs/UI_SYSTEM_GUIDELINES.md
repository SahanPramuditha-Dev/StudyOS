# UI System Guidelines (StudyOS)

This project now uses a **single component-system direction** for consistency:

1. Use **MUI components first** for new UI blocks:
- `Button`, `TextField`, `Select`, `Card`, `Dialog`, `Drawer`, `Tabs`, `Chip`, `Tooltip`, `Snackbar`.
- Keep Tailwind for layout and page-level composition while migrating.

2. Use the shared app theme:
- Theme source: `src/theme/muiTheme.js`
- Provider: `src/theme/MuiDesignSystemProvider.jsx`
- Light/dark mode is synced with `ThemeContext`.

3. Style rules for new work:
- Prefer themed tokens (`primary`, `secondary`, `background`, `text`) over one-off colors.
- Reuse standard radius/spacing from the MUI theme.
- Avoid inventing custom button/input styles unless required by a feature.
- Keep interaction patterns consistent (hover/focus/disabled/loading).

4. Migration strategy:
- For existing screens, migrate incrementally (feature-by-feature), not all at once.
- Prioritize high-traffic surfaces first (Auth, Dashboard, Settings, key forms/modals).
- Remove duplicate custom styles only after equivalent MUI usage is in place.

5. Accessibility baseline:
- Ensure all interactive controls have visible focus states.
- Provide aria labels for icon-only controls.
- Keep color contrast readable in both light and dark themes.

This guideline should be followed for all future UI development.
