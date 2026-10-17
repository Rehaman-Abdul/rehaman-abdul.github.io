// Release-quality guards: size budget, security rules and page structure.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));

function files(dir, ext) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) out.push(...files(path, ext));
    else if (ext.some((e) => name.endsWith(e))) out.push(path);
  }
  return out;
}
const read = (path) => readFileSync(path, "utf8");
const rel = (path) => relative(root, path).replaceAll("\\", "/");

const html = read(join(root, "index.html"));
const rolesDir = join(root, "content", "roles");
const sourceFiles = [...files(join(root, "js"), [".js"]), ...files(join(root, "css"), [".css"]), ...files(join(root, "content"), [".js"])];

test("JavaScript and CSS stay under 250 KB, each role file under 60 KB", () => {
  const shared = [...sourceFiles.filter((f) => !f.startsWith(rolesDir) || f.endsWith("index.js")), join(root, "index.html")];
  const total = shared.reduce((n, f) => n + statSync(f).size, 0);
  assert.ok(total < 250 * 1024, `shared code is ${(total / 1024).toFixed(1)} KB`);
  for (const f of files(rolesDir, [".js"]).filter((p) => !p.endsWith("index.js"))) {
    assert.ok(statSync(f).size < 60 * 1024, `${rel(f)} is ${(statSync(f).size / 1024).toFixed(1)} KB`);
  }
});

