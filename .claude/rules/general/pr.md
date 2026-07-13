# Pull Request Guidelines

## PR Title

Follow Conventional Commits format:

```
<type>(<scope>): <description>
```

Examples:

- `feat(composables): add useMarkdownEditor composable`
- `fix(api): handle network timeout errors`
- `refactor(views): reorganize formatter views`

## PR Description Structure

```markdown
## Summary

<1-3 bullet points describing what this PR does>

## Changes

<List of specific changes made>

## Test Plan

<Steps to verify the changes work correctly>

## Checklist

- [ ] Lint passes (`pnpm lint`)
- [ ] Format check passes (`pnpm format:check`)
- [ ] Type check passes (`pnpm typecheck`)
- [ ] Unit tests pass (`pnpm test:run`)
- [ ] E2E tests pass (`pnpm test:e2e`) - if UI changes
- [ ] Build succeeds (`pnpm build`)

## Related Issues

<Link to related issues if applicable>
```

## Pre-Submission Checklist

**IMPORTANT**: Before creating a PR, you MUST:

1. **Execute each checklist item** and verify it passes
2. **Check the box** (`[x]`) only after confirming success
3. **Do not check boxes** for items that were not run or failed

| Item         | Command             | When Required |
| ------------ | ------------------- | ------------- |
| Lint         | `pnpm lint`         | Always        |
| Format Check | `pnpm format:check` | Always        |
| Type Check   | `pnpm typecheck`    | Always        |
| Unit Tests   | `pnpm test:run`     | Always        |
| E2E Tests    | `pnpm test:e2e`     | UI changes    |
| Build        | `pnpm build`        | Always        |

If any check fails, fix the issues before creating the PR.

## Branch and Commit

See @rules/general/git.md for branch naming and commit message format.

- Always branch from and merge to `main`
- Make atomic commits (one logical change per commit)
- Squash related commits before merge if needed

## Review Process

### Requesting Review

- Assign appropriate reviewers
- Add relevant labels
- Ensure CI passes before requesting review

### Responding to Feedback

- Address all comments
- Re-request review after making changes
- Resolve conversations when addressed

## Merge Strategy

- Use **Squash and merge** for feature branches
- Ensure the squash commit follows Conventional Commits format

## Special Cases

### Breaking Changes

Include `BREAKING CHANGE:` in the commit body:

```
feat(api): change response format

BREAKING CHANGE: API responses now return data in a different structure
```

### Dependency Updates

- Group related dependency updates in one PR
- Include changelog highlights for major updates
- Run full test suite before merging
