# Commit convention

Theo [Conventional Commits](https://www.conventionalcommits.org/).

## Format

```
<type>(<scope>): <subject>
```

## Type

| Type | Mô tả |
|------|--------|
| `feat` | Feature mới |
| `fix` | Sửa bug |
| `docs` | Chỉ docs |
| `style` | Format, không đổi logic |
| `refactor` | Refactor |
| `chore` | Tooling, deps |

## Scope (P4 monorepo)

- `web` — `apps/web`
- `api` — `apps/api` (mentor)
- `shared` — `libs/shared`
- `root` — config monorepo

## Ví dụ

```
feat(web): admin product list
fix(web): cart total calculation
chore(root): setup biome husky
```
