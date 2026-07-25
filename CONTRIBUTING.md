# Contributing to StudyOS

Thank you for your interest in contributing! Please read these guidelines before submitting a pull request.

## How to Contribute

1. **Fork** the repository on GitHub.
2. **Create a feature branch** from `main`:
   ```bash
   git checkout -b feature/my-feature
   ```
3. **Make your changes** — keep them focused and well-scoped.
4. **Lint and test** before committing:
   ```bash
   npm run lint
   npm run test
   ```
5. **Commit** with a clear, descriptive message.
6. **Open a pull request** against `main` and describe what you changed and why.

## Code Style

- Follow existing patterns and file structure in the repository.
- Components live in `src/features/<FeatureName>/` or `src/components/`.
- Use Tailwind CSS utility classes consistent with the existing design system (see [docs/UI_SYSTEM_GUIDELINES.md](docs/UI_SYSTEM_GUIDELINES.md)).
- Prefer Lucide React icons for consistency.
- Animations should use Framer Motion.

## Commit Messages

Use a short imperative subject line, e.g.:
- `Add bookmark CRUD to video tracker`
- `Fix broken Papers screenshot in README`
- `Refactor Firestore rules for Projects collection`

## Reporting Bugs

Open an issue at https://github.com/SahanPramuditha-Dev/StudyOS/issues with:
- A clear description of the bug
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable

## Questions

See [SUPPORT.md](SUPPORT.md) for contact information.
