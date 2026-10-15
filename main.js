/* Glass Shelf Companion. 빌드 결과물: 원본은 src/ (esbuild) */
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/main.ts
var main_exports = {};
__export(main_exports, {
  default: () => GlassShelfCompanion
});
module.exports = __toCommonJS(main_exports);
var import_obsidian14 = require("obsidian");

// src/core.ts
var import_obsidian5 = require("obsidian");

// src/web-page.ts
var isWebView = (v) => !!v && typeof v.getViewType === "function" && v.getViewType() === "webviewer";
var WEB_KEYS_PASS = /* @__PURE__ */ new Set(["Enter", "Escape", "ArrowUp", "ArrowDown", "Tab"]);
var WEB_CARD_K = 2;
var WEB_PAGE_SCRIPT = `(() => {
  const prevX = window.__lgInset;
  window.__lgInset = __LG_INSET__;
  // \uACE0\uC815 \uC694\uC18C\uAC00 \uC0C8 \uC790\uB9AC\uB85C \uC6C0\uC9C1\uC774\uB294 \uC2DC\uAC04(ms). \uD0ED \uC904\uC744 \uC811\uACE0 \uD3BC \uB54C \uB760\uC640 \uAC19\uC774 \uC6C0\uC9C1\uC774\uAC8C \uD55C\uB2E4. \uC774\uBC88\uC5D0 \uB9DE\uCD9C \uB54C\uB9CC \uC4F4\uB2E4
  window.__lgAnim = __LG_ANIM__;
  // \uD50C\uB7EC\uADF8\uC778\uC774 \uBCF4\uB0B8 \uC2DC\uAC01. \uD398\uC774\uC9C0\uC5D0 \uB2FF\uAE30\uAE4C\uC9C0 \uAC78\uB9B0 \uC2DC\uAC04\uB9CC\uD07C \uC6C0\uC9C1\uC784\uC744 \uC55E\uB2F9\uACA8 \uB760\uC640 \uB9DE\uCD98\uB2E4: \uADF8\uB9CC\uD07C \uB9C9\uB300\uAC00 \uB760\uBCF4\uB2E4 \uB2A6\uAC8C \uCD9C\uBC1C\uD588\uB2E4 (\uC0AC\uC6A9\uC790 \uC9C0\uC801)
  window.__lgLate = Math.max(0, Date.now() - __LG_SENT__);
  // \uB2E4\uC2DC \uB123\uC744 \uB54C(\uD0ED \uC904 \uCD95\uC18C\uB85C \uB760 \uB192\uC774\uAC00 \uBC14\uB01C) \uC704 \uC5EC\uBC31\uC774 \uBC14\uB010 \uB9CC\uD07C \uC2A4\uD06C\uB864\uC744 \uC62E\uACA8, \uC77D\uB358 \uB0B4\uC6A9\uC774 \uC81C\uC790\uB9AC\uC5D0 \uC788\uAC8C \uD55C\uB2E4
  if (window.__lgGS) { window.__lgGS(); window.__lgAnim = 0; if (prevX != null && scrollY > 0) scrollBy(0, window.__lgInset - prevX); return; }
  const root = document.documentElement;
  // \uD654\uBA74 \uC704\uCABD\uC5D0 \uBD99\uB294 \uACE0\uC815\xB7\uC2A4\uD2F0\uD0A4 \uC694\uC18C\uB97C \uC5EC\uBC31\uB9CC\uD07C \uB0B4\uB9B0\uB2E4. \uACE0\uC815 \uC694\uC18C\uB294 \uD0ED \uC904 \uC544\uB798 FIX_BAND(px)\uAE4C\uC9C0 \uCC3E\uB294\uB2E4: \uB9E8 \uC704 \uB760\uB9CC \uBCF4\uBA74
  // \uC720\uD29C\uBE0C\uCC98\uB7FC \uC0C1\uB2E8 \uBC14 \uBC11\uC5D0 \uBD99\uB294 \uACE0\uC815 \uC694\uC18C(\uC67C\uCABD \uBA54\uB274\xB7\uCE69 \uC904)\uAC00 \uC81C\uC790\uB9AC\uC5D0 \uB0A8\uC544 \uB0B4\uB824\uC628 \uC0C1\uB2E8 \uBC14\uC640 \uACB9\uCCE4\uB2E4 (\uC0AC\uC6A9\uC790 \uC9C0\uC801).
  // \uD398\uC774\uC9C0 \uC2A4\uD06C\uB9BD\uD2B8\uAC00 \uC9C1\uC811 \uC790\uB9AC\uB97C \uC815\uD558\uB294 \uC694\uC18C(\uC778\uB77C\uC778 top, \uD234\uD301\xB7\uD31D\uC5C5)\uB294 \uAC74\uB4DC\uB9AC\uC9C0 \uC54A\uB294\uB2E4. \uC2A4\uD2F0\uD0A4\uB294 \uD654\uBA74 \uB9E8 \uC704\uC5D0 \uBD99\uC740 \uAC83\uB9CC
  const FIX_BAND = 300;
  // \uC694\uC18C e \uC758 top \uC744 v \uB85C \uC62E\uAE34\uB2E4. \uB760\uC640 \uAC19\uC774 \uC6C0\uC9C1\uC77C \uB54C(__lgAnim)\uB294 \uC7A0\uAE50 top \uC804\uD658\uC744 \uAC74\uB2E4(\uC6D0\uB798 \uC778\uB77C\uC778 \uC804\uD658\uC740 \uB05D\uB098\uBA74 \uB418\uB3CC\uB9B0\uB2E4).
  // \uD398\uC774\uC9C0 \uD2C0(lgPage)\uC740 \uC2A4\uD06C\uB864 \uBCF4\uC815\uACFC \uD568\uAED8 \uBC14\uB85C \uC62E\uAE34\uB2E4: \uCC9C\uCC9C\uD788 \uC62E\uAE30\uBA74 \uBCF4\uC815\uC73C\uB85C \uD55C \uBC88, \uD2C0\uC774 \uC6C0\uC9C1\uC5EC \uB610 \uD55C \uBC88 \uB0B4\uC6A9\uC774 \uB35C\uCEF9\uAC70\uB838\uB2E4 (\uC720\uD29C\uBE0C).
  // \uCC98\uC74C \uC62E\uAE38 \uB54C(fresh)\uB3C4 \uC0AC\uC774\uD2B8\uAC00 top \uC5D0 \uAC78\uC5B4 \uB454 \uC804\uD658\uC744 \uC7A0\uAE50 \uAEBC \uBC14\uB85C \uC62E\uAE34\uB2E4: \uC0C8 \uD398\uC774\uC9C0\uB9C8\uB2E4 \uB9C9\uB300\uAC00 \uB9E8 \uC704\uC5D0\uC11C \uBBF8\uB044\uB7EC\uC838 \uB0B4\uB824\uC654\uB2E4 (obsidian.md)
  const put = (e, v, fresh) => {
    const ms = window.__lgAnim || 0;
    const page = e.dataset.lgPage !== undefined;
    if (ms && !page) {
      if (e.dataset.lgTr === undefined) {
        e.dataset.lgTr = e.style.getPropertyValue("transition");
        e.style.setProperty("transition", "top " + ms + "ms cubic-bezier(0.2, 0.8, 0.2, 1) -" + (window.__lgLate || 0) + "ms", "important");
        setTimeout(() => {
          if (e.dataset.lgTr === undefined) return;
          if (e.dataset.lgTr) e.style.setProperty("transition", e.dataset.lgTr); else e.style.removeProperty("transition");
          delete e.dataset.lgTr;
        }, ms + 50);
      }
      e.style.setProperty("top", v, "important");
    } else if (fresh || page) {
      const tr = e.style.getPropertyValue("transition");
      const pr = e.style.getPropertyPriority("transition");
      e.style.setProperty("transition", "none", "important");
      e.style.setProperty("top", v, "important");
      void e.offsetTop;
      if (tr) e.style.setProperty("transition", tr, pr); else e.style.removeProperty("transition");
    } else e.style.setProperty("top", v, "important");
  };
  const pageCB = () => getComputedStyle(document.body).position === "static" && getComputedStyle(root).position === "static";
  // quick: \uC774\uBBF8 \uC62E\uAE34 \uC694\uC18C\uB9CC \uB9DE\uCD98\uB2E4 (\uBB38\uC11C\uAC00 \uBC14\uB010 \uADF8 \uC790\uB9AC\uC5D0\uC11C \uBD80\uB978\uB2E4)
  const fixTop = (reset, quick) => {
    const X = window.__lgInset || 0;
    if (reset) {
      document.querySelectorAll("[data-lg-top]").forEach((e) => { e.style.removeProperty("top"); delete e.dataset.lgTop; delete e.dataset.lgPage; });
      return;
    }
    if (!X) return;
    const seen = new Set();
    // \uC774\uBBF8 \uC62E\uAE34 \uC694\uC18C\uB294 \uC9C0\uAE08 \uC790\uB9AC\uC640 \uC0C1\uAD00\uC5C6\uC774 \uC0C8 \uC5EC\uBC31\uC73C\uB85C \uC62E\uAE34\uB2E4. \uCC0D\uC5B4 \uCC3E\uAE30\uB9CC \uD558\uBA74 \uC5EC\uBC31\uC774 \uCEE4\uC9C8 \uB54C(\uD0ED \uC904\uC744 \uD3BC \uB54C) \uB0AE\uC740 \uC0C1\uB2E8 \uBC14\uAC00
    // \uCC0D\uB294 \uC790\uB9AC \uC704\uC5D0 \uC788\uC5B4 \uAC78\uB9AC\uC9C0 \uC54A\uC558\uB2E4 (\uC720\uD29C\uBE0C, \uC0AC\uC6A9\uC790 \uC9C0\uC801)
    for (const e of document.querySelectorAll("[data-lg-top]")) {
      seen.add(e);
      // \uC2A4\uD06C\uB864\uC5D0 \uB530\uB77C \uACE0\uC815\uACFC \uC77C\uBC18 \uBC30\uCE58\uB97C \uC624\uAC00\uB294 \uC694\uC18C(\uC720\uD29C\uBE0C \uBD84\uB958 \uCE69 \uC904)\uB294 \uACE0\uC815\uC77C \uB54C\uB9CC \uB0B4\uB9B0\uB2E4. \uC77C\uBC18 \uBC30\uCE58\uB85C \uB3CC\uC544\uC654\uC744 \uB54C top \uC774 \uB0A8\uC544 \uC788\uC73C\uBA74
      // \uC774\uBBF8 \uB0B4\uB824\uAC04 \uD398\uC774\uC9C0 \uD2C0 \uC548\uC5D0\uC11C \uD55C \uBC88 \uB354 \uB0B4\uB824\uAC14\uB2E4 (\uC0AC\uC6A9\uC790 \uC9C0\uC801)
      const pos = getComputedStyle(e).position;
      if (e.dataset.lgPage !== undefined ? pos !== "absolute" : pos !== "fixed" && pos !== "sticky") {
        if (e.style.getPropertyValue("top")) e.style.removeProperty("top");
        continue;
      }
      const v = (parseFloat(e.dataset.lgTop) + X) + "px";
      if (e.style.getPropertyValue("top") === v && e.style.getPropertyPriority("top") === "important") continue;
      put(e, v, false);
    }
    if (quick) return;
    const w = window.innerWidth;
    const ys = [1, Math.max(1, X - 1)];
    for (let y = X + 4; y < X + FIX_BAND && y < window.innerHeight; y += 24) ys.push(y);
    for (const fx of [0.02, 0.15, 0.3, 0.5, 0.7, 0.85, 0.98]) {
      for (const y of ys) {
        for (const el of document.elementsFromPoint(w * fx, y)) {
          for (let e = el; e && e !== root && e !== document.body; e = e.parentElement) {
            if (seen.has(e)) break;
            seen.add(e);
            const cs = getComputedStyle(e);
            const fixed = cs.position === "fixed";
            // \uBB38\uC11C \uAE30\uC900 \uC808\uB300 \uC704\uCE58 \uD2C0(body \uBC14\uB85C \uC544\uB798, \uC704\uCE58 \uC7A1\uD78C \uC870\uC0C1 \uC5C6\uC74C)\uC740 html \uC704 \uC5EC\uBC31\uC744 \uB530\uB974\uC9C0 \uC54A\uC544 \uB0B4\uC6A9\uC774 \uD0ED \uC904 \uB4A4\uC5D0 \uB0A8\uC558\uB2E4
            // (\uC720\uD29C\uBE0C ytd-app, \uC0AC\uC6A9\uC790 \uC9C0\uC801). \uACE0\uC815 \uC694\uC18C\uCC98\uB7FC top \uC5D0 \uC5EC\uBC31\uC744 \uB354\uD55C\uB2E4
            const page = cs.position === "absolute" && e.parentElement === document.body && pageCB();
            if (!fixed && !page && cs.position !== "sticky") continue;
            let fresh = false;
            if (e.dataset.lgTop === undefined) {
              if (e.style.top) continue;
              if (!fixed && !page && y > X) continue;
              const t = parseFloat(cs.top);
              if (!isFinite(t)) continue;
              e.dataset.lgTop = String(t);
              if (page) e.dataset.lgPage = "";
              fresh = true;
            }
            const v = (parseFloat(e.dataset.lgTop) + X) + "px";
            // \uAC19\uC740 \uAC12\uC774\uBA74 \uB2E4\uC2DC \uC4F0\uC9C0 \uC54A\uB294\uB2E4 (\uC4F0\uBA74 \uBB38\uC11C \uBCC0\uD654 \uAC10\uC2DC\uAC00 \uB2E4\uC2DC \uBD88\uB824 \uB05D\uC5C6\uC774 \uB3C8\uB2E4)
            if (e.style.getPropertyValue("top") !== v || e.style.getPropertyPriority("top") !== "important") {
              put(e, v, fresh);
            }
          }
        }
      }
    }
  };
  let raf = 0;
  let timer = 0;
  const tick = () => { raf = 0; fixTop(false); };
  const soon = () => { if (!raf) raf = requestAnimationFrame(tick); };
  const later = () => { clearTimeout(timer); timer = setTimeout(tick, 250); };
  addEventListener("scroll", soon, { passive: true, capture: true });
  addEventListener("resize", soon);
  // \uD398\uC774\uC9C0\uB97C \uADF8\uB9AC\uB294 \uC911(webEarly \uB85C \uC77C\uCC0D \uB123\uC5C8\uC744 \uB54C)\uC5D0\uB294 \uB2E4\uC74C \uD654\uBA74 \uC804\uC5D0 \uBC14\uB85C \uB9DE\uCD98\uB2E4: \uBBF8\uB8E8\uBA74 \uACE0\uC815 \uB9C9\uB300\uAC00 \uB9E8 \uC704\uC5D0 \uADF8\uB824\uC84C\uB2E4\uAC00 \uB0B4\uB824\uC654\uB2E4
  // \uC774\uBBF8 \uC62E\uAE34 \uC694\uC18C\uB294 \uBB38\uC11C\uAC00 \uBC14\uB010 \uADF8 \uC790\uB9AC(\uB2E4\uC74C \uD654\uBA74 \uC804)\uC5D0\uC11C \uBC14\uB85C \uB9DE\uCD98\uB2E4: \uC0AC\uC774\uD2B8\uAC00 \uACE0\uC815\uC744 \uD480\uAC70\uB098 \uB2E4\uC2DC \uAC78\uBA74 \uD55C \uD654\uBA74 \uB3D9\uC548 \uC5C9\uB6B1\uD55C \uC790\uB9AC\uC5D0 \uADF8\uB824\uC84C\uB2E4 (\uC720\uD29C\uBE0C \uBD84\uB958 \uCE69 \uC904).
  // \uACE0\uC815\uC744 \uBC14\uAFB8\uB294 \uC18D\uC131\uC740 \uC0AC\uC774\uD2B8\uB9C8\uB2E4 \uB2EC\uB77C(class, style \uC678 \uC0AC\uC6A9\uC790 \uC815\uC758 \uC18D\uC131) \uBAA8\uB4E0 \uC18D\uC131 \uBCC0\uD654\uB97C \uBCF8\uB2E4
  new MutationObserver(() => { if (window.__lgInset) fixTop(false, true); if (document.readyState === "loading") soon(); else later(); }).observe(root, { childList: true, subtree: true, attributes: true });
  // \uD398\uC774\uC9C0 \uC2A4\uD06C\uB864\uBC14\uAC00 \uD0ED \uC904 \uB4A4\uAE4C\uC9C0 \uC62C\uB77C\uAC00\uC9C0 \uC54A\uAC8C \uC704 \uB05D\uC744 \uC5EC\uBC31\uB9CC\uD07C \uB0B4\uB9B0\uB2E4 (\uC0AC\uC6A9\uC790 \uC9C0\uC801). \uC2A4\uD06C\uB864\uBC14 \uC704\uCE58\uB294 \uAE30\uBCF8 \uC2A4\uD06C\uB864\uBC14\uC5D0\uC120 \uBABB \uBC14\uAFD4,
  // \uC0AC\uC774\uD2B8\uAC00 \uB530\uB85C \uAFB8\uBBF8\uC9C0 \uC54A\uC558\uC73C\uBA74 \uC587\uC740 \uBC18\uD22C\uBA85 \uC2A4\uD06C\uB864\uBC14\uB85C \uBC14\uAFBC\uB2E4(:where \uB77C \uC0AC\uC774\uD2B8 \uAFB8\uBC08\uC774 \uC774\uAE34\uB2E4)
  const sheet = () => {
    let st = document.getElementById("lg-gs-style");
    if (!st) { st = document.createElement("style"); st.id = "lg-gs-style"; (document.head || root).appendChild(st); }
    const X = window.__lgInset || 0;
    st.textContent = X ? ":where(html)::-webkit-scrollbar{width:12px;height:12px;background:transparent}" +
      ":where(html)::-webkit-scrollbar-thumb{background-color:rgba(128,128,128,.45);border:3px solid transparent;background-clip:padding-box;border-radius:8px}" +
      ":where(html)::-webkit-scrollbar-thumb:hover{background-color:rgba(128,128,128,.7)}" +
      ":where(html)::-webkit-scrollbar-track,:where(html)::-webkit-scrollbar-corner{background:transparent}" +
      "html::-webkit-scrollbar-track{margin-top:" + X + "px !important}" : "";
  };
  window.__lgGS = (reset) => {
    const X = window.__lgInset || 0;
    if (X) {
      root.style.setProperty("padding-top", X + "px", "important");
      root.style.setProperty("scroll-padding-top", X + "px", "important");
    } else {
      root.style.removeProperty("padding-top");
      root.style.removeProperty("scroll-padding-top");
    }
    sheet();
    // \uC5EC\uBC31\uC774 \uB0A8\uC544 \uC788\uC73C\uBA74 \uCC98\uC74C \uAE30\uC5B5\uD55C \uC6D0\uB798 top \uC5D0 \uC0C8 \uC5EC\uBC31\uB9CC \uB354\uD55C\uB2E4. \uC9C0\uC6B0\uACE0 \uB2E4\uC2DC \uC77D\uC73C\uBA74 \uC0AC\uC774\uD2B8\uAC00 top \uC5D0 \uC804\uD658\uC744 \uAC78\uC5B4 \uB454 \uACBD\uC6B0
    // \uC544\uC9C1 \uB0B4\uB824\uAC00 \uC788\uB294 \uAC12\uC744 \uC6D0\uB798 \uAC12\uC73C\uB85C \uC77D\uC5B4, \uD0ED \uC904\uC744 \uC811\uACE0 \uD3BC \uB54C\uB9C8\uB2E4 \uACE0\uC815 \uB9C9\uB300\uAC00 \uC810\uC810 \uB0B4\uB824\uAC14\uB2E4 (\uC0AC\uC6A9\uC790 \uC9C0\uC801)
    if (!X || reset) fixTop(true);
    if (!reset) tick();
  };
  window.__lgGS();
  window.__lgAnim = 0;
})();`;
var WEB_MOUSE_SCRIPT = `(() => {
  if (window.__lgMouse) return;
  window.__lgMouse = true;
  addEventListener("mouseup", (e) => {
    if (e.button === 3) { e.preventDefault(); window.__lgNavReq = "back"; }
    else if (e.button === 4) { e.preventDefault(); window.__lgNavReq = "forward"; }
  }, true);
})();`;
var WEB_SCROLL_SCRIPT = "(() => { const n = window.__lgNavReq || ''; window.__lgNavReq = ''; return [(document.scrollingElement || document.documentElement).scrollTop, n]; })()";
var WEB_MINI_POLL_MS = 120;
var WEB_COLOR_SCRIPT = `(() => {
  const root = document.documentElement;
  // \uBC18\uD22C\uBA85 \uBC30\uACBD\uC740 \uAC74\uB108\uB6F4\uB2E4: \uADF8 \uC0C9\uC744 \uC4F0\uBA74 \uD0ED \uC904 \uBC84\uD2BC\xB7\uAE00\uC790 \uC0C9\uAE4C\uC9C0 \uBC18\uD22C\uBA85\uD574\uC838 \uB9E8 \uC704\uB85C \uC62C\uB838\uC744 \uB54C \uC0AC\uB77C\uC84C\uB2E4 (\uC0AC\uC6A9\uC790 \uC9C0\uC801)
  const alpha = (c) => {
    const m = /\\/\\s*([\\d.]+)(%?)\\s*\\)$/.exec(c) || /^rgba\\([^)]*,\\s*([\\d.]+)(%?)\\s*\\)$/.exec(c);
    return m ? parseFloat(m[1]) / (m[2] ? 100 : 1) : 1;
  };
  const clear = (bg) => !bg || bg === "transparent" || alpha(bg) < 0.95;
  // \uD398\uC774\uC9C0 \uBC30\uACBD\uC0C9: html, \uC5C6\uC73C\uBA74 body \uBC30\uACBD (\uC0AC\uC6A9\uC790 \uC694\uCCAD: \uB300\uD45C \uC0C9(theme-color)\uBCF4\uB2E4 \uC790\uC5F0\uC2A4\uB7FD\uB2E4).
  // \uB458 \uB2E4 \uD22C\uBA85\uC774\uBA74 \uBE0C\uB77C\uC6B0\uC800 \uAE30\uBCF8 \uBC14\uD0D5(\uB77C\uC774\uD2B8 \uD770\uC0C9, \uB2E4\uD06C \uC0C9 \uCCB4\uACC4\uBA74 Chromium \uAE30\uBCF8 #121212)
  for (const el of [root, document.body]) {
    const bg = el && getComputedStyle(el).backgroundColor;
    if (!clear(bg)) return bg;
  }
  const dark = /dark/.test(getComputedStyle(root).colorScheme) && matchMedia("(prefers-color-scheme: dark)").matches;
  return dark ? "#121212" : "#ffffff";
})()`;
var WEB_TINT_POLL_MS = 1e3;
var webHost = (view) => {
  const url = view && view.url;
  try {
    const u = new URL(url);
    if (/^https?:$/.test(u.protocol) && u.hostname) return u.hostname.replace(/^www\./, "");
  } catch {
  }
  return view && typeof view.getDisplayText === "function" && view.getDisplayText() || "";
};
var WEB_DARK_DIM = 0.5;
var WEB_DARK_DIM_FROM = 0.6;

// src/util.ts
var import_obsidian = require("obsidian");
var LANG_KO = (() => {
  try {
    return /^ko/i.test((0, import_obsidian.getLanguage)() || "en");
  } catch {
    return false;
  }
})();
var tr = (ko, en) => LANG_KO ? ko : en;
var INJECTED = "lg-injected";
var HIDDEN = "lg-hidden";
var SVG_NS = "http://www.w3.org/2000/svg";
var placeSugg = (pop, x, y, w) => {
  const set = (k, v) => {
    if (pop.style.getPropertyValue(k) !== v) pop.style.setProperty(k, v);
  };
  const left = parseFloat(pop.style.left);
  const top = parseFloat(pop.style.top);
  set("--lg-sx", `${Math.round((x - (isFinite(left) ? left : pop.offsetLeft)) * 10) / 10}px`);
  set("--lg-sy", `${Math.round((y - (isFinite(top) ? top : pop.offsetTop)) * 10) / 10}px`);
  set("--lg-sw", `${w}px`);
};
var newEl = (doc, tag) => doc.win.createEl(tag);
var els = (list) => Array.from(list);
var strs = (list) => Array.from(list);
var menuKey = function(t) {
  return t.closest(".tree-item-self, .nav-file-title, .nav-folder-title, .workspace-tab-header, .metadata-property, .cm-line, .clickable-icon, a, .internal-link") || t;
};
var layoutBottom = function(el) {
  const r = el.getBoundingClientRect();
  return r.top + r.height / 2 + el.offsetHeight / 2;
};
var unitVec = function(fx, fy, tx, ty) {
  const l = Math.hypot(tx - fx, ty - fy) || 1;
  return { ux: (tx - fx) / l, uy: (ty - fy) / l };
};
var isEl = (t) => !!t && t.nodeType === 1 && typeof t.closest === "function";
var tgPad = (cs, win) => {
  const p = parseFloat(cs.getPropertyValue("--lg-tg-pad")) || 2;
  const r = win.devicePixelRatio || 1;
  return Math.round(p * r) / r;
};
var THEME_NAME = "Glass Shelf";

// src/settings.ts
var DEFAULTS = {
  // 유리 투명도 0~10 단계 (클수록 덜 투명). 0 = 맑은 유리.
  // 1~5: 유리 뒤를 바탕색 쪽으로 바래게 (--lg-fade 0.45~0.8). 6~10: 다 바랜 채로 채움을 더해 뿌옇게 (예전 뿌연 정도 1~5).
  // 흐림 세기는 테마에 고정(--lg-blur-k)
  glassLevel: 5,
  // 호버 유리 크기: false = 알약 안 버튼 크기(컨테이너보다 작게, 파일 앱), true = 컨테이너 높이(사파리)
  hoverLarge: false,
  // 탭 줄 첫 줄에 지금 문서의 "폴더 / 파일" 경로를 보이고, 탭은 둘째 줄로 내린다
  showPath: true,
  webTint: true,
  // 편집창을 아래로 스크롤하면 탭 줄을 접고 문서 제목만 작게 남긴다 (사파리식)
  miniBar: true,
  // Obsidian 팝업(대화상자·명령 팔레트·미리보기·알림 등): false = 메뉴만큼 비침, true = 꽉 채움
  popupOpaque: false,
  // 좌우 패널 뒤로 바탕화면이 흐리게 비치게 (Windows 11 아크릴, 사용자 요청)
  sideAcrylic: false,
  // 굴절(가장자리에서 뒤 배경이 휘어 보이는 효과)
  refraction: true,
  // 토글·슬라이더 색: "green" = iOS 색(토글 초록, 슬라이더 파랑), "accent" = 둘 다 Obsidian 강조색
  toggleColor: "green",
  // 유리 틴트: "none" = 투명, "accent" = Obsidian 강조색, "obsidian" = Obsidian 기본 보라, "custom" = tintColor
  tint: "none",
  tintColor: "#ffffff",
  // 틴트 세기 1~10 단계 (10 = 색 40%)
  tintLevel: 5,
  // 틴트 때 유리 안 기호·글자를 흰색으로 (라이트 모드용. 다크 모드는 원래 흰색)
  tintWhiteInk: false,
  // 할 일 체크박스: 모양 "check" = 색 원에 체크가 뚫린 모양, "ring" = 테두리 원 안에 띄운 작은 원
  taskStyle: "check",
  // 체크박스 색: "yellow" = 노랑, "accent" = Obsidian 강조색, "custom" = taskColorCustom
  taskColor: "accent",
  taskColorCustom: "#fac800",
  // 파일 탐색기 폴더 기호 색: "blue" = 테마 기본 파랑, "accent" = Obsidian 강조색, "custom" = folderColorCustom
  folderColor: "blue",
  folderColorCustom: "#5fb0eb",
  // 창 제어 버튼(최소화·최대화·닫기)을 평소엔 작은 점으로, 올리면 제 크기로 (Windows·Linux)
  compactWindowControls: true,
  // 패널 탭 전환 효과: "lens" = 렌즈가 옮겨 간다, "none" = 효과 없이 선택한 탭이 강조색 알약,
  // "list" = 탭을 한 줄에 하나씩 세로로 늘어놓는다(tabListSides 의 패널만, 나머지 패널은 렌즈)
  tabAnim: "lens",
  // 목록 방식을 쓸 패널: "left" | "right" | "both"
  tabListSides: "both",
  // 패널 탭 알약을 좌우 끝까지 넓게 (맨 위 묶음은 한 줄 내려서)
  tabWide: true,
  // 패널 탭 기호 오른쪽에 이름 (탭이 하나뿐이면 설정과 상관없이 붙는다)
  tabNames: true,
  // 제목(h1~h6) 밑 가로줄 (CSS: body.lg-hrule)
  headingRule: false,
  // 파일 탐색기 줄무늬
  fileStripes: false,
  // 파일 탐색기 들여쓰기 세로줄 (끄면 CSS: body.lg-no-guides)
  fileGuides: true,
  // 파일 탐색기 기호: "none" = 없음, "finder" = 테마의 입체 폴더·문서 기호, "line" = Obsidian 닫힌 폴더 기호(폴더만)
  fileIcons: "finder",
  // 모바일 파일 탐색기 줄 위아래 간격 좁게 (CSS: body.lg-nav-compact)
  navCompact: false
};
var OLD_DEVICE_KEYS = ["liquid-glass-device-only", "liquid-glass-device-settings"];
var OBSIDIAN_PURPLE = "hsl(258 88% 66%)";
var migrateGlassLevel = function(o) {
  if (o.glassLevel == null && typeof o.frostLevel === "number") {
    o.glassLevel = Math.min(10, 5 + Math.max(0, Math.round(o.frostLevel)));
  }
  delete o.frostLevel;
};

// src/constants.ts
var HOVER_ICON = ".clickable-icon:not(.lg-tab-menu):not(.workspace-tab-header-inner-close-button), .bases-toolbar .bases-toolbar-item > .text-icon-button, .bases-kanban-column-footer > .text-icon-button";
var HOVER_GLASS = [
  ".clickable-icon:not(.lg-tab-menu):not(.workspace-tab-header-inner-close-button)",
  ".workspace-drawer-vault-switcher",
  ".bases-toolbar .bases-toolbar-item > .text-icon-button",
  ".bases-kanban-column-footer > .text-icon-button",
  ".mod-left-split .workspace-tab-header",
  ".mod-right-split .workspace-tab-header",
  ".titlebar-button-container.mod-right .titlebar-button",
  "input.task-list-item-checkbox"
].join(", ");
var PRESS_POP = [
  ".mod-root .workspace-tab-header-new-tab .clickable-icon",
  ".mod-root .workspace-tab-header-tab-list .clickable-icon",
  ".sidebar-toggle-button .clickable-icon",
  ".view-actions > .clickable-icon",
  ".lg-nav-more",
  ".lg-nav-rest > .clickable-icon",
  ".lg-panel-toggle",
  ".lg-tab-mode",
  ".lg-rib-menu",
  ".workspace-drawer-vault-actions .clickable-icon",
  ".graph-controls.is-close .graph-controls-button",
  // Bases 칸반 목록 아래 추가 버튼 (사용자 요청, 유리가 ::after 라 같은 효과가 그대로 걸린다)
  ".bases-kanban-column-footer > .text-icon-button"
].join(", ");
var MORPH_DASH = 30;
var BASES_MENU_BTN = ":is(.bases-toolbar-views-menu, .bases-toolbar-result-count, .bases-toolbar-sort-menu, .bases-toolbar-group-menu, .bases-toolbar-filter-menu, .bases-toolbar-properties-menu) > .text-icon-button";
var PRESS_DELAY_MS = 90;
var HOLD_RETURN_MS = 260;
var HOLD_EASE_SPAN = 0.14;
var PRESS_SLOP = 10;
var MORPH_OVERSHOOT = 5;
var MORPH_NUDGE = 3;
var MENU_DROP = 6;
var NAV_SEARCH_MAX = 240;
var NAV_SEARCH_MIN = 120;
var EASE = {
  move: "cubic-bezier(0.65, 0, 0.35, 1)",
  settle: "cubic-bezier(0.3, 0, 0.2, 1)",
  pop: "cubic-bezier(0.3, 1.3, 0.5, 1)",
  exit: "cubic-bezier(0.4, 0, 1, 1)",
  burst: "cubic-bezier(0.2, 0.7, 0.3, 1)",
  ret: "cubic-bezier(0.45, 0, 0.35, 1)",
  press: "cubic-bezier(0.3, 0, 0.3, 1)"
};
var STRIPE_FOLLOW_MS = 400;
var DRAG_SCROLL_ZONE = 48;
var DRAG_SCROLL_MAX = 14;
var TASK_PRESS_MS = 260;
var MENU_MOVE_MS = 320;
var PANEL_TOGGLES = ".sidebar-toggle-button .clickable-icon, .lg-panel-toggle";
var RIPPLE_K = 6;
var RIPPLE_HOLD = 0.6;
var MENU_RIPPLE_FROM = 0.5;
var TAB_RIPPLE_K = 16;
var PRESS_RIPPLE = [
  ".lg-kb-group .clickable-icon",
  ".lg-tab-tools .clickable-icon",
  ".lg-tab-nav .clickable-icon",
  ".lg-nav-run .clickable-icon",
  ".lg-path-pill .clickable-icon",
  ".side-dock-actions .side-dock-ribbon-action",
  ".side-dock-settings .side-dock-ribbon-action",
  ".titlebar-button-container.mod-right .titlebar-button"
].join(", ");
var PRESS_PILL = ".lg-kb-group, .lg-tab-tools, .lg-tab-nav, .lg-nav-run, .lg-path-pill, .side-dock-actions, .side-dock-settings, .workspace-tab-header-container-inner, .titlebar-button-container.mod-right, .workspace-drawer-vault-switcher";
var PRESS_GROUP = ".lg-kb-group, .lg-tab-tools, .lg-tab-nav, .lg-nav-run, .lg-path-pill";
var GROUP_PRESS_K = 0.5;
var PRESS_SCALE = [
  ".lg-kb-group .clickable-icon",
  ".lg-tab-tools .clickable-icon",
  ".lg-tab-nav .clickable-icon",
  ".lg-nav-run .clickable-icon",
  ".lg-path-pill .clickable-icon",
  ".side-dock-actions .side-dock-ribbon-action",
  ".side-dock-settings .side-dock-ribbon-action",
  ".titlebar-button-container.mod-right .titlebar-button",
  ".mod-left-split .workspace-tab-header-container .workspace-tab-header",
  ".mod-right-split .workspace-tab-header-container .workspace-tab-header",
  ".workspace-drawer-vault-switcher"
].join(", ");
var MOBILE_PRESS_POP = [
  ".sidebar-toggle-button.mod-raised",
  ".workspace-drawer-header-icon.mod-raised",
  ".modal-close-button.mod-raised",
  ".modal-header-button.mod-raised",
  ".modal-setting-back-button.mod-raised",
  ".mobile-toolbar-floating-options",
  ".mobile-tab-switcher-menu-spacer > .clickable-icon"
].join(", ");
var MOBILE_PRESS_PILL = ".is-floating-nav .mobile-navbar.mod-raised, .view-header .view-actions.mod-raised, .mobile-toolbar-options-list-container.mod-raised, .workspace-drawer-tab-options-list, .mobile-tab-switcher-menu-button";
var MOBILE_PRESS_BTN = ".clickable-icon, button, .mobile-navbar-action, .mobile-toolbar-option, .workspace-tab-header, .mobile-tab-switcher-menu-button";
var MENU_POP = 4;
var MINI_TOP = 40;
var MINI_STEP = 24;
var MINI_HOLD = 400;
var MINI_MS = 280;
var MINI_EASE = "cubic-bezier(0.2, 0.8, 0.2, 1)";
var MINI_PULL = 0.3;
var KB_GROUP_ICONS = ["lucide-plus-circle", "lucide-archive", "lucide-file-text"];
var KB_LANE_MS = 300;
var KB_PILL_DOT = 1;
var KB_DASH_MS = 300;

// src/refract.ts
var import_obsidian2 = require("obsidian");
var REFRACT_TARGETS = [
  [".lg-nav-more, .lg-nav-rest > .clickable-icon, .lg-panel-toggle, .lg-tab-mode, .lg-rib-menu", 32],
  [".mod-root .workspace-tab-header-new-tab .clickable-icon, .mod-root .workspace-tab-header-tab-list .clickable-icon", 32],
  [".sidebar-toggle-button .clickable-icon, .workspace-drawer-vault-actions .clickable-icon", 32],
  [".graph-controls.is-close .graph-controls-button", 32],
  [".lg-tab-nav, .lg-nav-run, .lg-path-pill, .side-dock-actions, .workspace-drawer-vault-switcher, .status-bar, .lg-kb-group, .lg-tab-tools", 26],
  [".mod-left-split .workspace-tab-header-container-inner, .mod-right-split .workspace-tab-header-container-inner", 26],
  [".mod-root .workspace-tab-header-container .workspace-tab-header.is-active", 23],
  [".titlebar-button-container.mod-right", 26],
  // Bases 툴바 버튼: 알약은 다른 알약, 기호만 있는 원은 다른 원 버튼과 같은 세기 (사용자 지적: 알약과 값이 달랐다)
  [".bases-toolbar .bases-toolbar-item:not(.bases-toolbar-search, .bases-toolbar-new-item-menu) > .text-icon-button", 26],
  // Bases 칸반 목록 아래 추가 버튼도 툴바 원형 버튼과 같다 (사용자 요청)
  [".bases-toolbar :is(.bases-toolbar-search, .bases-toolbar-new-item-menu) > .text-icon-button, .bases-kanban-column-footer > .text-icon-button", 32]
];
var REFRACT_TARGETS_MOBILE = [
  [".mobile-navbar.mod-raised, .view-header .view-actions.mod-raised, .mobile-toolbar-options-list-container.mod-raised", 26],
  [".workspace-drawer-tab-options-list", 26],
  [".view-header .sidebar-toggle-button.mod-raised, .workspace-drawer-header-icon.mod-raised, .modal-close-button.mod-raised, .modal-header-button.mod-raised", 32]
];
var CAN_REFRACT = !import_obsidian2.Platform.isIosApp;
var REFRACT_SPREAD = 0.6;
var BEZEL_RATIO = import_obsidian2.Platform.isMobile ? 0.84 : 0.8;
var BEZEL_MAX = import_obsidian2.Platform.isMobile ? 24 : 14;
var HOVER_REFRACT = { strength: 6, bezel: 0.5, spread: REFRACT_SPREAD, bezelMax: BEZEL_MAX };
var LENS_MINIFY = 1.2;
var LENS_MINIFY_FLAT = 0.7;
var LENS_MINIFY_EDGE = 0.5;
var pillT = function(px, py, ax, ay, rxr) {
  const b = ay;
  const rx = Math.min(rxr * 2 * ay, ax);
  const s = b / rx;
  const X = Math.abs(px) * s;
  const C = (ax - rx) * s;
  const Y = Math.abs(py);
  if (C <= 1e-9) return Math.hypot(px / ax, py / ay);
  const t1 = Y / b;
  if (X <= C * t1) return t1;
  const A = C * C - b * b, B = -2 * X * C, K = X * X + Y * Y;
  if (Math.abs(A) < 1e-9) return K / (2 * X * C);
  const d = Math.sqrt(Math.max(0, B * B - 4 * A * K));
  const r = [(-B - d) / (2 * A), (-B + d) / (2 * A)].filter((v) => v > 0 && X >= C * v - 1e-9).sort((p, q) => p - q);
  return r.length ? r[0] : Math.hypot(px / ax, py / ay);
};
var LENS_DEFAULT = { minify: LENS_MINIFY, flat: LENS_MINIFY_FLAT, edge: LENS_MINIFY_EDGE, reach: 1, shape: 1 };
var LENS_TOGGLE = { minify: 1.2, flat: 0.9, edge: 0.1, reach: 0.86, shape: 1 };
var LENS_SLIDER = { minify: 1, flat: 0.9, edge: 0.2, reach: 0.55, shape: 1 };
var MAP_CACHE = 200;
var WARM_MAX = 40;
var LENS_SHADE = 0.04;
var LENS_TAB = { minify: 1.2, flat: 0.94, edge: 2, reach: 1.1, shape: 1, line: true, box: true };
var LENS_TAB_PC = { ...LENS_TAB, minify: 1.3 };
var LENS_TAB_TEXT = { minify: 1, flat: 0.6, edge: 0.2, reach: 0.9, shape: 1 };
var PRESS_WHITE = "color(srgb 1 1 1)";
var PRESS_IMG = "var(--lg-cres-img), none";
var Refractor = class {
  constructor() {
    this.enabled = false;
    this.paused = false;
    this.held = null;
    this.warm = [];
    this.warmIO = null;
    this.warmTimer = 0;
    this.stores = /* @__PURE__ */ new Map();
    this.maps = /* @__PURE__ */ new Map();
    this.resizeObs = new ResizeObserver((entries) => {
      for (const e of entries) {
        const el = e.target;
        if (!el.lgRefract) continue;
        window.clearTimeout(el.lgRfTimer);
        el.lgRfTimer = window.setTimeout(() => el.lgRefract && this.update(el), 150);
      }
    });
    this.tracked = /* @__PURE__ */ new Set();
  }
  setEnabled(on) {
    this.enabled = on;
    if (!on) {
      this.tracked.forEach((el) => {
        el.style.removeProperty("--lg-refract");
        this.resizeObs.unobserve(el);
        delete el.lgRefract;
      });
      this.tracked.clear();
    }
  }
  // 휴대폰 메뉴 시트·서랍이 보이는 동안 굴절을 멈춘다: 시트·서랍이 움직이는 동안 그 위아래 유리의 굴절 필터(SVG 변위)가
  // 매 프레임 다시 계산돼 끊겼다 (사용자 지적, 휴대폰 녹화 측정: 움직이는 동안 프레임 간격 평균 약 32ms → 굴절을 끄면 약 21ms,
  // 같은 크기의 빈 시트를 올릴 때와 같다). 시트와 어둡게 덮는 층 아래라 굴절이 빠져도 거의 보이지 않는다.
  // 뗀 값은 그대로 들고 있다가 되붙인다: 되붙일 때 다시 재면(update) 요소마다 폭을 읽고 쓰기를 번갈아 해 레이아웃을 여러 번 다시 했다.
  // 값이 없는 요소는 건드리지 않는다(걸 때마다 그 아래 요소 전체의 스타일을 다시 계산한다)
  setPaused(on) {
    if (this.paused === on) return;
    this.paused = on;
    if (on) {
      this.held = /* @__PURE__ */ new Map();
      this.tracked.forEach((el) => {
        const v = el.style.getPropertyValue("--lg-refract");
        if (!v) return;
        this.held.set(el, v);
        el.style.removeProperty("--lg-refract");
      });
    } else {
      const held = this.held || /* @__PURE__ */ new Map();
      this.held = null;
      this.tracked.forEach((el) => {
        if (!el.isConnected || !el.lgRefract) return;
        const v = held.get(el);
        const stale = el.lgRfStale;
        el.lgRfStale = false;
        if (v && !stale && el.ownerDocument.getElementById(v.slice(5, -1))) el.style.setProperty("--lg-refract", v);
        else this.update(el);
      });
    }
  }
  // 휴대폰에서 서랍을 처음 열 때 서랍 안 유리의 지도를 그 자리에서 굽느라 끊겼다 (사용자 지적, 휴대폰을 새로 켠 뒤 측정: 첫 열기에 지도 굽기 약 45ms).
  // 그 지도들의 크기·값을 기억해 두었다가(최근 WARM_MAX 개) 다음에 켤 때 화면이 준비된 뒤 쉬는 틈에 굽는다. 쓰는 곳은 그대로 filterFor 가 캐시에서 찾는다
  noteWarm(sig) {
    if (!this.warmIO) return;
    const i = this.warm.indexOf(sig);
    if (i >= 0) this.warm.splice(i, 1);
    this.warm.push(sig);
    if (this.warm.length > WARM_MAX) this.warm.shift();
    window.clearTimeout(this.warmTimer);
    this.warmTimer = window.setTimeout(() => this.warmIO && this.warmIO.save(this.warm), 2e3);
  }
  warmUp() {
    if (!this.warmIO || !this.enabled) return;
    const v = this.warmIO.load();
    const list = Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
    this.warm = list.slice(-WARM_MAX);
    const todo = [...this.warm];
    const idle = (fn) => window.requestIdleCallback ? window.requestIdleCallback(fn, { timeout: 3e3 }) : window.setTimeout(fn, 50);
    const next = () => idle((dl) => {
      while (todo.length && (!dl || dl.timeRemaining() > 8)) {
        const [w, h, bezel, spread, bezelMax] = todo.shift().split("|").map(Number);
        if (!(w >= 4 && h >= 4)) continue;
        const mapKey = `${w}x${h}-b${Math.round(bezel * 100)}-s${Math.round(spread * 100)}-m${Math.round(bezelMax * 10)}`;
        if (this.maps.has(mapKey)) continue;
        try {
          this.maps.set(mapKey, { url: this.bakeMap(w, h, false, bezel, spread, bezelMax) });
        } catch (err) {
          console.error("[glass-shelf] warm", err);
          return;
        }
        if (this.maps.size > MAP_CACHE) this.maps.delete(this.maps.keys().next().value);
      }
      if (todo.length && this.enabled) next();
    });
    next();
  }
  // 문서에서 떨어진 요소는 감시를 끊고 목록에서 뺀다 (닫힌 탭 헤더 등)
  prune() {
    for (const el of this.tracked) {
      if (el.isConnected) continue;
      window.clearTimeout(el.lgRfTimer);
      this.resizeObs.unobserve(el);
      this.tracked.delete(el);
    }
  }
  destroy() {
    this.setEnabled(false);
    this.resizeObs.disconnect();
    this.stores.forEach((st) => st.svg.remove());
    this.stores.clear();
  }
  store(doc) {
    let st = this.stores.get(doc);
    if (st && st.svg.isConnected) return st;
    const svg = doc.createElementNS(SVG_NS, "svg");
    svg.setAttribute("class", "lg-svg-defs " + INJECTED);
    svg.setAttribute("color-interpolation-filters", "sRGB");
    const defs = doc.createElementNS(SVG_NS, "defs");
    svg.appendChild(defs);
    doc.body.appendChild(svg);
    st = { svg, defs, filters: /* @__PURE__ */ new Map() };
    this.stores.set(doc, st);
    return st;
  }
  // strength: 휘는 세기(px), chroma: 색수차 여부, w/h를 주면 그 크기로 고정
  // outward: true면 탭 렌즈·토글 렌즈용 축소 렌즈(가운데는 작게, 테두리로 갈수록 크게, bakeLensMap),
  // false면 가장자리에서 안쪽 내용을 끌어와 가장자리가 부풀어 보인다(bakeMap)
  attach(el, strength, chroma, w, h, outward, look) {
    if (!this.enabled) return;
    const o = el.lgRefract;
    const cur = el.style.getPropertyValue("--lg-refract").match(/url\(#([^)]+)\)/);
    if (o && cur && this.tracked.has(el) && o.strength === strength && o.chroma === chroma && o.w === w && o.h === h && o.outward === !!outward && o.look === look && el.ownerDocument.getElementById(cur[1])) return;
    el.lgRefract = { strength, chroma, w, h, outward: !!outward, look };
    if (!this.tracked.has(el)) {
      this.tracked.add(el);
      if (!w) this.resizeObs.observe(el);
    }
    this.update(el);
  }
  update(el) {
    if (this.paused) {
      el.lgRfStale = true;
      return;
    }
    if (!el.isConnected) {
      this.tracked.delete(el);
      this.resizeObs.unobserve(el);
      return;
    }
    const o = el.lgRefract;
    const w = o.w || Math.round(el.offsetWidth);
    const h = o.h || Math.round(el.offsetHeight);
    if (w < 4 || h < 4) return;
    const id = this.filterFor(w, h, o.strength, o.chroma, o.outward, el.ownerDocument, o.look ? o.look.bezel : BEZEL_RATIO, o.look ? o.look.spread : REFRACT_SPREAD, o.look && o.look.lens);
    const v = `url(#${id})`;
    if (el.style.getPropertyValue("--lg-refract") !== v) el.style.setProperty("--lg-refract", v);
  }
  // bezel: 굴절이 일어나는 가장자리 폭 (반지름 대비 비율)
  // 지도가 없는 곳은 무변위(회색 128) 바탕으로 채워, 필터 결과에 투명한 곳이 생기지 않게 한다 (안전장치)
  // bezel 을 주지 않으면 기본 비율 (데스크톱 0.6, 모바일은 버튼이 커서 가장자리를 더 넓게 0.75)
  // shadeTag: 탭 렌즈만. 주면 렌즈 안에서 탭 줄 알약 밖(패널 바탕)에서 끌려온 픽셀만 LENS_SHADE 만큼 어둡게 하는 필터를 렌즈마다 따로 만든다.
  // 알약 모양 그림(feImage, 자리는 shadeAt 이 매 프레임 옮긴다)을 렌즈와 같은 지도로 휘게 해, 굴절된 픽셀이 어디서 왔는지 안다
  filterFor(w, h, strength, chroma, outward, doc = document, bezel = BEZEL_RATIO, spread = REFRACT_SPREAD, lens = LENS_DEFAULT, bezelMax = BEZEL_MAX, shadeTag = "") {
    const bz = Math.round(bezel * 100);
    const sp = Math.round(spread * 100);
    const lensTag = lens === LENS_DEFAULT ? "lens" : `lens-${[lens.minify, lens.flat, lens.edge, lens.reach, lens.shape || 2].join("-").replace(/\./g, "p")}${lens.line ? "-ln" : ""}${lens.box ? "-bx" : ""}`;
    const bm = Math.round(bezelMax * 10);
    const shade = outward && !chroma && shadeTag ? shadeTag : "";
    const mapKey = outward ? `${w}x${h}-${lensTag}` : `${w}x${h}-b${bz}-s${sp}-m${bm}`;
    let baked = this.maps.get(mapKey);
    if (baked) this.maps.delete(mapKey);
    else {
      baked = outward ? this.bakeLensMap(w, h, lens) : { url: this.bakeMap(w, h, false, bezel, spread, bezelMax) };
      if (!outward) this.noteWarm(`${w}|${h}|${bezel}|${spread}|${bezelMax}`);
    }
    this.maps.set(mapKey, baked);
    if (this.maps.size > MAP_CACHE) this.maps.delete(this.maps.keys().next().value);
    const map = baked.url;
    if (outward) strength = baked.scale;
    const key = outward ? `lg-rf-${w}x${h}-${lensTag}${shade ? `-sh${shade}` : ""}` : `lg-rf-${w}x${h}-${String(strength).replace(/\./g, "p")}${chroma ? "c" : ""}-b${bz}-s${sp}-m${bm}`;
    const st = this.store(doc);
    if (st.filters.has(key)) return key;
    const f = doc.createElementNS(SVG_NS, "filter");
    f.setAttribute("id", key);
    f.setAttribute("x", "0");
    f.setAttribute("y", "0");
    f.setAttribute("width", String(w));
    f.setAttribute("height", String(h));
    f.setAttribute("filterUnits", "userSpaceOnUse");
    f.setAttribute("color-interpolation-filters", "sRGB");
    const flood = doc.createElementNS(SVG_NS, "feFlood");
    flood.setAttribute("flood-color", "rgb(128,128,128)");
    flood.setAttribute("flood-opacity", "1");
    flood.setAttribute("result", "neutral");
    f.appendChild(flood);
    const img = doc.createElementNS(SVG_NS, "feImage");
    img.setAttribute("href", map);
    img.setAttribute("x", "0");
    img.setAttribute("y", "0");
    img.setAttribute("width", String(w));
    img.setAttribute("height", String(h));
    img.setAttribute("preserveAspectRatio", "none");
    img.setAttribute("result", "mapimg");
    f.appendChild(img);
    const comp = doc.createElementNS(SVG_NS, "feComposite");
    comp.setAttribute("in", "mapimg");
    comp.setAttribute("in2", "neutral");
    comp.setAttribute("operator", "over");
    comp.setAttribute("result", "map");
    f.appendChild(comp);
    const disp = (scale, result) => {
      const d = doc.createElementNS(SVG_NS, "feDisplacementMap");
      d.setAttribute("in", "SourceGraphic");
      d.setAttribute("in2", "map");
      d.setAttribute("scale", String(scale));
      d.setAttribute("xChannelSelector", "R");
      d.setAttribute("yChannelSelector", "G");
      d.setAttribute("result", result);
      f.appendChild(d);
    };
    const keep = (input, row, result) => {
      const m = doc.createElementNS(SVG_NS, "feColorMatrix");
      m.setAttribute("in", input);
      m.setAttribute("type", "matrix");
      const rows = ["0 0 0 0 0", "0 0 0 0 0", "0 0 0 0 0"];
      rows[row] = ["1 0 0 0 0", "0 1 0 0 0", "0 0 1 0 0"][row];
      m.setAttribute("values", `${rows.join(" ")} 0 0 0 1 0`);
      m.setAttribute("result", result);
      f.appendChild(m);
    };
    const blend = (a, b, result) => {
      const bl = doc.createElementNS(SVG_NS, "feBlend");
      bl.setAttribute("in", a);
      bl.setAttribute("in2", b);
      bl.setAttribute("mode", "screen");
      if (result) bl.setAttribute("result", result);
      f.appendChild(bl);
    };
    if (chroma) {
      disp(strength, "dr");
      disp(strength * 1.02, "dg");
      disp(strength * 1.04, "db");
      keep("dr", 0, "r");
      keep("dg", 1, "g");
      keep("db", 2, "b");
      blend("r", "g", "rg");
      blend("rg", "b");
    } else if (shade) {
      disp(strength, "out");
      const ci = doc.createElementNS(SVG_NS, "feImage");
      ci.setAttribute("x", "0");
      ci.setAttribute("y", "0");
      ci.setAttribute("width", String(w));
      ci.setAttribute("height", String(h));
      ci.setAttribute("preserveAspectRatio", "none");
      ci.setAttribute("result", "cimg");
      ci.setAttribute("data-lg-shade", "1");
      f.appendChild(ci);
      const cd = doc.createElementNS(SVG_NS, "feDisplacementMap");
      cd.setAttribute("in", "cimg");
      cd.setAttribute("in2", "map");
      cd.setAttribute("scale", String(strength));
      cd.setAttribute("xChannelSelector", "R");
      cd.setAttribute("yChannelSelector", "G");
      cd.setAttribute("result", "cmask0");
      f.appendChild(cd);
      const cb = doc.createElementNS(SVG_NS, "feGaussianBlur");
      cb.setAttribute("in", "cmask0");
      cb.setAttribute("stdDeviation", "0.7");
      cb.setAttribute("result", "cmask");
      f.appendChild(cb);
      const m = doc.createElementNS(SVG_NS, "feColorMatrix");
      m.setAttribute("in", "cmask");
      m.setAttribute("type", "matrix");
      m.setAttribute("values", "0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0 0 1");
      m.setAttribute("result", "shade");
      f.appendChild(m);
      const c = doc.createElementNS(SVG_NS, "feComposite");
      c.setAttribute("in", "out");
      c.setAttribute("in2", "shade");
      c.setAttribute("operator", "arithmetic");
      c.setAttribute("k1", String(LENS_SHADE));
      c.setAttribute("k2", String(1 - LENS_SHADE));
      c.setAttribute("k3", "0");
      c.setAttribute("k4", "0");
      f.appendChild(c);
    } else {
      disp(strength, "out");
    }
    st.defs.appendChild(f);
    st.filters.set(key, f);
    if (st.filters.size > 80) this.pruneFilters(doc, st, key);
    return key;
  }
  // 렌즈 그늘 필터의 알약 모양 그림을 지금 자리로 (렌즈 좌표). 같은 값이면 쓰지 않는다 (쓰면 필터를 다시 계산한다)
  shadeAt(doc, id, x, y, w, h, rx) {
    const f = this.store(doc).filters.get(id);
    const ci = f && f.querySelector('[data-lg-shade="1"]');
    if (!ci) return;
    const W = Math.max(1, Math.round(w)), H = Math.max(1, Math.round(h));
    const R = Math.min(W / 2, Math.round(rx)), Ry = H / 2;
    const href = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="${W}" height="${H}" rx="${R}" ry="${Ry}" fill="#fff"/></svg>`)}`;
    const set = (k, v) => {
      if (ci.getAttribute(k) !== v) ci.setAttribute(k, v);
    };
    set("href", href);
    set("x", x.toFixed(1));
    set("y", y.toFixed(1));
    set("width", String(W));
    set("height", String(H));
  }
  // 필터가 많이 쌓이면 지금 어떤 요소도 쓰지 않는 것을 지운다
  pruneFilters(doc, st, keep) {
    const inUse = /* @__PURE__ */ new Set([keep]);
    doc.querySelectorAll('[style*="lg-rf-"]').forEach((el) => {
      const m = (el.getAttribute("style") || "").match(/lg-rf-[^)\s;]+/g);
      if (m) m.forEach((id) => inUse.add(id));
    });
    for (const [id, node] of st.filters) {
      if (inUse.has(id)) continue;
      node.remove();
      st.filters.delete(id);
    }
  }
  bakeMap(w, h, outward, bezelRatio = BEZEL_RATIO, spread = REFRACT_SPREAD, bezelMax = BEZEL_MAX) {
    const cv = createEl("canvas");
    cv.width = w;
    cv.height = h;
    const ctx = cv.getContext("2d");
    const img = ctx.createImageData(w, h);
    const d = img.data;
    const r = Math.min(w, h) / 2;
    const bezel = Math.max(3, Math.min(r * bezelRatio, bezelMax));
    const n = 1.5;
    const bend = (t) => {
      const u = 1 - t;
      const slope = Math.pow(u, 3) / Math.pow(Math.max(1e-4, 1 - Math.pow(u, 4)), 0.75);
      const th1 = Math.atan(slope);
      const th2 = Math.asin(Math.sin(th1) / n);
      return Math.tan(th1 - th2);
    };
    let maxBend = 0;
    for (let i = 1; i <= 64; i++) maxBend = Math.max(maxBend, bend(i / 64));
    const hx = w / 2 - r;
    const hy = h / 2 - r;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const px = x + 0.5 - w / 2;
        const py = y + 0.5 - h / 2;
        const qx = Math.abs(px) - hx;
        const qy = Math.abs(py) - hy;
        const ox = Math.max(qx, 0);
        const oy = Math.max(qy, 0);
        const dist = Math.hypot(ox, oy) + Math.min(Math.max(qx, qy), 0) - r;
        const inside = -dist;
        let dx = 0, dy = 0;
        if (inside > 0 && inside < bezel) {
          let nx, ny;
          if (qx > 0 && qy > 0) {
            const l = Math.hypot(ox, oy) || 1;
            nx = ox / l * Math.sign(px);
            ny = oy / l * Math.sign(py);
          } else if (qx > qy) {
            nx = Math.sign(px);
            ny = 0;
          } else {
            nx = 0;
            ny = Math.sign(py);
          }
          const mag = Math.pow(Math.min(1, bend(Math.max(0.02, inside / bezel)) / maxBend), spread);
          const dir = outward ? 1 : -1;
          dx = Math.max(-1, Math.min(1, dir * nx * mag * 1.5));
          dy = dir * ny * mag;
        }
        const i = (y * w + x) * 4;
        d[i] = Math.round(128 + dx * 127);
        d[i + 1] = Math.round(128 + dy * 127);
        d[i + 2] = 128;
        d[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    return cv.toDataURL();
  }
  // 축소 렌즈 지도 (탭 렌즈·토글 렌즈). 렌즈 크기의 타원 좌표로 중심에서의 거리 t(0 = 중심, 1 = 테두리)를 잰다.
  // 읽어 오는 자리를 중심 반대쪽으로 (중심에서의 위치) × f(t)/t 만큼 민다:
  // - t ≤ T(LENS_MINIFY_FLAT): f = (M − 1)·t → 평평하게 M 배 작게
  // - T < t ≤ 1: 에르미트 곡선으로 f 가 0 이 된다. T 에서 기울기가 이어지고, 테두리 끝 기울기는 E − 1 → 1/E 배 크게.
  // 띠가 얇아 읽는 자리(t + f)가 뒤로 되돌아가는 곳이 생기면, 테두리 쪽부터 거꾸로 훑으며 그 자리를 뒤쪽 값으로 눌러
  // 늘 앞으로만 가게 한다 (되감기 대신 아주 좁게 늘어나는 곳이 생긴다. 같은 그림이 여러 번 보이지 않는다).
  // 타원 밖(알약 모서리)은 밀지 않는다
  // 반환: { url: 지도, scale: feDisplacementMap 세기(최대 밀림 × 2) }
  bakeLensMap(w, h, lens = LENS_DEFAULT) {
    const M = lens.minify;
    const T = lens.flat;
    const E = lens.edge;
    const R = lens.reach;
    const S = lens.shape || 2;
    if (this.rxr == null) this.rxr = parseFloat(getComputedStyle(document.body).getPropertyValue("--lg-pill-rx")) || 0.5;
    const RXR = this.rxr;
    const L = 1 - T;
    const f = (t) => {
      if (t <= T) return (M - 1) * t;
      const s = (t - T) / L;
      return (2 * s ** 3 - 3 * s ** 2 + 1) * (M - 1) * T + (s ** 3 - 2 * s ** 2 + s) * L * (M - 1) + (-2 * s ** 3 + 3 * s ** 2) * (R - 1) + (s ** 3 - s ** 2) * L * (E - 1);
    };
    const N = 1024;
    const pos = new Float32Array(N + 1);
    for (let i = 0; i <= N; i++) pos[i] = i / N + f(i / N);
    for (let i = N - 1; i >= 0; i--) pos[i] = Math.min(pos[i], pos[i + 1]);
    const ratio = (t) => {
      if (t <= T) return M - 1;
      const u = t * N;
      const i = Math.min(N - 1, Math.floor(u));
      const p = pos[i] + (pos[i + 1] - pos[i]) * (u - i);
      return (p - t) / t;
    };
    const ax = w / 2;
    const ay = h / 2;
    const ox = new Float32Array(w * h);
    const oy = new Float32Array(w * h);
    let max = 0;
    const C = Math.max(0, ax - ay);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const px = x + 0.5 - ax;
        const py = y + 0.5 - ay;
        const j = y * w + x;
        const qx = lens.line ? Math.max(-C, Math.min(C, px)) : 0;
        const t = lens.line ? Math.hypot(px - qx, py) / ay : S <= 1 ? pillT(px, py, ax, ay, RXR) : S === 2 ? Math.hypot(px / ax, py / ay) : (Math.abs(px / ax) ** S + Math.abs(py / ay) ** S) ** (1 / S);
        if (t >= 1 || t < 1e-6) continue;
        const k = ratio(t);
        ox[j] = (px - qx) * k;
        oy[j] = py * k;
        if (lens.box) {
          ox[j] = Math.max(0.5 - ax, Math.min(ax - 0.5, px + ox[j])) - px;
          oy[j] = Math.max(0.5 - ay, Math.min(ay - 0.5, py + oy[j])) - py;
        }
        max = Math.max(max, Math.abs(ox[j]), Math.abs(oy[j]));
      }
    }
    max = Math.max(max, 0.5);
    const cv = createEl("canvas");
    cv.width = w;
    cv.height = h;
    const ctx = cv.getContext("2d");
    const img = ctx.createImageData(w, h);
    const d = img.data;
    for (let j = 0; j < w * h; j++) {
      const i = j * 4;
      d[i] = Math.round(128 + ox[j] / max * 127);
      d[i + 1] = Math.round(128 + oy[j] / max * 127);
      d[i + 2] = 128;
      d[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    return { url: cv.toDataURL(), scale: +(max * 2).toFixed(2) };
  }
};

// src/settings-tab.ts
var import_obsidian4 = require("obsidian");

// src/color.ts
var lightCanvas = null;
var canvasOf = (doc) => {
  if (!lightCanvas) lightCanvas = newEl(doc || document, "canvas").getContext("2d", { willReadFrequently: true });
  if (!lightCanvas) throw new Error("canvas");
  return lightCanvas;
};
var colorDim = function(c, k, doc) {
  try {
    const ctx = canvasOf(doc);
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = "#000";
    ctx.fillStyle = c;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
    const f = (v) => Math.round(v * (1 - k));
    return `rgb(${f(r)}, ${f(g)}, ${f(b)})`;
  } catch {
    return c;
  }
};
var GLASS_MIX_LO = 0;
var GLASS_MIX_HI = 1;
var colorLightness = function(c, doc) {
  try {
    const ctx = canvasOf(doc);
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = "#000";
    ctx.fillStyle = c;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
    const lin = (v) => (v /= 255) <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    const R = lin(r), G = lin(g), B = lin(b);
    const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B);
    const mm = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B);
    const s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B);
    return 0.2104542553 * l + 0.793617785 * mm - 0.0040720468 * s;
  } catch {
    return null;
  }
};
var resolveRgb = function(doc, value) {
  const el = newEl(doc, "div");
  el.style.color = value;
  el.hide();
  doc.body.appendChild(el);
  const c = (doc.defaultView || window).getComputedStyle(el).color;
  el.remove();
  let m = c.match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/);
  if (m) return [+m[1], +m[2], +m[3]];
  m = c.match(/color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)/);
  if (m) return [+m[1] * 255, +m[2] * 255, +m[3] * 255];
  return null;
};
var folderIconUrl = function(rgb) {
  const mix = (t, k) => "#" + rgb.map((v) => Math.round(v + (t - v) * k).toString(16).padStart(2, "0")).join("");
  const front = mix(0, 0);
  const top = mix(255, 0.22);
  const back = mix(0, 0.15);
  const shine = mix(255, 0.55);
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 17.6'><defs><linearGradient id='f' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='${top}'/><stop offset='1' stop-color='${front}'/></linearGradient></defs><path d='M1 2.6C1 1.7 1.7 1 2.6 1h4.3c.4 0 .8.2 1.1.5L9.3 2.8h8.1c.9 0 1.6.7 1.6 1.6v10.6c0 .9-.7 1.6-1.6 1.6H2.6C1.7 16.6 1 15.9 1 15z' fill='${back}'/><rect x='1' y='4.6' width='18' height='12' rx='1.5' fill='url(#f)'/><rect x='1.6' y='4.6' width='16.8' height='0.7' rx='0.35' fill='${shine}'/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
};
var FOLDER_PALETTE = [
  [tr("\uBE68\uAC15", "Red"), "#D85D4D"],
  [tr("\uC8FC\uD669", "Orange"), "#E4A367"],
  [tr("\uB178\uB791", "Yellow"), "#D6B86D"],
  [tr("\uC62C\uB9AC\uBE0C", "Olive"), "#969859"],
  [tr("\uCD08\uB85D", "Green"), "#5CA95F"],
  [tr("\uCCAD\uB85D", "Teal"), "#6AB9B0"],
  [tr("\uD30C\uB791", "Blue"), "#4981D0"],
  [tr("\uB0A8\uC0C9", "Indigo"), "#5D63AF"],
  [tr("\uBD84\uD64D", "Pink"), "#D95D8A"],
  [tr("\uBCF4\uB77C", "Purple"), "#9F6BBD"],
  [tr("\uD68C\uC0C9", "Gray"), "#84848F"]
];
var hexToRgb = function(hex) {
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex || "");
  return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : null;
};
var fileIconUrl = function(rgb) {
  const mix = (k) => "#" + rgb.map((v) => Math.round(v + (255 - v) * k).toString(16).padStart(2, "0")).join("");
  const edge = `rgb(${rgb.map((v) => Math.round(v * 0.6)).join(" ")} / 0.55)`;
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='-0.3 -0.3 14.6 17.6'><defs><linearGradient id='p' x1='0' y1='1' x2='1' y2='0'><stop offset='0' stop-color='${mix(0.8)}'/><stop offset='0.55' stop-color='${mix(0.62)}'/><stop offset='1' stop-color='${mix(0.2)}'/></linearGradient></defs><path d='M1.5 0h6.9L14 5.6v9.9c0 .8-.7 1.5-1.5 1.5h-11C.7 17 0 16.3 0 15.5v-14C0 .7.7 0 1.5 0z' fill='url(#p)' stroke='${edge}' stroke-width='0.5' stroke-linejoin='round'/><path d='M8.4 0v4.1c0 .8.7 1.5 1.5 1.5H14z' fill='${mix(0.72)}' stroke='${edge}' stroke-width='0.5' stroke-linejoin='round'/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
};

// src/folder-modal.ts
var import_obsidian3 = require("obsidian");
var ConfirmModal = class extends import_obsidian3.Modal {
  constructor(app, title, message, okText, onOk) {
    super(app);
    this.setTitle(title);
    this.contentEl.createEl("p", { text: message });
    const bar = this.modalEl.createDiv("modal-button-container");
    new import_obsidian3.ButtonComponent(bar).setButtonText(tr("\uCDE8\uC18C", "Cancel")).onClick(() => this.close());
    new import_obsidian3.ButtonComponent(bar).setButtonText(okText).setDestructive().setCta().onClick(() => {
      this.close();
      onOk();
    });
  }
};
var FolderColorModal = class extends import_obsidian3.Modal {
  constructor(app, folder, current, onPick, palette) {
    super(app);
    this.palette = palette || FOLDER_PALETTE;
    this.folder = folder;
    this.current = current ? current.toLowerCase() : null;
    this.onPick = onPick;
  }
  onOpen() {
    const { contentEl } = this;
    this.modalEl.addClass("lg-fc-modal");
    this.titleEl.setText(this.folder.name);
    const grid = contentEl.createDiv("lg-fc-grid");
    for (const [name, hex] of this.palette) {
      const sw = grid.createDiv("lg-fc-swatch");
      sw.style.backgroundColor = hex;
      (0, import_obsidian3.setTooltip)(sw, name);
      if (this.current === hex.toLowerCase()) sw.addClass("is-selected");
      sw.addEventListener("click", () => {
        this.close();
        this.onPick(hex);
      });
    }
    const custom = grid.createEl("label", { cls: "lg-fc-swatch lg-fc-custom" });
    (0, import_obsidian3.setTooltip)(custom, tr("\uC9C1\uC811 \uACE0\uB974\uAE30", "Pick a color"));
    const inPalette = this.palette.some(([, hex]) => hex.toLowerCase() === this.current);
    if (this.current && !inPalette) {
      custom.addClass("is-selected");
      custom.style.setProperty("--lg-fc-pick", this.current);
    }
    const input = custom.createEl("input", { type: "color" });
    input.value = this.current || "#007aff";
    input.addEventListener("change", () => {
      this.close();
      this.onPick(input.value.toUpperCase());
    });
    const clear = contentEl.createEl("button", { text: tr("\uC0C9 \uC9C0\uC6B0\uAE30", "Clear color"), cls: "lg-fc-clear" });
    clear.addEventListener("click", () => {
      this.close();
      this.onPick(null);
    });
  }
  onClose() {
    this.contentEl.empty();
  }
};

// src/settings-tab.ts
var OUR_CLS = ["lg-settings-sub", "lg-fc-row", "lg-fc-pal-row", "lg-fc-add-row", "lg-fc-dragging"];
var fresh = (s) => {
  s.settingEl.removeClass(...OUR_CLS);
  s.settingEl.querySelectorAll(".lg-fc-grip, .lg-fc-count").forEach((el) => el.remove());
  return s;
};
var GlassShelfSettingTab = class extends import_obsidian4.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    // 드롭다운 설정마다 이 기기에서 보여 주는 선택지
    this.options = /* @__PURE__ */ new Map();
    this.plugin = plugin;
    this.containerEl.addClass("lg-settings");
  }
  getControlValue(key) {
    if (key === "iosColors") return this.plugin.settings.toggleColor !== "accent";
    const v = super.getControlValue(key);
    const opts = this.options.get(key);
    if (opts && typeof v === "string" && !(v in opts)) return DEFAULTS[key];
    return v;
  }
  async setControlValue(key, value) {
    const pl = this.plugin;
    const s = pl.settings;
    if (key === "iosColors") s.toggleColor = value ? "green" : "accent";
    else s[key] = value;
    if (key === "miniBar" && !value) document.querySelectorAll(".workspace-tabs.lg-mini").forEach((el) => pl.setMini(el, false));
    if (key === "webTint") pl.webReset(value === true);
    await pl.saveSettings();
    if (key === "showPath") pl.reloadWebViews();
    if (key === "navCompact") pl.remeasureExplorers();
    if (key === "fileStripes") pl.requestFolderColors(true);
    if (key === "sideAcrylic" && value === true) pl.noticeSimpleTabs();
    if (key === "tint" || key === "taskColor" || key === "folderColor" || key === "tabAnim") this.update();
  }
  getSettingDefinitions() {
    const st = this.plugin.settings;
    const toggle = (key, name, desc, visible = true) => ({ name, desc, visible, control: { type: "toggle", key } });
    const dropdown = (key, name, desc, options) => {
      this.options.set(key, options);
      return { name, desc, control: { type: "dropdown", key, options } };
    };
    const sub = (name, desc, visible, fill) => ({
      name,
      desc,
      visible,
      render: (s) => fill(fresh(s).setClass("lg-settings-sub"))
    });
    const color = (key) => (s) => {
      s.addColorPicker((c) => c.setValue(st[key]).onChange((v) => void this.setControlValue(key, v)));
    };
    const defs = [
      {
        type: "group",
        heading: tr("\uC720\uB9AC", "Glass"),
        items: [
          {
            name: tr("\uC720\uB9AC \uD22C\uBA85\uB3C4", "Glass opacity"),
            desc: tr("\uC22B\uC790\uAC00 \uD074\uC218\uB85D \uC720\uB9AC\uAC00 \uB35C \uD22C\uBA85\uD574\uC9D1\uB2C8\uB2E4. 0\uC740 \uB9D1\uC740 \uC720\uB9AC\uC774\uACE0, 1~5\uB294 \uC720\uB9AC \uB4A4\uC758 \uB0B4\uC6A9\uC774 \uBC30\uACBD\uC0C9 \uCABD\uC73C\uB85C \uC810\uC810 \uC605\uC5B4\uC9C0\uBA70, 6~10\uC740 \uADF8 \uC704\uC5D0 \uC0C9\uC744 \uCC44\uC6CC \uC810\uC810 \uBFCC\uC607\uAC8C \uB9CC\uB4ED\uB2C8\uB2E4. \uBC84\uD2BC\uACFC \uD3B8\uC9D1\uCC3D \uC704\uCABD \uC720\uB9AC\uD310\uC5D0 \uC801\uC6A9\uB418\uBA70 \uBA54\uB274\uC640 \uD31D\uC5C5\uC740 \uC81C\uC678\uB429\uB2C8\uB2E4.", "Higher values make the glass less transparent. 0 is clear glass; 1\u20135 gradually fade what is behind the glass toward the background color; 6\u201310 add a fill on top that makes it increasingly frosted. Applies to buttons and the glass panel above the editor, not to menus and popups."),
            render: (s) => {
              fresh(s).addSlider((slider) => slider.setLimits(0, 10, 1).setValue(st.glassLevel).onChange((v) => void this.setControlValue("glassLevel", v))).addExtraButton(
                (btn) => btn.setIcon("rotate-ccw").setTooltip(tr("\uAE30\uBCF8\uAC12\uC73C\uB85C \uB418\uB3CC\uB9AC\uAE30", "Restore default")).onClick(() => void this.setControlValue("glassLevel", DEFAULTS.glassLevel).then(() => this.update()))
              );
            }
          },
          dropdown("tint", tr("\uD2F4\uD2B8", "Tint"), tr("\uC720\uB9AC\uC5D0 \uC605\uC740 \uC0C9\uC744 \uC785\uD799\uB2C8\uB2E4. \uBC84\uD2BC, \uD0ED, \uBA54\uB274, \uD31D\uC5C5\uC5D0 \uD568\uAED8 \uC801\uC6A9\uB429\uB2C8\uB2E4.", "Adds a light color to the glass. Applies to buttons, tabs, menus and popups."), {
            none: tr("\uC5C6\uC74C (\uD22C\uBA85)", "None (clear)"),
            accent: tr("\uAC15\uC870\uC0C9", "Accent color"),
            obsidian: tr("Obsidian \uBCF4\uB77C", "Obsidian purple"),
            custom: tr("\uC0C9\uC0C1 \uC9C0\uC815", "Custom color")
          }),
          sub(tr("\uD2F4\uD2B8 \uC0C9", "Tint color"), void 0, () => st.tint === "custom", color("tintColor")),
          sub(tr("\uD2F4\uD2B8 \uC138\uAE30", "Tint strength"), tr("1\uC740 \uC544\uC8FC \uC605\uAC8C, 10\uC740 \uAC00\uC7A5 \uC9C4\uD558\uAC8C \uC785\uD799\uB2C8\uB2E4.", "1 is very light, 10 is the strongest."), () => st.tint !== "none", (s) => {
            s.addSlider((slider) => slider.setLimits(1, 10, 1).setValue(st.tintLevel).onChange((v) => void this.setControlValue("tintLevel", v)));
          }),
          sub(
            tr("\uD770\uC0C9 \uAE00\uC790", "White text"),
            tr("\uC720\uB9AC \uC704\uC758 \uC544\uC774\uCF58\uACFC \uAE00\uC790\uB97C \uD770\uC0C9\uC73C\uB85C \uD45C\uC2DC\uD569\uB2C8\uB2E4. \uC9C4\uD55C \uD2F4\uD2B8\uC640 \uC798 \uC5B4\uC6B8\uB9BD\uB2C8\uB2E4. \uB2E4\uD06C \uBAA8\uB4DC\uC5D0\uC11C\uB294 \uC6D0\uB798 \uD770\uC0C9\uC774\uB77C \uCC28\uC774\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.", "Shows icons and text on glass in white. Works well with strong tints. No difference in dark mode, where they are already white."),
            () => st.tint !== "none",
            (s) => {
              s.addToggle((t) => t.setValue(!!st.tintWhiteInk).onChange((v) => void this.setControlValue("tintWhiteInk", v)));
            }
          ),
          toggle("popupOpaque", tr("\uBD88\uD22C\uBA85\uD55C \uD31D\uC5C5", "Opaque popups"), tr("\uB300\uD654\uC0C1\uC790, \uBA85\uB839 \uD314\uB808\uD2B8, \uB9C1\uD06C \uBBF8\uB9AC\uBCF4\uAE30, \uC54C\uB9BC, \uD234\uD301 \uAC19\uC740 \uD31D\uC5C5\uC758 \uBC30\uACBD\uC785\uB2C8\uB2E4. \uB044\uBA74 \uBA54\uB274\uCC98\uB7FC \uB4A4\uAC00 \uC0B4\uC9DD \uBE44\uCE58\uACE0, \uCF1C\uBA74 \uBD88\uD22C\uBA85\uD558\uAC8C \uCC44\uC6C1\uB2C8\uB2E4.", "Background of popups such as dialogs, the command palette, link previews, notices and tooltips. Off: slightly see-through like menus. On: filled opaque.")),
          toggle("sideAcrylic", tr("\uC88C\uC6B0 \uD328\uB110 \uD22C\uBA85", "See-through side panels"), tr("\uC88C\uC6B0 \uD328\uB110 \uB4A4\uB85C \uBC14\uD0D5\uD654\uBA74\uACFC \uB2E4\uB978 \uCC3D\uC774 \uD750\uB9AC\uAC8C \uBE44\uCE69\uB2C8\uB2E4. Windows 11 22H2 \uC774\uC0C1\uC5D0\uC11C \uB3D9\uC791\uD558\uACE0, Windows \uC124\uC815\uC758 \uD22C\uBA85 \uD6A8\uACFC\uAC00 \uCF1C\uC838 \uC788\uC5B4\uC57C \uD569\uB2C8\uB2E4. \uCF1C\uBA74 \uD0ED \uC804\uD658 \uD6A8\uACFC\uB294 \uB80C\uC988 \uB300\uC2E0 \uC2EC\uD50C\uB85C \uBCF4\uC785\uB2C8\uB2E4. (Windows)", "Your desktop and other windows show through the left and right panels, blurred. Works on Windows 11 22H2 or later with transparency effects turned on in Windows settings. When on, the tab switch effect is shown as Simple instead of Lens. (Windows)"), import_obsidian4.Platform.isWin && !import_obsidian4.Platform.isMobile),
          toggle("refraction", tr("\uAD74\uC808", "Refraction"), tr("\uC720\uB9AC \uAC00\uC7A5\uC790\uB9AC\uC5D0\uC11C \uB4A4 \uBC30\uACBD\uC774 \uB80C\uC988\uCC98\uB7FC \uD718\uC5B4 \uBCF4\uC785\uB2C8\uB2E4. \uD654\uBA74\uC774 \uB290\uB824\uC9C0\uBA74 \uAEBC \uC8FC\uC138\uC694. iOS\uC640 iPadOS\uC5D0\uC11C\uB294 \uC9C0\uC6D0\uB418\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.", "Bends the background at the glass edges like a lens. Turn off if the app feels slow. Not supported on iOS and iPadOS.")),
          toggle("hoverLarge", tr("\uD070 \uD638\uBC84 \uD6A8\uACFC", "Large hover effect"), tr("\uBC84\uD2BC\uC5D0 \uB9C8\uC6B0\uC2A4\uB97C \uC62C\uB838\uC744 \uB54C \uB098\uD0C0\uB098\uB294 \uC720\uB9AC\uC758 \uD06C\uAE30\uC785\uB2C8\uB2E4. \uB044\uBA74 \uBC84\uD2BC\uC5D0 \uB9DE\uCDB0 \uC791\uAC8C, \uCF1C\uBA74 \uBC84\uD2BC \uBB36\uC74C\uC758 \uB192\uC774\uB9CC\uD07C \uD06C\uAC8C \uD45C\uC2DC\uB429\uB2C8\uB2E4.", "Size of the glass that appears when hovering a button. Off: fits the button. On: as tall as the button group.")),
          toggle("compactWindowControls", tr("\uCC3D \uC81C\uC5B4 \uBC84\uD2BC \uCD95\uC18C", "Compact window controls"), tr("\uCD5C\uC18C\uD654, \uCD5C\uB300\uD654, \uB2EB\uAE30 \uBC84\uD2BC\uC744 \uD3C9\uC18C\uC5D0\uB294 \uC791\uC740 \uC810\uC73C\uB85C \uC904\uC5EC \uB450\uACE0, \uB9C8\uC6B0\uC2A4\uB97C \uC62C\uB9AC\uBA74 \uC6D0\uB798 \uD06C\uAE30\uB85C \uBCF4\uC5EC \uC90D\uB2C8\uB2E4. \uC904\uC5B4\uB4E0 \uB9CC\uD07C \uD0ED \uC904\uC774 \uB113\uC5B4\uC9D1\uB2C8\uB2E4. (Windows, Linux)", "Shrinks the minimize, maximize and close buttons to small dots until you hover them. The tab bar gets the freed space. (Windows, Linux)"), !import_obsidian4.Platform.isMobile)
        ]
      },
      {
        type: "group",
        heading: tr("\uD3B8\uC9D1\uCC3D", "Editor"),
        items: [
          toggle("showPath", tr("\uACBD\uB85C \uD45C\uC2DC", "Show path"), tr("\uD3B8\uC9D1\uCC3D \uD0ED \uC904 \uC704\uCABD \uAC00\uC6B4\uB370\uC5D0 \uD604\uC7AC \uBB38\uC11C\uC758 \uACBD\uB85C\uB97C \uD45C\uC2DC\uD558\uACE0, \uD0ED\uC740 \uADF8 \uC544\uB798 \uC904\uC5D0 \uC88C\uC6B0 \uD3ED\uC744 \uBAA8\uB450 \uC368\uC11C \uBC30\uCE58\uD569\uB2C8\uB2E4. \uD3F4\uB354 \uC774\uB984\uC744 \uB204\uB974\uBA74 \uD30C\uC77C \uD0D0\uC0C9\uAE30\uC5D0\uC11C \uD574\uB2F9 \uD3F4\uB354\uB97C \uBCF4\uC5EC \uC90D\uB2C8\uB2E4. (\uB370\uC2A4\uD06C\uD1B1, \uD0DC\uBE14\uB9BF)", "Shows the current note's path at the top center of the editor tab bar and moves the tabs to a full-width row below. Click a folder name to reveal it in the file explorer. (Desktop, tablet)"), !import_obsidian4.Platform.isPhone),
          toggle("miniBar", tr("\uC2A4\uD06C\uB864 \uC2DC \uD0ED \uC904 \uCD95\uC18C", "Collapse tab bar on scroll"), tr("\uD3B8\uC9D1\uCC3D\uC744 \uC544\uB798\uB85C \uC2A4\uD06C\uB864\uD558\uBA74 \uD0ED \uC904\uC744 \uC811\uACE0 \uD604\uC7AC \uBB38\uC11C \uC81C\uBAA9\uB9CC \uC791\uAC8C \uD45C\uC2DC\uD569\uB2C8\uB2E4. \uC704\uB85C \uC2A4\uD06C\uB864\uD558\uAC70\uB098 \uC81C\uBAA9\uC744 \uB204\uB974\uBA74 \uB2E4\uC2DC \uD3BC\uCE69\uB2C8\uB2E4. (\uB370\uC2A4\uD06C\uD1B1, \uD0DC\uBE14\uB9BF)", "Scrolling down in the editor collapses the tab bar to a small title of the current note. Scroll up or click the title to expand it again. (Desktop, tablet)"), !import_obsidian4.Platform.isPhone),
          toggle("webTint", tr("\uBAB0\uC785\uD615 \uC6F9 \uBCF4\uAE30", "Immersive web view"), tr("\uC6F9 \uBDF0\uC5B4\uC5D0\uC11C \uD398\uC774\uC9C0\uAC00 \uD0ED \uC904 \uB4A4\uB85C \uC9C0\uB098\uAC00\uAC8C \uD558\uACE0, \uD0ED \uC904\uACFC \uBC84\uD2BC\uC744 \uD398\uC774\uC9C0\uC758 \uB300\uD45C \uC0C9\uC73C\uB85C \uCE60\uD569\uB2C8\uB2E4. (\uB370\uC2A4\uD06C\uD1B1, \uD0DC\uBE14\uB9BF)", "In the web viewer, lets the page scroll behind the tab bar and colors the tab bar and its buttons with the page's theme color. (Desktop, tablet)"), !import_obsidian4.Platform.isPhone),
          toggle("headingRule", tr("\uC81C\uBAA9 \uC544\uB798 \uAC00\uB85C\uC904", "Line under headings"), tr("\uC81C\uBAA9(H1~H6) \uC544\uB798\uC5D0 \uC587\uC740 \uAC00\uB85C\uC904\uC744 \uAE0B\uC2B5\uB2C8\uB2E4. \uB77C\uC774\uD2B8 \uBAA8\uB4DC\uC5D0\uC11C\uB294 \uAC80\uC740\uC0C9, \uB2E4\uD06C \uBAA8\uB4DC\uC5D0\uC11C\uB294 \uD770\uC0C9\uC785\uB2C8\uB2E4.", "Draws a thin line under headings (H1\u2013H6). Black in light mode, white in dark mode."))
        ]
      },
      {
        type: "group",
        heading: tr("\uC0AC\uC774\uB4DC\uBC14 \uD0ED", "Sidebar tabs"),
        items: [
          dropdown("tabAnim", tr("\uD0ED \uC804\uD658 \uD6A8\uACFC", "Tab switch effect"), tr("\uB80C\uC988: \uC120\uD0DD \uD45C\uC2DC\uAC00 \uB80C\uC988\uCC98\uB7FC \uBBF8\uB044\uB7EC\uC9C0\uBA70 \uC62E\uACA8 \uAC11\uB2C8\uB2E4. \uC2EC\uD50C: \uD6A8\uACFC \uC5C6\uC774 \uC120\uD0DD\uD55C \uD0ED\uC744 \uAC15\uC870\uC0C9\uC73C\uB85C \uD45C\uC2DC\uD569\uB2C8\uB2E4. \uBAA9\uB85D: \uD0ED\uC744 \uBC84\uD2BC \uC904 \uC544\uB798\uC5D0 \uD55C \uC904\uC5D0 \uD558\uB098\uC529 \uB298\uC5B4\uB193\uACE0, \uC120\uD0DD\uD55C \uD0ED\uC744 \uAC15\uC870\uC0C9\uC73C\uB85C \uD45C\uC2DC\uD569\uB2C8\uB2E4. \uC88C\uC6B0 \uD328\uB110 \uD22C\uBA85\uC774 \uCF1C\uC838 \uC788\uC73C\uBA74 \uB80C\uC988 \uB300\uC2E0 \uC2EC\uD50C\uB85C \uBCF4\uC785\uB2C8\uB2E4. (\uBAA9\uB85D\uC740 \uB370\uC2A4\uD06C\uD1B1, \uD0DC\uBE14\uB9BF)", "Lens: the selection slides over like a lens. Simple: no effect; the selected tab is shown in the accent color. List: tabs are listed one per row below the button row, and the selected tab is shown in the accent color. With transparent side panels on, Simple is shown instead of Lens. (List: desktop, tablet)"), {
            lens: tr("\uB80C\uC988", "Lens"),
            none: tr("\uC2EC\uD50C (\uAC15\uC870\uC0C9)", "Simple (accent color)"),
            ...import_obsidian4.Platform.isPhone ? {} : { list: tr("\uBAA9\uB85D", "List") }
          }),
          // 목록을 고르면 바로 밑에 (하위 항목 표시 없이, 사용자 요청)
          {
            name: tr("\uBAA9\uB85D\uC744 \uC4F8 \uD328\uB110", "Panels using the list"),
            desc: tr("\uBAA9\uB85D \uBC29\uC2DD\uC744 \uC4F8 \uD328\uB110\uC785\uB2C8\uB2E4. \uB098\uBA38\uC9C0 \uD328\uB110\uC740 \uB80C\uC988 \uD6A8\uACFC\uB97C \uC501\uB2C8\uB2E4. (\uB370\uC2A4\uD06C\uD1B1, \uD0DC\uBE14\uB9BF)", "Panels that use the list. Other panels use the lens effect. (Desktop, tablet)"),
            visible: () => st.tabAnim === "list" && !import_obsidian4.Platform.isPhone,
            render: (s) => {
              fresh(s).addDropdown(
                (d) => d.addOptions({ left: tr("\uC67C\uCABD \uD328\uB110\uB9CC", "Left panel only"), right: tr("\uC624\uB978\uCABD \uD328\uB110\uB9CC", "Right panel only"), both: tr("\uC591\uCABD \uD328\uB110 \uB2E4", "Both panels") }).setValue(st.tabListSides || "both").onChange((v) => void this.setControlValue("tabListSides", v))
              );
            }
          }
        ]
      },
      {
        type: "group",
        // 탭 전환 효과와 나누기만 한다 (사용자 요청: 묶음 이름은 두지 않는다)
        items: [
          toggle("tabWide", tr("\uD0ED \uC904 \uB113\uAC8C", "Wide tab bar"), tr("\uC0AC\uC774\uB4DC\uBC14 \uD0ED\uC744 \uC0AC\uC774\uB4DC\uBC14 \uC88C\uC6B0 \uB05D\uAE4C\uC9C0 \uB113\uD788\uACE0, \uBCF4\uAE30\uC758 \uBC84\uD2BC\uB4E4\uC744 \uD3BC\uCCD0\uC11C \uBCF4\uC5EC \uC90D\uB2C8\uB2E4. \uB9E8 \uC704 \uD0ED \uBB36\uC74C\uC740 \uBC84\uD2BC \uC904 \uC544\uB798\uB85C \uD55C \uC904 \uB0B4\uB824 \uBC30\uCE58\uD569\uB2C8\uB2E4. (\uB370\uC2A4\uD06C\uD1B1, \uD0DC\uBE14\uB9BF)", "Stretches the sidebar tabs across the full sidebar width and shows the view's buttons expanded. The top tab group moves one row down, below the button row. (Desktop, tablet)"), !import_obsidian4.Platform.isMobile),
          toggle("tabNames", tr("\uD0ED \uC774\uB984 \uD45C\uC2DC", "Show tab names"), tr("\uC0AC\uC774\uB4DC\uBC14 \uD0ED \uC544\uC774\uCF58 \uC606\uC5D0 \uC774\uB984\uC744 \uD45C\uC2DC\uD569\uB2C8\uB2E4. \uD0ED\uC774 \uD558\uB098\uBFD0\uC778 \uBB36\uC74C\uC740 \uC774 \uC124\uC815\uACFC \uAD00\uACC4\uC5C6\uC774 \uC774\uB984\uC744 \uD45C\uC2DC\uD569\uB2C8\uB2E4. (\uB370\uC2A4\uD06C\uD1B1, \uD0DC\uBE14\uB9BF)", "Shows names next to sidebar tab icons. Groups with a single tab always show the name. (Desktop, tablet)"), !import_obsidian4.Platform.isMobile)
        ]
      },
      {
        type: "group",
        heading: tr("\uD1A0\uAE00\uACFC \uCCB4\uD06C\uBC15\uC2A4", "Toggles and checkboxes"),
        items: [
          toggle("iosColors", tr("\uD1A0\uAE00\xB7\uC2AC\uB77C\uC774\uB354 iOS \uC0C9\uC0C1", "iOS colors for toggles and sliders"), tr("\uCF1C\uBA74 \uD1A0\uAE00\uC740 \uCD08\uB85D\uC0C9, \uC2AC\uB77C\uC774\uB354\uB294 \uD30C\uB780\uC0C9\uC73C\uB85C \uD45C\uC2DC\uD569\uB2C8\uB2E4. \uB044\uBA74 \uB458 \uB2E4 \uAC15\uC870\uC0C9\uC744 \uC0AC\uC6A9\uD569\uB2C8\uB2E4.", "On: toggles are green and sliders are blue. Off: both use the accent color.")),
          dropdown("taskStyle", tr("\uD560 \uC77C \uCCB4\uD06C\uBC15\uC2A4 \uBAA8\uC591", "Task checkbox style"), tr("\uCCB4\uD06C: \uC0C9\uC774 \uCC44\uC6CC\uC9C4 \uC6D0\uC5D0 \uCCB4\uD06C \uD45C\uC2DC\uAC00 \uB098\uD0C0\uB0A9\uB2C8\uB2E4. \uB9C1: \uD14C\uB450\uB9AC \uC6D0 \uC548\uC5D0 \uC791\uC740 \uC6D0\uC774 \uB098\uD0C0\uB0A9\uB2C8\uB2E4.", "Check: a filled circle with a check mark. Ring: a small dot inside an outlined circle."), {
            check: tr("\uCCB4\uD06C", "Check"),
            ring: tr("\uB9C1", "Ring")
          }),
          dropdown("taskColor", tr("\uD560 \uC77C \uCCB4\uD06C\uBC15\uC2A4 \uC0C9", "Task checkbox color"), void 0, {
            yellow: tr("\uB178\uB791", "Yellow"),
            accent: tr("\uAC15\uC870\uC0C9", "Accent color"),
            custom: tr("\uC0C9\uC0C1 \uC9C0\uC815", "Custom color")
          }),
          sub(tr("\uCCB4\uD06C\uBC15\uC2A4 \uC0C9 \uC9C0\uC815", "Checkbox color"), void 0, () => st.taskColor === "custom", color("taskColorCustom"))
        ]
      },
      {
        type: "group",
        heading: tr("\uD30C\uC77C \uD0D0\uC0C9\uAE30", "File explorer"),
        items: [
          toggle("navCompact", tr("\uC904 \uAC04\uACA9 \uC881\uAC8C", "Compact rows"), tr("\uD30C\uC77C \uBAA9\uB85D \uD56D\uBAA9\uC758 \uC704\uC544\uB798 \uAC04\uACA9\uC744 \uCEF4\uD4E8\uD130\uB9CC\uD07C \uC904\uC5EC \uD55C \uD654\uBA74\uC5D0 \uB354 \uB9CE\uC774 \uBCF4\uC774\uAC8C \uD569\uB2C8\uB2E4. (\uBAA8\uBC14\uC77C)", "Reduces the vertical spacing of file list items to the desktop size so more fit on screen. (Mobile)"), import_obsidian4.Platform.isMobile),
          toggle("fileStripes", tr("\uC904\uBB34\uB2AC \uBC30\uACBD", "Striped rows"), tr("\uD30C\uC77C \uBAA9\uB85D\uC5D0 \uD55C \uC904\uC529 \uBC88\uAC08\uC544 \uC904\uBB34\uB2AC\uB97C \uAE54\uC544 \uD56D\uBAA9\uC744 \uAD6C\uBD84\uD558\uAE30 \uC27D\uAC8C \uD569\uB2C8\uB2E4.", "Alternates row backgrounds in the file list so items are easier to tell apart."), !import_obsidian4.Platform.isMobile),
          toggle("fileGuides", tr("\uB4E4\uC5EC\uC4F0\uAE30 \uC138\uB85C\uC904", "Indentation guides"), tr("\uD3F4\uB354 \uC548 \uD56D\uBAA9 \uC67C\uCABD\uC5D0 \uD3F4\uB354 \uB2E8\uACC4\uB97C \uBCF4\uC5EC \uC8FC\uB294 \uC138\uB85C\uC904\uC744 \uAE0B\uC2B5\uB2C8\uB2E4.", "Draws vertical lines left of the items inside a folder to show the folder levels.")),
          dropdown("fileIcons", tr("\uD30C\uC77C \uD0D0\uC0C9\uAE30 \uC2A4\uD0C0\uC77C", "File explorer style"), tr("\uAE30\uBCF8: \uC785\uCCB4 \uD3F4\uB354\xB7\uBB38\uC11C \uC544\uC774\uCF58. \uC2EC\uD50C: Obsidian\uC758 \uB2EB\uD78C \uD3F4\uB354 \uC544\uC774\uCF58\uC744 \uD3F4\uB354\uC5D0\uB9CC \uBD99\uC774\uACE0 \uBB38\uC11C\uC5D0\uB294 \uBD99\uC774\uC9C0 \uC54A\uC73C\uBA70, \uBAA9\uB85D\uC744 \uC870\uAE08 \uD06C\uAC8C \uD45C\uC2DC\uD569\uB2C8\uB2E4.", "Default: shaded folder and note icons. Simple: Obsidian's closed folder icon on folders only, no icon on notes, and a slightly larger list."), {
            none: tr("\uC5C6\uC74C", "None"),
            finder: tr("\uAE30\uBCF8", "Default"),
            line: tr("\uC2EC\uD50C", "Simple")
          }),
          dropdown("folderColor", tr("\uD3F4\uB354 \uC544\uC774\uCF58 \uC0C9", "Folder icon color"), void 0, {
            blue: tr("\uAE30\uBCF8 \uD30C\uB791", "Default blue"),
            accent: tr("\uAC15\uC870\uC0C9", "Accent color"),
            custom: tr("\uC0C9\uC0C1 \uC9C0\uC815", "Custom color")
          }),
          sub(tr("\uD3F4\uB354 \uC544\uC774\uCF58 \uC0C9 \uC9C0\uC815", "Custom folder icon color"), void 0, () => st.folderColor === "custom", color("folderColorCustom"))
        ]
      },
      {
        type: "group",
        heading: tr("\uD3F4\uB354 \uC0C9", "Folder color"),
        items: this.folderColorItems()
      },
      {
        type: "group",
        // 제목 없이 이름별 색 바로 아래에 따로 묶는다 (사용자 요청: 묶음 이름은 두지 않고 나누기만)
        items: this.paletteItems()
      }
    ];
    for (const d of defs) if ("items" in d && d.type === "group") d.items = d.items.filter((i) => !("visible" in i) || i.visible !== false);
    return defs;
  }
  // 폴더 색 관리: 이름별로 지정된 색(바꾸기·지우기·더하기). 색 고르기 창의 팔레트는 따로 묶음(paletteItems, 사용자 요청).
  // 둘 다 data.json 에 둔다. 줄은 위아래를 줄여 표처럼 쓴다 (CSS: .lg-fc-row, 사용자 요청). 자기 묶음 안이라 하위 항목 들여쓰기는 하지 않는다
  folderColorItems() {
    const pl = this.plugin;
    const map = pl.shared.folderColorsByName || (pl.shared.folderColorsByName = {});
    const row = (s, ...cls) => {
      fresh(s).setClass("lg-fc-row");
      for (const c of cls) s.setClass(c);
      return s;
    };
    const items = [
      {
        name: tr("\uC774\uB984\uBCC4 \uC0C9", "Colors by name"),
        desc: tr("\uD3F4\uB354 \uC774\uB984\uBCC4\uB85C \uC0C9\uC744 \uC9C0\uC815\uD569\uB2C8\uB2E4. \uC774\uB984\uC774 \uAC19\uC740 \uD3F4\uB354\uB294 \uC704\uCE58\uC640 \uAD00\uACC4\uC5C6\uC774 \uAC19\uC740 \uC0C9\uC774 \uB418\uACE0, \uD558\uC704 \uD3F4\uB354\uC640 \uBB38\uC11C\uB294 \uB530\uB85C \uC9C0\uC815\uD558\uC9C0 \uC54A\uC73C\uBA74 \uC0C1\uC704 \uD3F4\uB354\uC758 \uC0C9\uC744 \uB530\uB985\uB2C8\uB2E4. \uD30C\uC77C \uD0D0\uC0C9\uAE30\uC5D0\uC11C \uD3F4\uB354\uB97C \uC6B0\uD074\uB9AD\uD55C \uB4A4 '\uD3F4\uB354 \uC0C9'\uC744 \uC120\uD0DD\uD574\uB3C4 \uC9C0\uC815\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.", "Assigns colors by folder name. Folders with the same name get the same color wherever they are, and subfolders and notes follow their parent's color unless set separately. You can also right-click a folder in the file explorer and choose 'Folder color'.")
      }
    ];
    const names = Object.keys(map).sort((x, y) => x.localeCompare(y, (0, import_obsidian4.getLanguage)()));
    if (!names.length) items.push({ name: tr("\uC9C0\uC815\uB41C \uC0C9 \uC5C6\uC74C", "No colors assigned"), searchable: false, render: (s) => void row(s) });
    for (const name of names) {
      items.push({
        name,
        aliases: [tr("\uD3F4\uB354 \uC0C9", "Folder color")],
        render: (s) => {
          const n = pl.folderCount(name);
          row(s).addColorPicker(
            (c) => c.setValue(map[name]).onChange((value) => {
              map[name] = value.toUpperCase();
              void pl.saveFolderColors();
            })
          ).addExtraButton(
            (btn) => btn.setIcon("trash-2").setTooltip(tr("\uC0C9 \uC9C0\uC6B0\uAE30", "Clear color")).onClick(() => {
              delete map[name];
              void pl.saveFolderColors().then(() => this.update());
            })
          );
          s.controlEl.prepend(createSpan({ cls: "lg-fc-count", text: n ? tr(`\uD3F4\uB354 ${n}\uAC1C`, `${n} folder${n === 1 ? "" : "s"}`) : tr("\uD574\uB2F9 \uD3F4\uB354 \uC5C6\uC74C", "No matching folders") }));
        }
      });
    }
    items.push({
      name: tr("\uC0C9 \uCD94\uAC00", "Add color"),
      render: (s) => {
        let newName = "";
        let newHex = (pl.folderPalette()[0] || ["", "#4981D0"])[1];
        row(s, "lg-fc-add-row").addText((t) => t.setPlaceholder(tr("\uD3F4\uB354 \uC774\uB984", "Folder name")).onChange((v) => newName = v.trim())).addColorPicker((c) => c.setValue(newHex).onChange((v) => newHex = v.toUpperCase())).addButton(
          (btn) => btn.setButtonText(tr("\uCD94\uAC00", "Add")).onClick(() => {
            if (!newName) return;
            map[newName] = newHex;
            void pl.saveFolderColors().then(() => this.update());
          })
        );
      }
    });
    return items;
  }
  // 색 고르기 창의 팔레트(고치기·끌어서 순서·더하기·빼기·기본으로)
  paletteItems() {
    const pl = this.plugin;
    const row = (s, ...cls) => {
      fresh(s).setClass("lg-fc-row");
      for (const c of cls) s.setClass(c);
      return s;
    };
    const items = [];
    items.push({
      name: tr("\uD314\uB808\uD2B8", "Palette"),
      desc: tr("\uD3F4\uB354 \uC0C9 \uC120\uD0DD \uCC3D\uC5D0 \uD45C\uC2DC\uB418\uB294 \uC0C9\uC785\uB2C8\uB2E4. \uC624\uB978\uCABD \uC190\uC7A1\uC774\uB97C \uB04C\uC5B4 \uC21C\uC11C\uB97C \uBC14\uAFC0 \uC218 \uC788\uACE0, \uC0C9 \uCF54\uB4DC \uCE78\uC5D0 HEX \uAC12\uC744 \uBD99\uC5EC \uB123\uC744 \uC218\uB3C4 \uC788\uC2B5\uB2C8\uB2E4. \uD314\uB808\uD2B8\uB97C \uBC14\uAFD4\uB3C4 \uC774\uBBF8 \uC9C0\uC815\uD55C \uD3F4\uB354 \uC0C9\uC740 \uBC14\uB00C\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.", "Colors shown in the folder color picker. Drag the handle on the right to reorder, or paste a HEX value into the color code field. Changing the palette does not change colors already assigned to folders."),
      render: (s) => {
        fresh(s).addExtraButton(
          (btn) => btn.setIcon("rotate-ccw").setTooltip(tr("\uAE30\uBCF8 \uD314\uB808\uD2B8\uB85C \uB418\uB3CC\uB9AC\uAE30", "Restore default palette")).onClick(() => {
            new ConfirmModal(
              this.app,
              tr("\uAE30\uBCF8 \uD314\uB808\uD2B8\uB85C \uB418\uB3CC\uB9B4\uAE4C\uC694?", "Restore the default palette?"),
              tr("\uD314\uB808\uD2B8\uC5D0\uC11C \uACE0\uCE58\uAC70\uB098 \uB354\uD55C \uC0C9\uC774 \uBAA8\uB450 \uC0AC\uB77C\uC9D1\uB2C8\uB2E4. \uC774\uBBF8 \uD3F4\uB354\uC5D0 \uC9C0\uC815\uD55C \uC0C9\uC740 \uBC14\uB00C\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.", "All colors you edited or added to the palette will be lost. Colors already assigned to folders stay the same."),
              tr("\uB418\uB3CC\uB9AC\uAE30", "Restore"),
              () => {
                delete pl.shared.folderPalette;
                void pl.saveData(pl.shared).then(() => this.update());
              }
            ).open();
          })
        );
      }
    });
    const edit = async (fn) => {
      if (!Array.isArray(pl.shared.folderPalette)) pl.shared.folderPalette = FOLDER_PALETTE.map(([n, h]) => [n, h]);
      fn(pl.shared.folderPalette);
      await pl.saveData(pl.shared);
    };
    const rows = [];
    pl.folderPalette().forEach(([name, hex], i) => {
      items.push({
        name: "",
        aliases: [name],
        render: (s) => this.paletteRow(row(s, "lg-fc-pal-row"), name, hex, i, rows, edit)
      });
    });
    items.push({
      name: "",
      searchable: false,
      render: (s) => {
        row(s).addButton(
          (btn) => btn.setButtonText(tr("\uD314\uB808\uD2B8\uC5D0 \uC0C9 \uCD94\uAC00", "Add color to palette")).onClick(() => {
            void edit((p) => p.push([tr("\uC0C8 \uC0C9", "New color"), "#888888"])).then(() => this.update());
          })
        );
      }
    });
    return items;
  }
  // 팔레트 한 줄: [이름 | 색 코드 | 색 | 빼기 | 손잡이]
  paletteRow(st, name, hex, i, rows, edit) {
    const pl = this.plugin;
    let picker = null;
    let code = null;
    const setHex = (v) => {
      void edit((p) => {
        p[i][1] = v;
      });
    };
    st.addText(
      (t) => t.setValue(name).setPlaceholder(tr("\uC774\uB984", "Name")).onChange((v) => {
        void edit((p) => {
          p[i][0] = v.trim() || name;
        });
      })
    ).addText((t) => {
      code = t;
      t.inputEl.addClass("lg-fc-hex");
      t.inputEl.spellcheck = false;
      t.setValue(hex.toUpperCase()).onChange((v) => {
        const m = /^#?([0-9a-f]{6})$/i.exec(v.trim());
        if (!m) return;
        const h = "#" + m[1].toUpperCase();
        if (picker !== null) picker.setValue(h.toLowerCase());
        setHex(h);
      });
      t.inputEl.addEventListener("blur", () => {
        const cur = (pl.folderPalette()[i] || [])[1];
        if (cur) t.setValue(cur.toUpperCase());
      });
    }).addColorPicker((c) => {
      picker = c;
      c.setValue(hex.toLowerCase()).onChange((v) => {
        if (code !== null) code.setValue(v.toUpperCase());
        setHex(v.toUpperCase());
      });
    }).addExtraButton(
      (btn) => btn.setIcon("trash-2").setTooltip(tr("\uD314\uB808\uD2B8\uC5D0\uC11C \uBE7C\uAE30", "Remove from palette")).onClick(() => {
        void edit((p) => p.splice(i, 1)).then(() => this.update());
      })
    );
    const el = st.settingEl;
    el.lgIdx = i;
    rows[i] = el;
    const grip = createDiv({ cls: "lg-fc-grip" });
    (0, import_obsidian4.setIcon)(grip, "grip-vertical");
    (0, import_obsidian4.setTooltip)(grip, tr("\uB04C\uC5B4\uC11C \uC21C\uC11C \uBC14\uAFB8\uAE30", "Drag to reorder"));
    el.appendChild(grip);
    grip.addEventListener("pointerdown", (e) => {
      if (e.button !== 0) return;
      e.preventDefault();
      const doc = grip.ownerDocument;
      const live = rows.filter((r) => r && r.isConnected);
      el.addClass("lg-fc-dragging");
      doc.body.addClass("lg-fc-sorting");
      const move = (ev) => {
        const others = live.filter((r) => r !== el);
        const before = others.find((r) => {
          const rr = r.getBoundingClientRect();
          return ev.clientY < rr.top + rr.height / 2;
        });
        const parent = el.parentElement;
        if (before) {
          if (el.nextSibling !== before) parent.insertBefore(el, before);
        } else {
          const last = others[others.length - 1];
          if (last && last.nextSibling !== el) parent.insertBefore(el, last.nextSibling);
        }
      };
      const finish = async () => {
        doc.removeEventListener("pointermove", move);
        doc.removeEventListener("pointerup", up);
        doc.removeEventListener("pointercancel", up);
        el.removeClass("lg-fc-dragging");
        doc.body.removeClass("lg-fc-sorting");
        const order = live.slice().sort((x, y) => x.compareDocumentPosition(y) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1).map((r) => r.lgIdx);
        if (order.every((k, j) => k === j)) return;
        await edit((p) => {
          const copy = p.slice();
          p.splice(0, p.length, ...order.map((k) => copy[k]));
        });
        this.update();
      };
      const up = () => {
        void finish();
      };
      doc.addEventListener("pointermove", move);
      doc.addEventListener("pointerup", up);
      doc.addEventListener("pointercancel", up);
    });
  }
};

// src/core.ts
var coreMethods = {
  // 지금 테마가 Glass Shelf 인가 (Obsidian 이 고른 테마 이름)
  themeOn() {
    const cc = this.app.customCss;
    return !!cc && cc.theme === THEME_NAME;
  },
  // 테마 상태에 맞춰 자식을 붙이거나 뗀다. 테마를 빠르게 여러 번 바꿔도 차례로 한다
  syncCore() {
    this.coreQueue = (this.coreQueue ?? Promise.resolve()).then(() => this.applyCore()).catch((err) => console.error("[glass-shelf] theme switch", err));
    return this.coreQueue;
  },
  async applyCore() {
    const on = this.themeOn();
    if (on === !!this.core) return;
    if (this.core) {
      const core2 = this.core;
      this.removeChild(core2);
      const self = this;
      for (const k of Object.keys(self)) if (!this.coreKeys.has(k)) delete self[k];
      this.core = null;
      this.unloaded = true;
      return;
    }
    delete this.unloaded;
    this.coreKeys = new Set(Object.keys(this));
    this.coreKeys.add("coreKeys");
    const core = new import_obsidian5.Component();
    core.onunload = () => this.teardown();
    this.core = core;
    this.addChild(core);
    await this.startCore();
  },
  // 테마가 켜졌을 때의 준비 (예전 onload 의 본문)
  async startCore() {
    const raw = await this.loadData() || {};
    migrateGlassLevel(raw);
    delete raw.frost;
    delete raw.hoverSize;
    delete raw.activeTabColor;
    delete raw.activeTabColorCustom;
    this.shared = Object.assign({}, DEFAULTS, raw);
    this.settings = this.shared;
    try {
      if (typeof this.app.saveLocalStorage === "function") for (const k of OLD_DEVICE_KEYS) this.app.saveLocalStorage(k, null);
    } catch {
    }
    this.addSettingTab(new GlassShelfSettingTab(this.app, this));
    this.segWatched = /* @__PURE__ */ new WeakSet();
    this.tabsWatched = /* @__PURE__ */ new WeakSet();
    this.observers = [];
    this.kbWatched = /* @__PURE__ */ new WeakSet();
    this.docs = /* @__PURE__ */ new Set();
    this.refractor = new Refractor();
    if (import_obsidian5.Platform.isMobile && typeof this.app.loadLocalStorage === "function") {
      this.refractor.warmIO = {
        load: () => this.app.loadLocalStorage("lg-rf-warm"),
        save: (v) => this.app.saveLocalStorage("lg-rf-warm", v)
      };
      this.app.workspace.onLayoutReady(() => window.setTimeout(() => !this.unloaded && this.refractor.warmUp(), 1500));
    }
    this.attachDoc(document);
    this.app.workspace.iterateAllLeaves((leaf) => {
      const d = leaf.view && leaf.view.containerEl && leaf.view.containerEl.ownerDocument;
      if (d && d !== document) this.attachDoc(d);
    });
    this.applySettings();
    if (!import_obsidian5.Platform.isMobile) {
      const wsEl = this.app.workspace.containerEl;
      let open = wsEl.hasClass("is-left-sidedock-open");
      let timer = 0;
      const syncRight = () => document.body.toggleClass("lg-right-open", wsEl.hasClass("is-right-sidedock-open"));
      syncRight();
      const obs = new MutationObserver(() => {
        syncRight();
        const now = wsEl.hasClass("is-left-sidedock-open");
        if (now === open) return;
        open = now;
        document.body.removeClass("lg-rib-anim");
        void document.body.offsetWidth;
        document.body.addClass("lg-rib-anim");
        window.clearTimeout(timer);
        timer = window.setTimeout(() => document.body.removeClass("lg-rib-anim"), 520);
      });
      obs.observe(wsEl, { attributes: true, attributeFilter: ["class"] });
      this.register(() => {
        obs.disconnect();
        document.body.removeClass("lg-rib-anim");
        document.body.removeClass("lg-right-open");
      });
      const rootEl = () => this.app.workspace.rootSplit && this.app.workspace.rootSplit.containerEl;
      const syncFocus = () => {
        const r = rootEl();
        const a = document.activeElement;
        document.body.toggleClass("lg-editing", !!(r && a && r.contains(a)));
      };
      this.registerDomEvent(document, "focusin", syncFocus);
      this.registerDomEvent(document, "focusout", () => window.setTimeout(syncFocus, 0));
      this.register(() => document.body.removeClass("lg-editing"));
    }
    void this.setupFolderColors(raw);
    const refresh = () => this.requestRefresh();
    if (!import_obsidian5.Platform.isPhone) this.registerInterval(window.setInterval(() => this.webMiniTick(), WEB_MINI_POLL_MS));
    this.app.workspace.onLayoutReady(refresh);
    this.registerEvent(this.app.workspace.on("layout-change", refresh));
    this.registerEvent(this.app.workspace.on("layout-change", () => {
      for (const doc of this.docs) this.snapTabBars(doc);
    }));
    this.registerEvent(this.app.workspace.on("active-leaf-change", refresh));
    this.registerEvent(this.app.workspace.on("file-open", refresh));
    this.registerEvent(this.app.workspace.on("css-change", refresh));
    this.registerEvent(this.app.workspace.on("css-change", () => {
      for (const doc of this.docs) this.applyFolderColor(doc);
    }));
    const unMini = (leaf) => {
      const tabs = leaf && leaf.parent && leaf.parent.containerEl;
      if (!tabs || !tabs.classList) return;
      tabs.lgMiniHold = performance.now() + MINI_HOLD;
      this.setMini(tabs, false);
    };
    this.registerEvent(this.app.workspace.on("active-leaf-change", (leaf) => {
      const tabs = leaf && leaf.parent && leaf.parent.containerEl;
      if (tabs && tabs.lgMiniLeaf !== leaf) {
        tabs.lgMiniLeaf = leaf;
        unMini(leaf);
      }
    }));
    this.registerEvent(this.app.workspace.on("file-open", () => unMini(this.app.workspace.getMostRecentLeaf())));
    this.register(() => document.querySelectorAll(".workspace-tabs.lg-mini").forEach((t) => t.classList.remove("lg-mini")));
    this.registerEvent(this.app.vault.on("modify", (f) => {
      if (f.path.endsWith(".base")) this.app.workspace.getLeavesOfType("bases").forEach((l) => l.view instanceof import_obsidian5.ItemView && this.basesGroupMark(l.view));
    }));
    this.registerEvent(this.app.workspace.on("window-open", (win) => win && win.doc && this.attachDoc(win.doc)));
    const findSettings = () => {
      const st = this.app.setting;
      const cands = [
        st && st.popout && st.popout.win && st.popout.win.document,
        st && st.containerEl && st.containerEl.isConnected && st.containerEl.ownerDocument
      ];
      for (const d of cands) if (d && d.body) this.attachDoc(d);
      for (const d of this.docs) this.modalRefract(d);
      for (const d of this.docs) if (d !== document && (!d.defaultView || d.defaultView.closed)) this.docs.delete(d);
    };
    findSettings();
    if (!import_obsidian5.Platform.isMobile) this.registerDomEvent(window, "blur", () => {
      for (const t of [60, 300, 1e3]) window.setTimeout(() => !this.unloaded && findSettings(), t);
    });
  },
  // body 에 플러그인 상태(클래스·뿌연 정도)를 반영
  // 화면 한 픽셀의 CSS 길이(--lg-dpx). 배율이 125% 면 0.8px. 테마가 가는 선 두께를 이 배수로 맞춰, 선이 놓인 높이에 따라
  // 1픽셀·2픽셀로 번갈아 그려지지 않게 한다 (사용자 지적: 제목 가로줄마다 두께가 달라 보였다)
  applyDevicePx(doc) {
    const win = doc.defaultView;
    if (!doc.body || !win) return;
    const v = `${+(1 / (win.devicePixelRatio || 1)).toFixed(4)}px`;
    if (doc.body.style.getPropertyValue("--lg-dpx") !== v) doc.body.style.setProperty("--lg-dpx", v);
    this.snapTabBars(doc);
  },
  // 좌우 패널 탭 줄 알약을 화면 픽셀 경계에 맞춘다(--lg-snap-y 만큼 세로로 옮김). 소수 픽셀에 있으면 누름 효과(scale 애니메이션)
  // 동안 따로 그려지는 층이 픽셀에 맞춰지며 글자가 내려갔다 올라왔다 (capturePage 측정: 0.47 → 0.1 화면 픽셀, 사용자 녹화)
  snapTabBars(doc) {
    const win = doc.defaultView;
    if (!win || import_obsidian5.Platform.isMobile) return;
    const dpr = win.devicePixelRatio || 1;
    doc.querySelectorAll(".workspace-split.mod-sidedock .workspace-tab-header-container-inner").forEach((el) => {
      if (!el.offsetHeight || el.getAnimations().length) return;
      const cur = parseFloat(el.style.getPropertyValue("--lg-snap-y")) || 0;
      const top = Math.round((el.getBoundingClientRect().top - cur) * 64) / 64 * dpr;
      const off = +((Math.round(top) - top) / dpr).toFixed(4);
      if (Math.abs(off - cur) > 1e-3) el.setCssProps({ "--lg-snap-y": `${off}px` });
    });
  },
  // 좌우 패널 아크릴 (Windows 11 22H2 이상, 사용자 요청): 창 바탕을 투명하게 하고 시스템 아크릴 재질을 깐다(Electron 공개 API).
  // 테마는 body.lg-acrylic 에서 body 바탕을 비우고 좌우 패널 바탕만 반투명하게 둔다(편집창은 불투명 그대로).
  // 끌 때(allow 가 false 이거나 설정 꺼짐) 원래 창 바탕색으로 되돌린다. 재질을 못 거는 환경이면 클래스도 붙이지 않는다.
  // 맥은 따로 켜는 설정 없이 Obsidian 의 반투명 창(body.is-translucent)을 따른다 (사용자 결정). Obsidian 이 창을 투명하게 하고
  // 사이드바 재질(setVibrancy("sidebar"))을 깐다. 맥은 패널 바탕을 칠하지 않고(테마 0%) 패널 색을 그 재질에 맡긴다: 반투명 바탕은
  // 유리(뒤 필터)를 다시 그리는 프레임에 macOS 가 지우지 않고 덧칠해 패널이 불투명하게 깜빡였다(측정). 그래서 구멍도 쓰지 않는다
  applyAcrylic(allow) {
    const mac = import_obsidian5.Platform.isMacOS && import_obsidian5.Platform.isDesktopApp;
    if (mac) this.watchTranslucent(allow);
    const want = allow && import_obsidian5.Platform.isDesktopApp && (mac ? document.body.classList.contains("is-translucent") : !!this.settings.sideAcrylic && import_obsidian5.Platform.isWin);
    if (want === (this.acrylicPrev != null)) return;
    const remote = window.require ? window.require("electron").remote : void 0;
    const w = remote && remote.getCurrentWindow ? remote.getCurrentWindow() : null;
    if (!w) return;
    if (mac) {
      if (typeof w.setVibrancy !== "function") return;
      if (want) w.setVibrancy("sidebar");
      this.acrylicPrev = want ? "vibrancy" : null;
    } else {
      if (typeof w.setBackgroundMaterial !== "function") return;
      if (want) {
        this.acrylicPrev = w.getBackgroundColor();
        w.setBackgroundColor("#00000000");
        w.setBackgroundMaterial("acrylic");
      } else {
        w.setBackgroundMaterial("none");
        w.setBackgroundColor(this.acrylicPrev || "#000000");
        this.acrylicPrev = null;
      }
    }
    document.body.classList.toggle("lg-acrylic", want);
    document.body.classList.toggle("lg-tab-plain", this.tabPlain());
    this.acrylicTheme(want);
    this.acrylicHoles(want && !mac);
    if (mac && want) this.vibNudge();
  },
  // 맥: 재질을 바꾸거나 창 라이트·다크가 바뀐 뒤 패널이 예전 화면으로 남았다(측정: 그동안 Chromium 화면은 투명). 화면을 한 번 새로
  // 그리면 풀렸다(측정). 조금 뒤 두 프레임 동안 앱 화면 층을 바꿔 다시 그리게 한다(테마 body.lg-vib-nudge)
  // 패널 탭이 심플(렌즈 없이 선택한 탭을 강조색으로) 방식인지. 좌우 패널 투명이 켜져 있으면 렌즈를 쓰지 않는다 (사용자 결정):
  // 렌즈가 떠 오는 화면에 패널 바탕이 없어 원래 탭 줄 테두리와 렌즈 안 테두리가 두 줄로 보였고, 맥은 렌즈가 매 프레임 다시 그려져
  // 반투명 덧칠 깜빡임이 늘었다(측정: 목록이 렌즈보다 4~10배 적다). 목록 방식 패널은 그대로 목록이다
  tabPlain() {
    return this.settings.tabAnim === "none" || document.body.classList.contains("lg-acrylic");
  },
  // 좌우 패널 투명을 켤 때 알린다: 렌즈를 쓰던 패널 탭이 심플로 보인다 (사용자 요청). 렌즈를 쓰는 패널이 없으면(심플, 양쪽 목록) 알리지 않는다
  noticeSimpleTabs() {
    const s = this.settings;
    if (s.tabAnim === "none" || s.tabAnim === "list" && (s.tabListSides || "both") === "both") return;
    new import_obsidian5.Notice(tr("\uC88C\uC6B0 \uD328\uB110 \uD22C\uBA85\uC774 \uCF1C\uC838 \uC788\uC73C\uBA74 \uD0ED \uC804\uD658 \uD6A8\uACFC\uB294 \uB80C\uC988 \uB300\uC2E0 \uC2EC\uD50C\uB85C \uBCF4\uC785\uB2C8\uB2E4.", "With see-through side panels on, the tab switch effect is shown as Simple instead of Lens."));
  },
  vibNudge() {
    window.setTimeout(() => {
      if (this.unloaded) return;
      document.body.classList.add("lg-vib-nudge");
      window.requestAnimationFrame(() => window.requestAnimationFrame(() => document.body.classList.remove("lg-vib-nudge")));
    }, 300);
  },
  // 맥: Obsidian 반투명 창을 켜고 끄면(body.is-translucent, 재시작 없이 바뀐다) 따라간다
  watchTranslucent(on) {
    if (!on) {
      if (this.translucentObs) this.translucentObs.disconnect();
      this.translucentObs = null;
      return;
    }
    if (this.translucentObs) return;
    let was = document.body.classList.contains("is-translucent");
    this.translucentObs = new MutationObserver(() => {
      const now = document.body.classList.contains("is-translucent");
      if (now === was) return;
      was = now;
      if (this.unloaded) return;
      this.applyAcrylic(true);
      if (now) this.noticeSimpleTabs();
    });
    this.translucentObs.observe(document.body, { attributes: true, attributeFilter: ["class"] });
  },
  // 아크릴 색 맞추기 (사용자 요청): Windows 는 창의 라이트·다크에 따라 아크릴 위에 밝은 막·어두운 막을 덮는다.
  // 창은 Windows 설정을 따라 Obsidian 이 라이트여도 다크 아크릴이 깔려, 패널 바탕을 옅게 한 알약 자리만 시커멓게 보였다.
  // 켜 있는 동안 창 테마(nativeTheme.themeSource, Electron 공개 API)를 Obsidian 의 지금 라이트·다크에 맞추고, 바뀌면(body.theme-dark) 따라간다.
  // 끄면 원래 값으로 되돌린다. Obsidian 테마와 같은 쪽으로만 맞추므로 '시스템 따라가기'여도 서로 뒤집지 않는다
  acrylicTheme(on) {
    if (this.acrylicThemeOff) {
      this.acrylicThemeOff();
      this.acrylicThemeOff = null;
    }
    if (!on) return;
    const remote = window.require ? window.require("electron").remote : void 0;
    const nt = remote && remote.nativeTheme;
    if (!nt) return;
    const prev = nt.themeSource;
    const sync = () => {
      const v = document.body.classList.contains("theme-dark") ? "dark" : "light";
      if (nt.themeSource === v) return;
      nt.themeSource = v;
      if (import_obsidian5.Platform.isMacOS) this.vibNudge();
    };
    sync();
    const mo = new MutationObserver(sync);
    mo.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    this.acrylicThemeOff = () => {
      mo.disconnect();
      nt.themeSource = prev;
    };
  },
  // Obsidian 의 닫힌 폴더 기호를 마스크용 그림 주소로 (한 번만 만든다)
  folderLineUrl() {
    if (this.folderLine) return this.folderLine;
    const svg = (0, import_obsidian5.getIcon)("folder-closed");
    if (!svg) return "";
    svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    svg.setAttribute("stroke", "#000");
    svg.removeAttribute("class");
    this.folderLine = `url("data:image/svg+xml,${encodeURIComponent(new XMLSerializer().serializeToString(svg))}")`;
    return this.folderLine;
  },
  applyBodyState(doc) {
    const b = doc.body;
    if (!b) return;
    b.classList.add("lg-ui");
    b.classList.toggle("lg-tg-accent", this.settings.toggleColor === "accent");
    const g = this.settings.glassLevel;
    const f = g <= 0 ? 0 : 0.45 + (Math.min(g, 5) - 1) * 0.35 / 4;
    b.style.setProperty("--lg-fade", String(+f.toFixed(4)));
    b.style.setProperty("--lg-frost", String(Math.max(0, g - 5) / 10 * 0.3));
    b.style.setProperty("--lg-hover-k", this.settings.hoverLarge ? "1" : "0");
    b.classList.toggle("lg-show-path", !!this.settings.showPath);
    b.classList.toggle("lg-web-under", !!this.settings.webTint && !import_obsidian5.Platform.isPhone);
    b.classList.toggle("lg-mini-bar", !!this.settings.miniBar);
    b.classList.toggle("lg-pop-opaque", !!this.settings.popupOpaque);
    b.classList.toggle("lg-wc-compact", !!this.settings.compactWindowControls);
    this.applyDevicePx(doc);
    const s = this.settings;
    const color = s.tint === "accent" ? "var(--interactive-accent)" : s.tint === "obsidian" ? OBSIDIAN_PURPLE : s.tintColor;
    b.classList.toggle("lg-tinted", s.tint !== "none");
    b.style.setProperty("--lg-tint-color", color);
    b.style.setProperty("--lg-tint-p", `${s.tintLevel * 4}%`);
    b.classList.toggle("lg-tint-ink-light", s.tint !== "none" && !!s.tintWhiteInk);
    b.style.removeProperty("--lg-active-tab-color");
    b.classList.toggle("lg-tab-plain", this.tabPlain());
    b.classList.toggle("lg-tab-wide", !!s.tabWide);
    b.classList.toggle("lg-tab-names", !!s.tabNames);
    b.classList.toggle("lg-ficon-none", s.fileIcons === "none");
    b.classList.toggle("lg-ficon-line", s.fileIcons === "line");
    const line = s.fileIcons === "line" ? this.folderLineUrl() : "";
    if (line) b.style.setProperty("--lg-folder-line", line);
    else b.style.removeProperty("--lg-folder-line");
    b.classList.toggle("lg-no-guides", s.fileGuides === false);
    b.classList.toggle("lg-hrule", !!s.headingRule);
    b.classList.toggle("lg-nav-compact", !!s.navCompact);
    b.style.removeProperty("--lg-tab-on-ink");
    b.classList.toggle("lg-task-ring", s.taskStyle === "ring");
    if (s.taskColor === "yellow") b.style.removeProperty("--lg-task-color");
    else b.style.setProperty("--lg-task-color", s.taskColor === "accent" ? "var(--interactive-accent)" : s.taskColorCustom);
    this.applyFolderColor(doc);
  },
  // 테마가 꺼지거나 플러그인을 끌 때의 정리 (자식 Component 의 onunload. 등록해 둔 정리가 끝난 뒤에 돈다, 예전 플러그인 onunload 와 같은 순서)
  teardown() {
    this.applyAcrylic(false);
    this.unloaded = true;
    if (this.saveTimer) {
      window.clearTimeout(this.saveTimer);
      this.saveTimer = 0;
      void this.saveData(this.settings);
    }
    if (this.frame) window.cancelAnimationFrame(this.frame);
    if (this.fcFrame) window.cancelAnimationFrame(this.fcFrame);
    this.frame = this.fcFrame = 0;
    if (this.pendingRelease) this.pendingRelease.forEach((f) => f());
    this.observers.forEach((o) => o.disconnect());
    this.refractor.destroy();
    for (const doc of this.docs) {
      if (!doc.body) continue;
      doc.querySelectorAll(".workspace-tab-header-container-inner").forEach((el) => el.style.removeProperty("--lg-snap-y"));
      doc.querySelectorAll(".lg-kb-group").forEach((g) => {
        while (g.firstChild) g.parentElement.insertBefore(g.firstChild, g);
      });
      doc.querySelectorAll(".lg-kb-searching").forEach((el) => el.classList.remove("lg-kb-searching"));
      doc.querySelectorAll(".lg-kb-search-btn").forEach((el) => el.classList.remove("lg-kb-search-btn"));
      doc.querySelectorAll(".lg-dashed").forEach((el) => el.classList.remove("lg-dashed"));
      doc.querySelectorAll(".bases-toolbar .lg-on").forEach((el) => el.classList.remove("lg-on"));
      doc.querySelectorAll(".lg-tab-tools").forEach((g) => {
        while (g.firstChild) g.parentElement.insertBefore(g.firstChild, g);
      });
    }
    if (this.webCard) this.closeWebCard(true);
    this.webUninject();
    for (const doc of this.docs) if (doc.body) doc.querySelectorAll(".workspace-tabs").forEach((t) => this.navSearchOut(t));
    for (const doc of this.docs) if (doc.body) doc.querySelectorAll(".lg-path-text").forEach((el) => this.returnTitle(el));
    for (const doc of this.docs) {
      if (!doc.body) continue;
      doc.querySelectorAll(".workspace-tabs").forEach((t) => {
        if (t.lgWebTab) this.webTab(t, null, false);
      });
      doc.querySelectorAll(".lg-web-head").forEach((h) => h.classList.add("view-header-always-show"));
    }
    for (const doc of this.docs) {
      if (!doc.body) continue;
      doc.querySelectorAll("." + INJECTED).forEach((el) => el.remove());
      doc.querySelectorAll('[class*="lg-"]').forEach((el) => {
        const cls = strs(el.classList).filter((c) => c.startsWith("lg-"));
        if (cls.length) el.classList.remove(...cls);
      });
      doc.querySelectorAll('[style*="--lg-"]').forEach((el) => {
        const props = [];
        for (let i = 0; i < el.style.length; i++) if (el.style[i].startsWith("--lg-")) props.push(el.style[i]);
        props.forEach((p) => el.style.removeProperty(p));
      });
      const win = doc.defaultView || window;
      const scrub = (target) => {
        const o = target;
        for (const k of Object.keys(o)) {
          if (!/^lg[A-Z]/.test(k)) continue;
          const v = o[k];
          try {
            if (v && typeof v === "object" && typeof v.cancel === "function") v.cancel();
            else if (v && typeof v === "object" && typeof v.disconnect === "function") v.disconnect();
            else if (typeof v === "number" && /Timer/.test(k)) win.clearTimeout(v);
            else if (typeof v === "number" && /Loop|Frame|Raf/.test(k)) win.cancelAnimationFrame(v);
          } catch {
          }
          delete o[k];
        }
      };
      scrub(doc);
      doc.querySelectorAll("*").forEach(scrub);
    }
    this.app.workspace.iterateAllLeaves((leaf) => leaf.view && (() => {
      const v = leaf.view;
      for (const k of Object.keys(v)) if (/^lg[A-Z]/.test(k)) delete v[k];
    })());
  },
  applySettings() {
    for (const doc of this.docs) this.applyBodyState(doc);
    this.applyAcrylic(true);
    this.refractor.setEnabled(this.refractOn());
    this.requestRefresh();
  },
  // 설정은 바로 반영하고, 파일 저장은 0.4초 모아서 한 번 한다 (검토 지적: 색 고르기·글자 칸은 입력할 때마다 data.json 을 썼다). 끌 때 남은 저장은 바로 한다
  async saveSettings() {
    this.applySettings();
    if (this.saveTimer) window.clearTimeout(this.saveTimer);
    this.saveTimer = window.setTimeout(() => {
      this.saveTimer = 0;
      void this.saveData(this.settings);
    }, 400);
  },
  // 이벤트가 몰려 와도 한 프레임에 한 번만 갱신
  requestRefresh() {
    if (this.unloaded) return;
    if (this.frame) return;
    this.frame = window.requestAnimationFrame(() => {
      this.frame = null;
      this.refresh();
    });
  },
  refresh() {
    if (this.unloaded) return;
    const ws = this.app.workspace;
    if (this.shared && this.shared.folderColorsByName && this.hasNewExplorer()) this.requestFolderColors();
    if (!import_obsidian5.Platform.isMobile) {
      this.setupSidebar(ws.leftSplit, "left");
      this.setupSidebar(ws.rightSplit, "right");
    } else {
      this.markTabList(ws.leftSplit, "left");
      this.markTabList(ws.rightSplit, "right");
      this.watchDrawerTabs(ws.leftSplit);
      this.watchDrawerTabs(ws.rightSplit);
      this.setupDrawerMore(ws.leftSplit);
      this.setupDrawerMore(ws.rightSplit);
    }
    this.markBareHeads(ws.leftSplit);
    this.markBareHeads(ws.rightSplit);
    if (!import_obsidian5.Platform.isMobile) {
      const tgl = ws.containerEl.querySelector(".sidebar-toggle-button.mod-left > .clickable-icon");
      if (tgl && !tgl.classList.contains("lg-rib-tgl")) tgl.classList.add("lg-rib-tgl");
    }
    if (!import_obsidian5.Platform.isPhone) {
      ws.rootSplit.containerEl.querySelectorAll(".workspace-tabs").forEach((tabsEl) => this.setupRootTabs(tabsEl));
      for (const doc of this.docs) {
        if (doc === document || !doc.body) continue;
        doc.querySelectorAll(".workspace-split.mod-root .workspace-tabs").forEach((tabsEl) => this.setupRootTabs(tabsEl));
      }
    }
    if (!import_obsidian5.Platform.isPhone) ws.getLeavesOfType("kanban").forEach((l) => l.view instanceof import_obsidian5.ItemView && this.setupKanban(l.view));
    if (!import_obsidian5.Platform.isPhone) ws.getLeavesOfType("bases").forEach((l) => l.view instanceof import_obsidian5.ItemView && this.setupBases(l.view));
    this.refractor.prune();
    if (this.refractOn()) {
      for (const [sel, strength] of import_obsidian5.Platform.isMobile ? REFRACT_TARGETS.concat(REFRACT_TARGETS_MOBILE) : REFRACT_TARGETS) {
        document.querySelectorAll(sel).forEach((el) => {
          if (el.matches(".titlebar-button-container.mod-right")) return;
          this.refractor.attach(el, strength, false);
        });
      }
      this.wcRefract(document, document.body.classList.contains("lg-wc-hover"));
    }
    this.markStructure();
  },
  // 테마가 구조로 판정하던 것(:has, 스토어 린트 권고)을 플러그인이 표시로 알린다. 요소가 바뀌면 그 자리에서(그리기 전) 다시 판정한다.
  // - .lg-solo: 버튼 묶음에 버튼이 하나만 남음(앞으로가 숨은 뒤로·앞으로, 실행 버튼 하나, 칸반 버튼·탭 줄 오른쪽 묶음 하나) → 원 모양
  // - .lg-tab-single: 편집창 탭 줄에 (닫히는 복제본을 빼고) 탭이 하나뿐 → 트랙 없이 선택 알약만
  // - .lg-split-multi: 편집창이 나뉨(창 둘 이상 또는 다시 나뉜 묶음) → 분할 구분선 모서리를 그린다
  markStructure() {
    for (const doc of this.docs) {
      if (!doc.body) continue;
      doc.querySelectorAll(".lg-tab-nav").forEach((el) => this.watchMark(el, "lg-solo", () => !!el.querySelector(":scope > .lg-tab-forward.lg-nav-hide"), true));
      doc.querySelectorAll(".lg-nav-run").forEach((el) => this.watchMark(el, "lg-solo", () => el.childElementCount === 1 && el.firstElementChild.classList.contains("clickable-icon")));
      doc.querySelectorAll(".view-actions > .lg-kb-group, .workspace-tab-header-container > .lg-tab-tools").forEach((el) => this.watchMark(el, "lg-solo", () => el.childElementCount === 1));
      doc.querySelectorAll(".mod-root .workspace-tab-header-container-inner").forEach(
        (el) => this.watchMark(el, "lg-tab-single", () => el.querySelectorAll(":scope > .workspace-tab-header:not(.lg-tab-leaving)").length < 2, true)
      );
      doc.querySelectorAll(".workspace-split.mod-root").forEach(
        (el) => this.watchMark(el, "lg-split-multi", () => el.querySelectorAll(":scope > .workspace-tabs").length > 1 || !!el.querySelector(":scope > .workspace-split"))
      );
    }
  },
  // el 에 cls 를 test() 결과대로 붙이고, 자식이 바뀌면(attrs: 자식들의 클래스가 바뀌어도) 다시 판정한다. 요소마다 감시는 하나
  watchMark(el, cls, test, attrs) {
    if (!this.markWatched) this.markWatched = /* @__PURE__ */ new WeakMap();
    const sync = () => el.classList.toggle(cls, !!test());
    sync();
    if (this.markWatched.has(el)) return;
    const win = el.ownerDocument.defaultView || window;
    const obs = new win.MutationObserver(sync);
    obs.observe(el, attrs ? { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] } : { childList: true });
    this.markWatched.set(el, obs);
    this.observers.push(obs);
  }
};

// src/events.ts
var import_obsidian6 = require("obsidian");
var eventsMethods = {
  // 별도 창(설정·커뮤니티)의 창 제목을 왼쪽 요소 끝과 창 제어 알약 사이 가운데에 둔다
  placeTitle(doc) {
    try {
      const t = doc.querySelector(".titlebar-text");
      const ctr = doc.querySelector(".titlebar-button-container.mod-right");
      if (!t || !ctr) return;
      let leftEdge = null;
      const search = doc.querySelector(".mod-community-modal .community-modal-search");
      if (search) {
        const last = search.lastElementChild || search;
        leftEdge = last.getBoundingClientRect().right;
      } else {
        const side = doc.querySelector(".modal.mod-settings .vertical-tab-header");
        if (side) leftEdge = side.getBoundingClientRect().right;
      }
      if (leftEdge == null) {
        t.style.removeProperty("--lg-tt-s");
        t.style.removeProperty("--lg-tt-e");
        return;
      }
      const W = doc.documentElement.clientWidth;
      const sPx = `${Math.round(leftEdge + 12)}px`;
      const ePx = `${Math.round(W - ctr.getBoundingClientRect().left + 12)}px`;
      if (t.style.getPropertyValue("--lg-tt-s") !== sPx) t.style.setProperty("--lg-tt-s", sPx);
      if (t.style.getPropertyValue("--lg-tt-e") !== ePx) t.style.setProperty("--lg-tt-e", ePx);
    } catch {
    }
  },
  // 한 창(document)에 호버 자석·스크롤바·토글 애니메이션을 붙인다
  // 끌기 중 자동 스크롤 (패널 목록). 테마는 목록을 떠 있는 탭 줄·보관함 줄 밑까지 늘려 두므로, 목록의 실제 위·아래 끝이
  // 그 줄들에 가려 Obsidian(브라우저)의 끝 근처 자동 스크롤이 걸리지 않았다. 보이는 위·아래 끝에서 DRAG_SCROLL_ZONE 안에 두면
  // 가까울수록 빠르게 스크롤한다
  attachDragScroll(doc, win) {
    let pos = null;
    let frame = 0;
    const visibleEdges = (sc) => {
      const r = sc.getBoundingClientRect();
      let top = r.top;
      let bottom = r.bottom;
      const tabs = sc.closest(".workspace-tabs");
      const head = tabs && tabs.querySelector(":scope > .workspace-tab-header-container");
      if (head && head.getClientRects().length) top = Math.max(top, head.getBoundingClientRect().bottom);
      const split = sc.closest(".mod-left-split");
      const vault = split && split.querySelector(".workspace-sidedock-vault-profile");
      if (vault && vault.getClientRects().length) {
        const vr = vault.getBoundingClientRect();
        if (vr.top < bottom && vr.bottom > top) bottom = Math.min(bottom, vr.top);
      }
      return { top, bottom, left: r.left, right: r.right };
    };
    const scrollerAt = (x, y) => {
      for (const sc of doc.querySelectorAll(":is(.mod-left-split, .mod-right-split) :is(.nav-files-container, .workspace-leaf-content > .view-content, .search-result-container)")) {
        if (!sc.getClientRects().length || sc.scrollHeight <= sc.clientHeight + 1) continue;
        const r = sc.getBoundingClientRect();
        if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return sc;
      }
      return null;
    };
    const tick = () => {
      frame = 0;
      if (!pos) return;
      const sc = scrollerAt(pos.x, pos.y);
      if (!sc) return;
      const e = visibleEdges(sc);
      let v = 0;
      if (pos.y < e.top + DRAG_SCROLL_ZONE) v = -DRAG_SCROLL_MAX * Math.min(1, (e.top + DRAG_SCROLL_ZONE - pos.y) / DRAG_SCROLL_ZONE);
      else if (pos.y > e.bottom - DRAG_SCROLL_ZONE) v = DRAG_SCROLL_MAX * Math.min(1, (pos.y - (e.bottom - DRAG_SCROLL_ZONE)) / DRAG_SCROLL_ZONE);
      if (!v) return;
      const before = sc.scrollTop;
      sc.scrollTop += v;
      if (sc.scrollTop !== before) frame = win.requestAnimationFrame(tick);
    };
    this.registerDomEvent(doc, "dragover", (e) => {
      pos = { x: e.clientX, y: e.clientY };
      if (!frame) frame = win.requestAnimationFrame(tick);
    }, { passive: true });
    const end = () => {
      pos = null;
      if (frame) win.cancelAnimationFrame(frame);
      frame = 0;
    };
    this.registerDomEvent(doc, "dragend", end);
    this.registerDomEvent(doc, "drop", end);
    this.registerDomEvent(doc, "dragleave", (e) => {
      if (!e.relatedTarget) end();
    });
  },
  attachDoc(doc) {
    if (this.unloaded) return;
    if (this.docs.has(doc)) return;
    this.docs.add(doc);
    try {
      this.attachDocInner(doc);
    } catch (err) {
      console.error("[glass-shelf] attach-fail", err);
    }
  },
  attachDocInner(doc) {
    const win = doc.defaultView || window;
    if (!import_obsidian6.Platform.isMobile) this.attachDragScroll(doc, win);
    this.applyBodyState(doc);
    const watchModal = (m) => {
      if (!m.classList || !(m.classList.contains("modal-container") || m.classList.contains("bases-toolbar-menu"))) return;
      if (!this.ddWatched) this.ddWatched = /* @__PURE__ */ new WeakSet();
      if (this.ddWatched.has(m)) return;
      this.ddWatched.add(m);
      this.markDropdownRows(m);
      const o = new win.MutationObserver(() => this.markDropdownRows(m));
      o.observe(m, { childList: true, subtree: true });
      this.observers.push(o);
    };
    els(doc.body.children).forEach(watchModal);
    const bodyObs = new win.MutationObserver((recs) => recs.forEach((r) => r.addedNodes.forEach(watchModal)));
    bodyObs.observe(doc.body, { childList: true });
    this.observers.push(bodyObs);
    this.registerDomEvent(
      doc,
      "pointerdown",
      (e) => {
        const t = e.target;
        if (!isEl(t) || t.closest(".menu, .modal-container, .notice-container, .tooltip")) return;
        doc.body.classList.toggle("lg-explorer-on", !!t.closest('.workspace-leaf-content[data-type="file-explorer"]'));
        const sp = t.closest(".workspace-split.mod-sidedock");
        doc.querySelectorAll(".workspace-split.mod-sidedock").forEach((s) => s.classList.toggle("lg-split-on", s === sp));
      },
      true
    );
    this.register(() => {
      doc.body.classList.remove("lg-explorer-on");
      doc.querySelectorAll(".lg-split-on").forEach((s) => s.classList.remove("lg-split-on"));
    });
    if (!import_obsidian6.Platform.isPhone) this.registerDomEvent(doc, "scroll", (e) => this.onMiniScroll(e.target), { capture: true, passive: true });
    if (!import_obsidian6.Platform.isPhone)
      this.registerDomEvent(
        doc,
        "wheel",
        (e) => {
          const t = e.target;
          if (isEl(t) && t.closest(".menu")) return;
          if (doc.body.querySelector(":scope > .menu:not(.lg-menu-ghost)"))
            doc.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", code: "Escape", keyCode: 27, bubbles: true, cancelable: true }));
        },
        { capture: true, passive: true }
      );
    if (!import_obsidian6.Platform.isMobile) {
      const sb = doc.querySelector(".status-bar");
      if (sb) {
        const syncStatus = () => {
          const r = sb.getBoundingClientRect();
          const h = r.height > 0 ? Math.max(0, doc.documentElement.clientHeight - r.top) : 0;
          doc.body.style.setProperty("--lg-status-h", `${Math.round(h)}px`);
        };
        const ro = new win.ResizeObserver(syncStatus);
        ro.observe(sb);
        ro.observe(doc.body);
        this.observers.push(ro);
        syncStatus();
      }
    }
    let wcTimer = 0;
    const inWc = (t) => t instanceof win.Element && !!t.closest(".titlebar-button-container.mod-right");
    this.registerDomEvent(doc, "pointerover", (e) => {
      if (!inWc(e.target)) return;
      win.clearTimeout(wcTimer);
      if (!doc.body.classList.contains("lg-wc-hover")) this.wcRefract(doc, true);
      doc.body.classList.add("lg-wc-hover");
    }, { passive: true });
    this.registerDomEvent(doc, "pointerout", (e) => {
      if (!inWc(e.target) || inWc(e.relatedTarget)) return;
      win.clearTimeout(wcTimer);
      wcTimer = win.setTimeout(() => {
        doc.body.classList.remove("lg-wc-hover");
        wcTimer = win.setTimeout(() => this.wcRefract(doc, false), 160);
      }, 150);
    }, { passive: true });
    let magnetEl = null;
    let magnetFrame = null;
    let lastMove = null;
    let magnetRect = null;
    let magnetAt = 0;
    const dropRect = () => {
      magnetRect = null;
    };
    this.registerDomEvent(doc, "scroll", dropRect, { capture: true, passive: true });
    this.registerDomEvent(win, "resize", dropRect, { passive: true });
    this.registerDomEvent(win, "resize", () => this.applyDevicePx(doc), { passive: true });
    const magnetBox = (el) => {
      const q = el.getBoundingClientRect();
      if (!el.matches(".lg-kb-searching .lg-kb-search-btn, .lg-nav-search")) return q;
      return { left: q.left, top: q.top, width: q.height, height: q.height, near: true };
    };
    const resetMagnet = (el) => {
      if (!el) return;
      el.style.removeProperty("--lg-mx");
      el.style.removeProperty("--lg-my");
      if (el.closest(".lg-holes")) win.setTimeout(() => el !== magnetEl && el.style.removeProperty("--lg-refract-h"), 260);
      else el.style.removeProperty("--lg-refract-h");
    };
    if (!import_obsidian6.Platform.isMobile) this.registerDomEvent(
      doc,
      "pointermove",
      (e) => {
        lastMove = e;
        if (magnetFrame) return;
        magnetFrame = win.requestAnimationFrame(() => {
          magnetFrame = null;
          const ev = lastMove;
          const hit = isEl(ev.target) ? ev.target.closest(HOVER_GLASS) : null;
          const el = hit && hit.matches(".workspace-tab-header") && hit.closest(".lg-tab-list") ? null : hit;
          if (el !== magnetEl) {
            resetMagnet(magnetEl);
            magnetEl = el;
            magnetRect = null;
            if (el) {
              magnetRect = magnetBox(el);
              magnetAt = win.performance.now();
              this.hoverGlassInto(el);
              this.refractHover(el);
            }
          }
          if (!el) return;
          const now = win.performance.now();
          if (!magnetRect || now - magnetAt > 500) {
            magnetRect = magnetBox(el);
            magnetAt = now;
          }
          const r = magnetRect;
          const rx = (ev.clientX - (r.left + r.width / 2)) / (r.width / 2);
          const ry = (ev.clientY - (r.top + r.height / 2)) / (r.height / 2);
          const away = r.near && (Math.abs(rx) > 1 || Math.abs(ry) > 1);
          const nx = away ? 0 : Math.max(-1, Math.min(1, rx));
          const ny = away ? 0 : Math.max(-1, Math.min(1, ry));
          const mx = nx * Math.min(7, r.width * 0.12);
          const my = ny * Math.min(4, r.height * 0.14);
          el.style.setProperty("--lg-mx", `${mx.toFixed(1)}px`);
          el.style.setProperty("--lg-my", `${my.toFixed(1)}px`);
        });
      },
      { passive: true }
    );
    this.register(() => resetMagnet(magnetEl));
    this.registerDomEvent(
      doc,
      "scroll",
      (e) => {
        const t = e.target;
        if (!isEl(t)) return;
        t.lgScrollAt = win.performance.now();
        if (t.lgScrollTimer) return;
        t.classList.add("lg-scrolling");
        const check = () => {
          const left = 900 - (win.performance.now() - t.lgScrollAt);
          if (left > 0) {
            t.lgScrollTimer = win.setTimeout(check, left);
          } else {
            t.lgScrollTimer = null;
            t.classList.remove("lg-scrolling");
          }
        };
        t.lgScrollTimer = win.setTimeout(check, 900);
      },
      { capture: true, passive: true }
    );
    const pressFx = (e) => {
      if (e.button !== 0 || !isEl(e.target)) return;
      const menuItem = e.target.closest(".menu .menu-item:not(.is-disabled):not(.is-label)");
      if (menuItem) {
        const menu = menuItem.closest(".menu");
        const m = menu.getBoundingClientRect();
        const far = Math.hypot(Math.max(e.clientX - m.left, m.right - e.clientX), Math.max(e.clientY - m.top, m.bottom - e.clientY));
        return this.pressRipple(menu, e, far * 2 / 0.8, "lg-ripple-menu", true, MENU_RIPPLE_FROM);
      }
      const kbAdd = e.target.closest(".kanban-plugin__new-item-button");
      if (kbAdd) return this.pressKanbanAdd(kbAdd);
      const laneBtn = e.target.closest(".kanban-plugin__lane-input-actions button");
      if (laneBtn) return this.pressPill(laneBtn);
      if (import_obsidian6.Platform.isMobile && this.pressMobile(e.target)) return;
      const modalX = e.target.closest("body:not(.is-popout-modal) .modal:is(.mod-settings, .mod-community-modal) > :is(.modal-close-button, .modal-header-button)");
      if (modalX) return this.pressPopSelf(modalX);
      if (e.target.closest(".lg-nav-find .search-input-container")) return;
      const pop0 = e.target.closest(PRESS_POP);
      const pop = pop0 && !pop0.closest(".lg-tab-tools") ? pop0 : null;
      const kbSearch = e.target.closest(".lg-kb-search-btn, .lg-nav-find");
      if (kbSearch) return this.pressKbSearch(kbSearch);
      if (pop) {
        const anims = this.pressPop(pop);
        if (pop.matches(PANEL_TOGGLES)) this.handoffPop(pop, anims);
        return;
      }
      const field = e.target.closest('.workspace-leaf-content[data-type="search"] .search-input-container');
      if (field) {
        const input = field.querySelector("input");
        if (input && doc.activeElement !== input) this.pressField(field, e);
        return;
      }
      const sc = e.target.closest(PRESS_SCALE);
      if (sc) this.pressScale(sc);
      const rip = e.target.closest(PRESS_RIPPLE);
      if (rip) this.pressRipple(rip, e);
      else if (this.tabPlain()) {
        const tab = e.target.closest(":is(.mod-left-split, .mod-right-split) .workspace-tab-header-container .workspace-tab-header");
        if (tab && !tab.closest(".lg-tab-list")) {
          const pill = tab.closest(PRESS_PILL);
          const d = (pill ? pill.offsetHeight : tab.offsetHeight) * TAB_RIPPLE_K;
          const from = Math.min(1, Math.max(tab.offsetWidth, tab.offsetHeight) / d);
          this.pressRipple(tab, e, d, "lg-ripple-tab", true, from.toFixed(3));
        }
      }
    };
    let holding = false;
    let held = [];
    let slowed = [];
    let heldPlay = [];
    let holdRaf = 0;
    let holdTimer = 0;
    const hasOffsets = (a, x, y) => {
      const ef = a.effect;
      const k = ef && typeof ef.getKeyframes === "function" ? ef.getKeyframes() : [];
      return k.some((f) => Math.abs((f.offset ?? -1) - x) < 1e-3) && k.some((f) => Math.abs((f.offset ?? -1) - y) < 1e-3);
    };
    const holdScan = () => {
      if (!holding) return;
      for (const a of doc.getAnimations()) {
        if (a.playState !== "running" || held.includes(a) || heldPlay.includes(a)) continue;
        const tgt = a.effect?.target;
        const menuRip = !!tgt && !!tgt.parentElement?.classList.contains("lg-ripple-menu");
        const span = menuRip ? [RIPPLE_HOLD, RIPPLE_HOLD] : hasOffsets(a, 0.34, 0.46) ? [0.34, 0.46] : hasOffsets(a, 0.2, 0.55) ? [0.2, 0.55] : null;
        if (!span || !a.effect) continue;
        const prog = () => Number(a.effect.getComputedTiming().progress) || 0;
        const p = prog();
        if (p < span[0]) {
          if (p >= span[0] - HOLD_EASE_SPAN) {
            a.updatePlaybackRate(Math.max(0.15, (span[0] - p) / HOLD_EASE_SPAN));
            if (!slowed.includes(a)) slowed.push(a);
          }
          continue;
        }
        a.pause();
        const goal = (span[0] + span[1]) / 2;
        let lo = 0, hi = Number(a.currentTime) || 0;
        for (let i = 0; i < 14; i++) {
          const mid = (lo + hi) / 2;
          a.currentTime = mid;
          if (prog() < goal) lo = mid;
          else hi = mid;
        }
        a.currentTime = hi;
        (menuRip ? heldPlay : held).push(a);
      }
      holdRaf = win.requestAnimationFrame(holdScan);
    };
    const holdRelease = () => {
      holding = false;
      win.cancelAnimationFrame(holdRaf);
      win.clearTimeout(holdTimer);
      for (const a of held) {
        try {
          const ef = a.effect;
          const target = ef && ef.target;
          if (!ef || !target || !target.isConnected) {
            a.cancel();
            continue;
          }
          const kf = ef.getKeyframes();
          const peak = kf.find((f) => Math.abs((f.offset ?? -1) - 0.34) < 1e-3) || kf.find((f) => Math.abs((f.offset ?? -1) - 0.2) < 1e-3);
          const from = {};
          if (peak) {
            for (const [k, v] of Object.entries(peak)) if (!["offset", "computedOffset", "easing", "composite"].includes(k)) from[k] = v;
          }
          a.cancel();
          target.animate([{ ...from, offset: 0 }], { duration: HOLD_RETURN_MS, easing: EASE.press, pseudoElement: ef.pseudoElement || void 0 });
        } catch {
        }
      }
      held = [];
      for (const a of heldPlay) {
        try {
          a.updatePlaybackRate(1);
          a.play();
        } catch {
        }
      }
      heldPlay = [];
      for (const a of slowed) {
        try {
          if (a.playState !== "idle") a.updatePlaybackRate(1);
        } catch {
        }
      }
      slowed = [];
    };
    this.registerDomEvent(doc, "pointerdown", (e) => {
      if (e.button !== 0) return;
      holdRelease();
      holding = true;
      holdRaf = win.requestAnimationFrame(holdScan);
      holdTimer = win.setTimeout(holdRelease, 5e3);
    }, { capture: true });
    const followMenu = (x, y) => {
      doc.querySelectorAll(".lg-ripple-menu > .lg-ripple-dot").forEach((dot) => {
        const host = dot.parentElement && dot.parentElement.parentElement;
        if (!host) return;
        const r = host.getBoundingClientRect();
        dot.style.left = `${x - r.left}px`;
        dot.style.top = `${y - r.top}px`;
      });
    };
    if (import_obsidian6.Platform.isMobile) {
      this.registerDomEvent(doc, "touchmove", (e) => {
        if (holding && e.touches[0]) followMenu(e.touches[0].clientX, e.touches[0].clientY);
      }, { capture: true, passive: true });
      this.registerDomEvent(doc, "touchend", holdRelease, { capture: true, passive: true });
      this.registerDomEvent(doc, "touchcancel", holdRelease, { capture: true, passive: true });
    }
    this.registerDomEvent(doc, "pointermove", (e) => {
      if (!holding) return;
      followMenu(e.clientX, e.clientY);
    }, { capture: true, passive: true });
    this.registerDomEvent(doc, "pointerup", holdRelease, { capture: true });
    this.registerDomEvent(doc, "pointercancel", (e) => {
      if (import_obsidian6.Platform.isMobile && e.pointerType === "touch" && doc.querySelector(".lg-ripple-menu")) return;
      holdRelease();
    }, { capture: true });
    this.register(holdRelease);
    if (!import_obsidian6.Platform.isMobile) {
      this.registerDomEvent(doc, "pointerdown", pressFx, { capture: true });
    } else {
      let pend = null;
      const drop = () => {
        if (!pend) return;
        win.clearTimeout(pend.t);
        pend = null;
      };
      const fire = () => {
        if (!pend) return;
        const ev = pend.e;
        drop();
        pressFx(ev);
      };
      this.registerDomEvent(doc, "pointerdown", (e) => {
        drop();
        if (e.button !== 0 || !isEl(e.target)) return;
        pend = { e, x: e.clientX, y: e.clientY, t: win.setTimeout(fire, PRESS_DELAY_MS) };
      }, { capture: true, passive: true });
      this.registerDomEvent(doc, "pointermove", (e) => {
        if (pend && Math.hypot(e.clientX - pend.x, e.clientY - pend.y) > PRESS_SLOP) drop();
      }, { capture: true, passive: true });
      this.registerDomEvent(doc, "pointercancel", drop, { capture: true, passive: true });
      this.registerDomEvent(doc, "pointerup", fire, { capture: true, passive: true });
      this.register(drop);
    }
    this.registerDomEvent(
      doc,
      "click",
      (e) => {
        if (!isEl(e.target)) return;
        const col = e.target.closest(".kanban-plugin__lane-collapse");
        if (col) this.animateLaneCollapse(col);
      },
      { capture: true }
    );
    let lastPress = null;
    this.registerDomEvent(
      doc,
      "pointerdown",
      (e) => {
        lastPress = { x: e.clientX, y: e.clientY, t: win.performance.now(), target: e.target };
      },
      { capture: true, passive: true }
    );
    const openSelect = (sel) => {
      lastPress = { x: 0, y: 0, t: win.performance.now(), target: sel };
      this.openDropdownMenu(sel);
    };
    this.registerDomEvent(
      doc,
      "mousedown",
      (e) => {
        if (import_obsidian6.Platform.isMobile || e.button !== 0 || !isEl(e.target)) return;
        const sel = e.target.closest("select.dropdown");
        if (!sel || sel.disabled) return;
        e.preventDefault();
        sel.lgSkipClick = sel.classList.contains("has-active-menu");
      },
      { capture: true }
    );
    this.registerDomEvent(
      doc,
      "click",
      (e) => {
        if (import_obsidian6.Platform.isMobile || e.button !== 0 || !isEl(e.target)) return;
        const sel = e.target.closest("select.dropdown");
        if (!sel || sel.disabled) return;
        e.preventDefault();
        if (sel.lgSkipClick || sel.classList.contains("has-active-menu")) {
          sel.lgSkipClick = false;
          return;
        }
        win.setTimeout(() => openSelect(sel), 0);
      },
      { capture: true }
    );
    if (import_obsidian6.Platform.isMobile) {
      let touch = null;
      this.registerDomEvent(
        doc,
        "touchstart",
        (e) => {
          const t = e.touches[0];
          const sel = isEl(e.target) && e.target.closest("select.dropdown");
          touch = sel && !sel.disabled && e.touches.length === 1 ? { sel, x: t.clientX, y: t.clientY } : null;
        },
        { capture: true, passive: true }
      );
      this.registerDomEvent(
        doc,
        "touchend",
        (e) => {
          const p = touch;
          touch = null;
          const t = e.changedTouches[0];
          if (!p || !t || Math.hypot(t.clientX - p.x, t.clientY - p.y) > 10) return;
          if (!isEl(e.target) || e.target.closest("select.dropdown") !== p.sel) return;
          e.preventDefault();
          if (!p.sel.classList.contains("has-active-menu")) openSelect(p.sel);
        },
        { capture: true }
      );
      this.registerDomEvent(
        doc,
        "click",
        (e) => {
          const sel = isEl(e.target) && e.target.closest("select.dropdown");
          if (!sel || sel.disabled) return;
          e.preventDefault();
          if (!sel.classList.contains("has-active-menu")) openSelect(sel);
        },
        { capture: true }
      );
    }
    this.registerDomEvent(
      doc,
      "keydown",
      (e) => {
        if (import_obsidian6.Platform.isMobile || !isEl(e.target) || !e.target.matches("select.dropdown")) return;
        const sel = e.target;
        if (sel.disabled || sel.classList.contains("has-active-menu")) return;
        if (e.key === " " || e.key === "Enter" || e.altKey && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
          e.preventDefault();
          openSelect(sel);
        }
      },
      { capture: true }
    );
    this.registerDomEvent(
      doc,
      "contextmenu",
      (e) => {
        lastPress = { x: e.clientX, y: e.clientY, t: win.performance.now(), target: e.target };
      },
      { capture: true, passive: true }
    );
    const isMenu = (n) => isEl(n) && n.classList.contains("menu") && !n.classList.contains("lg-menu-ghost");
    const menuObs = new win.MutationObserver((recs) => {
      for (const r of recs) {
        for (const n of r.addedNodes) {
          if (isMenu(n)) {
            const pt = lastPress && lastPress.target;
            if (import_obsidian6.Platform.isMobile && !(isEl(pt) && pt.closest(".menu")) && els(doc.querySelectorAll(".menu")).some((m) => m !== n && !m.classList.contains("lg-menu-ghost"))) {
              this.tellMenus(n, "click");
            }
            if (!import_obsidian6.Platform.isPhone) this.setupMenu(n, lastPress);
          } else if (isEl(n) && n.classList.contains("mod-search-suggestion")) this.attachSearchSuggest(n, doc);
          else if (isEl(n) && n.classList.contains("suggestion-container")) this.attachWebSuggest(n, doc);
          else if (isEl(n) && n.classList.contains("modal-container")) this.modalRefract(doc);
        }
        for (const n of r.removedNodes) if (isMenu(n) && !import_obsidian6.Platform.isPhone) this.closeMenu(n, doc);
      }
      if (import_obsidian6.Platform.isPhone) phonePause();
    });
    menuObs.observe(doc.body, { childList: true });
    this.observers.push(menuObs);
    const phonePause = () => {
      const menu = els(doc.querySelectorAll(".menu")).some((m) => !m.classList.contains("lg-menu-ghost"));
      const drawer = els(doc.querySelectorAll(".workspace-drawer")).some((d) => d.style.display !== "none" && !!d.style.transform);
      this.refractor.setPaused(menu || drawer);
    };
    if (import_obsidian6.Platform.isPhone && doc === document) {
      const drawerObs = new win.MutationObserver(phonePause);
      const seen = /* @__PURE__ */ new WeakSet();
      const hookDrawers = () => {
        els(doc.querySelectorAll(".workspace-drawer")).forEach((d) => {
          if (seen.has(d)) return;
          seen.add(d);
          drawerObs.observe(d, { attributes: true, attributeFilter: ["style"] });
        });
        phonePause();
      };
      this.observers.push(drawerObs);
      this.app.workspace.onLayoutReady(hookDrawers);
      this.registerEvent(this.app.workspace.on("layout-change", hookDrawers));
    }
    const unlockTabs = (e) => {
      if (!isEl(e.target)) return;
      const close = e.target.closest(".mod-root .workspace-tab-header-inner-close-button");
      const middle = e.type === "auxclick" && e.button === 1 && e.target.closest(".mod-root .workspace-tab-header");
      if (!close && !middle) return;
      const bar = (close || middle).closest(".workspace-tab-header-container");
      if (!bar) return;
      win.setTimeout(() => bar.isConnected && bar.dispatchEvent(new win.MouseEvent("mouseleave")), 0);
    };
    this.registerDomEvent(doc, "click", unlockTabs, { capture: true, passive: true });
    this.registerDomEvent(doc, "auxclick", unlockTabs, { capture: true, passive: true });
    this.registerDomEvent(
      doc,
      "click",
      (e) => {
        if (this.unloaded || doc.body.classList.contains("is-mobile") || !isEl(e.target)) return;
        const btn = e.target.closest(".nav-action-button");
        const leafEl = btn && btn.closest(".workspace-split:not(.mod-root) .workspace-leaf-content");
        const sc = leafEl && leafEl.querySelector(":scope > .nav-header > .search-input-container");
        if (!sc) return;
        const head = sc.parentElement;
        const proxy = head.classList.contains("lg-nav-proxy");
        if (proxy) head.classList.remove("lg-nav-proxy");
        const shown = !!sc.getClientRects().length;
        const below = this.headBelow(head);
        const lr = leafEl.getBoundingClientRect();
        const r = sc.getBoundingClientRect();
        let ghost = null;
        if (shown) {
          ghost = sc.cloneNode(true);
          const input = sc.querySelector("input");
          const gInput = ghost.querySelector("input");
          if (input && gInput) gInput.value = input.value;
        }
        if (proxy) head.classList.add("lg-nav-proxy");
        const run = () => {
          if (this.unloaded || !leafEl.isConnected) return;
          const tabsEl = leafEl.closest(".workspace-tabs");
          if (tabsEl && this.navSearchSync(tabsEl)) return;
          const now = !!(sc.isConnected && sc.getClientRects().length);
          if (now === shown) return;
          if (!shown) return this.headSearchIn(sc, below);
          const opt = { duration: 130, easing: EASE.exit };
          this.headSlide(below, opt.duration);
          ghost.classList.add("lg-search-ghost", INJECTED);
          ghost.setCssProps({ "--lg-gx": `${r.left - lr.left}px`, "--lg-gy": `${r.top - lr.top}px`, "--lg-gw": `${r.width}px` });
          leafEl.appendChild(ghost);
          const anim = ghost.animate(
            [
              { transform: "scale(1)", opacity: 1 },
              { transform: "scale(0.4)", opacity: 0 }
            ],
            { ...opt, fill: "forwards" }
          );
          anim.onfinish = anim.oncancel = () => ghost.remove();
          win.setTimeout(() => ghost.remove(), 450);
        };
        const mo = new win.MutationObserver(() => {
          mo.disconnect();
          run();
        });
        mo.observe(sc, { attributes: true, attributeFilter: ["style", "class"] });
        win.setTimeout(() => mo.disconnect(), 300);
      },
      { capture: true, passive: true }
    );
    this.registerDomEvent(
      doc,
      "click",
      (e) => {
        if (!isEl(e.target)) return;
        const close = e.target.closest(".graph-controls-button.mod-close");
        if (close) return this.graphClose(close.closest(".graph-controls"));
        const open = e.target.closest(".graph-controls.is-close .graph-controls-button.mod-open");
        if (open) this.graphOpen(open.closest(".graph-controls"));
      },
      { capture: true }
    );
    const onToggle = (c) => {
      if (!c || c.classList.contains("is-disabled") || !c.isConnected) return;
      try {
        c.classList.add("lg-tg-anim");
        this.animateToggle(c);
      } catch (err) {
        c.classList.remove("lg-tg-anim");
        console.error("[glass-shelf] toggle", err);
      }
    };
    this.registerDomEvent(doc, "change", (e) => {
      if (isEl(e.target)) onToggle(e.target.closest(".checkbox-container"));
    });
    this.registerDomEvent(
      doc,
      "click",
      (e) => {
        if (!isEl(e.target)) return;
        const c = e.target.closest(".checkbox-container");
        if (!c || c.querySelector("input")) return;
        const was = c.classList.contains("is-enabled");
        const mo = new win.MutationObserver(() => {
          if (c.classList.contains("is-enabled") === was) return;
          mo.disconnect();
          onToggle(c);
        });
        mo.observe(c, { attributes: true, attributeFilter: ["class"] });
        win.setTimeout(() => mo.disconnect(), 500);
      },
      { capture: true, passive: true }
    );
    const syncSlider = (el) => {
      if (!isEl(el) || el.type !== "range") return;
      const min = parseFloat(el.min) || 0;
      const max = el.max === "" ? 100 : parseFloat(el.max);
      const n = max > min ? (parseFloat(el.value) - min) / (max - min) : 0;
      el.style.setProperty("--lg-sl-n", Math.max(0, Math.min(1, n || 0)).toFixed(4));
      if (el.lgLens) el.lgLens.place();
    };
    this.registerDomEvent(
      doc,
      "pointerdown",
      (e) => {
        const el = e.target;
        if (e.button !== 0 || !isEl(el)) return;
        const tg = el.closest(".checkbox-container");
        if (tg && this.refractOn() && !tg.style.getPropertyValue("--lg-tg-refract")) {
          const cs = win.getComputedStyle(tg);
          const KX = parseFloat(cs.getPropertyValue("--lg-tg-kx")) || 1;
          const KY = parseFloat(cs.getPropertyValue("--lg-tg-ky")) || 1;
          const pad = tgPad(cs, win);
          const tw = parseFloat(cs.getPropertyValue("--lg-tg-thumb")) || 32;
          const th = tg.getBoundingClientRect().height - pad * 2;
          tg.style.setProperty("--lg-tg-refract", `url(#${this.refractor.filterFor(Math.round(tw * KX), Math.round(th * KY), 42, false, true, doc, void 0, void 0, LENS_TOGGLE)})`);
        }
        if (el.type !== "range" || el.disabled) return;
        try {
          this.sliderLens(el);
        } catch (err) {
          console.error("[glass-shelf] slider", err);
        }
      },
      { capture: true, passive: true }
    );
    this.registerDomEvent(doc, "input", (e) => syncSlider(e.target), { capture: true, passive: true });
    this.registerDomEvent(doc, "change", (e) => syncSlider(e.target), { capture: true, passive: true });
    this.registerDomEvent(doc, "animationstart", (e) => {
      if (e.animationName === "lg-sl-born") syncSlider(e.target);
    });
    for (const el of doc.querySelectorAll('input[type="range"]')) syncSlider(el);
    this.registerDomEvent(
      doc,
      "pointerdown",
      (e) => {
        if (e.button !== 0 || !isEl(e.target)) return;
        const tab = e.target.closest(".mod-left-split .workspace-tab-header, .mod-right-split .workspace-tab-header");
        const inner = tab && tab.parentElement;
        if (!inner || !inner.classList.contains("workspace-tab-header-container-inner")) return;
        if (inner.scrollWidth <= inner.clientWidth + 1) return;
        const ir = inner.getBoundingClientRect();
        const tr2 = tab.getBoundingClientRect();
        const pad = parseFloat(win.getComputedStyle(inner).paddingLeft) || 0;
        const screenX = tr2.left;
        let side = 0;
        if (tr2.left < ir.left + pad - 0.5) side = -1;
        else if (tr2.right > ir.right - pad + 0.5) side = 1;
        const t0 = win.performance.now();
        const tick = () => {
          if (!tab.isConnected) return;
          const r = tab.getBoundingClientRect();
          const box = inner.getBoundingClientRect();
          const want = side < 0 ? box.left + pad : side > 0 ? box.right - pad - r.width : screenX;
          const d = r.left - want;
          if (Math.abs(d) > 0.5) inner.scrollLeft += d;
          if (win.performance.now() - t0 < 400) win.requestAnimationFrame(tick);
        };
        win.requestAnimationFrame(tick);
      },
      { capture: true, passive: true }
    );
    let taskMo = null;
    this.registerDomEvent(
      doc,
      "click",
      (e) => {
        const cb = isEl(e.target) && e.target.closest("input.task-list-item-checkbox");
        if (!cb) return;
        if (taskMo) taskMo.disconnect();
        const x = e.clientX;
        const y = e.clientY;
        const t0 = win.performance.now();
        let cur = cb;
        cb.lgTaskDone = false;
        const press = (el, at) => {
          const p = el.animate([{ transform: "scale(1)" }, { transform: "scale(0.82)", offset: 0.35 }, { transform: "scale(1)" }], { duration: TASK_PRESS_MS, easing: "cubic-bezier(0.3, 0, 0.3, 1)" });
          if (at > 0) p.currentTime = at;
        };
        press(cb, 0);
        const hov = e.detail > 0 && (!e.pointerType || e.pointerType === "mouse");
        const want = cb.checked;
        if (!want && hov) cb.classList.add("lg-task-hold");
        if (!want && hov) win.setTimeout(() => cb.classList.remove("lg-task-hold"), 600);
        const step = () => {
          const elapsed = win.performance.now() - t0;
          if (!cur.isConnected) {
            const hit = doc.elementFromPoint(x, y);
            const next = hit && hit.closest && hit.closest("input.task-list-item-checkbox");
            if (next) {
              cur = next;
              if (elapsed < TASK_PRESS_MS) press(cur, elapsed);
            }
          }
          if (cur.isConnected && !cur.lgTaskDone && (cur === cb || cur.checked === want)) {
            cur.lgTaskDone = true;
            if (cur !== cb) mo.disconnect();
            if (cur === cb || elapsed < 600) this.animateTask(cur, want, elapsed, hov);
            if (cur !== cb && hov) {
              const el = cur;
              el.classList.add("lg-task-hov");
              const off = () => {
                el.classList.remove("lg-task-hov");
                doc.removeEventListener("pointermove", off, true);
              };
              doc.addEventListener("pointermove", off, true);
              win.setTimeout(off, 3e3);
            }
          }
        };
        const mo = new win.MutationObserver(step);
        taskMo = mo;
        mo.observe(cb.closest(".workspace-leaf-content") || doc.body, { childList: true, subtree: true });
        win.setTimeout(() => mo.disconnect(), 1600);
        win.requestAnimationFrame(step);
      },
      true
    );
    this.registerDomEvent(doc, "keydown", (e) => {
      if ((e.key === " " || e.key === "Enter") && isEl(e.target) && e.target.classList.contains("checkbox-container")) {
        onToggle(e.target);
      }
    });
    if (doc !== document) {
      const ro = new win.ResizeObserver(() => this.placeTitle(doc));
      ro.observe(doc.body);
      const left = doc.querySelector(".mod-community-modal .community-modal-search, .modal.mod-settings .vertical-tab-header");
      if (left) ro.observe(left);
      this.register(() => ro.disconnect());
    }
  }
};

// src/press.ts
var import_obsidian8 = require("obsidian");

// src/lens.ts
var import_obsidian7 = require("obsidian");
var SL_SHADOW_A = 0.45;
var SL_SQUASH = 0.2;
var SL_STOP_MS = 50;
var SL_SQUASH_MOVING = 0.02;
var SL_SQUASH_Y = 0.35;
var SL_SQUASH_Y_STOP = 1.3;
var SL_STOP_MIN = 0.12;
var SL_STOP_IN_S = 0.14;
var SL_SETTLE_S = 0.115;
var lensMotion = function(u, reach) {
  const ease = u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
  const vel = u < 0.5 ? 12 * u * u : 3 * Math.pow(-2 * u + 2, 2);
  const g = Math.pow(Math.sin(Math.PI * u), 0.6);
  const d = 0.5 * reach * (vel / 3);
  return { ease, g, d };
};
var LENS_CLEAR_K = 2.2;
var LENS_TG_TALL = 3;
var shadeSeq = 0;
var scaleOf = (ow, r) => ow && Math.abs(r.width - ow) >= 1 ? r.width / ow : 1;
var CLONE_BOX = ["display", "flex-direction", "flex-wrap", "align-items", "justify-content", "gap", "padding", "font-size", "font-weight", "line-height", "letter-spacing", "text-align", "white-space"];
var CLONE_SIZE = ["width", "height", "min-width", "margin", "flex-grow", "flex-shrink", "flex-basis", "align-self", "order"];
var TAB_LENS_MS = 80;
var TAB_PRESS_K = 0.5;
var TAB_LENS_W = 1.8;
var TAB_GROW_MS = 90;
var TAB_GROW_FWD = 9;
var MOBILE_TAB_GROW_FWD = 0;
var TAB_LENS_H2 = 1.2;
var TAB_SHRINK_MS = 280;
var TAB_SQUASH = 0.5;
var TAB_SQUASH_AT = 0.25;
var TAB_SQUASH_HOLD = 0.25;
var TAB_STRETCH = 0.08;
var TAB_STRETCH_H = 0.08;
var TAB_SQUASH_SMALL = 0.7;
var MOBILE_TAB_GROW = 1.1;
var MOBILE_TAB_SQUASH = 0.1;
var TAB_RESTORE_MS = 600;
var TAB_REF_RATIO = 1.3;
var tabTravelMs = (dist) => Math.min(220, 130 + dist * 0.6);
var tabTravelEase = (u) => u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
var SegmentLens = class {
  constructor(header, inner, plugin) {
    this.header = header;
    this.inner = inner;
    this.plugin = plugin;
    this.el = null;
    this.raf = null;
    this.cur = null;
  }
  ensureEl() {
    if (this.el && this.el.isConnected) return this.el;
    this.header.querySelectorAll(":scope > .lg-seg-indicator").forEach((old) => old.remove());
    this.el = createDiv({ cls: ["lg-seg-indicator", INJECTED] });
    this.el.createDiv("lg-seg-flat");
    this.lensEl = this.el.createDiv("lg-seg-lens");
    this.header.appendChild(this.el);
    return this.el;
  }
  rectOf(tab) {
    const hr = this.header.getBoundingClientRect();
    const r = tab.getBoundingClientRect();
    return { cx: r.left - hr.left + r.width / 2, cy: r.top - hr.top + r.height / 2, w: r.width, h: r.height };
  }
  measure() {
    const hr = this.header.getBoundingClientRect();
    const ir = this.inner.getBoundingClientRect();
    const innerH = ir.height;
    const tabs = [];
    for (const tab of Array.from(this.inner.querySelectorAll(":scope > .workspace-tab-header"))) {
      const tr2 = tab.getBoundingClientRect();
      if (!tr2.width) continue;
      const ti = tab.querySelector(":scope > .workspace-tab-header-inner");
      tabs.push({ tab, ti, tr: tr2, tir: ti ? ti.getBoundingClientRect() : null, ow: tab.offsetWidth, tiow: ti ? ti.offsetWidth : 0 });
    }
    return { hr, innerH, ir, tabs };
  }
  moveTo(fromTab, toTab) {
    if (this.plugin.tabPlain() || this.header.closest(".lg-tab-list")) return this.stop();
    if (!fromTab.getBoundingClientRect().width || !toTab.getBoundingClientRect().width) return;
    const from = this.raf && this.cur ? Object.assign({}, this.cur) : this.rectOf(fromTab);
    const to = this.rectOf(toTab);
    const dist = Math.abs(to.cx - from.cx);
    this.from = from;
    this.to = to;
    this.toTab = toTab;
    this.t0 = performance.now();
    this.dur = tabTravelMs(dist);
    this.ensureEl();
    const el = this.el;
    el.style.left = `${to.cx - to.w / 2}px`;
    el.style.top = `${to.cy - to.h / 2}px`;
    el.style.width = `${to.w}px`;
    el.style.height = `${to.h}px`;
    el.style.removeProperty("border-radius");
    this.rx = parseFloat(getComputedStyle(this.header).getPropertyValue("--lg-pill-rx")) || 0.5;
    this.header.addClass("lg-seg-moving");
    this.refract = this.plugin.refractOn();
    if (!this.refract) this.lensEl.style.removeProperty("--lg-refract");
    if (!this.raf) this.raf = window.requestAnimationFrame((t) => this.step(t));
  }
  // 렌즈 크기에 맞는 굴절 필터 (2px 단위로 묶어 지도 수를 줄인다)
  // shade: 렌즈 안 탭 줄 알약 밖(패널 바탕)이 어둡게 비치는 필터 (렌즈마다 따로, Refractor.filterFor 의 shadeTag)
  filterAt(w, h, look = LENS_TAB, shade = false) {
    const q = (v) => Math.max(4, Math.round(v / 2) * 2);
    if (this.keepH) shade = false;
    if (look === LENS_TAB && !this.keepH) look = LENS_TAB_PC;
    if (shade && !this.shadeTag) this.shadeTag = String(++shadeSeq);
    return this.plugin.refractor.filterFor(q(w), q(h), 42, false, true, this.header.ownerDocument, void 0, void 0, look, void 0, shade ? this.shadeTag : "");
  }
  // 렌즈 안 글자는 탭 줄과 따로 굴절한다 (사용자 요청: 한 굴절로 같이 휘면 가운데 선 방식에서 글자가 옆으로 늘어진다).
  // 원래 탭 글자(.workspace-tab-header-inner)는 렌즈 모양만큼 잘라 숨겨 렌즈 유리가 탭 줄만 떠 오게 하고,
  // 렌즈 자리에 탭 복사본을 렌즈 모양으로 잘라 올려 글자 전용 굴절(LENS_TAB_TEXT)을 건다. 굴절 세기는 렌즈 정도 g 를 따른다
  // 모바일은 글자에 굴절을 걸지 않는다 (사용자 결정): 복사본은 렌즈 위에 그대로 올려 글자가 휘지 않고 또렷하게 보인다.
  // 탭 줄 굴절과 글자 굴절 두 필터가 매 프레임 돌아 보기 전환이 끊겼고, 둘 중 글자 쪽이 더 무거웠다
  // (휴대폰 녹화 측정, 움직이는 동안 프레임 간격 평균: 둘 다 약 19.5ms, 글자 굴절 끔 약 16.8ms, 둘 다 끔 약 15.5ms).
  // 복사본을 아예 빼면 원래 글자가 렌즈(탭 목록 위 층) 아래에 깔려 렌즈 굴절에 같이 휜다
  textLens(x0, y0, vw, vh, g, m) {
    const tabs = m.tabs.map((x) => x.tab);
    if (!this.refract || g <= 0 || !tabs.length) return this.textOff();
    const hr = m.hr;
    const r = vh / 2;
    const n = (v2) => v2.toFixed(2);
    const put = (el, k, v2) => {
      if (el.style.getPropertyValue(k) !== v2) el.style.setProperty(k, v2);
    };
    for (const x of m.tabs) {
      const ti = x.ti, tr2 = x.tir;
      if (!ti || !tr2) continue;
      const L = tr2.left - hr.left, T = tr2.top - hr.top;
      if (L > x0 + vw || L + tr2.width < x0 || T > y0 + vh || T + tr2.height < y0) {
        if (ti.style.getPropertyValue("clip-path")) ti.style.removeProperty("clip-path");
        continue;
      }
      const ks = scaleOf(x.tiow, tr2);
      const ax = (x0 - L) / ks;
      const ay = (y0 - T) / ks;
      const w = vw / ks, h = vh / ks, rr = r / ks;
      put(ti, "clip-path", `path(evenodd, "M-9999 -9999H9999V9999H-9999Z M${n(ax + rr)} ${n(ay)}H${n(ax + w - rr)}A${n(rr)} ${n(rr)} 0 0 1 ${n(ax + w - rr)} ${n(ay + h)}H${n(ax + rr)}A${n(rr)} ${n(rr)} 0 0 1 ${n(ax + rr)} ${n(ay)}Z")`);
    }
    if (!this.textEl || !this.textEl.isConnected) {
      this.textEl = this.header.createDiv({ cls: ["lg-seg-text", INJECTED] });
      this.textInner = this.textEl.createDiv();
      this.textSig = "";
    }
    const bc = this.header.ownerDocument.body.classList;
    const sig = tabs.map((t) => t.getAttribute("aria-label") || t.textContent || "").join("") + `|${bc.contains("lg-tab-names") ? 1 : 0}${bc.contains("lg-tab-wide") ? 1 : 0}`;
    const actSig = tabs.map((t) => t.hasClass("is-active") ? "1" : "0").join("");
    const pairs = (tab, c) => {
      const src = [tab, ...Array.from(tab.querySelectorAll("*"))];
      const dst = [c, ...Array.from(c.querySelectorAll("*"))];
      return src.map((s2, i) => [s2, dst[i]]).filter(([, d]) => !!d);
    };
    const copyInk = (tab, c) => {
      c.classList.toggle("is-active", tab.hasClass("is-active"));
      c.classList.remove("mobile-tap");
      for (const [s2, d] of pairs(tab, c)) {
        if (s2.closest("svg") && s2.tagName.toLowerCase() !== "svg") continue;
        const cs = getComputedStyle(s2);
        d.style.color = cs.color;
        d.style.opacity = cs.opacity;
      }
    };
    if (sig !== this.textSig) {
      this.textSig = sig;
      this.textAct = actSig;
      this.textInner.empty();
      for (const tab of tabs) {
        const c = tab.cloneNode(true);
        c.classList.remove("mobile-tap");
        pairs(tab, c).forEach(([s2, d], i) => {
          d.style.removeProperty("clip-path");
          if (s2.closest("svg") && s2.tagName.toLowerCase() !== "svg") return;
          const cs = getComputedStyle(s2);
          d.style.color = cs.color;
          d.style.opacity = cs.opacity;
          for (const k of i === 0 ? CLONE_BOX : [...CLONE_BOX, ...CLONE_SIZE]) d.style.setProperty(k, cs.getPropertyValue(k));
        });
        this.textInner.appendChild(c);
      }
    } else if (actSig !== this.textAct) {
      this.textAct = actSig;
      const cl = Array.from(this.textInner.children);
      tabs.forEach((tab, i) => cl[i] && copyInk(tab, cl[i]));
    }
    const clones = Array.from(this.textInner.children);
    m.tabs.forEach((x, i) => {
      const c = clones[i];
      if (!c) return;
      const tab = x.tab, tr2 = x.tr;
      put(c, "left", `${(tr2.left - hr.left).toFixed(3)}px`);
      put(c, "top", `${(tr2.top - hr.top).toFixed(3)}px`);
      const k = scaleOf(x.ow, tr2);
      put(c, "width", `${(tr2.width / k).toFixed(3)}px`);
      put(c, "height", `${(tr2.height / k).toFixed(3)}px`);
      put(c, "transform", k !== 1 ? `scale(${k.toFixed(4)})` : "");
      for (const k2 of ["--lg-mx", "--lg-my"]) {
        const v2 = tab.style.getPropertyValue(k2);
        if (v2) put(c, k2, v2);
        else if (c.style.getPropertyValue(k2)) c.style.removeProperty(k2);
      }
    });
    const s = this.textEl.style;
    this.textEl.classList.toggle("lg-seg-text-off", false);
    const dpr = this.header.win.devicePixelRatio || 1;
    const px0 = Math.round(x0 * dpr) / dpr, py0 = Math.round(y0 * dpr) / dpr;
    put(this.textEl, "left", `${n(px0)}px`);
    put(this.textEl, "top", `${n(py0)}px`);
    put(this.textEl, "width", `${n(vw)}px`);
    put(this.textEl, "height", `${n(vh)}px`);
    put(this.textEl, "border-radius", `${n(vh * this.rx)}px / ${n(r)}px`);
    put(this.textInner, "left", `${(-px0).toFixed(3)}px`);
    put(this.textInner, "top", `${(-py0).toFixed(3)}px`);
    if (import_obsidian7.Platform.isMobile) {
      if (s.filter) s.removeProperty("filter");
      return;
    }
    const id = this.filterAt(vw, vh, LENS_TAB_TEXT);
    const f = this.header.ownerDocument.getElementById(id);
    const dm = f && f.querySelector("feDisplacementMap");
    if (dm) {
      if (!dm.getAttribute("data-base")) dm.setAttribute("data-base", dm.getAttribute("scale") || "0");
      const sc = (parseFloat(dm.getAttribute("data-base")) * g).toFixed(2);
      if (dm.getAttribute("scale") !== sc) dm.setAttribute("scale", sc);
    }
    const v = `url(#${id})`;
    if (s.filter !== v) s.filter = v;
  }
  textOff() {
    this.inner.querySelectorAll(":scope > .workspace-tab-header > .workspace-tab-header-inner").forEach((ti) => ti.style.removeProperty("clip-path"));
    if (this.textEl) this.textEl.classList.toggle("lg-seg-text-off", true);
  }
  // 탭 하나가 지나는 렌즈 크기들의 지도를 쉬는 틈에 미리 굽는다. 처음 탭을 바꿀 때 매 프레임 새 지도를 굽느라 끊기던 것 (측정 확인)
  prebake(tab) {
    if (!this.plugin.refractOn() || !tab || this.plugin.tabPlain() || this.header.closest(".lg-tab-list")) return;
    const r = tab.getBoundingClientRect();
    const Hc = this.inner.getBoundingClientRect().height || r.height;
    if (!r.width || !r.height) return;
    const key = `${Math.round(r.width)}x${Math.round(r.height)}x${Math.round(Hc)}`;
    this.baked = this.baked || /* @__PURE__ */ new Set();
    if (this.baked.has(key)) return;
    this.baked.add(key);
    const R = r.height * TAB_REF_RATIO;
    const w1 = r.width + R * (TAB_LENS_W - 1);
    const h1 = this.keepH ? r.height : Hc;
    const h2 = this.keepH ? r.height * MOBILE_TAB_GROW : Hc * TAB_LENS_H2;
    const w2 = r.width + h2 * TAB_REF_RATIO - R + (this.keepH ? MOBILE_TAB_GROW_FWD : TAB_GROW_FWD);
    const legs = [[r.width, r.height, w1, h1], [w1, h1, w2, h2], [w2, h2, r.width, r.height]];
    const sizes = [];
    for (const [w0, h0, wa, ha] of legs) for (let k = 0; k <= 1.0001; k += 0.05) sizes.push([w0 + (wa - w0) * k, h0 + (ha - h0) * k]);
    const texts = import_obsidian7.Platform.isMobile ? [] : sizes.map(([w, h]) => [w, h, 1]);
    const win = this.header.ownerDocument.defaultView || window;
    const ref = this.plugin.refractor;
    const idle = (fn) => win.requestIdleCallback ? win.requestIdleCallback(fn, { timeout: 2e3 }) : win.setTimeout(fn, 50);
    const next = () => idle((dl) => {
      if (this.plugin.unloaded || this.plugin.refractor !== ref) return;
      while ((sizes.length || texts.length) && (!dl || dl.timeRemaining() > 4)) {
        const sz = sizes.shift();
        const [w, h, txt] = sz ? [sz[0], sz[1], 0] : texts.shift();
        try {
          this.filterAt(w, h, txt ? LENS_TAB_TEXT : LENS_TAB, !txt);
        } catch (err) {
          console.error("[glass-shelf] prebake", err);
          return;
        }
      }
      if (sizes.length || texts.length) next();
    });
    next();
  }
  // 묶음의 탭을 모두 미리 굽는다 (같은 크기는 한 번). 탭이 늘거나 폭이 바뀌면 다시 불러도 된다
  prebakeAll() {
    for (const tab of Array.from(this.inner.querySelectorAll(":scope > .workspace-tab-header"))) this.prebake(tab);
  }
  // 멈추면 원래 선택 표시로 돌린다
  stop() {
    if (this.raf) window.cancelAnimationFrame(this.raf);
    this.raf = null;
    this.cur = null;
    if (this.el) {
      this.el.classList.toggle("lg-seg-on", false);
      this.el.classList.toggle("lg-seg-off", true);
      this.el.style.removeProperty("--lg-g");
    }
    this.header.removeClass("lg-seg-moving");
    this.textOff();
  }
  step(now) {
    try {
      this.advance(now);
    } catch (err) {
      console.error("[glass-shelf] lens", err);
      this.stop();
    }
  }
  advance(now) {
    if (!this.el || !this.el.isConnected || !this.from || !this.to) return this.stop();
    const t = now - this.t0;
    const D = this.dur;
    const m = this.measure();
    const tm = this.toTab ? m.tabs.find((x) => x.tab === this.toTab) : void 0;
    const live = tm ? { cx: tm.tr.left - m.hr.left + tm.tr.width / 2, cy: tm.tr.top - m.hr.top + tm.tr.height / 2, w: tm.tr.width, h: tm.tr.height } : this.to;
    const a = Object.assign({}, this.from, { cx: this.from.cx + live.cx - this.to.cx, cy: this.from.cy + live.cy - this.to.cy });
    const b = live;
    const dir = Math.sign(b.cx - a.cx) || 1;
    const lerp = (p, q, k) => p + (q - p) * k;
    const smooth = (x) => x * x * (3 - 2 * x);
    const clamp01 = (x) => Math.min(1, Math.max(0, x));
    const Hc = m.innerH || b.h;
    const R = b.h * TAB_REF_RATIO;
    const w1 = b.w + R * (TAB_LENS_W - 1);
    const h1 = this.keepH ? b.h : Hc;
    const h2 = this.keepH ? b.h * MOBILE_TAB_GROW : Hc * TAB_LENS_H2;
    const tabsEl = this.header.closest(".workspace-tabs");
    const small = !this.keepH && !!tabsEl && !this.plugin.tabWideOf(tabsEl) && !this.plugin.settings.tabNames;
    const f = small ? TAB_SQUASH_SMALL : 1;
    const SQ = (this.keepH ? MOBILE_TAB_SQUASH : TAB_SQUASH) * f;
    const ST = TAB_STRETCH * f;
    const STH = TAB_STRETCH_H * f;
    const FWD = this.keepH ? MOBILE_TAB_GROW_FWD : TAB_GROW_FWD;
    const w2 = b.w + h2 * TAB_REF_RATIO - R + FWD;
    const lead = b.cx + dir * b.w / 2 + dir * FWD * (1 - smooth(clamp01((t - D) / TAB_SHRINK_MS)));
    let bw;
    let bh;
    let sx = 1;
    let sy = 1;
    let cx;
    let cy;
    let g;
    const growFrom = Math.max(TAB_LENS_MS, D - TAB_GROW_MS);
    if (t < D) {
      const e = tabTravelEase(clamp01(t / D));
      if (t < TAB_LENS_MS) {
        const k = smooth(t / TAB_LENS_MS);
        bw = lerp(a.w, w1, k);
        bh = lerp(a.h, h1, k);
        g = k;
      } else if (t < growFrom) {
        bw = w1;
        bh = h1;
        g = 1;
      } else {
        const k = smooth((t - growFrom) / Math.max(1, D - growFrom));
        bw = lerp(w1, w2, k);
        bh = lerp(h1, h2, k);
        g = 1;
      }
      cx = lerp(a.cx, lead - dir * w2 / 2, e);
      cy = lerp(a.cy, b.cy, e);
    } else if (t < D + TAB_SHRINK_MS) {
      const x = (t - D) / TAB_SHRINK_MS;
      const k = smooth(x);
      bw = lerp(w2, b.w, k);
      bh = lerp(h2, b.h, k);
      g = 1 - k;
      const sq = SQ * R / bw;
      const st = ST * R / bw;
      if (x < TAB_SQUASH_AT) {
        const q = x / TAB_SQUASH_AT;
        sx = 1 - sq * (1 - Math.pow(1 - q, 2));
      } else if (x < TAB_SQUASH_AT + TAB_SQUASH_HOLD) {
        sx = 1 - sq;
      } else {
        const q = smooth((x - TAB_SQUASH_AT - TAB_SQUASH_HOLD) / (1 - TAB_SQUASH_AT - TAB_SQUASH_HOLD));
        sx = lerp(1 - sq, 1 + st, q);
        sy = 1 - STH * q;
      }
      cx = lead - dir * bw * sx / 2;
      cy = b.cy;
    } else if (t < D + TAB_SHRINK_MS + TAB_RESTORE_MS) {
      const x = (t - D - TAB_SHRINK_MS) / TAB_RESTORE_MS;
      const k = 1 - Math.pow(1 - x, 3);
      bw = b.w;
      bh = b.h;
      g = 0;
      sx = lerp(1 + ST * R / b.w, 1, k);
      sy = lerp(1 - STH, 1, k);
      cx = lead - dir * bw * sx / 2;
      cy = b.cy;
    } else {
      return this.stop();
    }
    this.cur = { cx, cy, w: bw * sx, h: bh * sy };
    const el = this.el;
    el.style.left = `${(b.cx - bw / 2).toFixed(2)}px`;
    el.style.top = `${(b.cy - bh / 2).toFixed(2)}px`;
    el.style.width = `${bw.toFixed(2)}px`;
    el.style.height = `${bh.toFixed(2)}px`;
    el.style.borderRadius = `${(bh * this.rx).toFixed(2)}px / ${(bh / 2).toFixed(2)}px`;
    el.style.transform = `translate(${(cx - b.cx).toFixed(2)}px, ${(cy - b.cy).toFixed(2)}px) scale(${sx.toFixed(4)}, ${sy.toFixed(4)})`;
    el.classList.toggle("lg-seg-off", false);
    el.classList.toggle("lg-seg-on", true);
    if (el.style.getPropertyValue("--lg-g") !== g.toFixed(3)) el.style.setProperty("--lg-g", g.toFixed(3));
    if (this.refract && g > 0) {
      const id = this.filterAt(bw, bh, LENS_TAB, true);
      const v = `url(#${id})`;
      if (this.lensEl.style.getPropertyValue("--lg-refract") !== v) this.lensEl.style.setProperty("--lg-refract", v);
      const ir = m.ir, x0 = cx - bw * sx / 2 - (ir.left - m.hr.left), y0 = cy - bh * sy / 2 - (ir.top - m.hr.top);
      if (!this.keepH) this.plugin.refractor.shadeAt(this.header.ownerDocument, id, -x0 / sx, -y0 / sy, ir.width / sx, ir.height / sy, ir.height * this.rx / sx);
    }
    this.textLens(cx - bw * sx / 2, cy - bh * sy / 2, bw * sx, bh * sy, g, m);
    this.raf = window.requestAnimationFrame((tt) => this.step(tt));
  }
};

// src/press.ts
var pressMethods = {
  // 설정 창 검색창 굴절 (사용자 요청). 설정 창은 별도 창으로도 떠서 refresh() 가 보지 않으므로 창마다 따로 건다.
  // 이미 걸려 있으면 attach 가 바로 돌아온다
  modalRefract(doc) {
    if (!this.refractOn() || !doc.body) return;
    doc.querySelectorAll(".modal.mod-settings .setting-search-container input").forEach((el) => this.refractor.attach(el, 26, false));
  },
  // 아이콘 버튼의 호버 유리 (사용자 요청): 버튼마다 ::before 를 쓰지 않고, 문서에 둘뿐인 요소(.lg-hover-glass)를 커서가 올라간 버튼 맨 앞에 넣는다.
  // 호버는 한 번에 한 버튼에만 보이므로, 비게 된 ::before 를 알약 링 그림자에 쓴다(테마). 보이고 사라지는 것은 테마의 :hover 규칙이 맡고,
  // 둘을 번갈아 써서 옆 버튼으로 옮겨 갈 때 떠나는 버튼의 유리가 흐려지는 중에 빼앗기지 않게 한다
  hoverGlassInto(el) {
    if (import_obsidian8.Platform.isMobile || !el.matches(HOVER_ICON)) return null;
    const have = el.querySelector(":scope > .lg-hover-glass");
    if (have) return have;
    const doc = el.ownerDocument;
    if (!doc.lgHoverPool) {
      doc.lgHoverPool = [0, 1].map(() => {
        const g2 = newEl(doc, "span");
        g2.className = `lg-hover-glass ${INJECTED}`;
        g2.setAttribute("aria-hidden", "true");
        return g2;
      });
      this.register(() => {
        doc.lgHoverPool?.forEach((g2) => g2.remove());
        doc.lgHoverPool = void 0;
      });
    }
    const pool = doc.lgHoverPool;
    const g = pool.shift();
    pool.push(g);
    el.prepend(g);
    return g;
  },
  // 단독 원형 버튼: 유리 층이 흰색으로 바뀌며 커졌다가 제자리로
  // 흰색 피크 동안 호버 유리를 거의 투명하게 해 흰 빛이 가려지지 않게 한다
  fadeHover(el, opt) {
    const frames = [
      { offset: 0.2, opacity: 0.08 },
      { offset: 0.55, opacity: 0.08 }
    ];
    const g = el.querySelector(":scope > .lg-hover-glass");
    if (g) return g.animate(frames, opt);
    return el.animate(frames, { ...opt, pseudoElement: "::before" });
  },
  // k: 가장 클 때 배율 (기본 1.28)
  pressPop(el, k = 1.28) {
    try {
      const hover = this.fadeHover(el, { duration: 600, easing: EASE.press });
      const pop = el.animate(
        [
          { offset: 0.34, transform: `scale(${k})`, backgroundColor: PRESS_WHITE, backgroundImage: PRESS_IMG },
          { offset: 0.46, transform: `scale(${k})`, backgroundColor: PRESS_WHITE, backgroundImage: PRESS_IMG }
        ],
        { duration: 600, easing: EASE.press, pseudoElement: "::after" }
      );
      return [hover, pop];
    } catch (err) {
      console.error("[glass-shelf] pop", err);
      return [];
    }
  },
  // pressPop 과 같은 값인데 유리가 요소 자체에 있는 버튼용. 누를 때 작아지는 transform 과 겹치지 않게 scale 속성으로 건다
  pressPopSelf(el, k = 1.28) {
    try {
      this.fadeHover(el, { duration: 600, easing: EASE.press });
      const peak = { scale: String(k), backgroundColor: PRESS_WHITE, backgroundImage: PRESS_IMG };
      el.animate([{ offset: 0.34, ...peak }, { offset: 0.46, ...peak }], { duration: 600, easing: EASE.press });
    } catch (err) {
      console.error("[glass-shelf] pop-self", err);
    }
  },
  // 패널 토글은 누르면 패널과 함께 가려지고 다른 자리의 토글이 나타난다.
  // 누른 버튼이 가려지면, 새로 보이는 같은 쪽 토글이 흰 빛 효과를 같은 진행 시점부터 이어받는다
  handoffPop(el, anims) {
    const doc = el.ownerDocument;
    const win = doc.defaultView || window;
    const t0 = win.performance.now();
    const side = el.closest(".sidebar-toggle-button.mod-left, .lg-panel-toggle-left") ? "left" : "right";
    const sel = side === "left" ? ".sidebar-toggle-button.mod-left .clickable-icon, .lg-panel-toggle-left" : ".sidebar-toggle-button.mod-right .clickable-icon, .lg-panel-toggle:not(.lg-panel-toggle-left)";
    const shown = (n) => n.isConnected && n.getClientRects().length > 0 && !n.closest(".is-sidedock-collapsed");
    let restarts = 0;
    const tick = () => {
      const t = win.performance.now() - t0;
      if (t > 600) return;
      if (shown(el)) {
        if (restarts < 3 && t > 30 && win.getComputedStyle(el, "::after").transform === "none") {
          restarts++;
          anims.forEach((a) => a && a.cancel());
          anims = this.pressPop(el);
          anims.forEach((a) => a && (a.currentTime = t));
        }
        return win.requestAnimationFrame(tick);
      }
      const next = els(doc.querySelectorAll(sel)).find((n) => n !== el && shown(n));
      if (!next) return win.requestAnimationFrame(tick);
      anims.forEach((a) => a && a.cancel());
      if (next.closest(".workspace-ribbon")) return;
      this.pressPop(next).forEach((a) => a && (a.currentTime = t));
    };
    win.requestAnimationFrame(tick);
  },
  // 누른 버튼이 든 컨테이너 알약이 통째로 커졌다가 돌아온다 (알약이 클수록 조금만)
  pressScale(el) {
    try {
      const pill = el.closest(PRESS_PILL);
      if (!pill) return;
      if (el.matches(".workspace-tab-header") && el.closest(".lg-tab-list")) return;
      const r = pill.getBoundingClientRect();
      const tab = el.matches(".workspace-tab-header") && !this.tabPlain();
      const group = pill.matches(PRESS_GROUP);
      const k = 1 + Math.min(0.2, 16 / Math.max(r.width, r.height, 1)) * (tab ? TAB_PRESS_K : group ? GROUP_PRESS_K : 1);
      const opt = { duration: 570, easing: EASE.press };
      pill.animate([{ offset: 0.34, scale: k.toFixed(3) }, { offset: 0.46, scale: k.toFixed(3) }], opt);
      if (tab) return;
      this.fadeHover(el, opt);
    } catch (err) {
      console.error("[glass-shelf] scale", err);
    }
  },
  // 알약 버튼 하나를 누름: 크기에 맞춰 조금 커지고(최대 20%, 16px 만큼) 가장 클 때 하얘졌다 돌아온다
  pressPill(btn) {
    try {
      const r = btn.getBoundingClientRect();
      const k = (1 + Math.min(0.2, 16 / Math.max(r.width, r.height, 1))).toFixed(3);
      const peak = { scale: k, backgroundColor: PRESS_WHITE, backgroundImage: PRESS_IMG };
      btn.animate([{ offset: 0.34, ...peak }, { offset: 0.46, ...peak }], { duration: 570, easing: EASE.press });
    } catch (err) {
      console.error("[glass-shelf] press-pill", err);
    }
  },
  // 모바일: 누른 곳이 원형 버튼이면 버튼을, 알약 안 버튼이면 알약을 통째로 키우고 가장 클 때 하얗게 한다. 효과를 걸었으면 true
  pressMobile(t) {
    try {
      let el = t.closest(MOBILE_PRESS_POP);
      let k = 1.28;
      let white = true;
      let dur = 600;
      if (!el) {
        const btn = t.closest(MOBILE_PRESS_BTN);
        el = btn && btn.closest(MOBILE_PRESS_PILL);
        if (!el) return false;
        const r = el.getBoundingClientRect();
        k = 1 + Math.min(0.2, 16 / Math.max(r.width, r.height, 1));
        white = !el.matches(".workspace-drawer-tab-options-list") || this.tabPlain();
        dur = 570;
      }
      if (el.matches(".modal-setting-back-button")) {
        this.backGhost(el, k);
        return true;
      }
      const peak = { scale: k.toFixed(3) };
      if (white) Object.assign(peak, { backgroundColor: PRESS_WHITE, backgroundImage: PRESS_IMG });
      el.animate([Object.assign({ offset: 0.34 }, peak), Object.assign({ offset: 0.46 }, peak)], {
        duration: dur,
        easing: EASE.press
      });
      return true;
    } catch (err) {
      console.error("[glass-shelf] press-mobile", err);
      return false;
    }
  },
  // 설정 창 뒤로 버튼: 누르면 Obsidian 이 목록으로 돌아가며 버튼을 바로 숨겨, 누름 효과가 중간에 뚝 끊기고 사라졌다 (사용자 지적).
  // 누르는 순간 그 자리에 같은 모양의 사본을 띄워 커지며 흐려지게 하고(사용자 요청), 원래 버튼은 그동안 투명하게 둔다.
  // 버튼이 숨지 않고 남아 있으면(누름이 취소되는 등) 0.6초 뒤 다시 보인다
  backGhost(el, k) {
    const doc = el.ownerDocument;
    const win = doc.defaultView || window;
    const r = el.getBoundingClientRect();
    const g = el.cloneNode(true);
    g.removeAttribute("id");
    g.classList.add("lg-back-ghost");
    g.setCssProps({ "--lg-gx": `${r.left}px`, "--lg-gy": `${r.top}px`, "--lg-gw": `${r.width}px`, "--lg-gh": `${r.height}px` });
    doc.body.appendChild(g);
    el.classList.add("lg-back-hidden");
    g.animate([{ scale: "1", opacity: 1 }, { scale: Number(k).toFixed(3), opacity: 0 }], { duration: 260, easing: "cubic-bezier(0.2, 0, 0.2, 1)", fill: "forwards" }).onfinish = () => g.remove();
    win.setTimeout(() => {
      g.remove();
      el.classList.remove("lg-back-hidden");
    }, 600);
  },
  // 검색 탭 검색창: 안의 내용까지 통째로 커졌다 돌아오고, 누른 자리 근처만 하얘진다
  pressField(el, e) {
    try {
      const r = el.getBoundingClientRect();
      const k = 1.02;
      const opt = { duration: 570, easing: EASE.press };
      el.animate([{ offset: 0.34, scale: k.toFixed(3) }, { offset: 0.46, scale: k.toFixed(3) }], opt);
      el.lgPress = { t: performance.now(), k, opt };
      this.pressRipple(el, e, r.height * 4.5, "lg-ripple-field");
    } catch (err) {
      console.error("[glass-shelf] field", err);
    }
  },
  // 알약 안 버튼: 누른 자리에서 흰 그라데이션이 퍼지며 사라진다
  // size: 흰 빛 지름 (없으면 알약 높이 × RIPPLE_K), cls: 덧붙일 클래스,
  // hold: 지름을 줘도 가장 밝은 채로 퍼지는 구간을 둔다, from: 처음 크기(지름 대비, 기본 0)
  pressRipple(btn, e, size, cls, hold = false, from = 0) {
    const el = btn.closest(PRESS_PILL) || btn;
    const doc = el.ownerDocument;
    const r = el.getBoundingClientRect();
    const d = size || r.height * RIPPLE_K;
    const wrap = newEl(doc, "span");
    wrap.className = cls ? `lg-ripple ${cls}` : "lg-ripple";
    const dot = newEl(doc, "span");
    dot.className = "lg-ripple-dot";
    let cx = e.clientX;
    let cy = e.clientY;
    if ((!size || hold) && btn !== el) {
      const b = btn.getBoundingClientRect();
      cx = b.left + b.width / 2;
      cy = b.top + b.height / 2;
    }
    dot.style.left = `${cx - r.left}px`;
    dot.style.top = `${cy - r.top}px`;
    dot.style.width = dot.style.height = `${d}px`;
    wrap.appendChild(dot);
    el.prepend(wrap);
    const frames = size && !hold ? [
      { transform: "translate(-50%, -50%) scale(0)", opacity: 1 },
      { transform: "translate(-50%, -50%) scale(1)", opacity: 0 }
    ] : [
      { offset: 0, transform: `translate(-50%, -50%) scale(${from})`, opacity: 1 },
      { offset: RIPPLE_HOLD, opacity: 1 },
      { offset: 1, transform: "translate(-50%, -50%) scale(1)", opacity: 0 }
    ];
    const anim = dot.animate(frames, { duration: 640, easing: EASE.burst });
    const win = doc.defaultView || window;
    const keep = new win.MutationObserver(() => {
      if (!wrap.isConnected) el.prepend(wrap);
    });
    keep.observe(el, { childList: true });
    const done = () => {
      keep.disconnect();
      wrap.remove();
    };
    anim.onfinish = done;
    anim.oncancel = done;
  },
  // 할 일 체크박스 애니메이션. elapsed 는 이미 지난 시간(ms): 체크박스가 새로 그려져 바뀐 경우 이어서 재생한다.
  // 사용자가 보낸 iPadOS 영상(60fps로 잘라 봄)을 따라 했다:
  // - 켤 때: 노란 원이 80ms 동안 나타나며 호버 유리를 덮어(유리는 80ms 에 사라짐) 유리가 노랗게 물드는 것처럼 보이고,
  //   이어서 체크가 왼쪽부터 180ms 동안 그려진다(--lg-task-wipe). 체크된 호버면 그 사이 원이 커지고 빛난다(CSS, 80ms 뒤 시작)
  // - 끌 때: 노란 원(체크)이 40ms 만에 사라지고, 노란 링이 160ms 동안 사라진다(호버 중이면 투명, 아니면 회색 링으로).
  //   링이 사라지기 시작할 때 호버 유리가 함께 나타난다 (CSS: .lg-task-hold 동안 호버 유리를 숨긴다)
  // - 링 모양(설정): 켤 때 링이 색으로 바뀌며 안쪽 원이 가운데서 커져 나온다
  // 링 색(--lg-task-ring) CSS 전환은 애니메이션 동안 끈다 (전환이 애니메이션보다 우선이라).
  // 모든 애니메이션은 끝 상태로 멈춰 있다가, 다 끝나면 한 번에 걷어 낸다
  animateTask(cb, on, elapsed, hov) {
    const win = cb.ownerDocument.defaultView || window;
    const ring = cb.ownerDocument.body.classList.contains("lg-task-ring") || !!cb.closest(".kanban-plugin, .kanban-plugin__drag-container");
    if (cb.lgTaskAnims) for (const a of cb.lgTaskAnims) a.cancel();
    cb.classList.add("lg-task-anim");
    const hovered = hov != null ? hov : cb.matches(":hover");
    const cs = win.getComputedStyle(cb);
    const color = cs.getPropertyValue("--lg-task-color").trim();
    const border = cs.getPropertyValue("--lg-task-border").trim();
    const bare = hovered ? "transparent" : border;
    const ringAnim = (frames, opt) => cb.animate(frames.map((c) => typeof c === "string" ? { "--lg-task-ring": c } : { "--lg-task-ring": c.c, offset: c.o }), opt);
    const anims = [];
    if (on && !ring) {
      anims.push(
        cb.animate([{ opacity: 0 }, { opacity: 1 }], { pseudoElement: "::after", duration: 80, easing: "ease-out" }),
        ringAnim([bare, color], { duration: 80, easing: "ease-out" }),
        // 체크 선이 있는 가로 범위(둥근 끝 포함 약 24% ~ 74%)를 왼쪽에서 오른쪽으로
        cb.animate([{ "--lg-task-wipe": "24%" }, { "--lg-task-wipe": "74%" }], { duration: 180, delay: 80, easing: "cubic-bezier(0.4, 0, 0.3, 1)" })
      );
    } else if (on) {
      anims.push(
        ringAnim([bare, color], { duration: 200, easing: "ease-out" }),
        cb.animate(
          [
            { opacity: 1, transform: "scale(0)" },
            { opacity: 1, transform: "scale(1)" }
          ],
          { pseudoElement: "::after", duration: 240, easing: "cubic-bezier(0.2, 0, 0.2, 1)" }
        )
      );
    } else {
      const out = 40;
      const fade = 160;
      anims.push(
        cb.animate([{ opacity: 1 }, { opacity: 0 }], { pseudoElement: "::after", duration: out, easing: "linear" }),
        ringAnim([color, { c: color, o: out / (out + fade) }, bare], { duration: out + fade, easing: "linear" })
      );
      if (hovered) {
        cb.classList.add("lg-task-hold");
        win.setTimeout(() => cb.classList.remove("lg-task-hold"), Math.max(0, out - (elapsed || 0)));
      }
    }
    for (const a of anims) {
      a.effect.updateTiming({ fill: "both" });
      if (elapsed > 0) a.currentTime = elapsed;
    }
    cb.lgTaskAnims = anims;
    Promise.all(anims.map((a) => a.finished)).then(() => {
      if (cb.lgTaskAnims !== anims) return;
      cb.lgTaskAnims = null;
      cb.classList.remove("lg-task-anim");
      for (const a of anims) a.cancel();
    }).catch(() => {
    });
  },
  // 토글 손잡이 애니메이션: 탭 렌즈와 같은 곡선으로 이동하며 가운데서 통통한 유리 렌즈가 된다
  animateToggle(c) {
    const doc = c.ownerDocument;
    const win = doc.defaultView || window;
    const cs = win.getComputedStyle(c);
    const W = c.clientWidth;
    const H = c.getBoundingClientRect().height;
    const pad = tgPad(cs, win);
    const tw = parseFloat(cs.getPropertyValue("--lg-tg-thumb")) || 34;
    const th = H - pad * 2;
    const on = c.classList.contains("is-enabled");
    const xOff = pad;
    const xOn = W - tw - pad;
    const x0 = on ? xOff : xOn;
    const x1 = on ? xOn : xOff;
    const KX = parseFloat(cs.getPropertyValue("--lg-tg-kx")) || 1;
    const KY = parseFloat(cs.getPropertyValue("--lg-tg-ky")) || 1;
    const RX = parseFloat(cs.getPropertyValue("--lg-pill-rx")) || 0.5;
    const fill = cs.getPropertyValue("--lg-lens-bg").trim() || "transparent";
    const sheen = "none";
    const lensShadow = cs.getPropertyValue("--lg-lens-shadow").trim();
    let backdrop = "brightness(1.06)";
    if (this.refractOn()) {
      const id = this.refractor.filterFor(Math.round(tw * KX), Math.round((th + LENS_TG_TALL) * KY), 42, false, true, doc, void 0, void 0, LENS_TOGGLE);
      backdrop = `url(#${id}) ${backdrop}`;
    }
    const frames = [];
    const N = 24;
    for (let i = 0; i <= N; i++) {
      const u = i / N;
      const m = lensMotion(u, 0.35);
      const x = x0 + (x1 - x0) * m.ease;
      const puff = 1 + 0.5 * m.g;
      const sx = puff * (1 + m.d);
      const g = m.g;
      const sy = puff * (1 - m.d * 0.7) * (import_obsidian8.Platform.isMobile ? (th + LENS_TG_TALL * g) / th : 1);
      frames.push({
        offset: u,
        // 렌즈가 되면 위아래로 실제 높이를 조금 더 키운다. 모서리 반지름은 원래 알약 그대로 고정해서(곡률 유지)
        // 키운 만큼 아주 살짝 각져 보인다
        height: `${((th + LENS_TG_TALL * g) * KY).toFixed(2)}px`,
        top: `${(pad + th / 2 - (th + LENS_TG_TALL * g) * KY / 2).toFixed(2)}px`,
        borderRadius: `${(th * RX * KX).toFixed(2)}px / ${(th / 2 * KY).toFixed(2)}px`,
        transform: `translateX(${(x + tw * (1 - KX) / 2).toFixed(2)}px) scale(${(sx / KX).toFixed(4)}, ${(sy / KY).toFixed(4)})`,
        // 손잡이의 흰 채움은 렌즈 정도(g)보다 빨리 알약 채움으로 바뀐다 (g 가 절반쯤 오르면 이미 알약 채움)
        backgroundColor: `color-mix(in srgb, #fff ${((1 - Math.min(1, g * LENS_CLEAR_K)) * 100).toFixed(1)}%, ${fill})`,
        boxShadow: lensShadow ? lensShadow.replace(/\/\s*([\d.]+)\s*\)/g, (m2, v) => `/ ${(parseFloat(v) * g).toFixed(3)})`) : "none",
        backgroundImage: sheen,
        backdropFilter: backdrop,
        webkitBackdropFilter: backdrop
      });
    }
    if (import_obsidian8.Platform.isMobile) for (const f of frames) {
      delete f.height;
      delete f.top;
    }
    if (import_obsidian8.Platform.isMobile) for (const f of frames) delete f.boxShadow;
    const anim = c.animate(frames, { duration: 320, easing: "linear", pseudoElement: "::after" });
    const done = () => c.classList.remove("lg-tg-anim");
    anim.onfinish = done;
    anim.oncancel = done;
  },
  // 슬라이더 렌즈: 누르는 동안 손잡이를 숨기고 그 자리에 토글 렌즈와 같은 유리 렌즈를 띄운다.
  // 손잡이(::-webkit-slider-thumb)에는 backdrop-filter 굴절이 먹지 않아서 문서에 따로 띄운다.
  // 상자는 K 배 크게 그리고 줄여 보인다 (작게 그린 것을 키우면 테두리가 뿌옇다). 값이 바뀌면 syncSlider 가 place 를 부른다
  sliderLens(el) {
    if (el.lgLens) return;
    const doc = el.ownerDocument;
    const win = doc.defaultView || window;
    const cs = win.getComputedStyle(el);
    const tw = parseFloat(cs.getPropertyValue("--lg-sl-tw")) || 26;
    const th = parseFloat(cs.getPropertyValue("--lg-sl-th")) || 16;
    const K = parseFloat(cs.getPropertyValue("--lg-tg-k")) || 1;
    const w = Math.round(tw * K);
    const h = Math.round(th * K);
    const lens = newEl(doc, "div");
    lens.className = "lg-sl-lens " + INJECTED;
    lens.style.width = `${w}px`;
    lens.style.height = `${h}px`;
    const rx = parseFloat(cs.getPropertyValue("--lg-pill-rx")) || 0.5;
    lens.style.borderRadius = `${(h * rx).toFixed(2)}px / ${(h / 2).toFixed(2)}px`;
    let backdrop = "brightness(1.06)";
    if (this.refractOn()) backdrop = `url(#${this.refractor.filterFor(w, h, 42, false, true, doc, void 0, void 0, LENS_SLIDER)}) ${backdrop}`;
    lens.style.backdropFilter = backdrop;
    lens.style.setProperty("-webkit-backdrop-filter", backdrop);
    const visW = w * (1.32 / K);
    const squash = { x: null, t: 0, v: 0, dir: 1, k: 0, k0: 0, stop: 0, raf: 0, anchor: 0 };
    const squashTick = () => {
      const now = win.performance.now();
      const moving = Math.abs(squash.v) > SL_SQUASH_MOVING && now - squash.t < SL_STOP_MS;
      if (moving) {
        squash.dir = Math.sign(squash.v) || squash.dir;
        squash.k += (SL_SQUASH - squash.k) * 0.2;
        squash.stop = 0;
        squash.anchor += (0 - squash.anchor) * 0.2;
      } else {
        if (!squash.stop) {
          squash.stop = now;
          squash.k0 = squash.k;
        }
        squash.anchor += (1 - squash.anchor) * 0.22;
        const t = (now - squash.stop) / 1e3;
        if (t < SL_STOP_IN_S) {
          squash.k = squash.k0 + (-SL_STOP_MIN - squash.k0) * (t / SL_STOP_IN_S);
        } else {
          const u = (t - SL_STOP_IN_S) / SL_SETTLE_S;
          squash.k = -SL_STOP_MIN * (1 + u) * Math.exp(-u);
        }
      }
      const k = squash.k;
      lens.style.scale = `${(1 + k).toFixed(4)} ${(1 - k * (k < 0 ? SL_SQUASH_Y_STOP : SL_SQUASH_Y)).toFixed(4)}`;
      lens.style.translate = `${(-squash.dir * k * visW * squash.anchor / 2).toFixed(2)}px 0`;
      if (moving || !squash.stop || Math.abs(k) > 1e-3 || now - squash.stop < SL_STOP_IN_S * 1e3) squash.raf = win.requestAnimationFrame(squashTick);
      else {
        squash.raf = 0;
        squash.k = 0;
        squash.k0 = 0;
        squash.stop = 0;
        squash.anchor = 0;
        lens.style.removeProperty("scale");
        lens.style.removeProperty("translate");
      }
    };
    const place = () => {
      const r = el.getBoundingClientRect();
      const n = parseFloat(el.style.getPropertyValue("--lg-sl-n")) || 0;
      const x = r.left + tw / 2 + (r.width - tw) * n - w / 2;
      const now = win.performance.now();
      if (squash.x != null && now > squash.t) squash.v = (x - squash.x) / (now - squash.t);
      squash.x = x;
      squash.t = now;
      if (!squash.raf && squash.v) squash.raf = win.requestAnimationFrame(squashTick);
      lens.style.left = `${x.toFixed(2)}px`;
      lens.style.top = `${(r.top + r.height / 2 - h / 2).toFixed(2)}px`;
    };
    const parts = win.getComputedStyle(doc.body).getPropertyValue("--lg-lens-shadow").trim().split(/,(?![^(]*\))/);
    const last = parts.length - 1;
    if (last >= 0) parts[last] = parts[last].replace(/\/\s*([\d.]+)\s*\)/, (m, a) => `/ ${(parseFloat(a) * SL_SHADOW_A).toFixed(3)})`);
    const lightShadow = parts.join(",") || "var(--lg-lens-shadow)";
    place();
    doc.body.appendChild(lens);
    el.classList.add("lg-sl-pressed");
    const anim = lens.animate(
      [
        { transform: `scale(${(1 / K).toFixed(4)})`, backgroundColor: "#fff", boxShadow: "none" },
        { transform: `scale(${(1.32 / K).toFixed(4)})`, backgroundColor: "var(--lg-lens-bg)", boxShadow: lightShadow }
      ],
      { duration: 220, easing: "cubic-bezier(0.3, 0.7, 0.2, 1)", fill: "forwards" }
    );
    const state = { place };
    el.lgLens = state;
    const release = () => {
      win.removeEventListener("pointerup", release, true);
      win.removeEventListener("pointercancel", release, true);
      if (this.pendingRelease) this.pendingRelease.delete(state.off);
      anim.onfinish = () => {
        if (squash.raf) win.cancelAnimationFrame(squash.raf);
        lens.remove();
        el.classList.add("lg-sl-settle");
        el.classList.remove("lg-sl-pressed");
        win.requestAnimationFrame(() => win.requestAnimationFrame(() => el.classList.remove("lg-sl-settle")));
        if (el.lgLens === state) el.lgLens = null;
      };
      anim.reverse();
    };
    win.addEventListener("pointerup", release, true);
    win.addEventListener("pointercancel", release, true);
    const off = () => {
      win.removeEventListener("pointerup", release, true);
      win.removeEventListener("pointercancel", release, true);
    };
    state.off = off;
    (this.pendingRelease || (this.pendingRelease = /* @__PURE__ */ new Set())).add(off);
  },
  // 호버 유리의 모양(아이콘은 높이만 한 원, 글자는 요소 크기)에 맞춘 굴절 필터
  // 굴절: 설정이 켜져 있고 이 기기가 쓸 수 있을 때
  refractOn() {
    return !!this.settings.refraction && CAN_REFRACT;
  },
  // 창 제어 알약(작게 모드): 크기가 바뀐 뒤에 굴절을 다시 구우면 커지는 동안 굴절이 없다가 다 커진 뒤에 생긴다.
  // 그래서 큰 크기·작은 크기 두 지도를 정해진 크기로 걸어 두고, 커서가 들어오는 순간 큰 지도로, 다 줄어든 뒤 작은 지도로 바꾼다.
  // 크기는 테마 변수(--lg-wc-w, --lg-pill-h, --lg-wc-k)를 임시 요소로 재서 얻는다
  wcRefract(doc, big) {
    const el = doc.querySelector(".titlebar-button-container.mod-right");
    if (!el || !this.refractOn()) return;
    if (!doc.body.classList.contains("lg-wc-compact")) {
      this.refractor.attach(el, 26, false);
      return;
    }
    if (!doc.lgWcSizes) {
      const probe = doc.body.createDiv();
      probe.classList.add("lg-wc-probe");
      const W = probe.offsetWidth, H = probe.offsetHeight;
      probe.classList.add("lg-wc-probe-k");
      const w = probe.offsetWidth, h = probe.offsetHeight;
      probe.remove();
      if (!(W > 4 && H > 4 && w > 4 && h > 4)) return;
      doc.lgWcSizes = { W, H, w, h };
    }
    const s = doc.lgWcSizes;
    if (big) this.refractor.attach(el, 26, false, s.W, s.H);
    else this.refractor.attach(el, 26, false, s.w, s.h);
  },
  refractHover(el) {
    if (!this.refractOn()) return;
    const win = el.ownerDocument.defaultView || window;
    const g = this.hoverGlassInto(el);
    const cs = g ? win.getComputedStyle(g) : win.getComputedStyle(el, "::before");
    const w = Math.round(parseFloat(cs.width));
    const h = Math.round(parseFloat(cs.height));
    if (!(w >= 4 && h >= 4)) return;
    const id = this.refractor.filterFor(w, h, HOVER_REFRACT.strength, false, false, el.ownerDocument, HOVER_REFRACT.bezel, HOVER_REFRACT.spread, void 0, HOVER_REFRACT.bezelMax);
    el.style.setProperty("--lg-refract-h", `url(#${id})`);
  }
};

// src/kanban.ts
var kanbanMethods = {
  // ---------- Kanban 연동 (테마 Kanban 절과 짝) ----------
  setupKanban(view) {
    const root = view && view.containerEl;
    if (!root || !root.isConnected) return;
    const acts = root.querySelector(":scope > .view-header .view-actions");
    if (acts) {
      this.groupKanbanActions(acts);
      if (!this.kbWatched.has(acts)) {
        const win = acts.ownerDocument.defaultView || window;
        const obs = new win.MutationObserver(() => this.groupKanbanActions(acts));
        obs.observe(acts, { childList: true });
        this.kbWatched.add(acts);
        this.observers.push(obs);
      }
    }
    const content = view.contentEl;
    if (content && !this.kbWatched.has(content)) {
      const win = content.ownerDocument.defaultView || window;
      const watch = new win.MutationObserver(() => this.setupKanban(view));
      watch.observe(content, { childList: true });
      this.kbWatched.add(content);
      this.observers.push(watch);
    }
    const board = root.querySelector(".kanban-plugin");
    if (board && !this.kbWatched.has(board)) {
      const win = board.ownerDocument.defaultView || window;
      const obs = new win.MutationObserver(() => this.kanbanSearch(root, board));
      obs.observe(board, { childList: true });
      this.kbWatched.add(board);
      this.observers.push(obs);
      this.kanbanSearch(root, board);
      const formObs = new win.MutationObserver((ms) => {
        this.kanbanFormBack(board);
        this.kanbanLaneForm(root, ms);
      });
      formObs.observe(board, { childList: true, subtree: true });
      this.observers.push(formObs);
    }
  },
  // 세 버튼을 알약(.lg-kb-group) 하나로 묶는다. 버튼은 원래 것을 그대로 옮겨 Kanban 동작이 그대로다.
  // 이미 묶여 있으면 아무것도 옮기지 않는다 (옮기면 지켜보기가 다시 불려 끝없이 돈다)
  groupKanbanActions(acts) {
    const all = els(acts.querySelectorAll(".view-action"));
    const btns = KB_GROUP_ICONS.map((ic) => all.find((b) => b.querySelector("svg." + ic))).filter(Boolean);
    let g = acts.querySelector(":scope > .lg-kb-group");
    if (!btns.length) {
      if (g) g.remove();
    } else {
      if (!g) g = createDiv({ cls: ["lg-kb-group", INJECTED] });
      if (btns[0].parentElement === acts) acts.insertBefore(g, btns[0]);
      else if (g.parentElement !== acts) acts.prepend(g);
      const kids = els(g.children);
      if (kids.length !== btns.length || kids.some((c, i) => c !== btns[i])) btns.forEach((b) => g.appendChild(b));
    }
    const search = all.find((b) => b.querySelector("svg.lucide-search"));
    if (search) search.classList.add("lg-kb-search-btn");
  },
  // 검색: 검색 버튼이 왼쪽으로 넓어지며 알약이 되고, 그 안에 Kanban 검색 칸이 놓인다 (사용자 요청).
  // 검색 칸은 Kanban 이 보드 맨 위에 그리는 것을 그대로 쓰고, 자리만 넓어진 버튼 위로 옮긴다(테마: .lg-kb-searching).
  // 버튼은 오른쪽 끝이 고정된 채 넓어지므로(뒤의 버튼들은 제자리) 오른쪽 끝·위 끝만 알려 준다
  kanbanSearch(root, board) {
    const sw = board.querySelector(":scope > .kanban-plugin__search-wrapper");
    const btn = root.querySelector(".view-actions .lg-kb-search-btn");
    const on = !!(sw && btn);
    root.classList.toggle("lg-kb-searching", on);
    if (!on) return;
    const op = sw.offsetParent || root;
    const pr = op.getBoundingClientRect();
    const br = btn.getBoundingClientRect();
    sw.style.setProperty("--lg-kb-top", `${br.top - pr.top}px`);
    sw.style.setProperty("--lg-kb-right", `${pr.right - br.right}px`);
  },
  // ---------- Bases (테마 Bases 절과 짝) ----------
  // 검색 버튼은 칸반 검색과 같은 클래스(.lg-kb-search-btn, 보기에 .lg-kb-searching)를 써서 같은 넓어짐·누름 효과를 받는다 (사용자 요청).
  // Obsidian 은 검색 줄(.bases-search-row)을 툴바 아래 보기 내용 맨 위에 그린다. 켜져 있는 동안 그 줄을 넓어진 버튼 위로 옮긴다(테마)
  setupBases(view) {
    const root = view && view.containerEl;
    const content = view && view.contentEl;
    if (!root || !root.isConnected || !content) return;
    const btn = content.querySelector(".bases-toolbar-search > .text-icon-button");
    if (btn && !btn.classList.contains("lg-kb-search-btn")) btn.classList.add("lg-kb-search-btn");
    const win = content.ownerDocument.defaultView || window;
    if (!this.kbWatched.has(content)) {
      const watch = new win.MutationObserver(() => this.setupBases(view));
      watch.observe(content, { childList: true });
      this.kbWatched.add(content);
      this.observers.push(watch);
    }
    const row = content.querySelector(":scope > .bases-search-row");
    if (row && !this.kbWatched.has(row)) {
      const obs = new win.MutationObserver(() => this.basesSearch(root, content));
      obs.observe(row, { attributes: true, attributeFilter: ["style", "class"] });
      this.kbWatched.add(row);
      this.observers.push(obs);
    }
    if (btn && !this.kbWatched.has(btn)) {
      const obs = new win.MutationObserver(() => this.basesSearch(root, content));
      obs.observe(btn, { attributes: true, attributeFilter: ["class"] });
      this.kbWatched.add(btn);
      this.observers.push(obs);
    }
    const bar = content.querySelector(".bases-toolbar");
    if (bar && !this.kbWatched.has(bar)) {
      const obs = new win.MutationObserver(() => this.basesGroupMark(view));
      obs.observe(bar, { childList: true, subtree: true, characterData: true });
      this.kbWatched.add(bar);
      this.observers.push(obs);
    }
    this.basesGroupMark(view);
    this.basesSearch(root, content);
  },
  // 지금 보기에 그룹이 걸려 있으면 그룹 버튼에 .lg-on (테마: 강조색). Obsidian 은 그룹 버튼에 표시가 없다.
  // 설정은 Bases 내부 값(controller.view.config)을 읽기만 한다
  basesGroupMark(view) {
    const btn = view.contentEl.querySelector(".bases-toolbar-group-menu > .text-icon-button");
    if (!btn) return;
    const ctl = view.controller;
    let on = false;
    try {
      const cfg = ctl && ctl.view && ctl.view.config;
      const g = cfg && cfg.get ? cfg.get("groupBy") : null;
      on = !!g;
    } catch {
      on = false;
    }
    if (btn.classList.contains("lg-on") !== on) btn.classList.toggle("lg-on", on);
  },
  basesSearch(root, content) {
    const row = content.querySelector(":scope > .bases-search-row");
    const btn = content.querySelector(".bases-toolbar-search > .lg-kb-search-btn");
    const on = !!(row && btn && btn.classList.contains("is-active") && row.style.display !== "none");
    if (root.classList.contains("lg-kb-searching") !== on) root.classList.toggle("lg-kb-searching", on);
    if (!on) return;
    const op = row.offsetParent || content;
    const pr = op.getBoundingClientRect();
    const br = btn.getBoundingClientRect();
    row.style.setProperty("--lg-kb-top", `${br.top - pr.top}px`);
    row.style.setProperty("--lg-kb-right", `${pr.right - br.right}px`);
  },
  // 카드 추가 입력 칸을 닫으면 Kanban 이 입력 칸을 다시 카드 추가 버튼으로 바꿔 끼운다.
  // 그 버튼이 유리 흰색에서 강조색으로 서서히 돌아오게 한다 (사용자 요청, 열 때의 반대)
  kanbanFormBack(board) {
    board.querySelectorAll(".kanban-plugin__lane").forEach((lane) => {
      if (lane.querySelector(":scope > .kanban-plugin__item-form")) {
        lane.lgKbForm = true;
        return;
      }
      if (!lane.lgKbForm) return;
      lane.lgKbForm = false;
      const btn = lane.querySelector(":scope > .kanban-plugin__item-button-wrapper .kanban-plugin__new-item-button");
      if (!btn) return;
      const win = lane.ownerDocument.defaultView || window;
      const cs = win.getComputedStyle(lane);
      btn.animate([{ offset: 0, backgroundColor: cs.backgroundColor, color: cs.color }], { duration: 320, easing: EASE.settle });
    });
  },
  // 칸반 검색 버튼을 누르면: 알약 안 버튼과 같은 흰 빛이, 열 때는 넓어지는 쪽(왼쪽)으로, 닫을 때는 줄어드는 쪽(오른쪽)으로
  // 돋보기를 따라 움직이며 퍼진다 (사용자 요청). 버튼은 오른쪽 끝이 고정된 채 넓어지므로 빛 자리를 오른쪽 끝에서 잰다
  pressKbSearch(btn) {
    try {
      const doc = btn.ownerDocument;
      const win = doc.defaultView || window;
      const nav = btn.classList.contains("lg-nav-find");
      const side = nav && btn.closest(".mod-right-split") ? "left" : "right";
      const tx = side === "left" ? "-50%" : "50%";
      const opening = nav ? !btn.classList.contains("lg-nav-search") : !btn.closest(".lg-kb-searching");
      const h = btn.offsetHeight;
      const wide = parseFloat(win.getComputedStyle(btn).getPropertyValue(nav ? "--lg-ns-w" : "--lg-kb-search-w")) || (nav ? NAV_SEARCH_MAX : 240);
      const near = h / 2;
      const far = wide - h / 2;
      let [a, b] = opening ? [0, 0] : [far, near];
      if (nav) [a, b] = opening || side === "left" ? [near, near] : [far, near];
      const same = opening || nav;
      this.fadeHover(btn, { duration: 600, easing: EASE.press });
      const bw = btn.offsetWidth;
      const k = (1 + Math.min(0.1, 8 / Math.max(bw, h, 1))).toFixed(3);
      btn.animate(
        [
          { offset: 0.34, scale: k },
          { offset: 0.46, scale: k }
        ],
        { duration: 600, easing: EASE.press }
      );
      const wrap = newEl(doc, "span");
      wrap.className = "lg-ripple";
      const dot = newEl(doc, "span");
      dot.className = "lg-ripple-dot";
      dot.style.top = `${h / 2}px`;
      const d = same ? wide * 2 / 0.8 : h * RIPPLE_K;
      dot.style.width = dot.style.height = `${d}px`;
      wrap.appendChild(dot);
      btn.prepend(wrap);
      const anim = dot.animate(
        [
          { offset: 0, [side]: `${a}px`, transform: `translate(${tx}, -50%) scale(0)`, opacity: 1 },
          { offset: RIPPLE_HOLD, opacity: 1 },
          { offset: 1, [side]: `${b}px`, transform: `translate(${tx}, -50%) scale(1)`, opacity: 0 }
        ],
        { duration: 640, easing: EASE.burst, fill: "both" }
      );
      const done = () => wrap.remove();
      anim.onfinish = done;
      anim.oncancel = done;
    } catch (err) {
      console.error("[glass-shelf] kanban-search", err);
    }
  },
  // 목록 추가 창 (보드 위 + 버튼): 보관함 전환 메뉴와 같은 애니메이션 (사용자 요청). 버튼 묶음 알약이 창의 오른쪽 위 꼭짓점에 오고,
  // 알약은 좌우로 좁아져 원이 되며 창 가운데로 돌진해 사라지고 그 지점에서 창이 넓어져 나온다. 닫히면 반대로.
  // 창은 보드 안에 그려지는데 보드(contain)와 보기 내용(스크롤 상자)이 밖을 잘라, 여는 동안 보드의 제한을 푼다(테마 .lg-kb-laneform)
  kanbanLaneForm(root, ms) {
    const sel = ".kanban-plugin__lane-form-wrapper";
    const find = (n) => isEl(n) ? n.matches(sel) ? n : n.querySelector(sel) : null;
    for (const m of ms) {
      for (const n of m.removedNodes) {
        const f = find(n);
        if (f) this.laneFormClose(root, f);
      }
      for (const n of m.addedNodes) {
        const f = find(n);
        if (f) this.laneFormOpen(root, f);
      }
    }
  },
  laneFormOpen(root, form) {
    try {
      const src = root.querySelector(".view-actions > .lg-kb-group");
      if (!src) return;
      root.classList.add("lg-kb-laneform");
      const win = root.ownerDocument.defaultView || window;
      const op = form.offsetParent || root;
      const o = op.getBoundingClientRect();
      const ox = o.left + op.clientLeft;
      const oy = o.top + op.clientTop;
      const b = src.getBoundingClientRect();
      const W = form.offsetWidth;
      const H = form.offsetHeight;
      const left = b.right - W - ox;
      const top = b.top - oy;
      form.style.left = `${left}px`;
      form.style.top = `${top}px`;
      form.classList.add("lg-right-auto");
      const mr = parseFloat(win.getComputedStyle(form).borderTopLeftRadius) || 22;
      const full = { left, top, width: W, height: H, radius: mr };
      const bx = b.left + b.width / 2 - ox;
      const by = b.top + b.height / 2 - oy;
      const { ux, uy } = unitVec(bx, by, left + W / 2, top + H / 2);
      const dot = this.dotAt(bx + ux * MORPH_DASH, by + uy * MORPH_DASH, b.height);
      form.classList.add("lg-invisible");
      const go = () => {
        form.classList.remove("lg-invisible");
        if (!form.isConnected) return;
        form.lgMorph = { ux, uy, dot, src };
        if (src.lgHide) src.lgHide.cancel();
        src.lgHide = this.dashOut(src, ux, uy);
        const kids = els(form.children).map((el) => ({ el, anchor: "right" }));
        kids.forEach((k) => this.pinSize(k.el));
        form.classList.add("lg-clip");
        const grow = this.growBox(form, kids, dot, full, KB_DASH_MS * 0.6);
        grow.onfinish = grow.oncancel = () => {
          kids.forEach((k) => this.unpinSize(k.el));
          form.classList.remove("lg-clip");
        };
        kids.forEach((k) => k.el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 140, delay: 120, easing: "ease-out", fill: "backwards" }));
      };
      win.requestAnimationFrame(() => win.requestAnimationFrame(go));
    } catch (err) {
      console.error("[glass-shelf] lane-form", err);
    }
  },
  laneFormClose(root, form) {
    const mo = form.lgMorph;
    form.lgMorph = null;
    if (!root.querySelector(".kanban-plugin__lane-form-wrapper")) root.classList.remove("lg-kb-laneform");
    if (!mo) return;
    const { ux, uy, dot, src } = mo;
    try {
      if (!root.isConnected || !src.isConnected) return;
      const ghost = form.cloneNode(true);
      ghost.classList.add("lg-kb-ghost");
      root.appendChild(ghost);
      const win = root.ownerDocument.defaultView || window;
      win.setTimeout(() => ghost.remove(), 900);
      const mr = parseFloat(win.getComputedStyle(ghost).borderTopLeftRadius) || 22;
      const full = { left: ghost.offsetLeft, top: ghost.offsetTop, width: ghost.offsetWidth, height: ghost.offsetHeight, radius: mr };
      const kids = els(ghost.children).map((el) => ({ el, anchor: "right" }));
      kids.forEach((k) => {
        this.pinSize(k.el);
        k.el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 60, easing: "ease-in", fill: "forwards" });
      });
      ghost.classList.add("lg-clip");
      this.shrinkBox(ghost, kids, full, dot).onfinish = () => ghost.remove();
    } catch (err) {
      console.error("[glass-shelf] lane-form-close", err);
    } finally {
      if (src.lgHide) {
        src.lgHide.cancel();
        src.lgHide = null;
      }
      if (src.isConnected) this.dashBack(src, ux, uy, 110);
    }
  },
  // 목록 접기·펴기: Kanban 은 접으면 카드 줄을 지우고 펴면 다시 그린다. 누를 때 크기를 재 두고, 다시 그려지면
  // 예전 크기에서 새 크기로 움직인다. 펼 때는 다시 나온 카드 줄이 서서히 나타난다
  animateLaneCollapse(btn) {
    const wrap = btn.closest(".kanban-plugin__lane-wrapper");
    const lane = wrap && wrap.querySelector(":scope > .kanban-plugin__lane");
    if (!lane) return;
    const win = wrap.ownerDocument.defaultView || window;
    const h0 = lane.offsetHeight;
    const w0 = lane.offsetWidth;
    const ww0 = wrap.offsetWidth;
    const opening = wrap.matches(".collapse-vertical, .collapse-horizontal");
    const obs = new win.MutationObserver(() => {
      obs.disconnect();
      const ln = wrap.querySelector(":scope > .kanban-plugin__lane");
      if (!ln) return;
      const holdOpt = { duration: 1e3, fill: "forwards" };
      const holdLn = ln.animate([{ width: `${w0}px`, height: `${h0}px` }, { width: `${w0}px`, height: `${h0}px` }], holdOpt);
      const holdWrap = wrap.animate([{ width: `${ww0}px`, minWidth: "0px" }, { width: `${ww0}px`, minWidth: "0px" }], holdOpt);
      ln.classList.add("lg-clip");
      const head = ln.querySelector(".kanban-plugin__lane-header-wrapper");
      const run = () => {
        holdLn.cancel();
        holdWrap.cancel();
        const h1 = ln.offsetHeight;
        const w1 = ln.offsetWidth;
        const ww1 = wrap.offsetWidth;
        const opt = { duration: KB_LANE_MS, easing: MINI_EASE };
        const sideways = ww0 !== ww1;
        const a = ln.animate([{ width: `${w0}px`, height: `${h0}px` }, { width: `${w1}px`, height: `${h1}px` }], opt);
        const done = () => ln.classList.remove("lg-clip");
        a.onfinish = done;
        a.oncancel = done;
        if (sideways) {
          wrap.animate([{ width: `${ww0}px`, minWidth: "0px" }, { width: `${ww1}px`, minWidth: "0px" }], opt);
          const hd = ln.querySelector(".kanban-plugin__lane-header-wrapper") || head;
          if (hd) hd.animate([{ opacity: 0 }, { opacity: 0, offset: 0.3 }, { opacity: 1 }], opt);
        }
        if (opening) els(ln.children).slice(1).forEach((k) => k.animate([{ opacity: 0 }, { opacity: 1 }], opt));
      };
      if (head) head.animate([{ opacity: 0 }, { opacity: 0 }], { duration: 60 });
      win.requestAnimationFrame(() => win.requestAnimationFrame(run));
    });
    obs.observe(wrap, { attributes: true, attributeFilter: ["class"] });
    win.setTimeout(() => obs.disconnect(), 1e3);
  },
  // 칸반 카드 추가 버튼 (테마 Kanban 연동): 다른 알약처럼 커지며 하얘졌다 돌아온다 (사용자 요청).
  // 누르면 Kanban 이 버튼을 입력 칸으로 바꿔 끼우므로, 입력 칸이 나타나면 같은 애니메이션을 같은 시점부터 이어받는다
  // (강조색 → 흰색 → 유리 흰색)
  pressKanbanAdd(btn) {
    try {
      const win = btn.ownerDocument.defaultView || window;
      const r = btn.getBoundingClientRect();
      const k = (1 + Math.min(0.2, 16 / Math.max(r.width, r.height, 1))).toFixed(3);
      const opt = { duration: 570, easing: EASE.press };
      const peak = { scale: k, backgroundColor: PRESS_WHITE, backgroundImage: PRESS_IMG };
      const accent = win.getComputedStyle(btn).backgroundColor;
      const t0 = win.performance.now();
      btn.animate([{ offset: 0.34, ...peak }, { offset: 0.46, ...peak }], opt);
      const lane = btn.closest(".kanban-plugin__lane");
      if (!lane) return;
      const obs = new win.MutationObserver(() => {
        const box = lane.querySelector(".kanban-plugin__item-form .kanban-plugin__item-input-wrapper");
        if (!box) return;
        obs.disconnect();
        const a = box.animate([{ offset: 0, backgroundColor: accent, backgroundImage: "none" }, { offset: 0.34, ...peak }, { offset: 0.46, ...peak }], opt);
        a.currentTime = Math.min(win.performance.now() - t0, opt.duration);
      });
      obs.observe(lane, { childList: true, subtree: true });
      win.setTimeout(() => obs.disconnect(), 1e3);
    } catch (err) {
      console.error("[glass-shelf] kanban-add", err);
    }
  }
};

// src/menus.ts
var import_obsidian9 = require("obsidian");
function itemTop(el, menu) {
  let y = 0;
  for (let e = el; e && e !== menu; e = e.offsetParent) y += e.offsetTop;
  return y;
}
var menusMethods = {
  // 메뉴가 뜰 때: 커지는 기준점을 누른 자리로 둔다.
  // 방금 누른 게 없으면(하위 메뉴·키보드) 부모 메뉴 쪽 위 모서리에서 커진다.
  // 우클릭·보관함 메뉴처럼 이벤트가 끝난 뒤 채워지는 메뉴는 붙은 직후엔 크기가 없으므로,
  // 첫 화면을 그리기 직전(다음 프레임)에 잰다
  setupMenu(menu, press) {
    if (menu.lgSnap) return;
    const doc = menu.ownerDocument;
    const win = doc.defaultView || window;
    if (menu.lgReady) {
      menu.classList.remove("lg-menu-ready", "lg-menu-morph", "lg-bottom-auto", "lg-no-anim", "lg-min-w0");
      menu.style.removeProperty("width");
      menu.getAnimations().forEach((a) => a.cancel());
      menu.lgReady = false;
      menu.lgMorph = null;
      menu.lgMoveFrom = null;
      menu.lgReplaced = false;
    }
    win.setTimeout(() => menu.classList.add("lg-menu-ready"), 400);
    const now = win.performance.now();
    menu.lgBorn = now;
    const popSize = () => {
      const w = menu.offsetWidth, h = menu.offsetHeight;
      if (!w || !h) return;
      const k = (1 + MENU_POP / Math.max(w, h)).toFixed(4);
      menu.style.setProperty("--lg-menu-kx", k);
      menu.style.setProperty("--lg-menu-ky", k);
    };
    popSize();
    win.requestAnimationFrame(() => {
      popSize();
      win.requestAnimationFrame(popSize);
    });
    const pressed = press && now - press.t < (import_obsidian9.Platform.isMobile ? 1500 : 600);
    if (pressed) this.webPopTint(menu, press.target);
    const outside = pressed && !(isEl(press.target) && press.target.closest(".menu"));
    const sub = els(doc.querySelectorAll(".menu")).some((m) => m !== menu && !m.classList.contains("lg-menu-ghost") && !(outside && press.t > (m.lgBorn || 0)));
    const fresh2 = !sub && pressed;
    if (fresh2 && isEl(press.target)) {
      const key = menuKey(press.target);
      menu.lgKey = key;
      const live = els(doc.querySelectorAll(".menu")).find((m) => m !== menu && m.lgKey === key && !m.classList.contains("lg-menu-ghost"));
      const shut = this.lastShut;
      if (live) {
        menu.lgMoveFrom = live.getBoundingClientRect();
        live.lgReplaced = true;
      } else if (shut && shut.key === key && now - shut.t < 200) {
        menu.lgMoveFrom = shut.rect;
        if (shut.ghost) shut.ghost.remove();
        this.lastShut = null;
      }
    }
    const target = fresh2 && isEl(press.target) ? press.target : null;
    const morphSel = import_obsidian9.Platform.isPhone ? `.workspace-drawer-vault-switcher, select.dropdown, ${BASES_MENU_BTN}` : `.workspace-drawer-vault-switcher, select.dropdown, .mod-community-modal .community-modal-search > .clickable-icon, ${BASES_MENU_BTN}`;
    const src = target && target.closest(morphSel);
    if (src) menu.classList.add("lg-menu-morph");
    const settle = !!src && src.matches(BASES_MENU_BTN);
    let lastPos = "";
    let still = 0;
    const run = (tries) => {
      if (!menu.isConnected) return;
      if ((menu.offsetWidth < 2 || menu.offsetHeight < 2) && tries < 6) {
        win.requestAnimationFrame(() => run(tries + 1));
        return;
      }
      if (settle && tries < 24) {
        const r = menu.getBoundingClientRect();
        const pos = `${Math.round(r.left)},${Math.round(r.top)},${Math.round(r.width)},${Math.round(r.height)}`;
        still = pos === lastPos ? still + 1 : 0;
        lastPos = pos;
        if (still < 1) {
          win.requestAnimationFrame(() => run(tries + 1));
          return;
        }
      }
      try {
        if (src) {
          this.morphMenu(menu, src, settle);
          return;
        }
        const list = target && target.closest(".mod-root .workspace-tab-header-tab-list");
        const tabMenu = target && target.closest(".lg-tab-menu");
        const pathMenu = target && target.closest(".lg-path-menu");
        if (list) this.placeUnderTabBar(menu, list, null);
        else if (pathMenu) this.placeUnderTabBar(menu, pathMenu, pathMenu.closest(".lg-path-pill"));
        else if (tabMenu) this.placeUnderTabBar(menu, tabMenu, tabMenu.closest(".workspace-tab-header"));
        const rib = target && target.closest(".lg-rib-menu");
        if (rib) menu.style.top = `${layoutBottom(rib) + MENU_DROP}px`;
        const row = target && target.closest(".metadata-property");
        if (row) this.focusRow(menu, row);
        const subUp = sub ? this.tuckSubmenu(menu) : false;
        const conj = sub && pressed && isEl(press.target) ? press.target.closest(".bases-query-container select.conjunction.dropdown") : null;
        if (conj) this.placeBesideSelect(menu, conj);
        const r = menu.getBoundingClientRect();
        let ox;
        let oy;
        if (fresh2) {
          ox = press.x - r.left;
          oy = press.y - r.top;
        } else {
          const others = els(doc.querySelectorAll(".menu")).filter((m) => m !== menu && !m.classList.contains("lg-menu-ghost"));
          const parent = others[others.length - 1];
          const pr = parent && parent.getBoundingClientRect();
          ox = pr && pr.left + pr.width / 2 > r.left + menu.offsetWidth / 2 ? menu.offsetWidth : 0;
          oy = subUp ? menu.offsetHeight : 0;
          if (sub && parent) menu.lgParent = parent;
        }
        menu.style.transformOrigin = `${ox.toFixed(1)}px ${oy.toFixed(1)}px`;
        menu.lgOrigin = { x: r.left + ox, y: r.top + oy };
        const from = menu.lgMoveFrom;
        if (from) {
          menu.lgMoveFrom = null;
          menu.classList.add("lg-no-anim");
          const dx = from.left - r.left;
          const dy = from.top - r.top;
          menu.animate(
            [{ transform: `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px)` }, { transform: "none" }],
            { duration: MENU_MOVE_MS, easing: EASE.pop }
          );
        }
      } catch (err) {
        console.error("[glass-shelf] menu", err);
      } finally {
        menu.classList.add("lg-menu-ready");
        menu.lgReady = true;
        this.followHover(menu);
      }
    };
    win.requestAnimationFrame(() => run(0));
  },
  // 하위 메뉴를 부모 메뉴의 고른 항목 끝에 닿게 옮긴다. 오른쪽으로 열렸으면 왼쪽으로, 왼쪽으로 열렸으면 오른쪽으로
  tuckSubmenu(menu) {
    const doc = menu.ownerDocument;
    const r = menu.getBoundingClientRect();
    const parents = els(doc.querySelectorAll(".menu")).filter((m) => m !== menu && !m.classList.contains("lg-menu-ghost"));
    const parent = parents[parents.length - 1];
    if (!parent) return;
    const pr = parent.getBoundingClientRect();
    const item = parent.querySelector(".menu-item.selected") || parent.querySelector(".menu-item.has-submenu:hover");
    if (!item) return;
    const ir = item.getBoundingClientRect();
    let dx = 0;
    if (r.left >= pr.right - 4) dx = ir.right - r.left;
    else if (r.right <= pr.left + 4) dx = ir.left - r.right;
    if (Math.abs(dx) >= 0.5) {
      const left = parseFloat(menu.style.left);
      menu.style.left = `${((Number.isFinite(left) ? left : menu.offsetLeft) + dx).toFixed(1)}px`;
    }
    const items = menu.querySelectorAll(".menu-item");
    if (!items.length) return false;
    const top = parseFloat(menu.style.top);
    const y0 = Number.isFinite(top) ? top : menu.offsetTop;
    const h = menu.offsetHeight;
    const up = y0 + h <= ir.top + 4;
    const last = items[items.length - 1];
    let y = up ? ir.bottom - (itemTop(last, menu) + last.offsetHeight) : ir.top - itemTop(items[0], menu);
    const vh = (doc.defaultView || window).innerHeight;
    y = Math.max(4, Math.min(y, vh - h - 4));
    menu.style.top = `${y.toFixed(1)}px`;
    return up;
  },
  // 드롭다운 메뉴를 드롭다운 오른쪽 옆에 둔다(오른쪽에 자리가 없으면 왼쪽 옆). 첫 항목 위 끝을 드롭다운 위 끝에 맞춘다 (tuckSubmenu 와 같은 세로 규칙)
  placeBesideSelect(menu, sel) {
    const win = menu.ownerDocument.defaultView || window;
    const items = menu.querySelectorAll(".menu-item");
    if (!items.length) return;
    const r = sel.getBoundingClientRect();
    const w = menu.offsetWidth;
    const h = menu.offsetHeight;
    const x = r.right + w <= win.innerWidth - 4 ? r.right : Math.max(4, r.left - w);
    const y = Math.max(4, Math.min(r.top - itemTop(items[0], menu), win.innerHeight - h - 4));
    menu.style.left = `${x.toFixed(1)}px`;
    menu.style.top = `${y.toFixed(1)}px`;
  },
  // 검색 탭의 검색 제안: 검색창 유리(.search-input-container::after)가 제안 높이만큼 아래로 늘어나고,
  // 제안 목록은 배경 없이 그 늘어난 자리에 놓인다. 제안이 닫히면 다시 줄어든다
  attachSearchSuggest(pop, doc) {
    const input = doc.activeElement;
    const host = input && input.closest && input.closest('.workspace-leaf-content[data-type="search"] .search-input-container');
    if (!host) return;
    const win = doc.defaultView || window;
    pop.classList.add("lg-sugg-in");
    host.classList.add("lg-sugg-host");
    const place = () => {
      if (!pop.isConnected) return;
      const hr = host.getBoundingClientRect();
      const w = host.offsetWidth;
      const cx = hr.left + hr.width / 2;
      const cy = hr.top + hr.height / 2;
      placeSugg(pop, cx - w / 2, cy - host.offsetHeight / 2 + input.offsetTop + input.offsetHeight, w);
      host.style.setProperty("--lg-sugg-h", `${pop.offsetHeight}px`);
    };
    const ro = new win.ResizeObserver(place);
    ro.observe(pop);
    const moved = new win.MutationObserver(place);
    moved.observe(pop, { attributes: true, attributeFilter: ["style"] });
    place();
    const p = host.lgPress;
    const since = p ? performance.now() - p.t : Infinity;
    if (p && since < p.opt.duration) {
      const oy = host.offsetHeight / 2 - (input.offsetTop + input.offsetHeight);
      pop.style.transformOrigin = `${(host.offsetWidth / 2).toFixed(1)}px ${oy.toFixed(1)}px`;
      const a = pop.animate([{ offset: 0.34, scale: p.k.toFixed(3) }, { offset: 0.46, scale: p.k.toFixed(3) }], p.opt);
      a.currentTime = since;
    }
    const done = new win.MutationObserver(() => {
      if (pop.isConnected) return;
      done.disconnect();
      ro.disconnect();
      moved.disconnect();
      host.style.removeProperty("--lg-sugg-h");
      host.classList.remove("lg-sugg-host");
      this.releasePop(pop);
    });
    done.observe(doc.body, { childList: true });
  },
  // 화면에서 떼어진 제안 목록에서 플러그인 흔적(lg- 클래스, --lg- 변수, 움직임 기준점)을 걷는다.
  // Obsidian 은 제안 목록 요소를 떼어 두었다가 다시 쓰므로, 떼어진 채로 플러그인을 끄면 끌 때의 정리(teardown)가
  // 문서에서 찾지 못해 흔적이 남고, 테마만 쓸 때 다시 붙으며 모양이 깨졌다. 다시 붙으면 attach* 가 새로 붙인다
  releasePop(pop) {
    const cls = strs(pop.classList).filter((c) => c.startsWith("lg-"));
    if (cls.length) pop.classList.remove(...cls);
    for (const p of strs(pop.style)) if (p.startsWith("--lg-")) pop.style.removeProperty(p);
    pop.style.removeProperty("transform-origin");
  },
  // 메뉴 호버: Obsidian 이 항목에 붙이는 selected 를 지켜보고, 판 하나(.lg-menu-hl)가 그 항목으로 미끄러져 간다.
  // 처음 나타날 때는 제자리에서 흐려졌다 나타나고, 선택이 없어지면 흐려진다
  followHover(menu) {
    const scroll = menu.querySelector(".menu-scroll");
    if (!scroll || scroll.querySelector(":scope > .lg-menu-hl")) return;
    const hl = scroll.createDiv({ cls: "lg-menu-hl", prepend: true });
    menu.classList.add("lg-menu-follow");
    let shown = false;
    const place = () => {
      const item = scroll.querySelector(".menu-item.selected:not(.is-label):not(.is-disabled)");
      if (!item) {
        hl.classList.toggle("lg-hl-on", false);
        hl.classList.toggle("lg-hl-off", true);
        shown = false;
        return;
      }
      const x = item.offsetLeft;
      const y = item.offsetTop;
      if (!shown) hl.classList.add("lg-no-tr");
      hl.style.transform = `translate(${x}px, ${y}px)`;
      hl.style.width = `${item.offsetWidth}px`;
      hl.style.height = `${item.offsetHeight}px`;
      if (!shown) {
        void hl.offsetWidth;
        hl.classList.remove("lg-no-tr");
      }
      hl.classList.toggle("lg-hl-off", false);
      hl.classList.toggle("lg-hl-on", true);
      shown = true;
    };
    const win = menu.ownerDocument.defaultView || window;
    new win.MutationObserver((recs) => {
      if (recs.some((r) => r.target !== hl)) place();
    }).observe(scroll, { subtree: true, attributes: true, attributeFilter: ["class"] });
    place();
  },
  // 속성 칸 강조: 칸이 살짝 커지며 밝은 알약이 되고(CSS: .lg-row-focus), 메뉴는 칸 왼쪽 끝에 맞춰 10px 밑에.
  // 밑에 자리가 없으면 칸 바로 위에. 메뉴가 닫히면 칸은 제자리로 (closeMenu)
  focusRow(menu, row) {
    const win = menu.ownerDocument.defaultView || window;
    const r = row.getBoundingClientRect();
    const h = menu.offsetHeight;
    const below = r.bottom + 10;
    const top = below + h <= win.innerHeight - 8 ? below : Math.max(8, r.top - 10 - h);
    menu.style.left = `${Math.max(8, r.left)}px`;
    menu.style.top = `${top}px`;
    row.classList.add("lg-row-focus");
    menu.lgRow = row;
  },
  // 편집창 탭 줄의 메뉴를 탭 줄 버튼 바로 밑에 둔다. 오른쪽 끝은 alignEl(탭) 오른쪽 끝,
  // 없으면 편집창 오른쪽 여백선(탭 줄 오른쪽 끝 - --lg-gap)
  placeUnderTabBar(menu, btn, alignEl) {
    const tabs = btn.closest(".workspace-tabs");
    const header = tabs && tabs.querySelector(":scope > .workspace-tab-header-container");
    if (!header) return;
    const win = menu.ownerDocument.defaultView || window;
    const gap = parseFloat(win.getComputedStyle(menu.ownerDocument.body).getPropertyValue("--lg-gap")) || 10;
    const right = alignEl ? alignEl.getBoundingClientRect().right : tabs.getBoundingClientRect().right - gap;
    const left = Math.max(gap, right - menu.offsetWidth);
    menu.style.left = `${left}px`;
    const rowEl = btn.closest(".lg-path-pill, .lg-tab-tools") || (btn.matches(".workspace-tab-header-tab-list") ? btn : null);
    const bottom = rowEl ? layoutBottom(rowEl) : header.getBoundingClientRect().bottom - gap;
    menu.style.top = `${bottom + MENU_DROP}px`;
  },
  // 드롭다운을 Obsidian 메뉴로 연다: 항목마다 고른 것은 체크 표시. 고르면 드롭다운 값을 바꾸고 input·change 를 알려
  // 설정 화면 등이 운영체제 목록에서 고른 것과 똑같이 받는다
  openDropdownMenu(sel) {
    const win = sel.ownerDocument.defaultView || window;
    const menu = new import_obsidian9.Menu();
    sel.lgPickIdx = 0;
    let idx = 0;
    for (const opt of Array.from(sel.options)) {
      if (opt.hidden) continue;
      if (opt.selected) sel.lgPickIdx = idx;
      idx++;
      menu.addItem((it) => {
        it.setTitle(opt.text).setChecked(opt.selected);
        if (opt.disabled) it.setDisabled(true);
        it.onClick(() => {
          if (sel.value === opt.value) return;
          sel.value = opt.value;
          sel.dispatchEvent(new win.Event("input", { bubbles: true }));
          sel.dispatchEvent(new win.Event("change", { bubbles: true }));
        });
      });
    }
    sel.classList.add("has-active-menu");
    menu.onHide(() => {
      sel.classList.remove("has-active-menu");
      if (sel.isConnected) sel.focus({ preventScroll: true });
    });
    const b = sel.getBoundingClientRect();
    menu.showAtPosition({ x: b.right, y: b.bottom, width: b.width, overlap: true, left: true }, sel.ownerDocument);
  },
  // 보관함 전환 메뉴: 버튼이 메뉴의 왼쪽 아래 꼭짓점에 오게 둔다(위에 자리가 없으면 왼쪽 위 꼭짓점).
  // 버튼은 메뉴 가운데를 향해 돌진하며 작아져 사라지고, 둘 사이 중간 지점에서 메뉴 창이 넓어져 나온다.
  // 창 크기만 바뀌고 안의 내용은 제자리에 그대로 있다
  // keep: 메뉴를 옮기지 않고 Obsidian 이 둔 자리를 목표로 넓어진다 (Bases 보기 메뉴)
  morphMenu(menu, src, keep = false) {
    const win = menu.ownerDocument.defaultView || window;
    const b = src.getBoundingClientRect();
    const drop = src.matches("select");
    let up = false;
    if (drop) {
      menu.style.minWidth = `${b.width}px`;
      menu.classList.add("lg-dd-menu");
      const below = win.innerHeight - 8 - b.top;
      const above = b.bottom - 8;
      up = below < 120 && above > below;
      const room = up ? above : below;
      if (menu.offsetHeight > room) menu.style.maxHeight = `${room}px`;
    }
    const W = Math.max(menu.offsetWidth, b.width);
    const H = Math.max(menu.offsetHeight, b.height);
    if (drop) {
      menu.style.width = `${W}px`;
      menu.style.removeProperty("min-width");
    }
    if (keep) {
      menu.style.width = `${W}px`;
      menu.classList.add("lg-min-w0");
    }
    const downFirst = src.matches(".mod-community-modal .community-modal-search > .clickable-icon");
    const top = keep ? b.bottom + 4 : drop ? up ? b.bottom - H : b.top : downFirst ? b.top + H <= win.innerHeight - 8 ? b.top : Math.max(8, b.bottom - H) : b.bottom - H >= 8 ? b.bottom - H : b.top;
    const left = keep ? Math.max(10, Math.min(win.innerWidth - W - 10, b.left)) : drop ? Math.max(8, b.right - W) : src.matches(".workspace-drawer-vault-switcher") ? Math.max(16, b.left) : b.left;
    const anchor = drop ? "right" : "left";
    menu.style.left = `${left}px`;
    menu.style.top = `${top}px`;
    menu.classList.add("lg-bottom-auto");
    const mr = parseFloat(win.getComputedStyle(menu).borderTopLeftRadius) || 22;
    const full = { left, top, width: W, height: H, radius: mr };
    const bx = b.left + b.width / 2;
    const by = b.top + b.height / 2;
    const { ux, uy } = unitVec(bx, by, left + W / 2, top + H / 2);
    const dot = drop ? this.dotAt(bx, by, b.height) : this.dotAt(bx + ux * MORPH_DASH, by + uy * MORPH_DASH, b.height);
    menu.lgSrc = src;
    const leafEl = src.closest(".workspace-leaf-content");
    const slot = src.parentElement && [...src.parentElement.classList].find((c) => c.startsWith("bases-toolbar-") && c !== "bases-toolbar-item");
    menu.lgSrcFind = leafEl && slot ? () => leafEl.querySelector(`.${slot} > .text-icon-button`) : void 0;
    menu.lgMorph = { ux, uy, dot, anchor };
    if (!drop) {
      if (src.lgHide) src.lgHide.cancel();
      src.lgHide = this.dashOut(src, ux, uy);
    }
    const inner = menu.querySelector(".menu-scroll");
    if (drop && inner) inner.addEventListener("mousemove", (e) => e.stopPropagation(), { capture: true });
    const picked = drop && inner && inner.querySelectorAll(".menu-item")[src.lgPickIdx];
    if (picked && inner.scrollHeight > inner.clientHeight) {
      const pr = picked.getBoundingClientRect();
      const ir = inner.getBoundingClientRect();
      inner.scrollTop += pr.top - ir.top - (inner.clientHeight - pr.height) / 2;
    }
    if (inner) this.pinSize(inner);
    const grow = this.growBox(menu, inner ? [{ el: inner, anchor, layout: true }] : [], dot, full, 90);
    grow.onfinish = grow.oncancel = () => {
      if (inner) this.unpinSize(inner);
      if (keep) {
        menu.style.removeProperty("width");
        menu.classList.remove("lg-min-w0");
      }
    };
    if (inner) inner.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 140, delay: 120, easing: "ease-out", fill: "backwards" });
  },
  // 메뉴가 닫히면(Obsidian 이 떼어 낸 직후, 그리기 전) 똑같은 사본을 띄워 사라지는 모습을 그린다.
  // 보통 메뉴는 커졌던 기준점으로 줄며 흐려지고, 보관함 메뉴는 중간 지점으로 줄어든 뒤
  // 버튼이 거기서 나타나 메뉴 반대쪽으로 관성으로 지나쳤다가 제자리로 온다
  closeMenu(menu, doc) {
    if (menu.lgSnap) return;
    if (menu.lgRow && !menu.lgReplaced) menu.lgRow.classList.remove("lg-row-focus");
    if (!menu.lgReady || menu.lgReplaced) return;
    try {
      const win = doc.defaultView || window;
      const ghost = menu.cloneNode(true);
      ghost.classList.add("lg-menu-ghost");
      doc.body.appendChild(ghost);
      win.setTimeout(() => ghost.remove(), 900);
      if (menu.lgKey) this.lastShut = { key: menu.lgKey, rect: ghost.getBoundingClientRect(), t: win.performance.now(), ghost };
      let src = menu.lgSrc;
      if (src && !src.isConnected && menu.lgSrcFind) src = menu.lgSrcFind() || src;
      if (menu.lgMorph && src && src.isConnected) {
        const { ux, uy, dot, anchor } = menu.lgMorph;
        const r = ghost.getBoundingClientRect();
        const mr = parseFloat(win.getComputedStyle(ghost).borderTopLeftRadius) || 22;
        const full = { left: r.left, top: r.top, width: r.width, height: r.height, radius: mr };
        const drop = src.matches("select");
        const inner = ghost.querySelector(".menu-scroll");
        if (inner) this.pinSize(inner);
        if (inner) inner.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 60, easing: "ease-in", fill: "forwards" });
        this.shrinkBox(ghost, inner && !drop ? [{ el: inner, anchor: anchor || "left", layout: true }] : [], full, dot).onfinish = () => ghost.remove();
        if (src.lgHide) {
          src.lgHide.cancel();
          src.lgHide = null;
        }
        if (!drop) this.dashBack(src, ux, uy, 110);
      } else {
        let top = menu;
        while (top.lgParent && !top.lgParent.isConnected) top = top.lgParent;
        const o = top.lgOrigin;
        if (o) {
          const r = ghost.getBoundingClientRect();
          ghost.style.transformOrigin = `${(o.x - r.left).toFixed(1)}px ${(o.y - r.top).toFixed(1)}px`;
        }
        ghost.animate(
          [
            { opacity: 1, transform: "scale(1)" },
            { opacity: 0, transform: "scale(0.5)" }
          ],
          { duration: 110, easing: EASE.exit, fill: "forwards" }
        ).onfinish = () => ghost.remove();
      }
    } catch (err) {
      console.error("[glass-shelf] menu-close", err);
    }
  },
  // 버튼이 메뉴를 연다. 이 버튼이 연 메뉴가 열려 있으면 새로 열지 않고 닫는다.
  // 메뉴는 이 버튼을 부모(setParentElement)로 두므로, 열려 있는 동안 Obsidian 이 버튼에 has-active-menu 를 붙인다
  // (CSS: 버튼 기호가 회색. Obsidian 기본 버튼과 같은 표시)
  toggleMenu(el, open) {
    const wasOpen = el.lgWasOpen;
    el.lgWasOpen = false;
    if (wasOpen || el.classList.contains("has-active-menu")) {
      this.tellMenus(el, "click");
      return;
    }
    open();
  },
  // Obsidian 메뉴는 창의 mousedown·click 으로 바깥 누름을 알아채 닫힌다. 버튼은 이벤트 전파를 막으므로 창에 따로 알린다.
  // mousedown: 부모가 이 버튼인 메뉴는 두고 나머지를 닫는다. click: 이 버튼이 연 메뉴도 닫는다
  tellMenus(el, type) {
    try {
      const win = el.ownerDocument.defaultView || window;
      const ev = new win.MouseEvent(type, { bubbles: false, cancelable: true });
      Object.defineProperty(ev, "targetNode", { value: el });
      Object.defineProperty(ev, "target", { value: el });
      win.dispatchEvent(ev);
    } catch (err) {
      console.error("[glass-shelf] menus", err);
    }
  },
  // 버튼이 메뉴를 여는지: 정렬 버튼(이름·기호)이거나, 전에 눌렀을 때 메뉴가 열렸던 버튼
  opensMenu(b) {
    const label = b.getAttribute("aria-label") || "";
    if (this.menuButtons && this.menuButtons.has(label)) return true;
    const svg = b.querySelector("svg");
    const icon = svg ? strs(svg.classList).join(" ") : "";
    return /정렬|sort/i.test(label) || /lucide-(sort|arrow-up-narrow|arrow-down-narrow|arrow-up-down)/.test(icon);
  },
  // 메뉴 항목 목록 읽기: 제목·기호·체크·비활성·구분선
  readMenu(m) {
    return els(m.querySelectorAll(".menu-item, .menu-separator")).map((el) => {
      if (el.classList.contains("menu-separator")) return { sep: true };
      const svg = el.querySelector(".menu-item-icon:not(.mod-checked) svg");
      const icon = svg ? strs(svg.classList).find((c) => c.startsWith("lucide-")) : null;
      return {
        title: ((el.querySelector(".menu-item-title") || el).textContent || "").trim(),
        icon,
        checked: el.classList.contains("mod-checked") || !!el.querySelector(".mod-checked"),
        disabled: el.classList.contains("is-disabled")
      };
    });
  },
  // 버튼이 여는 Obsidian 메뉴를 보이지 않게 열어 run(메뉴)을 한 뒤 닫는다 (run 이 항목을 누르면 Obsidian 이 알아서 닫는다).
  // 이 메뉴는 애니메이션·닫힘 사본을 만들지 않는다 (lgSnap: setupMenu·closeMenu 가 건너뛴다)
  withHiddenMenu(b, run) {
    return new Promise((resolve) => {
      const doc = b.ownerDocument;
      const win = doc.defaultView || window;
      const head = b.closest(".nav-header");
      const before = new Set(doc.querySelectorAll(".menu"));
      doc.body.classList.add("lg-menu-snap");
      if (head) head.classList.add("lg-nav-proxy");
      let m = null;
      try {
        b.dispatchEvent(new win.MouseEvent("click", { bubbles: true, cancelable: true, view: win }));
        m = els(doc.querySelectorAll(".menu")).find((x) => !before.has(x)) || null;
      } catch (err) {
        console.error("[glass-shelf] nav menu", err);
      }
      const done = (v) => {
        doc.body.classList.remove("lg-menu-snap");
        if (head) head.classList.remove("lg-nav-proxy");
        resolve(v);
      };
      if (!m) return done(null);
      const menu = m;
      menu.lgSnap = true;
      win.setTimeout(() => {
        let v = null;
        try {
          v = run(menu);
        } catch (err) {
          console.error("[glass-shelf] nav menu", err);
        }
        if (menu.isConnected) this.tellMenus(b, "click");
        win.setTimeout(() => {
          if (menu.isConnected) menu.remove();
          done(v);
        }, menu.isConnected ? 40 : 0);
      }, 40);
    });
  },
  // 원래 버튼을 대신 눌러 준다. 원래 버튼이 여는 메뉴(정렬 등)는 anchor 아래(drop 만큼 띄워)에 뜬다.
  // Obsidian 메뉴는 부모로 정한 버튼이 화면에 없으면(0.5초마다 확인) 스스로 닫힌다. 버튼 줄은 숨겨 두었으므로
  // 메뉴가 떠 있는 동안 버튼 줄을 보이지 않게 자리만 잡아 둔다(.lg-nav-proxy). 메뉴가 닫히면(has-active-menu 해제) 푼다
  clickOriginal(b, anchor, drop = MENU_DROP) {
    const r = anchor.getBoundingClientRect();
    const head = b.closest(".nav-header");
    window.setTimeout(() => {
      if (head) head.classList.add("lg-nav-proxy");
      b.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: window, clientX: r.left, clientY: r.bottom + drop }));
      if (!head) return;
      const release = () => head.classList.remove("lg-nav-proxy");
      if (!b.classList.contains("has-active-menu")) return release();
      (this.menuButtons || (this.menuButtons = /* @__PURE__ */ new Set())).add(b.getAttribute("aria-label") || "");
      const obs = new MutationObserver(() => {
        if (b.classList.contains("has-active-menu") && b.isConnected) return;
        obs.disconnect();
        release();
      });
      obs.observe(b, { attributes: true, attributeFilter: ["class"] });
    }, 0);
  }
};

// src/morph.ts
var morphMethods = {
  // 창이 작은 동안 안의 내용이 따라 줄지 않게 크기를 잠시 고정한다
  pinSize(el) {
    el.style.width = `${el.offsetWidth}px`;
    el.style.height = `${el.offsetHeight}px`;
    el.classList.add("lg-pinned");
  },
  unpinSize(el) {
    el.style.removeProperty("width");
    el.style.removeProperty("height");
    el.classList.remove("lg-pinned");
  },
  // 돌진한 버튼이 사라지는 지점의 작은 원 (버튼 높이의 60%)
  dotAt(x, y, h) {
    const d = h * 0.6;
    return { left: x - d / 2, top: y - d / 2, width: d, height: d, radius: d / 2 };
  },
  // 상자(left·top·width·height·모서리)를 from → to 로 바꾼다. 안의 내용(kids)은 keep 상자 기준 자리에
  // 머물도록 반대로 옮긴다 (anchor: 내용이 붙어 있는 쪽, left 또는 right)
  // 상자(left·top·width·height·모서리)를 frames 대로 바꾼다. frames: [{ box, radius?, offset?, easing? }]
  // (box 가 없으면 모서리만). 안의 내용(kids)은 keep 상자 기준 자리에 머물도록 반대로 옮긴다
  // (anchor: 내용이 붙어 있는 쪽, left 또는 right)
  boxMorph(el, kids, frames, keep, opt) {
    const meta = (fr, k) => {
      if (fr.offset != null) k.offset = fr.offset;
      if (fr.easing) k.easing = fr.easing;
      return k;
    };
    const anim = el.animate(
      frames.map((fr) => {
        const k = {};
        if (fr.box) {
          k.left = `${fr.box.left}px`;
          k.top = `${fr.box.top}px`;
          k.width = `${fr.box.width}px`;
          k.height = `${fr.box.height}px`;
        }
        const r = fr.radius != null ? fr.radius : fr.box && fr.box.radius;
        if (r != null) k.borderRadius = `${r}px`;
        return meta(fr, k);
      }),
      opt
    );
    for (const kid of kids) {
      const ax = (x) => kid.anchor === "right" ? x.left + x.width : x.left;
      kid.el.animate(
        frames.map(
          (fr) => meta(
            fr,
            !fr.box ? {} : kid.layout ? { marginLeft: `${ax(keep) - ax(fr.box)}px`, marginTop: `${keep.top - fr.box.top}px` } : { translate: `${ax(keep) - ax(fr.box)}px ${keep.top - fr.box.top}px` }
          )
        ),
        opt
      );
    }
    return anim;
  },
  // 작은 원(dot)에서 창(full)으로 넓어지며 나타난다. 넓어지는 도중엔 더 둥글다가 다 펼쳐지면 원래 곡률,
  // 살짝 지나친 크기에서 천천히 제 크기로 돌아온다. 좌표는 el 의 위치 기준 좌표계
  growBox(el, kids, dot, full, delay) {
    const grow = (p) => full[p] + (full[p] - dot[p]) * 0.02;
    const over = { left: grow("left"), top: grow("top"), width: grow("width"), height: grow("height") };
    const round = Math.min(full.width, full.height) / 2;
    const opt = { duration: 420, delay, easing: "linear", fill: "backwards" };
    el.animate([{ opacity: 0 }, { offset: 0.2, opacity: 1 }, { opacity: 1 }], opt);
    const { ux, uy } = unitVec(dot.left + dot.width / 2, dot.top + dot.height / 2, full.left + full.width / 2, full.top + full.height / 2);
    el.animate(
      [
        { translate: "0 0", easing: EASE.burst },
        { offset: 0.42, translate: `${(ux * MORPH_NUDGE).toFixed(1)}px ${(uy * MORPH_NUDGE).toFixed(1)}px`, easing: EASE.ret },
        { translate: "0 0" }
      ],
      opt
    );
    return this.boxMorph(
      el,
      kids,
      [
        { box: dot, easing: EASE.burst },
        // 펼쳐지는 도중에 가장 둥글고, 다 펼쳐질 때(지나친 지점) 이미 원래 곡률
        { radius: round, offset: 0.18, easing: "cubic-bezier(0.3, 0, 0.5, 1)" },
        { box: over, radius: full.radius, offset: 0.42, easing: EASE.ret },
        { box: full }
      ],
      full,
      opt
    );
  },
  // 창(full)이 작은 원(dot)으로 줄며 사라진다 (반동 없이, 도중엔 더 둥글게)
  shrinkBox(el, kids, full, dot) {
    const round = Math.min(full.width, full.height) / 2;
    const opt = { duration: 200, easing: EASE.exit, fill: "forwards" };
    el.animate([{ opacity: 1 }, { offset: 0.7, opacity: 1 }, { opacity: 0 }], opt);
    return this.boxMorph(el, kids, [{ box: full }, { radius: round, offset: 0.45 }, { box: dot }], full, opt);
  },
  // 알약 버튼(가로가 긴 것)이 원이 되려면 유리 층을 양옆에서 얼마나 줄여야 하는지. 원형 버튼이면 0
  pillInset(el) {
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    if (el.matches(".lg-kb-group")) return (w - h * KB_PILL_DOT) / 2;
    return el.matches(`.workspace-drawer-vault-switcher, ${BASES_MENU_BTN}`) && w > h * 1.3 ? (w - h) / 2 : 0;
  },
  // 버튼이 흐려지고 나타나는 효과. 요소 자체의 opacity 를 움직이면 그동안 요소가 뒤 화면을 떠 오는 경계(Backdrop Root)가 되어
  // 유리 층(::after)의 채움·색조·굴절이 꺼졌다가 애니메이션이 끝나야 돌아온다. 그래서 유리 층과 안의 내용에 따로 건다.
  // 유리 층이 없는 묶음(그래프 버튼들)은 그 안의 버튼마다 같은 방식으로 건다
  fadeParts(el, frames, opt) {
    if (el.lgFade) el.lgFade.forEach((a) => a.cancel());
    const win = el.ownerDocument.defaultView || window;
    const glassy = (n) => win.getComputedStyle(n, "::after").backdropFilter !== "none";
    const anims = [];
    const walk = (n, top) => {
      if (n.classList.contains("lg-hover-glass")) return;
      if (glassy(n)) {
        anims.push(n.animate(frames, { ...opt, pseudoElement: "::after" }));
        for (const c of n.children) walk(c, false);
      } else if (top) {
        for (const c of n.children) walk(c, false);
      } else {
        anims.push(n.animate(frames, opt));
      }
    };
    walk(el, true);
    el.lgFade = anims;
  },
  // 버튼이 (ux, uy) 방향으로 MORPH_DASH 만큼 움직이며 투명하게 사라진다 (사라진 채로 남는다)
  dashOut(el, ux, uy) {
    const d = MORPH_DASH;
    el.classList.add("lg-dashed");
    const c = this.pillInset(el);
    const slow = el.matches(".lg-kb-group");
    const dur = slow ? KB_DASH_MS : 160;
    if (el.lgGlassAnim) el.lgGlassAnim.cancel();
    el.lgGlassAnim = c ? el.animate([{ left: "0px", right: "0px" }, { left: `${c}px`, right: `${c}px` }], {
      duration: slow ? dur * 0.7 : dur,
      easing: "cubic-bezier(0.4, 0, 0.6, 1)",
      fill: "forwards",
      pseudoElement: "::after"
    }) : null;
    const opt = { duration: dur, easing: "cubic-bezier(0.4, 0, 0.6, 1)", fill: "forwards" };
    this.fadeParts(el, slow ? [{ opacity: 1 }, { offset: 0.7, opacity: 1 }, { opacity: 0 }] : [{ opacity: 1 }, { opacity: 0 }], opt);
    if (slow) {
      for (const k of el.children) el.lgFade?.push(k.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 90, easing: "ease-in", fill: "forwards" }));
    }
    const out = this.dashMove(el, [{ translate: "0 0" }, { translate: `${(ux * d).toFixed(1)}px ${(uy * d).toFixed(1)}px` }], opt);
    out.id = "lg-dash-out";
    return out;
  },
  // 사라졌던 버튼이 돌진했던 자리에서 나타나 제자리를 반대쪽으로 MORPH_OVERSHOOT 만큼 지나쳤다가 돌아온다
  dashBack(el, ux, uy, delay) {
    const d = MORPH_DASH;
    el.classList.remove("lg-dashed");
    const o = MORPH_OVERSHOOT;
    if (el.lgGlassAnim) {
      el.lgGlassAnim.cancel();
      el.lgGlassAnim = null;
    }
    const c = this.pillInset(el);
    if (c) {
      el.animate(
        [
          { left: `${c}px`, right: `${c}px` },
          { offset: 0.6, left: "-2px", right: "-2px" },
          { left: "0px", right: "0px" }
        ],
        { duration: 360, delay, easing: "ease-out", fill: "backwards", pseudoElement: "::after" }
      );
    }
    const opt = { duration: 360, delay, easing: "ease-out", fill: "backwards" };
    this.fadeParts(el, [{ opacity: 0 }, { offset: 0.3, opacity: 1 }, { opacity: 1 }], opt);
    const back = this.dashMove(
      el,
      [
        { translate: `${(ux * d).toFixed(1)}px ${(uy * d).toFixed(1)}px` },
        { offset: 0.6, translate: `${(-ux * o).toFixed(1)}px ${(-uy * o).toFixed(1)}px` },
        { translate: "0 0" }
      ],
      opt
    );
    back.id = "lg-dash-back";
    return back;
  },
  // 돌진 움직임. Bases 보기 버튼은 요소 자체를 옮기지 않고 보이는 층(유리 ::after, 링 ::before, 안의 내용)만 옮긴다:
  // Obsidian 이 그 메뉴를 버튼 자리 기준으로 매 프레임 다시 놓아, 버튼을 옮기면 메뉴가 따라 내려갔다 (사용자 지적)
  dashMove(el, frames, opt) {
    if (!el.matches(BASES_MENU_BTN)) return el.animate(frames, opt);
    const main = el.animate(frames, { ...opt, pseudoElement: "::after" });
    const rest = [el.animate(frames, { ...opt, pseudoElement: "::before" }), ...Array.from(el.children).filter((k) => !k.classList.contains("lg-hover-glass")).map((k) => k.animate(frames, opt))];
    main.addEventListener("cancel", () => rest.forEach((a) => a.cancel()));
    return main;
  },
  // 그래프 설정 창: 설정 버튼(원)이 창의 오른쪽 위 꼭짓점. 버튼은 창 가운데를 향해 돌진하며 사라지고,
  // 둘 사이 중간 지점에서 창이 넓어져 나온다. 창 크기만 바뀌고 안의 내용은 제자리에 있다.
  // 창은 부모 안의 절대 위치라, 화면 좌표를 부모 기준 좌표로 바꿔 움직인다
  graphBoxes(gc, panel, btn) {
    const op = gc.offsetParent || gc.parentElement || gc.ownerDocument.body;
    const o = op.getBoundingClientRect();
    const ox = o.left + op.clientLeft;
    const oy = o.top + op.clientTop;
    const win = gc.ownerDocument.defaultView || window;
    const radius = parseFloat(win.getComputedStyle(gc).borderTopLeftRadius) || btn / 2;
    const full = { left: panel.left - ox, top: panel.top - oy, width: panel.width, height: panel.height, radius };
    const gx = panel.right - btn / 2;
    const gy = panel.top + btn / 2;
    const { ux, uy } = unitVec(gx, gy, panel.left + panel.width / 2, panel.top + panel.height / 2);
    const dot = this.dotAt(gx + ux * MORPH_DASH - ox, gy + uy * MORPH_DASH - oy, btn);
    return { full, dot, ux, uy };
  },
  // 창 안의 내용: 흐르는 부분(설정 묶음)은 왼쪽, 닫기·초기화 버튼은 오른쪽에 붙어 있다
  graphKids(el) {
    return els(el.children).map((c) => ({ el: c, anchor: c.classList.contains("graph-controls-button") ? "right" : "left" }));
  },
  graphOpen(gc) {
    if (!gc || !gc.parentElement) return;
    const parent = gc.parentElement;
    try {
      const doc = gc.ownerDocument;
      const win = doc.defaultView || window;
      const btn = parseFloat(win.getComputedStyle(doc.body).getPropertyValue("--lg-btn")) || 34;
      const ghost = gc.cloneNode(true);
      ghost.classList.add("lg-graph-ghost");
      parent.appendChild(ghost);
      win.setTimeout(() => ghost.remove(), 900);
      win.requestAnimationFrame(() => {
        if (gc.classList.contains("is-close")) return ghost.remove();
        const box = this.graphBoxes(gc, gc.getBoundingClientRect(), btn);
        this.dashOut(ghost, box.ux, box.uy).onfinish = () => ghost.remove();
        const kids = this.graphKids(gc);
        const fixed = kids.filter((k) => k.anchor === "left").map((k) => {
          k.el.style.width = `${k.el.offsetWidth}px`;
          return k.el;
        });
        const tgs = gc.querySelectorAll(".checkbox-container");
        tgs.forEach((t) => t.classList.add("lg-tg-float"));
        const anim = this.growBox(gc, kids, box.dot, box.full, 90);
        const done = () => {
          fixed.forEach((c) => c.style.removeProperty("width"));
          win.requestAnimationFrame(() => win.requestAnimationFrame(() => tgs.forEach((t) => t.classList.remove("lg-tg-float"))));
        };
        anim.onfinish = done;
        anim.oncancel = done;
      });
    } catch (err) {
      console.error("[glass-shelf] graph-open", err);
    }
  },
  // 닫기: 열린 창의 사본이 중간 지점의 원으로 줄어 사라지고, 접힌 버튼들이 거기서 나타나
  // 반대쪽으로 조금 지나쳤다가 제자리로 온다
  graphClose(gc) {
    if (!gc || gc.classList.contains("is-close") || !gc.parentElement) return;
    const parent = gc.parentElement;
    try {
      const doc = gc.ownerDocument;
      const win = doc.defaultView || window;
      const btn = parseFloat(win.getComputedStyle(doc.body).getPropertyValue("--lg-btn")) || 34;
      const box = this.graphBoxes(gc, gc.getBoundingClientRect(), btn);
      const ghost = gc.cloneNode(true);
      ghost.classList.add("lg-graph-ghost");
      parent.appendChild(ghost);
      win.setTimeout(() => ghost.remove(), 900);
      const kids = this.graphKids(ghost);
      kids.forEach((k) => {
        if (k.anchor === "left") k.el.style.width = `${k.el.offsetWidth}px`;
        k.el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 60, easing: "ease-in", fill: "forwards" });
      });
      this.shrinkBox(ghost, kids, box.full, box.dot).onfinish = () => ghost.remove();
      win.requestAnimationFrame(() => this.dashBack(gc, box.ux, box.uy, 110));
    } catch (err) {
      console.error("[glass-shelf] graph-close", err);
    }
  }
};

// src/folders.ts
var import_obsidian10 = require("obsidian");
var foldersMethods = {
  // 폴더 기호 색 (CSS: --lg-folder-icon). 파랑은 테마의 기호를 그대로 쓴다.
  // 그 밖의 색은 테마 파랑 폴더와 같은 짜임으로 다시 그린다: 앞판 아래 = 고른 색, 앞판 위 = 흰색 22%, 뒤판 = 검정 15%, 빛 선 = 흰색 55%
  applyFolderColor(doc) {
    const b = doc.body;
    if (!b) return;
    const s = this.settings;
    if (s.folderColor === "accent" || s.folderColor === "custom") b.setCssProps({ "--lg-folder-tint": s.folderColor === "accent" ? "var(--interactive-accent)" : s.folderColorCustom });
    else b.style.removeProperty("--lg-folder-tint");
    if (s.folderColor !== "accent" && s.folderColor !== "custom") return b.style.removeProperty("--lg-folder-icon");
    const rgb = resolveRgb(doc, s.folderColor === "accent" ? "var(--interactive-accent)" : s.folderColorCustom);
    if (!rgb) return b.style.removeProperty("--lg-folder-icon");
    b.style.setProperty("--lg-folder-icon", folderIconUrl(rgb));
  },
  // ---------- 폴더 색 ----------
  // 색은 폴더 이름 기준: 공유 설정(data.json)의 folderColorsByName { 폴더 이름: "#hex" }. 이름이 같은 폴더는 어디에 있든
  // (최상위 포함) 같은 색이고, 같은 이름으로 새로 만든 폴더도 바로 그 색이 된다 (사용자 요청. PARA 범주마다 같은 분야 폴더가 생긴다).
  // 예전 경로 기준(folderColors)은 한 번 이름 기준으로 옮긴다.
  // 파일 탐색기의 색 지정 폴더(.nav-folder)에 lg-fc 클래스와 변수(--lg-fc 색, --lg-folder-icon 그 색 기호)를 붙이면
  // 하위 폴더는 변수를 물려받아 같은 색이 된다 (하위에 따로 지정한 색이 있으면 그 색). 글자·화살표·세로줄은 CSS(styles.css)가 칠한다.
  // :has() 로 경로를 찾지 않으려고 플러그인이 요소에 직접 붙인다 (넓은 범위 :has 는 끌기 렉)
  async setupFolderColors(raw) {
    if (!raw.folderColorsByName || typeof raw.folderColorsByName !== "object") {
      const byPath = raw.folderColors && typeof raw.folderColors === "object" ? raw.folderColors : null;
      const byName = {};
      for (const [path, hex] of Object.entries(byPath || {})) if (hexToRgb(hex)) byName[path.split("/").pop() || path] = hex;
      this.shared.folderColorsByName = byName;
      delete this.shared.folderColors;
      await this.saveData(this.shared);
    }
    this.registerEvent(
      this.app.workspace.on("file-menu", (menu, file) => {
        if (!(file instanceof import_obsidian10.TFolder) || file.isRoot()) return;
        menu.addItem((item) => item.setTitle(tr("\uD3F4\uB354 \uC0C9", "Folder color")).setIcon("palette").onClick(() => this.pickFolderColor(file)));
      })
    );
    const nameUsed = (name) => this.app.vault.getAllFolders().some((f) => f.name === name);
    this.registerEvent(
      this.app.vault.on("rename", (file, oldPath) => {
        if (!(file instanceof import_obsidian10.TFolder)) return;
        const map = this.shared.folderColorsByName;
        const oldName = oldPath.split("/").pop();
        if (oldName === file.name || !map[oldName] || nameUsed(oldName)) return;
        if (!map[file.name]) map[file.name] = map[oldName];
        delete map[oldName];
        void this.saveFolderColors();
      })
    );
    this.registerEvent(
      this.app.vault.on("delete", (file) => {
        if (!(file instanceof import_obsidian10.TFolder)) return;
        const map = this.shared.folderColorsByName;
        if (!map[file.name] || nameUsed(file.name)) return;
        delete map[file.name];
        void this.saveFolderColors();
      })
    );
    this.app.workspace.onLayoutReady(() => this.requestFolderColors());
  },
  async saveFolderColors() {
    await this.saveData(this.shared);
    this.requestFolderColors(true);
  },
  // 색 고르기: 그 이름에 색을 정한다 (같은 이름 폴더 모두)
  pickFolderColor(folder) {
    const map = this.shared.folderColorsByName;
    new FolderColorModal(this.app, folder, map[folder.name], (hex) => {
      if (hex) map[folder.name] = hex;
      else delete map[folder.name];
      const n = this.app.vault.getAllFolders().filter((f) => f.name === folder.name).length;
      if (n > 1) new import_obsidian10.Notice(tr(`'${folder.name}' \uC774\uB984\uC758 \uD3F4\uB354 ${n}\uAC1C\uC5D0 ${hex ? "\uC0C9\uC744 \uC801\uC6A9\uD588\uC2B5\uB2C8\uB2E4." : "\uC9C0\uC815\uD55C \uC0C9\uC744 \uC9C0\uC6E0\uC2B5\uB2C8\uB2E4."}`, `${hex ? "Applied the color to" : "Cleared the color of"} ${n} folders named '${folder.name}'.`));
      void this.saveFolderColors();
    }, this.folderPalette()).open();
  },
  // 색 고르기 창의 팔레트: 설정에서 고친 것(공유 data.json 의 folderPalette [[이름, "#hex"], …]), 없으면 기본(FOLDER_PALETTE)
  folderPalette() {
    const p = this.shared && this.shared.folderPalette;
    return Array.isArray(p) ? p : FOLDER_PALETTE;
  },
  // 아직 폴더 색·줄무늬 감시를 달지 않은 파일 탐색기 목록이 있는지
  hasNewExplorer() {
    if (!this.fcWatched) return true;
    for (const doc of this.docs) {
      for (const list of doc.querySelectorAll('.workspace-leaf-content[data-type="file-explorer"] .nav-files-container')) if (!this.fcWatched.has(list)) return true;
    }
    return false;
  },
  // 이 이름을 쓰는 폴더 수
  folderCount(name) {
    return this.app.vault.getAllFolders().filter((f) => f.name === name).length;
  },
  // 폴더가 새로 그려질 때(펼치기·새 폴더) 다시 칠한다. 파일 탐색기 목록마다 한 번 감시를 단다
  requestFolderColors(all) {
    if (this.unloaded) return;
    if (all) this.fcAll = true;
    if (this.fcFrame) return;
    this.fcFrame = window.requestAnimationFrame(() => {
      this.fcFrame = 0;
      const full = !!this.fcAll;
      this.fcAll = false;
      this.applyFolderColors(full);
    });
  },
  applyFolderColors(full) {
    const map = this.shared && this.shared.folderColorsByName || {};
    if (!this.fcWatched) {
      this.fcWatched = /* @__PURE__ */ new WeakSet();
      this.register(() => {
        for (const doc of this.docs) doc.querySelectorAll(".nav-folder.lg-fc").forEach((f) => delete f.dataset.lgFc);
      });
    }
    for (const doc of this.docs) {
      for (const list of doc.querySelectorAll('.workspace-leaf-content[data-type="file-explorer"] .nav-files-container')) {
        if (!this.fcWatched.has(list)) {
          this.fcWatched.add(list);
          const win = doc.defaultView || window;
          const obs = new win.MutationObserver((records) => {
            for (const r of records) {
              if (r.target.closest && r.target.closest(".lg-stripes")) continue;
              if (r.type === "childList") {
                if (els(r.addedNodes).concat(els(r.removedNodes)).every((nd) => nd.classList && nd.classList.contains("lg-stripes"))) continue;
                this.followStripes(list);
                return this.requestFolderColors();
              }
              if (r.target.classList.contains("tree-item-self")) this.stripeUnder(list);
              const now = r.target.classList.contains("is-collapsed");
              const was = (r.oldValue || "").split(/\s+/).includes("is-collapsed");
              if (now !== was) {
                this.followStripes(list);
                return this.requestFolderColors();
              }
            }
          });
          obs.observe(list, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"], attributeOldValue: true });
          const hover = () => this.stripeUnder(list);
          list.addEventListener("pointerover", hover, { passive: true });
          list.addEventListener("pointerleave", hover, { passive: true });
          this.register(() => {
            list.removeEventListener("pointerover", hover);
            list.removeEventListener("pointerleave", hover);
          });
          this.observers.push(obs);
          const ro = new win.ResizeObserver(() => this.requestFolderColors());
          ro.observe(list);
          this.observers.push(ro);
        }
        for (const title of list.querySelectorAll(".nav-folder-title[data-path]")) {
          const f = title.parentElement;
          if (!f) continue;
          const hex = map[title.dataset.path.split("/").pop()];
          const was = f.dataset.lgFc || "";
          if ((hex || "") === was && !full) continue;
          if (hex) {
            const rgb = hexToRgb(hex);
            f.dataset.lgFc = hex;
            f.classList.add("lg-fc");
            f.style.setProperty("--lg-fc", hex);
            if (rgb) {
              f.style.setProperty("--lg-folder-icon", folderIconUrl(rgb));
              f.style.setProperty("--lg-file-icon", fileIconUrl(rgb));
            }
          } else if (was) {
            delete f.dataset.lgFc;
            f.classList.remove("lg-fc");
            f.style.removeProperty("--lg-fc");
            f.style.removeProperty("--lg-folder-icon");
            f.style.removeProperty("--lg-file-icon");
          }
        }
        this.applyStripes(list);
      }
    }
  },
  // 파일 탐색기 줄무늬 (사용자 요청, macOS Finder 목록 보기 참고): 한 줄 건너 한 줄에 흰 줄 (CSS: .lg-stripes, 줄 곡률 그대로).
  // 줄 자체 배경으로 칠하면 들여쓰기 세로선을 덮어서, 목록 맨 뒤 층(.lg-stripes, z-index -1)에 막대를 따로 그린다.
  // 몇째 줄인지는 Finder 처럼 보이는 줄의 순서로 센다: 처음 그려진 줄의 번호만 위치(목록 위 여백을 뺀 거리 / 줄 높이)로 정하고
  // (Obsidian 은 보이는 부분만 그린다), 그다음은 DOM 순서대로 하나씩 더한다. 예전엔 줄마다 위치로 셌는데, 열고 닫는
  // 애니메이션 중에 움직이는 줄은 위치가 줄 높이의 배수가 아니라 줄무늬가 켜졌다 꺼졌다 깜빡였다(사용자 지적).
  // 막대는 줄마다 하나씩 붙여 두고(stripeBars) 그 줄을 따라 움직인다. 열리고 닫히는 폴더 안쪽 줄은 그 폴더의 보이는 영역으로 자른다.
  // 폭은 목록 안쪽 폭에서 맨 위 단계 줄의 좌우 여백을 뺀 값 (스크롤바가 생겨도 무늬 폭이 줄 폭을 따라 들쭉날쭉하지 않게).
  // 설정에서 끄면(fileStripes) 층을 비운다
  applyStripes(list) {
    const m = this.rowExtent(list);
    let layer = list.querySelector(":scope > .lg-stripes");
    if (!this.settings.fileStripes || import_obsidian10.Platform.isMobile) {
      if (layer) layer.remove();
      list.classList.remove("lg-has-stripes");
      return;
    }
    if (!layer) {
      layer = createDiv({ cls: ["lg-stripes", INJECTED] });
      list.appendChild(layer);
    }
    list.classList.add("lg-has-stripes");
    if (!this.stripeBars) this.stripeBars = /* @__PURE__ */ new WeakMap();
    const rows = m.rows, rects = m.rects, lr = m.lr;
    const top = (rc) => rc.top - lr.top + list.scrollTop;
    let step = list.lgStripeStep || 0;
    if (!step) {
      step = Infinity;
      for (let i = 1; i < rects.length; i++) {
        const d = rects[i].top - rects[i - 1].top;
        if (d > 4 && d < step) step = d;
      }
      if (!isFinite(step)) step = rows[0] && rows[0].offsetHeight || 28;
      else list.lgStripeStep = step;
    }
    const pad = parseFloat(getComputedStyle(list).paddingTop) || 0;
    const k0 = rows.length ? Math.round((top(rects[0]) - pad) / step) : 0;
    const bl = m.gl;
    const keep = /* @__PURE__ */ new Set();
    rows.forEach((r, i) => {
      if ((k0 + i) % 2 !== 1) return;
      const rc = rects[i];
      let bottom = rc.bottom;
      for (let c = r.parentElement && r.parentElement.closest(".tree-item-children"); c && list.contains(c); c = c.parentElement && c.parentElement.closest(".tree-item-children")) {
        bottom = Math.min(bottom, c.getBoundingClientRect().bottom);
      }
      const h = bottom - rc.top;
      if (h <= 0.5) return;
      let bar = this.stripeBars.get(r);
      if (!bar || bar.parentElement !== layer) {
        bar = layer.createDiv("lg-stripe-bar");
        this.stripeBars.set(r, bar);
      }
      keep.add(bar);
      bar.style.top = `${top(rc)}px`;
      bar.style.left = `${bl + list.scrollLeft}px`;
      bar.style.width = `${list.clientWidth - bl}px`;
      bar.style.height = `${h}px`;
    });
    for (const bar of els(layer.children)) if (!keep.has(bar)) bar.remove();
    this.stripeUnder(list);
  },
  // 하이라이트(호버·선택·끌기)가 깔린 줄의 줄무늬 막대를 숨긴다 (CSS: .lg-stripe-bar.lg-stripe-hide, 사용자 요청).
  // 하이라이트가 반투명이라 줄무늬 위에서만 옅어 보였다
  stripeUnder(list) {
    if (!this.stripeBars) return;
    for (const r of list.querySelectorAll(".tree-item-self")) {
      const bar = this.stripeBars.get(r);
      if (!bar || !bar.isConnected) continue;
      const on = r.matches(".is-active, .is-selected, .is-being-dragged-over, .is-being-dragged, .is-clickable:hover");
      if (bar.classList.contains("lg-stripe-hide") !== on) bar.classList.toggle("lg-stripe-hide", on);
    }
  },
  // 줄 하이라이트(CSS: 파일 탐색기 .tree-item-self::before)를 줄무늬와 같은 폭으로: 왼쪽은 목록 왼쪽 끝에서 알약 간격(--lg-gap),
  // 오른쪽은 목록 안쪽 끝(스크롤바 칸 왼쪽 끝)까지. 맨 위 단계 줄(가장 넓은 줄)로 잰다 (사용자 요청)
  // 보이는 줄과 그 자리를 돌려준다 (applyStripes 가 같은 측정을 쓴다)
  rowExtent(list) {
    const lr = list.getBoundingClientRect();
    const gl = this.rowGapLeft(list);
    let wide = null;
    const rows = [];
    const rects = [];
    for (const r of list.querySelectorAll(".tree-item-self")) {
      const rc = r.getBoundingClientRect();
      if (!rc.width) continue;
      rows.push(r);
      rects.push(rc);
      if (!wide || rc.width > wide.width) wide = rc;
    }
    rows.forEach((r, i) => {
      const l = `${Math.round((rects[i].left - lr.left - gl) * 10) / 10}px`;
      if (r.style.getPropertyValue("--lg-row-ext-l") !== l) r.style.setProperty("--lg-row-ext-l", l);
    });
    const out = { rows, rects, lr, gl };
    if (!wide) return out;
    const right = Math.max(0, lr.left + list.clientLeft + list.clientWidth - wide.right - (import_obsidian10.Platform.isMobile ? gl : 0));
    const rr = `${Math.round(right * 10) / 10}px`;
    if (list.style.getPropertyValue("--lg-row-ext-r") !== rr) list.style.setProperty("--lg-row-ext-r", rr);
    return out;
  },
  // 줄무늬·줄 하이라이트의 왼쪽 끝: 목록 왼쪽 끝에서 알약 간격(--lg-gap) (사용자 요청)
  rowGapLeft(list) {
    return parseFloat(getComputedStyle(list).getPropertyValue("--lg-gap")) || 10;
  },
  // 폴더를 열고 닫으면 Obsidian 애니메이션(약 0.2초) 동안 줄이 움직이므로, 그동안 매 프레임 막대를 줄 위치에 다시 맞춘다
  followStripes(list) {
    if (!this.settings.fileStripes || import_obsidian10.Platform.isMobile) return;
    const win = list.ownerDocument.defaultView || window;
    list.lgStripeUntil = win.performance.now() + STRIPE_FOLLOW_MS;
    if (list.lgStripeLoop) return;
    const step = () => {
      if (!list.isConnected) return list.lgStripeLoop = 0;
      this.applyStripes(list);
      if (win.performance.now() < list.lgStripeUntil) list.lgStripeLoop = win.requestAnimationFrame(step);
      else list.lgStripeLoop = 0;
    };
    list.lgStripeLoop = win.requestAnimationFrame(step);
  },
  // 파일 탐색기 줄 높이를 다시 재게 한다: 탐색기는 보이는 줄만 그리고 나머지는 처음 잰 줄 높이로 자리를 잡는데,
  // 줄 간격을 바꿔도 예전 높이를 그대로 써서 스크롤할 때 화면과 스크롤바가 한쪽으로 튀었다 (사용자 지적, 앱을 다시 켜면 괜찮았다).
  // 탐색기가 폭이 바뀔 때 스스로 부르는 다시 재기(invalidateAll)를 부른다. 새 간격이 그려진 뒤에 한다
  remeasureExplorers() {
    window.requestAnimationFrame(() => {
      this.app.workspace.getLeavesOfType("file-explorer").forEach((leaf) => {
        const scroll = leaf.view && leaf.view.tree && leaf.view.tree.infinityScroll;
        if (scroll && typeof scroll.invalidateAll === "function") scroll.invalidateAll();
      });
    });
  }
};

// src/sidebar.ts
var import_obsidian11 = require("obsidian");
var sidebarMethods = {
  // 좌우 패널 투명(아크릴)에서 패널 위 알약·버튼 밑 구멍 (사용자 요청): 알약 유리는 Obsidian 화면만 떠 와 창 뒤 아크릴을 비추지 못하므로,
  // 패널 바탕은 패널 밖 바로 뒤의 층(.lg-panel-under, 패널 자리·크기를 따라간다)에 칠하고, 그 층을 패널마다 문서 안 SVG 마스크
  // (#lg-holes-left, #lg-holes-right)로 버튼 모양만큼 비운다. 패널 자신은 유리가 뒤를 떠 오는 범위(backdrop root)라, 모든 버튼이
  // 패널 안 내용(목록 등)만 굴절하고 바탕은 한 겹만 남는다 (보관함 줄 버튼도 목록을 굴절한다, 사용자 요청).
  // 패널을 접고 펴는 동안(너비 전환)은 따라가지 않고 패널을 불투명한 패널색으로 막는다(.lg-under-busy, 사용자 요청).
  // 버튼이 메뉴로 바뀌며 돌진하는 움직임(morph 의 lg-dash-out·lg-dash-back)은 구멍이 따라가지 않는다: 메뉴가 열릴 때 한 번에 닫히고,
  // 닫힌 뒤 버튼이 돌아오는 움직임이 끝나면 서서히 열린다(사용자 요청).
  // 구멍은 버튼을 매 프레임 따라 그리지 않고 따로 움직인다: 버튼과 그 위 묶음에 걸린 애니메이션(플러그인 animate, 테마 CSS 전환)을
  // 그대로 읽어(getAnimations) 같은 키프레임·시간·곡선·시작 시각으로 구멍 층에도 건다. 버튼 쪽 값이 바뀌어도 구멍 쪽은 고칠 것이 없다.
  // 크기·자리를 바꾸는 애니메이션(검색 칸 넓어짐 등)만은 끝날 때까지 매 프레임 자리를 다시 잰다.
  // 가로로 긴 알약이 제자리에서 줄며 사라지거나 커지며 나타날 때는 구멍의 가로를 더 빨리 줄인다(사용자 요청): 같은 비율이면 양옆 테두리가
  // 세로보다 훨씬 많이 움직여 조금만 어긋나도 티가 난다. 구멍은 긴 알약에서 최종 높이만 한 크기로 접혀, 줄어드는 내내 양옆이 버튼 유리 안쪽에 있다.
  // 구멍은 버튼보다 화면 픽셀 1칸 안쪽까지만 뚫는다: 버튼 가장자리와 구멍 가장자리가 같은 픽셀에서 반씩 걸치면 그 픽셀만 패널도 버튼도 덜 덮여
  // 버튼 둘레에 어두운 실선이 생긴다(측정). 가장자리 픽셀은 패널 위에 버튼이 얹히게 둔다.
  // 투명도만은 그대로 옮기지 않는다: 버튼 채움(약 80%)이 패널(70%)보다 진해, 구멍이 버튼 투명도(o)만큼 열리면 흐려지는 동안
  // 그 자리가 패널보다 더 비쳐 어두운 원이 생긴다(측정). 구멍 깊이를 o³ 으로 해 그 자리가 패널과 버튼 사이에서 거의 고르게 이어지게 한다
  // (정확한 값 1-(1-o)/(1-0.8·o) 에 가장 가까운 어림값, 사용자 요청). 구멍 층을 세 겹으로 겹치고 겹마다 버튼과 같은 투명도 애니메이션을 건다.
  // 구멍의 투명도 변화는 버튼 시간의 HOLE_SPAN(90%) 안에 끝낸다(사용자 요청): 사라질 때는 앞쪽에서 먼저 닫히고, 나타날 때는 늦게 시작해 함께 끝난다
  acrylicHoles(on) {
    if (this.holesOff) {
      this.holesOff();
      this.holesOff = null;
    }
    if (!on) return;
    const BTN = ".lg-nav-run, .lg-nav-rest > .clickable-icon, .lg-nav-more, .lg-panel-toggle, .workspace-tab-header-container-inner, .workspace-drawer-vault-switcher, .workspace-drawer-vault-actions .clickable-icon, .graph-controls.is-close .graph-controls-button";
    const ROWS = ".workspace-tab-header-container, .workspace-sidedock-vault-profile, .graph-controls";
    const EVENTS = ["transitionrun", "transitionend", "transitioncancel", "animationstart", "animationend"];
    const HOLE_SPAN = 0.9;
    const IDLE = /^(offset|easing|composite|computedOffset|background.*|color|boxShadow|border.*Color|outline.*|filter|backdropFilter|webkitBackdropFilter|fill|stroke|--.*)$/;
    const radii = (btn, w, h) => {
      const v = getComputedStyle(btn).borderTopLeftRadius;
      const parts = v.match(/calc\([^)]*\)|\S+/g) || ["0"];
      const [a, b = a] = parts;
      const len = (s, of) => {
        let sum = 0;
        for (const m of s.replace(/-\s+/g, "-").matchAll(/(-?[\d.]+)(%|px)?/g)) sum += m[2] === "%" ? parseFloat(m[1]) / 100 * of : parseFloat(m[1]) || 0;
        return sum;
      };
      return [len(a, w), len(b, h)];
    };
    const n3 = (v) => String(+v.toFixed(3));
    const setAttrs = (el, attrs) => {
      for (const k in attrs) if (el.getAttribute(k) !== attrs[k]) el.setAttribute(k, attrs[k]);
    };
    const setStyle = (el, prop, v) => {
      if (el.style[prop] !== v) el.style[prop] = v;
    };
    const uniformScale = (t) => {
      if (typeof t !== "string") return null;
      const m = /^scale\(([\d.]+)\)$/.exec(t) || /^matrix\(([\d.]+), 0, 0, ([\d.]+), 0, 0\)$/.exec(t);
      return m && (m[2] === void 0 || m[1] === m[2]) ? +m[1] : null;
    };
    const relevant = (a) => {
      const fx = a.effect;
      if (!(fx instanceof KeyframeEffect) || a.playState === "idle") return null;
      const kfs = fx.getKeyframes();
      if (a.id.startsWith("lg-dash")) return { fx, kfs, shape: true, geo: false, moved: true };
      let shape = false;
      let geo = false;
      let moved = false;
      for (const k of kfs)
        for (const p of Object.keys(k)) {
          if (p === "transform" || p === "opacity") shape = true;
          else if (!IDLE.test(p)) geo = true;
          if (p === "scale" || p === "translate" || p === "rotate") moved = true;
        }
      return { fx, kfs, shape, geo, moved };
    };
    const around = (t, origin) => {
      const [ox, oy] = origin.split(",").map(Number);
      const mid = typeof t === "string" && t !== "none" ? ` ${t}` : "";
      return `translate(${ox}px, ${oy}px)${mid} translate(${-ox}px, ${-oy}px)`;
    };
    const side = (splitSel, id) => {
      const svg = createSvg("svg", { cls: [INJECTED, "lg-holes-svg"], attr: { "aria-hidden": "true" } });
      const mask = svg.createSvg("mask", { attr: { id, maskUnits: "userSpaceOnUse", maskContentUnits: "userSpaceOnUse", x: "-10000", y: "-10000", width: "20000", height: "20000" } });
      mask.createSvg("rect", { attr: { x: "-10000", y: "-10000", width: "20000", height: "20000", fill: "#fff" } });
      document.body.appendChild(svg);
      const holes = /* @__PURE__ */ new Map();
      const frac = /* @__PURE__ */ new WeakMap();
      let dock = null;
      let frame = 0;
      const under = createDiv({ cls: [INJECTED, "lg-panel-under", id] });
      const place = () => {
        if (!dock || under.classList.contains("lg-busy")) return;
        const r = dock.getBoundingClientRect();
        setStyle(dots[0], "left", `${r.left}px`);
        setStyle(dots[0], "top", `${r.top}px`);
        setStyle(dots[1], "left", `${r.right - 1}px`);
        setStyle(dots[1], "top", `${r.bottom - 1}px`);
        setStyle(under, "left", `${r.left}px`);
        setStyle(under, "top", `${r.top}px`);
        setStyle(under, "width", `${r.width}px`);
        setStyle(under, "height", `${r.height}px`);
      };
      const boxOf = (el, still) => {
        let x = 0;
        let y = 0;
        for (let e = el; e && e !== dock; ) {
          const p = e.offsetParent;
          x += e.offsetLeft;
          y += e.offsetTop;
          if (!p || !p.instanceOf(HTMLElement)) break;
          x += p.clientLeft - (p === dock ? 0 : p.scrollLeft);
          y += p.clientTop - (p === dock ? 0 : p.scrollTop);
          e = p;
        }
        const w = el.offsetWidth;
        const h = el.offsetHeight;
        if (still && dock) {
          const r = el.getBoundingClientRect();
          const d = dock.getBoundingClientRect();
          const bx = r.left - d.left;
          const by = r.top - d.top;
          frac.set(el, [bx - x, by - y]);
          return { x: bx, y: by, w: r.width, h: r.height };
        }
        const [fx, fy] = frac.get(el) || [0, 0];
        return { x: x + fx, y: y + fy, w, h };
      };
      const mirror = (layer, a, fx, kfs, own) => {
        const ms = [];
        if (kfs.some((k) => "transform" in k)) {
          const tks = kfs.filter((k) => "transform" in k);
          const ss = tks.map((k) => uniformScale(k.transform));
          const smin = Math.min(...ss.map((v) => v == null ? 1 : v));
          const wide = own && own.w > own.h * 1.2 && ss.every((v) => v != null) && smin <= 0.6 ? own : null;
          const sx = (v) => !wide || v >= 1 ? v : ((v - smin) * wide.w + smin * wide.h * (1 - v)) / ((1 - smin) * wide.w);
          const out = tks.map((k, i) => {
            const v = ss[i];
            const t = wide && v != null ? `scale(${n3(sx(v))}, ${v})` : k.transform;
            return { offset: k.offset, easing: k.easing, composite: k.composite, transform: around(t, layer.origin) };
          });
          ms.push(layer.gs[0].animate(out, fx.getTiming()));
        }
        if (kfs.some((k) => "opacity" in k)) {
          const out = kfs.filter((k) => "opacity" in k).map((k) => ({ offset: k.offset, easing: k.easing, composite: k.composite, opacity: k.opacity }));
          const tm = fx.getTiming();
          const dur = Number(tm.duration) || 0;
          const ops = out.map((k) => Number(k.opacity));
          const fading = ops[0] > ops[ops.length - 1];
          const span = {
            ...tm,
            duration: dur * HOLE_SPAN,
            delay: (tm.delay || 0) + (fading ? 0 : dur * (1 - HOLE_SPAN)),
            fill: fading ? tm.fill === "backwards" || tm.fill === "both" ? "both" : "forwards" : "both"
          };
          for (const g of layer.gs) ms.push(g.animate(out, span));
        }
        for (const m of ms) m.playbackRate = a.playbackRate;
        const mine = () => layer.mirrors.get(a) === ms;
        const sync = () => {
          if (mine() && a.startTime != null) {
            for (const m of ms) if (m.startTime !== a.startTime) m.startTime = a.startTime;
          }
        };
        layer.mirrors.set(a, ms);
        sync();
        a.ready.then(sync, () => {
        });
        a.addEventListener("cancel", () => mine() && ms.forEach((m) => m.cancel()));
        a.addEventListener("finish", () => {
          if (mine()) ms.forEach((m) => m.finish());
          schedule();
        });
      };
      const DASH_OPEN_MS = 300;
      const dashHole = (hole, a, fx) => {
        if (hole.dash) hole.dash.cancel();
        let m;
        if (a.id === "lg-dash-out") {
          m = hole.root.animate([{ opacity: 0 }, { opacity: 0 }], { duration: 1, fill: "forwards" });
          const later = () => window.requestAnimationFrame(() => window.requestAnimationFrame(() => hole.dash === m && m.cancel()));
          a.addEventListener("cancel", later);
          a.addEventListener("remove", later);
        } else {
          const t = fx.getComputedTiming();
          const tm = fx.getTiming();
          m = hole.root.animate([{ opacity: 0 }, { opacity: 1 }], { delay: (Number(tm.delay) || 0) + (Number(t.activeDuration) || 0), duration: DASH_OPEN_MS, easing: "ease-in-out", fill: "backwards" });
          a.addEventListener("finish", () => schedule());
          const sync = () => {
            if (hole.dash === m && a.startTime != null) m.startTime = a.startTime;
          };
          sync();
          a.ready.then(sync, () => {
          });
        }
        hole.dash = m;
      };
      const clear = (layer) => {
        layer.mirrors.forEach((ms) => ms.forEach((m) => m.cancel()));
        layer.mirrors.clear();
      };
      const drop = (h) => {
        h.layers.forEach(clear);
        h.root.remove();
      };
      const scan = () => {
        if (frame) window.cancelAnimationFrame(frame);
        frame = 0;
        if (!dock || !dock.isConnected) return;
        place();
        let follow = false;
        const seen = /* @__PURE__ */ new Set();
        for (const btn of els(dock.querySelectorAll(BTN))) {
          if (btn.matches(".workspace-tab-header-container-inner") && btn.closest(".lg-tab-list")) continue;
          seen.add(btn);
          let h = holes.get(btn);
          if (!h) {
            const root = mask.createSvg("g");
            h = { root, rect: root.createSvg("rect", { attr: { fill: "#000" } }), layers: [] };
            holes.set(btn, h);
          }
          if (!btn.offsetParent || !btn.offsetWidth) {
            h.root.setAttribute("visibility", "hidden");
            continue;
          }
          h.root.removeAttribute("visibility");
          const chain = [];
          let still = true;
          for (let e = btn; e && e !== dock; e = e.parentElement) {
            const cs = getComputedStyle(e);
            const as = e.getAnimations();
            const rs = as.map(relevant);
            if (rs.some((r) => r && r.geo)) follow = true;
            const shaped = rs.some((r) => r && r.shape);
            const moved = rs.some((r) => r && r.moved) || cs.scale !== "none" || cs.translate !== "none" || cs.rotate !== "none";
            if (shaped || moved || cs.transform !== "none") still = false;
            if (shaped || cs.transform !== "none" || +cs.opacity < 0.99) chain.unshift({ el: e, cs, as, rs });
          }
          const hole = h;
          if (chain.length !== hole.layers.length || chain.some((c, i) => c.el !== hole.layers[i].el)) {
            hole.layers.forEach(clear);
            hole.root.empty();
            let parent = hole.root;
            hole.layers = chain.map((c) => {
              const gs = [];
              for (let k = 0; k < 3; k++) {
                const g = parent.createSvg("g");
                gs.push(g);
                parent = g;
              }
              return { el: c.el, gs, origin: "", mirrors: /* @__PURE__ */ new Map() };
            });
            hole.rect = parent.createSvg("rect", { attr: { fill: "#000" } });
          }
          chain.forEach((c, i) => {
            const layer = hole.layers[i];
            const b2 = boxOf(c.el, still);
            const [ox, oy] = c.cs.transformOrigin.split(" ").map(parseFloat);
            const origin = `${n3(b2.x + (ox || 0))},${n3(b2.y + (oy || 0))}`;
            if (origin !== layer.origin) {
              layer.origin = origin;
              clear(layer);
            }
            const op = +c.cs.opacity < 0.99 ? c.cs.opacity : "";
            setStyle(layer.gs[0], "transform", around(c.cs.transform, origin));
            for (const g of layer.gs) setStyle(g, "opacity", op);
            for (const [a, ms] of layer.mirrors)
              if (!c.as.includes(a)) {
                ms.forEach((m) => m.cancel());
                layer.mirrors.delete(a);
              }
            c.as.forEach((a, j) => {
              const r = c.rs[j];
              if (!r || !r.shape || layer.mirrors.has(a)) return;
              if (a.id.startsWith("lg-dash")) {
                dashHole(hole, a, r.fx);
                layer.mirrors.set(a, []);
              } else mirror(layer, a, r.fx, r.kfs, c.el === btn ? { w: btn.offsetWidth, h: btn.offsetHeight } : null);
            });
          });
          const b = boxOf(btn, still);
          const [rx, ry] = radii(btn, b.w, b.h);
          const px = 1 / (window.devicePixelRatio || 1);
          const w = Math.max(0, b.w - 2 * px);
          const hh = Math.max(0, b.h - 2 * px);
          setAttrs(hole.rect, { x: n3(b.x + px), y: n3(b.y + px), width: n3(w), height: n3(hh), rx: n3(Math.max(0, Math.min(rx - px, w / 2))), ry: n3(Math.max(0, Math.min(ry - px, hh / 2))) });
        }
        for (const [btn, h] of holes)
          if (!seen.has(btn)) {
            drop(h);
            holes.delete(btn);
          }
        if (follow) schedule();
      };
      const schedule = () => {
        if (!frame) frame = window.requestAnimationFrame(scan);
      };
      const ro = new ResizeObserver(() => scan());
      const busy = (on2) => {
        if (!dock) return;
        dock.classList.toggle("lg-under-busy", on2);
        under.classList.toggle("lg-busy", on2);
        if (!on2) place();
      };
      const onWidth = (e) => {
        if (e.target !== dock || !(e instanceof TransitionEvent) || e.propertyName !== "width") return;
        busy(e.type === "transitionrun");
      };
      const mo = new MutationObserver((recs) => {
        if (recs.some((r) => isEl(r.target) && (r.target === dock || r.target.matches(".workspace-tabs") || !!r.target.closest(ROWS)))) schedule();
      });
      const onAnim = (e) => {
        if (isEl(e.target) && e.target.closest(ROWS)) schedule();
      };
      const DAMAGE_MS = 600;
      let damageTimer = 0;
      const dots = [createDiv({ cls: [INJECTED, "lg-dmg-dot"] }), createDiv({ cls: [INJECTED, "lg-dmg-dot"] })];
      const damageOff = () => {
        damageTimer = 0;
        dots.forEach((d) => d.classList.remove("lg-damage"));
      };
      const DAMAGE_ON = ["pointermove", "pointerdown", "pointerup", "scroll", "wheel", "keydown", "transitionrun", "animationstart"];
      const onActivity = (e) => {
        if (!dock || isEl(e.target) && e.target.classList.contains("lg-dmg-dot")) return;
        if (damageTimer) window.clearTimeout(damageTimer);
        else dots.forEach((d) => d.classList.add("lg-damage"));
        damageTimer = window.setTimeout(damageOff, DAMAGE_MS);
      };
      const unbindDock = () => {
        if (!dock) return;
        if (damageTimer) window.clearTimeout(damageTimer);
        damageTimer = 0;
        dock.classList.remove("lg-holes", "lg-under-busy");
        dots.forEach((d) => d.classList.remove("lg-damage"));
        under.classList.remove("lg-busy");
        for (const t of EVENTS) dock.removeEventListener(t, onAnim, true);
        for (const t of ["transitionrun", "transitionend", "transitioncancel"]) dock.removeEventListener(t, onWidth);
      };
      const bind = () => {
        const d = document.querySelector(splitSel);
        if (d !== dock) {
          unbindDock();
          dock = d;
          if (dock) {
            dock.classList.add("lg-holes");
            for (const t of EVENTS) dock.addEventListener(t, onAnim, true);
            for (const t of ["transitionrun", "transitionend", "transitioncancel"]) dock.addEventListener(t, onWidth);
            if (dock.parentElement) dock.parentElement.insertBefore(under, dock);
            if (import_obsidian11.Platform.isWin) for (const d2 of dots) document.body.appendChild(d2);
          }
        }
        ro.disconnect();
        mo.disconnect();
        if (!dock) return;
        ro.observe(dock);
        for (const hc of els(dock.querySelectorAll(ROWS))) ro.observe(hc);
        mo.observe(dock, { subtree: true, childList: true, attributes: true, attributeFilter: ["class", "style"] });
        scan();
      };
      const refs = [this.app.workspace.on("layout-change", bind)];
      window.addEventListener("resize", schedule);
      if (import_obsidian11.Platform.isWin) for (const t of DAMAGE_ON) document.addEventListener(t, onActivity, { capture: true, passive: true });
      bind();
      return () => {
        ro.disconnect();
        mo.disconnect();
        if (frame) window.cancelAnimationFrame(frame);
        refs.forEach((r) => this.app.workspace.offref(r));
        window.removeEventListener("resize", schedule);
        for (const t of DAMAGE_ON) document.removeEventListener(t, onActivity, { capture: true });
        holes.forEach(drop);
        holes.clear();
        unbindDock();
        dock = null;
        under.remove();
        dots.forEach((d) => d.remove());
        svg.remove();
      };
    };
    const offs = [side(".workspace-split.mod-left-split", "lg-holes-left"), side(".workspace-split.mod-right-split", "lg-holes-right")];
    this.holesOff = () => offs.forEach((off) => off());
  },
  // 설정 창의 드롭다운 줄 표시 (테마가 :has 로 보던 것): 드롭다운이 든 조작부 .lg-dd-ctrl, 그 줄 .lg-dd-row,
  // 강조 버튼(.mod-cta, 언어의 숨은 재시작 버튼)이 아닌 버튼도 있으면 .lg-dd-btn. 창이 뜨거나 내용이 바뀌면 그 자리에서(그리기 전) 붙인다
  markDropdownRows(root) {
    root.querySelectorAll(".setting-item-control").forEach((c) => {
      const dd = !!c.querySelector(":scope > .dropdown");
      c.classList.toggle("lg-dd-ctrl", dd);
      const row = c.parentElement;
      if (!row || !row.classList.contains("setting-item")) return;
      row.classList.toggle("lg-dd-row", dd);
      row.classList.toggle("lg-dd-btn", dd && !!c.querySelector(":scope > button:not(.mod-cta)"));
    });
    root.querySelectorAll(".bases-toolbar-menu-form .input-row").forEach((r) => {
      const dd = !!r.querySelector(":scope > .input-row-content > select.dropdown");
      if (r.classList.contains("lg-dd-row") !== dd) r.classList.toggle("lg-dd-row", dd);
    });
  },
  // 사이드바 보기 중 머리 줄(.nav-header)에 버튼 줄 말고 보이는 것이 없는 보기에 lg-bare-head 를 붙인다.
  // 테마는 이런 보기의 내용을 탭 줄 밑까지 올려 그 아래로 스크롤되게 한다.
  // 예전엔 테마가 :has(… [style*="display: none"]) 로 직접 판정했는데, 파일·개요 항목을 끌 때 Obsidian 이
  // 매 움직임마다 인라인 스타일을 바꿔 그 판정이 계속 다시 돌며 렉이 걸렸다(추정). 판정은 머리 줄이 바뀔 때만 한다
  markBareHeads(split) {
    const c = split && split.containerEl;
    if (!c) return;
    if (!this.bareWatched) this.bareWatched = /* @__PURE__ */ new WeakSet();
    c.querySelectorAll(".workspace-leaf-content").forEach((el) => {
      const sync = () => {
        const head2 = el.querySelector(":scope > .nav-header");
        const bare = !head2 || !els(head2.children).some((k) => !k.classList.contains("nav-buttons-container") && k.style.display !== "none");
        el.classList.toggle("lg-bare-head", bare);
      };
      sync();
      if (this.bareWatched.has(el)) return;
      this.bareWatched.add(el);
      const obs = new MutationObserver((recs) => {
        if (recs.some((r) => r.target === el || r.target.closest && r.target.closest(".nav-header") && r.target.closest(".workspace-leaf-content") === el)) sync();
      });
      obs.observe(el, { childList: true });
      const head = el.querySelector(":scope > .nav-header");
      if (head) obs.observe(head, { childList: true, subtree: true, attributes: true, attributeFilter: ["style"] });
      this.observers.push(obs);
    });
  },
  // 탭 전환 효과 "목록"을 쓰는 패널 (CSS: .workspace-split.lg-tab-list, 태블릿은 서랍 .workspace-drawer.lg-tab-list, 사용자 요청). 휴대폰은 렌즈
  markTabList(split, side) {
    if (!split || !split.containerEl) return;
    const st = this.settings;
    split.containerEl.classList.toggle("lg-tab-list", st.tabAnim === "list" && !import_obsidian11.Platform.isPhone && (st.tabListSides === "both" || st.tabListSides === side));
  },
  setupSidebar(split, side) {
    if (!split || !split.containerEl) return;
    this.markTabList(split, side);
    const groups = split.containerEl.querySelectorAll(".workspace-tabs");
    groups.forEach((tabsEl, i) => {
      this.watchSegments(tabsEl);
      const header = tabsEl.querySelector(":scope > .workspace-tab-header-container");
      if (!header) return;
      if (!header.querySelector(":scope > .lg-nav-more")) {
        const btn = this.makeButton(
          "lg-nav-more",
          "more-horizontal",
          tr("\uBA54\uB274", "Menu"),
          (e, el) => this.toggleMenu(el, () => this.openNavMenu(tabsEl, el))
        );
        header.appendChild(btn);
      }
      if (i === 0 && !split.containerEl.querySelector(".lg-panel-toggle")) {
        const left = side === "left";
        const close = this.makeButton(
          "lg-panel-toggle",
          left ? "panel-left-close" : "panel-right-close",
          left ? tr("\uC67C\uCABD \uD328\uB110 \uB2EB\uAE30", "Close left sidebar") : tr("\uC624\uB978\uCABD \uD328\uB110 \uB2EB\uAE30", "Close right sidebar"),
          () => split.collapse()
        );
        if (left) {
          close.addClass("lg-panel-toggle-left");
          header.appendChild(close);
        } else {
          header.prepend(close);
        }
      }
      if (i === 0) this.keepDragBand(header);
      if (!this.foldWatched) this.foldWatched = /* @__PURE__ */ new WeakSet();
      if (!this.foldWatched.has(header)) {
        this.foldWatched.add(header);
        let lastW = -1;
        const ro = new ResizeObserver(() => {
          const w = header.clientWidth;
          if (w === lastW) return;
          lastW = w;
          this.navFoldCheck(tabsEl);
          this.navSearchSync(tabsEl);
        });
        ro.observe(header);
        this.register(() => ro.disconnect());
      }
      this.updateNavMore(tabsEl);
    });
  },
  // 넓게 모드에서 버튼 줄이 탭 줄 폭에 다 들어가지 않으면 줄을 숨기고 ··· 하나로 묶는다 (사용자 요청: 패널을 줄이거나 창이 작아질 때).
  // ··· 은 보기의 버튼을 모두 메뉴로 보인다. 잠깐 펴서 버튼 줄에 필요한 폭과 받은 폭을 잰다(그리기 전이라 화면에는 보이지 않는다)
  // 넓게 모드처럼 버튼 줄을 펼치는 탭 묶음: 탭 줄 넓게 설정이거나, 목록 방식 패널 (목록은 넓게의 첫 줄 버튼을 그대로 쓴다)
  tabWideOf(tabsEl) {
    return tabsEl.ownerDocument.body.classList.contains("lg-tab-wide") || !!tabsEl.closest(".lg-tab-list");
  },
  navFoldCheck(tabsEl) {
    const header = tabsEl.querySelector(":scope > .workspace-tab-header-container");
    const row = header && header.querySelector(":scope > .lg-nav-row");
    const wide = this.tabWideOf(tabsEl);
    if (!row || !wide || tabsEl.classList.contains("lg-one") || row.classList.contains("lg-nav-none")) {
      tabsEl.classList.remove("lg-nav-fold");
      return;
    }
    const was = tabsEl.classList.contains("lg-nav-fold");
    const more = header.querySelector(":scope > .lg-nav-more");
    const moreRect = was && more ? more.getBoundingClientRect() : null;
    if (was) tabsEl.classList.remove("lg-nav-fold");
    if (!row.offsetParent) {
      if (was) tabsEl.classList.add("lg-nav-fold");
      return;
    }
    const parts = els(row.querySelectorAll(":scope > .lg-nav-run, :scope > .lg-nav-rest")).filter((p) => p.childElementCount > 0);
    const gap = parseFloat(getComputedStyle(row).columnGap) || 0;
    const ns = tabsEl.lgSearchIn;
    const extra = ns ? ns.p.offsetWidth - ns.p.offsetHeight : 0;
    const need = parts.reduce((sum, p) => sum + p.offsetWidth, 0) + gap * Math.max(0, parts.length - 1) - extra;
    const fold = need > row.getBoundingClientRect().width + 0.5;
    const animate = tabsEl.lgFoldSeen && fold !== was;
    tabsEl.lgFoldSeen = true;
    if (animate && fold) this.foldGhost(row, header, row.getBoundingClientRect());
    tabsEl.classList.toggle("lg-nav-fold", fold);
    if (!animate) return;
    if (fold) {
      if (more) this.navBtnEnter(more);
    } else {
      if (more && moreRect) this.foldGhost(more, header, moreRect);
      parts.forEach((p) => this.navBtnEnter(p));
    }
  },
  // 사라지는 버튼 줄이나 ··· 의 복제본을 그 자리(rect)에 띄워 줄어들며 흐려지게 한 뒤 지운다. 원래 것은 바로 숨는다
  foldGhost(el, header, rect) {
    if (!rect || !rect.width) return;
    const g = el.cloneNode(true);
    g.classList.add(INJECTED, "lg-fold-ghost");
    g.removeAttribute("aria-label");
    g.setAttribute("aria-hidden", "true");
    header.appendChild(g);
    const op = g.offsetParent || header;
    const or = op.getBoundingClientRect();
    g.setCssStyles({
      display: "flex",
      position: "absolute",
      margin: "0",
      left: `${rect.left - or.left - op.clientLeft}px`,
      top: `${rect.top - or.top - op.clientTop}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`,
      pointerEvents: "none"
    });
    const anim = g.animate(
      [
        { transform: "scale(1)", opacity: 1 },
        { transform: "scale(0.6)", opacity: 0 }
      ],
      { duration: 200, easing: EASE.exit, fill: "forwards" }
    );
    const done = () => g.remove();
    anim.onfinish = anim.oncancel = done;
    window.setTimeout(done, 400);
  },
  // 넓게 모드의 버튼 줄: 지금 보기의 버튼(파일 탐색기의 새 노트·정렬 등)을 ··· 메뉴 대신 펼쳐 둔다.
  // 실행 버튼은 알약(.lg-nav-run) 하나로 묶고, 토글·메뉴 버튼은 단독 원형 버튼(.lg-nav-rest)으로 둔다.
  // 각 버튼은 원래 버튼을 대신 누른다. 원래 버튼의 상태(켜짐·기호·이름)가 바뀌면 따라 바꾼다. 보일지는 테마가 정한다
  renderNavRow(tabsEl) {
    const header = tabsEl.querySelector(":scope > .workspace-tab-header-container");
    if (!header) return;
    let row = header.querySelector(":scope > .lg-nav-row");
    if (!row) {
      row = createDiv({ cls: ["lg-nav-row", INJECTED] });
      row.createDiv("lg-nav-run");
      row.createDiv("lg-nav-rest");
      header.appendChild(row);
    }
    const leaf = this.activeLeafOf(tabsEl);
    const root = leaf && leaf.view ? leaf.view.containerEl : null;
    if (tabsEl.lgNavRoot !== root) {
      if (tabsEl.lgNavObs) tabsEl.lgNavObs.disconnect();
      tabsEl.lgNavRoot = root;
      tabsEl.lgNavObs = null;
      if (root) {
        const obs = new MutationObserver(() => {
          if (tabsEl.lgNavTimer) return;
          tabsEl.lgNavTimer = window.setTimeout(() => {
            tabsEl.lgNavTimer = 0;
            this.renderNavRow(tabsEl);
          }, 0);
        });
        root.querySelectorAll(":scope > .nav-header, :scope > .search-row").forEach(
          (el) => obs.observe(el, { subtree: true, childList: true, attributes: true, attributeFilter: ["class", "aria-label", "style"] })
        );
        tabsEl.lgNavObs = obs;
        this.register(() => obs.disconnect());
      }
    }
    const buttons = this.navItemsOf(leaf);
    const kinds = buttons.map((b) => this.navKind(b));
    const run = row.querySelector(":scope > .lg-nav-run");
    const rest = row.querySelector(":scope > .lg-nav-rest");
    const order = buttons.map((b, i) => i).filter((i) => kinds[i] === "run").concat(buttons.map((b, i) => i).filter((i) => kinds[i] !== "run"));
    const key = kinds.join(",");
    let entering = null;
    if (row.lgNavKey !== key || row.lgNavLeaf !== leaf) {
      const animate = row.lgNavKey != null && row.isConnected && row.offsetParent !== null;
      row.lgNavKey = key;
      row.lgNavLeaf = leaf;
      if (run.lgPillAnim) run.lgPillAnim.cancel();
      const oldRun = run.querySelectorAll(":scope > .lg-nav-btn:not(.lg-nav-leaving)").length;
      const newRun = kinds.filter((k) => k === "run").length;
      const pillLeave = animate && oldRun > 0 && newRun === 0;
      const pillEnter = animate && oldRun === 0 && newRun > 0;
      const olds = els(row.querySelectorAll(".lg-nav-btn:not(.lg-nav-leaving)"));
      if (animate) olds.forEach((old) => this.navBtnMeasure(old));
      if (pillLeave) this.navPillPin(run);
      const restEmpty = animate && rest.querySelector(":scope > .lg-nav-btn:not(.lg-nav-leaving)") && !kinds.some((k) => k !== "run");
      if (restEmpty) {
        this.navPillPin(rest);
        window.clearTimeout(rest.lgUnpinTimer);
        rest.lgUnpinTimer = window.setTimeout(() => rest.classList.remove("lg-nav-pinned"), 260);
      }
      for (const old of olds) {
        if (!animate) old.remove();
        else if (pillLeave && old.parentElement === run) old.classList.add("lg-nav-leaving");
        else this.navBtnLeave(old);
      }
      if (pillLeave) this.navPillLeave(run);
      if (animate) entering = [];
      run.lgPillEnter = !!pillEnter;
      order.forEach((i) => {
        const p = (kinds[i] === "run" ? run : rest).createDiv({ cls: ["clickable-icon", "lg-nav-btn"] });
        if (entering) entering.push(p);
        p.addEventListener("mousedown", (e) => {
          e.stopPropagation();
          p.lgWasOpen = !!(p.lgSrc && p.lgSrc.classList.contains("has-active-menu"));
          this.tellMenus(p, "mousedown");
        });
        p.addEventListener("pointerdown", (e) => e.stopPropagation());
        p.addEventListener("pointerover", (e) => p.classList.toggle("lg-nav-typing", isEl(e.target) && !!e.target.closest(".search-input-container")));
        p.addEventListener("pointerleave", () => p.classList.remove("lg-nav-typing"));
        p.addEventListener("click", (e) => {
          if (isEl(e.target) && e.target.closest(".search-input-container")) return;
          p.lgClickAt = performance.now();
          e.preventDefault();
          e.stopPropagation();
          const src = p.lgSrc;
          if (!src || !src.isConnected) return;
          if (p.lgWasOpen) {
            p.lgWasOpen = false;
            this.tellMenus(src, "click");
            return;
          }
          this.clickOriginal(src, p);
        });
      });
    }
    const proxies = els(row.querySelectorAll(".lg-nav-btn:not(.lg-nav-leaving)"));
    order.forEach((bi, pi) => {
      const b = buttons[bi];
      const p = proxies[pi];
      if (!p) return;
      p.lgSrc = b;
      const svg = b.querySelector("svg");
      p.classList.toggle("lg-nav-find", !!svg && svg.classList.contains("lucide-search"));
      const icon = svg ? svg.getAttribute("class") : "";
      if (p.lgIcon !== icon) {
        p.lgIcon = icon;
        p.empty();
        if (svg) p.appendChild(svg.cloneNode(true));
      }
      const label = b.getAttribute("aria-label") || "";
      if (p.getAttribute("aria-label") !== label) (0, import_obsidian11.setTooltip)(p, label);
      p.classList.toggle("is-active", b.classList.contains("is-active"));
      p.classList.toggle("has-active-menu", b.classList.contains("has-active-menu"));
    });
    if (entering) {
      if (run.lgPillEnter) this.navBtnEnter(run);
      entering.forEach((p) => {
        if (!(run.lgPillEnter && p.parentElement === run)) this.navBtnEnter(p);
      });
    }
    window.clearTimeout(row.lgNoneTimer);
    if (buttons.length === 0 && row.querySelector(".lg-nav-leaving")) {
      if (tabsEl.classList.contains("lg-nav-two") && !row.classList.contains("lg-nav-row-out")) {
        const h0 = header.offsetHeight;
        const cb = row.offsetParent;
        const rr = row.getBoundingClientRect();
        const cr = cb ? cb.getBoundingClientRect() : null;
        tabsEl.classList.remove("lg-nav-two");
        if (cb && header.offsetHeight < h0) {
          row.setCssProps({ "--lg-rx": `${rr.left - cr.left - cb.clientLeft}px`, "--lg-ry": `${rr.top - cr.top - cb.clientTop}px`, "--lg-rw": `${rr.width}px` });
          row.classList.add("lg-nav-row-out");
          this.navRowCollapse(tabsEl, header, h0);
        } else tabsEl.classList.add("lg-nav-two");
      }
      row.lgNoneTimer = window.setTimeout(() => {
        const none = !row.querySelector(".lg-nav-btn:not(.lg-nav-leaving)");
        row.classList.remove("lg-nav-row-out");
        row.classList.toggle("lg-nav-none", none);
        tabsEl.classList.toggle("lg-nav-two", !none);
      }, 260);
    } else {
      if (row.classList.contains("lg-nav-row-out")) {
        row.classList.remove("lg-nav-row-out");
        if (tabsEl.lgCollapseEnd) tabsEl.lgCollapseEnd();
      }
      row.classList.toggle("lg-nav-none", buttons.length === 0);
      tabsEl.classList.toggle("lg-nav-two", buttons.length > 0);
    }
    const inner = header.querySelector(":scope > .workspace-tab-header-container-inner");
    const count = inner ? inner.querySelectorAll(":scope > .workspace-tab-header").length : 0;
    const listed = !!tabsEl.closest(".lg-tab-list");
    tabsEl.classList.toggle("lg-one", !listed && count === 1);
    const n = String(Math.max(1, count));
    if (tabsEl.style.getPropertyValue("--lg-tab-n") !== n) tabsEl.setCssProps({ "--lg-tab-n": n });
    let sec = header.querySelector(":scope > .lg-list-section");
    const withSec = listed && count > 1;
    tabsEl.classList.toggle("lg-sec", withSec);
    if (withSec) {
      if (!sec) sec = header.createDiv({ cls: ["lg-list-section", INJECTED] });
      const name = leaf ? leaf.getDisplayText() : "";
      if (sec.textContent !== name) sec.setText(name);
    } else if (sec) sec.remove();
    this.navSearchSync(tabsEl);
  },
  // 패널 검색 (넓게 모드, 사용자 요청): 버튼 줄에 자리가 넉넉하면 돋보기 버튼이 알약으로 넓어지고 Obsidian 검색 칸이 그 안에 들어간다
  // (칸반 검색과 같은 방식). 켜고 끄는 것은 Obsidian 이 정하고(원래 버튼), 여기서는 켜져 있는 동안 검색 칸 자리만 옮긴다.
  // 남는 폭이 NAV_SEARCH_MIN 보다 적으면 머리 줄의 원래 자리에 둔다. 옮겨 온 동안은 tabsEl.lgSearchIn 에 기억한다.
  // 넓게 썼으면 true (머리 줄 검색창의 나타남·사라짐 움직임은 건너뛴다)
  navSearchSync(tabsEl) {
    const doc = tabsEl.ownerDocument;
    const header = tabsEl.querySelector(":scope > .workspace-tab-header-container");
    const row = header && header.querySelector(":scope > .lg-nav-row");
    const leaf = this.activeLeafOf(tabsEl);
    const root = leaf && leaf.view ? leaf.view.containerEl : null;
    const cur = tabsEl.lgSearchIn || null;
    const ok = row && root && !this.unloaded && this.tabWideOf(tabsEl) && !tabsEl.classList.contains("lg-nav-fold");
    const p = ok ? els(row.querySelectorAll(".lg-nav-btn:not(.lg-nav-leaving)")).find(
      (x) => x.lgSrc && x.lgSrc.isConnected && root.contains(x.lgSrc) && x.lgSrc.querySelector(".lucide-search")
    ) : null;
    const head = p ? p.lgSrc.closest(".nav-header") : null;
    const sc = cur && cur.head === head ? cur.sc : head && head.querySelector(":scope > .search-input-container");
    let w = 0;
    if (p && sc && sc.style.display !== "none") {
      const base = p.offsetHeight;
      const parts = els(row.querySelectorAll(":scope > .lg-nav-run, :scope > .lg-nav-rest")).filter((x) => x.childElementCount > 0);
      const gap = parseFloat(getComputedStyle(row).columnGap) || 0;
      const need = parts.reduce((sum, x) => sum + x.offsetWidth, 0) + gap * Math.max(0, parts.length - 1) - (p.offsetWidth - base);
      const free = row.getBoundingClientRect().width - need;
      if (free >= NAV_SEARCH_MIN) w = base + Math.min(NAV_SEARCH_MAX - base, free);
    }
    if (cur && (!w || cur.p !== p || cur.sc !== sc)) this.navSearchOut(tabsEl);
    if (!w) return !!cur;
    p.setCssProps({ "--lg-ns-w": `${w}px` });
    if (!tabsEl.lgSearchIn) {
      const input = sc.querySelector("input");
      const focused = !!input && doc.activeElement === input;
      p.appendChild(sc);
      p.classList.add("lg-nav-search");
      if (input && (focused || performance.now() - (p.lgClickAt || 0) < 600)) input.focus();
      const mo = new MutationObserver(() => this.navSearchSync(tabsEl));
      mo.observe(sc, { attributes: true, attributeFilter: ["style"] });
      tabsEl.lgSearchIn = { p, sc, head, mo };
    }
    return true;
  },
  // 넓혀 둔 검색 칸을 원래 머리 줄로 돌려보내고 버튼을 원으로 되돌린다 (머리 줄이 닫힌 보기여도 돌려보낸다)
  // 버튼이 사라지는 중이면(다른 보기로 바뀜) 버튼은 넓은 채로 두고 검색 칸 사본을 남겨, 버튼과 함께 줄며 흐려지게 한다.
  // 켜진 채로 돌려보내면(패널이 좁아짐) 머리 줄 검색창이 나타나는 움직임을 건다
  navSearchOut(tabsEl) {
    const cur = tabsEl.lgSearchIn;
    if (!cur) return;
    tabsEl.lgSearchIn = null;
    cur.mo.disconnect();
    const leaving = cur.p.classList.contains("lg-nav-leaving");
    const show = !leaving && !this.unloaded && cur.sc.style.display !== "none" && cur.head.isConnected;
    const below = show ? this.headBelow(cur.head) : null;
    if (leaving) {
      const ghost = cur.sc.cloneNode(true);
      const input = cur.sc.querySelector("input");
      const gInput = ghost.querySelector("input");
      if (input && gInput) gInput.value = input.value;
      ghost.classList.add(INJECTED);
      cur.p.appendChild(ghost);
    }
    cur.head.appendChild(cur.sc);
    if (!leaving) {
      cur.p.classList.remove("lg-nav-search");
      cur.p.style.removeProperty("--lg-ns-w");
    }
    if (show) queueMicrotask(() => cur.sc.getClientRects().length && this.headSearchIn(cur.sc, below));
  },
  // 머리 줄 아래 내용의 지금 자리. 칸이 아니라 안의 첫 내용으로 잰다: 머리 줄 판정(lg-bare-head)이 바뀌면 칸의 위 여백이 함께 바뀌어
  // 칸 자체는 탭 줄 높이만큼 더 움직이지만 내용은 검색창 높이만큼만 움직인다
  headBelow(head) {
    const out = [];
    for (let k = head.nextElementSibling; k; k = k.nextElementSibling) out.push([k, (k.firstElementChild || k).getBoundingClientRect().top]);
    return out;
  },
  // 머리 줄 아래 내용이 headBelow 로 잰 자리에서 지금 자리로 미끄러진다
  headSlide(below, duration) {
    for (const [k, top] of below) {
      const dy = top - (k.firstElementChild || k).getBoundingClientRect().top;
      if (Math.abs(dy) > 0.5) k.animate([{ transform: `translateY(${dy}px)` }, { transform: "translateY(0)" }], { duration, easing: EASE.settle });
    }
  },
  // 머리 줄 검색창이 나타남: 0.4배에서 살짝 넘치며 커지고, 아래 내용은 미끄러져 내려간다
  headSearchIn(sc, below) {
    const opt = { duration: 260, easing: EASE.pop };
    this.headSlide(below, opt.duration);
    sc.animate(
      [
        { transform: "scale(0.4)", opacity: 0 },
        { transform: "scale(1)", opacity: 1 }
      ],
      opt
    );
  },
  // 넓게 모드 버튼 줄의 버튼이 나타나고 사라지는 움직임 (사용자 요청): 제자리에서 가로세로가 같이 줄어들며 흐려지고,
  // 나타날 때는 반대로 제자리에서 커지며 또렷해진다. 자리를 밀거나 당기지 않는다.
  // 사라지는 버튼은 원래 자리 그대로 띄워(배치에서 빼) 새 버튼이 처음부터 제자리에 놓이게 한다 (CSS: .lg-nav-leaving).
  // 부모(알약 .lg-nav-run 또는 원형 버튼 묶음)는 바꾸지 않는다: 원형 버튼의 유리는 부모 기준 규칙이라 옮기면 사라진다.
  // 띄우는 기준은 위치 기준 요소(offsetParent)
  navBtnMeasure(p) {
    const cb = p.offsetParent;
    if (!cb) return;
    const cr = cb.getBoundingClientRect();
    const br = p.getBoundingClientRect();
    p.setCssProps({ "--lg-gx": `${br.left - cr.left - cb.clientLeft}px`, "--lg-gy": `${br.top - cr.top - cb.clientTop}px`, "--lg-gw": `${br.width}px`, "--lg-gh": `${br.height}px` });
    p.lgMeasured = true;
  },
  // 둘째 줄이 빠질 때 내용이 올라오는 움직임: 헤더는 내용 위에 떠 있고 내용은 탭 줄 높이(--header-height)만큼 내려 두므로,
  // 그 값을 옛 높이에서 새 높이로 프레임마다 줄인다. 그동안 헤더 자체는 새 높이로 묶어 탭 알약이 움직이지 않게 한다
  navRowCollapse(tabsEl, header, h0) {
    if (tabsEl.lgCollapseEnd) tabsEl.lgCollapseEnd();
    const h1 = header.offsetHeight;
    header.setCssProps({ height: `${h1}px` });
    const t0 = window.performance.now();
    let raf = 0;
    const end = () => {
      window.cancelAnimationFrame(raf);
      tabsEl.style.removeProperty("--header-height");
      header.style.removeProperty("height");
      if (tabsEl.lgCollapseEnd === end) tabsEl.lgCollapseEnd = null;
    };
    const step = (now) => {
      const u = Math.min(1, Math.max(0, (now - t0) / 240));
      const e = 1 - Math.pow(1 - u, 3);
      tabsEl.setCssProps({ "--header-height": `${h0 + (h1 - h0) * e}px` });
      if (u < 1) raf = window.requestAnimationFrame(step);
      else end();
    };
    tabsEl.lgCollapseEnd = end;
    step(t0);
  },
  navBtnLeave(p) {
    if (!p.lgMeasured) return p.remove();
    p.classList.add("lg-nav-leaving");
    const anim = p.animate(
      [
        { transform: "scale(1)", opacity: 1 },
        { transform: "scale(0.4)", opacity: 0 }
      ],
      { duration: 200, easing: EASE.exit, fill: "forwards" }
    );
    const done = () => p.remove();
    anim.onfinish = anim.oncancel = done;
    window.setTimeout(done, 400);
  },
  // 알약째 사라질 때: 크기를 지금 그대로 고정하고(안의 버튼이 배치에서 빠져도 접히지 않게) 제자리에서 줄어들며 흐려진다
  navPillPin(run) {
    const r = run.getBoundingClientRect();
    run.setCssProps({ "--lg-pw": `${r.width}px`, "--lg-ph": `${r.height}px` });
    run.classList.add("lg-nav-pinned");
  },
  navPillLeave(run) {
    const anim = run.animate(
      [
        { transform: "scale(1)", opacity: 1 },
        { transform: "scale(0.4)", opacity: 0 }
      ],
      { duration: 200, easing: EASE.exit, fill: "forwards" }
    );
    run.lgPillAnim = anim;
    let ended = false;
    const done = () => {
      if (ended) return;
      ended = true;
      if (run.lgPillAnim === anim) run.lgPillAnim = null;
      run.querySelectorAll(":scope > .lg-nav-leaving").forEach((g) => g.remove());
      run.classList.remove("lg-nav-pinned");
      anim.cancel();
    };
    anim.onfinish = anim.oncancel = done;
    window.setTimeout(done, 400);
  },
  navBtnEnter(p) {
    p.animate(
      [
        { transform: "scale(0.4)", opacity: 0 },
        { transform: "scale(1)", opacity: 1 }
      ],
      { duration: 240, easing: EASE.settle }
    );
  },
  // 버튼 종류: "menu" = 누르면 메뉴가 뜬다, "toggle" = 켜고 끈다(모두 접기·펼치기 포함, 사용자 요청), "run" = 눌러서 실행
  navKind(b) {
    if (this.opensMenu(b)) return "menu";
    const label = b.getAttribute("aria-label") || "";
    const svg = b.querySelector("svg");
    const icon = svg ? svg.getAttribute("class") || "" : "";
    this.toggleLabels = this.toggleLabels || /* @__PURE__ */ new Set();
    if (b.classList.contains("is-active")) this.toggleLabels.add(label);
    if (this.toggleLabels.has(label)) return "toggle";
    if (/lucide-(chevrons-down-up|chevrons-up-down|gallery-vertical|sliders)/.test(icon)) return "toggle";
    if (/접기|펼치기|자동|보기|표시|설정|필터|collapse|expand|auto|show|toggle|setting|filter/i.test(label)) return "toggle";
    return "run";
  },
  // 패널 탭 알약을 패널 머리 줄 가운데에 둔다. 알약 양옆 버튼(닫기····)의 폭 차이만큼 좁은 쪽에 빈칸을 둔다.
  // 자리가 넉넉하면 가운데, 모자라면 빈칸부터 줄어 알약이 밀리고, 그래도 모자라면 알약 안에서 스크롤된다.
  // ··· 이 접히고 펼쳐지는 애니메이션과 같이 움직이도록, 재는 값은 애니메이션 중의 자리가 아니라 접힘 여부로 정한다
  balanceSide(tabsEl) {
    const header = tabsEl.querySelector(":scope > .workspace-tab-header-container");
    const inner = header && header.querySelector(":scope > .workspace-tab-header-container-inner");
    if (!inner) return;
    let sp = header.querySelector(":scope > .lg-side-balance");
    if (!sp) {
      sp = createDiv({ cls: ["lg-side-balance", INJECTED] });
      header.insertBefore(sp, inner);
    }
    if (!header.querySelector(":scope > .lg-ptab-ring")) header.insertBefore(createDiv({ cls: ["lg-ptab-ring", INJECTED] }), inner);
    const gap = parseFloat(getComputedStyle(header).columnGap) || 0;
    const kids = els(header.children).filter(
      (c) => c !== sp && c !== inner && !c.classList.contains("lg-seg-indicator") && c.getClientRects().length && getComputedStyle(c).position !== "absolute"
    );
    const cs = getComputedStyle(header);
    let L = parseFloat(cs.paddingLeft) || 0;
    let R = parseFloat(cs.paddingRight) || 0;
    if (header.closest(".mod-left-split")) {
      const ribbon = header.ownerDocument.querySelector(".workspace-ribbon:is(.mod-left, .mod-primary)");
      const rr = ribbon && ribbon.getClientRects().length ? ribbon.getBoundingClientRect() : null;
      const hl = header.getBoundingClientRect().left;
      if (rr && rr.width > 0.5 && rr.left < hl) L += hl - rr.left;
    }
    let after = false;
    for (const c of els(header.children)) {
      if (c === inner) after = true;
      if (!kids.includes(c)) continue;
      const w2 = c.classList.contains("lg-nav-more-off") ? 0 : c.offsetWidth + gap;
      if (after) R += w2;
      else L += w2;
    }
    const diff = R - L;
    const w = Math.abs(diff);
    if (w < 1) {
      sp.style.removeProperty("flex-basis");
      sp.classList.toggle("lg-basis-0", true);
      return;
    }
    const want = diff > 0 ? inner : inner.nextSibling;
    if (diff > 0 ? sp.nextSibling !== inner : sp.previousSibling !== inner) header.insertBefore(sp, want);
    sp.classList.toggle("lg-basis-0", false);
    sp.style.flexBasis = `${w.toFixed(1)}px`;
  },
  // 사이드바 탭의 ··· 메뉴에 넣을 원래 버튼들: 버튼 줄(숨겨지지 않은 것) + 검색 탭의 검색 설정 버튼
  navItemsOf(leaf) {
    if (!leaf || !leaf.view || !leaf.view.containerEl) return [];
    const root = leaf.view.containerEl;
    const items = els(root.querySelectorAll(":scope > .nav-header .nav-buttons-container > .clickable-icon")).filter(
      (b) => b.style.display !== "none"
    );
    const searchSettings = root.querySelector(":scope > .search-row > .clickable-icon");
    if (searchSettings) items.push(searchSettings);
    return items;
  },
  // 메뉴에 넣을 게 없는 탭이면 ··· 을 접는다
  updateNavMore(tabsEl) {
    const btn = tabsEl.querySelector(":scope > .workspace-tab-header-container > .lg-nav-more");
    if (!btn) return;
    btn.classList.toggle("lg-nav-more-off", this.navItemsOf(this.activeLeafOf(tabsEl)).length === 0);
    this.renderNavRow(tabsEl);
    this.balanceSide(tabsEl);
    this.navFoldCheck(tabsEl);
    window.clearTimeout(tabsEl.lgFoldTimer);
    tabsEl.lgFoldTimer = window.setTimeout(() => !this.unloaded && this.navFoldCheck(tabsEl), 300);
  },
  openNavMenu(tabsEl, anchor) {
    const leaf = this.activeLeafOf(tabsEl);
    const buttons = this.navItemsOf(leaf);
    if (!anchor.lgNavSnap) {
      const subs = buttons.filter((b) => this.opensMenu(b));
      if (subs.length) {
        anchor.lgNavSnap = true;
        const snaps = /* @__PURE__ */ new Map();
        void subs.reduce((p, b) => p.then(() => this.withHiddenMenu(b, (m) => this.readMenu(m)).then((v) => v && snaps.set(b, v))), Promise.resolve()).then(() => {
          anchor.lgNavSnap = false;
          this.showNavMenu(buttons, anchor, snaps);
        });
        return;
      }
    }
    this.showNavMenu(buttons, anchor, /* @__PURE__ */ new Map());
  },
  showNavMenu(buttons, anchor, snaps) {
    const menu = new import_obsidian11.Menu();
    if (buttons.length === 0) {
      menu.addItem((item) => item.setTitle(tr("\uC0AC\uC6A9\uD560 \uBA54\uB274\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4", "No menu items available")).setDisabled(true));
    }
    for (const b of buttons) {
      const svg = b.querySelector("svg");
      const icon = svg ? strs(svg.classList).find((c) => c.startsWith("lucide-")) : null;
      const snap = snaps.get(b);
      if (snap && snap.length) {
        menu.addItem((item) => {
          item.setTitle(b.getAttribute("aria-label") || "").setIcon(icon || null);
          const sub = item.setSubmenu();
          snap.forEach((it, i) => {
            if (it.sep) return sub.addSeparator();
            sub.addItem((si) => {
              si.setTitle(it.title).setIcon(it.icon || null);
              if (it.checked) si.setChecked(true);
              if (it.disabled) si.setDisabled(true);
              si.onClick(() => window.setTimeout(() => {
                void this.withHiddenMenu(b, (m) => {
                  const el = m.querySelectorAll(".menu-item, .menu-separator")[i];
                  if (el) el.click();
                });
              }, 0));
            });
          });
        });
        continue;
      }
      menu.addItem((item) => {
        item.setTitle(b.getAttribute("aria-label") || "").setIcon(icon || null);
        if (b.hasClass("is-active")) item.setChecked(true);
        item.onClick(() => this.clickOriginal(b, anchor, 0));
      });
    }
    const r = anchor.getBoundingClientRect();
    menu.setParentElement(anchor);
    menu.showAtPosition({ x: r.right - 1, y: r.bottom + MENU_DROP, width: 1, overlap: true, left: true });
  },
  // 모바일 서랍의 보기 전환 줄(테마가 Obsidian 보기 목록을 가로 알약으로 펼친 것)에 렌즈를 붙인다.
  // 목록 항목의 .is-active 는 Obsidian 이 바꾼다 (recomputeChildrenDimensions)
  watchDrawerTabs(drawer) {
    const opts = drawer && drawer.containerEl && drawer.containerEl.querySelector(".workspace-drawer-tab-options");
    const list = opts && opts.querySelector(":scope > .workspace-drawer-tab-options-list");
    if (!list || this.segWatched.has(opts)) return;
    this.segWatched.add(opts);
    const lens = new SegmentLens(opts, list, this);
    lens.keepH = true;
    const bakeRo = new ResizeObserver(() => lens.prebakeAll());
    bakeRo.observe(list);
    this.register(() => bakeRo.disconnect());
    const current = () => list.querySelector(":scope > .workspace-tab-header.is-active");
    let last = current();
    const obs = new MutationObserver(() => {
      const cur = current();
      if (cur && last && cur !== last && last.isConnected && list.children.length > 1) lens.moveTo(last, cur);
      last = cur;
    });
    obs.observe(list, { subtree: true, childList: true, attributes: true, attributeFilter: ["class"] });
    this.observers.push(obs);
    this.register(() => lens.stop());
  },
  // 모바일 서랍: 지금 보기의 버튼 줄(새 노트·새 폴더·정렬 등, 테마가 숨긴다)을 서랍 머리 오른쪽 ··· 버튼의 메뉴로 모은다.
  // 메뉴 항목을 누르면 원래 버튼을 눌러 Obsidian 동작을 그대로 쓴다. 버튼 줄이 없는 보기에서는 ··· 을 숨긴다
  setupDrawerMore(drawer) {
    const c = drawer && drawer.containerEl;
    const head = c && c.querySelector(".workspace-drawer-header");
    const content = c && c.querySelector(".workspace-drawer-active-tab-content");
    if (!head || !content || head.querySelector(":scope > .lg-drawer-more")) return;
    if (import_obsidian11.Platform.isPhone) {
      const win = c.ownerDocument.defaultView || window;
      const put = () => {
        const h = head.offsetHeight;
        if (!h) return;
        const v = `${h}px`;
        if (c.style.getPropertyValue("--lg-dhead-h") !== v) c.style.setProperty("--lg-dhead-h", v);
      };
      const ro = new win.ResizeObserver(put);
      ro.observe(head);
      put();
      this.register(() => {
        ro.disconnect();
        c.style.removeProperty("--lg-dhead-h");
      });
    }
    const btn = head.createDiv({ cls: ["clickable-icon", "workspace-drawer-header-icon", "mod-raised", "lg-drawer-more", INJECTED] });
    (0, import_obsidian11.setIcon)(btn, "more-horizontal");
    btn.setAttribute("aria-label", tr("\uBA54\uB274", "Menu"));
    const buttons = () => {
      const bar = content.querySelector(".nav-buttons-container");
      const list = bar ? els(bar.querySelectorAll(":scope > .clickable-icon")).filter((b) => b.style.display !== "none" && !b.classList.contains("is-hidden")) : [];
      const searchSettings = content.querySelector('.workspace-leaf-content[data-type="search"] > .search-row > .clickable-icon');
      if (searchSettings) list.push(searchSettings);
      return list;
    };
    const sync = () => btn.toggle(buttons().length > 0);
    sync();
    btn.addEventListener("click", (e) => {
      if (btn.classList.contains("has-active-menu")) {
        this.tellMenus(btn, "click");
        return;
      }
      if (btn.ownerDocument.querySelector(".menu:not(.lg-menu-ghost)")) this.tellMenus(btn, "mousedown");
      const list = buttons();
      if (!list.length) return;
      const menu = new import_obsidian11.Menu();
      for (const b of list) {
        const svg = b.querySelector("svg");
        const icon = svg && strs(svg.classList).find((k) => k !== "svg-icon");
        menu.addItem((item) => {
          item.setTitle(b.getAttribute("aria-label") || "");
          if (icon) item.setIcon(icon);
          if (b.classList.contains("is-active")) item.setChecked(true);
          item.onClick(() => window.setTimeout(() => b.isConnected && b.click(), 0));
        });
      }
      const r = btn.getBoundingClientRect();
      const winH = btn.ownerDocument.documentElement.clientHeight;
      const up = r.top + r.height / 2 > winH / 2;
      menu.setParentElement(btn);
      menu.showAtPosition({ x: r.right - 1, y: up ? r.top - MENU_DROP : r.bottom + MENU_DROP, width: 1, overlap: true, left: true });
    });
    const LIST = ".nav-files-container, .tree-item-children, .search-result-container, .search-results-children";
    const obs = new MutationObserver((recs) => {
      if (recs.every((r) => r.target.nodeType === 1 && r.target.closest(LIST))) return;
      sync();
    });
    obs.observe(content, { subtree: true, childList: true });
    this.observers.push(obs);
  },
  // 사이드바 탭 그룹마다 렌즈 하나를 붙이고 선택 변화를 지켜본다
  watchSegments(tabsEl) {
    if (this.segWatched.has(tabsEl)) return;
    const header = tabsEl.querySelector(":scope > .workspace-tab-header-container");
    const inner = header && header.querySelector(":scope > .workspace-tab-header-container-inner");
    if (!inner) return;
    this.segWatched.add(tabsEl);
    const lens = new SegmentLens(header, inner, this);
    lens.prebakeAll();
    this.registerDomEvent(inner, "scroll", () => inner.style.setProperty("--lg-sx", `${inner.scrollLeft}px`), { passive: true });
    const win = header.ownerDocument.defaultView || window;
    let rb = 0;
    const ro = new win.ResizeObserver(() => {
      if (rb) return;
      rb = win.requestAnimationFrame(() => {
        rb = 0;
        if (header.isConnected && header.getBoundingClientRect().width > 0) this.balanceSide(tabsEl);
      });
    });
    ro.observe(header);
    this.register(() => ro.disconnect());
    const current = () => inner.querySelector(":scope > .workspace-tab-header.is-active");
    let last = current();
    const obs = new MutationObserver(() => {
      const cur = current();
      if (cur && last && cur !== last && last.isConnected && inner.children.length > 1) lens.moveTo(last, cur);
      if (cur !== last) this.updateNavMore(tabsEl);
      else {
        this.renderNavRow(tabsEl);
        lens.prebakeAll();
      }
      last = cur;
    });
    obs.observe(inner, { subtree: true, childList: true, attributes: true, attributeFilter: ["class"] });
    this.observers.push(obs);
    this.register(() => lens.stop());
  }
};

// src/tabs.ts
var import_obsidian12 = require("obsidian");
var tabsMethods = {
  // 탭 그룹 요소에서 지금 선택된 리프를 찾는다
  activeLeafOf(tabsEl) {
    let found = null;
    this.app.workspace.iterateAllLeaves((leaf) => {
      if (found) return;
      if (leaf.parent && leaf.parent.containerEl === tabsEl && leaf.tabHeaderEl && leaf.tabHeaderEl.hasClass("is-active")) {
        found = leaf;
      }
    });
    return found;
  },
  makeButton(cls, icon, tooltip, onClick) {
    const el = createDiv({ cls: ["clickable-icon", INJECTED, cls] });
    (0, import_obsidian12.setIcon)(el, icon);
    if (tooltip) (0, import_obsidian12.setTooltip)(el, tooltip);
    el.addEventListener("mousedown", (e) => {
      e.stopPropagation();
      el.lgWasOpen = el.classList.contains("has-active-menu");
      this.tellMenus(el, "mousedown");
    });
    el.addEventListener("pointerdown", (e) => e.stopPropagation());
    el.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      onClick(e, el);
    });
    return el;
  },
  setupRootTabs(tabsEl) {
    const header = tabsEl.querySelector(":scope > .workspace-tab-header-container");
    if (!header) return;
    if (!header.querySelector(":scope > .lg-slab")) {
      header.prepend(createDiv({ cls: ["lg-slab", INJECTED] }));
    }
    let nav = header.querySelector(":scope > .lg-tab-nav");
    if (!nav) {
      nav = createDiv({ cls: ["lg-tab-nav", INJECTED] });
      nav.appendChild(
        this.makeButton("lg-tab-back", "arrow-left", tr("\uB4A4\uB85C", "Back"), () => this.goHistory(tabsEl, "back"))
      );
      nav.appendChild(
        this.makeButton("lg-tab-forward", "arrow-right", tr("\uC55E\uC73C\uB85C", "Forward"), () => this.goHistory(tabsEl, "forward"))
      );
      header.prepend(nav);
    }
    this.setupRibbonButtons(tabsEl, header, nav);
    let mode = header.querySelector(".lg-tab-mode");
    if (!mode) {
      mode = this.makeButton("lg-tab-mode", "book-open", tr("\uC77D\uAE30/\uD3B8\uC9D1 \uC804\uD658", "Toggle reading/editing"), (e) => {
        const leaf = this.activeLeafOf(tabsEl);
        const v = leaf && leaf.view;
        if (isWebView(v) && typeof v.toggleReaderMode === "function") v.toggleReaderMode();
        else if (v instanceof import_obsidian12.MarkdownView && typeof v.onSwitchView === "function") v.onSwitchView(e);
        window.setTimeout(() => this.requestRefresh(), 50);
      });
      const tabList = header.querySelector(":scope > .workspace-tab-header-tab-list");
      header.insertBefore(mode, tabList || null);
    }
    if (!import_obsidian12.Platform.isPhone) {
      const newTab = header.querySelector(".workspace-tab-header-new-tab");
      const list = header.querySelector(".workspace-tab-header-tab-list");
      let tools = header.querySelector(":scope > .lg-tab-tools");
      if (!tools) {
        tools = createDiv({ cls: ["lg-tab-tools", INJECTED] });
        if (header.lgBalanceObs) header.lgBalanceObs.observe(tools);
      }
      if (tools.parentElement !== header) header.insertBefore(tools, newTab && newTab.parentElement === header ? newTab : mode);
      const want = [newTab, mode, list].filter(Boolean);
      const kids = els(tools.children);
      if (kids.length !== want.length || kids.some((c, i) => c !== want[i])) want.forEach((el) => tools.appendChild(el));
    }
    let path = header.querySelector(":scope > .lg-path");
    if (!path) {
      path = createDiv({ cls: ["lg-path", INJECTED] });
      const pill = path.createDiv("lg-path-pill");
      pill.addEventListener(
        "click",
        (e) => {
          if (!tabsEl.classList.contains("lg-mini")) return;
          e.stopPropagation();
          e.preventDefault();
          this.setMini(tabsEl, false);
        },
        true
      );
      pill.createDiv("lg-path-text");
      for (const type of ["keydown", "keyup", "keypress"]) {
        pill.addEventListener(type, (e) => {
          if (isEl(e.target) && (e.target.isContentEditable || e.target.tagName === "INPUT") && !e.ctrlKey && !e.metaKey && !e.altKey && !WEB_KEYS_PASS.has(e.key)) e.stopPropagation();
        });
      }
      pill.appendChild(
        this.makeButton(
          "lg-path-menu",
          "menu",
          tr("\uB354 \uBCF4\uAE30", "More options"),
          (e, el) => this.toggleMenu(el, () => {
            const leaf = this.activeLeafOf(tabsEl);
            if (leaf) this.openViewMenu(leaf, el);
          })
        )
      );
    }
    if (!this.miniWired) this.miniWired = /* @__PURE__ */ new WeakSet();
    if (!this.miniWired.has(header)) {
      this.miniWired.add(header);
      this.registerDomEvent(header, "pointerover", () => {
        if (!tabsEl.classList.contains("lg-mini")) return;
        tabsEl.lgMiniReset = true;
        this.setMini(tabsEl, false);
      });
    }
    const tabInner = header.querySelector(":scope > .workspace-tab-header-container-inner");
    if (tabInner && path.nextSibling !== tabInner) header.insertBefore(path, tabInner);
    else if (!path.parentElement) header.appendChild(path);
    this.watchTabWidths(header.querySelector(":scope > .workspace-tab-header-container-inner"));
    const leaves = [];
    this.app.workspace.iterateAllLeaves((leaf) => {
      if (leaf.parent && leaf.parent.containerEl === tabsEl) leaves.push(leaf);
    });
    for (const leaf of leaves) {
      this.setupTabMenu(leaf);
      const v = leaf.view;
      if (v && v.moreOptionsButtonEl) v.moreOptionsButtonEl.addClass(HIDDEN);
      if (v && v.modeButtonEl) v.modeButtonEl.addClass(HIDDEN);
    }
    this.keepDragBand(header);
    this.syncTabBar(tabsEl, nav, mode);
  },
  // 창 끌기 띠 (CSS: .lg-drag-band, 탭 줄 첫 줄만 창을 잡는다). 끌기 영역은 문서 순서대로 겹쳐 뒤에 오는 버튼의 끌기 제외가
  // 띠를 파내므로, 띠는 늘 탭 줄의 첫 자식이어야 한다. Obsidian 은 패널을 닫을 때 패널 열기 버튼을 탭 줄 맨 앞에 넣는데,
  // 그러면 버튼이 띠보다 앞이 되어 띠에 덮여 눌리지 않았다 (사용자 제보). 탭 줄의 자식이 바뀔 때마다 띠를 맨 앞으로 되돌린다
  keepDragBand(header) {
    let band = header.querySelector(":scope > .lg-drag-band");
    if (!band) band = createDiv({ cls: ["lg-drag-band", INJECTED] });
    if (header.firstElementChild !== band) header.prepend(band);
    if (header.lgBandObs) return;
    const win = header.ownerDocument.defaultView || window;
    const obs = new win.MutationObserver(() => {
      const b = header.querySelector(":scope > .lg-drag-band");
      if (b && header.firstElementChild !== b) header.prepend(b);
    });
    obs.observe(header, { childList: true });
    header.lgBandObs = obs;
    this.observers.push(obs);
  },
  // 왼쪽 리본을 숨기고(styles.css), 그 버튼들은 편집창 탭 줄 맨 왼쪽의 리본 메뉴 버튼 하나로 모은다 (사용자 요청).
  // 리본에 있던 왼쪽 패널 열기 토글은 리본이 숨으면 Obsidian 이 스스로 이 탭 줄 맨 왼쪽으로 옮긴다(패널이 닫혀 있을 때).
  // 데스크톱·태블릿(태블릿은 서랍 안 리본의 실행 버튼 묶음을 숨긴다, styles.css), 편집창의 맨 위 왼쪽 탭 묶음 하나에만 단다
  setupRibbonButtons(tabsEl, header, nav) {
    if (import_obsidian12.Platform.isPhone) return;
    const root = this.app.workspace.rootSplit;
    const first = !!root && root.containerEl.querySelector(".workspace-tabs") === tabsEl;
    let rib = header.querySelector(":scope > .lg-rib-menu");
    if (!first) {
      if (rib) rib.remove();
      return;
    }
    if (!rib) {
      rib = this.makeButton("lg-rib-menu", "layout-grid", tr("\uB9AC\uBCF8 \uBA54\uB274", "Ribbon menu"), (e, el) => this.toggleMenu(el, () => this.openRibbonMenu(el)));
      header.insertBefore(rib, nav);
      if (header.lgBalanceObs) header.lgBalanceObs.observe(rib);
    }
  },
  // 숨긴 왼쪽 리본의 버튼들을 메뉴로 보인다. 항목을 누르면 원래 리본 버튼을 대신 눌러 Obsidian·플러그인 동작을 그대로 쓴다
  openRibbonMenu(anchor) {
    const doc = anchor.ownerDocument;
    const win = doc.defaultView || window;
    const rb = this.app.workspace.leftRibbon;
    const hidden = new Set((rb && rb.items || []).filter((i) => i.hidden).map((i) => i.buttonEl));
    const buttons = els(doc.querySelectorAll(":is(.workspace-ribbon:is(.mod-left, .mod-primary), .workspace-drawer-ribbon) .side-dock-actions .side-dock-ribbon-action")).filter(
      (b) => !hidden.has(b) && !b.hidden && win.getComputedStyle(b).display !== "none"
    );
    const extra = els(doc.querySelectorAll(".workspace-drawer-ribbon .side-dock-settings [aria-label]"));
    const menu = new import_obsidian12.Menu();
    if (buttons.length === 0 && extra.length === 0) menu.addItem((item) => item.setTitle(tr("\uB9AC\uBCF8\uC5D0 \uBC84\uD2BC\uC774 \uC5C6\uC2B5\uB2C8\uB2E4", "No ribbon buttons")).setDisabled(true));
    let sep = buttons.length > 0;
    for (const b of buttons.concat(extra)) {
      if (sep && b === extra[0]) menu.addSeparator();
      const svg = b.querySelector("svg");
      const icon = svg ? strs(svg.classList).find((c) => c.startsWith("lucide-")) : null;
      menu.addItem(
        (item) => item.setTitle(b.getAttribute("aria-label") || "").setIcon(icon || null).onClick(() => {
          const r2 = anchor.getBoundingClientRect();
          win.setTimeout(() => {
            b.dispatchEvent(new win.MouseEvent("click", { bubbles: true, cancelable: true, view: win, clientX: r2.left, clientY: r2.bottom }));
          }, 0);
        })
      );
    }
    const r = anchor.getBoundingClientRect();
    menu.setParentElement(anchor);
    menu.showAtPosition({ x: r.left, y: layoutBottom(anchor) + MENU_DROP }, doc);
  },
  // inner(탭 줄)를 가진 탭 묶음 객체
  tabsOf(inner) {
    let found = null;
    this.app.workspace.iterateAllLeaves((l) => {
      if (l.parent && l.parent.tabsInnerEl === inner) {
        found = l.parent;
        return true;
      }
    });
    return found;
  },
  // 탭 추가·닫기 폭 애니메이션은 Obsidian 자체 전환(새 탭은 0에서 커지고, 닫힌 탭은 복제본이 줄어든다)을 쓴다.
  // 여기서는 줄어드는 복제본에 표시만 달아, 테마가 그 구분선 등을 정리할 수 있게 한다
  watchTabWidths(inner) {
    if (!inner || this.tabsWatched.has(inner)) return;
    this.tabsWatched.add(inner);
    const obs = new MutationObserver(() => {
      const tabs = this.tabsOf(inner);
      if (!tabs) return;
      const live = new Set(tabs.tabHeaderEls || tabs.children.map((l) => l.tabHeaderEl));
      for (const el of inner.children) {
        if (el.classList.contains("workspace-tab-header")) el.classList.toggle("lg-tab-leaving", !live.has(el));
      }
    });
    obs.observe(inner, { childList: true });
    this.observers.push(obs);
  },
  setupTabMenu(leaf) {
    const inner = leaf.tabHeaderEl && leaf.tabHeaderEl.querySelector(".workspace-tab-header-inner");
    if (!inner || inner.querySelector(":scope > .lg-tab-menu")) return;
    const btn = this.makeButton("lg-tab-menu", "menu", tr("\uB354 \uBCF4\uAE30", "More options"), (e, el) => this.toggleMenu(el, () => this.openViewMenu(leaf, el)));
    inner.appendChild(btn);
  },
  // 뷰의 더 보기 메뉴를 연다 (탭 안의 ≡, 경로 알약의 ≡)
  openViewMenu(leaf, el) {
    const view = leaf.view;
    if (!view) return;
    if (typeof view.onMoreOptions === "function") {
      view.onMoreOptions({ preventDefault() {
      }, target: el });
    } else if (view.moreOptionsButtonEl) {
      view.moreOptionsButtonEl.click();
    }
  },
  goHistory(tabsEl, dir) {
    const leaf = this.activeLeafOf(tabsEl);
    if (!leaf) return;
    const view = leaf.view;
    const original = dir === "back" ? view.backButtonEl : view.forwardButtonEl;
    if (original) original.click();
    else if (leaf.history) dir === "back" ? leaf.history.back() : leaf.history.forward();
    window.setTimeout(() => this.requestRefresh(), 50);
  },
  // 탭 줄(트랙)이 편집창 가운데 오도록, 왼쪽(뒤로·앞으로)과 오른쪽(읽기·+·목록·창 제어 자리) 폭 차이만큼
  // 좁은 쪽에 빈칸을 둔다. 빈칸은 탭이 많아 자리가 모자라면 먼저 줄어든다 (CSS: .lg-tab-balance)
  balanceTabs(tabsEl) {
    const header = tabsEl.querySelector(":scope > .workspace-tab-header-container");
    const inner = header && header.querySelector(":scope > .workspace-tab-header-container-inner");
    if (!inner) return;
    let sp = header.querySelector(":scope > .lg-tab-balance");
    if (!sp) {
      sp = createDiv({ cls: ["lg-tab-balance", INJECTED] });
      header.insertBefore(sp, inner);
    }
    if (!header.lgBalanceObs) {
      const win = header.ownerDocument.defaultView || window;
      header.lgBalanceObs = new win.ResizeObserver(() => this.balanceTabs(tabsEl));
      header.lgBalanceObs.observe(header);
      els(header.children).forEach((c) => c !== inner && c !== sp && header.lgBalanceObs.observe(c));
      this.register(() => {
        if (header.lgBalanceObs) header.lgBalanceObs.disconnect();
        delete header.lgBalanceObs;
      });
    }
    const now = (header.ownerDocument.defaultView || window).performance.now();
    if (header.lgBalanceAt != null && now - header.lgBalanceAt < 4) return;
    header.lgBalanceAt = now;
    const hr = header.getBoundingClientRect();
    const cs = getComputedStyle(header);
    const path = header.querySelector(":scope > .lg-path");
    const stacked = tabsEl.classList.contains("mod-stacked");
    const anchor = !import_obsidian12.Platform.isPhone && path && (stacked || this.settings.showPath) ? path : inner;
    const styles = /* @__PURE__ */ new Map();
    const styleOf = (c) => {
      let v = styles.get(c);
      if (!v) styles.set(c, v = getComputedStyle(c));
      return v;
    };
    const kids = els(header.children).filter((c) => c !== sp && (anchor === inner || c !== inner) && !c.classList.contains("lg-slab") && !c.classList.contains("lg-seg-indicator") && c.getClientRects().length && styleOf(c).position !== "absolute").map((c, k) => ({ c, k, o: parseFloat(styleOf(c).order) || 0 })).sort((a, b) => a.o - b.o || a.k - b.k).map((x) => x.c);
    const i = kids.indexOf(anchor);
    const box = (c) => {
      if (c.offsetParent === header) return { left: c.offsetLeft, right: c.offsetLeft + c.offsetWidth, width: c.offsetWidth };
      const b = c.getBoundingClientRect();
      return { left: b.left - hr.left, right: b.right - hr.left, width: b.width };
    };
    const lefts = kids.slice(0, i).filter((c) => box(c).width > 0.5);
    const rights = kids.slice(i + 1).filter((c) => box(c).width > 0.5);
    const L = lefts.length ? Math.max(...lefts.map((c) => box(c).right + (parseFloat(styleOf(c).marginRight) || 0))) : parseFloat(cs.paddingLeft);
    const R = hr.width - (rights.length ? Math.min(...rights.map((c) => box(c).left)) : hr.width - parseFloat(cs.paddingRight));
    const diff = R - L;
    const w = Math.abs(diff);
    if (w < 1) {
      sp.hide();
      return;
    }
    const want = diff > 0 ? anchor : anchor.nextSibling;
    if (diff > 0 ? sp.nextSibling !== anchor : sp.previousSibling !== anchor) header.insertBefore(sp, want);
    sp.show();
    sp.style.flexBasis = `${w}px`;
  },
  // 탭 줄 축소: 편집창 본문(편집·읽기 보기의 스크롤 칸)의 스크롤 방향을 본다
  onMiniScroll(t) {
    if (!isEl(t) || !this.settings.miniBar) return;
    if (!t.matches(".cm-scroller, .markdown-preview-view")) return;
    const tabs = t.closest(".mod-root .workspace-tabs");
    if (!tabs || tabs.classList.contains("mod-stacked")) return;
    this.miniFeed(tabs, t, t.scrollTop);
  },
  // 스크롤 위치 y 를 받아 접거나 편다. h 는 스크롤 상태를 들고 있는 것(편집창 스크롤 칸, 웹 뷰어는 보기)
  miniFeed(tabs, h, y) {
    const prev = h.lgMiniY == null ? y : h.lgMiniY;
    h.lgMiniY = y;
    if (tabs.lgMiniHold && performance.now() < tabs.lgMiniHold) {
      h.lgMiniDir = 0;
      return;
    }
    if (y < MINI_TOP) return this.setMini(tabs, false);
    const dir = Math.sign(y - prev);
    if (!dir) return;
    if (tabs.lgMiniReset) {
      tabs.lgMiniReset = false;
      h.lgMiniDir = 0;
    }
    if (dir !== h.lgMiniDir) {
      h.lgMiniDir = dir;
      h.lgMiniFrom = prev;
    }
    if (Math.abs(y - h.lgMiniFrom) >= MINI_STEP) this.setMini(tabs, dir > 0);
  },
  // 탭 줄을 접거나 편다 (CSS: .workspace-tabs.lg-mini). 최종 모습은 CSS 가 정하고, 바뀌는 값(유리판 높이, 경로 알약 폭·위치·크기,
  // 나머지 버튼·탭의 투명도·크기)은 바꾸기 전후 계산값 사이를 애니메이션한다. 도중에 다시 바뀌면 그 자리에서 이어 간다
  setMini(tabs, on) {
    if (tabs.classList.contains("lg-mini") === on) return;
    const header = tabs.querySelector(":scope > .workspace-tab-header-container");
    const win = tabs.ownerDocument.defaultView || window;
    const items = [];
    if (header) {
      for (const c of els(header.children)) {
        if (c.classList.contains("lg-drag-band")) continue;
        if (c.classList.contains("lg-slab")) items.push([c, ["height"]]);
        else if (c.classList.contains("lg-path")) {
          const p = c.querySelector(".lg-path-pill");
          if (p) items.push([p, ["height", "translate", "scale", "opacity"]]);
        } else if (c.getClientRects().length) items.push([c, ["opacity", "scale", "translate", "visibility"]]);
      }
    }
    const read = () => items.map(([el, ps]) => {
      const cs = win.getComputedStyle(el);
      const o = {};
      for (const p of ps) o[p] = cs.getPropertyValue(p);
      return o;
    });
    const from = read();
    const shown = items.map(([el]) => el.getClientRects().length > 0);
    const path = header && header.querySelector(":scope > .lg-path");
    if (path && on) {
      const pathShown = path.getClientRects().length > 0;
      const cx = pathShown ? path.offsetLeft + path.offsetWidth / 2 : header.clientWidth / 2;
      const cy = parseFloat(win.getComputedStyle(tabs).getPropertyValue("--lg-mini-h")) / 2 || 19;
      for (const [el, ps] of items) {
        if (!ps.includes("visibility")) continue;
        el.style.setProperty("--lg-mini-tx", `${Math.round((cx - el.offsetLeft - el.offsetWidth / 2) * MINI_PULL)}px`);
        el.style.setProperty("--lg-mini-ty", `${Math.round((cy - el.offsetTop - el.offsetHeight / 2) * MINI_PULL)}px`);
      }
    }
    for (const [el] of items) for (const a of el.getAnimations()) if (a.lgMini) a.cancel();
    const noTr = items.map(([el]) => el);
    const pathText = header && header.querySelector(".lg-path-text");
    if (pathText) noTr.push(pathText);
    for (const el of noTr) el.classList.add("lg-no-tr");
    tabs.classList.toggle("lg-mini", on);
    const to = read();
    for (const el of noTr) el.classList.remove("lg-no-tr");
    const webLeaf = this.activeLeafOf(tabs);
    if (webLeaf && isWebView(webLeaf.view) && this.settings.webTint) this.webInject(webLeaf.view, false, MINI_MS);
    items.forEach(([el], i) => {
      if (!el.getClientRects().length) return;
      if (!shown[i]) from[i] = { ...to[i], opacity: "0", scale: "0.7" };
      if (JSON.stringify(from[i]) === JSON.stringify(to[i])) return;
      const a = el.animate([from[i], to[i]], { duration: MINI_MS, easing: MINI_EASE });
      a.lgMini = true;
    });
  },
  // 경로 줄: 지금 탭 문서의 상위 폴더들(누르면 파일 탐색기에서 보여 줌) / 파일 이름
  updatePath(tabsEl, view) {
    const el = tabsEl.querySelector(":scope > .workspace-tab-header-container > .lg-path .lg-path-text");
    if (!el) return;
    const file = view && view.file;
    const web = isWebView(view) && this.pathShown(tabsEl) ? this.webParts(view) : null;
    const key = web ? "web:" : file ? file.path : "";
    if (el.lgView === view && el.dataset.path === key) return;
    el.lgView = view;
    el.dataset.path = key;
    this.returnTitle(el);
    el.empty();
    const pill = el.parentElement;
    if (pill) pill.classList.toggle("lg-path-web", !!web);
    if (web) {
      el.lgMoved = [];
      const menu = pill && pill.querySelector(":scope > .lg-path-menu");
      for (const [node, holder, before] of [
        [web.addr, el, null],
        [web.reload, pill, menu]
      ]) {
        if (!node || !node.parentElement || !holder) continue;
        el.lgMoved.push({ node, parent: node.parentElement, next: node.nextSibling, holder });
        holder.insertBefore(node, before);
      }
      this.webUrlLabel(el, view, web.addr);
      return;
    }
    if (!file) return;
    el.lgMoved = [];
    for (const node of [view.titleParentEl, view.titleEl]) {
      if (!node || !node.parentElement) continue;
      el.lgMoved.push({ node, parent: node.parentElement, next: node.nextSibling, holder: el });
      el.appendChild(node);
    }
    if (view.titleEl && view.titleEl.parentElement === el) view.titleEl.classList.add("lg-path-file");
    const box = view.titleContainerEl;
    if (box && view.titleParentEl) {
      if (!this.titleWatched) this.titleWatched = /* @__PURE__ */ new WeakSet();
      if (!this.titleWatched.has(box)) {
        this.titleWatched.add(box);
        const win = box.ownerDocument.defaultView || window;
        const obs = new win.MutationObserver(() => {
          const holder = view.titleEl && view.titleEl.parentElement;
          const p = view.titleParentEl;
          if (!holder || !holder.classList.contains("lg-path-text") || holder.lgView !== view) return;
          if (p && p.parentElement === box) holder.insertBefore(p, view.titleEl);
        });
        obs.observe(box, { childList: true });
        this.observers.push(obs);
      }
    }
  },
  // 옮겨 온 원래 요소를 제자리(문서 보기의 제목 줄)로 돌려보낸다. 넣을 때와 반대 순서로 돌려 순서가 그대로다
  returnTitle(el) {
    if (el.lgWebUrl) {
      el.lgWebUrl.off();
      el.lgWebUrl.label.remove();
      el.lgWebUrl = null;
    }
    const moved = el.lgMoved || [];
    el.lgMoved = null;
    for (const { node, parent, next, holder } of moved.reverse()) {
      node.classList.remove("lg-path-file");
      if (node.parentElement !== (holder || el)) continue;
      parent.insertBefore(node, next && next.parentElement === parent ? next : null);
    }
  },
  // 경로 알약이 첫 줄에 보이는지 (경로 표시를 켰거나 탭 쌓기 모드, 휴대폰 제외)
  pathShown(tabsEl) {
    return !import_obsidian12.Platform.isPhone && (tabsEl.classList.contains("mod-stacked") || !!this.settings.showPath);
  },
  // 원래 버튼의 상태를 새 버튼에 옮긴다
  syncTabBar(tabsEl, nav, mode) {
    const leaf = this.activeLeafOf(tabsEl);
    const view = leaf && leaf.view;
    const isWeb = isWebView(view) && !import_obsidian12.Platform.isPhone;
    if (isWeb && view.headerEl && view.headerEl.classList.contains("view-header-always-show")) {
      view.headerEl.classList.remove("view-header-always-show");
      view.headerEl.classList.add("lg-web-head");
    }
    if (isWeb) this.webNavWire(view);
    const hist = leaf && leaf.history;
    const back = nav.querySelector(".lg-tab-back");
    const fwd = nav.querySelector(".lg-tab-forward");
    const canBack = !!hist && hist.backHistory.length > 0;
    const canFwd = !!hist && hist.forwardHistory.length > 0;
    back.toggleClass("is-disabled", !canBack);
    fwd.toggleClass("is-disabled", !canFwd);
    const state = () => `${nav.hasClass("lg-nav-empty")}${fwd.hasClass("lg-nav-hide")}${mode.hasClass("lg-mode-off")}`;
    const was = state();
    back.toggleClass("lg-nav-hide", !canBack && !canFwd);
    fwd.toggleClass("lg-nav-hide", !canFwd);
    nav.toggleClass("lg-nav-empty", !canBack && !canFwd);
    this.webTab(tabsEl, leaf, false);
    this.updatePath(tabsEl, view);
    this.webTab(tabsEl, leaf, true);
    if (isWeb && !import_obsidian12.Platform.isPhone) this.webMouseWire(view);
    const slab = tabsEl.querySelector(":scope > .workspace-tab-header-container > .lg-slab");
    const switched = !!slab && tabsEl.lgSlabView !== view;
    tabsEl.lgSlabView = view;
    if (switched) slab.classList.add("lg-no-tr");
    if (isWeb && this.settings.webTint) {
      this.webWire(view);
      this.webInject(view, false);
      this.webTint(view);
    } else if (tabsEl.classList.contains("lg-web-tinted")) {
      tabsEl.classList.remove("lg-web-tinted");
      const h = tabsEl.querySelector(":scope > .workspace-tab-header-container");
      if (h) {
        h.classList.remove("lg-glass-mix");
        h.style.removeProperty("--lg-glass-t");
      }
    }
    if (switched) {
      void slab.offsetWidth;
      slab.classList.remove("lg-no-tr");
    }
    const isMd = view instanceof import_obsidian12.MarkdownView;
    mode.classList.remove(HIDDEN);
    mode.classList.toggle("lg-mode-off", !isMd && !isWeb);
    this.balanceTabs(tabsEl);
    if (was !== state()) {
      const win = nav.ownerDocument.defaultView || window;
      const t0 = win.performance.now();
      const step = () => {
        this.balanceTabs(tabsEl);
        if (win.performance.now() - t0 < 280) win.requestAnimationFrame(step);
      };
      win.requestAnimationFrame(step);
    }
    mode.classList.toggle("is-active", isWeb && view.mode === "reader");
    if (isMd || isWeb) {
      const reading = isMd ? view.getMode() === "preview" : view.mode === "reader";
      const icon = isWeb ? "glasses" : reading ? "edit-3" : "book-open";
      const key = `${icon}:${reading}`;
      if (mode.dataset.icon !== key) {
        (0, import_obsidian12.setIcon)(mode, icon);
        mode.dataset.icon = key;
        if (isWeb) (0, import_obsidian12.setTooltip)(mode, reading ? tr("\uC6F9 \uD398\uC774\uC9C0\uB85C \uBCF4\uAE30", "Show web page") : tr("\uC77D\uAE30 \uBAA8\uB4DC", "Reader view"));
        else (0, import_obsidian12.setTooltip)(mode, reading ? tr("\uD3B8\uC9D1 \uBAA8\uB4DC\uB85C \uC804\uD658", "Switch to editing view") : tr("\uC77D\uAE30 \uBAA8\uB4DC\uB85C \uC804\uD658", "Switch to reading view"));
      }
    }
  }
};

// src/web.ts
var import_obsidian13 = require("obsidian");
var webMethods = {
  // 웹 뷰어 탭 줄 축소 (사용자 요청): 보이는 웹 탭의 페이지 스크롤 위치를 물어 편집창과 같은 판단(miniFeed)에 넣는다.
  // 같은 질문으로 마우스 옆 버튼 요청(WEB_MOUSE_SCRIPT)도 받는다.
  // 앞 질문이 끝나기 전엔 다시 묻지 않는다. 여백을 다시 맞춘 직후(lgMiniSkip)는 그 때문에 옮긴 스크롤을 기준으로만 삼는다
  webMiniTick() {
    if (this.unloaded || document.hidden) return;
    this.app.workspace.getLeavesOfType("webviewer").forEach((leaf) => {
      const view = leaf.view;
      const wv = view && view.webview;
      const tabs = leaf.parent && leaf.parent.containerEl;
      if (!tabs || !tabs.closest(".mod-root") || tabs.classList.contains("mod-stacked") || this.activeLeafOf(tabs) !== leaf) return;
      const pathText = tabs.querySelector(":scope > .workspace-tab-header-container > .lg-path .lg-path-text");
      if (pathText && pathText.lgWebUrl) pathText.lgWebUrl.set();
      if (view.mode !== "webview" || !wv || !view.webviewMounted || !wv.isConnected || view.lgMiniBusy) return;
      view.lgMiniBusy = true;
      try {
        wv.executeJavaScript(WEB_SCROLL_SCRIPT).then(
          (res) => {
            view.lgMiniBusy = false;
            if (this.unloaded || !Array.isArray(res)) return;
            const [y, nav] = res;
            if (nav === "back" || nav === "forward") this.goHistory(tabs, nav);
            if (typeof y !== "number" || !this.settings.miniBar) return;
            if (view.lgMiniSkip) {
              view.lgMiniSkip = false;
              view.lgMiniY = y;
              return;
            }
            this.miniFeed(tabs, view, y);
          },
          () => {
            view.lgMiniBusy = false;
          }
        );
      } catch {
        view.lgMiniBusy = false;
      }
    });
  },
  // 경로 알약의 웹 주소 표시 (사용자 요청): 주소칸을 고치지 않을 때는 도메인만 보인다(전체 주소는 누를 때만).
  // 주소칸(Obsidian 원래 입력칸) 값은 건드리지 않고 그 위에 덮어 보인다(테마: 그동안 입력칸 글자는 투명). 페이지를 옮기면 다시 쓴다
  webUrlLabel(el, view, addr) {
    const label = addr.createSpan({ cls: ["lg-web-url", INJECTED] });
    const set = () => {
      const url = view && view.url || "";
      let h = "";
      try {
        const u = new URL(url);
        if (/^https?:$/.test(u.protocol)) h = u.hostname;
      } catch {
      }
      if (label.textContent !== (h || url)) label.setText(h || url);
    };
    set();
    const watch = this.watchWebview(view, ["did-navigate", "did-navigate-in-page"], () => window.setTimeout(set, 0));
    const input = addr.querySelector("input");
    const pill = el.parentElement;
    const typing = () => pill && pill.classList.toggle("lg-web-typing", !!input && input.ownerDocument.activeElement === input);
    if (input) {
      input.addEventListener("focus", typing);
      input.addEventListener("blur", typing);
    }
    typing();
    el.lgWebUrl = {
      label,
      set,
      off: () => {
        watch();
        if (input) {
          input.removeEventListener("focus", typing);
          input.removeEventListener("blur", typing);
        }
        if (pill) pill.classList.remove("lg-web-typing");
      }
    };
  },
  // 웹 화면(<webview>)의 페이지 이동 알림을 단다. 새 탭(빈 화면)에서 처음 주소를 열면 Obsidian 이 웹 화면 요소(view.webview)를
  // 새로 만들어, 처음 단 알림이 끊겨 주소 표시가 about:blank 로 남았다 (사용자 지적, 맥 러너 확인). 보기 안에서 웹 화면이 바뀌면
  // 새 요소에 다시 달고 한 번 부른다. 반환값은 떼기
  watchWebview(view, evs, cb) {
    let wv = null;
    const bind = () => {
      const cur = view && view.webview || null;
      if (cur === wv) return;
      if (wv) for (const ev of evs) wv.removeEventListener(ev, cb);
      wv = cur;
      if (wv) for (const ev of evs) wv.addEventListener(ev, cb);
      cb();
    };
    bind();
    const host = view && view.containerEl;
    const mo = host ? new MutationObserver(bind) : null;
    if (mo && host) mo.observe(host, { childList: true, subtree: true });
    return () => {
      if (mo) mo.disconnect();
      if (wv) for (const ev of evs) wv.removeEventListener(ev, cb);
      wv = null;
    };
  },
  // 웹 뷰어의 주소칸과 새로고침 버튼 묶음 (Obsidian 원래 요소)
  webParts(view) {
    const input = view.addressBar && view.addressBar.addrInputEl;
    const addr = input && input.parentElement;
    const reload = view.reloadButtonEl && view.reloadButtonEl.parentElement;
    if (!addr) return null;
    if (!this.addrWired) this.addrWired = /* @__PURE__ */ new WeakSet();
    if (!this.addrWired.has(addr)) {
      this.addrWired.add(addr);
      for (const type of ["mousedown", "pointerdown"]) this.registerDomEvent(addr, type, (e) => e.stopPropagation());
    }
    return { addr, reload };
  },
  // 경로 표시를 껐을 때: 지금 탭 알약의 이름 자리에 웹 페이지 도메인을, ≡ 왼쪽에 새로고침을 둔다 (사용자 요청).
  // 도메인을 누르면 탭 알약이 커지며 탭 줄 가운데로 가 주소칸이 된다(openWebCard, 사파리처럼 다른 탭을 밀지 않는다).
  // place 가 false 면 옮겨 둔 것을 되돌리기만 한다
  webTab(tabsEl, leaf, place) {
    const view = leaf && leaf.view;
    const want = isWebView(view) && !this.pathShown(tabsEl) && leaf.tabHeaderEl ? leaf : null;
    const cur = tabsEl.lgWebTab;
    if (cur && cur.leaf === want && cur.view === view) {
      const host = webHost(view);
      if (cur.hostEl.textContent !== host) cur.hostEl.setText(host);
      if (cur.pathHostEl && cur.pathHostEl.textContent !== host) cur.pathHostEl.setText(host);
      return;
    }
    if (cur) {
      for (const { node, parent, next, holder } of cur.moved.reverse()) {
        if (node.parentElement !== holder) continue;
        parent.insertBefore(node, next && next.parentElement === parent ? next : null);
      }
      cur.hostEl.remove();
      if (cur.pathHostEl) cur.pathHostEl.remove();
      if (cur.off) cur.off();
      if (cur.leaf.tabHeaderEl) cur.leaf.tabHeaderEl.classList.remove("lg-web-tab");
      tabsEl.lgWebTab = null;
    }
    if (!want || !place) return;
    const parts = this.webParts(view);
    const inner = leaf.tabHeaderEl.querySelector(":scope > .workspace-tab-header-inner");
    if (!parts || !inner) return;
    this.setupTabMenu(leaf);
    const title = inner.querySelector(":scope > .workspace-tab-header-inner-title");
    const menu = inner.querySelector(":scope > .lg-tab-menu");
    const hostEl = createDiv({ cls: ["lg-web-host", INJECTED], text: webHost(view) });
    (0, import_obsidian13.setTooltip)(hostEl, tr("\uC8FC\uC18C \uACE0\uCE58\uAE30", "Edit address"));
    for (const type of ["mousedown", "pointerdown"]) hostEl.addEventListener(type, (e) => e.stopPropagation());
    hostEl.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.openWebCard(leaf);
    });
    inner.insertBefore(hostEl, title ? title.nextSibling : null);
    const moved = [];
    if (parts.reload && parts.reload.parentElement) {
      moved.push({ node: parts.reload, parent: parts.reload.parentElement, next: parts.reload.nextSibling, holder: inner });
      inner.insertBefore(parts.reload, menu);
    }
    leaf.tabHeaderEl.classList.add("lg-web-tab");
    const pathText = tabsEl.querySelector(":scope > .workspace-tab-header-container > .lg-path .lg-path-text");
    const pathHostEl = pathText ? pathText.createSpan({ cls: ["lg-path-host", INJECTED], text: webHost(view) }) : null;
    const off = this.watchWebview(view, ["did-navigate", "did-navigate-in-page", "did-stop-loading"], () => window.setTimeout(() => {
      if (hostEl.isConnected) hostEl.setText(webHost(view));
      if (pathHostEl && pathHostEl.isConnected) pathHostEl.setText(webHost(view));
    }, 60));
    tabsEl.lgWebTab = { leaf, view, moved, hostEl, pathHostEl, off };
  },
  // 주소 고치기 (사용자 요청, iPadOS 사파리 영상): 지금 탭 알약이 그대로 커지며 탭 줄 가운데로 옮겨 가 주소칸이 된다.
  // 다른 탭은 밀지 않는다. 진짜 탭을 배치에서 빼면 탭 줄이 흔들리므로, 고치는 동안 탭은 숨기고(자리는 그대로)
  // 탭과 같은 유리 알약(.lg-web-card)이 탭 자리에서 폭·위치를 바꿔 가운데로 간다 (늘이기 대신 실제 크기를 바꿔 찌그러지지 않는다).
  // 알약에는 Obsidian 원래 주소칸을 옮겨 와 전체 주소를 고른 채로 고치고, 제안 목록은 알약 유리가 아래로 늘어난 자리에 붙는다
  // (attachWebSuggest). 주소칸에서 포커스가 빠지면(Enter 로 이동, Esc, 바깥 누름) 탭 자리로 돌아가 다시 탭이 된다
  openWebCard(leaf) {
    const view = leaf && leaf.view;
    const tab = leaf && leaf.tabHeaderEl;
    const parts = isWebView(view) ? this.webParts(view) : null;
    const input = view && view.addressBar && view.addressBar.addrInputEl;
    if (!parts || !tab || !input) return;
    if (this.webCard) this.closeWebCard(true);
    const doc = tab.ownerDocument;
    const win = doc.defaultView || window;
    const header = tab.closest(".workspace-tab-header-container") || tab;
    const track = header.querySelector(":scope > .workspace-tab-header-container-inner") || header;
    const cs = win.getComputedStyle(header);
    const H = parseFloat(cs.getPropertyValue("--lg-pill-h")) || 34;
    const tabW = parseFloat(cs.getPropertyValue("--lg-tab-w")) || 320;
    const t = tab.getBoundingClientRect();
    const hr = header.getBoundingClientRect();
    const kr = track.getBoundingClientRect();
    const W = Math.max(t.width, Math.min(tabW * WEB_CARD_K, hr.width - 16));
    const left = Math.max(hr.left + 8, Math.min(kr.left + kr.width / 2 - W / 2, hr.right - 8 - W));
    const top = t.top + t.height / 2 - H / 2;
    const card = doc.body.createDiv({ cls: ["lg-web-card", INJECTED] });
    this.webPopTint(card, tab);
    card.setCssProps({ "--lg-cx": `${left}px`, "--lg-cy": `${top}px`, "--lg-cw": `${W}px`, "--lg-ch": `${H}px` });
    const rec = { card, leaf, view, tab, addr: parts.addr, parent: parts.addr.parentElement, next: parts.addr.nextSibling };
    card.appendChild(parts.addr);
    tab.classList.add("lg-web-editing");
    this.webCard = rec;
    const box = (r) => ({ left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px` });
    card.animate([box(t), box({ left, top, width: W, height: H })], { duration: 300, easing: EASE.settle });
    parts.addr.animate([{ opacity: 0 }, { opacity: 0, offset: 0.25 }, { opacity: 1 }], { duration: 300, easing: "ease-out" });
    const onBlur = () => win.setTimeout(() => {
      if (this.webCard === rec && doc.activeElement !== input) this.closeWebCard(false);
    }, 0);
    input.addEventListener("blur", onBlur);
    rec.off = () => input.removeEventListener("blur", onBlur);
    input.focus();
  },
  closeWebCard(instant) {
    const rec = this.webCard;
    if (!rec) return;
    this.webCard = null;
    if (rec.off) rec.off();
    let ended = false;
    let fade = null;
    const finish = () => {
      if (ended) return;
      ended = true;
      if (fade) fade.cancel();
      if (rec.addr.parentElement === rec.card) rec.parent.insertBefore(rec.addr, rec.next && rec.next.parentElement === rec.parent ? rec.next : null);
      rec.card.remove();
      rec.tab.classList.remove("lg-web-editing");
    };
    const tab = rec.tab;
    if (instant || !tab.isConnected || !tab.getClientRects().length) return finish();
    const c = rec.card.getBoundingClientRect();
    const t = tab.getBoundingClientRect();
    const box = (r) => ({ left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px` });
    const anim = rec.card.animate([box(c), box(t)], { duration: 260, easing: EASE.settle, fill: "forwards" });
    fade = rec.addr.animate([{ opacity: 1 }, { opacity: 0, offset: 0.4 }, { opacity: 0 }], { duration: 260, fill: "forwards" });
    anim.onfinish = anim.oncancel = finish;
    window.setTimeout(finish, 450);
  },
  // 커서가 빠진 웹 주소칸 아래에 뜬 제안 목록은 닫는다 (사용자 지적). 한글은 마지막 글자를 조합하는 중에 엔터로 이동하면
  // 주소칸에서 커서가 빠진 뒤 조합이 끝나며 입력이 한 번 더 와(추정) Obsidian 이 제안 목록을 다시 띄웠고, 커서가 없어 닫히지 않았다.
  // 그 주소칸에 커서가 빠졌다고(blur) 알려 Obsidian 이 스스로 닫게 한다
  dropStrayWebSuggest(pop, doc) {
    const win = doc.defaultView || window;
    win.requestAnimationFrame(() => {
      if (this.unloaded || !pop.isConnected) return;
      const pr = pop.getBoundingClientRect();
      for (const inp of doc.querySelectorAll(".webviewer-address > input")) {
        if (doc.activeElement === inp) continue;
        const ir = inp.getBoundingClientRect();
        if (ir.width && Math.abs(pr.top - ir.bottom) < 24 && pr.left < ir.right && pr.right > ir.left) inp.dispatchEvent(new win.FocusEvent("blur"));
      }
    });
  },
  // 웹 뷰어 주소 제안 목록: 주소 카드나 경로 알약의 유리가 제안 높이만큼 아래로 늘어나고, 목록은 배경 없이 그 자리에 놓인다
  // (검색 탭 제안과 같은 방식). 한 덩어리로 보이게 폭도 맞춘다
  attachWebSuggest(pop, doc) {
    const input = doc.activeElement;
    const host = input && input.closest && input.closest(".lg-web-card, .lg-path-pill.lg-path-web");
    if (!host) {
      this.dropStrayWebSuggest(pop, doc);
      return false;
    }
    const win = doc.defaultView || window;
    pop.classList.add("lg-sugg-in", "lg-web-sugg");
    this.webPopTint(pop, host);
    host.classList.add("lg-sugg-host");
    const card = host.classList.contains("lg-web-card");
    const place = () => {
      if (!pop.isConnected) return;
      let x, y, w, h;
      if (card) {
        const st = host.style;
        x = parseFloat(st.getPropertyValue("--lg-cx"));
        y = parseFloat(st.getPropertyValue("--lg-cy"));
        w = parseFloat(st.getPropertyValue("--lg-cw"));
        h = parseFloat(st.getPropertyValue("--lg-ch"));
      } else {
        const hr = host.getBoundingClientRect();
        w = host.offsetWidth;
        h = host.offsetHeight;
        x = hr.left + hr.width / 2 - w / 2;
        y = hr.top + hr.height / 2 - h / 2;
      }
      placeSugg(pop, x, y + h, w);
      host.setCssProps({ "--lg-sugg-h": `${pop.offsetHeight}px` });
    };
    const ro = new win.ResizeObserver(place);
    ro.observe(pop);
    ro.observe(host);
    const moved = new win.MutationObserver(place);
    moved.observe(pop, { attributes: true, attributeFilter: ["style"] });
    place();
    const done = new win.MutationObserver(() => {
      if (pop.isConnected) return;
      done.disconnect();
      ro.disconnect();
      moved.disconnect();
      host.style.removeProperty("--lg-sugg-h");
      host.classList.remove("lg-sugg-host");
      this.releasePop(pop);
    });
    done.observe(doc.body, { childList: true });
    return true;
  },
  // ---------- 웹 페이지가 탭 줄 뒤로 지나가게 + 대표 색 (사용자 요청, 사파리처럼) ----------
  // 웹 화면을 편집창 맨 위까지 늘리고(테마), 페이지 안에 탭 줄 높이만큼 위 여백을 넣어 맨 위에서는 내용이 탭 줄 아래에서 시작한다.
  // 화면 위에 붙는 고정·스티키 헤더는 그만큼 내린다 (Obsidian 웹 뷰어에는 사파리의 콘텐츠 여백 기능이 없어 페이지 안에서 한다).
  // 페이지 배경색(html, 없으면 body)을 읽어 탭 줄 유리판을 그 색으로 칠한다. 페이지 스크립트가 바뀔 때마다 알린다
  webWire(view) {
    const wv = view.webview;
    if (!this.wvWired) this.wvWired = /* @__PURE__ */ new WeakSet();
    if (!wv || this.wvWired.has(wv)) return;
    this.wvWired.add(wv);
    this.registerDomEvent(wv, "dom-ready", () => {
      view.lgInjectTries = 0;
      this.webInject(view, true);
    });
    this.registerDomEvent(wv, "did-navigate", () => this.webEarly(view));
    this.registerDomEvent(wv, "did-stop-loading", () => this.webReadTint(view));
    this.registerDomEvent(wv, "did-navigate-in-page", () => this.webReadTint(view));
    if (view.webviewMounted) this.webInject(view, true);
    if (!this.webTintPoll) {
      this.webTintPoll = window.setInterval(() => {
        if (this.unloaded || !this.settings.webTint) return;
        this.app.workspace.getLeavesOfType("webviewer").forEach((leaf) => {
          const tabs = leaf.parent && leaf.parent.containerEl;
          if (tabs && this.activeLeafOf(tabs) === leaf) this.webReadTint(leaf.view);
        });
      }, WEB_TINT_POLL_MS);
      this.registerInterval(this.webTintPoll);
    }
  },
  // 웹 뷰어 마우스 옆 버튼 (WEB_MOUSE_SCRIPT): 페이지가 준비될 때마다 넣는다. 몰입형 웹 보기와 상관없이
  webMouseWire(view) {
    const wv = view && view.webview;
    if (!this.wvMouse) this.wvMouse = /* @__PURE__ */ new WeakSet();
    if (!wv || this.wvMouse.has(wv)) return;
    this.wvMouse.add(wv);
    const put = () => {
      try {
        wv.executeJavaScript(WEB_MOUSE_SCRIPT).catch(() => {
        });
      } catch {
      }
    };
    this.registerDomEvent(wv, "dom-ready", put);
    if (view.webviewMounted) put();
  },
  // 페이지 배경색을 물어 받아 탭 줄을 칠한다. 앞 질문이 끝나기 전엔 다시 묻지 않는다
  webReadTint(view) {
    const wv = view && view.webview;
    if (!wv || !view.webviewMounted || !wv.isConnected || view.lgTintBusy) return;
    if (typeof wv.isLoading === "function" && wv.isLoading()) return;
    view.lgTintBusy = true;
    const done = (c) => {
      view.lgTintBusy = false;
      if (this.unloaded) return;
      const v = typeof c === "string" && CSS.supports("color", c) ? c : null;
      if (v === view.lgTint) return;
      view.lgTint = v;
      this.webTint(view);
    };
    try {
      wv.executeJavaScript(WEB_COLOR_SCRIPT).then(done, () => {
        view.lgTintBusy = false;
      });
    } catch {
      view.lgTintBusy = false;
    }
  },
  // 열린 웹 페이지를 모두 새로고침한다: 경로 표시를 켜고 끄면 탭 줄 높이가 바뀌어 페이지 안 위 여백·내린 헤더가 어긋나서
  // 새로 불러와 처음부터 다시 맞춘다 (사용자 요청). 탭 줄이 새 높이로 그려진 뒤에 한다
  reloadWebViews() {
    window.setTimeout(() => {
      this.app.workspace.getLeavesOfType("webviewer").forEach((leaf) => {
        const view = leaf.view;
        const wv = view && view.webview;
        if (!wv || !view.webviewMounted || !wv.isConnected) return;
        try {
          wv.reload();
        } catch {
        }
      });
    }, 300);
  },
  // 웹 페이지를 옮기면 탭 줄을 다시 맞춘다: 웹 뷰어는 페이지 이동을 탭 방문 기록에 넣지만 Obsidian 이 따로 알리지 않아,
  // 새 탭에서 페이지를 옮겨도 뒤로·앞으로 버튼이 다른 탭에 갔다 올 때까지 나오지 않았다 (사용자 지적)
  webNavWire(view) {
    const wv = view.webview;
    if (!this.wvNavWired) this.wvNavWired = /* @__PURE__ */ new WeakSet();
    if (!wv || this.wvNavWired.has(wv)) return;
    this.wvNavWired.add(wv);
    const upd = () => window.setTimeout(() => this.requestRefresh(), 60);
    this.registerDomEvent(wv, "did-navigate", upd);
    this.registerDomEvent(wv, "did-navigate-in-page", upd);
    this.registerDomEvent(wv, "did-stop-loading", upd);
  },
  // 페이지에 위 여백(탭 줄 아래 끝까지의 높이)을 알린다. 높이가 바뀌었을 때(경로 표시 켜고 끄기 등)만 다시 보낸다
  // anim: 페이지 고정 요소가 새 자리로 움직이는 시간(ms, 탭 줄 축소 때 띠와 같이)
  // 새 문서가 막 열렸을 때 페이지 스크립트를 넣는다. webview.executeJavaScript 는 페이지를 다 불러올 때까지 기다려 첫 화면보다 늦어,
  // 공개 API 인 웹 화면 주 프레임(webContents.mainFrame.executeJavaScript)으로 바로 넣는다. 못 쓰는 환경이면 dom-ready 때 넣는 것만 남는다
  webEarly(view) {
    const wv = view.webview;
    const tabs = view.leaf && view.leaf.parent && view.leaf.parent.containerEl;
    if (tabs && tabs.classList.contains("lg-mini") && this.activeLeafOf(tabs) === view.leaf) {
      view.lgMiniY = 0;
      this.setMini(tabs, false);
    }
    const inset = view.lgInset;
    if (!wv || !inset || !view.webviewMounted || !wv.isConnected) return;
    try {
      const remote = window.require ? window.require("electron").remote : void 0;
      const wc = remote && typeof wv.getWebContentsId === "function" && remote.webContents.fromId(wv.getWebContentsId());
      const frame = wc && wc.mainFrame;
      if (!frame) return;
      frame.executeJavaScript(WEB_PAGE_SCRIPT.replace("__LG_INSET__", String(inset)).replace("__LG_ANIM__", "0").replace("__LG_SENT__", String(Date.now()))).catch(() => {
      });
    } catch {
    }
  },
  webInject(view, force, anim = 0) {
    const wv = view.webview;
    const tabs = view.leaf && view.leaf.parent && view.leaf.parent.containerEl;
    const header = tabs && tabs.querySelector(":scope > .workspace-tab-header-container");
    if (!wv || !header || !view.webviewMounted || !wv.isConnected) return;
    const wr = wv.getBoundingClientRect();
    window.clearTimeout(view.lgInjectTimer);
    if (!wr.height) {
      const tries = (view.lgInjectTries || 0) + 1;
      view.lgInjectTries = tries;
      if (tries <= 40) view.lgInjectTimer = window.setTimeout(() => this.webInject(view, true), 150);
      return;
    }
    view.lgInjectTries = 0;
    const band = header.querySelector(".lg-slab") || header;
    const inset = Math.max(0, Math.round(band.getBoundingClientRect().bottom - wr.top));
    if (!force && view.lgInset === inset) return;
    if (view.lgInset != null && view.lgInset !== inset) view.lgMiniSkip = true;
    view.lgInset = inset;
    try {
      wv.executeJavaScript(WEB_PAGE_SCRIPT.replace("__LG_INSET__", String(inset)).replace("__LG_ANIM__", String(anim)).replace("__LG_SENT__", String(Date.now()))).then(() => this.webReadTint(view), () => {
      });
    } catch (err) {
      console.error("[glass-shelf] web inset", err);
    }
  },
  // 탭 줄 유리판 색: 이 탭 묶음에서 지금 보이는 탭이 이 웹 뷰어일 때만
  webTint(view) {
    const leaf = view.leaf;
    const tabs = leaf && leaf.parent && leaf.parent.containerEl;
    if (!tabs || this.activeLeafOf(tabs) !== leaf) return;
    const dark = tabs.ownerDocument.body.classList.contains("theme-dark");
    const tint = view.mode === "webview" ? view.lgTint : null;
    const L0 = tint && dark ? colorLightness(tint, tabs.ownerDocument) : null;
    const k = L0 == null ? 0 : WEB_DARK_DIM * Math.min(1, Math.max(0, (L0 - WEB_DARK_DIM_FROM) / (1 - WEB_DARK_DIM_FROM)));
    const c = k > 0 ? colorDim(tint, k, tabs.ownerDocument) : tint;
    if (c) tabs.setCssProps({ "--lg-web-tint": c });
    tabs.classList.toggle("lg-web-tinted", !!c);
    const header = tabs.querySelector(":scope > .workspace-tab-header-container");
    const L = c ? colorLightness(c, tabs.ownerDocument) : null;
    if (header) {
      header.classList.toggle("lg-glass-mix", L != null);
      if (L != null) header.setCssProps({ "--lg-glass-t": String(Math.round(Math.min(1, Math.max(0, (GLASS_MIX_HI - L) / (GLASS_MIX_HI - GLASS_MIX_LO))) * 1e3) / 1e3) });
      else header.style.removeProperty("--lg-glass-t");
    }
  },
  // 색을 칠한 웹 탭 줄에서 연 메뉴·주소 카드·주소 제안도 같은 색 유리로 (사용자 요청). from 이 그 탭 줄이나 이미 칠한 팝업 안에 있으면
  // 탭 줄의 색(--lg-web-tint)과 유리 섞기 비율(--lg-glass-t)을 el 에 옮긴다. 팝업은 body 에 붙어 탭 줄 변수를 물려받지 못한다
  webPopTint(el, from) {
    if (!isEl(from)) return;
    let tint = "", t = "";
    const pop = from.closest(".lg-web-pop");
    if (pop) {
      tint = pop.style.getPropertyValue("--lg-web-tint");
      t = pop.style.getPropertyValue("--lg-glass-t");
    } else {
      const tabs = from.closest(".mod-root .workspace-tabs.lg-web-tinted");
      if (!tabs) return;
      const header = tabs.querySelector(":scope > .workspace-tab-header-container");
      tint = tabs.style.getPropertyValue("--lg-web-tint");
      t = header ? header.style.getPropertyValue("--lg-glass-t") : "";
    }
    if (!tint) return;
    el.classList.add("lg-web-pop", "lg-glass-mix");
    el.setCssProps({ "--lg-web-tint": tint, "--lg-glass-t": t || "0" });
  },
  // 설정을 켜고 끌 때: 끄면 페이지 여백·탭 줄 색을 되돌리고, 켜면 다음 갱신 때 다시 넣는다
  webReset(on) {
    if (!on) this.webUninject();
    this.app.workspace.iterateAllLeaves((leaf) => {
      if (isWebView(leaf.view)) leaf.view.lgInset = null;
    });
    for (const doc of this.docs) {
      if (!doc.body) continue;
      doc.querySelectorAll(".lg-web-tinted").forEach((el) => el.classList.remove("lg-web-tinted"));
      doc.querySelectorAll(".mod-root .lg-glass-mix").forEach((el) => {
        el.classList.remove("lg-glass-mix");
        el.style.removeProperty("--lg-glass-t");
      });
    }
  },
  // 끌 때: 페이지에 넣은 여백과 내린 헤더를 되돌린다
  webUninject() {
    this.app.workspace.iterateAllLeaves((leaf) => {
      const wv = isWebView(leaf.view) && leaf.view.webview;
      if (!wv || !leaf.view.webviewMounted) return;
      try {
        wv.executeJavaScript("window.__lgInset = 0; window.__lgGS && window.__lgGS(true);").catch(() => {
        });
      } catch {
      }
    });
  }
};

// src/main.ts
var Base = import_obsidian14.Plugin;
var GlassShelfCompanion = class extends Base {
  // 테마가 켜져 있는 동안의 모든 동작은 자식 Component(this.core) 하나에 묶는다. 테마가 바뀌면(켜짐·꺼짐) 그 자식만 떼고 붙인다.
  // 예전엔 플러그인이 스스로 껐다 켰는데(app.plugins 비공개 API), 그 방식은 심사 지적 대상이고 끌 때마다 옛 인스턴스가 남기는 것이 생겼다 (검토 지적).
  // 동작 코드는 모두 this.register…(registerEvent·registerDomEvent·registerInterval·addSettingTab 도 안에서 register 를 부른다)로 정리를 맡기므로,
  // 자식이 붙어 있는 동안 register 를 자식에게 넘기면 기존 코드를 그대로 두고 자식을 뗄 때 함께 정리된다
  register(cb) {
    if (this.core) this.core.register(cb);
    else super.register(cb);
  }
  async onload() {
    this.unloaded = true;
    this.registerEvent(this.app.workspace.on("css-change", () => this.syncCore()));
    await this.syncCore();
  }
};
Object.assign(GlassShelfCompanion.prototype, coreMethods, eventsMethods, pressMethods, kanbanMethods, menusMethods, morphMethods, foldersMethods, sidebarMethods, tabsMethods, webMethods);
