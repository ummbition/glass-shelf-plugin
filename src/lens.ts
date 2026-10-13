import { INJECTED } from "./util";
import { LENS_TAB, LENS_TAB_TEXT } from "./refract";
import type { GlassShelfPlugin } from "./host";

// 패널 탭 렌즈: 평평한 곳을 넓힌다 (refractor.attach 의 look 으로 넘긴다)
// 슬라이더 렌즈: 바깥 그림자 진하기 배율, 움직이는 동안의 찌부 정도 (속도와 상관없이 일정, 사용자 요청)
export const SL_SHADOW_A = 0.45;
export const SL_SQUASH = 0.2; // 0.3 에서 사용자 요청으로 약하게
export const SL_STOP_MS = 50; // 마지막 움직임에서 이만큼(ms) 지나면 멈춘 것으로 본다
export const SL_SQUASH_MOVING = 0.02; // 이 속도(px/ms)보다 빠르면 움직이는 중으로 본다
export const SL_SQUASH_Y = 0.35; // 가로로 늘어난 만큼의 이 배율로 세로가 눌린다
export const SL_SQUASH_Y_STOP = 1.3; // 멈출 때 가로로 줄어든 만큼의 이 배율로 세로가 늘어난다 (사용자 요청)
export const SL_STOP_MIN = 0.12; // 멈출 때 가로로 가장 많이 줄어드는 정도
export const SL_STOP_IN_S = 0.14; // 멈춘 순간부터 가장 줄어들 때까지(초). 이 구간은 일정한 속도로 (사용자 요청: 부드러움은 마지막 복귀에만)
export const SL_SETTLE_S = 0.115; // 가장 줄어든 지점부터 제자리로 천천히 출발해 감속하며 돌아가는 시간 상수(초)
// 렌즈 움직임 (탭 렌즈·토글 공통). u: 0~1 진행도, reach: 0~1 이동 거리 비율
// ease: 위치 (천천히 출발·천천히 도착), g: 렌즈 정도 (시작·끝 0, 가운데 1),
// d: 가로로 늘고 세로로 눌리는 정도 (속도에 비례, 시작·끝 0)
export const lensMotion = function (u: number, reach: number) {
  const ease = u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
  const vel = u < 0.5 ? 12 * u * u : 3 * Math.pow(-2 * u + 2, 2); // 0~3
  const g = Math.pow(Math.sin(Math.PI * u), 0.6);
  const d = 0.5 * reach * (vel / 3);
  return { ease, g, d };
};

export const LENS_CLEAR_K = 2.2; // 토글 손잡이가 투명해지는 속도 배율 (렌즈 정도 대비)
export const LENS_TG_TALL = 3; // 토글 렌즈가 되었을 때 실제 높이가 더 커지는 양(px)

