#!/usr/bin/env bash
# Mechanical verification of the hard rules in AGENTS.md / obsidian/workflows/ai-agent-guide.md.
#
# Only rules that are objectively decidable from the source live here. Judgement
# calls (visual fidelity, "is this token named well") belong to the qa-verify
# skill, which a model runs. This script is the floor, not the ceiling.
#
# Usage:  .claude/scripts/verify.sh [path ...]      (default scope: src)
# Exit:   0 = no FAILs, 1 = one or more FAILs. WARNs never fail the run.

set -uo pipefail
cd "$(dirname "$0")/../.." || exit 1

SCOPE=("$@"); [ "$#" -eq 0 ] && SCOPE=("src")

RED=$'\033[31m'; YEL=$'\033[33m'; GRN=$'\033[32m'; DIM=$'\033[2m'; OFF=$'\033[0m'
[ -t 1 ] || { RED=""; YEL=""; GRN=""; DIM=""; OFF=""; }

fails=0; warns=0

# report LEVEL "rule" "why" "output"   — output empty means the check passed
report() {
  local level="$1" rule="$2" why="$3" out="${4:-}"
  [ -z "$out" ] && return 0
  if [ "$level" = FAIL ]; then
    fails=$((fails+1)); printf '%s\n' "${RED}FAIL${OFF}  ${rule}"
  else
    warns=$((warns+1)); printf '%s\n' "${YEL}WARN${OFF}  ${rule}"
  fi
  printf '%s\n' "${DIM}      ${why}${OFF}"
  printf '%s\n' "$out" | head -20 | sed 's/^/      /'
  echo
}

# All source, including the vendored engine.
SRC() { grep -rEn --include='*.tsx' --include='*.ts' "$1" "${SCOPE[@]}" 2>/dev/null; }
# App source only — excludes the vendored animation engine (#do-not-modify).
APP() { SRC "$1" | grep -v 'components/animation/springs/' | grep -v 'hooks/animation/'; }
CSS() { grep -rEn --include='*.css' "$1" "${SCOPE[@]}" 2>/dev/null; }

echo "── Motion (hard rules #1–#3) ─────────────────────────────────"

report FAIL "CSS keyframes are banned" \
  "All motion is spring-based. Long enough to need keyframes = long enough to deserve a spring." \
  "$(SRC '@keyframes'; CSS '@keyframes')"

