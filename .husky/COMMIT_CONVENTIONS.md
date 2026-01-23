# Commit Message Conventions

This project uses [Conventional Commits](https://www.conventionalcommits.org/) to ensure consistent and semantic commit messages.

## Format

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

## Types

| Type | Description | Example |
|------|-------------|---------|
| `feat` | New feature | `feat(auth): add password reset functionality` |
| `fix` | Bug fix | `fix(chat): resolve streaming timeout issue` |
| `docs` | Documentation | `docs(readme): update installation steps` |
| `style` | Code style (formatting, semicolons, etc) | `style(web): format components with prettier` |
| `refactor` | Code refactoring | `refactor(api): simplify auth service logic` |
| `perf` | Performance improvement | `perf(rag): optimize vector search query` |
| `test` | Add or update tests | `test(auth): add login flow tests` |
| `build` | Build system or dependencies | `build(deps): upgrade vite to v7.2.4` |
| `ci` | CI/CD changes | `ci(github): add automated testing workflow` |
| `chore` | Other changes | `chore(git): update .gitignore` |
| `revert` | Revert a commit | `revert: revert "feat(auth): add oauth"` |

## Scopes (Optional but Recommended)

| Scope | Description |
|-------|-------------|
| `api` | Backend/NestJS changes |
| `web` | Frontend/Vite changes |
| `shared` | Shared package changes |
| `auth` | Authentication related |
| `chat` | Chat functionality |
| `rag` | RAG/vector search |
| `db` | Database changes |
| `deps` | Dependency updates |

## Examples

### Good ✅

```bash
feat(auth): add two-factor authentication
fix(chat): resolve message ordering bug
docs(api): document tRPC endpoints
refactor(web): extract chat components
perf(rag): cache embedding calculations
test(auth): add integration tests for login
build(deps): upgrade nestjs to v11.0.16
```

### Bad ❌

```bash
Added stuff                    # No type
Fix bug                        # No scope, vague
feat: New Feature              # Subject should be lowercase
fix(chat) resolve bug          # Missing colon
FEAT(auth): add login          # Type should be lowercase
fix(auth): Fixed the login.    # Subject ends with period
```

## Rules

1. **Type**: Must be one of the allowed types (see table above)
2. **Scope**: Optional, but recommended (lowercase)
3. **Subject**: 
   - Cannot be empty
   - Lowercase
   - No period at the end
   - Max 100 characters for the entire header
4. **Body**: Optional, blank line before body, max 100 chars per line
5. **Footer**: Optional, blank line before footer

## Multi-line Commits

For more complex changes, add a body:

```bash
git commit -m "feat(chat): add message reactions

Users can now react to messages with emojis.
- Added reaction picker component
- Updated database schema
- Added API endpoints for reactions"
```

## Breaking Changes

For breaking changes, use `!` or add `BREAKING CHANGE:` in footer:

```bash
feat(api)!: change authentication endpoint

BREAKING CHANGE: /api/auth/login moved to /api/trpc/auth.login
```

## Tips

- Use imperative mood: "add" not "added" or "adds"
- Think: "This commit will..." then complete the sentence
- Keep the subject line under 50 characters when possible
- Use the body to explain "what" and "why", not "how"

## Testing Your Message

Before committing, test if your message follows conventions:

```bash
echo "feat(auth): add password reset" | npx commitlint
# ✅ Should pass

echo "Added some stuff" | npx commitlint
# ❌ Should fail
```

## Bypassing (Not Recommended)

In rare emergencies, you can skip the check:

```bash
git commit --no-verify -m "emergency fix"
```

**But please don't make this a habit!** Consistent commit messages help everyone.