// 사이드바 탭 렌즈 움직임 (사용자 설명, 26.10.06). 오른쪽 → 왼쪽 이동이면 왼쪽 끝이 "도착 쪽 끝".
// "작아짐·커짐"은 곡률을 지킨 채 실제 폭·높이가 바뀌는 것, "찌그러짐"은 잡고 늘리거나 누른 것처럼 변형(scale)되는 것.
// 1) 이동: TAB_LENS_MS 만에 선택 알약이 렌즈로 바뀐다 (높이 = 컨테이너 알약, 폭 = 선택 알약 + 기본 탭 폭 × (TAB_LENS_W − 1)). 도착 근처까지 유지
// 2) 커짐: 도착 전 TAB_GROW_MS 동안 더 커진다 (높이 = 컨테이너 알약 × TAB_LENS_H2, 폭 = 기본 탭이 그만큼 커질 때와 같은 px 만큼 더)
// 3) 작아짐: 도착 쪽 끝은 그대로, 반대쪽 끝이 관성처럼 밀려와 찌그러지고(TAB_SQUASH), 이어 폭이 늘어나게 찌그러지며
//    높이는 조금 낮아진다(TAB_STRETCH·TAB_STRETCH_H). 그동안 렌즈가 선택 알약 크기로 작아지며 유리가 빠지고, 가장 길 때 끝난다
// 4) 원상복구: 길고 조금 낮은 찌그러짐이 선택 알약 비율로 돌아온다
export const TAB_LENS_MS = 80; // 선택 알약 → 렌즈
export const TAB_PRESS_K = 0.5; // 패널 탭을 누를 때 탭 줄 알약이 커지는 정도 (다른 알약 대비)
export const TAB_LENS_W = 1.2; // 이동 중 렌즈 폭 (기본 탭 폭 대비, 더하는 양은 절대값)
export const TAB_GROW_MS = 90; // 도착 전 커지는 시간
export const TAB_GROW_FWD = 9; // 도착 전 커질 때 폭에 더하는 px. 도착 쪽(앞)으로 늘었다가 작아지는 동안 선택 알약 끝으로 돌아온다 (조율기 값)
export const TAB_LENS_H2 = 1.2; // 커졌을 때 높이 (컨테이너 알약 높이 대비)
export const TAB_SHRINK_MS = 280; // 작아짐 (렌즈 → 선택 알약)
export const TAB_SQUASH = 0.5; // 기본 탭(33.8px) 기준 약 17px (0.414 에서 사용자 요청으로 조금 더).  반대쪽 끝이 밀려와 폭이 눌리는 정도
export const TAB_SQUASH_AT = 0.25; // 작아짐 구간에서 가장 눌리는 지점 (0~1)
export const TAB_SQUASH_HOLD = 0.25; // 가장 눌린 채 머무는 길이 (작아짐 구간 대비, 사용자 요청)
export const TAB_STRETCH = 0.08; // 작아짐이 끝날 때 폭이 늘어난 정도
export const TAB_STRETCH_H = 0.08; // 그때 높이가 낮아진 정도
// 모바일 서랍 보기 전환: 이동 중 높이는 선택 알약 그대로, 도착 전 선택 알약의 이 배율로 커지고, 눌림은 이만큼 (사용자 요청)
export const MOBILE_TAB_GROW = 1.1;
export const MOBILE_TAB_SQUASH = 0.1;
export const TAB_RESTORE_MS = 600; // 원상복구
// 폭 쪽 변화(렌즈 폭·커짐·눌림·늘어남)는 탭 폭의 비율이 아니라 기본 탭(높이 × 이 비율, 이름 없는 34px 탭) 기준의 절대값(px)이다.
// 이름·넓게로 탭이 길어져도 같은 만큼만 변한다 (사용자 요청: 비율이면 긴 탭에서 너무 튄다)
export const TAB_REF_RATIO = 1.3;
// 이동 시간(ms): 거리에 따라 늘되 상한이 있다
export const tabTravelMs = (dist: number) => Math.min(220, 130 + dist * 0.6);
// 이동 곡선: 완만한 가속·감속 (2차)
export const tabTravelEase = (u: number) => (u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2);

// =========================================================
// 사이드바 탭 렌즈.
// 회색 선택 알약이 출발하며 유리 렌즈로 부풀어 옮겨 가고, 도착하면 회색 알약으로 줄어든다 (움직임은 위 TAB_* 상수)
// =========================================================
// 렌즈 자리: 가운데(헤더 기준)와 크기
interface LensRect {
  cx: number;
  cy: number;
  w: number;
  h: number;
}

export class SegmentLens {
  // 미리 구운 크기들 (prebake)
  declare baked: Set<string>;
  declare cur: LensRect | null;
  declare dur: number;
  declare el: HTMLElement | null;
  declare from: LensRect;
  declare header: HTMLElement;
  declare inner: HTMLElement;
  // 모바일 서랍 탭: 높이는 탭 높이 그대로
  declare keepH: boolean;
  declare lensEl: HTMLElement;
  declare plugin: GlassShelfPlugin;
  declare raf: number | null;
  declare refract: boolean;
  declare rx: number;
  declare t0: number;
  declare to: LensRect;
  declare toTab: HTMLElement;
  // 글자 전용 렌즈: 렌즈 자리의 탭 복사본 층과 그 안쪽 (복사한 때의 선택 탭)
  declare textEl: HTMLElement | null;
  declare textInner: HTMLElement;
  declare textSig: string;

