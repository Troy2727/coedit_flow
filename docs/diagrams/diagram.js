// Draws one boxes-and-arrows diagram into a composition root and returns its GSAP timeline:
// boxes appear first, then each arrow draws with a glowing dot leading it, and each label
// glows in as its arrow lands. Adapted from the Analytica README diagrams.
window.LiveDocsDiagram = (function () {
  const SVG_NS = "http://www.w3.org/2000/svg";
  const BLUE = "#417bff";
  const GLOW_ON = "drop-shadow(0 0 10px rgba(65, 123, 255, 0.95))";
  const GLOW_OFF = "drop-shadow(0 0 0px rgba(65, 123, 255, 0))";

  function el(tag, attrs, parent, text) {
    const node = document.createElementNS(SVG_NS, tag);
    for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
    if (text) node.textContent = text;
    parent.appendChild(node);
    return node;
  }

  function html(parent, className, style, inner) {
    const div = document.createElement("div");
    div.className = className;
    Object.assign(div.style, style);
    div.innerHTML = inner;
    parent.appendChild(div);
    return div;
  }

  // public/assets/icons/livedocs-icon.svg
  const LOGO = `<svg viewBox="0 0 48 48">
    <rect width="48" height="48" rx="12" fill="#3371FF"/>
    <rect x="11" y="10" width="5.5" height="28" rx="2.75" fill="#fff"/>
    <rect x="11" y="32.5" width="26" height="5.5" rx="2.75" fill="#fff"/>
    <rect x="21" y="11" width="16" height="4" rx="2" fill="#A9C1FF"/>
    <rect x="21" y="19.5" width="9" height="4" rx="2" fill="#A9C1FF"/>
    <rect x="32.5" y="16.5" width="3" height="10" rx="1.5" fill="#FFB547"/></svg>`;

  /** Background, logo + title, footer, and the SVG layer wires are drawn on. */
  function frame(root, title) {
    root.classList.add("scene");
    const header = html(root, "header", {}, `${LOGO}<h1>${title}</h1>`);
    const footer = html(root, "footer", {}, "coeditflow.vercel.app");
    const svg = el("svg", { class: "wires", viewBox: "0 0 1600 1150" }, root);
    const defs = el("defs", {}, svg);
    const marker = el(
      "marker",
      { id: "head", viewBox: "0 0 10 10", refX: "9", refY: "5", markerWidth: "9", markerHeight: "9", orient: "auto-start-reverse" },
      defs
    );
    el("path", { d: "M0 0 L10 5 L0 10 z", fill: BLUE }, marker);
    const glow = el("filter", { id: "glow", x: "-200%", y: "-200%", width: "500%", height: "500%" }, defs);
    el("feGaussianBlur", { stdDeviation: "5", result: "blur" }, glow);
    const merge = el("feMerge", {}, glow);
    el("feMergeNode", { in: "blur" }, merge);
    el("feMergeNode", { in: "SourceGraphic" }, merge);
    const tl = gsap.timeline({ paused: true });
    tl.fromTo([header, footer], { opacity: 0, y: -12 }, { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }, 0);
    return { root, svg, defs, tl, wires: 0 };
  }

  /** A wire revealed through a mask from start to end, with a glowing dot riding the tip. */
  function wire(f, d, { both = false }, at, duration) {
    const n = f.wires++;
    const mask = el("mask", { id: `m${n}`, maskUnits: "userSpaceOnUse", x: 0, y: 0, width: 1600, height: 1150 }, f.defs);
    const reveal = el("path", { d, fill: "none", stroke: "#fff", "stroke-width": 34 }, mask);
    const len = reveal.getTotalLength();
    reveal.setAttribute("stroke-dasharray", `${len} ${len}`);
    el("path", {
      d, fill: "none", stroke: BLUE, "stroke-width": 3.5, mask: `url(#m${n})`, "marker-end": "url(#head)",
      ...(both ? { "marker-start": "url(#head)" } : {}),
    }, f.svg);
    const start = reveal.getPointAtLength(0);
    const startDot = both ? null : el("circle", { cx: start.x, cy: start.y, r: 6, fill: BLUE }, f.svg);
    const halo = el("circle", { r: 15, fill: BLUE, opacity: 0, filter: "url(#glow)" }, f.svg);
    const dot = el("circle", { r: 6, fill: "#dbe6ff", opacity: 0, filter: "url(#glow)" }, f.svg);
    const ride = { p: 0 };
    const place = () => {
      const pt = reveal.getPointAtLength(ride.p * len);
      for (const c of [dot, halo]) {
        c.setAttribute("cx", pt.x);
        c.setAttribute("cy", pt.y);
      }
    };
    place();

    if (startDot) f.tl.fromTo(startDot, { opacity: 0, scale: 0, transformOrigin: "50% 50%" }, { opacity: 1, scale: 1, duration: 0.2 }, at);
    f.tl.fromTo(reveal, { attr: { "stroke-dashoffset": len } }, { attr: { "stroke-dashoffset": 0 }, duration, ease: "power1.inOut" }, at);
    f.tl.fromTo(ride, { p: 0 }, { p: 1, duration, ease: "power1.inOut", onUpdate: place }, at);
    f.tl.fromTo([dot, halo], { attr: { opacity: 0 } }, { attr: { opacity: (i) => (i ? 0.35 : 1) }, duration: 0.15 }, at);
    f.tl.to([dot, halo], { attr: { opacity: 0 }, duration: 0.3 }, at + duration);
  }

  /** Fade an element in with a glow that settles. */
  function glowIn(f, targets, at) {
    f.tl.fromTo(targets, { opacity: 0, y: 6, filter: GLOW_ON }, { opacity: 1, y: 0, duration: 0.35, ease: "power2.out" }, at);
    f.tl.to(targets, { filter: GLOW_OFF, duration: 0.7, ease: "power1.out" }, at + 0.35);
  }

  /** Boxes and arrows at fixed positions, with optional dashed groups around some of them. */
  function boxes(root, title, { groups = [], nodes, links }) {
    const f = frame(root, title);
    const groupEls = groups.map((g) => {
      const rect = el("rect", {
        x: g.x1, y: g.y1, width: g.x2 - g.x1, height: g.y2 - g.y1, rx: 24,
        fill: "none", stroke: BLUE, "stroke-opacity": 0.45, "stroke-dasharray": "9 8", "stroke-width": 1.5,
      }, f.svg);
      const label = html(root, "group-label", { left: `${g.x1 + 22}px`, top: `${g.y1 + 18}px` }, g.label);
      return [rect, label];
    });
    const nodeEls = nodes.map((n) =>
      html(root, "node", { left: `${n.x}px`, top: `${n.y}px`, width: `${n.w}px`, height: `${n.h}px` },
        `<div class="title">${n.title}</div><div class="sub">${n.sub}</div>`)
    );
    f.tl.fromTo(groupEls.flat(), { opacity: 0 }, { opacity: 1, duration: 0.5 }, 0.4);
    f.tl.fromTo(nodeEls, { opacity: 0, y: 16, scale: 0.96 }, { opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.18, ease: "power2.out" }, 0.6);

    let t = 0.6 + nodes.length * 0.18 + 0.6;
    for (const link of links) {
      const duration = link.duration || 0.6;
      wire(f, link.d, { both: link.both }, t, duration);
      const label = el("text", { x: link.lx, y: link.ly, "text-anchor": link.anchor || "middle", fill: "#d4e4ff", "font-family": "JetBrains Mono", "font-size": 26, "font-weight": 500 }, f.svg, link.label);
      glowIn(f, label, t + duration * 0.6);
      t += duration + 0.35;
    }
    const total = Number(root.dataset.duration);
    f.tl.to({}, { duration: Math.max(0, total - f.tl.duration()) });
    return f.tl;
  }

  /**
   * A 1600×1000 app screenshot shown at 80% in a card; then each callout outlines one area
   * (given in screenshot pixels) and a label glows in at (lx, ly), also in screenshot pixels.
   */
  function screen(root, title, { src, alt, callouts }) {
    const f = frame(root, title);
    const X = 160, Y = 175, S = 0.8;
    const card = html(root, "shot", { left: `${X}px`, top: `${Y}px` }, `<img src="${src}" alt="${alt}" />`);
    root.appendChild(f.svg); // outlines draw above the card
    f.tl.fromTo(card, { opacity: 0, y: 30, scale: 0.97 }, { opacity: 1, y: 0, scale: 1, duration: 0.7, ease: "power2.out" }, 0.4);

    let t = 1.7;
    for (const c of callouts) {
      const ring = el("rect", {
        x: X + c.x * S, y: Y + c.y * S, width: c.w * S, height: c.h * S, rx: 12,
        fill: "none", stroke: BLUE, "stroke-width": 3.5, filter: "url(#glow)",
      }, f.svg);
      const len = 2 * (c.w + c.h) * S;
      ring.setAttribute("stroke-dasharray", `${len} ${len}`);
      f.tl.fromTo(ring, { attr: { "stroke-dashoffset": len } }, { attr: { "stroke-dashoffset": 0 }, duration: 0.6, ease: "power1.inOut" }, t);
      const label = html(root, "callout", { left: `${X + c.lx * S}px`, top: `${Y + c.ly * S}px` }, c.label);
      glowIn(f, label, t + 0.4);
      t += 1.0;
    }
    const total = Number(root.dataset.duration);
    f.tl.to({}, { duration: Math.max(0, total - f.tl.duration()) });
    return f.tl;
  }

  return { boxes, screen };
})();
