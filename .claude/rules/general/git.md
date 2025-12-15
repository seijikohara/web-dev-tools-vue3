# Git Conventions

## Commit Messages

Follow Conventional Commits format:

```
<type>(<scope>): <description>

[optional body]
```

### Types

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Formatting, no code change |
| `refactor` | Code change without feature/fix |
| `perf` | Performance improvement |
| `test` | Adding/updating tests |
| `chore` | Build, tooling, dependencies |

### Scope Examples

- `composables` - Changes to composables
- `components` - Component changes
- `api` - API-related changes
- `e2e` - E2E test changes
- `deps` - Dependency updates

### Examples

```
feat(composables): add useQrCodeGenerator composable
fix(api): handle timeout errors gracefully
refactor(components): simplify CodeEditor props
test(e2e): add timestamp converter tests
chore(deps): update PrimeVue to 4.5
```

## Branch Naming

- `feature/` - New features
- `fix/` - Bug fixes
- `refactor/` - Code improvements
- `docs/` - Documentation updates

## Pull Requests

See `pr.md` for detailed PR guidelines.
