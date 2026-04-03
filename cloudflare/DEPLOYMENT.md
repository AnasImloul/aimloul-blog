# Cloudflare Deployment

This project deploys to Cloudflare Pages project `portfolio` via GitHub Actions.

## Files used

- `wrangler.toml`
- `.github/workflows/deploy.yml`

## Required GitHub secrets

Set these in the repository:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

The API token must have permission to manage Pages projects and deployments.

## How deployment works

On push to `main` (or manual workflow dispatch), CI will:

1. Build the site with Hugo (`hugo --minify`)
2. Check if Pages project `portfolio` exists
3. Create project `portfolio` if missing
4. Deploy `public/` with Wrangler

Deployment command used:

```bash
wrangler pages deploy public --project-name portfolio --branch main --commit-dirty=true
```

## Notes

- Site output directory is `public`.
- The setup is idempotent: project creation only runs when needed.
