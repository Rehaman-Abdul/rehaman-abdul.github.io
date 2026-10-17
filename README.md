# Abdul Rehaman — Portfolio

Static portfolio (HTML5 + CSS + vanilla JS), hosted on GitHub Pages. No build step.

## Run locally
```bash
npx serve .          # or: node -e "require('http')..." / VS Code Live Server
```

## Before you publish — find & replace
| Placeholder | Replace with |
|---|---|
| `YOUR_FORM_ID` | Formspree form id (contact.html) |
| Project / metric / testimonial placeholders | real content |

Add `assets/img/portrait.jpg`, `assets/img/og-image.jpg` (1200×630), `assets/pdf/resume.pdf`.

## Structure
- `index.html`, `about.html`, `work.html`, `services.html`, `resume.html`, `certifications.html`, `contact.html`, `404.html`
- `case-studies/_template.html` — duplicate for each new case study (copy, rename, fill in, add to `work.html` + `sitemap.xml`)
- `assets/css/tokens.css` — colours, fonts, spacing (re-theme here)
- `docs/` — branding, copy templates, deploy guide, 30-day roadmap, AI workflow