  constructor(header: HTMLElement, inner: HTMLElement, plugin: GlassShelfPlugin) {
    this.header = header;
    this.inner = inner;
    this.plugin = plugin;
    this.el = null;
    this.raf = null;
    this.cur = null; // 지금 보이는 위치 {cx, cy, w, h}
  }

  ensureEl(): HTMLElement {
    if (this.el && this.el.isConnected) return this.el;
    // 헤더에 렌즈는 하나만
    this.header.querySelectorAll<HTMLElement>(":scope > .lg-seg-indicator").forEach((old: HTMLElement) => old.remove());
    this.el = createDiv({ cls: ["lg-seg-indicator", INJECTED] });
    this.el.createDiv("lg-seg-flat");
    this.lensEl = this.el.createDiv("lg-seg-lens");
    this.header.appendChild(this.el);
    return this.el;
  }

  rectOf(tab: HTMLElement): LensRect {
    const hr = this.header.getBoundingClientRect();
    const r = tab.getBoundingClientRect();
    return { cx: r.left - hr.left + r.width / 2, cy: r.top - hr.top + r.height / 2, w: r.width, h: r.height };
  }

  moveTo(fromTab: HTMLElement, toTab: HTMLElement) {
    // 효과 없음 설정이면 렌즈를 띄우지 않는다
    // 목록 방식 패널도 움직임이 없다
    if (this.plugin.tabPlain() || this.header.closest(".lg-tab-list")) return this.stop();
    if (!fromTab.getBoundingClientRect().width || !toTab.getBoundingClientRect().width) return;
    // 움직이는 중에 다시 누르면 지금 보이는 자리에서 새로 출발한다
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
    // 알약 가로 반지름 비율 (테마 --lg-pill-rx)
    this.rx = parseFloat(getComputedStyle(this.header).getPropertyValue("--lg-pill-rx")) || 0.5;
    this.header.addClass("lg-seg-moving");
    // 굴절은 기본 탭 렌즈 값 하나 (LENS_TAB). 렌즈의 실제 크기가 바뀌므로 매 프레임 2px 단위 크기의 지도를 골라 건다
    this.refract = this.plugin.refractOn();
    if (!this.refract) this.lensEl.style.removeProperty("--lg-refract");
    if (!this.raf) this.raf = window.requestAnimationFrame((t) => this.step(t));
  }

  // 렌즈 크기에 맞는 굴절 필터 (2px 단위로 묶어 지도 수를 줄인다)
  filterAt(w: number, h: number, look = LENS_TAB) {
    const q = (v: number) => Math.max(4, Math.round(v / 2) * 2);
    return this.plugin.refractor.filterFor(q(w), q(h), 42, false, true, this.header.ownerDocument, undefined, undefined, look);
  }

