import { Platform } from "obsidian";
import { INJECTED, SVG_NS } from "./util";

// 굴절을 거는 유리 요소들. [선택자, 휘는 세기(px)]
export const REFRACT_TARGETS: [string, number][] = [
  [".lg-nav-more, .lg-nav-rest > .clickable-icon, .lg-panel-toggle, .lg-tab-mode, .lg-rib-menu", 32],
  [".mod-root .workspace-tab-header-new-tab .clickable-icon, .mod-root .workspace-tab-header-tab-list .clickable-icon", 32],
  [".sidebar-toggle-button .clickable-icon, .workspace-drawer-vault-actions .clickable-icon", 32],
  [".graph-controls.is-close .graph-controls-button", 32],
  [".lg-tab-nav, .lg-nav-run, .lg-path-pill, .side-dock-actions, .workspace-drawer-vault-switcher, .status-bar, .lg-kb-group, .lg-tab-tools", 26],
  [".mod-left-split .workspace-tab-header-container-inner, .mod-right-split .workspace-tab-header-container-inner", 26],
  [".mod-root .workspace-tab-header-container .workspace-tab-header.is-active", 23],
  [".titlebar-button-container.mod-right", 26],
];

// 모바일(휴대폰·태블릿 앱)에서 굴절을 거는 유리 요소들. Obsidian 이 떠 있는 요소에 붙이는 .mod-raised 자리
export const REFRACT_TARGETS_MOBILE: [string, number][] = [
  [".mobile-navbar.mod-raised, .view-header .view-actions.mod-raised, .mobile-toolbar-options-list-container.mod-raised", 26],
  [".workspace-drawer-tab-options-list", 26],
  [".view-header .sidebar-toggle-button.mod-raised, .workspace-drawer-header-icon.mod-raised, .modal-close-button.mod-raised, .modal-header-button.mod-raised", 32],
];

// iOS·iPadOS 앱(WebKit)은 backdrop-filter 안의 url() 필터를 못 쓴다. 넣으면 흐림까지 통째로 무시되므로 굴절을 끈다
// (최신 iPadOS 에서도 안 되는 것을 사용자가 확인)
export const CAN_REFRACT = !Platform.isIosApp;

// 굴절이 일어나는 가장자리 폭 = 반지름 × BEZEL_RATIO, 최대 BEZEL_MAX(px).
// 모바일은 버튼·알약이 커서(44~52px) 데스크톱 상한 14px 에 걸리므로 비율과 상한을 함께 키운다 (사용자 요청)
export const REFRACT_SPREAD = 0.6; // 굴절이 가장자리에서 안쪽으로 퍼지는 정도 (작을수록 안쪽까지 넓게)
// 가운데 평평한 높이가 약 7px 이 되게 (사용자 요청): 데스크톱 0.8(34px, 이전 0.55 = 약 15px), 모바일 0.84(44px, 이전 0.75 = 약 11px)
export const BEZEL_RATIO = Platform.isMobile ? 0.84 : 0.8;
export const BEZEL_MAX = Platform.isMobile ? 24 : 14;
// 호버 유리 굴절: 세기(px), 띠 폭(반지름 비율), 안쪽 퍼짐, 띠 최대 폭(px)
export const HOVER_REFRACT = { strength: 6, bezel: 0.5, spread: REFRACT_SPREAD, bezelMax: BEZEL_MAX };
// 탭 렌즈·토글 렌즈 굴절: 가운데는 평평하게 LENS_MINIFY 배 작게, 테두리 쪽 띠에서만 변해 테두리 끝에서 1 / LENS_MINIFY_EDGE 배 크게 (사용자 요청).
// 평평한 곳은 렌즈 반지름의 LENS_MINIFY_FLAT 까지. 띠는 기울기가 이어지는 곡선이라 이음매가 매끄럽다.
// 띠가 배율에 비해 얇으면(1.3배에서 약 32% 미만) 곡선만으로는 읽는 자리가 되감기므로, bakeLensMap 이 그 구간을 눌러 편다
export const LENS_MINIFY = 1.2;
export const LENS_MINIFY_FLAT = 0.7;
export const LENS_MINIFY_EDGE = 0.5;
// 렌즈 굴절 값 묶음 (bakeLensMap). reach 는 테두리 끝이 읽는 자리: 1 이면 렌즈 끝 자기 자리, 1 보다 작으면 안쪽을 읽는다
// 알약(가로 반지름 rxr × 높이, 세로 반지름 = 높이 절반) 가운데에서의 거리. 테두리 = 1, 같은 비율로 줄인 알약이 등고선
export const pillT = function (px: number, py: number, ax: number, ay: number, rxr: number) {
  const b = ay;
  const rx = Math.min(rxr * 2 * ay, ax);
  const s = b / rx; // 끝 곡선을 반원으로 펴는 가로 배율
  const X = Math.abs(px) * s;
  const C = (ax - rx) * s; // 곧은 변 절반 길이
  const Y = Math.abs(py);
  if (C <= 1e-9) return Math.hypot(px / ax, py / ay);
  const t1 = Y / b; // 곧은 변 구간
  if (X <= C * t1) return t1;
  // 끝 반원 구간: (X - C t)^2 + Y^2 = (b t)^2
  const A = C * C - b * b, B = -2 * X * C, K = X * X + Y * Y;
  if (Math.abs(A) < 1e-9) return K / (2 * X * C);
  const d = Math.sqrt(Math.max(0, B * B - 4 * A * K));
  const r = [(-B - d) / (2 * A), (-B + d) / (2 * A)].filter((v) => v > 0 && X >= C * v - 1e-9).sort((p, q) => p - q);
  return r.length ? r[0] : Math.hypot(px / ax, py / ay);
};
// 렌즈 굴절 값 묶음 (bakeLensMap)
export interface LensShape {
  minify: number;
  flat: number;
  edge: number;
  reach: number;
  shape?: number;
  // line: 렌즈 가운데에서의 비율 대신 가운데 선(양 끝 반원 중심을 잇는 선)에서의 거리로 줄인다.
  // 굴절 띠와 안에 비치는 작아진 알약의 틈이 위아래·좌우 같은 px 가 된다 (가운데 비율 방식은 긴 쪽 틈이 더 넓었다). 가로로는 줄지 않는다
  line?: boolean;
  // box: 읽는 자리를 렌즈 상자 안으로 자른다. 상자 밖을 읽으면 가장자리에서 거울로 뒤집힌 렌즈 자신이 비쳤다
  box?: boolean;
}
// 요소마다 다르게 굽는 굴절 값 (없으면 기본값)
export interface RefractLook {
  bezel?: number;
  spread?: number;
  lens?: LensShape;
}
// 창(document)마다 두는 SVG 필터 모음
interface FilterStore {
  svg: Element;
  defs: Element;
  filters: Map<string, Element>;
}

