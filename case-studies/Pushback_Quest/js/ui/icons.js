// Original inline SVG icons (24x24, stroke based). No icon fonts or libraries.
// A string starting with "c:" is a circle ("c:cx,cy,r"); anything else is a path.

const ICONS = {
  hr: ["c:9,8,3", "M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6", "c:17,9,2.5", "M17 14.5c2.5 0 4 1.8 4 4.5"],
  tech: ["M8 7l-5 5 5 5", "M16 7l5 5-5 5", "M14 5l-4 14"],
  sales: ["M3 17l6-6 4 4 8-9", "M15 6h6v6"],
  marketing: ["M4 10v4h3l7 4V6L7 10H4z", "M17 9a4 4 0 010 6", "M19.5 6.5a8 8 0 010 11"],
  ops: ["M3 8l9-5 9 5v8l-9 5-9-5z", "M3 8l9 5 9-5", "M12 13v8"],
  servicedesk: ["M5 4h14a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z", "M8 20h8M12 16v4"],
  support: ["M4 5h16v11H9l-5 4z", "M8 9h8M8 12h5"],
  finance: ["M3 20h18", "M6 20v-8M12 20V5M18 20v-5"],
  moon: ["M20 14.5A8 8 0 019.5 4a8 8 0 1010.5 10.5z"],
  sun: ["c:12,12,4", "M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"],
  settings: ["M3 6h9M16 6h5M3 12h3M10 12h11M3 18h13M20 18h1", "c:14,6,2", "c:8,12,2", "c:18,18,2"],
  notes: ["M5 3h10l4 4v14H5z", "M15 3v4h4", "M8 12h8M8 16h6"],
  chat: ["M4 5h16v11H9l-5 4z"],
  activity: ["M6 16v-5a6 6 0 0112 0v5l2 2H4z", "M10 20a2 2 0 004 0"],
  calendar: ["M4 6h16v14H4z", "M4 10h16M8 3v4M16 3v4"],
  close: ["M6 6l12 12M18 6L6 18"],
  menu: ["M4 6h16M4 12h16M4 18h16"],
  info: ["c:12,12,9", "M12 11v6", "M12 7.5v.01"],
  check: ["M5 12l5 5 9-10"],
};

const NS = "http://www.w3.org/2000/svg";

export function icon(name, label) {
  const shapes = ICONS[name];
  if (!shapes) throw new Error(`Unknown icon: ${name}`);
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("width", "24");
  svg.setAttribute("height", "24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "2");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  svg.setAttribute("class", "icon");
  if (label) {
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", label);
  } else {
    svg.setAttribute("aria-hidden", "true");
  }
  for (const shape of shapes) {
    if (shape.startsWith("c:")) {
      const [cx, cy, r] = shape.slice(2).split(",");
      const circle = document.createElementNS(NS, "circle");
      circle.setAttribute("cx", cx);
      circle.setAttribute("cy", cy);
      circle.setAttribute("r", r);
      svg.append(circle);
    } else {
      const path = document.createElementNS(NS, "path");
      path.setAttribute("d", shape);
      svg.append(path);
    }
  }
  return svg;
}

// The app's own geometric mark: three message lines of different lengths.
export function logoMark() {
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("viewBox", "0 0 32 32");
  svg.setAttribute("width", "32");
  svg.setAttribute("height", "32");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("class", "logo-mark");
  const rect = document.createElementNS(NS, "rect");
  rect.setAttribute("width", "32");
  rect.setAttribute("height", "32");
  rect.setAttribute("rx", "8");
  rect.setAttribute("fill", "#1E3448");
  const path = document.createElementNS(NS, "path");
  path.setAttribute("d", "M9 11h14M9 16h9M9 21h12");
  path.setAttribute("stroke", "#4FB8A5");
  path.setAttribute("stroke-width", "3");
  path.setAttribute("stroke-linecap", "round");
  path.setAttribute("fill", "none");
  svg.append(rect, path);
  return svg;
}
