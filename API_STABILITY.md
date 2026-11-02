# API Stability Policy

`create-ready-stack` follows **Semantic Versioning** (SemVer). The public API includes:

## Stable (covered by SemVer)

- CLI commands: `init`, `upgrade`, `--help`, `--version`
- CLI flags:
  - `--force` / `-f`: Overwrite existing directory during init
  - `--template` / `-t`: Select starter template preset (`saas`, `tma`, `bot`)
  - `--apply`: Overwrite outdated configuration files during upgrade
- Starter template presets: `saas`, `tma`, `bot`
- Generated project structure (top-level directories: `backend/`, `web/` or `apps/web/`, `bot/`, `docs/`, `.github/`, `.ai/`)
- Generated root config files: `package.json`, `biome.json`, `tsconfig.base.json`, `.gitignore`, `.env.example`, `CHANGELOG.md`, `README.md`
- Prompt questions (names and types in `QUESTION_BLOCKS`)

## Unstable (may change without notice)

- Internal generator function signatures
- Generated file content within packages (imports, variable names, comments)
- Template literal formatting
- Version pinning of generated dependencies

## Deprecation

- Deprecated features will be documented in CHANGELOG.md
- A feature will remain functional for at least one minor version after deprecation notice
- Breaking changes to stable API will only occur in major version bumps

## Currently Deprecated

None.