  // 렌즈 안 글자는 탭 줄과 따로 굴절한다 (사용자 요청: 한 굴절로 같이 휘면 가운데 선 방식에서 글자가 옆으로 늘어진다).
  // 원래 탭 글자(.workspace-tab-header-inner)는 렌즈 모양만큼 잘라 숨겨 렌즈 유리가 탭 줄만 떠 오게 하고,
  // 렌즈 자리에 탭 복사본을 렌즈 모양으로 잘라 올려 글자 전용 굴절(LENS_TAB_TEXT)을 건다. 굴절 세기는 렌즈 정도 g 를 따른다
  textLens(x0: number, y0: number, vw: number, vh: number, g: number) {
    const tabs = Array.from(this.inner.querySelectorAll<HTMLElement>(":scope > .workspace-tab-header")).filter((t) => t.offsetWidth > 0);
    if (!this.refract || g <= 0 || !tabs.length) return this.textOff();
    const hr = this.header.getBoundingClientRect();
    const r = vh / 2;
    const n = (v: number) => v.toFixed(2);
    // 누름 효과로 탭 줄 알약(this.inner)이 커져 있는 동안의 배율. 화면 좌표를 탭 안쪽 좌표로 바꿀 때 나눈다
    const sc = this.inner.offsetWidth ? this.inner.getBoundingClientRect().width / this.inner.offsetWidth : 1;
    for (const tab of tabs) {
      const ti = tab.querySelector<HTMLElement>(":scope > .workspace-tab-header-inner");
      if (!ti) continue;
      const tr = ti.getBoundingClientRect();
      const ax = (x0 - (tr.left - hr.left)) / sc;
      const ay = (y0 - (tr.top - hr.top)) / sc;
      const w = vw / sc, h = vh / sc, rr = r / sc;
      // 바깥은 남기고 렌즈 모양(알약)만 비운다 (evenodd)
      ti.style.clipPath = `path(evenodd, "M-9999 -9999H9999V9999H-9999Z M${n(ax + rr)} ${n(ay)}H${n(ax + w - rr)}A${n(rr)} ${n(rr)} 0 0 1 ${n(ax + w - rr)} ${n(ay + h)}H${n(ax + rr)}A${n(rr)} ${n(rr)} 0 0 1 ${n(ax + rr)} ${n(ay)}Z")`;
    }
    if (!this.textEl || !this.textEl.isConnected) {
      this.textEl = this.header.createDiv({ cls: ["lg-seg-text", INJECTED] });
      this.textInner = this.textEl.createDiv();
      this.textSig = "";
    }
    // 선택 탭·탭 수가 바뀌면 다시 복사한다. 복사본은 탭 줄 밖이라 글자색은 원래 것을 그대로 옮긴다
    const sig = tabs.map((t) => (t.hasClass("is-active") ? "1" : "0")).join("");
    if (sig !== this.textSig) {
      this.textSig = sig;
      this.textInner.empty();
      for (const tab of tabs) {
        const c = tab.cloneNode(true) as HTMLElement;
        const src = [tab, ...Array.from(tab.querySelectorAll<HTMLElement>("*"))];
        const dst = [c, ...Array.from(c.querySelectorAll<HTMLElement>("*"))];
        src.forEach((s, i) => {
          const d = dst[i];
          if (!d) return;
          const cs = getComputedStyle(s);
          d.style.color = cs.color;
          d.style.opacity = cs.opacity;
          d.style.removeProperty("clip-path");
        });
        this.textInner.appendChild(c);
      }
    }
    // 복사본 자리는 매 프레임 원래 탭을 따른다. 누름 효과로 탭 줄이 커졌다 돌아오는 동안 처음 복사한 자리에 머물면
    // 끝나고 원래 글자로 바뀔 때 글자가 툭 움직였다
    const clones = Array.from(this.textInner.children) as HTMLElement[];
    tabs.forEach((tab, i) => {
      const c = clones[i];
      if (!c) return;
      const tr = tab.getBoundingClientRect();
      c.style.left = `${(tr.left - hr.left).toFixed(3)}px`;
      c.style.top = `${(tr.top - hr.top).toFixed(3)}px`;
      // offsetWidth 는 정수로 잘려 좁은 패널에서 이름이 말줄임(…)으로 잘렸다. 소수 폭을 그대로 쓴다
      c.style.width = `${(tr.width / sc).toFixed(3)}px`;
      c.style.height = `${(tr.height / sc).toFixed(3)}px`;
      c.style.transform = sc !== 1 ? `scale(${sc.toFixed(4)})` : "";
      // 호버 끌림(--lg-mx/--lg-my)도 매 프레임 원래 탭 값을 따른다. 복사할 때 값이 그대로 박혀, 커서가 떠난 뒤에도 복사본 글자가
      // 끌린 자리에 머물다가 끝날 때 원래 글자로 바뀌며 순간이동했다 (사용자 지적)
      for (const k of ["--lg-mx", "--lg-my"]) {
        const v = tab.style.getPropertyValue(k);
        if (v) c.style.setProperty(k, v);
        else c.style.removeProperty(k);
      }
    });
    const s = this.textEl.style;
    this.textEl.classList.toggle("lg-seg-text-off", false);
    // 필터를 건 층은 화면 픽셀 격자에 맞춰 그려져, 시작점이 픽셀 사이에 있으면 안의 글자가 최대 반 픽셀 밀려
    // 끝나고 원래 글자로 바뀔 때 위아래로 툭 움직였다. 층의 시작점만 화면 픽셀에 맞추고 글자 자리는 그만큼 되돌린다
    const dpr = this.header.win.devicePixelRatio || 1;
    const px0 = Math.round(x0 * dpr) / dpr, py0 = Math.round(y0 * dpr) / dpr;
    s.left = `${n(px0)}px`;
    s.top = `${n(py0)}px`;
    s.width = `${n(vw)}px`;
    s.height = `${n(vh)}px`;
    s.borderRadius = `${n(vh * this.rx)}px / ${n(r)}px`;
    this.textInner.style.left = `${(-px0).toFixed(3)}px`;
    this.textInner.style.top = `${(-py0).toFixed(3)}px`;
    const id = this.filterAt(vw, vh, LENS_TAB_TEXT);
    const f = this.header.ownerDocument.getElementById(id);
    const dm = f && f.querySelector("feDisplacementMap");
    if (dm) {
      // 지도마다 처음 세기를 적어 두고 렌즈 정도만큼 줄여 건다
      if (!dm.getAttribute("data-base")) dm.setAttribute("data-base", dm.getAttribute("scale") || "0");
      dm.setAttribute("scale", (parseFloat(dm.getAttribute("data-base")) * g).toFixed(2));
    }
    const v = `url(#${id})`;
    if (s.filter !== v) s.filter = v;
  }

