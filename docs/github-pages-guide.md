# GitHub Pages Deployment Guide

## 1. Create the repo
Name it exactly `Rehaman-Abdul.github.io` for a root site (`https://Rehaman-Abdul.github.io`). Public, no template, don't add a README on GitHub (this folder has one).

## 2. Push the site
```bash
cd "AR Portfolio"
git init -b main
git add .
git commit -m "Initial portfolio"
git remote add origin https://github.com/Rehaman-Abdul/Rehaman-Abdul.github.io.git
git push -u origin main
```

## 3. Enable Pages
Repo → **Settings → Pages → Build and deployment → Source: Deploy from a branch → `main` / `(root)` → Save.** Live in 1–2 minutes. `.nojekyll` is included so `_template.html` and similar files publish untouched.

## 4. Workflow & branches
```bash
git switch -c feat/case-study-onboarding
# edit…
git add . && git commit -m "Add onboarding case study"
git push -u origin feat/case-study-onboarding   # open a Pull Request, review the preview locally, merge to main
```
`main` = live. Use short-lived `feat/*` and `fix/*` branches; tag milestones (`git tag v1.0`).

## 5. Custom domain (optional, later)
Only add one once the domain is registered and its DNS exists (`nslookup yourdomain` must return records).
1. DNS: four A records for `@` → `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`; CNAME `www` → `rehaman-abdul.github.io`.
2. Repo → Settings → Pages → Custom domain → enter it → tick **Enforce HTTPS**.
3. Then add a `CNAME` file with the domain and update the canonical URLs, `sitemap.xml` and `robots.txt`.

## 6. SEO checklist
- Unique `<title>` (≤60 chars) and meta description (≤155) per page
- `sitemap.xml` + `robots.txt`; submit in Google Search Console
- JSON-LD `Person` (in `index.html`), OG image 1200×630
- Descriptive alt text, semantic headings (one `h1`), fast images (WebP, lazy-load below the fold)
- Link the site from LinkedIn, GitHub profile, email signature, resume