report FAIL "third-party animation library" \
  "Only @react-spring/web + spring-text-engine. No framer-motion, no GSAP." \
  "$(SRC "from ['\"](framer-motion|gsap|motion/react|@motionone|animejs)")"

report FAIL 'TextEngine mode="manual"' \
  "Use always / once / forward / progress — see obsidian/frontend/text-engine.md." \
  "$(SRC 'mode=["'"'"']manual["'"'"']')"

report FAIL "leading-none combined with overflow" \
  "overflow clips to the line-height box; leading must stay >= 1.1 (leading-display) or glyphs get shaved." \
  "$(SRC 'leading-none' | grep -E 'overflow')"

report FAIL "duration-fast / duration-normal used as a utility" \
  "Tailwind v4 has no --duration-* namespace — the class compiles to nothing. Use duration-[var(--duration-fast)]." \
  "$(SRC '\bduration-(fast|normal)\b')"

report WARN "CSS transition without token-backed timing (ADR-0014)" \
  "The narrow CSS-transition exception requires duration-[var(--duration-*)] and a token ease." \
  "$(APP 'transition-(colors|opacity|all|transform|shadow)' | grep -vE 'duration-\[var\(--duration-')"

echo "── Tokens (hard rule #4) ─────────────────────────────────────"

report FAIL "hardcoded colour inside className or style" \
  "Add a --raw-* primitive + a semantic token in globals.css, then use the generated utility." \
  "$(APP '(className|style)=[^>]*#[0-9a-fA-F]{3,8}')"

report WARN "hex literal in source (outside globals.css)" \
  "Config values like siteConfig.themeColor are acceptable; anything visual must be a token." \
  "$(APP '#[0-9a-fA-F]{3,8}\b' | grep -vE '(className|style)=' | grep -vE '\s*(//|/\*|\*)')"

report WARN "arbitrary px/rem value in a class name" \
  "Prefer a spacing token; arbitrary values are for var() references and genuine one-offs." \
  "$(APP 'className=[^>]*\[[0-9.]+(px|rem)\]')"

if [ -f src/app/globals.css ]; then
  report FAIL "literal bound directly in @theme inline" \
    "Every entry must be --<namespace>-<role>: var(--<role>), or theming freezes at build time." \
    "$(awk '/@theme inline/,/^}/' src/app/globals.css \
       | grep -nE '^\s*--[a-z-]+:\s*(#|[0-9]|cubic-bezier|calc)' \
       | grep -vE '(--leading-|--ease-|--text-|--spacing-|--radius-|--breakpoint-)')"

  report FAIL "literal in a Tier 2 semantic token" \
    "Only Tier 1 (--raw-*) may contain literals — see obsidian/frontend/design-system.md." \
    "$(awk '/TIER 2/,/THEME BINDINGS/' src/app/globals.css \
       | grep -nE '^\s*--[a-z][a-z0-9-]*:\s*(#[0-9a-fA-F]|[0-9]+(px|ms|rem))')"
fi

echo "── Architecture (hard rules #5–#9) ───────────────────────────"

route_violations=""
while IFS= read -r p; do
  [ -z "$p" ] && continue
  bad="$(grep -nE "^import " "$p" | grep -vE "from ['\"](@/views/|next(/|\")|react(/|\"))" || true)"
  [ -n "$bad" ] && route_violations="${route_violations}${p}: ${bad}"$'\n'
done < <(find src/app -name 'page.tsx' 2>/dev/null)
report FAIL "route imports something other than a view" \
  "app/**/page.tsx delegates only — import from @/views (ADR-0003)." "$route_violations"

report WARN '"use client" on a layout, page or view' \
  "Server Components by default — push the boundary down to a leaf component." \
  "$(grep -rln '"use client"' src/app/layout.tsx src/app/page.tsx src/views 2>/dev/null)"

report FAIL "explicit any" \
  "Type it. If the shape is genuinely unknown use unknown + a zod parse." \
  "$(APP ':\s*any\b|<any>|as any|any\[\]')"

report FAIL "next/router (Pages Router API)" \
  "Use next/navigation — see obsidian/frontend/routing.md." \
  "$(APP "from ['\"]next/router['\"]")"

report FAIL "middleware.ts — Next.js 16 renamed it to proxy.ts" \
  "Rename the file AND the exported function (middleware -> proxy). Edge runtime is gone; proxy runs on Node." \
  "$(ls src/middleware.ts middleware.ts 2>/dev/null)"

report FAIL "secret read outside the server env accessor" \
  "Secrets are server-only via getServerEnv() — never NEXT_PUBLIC_, never process.env in a component." \
  "$(APP 'process\.env\.' | grep -v 'src/env.ts' | grep -vE 'NEXT_PUBLIC_|NODE_ENV')"

echo "── Markup & a11y (hard rule #10) ─────────────────────────────"

report WARN "raw <img> instead of next/image" \
  "next/image with explicit width/height prevents CLS." "$(APP '<img\s')"

report WARN "image without alt" \
  "Every image needs alt; decorative images take alt=\"\"." \
  "$(APP '<(Image|img)\s[^>]*/?>' | grep -v 'alt=')"

report WARN "raw <a> for an internal link" \
  "Use <Link> from next/link." "$(APP '<a\s+href=["'"'"']/')"

report WARN "click handler on a non-interactive element" \
  "Use a real <button>." "$(APP '<(div|span)[^>]*onClick=')"

report WARN "more than one <h1> in a view" \
  "Exactly one <h1> per page; never skip heading levels." \
  "$(grep -rc '<h1' src/views/*.tsx 2>/dev/null | awk -F: '$2>1')"

report WARN 'animation component with tag="div"' \
  "Pass the semantically correct element — section, h2, p, li …" \
  "$(APP 'tag=["'"'"']div["'"'"']')"

echo "── Hygiene ───────────────────────────────────────────────────"

report WARN "console.log in source" "Remove before committing." "$(APP 'console\.(log|debug)')"
report WARN "TODO / FIXME marker" "Resolve, or move it to an issue." "$(APP '(TODO|FIXME)')"

if git rev-parse --git-dir >/dev/null 2>&1; then
  report FAIL "vendored animation engine modified (hard rule #2)" \
    "src/components/animation/springs/ and src/hooks/animation/ need explicit sign-off (ADR-0009)." \
    "$(git diff --name-only HEAD -- src/components/animation/springs src/hooks/animation 2>/dev/null)"
fi

echo "──────────────────────────────────────────────────────────────"
if [ "$fails" -gt 0 ]; then
  printf '%s\n' "${RED}${fails} FAIL${OFF} / ${YEL}${warns} WARN${OFF} — every FAIL must be fixed."
  echo "Also required: yarn lint, yarn build, and the judgement checks in the qa-verify skill."
  exit 1
fi
printf '%s\n' "${GRN}0 FAIL${OFF} / ${YEL}${warns} WARN${OFF} — mechanical rules pass."
echo "Also required: yarn lint, yarn build, and the judgement checks in the qa-verify skill."
exit 0