  textOff() {
    this.inner.querySelectorAll<HTMLElement>(":scope > .workspace-tab-header > .workspace-tab-header-inner").forEach((ti) => ti.style.removeProperty("clip-path"));
    if (this.textEl) this.textEl.classList.toggle("lg-seg-text-off", true);
  }

  // 탭 하나가 지나는 렌즈 크기들의 지도를 쉬는 틈에 미리 굽는다. 처음 탭을 바꿀 때 매 프레임 새 지도를 굽느라 끊기던 것 (측정 확인)
  prebake(tab: HTMLElement) {
    if (!this.plugin.refractOn() || !tab || this.plugin.tabPlain() || this.header.closest(".lg-tab-list")) return;
    const r = tab.getBoundingClientRect();
    const Hc = this.inner.getBoundingClientRect().height || r.height;
    if (!r.width || !r.height) return;
    const key = `${Math.round(r.width)}x${Math.round(r.height)}x${Math.round(Hc)}`;
    this.baked = this.baked || new Set();
    if (this.baked.has(key)) return;
    this.baked.add(key);
    const R = r.height * TAB_REF_RATIO;
    const w1 = r.width + R * (TAB_LENS_W - 1);
    const h1 = this.keepH ? r.height : Hc;
    const h2 = this.keepH ? r.height * MOBILE_TAB_GROW : Hc * TAB_LENS_H2;
    const w2 = r.width + h2 * TAB_REF_RATIO - R + TAB_GROW_FWD;
    // 출발 알약 → 렌즈 → 커진 렌즈 → 선택 알약
    const legs = [[r.width, r.height, w1, h1], [w1, h1, w2, h2], [w2, h2, r.width, r.height]];
    const sizes: [number, number][] = [];
    for (const [w0, h0, wa, ha] of legs) for (let k = 0; k <= 1.0001; k += 0.05) sizes.push([w0 + (wa - w0) * k, h0 + (ha - h0) * k]);
    // 글자 전용 굴절 지도도 같은 크기들로 굽는다 (뒤에 붙여 탭 줄 지도가 먼저 구워진다)
    const texts = sizes.map(([w, h]) => [w, h, 1] as [number, number, number]);
    const win = this.header.ownerDocument.defaultView || window;
    // 굽는 도중 테마를 끄거나 플러그인을 끄면 멈춘다 (굴절 도구가 바뀌었거나 없어졌다)
    const ref = this.plugin.refractor;
    const idle = (fn: (dl?: IdleDeadline) => void) => (win.requestIdleCallback ? win.requestIdleCallback(fn, { timeout: 2000 }) : win.setTimeout(fn, 50));
    const next = () =>
      idle((dl?: IdleDeadline) => {
        if (this.plugin.unloaded || this.plugin.refractor !== ref) return;
        while ((sizes.length || texts.length) && (!dl || dl.timeRemaining() > 4)) {
          const sz = sizes.shift();
          const [w, h, txt] = sz ? [sz[0], sz[1], 0] : texts.shift();
          try {
            this.filterAt(w, h, txt ? LENS_TAB_TEXT : LENS_TAB);
          } catch (err) {
            console.error("[glass-shelf] prebake", err);
            return;
          }
        }
        if (sizes.length || texts.length) next();
      });
    next();
  }

