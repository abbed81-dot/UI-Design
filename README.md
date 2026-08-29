# UI-Design

Design workspace with the [UI/UX Pro Max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill)
skill installed as a project skill, so any Claude Code session opened in this repo picks it up
automatically.

## What's installed

`.claude/skills/ui-ux-pro-max/` — searchable local UI/UX design intelligence:

| Data | Count |
| --- | --- |
| Searchable styles | 79 (50 active) |
| Product palettes & reasoning profiles | 192 |
| Font pairings | 74 |
| UX guidelines | 119 |
| Curated icons | 105 |
| GSAP motion presets | 17 |
| Chart types | 25 |
| Tech stacks | 22 |

Stacks covered: React, Next.js, Vue, Nuxt.js, Nuxt UI, Svelte, Astro, HTML+Tailwind, shadcn/ui,
SwiftUI, React Native, Flutter, Jetpack Compose, Angular, Laravel, Three.js, JavaFX, WPF, WinUI,
Avalonia, Uno Platform, UWP.

## Requirements

Python 3.x (standard library only — the scripts install nothing and make no network calls).

```bash
python3 --version
```

## Usage

The skill activates on its own when a request involves designing, building, reviewing, or fixing
an interface. You can also query the data directly:

```bash
# Search a domain or a specific stack
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "SaaS dashboard" --domain style
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "fintech" --domain color
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "editorial" --domain typography
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "forms" --domain ux
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "layout" --stack nextjs

# Complete design system recommendation
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "fintech app" --design-system

# Full, untruncated records
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "SaaS" --domain style --json

# Validate the bundled datasets
python3 .claude/skills/ui-ux-pro-max/scripts/validate_data.py
```

See `.claude/skills/ui-ux-pro-max/SKILL.md` for the full workflow and
`.claude/skills/ui-ux-pro-max/references/` for the quick reference and pro rules.

## Updating

The skill is vendored from upstream. To refresh it, re-copy `.claude/skills/ui-ux-pro-max/` from
[nextlevelbuilder/ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill),
or use the upstream CLI:

```bash
npx ui-ux-pro-max-cli init --ai claude
```

## Attribution

UI/UX Pro Max v2.13.0 by NextLevelBuilder, MIT licensed — see
`.claude/skills/ui-ux-pro-max/LICENSE`.
