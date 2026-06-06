# Code conventions

This project uses one documentation standard per language — the ecosystem default in
each case — so comments double as IDE tooltips, API docs, and lint-checked artifacts that
help other teams consume our code.

## Backend (C#) — XML documentation comments

Use `///` XML doc comments on every **public** type and member (controllers, DTOs, service
interfaces, domain types, reusable attributes). They feed IntelliSense and, for the API
surface, render directly in the **Swagger UI** (wired via `IncludeXmlComments` in
`Program.cs`; the doc file is emitted by `<GenerateDocumentationFile>` in the `.csproj`).

Tags we use: `<summary>`, `<param>`, `<returns>`, `<remarks>`, `<see>`/`<c>` for references.

```csharp
/// <summary>Creates a book and emits a single "Created" change row.</summary>
/// <param name="input">Validated create payload.</param>
/// <param name="ct">Cancellation token.</param>
/// <returns>The created book with its resolved authors.</returns>
Task<BookDto> CreateBookAsync(BookInput input, CancellationToken ct);
```

Notes:
- `CS1591` (missing doc on a public member) is suppressed in the `.csproj` so internal
  types and the auto-generated EF migrations don't flood the build. Still document the
  cross-team surface (controllers + DTOs + service contracts).
- Keep summaries to what a *caller* needs; put implementation rationale in `<remarks>`.

## Frontend (TypeScript) — TSDoc

Use TSDoc (`/** */`) on every **exported** function, React component, hook, and type.
`eslint-plugin-tsdoc` lints the syntax (`tsdoc/syntax` runs in `npm run lint`), so blocks
stay well-formed. See the TSDoc spec: https://tsdoc.org/.

Tags we use: `@param`, `@returns`, `@remarks`, `@see`. Inline code in backticks.

```ts
/**
 * Debounced author search backing the autocomplete.
 *
 * @param term - The current input text.
 * @param delayMs - Debounce delay in milliseconds.
 * @returns The React Query result for the matching authors.
 */
export function useAuthorSearch(term: string, delayMs = 300) { /* ... */ }
```

Notes:
- Component prop `interface`s stay colocated with their component (not centralized).
- Don't restate types in prose — TypeScript already encodes them; describe intent and
  edge cases.

## Commit messages

Conventional Commits, imperative mood, no trailing period, no emoji
(e.g. `feat(api): validate book input bounds`).