export const LENS_DEFAULT: LensShape = { minify: LENS_MINIFY, flat: LENS_MINIFY_FLAT, edge: LENS_MINIFY_EDGE, reach: 1, shape: 1 };
// 토글·슬라이더 렌즈는 따로 (렌즈 조율기에서 사용자가 고른 값, 26.10.02)
// 토글: 평평한 곳을 넓힌다. 슬라이더: 가운데는 그대로(1), 바깥 5% 띠에서 테두리 끝이 안쪽(0.5)을 읽는다
// shape: 굴절 띠가 따라가는 모양. 1 = 알약(렌즈 모양 그대로), 2 = 타원, 클수록 둥근 사각형(초타원 지수)
export const LENS_TOGGLE: LensShape = { minify: 1.2, flat: 0.9, edge: 0.1, reach: 0.86, shape: 1 };
// 평평한 영역이 테두리 끝까지(0.95) 가면 읽는 자리가 0.95 → 0.5 로 되접혀, 되접힘 방지로 바깥 절반이 한 자리만 읽는 판판한 띠(사다리꼴 단면)가 됐다.
// 띠를 넓게(0.3) 시작해 테두리에서 완만해지게(edge 0.2) 해 볼록 렌즈처럼 휘게 한다
export const LENS_SLIDER: LensShape = { minify: 1, flat: 0.9, edge: 0.2, reach: 0.55, shape: 1 };
// 굴절 변위 지도 캐시 개수 (Refractor.filterFor)
export const MAP_CACHE = 200;
// 탭 렌즈 굴절은 탭 렌즈 끝 조율기에서 사용자가 고른 값 (26.10.13)
export const LENS_TAB: LensShape = { minify: 1.2, flat: 0.94, edge: 2, reach: 1.1, shape: 1, line: true, box: true };
// 탭 렌즈 안 글자 전용 굴절 (조율기 값, 26.10.13). 렌즈 유리는 탭 줄 알약만 굴절하고, 렌즈 안 글자는 복사본에 이 굴절을 따로 건다
export const LENS_TAB_TEXT: LensShape = { minify: 1, flat: 0.6, edge: 0.2, reach: 0.9, shape: 1 };

