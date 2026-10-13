#!/usr/bin/env bash
# Runs the SupaForge CLI for the action: the JSON report to a file, the
# annotations and progress to the log, a summary on the job page, and the
# CLI's own exit code as the step's.
set -uo pipefail

read -r -a args <<< "${SUPAFORGE_ARGS:-diff --ci}"
report="${SUPAFORGE_REPORT:-}"
cli=(npx --yes "@akal/supaforge@${SUPAFORGE_VERSION:-latest}")

wants_json=false
for a in "${args[@]}"; do [[ "$a" == --ci || "$a" == --json ]] && wants_json=true; done

if $wants_json && [ -n "$report" ]; then
  "${cli[@]}" "${args[@]}" > "$report"
  code=$?
  echo "report=$report" >> "${GITHUB_OUTPUT:-/dev/null}"
  node "$GITHUB_ACTION_PATH/summary.mjs" "$report" "$code" >> "${GITHUB_STEP_SUMMARY:-/dev/null}" || true
else
  "${cli[@]}" "${args[@]}"
  code=$?
fi

echo "exit-code=$code" >> "${GITHUB_OUTPUT:-/dev/null}"
exit "$code"
