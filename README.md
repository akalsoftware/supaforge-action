# SupaForge Drift Check

Find drift between your Supabase environments in CI — schema, RLS policies,
roles and grants, auth, storage, webhooks, cron, vault, migrations and
reference data — and fail the build when production no longer matches what
you tested.

It runs [SupaForge](https://github.com/akalsoftware/supaforge): drift appears
as annotations on the run, a summary on the job page, and a JSON report.

## Usage

Add `supaforge.config.json` to your repository (`npx @akal/supaforge init`
writes one), reading connection strings from the environment:

```json
{
  "environments": {
    "staging": { "dbUrl": "$STAGING_DATABASE_URL" },
    "production": { "dbUrl": "$PRODUCTION_DATABASE_URL" }
  },
  "source": "staging",
  "target": "production"
}
```

Then, in a workflow:

```yaml
name: Drift check
on:
  pull_request:
  schedule:
    - cron: '0 6 * * *'

permissions:
  contents: read

jobs:
  drift:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: akalsoftware/supaforge-action@v1
        env:
          STAGING_DATABASE_URL: ${{ secrets.STAGING_DATABASE_URL }}
          PRODUCTION_DATABASE_URL: ${{ secrets.PRODUCTION_DATABASE_URL }}
```

Read-only by default: it compares and reports, and changes nothing.

## Inputs

| Input | Default | |
| --- | --- | --- |
| `args` | `diff --ci` | SupaForge CLI arguments. Add `--fail-on=warning` or `--fail-on=any` to be stricter, `--check` / `--skip` to narrow it. |
| `version` | `latest` | `@akal/supaforge` version or dist-tag. Pin one for repeatable runs. |
| `working-directory` | `.` | Where `supaforge.config.json` lives. |
| `node-version` | `22` | Node.js 20 or newer. Empty uses the runner's. |
| `report` | `supaforge-report.json` | Where the JSON report goes, relative to `working-directory`. Empty to skip. |

## Outputs

| Output | |
| --- | --- |
| `exit-code` | `0` clean, `1` drift at or above the threshold, `2` could not run |
| `report` | Path of the JSON report |

Keep the report as an artifact:

```yaml
      - uses: akalsoftware/supaforge-action@v1
        id: drift
        env: { ... }
      - if: always()
        uses: actions/upload-artifact@v4
        with:
          name: supaforge-report
          path: ${{ steps.drift.outputs.report }}
```

## License

MIT
