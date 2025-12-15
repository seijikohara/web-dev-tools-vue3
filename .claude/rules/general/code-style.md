# Code Style Guidelines

## Reference Compliance

- Always follow the latest TypeScript official documentation
- Consult official references before implementation
- Avoid deprecated patterns and legacy syntax

## Formatting

- Use 2-space indentation
- Use single quotes for strings
- No semicolons (ESLint configured)
- Max line length: 100 characters
- Trailing commas in multiline structures

## Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Variables | camelCase | `userName`, `isLoading` |
| Constants | UPPER_SNAKE_CASE | `API_BASE_URL`, `MAX_RETRIES` |
| Functions | camelCase | `calculateHash`, `formatDate` |
| Types/Interfaces | PascalCase | `UserProfile`, `ApiResponse` |
| Components | PascalCase | `AppSidebar`, `CodeEditor` |
| Composables | use + PascalCase | `useHashGenerator`, `useClipboard` |
| Files (non-component) | kebab-case | `api-client.ts`, `date-utils.ts` |

## Code Organization

- Group imports: external → internal → types
- Export types separately from runtime code
- Keep functions small and focused (single responsibility)
- Use descriptive variable names over comments

## Immutability

- Prefer `const` over `let`
- Never use `var`
- Use readonly types where applicable
- Avoid mutating function parameters

## Control Flow (Mandatory)

### Early Returns

Always use early returns. Never use `else` after a return statement:

```typescript
// ❌ Avoid
if (condition) {
  return valueA
} else {
  return valueB
}

// ✅ Preferred
if (condition) return valueA
return valueB
```

### Method Chaining

Use method chaining instead of imperative loops for data transformation:

```typescript
// ❌ Avoid: for, while for data transformation
for (const item of items) { ... }

// ✅ Preferred: filter, map, reduce for transformation
items.filter(x => x.active).map(x => x.value)

// ✅ forEach is allowed for side effects (no return value needed)
items.forEach(item => item.reset())
```

## String Handling (Mandatory)

### Template Literals

Always use template literals for string interpolation:

```typescript
// ❌ Avoid
const msg = 'Hello, ' + name + '!'

// ✅ Preferred
const msg = `Hello, ${name}!`
```

### Multiline Strings

Never use `\n` escape sequences. Use actual line breaks:

```typescript
// ❌ Avoid
const text = 'Line 1\nLine 2'

// ✅ Preferred
const text = `Line 1
Line 2`
```

## Error Handling

- Use early returns for error conditions
- Throw typed errors with meaningful messages
- Handle errors at appropriate boundaries
- Log errors with context information

## Documentation

### Language

- All documentation must be written in English
- This includes: code comments, JSDoc, commit messages, PR descriptions, README files

### Tone

- Use formal, professional language
- Avoid casual or colloquial expressions

| ❌ Avoid | ✅ Preferred |
|----------|-------------|
| "This function is pretty cool" | "This function performs X" |
| "Basically, it does..." | "This method executes..." |
| "Just a quick fix" | "Resolves issue with..." |
| "Stuff" / "Things" | Use specific terminology |

### Objectivity

- State facts and technical descriptions only
- Avoid subjective opinions or value judgments
- Do not include emotional expressions

| ❌ Avoid | ✅ Preferred |
|----------|-------------|
| "Great solution" | "Implements X using Y pattern" |
| "Ugly hack" | "Temporary workaround for issue #123" |
| "Obviously" / "Clearly" | Omit or explain the reasoning |
| "Simple" / "Easy" | Describe what it does |

### Code Comments

```typescript
// ❌ Avoid
// This is a really useful helper that makes everything easier
// Obviously we need to check this first
// Quick and dirty fix for the annoying bug

// ✅ Preferred
// Formats date string to ISO 8601 format
// Validates input before processing to prevent null reference errors
// Workaround for issue #456; scheduled for refactoring in v2.0
```