// 누를 때 알약이 되는 흰색. 알약 채움(테마 --lg-glass-fill)이 color-mix 라 color(srgb …) 로 계산되는데,
// Chromium 은 옛 rgb() 와 color(srgb …) 사이를 보간할 때 0~255 값을 색 성분에 섞어 노랑·빨강(또는 검정)으로 튄다 (측정 확인).
// 같은 표기(color(srgb …))끼리는 바르게 보간된다
export const PRESS_WHITE = "color(srgb 1 1 1)";

// =========================================================
// 굴절: kube.io 방식.
// 볼록 스퀘어클 곡면의 가장자리(베젤)에서 스넬 법칙으로 빛이 꺾이는 양을 계산해
// 변위맵(R = x, G = y)으로 굽고, SVG feDisplacementMap을 backdrop-filter로 건다.
// 색수차(RGB 채널마다 다르게 휘어 생기는 무지개 번짐)는 필터 비용이 세 배라 모든 곳에서 끈다 (chroma 인자는 남겨 둠)
// =========================================================
export class Refractor {
  declare enabled: boolean;
  // 변위 지도 캐시 (지도 키 → 그림 주소, 렌즈 지도는 세기도)
  declare maps: Map<string, { url: string; scale?: number }>;
  declare resizeObs: ResizeObserver;
  declare stores: Map<Document, FilterStore>;
  declare tracked: Set<HTMLElement>;

  constructor() {
    this.enabled = false;
    // 창(document)마다 SVG 필터 모음이 따로 있어야 url(#id)가 그 창에서 보인다
    this.stores = new Map();
    this.maps = new Map();
    // 크기가 바뀌는 동안(애니메이션·창 크기 조절)은 기존 필터를 두고, 멈춘 뒤 한 번만 새 크기로 굽는다
    this.resizeObs = new ResizeObserver((entries) => {
      for (const e of entries) {
        const el = e.target as HTMLElement;
        if (!el.lgRefract) continue;
        window.clearTimeout(el.lgRfTimer);
        el.lgRfTimer = window.setTimeout(() => el.lgRefract && this.update(el), 150);
      }
    });
    this.tracked = new Set();
  }