  // 멈추면 원래 선택 표시로 돌린다
  stop() {
    if (this.raf) window.cancelAnimationFrame(this.raf);
    this.raf = null;
    this.cur = null;
    if (this.el) {
      // 매 프레임 불리므로 바뀔 때만 클래스를 고친다 (toggle 은 같은 상태면 속성을 건드리지 않는다)
      this.el.classList.toggle("lg-seg-on", false);
      this.el.classList.toggle("lg-seg-off", true);
      // --lg-g 는 styles.css 기본값 0 으로 돌아간다
      this.el.style.removeProperty("--lg-g");
    }
    this.header.removeClass("lg-seg-moving");
    this.textOff();
  }

  step(now: number) {
    try {
      this.advance(now);
    } catch (err) {
      console.error("[glass-shelf] lens", err);
      this.stop();
    }
  }

  advance(now: number) {
    if (!this.el || !this.el.isConnected || !this.from || !this.to) return this.stop();
    const t = now - this.t0;
    const D = this.dur;

    // 도착할 탭의 지금 자리 (··· 이 접히거나 펼쳐져 탭 줄이 밀리면 따라간다).
    // 출발점도 같은 만큼 옮긴다 (탭 줄 전체가 함께 밀리므로)
    const live = this.toTab && this.toTab.isConnected ? this.rectOf(this.toTab) : this.to;
    const a = Object.assign({}, this.from, { cx: this.from.cx + live.cx - this.to.cx, cy: this.from.cy + live.cy - this.to.cy });
    const b = live;
    const dir = Math.sign(b.cx - a.cx) || 1;
    const lerp = (p: number, q: number, k: number) => p + (q - p) * k;
    const smooth = (x: number) => x * x * (3 - 2 * x);
    const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

    const Hc = this.inner.getBoundingClientRect().height || b.h;
    // 기본 탭 폭 R 기준의 절대값: 렌즈 폭은 R × 0.15 만큼 넓고, 커진 렌즈는 기본 탭이 커질 때와 같은 px 만큼 넓다
    const R = b.h * TAB_REF_RATIO;
    const w1 = b.w + R * (TAB_LENS_W - 1);
    const h1 = this.keepH ? b.h : Hc;
    const h2 = this.keepH ? b.h * MOBILE_TAB_GROW : Hc * TAB_LENS_H2;
    const SQ = this.keepH ? MOBILE_TAB_SQUASH : TAB_SQUASH;
    const w2 = b.w + h2 * TAB_REF_RATIO - R + TAB_GROW_FWD;
    // 도착 쪽 끝: 선택 알약의 그쪽 끝. 도착하는 순간부터 끝까지 여기 선다
    // 앞으로 더한 폭(TAB_GROW_FWD)만큼 나갔다가 작아지는 동안 돌아온다
    const lead = b.cx + (dir * b.w) / 2 + dir * TAB_GROW_FWD * (1 - smooth(clamp01((t - D) / TAB_SHRINK_MS)));

    // bw·bh: 실제 크기(곡률 유지), sx·sy: 찌그러짐, cx: 보이는 가운데, g: 렌즈 정도
    let bw: number;
    let bh: number;
    let sx = 1;
    let sy = 1;
    let cx: number;
    let cy: number;
    let g: number;
    const growFrom = Math.max(TAB_LENS_MS, D - TAB_GROW_MS);
    if (t < D) {
      // 1) 이동 + 렌즈로 바뀜, 2) 도착 전 커짐. 가운데는 도착 때 도착 쪽 끝이 lead 에 오는 자리로 간다
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
      cx = lerp(a.cx, lead - (dir * w2) / 2, e);
      cy = lerp(a.cy, b.cy, e);
    } else if (t < D + TAB_SHRINK_MS) {
      // 3) 작아짐: 렌즈 → 선택 알약, 유리가 빠진다. 폭은 눌렸다가(관성) 늘어나게 찌그러진다
      const x = (t - D) / TAB_SHRINK_MS;
      const k = smooth(x);
      bw = lerp(w2, b.w, k);
      bh = lerp(h2, b.h, k);
      g = 1 - k;
      // 눌림·늘어남도 R 기준 px 를 지금 폭에 대한 배율로 바꿔 쓴다
      const sq = (SQ * R) / bw;
      const st = (TAB_STRETCH * R) / bw;
      if (x < TAB_SQUASH_AT) {
        const q = x / TAB_SQUASH_AT;
        sx = 1 - sq * (1 - Math.pow(1 - q, 2)); // 밀려오며 감속
      } else if (x < TAB_SQUASH_AT + TAB_SQUASH_HOLD) {
        // 눌린 채 잠깐 머문다
        sx = 1 - sq;
      } else {
        const q = smooth((x - TAB_SQUASH_AT - TAB_SQUASH_HOLD) / (1 - TAB_SQUASH_AT - TAB_SQUASH_HOLD));
        sx = lerp(1 - sq, 1 + st, q);
        sy = 1 - TAB_STRETCH_H * q;
      }
      cx = lead - (dir * bw * sx) / 2;
      cy = b.cy;
    } else if (t < D + TAB_SHRINK_MS + TAB_RESTORE_MS) {
      // 4) 원상복구: 길고 낮은 찌그러짐이 선택 알약 비율로
      const x = (t - D - TAB_SHRINK_MS) / TAB_RESTORE_MS;
      const k = 1 - Math.pow(1 - x, 3);
      bw = b.w;
      bh = b.h;
      g = 0;
      sx = lerp(1 + (TAB_STRETCH * R) / b.w, 1, k);
      sy = lerp(1 - TAB_STRETCH_H, 1, k);
      cx = lead - (dir * bw * sx) / 2;
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
    el.style.setProperty("--lg-g", g.toFixed(3));
    if (this.refract && g > 0) {
      const v = `url(#${this.filterAt(bw, bh)})`;
      if (this.lensEl.style.getPropertyValue("--lg-refract") !== v) this.lensEl.style.setProperty("--lg-refract", v);
    }
    this.textLens(cx - (bw * sx) / 2, cy - (bh * sy) / 2, bw * sx, bh * sy, g);
    this.raf = window.requestAnimationFrame((tt) => this.step(tt));
  }
}
