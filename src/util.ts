import { getLanguage } from "obsidian";

// 화면 문구 언어: Obsidian 언어가 한국어면 한국어, 그 밖에는 영어 (사용자 요청)
export const LANG_KO = (() => {
  try {
    return /^ko/i.test(getLanguage() || "en");
  } catch {
    return false;
  }
})();
export const tr = (ko: string, en: string): string => (LANG_KO ? ko : en);

// 플러그인이 만든 요소는 모두 이 클래스를 달아 두고, 언로드 때 한꺼번에 지운다
export const INJECTED = "lg-injected";
// 원래 자리에서 숨길 요소 표시
export const HIDDEN = "lg-hidden";
export const SVG_NS = "http://www.w3.org/2000/svg";

// 제안 목록(pop)을 화면의 (x, y) 자리·w 폭에 놓는다. Obsidian 이 요소에 직접 넣는 left·top·width 는 그대로 두고,
// 그 자리와의 차이를 --lg-sx/--lg-sy 로, 폭을 --lg-sw 로 넘긴다 (테마: translate 와 최소·최대 폭. !important 없이 덮는다).
// Obsidian 이 넣은 자리는 인라인 left·top(소수 px)으로 읽고, 없으면 offsetLeft/Top(정수로 반올림, translate 를 뺀 자리)으로 잰다.
// 값이 같으면 다시 쓰지 않는다 (스타일 감시가 다시 부른다)
export const placeSugg = (pop: HTMLElement, x: number, y: number, w: number): void => {
  const set = (k: string, v: string) => {
    if (pop.style.getPropertyValue(k) !== v) pop.style.setProperty(k, v);
  };
  const left = parseFloat(pop.style.left);
  const top = parseFloat(pop.style.top);
  set("--lg-sx", `${Math.round((x - (isFinite(left) ? left : pop.offsetLeft)) * 10) / 10}px`);
  set("--lg-sy", `${Math.round((y - (isFinite(top) ? top : pop.offsetTop)) * 10) / 10}px`);
  set("--lg-sw", `${w}px`);
};

// 그 문서(창)에 속한 새 요소 (붙이지 않은 채). Obsidian 이 창마다 두는 createEl 을 쓴다 (별도 창 안전)
export const newEl = <K extends keyof HTMLElementTagNameMap>(doc: Document, tag: K): HTMLElementTagNameMap[K] =>
  (doc.win as typeof window).createEl(tag);

// 요소 목록(NodeList·HTMLCollection)을 배열로. 플러그인이 다루는 요소는 HTML 요소다
export const els = (list: ArrayLike<Node> | Iterable<Node>): HTMLElement[] => Array.from(list as ArrayLike<HTMLElement>);
// 클래스 목록·인라인 스타일 속성 이름을 배열로
export const strs = (list: ArrayLike<string> | Iterable<string>): string[] => Array.from(list as ArrayLike<string>);

// 같은 대상을 다시 우클릭했는지 볼 요소: 누른 곳에서 가장 가까운 항목(파일·폴더·탭·속성·편집 줄·버튼·링크)
export const menuKey = function (t: HTMLElement): HTMLElement {
  return t.closest<HTMLElement>(".tree-item-self, .nav-file-title, .nav-folder-title, .workspace-tab-header, .metadata-property, .cm-line, .clickable-icon, a, .internal-link") || t;
};
// 요소의 아래 끝 (누름 효과로 커지는 중이어도 원래 크기 기준). 메뉴를 버튼 밑에 열 때 쓴다:
// 화면 크기로 재면 누르는 순간의 크기라 메뉴 높이가 버튼마다 조금씩 달랐다 (사용자 지적)
export const layoutBottom = function (el: HTMLElement): number {
  const r = el.getBoundingClientRect();
  return r.top + r.height / 2 + el.offsetHeight / 2;
};

// from → to 방향의 단위 벡터
export const unitVec = function (fx: number, fy: number, tx: number, ty: number): { ux: number; uy: number } {
  const l = Math.hypot(tx - fx, ty - fy) || 1;
  return { ux: (tx - fx) / l, uy: (ty - fy) / l };
};

// 요소인지 확인. 별도 창의 요소는 다른 창의 Element 로 만들어져 instanceof 가 틀릴 수 있어 모양으로 본다
export const isEl = (t: unknown): t is HTMLElement & Partial<HTMLInputElement> =>
  !!t && (t as Node).nodeType === 1 && typeof (t as Element).closest === "function";

// 토글 안쪽 여백: 테마처럼 화면 픽셀 단위로 반올림한다 (테마 --lg-tg-pp 는 round() 식이라 계산값을 읽을 수 없다).
// 테마는 화면 배율을 1/8 구간 값으로 어림하지만 여백 2px 정도는 같은 화면 픽셀로 떨어진다
export const tgPad = (cs: CSSStyleDeclaration, win: Window): number => {
  const p = parseFloat(cs.getPropertyValue("--lg-tg-pad")) || 2;
  const r = win.devicePixelRatio || 1;
  return Math.round(p * r) / r;
};

// 이 플러그인이 맞춰진 테마 이름. 이 테마가 켜져 있을 때만 동작한다 (사용자 요청)
export const THEME_NAME = "Glass Shelf";