  setEnabled(on: boolean) {
    this.enabled = on;
    if (!on) {
      this.tracked.forEach((el: HTMLElement) => {
        el.style.removeProperty("--lg-refract");
        this.resizeObs.unobserve(el);
        delete el.lgRefract;
      });
      this.tracked.clear();
    }
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

  store(doc: Document) {
    let st = this.stores.get(doc);
    if (st && st.svg.isConnected) return st;
    const svg = doc.createElementNS(SVG_NS, "svg");
    svg.setAttribute("class", "lg-svg-defs " + INJECTED);
    svg.setAttribute("color-interpolation-filters", "sRGB");
    const defs = doc.createElementNS(SVG_NS, "defs");
    svg.appendChild(defs);
    doc.body.appendChild(svg);
    st = { svg, defs, filters: new Map() };
    this.stores.set(doc, st);
    return st;
  }

  // strength: 휘는 세기(px), chroma: 색수차 여부, w/h를 주면 그 크기로 고정
  // outward: true면 탭 렌즈·토글 렌즈용 축소 렌즈(가운데는 작게, 테두리로 갈수록 크게, bakeLensMap),
  // false면 가장자리에서 안쪽 내용을 끌어와 가장자리가 부풀어 보인다(bakeMap)
  attach(el: HTMLElement, strength: number, chroma: boolean, w?: number, h?: number, outward?: boolean, look?: RefractLook) {
    if (!this.enabled) return;
    // 이미 같은 설정으로 붙어 있으면 다시 재지 않는다. refresh()가 파일을 바꿀 때마다 불러
    // 매번 offsetWidth 를 읽으면 강제 레이아웃이 생긴다. 크기 변화는 ResizeObserver 가 따로 본다
    // (걸어 둔 필터가 문서에서 사라졌으면 다시 굽는다)
    const o = el.lgRefract;
    const cur = el.style.getPropertyValue("--lg-refract").match(/url\(#([^)]+)\)/);
    if (o && cur && this.tracked.has(el) && o.strength === strength && o.chroma === chroma && o.w === w && o.h === h &&
      o.outward === !!outward && o.look === look && el.ownerDocument.getElementById(cur[1])) return;
    el.lgRefract = { strength, chroma, w, h, outward: !!outward, look };
    if (!this.tracked.has(el)) {
      this.tracked.add(el);
      if (!w) this.resizeObs.observe(el);
    }
    this.update(el);
  }

  update(el: HTMLElement) {
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
  filterFor(w: number, h: number, strength: number, chroma: boolean, outward: boolean, doc = document, bezel = BEZEL_RATIO, spread = REFRACT_SPREAD, lens = LENS_DEFAULT, bezelMax = BEZEL_MAX) {
    // 렌즈(outward)는 가장자리 굴절 대신 축소 렌즈 지도(bakeLensMap)를 쓴다. 세기는 지도가 정한다.
    // lens 는 렌즈 굴절 값 묶음. 기본값이 아니면 id 에 값을 붙여 따로 굽는다
    const bz = Math.round(bezel * 100);
    const sp = Math.round(spread * 100);
    const lensTag = lens === LENS_DEFAULT ? "lens" : `lens-${[lens.minify, lens.flat, lens.edge, lens.reach, lens.shape || 2].join("-").replace(/\./g, "p")}${lens.line ? "-ln" : ""}${lens.box ? "-bx" : ""}`;
    const bm = Math.round(bezelMax * 10);
    const mapKey = outward ? `${w}x${h}-${lensTag}` : `${w}x${h}-b${bz}-s${sp}-m${bm}`;
    // 변위 맵 캐시는 최근에 쓴 MAP_CACHE 개만 남긴다. 쓸 때마다 맨 뒤로 옮겨, 오래 안 쓴 것부터 버린다
    // (예전엔 들어온 순서대로 버려 자주 쓰는 지도부터 밀려났고, 애니메이션 중에 다시 굽느라 끊겼다, 검토 지적.
    // 탭 렌즈 하나가 미리 굽는 크기만 60개 남짓이라 개수도 늘렸다)
    let baked = this.maps.get(mapKey);
    if (baked) this.maps.delete(mapKey);
    else baked = outward ? this.bakeLensMap(w, h, lens) : { url: this.bakeMap(w, h, false, bezel, spread, bezelMax) };
    this.maps.set(mapKey, baked);
    if (this.maps.size > MAP_CACHE) this.maps.delete(this.maps.keys().next().value as string);
    const map = baked.url;
    if (outward) strength = baked.scale;
    const key = outward ? `lg-rf-${w}x${h}-${lensTag}` : `lg-rf-${w}x${h}-${String(strength).replace(/\./g, "p")}${chroma ? "c" : ""}-b${bz}-s${sp}-m${bm}`;
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

    // 무변위 바탕: 지도 밖은 R·G = 128 (움직이지 않음)
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

    const disp = (scale: number, result: string) => {
      const d = doc.createElementNS(SVG_NS, "feDisplacementMap");
      d.setAttribute("in", "SourceGraphic");
      d.setAttribute("in2", "map");
      d.setAttribute("scale", String(scale));
      d.setAttribute("xChannelSelector", "R");
      d.setAttribute("yChannelSelector", "G");
      d.setAttribute("result", result);
      f.appendChild(d);
    };
    const keep = (input: string, row: number, result: string) => {
      const m = doc.createElementNS(SVG_NS, "feColorMatrix");
      m.setAttribute("in", input);
      m.setAttribute("type", "matrix");
      const rows = ["0 0 0 0 0", "0 0 0 0 0", "0 0 0 0 0"];
      rows[row] = ["1 0 0 0 0", "0 1 0 0 0", "0 0 1 0 0"][row];
      m.setAttribute("values", `${rows.join(" ")} 0 0 0 1 0`);
      m.setAttribute("result", result);
      f.appendChild(m);
    };
    const blend = (a: string, b: string, result?: string) => {
      const bl = doc.createElementNS(SVG_NS, "feBlend");
      bl.setAttribute("in", a);
      bl.setAttribute("in2", b);
      bl.setAttribute("mode", "screen");
      if (result) bl.setAttribute("result", result);
      f.appendChild(bl);
    };

    if (chroma) {
      disp(strength, "dr");
      // 색수차: 채널마다 2%씩만 다르게 휜다
      disp(strength * 1.02, "dg");
      disp(strength * 1.04, "db");
      keep("dr", 0, "r");
      keep("dg", 1, "g");
      keep("db", 2, "b");
      blend("r", "g", "rg");
      blend("rg", "b");
    } else {
      disp(strength, "out");
    }

    st.defs.appendChild(f);
    st.filters.set(key, f);
    if (st.filters.size > 80) this.pruneFilters(doc, st, key);
    return key;
  }

  // 필터가 많이 쌓이면 지금 어떤 요소도 쓰지 않는 것을 지운다
  pruneFilters(doc: Document, st: FilterStore, keep: string) {
    const inUse = new Set([keep]);
    doc.querySelectorAll<HTMLElement>('[style*="lg-rf-"]').forEach((el: HTMLElement) => {
      const m = (el.getAttribute("style") || "").match(/lg-rf-[^)\s;]+/g);
      if (m) m.forEach((id: string) => inUse.add(id));
    });
    for (const [id, node] of st.filters) {
      if (inUse.has(id)) continue;
      node.remove();
      st.filters.delete(id);
    }
  }

  bakeMap(w: number, h: number, outward: boolean, bezelRatio = BEZEL_RATIO, spread = REFRACT_SPREAD, bezelMax = BEZEL_MAX) {
    const cv = createEl("canvas");
    cv.width = w;
    cv.height = h;
    const ctx = cv.getContext("2d");
    const img = ctx.createImageData(w, h);
    const d = img.data;

    const r = Math.min(w, h) / 2; // 알약·원 모양
    // 굴절이 일어나는 가장자리 폭: 반지름 × 비율 (최대 BEZEL_MAX px)
    const bezel = Math.max(3, Math.min(r * bezelRatio, bezelMax));
    const n = 1.5; // 유리 굴절률

    // 스퀘어클 곡면 y = (1 - (1 - t)^4)^(1/4) 의 기울기로 꺾임 양 계산, 최댓값으로 정규화
    const bend = (t: number) => {
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
        const dist = Math.hypot(ox, oy) + Math.min(Math.max(qx, qy), 0) - r; // 안쪽이 음수
        const inside = -dist;

        let dx = 0, dy = 0;
        if (inside > 0 && inside < bezel) {
          // 바깥 방향 법선
          let nx, ny;
          if (qx > 0 && qy > 0) {
            const l = Math.hypot(ox, oy) || 1;
            nx = (ox / l) * Math.sign(px);
            ny = (oy / l) * Math.sign(py);
          } else if (qx > qy) {
            nx = Math.sign(px);
            ny = 0;
          } else {
            nx = 0;
            ny = Math.sign(py);
          }
          // 가장자리에 몰린 꺾임을 안쪽까지 넓게 퍼뜨린다
          const mag = Math.pow(Math.min(1, bend(Math.max(0.02, inside / bezel)) / maxBend), spread);
          const dir = outward ? 1 : -1;
          // 양옆은 아래 배경이 단조로워 휘는 게 잘 안 보이므로 가로 성분을 더 키운다
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
  bakeLensMap(w: number, h: number, lens: LensShape = LENS_DEFAULT) {
    const M = lens.minify;
    const T = lens.flat;
    const E = lens.edge;
    const R = lens.reach;
    const S = lens.shape || 2;
    const RXR = parseFloat(getComputedStyle(document.body).getPropertyValue("--lg-pill-rx")) || 0.5;
    const L = 1 - T;
    // f(t) = 읽는 자리 - t. 가운데(t <= T)는 기울기 M-1, 바깥 띠는 (T, (M-1)T, 기울기 M-1) 에서
    // (1, R-1, 기울기 E-1) 로 이어지는 3차 곡선. 가운데 배율이 1이어도 테두리 값만으로 띠가 휜다
    const f = (t: number) => {
      if (t <= T) return (M - 1) * t;
      const s = (t - T) / L;
      return (2 * s ** 3 - 3 * s ** 2 + 1) * (M - 1) * T + (s ** 3 - 2 * s ** 2 + s) * L * (M - 1) + (-2 * s ** 3 + 3 * s ** 2) * (R - 1) + (s ** 3 - s ** 2) * L * (E - 1);
    };
    // 읽는 자리 t + f(t) 표 (테두리에서 1), 뒤에서부터 앞 값이 뒤 값을 넘지 않게
    const N = 1024;
    const pos = new Float32Array(N + 1);
    for (let i = 0; i <= N; i++) pos[i] = i / N + f(i / N);
    for (let i = N - 1; i >= 0; i--) pos[i] = Math.min(pos[i], pos[i + 1]);
    // f(t)/t
    const ratio = (t: number) => {
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
        // line: 가운데 선(-C ~ C)에서 가장 가까운 점 qx 기준의 거리 (테두리 = 1)
        const qx = lens.line ? Math.max(-C, Math.min(C, px)) : 0;
        // 렌즈 가운데에서의 거리 (테두리 = 1). S 가 1 이하면 알약, 2면 타원, 클수록 둥근 사각형을 따라간다
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
      d[i] = Math.round(128 + (ox[j] / max) * 127);
      d[i + 1] = Math.round(128 + (oy[j] / max) * 127);
      d[i + 2] = 128;
      d[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    return { url: cv.toDataURL(), scale: +(max * 2).toFixed(2) };
  }
}
