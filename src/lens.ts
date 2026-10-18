import { Platform } from "obsidian";
import { INJECTED } from "./util";
import { LENS_TAB, LENS_TAB_PC, LENS_TAB_TEXT } from "./refract";
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
let shadeSeq = 0;
// 요소의 화면 배율 (화면 폭 ÷ 레이아웃 폭 offsetWidth). 1px 안쪽 차이는 정수로 잘린 offsetWidth 탓이라 1로 본다
const scaleOf = (ow: number, r: DOMRect): number => (ow && Math.abs(r.width - ow) >= 1 ? r.width / ow : 1);

// 한 프레임의 탭 줄 측정값. 읽기(getBoundingClientRect·offsetWidth)를 프레임 앞에 한 번에 모아, 스타일을 쓴 뒤 다시 읽어
// 매 프레임 강제 스타일 계산이 두세 번 생기던 것을 없앤다 (폰 측정: 전환 1초에 스타일 계산 145번 166ms)
interface TabMeasure {
  tab: HTMLElement;
  ti: HTMLElement | null;
  tr: DOMRect;
  tir: DOMRect | null;
  ow: number;
  tiow: number;
}
interface LensMeasure {
  hr: DOMRect;
  innerH: number;
  ir: DOMRect;
  tabs: TabMeasure[];
}

