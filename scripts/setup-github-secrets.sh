#!/bin/bash
# ============================================================
# BACEN MONITOR — Configura secrets no GitHub Actions
# Execute: bash scripts/setup-github-secrets.sh
# Requer: gh CLI (brew install gh / apt install gh)
# ============================================================

# PREENCHER antes de rodar:
REPO="GITHUB_REPO_URL_AQUI"   # ex: luciano-sadagurschi/bacen-monitor

echo "Configurando secrets em: $REPO"

# ── Vercel ────────────────────────────────────────────────────
gh secret set VERCEL_TOKEN      --body "vcp_0Dt8sfmK9bwuBHPxENiuRMup6vganPk73eadRnwwcJXbFAP7g12Io860" --repo "$REPO"
gh secret set VERCEL_PROJECT_ID --body "prj_NzVXiaYGaDYEfXjayXwW8qW2c6vu" --repo "$REPO"
gh secret set VERCEL_ORG_ID     --body "team_58xShm1j0dQhGYBSSP3dfH6N"     --repo "$REPO"

echo "Vercel OK"

# ── Supabase (preencher depois com o access token do Supabase) ─
# gh secret set SUPABASE_ACCESS_TOKEN --body "sbp_..." --repo "$REPO"
# gh secret set SUPABASE_PROJECT_ID   --body "xxxx"    --repo "$REPO"

echo ""
echo "Secrets configurados! Agora execute o push do codigo."
