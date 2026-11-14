#!/usr/bin/env bash
set -e

REPO_URL="https://github.com/Fairuza050894/OneSpec_.git"

echo "🔒 1/5 Mengamankan .gitignore (mencegah kebocoran token sesi & file besar)..."
touch .gitignore

IgnoreList=(
  "node_modules/"
  ".next/"
  "out/"
  "dist/"
  "build/"
  ".DS_Store"
  ".env"
  ".env.*"
  ".onespec-auth-state.json"
  ".onespec-workspace-cache.json"
  ".onespec-backup-*"
  ".onespec-ui-backup-*"
  ".onespec-master-backup-*"
  "*.zip"
  "*.log"
)

for item in "${IgnoreList[@]}"; do
  if ! grep -qxF "$item" .gitignore; then
    echo "$item" >> .gitignore
  fi
done

echo "⚙️ 2/5 Menginisialisasi Git & mengatur remote origin..."
if [ ! -d ".git" ]; then
  git init
fi

git branch -M main

if git remote | grep -qx "origin"; then
  git remote set-url origin "$REPO_URL"
else
  git remote add origin "$REPO_URL"
fi

echo "🧹 3/5 Membersihkan file sensitif/besar dari staging area jika pernah tercatat..."
git rm -r --cached node_modules .next .onespec-auth-state.json .onespec-workspace-cache.json .onespec-backup-* .onespec-ui-backup-* .onespec-master-backup-* *.zip 2>/dev/null || true

echo "📦 4/5 Menambahkan seluruh perubahan kode sumber & membuat commit..."
git add .
git commit -m "feat(enterprise-iso): upgrade 5-layer deep SPA harvester, multi-persona RBAC matrix, AST/FK rules & Playwright/Postman bundle" || echo "ℹ️ Tidak ada perubahan baru untuk di-commit."

echo "🚀 5/5 Melakukan push ke $REPO_URL (branch: main)..."
git push -u origin main --force

echo "✅ SELESAI! Seluruh kode terbaru telah berhasil di-commit dan di-push dengan aman ke GitHub."