test("no unsafe HTML or code-evaluation APIs are used", () => {
  const banned = /\b(innerHTML|outerHTML|insertAdjacentHTML|document\.write|eval\(|new Function\()/;
  for (const f of files(join(root, "js"), [".js"])) {
    const code = read(f).split("\n").filter((line) => !line.trim().startsWith("//"));
    assert.ok(!code.some((line) => banned.test(line)), `${rel(f)} uses an unsafe API`);
  }
});

test("no network requests besides the Google Fonts stylesheet", () => {
  for (const f of files(join(root, "js"), [".js"])) {
    assert.ok(!/\b(fetch|XMLHttpRequest|WebSocket|sendBeacon|EventSource)\b/.test(read(f).replace(/\/\/.*$/gm, "")), `${rel(f)} makes a request`);
  }
  const external = [...html.matchAll(/(?:src|href)="(https?:[^"]+)"/g)].map((m) => new URL(m[1]).origin);
  const allowed = new Set(["https://fonts.googleapis.com", "https://fonts.gstatic.com", "https://example.github.io"]);
  for (const origin of external) assert.ok(allowed.has(origin), `unexpected origin ${origin}`);
});

test("no third-party scripts, analytics or inline handlers", () => {
  const scripts = [...html.matchAll(/<script\b([^>]*)>/g)].map((m) => m[1]);
  assert.ok(scripts.length >= 2);
  for (const attrs of scripts) {
    assert.match(attrs, /src="(?!https?:)[^"]+"/, `script must be a same-origin file: ${attrs}`);
  }
  assert.ok(!/<script[^>]*>\s*\S/.test(html.replace(/<script[^>]*src[^>]*><\/script>/g, "")), "inline script found");
  assert.ok(!/\son[a-z]+\s*=/.test(html), "inline event handler in index.html");
  assert.ok(!/\bstyle="/.test(html), "inline style attribute in index.html");
});

test("Content-Security-Policy is present and matches the PRD", () => {
  const csp = html.match(/http-equiv="Content-Security-Policy"\s+content="([^"]+)"/)[1];
  assert.equal(
    csp,
    "default-src 'self'; script-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; base-uri 'self'; form-action 'none'",
  );
});

test("page structure: language, viewport, skip link, title, description and relative paths", () => {
  assert.match(html, /<html lang="en">/);
  assert.match(html, /name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"/);
  assert.match(html, /<a class="skip-link" href="#main">/);
  assert.match(html, /<title>[^<]{10,}<\/title>/);
  assert.match(html, /name="description"\s+content="[^"]{50,}"/);
  assert.match(html, /rel="icon"[^>]+href="assets\/favicon\.svg"/);
  for (const [, url] of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
    if (url.startsWith("http") || url.startsWith("#")) continue;
    assert.ok(!url.startsWith("/"), `absolute path ${url} breaks GitHub Pages project sites`);
  }
  assert.ok(!/\b(localStorage|document\.cookie)\b/.test(html));
});

test("no absolute paths in module imports (works from a project subpath)", () => {
  for (const f of files(join(root, "js"), [".js"])) {
    for (const [, spec] of read(f).matchAll(/(?:from|import\()\s*["'`]([^"'`]+)["'`]/g)) {
      if (spec.startsWith("node:")) continue;
      assert.ok(spec.startsWith("."), `${rel(f)} imports ${spec}`);
    }
  }
});

test("only the font weights in use are requested", () => {
  const fonts = html.match(/family=Atkinson\+Hyperlegible:wght@([\d;]+)&family=Bricolage\+Grotesque:wght@([\d;]+)/);
  assert.equal(fonts[1], "400;700");
  assert.equal(fonts[2], "700");
  assert.match(html, /display=swap/);
  assert.match(html, /rel="preconnect" href="https:\/\/fonts\.googleapis\.com"/);
});

test("interactive controls meet the 44px target size in CSS", () => {
  const css = files(join(root, "css"), [".css"]).map(read).join("\n");
  assert.match(css, /--target:\s*44px/);
  for (const selector of [".btn", ".icon-btn", ".card", ".chat", ".segment", ".rail__btn"]) {
    const block = css.match(new RegExp(`${selector.replace(".", "\\.")}\\s*\\{[^}]*\\}`));
    assert.ok(block && /(min-height|height|min-width|width):\s*(var\(--target\)|44px|60px)/.test(block[0]), `${selector} lacks a 44px target`);
  }
});

test("reduced motion is respected through the media query and the in-game override", () => {
  const css = read(join(root, "css", "base.css"));
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(css, /:root\[data-motion="reduce"\]/);
  assert.match(read(join(root, "js", "ui", "a11y.js")), /prefers-reduced-motion: reduce/);
});

test("every interactive icon-only control has an accessible name", () => {
  const ui = files(join(root, "js", "ui"), [".js"]).map(read).join("\n");
  for (const match of ui.matchAll(/h\("button",\s*\{([^}]*)\}\s*,\s*icon\("[a-z]+"\)\s*\)/g)) {
    assert.match(match[1], /aria-label|title/, `icon-only button lacks a name: ${match[1]}`);
  }
});

// ---- phase 7: docs, social image and workflows ----------------------------------

test("every relative link in the README and docs resolves to a file", () => {
  const docs = [join(root, "README.md"), ...files(join(root, "docs"), [".md"])];
  assert.ok(docs.length >= 4);
  for (const doc of docs) {
    const text = read(doc).replace(/```[\s\S]*?```/g, "");
    for (const [, target] of text.matchAll(/\]\(([^)\s]+)\)/g)) {
      if (/^(https?:|mailto:|#)/.test(target)) continue;
      const path = join(doc, "..", target.split("#")[0]);
      assert.ok(statSync(path, { throwIfNoEntry: false }), `${rel(doc)} links to missing ${target}`);
    }
  }
});

test("the social preview PNG is 1200 by 630 and the SVG source is present", () => {
  const png = readFileSync(join(root, "assets", "og-image.png"));
  assert.equal(png.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
  assert.equal(png.readUInt32BE(16), 1200);
  assert.equal(png.readUInt32BE(20), 630);
  assert.ok(png.length < 300 * 1024);
  assert.match(read(join(root, "assets", "og-image.svg")), /viewBox="0 0 1200 630"/);
  assert.match(html, /property="og:image" content="[^"]+assets\/og-image\.png"/);
});

test("workflows exist, pin exact action versions and run the required jobs", () => {
  const ci = read(join(root, ".github", "workflows", "ci.yml"));
  const pages = read(join(root, ".github", "workflows", "pages.yml"));
  for (const [name, text] of [["ci", ci], ["pages", pages]]) {
    const uses = [...text.matchAll(/uses:\s*(\S+)/g)].map((m) => m[1]);
    assert.ok(uses.length > 0, name);
    for (const action of uses) assert.match(action, /@v\d+\.\d+\.\d+$|@[0-9a-f]{40}$/, `${name}: ${action} is not pinned to an exact version`);
  }
  assert.match(ci, /npm run lint:content/);
  assert.match(ci, /npm test/);
  assert.match(ci, /tools\/simulate\.mjs --roles \$\{\{ matrix\.role \}\} --seeds 3/);
  const matrix = ci.match(/role:\s*\[([^\]]+)\]/)[1].split(",").map((r) => r.trim());
  assert.deepEqual(matrix.sort(), ["finance", "hr", "marketing", "ops", "sales", "servicedesk", "support", "tech"]);
  assert.match(pages, /actions\/configure-pages/);
  assert.match(pages, /actions\/upload-pages-artifact/);
  assert.match(pages, /actions\/deploy-pages/);
  assert.match(pages, /pages: write/);
});

test("the Pages job stages every runtime path the page loads", () => {
  const pages = read(join(root, ".github", "workflows", "pages.yml"));
  const staged = pages.match(/cp -r (.+) _site\//)[1].split(" ");
  for (const entry of ["index.html", "assets", "css", "js", "content"]) assert.ok(staged.includes(entry), `${entry} is not staged`);
  assert.ok(!staged.includes("tests") && !staged.includes("tools"));
});
