// The job summary: what drifted, from the JSON report. Reads both shapes:
// --ci's (summary, criticalIssues, warningIssues, errors, skipped, coverage)
// and --json's (a result per check).
import { readFileSync } from 'node:fs'

const [path, code] = process.argv.slice(2)
const out = []
const say = (...lines) => out.push(...lines)
const cell = s => String(s ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ')

let report
try {
  report = JSON.parse(readFileSync(path, 'utf8'))
} catch {
  console.log(`### SupaForge\n\nNo report was written (exit ${code}). See the step log.`)
  process.exit(0)
}
if (typeof report.error === 'string') {
  console.log(`### ⚠️ SupaForge could not run\n\n${cell(report.error)}`)
  process.exit(0)
}

const verdict = { 0: '✅ No drift at or above the threshold', 1: '❌ Drift found', 2: '⚠️ Could not finish' }[code] ?? `Exit ${code}`
say(`### SupaForge: ${verdict}`, '')

const checks = report.checks ?? []
const issues = report.criticalIssues || report.warningIssues
  ? [...(report.criticalIssues ?? []).map(i => ({ ...i, severity: 'critical' })),
     ...(report.warningIssues ?? []).map(i => ({ ...i, severity: 'warning' }))]
  : checks.flatMap(c => (c.issues ?? []).map(i => ({ ...i, check: c.check })))
const total = report.summary ?? {
  critical: issues.filter(i => i.severity === 'critical').length,
  warning: issues.filter(i => i.severity === 'warning').length,
  info: issues.filter(i => i.severity === 'info').length,
}

if (report.score !== undefined) say(`Health score **${report.score}**${report.postureScore != null ? ` · posture **${report.postureScore}**` : ''}`, '')
say('| Critical | Warning | Info |', '| --- | --- | --- |', `| ${total.critical ?? 0} | ${total.warning ?? 0} | ${total.info ?? 0} |`, '')
if (report.coverage) say(`Compared ${report.coverage.compared} of ${report.coverage.total} checks.`, '')

if (issues.length) {
  say('| Severity | Check | Issue |', '| --- | --- | --- |')
  for (const i of issues.slice(0, 50)) say(`| ${i.severity} | \`${cell(i.check)}\` | ${cell(i.title)} |`)
  if (issues.length > 50) say(`| | | …and ${issues.length - 50} more in the report |`)
  say('')
}
for (const e of report.errors ?? []) say(`- ⚠️ \`${cell(e.check)}\` could not finish: ${cell(e.error)}`)
if (report.skipped?.length) {
  say('', '<details><summary>Skipped checks</summary>', '')
  for (const s of report.skipped) say(`- \`${cell(s.check)}\`: ${cell(s.reason)}`)
  say('', '</details>')
}
console.log(out.join('\n'))