// 글자 렌즈 복사본에 옮기는 계산된 배치 값 (탭 목록 자식 선택자 규칙을 대신한다)
const CLONE_BOX = ["display", "flex-direction", "flex-wrap", "align-items", "justify-content", "gap", "padding", "font-size", "font-weight", "line-height", "letter-spacing", "text-align", "white-space"];
const CLONE_SIZE = ["width", "height", "min-width", "margin", "flex-grow", "flex-shrink", "flex-basis", "align-self", "order"];
export const TAB_LENS_MS = 80; // 선택 알약 → 렌즈
export const TAB_PRESS_K = 0.5; // 패널 탭을 누를 때 탭 줄 알약이 커지는 정도 (다른 알약 대비)
export const TAB_LENS_W = 1.8; // 이동 중 렌즈 폭 (기본 탭 폭 대비, 더하는 양은 절대값). 1.2 에서 사용자 요청으로 넓게
export const TAB_GROW_MS = 90; // 도착 전 커지는 시간
export const TAB_GROW_FWD = 9; // 도착 전 커질 때 폭에 더하는 px. 도착 쪽(앞)으로 늘었다가 작아지는 동안 선택 알약 끝으로 돌아온다 (조율기 값)
export const MOBILE_TAB_GROW_FWD = 0; // 모바일 서랍은 도착 쪽으로 튀어나가지 않는다 (사용자 요청)
export const TAB_LENS_H2 = 1.2; // 커졌을 때 높이 (컨테이너 알약 높이 대비)
export const TAB_SHRINK_MS = 280; // 작아짐 (렌즈 → 선택 알약). 200 으로 줄였다가 되돌림 (사용자 지적: 늘리라고 한 건 원상복구 구간만)
export const TAB_SQUASH = 0.5; // 기본 탭(33.8px) 기준 약 17px (0.414 에서 사용자 요청으로 조금 더).  반대쪽 끝이 밀려와 폭이 눌리는 정도
export const TAB_SQUASH_AT = 0.25; // 작아짐 구간에서 가장 눌리는 지점 (0~1)
export const TAB_SQUASH_HOLD = 0; // 가장 눌린 채 머무는 길이 (작아짐 구간 대비). 0.25 → 0 (사용자 요청: 머무름 없이 바로 펴진다)
export const TAB_STRETCH = 0.08; // 작아짐이 끝날 때 폭이 늘어난 정도
export const TAB_STRETCH_H = 0.08; // 그때 높이가 낮아진 정도
export const TAB_SQUASH_SMALL = 0.7; // 탭 줄 넓게·이름 표시를 둘 다 끈 탭 줄의 찌그러짐 배율 (사용자 요청으로 줄임)
// 모바일 서랍 보기 전환: 이동 중 높이는 선택 알약 그대로, 도착 전 선택 알약의 이 배율로 커지고, 눌림은 이만큼 (사용자 요청)
export const MOBILE_TAB_GROW = 1.1;
export const MOBILE_TAB_SQUASH = 0.1;
export const TAB_RESTORE_MS = 300; // 원상복구: 찌그러짐이 다 끝난 뒤 원래 모양으로 돌아오는 시간 (고르게 바뀜, 데스크톱·모바일 같다). 800 → 600 → 400 → 350 → 320 → 300 (사용자 요청)
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
  declare textAct: string;
  // 그늘 필터를 렌즈마다 따로 두는 표 (좌우 패널 렌즈가 같은 크기 필터를 함께 쓰면 알약 그림 자리가 서로 덮였다)
  declare shadeTag: string;

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

  measure(): LensMeasure {
    const hr = this.header.getBoundingClientRect();
    const ir = this.inner.getBoundingClientRect();
    const innerH = ir.height;
    const tabs: TabMeasure[] = [];
    for (const tab of Array.from(this.inner.querySelectorAll<HTMLElement>(":scope > .workspace-tab-header"))) {
      const tr = tab.getBoundingClientRect();
      if (!tr.width) continue;
      const ti = tab.querySelector<HTMLElement>(":scope > .workspace-tab-header-inner");
      tabs.push({ tab, ti, tr, tir: ti ? ti.getBoundingClientRect() : null, ow: tab.offsetWidth, tiow: ti ? ti.offsetWidth : 0 });
    }
    return { hr, innerH, ir, tabs };
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
  // shade: 렌즈 안 탭 줄 알약 밖(패널 바탕)이 어둡게 비치는 필터 (렌즈마다 따로, Refractor.filterFor 의 shadeTag)
  filterAt(w: number, h: number, look = LENS_TAB, shade = false) {
    const q = (v: number) => Math.max(4, Math.round(v / 2) * 2);
    // 모바일 서랍 탭(keepH)은 렌즈가 탭 줄 알약 밖으로 나가지 않아 그늘이 필요 없다 (사용자 요청으로 뺌)
    if (this.keepH) shade = false;
    // 데스크톱 패널 렌즈는 안쪽을 더 작게 (LENS_TAB_PC)
    if (look === LENS_TAB && !this.keepH) look = LENS_TAB_PC;
    if (shade && !this.shadeTag) this.shadeTag = String(++shadeSeq);
    return this.plugin.refractor.filterFor(q(w), q(h), 42, false, true, this.header.ownerDocument, undefined, undefined, look, undefined, shade ? this.shadeTag : "");
  }

  // 렌즈 안 글자는 탭 줄과 따로 굴절한다 (사용자 요청: 한 굴절로 같이 휘면 가운데 선 방식에서 글자가 옆으로 늘어진다).
  // 원래 탭 글자(.workspace-tab-header-inner)는 렌즈 모양만큼 잘라 숨겨 렌즈 유리가 탭 줄만 떠 오게 하고,
  // 렌즈 자리에 탭 복사본을 렌즈 모양으로 잘라 올려 글자 전용 굴절(LENS_TAB_TEXT)을 건다. 굴절 세기는 렌즈 정도 g 를 따른다
  // 모바일은 글자에 굴절을 걸지 않는다 (사용자 결정): 복사본은 렌즈 위에 그대로 올려 글자가 휘지 않고 또렷하게 보인다.
  // 탭 줄 굴절과 글자 굴절 두 필터가 매 프레임 돌아 보기 전환이 끊겼고, 둘 중 글자 쪽이 더 무거웠다
  // (휴대폰 녹화 측정, 움직이는 동안 프레임 간격 평균: 둘 다 약 19.5ms, 글자 굴절 끔 약 16.8ms, 둘 다 끔 약 15.5ms).
  // 복사본을 아예 빼면 원래 글자가 렌즈(탭 목록 위 층) 아래에 깔려 렌즈 굴절에 같이 휜다
  textLens(x0: number, y0: number, vw: number, vh: number, g: number, m: LensMeasure) {
    const tabs = m.tabs.map((x) => x.tab);
    if (!this.refract || g <= 0 || !tabs.length) return this.textOff();
    const hr = m.hr;
    const r = vh / 2;
    const n = (v: number) => v.toFixed(2);
    // 같은 값은 다시 쓰지 않는다 (쓰면 그 요소의 스타일이 더러워져 다음 읽기에서 다시 계산한다)
    const put = (el: HTMLElement, k: string, v: string) => {
      if (el.style.getPropertyValue(k) !== v) el.style.setProperty(k, v);
    };
    for (const x of m.tabs) {
      const ti = x.ti, tr = x.tir;
      if (!ti || !tr) continue;
      // 렌즈와 겹치지 않는 탭은 구멍이 필요 없다
      const L = tr.left - hr.left, T = tr.top - hr.top;
      if (L > x0 + vw || L + tr.width < x0 || T > y0 + vh || T + tr.height < y0) {
        if (ti.style.getPropertyValue("clip-path")) ti.style.removeProperty("clip-path");
        continue;
      }
      const ks = scaleOf(x.tiow, tr);
      const ax = (x0 - L) / ks;
      const ay = (y0 - T) / ks;
      const w = vw / ks, h = vh / ks, rr = r / ks;
      // 바깥은 남기고 렌즈 모양(알약)만 비운다 (evenodd)
      put(ti, "clip-path", `path(evenodd, "M-9999 -9999H9999V9999H-9999Z M${n(ax + rr)} ${n(ay)}H${n(ax + w - rr)}A${n(rr)} ${n(rr)} 0 0 1 ${n(ax + w - rr)} ${n(ay + h)}H${n(ax + rr)}A${n(rr)} ${n(rr)} 0 0 1 ${n(ax + rr)} ${n(ay)}Z")`);
    }
    if (!this.textEl || !this.textEl.isConnected) {
      this.textEl = this.header.createDiv({ cls: ["lg-seg-text", INJECTED] });
      this.textInner = this.textEl.createDiv();
      this.textSig = "";
    }
    // 탭 수·이름이 바뀌면 다시 복사하고(배치 값까지), 선택 탭만 바뀌면 복사본의 글자색만 다시 옮긴다.
    // 전환마다 통째로 다시 복사하면 요소 300개의 계산된 스타일을 읽느라 첫 프레임이 45ms 끊겼다 (폰 측정).
    // 복사본은 탭 줄 밖이라 글자색은 원래 것을 그대로 옮긴다
    // 복사본은 계산된 배치(display 등)를 인라인으로 굳혀 두므로, 이름 표시·탭 줄 넓게 설정이 바뀌면 다시 만든다:
    // 켠 채 시작한 뒤 끄면 이름이 남고, 끈 채 시작한 뒤 켜면 이름이 없었다 (사용자 지적)
    const bc = this.header.ownerDocument.body.classList;
    const sig =
      tabs.map((t) => t.getAttribute("aria-label") || t.textContent || "").join("\u0001") +
      `|${bc.contains("lg-tab-names") ? 1 : 0}${bc.contains("lg-tab-wide") ? 1 : 0}`;
    const actSig = tabs.map((t) => (t.hasClass("is-active") ? "1" : "0")).join("");
    const pairs = (tab: HTMLElement, c: HTMLElement) => {
      const src = [tab, ...Array.from(tab.querySelectorAll<HTMLElement>("*"))];
      const dst = [c, ...Array.from(c.querySelectorAll<HTMLElement>("*"))];
      return src.map((s, i) => [s, dst[i]] as const).filter(([, d]) => !!d);
    };
    const copyInk = (tab: HTMLElement, c: HTMLElement) => {
      c.classList.toggle("is-active", tab.hasClass("is-active"));
      c.classList.remove("mobile-tap");
      for (const [s, d] of pairs(tab, c)) {
        if (s.closest("svg") && s.tagName.toLowerCase() !== "svg") continue;
        const cs = getComputedStyle(s);
        d.style.color = cs.color;
        d.style.opacity = cs.opacity;
      }
    };
    if (sig !== this.textSig) {
      this.textSig = sig;
      this.textAct = actSig;
      this.textInner.empty();
      for (const tab of tabs) {
        const c = tab.cloneNode(true) as HTMLElement;
        // 누르는 동안 Obsidian 이 잠깐 붙이는 터치 표시(회색 바탕)는 옮기지 않는다: 복사할 때 눌려 있던 탭의 복사본에 남아,
        // 렌즈가 그 탭을 지날 때마다 선택 하이라이트처럼 보였다 (사용자 지적: 휴대폰 오른쪽 서랍에서 한 번 누른 가운데 탭)
        c.classList.remove("mobile-tap");
        pairs(tab, c).forEach(([s, d], i) => {
          d.style.removeProperty("clip-path");
          // 배치도 계산된 값으로 옮긴다: 복사본은 탭 목록 밖(.lg-seg-text)이라 탭 목록 자식 선택자로 거는 규칙(모바일 서랍의 기호 밑 작은 이름 등)을
          // 받지 못해, 렌즈가 지나는 동안 이름이 기호만큼 커져 기호 오른쪽에 그려졌다 (사용자 지적). 탭 자체의 크기·자리는 매 프레임 따로 맞춘다
          if (s.closest("svg") && s.tagName.toLowerCase() !== "svg") return;
          const cs = getComputedStyle(s);
          d.style.color = cs.color;
          d.style.opacity = cs.opacity;
          for (const k of i === 0 ? CLONE_BOX : [...CLONE_BOX, ...CLONE_SIZE]) d.style.setProperty(k, cs.getPropertyValue(k));
        });
        this.textInner.appendChild(c);
      }
    } else if (actSig !== this.textAct) {
      this.textAct = actSig;
      const cl = Array.from(this.textInner.children) as HTMLElement[];
      tabs.forEach((tab, i) => cl[i] && copyInk(tab, cl[i]));
    }
    // 복사본 자리는 매 프레임 원래 탭을 따른다. 누름 효과로 탭 줄이 커졌다 돌아오는 동안 처음 복사한 자리에 머물면
    // 끝나고 원래 글자로 바뀔 때 글자가 툭 움직였다
    const clones = Array.from(this.textInner.children) as HTMLElement[];
    m.tabs.forEach((x, i) => {
      const c = clones[i];
      if (!c) return;
      const tab = x.tab, tr = x.tr;
      put(c, "left", `${(tr.left - hr.left).toFixed(3)}px`);
      put(c, "top", `${(tr.top - hr.top).toFixed(3)}px`);
      // offsetWidth 는 정수로 잘려 좁은 패널에서 이름이 말줄임(…)으로 잘렸다. 소수 폭을 그대로 쓴다
      // 배율은 탭마다 잰다(화면 폭 ÷ 레이아웃 폭): 탭 줄 알약의 누름 배율에 더해, 모바일은 누른 탭 자체가 커진다.
      // 탭 줄 배율만 쓰면 커진 탭의 복사본이 큰 상자에 위로 붙어 그려져, 선택 탭 기호·이름이 위로 올라갔다 내려왔다 (사용자 지적)
      const k = scaleOf(x.ow, tr);
      put(c, "width", `${(tr.width / k).toFixed(3)}px`);
      put(c, "height", `${(tr.height / k).toFixed(3)}px`);
      put(c, "transform", k !== 1 ? `scale(${k.toFixed(4)})` : "");
      // 호버 끌림(--lg-mx/--lg-my)도 매 프레임 원래 탭 값을 따른다. 복사할 때 값이 그대로 박혀, 커서가 떠난 뒤에도 복사본 글자가
      // 끌린 자리에 머물다가 끝날 때 원래 글자로 바뀌며 순간이동했다 (사용자 지적)
      for (const k of ["--lg-mx", "--lg-my"]) {
        const v = tab.style.getPropertyValue(k);
        if (v) put(c, k, v);
        else if (c.style.getPropertyValue(k)) c.style.removeProperty(k);
      }
    });
    const s = this.textEl.style;
    this.textEl.classList.toggle("lg-seg-text-off", false);
    // 필터를 건 층은 화면 픽셀 격자에 맞춰 그려져, 시작점이 픽셀 사이에 있으면 안의 글자가 최대 반 픽셀 밀려
    // 끝나고 원래 글자로 바뀔 때 위아래로 툭 움직였다. 층의 시작점만 화면 픽셀에 맞추고 글자 자리는 그만큼 되돌린다
    const dpr = this.header.win.devicePixelRatio || 1;
    const px0 = Math.round(x0 * dpr) / dpr, py0 = Math.round(y0 * dpr) / dpr;
    put(this.textEl, "left", `${n(px0)}px`);
    put(this.textEl, "top", `${n(py0)}px`);
    put(this.textEl, "width", `${n(vw)}px`);
    put(this.textEl, "height", `${n(vh)}px`);
    put(this.textEl, "border-radius", `${n(vh * this.rx)}px / ${n(r)}px`);
    put(this.textInner, "left", `${(-px0).toFixed(3)}px`);
    put(this.textInner, "top", `${(-py0).toFixed(3)}px`);
    if (Platform.isMobile) {
      if (s.filter) s.removeProperty("filter");
      return;
    }
    const id = this.filterAt(vw, vh, LENS_TAB_TEXT);
    const f = this.header.ownerDocument.getElementById(id);
    const dm = f && f.querySelector("feDisplacementMap");
    if (dm) {
      // 지도마다 처음 세기를 적어 두고 렌즈 정도만큼 줄여 건다
      if (!dm.getAttribute("data-base")) dm.setAttribute("data-base", dm.getAttribute("scale") || "0");
      const sc = (parseFloat(dm.getAttribute("data-base")) * g).toFixed(2);
      if (dm.getAttribute("scale") !== sc) dm.setAttribute("scale", sc);
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
    // 컴팩트 모드면 도착 전에 위아래로 커지지 않는다 (아래 tick 과 같게). 폭은 그대로 커진다
    const hGrow = this.keepH ? r.height * MOBILE_TAB_GROW : Hc * TAB_LENS_H2;
    const h2 = !this.keepH && this.plugin.reduceMotion() ? h1 : hGrow;
    const w2 = r.width + hGrow * TAB_REF_RATIO - R + (this.keepH ? MOBILE_TAB_GROW_FWD : TAB_GROW_FWD);
    // 출발 알약 → 렌즈 → 커진 렌즈 → 선택 알약
    const legs = [[r.width, r.height, w1, h1], [w1, h1, w2, h2], [w2, h2, r.width, r.height]];
    const sizes: [number, number][] = [];
    for (const [w0, h0, wa, ha] of legs) for (let k = 0; k <= 1.0001; k += 0.05) sizes.push([w0 + (wa - w0) * k, h0 + (ha - h0) * k]);
    // 글자 전용 굴절 지도도 같은 크기들로 굽는다 (뒤에 붙여 탭 줄 지도가 먼저 구워진다)
    const texts = Platform.isMobile ? [] : sizes.map(([w, h]) => [w, h, 1] as [number, number, number]);
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
    for (const tab of Array.from(this.inner.querySelectorAll<HTMLElement>(":scope > .workspace-tab-header"))) this.prebake(tab);
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
    // 읽기는 여기서 한 번에 (아래 쓰기 뒤에 다시 읽지 않는다)
    const m = this.measure();
    const tm = this.toTab ? m.tabs.find((x) => x.tab === this.toTab) : undefined;
    const live: LensRect = tm ? { cx: tm.tr.left - m.hr.left + tm.tr.width / 2, cy: tm.tr.top - m.hr.top + tm.tr.height / 2, w: tm.tr.width, h: tm.tr.height } : this.to;
    const a = Object.assign({}, this.from, { cx: this.from.cx + live.cx - this.to.cx, cy: this.from.cy + live.cy - this.to.cy });
    const b = live;
    const dir = Math.sign(b.cx - a.cx) || 1;
    const lerp = (p: number, q: number, k: number) => p + (q - p) * k;
    const smooth = (x: number) => x * x * (3 - 2 * x);
    const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

    const Hc = m.innerH || b.h;
    // 기본 탭 폭 R 기준의 절대값: 렌즈 폭은 R × 0.15 만큼 넓고, 커진 렌즈는 기본 탭이 커질 때와 같은 px 만큼 넓다
    const R = b.h * TAB_REF_RATIO;
    const w1 = b.w + R * (TAB_LENS_W - 1);
    const h1 = this.keepH ? b.h : Hc;
    // 컴팩트 모드(설정)면 도착 직전에 위아래로 커지지 않는다 (사용자 요청). 양옆으로 커지는 것은 그대로 (사용자 요청으로 되돌림)
    const hGrow = this.keepH ? b.h * MOBILE_TAB_GROW : Hc * TAB_LENS_H2;
    const h2 = !this.keepH && this.plugin.reduceMotion() ? h1 : hGrow;
    // 탭 줄 넓게와 이름 표시를 둘 다 끈 작은 탭 줄에서는 찌그러짐(눌림·늘어남)을 TAB_SQUASH_SMALL 배로 줄인다 (사용자 요청).
    // 크기 변화와 이동은 그대로
    const tabsEl = this.header.closest<HTMLElement>(".workspace-tabs");
    const small = !this.keepH && !!tabsEl && !this.plugin.tabWideOf(tabsEl) && !this.plugin.settings.tabNames;
    const f = small ? TAB_SQUASH_SMALL : 1;
    const SQ = (this.keepH ? MOBILE_TAB_SQUASH : TAB_SQUASH) * f;
    const ST = TAB_STRETCH * f;
    const STH = TAB_STRETCH_H * f;
    const FWD = this.keepH ? MOBILE_TAB_GROW_FWD : TAB_GROW_FWD;
    const w2 = b.w + hGrow * TAB_REF_RATIO - R + FWD;
    // 도착 쪽 끝: 선택 알약의 그쪽 끝. 도착하는 순간부터 끝까지 여기 선다
    // 앞으로 더한 폭(TAB_GROW_FWD)만큼 나갔다가 작아지는 동안 돌아온다
    const lead = b.cx + (dir * b.w) / 2 + dir * FWD * (1 - smooth(clamp01((t - D) / TAB_SHRINK_MS)));

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
      const st = (ST * R) / bw;
      if (x < TAB_SQUASH_AT) {
        const q = x / TAB_SQUASH_AT;
        sx = 1 - sq * (1 - Math.pow(1 - q, 2)); // 밀려오며 감속
      } else if (x < TAB_SQUASH_AT + TAB_SQUASH_HOLD) {
        // 눌린 채 잠깐 머문다
        sx = 1 - sq;
      } else {
        const q = smooth((x - TAB_SQUASH_AT - TAB_SQUASH_HOLD) / (1 - TAB_SQUASH_AT - TAB_SQUASH_HOLD));
        sx = lerp(1 - sq, 1 + st, q);
        sy = 1 - STH * q;
      }
      cx = lead - (dir * bw * sx) / 2;
      cy = b.cy;
    } else if (t < D + TAB_SHRINK_MS + TAB_RESTORE_MS) {
      // 4) 원상복구: 길고 낮은 찌그러짐이 선택 알약 비율로
      const x = (t - D - TAB_SHRINK_MS) / TAB_RESTORE_MS;
      // 앞부분에 몰아 바뀌던 감속 곡선(1 - (1 - x)^3) 대신 고르게 바뀌어 구간 끝까지 천천히 돌아온다 (사용자 요청)
      const k = smooth(x);
      bw = b.w;
      bh = b.h;
      g = 0;
      sx = lerp(1 + (ST * R) / b.w, 1, k);
      sy = lerp(1 - STH, 1, k);
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
    if (el.style.getPropertyValue("--lg-g") !== g.toFixed(3)) el.style.setProperty("--lg-g", g.toFixed(3));
    if (this.refract && g > 0) {
      const id = this.filterAt(bw, bh, LENS_TAB, true);
      const v = `url(#${id})`;
      if (this.lensEl.style.getPropertyValue("--lg-refract") !== v) this.lensEl.style.setProperty("--lg-refract", v);
      // 그늘 필터의 알약 그림을 탭 줄 알약 자리로 (렌즈 좌표: 배율을 걸기 전, 렌즈 왼쪽 위 기준)
      const ir = m.ir, x0 = cx - (bw * sx) / 2 - (ir.left - m.hr.left), y0 = cy - (bh * sy) / 2 - (ir.top - m.hr.top);
      if (!this.keepH) this.plugin.refractor.shadeAt(this.header.ownerDocument, id, -x0 / sx, -y0 / sy, ir.width / sx, ir.height / sy, (ir.height * this.rx) / sx);
    }
    this.textLens(cx - (bw * sx) / 2, cy - (bh * sy) / 2, bw * sx, bh * sy, g, m);
    this.raf = window.requestAnimationFrame((tt) => this.step(tt));
  }
}
