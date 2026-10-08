"use strict";

const { Plugin, PluginSettingTab, Setting, Menu, Modal, Notice, TFolder, MarkdownView, Platform, setIcon, setTooltip, getLanguage } = require("obsidian");

// 화면 문구 언어: Obsidian 언어가 한국어면 한국어, 그 밖에는 영어 (사용자 요청)
const LANG_KO = (() => {
  try {
    return /^ko/i.test(getLanguage() || "en");
  } catch {
    return false;
  }
})();
const tr = (ko, en) => (LANG_KO ? ko : en);

// CSS 색 값(var() 포함)을 [r, g, b] 로 푼다
function resolveRgb(doc, value) {
  const el = doc.createElement("div");
  el.style.color = value;
  el.hide();
  doc.body.appendChild(el);
  const c = (doc.defaultView || window).getComputedStyle(el).color;
  el.remove();
  let m = c.match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/);
  if (m) return [+m[1], +m[2], +m[3]];
  m = c.match(/color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)/);
  if (m) return [m[1] * 255, m[2] * 255, m[3] * 255];
  return null;
}

// 테마의 파랑 폴더 기호(theme.css --lg-folder-icon)와 같은 모양을 주어진 색으로
function folderIconUrl(rgb) {
  const mix = (t, k) => "#" + rgb.map((v) => Math.round(v + (t - v) * k).toString(16).padStart(2, "0")).join("");
  const front = mix(0, 0);
  const top = mix(255, 0.22);
  const back = mix(0, 0.15);
  const shine = mix(255, 0.55);
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 17.6'>` +
    `<defs><linearGradient id='f' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='${top}'/><stop offset='1' stop-color='${front}'/></linearGradient></defs>` +
    `<path d='M1 2.6C1 1.7 1.7 1 2.6 1h4.3c.4 0 .8.2 1.1.5L9.3 2.8h8.1c.9 0 1.6.7 1.6 1.6v10.6c0 .9-.7 1.6-1.6 1.6H2.6C1.7 16.6 1 15.9 1 15z' fill='${back}'/>` +
    `<rect x='1' y='4.6' width='18' height='12' rx='1.5' fill='url(#f)'/>` +
    `<rect x='1.6' y='4.6' width='16.8' height='0.7' rx='0.35' fill='${shine}'/>` +
    `</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

// 폴더 색 팔레트: 사용자가 폴더 색 조율기 아티팩트에서 고른 색 (애플 태그 색 계열을 채도 낮춰 누그러뜨림 + 더한 색).
// 끝의 무지개 칸은 색을 직접 고른다
const FOLDER_PALETTE = [
  [tr("빨강", "Red"), "#D85D4D"],
  [tr("주황", "Orange"), "#E4A367"],
  [tr("노랑", "Yellow"), "#D6B86D"],
  [tr("올리브", "Olive"), "#969859"],
  [tr("초록", "Green"), "#5CA95F"],
  [tr("청록", "Teal"), "#6AB9B0"],
  [tr("파랑", "Blue"), "#4981D0"],
  [tr("남색", "Indigo"), "#5D63AF"],
  [tr("분홍", "Pink"), "#D95D8A"],
  [tr("보라", "Purple"), "#9F6BBD"],
  [tr("회색", "Gray"), "#84848F"],
];

function hexToRgb(hex) {
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex || "");
  return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : null;
}

// 폴더 색 고르기 창
class FolderColorModal extends Modal {
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
      setTooltip(sw, name);
      if (this.current === hex.toLowerCase()) sw.addClass("is-selected");
      sw.addEventListener("click", () => {
        this.close();
        this.onPick(hex);
      });
    }
    // 직접 고르기: 무지개 칸을 누르면 색 고르기 창이 열리고, 고르면 바로 적용한다.
    // 지금 색이 팔레트에 없는 색이면 칸 안에 그 색을 보이고 선택 표시를 한다
    const custom = grid.createEl("label", { cls: "lg-fc-swatch lg-fc-custom" });
    setTooltip(custom, tr("직접 고르기", "Pick a color"));
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
    const clear = contentEl.createEl("button", { text: tr("색 지우기", "Clear color"), cls: "lg-fc-clear" });
    clear.addEventListener("click", () => {
      this.close();
      this.onPick(null);
    });
  }

  onClose() {
    this.contentEl.empty();
  }
}

// 테마의 문서 기호(theme.css --lg-file-icon)를 주어진 색 쪽으로 물들인다 (폴더 색 안의 문서).
// 종이 그라데이션 세 곳과 접힌 귀퉁이를 그 색과 흰색 사이로. 흰 끝도 색을 20% 섞는다 (사용자 요청, 예전엔 흰색 그대로)
function fileIconUrl(rgb) {
  const mix = (k) => "#" + rgb.map((v) => Math.round(v + (255 - v) * k).toString(16).padStart(2, "0")).join("");
  // 테두리: 폴더 색을 어둡게(60%) 한 색, 반투명 (사용자 요청, 예전엔 색과 상관없이 검정 22%)
  const edge = `rgb(${rgb.map((v) => Math.round(v * 0.6)).join(" ")} / 0.55)`;
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='-0.3 -0.3 14.6 17.6'>` +
    `<defs><linearGradient id='p' x1='0' y1='1' x2='1' y2='0'><stop offset='0' stop-color='${mix(0.8)}'/><stop offset='0.55' stop-color='${mix(0.62)}'/><stop offset='1' stop-color='${mix(0.2)}'/></linearGradient></defs>` +
    `<path d='M1.5 0h6.9L14 5.6v9.9c0 .8-.7 1.5-1.5 1.5h-11C.7 17 0 16.3 0 15.5v-14C0 .7.7 0 1.5 0z' fill='url(#p)' stroke='${edge}' stroke-width='0.5' stroke-linejoin='round'/>` +
    `<path d='M8.4 0v4.1c0 .8.7 1.5 1.5 1.5H14z' fill='${mix(0.72)}' stroke='${edge}' stroke-width='0.5' stroke-linejoin='round'/>` +
    `</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

// 플러그인이 만든 요소는 모두 이 클래스를 달아 두고, 언로드 때 한꺼번에 지운다
const INJECTED = "lg-injected";
// 원래 자리에서 숨길 요소 표시
const HIDDEN = "lg-hidden";
const SVG_NS = "http://www.w3.org/2000/svg";

const DEFAULTS = {
  // 유리 투명도 0~10 단계 (클수록 덜 투명). 0 = 맑은 유리.
  // 1~5: 유리 뒤를 바탕색 쪽으로 바래게 (--lg-fade 0.45~0.8). 6~10: 다 바랜 채로 채움을 더해 뿌옇게 (예전 뿌연 정도 1~5).
  // 흐림 세기는 테마에 고정(--lg-blur-k)
  glassLevel: 5,
  // 호버 유리 크기: false = 알약 안 버튼 크기(컨테이너보다 작게, 파일 앱), true = 컨테이너 높이(사파리)
  hoverLarge: false,
  // 탭 줄 첫 줄에 지금 문서의 "폴더 / 파일" 경로를 보이고, 탭은 둘째 줄로 내린다
  showPath: true,
  // 편집창을 아래로 스크롤하면 탭 줄을 접고 문서 제목만 작게 남긴다 (사파리식)
  miniBar: true,
  // Obsidian 팝업(대화상자·명령 팔레트·미리보기·알림 등): false = 메뉴만큼 비침, true = 꽉 채움
  popupOpaque: false,
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
  // 패널 탭 전환 효과: "lens" = 렌즈가 옮겨 간다, "none" = 효과 없이 선택한 탭이 강조색 알약
  tabAnim: "lens",
  // 패널 탭 알약을 좌우 끝까지 넓게 (맨 위 묶음은 한 줄 내려서)
  tabWide: true,
  // 패널 탭 기호 오른쪽에 이름 (탭이 하나뿐이면 설정과 상관없이 붙는다)
  tabNames: true,
  // 제목(h1~h6) 밑 가로줄 (CSS: body.lg-hrule)
  headingRule: false,
  // 파일 탐색기 줄무늬
  fileStripes: false,
};

// 예전 "이 기기만 따로 설정"(삭제, 사용자 요청)이 이 기기 저장소(localStorage)에 쓰던 키. 남은 값을 지우는 데만 쓴다
const OLD_DEVICE_KEYS = ["liquid-glass-device-only", "liquid-glass-device-settings"];

// Obsidian 기본 강조색(보라). 사용자가 강조색을 바꿔도 이 색은 그대로
const OBSIDIAN_PURPLE = "hsl(258 88% 66%)";

// 호버 유리가 뜨는 요소들 (테마의 '호버 유리' 목록과 같아야 한다)
// 편집창 탭(제목·X·≡)은 플랫한 하이라이트라 빠진다
const HOVER_GLASS = [
  ".clickable-icon:not(.lg-tab-menu):not(.workspace-tab-header-inner-close-button)",
  ".workspace-drawer-vault-switcher",
  ".mod-left-split .workspace-tab-header",
  ".mod-right-split .workspace-tab-header",
  ".titlebar-button-container.mod-right .titlebar-button",
  "input.task-list-item-checkbox",
].join(", ");

// 클릭 효과: 단독 원형 버튼(유리가 흰색으로 부풀었다 돌아온다)
const PRESS_POP = [
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
].join(", ");

// 버튼 → 메뉴(창): 버튼은 메뉴 가운데를 향해 MORPH_DASH 만큼 돌진하며 사라지고, 메뉴는 그 지점에서 넓어져 나온다.
// 닫힐 때는 거기서 나타나 반대쪽으로 MORPH_OVERSHOOT 만큼 지나쳤다가 제자리로 온다. 크기와 상관없이 같은 거리(px)
const MORPH_DASH = 30;
const MORPH_OVERSHOOT = 5;
// 창이 펼쳐질 때 펼쳐지는 방향으로 살짝 밀렸다 돌아오는 거리(px)
const MORPH_NUDGE = 3;
// 버튼 밑에 여는 메뉴(패널 ···, 편집창 ≡·탭 목록)와 버튼 사이 간격(px)
const MENU_DROP = 6;

// 움직임 곡선. 테마의 --lg-ease-* 와 같은 값이다 (WAAPI 는 CSS 변수를 못 읽어 따로 적는다)
const EASE = {
  move: "cubic-bezier(0.65, 0, 0.35, 1)",
  settle: "cubic-bezier(0.3, 0, 0.2, 1)",
  pop: "cubic-bezier(0.3, 1.3, 0.5, 1)",
  exit: "cubic-bezier(0.4, 0, 1, 1)",
  burst: "cubic-bezier(0.2, 0.7, 0.3, 1)",
  ret: "cubic-bezier(0.45, 0, 0.35, 1)",
  press: "cubic-bezier(0.3, 0, 0.3, 1)",
};

// 같은 대상을 다시 우클릭했는지 볼 요소: 누른 곳에서 가장 가까운 항목(파일·폴더·탭·속성·편집 줄·버튼·링크)
function menuKey(t) {
  return t.closest(".tree-item-self, .nav-file-title, .nav-folder-title, .workspace-tab-header, .metadata-property, .cm-line, .clickable-icon, a, .internal-link") || t;
}
const STRIPE_FOLLOW_MS = 400; // 폴더를 열고 닫은 뒤 줄무늬를 매 프레임 따라 맞추는 시간 (Obsidian 애니메이션보다 넉넉히)
const DRAG_SCROLL_ZONE = 48; // 끌기 자동 스크롤: 보이는 위·아래 끝에서 이 거리(px) 안이면 스크롤
const DRAG_SCROLL_MAX = 14; // 끝에 붙었을 때 한 프레임 스크롤 양(px)
const TASK_PRESS_MS = 260; // 할 일 체크박스를 누르면 작아졌다 되돌아오는 시간
const MENU_MOVE_MS = 320; // 같은 대상을 다시 우클릭했을 때 메뉴가 새 자리로 옮겨 가는 시간

// from → to 방향의 단위 벡터
function unitVec(fx, fy, tx, ty) {
  const l = Math.hypot(tx - fx, ty - fy) || 1;
  return { ux: (tx - fx) / l, uy: (ty - fy) / l };
}

// 패널을 여닫는 토글. 누르면 패널이 접히거나 펼쳐지며 다른 자리의 토글로 바뀐다
const PANEL_TOGGLES = ".sidebar-toggle-button .clickable-icon, .lg-panel-toggle";

// 클릭 효과: 한 번 누르고 마는 알약 안 버튼(누른 자리에서 흰 그라데이션이 퍼진다)
// 알약 안 버튼을 누를 때 퍼지는 흰 빛 지름 = 알약 높이 × RIPPLE_K. 2 면 누른 자리에서 알약 높이만큼 퍼진다 (사용자 요청)
const RIPPLE_K = 6;
// 알약 안 흰 빛이 가장 밝은(불투명) 채로 퍼지는 구간: 전체 시간 중 이 비율까지는 흐려지지 않는다 (사용자 요청: 더 밝게)
const RIPPLE_HOLD = 0.6;
// 메뉴 항목을 누를 때 흰 빛의 처음 크기 (다 퍼진 크기 대비)
const MENU_RIPPLE_FROM = 0.5;
// 패널 탭(효과 없음 모드)을 누를 때 흰 빛이 다 퍼진 지름 = 알약 높이 × TAB_RIPPLE_K
const TAB_RIPPLE_K = 16;
const PRESS_RIPPLE = [
  ".lg-kb-group .clickable-icon",
  ".lg-tab-nav .clickable-icon",
  ".lg-nav-run .clickable-icon",
  ".lg-path-pill .clickable-icon",
  ".side-dock-actions .side-dock-ribbon-action",
  ".side-dock-settings .side-dock-ribbon-action",
  ".titlebar-button-container.mod-right .titlebar-button",
].join(", ");

// 버튼이 든 컨테이너 알약
const PRESS_PILL = ".lg-kb-group, .lg-tab-nav, .lg-nav-run, .lg-path-pill, .side-dock-actions, .side-dock-settings, .workspace-tab-header-container-inner, .titlebar-button-container.mod-right, .workspace-drawer-vault-switcher";

// 클릭 효과: 커졌다가 줄어든다 (패널 탭, 뒤로·앞으로, 리본, 창 제어)
const PRESS_SCALE = [
  ".lg-kb-group .clickable-icon",
  ".lg-tab-nav .clickable-icon",
  ".lg-nav-run .clickable-icon",
  ".lg-path-pill .clickable-icon",
  ".side-dock-actions .side-dock-ribbon-action",
  ".side-dock-settings .side-dock-ribbon-action",
  ".titlebar-button-container.mod-right .titlebar-button",
  ".mod-left-split .workspace-tab-header-container .workspace-tab-header",
  ".mod-right-split .workspace-tab-header-container .workspace-tab-header",
  ".workspace-drawer-vault-switcher",
].join(", ");

// 모바일 클릭 효과. 모바일 유리는 요소 자체(.mod-raised)에 그려져 있어 요소를 통째로 키우고 하얗게 한다
// 단독 원형 버튼: 커지며 흰색이 됐다가 돌아온다
const MOBILE_PRESS_POP = [
  ".sidebar-toggle-button.mod-raised",
  ".workspace-drawer-header-icon.mod-raised",
  ".modal-close-button.mod-raised",
  ".modal-header-button.mod-raised",
  ".modal-setting-back-button.mod-raised",
  ".mobile-toolbar-floating-options",
  ".mobile-tab-switcher-menu-spacer > .clickable-icon",
].join(", ");

// 버튼이 든 알약: 안 버튼(MOBILE_PRESS_BTN)을 누르면 알약이 통째로 커지며 하얘진다. 서랍 보기 전환 줄은 커지기만 (패널 탭과 같다)
const MOBILE_PRESS_PILL = ".is-floating-nav .mobile-navbar.mod-raised, .view-header .view-actions.mod-raised, .mobile-toolbar-options-list-container.mod-raised, .workspace-drawer-tab-options-list, .mobile-tab-switcher-menu-button";
const MOBILE_PRESS_BTN = ".clickable-icon, button, .mobile-navbar-action, .mobile-toolbar-option, .workspace-tab-header, .mobile-tab-switcher-menu-button";

// 요소인지 확인. 별도 창의 요소는 다른 창의 Element 로 만들어져 instanceof 가 틀릴 수 있어 모양으로 본다
const isEl = (t) => !!t && t.nodeType === 1 && typeof t.closest === "function";

// 스크롤 시 탭 줄 축소 (사용자 요청, 사파리 주소창처럼): 맨 위에서 MINI_TOP(px) 넘게 내려온 뒤
// 한 방향으로 MINI_STEP(px) 넘게 스크롤하면 접거나(아래로) 편다(위로). 파일을 열거나 탭을 바꾼 직후 MINI_HOLD(ms)는
// 스크롤 위치 복원 때문에 생기는 스크롤을 무시한다
// 메뉴가 열릴 때 살짝 더 커지는 양(px). 메뉴의 긴 변이 이만큼 커지고, 짧은 변은 같은 비율로 따라 커져 모양(가로세로 비)은 그대로다.
// 비율이 아니라 절대값이라 큰 메뉴도 작은 메뉴도 긴 변이 같은 만큼 커진다 (사용자 요청).
// 테마 애니메이션(lg-menu-in)이 쓰는 배율(--lg-menu-kx/ky)을 메뉴 크기로 바꿔 넣는다
const MENU_POP = 4;
const MINI_TOP = 40;
const MINI_STEP = 24;
const MINI_HOLD = 400;
const MINI_MS = 280;
const MINI_EASE = "cubic-bezier(0.2, 0.8, 0.2, 1)";
const MINI_PULL = 0.3; // 사라지는 요소가 알약 쪽으로 움직이는 비율 (거리 전체가 아니라 방향만 보이게, 사용자 요청)

// Kanban 플러그인 연동 (테마 Kanban 절과 짝). 보드 위 버튼 중 목록 추가·완료된 카드 보관·마크다운으로 열기를 알약 하나로 묶는다
// (사용자 요청). 이름은 언어마다 달라 기호로 찾는다
const KB_GROUP_ICONS = ["lucide-plus-circle", "lucide-archive", "lucide-file-text"];
// 목록을 접고 펼 때 높이(가로 보드는 폭)가 바뀌는 시간
const KB_LANE_MS = 300;
// 목록 추가 창을 열 때 버튼 묶음 알약이 좌우로 좁아지는 폭 (알약 높이 대비, 높이는 그대로)
const KB_PILL_DOT = 1;
// 그 알약이 좁아지며 돌진해 사라지는 시간 (보관함 버튼은 160ms)
const KB_DASH_MS = 300;

// 굴절을 거는 유리 요소들. [선택자, 휘는 세기(px)]
const REFRACT_TARGETS = [
  [".lg-nav-more, .lg-nav-rest > .clickable-icon, .lg-panel-toggle, .lg-tab-mode, .lg-rib-menu", 32],
  [".mod-root .workspace-tab-header-new-tab .clickable-icon, .mod-root .workspace-tab-header-tab-list .clickable-icon", 32],
  [".sidebar-toggle-button .clickable-icon, .workspace-drawer-vault-actions .clickable-icon", 32],
  [".graph-controls.is-close .graph-controls-button", 32],
  [".lg-tab-nav, .lg-nav-run, .lg-path-pill, .side-dock-actions, .workspace-drawer-vault-switcher, .status-bar, .lg-kb-group", 26],
  [".mod-left-split .workspace-tab-header-container-inner, .mod-right-split .workspace-tab-header-container-inner", 26],
  [".mod-root .workspace-tab-header-container .workspace-tab-header.is-active", 23],
  [".titlebar-button-container.mod-right", 26],
];

// 모바일(휴대폰·태블릿 앱)에서 굴절을 거는 유리 요소들. Obsidian 이 떠 있는 요소에 붙이는 .mod-raised 자리
const REFRACT_TARGETS_MOBILE = [
  [".mobile-navbar.mod-raised, .view-header .view-actions.mod-raised, .mobile-toolbar-options-list-container.mod-raised", 26],
  [".workspace-drawer-tab-options-list", 26],
  [".view-header .sidebar-toggle-button.mod-raised, .workspace-drawer-header-icon.mod-raised, .modal-close-button.mod-raised, .modal-header-button.mod-raised", 32],
];

// iOS·iPadOS 앱(WebKit)은 backdrop-filter 안의 url() 필터를 못 쓴다. 넣으면 흐림까지 통째로 무시되므로 굴절을 끈다
// (최신 iPadOS 에서도 안 되는 것을 사용자가 확인)
const CAN_REFRACT = !Platform.isIosApp;

// 굴절이 일어나는 가장자리 폭 = 반지름 × BEZEL_RATIO, 최대 BEZEL_MAX(px).
// 모바일은 버튼·알약이 커서(44~52px) 데스크톱 상한 14px 에 걸리므로 비율과 상한을 함께 키운다 (사용자 요청)
const REFRACT_SPREAD = 0.6; // 굴절이 가장자리에서 안쪽으로 퍼지는 정도 (작을수록 안쪽까지 넓게)
// 가운데 평평한 높이가 약 7px 이 되게 (사용자 요청): 데스크톱 0.8(34px, 이전 0.55 = 약 15px), 모바일 0.84(44px, 이전 0.75 = 약 11px)
const BEZEL_RATIO = Platform.isMobile ? 0.84 : 0.8;
const BEZEL_MAX = Platform.isMobile ? 24 : 14;
// 호버 유리 굴절: 세기(px), 띠 폭(반지름 비율), 안쪽 퍼짐, 띠 최대 폭(px)
const HOVER_REFRACT = { strength: 6, bezel: 0.05, spread: REFRACT_SPREAD, bezelMax: BEZEL_MAX };
// 탭 렌즈·토글 렌즈 굴절: 가운데는 평평하게 LENS_MINIFY 배 작게, 테두리 쪽 띠에서만 변해 테두리 끝에서 1 / LENS_MINIFY_EDGE 배 크게 (사용자 요청).
// 평평한 곳은 렌즈 반지름의 LENS_MINIFY_FLAT 까지. 띠는 기울기가 이어지는 곡선이라 이음매가 매끄럽다.
// 띠가 배율에 비해 얇으면(1.3배에서 약 32% 미만) 곡선만으로는 읽는 자리가 되감기므로, bakeLensMap 이 그 구간을 눌러 편다
const LENS_MINIFY = 1.2;
const LENS_MINIFY_FLAT = 0.7;
const LENS_MINIFY_EDGE = 0.5;
// 렌즈 굴절 값 묶음 (bakeLensMap). reach 는 테두리 끝이 읽는 자리: 1 이면 렌즈 끝 자기 자리, 1 보다 작으면 안쪽을 읽는다
// 알약(가로 반지름 rxr × 높이, 세로 반지름 = 높이 절반) 가운데에서의 거리. 테두리 = 1, 같은 비율로 줄인 알약이 등고선
function pillT(px, py, ax, ay, rxr) {
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
}
const LENS_DEFAULT = { minify: LENS_MINIFY, flat: LENS_MINIFY_FLAT, edge: LENS_MINIFY_EDGE, reach: 1, shape: 1 };
// 토글·슬라이더 렌즈는 따로 (렌즈 조율기에서 사용자가 고른 값, 26.10.02)
// 토글: 평평한 곳을 넓힌다. 슬라이더: 가운데는 그대로(1), 바깥 5% 띠에서 테두리 끝이 안쪽(0.5)을 읽는다
// shape: 굴절 띠가 따라가는 모양. 1 = 알약(렌즈 모양 그대로), 2 = 타원, 클수록 둥근 사각형(초타원 지수)
const LENS_TOGGLE = { minify: 1.2, flat: 0.9, edge: 0.1, reach: 0.86, shape: 1 };
// 평평한 영역이 테두리 끝까지(0.95) 가면 읽는 자리가 0.95 → 0.5 로 되접혀, 되접힘 방지로 바깥 절반이 한 자리만 읽는 판판한 띠(사다리꼴 단면)가 됐다.
// 띠를 넓게(0.3) 시작해 테두리에서 완만해지게(edge 0.2) 해 볼록 렌즈처럼 휘게 한다
const LENS_SLIDER = { minify: 1, flat: 0.9, edge: 0.2, reach: 0.55, shape: 1 };
// 패널 탭 렌즈: 평평한 곳을 넓힌다 (refractor.attach 의 look 으로 넘긴다)
// 슬라이더 렌즈: 바깥 그림자 진하기 배율, 움직이는 동안의 찌부 정도 (속도와 상관없이 일정, 사용자 요청)
const SL_SHADOW_A = 0.45;
const SL_SQUASH = 0.2; // 0.3 에서 사용자 요청으로 약하게
const SL_STOP_MS = 50; // 마지막 움직임에서 이만큼(ms) 지나면 멈춘 것으로 본다
const SL_SQUASH_MOVING = 0.02; // 이 속도(px/ms)보다 빠르면 움직이는 중으로 본다
const SL_SQUASH_Y = 0.35; // 가로로 늘어난 만큼의 이 배율로 세로가 눌린다
const SL_SQUASH_Y_STOP = 1.3; // 멈출 때 가로로 줄어든 만큼의 이 배율로 세로가 늘어난다 (사용자 요청)
const SL_STOP_MIN = 0.12; // 멈출 때 가로로 가장 많이 줄어드는 정도
const SL_STOP_IN_S = 0.14; // 멈춘 순간부터 가장 줄어들 때까지(초). 이 구간은 일정한 속도로 (사용자 요청: 부드러움은 마지막 복귀에만)
const SL_SETTLE_S = 0.115; // 가장 줄어든 지점부터 제자리로 천천히 출발해 감속하며 돌아가는 시간 상수(초)
const LENS_TAB = { minify: 1.2, flat: 0.94, edge: 2, reach: 1.1, shape: 1 };

// 누를 때 알약이 되는 흰색. 알약 채움(테마 --lg-glass-fill)이 color-mix 라 color(srgb …) 로 계산되는데,
// Chromium 은 옛 rgb() 와 color(srgb …) 사이를 보간할 때 0~255 값을 색 성분에 섞어 노랑·빨강(또는 검정)으로 튄다 (측정 확인).
// 같은 표기(color(srgb …))끼리는 바르게 보간된다
const PRESS_WHITE = "color(srgb 1 1 1)";

// 예전 "유리 뿌연 정도"(frostLevel 0~10)를 "유리 투명도"(glassLevel)로 옮긴다.
// 예전 1~5 는 새 6~10 (다 바랜 뒤 뿌옇게), 예전 0 은 새 5 (다 바랬고 채움 없음). 예전 6 이상은 새 10
function migrateGlassLevel(o) {
  if (o.glassLevel == null && typeof o.frostLevel === "number") {
    o.glassLevel = Math.min(10, 5 + Math.max(0, Math.round(o.frostLevel)));
  }
  delete o.frostLevel;
}

// 이 플러그인이 맞춰진 테마 이름. 이 테마가 켜져 있을 때만 동작한다 (사용자 요청)
const THEME_NAME = "Glass Shelf";

module.exports = class GlassShelfPlugin extends Plugin {
  // 지금 테마가 Glass Shelf 인가 (Obsidian 이 고른 테마 이름)
  themeOn() {
    const cc = this.app.customCss;
    return !!cc && cc.theme === THEME_NAME;
  }

  async onload() {
    // 테마가 바뀌면(켜짐·꺼짐) 플러그인을 다시 불러 동작을 켜고 끈다. 끌 때의 정리는 onunload 가 맡는다
    this.coreOn = this.themeOn();
    this.registerEvent(
      this.app.workspace.on("css-change", () => {
        if (this.themeOn() !== this.coreOn) this.reloadSelf();
      })
    );
    if (!this.coreOn) return;
    // 공유 설정: 플러그인 폴더의 data.json (동기화되어 모든 기기가 같이 쓴다)
    const raw = (await this.loadData()) || {};
    migrateGlassLevel(raw);
    this.shared = Object.assign({}, DEFAULTS, raw);
    delete this.shared.frost; // 예전 0~100 값은 버린다
    delete this.shared.hoverSize; // 예전 0~10 단계 값은 버린다
    this.settings = this.shared;
    try {
      if (typeof this.app.saveLocalStorage === "function") for (const k of OLD_DEVICE_KEYS) this.app.saveLocalStorage(k, null);
    } catch {
      // 지우지 못해도 쓰지 않으므로 상관없다
    }
    this.addSettingTab(new GlassShelfSettingTab(this.app, this));

    this.segWatched = new WeakSet();
    this.tabsWatched = new WeakSet();
    this.observers = [];
    this.docs = new Set();
    this.refractor = new Refractor();
    this.attachDoc(document);
    this.applySettings();
    // 리본 여닫기 애니메이션: 왼쪽 패널이 실제로 열리고 닫힐 때만 잠깐 켠다 (CSS: body.lg-rib-anim). 모바일은 리본이 서랍 안이라 없다
    if (!Platform.isMobile) {
      const wsEl = this.app.workspace.containerEl;
      let open = wsEl.hasClass("is-left-sidedock-open");
      let timer = 0;
      // 오른쪽 패널이 열려 있음을 body 에 알린다 (CSS: body.lg-right-open, 창 제어 알약 색).
      // 테마가 body:has(.workspace.is-right-sidedock-open) 로 직접 보던 것. body 의 :has 는 문서 전체 요소에 표시를 남겨,
      // 파일 탐색기에서 끌 때마다 다시 판정하느라 렉이 걸렸다(추정). 표시는 남아 테마를 꺼도 재시작 전까지 느렸다
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
      // 편집창에 포커스가 있음을 body 에 알린다 (CSS: body.lg-editing, 패널 목록 글자 흐리게). 위와 같은 이유로 :has 대신
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

    this.setupFolderColors(raw);

    const refresh = () => this.requestRefresh();
    this.app.workspace.onLayoutReady(refresh);
    this.registerEvent(this.app.workspace.on("layout-change", refresh));
    this.registerEvent(this.app.workspace.on("active-leaf-change", refresh));
    this.registerEvent(this.app.workspace.on("file-open", refresh));
    this.registerEvent(this.app.workspace.on("css-change", refresh));
    this.registerEvent(this.app.workspace.on("css-change", () => {
      for (const doc of this.docs) this.applyFolderColor(doc);
    }));
    // 탭 줄 축소: 파일을 열거나 탭을 바꾸면 그 탭 묶음의 탭 줄을 다시 편다
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
    this.registerEvent(this.app.workspace.on("window-open", (win) => win && win.doc && this.attachDoc(win.doc)));

    // 설정 창은 별도 창(다른 document)으로 뜬다. 열려 있으면 그 창에도 같은 동작을 붙인다
    this.registerInterval(
      window.setInterval(() => {
        const st = this.app.setting;
        const cands = [
          st && st.popout && st.popout.win && st.popout.win.document,
          st && st.containerEl && st.containerEl.isConnected && st.containerEl.ownerDocument,
          typeof activeDocument !== "undefined" && activeDocument,
        ];
        for (const d of cands) if (d && d.body) this.attachDoc(d);
        for (const d of this.docs) this.modalRefract(d);
        if (!Platform.isPhone) this.app.workspace.getLeavesOfType("kanban").forEach((l) => this.setupKanban(l.view));
        // 닫힌 창은 목록에서 뺀다
        for (const d of this.docs) if (d !== document && (!d.defaultView || d.defaultView.closed)) this.docs.delete(d);
      }, 500)
    );
  }

  // 설정 창 검색창 굴절 (사용자 요청). 설정 창은 별도 창으로도 떠서 refresh() 가 보지 않으므로 창마다 따로 건다.
  // 이미 걸려 있으면 attach 가 바로 돌아온다
  modalRefract(doc) {
    if (!this.refractOn() || !doc.body) return;
    doc.querySelectorAll(".modal.mod-settings .setting-search-container input").forEach((el) => this.refractor.attach(el, 26, false));
  }

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
      /* 창이 닫히는 중이면 무시 */
    }
  }

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
    // 커서 아래의 패널 스크롤 영역
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
      if (!e.relatedTarget) end(); // 창 밖으로
    });
  }

  attachDoc(doc) {
    if (this.docs.has(doc)) return;
    this.docs.add(doc);
    try {
      this.attachDocInner(doc);
    } catch (err) {
      console.error("[glass-shelf] attach-fail", err);
    }
  }

  attachDocInner(doc) {
    const win = doc.defaultView || window;
    if (!Platform.isMobile) this.attachDragScroll(doc, win);
    this.applyBodyState(doc);

    // 파일 탐색기를 마지막으로 눌렀으면 body 에 lg-explorer-on 을 붙인다 (CSS: 선택한 문서가 강조색으로 빛난다).
    // 편집창이나 다른 패널을 누르면 뗀다. 메뉴·창(모달)·알림을 누를 때는 그대로 둔다 (우클릭 메뉴 등).
    // 파일을 누르면 Obsidian 이 편집창을 활성 칸으로 바꾸므로 활성 칸(.mod-active)이 아니라 마지막으로 누른 곳을 본다
    this.registerDomEvent(
      doc,
      "pointerdown",
      (e) => {
        const t = e.target;
        if (!(t instanceof win.Element) || t.closest(".menu, .modal-container, .notice-container, .tooltip")) return;
        doc.body.classList.toggle("lg-explorer-on", !!t.closest('.workspace-leaf-content[data-type="file-explorer"]'));
      },
      true
    );
    this.register(() => doc.body.classList.remove("lg-explorer-on"));

    // 편집창 스크롤로 탭 줄 접기·펴기 (데스크톱·태블릿)
    if (!Platform.isPhone) this.registerDomEvent(doc, "scroll", (e) => this.onMiniScroll(e.target), { capture: true, passive: true });

    // 상태 표시줄(오른쪽 아래에 떠 있는 동기화·백링크·글자 수 알약)이 창 아래에서 차지하는 높이를 body 에 알린다
    // (CSS: --lg-status-h, 오른쪽 패널의 그래프 설정 창이 그 밑으로 내려가지 않게). 비어 있으면 0
    if (!Platform.isMobile) {
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

    // 창 제어 알약 위에 커서가 있는 동안 body 에 lg-wc-hover 를 붙인다 (밑에 겹친 오른쪽 패널 토글을 꺼 두는 데 쓴다).
    // 알약에서 벗어난 뒤 0.15초 늦게 뗀다: 호버가 잠깐 끊겨도 밑 버튼이 커서를 가로채지 못하게 하는 여유다
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
        // 다 줄어든 뒤(테마 전환 260ms) 작은 크기 굴절로 바꾼다. 줄어드는 동안은 큰 지도를 그대로 둔다
        wcTimer = win.setTimeout(() => this.wcRefract(doc, false), 160);
      }, 150);
    }, { passive: true });

    // 호버 유리가 커서 쪽으로 끌려가게: 요소 중심에서 커서까지의 거리 일부를 넘겨준다.
    // 실제 움직임은 테마의 튕기는 곡선(transition)이 맡는다
    let magnetEl = null;
    let magnetFrame = null;
    let lastMove = null;
    // 버튼 자리는 올라갈 때 한 번 재 두고 커서가 움직이는 동안 다시 쓴다.
    // (움직일 때마다 재면 그때마다 브라우저가 밀린 스타일 계산을 먼저 치러야 한다)
    // 스크롤·창 크기 변화가 있거나 0.5초가 지나면 다시 잰다
    let magnetRect = null;
    let magnetAt = 0;
    const dropRect = () => {
      magnetRect = null;
    };
    this.registerDomEvent(doc, "scroll", dropRect, { capture: true, passive: true });
    this.registerDomEvent(win, "resize", dropRect, { passive: true });
    // 끌림 기준 자리. 넓어진 칸반 검색 버튼은 왼쪽 돋보기 자리(정사각형)를 기준으로 끈다 (호버 유리도 그 자리에 뜬다, 테마)
    const magnetBox = (el) => {
      const q = el.getBoundingClientRect();
      if (!el.matches(".lg-kb-searching .lg-kb-search-btn")) return q;
      return { left: q.left, top: q.top, width: q.height, height: q.height };
    };
    const resetMagnet = (el) => {
      if (!el) return;
      el.style.removeProperty("--lg-mx");
      el.style.removeProperty("--lg-my");
      el.style.removeProperty("--lg-refract-h");
    };
    // 터치에서는 손가락을 떼면 pointermove 가 더 오지 않아 끌려간 자리에 멈춘다. 모바일에서는 달지 않는다 (사용자 요청)
    if (!Platform.isMobile) this.registerDomEvent(
      doc,
      "pointermove",
      (e) => {
        lastMove = e;
        if (magnetFrame) return;
        magnetFrame = win.requestAnimationFrame(() => {
          magnetFrame = null;
          const ev = lastMove;
          const el = isEl(ev.target) ? ev.target.closest(HOVER_GLASS) : null;
          if (el !== magnetEl) {
            resetMagnet(magnetEl);
            magnetEl = el;
            magnetRect = null;
            if (el) {
              // 먼저 자리를 재고(읽기) 그다음 굴절을 건다(쓰기): 읽기·쓰기가 번갈지 않게
              magnetRect = magnetBox(el);
              magnetAt = win.performance.now();
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
          const nx = Math.max(-1, Math.min(1, (ev.clientX - (r.left + r.width / 2)) / (r.width / 2)));
          const ny = Math.max(-1, Math.min(1, (ev.clientY - (r.top + r.height / 2)) / (r.height / 2)));
          const mx = nx * Math.min(7, r.width * 0.12);
          const my = ny * Math.min(4, r.height * 0.14);
          el.style.setProperty("--lg-mx", `${mx.toFixed(1)}px`);
          el.style.setProperty("--lg-my", `${my.toFixed(1)}px`);
        });
      },
      { passive: true }
    );
    this.register(() => resetMagnet(magnetEl));

    // 스크롤하는 동안만 스크롤바를 보인다
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

    // 클릭 효과 (누를 때만)
    this.registerDomEvent(
      doc,
      "pointerdown",
      (e) => {
        if (e.button !== 0 || !isEl(e.target)) return;
        // 메뉴 항목: 메뉴 판 안에서 누른 자리부터 알약 안 버튼과 같은 흰 빛이 퍼진다 (사용자 요청).
        // 누르는 순간 이미 반쯤 퍼져 있고(MENU_RIPPLE_FROM), 다 퍼지면 메뉴 판 전체를 덮는다(누른 자리에서 가장 먼 모서리까지)
        const menuItem = e.target.closest(".menu .menu-item:not(.is-disabled):not(.is-label)");
        if (menuItem) {
          const menu = menuItem.closest(".menu");
          const m = menu.getBoundingClientRect();
          const far = Math.hypot(Math.max(e.clientX - m.left, m.right - e.clientX), Math.max(e.clientY - m.top, m.bottom - e.clientY));
          // 흰 빛은 반지름의 80% 에서 투명해지므로 그만큼 크게
          return this.pressRipple(menu, e, (far * 2) / 0.8, "lg-ripple-menu", true, MENU_RIPPLE_FROM);
        }
        const kbAdd = e.target.closest(".kanban-plugin__new-item-button");
        if (kbAdd) return this.pressKanbanAdd(kbAdd);
        if (Platform.isMobile && this.pressMobile(e.target)) return;
        const pop = e.target.closest(PRESS_POP);
        // 칸반 검색 버튼: 흰 빛이 열리는(닫히는) 쪽으로 퍼진다
        const kbSearch = e.target.closest(".lg-kb-search-btn");
        if (kbSearch) return this.pressKbSearch(kbSearch);
        if (pop) {
          const anims = this.pressPop(pop);
          if (pop.matches(PANEL_TOGGLES)) this.handoffPop(pop, anims);
          return;
        }
        // 검색 탭 검색창: 처음 누를 때(아직 입력 중이 아닐 때) 알약이 커지며 하얘졌다 돌아온다
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
        // 패널 탭: 효과 없음 모드에서는 알약 안 버튼과 같은 흰 빛이 탭 가운데에서 퍼진다 (사용자 요청, 렌즈 모드는 렌즈가 대신한다)
        else if (this.settings.tabAnim === "none") {
          const tab = e.target.closest(":is(.mod-left-split, .mod-right-split) .workspace-tab-header-container .workspace-tab-header");
          if (tab) {
            // 누르는 순간 이미 탭 버튼 크기만큼 퍼져 있다 (사용자 요청, 메뉴처럼). 다 퍼진 크기는 알약 높이 × TAB_RIPPLE_K
            const pill = tab.closest(PRESS_PILL);
            const d = (pill ? pill.offsetHeight : tab.offsetHeight) * TAB_RIPPLE_K;
            const from = Math.min(1, Math.max(tab.offsetWidth, tab.offsetHeight) / d);
            this.pressRipple(tab, e, d, "lg-ripple-tab", true, from.toFixed(3));
          }
        }
      },
      { capture: true }
    );

    // 칸반 목록 접기·펴기 (테마 Kanban 연동)
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

    // 메뉴(··· · 보관함 전환 · 우클릭): 누른 곳에서 커지며 나타나고, 닫힐 때는 그 자리로 줄며 사라진다
    let lastPress = null;
    this.registerDomEvent(
      doc,
      "pointerdown",
      (e) => {
        lastPress = { x: e.clientX, y: e.clientY, t: win.performance.now(), target: e.target };
      },
      { capture: true, passive: true }
    );
    // 태블릿의 길게 누르기(우클릭 메뉴)는 누른 지 한참 뒤에 메뉴가 떠 누른 기록이 오래된다. 메뉴를 부른 순간을 누른 때로 다시 적는다
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
          // 휴대폰 메뉴는 아래에서 올라오는 시트라 데스크톱 팝업 애니메이션을 걸지 않는다 (태블릿은 팝업이라 건다)
          if (isMenu(n)) {
            // 모바일: 길게 누르기로 부른 메뉴는 Obsidian 이 열린 메뉴를 닫지 않아(데스크톱은 우클릭·누름이 닫는다) 겹쳐 쌓였다.
            // 방금 누른 곳이 메뉴 안이 아니면(하위 메뉴가 아니면) 새 메뉴 자리를 누른 것처럼 알려 다른 메뉴를 닫는다.
            // 새 메뉴는 아직 준비 전(_loaded 전)이라 이 알림에 닫히지 않는다
            const pt = lastPress && lastPress.target;
            if (Platform.isMobile && !(isEl(pt) && pt.closest(".menu")) &&
              Array.from(doc.querySelectorAll(".menu")).some((m) => m !== n && !m.classList.contains("lg-menu-ghost"))) {
              this.tellMenus(n, "click");
            }
            if (!Platform.isPhone) this.setupMenu(n, lastPress);
          }
          else if (isEl(n) && n.classList.contains("mod-search-suggestion")) this.attachSearchSuggest(n, doc);
          else if (isEl(n) && n.classList.contains("modal-container")) this.modalRefract(doc);
        }
        for (const n of r.removedNodes) if (isMenu(n) && !Platform.isPhone) this.closeMenu(n, doc);
      }
    });
    menuObs.observe(doc.body, { childList: true });
    this.observers.push(menuObs);

    // 편집창 탭을 마우스로 닫으면 Obsidian 은 커서가 탭 줄을 벗어날 때까지 탭 폭을 고정해 둔다(lockTabWidths).
    // 사용자 요청으로 닫은 뒤 바로 풀리게, 닫는 전환(240ms)이 끝나면 탭 줄에 mouseleave 를 보내 Obsidian 이 스스로 풀게 한다
    const unlockTabs = (e) => {
      if (!isEl(e.target)) return;
      const close = e.target.closest(".mod-root .workspace-tab-header-inner-close-button");
      const middle = e.type === "auxclick" && e.button === 1 && e.target.closest(".mod-root .workspace-tab-header");
      if (!close && !middle) return;
      const bar = (close || middle).closest(".workspace-tab-header-container");
      if (!bar) return;
      // 닫는 탭이 줄어드는 동안 남은 탭이 같이 넓어지게 바로 푼다 (Obsidian 이 고정한 직후). 닫는 전환이 끝난 뒤 풀면
      // 닫힌 탭 폭만큼 탭 줄이 줄었다가 다시 늘어났다
      win.setTimeout(() => bar.isConnected && bar.dispatchEvent(new win.MouseEvent("mouseleave")), 0);
    };
    // 캡처 단계로 듣는다: Obsidian 의 닫기 버튼 처리가 이벤트 전파를 막으면 문서까지 올라오지 않는다
    this.registerDomEvent(doc, "click", unlockTabs, { capture: true, passive: true });
    this.registerDomEvent(doc, "auxclick", unlockTabs, { capture: true, passive: true });

    // 그래프 설정 창 열기·닫기: Obsidian 이 바꾸기 전에(캡처 단계) 지금 모습을 떠 둔다.
    // 창이 퍼져 나오는 애니메이션은 테마(CSS)가 맡는다
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

    // 토글: Obsidian 토글은 클릭 시 change, 키보드(스페이스·엔터) 시 keydown 으로 바뀐다.
    // 둘 다 문서까지 올라왔을 때는 이미 켜짐 상태가 바뀐 뒤라, 그 자리에서 렌즈 애니메이션을 건다.
    // 페이지를 열 때 값이 채워지는 경우는 이벤트가 없어 애니메이션도 없다
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

    // 슬라이더: CSS 는 값을 읽지 못하므로 채움 비율(--lg-sl-n, 0~1)을 넣어 준다.
    // 끌 때는 input, 새로 그려질 때는 테마가 거는 짧은 애니메이션(lg-sl-born)의 시작으로 안다
    const syncSlider = (el) => {
      if (!isEl(el) || el.type !== "range") return;
      const min = parseFloat(el.min) || 0;
      const max = el.max === "" ? 100 : parseFloat(el.max);
      const n = max > min ? (parseFloat(el.value) - min) / (max - min) : 0;
      el.style.setProperty("--lg-sl-n", Math.max(0, Math.min(1, n || 0)).toFixed(4));
      if (el.lgLens) el.lgLens.place();
    };
    // 누르는 동안 손잡이 자리에 렌즈를 띄운다 (손잡이에는 굴절이 먹지 않는다)
    this.registerDomEvent(
      doc,
      "pointerdown",
      (e) => {
        const el = e.target;
        if (e.button !== 0 || !isEl(el)) return;
        // 토글: 누르고 있는 동안의 렌즈(테마 :active)에도 굴절을 건다. 손잡이 상자 크기로 지도를 구워 변수로 넘긴다
        const tg = el.closest(".checkbox-container");
        if (tg && this.refractOn() && !tg.style.getPropertyValue("--lg-tg-refract")) {
          const cs = win.getComputedStyle(tg);
          const KX = parseFloat(cs.getPropertyValue("--lg-tg-kx")) || 1;
          const KY = parseFloat(cs.getPropertyValue("--lg-tg-ky")) || 1;
          const pad = parseFloat(cs.getPropertyValue("--lg-tg-pad")) || 2;
          const tw = parseFloat(cs.getPropertyValue("--lg-tg-thumb")) || 32;
          const th = tg.clientHeight - pad * 2;
          tg.style.setProperty("--lg-tg-refract", `url(#${this.refractor.filterFor(Math.round(tw * KX), Math.round(th * KY), 42, false, true, doc, undefined, undefined, LENS_TOGGLE)})`);
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

    // 패널 탭을 누르면 Obsidian 이 고른 탭을 탭 줄 맨 앞으로 스크롤하고, ··· 가 접히거나 펴지며 알약 폭이 바뀌어도
    // 스크롤이 밀린다. 누른 탭이 다 보이던 중이면 화면에서 그 자리에 그대로 두고,
    // 반쯤 가려져 있었으면 다 보이는 만큼만 스크롤한다. ··· 전환이 끝날 때까지(0.4초) 매 프레임 맞춘다
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
        const tr = tab.getBoundingClientRect();
        const pad = parseFloat(win.getComputedStyle(inner).paddingLeft) || 0;
        // 다 보이던 탭은 지금 화면 x 에 둔다. 가려진 쪽(side)이 있으면 그쪽 알약 가장자리 안쪽에 맞춘다
        const screenX = tr.left;
        let side = 0;
        if (tr.left < ir.left + pad - 0.5) side = -1;
        else if (tr.right > ir.right - pad + 0.5) side = 1;
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

    // 할 일 체크박스: 켜질 때·꺼질 때 애니메이션. 편집기·읽기 보기가 체크박스를 새로 그려 바꿔 끼우기도 하므로
    // 잠깐(0.6초) 누른 자리의 체크박스를 지켜보다가 새것이 나타나면 거기서 이어서 재생한다
    this.registerDomEvent(
      doc,
      "click",
      (e) => {
        const cb = isEl(e.target) && e.target.closest("input.task-list-item-checkbox");
        if (!cb) return;
        const x = e.clientX;
        const y = e.clientY;
        const t0 = win.performance.now();
        let cur = cb;
        cb.lgTaskDone = false;
        // 누름: 작아졌다가 되돌아온다. 편집기가 체크박스를 바꿔 끼우면 새것에서 이어서 (아래 tick).
        // transform 으로 걸어 CSS 의 커짐(scale)·끌림(translate)과 곱해진다
        const press = (el, at) => {
          const p = el.animate([{ transform: "scale(1)" }, { transform: "scale(0.82)", offset: 0.35 }, { transform: "scale(1)" }], { duration: TASK_PRESS_MS, easing: "cubic-bezier(0.3, 0, 0.3, 1)" });
          if (at > 0) p.currentTime = at;
        };
        press(cb, 0);
        // 마우스로 눌렀으면 커서가 위에 있다 (편집기가 체크박스를 새로 그려 바꾸면 새것은 커서가 움직이기 전까지 :hover 가 아니다)
        const hov = e.detail > 0 && (!e.pointerType || e.pointerType === "mouse");
        // 끌 때는 누른 순간부터 호버 유리를 숨긴다 (애니메이션은 다음 프레임에 시작해, 그 사이 호버가 먼저 나타났다)
        if (!cb.checked && hov) cb.classList.add("lg-task-hold");
        const tick = () => {
          const elapsed = win.performance.now() - t0;
          if (!cur.isConnected) {
            const hit = doc.elementFromPoint(x, y);
            const next = hit && hit.closest && hit.closest("input.task-list-item-checkbox");
            if (next) {
              cur = next;
              if (elapsed < TASK_PRESS_MS) press(cur, elapsed);
            }
          }
          if (cur.isConnected && !cur.lgTaskDone) {
            cur.lgTaskDone = true;
            this.animateTask(cur, cur.checked, elapsed, hov);
          }
          if (elapsed < 600) win.requestAnimationFrame(tick);
        };
        win.requestAnimationFrame(tick);
      },
      true
    );
    this.registerDomEvent(doc, "keydown", (e) => {
      if ((e.key === " " || e.key === "Enter") && isEl(e.target) && e.target.classList.contains("checkbox-container")) {
        onToggle(e.target);
      }
    });

    // 별도 창: 창이나 왼쪽 요소의 크기가 바뀔 때만 창 제목 위치를 다시 잰다
    if (doc !== document) {
      const ro = new win.ResizeObserver(() => this.placeTitle(doc));
      ro.observe(doc.body);
      const left = doc.querySelector(".mod-community-modal .community-modal-search, .modal.mod-settings .vertical-tab-header");
      if (left) ro.observe(left);
      this.register(() => ro.disconnect());
    }
  }

  // 단독 원형 버튼: 유리 층이 흰색으로 바뀌며 커졌다가 제자리로
  // 흰색 피크 동안 호버 유리를 거의 투명하게 해 흰 빛이 가려지지 않게 한다
  fadeHover(el, opt) {
    return el.animate(
      [
        { offset: 0.2, opacity: 0.08 },
        { offset: 0.55, opacity: 0.08 },
      ],
      { ...opt, pseudoElement: "::before" }
    );
  }

  // k: 가장 클 때 배율 (기본 1.28)
  pressPop(el, k = 1.28) {
    try {
      const hover = this.fadeHover(el, { duration: 600, easing: EASE.press });
      // 가운데쯤 흰 원이 되어 잠깐(약 0.08초) 머문다 (광택은 사라지고 테두리는 남는다)
      const pop = el.animate(
        [
          { offset: 0.34, transform: `scale(${k})`, backgroundColor: PRESS_WHITE, backgroundImage: "none" },
          { offset: 0.46, transform: `scale(${k})`, backgroundColor: PRESS_WHITE, backgroundImage: "none" },
        ],
        { duration: 600, easing: EASE.press, pseudoElement: "::after" }
      );
      return [hover, pop];
    } catch (err) {
      console.error("[glass-shelf] pop", err);
      return [];
    }
  }

  // 패널 토글은 누르면 패널과 함께 가려지고 다른 자리의 토글이 나타난다.
  // 누른 버튼이 가려지면, 새로 보이는 같은 쪽 토글이 흰 빛 효과를 같은 진행 시점부터 이어받는다
  handoffPop(el, anims) {
    const doc = el.ownerDocument;
    const win = doc.defaultView || window;
    const t0 = win.performance.now();
    const side = el.closest(".sidebar-toggle-button.mod-left, .lg-panel-toggle-left") ? "left" : "right";
    const sel =
      side === "left"
        ? ".sidebar-toggle-button.mod-left .clickable-icon, .lg-panel-toggle-left"
        : ".sidebar-toggle-button.mod-right .clickable-icon, .lg-panel-toggle:not(.lg-panel-toggle-left)";
    const shown = (n) => n.isConnected && n.getClientRects().length > 0 && !n.closest(".is-sidedock-collapsed");
    // 패널이 여닫히며 화면이 다시 짜이면 유리 층(::after)이 새로 만들어져 걸려 있던 효과가 떨어져 나간다.
    // 효과 중(크기가 1보다 커야 할 때)인데 변형이 없으면, 새 유리 층에 같은 진행 시점부터 다시 건다
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
      const next = Array.from(doc.querySelectorAll(sel)).find((n) => n !== el && shown(n));
      if (!next) return win.requestAnimationFrame(tick);
      anims.forEach((a) => a && a.cancel());
      // 왼쪽 리본에 나타난 토글은 흰 빛을 이어받지 않는다 (사용자 요청: 누른 버튼에서만 보이게)
      if (next.closest(".workspace-ribbon")) return;
      this.pressPop(next).forEach((a) => a && (a.currentTime = t));
    };
    win.requestAnimationFrame(tick);
  }

  // 누른 버튼이 든 컨테이너 알약이 통째로 커졌다가 돌아온다 (알약이 클수록 조금만)
  pressScale(el) {
    try {
      const pill = el.closest(PRESS_PILL);
      if (!pill) return;
      const r = pill.getBoundingClientRect();
      // 효과 없음 모드의 패널 탭은 다른 알약과 같은 값으로 커지고 하얘진다 (사용자 요청)
      const tab = el.matches(".workspace-tab-header") && this.settings.tabAnim !== "none";
      // 패널 탭 줄은 커지는 정도를 TAB_PRESS_K 배로 줄인다 (사용자 요청)
      const k = 1 + Math.min(0.2, 16 / Math.max(r.width, r.height, 1)) * (tab ? TAB_PRESS_K : 1);
      const opt = { duration: 570, easing: EASE.press };
      pill.animate([{ offset: 0.34, scale: k.toFixed(3) }, { offset: 0.46, scale: k.toFixed(3) }], opt);
      // 패널 탭은 커졌다 줄어들기만 한다 (흰 빛 없음)
      if (tab) return;
      this.fadeHover(el, opt);
      // 알약 전체를 흰색으로 칠하던 것은 뺐다: 누른 버튼과 그 근처만 밝아지게 (사용자 요청). 그 빛은 pressRipple 이 그린다
    } catch (err) {
      console.error("[glass-shelf] scale", err);
    }
  }

  // ---------- Kanban 연동 (테마 Kanban 절과 짝) ----------
  setupKanban(view) {
    const root = view && view.containerEl;
    if (!root || !root.isConnected) return;
    const acts = root.querySelector(":scope > .view-header .view-actions");
    if (acts) {
      this.groupKanbanActions(acts);
      // Kanban 은 보드 설정이 바뀌면 버튼을 지우고 다시 단다
      if (!acts.lgKbObs) {
        const win = acts.ownerDocument.defaultView || window;
        const obs = new win.MutationObserver(() => this.groupKanbanActions(acts));
        obs.observe(acts, { childList: true });
        acts.lgKbObs = obs;
        this.observers.push(obs);
      }
    }
    const board = root.querySelector(".kanban-plugin");
    if (board && !board.lgKbObs) {
      const win = board.ownerDocument.defaultView || window;
      const obs = new win.MutationObserver(() => this.kanbanSearch(root, board));
      obs.observe(board, { childList: true });
      board.lgKbObs = obs;
      this.observers.push(obs);
      this.kanbanSearch(root, board);
      const formObs = new win.MutationObserver((ms) => {
        this.kanbanFormBack(board);
        this.kanbanLaneForm(root, ms);
      });
      formObs.observe(board, { childList: true, subtree: true });
      this.observers.push(formObs);
    }
  }

  // 세 버튼을 알약(.lg-kb-group) 하나로 묶는다. 버튼은 원래 것을 그대로 옮겨 Kanban 동작이 그대로다.
  // 이미 묶여 있으면 아무것도 옮기지 않는다 (옮기면 지켜보기가 다시 불려 끝없이 돈다)
  groupKanbanActions(acts) {
    const all = Array.from(acts.querySelectorAll(".view-action"));
    const btns = KB_GROUP_ICONS.map((ic) => all.find((b) => b.querySelector("svg." + ic))).filter(Boolean);
    let g = acts.querySelector(":scope > .lg-kb-group");
    if (!btns.length) {
      if (g) g.remove();
    } else {
      if (!g) g = createDiv({ cls: ["lg-kb-group", INJECTED] });
      if (btns[0].parentElement === acts) acts.insertBefore(g, btns[0]);
      else if (g.parentElement !== acts) acts.prepend(g);
      const kids = Array.from(g.children);
      if (kids.length !== btns.length || kids.some((c, i) => c !== btns[i])) btns.forEach((b) => g.appendChild(b));
    }
    const search = all.find((b) => b.querySelector("svg.lucide-search"));
    if (search) search.classList.add("lg-kb-search-btn");
  }

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
  }

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
      // 목록 유리판과 같은 채움·글자색에서 시작한다
      const cs = win.getComputedStyle(lane);
      // 키프레임이 하나면 끝 값으로 쳐지므로 시작(offset 0)이라고 적는다
      btn.animate([{ offset: 0, backgroundColor: cs.backgroundColor, color: cs.color }], { duration: 320, easing: EASE.settle });
    });
  }

  // 칸반 검색 버튼을 누르면: 알약 안 버튼과 같은 흰 빛이, 열 때는 넓어지는 쪽(왼쪽)으로, 닫을 때는 줄어드는 쪽(오른쪽)으로
  // 돋보기를 따라 움직이며 퍼진다 (사용자 요청). 버튼은 오른쪽 끝이 고정된 채 넓어지므로 빛 자리를 오른쪽 끝에서 잰다
  pressKbSearch(btn) {
    try {
      const doc = btn.ownerDocument;
      const win = doc.defaultView || window;
      const opening = !btn.closest(".lg-kb-searching");
      const h = btn.offsetHeight;
      const wide = parseFloat(win.getComputedStyle(btn).getPropertyValue("--lg-kb-search-w")) || 240;
      const near = h / 2; // 접힌 버튼(돋보기) 가운데
      const far = wide - h / 2; // 넓어진 알약의 돋보기 자리
      // 열 때는 오른쪽 끝(넓어져도 제자리)에 머문 채 퍼진다. 돋보기를 따라 움직이면 빛이 돋보기에서 나오는 것처럼 보였다 (사용자 지적)
      const [a, b] = opening ? [0, 0] : [far, near];
      this.fadeHover(btn, { duration: 600, easing: EASE.press });
      // 버튼이 통째로(유리·기호·호버·흰 빛 함께) 살짝 커졌다 돌아온다. 넓을수록 덜 커진다.
      // 유리 층만 키우면 테두리만 따로 부풀어 보였다 (사용자 지적). 누를 때 작아지는 transform 과 겹치지 않게 scale 속성으로 건다
      const bw = btn.offsetWidth;
      const k = (1 + Math.min(0.1, 8 / Math.max(bw, h, 1))).toFixed(3);
      btn.animate(
        [
          { offset: 0.34, scale: k },
          { offset: 0.46, scale: k },
        ],
        { duration: 600, easing: EASE.press }
      );
      const wrap = doc.createElement("span");
      wrap.className = "lg-ripple";
      const dot = doc.createElement("span");
      dot.className = "lg-ripple-dot";
      dot.style.top = `${h / 2}px`;
      // 열 때는 넓어진 알약 왼쪽 끝까지 닿게 (흰 빛은 반지름의 80% 에서 투명해지므로 그만큼 크게, 사용자 요청)
      const d = opening ? (wide * 2) / 0.8 : h * RIPPLE_K;
      dot.style.width = dot.style.height = `${d}px`;
      wrap.appendChild(dot);
      btn.prepend(wrap);
      const anim = dot.animate(
        [
          { offset: 0, right: `${a}px`, transform: "translate(50%, -50%) scale(0)", opacity: 1 },
          { offset: RIPPLE_HOLD, opacity: 1 },
          { offset: 1, right: `${b}px`, transform: "translate(50%, -50%) scale(1)", opacity: 0 },
        ],
        { duration: 640, easing: EASE.burst, fill: "both" }
      );
      const done = () => wrap.remove();
      anim.onfinish = done;
      anim.oncancel = done;
    } catch (err) {
      console.error("[glass-shelf] kanban-search", err);
    }
  }

  // 목록 추가 창 (보드 위 + 버튼): 보관함 전환 메뉴와 같은 애니메이션 (사용자 요청). 버튼 묶음 알약이 창의 오른쪽 위 꼭짓점에 오고,
  // 알약은 좌우로 좁아져 원이 되며 창 가운데로 돌진해 사라지고 그 지점에서 창이 넓어져 나온다. 닫히면 반대로.
  // 창은 보드 안에 그려지는데 보드(contain)와 보기 내용(스크롤 상자)이 밖을 잘라, 여는 동안 보드의 제한을 푼다(테마 .lg-kb-laneform)
  kanbanLaneForm(root, ms) {
    const sel = ".kanban-plugin__lane-form-wrapper";
    const find = (n) => (isEl(n) ? (n.matches(sel) ? n : n.querySelector(sel)) : null);
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
  }

  laneFormOpen(root, form) {
    try {
      // 보관함 전환 메뉴와 똑같이: + 가 든 버튼 묶음 알약이 좌우로 좁아져 원이 되며 창 가운데로 돌진해 사라지고,
      // 그 지점에서 창이 넓어져 나온다 (사용자 요청)
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
      // Kanban 이 창(안의 편집기)을 만들고 포커스를 주느라 화면이 잠깐 멈춘다. 애니메이션이 그 멈춤에 끊기지 않게
      // 창을 숨겨 두고 두 프레임 뒤에 시작한다 (사용자 요청)
      form.classList.add("lg-invisible");
      const go = () => {
        form.classList.remove("lg-invisible");
        if (!form.isConnected) return;
        form.lgMorph = { ux, uy, dot, src };
        if (src.lgHide) src.lgHide.cancel();
        src.lgHide = this.dashOut(src, ux, uy);
        // 창이 작은 동안 안의 내용이 따라 줄지 않게 크기를 잠시 고정하고, 창 밖으로 나온 부분은 자른다
        const kids = Array.from(form.children).map((el) => ({ el, anchor: "right" }));
        kids.forEach((k) => this.pinSize(k.el));
        form.classList.add("lg-clip");
        // 알약이 좁아지는 모습이 창에 가리지 않게, 거의 다 줄어든 뒤에 창이 나온다
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
  }

  laneFormClose(root, form) {
    const mo = form.lgMorph;
    form.lgMorph = null;
    if (!root.querySelector(".kanban-plugin__lane-form-wrapper")) root.classList.remove("lg-kb-laneform");
    if (!mo) return;
    const { ux, uy, dot, src } = mo;
    try {
      if (!root.isConnected || !src.isConnected) return;
      // 사본은 보드 밖(보기 전체)에 띄운다: 위치 기준이 같고(.lg-kb-laneform 동안 보드는 위치 기준이 아니다) Kanban 이 그리는 곳을 건드리지 않는다
      const ghost = form.cloneNode(true);
      ghost.classList.add("lg-kb-ghost");
      root.appendChild(ghost);
      const win = root.ownerDocument.defaultView || window;
      win.setTimeout(() => ghost.remove(), 900);
      const mr = parseFloat(win.getComputedStyle(ghost).borderTopLeftRadius) || 22;
      const full = { left: ghost.offsetLeft, top: ghost.offsetTop, width: ghost.offsetWidth, height: ghost.offsetHeight, radius: mr };
      const kids = Array.from(ghost.children).map((el) => ({ el, anchor: "right" }));
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
  }

  // 목록 접기·펴기: Kanban 은 접으면 카드 줄을 지우고 펴면 다시 그린다. 누를 때 크기를 재 두고, 다시 그려지면
  // 예전 크기에서 새 크기로 움직인다. 펼 때는 다시 나온 카드 줄이 서서히 나타난다
  animateLaneCollapse(btn) {
    const wrap = btn.closest(".kanban-plugin__lane-wrapper");
    const lane = wrap && wrap.querySelector(":scope > .kanban-plugin__lane");
    if (!lane) return;
    const win = wrap.ownerDocument.defaultView || window;
    const h0 = lane.offsetHeight;
    const w0 = lane.offsetWidth;
    const opening = wrap.matches(".collapse-vertical, .collapse-horizontal");
    const obs = new win.MutationObserver(() => {
      obs.disconnect();
      const ln = wrap.querySelector(":scope > .kanban-plugin__lane");
      if (!ln) return;
      const h1 = ln.offsetHeight;
      const w1 = ln.offsetWidth;
      const opt = { duration: KB_LANE_MS, easing: MINI_EASE };
      const frames = h0 !== h1 ? [{ height: `${h0}px` }, { height: `${h1}px` }] : w0 !== w1 ? [{ width: `${w0}px` }, { width: `${w1}px` }] : null;
      if (!frames) return;
      ln.classList.add("lg-clip");
      const a = ln.animate(frames, opt);
      const done = () => ln.classList.remove("lg-clip");
      a.onfinish = done;
      a.oncancel = done;
      if (opening) Array.from(ln.children).slice(1).forEach((k) => k.animate([{ opacity: 0 }, { opacity: 1 }], opt));
    });
    obs.observe(wrap, { attributes: true, attributeFilter: ["class"] });
    win.setTimeout(() => obs.disconnect(), 1000);
  }

  // 칸반 카드 추가 버튼 (테마 Kanban 연동): 다른 알약처럼 커지며 하얘졌다 돌아온다 (사용자 요청).
  // 누르면 Kanban 이 버튼을 입력 칸으로 바꿔 끼우므로, 입력 칸이 나타나면 같은 애니메이션을 같은 시점부터 이어받는다
  // (강조색 → 흰색 → 유리 흰색)
  pressKanbanAdd(btn) {
    try {
      const win = btn.ownerDocument.defaultView || window;
      const r = btn.getBoundingClientRect();
      const k = (1 + Math.min(0.2, 16 / Math.max(r.width, r.height, 1))).toFixed(3);
      const opt = { duration: 570, easing: EASE.press };
      const peak = { scale: k, backgroundColor: PRESS_WHITE, backgroundImage: "none" };
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
      win.setTimeout(() => obs.disconnect(), 1000);
    } catch (err) {
      console.error("[glass-shelf] kanban-add", err);
    }
  }

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
        white = !el.matches(".workspace-drawer-tab-options-list") || this.settings.tabAnim === "none";
        dur = 570;
      }
      const peak = { scale: k.toFixed(3) };
      if (white) Object.assign(peak, { backgroundColor: PRESS_WHITE, backgroundImage: "none" });
      el.animate([Object.assign({ offset: 0.34 }, peak), Object.assign({ offset: 0.46 }, peak)], {
        duration: dur,
        easing: EASE.press,
      });
      return true;
    } catch (err) {
      console.error("[glass-shelf] press-mobile", err);
      return false;
    }
  }

  // 검색 탭 검색창: 안의 내용까지 통째로 커졌다 돌아오고, 누른 자리 근처만 하얘진다
  pressField(el, e) {
    try {
      const r = el.getBoundingClientRect();
      // 메뉴가 열릴 때 살짝 더 커지는 정도(2%)만
      const k = 1.02;
      const opt = { duration: 570, easing: EASE.press };
      el.animate([{ offset: 0.34, scale: k.toFixed(3) }, { offset: 0.46, scale: k.toFixed(3) }], opt);
      // 누르자마자 뜨는 검색 제안도 같은 효과를 이어받게 기억해 둔다 (attachSearchSuggest)
      el.lgPress = { t: performance.now(), k, opt };
      this.pressRipple(el, e, r.height * 4.5, "lg-ripple-field");
    } catch (err) {
      console.error("[glass-shelf] field", err);
    }
  }

  // 알약 안 버튼: 누른 자리에서 흰 그라데이션이 퍼지며 사라진다
  // size: 흰 빛 지름 (없으면 알약 높이 × RIPPLE_K), cls: 덧붙일 클래스,
  // hold: 지름을 줘도 가장 밝은 채로 퍼지는 구간을 둔다, from: 처음 크기(지름 대비, 기본 0)
  pressRipple(btn, e, size, cls, hold = false, from = 0) {
    const el = btn.closest(PRESS_PILL) || btn;
    const doc = el.ownerDocument;
    const r = el.getBoundingClientRect();
    // 기본 지름은 알약 높이 기준 (예전엔 긴 변의 2.2배라 긴 알약은 끝까지 다 하얘졌다, 사용자 요청으로 줄임)
    const d = size || r.height * RIPPLE_K;
    const wrap = doc.createElement("span");
    wrap.className = cls ? `lg-ripple ${cls}` : "lg-ripple";
    const dot = doc.createElement("span");
    dot.className = "lg-ripple-dot";
    // 알약 안 버튼은 누른 버튼 가운데에서 퍼진다 (사용자 요청). 검색창(지름을 따로 주는 것)은 누른 자리에서
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
    // 알약 안 버튼(지름을 따로 주지 않은 것)은 가장 밝은 채로 얼마간 퍼진 뒤에 흐려진다. 예전엔 퍼지기 시작하자마자 흐려져 어두웠다
    const frames = size && !hold
      ? [
          { transform: "translate(-50%, -50%) scale(0)", opacity: 1 },
          { transform: "translate(-50%, -50%) scale(1)", opacity: 0 },
        ]
      : [
          { offset: 0, transform: `translate(-50%, -50%) scale(${from})`, opacity: 1 },
          { offset: RIPPLE_HOLD, opacity: 1 },
          { offset: 1, transform: "translate(-50%, -50%) scale(1)", opacity: 0 },
        ];
    const anim = dot.animate(frames, { duration: 640, easing: EASE.burst });
    // Obsidian 이 탭 줄을 다시 정리하며(탭을 누르면 탭이 아닌 자식을 걷어 낸다) 빛을 떼어 내면 다시 붙인다.
    // 패널 탭은 누르고 있는 동안만 빛이 보였다 (사용자 지적)
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
  }

  // body 에 플러그인 상태(클래스·뿌연 정도)를 반영
  applyBodyState(doc) {
    const b = doc.body;
    if (!b) return;
    b.classList.add("lg-ui");
    b.classList.toggle("lg-tg-accent", this.settings.toggleColor === "accent");
    // 유리 투명도: 1~5 는 바래는 비율(--lg-fade), 6~10 은 뿌연 채움(--lg-frost, 예전 뿌연 정도 1~5 와 같은 값)
    const g = this.settings.glassLevel;
    // 1단계 0.45 에서 5단계 0.8 까지 고르게 (사용자 요청). 0단계는 0
    const f = g <= 0 ? 0 : 0.45 + ((Math.min(g, 5) - 1) * 0.35) / 4;
    b.style.setProperty("--lg-fade", String(+f.toFixed(4)));
    b.style.setProperty("--lg-frost", String((Math.max(0, g - 5) / 10) * 0.3));
    b.style.setProperty("--lg-hover-k", this.settings.hoverLarge ? "1" : "0");
    b.classList.toggle("lg-show-path", !!this.settings.showPath);
    b.classList.toggle("lg-mini-bar", !!this.settings.miniBar);
    b.classList.toggle("lg-pop-opaque", !!this.settings.popupOpaque);
    b.classList.toggle("lg-wc-compact", !!this.settings.compactWindowControls);
    // 틴트: 유리 위에 색을 옅게 한 겹 (CSS: body.lg-tinted)
    const s = this.settings;
    const color = s.tint === "accent" ? "var(--interactive-accent)" : s.tint === "obsidian" ? OBSIDIAN_PURPLE : s.tintColor;
    b.classList.toggle("lg-tinted", s.tint !== "none");
    b.style.setProperty("--lg-tint-color", color);
    b.style.setProperty("--lg-tint-p", `${s.tintLevel * 4}%`);
    // 흰 글자 토글 (CSS: body.lg-tint-ink-light, 라이트 모드에서만 효과)
    b.classList.toggle("lg-tint-ink-light", s.tint !== "none" && !!s.tintWhiteInk);
    // 선택된 패널 탭 색 설정은 없앴다 (사용자 요청). 테마 기본(강조색)을 쓴다. 예전 값이 남아 있지 않게 지운다
    b.style.removeProperty("--lg-active-tab-color");
    // 패널 탭 설정 (CSS: body.lg-tab-plain / lg-tab-wide / lg-tab-names)
    b.classList.toggle("lg-tab-plain", s.tabAnim === "none");
    b.classList.toggle("lg-tab-wide", !!s.tabWide);
    b.classList.toggle("lg-tab-names", !!s.tabNames);
    // 헤더 밑 가로줄 (CSS: body.lg-hrule)
    b.classList.toggle("lg-hrule", !!s.headingRule);
    // 효과 없음 모드의 글자색은 테마가 강조색에서 바로 계산한다 (예전 값이 남아 있지 않게 지운다)
    b.style.removeProperty("--lg-tab-on-ink");
    // 할 일 체크박스 (CSS: body.lg-task-ring, --lg-task-color). 노랑은 테마 값(라이트·다크 각각)을 쓴다
    b.classList.toggle("lg-task-ring", s.taskStyle === "ring");
    if (s.taskColor === "yellow") b.style.removeProperty("--lg-task-color");
    else b.style.setProperty("--lg-task-color", s.taskColor === "accent" ? "var(--interactive-accent)" : s.taskColorCustom);
    this.applyFolderColor(doc);
  }

  // 폴더 기호 색 (CSS: --lg-folder-icon). 파랑은 테마의 기호를 그대로 쓴다.
  // 그 밖의 색은 테마 파랑 폴더와 같은 짜임으로 다시 그린다: 앞판 아래 = 고른 색, 앞판 위 = 흰색 22%, 뒤판 = 검정 15%, 빛 선 = 흰색 55%
  applyFolderColor(doc) {
    const b = doc.body;
    if (!b) return;
    const s = this.settings;
    if (s.folderColor !== "accent" && s.folderColor !== "custom") return b.style.removeProperty("--lg-folder-icon");
    const rgb = resolveRgb(doc, s.folderColor === "accent" ? "var(--interactive-accent)" : s.folderColorCustom);
    if (!rgb) return b.style.removeProperty("--lg-folder-icon");
    b.style.setProperty("--lg-folder-icon", folderIconUrl(rgb));
  }

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
    // 칸반 카드의 체크박스는 설정과 상관없이 늘 링 모양 (테마 Kanban 연동)
    const ring = cb.ownerDocument.body.classList.contains("lg-task-ring") || !!cb.closest(".kanban-plugin, .kanban-plugin__drag-container");
    if (cb.lgTaskAnims) for (const a of cb.lgTaskAnims) a.cancel();
    cb.classList.add("lg-task-anim");
    const hovered = hov != null ? hov : cb.matches(":hover");
    const cs = win.getComputedStyle(cb);
    const color = cs.getPropertyValue("--lg-task-color").trim();
    const border = cs.getPropertyValue("--lg-task-border").trim();
    // 호버 중이면 링은 숨어 있다(투명). 아니면 회색 링
    const bare = hovered ? "transparent" : border;
    const ringAnim = (frames, opt) => cb.animate(frames.map((c) => (typeof c === "string" ? { "--lg-task-ring": c } : { "--lg-task-ring": c.c, offset: c.o })), opt);
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
            { opacity: 1, transform: "scale(1)" },
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
    Promise.all(anims.map((a) => a.finished))
      .then(() => {
        if (cb.lgTaskAnims !== anims) return;
        cb.lgTaskAnims = null;
        cb.classList.remove("lg-task-anim");
        for (const a of anims) a.cancel();
      })
      .catch(() => {});
  }



  // 토글 손잡이 애니메이션: 탭 렌즈와 같은 곡선으로 이동하며 가운데서 통통한 유리 렌즈가 된다
  animateToggle(c) {
    const doc = c.ownerDocument;
    const win = doc.defaultView || window;
    const cs = win.getComputedStyle(c);
    const W = c.clientWidth;
    const H = c.clientHeight;
    const pad = parseFloat(cs.getPropertyValue("--lg-tg-pad")) || 2;
    const tw = parseFloat(cs.getPropertyValue("--lg-tg-thumb")) || 34;
    const th = H - pad * 2;
    const on = c.classList.contains("is-enabled");
    const xOff = pad;
    const xOn = W - tw - pad;
    const x0 = on ? xOff : xOn;
    const x1 = on ? xOn : xOff;
    // 테마는 손잡이 상자를 K 배 크게 그리고 1/K 로 줄여 보인다 (작게 그린 것을 키우면 테두리가 뿌옇게 보여서).
    // 위치·크기는 보이는 크기로 계산한 뒤 상자 기준으로 바꾼다
    // 테마가 상자를 정수 픽셀로 맞추려고 가로(KX)·세로(KY) 배율을 따로 둔다
    const KX = parseFloat(cs.getPropertyValue("--lg-tg-kx")) || 1;
    const KY = parseFloat(cs.getPropertyValue("--lg-tg-ky")) || 1;
    // 알약 가로 반지름 비율 (테마 --lg-pill-rx, 0.5 = 반원 끝)
    const RX = parseFloat(cs.getPropertyValue("--lg-pill-rx")) || 0.5;
    // 렌즈는 일반 알약과 같은 광택·테두리·그림자를 쓴다 (테마의 --lg-sheen, --lg-lens-shadow).
    // 채움은 알약 채움 대신 옅은 렌즈 채움(--lg-lens-bg): 알약 채움은 뒤를 덮어 굴절이 안 보였다.
    // 그림자 길이는 테마가 큰 상자 기준으로 적어 두었고, 여기서는 진하기만 렌즈 정도(g)만큼 곱한다
    const fill = cs.getPropertyValue("--lg-lens-bg").trim() || "transparent";
    // 틴트 층(--lg-sheen)은 렌즈에 걸지 않는다 (사용자 요청)
    const sheen = "none";
    const lensShadow = cs.getPropertyValue("--lg-lens-shadow").trim();

    // 색조(--lg-tone)는 걸지 않는다: 걸면 뒤가 뿌옇게 보이고 굴절도 드러나지 않는다 (탭 렌즈와 같다). 굴절과 렌즈 고유 밝기 1.06만
    let backdrop = "brightness(1.06)";
    if (this.refractOn()) {
      const id = this.refractor.filterFor(Math.round(tw * KX), Math.round((th + LENS_TG_TALL) * KY), 42, false, true, doc, undefined, undefined, LENS_TOGGLE); // 렌즈가 되었을 때 키 높이에 맞춘다
      backdrop = `url(#${id}) ${backdrop}`;
    }

    const frames = [];
    const N = 24;
    for (let i = 0; i <= N; i++) {
      const u = i / N;
      // 이동 거리가 짧으니 늘어남은 약하게
      const m = lensMotion(u, 0.35);
      const x = x0 + (x1 - x0) * m.ease;
      const puff = 1 + 0.5 * m.g; // 가장 커질 때 약 1.5배(늘어남 포함 약 1.76배, 테마 상자 배율 1.75·1.8 근처)
      const sx = puff * (1 + m.d);
      const sy = puff * (1 - m.d * 0.7);
      const g = m.g;
      frames.push({
        offset: u,
        // 렌즈가 되면 위아래로 실제 높이를 조금 더 키운다. 모서리 반지름은 원래 알약 그대로 고정해서(곡률 유지)
        // 키운 만큼 아주 살짝 각져 보인다
        height: `${((th + LENS_TG_TALL * g) * KY).toFixed(2)}px`,
        top: `${(pad + th / 2 - ((th + LENS_TG_TALL * g) * KY) / 2).toFixed(2)}px`,
        borderRadius: `${(th * RX * KX).toFixed(2)}px / ${((th / 2) * KY).toFixed(2)}px`,
        transform: `translateX(${(x + (tw * (1 - KX)) / 2).toFixed(2)}px) scale(${(sx / KX).toFixed(4)}, ${(sy / KY).toFixed(4)})`,
        // 손잡이의 흰 채움은 렌즈 정도(g)보다 빨리 알약 채움으로 바뀐다 (g 가 절반쯤 오르면 이미 알약 채움)
        backgroundColor: `color-mix(in srgb, #fff ${((1 - Math.min(1, g * LENS_CLEAR_K)) * 100).toFixed(1)}%, ${fill})`,
        boxShadow: lensShadow ? lensShadow.replace(/\/\s*([\d.]+)\s*\)/g, (m, v) => `/ ${(parseFloat(v) * g).toFixed(3)})`) : "none",
        backgroundImage: sheen,
        backdropFilter: backdrop,
        webkitBackdropFilter: backdrop,
      });
    }

    const anim = c.animate(frames, { duration: 320, easing: "linear", pseudoElement: "::after" });
    const done = () => c.classList.remove("lg-tg-anim");
    anim.onfinish = done;
    anim.oncancel = done;
  }


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
    const lens = doc.createElement("div");
    lens.className = "lg-sl-lens";
    lens.style.width = `${w}px`;
    lens.style.height = `${h}px`;
    const rx = parseFloat(cs.getPropertyValue("--lg-pill-rx")) || 0.5;
    lens.style.borderRadius = `${(h * rx).toFixed(2)}px / ${(h / 2).toFixed(2)}px`;
    let backdrop = "brightness(1.06)";
    if (this.refractOn()) backdrop = `url(#${this.refractor.filterFor(w, h, 42, false, true, doc, undefined, undefined, LENS_SLIDER)}) ${backdrop}`;
    lens.style.backdropFilter = backdrop;
    lens.style.webkitBackdropFilter = backdrop;
    // 찌부: 끄는 동안 가로로 일정하게(SL_SQUASH) 양쪽으로 늘고 세로로 조금(SL_SQUASH_Y 배) 눌린다.
    // 멈추면 앞쪽 끝(오른쪽으로 끌었으면 오른쪽)이 먼저 서고, 뒤쪽 끝만 관성으로 앞으로 밀려 제자리를 지나 줄어든 뒤(일정한 속도), 부드럽게 제자리로 돌아온다.
    // scale·translate 속성이라 렌즈가 커지는 애니메이션(transform)과 따로 곱해진다
    const visW = w * (1.32 / K); // 다 커진 렌즈의 보이는 폭
    const squash = { x: null, t: 0, v: 0, dir: 1, k: 0, k0: 0, stop: 0, raf: 0, anchor: 0 };
    const squashTick = () => {
      const now = win.performance.now();
      // 마지막 움직임에서 SL_STOP_MS 가 지나면 멈춘 것으로 본다 (속도가 빨랐는지와 상관없이 같은 시점)
      const moving = Math.abs(squash.v) > SL_SQUASH_MOVING && now - squash.t < SL_STOP_MS;
      if (moving) {
        squash.dir = Math.sign(squash.v) || squash.dir;
        squash.k += (SL_SQUASH - squash.k) * 0.2;
        squash.stop = 0;
        squash.anchor += (0 - squash.anchor) * 0.2; // 움직이는 동안은 가운데 기준 (양쪽으로)
      } else {
        // 멈춘 순간과 그때의 늘어남을 기억한다
        if (!squash.stop) { squash.stop = now; squash.k0 = squash.k; }
        squash.anchor += (1 - squash.anchor) * 0.22; // 멈추면 앞쪽 끝 기준으로 넘어간다
        const t = (now - squash.stop) / 1000;
        if (t < SL_STOP_IN_S) {
          // 늘어난 상태에서 가장 줄어든 상태(-SL_STOP_MIN)까지 일정한 속도로
          squash.k = squash.k0 + (-SL_STOP_MIN - squash.k0) * (t / SL_STOP_IN_S);
        } else {
          // 임계 감쇠: 멈춘 상태에서 천천히 출발해 넘치지 않고 감속하며 제자리로
          const u = (t - SL_STOP_IN_S) / SL_SETTLE_S;
          squash.k = -SL_STOP_MIN * (1 + u) * Math.exp(-u);
        }
      }
      const k = squash.k;
      lens.style.scale = `${(1 + k).toFixed(4)} ${(1 - k * (k < 0 ? SL_SQUASH_Y_STOP : SL_SQUASH_Y)).toFixed(4)}`;
      // 멈춘 뒤에는 앞쪽 끝을 제자리에 두도록 늘어난 만큼 뒤쪽으로 민다
      lens.style.translate = `${((-squash.dir * k * visW * squash.anchor) / 2).toFixed(2)}px 0`;
      if (moving || !squash.stop || Math.abs(k) > 0.001 || now - squash.stop < SL_STOP_IN_S * 1000) squash.raf = win.requestAnimationFrame(squashTick);
      else { squash.raf = 0; squash.k = 0; squash.k0 = 0; squash.stop = 0; squash.anchor = 0; lens.style.removeProperty("scale"); lens.style.removeProperty("translate"); }
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
    // 슬라이더 렌즈는 바깥으로 퍼지는 그림자(렌즈 그림자 토큰의 마지막 줄)를 옅게 쓴다 (사용자 요청)
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
        { transform: `scale(${(1.32 / K).toFixed(4)})`, backgroundColor: "var(--lg-lens-bg)", boxShadow: lightShadow },
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
        // 손잡이가 투명→흰색으로 180ms 동안 서서히 돌아오며 한 번 깜빡였다: 바꾸는 순간만 전환을 끈다 (CSS: .lg-sl-settle)
        el.classList.add("lg-sl-settle");
        el.classList.remove("lg-sl-pressed");
        win.requestAnimationFrame(() => win.requestAnimationFrame(() => el.classList.remove("lg-sl-settle")));
        if (el.lgLens === state) el.lgLens = null;
      };
      anim.reverse();
    };
    win.addEventListener("pointerup", release, true);
    win.addEventListener("pointercancel", release, true);
    // 누르는 동안 플러그인이 꺼지면 위 리스너가 창에 남는다. 끌 때도 풀리게 한다 (보통은 손을 떼는 순간 release 가 스스로 푼다)
    const off = () => {
      win.removeEventListener("pointerup", release, true);
      win.removeEventListener("pointercancel", release, true);
    };
    state.off = off;
    (this.pendingRelease || (this.pendingRelease = new Set())).add(off);
  }

  // 테마가 켜지거나 꺼질 때: 플러그인을 껐다 켜 onload 가 처음부터 다시 판단하게 한다 (켜진 플러그인 목록은 그대로 남는다)
  reloadSelf() {
    if (this.reloading) return;
    this.reloading = true;
    const id = this.manifest.id;
    const plugins = this.app.plugins;
    window.setTimeout(async () => {
      try {
        await plugins.disablePlugin(id);
        await plugins.enablePlugin(id);
      } catch (err) {
        console.error("[glass-shelf] reload", err);
      }
    }, 0);
  }

  onunload() {
    // 테마가 꺼져 있어 동작하지 않았으면 정리할 것도 없다
    if (!this.coreOn) return;
    if (this.pendingRelease) this.pendingRelease.forEach((f) => f());
    this.observers.forEach((o) => o.disconnect());
    this.refractor.destroy();
    for (const doc of this.docs) {
      if (!doc.body) continue;
      doc.querySelectorAll(".lg-kb-group").forEach((g) => {
        while (g.firstChild) g.parentElement.insertBefore(g.firstChild, g);
      });
      doc.querySelectorAll(".lg-kb-searching").forEach((el) => el.classList.remove("lg-kb-searching"));
    }
    for (const doc of this.docs) if (doc.body) doc.querySelectorAll(".lg-path-text").forEach((el) => this.returnTitle(el));
    for (const doc of this.docs) {
      if (!doc.body) continue;
      doc.querySelectorAll("." + INJECTED).forEach((el) => el.remove());
      // 플러그인이 Obsidian 요소(body 포함)에 붙인 lg- 클래스와 --lg- 변수를 모두 걷어 낸다.
      // 목록을 따로 두면 새 설정·상태를 더할 때 빠뜨리기 쉬워 접두사로 찾는다
      doc.querySelectorAll('[class*="lg-"]').forEach((el) => {
        const cls = Array.from(el.classList).filter((c) => c.startsWith("lg-"));
        if (cls.length) el.classList.remove(...cls);
      });
      doc.querySelectorAll('[style*="--lg-"]').forEach((el) => {
        const props = [];
        for (let i = 0; i < el.style.length; i++) if (el.style[i].startsWith("--lg-")) props.push(el.style[i]);
        props.forEach((p) => el.style.removeProperty(p));
      });
    }
  }

  // 메뉴가 뜰 때: 커지는 기준점을 누른 자리로 둔다.
  // 방금 누른 게 없으면(하위 메뉴·키보드) 부모 메뉴 쪽 위 모서리에서 커진다.
  // 우클릭·보관함 메뉴처럼 이벤트가 끝난 뒤 채워지는 메뉴는 붙은 직후엔 크기가 없으므로,
  // 첫 화면을 그리기 직전(다음 프레임)에 잰다
  setupMenu(menu, press) {
    if (menu.lgSnap) return;
    const doc = menu.ownerDocument;
    const win = doc.defaultView || window;
    // 다른 메뉴가 이미 떠 있으면 하위 메뉴다. 방금 누른 게 있어도 그 누름은 부모 메뉴 몫이므로 쓰지 않는다
    // (안 그러면 속성 칸을 누르고 바로 하위 메뉴를 열 때 하위 메뉴까지 칸 밑으로 옮겨져 부모와 겹친다)
    // 단, 열린 메뉴가 뜬 뒤에 메뉴 바깥을 새로 눌러 연 메뉴는 하위 메뉴가 아니다: 열린 메뉴가 아직 닫히기 전에
    // 새 메뉴가 붙는 경우(같은 대상을 다시 우클릭 등)에 하위 메뉴로 잘못 봐서 왼쪽 위에서 커졌다 (사용자 지적)
    const now = win.performance.now();
    menu.lgBorn = now;
    // 커지는 양을 절대값으로: 메뉴 내용이 몇 프레임 늦게 채워질 수 있어 두 프레임 더 잰다 (offsetWidth 는 애니메이션 배율을 빼고 잰 크기)
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
    const pressed = press && now - press.t < (Platform.isMobile ? 1500 : 600);
    const outside = pressed && !(isEl(press.target) && press.target.closest(".menu"));
    const sub = Array.from(doc.querySelectorAll(".menu")).some((m) =>
      m !== menu && !m.classList.contains("lg-menu-ghost") && !(outside && press.t > (m.lgBorn || 0)));
    // 모바일은 길게 누르기(약 0.5초 뒤 메뉴)도 누른 자리에서 커지게 더 오래 봐 준다
    const fresh = !sub && pressed;
    // 같은 대상을 다시 우클릭: 새로 커지지 않고 옛 메뉴 자리에서 새 자리로 옮겨 온다 (사용자 요청).
    // 옛 메뉴가 아직 떠 있으면 그 자리를, 막 닫혔으면(사라지는 사본) 닫히기 전 자리를 쓴다
    if (fresh && isEl(press.target)) {
      const key = menuKey(press.target);
      menu.lgKey = key;
      const live = Array.from(doc.querySelectorAll(".menu")).find((m) => m !== menu && m.lgKey === key && !m.classList.contains("lg-menu-ghost"));
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
    const target = fresh && isEl(press.target) ? press.target : null;
    const src = target && target.closest(".workspace-drawer-vault-switcher");
    // 버튼에서 넓어지는 메뉴는 준비될 때까지 숨긴다 (CSS: .lg-menu-morph)
    if (src) menu.classList.add("lg-menu-morph");
    const run = (tries) => {
      if (!menu.isConnected) return;
      if ((menu.offsetWidth < 2 || menu.offsetHeight < 2) && tries < 6) return win.requestAnimationFrame(() => run(tries + 1));
      try {
        if (src) return this.morphMenu(menu, src);
        // 편집창 탭 줄의 메뉴는 탭을 가리지 않게 탭 줄 밑으로
        const list = target && target.closest(".mod-root .workspace-tab-header-tab-list");
        const tabMenu = target && target.closest(".lg-tab-menu");
        const pathMenu = target && target.closest(".lg-path-menu");
        if (list) this.placeUnderTabBar(menu, list, null);
        else if (pathMenu) this.placeUnderTabBar(menu, pathMenu, pathMenu.closest(".lg-path-pill"));
        else if (tabMenu) this.placeUnderTabBar(menu, tabMenu, tabMenu.closest(".workspace-tab-header"));
        // 속성(메타데이터) 칸에서 연 메뉴: 그 칸이 밝은 알약으로 떠오르고 메뉴는 칸 바로 밑에
        const row = target && target.closest(".metadata-property");
        if (row) this.focusRow(menu, row);
        // 하위 메뉴: Obsidian 은 부모 메뉴 바깥 끝에 붙여 연다. 부모 메뉴의 선택 하이라이트(고른 항목) 끝에 닿게 안쪽으로 당긴다 (사용자 요청)
        const subUp = sub ? this.tuckSubmenu(menu) : false;
        // 커지는 애니메이션(기준점 왼쪽 위) 중이므로 왼쪽 위 모서리만 쓴다
        const r = menu.getBoundingClientRect();
        let ox;
        let oy;
        if (fresh) {
          ox = press.x - r.left;
          oy = press.y - r.top;
        } else {
          const others = Array.from(doc.querySelectorAll(".menu")).filter((m) => m !== menu && !m.classList.contains("lg-menu-ghost"));
          const parent = others[others.length - 1];
          const pr = parent && parent.getBoundingClientRect();
          ox = pr && pr.left + pr.width / 2 > r.left + menu.offsetWidth / 2 ? menu.offsetWidth : 0;
          // 위로 연 하위 메뉴는 아래끝(고른 항목 쪽)에서 커진다
          oy = subUp ? menu.offsetHeight : 0;
          // 하위 메뉴는 부모와 함께 닫히면 부모의 기준점으로 사라진다 (closeMenu)
          if (sub && parent) menu.lgParent = parent;
        }
        menu.style.transformOrigin = `${ox.toFixed(1)}px ${oy.toFixed(1)}px`;
        // 닫힐 때 줄어들 화면 좌표 기준점
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
  }

  // 하위 메뉴를 부모 메뉴의 고른 항목 끝에 닿게 옮긴다. 오른쪽으로 열렸으면 왼쪽으로, 왼쪽으로 열렸으면 오른쪽으로
  tuckSubmenu(menu) {
    const doc = menu.ownerDocument;
    const r = menu.getBoundingClientRect();
    const parents = Array.from(doc.querySelectorAll(".menu")).filter((m) => m !== menu && !m.classList.contains("lg-menu-ghost"));
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
    // 세로: 아래로 열렸으면 첫 항목을 고른 항목과 같은 높이로, 위로 열렸으면(밑에 공간 없음) 마지막 항목 아래끝을
    // 고른 항목 아래끝에 맞춘다 (사용자 요청). 메뉴는 커지는 중이라 화면 좌표 대신 offset 으로 잰다
    const items = menu.querySelectorAll(".menu-item");
    if (!items.length) return false;
    const rel = (el) => {
      let y = 0;
      for (let e = el; e && e !== menu; e = e.offsetParent) y += e.offsetTop;
      return y;
    };
    const top = parseFloat(menu.style.top);
    const y0 = Number.isFinite(top) ? top : menu.offsetTop;
    const h = menu.offsetHeight;
    const up = y0 + h <= ir.top + 4;
    const last = items[items.length - 1];
    let y = up ? ir.bottom - (rel(last) + last.offsetHeight) : ir.top - rel(items[0]);
    const vh = (doc.defaultView || window).innerHeight;
    y = Math.max(4, Math.min(y, vh - h - 4));
    menu.style.top = `${y.toFixed(1)}px`;
    return up;
  }

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
      // 검색창이 누름 효과로 커져 있을 수 있어, 가운데는 화면 좌표로 크기는 원래 크기(offset)로 잰다
      const hr = host.getBoundingClientRect();
      const w = host.offsetWidth;
      const cx = hr.left + hr.width / 2;
      const cy = hr.top + hr.height / 2;
      pop.style.setProperty("--lg-sl", `${cx - w / 2}px`);
      pop.style.setProperty("--lg-st", `${cy - host.offsetHeight / 2 + input.offsetTop + input.offsetHeight}px`);
      pop.style.setProperty("--lg-sw", `${w}px`);
      host.style.setProperty("--lg-sugg-h", `${pop.offsetHeight}px`);
    };
    const ro = new win.ResizeObserver(place);
    ro.observe(pop);
    place();
    // 검색창을 누른 효과(커졌다 돌아옴)가 진행 중이면, 제안 목록도 검색창 가운데를 기준으로 같은 시점부터 따라 한다
    const p = host.lgPress;
    const since = p ? performance.now() - p.t : Infinity;
    if (p && since < p.opt.duration) {
      // 기준점 = 검색창 가운데 (제안 목록 왼쪽 위 기준 좌표)
      const oy = host.offsetHeight / 2 - (input.offsetTop + input.offsetHeight);
      pop.style.transformOrigin = `${(host.offsetWidth / 2).toFixed(1)}px ${oy.toFixed(1)}px`;
      const a = pop.animate([{ offset: 0.34, scale: p.k.toFixed(3) }, { offset: 0.46, scale: p.k.toFixed(3) }], p.opt);
      a.currentTime = since;
    }
    const done = new win.MutationObserver(() => {
      if (pop.isConnected) return;
      done.disconnect();
      ro.disconnect();
      host.style.removeProperty("--lg-sugg-h");
      host.classList.remove("lg-sugg-host");
    });
    done.observe(doc.body, { childList: true });
  }

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
    // 판 자신의 클래스 변화(위)로는 다시 부르지 않는다
    new win.MutationObserver((recs) => {
      if (recs.some((r) => r.target !== hl)) place();
    }).observe(scroll, { subtree: true, attributes: true, attributeFilter: ["class"] });
    place();
  }

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
  }

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
    // 탭 줄 버튼·알약 아래 끝(탭 줄 아래 끝 - 아래 여백) + MENU_DROP.
    // 탭 목록·경로 알약의 ≡ 는 그 버튼(알약) 아래 끝 기준: 경로 표시로 탭 줄이 두 줄이 되어도 리본 메뉴와 같은 높이에 연다 (사용자 요청)
    const rowEl = btn.closest(".lg-path-pill") || (btn.matches(".workspace-tab-header-tab-list") ? btn : null);
    const bottom = rowEl ? rowEl.getBoundingClientRect().bottom : header.getBoundingClientRect().bottom - gap;
    menu.style.top = `${bottom + MENU_DROP}px`;
  }

  // 보관함 전환 메뉴: 버튼이 메뉴의 왼쪽 아래 꼭짓점에 오게 둔다(위에 자리가 없으면 왼쪽 위 꼭짓점).
  // 버튼은 메뉴 가운데를 향해 돌진하며 작아져 사라지고, 둘 사이 중간 지점에서 메뉴 창이 넓어져 나온다.
  // 창 크기만 바뀌고 안의 내용은 제자리에 그대로 있다
  morphMenu(menu, src) {
    const win = menu.ownerDocument.defaultView || window;
    const b = src.getBoundingClientRect();
    const W = Math.max(menu.offsetWidth, b.width);
    const H = Math.max(menu.offsetHeight, b.height);
    const top = b.bottom - H >= 8 ? b.bottom - H : b.top;
    menu.style.left = `${b.left}px`;
    menu.style.top = `${top}px`;
    menu.classList.add("lg-bottom-auto");
    const mr = parseFloat(win.getComputedStyle(menu).borderTopLeftRadius) || 22;
    const full = { left: b.left, top, width: W, height: H, radius: mr };
    const bx = b.left + b.width / 2;
    const by = b.top + b.height / 2;
    const { ux, uy } = unitVec(bx, by, b.left + W / 2, top + H / 2);
    const dot = this.dotAt(bx + ux * MORPH_DASH, by + uy * MORPH_DASH, b.height);
    menu.lgSrc = src;
    menu.lgMorph = { ux, uy, dot };
    if (src.lgHide) src.lgHide.cancel();
    src.lgHide = this.dashOut(src, ux, uy);
    const inner = menu.querySelector(".menu-scroll");
    // 창이 작은 동안 안의 내용이 따라 줄지 않게 크기를 잠시 고정한다
    if (inner) this.pinSize(inner);
    const grow = this.growBox(menu, inner ? [{ el: inner, anchor: "left" }] : [], dot, full, 90);
    if (inner) grow.onfinish = grow.oncancel = () => this.unpinSize(inner);
    if (inner) inner.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 140, delay: 120, easing: "ease-out", fill: "backwards" });
  }

  // 창이 작은 동안 안의 내용이 따라 줄지 않게 크기를 잠시 고정한다
  pinSize(el) {
    el.style.width = `${el.offsetWidth}px`;
    el.style.height = `${el.offsetHeight}px`;
    el.classList.add("lg-pinned");
  }

  unpinSize(el) {
    el.style.removeProperty("width");
    el.style.removeProperty("height");
    el.classList.remove("lg-pinned");
  }

  // 돌진한 버튼이 사라지는 지점의 작은 원 (버튼 높이의 60%)
  dotAt(x, y, h) {
    const d = h * 0.6;
    return { left: x - d / 2, top: y - d / 2, width: d, height: d, radius: d / 2 };
  }

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
      const ax = (x) => (kid.anchor === "right" ? x.left + x.width : x.left);
      kid.el.animate(
        frames.map((fr) => meta(fr, fr.box ? { translate: `${ax(keep) - ax(fr.box)}px ${keep.top - fr.box.top}px` } : {})),
        opt
      );
    }
    return anim;
  }

  // 작은 원(dot)에서 창(full)으로 넓어지며 나타난다. 넓어지는 도중엔 더 둥글다가 다 펼쳐지면 원래 곡률,
  // 살짝 지나친 크기에서 천천히 제 크기로 돌아온다. 좌표는 el 의 위치 기준 좌표계
  growBox(el, kids, dot, full, delay) {
    const over = {};
    for (const p of ["left", "top", "width", "height"]) over[p] = full[p] + (full[p] - dot[p]) * 0.02;
    const round = Math.min(full.width, full.height) / 2;
    const opt = { duration: 420, delay, easing: "linear", fill: "backwards" };
    el.animate([{ opacity: 0 }, { offset: 0.2, opacity: 1 }, { opacity: 1 }], opt);
    // 펼쳐지는 방향(작은 원 → 창 가운데)으로 창이 내용과 함께 MORPH_NUDGE 만큼 밀렸다가 제자리로
    const { ux, uy } = unitVec(dot.left + dot.width / 2, dot.top + dot.height / 2, full.left + full.width / 2, full.top + full.height / 2);
    el.animate(
      [
        { translate: "0 0", easing: EASE.burst },
        { offset: 0.42, translate: `${(ux * MORPH_NUDGE).toFixed(1)}px ${(uy * MORPH_NUDGE).toFixed(1)}px`, easing: EASE.ret },
        { translate: "0 0" },
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
        { box: full },
      ],
      full,
      opt
    );
  }

  // 창(full)이 작은 원(dot)으로 줄며 사라진다 (반동 없이, 도중엔 더 둥글게)
  shrinkBox(el, kids, full, dot) {
    const round = Math.min(full.width, full.height) / 2;
    const opt = { duration: 200, easing: EASE.exit, fill: "forwards" };
    el.animate([{ opacity: 1 }, { offset: 0.7, opacity: 1 }, { opacity: 0 }], opt);
    return this.boxMorph(el, kids, [{ box: full }, { radius: round, offset: 0.45 }, { box: dot }], full, opt);
  }

  // 알약 버튼(가로가 긴 것)이 원이 되려면 유리 층을 양옆에서 얼마나 줄여야 하는지. 원형 버튼이면 0
  pillInset(el) {
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    // 칸반 버튼 묶음은 높이는 그대로 두고 폭만 높이의 KB_PILL_DOT 배까지 줄인다 (사용자 요청: 좌우로만, 원이 될 때까지)
    if (el.matches(".lg-kb-group")) return (w - h * KB_PILL_DOT) / 2;
    return el.matches(".workspace-drawer-vault-switcher") && w > h * 1.3 ? (w - h) / 2 : 0;
  }

  // 버튼이 흐려지고 나타나는 효과. 요소 자체의 opacity 를 움직이면 그동안 요소가 뒤 화면을 떠 오는 경계(Backdrop Root)가 되어
  // 유리 층(::after)의 채움·색조·굴절이 꺼졌다가 애니메이션이 끝나야 돌아온다. 그래서 유리 층과 안의 내용에 따로 건다.
  // 유리 층이 없는 묶음(그래프 버튼들)은 그 안의 버튼마다 같은 방식으로 건다
  fadeParts(el, frames, opt) {
    if (el.lgFade) el.lgFade.forEach((a) => a.cancel());
    const win = el.ownerDocument.defaultView || window;
    const glassy = (n) => win.getComputedStyle(n, "::after").backdropFilter !== "none";
    const anims = [];
    const walk = (n, top) => {
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
  }

  // 버튼이 (ux, uy) 방향으로 MORPH_DASH 만큼 움직이며 투명하게 사라진다 (사라진 채로 남는다)
  dashOut(el, ux, uy) {
    const d = MORPH_DASH;
    // 알약 버튼은 유리 층(::after)이 좌우로 줄어 원이 된다 (글자는 그대로)
    const c = this.pillInset(el);
    // 칸반 버튼 묶음은 좁아지는 모습이 보이게 천천히 줄고, 유리는 다 줄어든 뒤에 흐려진다(기호는 먼저 사라진다).
    // 보관함처럼 줄기와 흐려지기를 함께 하면 좁아지는 게 보이지 않았다 (사용자 지적)
    const slow = el.matches(".lg-kb-group");
    const dur = slow ? KB_DASH_MS : 160;
    if (el.lgGlassAnim) el.lgGlassAnim.cancel();
    el.lgGlassAnim = c
      ? el.animate([{ left: "0px", right: "0px" }, { left: `${c}px`, right: `${c}px` }], {
          duration: slow ? dur * 0.7 : dur,
          easing: "cubic-bezier(0.4, 0, 0.6, 1)",
          fill: "forwards",
          pseudoElement: "::after",
        })
      : null;
    const opt = { duration: dur, easing: "cubic-bezier(0.4, 0, 0.6, 1)", fill: "forwards" };
    this.fadeParts(el, slow ? [{ opacity: 1 }, { offset: 0.7, opacity: 1 }, { opacity: 0 }] : [{ opacity: 1 }, { opacity: 0 }], opt);
    if (slow) {
      // 안의 기호는 좁아지는 유리 밖으로 삐져나오지 않게 먼저 사라진다 (다음 fadeParts 가 함께 걷어 내도록 목록에 넣는다)
      for (const k of el.children) el.lgFade.push(k.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 90, easing: "ease-in", fill: "forwards" }));
    }
    // 숨긴 채 남은 투명도는 다음 fadeParts(dashBack·dashOut)가 걷어 낸다
    return el.animate([{ translate: "0 0" }, { translate: `${(ux * d).toFixed(1)}px ${(uy * d).toFixed(1)}px` }], opt);
  }

  // 사라졌던 버튼이 돌진했던 자리에서 나타나 제자리를 반대쪽으로 MORPH_OVERSHOOT 만큼 지나쳤다가 돌아온다
  dashBack(el, ux, uy, delay) {
    const d = MORPH_DASH;
    const o = MORPH_OVERSHOOT;
    // 알약 버튼은 원에서 좌우로 늘어나 제 폭을 조금 지나쳤다가 돌아온다
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
          { left: "0px", right: "0px" },
        ],
        { duration: 360, delay, easing: "ease-out", fill: "backwards", pseudoElement: "::after" }
      );
    }
    const opt = { duration: 360, delay, easing: "ease-out", fill: "backwards" };
    this.fadeParts(el, [{ opacity: 0 }, { offset: 0.3, opacity: 1 }, { opacity: 1 }], opt);
    return el.animate(
      [
        { translate: `${(ux * d).toFixed(1)}px ${(uy * d).toFixed(1)}px` },
        { offset: 0.6, translate: `${(-ux * o).toFixed(1)}px ${(-uy * o).toFixed(1)}px` },
        { translate: "0 0" },
      ],
      opt
    );
  }

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
      // 같은 대상을 다시 우클릭해 곧바로 새 메뉴가 붙으면 이 자리에서 옮겨 간다 (setupMenu)
      if (menu.lgKey) this.lastShut = { key: menu.lgKey, rect: ghost.getBoundingClientRect(), t: win.performance.now(), ghost };
      const src = menu.lgSrc;
      if (menu.lgMorph && src && src.isConnected) {
        const { ux, uy, dot } = menu.lgMorph;
        const r = ghost.getBoundingClientRect();
        const mr = parseFloat(win.getComputedStyle(ghost).borderTopLeftRadius) || 22;
        const full = { left: r.left, top: r.top, width: r.width, height: r.height, radius: mr };
        const inner = ghost.querySelector(".menu-scroll");
        if (inner) this.pinSize(inner);
        if (inner) inner.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 60, easing: "ease-in", fill: "forwards" });
        this.shrinkBox(ghost, inner ? [{ el: inner, anchor: "left" }] : [], full, dot).onfinish = () => ghost.remove();
        if (src.lgHide) {
          src.lgHide.cancel();
          src.lgHide = null;
        }
        this.dashBack(src, ux, uy, 110);
      } else {
        // 기준점은 화면 좌표로 기억해 둔 것을 사본 기준으로 바꿔 쓴다.
        // 부모도 같이 닫혔으면(이미 떼어짐) 한 몸처럼 가장 위에서 같이 닫힌 메뉴의 기준점, 하위 메뉴만 닫히면 자기 기준점
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
            { opacity: 0, transform: "scale(0.5)" },
          ],
          { duration: 110, easing: EASE.exit, fill: "forwards" }
        ).onfinish = () => ghost.remove();
      }
    } catch (err) {
      console.error("[glass-shelf] menu-close", err);
    }
  }

  // 그래프 설정 창: 설정 버튼(원)이 창의 오른쪽 위 꼭짓점. 버튼은 창 가운데를 향해 돌진하며 사라지고,
  // 둘 사이 중간 지점에서 창이 넓어져 나온다. 창 크기만 바뀌고 안의 내용은 제자리에 있다.
  // 창은 부모 안의 절대 위치라, 화면 좌표를 부모 기준 좌표로 바꿔 움직인다
  graphBoxes(gc, panel, btn) {
    const op = gc.offsetParent || gc.parentElement;
    const o = op.getBoundingClientRect();
    const ox = o.left + op.clientLeft;
    const oy = o.top + op.clientTop;
    const win = gc.ownerDocument.defaultView || window;
    const radius = parseFloat(win.getComputedStyle(gc).borderTopLeftRadius) || btn / 2;
    const full = { left: panel.left - ox, top: panel.top - oy, width: panel.width, height: panel.height, radius };
    // 설정 버튼 = 창의 오른쪽 위 꼭짓점 원
    const gx = panel.right - btn / 2;
    const gy = panel.top + btn / 2;
    const { ux, uy } = unitVec(gx, gy, panel.left + panel.width / 2, panel.top + panel.height / 2);
    const dot = this.dotAt(gx + ux * MORPH_DASH - ox, gy + uy * MORPH_DASH - oy, btn);
    return { full, dot, ux, uy };
  }

  // 창 안의 내용: 흐르는 부분(설정 묶음)은 왼쪽, 닫기·초기화 버튼은 오른쪽에 붙어 있다
  graphKids(el) {
    return Array.from(el.children).map((c) => ({ el: c, anchor: c.classList.contains("graph-controls-button") ? "right" : "left" }));
  }

  graphOpen(gc) {
    if (!gc || !gc.parentElement) return;
    try {
      const doc = gc.ownerDocument;
      const win = doc.defaultView || window;
      const btn = parseFloat(win.getComputedStyle(doc.body).getPropertyValue("--lg-btn")) || 34;
      // 접힌 버튼들의 사본이 돌진하며 사라진다
      const ghost = gc.cloneNode(true);
      ghost.classList.add("lg-graph-ghost");
      gc.parentElement.appendChild(ghost);
      win.setTimeout(() => ghost.remove(), 900);
      win.requestAnimationFrame(() => {
        if (gc.classList.contains("is-close")) return ghost.remove();
        const box = this.graphBoxes(gc, gc.getBoundingClientRect(), btn);
        this.dashOut(ghost, box.ux, box.uy).onfinish = () => ghost.remove();
        // 창이 좁아지는 동안 내용이 다시 줄바꿈되지 않게 폭을 잠시 고정한다
        const kids = this.graphKids(gc);
        const fixed = kids.filter((k) => k.anchor === "left").map((k) => {
          k.el.style.width = `${k.el.offsetWidth}px`;
          return k.el;
        });
        // 움직이는 동안 토글 트랙은 픽셀에 맞춰 그려지고(반올림) 손잡이는 아니라서 둘이 따로 덜그럭거렸고,
        // 멈춘 뒤에도 트랙이 반 픽셀 위로 그려진 채 남았다. 움직이는 동안은 트랙도 반올림 없이 그리고(lg-tg-float),
        // 완전히 멈춘 뒤 두 프레임 지나 떼어 픽셀에 맞춰 다시 그린다
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
  }

  // 닫기: 열린 창의 사본이 중간 지점의 원으로 줄어 사라지고, 접힌 버튼들이 거기서 나타나
  // 반대쪽으로 조금 지나쳤다가 제자리로 온다
  graphClose(gc) {
    if (!gc || gc.classList.contains("is-close") || !gc.parentElement) return;
    try {
      const doc = gc.ownerDocument;
      const win = doc.defaultView || window;
      const btn = parseFloat(win.getComputedStyle(doc.body).getPropertyValue("--lg-btn")) || 34;
      const box = this.graphBoxes(gc, gc.getBoundingClientRect(), btn);
      const ghost = gc.cloneNode(true);
      ghost.classList.add("lg-graph-ghost");
      gc.parentElement.appendChild(ghost);
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

  // 호버 유리의 모양(아이콘은 높이만 한 원, 글자는 요소 크기)에 맞춘 굴절 필터
  // 굴절: 설정이 켜져 있고 이 기기가 쓸 수 있을 때
  refractOn() {
    return !!this.settings.refraction && CAN_REFRACT;
  }

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
  }

  refractHover(el) {
    if (!this.refractOn()) return;
    const win = el.ownerDocument.defaultView || window;
    const cs = win.getComputedStyle(el, "::before");
    const w = Math.round(parseFloat(cs.width));
    const h = Math.round(parseFloat(cs.height));
    if (!(w >= 4 && h >= 4)) return;
    // 호버 유리는 굴절 폭을 좁게, 색수차 없음 (값은 HOVER_REFRACT, 렌즈 조율기 "호버 유리")
    const id = this.refractor.filterFor(w, h, HOVER_REFRACT.strength, false, false, el.ownerDocument, HOVER_REFRACT.bezel, HOVER_REFRACT.spread, undefined, HOVER_REFRACT.bezelMax);
    el.style.setProperty("--lg-refract-h", `url(#${id})`);
  }

  applySettings() {
    for (const doc of this.docs) this.applyBodyState(doc);
    this.refractor.setEnabled(this.refractOn());
    this.requestRefresh();
  }

  async saveSettings() {
    await this.saveData(this.settings);
    this.applySettings();
  }

  // ---------- 폴더 색 (폴더 컬러 매니저 플러그인 기능을 옮겨 옴) ----------
  // 색은 폴더 이름 기준: 공유 설정(data.json)의 folderColorsByName { 폴더 이름: "#hex" }. 이름이 같은 폴더는 어디에 있든
  // (최상위 포함) 같은 색이고, 같은 이름으로 새로 만든 폴더도 바로 그 색이 된다 (사용자 요청. PARA 범주마다 같은 분야 폴더가 생긴다).
  // 예전 경로 기준(folderColors)이나 폴더 컬러 매니저의 data.json 에서 한 번 옮겨 온다.
  // 파일 탐색기의 색 지정 폴더(.nav-folder)에 lg-fc 클래스와 변수(--lg-fc 색, --lg-folder-icon 그 색 기호)를 붙이면
  // 하위 폴더는 변수를 물려받아 같은 색이 된다 (하위에 따로 지정한 색이 있으면 그 색). 글자·화살표·세로줄은 CSS(styles.css)가 칠한다.
  // :has() 로 경로를 찾지 않으려고 플러그인이 요소에 직접 붙인다 (넓은 범위 :has 는 끌기 렉)
  async setupFolderColors(raw) {
    if (!raw.folderColorsByName || typeof raw.folderColorsByName !== "object") {
      let byPath = raw.folderColors && typeof raw.folderColors === "object" ? raw.folderColors : null;
      if (!byPath) {
        try {
          const p = `${this.app.vault.configDir}/plugins/folder-color-manager/data.json`;
          if (await this.app.vault.adapter.exists(p)) byPath = (JSON.parse(await this.app.vault.adapter.read(p)) || {}).folderColors;
        } catch (e) {
          console.error("[glass-shelf] folder colors import", e);
        }
      }
      const byName = {};
      for (const [path, hex] of Object.entries(byPath || {})) if (hexToRgb(hex)) byName[path.split("/").pop()] = hex;
      this.shared.folderColorsByName = byName;
      delete this.shared.folderColors;
      await this.saveData(this.shared);
    }

    this.registerEvent(
      this.app.workspace.on("file-menu", (menu, file) => {
        if (!(file instanceof TFolder) || file.isRoot()) return;
        menu.addItem((item) => item.setTitle(tr("폴더 색", "Folder color")).setIcon("palette").onClick(() => this.pickFolderColor(file)));
      })
    );
    // 폴더 이름을 바꾸면: 옛 이름을 쓰는 폴더가 더는 없으면 색을 새 이름으로 옮긴다 (새 이름에 이미 색이 있으면 그 색을 둔다).
    // 같은 이름 폴더가 남아 있으면 옛 이름의 색은 그대로 두고, 바뀐 폴더는 새 이름의 색(없으면 기본)을 따른다.
    // 옮기기만 하면(이름 그대로) 할 일이 없다. 지운 폴더의 이름은 같은 이름이 하나도 안 남았을 때 색을 지운다
    const nameUsed = (name) => this.app.vault.getAllLoadedFiles().some((f) => f instanceof TFolder && f.name === name);
    this.registerEvent(
      this.app.vault.on("rename", (file, oldPath) => {
        if (!(file instanceof TFolder)) return;
        const map = this.shared.folderColorsByName;
        const oldName = oldPath.split("/").pop();
        if (oldName === file.name || !map[oldName] || nameUsed(oldName)) return;
        if (!map[file.name]) map[file.name] = map[oldName];
        delete map[oldName];
        this.saveFolderColors();
      })
    );
    this.registerEvent(
      this.app.vault.on("delete", (file) => {
        if (!(file instanceof TFolder)) return;
        const map = this.shared.folderColorsByName;
        if (!map[file.name] || nameUsed(file.name)) return;
        delete map[file.name];
        this.saveFolderColors();
      })
    );
    this.app.workspace.onLayoutReady(() => this.requestFolderColors());
  }

  async saveFolderColors() {
    await this.saveData(this.shared);
    this.requestFolderColors(true);
  }

  // 색 고르기: 그 이름에 색을 정한다 (같은 이름 폴더 모두)
  pickFolderColor(folder) {
    const map = this.shared.folderColorsByName;
    new FolderColorModal(this.app, folder, map[folder.name], (hex) => {
      if (hex) map[folder.name] = hex;
      else delete map[folder.name];
      const n = this.app.vault.getAllLoadedFiles().filter((f) => f instanceof TFolder && f.name === folder.name).length;
      if (n > 1) new Notice(tr(`'${folder.name}' 이름의 폴더 ${n}개에 ${hex ? "색을 적용했습니다." : "지정한 색을 지웠습니다."}`, `${hex ? "Applied the color to" : "Cleared the color of"} ${n} folders named '${folder.name}'.`));
      this.saveFolderColors();
    }, this.folderPalette()).open();
  }

  // 색 고르기 창의 팔레트: 설정에서 고친 것(공유 data.json 의 folderPalette [[이름, "#hex"], …]), 없으면 기본(FOLDER_PALETTE)
  folderPalette() {
    const p = this.shared && this.shared.folderPalette;
    return Array.isArray(p) ? p : FOLDER_PALETTE;
  }

  // 이 이름을 쓰는 폴더 수
  folderCount(name) {
    return this.app.vault.getAllLoadedFiles().filter((f) => f instanceof TFolder && f.name === name).length;
  }

  // 폴더가 새로 그려질 때(펼치기·새 폴더) 다시 칠한다. 파일 탐색기 목록마다 한 번 감시를 단다
  requestFolderColors(all) {
    if (all) this.fcAll = true;
    if (this.fcFrame) return;
    this.fcFrame = window.requestAnimationFrame(() => {
      this.fcFrame = 0;
      const full = !!this.fcAll;
      this.fcAll = false;
      this.applyFolderColors(full);
    });
  }

  applyFolderColors(full) {
    const map = (this.shared && this.shared.folderColorsByName) || {};
    if (!this.fcWatched) {
      this.fcWatched = new WeakSet();
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
              // 줄무늬 층 안의 변화(막대 더하기·빼기)는 무시한다
              if (r.target.closest && r.target.closest(".lg-stripes")) continue;
              if (r.type === "childList") {
                if (Array.from(r.addedNodes).concat(Array.from(r.removedNodes)).every((nd) => nd.classList && nd.classList.contains("lg-stripes"))) continue;
                this.followStripes(list);
                return this.requestFolderColors();
              }
              const now = r.target.classList.contains("is-collapsed");
              const was = (r.oldValue || "").split(/\s+/).includes("is-collapsed");
              if (now !== was) {
                this.followStripes(list);
                return this.requestFolderColors();
              }
            }
          });
          obs.observe(list, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"], attributeOldValue: true });
          this.observers.push(obs);
          // 패널 폭이 바뀌면 줄무늬 막대 폭도 다시 맞춘다
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
  }

  // 파일 탐색기 줄무늬 (사용자 요청, macOS Finder 목록 보기 참고): 한 줄 건너 한 줄에 흰 줄 (CSS: .lg-stripes, 줄 곡률 그대로).
  // 줄 자체 배경으로 칠하면 들여쓰기 세로선을 덮어서, 목록 맨 뒤 층(.lg-stripes, z-index -1)에 막대를 따로 그린다.
  // 몇째 줄인지는 Finder 처럼 보이는 줄의 순서로 센다: 처음 그려진 줄의 번호만 위치(목록 위 여백을 뺀 거리 / 줄 높이)로 정하고
  // (Obsidian 은 보이는 부분만 그린다), 그다음은 DOM 순서대로 하나씩 더한다. 예전엔 줄마다 위치로 셌는데, 열고 닫는
  // 애니메이션 중에 움직이는 줄은 위치가 줄 높이의 배수가 아니라 줄무늬가 켜졌다 꺼졌다 깜빡였다(사용자 지적).
  // 막대는 줄마다 하나씩 붙여 두고(stripeBars) 그 줄을 따라 움직인다. 열리고 닫히는 폴더 안쪽 줄은 그 폴더의 보이는 영역으로 자른다.
  // 폭은 목록 안쪽 폭에서 맨 위 단계 줄의 좌우 여백을 뺀 값 (스크롤바가 생겨도 무늬 폭이 줄 폭을 따라 들쭉날쭉하지 않게).
  // 설정에서 끄면(fileStripes) 층을 비운다
  applyStripes(list) {
    this.rowExtent(list);
    let layer = list.querySelector(":scope > .lg-stripes");
    // 모바일에서는 줄무늬를 쓰지 않는다 (사용자 요청, 설정에서도 숨긴다)
    if (!this.settings.fileStripes || Platform.isMobile) {
      if (layer) layer.remove();
      list.classList.remove("lg-has-stripes");
      return;
    }
    if (!layer) {
      layer = createDiv({ cls: ["lg-stripes", INJECTED] });
      list.appendChild(layer); // 맨 끝에 둔다: Obsidian 가상 스크롤이 쓰는 첫 자식을 건드리지 않게
    }
    list.classList.add("lg-has-stripes");
    if (!this.stripeBars) this.stripeBars = new WeakMap();
    const rows = Array.from(list.querySelectorAll(".tree-item-self")).filter((r) => r.getClientRects().length);
    const lr = list.getBoundingClientRect();
    const rects = rows.map((r) => r.getBoundingClientRect());
    const top = (rc) => rc.top - lr.top + list.scrollTop;
    let step = list.lgStripeStep || 0;
    if (!step) {
      step = Infinity;
      for (let i = 1; i < rects.length; i++) {
        const d = rects[i].top - rects[i - 1].top;
        if (d > 4 && d < step) step = d;
      }
      if (!isFinite(step)) step = (rows[0] && rows[0].offsetHeight) || 28;
      else list.lgStripeStep = step;
    }
    const pad = parseFloat(getComputedStyle(list).paddingTop) || 0;
    const k0 = rows.length ? Math.round((top(rects[0]) - pad) / step) : 0;
    // 폭: 왼쪽은 목록 왼쪽 끝에서 알약 간격(--lg-gap)만큼 띄운 자리(줄 하이라이트와 같은 자리), 오른쪽은 목록 안쪽 끝(스크롤바 칸 왼쪽 끝)까지.
    // 막대와의 거리가 막대 둘레 테두리(창 가장자리와의 거리와 같다)가 된다 (사용자 요청)
    const keep = new Set();
    rows.forEach((r, i) => {
      if ((k0 + i) % 2 !== 1) return;
      const rc = rects[i];
      // 열리고 닫히는 폴더 안쪽: 감싼 하위 목록들의 보이는 아래 끝으로 자른다
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
      // 왼쪽은 목록 왼쪽 끝에서 알약 간격(--lg-gap)만큼 (줄 하이라이트와 같은 자리, 사용자 요청)
      const bl = this.rowGapLeft(list);
      bar.style.left = `${bl + list.scrollLeft}px`;
      bar.style.width = `${list.clientWidth - bl}px`;
      bar.style.height = `${h}px`;
    });
    for (const bar of Array.from(layer.children)) if (!keep.has(bar)) bar.remove();
  }

  // 줄 하이라이트(CSS: 파일 탐색기 .tree-item-self::before)를 줄무늬와 같은 폭으로: 왼쪽은 목록 왼쪽 끝에서 알약 간격(--lg-gap),
  // 오른쪽은 목록 안쪽 끝(스크롤바 칸 왼쪽 끝)까지. 맨 위 단계 줄(가장 넓은 줄)로 잰다 (사용자 요청)
  rowExtent(list) {
    const lr = list.getBoundingClientRect();
    const gl = this.rowGapLeft(list);
    // 줄마다 왼쪽 끝이 1px 씩 다를 수 있어, 왼쪽 늘림은 줄마다 정한다 (보이는 줄만. 새로 그려지는 줄은 감시가 다시 부른다)
    let wide = null;
    for (const r of list.querySelectorAll(".tree-item-self")) {
      const rc = r.getBoundingClientRect();
      if (!rc.width) continue;
      if (!wide || rc.width > wide.width) wide = rc;
      const l = `${Math.round((rc.left - lr.left - gl) * 10) / 10}px`;
      if (r.style.getPropertyValue("--lg-row-ext-l") !== l) r.style.setProperty("--lg-row-ext-l", l);
    }
    if (!wide) return;
    // 모바일은 스크롤바가 자리를 차지하지 않아 목록 안쪽 끝이 패널 끝이다. 왼쪽처럼 알약 간격만큼 띄운다 (사용자 요청, 태블릿)
    const right = Math.max(0, lr.left + list.clientLeft + list.clientWidth - wide.right - (Platform.isMobile ? gl : 0));
    const rr = `${Math.round(right * 10) / 10}px`;
    if (list.style.getPropertyValue("--lg-row-ext-r") !== rr) list.style.setProperty("--lg-row-ext-r", rr);
  }

  // 줄무늬·줄 하이라이트의 왼쪽 끝: 목록 왼쪽 끝에서 알약 간격(--lg-gap) (사용자 요청)
  rowGapLeft(list) {
    return parseFloat(getComputedStyle(list).getPropertyValue("--lg-gap")) || 10;
  }

  // 폴더를 열고 닫으면 Obsidian 애니메이션(약 0.2초) 동안 줄이 움직이므로, 그동안 매 프레임 막대를 줄 위치에 다시 맞춘다
  followStripes(list) {
    const win = list.ownerDocument.defaultView || window;
    list.lgStripeUntil = win.performance.now() + STRIPE_FOLLOW_MS;
    if (list.lgStripeLoop) return;
    const step = () => {
      if (!list.isConnected) return (list.lgStripeLoop = 0);
      this.applyStripes(list);
      if (win.performance.now() < list.lgStripeUntil) list.lgStripeLoop = win.requestAnimationFrame(step);
      else list.lgStripeLoop = 0;
    };
    list.lgStripeLoop = win.requestAnimationFrame(step);
  }

  // 이벤트가 몰려 와도 한 프레임에 한 번만 갱신
  requestRefresh() {
    if (this.frame) return;
    this.frame = window.requestAnimationFrame(() => {
      this.frame = null;
      this.refresh();
    });
  }

  refresh() {
    const ws = this.app.workspace;
    if (this.shared && this.shared.folderColorsByName) this.requestFolderColors();
    // 모바일 사이드바는 서랍(탭 줄 없음)이라 ··· · 닫기 버튼을 달지 않는다.
    // 대신 테마가 펼쳐 둔 보기 전환 줄에 선택 렌즈를 붙인다
    if (!Platform.isMobile) {
      this.setupSidebar(ws.leftSplit, "left");
      this.setupSidebar(ws.rightSplit, "right");
    } else {
      this.watchDrawerTabs(ws.leftSplit);
      this.watchDrawerTabs(ws.rightSplit);
      this.setupDrawerMore(ws.leftSplit);
      this.setupDrawerMore(ws.rightSplit);
    }
    this.markBareHeads(ws.leftSplit);
    this.markBareHeads(ws.rightSplit);
    // 휴대폰은 편집창 탭 줄이 없고 뷰 헤더가 그 버튼들을 가진다. 탭 줄 배치를 하면 뷰 헤더의 ⋮ · 읽기 모드 버튼까지 숨는다
    if (!Platform.isPhone) {
      ws.rootSplit.containerEl
        .querySelectorAll(".workspace-tabs")
        .forEach((tabsEl) => this.setupRootTabs(tabsEl));
    }
    if (!Platform.isPhone) ws.getLeavesOfType("kanban").forEach((l) => this.setupKanban(l.view));
    this.refractor.prune();
    if (this.refractOn()) {
      for (const [sel, strength] of Platform.isMobile ? REFRACT_TARGETS.concat(REFRACT_TARGETS_MOBILE) : REFRACT_TARGETS) {
        document.querySelectorAll(sel).forEach((el) => {
          if (el.matches(".titlebar-button-container.mod-right")) return; // 창 제어 알약은 wcRefract 가 맡는다
          this.refractor.attach(el, strength, false);
        });
      }
      this.wcRefract(document, document.body.classList.contains("lg-wc-hover"));
    }
  }

  // 사이드바 보기 중 머리 줄(.nav-header)에 버튼 줄 말고 보이는 것이 없는 보기에 lg-bare-head 를 붙인다.
  // 테마는 이런 보기의 내용을 탭 줄 밑까지 올려 그 아래로 스크롤되게 한다.
  // 예전엔 테마가 :has(… [style*="display: none"]) 로 직접 판정했는데, 파일·개요 항목을 끌 때 Obsidian 이
  // 매 움직임마다 인라인 스타일을 바꿔 그 판정이 계속 다시 돌며 렉이 걸렸다(추정). 판정은 머리 줄이 바뀔 때만 한다
  markBareHeads(split) {
    const c = split && split.containerEl;
    if (!c) return;
    if (!this.bareWatched) this.bareWatched = new WeakSet();
    c.querySelectorAll(".workspace-leaf-content").forEach((el) => {
      const sync = () => {
        const head = el.querySelector(":scope > .nav-header");
        const bare = !head || !Array.from(head.children).some((k) => !k.classList.contains("nav-buttons-container") && k.style.display !== "none");
        el.classList.toggle("lg-bare-head", bare);
      };
      sync();
      if (this.bareWatched.has(el)) return;
      this.bareWatched.add(el);
      // 머리 줄이 생기거나 바뀔 때만 다시 판정 (내용 칸은 보지 않는다)
      const obs = new MutationObserver((recs) => {
        if (recs.some((r) => r.target === el || (r.target.closest && r.target.closest(".nav-header") && r.target.closest(".workspace-leaf-content") === el))) sync();
      });
      obs.observe(el, { childList: true });
      const head = el.querySelector(":scope > .nav-header");
      if (head) obs.observe(head, { childList: true, subtree: true, attributes: true, attributeFilter: ["style"] });
      this.observers.push(obs);
    });
  }


  // ---------- 공통 ----------

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
  }

  // 버튼이 메뉴를 연다. 이 버튼이 연 메뉴가 열려 있으면 새로 열지 않고 닫는다.
  // 메뉴는 이 버튼을 부모(setParentElement)로 두므로, 열려 있는 동안 Obsidian 이 버튼에 has-active-menu 를 붙인다
  // (CSS: 버튼 기호가 회색. Obsidian 기본 버튼과 같은 표시)
  toggleMenu(el, open) {
    // 누를 때(mousedown) 이미 열려 있었으면 닫기만 한다 (그사이 닫혔어도 다시 열지 않는다)
    const wasOpen = el.lgWasOpen;
    el.lgWasOpen = false;
    if (wasOpen || el.classList.contains("has-active-menu")) {
      this.tellMenus(el, "click");
      return;
    }
    open();
  }

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
  }

  makeButton(cls, icon, tooltip, onClick) {
    const el = createDiv({ cls: ["clickable-icon", INJECTED, cls] });
    setIcon(el, icon);
    if (tooltip) setTooltip(el, tooltip);
    // 탭 헤더의 드래그·활성화 동작이 먼저 잡아가지 않도록 막는다.
    // 그러면 열린 메뉴가 "바깥을 눌렀다"는 걸 모르므로, 창에 따로 알려 다른 메뉴를 닫는다
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
  }

  // ---------- 사이드바 ----------

  setupSidebar(split, side) {
    if (!split || !split.containerEl) return;
    // 패널을 위아래로 나눈 탭 묶음(안쪽 분할 포함)마다 ··· 을 단다. 오른쪽 패널 닫기는 맨 위 묶음에만
    const groups = split.containerEl.querySelectorAll(".workspace-tabs");
    groups.forEach((tabsEl, i) => {
      this.watchSegments(tabsEl);
      const header = tabsEl.querySelector(":scope > .workspace-tab-header-container");
      if (!header) return;
      if (!header.querySelector(":scope > .lg-nav-more")) {
        // [탭] ··· [···]. ··· 이 오른쪽 끝이라, 탭마다 ··· 이 생기고 사라져도 탭 줄 스크롤이 밀리지 않는다
        const btn = this.makeButton("lg-nav-more", "more-horizontal", tr("메뉴", "Menu"), (e, el) =>
          this.toggleMenu(el, () => this.openNavMenu(tabsEl, el))
        );
        header.appendChild(btn);
      }
      // 맨 위 묶음의 편집창 쪽 끝에 패널 닫기: 오른쪽 [닫기] [탭] ··· [···], 왼쪽 [탭] ··· [···] [닫기].
      // 닫혀 있을 때는 원래 토글(탭 바·리본)이 그대로 보인다
      if (i === 0 && !split.containerEl.querySelector(".lg-panel-toggle")) {
        const left = side === "left";
        const close = this.makeButton("lg-panel-toggle", left ? "panel-left-close" : "panel-right-close", left ? tr("왼쪽 패널 닫기", "Close left sidebar") : tr("오른쪽 패널 닫기", "Close right sidebar"), () =>
          split.collapse()
        );
        if (left) {
          close.addClass("lg-panel-toggle-left");
          header.appendChild(close);
        } else {
          header.prepend(close);
        }
      }
      // 맨 위 묶음 탭 줄 맨 앞에 창 끌기 띠 (CSS: .lg-drag-band, 첫 줄만 창을 잡는다). 끌기 영역은 문서 순서대로 겹쳐
      // 뒤에 오는 버튼의 끌기 제외가 띠를 파내므로, 띠는 늘 첫 자식이어야 한다 (사용자 요청)
      if (i === 0) this.keepDragBand(header);
      this.updateNavMore(tabsEl);
    });
  }

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
    // 원래 버튼 줄을 지켜본다 (보기가 바뀌면 새 보기로 옮긴다)
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
        root.querySelectorAll(":scope > .nav-header, :scope > .search-row").forEach((el) =>
          obs.observe(el, { subtree: true, childList: true, attributes: true, attributeFilter: ["class", "aria-label", "style"] })
        );
        tabsEl.lgNavObs = obs;
        this.register(() => obs.disconnect());
      }
    }
    const buttons = this.navItemsOf(leaf);
    const kinds = buttons.map((b) => this.navKind(b));
    const run = row.querySelector(":scope > .lg-nav-run");
    const rest = row.querySelector(":scope > .lg-nav-rest");
    // 실행 버튼을 앞에, 나머지를 뒤에 (각각 원래 순서대로)
    const order = buttons.map((b, i) => i).filter((i) => kinds[i] === "run").concat(buttons.map((b, i) => i).filter((i) => kinds[i] !== "run"));
    const key = kinds.join(",");
    // 버튼 구성이 같으면 만든 버튼을 그대로 두고 상태만 고친다 (다시 만들면 누름 효과·호버가 끊긴다)
    if (row.lgNavKey !== key || row.lgNavLeaf !== leaf) {
      row.lgNavKey = key;
      row.lgNavLeaf = leaf;
      run.empty();
      rest.empty();
      order.forEach((i) => {
        const p = (kinds[i] === "run" ? run : rest).createDiv({ cls: ["clickable-icon", "lg-nav-btn"] });
        p.addEventListener("mousedown", (e) => {
          e.stopPropagation();
          p.lgWasOpen = !!(p.lgSrc && p.lgSrc.classList.contains("has-active-menu"));
          this.tellMenus(p, "mousedown");
        });
        p.addEventListener("pointerdown", (e) => e.stopPropagation());
        p.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          const src = p.lgSrc;
          if (!src || !src.isConnected) return;
          // 이 버튼이 연 메뉴가 열려 있으면 닫기만 한다
          if (p.lgWasOpen) {
            p.lgWasOpen = false;
            this.tellMenus(src, "click");
            return;
          }
          this.clickOriginal(src, p);
        });
      });
    }
    const proxies = Array.from(row.querySelectorAll(".lg-nav-btn"));
    order.forEach((bi, pi) => {
      const b = buttons[bi];
      const p = proxies[pi];
      if (!p) return;
      p.lgSrc = b;
      const svg = b.querySelector("svg");
      const icon = svg ? svg.getAttribute("class") : "";
      if (p.lgIcon !== icon) {
        p.lgIcon = icon;
        p.empty();
        if (svg) p.appendChild(svg.cloneNode(true));
      }
      const label = b.getAttribute("aria-label") || "";
      if (p.getAttribute("aria-label") !== label) setTooltip(p, label);
      p.classList.toggle("is-active", b.classList.contains("is-active"));
      p.classList.toggle("has-active-menu", b.classList.contains("has-active-menu"));
    });
    tabsEl.classList.toggle("lg-nav-two", buttons.length > 0);
    row.classList.toggle("lg-nav-none", buttons.length === 0);
    // 탭이 하나뿐인 묶음 (CSS: .workspace-tabs.lg-one). 테마가 :has(… :only-child) 로 보던 것을 대신한다
    const inner = header.querySelector(":scope > .workspace-tab-header-container-inner");
    tabsEl.classList.toggle("lg-one", !!inner && inner.querySelectorAll(":scope > .workspace-tab-header").length === 1);
  }

  // 버튼 종류: "menu" = 누르면 메뉴가 뜬다, "toggle" = 켜고 끈다(모두 접기·펼치기 포함, 사용자 요청), "run" = 눌러서 실행
  navKind(b) {
    if (this.opensMenu(b)) return "menu";
    const label = b.getAttribute("aria-label") || "";
    const svg = b.querySelector("svg");
    const icon = svg ? svg.getAttribute("class") || "" : "";
    // 한 번이라도 켜짐 표시가 붙었던 버튼은 토글
    this.toggleLabels = this.toggleLabels || new Set();
    if (b.classList.contains("is-active")) this.toggleLabels.add(label);
    if (this.toggleLabels.has(label)) return "toggle";
    if (/lucide-(chevrons-down-up|chevrons-up-down|gallery-vertical|sliders)/.test(icon)) return "toggle";
    if (/접기|펼치기|자동|보기|표시|설정|필터|collapse|expand|auto|show|toggle|setting|filter/i.test(label)) return "toggle";
    return "run";
  }

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
    const gap = parseFloat(getComputedStyle(header).columnGap) || 0;
    const kids = Array.from(header.children).filter(
      (c) => c !== sp && c !== inner && !c.classList.contains("lg-seg-indicator") && c.getClientRects().length && getComputedStyle(c).position !== "absolute"
    );
    // 머리 줄 안쪽 여백(창 제어 자리 등)도 양옆 고정 자리로 셈해, 패널 전체 기준으로 가운데 둔다.
    // 왼쪽 패널은 리본이 패널 왼쪽에 붙어 있으므로 리본까지 포함한 폭의 가운데에 둔다
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
    for (const c of Array.from(header.children)) {
      if (c === inner) after = true;
      if (!kids.includes(c)) continue;
      const w = c.classList.contains("lg-nav-more-off") ? 0 : c.offsetWidth + gap;
      if (after) R += w;
      else L += w;
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
  }

  // 사이드바 탭의 ··· 메뉴에 넣을 원래 버튼들: 버튼 줄(숨겨지지 않은 것) + 검색 탭의 검색 설정 버튼
  navItemsOf(leaf) {
    if (!leaf || !leaf.view || !leaf.view.containerEl) return [];
    const root = leaf.view.containerEl;
    const items = Array.from(root.querySelectorAll(":scope > .nav-header .nav-buttons-container > .clickable-icon")).filter(
      (b) => b.style.display !== "none"
    );
    const searchSettings = root.querySelector(":scope > .search-row > .clickable-icon");
    if (searchSettings) items.push(searchSettings);
    return items;
  }

  // 메뉴에 넣을 게 없는 탭이면 ··· 을 접는다
  updateNavMore(tabsEl) {
    const btn = tabsEl.querySelector(":scope > .workspace-tab-header-container > .lg-nav-more");
    if (!btn) return;
    btn.classList.toggle("lg-nav-more-off", this.navItemsOf(this.activeLeafOf(tabsEl)).length === 0);
    this.renderNavRow(tabsEl);
    this.balanceSide(tabsEl);
  }

  openNavMenu(tabsEl, anchor) {
    const leaf = this.activeLeafOf(tabsEl);
    const buttons = this.navItemsOf(leaf);
    // 메뉴를 여는 버튼(정렬 등)은 그 메뉴를 보이지 않게 열어 항목을 읽어 둔 뒤 하위 메뉴로 단다 (사용자 요청:
    // 누르면 부모 메뉴가 닫히고 하위 메뉴 화살표도 없었다). 읽는 동안 메뉴는 아직 열지 않는다
    if (!anchor.lgNavSnap) {
      const subs = buttons.filter((b) => this.opensMenu(b));
      if (subs.length) {
        anchor.lgNavSnap = true;
        const snaps = new Map();
        subs
          .reduce((p, b) => p.then(() => this.withHiddenMenu(b, (m) => this.readMenu(m)).then((v) => v && snaps.set(b, v))), Promise.resolve())
          .then(() => {
            anchor.lgNavSnap = false;
            this.showNavMenu(buttons, anchor, snaps);
          });
        return;
      }
    }
    this.showNavMenu(buttons, anchor, new Map());
  }

  // 버튼이 메뉴를 여는지: 정렬 버튼(이름·기호)이거나, 전에 눌렀을 때 메뉴가 열렸던 버튼
  opensMenu(b) {
    const label = b.getAttribute("aria-label") || "";
    if (this.menuButtons && this.menuButtons.has(label)) return true;
    const svg = b.querySelector("svg");
    const icon = svg ? Array.from(svg.classList).join(" ") : "";
    return /정렬|sort/i.test(label) || /lucide-(sort|arrow-up-narrow|arrow-down-narrow|arrow-up-down)/.test(icon);
  }

  // 메뉴 항목 목록 읽기: 제목·기호·체크·비활성·구분선
  readMenu(m) {
    return Array.from(m.querySelectorAll(".menu-item, .menu-separator")).map((el) => {
      if (el.classList.contains("menu-separator")) return { sep: true };
      const svg = el.querySelector(".menu-item-icon:not(.mod-checked) svg");
      const icon = svg ? Array.from(svg.classList).find((c) => c.startsWith("lucide-")) : null;
      return {
        title: (el.querySelector(".menu-item-title") || el).textContent.trim(),
        icon,
        checked: el.classList.contains("mod-checked") || !!el.querySelector(".mod-checked"),
        disabled: el.classList.contains("is-disabled"),
      };
    });
  }

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
        m = Array.from(doc.querySelectorAll(".menu")).find((x) => !before.has(x)) || null;
      } catch (err) {
        console.error("[glass-shelf] nav menu", err);
      }
      const done = (v) => {
        doc.body.classList.remove("lg-menu-snap");
        if (head) head.classList.remove("lg-nav-proxy");
        resolve(v);
      };
      if (!m) return done(null);
      m.lgSnap = true;
      // 새 메뉴는 준비(_loaded)된 뒤에야 바깥 누름 알림에 닫힌다
      win.setTimeout(() => {
        let v = null;
        try {
          v = run(m);
        } catch (err) {
          console.error("[glass-shelf] nav menu", err);
        }
        if (m.isConnected) this.tellMenus(b, "click");
        win.setTimeout(() => {
          if (m.isConnected) m.remove();
          done(v);
        }, m.isConnected ? 40 : 0);
      }, 40);
    });
  }

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
      (this.menuButtons || (this.menuButtons = new Set())).add(b.getAttribute("aria-label") || "");
      const obs = new MutationObserver(() => {
        if (b.classList.contains("has-active-menu") && b.isConnected) return;
        obs.disconnect();
        release();
      });
      obs.observe(b, { attributes: true, attributeFilter: ["class"] });
    }, 0);
  }

  showNavMenu(buttons, anchor, snaps) {
    const menu = new Menu();
    if (buttons.length === 0) {
      menu.addItem((item) => item.setTitle(tr("사용할 메뉴가 없습니다", "No menu items available")).setDisabled(true));
    }
    for (const b of buttons) {
      const svg = b.querySelector("svg");
      const icon = svg ? Array.from(svg.classList).find((c) => c.startsWith("lucide-")) : null;
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
              // 메뉴가 닫힌 뒤 원래 메뉴를 보이지 않게 다시 열어 같은 자리 항목을 누른다
              si.onClick(() => window.setTimeout(() => {
                this.withHiddenMenu(b, (m) => {
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

    // 양쪽 패널 모두 ··· 이 탭 줄 오른쪽 끝이라, 메뉴 오른쪽 끝을 ··· 버튼 오른쪽 끝에 맞춰 왼쪽으로 펼친다.
    // Obsidian 은 width·overlap 을 주면 x ~ x+width 사이에 붙이고, left 면 오른쪽 끝을 x+width 에 둔다
    const r = anchor.getBoundingClientRect();
    menu.setParentElement(anchor);
    menu.showAtPosition({ x: r.right - 1, y: r.bottom + MENU_DROP, width: 1, overlap: true, left: true });
  }

  // 모바일 서랍의 보기 전환 줄(테마가 Obsidian 보기 목록을 가로 알약으로 펼친 것)에 렌즈를 붙인다.
  // 목록 항목의 .is-active 는 Obsidian 이 바꾼다 (recomputeChildrenDimensions)
  watchDrawerTabs(drawer) {
    const opts = drawer && drawer.containerEl && drawer.containerEl.querySelector(".workspace-drawer-tab-options");
    const list = opts && opts.querySelector(":scope > .workspace-drawer-tab-options-list");
    if (!list || this.segWatched.has(opts)) return;
    this.segWatched.add(opts);
    const lens = new SegmentLens(opts, list, this);
    // 모바일 서랍 보기 전환은 렌즈가 위아래로 커지지 않는다 (사용자 요청)
    lens.keepH = true;
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
  }

  // 모바일 서랍: 지금 보기의 버튼 줄(새 노트·새 폴더·정렬 등, 테마가 숨긴다)을 서랍 머리 오른쪽 ··· 버튼의 메뉴로 모은다.
  // 메뉴 항목을 누르면 원래 버튼을 눌러 Obsidian 동작을 그대로 쓴다. 버튼 줄이 없는 보기에서는 ··· 을 숨긴다
  setupDrawerMore(drawer) {
    const c = drawer && drawer.containerEl;
    const head = c && c.querySelector(".workspace-drawer-header");
    const content = c && c.querySelector(".workspace-drawer-active-tab-content");
    if (!head || !content || head.querySelector(":scope > .lg-drawer-more")) return;
    const btn = head.createDiv({ cls: ["clickable-icon", "workspace-drawer-header-icon", "mod-raised", "lg-drawer-more", INJECTED] });
    setIcon(btn, "more-horizontal");
    btn.setAttribute("aria-label", tr("메뉴", "Menu"));
    // 버튼 줄 + 검색 탭의 검색 설정 버튼 (테마가 숨긴다. 데스크톱 navItemsOf 와 같다)
    const buttons = () => {
      const bar = content.querySelector(".nav-buttons-container");
      const list = bar
        ? Array.from(bar.querySelectorAll(":scope > .clickable-icon")).filter((b) => b.style.display !== "none" && !b.classList.contains("is-hidden"))
        : [];
      const searchSettings = content.querySelector('.workspace-leaf-content[data-type="search"] > .search-row > .clickable-icon');
      if (searchSettings) list.push(searchSettings);
      return list;
    };
    const sync = () => btn.toggle(buttons().length > 0);
    sync();
    btn.addEventListener("click", (e) => {
      // 이 버튼의 메뉴가 열려 있으면 닫기만 한다. 터치의 누름은 버튼 안이라 Obsidian 이 메뉴를 닫지 않고,
      // 그대로 새 메뉴를 열면 열린 메뉴 위에 하위 메뉴처럼 떠 왼쪽 위 기준으로 커지고 줄었다
      if (btn.classList.contains("has-active-menu")) {
        this.tellMenus(btn, "click");
        return;
      }
      // 다른 메뉴가 열려 있으면 먼저 닫는다
      if (btn.ownerDocument.querySelector(".menu:not(.lg-menu-ghost)")) this.tellMenus(btn, "mousedown");
      const list = buttons();
      if (!list.length) return;
      const menu = new Menu();
      for (const b of list) {
        const svg = b.querySelector("svg");
        const icon = svg && Array.from(svg.classList).find((k) => k !== "svg-icon");
        menu.addItem((item) => {
          item.setTitle(b.getAttribute("aria-label") || "");
          if (icon) item.setIcon(icon);
          if (b.classList.contains("is-active")) item.setChecked(true);
          // 메뉴가 닫힌 다음 누른다 (정렬처럼 버튼이 다시 메뉴를 여는 경우)
          item.onClick(() => window.setTimeout(() => b.isConnected && b.click(), 0));
        });
      }
      // 데스크톱 ··· 처럼 버튼에 붙여 연다: 오른쪽 끝을 버튼 오른쪽 끝에 맞춰 왼쪽으로 펼친다.
      // 버튼이 화면 아래쪽(보관함 줄)이면 버튼 위로 연다. Obsidian 은 메뉴가 아래로 넘치면 y 위로 올려 둔다
      const r = btn.getBoundingClientRect();
      const winH = btn.ownerDocument.documentElement.clientHeight;
      const up = r.top + r.height / 2 > winH / 2;
      menu.setParentElement(btn);
      menu.showAtPosition({ x: r.right - 1, y: up ? r.top - MENU_DROP : r.bottom + MENU_DROP, width: 1, overlap: true, left: true });
    });
    // 보기가 바뀌거나(active-tab-content 의 자식 교체) 보기가 늦게 그려질 때 ··· 을 보이거나 숨긴다
    const obs = new MutationObserver(sync);
    obs.observe(content, { subtree: true, childList: true });
    this.observers.push(obs);
  }

  // 사이드바 탭 그룹마다 렌즈 하나를 붙이고 선택 변화를 지켜본다
  watchSegments(tabsEl) {
    if (this.segWatched.has(tabsEl)) return;
    const header = tabsEl.querySelector(":scope > .workspace-tab-header-container");
    const inner = header && header.querySelector(":scope > .workspace-tab-header-container-inner");
    if (!inner) return;
    this.segWatched.add(tabsEl);

    const lens = new SegmentLens(header, inner, this);
    lens.prebake(inner.querySelector(":scope > .workspace-tab-header.is-active"));
    // 알약이 좁아 탭이 스크롤되면 유리 층(::after)이 따라 밀리지 않게 되돌려 둔다
    this.registerDomEvent(inner, "scroll", () => inner.style.setProperty("--lg-sx", `${inner.scrollLeft}px`), { passive: true });
    // 패널을 닫았다 열거나 폭이 바뀌면 가운데 맞춤을 다시 잰다. 닫힌 동안 잰 값(버튼이 안 보여 0)이 남아
    // 알약이 한쪽으로 치우치던 것
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
      else this.renderNavRow(tabsEl); // 탭이 생기거나 사라졌을 때 (lg-one)
      last = cur;
    });
    obs.observe(inner, { subtree: true, childList: true, attributes: true, attributeFilter: ["class"] });
    this.observers.push(obs);

    this.register(() => lens.stop());
  }

  // ---------- 편집창 탭 바 ----------

  setupRootTabs(tabsEl) {
    const header = tabsEl.querySelector(":scope > .workspace-tab-header-container");
    if (!header) return;

    // 유리판 층: 헤더 자체가 아닌 별도 층에 블러를 걸어야 안의 버튼들이 진짜 뒤 배경을 굴절시킨다
    if (!header.querySelector(":scope > .lg-slab")) {
      header.prepend(createDiv({ cls: ["lg-slab", INJECTED] }));
    }

    // 뒤로·앞으로: 탭 바 맨 왼쪽
    let nav = header.querySelector(":scope > .lg-tab-nav");
    if (!nav) {
      nav = createDiv({ cls: ["lg-tab-nav", INJECTED] });
      nav.appendChild(
        this.makeButton("lg-tab-back", "arrow-left", tr("뒤로", "Back"), () => this.goHistory(tabsEl, "back"))
      );
      nav.appendChild(
        this.makeButton("lg-tab-forward", "arrow-right", tr("앞으로", "Forward"), () => this.goHistory(tabsEl, "forward"))
      );
      header.prepend(nav);
    }

    // 리본 메뉴: 맨 위 왼쪽 탭 묶음의 뒤로·앞으로 왼쪽 (리본은 숨긴다)
    this.setupRibbonButtons(tabsEl, header, nav);

    // 읽기 모드 전환: 탭 목록 버튼 왼쪽
    let mode = header.querySelector(":scope > .lg-tab-mode");
    if (!mode) {
      mode = this.makeButton("lg-tab-mode", "book-open", tr("읽기/편집 전환", "Toggle reading/editing"), (e) => {
        const leaf = this.activeLeafOf(tabsEl);
        if (leaf && leaf.view instanceof MarkdownView && typeof leaf.view.onSwitchView === "function") {
          leaf.view.onSwitchView(e);
        }
        window.setTimeout(() => this.requestRefresh(), 50);
      });
      const tabList = header.querySelector(":scope > .workspace-tab-header-tab-list");
      header.insertBefore(mode, tabList || null);
    }

    // 경로 줄은 탭 줄(inner) 바로 앞에 둔다: 경로 표시를 켜면 첫 줄 가운데(탭 알약 자리)에 오고 탭 줄은 둘째 줄로 내려간다
    let path = header.querySelector(":scope > .lg-path");
    if (!path) {
      path = createDiv({ cls: ["lg-path", INJECTED] });
      const pill = path.createDiv("lg-path-pill");
      // 접힌 탭 줄에서는 제목 알약을 누르면 탭 줄을 편다 (폴더 이름·메뉴 동작 대신)
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
      // 경로 알약 안에서 이름을 바꾸는 동안 누른 키는 편집창 탭 줄까지 올려 보내지 않는다. 탭 줄이 스페이스를 받아
      // 이름 바꾸기가 바로 끝났다 (사용자 지적). 원래 자리(문서 위 줄)에서는 탭 줄을 거치지 않아 문제가 없었다
      for (const type of ["keydown", "keyup", "keypress"]) {
        pill.addEventListener(type, (e) => {
          if (isEl(e.target) && e.target.isContentEditable && !e.ctrlKey && !e.metaKey && !e.altKey) e.stopPropagation();
        });
      }
      // 지금 탭의 더 보기 메뉴 (경로 표시를 켜면 탭 안의 ≡ 대신 이것을 쓴다)
      pill.appendChild(
        this.makeButton("lg-path-menu", "menu", tr("더 보기", "More options"), (e, el) =>
          this.toggleMenu(el, () => {
            const leaf = this.activeLeafOf(tabsEl);
            if (leaf) this.openViewMenu(leaf, el);
          })
        )
      );
    }
    // 접힌 탭 줄에 마우스를 올리면 편다. 위로 스크롤해서 편 것과 같다: 다시 아래로 스크롤해야 접힌다 (사용자 요청).
    // 접힌 동안 마우스를 받는 것은 유리판과 제목 알약뿐이다(테마)
    // Obsidian 의 탭 줄에 다는 리스너라 플러그인을 끌 때 떼어지게 registerDomEvent 로 단다. 단 표시는 요소가 아니라 플러그인에 둔다
    // (요소에 두면 플러그인을 다시 켰을 때 이미 단 것으로 보고 건너뛴다)
    if (!this.miniWired) this.miniWired = new WeakSet();
    if (!this.miniWired.has(header)) {
      this.miniWired.add(header);
      this.registerDomEvent(header, "pointerover", () => {
        if (!tabsEl.classList.contains("lg-mini")) return; // 태블릿에서는 접힌 유리판을 누르면 편다
        tabsEl.lgMiniReset = true; // 다음 스크롤부터 방향을 새로 센다 (조금만 내려도 바로 접히지 않게)
        this.setMini(tabsEl, false);
      });
    }
    const tabInner = header.querySelector(":scope > .workspace-tab-header-container-inner");
    if (tabInner && path.nextSibling !== tabInner) header.insertBefore(path, tabInner);
    else if (!path.parentElement) header.appendChild(path);

    this.watchTabWidths(header.querySelector(":scope > .workspace-tab-header-container-inner"));

    // 각 탭 안의 메뉴 버튼 (활성 탭에서만 보임)
    const leaves = [];
    this.app.workspace.iterateAllLeaves((leaf) => {
      if (leaf.parent && leaf.parent.containerEl === tabsEl) leaves.push(leaf);
    });
    for (const leaf of leaves) {
      this.setupTabMenu(leaf);
      // 뷰가 바뀌면 헤더도 새로 만들어지므로 매번 다시 숨긴다
      const v = leaf.view;
      if (v && v.moreOptionsButtonEl) v.moreOptionsButtonEl.addClass(HIDDEN);
      if (v && v.modeButtonEl) v.modeButtonEl.addClass(HIDDEN);
    }

    this.keepDragBand(header);

    this.syncTabBar(tabsEl, nav, mode);
  }

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
  }

  // 왼쪽 리본을 숨기고(styles.css), 그 버튼들은 편집창 탭 줄 맨 왼쪽의 리본 메뉴 버튼 하나로 모은다 (사용자 요청).
  // 리본에 있던 왼쪽 패널 열기 토글은 리본이 숨으면 Obsidian 이 스스로 이 탭 줄 맨 왼쪽으로 옮긴다(패널이 닫혀 있을 때).
  // 데스크톱·태블릿(태블릿은 서랍 안 리본의 실행 버튼 묶음을 숨긴다, styles.css), 편집창의 맨 위 왼쪽 탭 묶음 하나에만 단다
  setupRibbonButtons(tabsEl, header, nav) {
    if (Platform.isPhone) return;
    const root = this.app.workspace.rootSplit;
    const first = !!root && root.containerEl.querySelector(".workspace-tabs") === tabsEl;
    let rib = header.querySelector(":scope > .lg-rib-menu");
    if (!first) {
      if (rib) rib.remove();
      return;
    }
    if (!rib) {
      rib = this.makeButton("lg-rib-menu", "layout-grid", tr("리본 메뉴", "Ribbon menu"), (e, el) => this.toggleMenu(el, () => this.openRibbonMenu(el)));
      header.insertBefore(rib, nav);
      if (header.lgBalanceObs) header.lgBalanceObs.observe(rib);
    }
  }

  // 숨긴 왼쪽 리본의 버튼들을 메뉴로 보인다. 항목을 누르면 원래 리본 버튼을 대신 눌러 Obsidian·플러그인 동작을 그대로 쓴다
  openRibbonMenu(anchor) {
    const doc = anchor.ownerDocument;
    const win = doc.defaultView || window;
    // 설정(외관 > 리본 메뉴)에서 숨긴 버튼은 뺀다. 순서는 리본에 놓인 순서(설정에서 바꾼 순서)를 따른다.
    // 메뉴를 열 때마다 새로 읽으므로 설정을 바꾸면 다음에 열 때 반영된다
    const rb = this.app.workspace.leftRibbon;
    const hidden = new Set(((rb && rb.items) || []).filter((i) => i.hidden).map((i) => i.buttonEl));
    const buttons = Array.from(doc.querySelectorAll(":is(.workspace-ribbon:is(.mod-left, .mod-primary), .workspace-drawer-ribbon) .side-dock-actions .side-dock-ribbon-action")).filter(
      (b) => !hidden.has(b) && !b.hidden && win.getComputedStyle(b).display !== "none"
    );
    // 태블릿은 서랍 리본을 통째로 숨기므로(styles.css) 그 아래쪽 버튼(보관함·도움말·설정)도 메뉴 끝에 둔다
    const extra = Array.from(doc.querySelectorAll(".workspace-drawer-ribbon .side-dock-settings [aria-label]"));
    const menu = new Menu();
    if (buttons.length === 0 && extra.length === 0) menu.addItem((item) => item.setTitle(tr("리본에 버튼이 없습니다", "No ribbon buttons")).setDisabled(true));
    let sep = buttons.length > 0;
    for (const b of buttons.concat(extra)) {
      if (sep && b === extra[0]) menu.addSeparator();
      const svg = b.querySelector("svg");
      const icon = svg ? Array.from(svg.classList).find((c) => c.startsWith("lucide-")) : null;
      menu.addItem((item) =>
        item
          .setTitle(b.getAttribute("aria-label") || "")
          .setIcon(icon || null)
          .onClick(() => {
            const r = anchor.getBoundingClientRect();
            win.setTimeout(() => {
              b.dispatchEvent(new win.MouseEvent("click", { bubbles: true, cancelable: true, view: win, clientX: r.left, clientY: r.bottom }));
            }, 0);
          })
      );
    }
    const r = anchor.getBoundingClientRect();
    menu.setParentElement(anchor);
    menu.showAtPosition({ x: r.left, y: r.bottom + MENU_DROP }, doc);
  }

  // inner(탭 줄)를 가진 탭 묶음 객체
  tabsOf(inner) {
    let found = null;
    this.app.workspace.iterateAllLeaves((l) => {
      if (l.parent && l.parent.tabsInnerEl === inner) {
        found = l.parent;
        return true; // 찾으면 순회를 멈춘다
      }
    });
    return found;
  }

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
  }

  setupTabMenu(leaf) {
    const inner = leaf.tabHeaderEl && leaf.tabHeaderEl.querySelector(".workspace-tab-header-inner");
    if (!inner || inner.querySelector(":scope > .lg-tab-menu")) return;
    const btn = this.makeButton("lg-tab-menu", "menu", tr("더 보기", "More options"), (e, el) => this.toggleMenu(el, () => this.openViewMenu(leaf, el)));
    inner.appendChild(btn);
  }

  // 뷰의 더 보기 메뉴를 연다 (탭 안의 ≡, 경로 알약의 ≡)
  openViewMenu(leaf, el) {
    const view = leaf.view;
    if (!view) return;
    if (typeof view.onMoreOptions === "function") {
      view.onMoreOptions({ preventDefault() {}, target: el });
    } else if (view.moreOptionsButtonEl) {
      view.moreOptionsButtonEl.click();
    }
  }

  goHistory(tabsEl, dir) {
    const leaf = this.activeLeafOf(tabsEl);
    if (!leaf) return;
    const view = leaf.view;
    const original = dir === "back" ? view.backButtonEl : view.forwardButtonEl;
    if (original) original.click();
    else if (leaf.history) dir === "back" ? leaf.history.back() : leaf.history.forward();
    window.setTimeout(() => this.requestRefresh(), 50);
  }

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
      Array.from(header.children).forEach((c) => c !== inner && c !== sp && header.lgBalanceObs.observe(c));
      // 끌 때 끊고 표시도 지운다 (남겨 두면 다시 켰을 때 감시를 새로 달지 않는다)
      this.register(() => {
        if (header.lgBalanceObs) header.lgBalanceObs.disconnect();
        delete header.lgBalanceObs;
      });
    }
    const hr = header.getBoundingClientRect();
    const cs = getComputedStyle(header);
    // 경로 표시를 켜면 탭 줄은 둘째 줄이고, 첫 줄 가운데에 둘 것은 경로 줄이다.
    // 탭 쌓기(스택) 모드는 탭 알약이 숨으므로 설정과 관계없이 경로 줄을 첫 줄 가운데에 둔다 (사용자 요청)
    const path = header.querySelector(":scope > .lg-path");
    const stacked = tabsEl.classList.contains("mod-stacked");
    const anchor = !Platform.isPhone && path && (stacked || this.settings.showPath) ? path : inner;
    // 화면 순서로 늘어놓는다: 왼쪽 패널 버튼·리본 메뉴는 CSS order 로 맨 앞에 오지만 문서 순서로는 뒤로·앞으로 다음에 있어,
    // 문서 순서로 보면 왼쪽 무리의 끝을 잘못 잡아 경로 알약이 오른쪽으로 치우쳤다 (태블릿, 사용자 지적)
    const kids = Array.from(header.children)
      .filter(
        (c) => c !== sp && (anchor === inner || c !== inner) && !c.classList.contains("lg-slab") && !c.classList.contains("lg-seg-indicator") && c.getClientRects().length && getComputedStyle(c).position !== "absolute"
      )
      .map((c, k) => ({ c, k, o: parseFloat(getComputedStyle(c).order) || 0 }))
      .sort((a, b) => a.o - b.o || a.k - b.k)
      .map((x) => x.c);
    const i = kids.indexOf(anchor);
    // 자리는 배치 자리(offset)로 잰다: 화면에 보이는 크기(getBoundingClientRect)는 버튼이 커지고 줄어드는 애니메이션(transform)
    // 도중의 크기라, 그때 재면 그 값으로 남아 탭 줄이 살짝 치우쳤다 (태블릿, 사용자 지적. transform 은 크기 감시에 안 걸려 다시 재지 않는다)
    const box = (c) => {
      if (c.offsetParent === header) return { left: c.offsetLeft, right: c.offsetLeft + c.offsetWidth, width: c.offsetWidth };
      const b = c.getBoundingClientRect();
      return { left: b.left - hr.left, right: b.right - hr.left, width: b.width };
    };
    const lefts = kids.slice(0, i).filter((c) => box(c).width > 0.5);
    const rights = kids.slice(i + 1).filter((c) => box(c).width > 0.5);
    // 왼쪽 무리의 끝은 요소들의 (오른쪽 끝 + 오른쪽 여백) 중 가장 큰 값 (사라지는 뒤로·앞으로 알약은 음수 여백으로 자리를 거둬들인다).
    // 오른쪽 무리의 시작은 요소들의 왼쪽 끝 중 가장 작은 값
    const L = lefts.length ? Math.max(...lefts.map((c) => box(c).right + (parseFloat(getComputedStyle(c).marginRight) || 0))) : parseFloat(cs.paddingLeft);
    const R = hr.width - (rights.length ? Math.min(...rights.map((c) => box(c).left)) : hr.width - parseFloat(cs.paddingRight));
    const diff = R - L;
    // 빈칸은 자기 옆 간격(gap)을 CSS 에서 되돌려 받으므로 폭 차이 그대로
    const w = Math.abs(diff);
    if (w < 1) {
      sp.hide();
      return;
    }
    const want = diff > 0 ? anchor : anchor.nextSibling;
    if (diff > 0 ? sp.nextSibling !== anchor : sp.previousSibling !== anchor) header.insertBefore(sp, want);
    sp.show();
    // 반올림하지 않는다: 버튼이 커지고 줄어드는 동안 반올림 오차만큼 탭 줄이 매 프레임 조금씩 흔들려, 굴절 유리가 떨려 보인다
    sp.style.flexBasis = `${w}px`;
  }

  // 탭 줄 축소: 편집창 본문(편집·읽기 보기의 스크롤 칸)의 스크롤 방향을 본다
  onMiniScroll(t) {
    if (!isEl(t) || !this.settings.miniBar) return;
    if (!t.matches(".cm-scroller, .markdown-preview-view")) return;
    const tabs = t.closest(".mod-root .workspace-tabs");
    if (!tabs || tabs.classList.contains("mod-stacked")) return;
    const y = t.scrollTop;
    const prev = t.lgMiniY == null ? y : t.lgMiniY;
    t.lgMiniY = y;
    if (tabs.lgMiniHold && performance.now() < tabs.lgMiniHold) {
      t.lgMiniDir = 0;
      return;
    }
    if (y < MINI_TOP) return this.setMini(tabs, false);
    const dir = Math.sign(y - prev);
    if (!dir) return;
    if (tabs.lgMiniReset) {
      tabs.lgMiniReset = false;
      t.lgMiniDir = 0;
    }
    if (dir !== t.lgMiniDir) {
      t.lgMiniDir = dir;
      t.lgMiniFrom = prev;
    }
    if (Math.abs(y - t.lgMiniFrom) >= MINI_STEP) this.setMini(tabs, dir > 0);
  }

  // 탭 줄을 접거나 편다 (CSS: .workspace-tabs.lg-mini). 최종 모습은 CSS 가 정하고, 바뀌는 값(유리판 높이, 경로 알약 폭·위치·크기,
  // 나머지 버튼·탭의 투명도·크기)은 바꾸기 전후 계산값 사이를 애니메이션한다. 도중에 다시 바뀌면 그 자리에서 이어 간다
  setMini(tabs, on) {
    if (tabs.classList.contains("lg-mini") === on) return;
    const header = tabs.querySelector(":scope > .workspace-tab-header-container");
    const win = tabs.ownerDocument.defaultView || window;
    const items = [];
    if (header) {
      for (const c of header.children) {
        if (c.classList.contains("lg-drag-band")) continue;
        if (c.classList.contains("lg-slab")) items.push([c, ["height"]]);
        else if (c.classList.contains("lg-path")) {
          const p = c.querySelector(".lg-path-pill");
          // 경로 표시를 끈 경우 알약은 접힐 때만 보인다 (나타날 때는 커지며 나타나고, 사라질 때는 바로 사라진다).
          // 폭은 애니메이션하지 않는다 (좌우로 좁아지는 움직임을 빼 달라는 사용자 요청)
          if (p) items.push([p, ["height", "translate", "scale", "opacity"]]);
        } else if (c.getClientRects().length) items.push([c, ["opacity", "scale", "translate", "visibility"]]);
      }
    }
    const read = () =>
      items.map(([el, ps]) => {
        const cs = win.getComputedStyle(el);
        const o = {};
        for (const p of ps) o[p] = cs[p];
        return o;
      });
    const from = read();
    const shown = items.map(([el]) => el.getClientRects().length > 0);
    // 사라지는 요소는 접힌 알약 자리(띠 가운데) 쪽으로 조금(거리의 MINI_PULL) 움직이며 작아진다 (사용자 요청).
    // 요소마다 그 이동량을 변수(--lg-mini-tx/ty)로 준다. offsetLeft/Top 은 애니메이션 중의 이동을 빼고 잰 자리다(탭 줄 기준)
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
    // 요소마다 걸린 CSS 전환(읽기 전환 버튼의 투명도 등)은 잠깐 끈다. 켜 두면 바꾼 직후 계산값이 아직 예전 값이라
    // 애니메이션이 건너뛰어지고, 그 요소만 자기 전환 시간대로 늦게 사라지고 나타났다 (사용자 제보)
    for (const [el] of items) el.classList.add("lg-no-tr");
    tabs.classList.toggle("lg-mini", on);
    const to = read();
    for (const [el] of items) el.classList.remove("lg-no-tr");
    items.forEach(([el], i) => {
      if (!el.getClientRects().length) return;
      if (!shown[i]) from[i] = { ...to[i], opacity: "0", scale: "0.7" };
      if (JSON.stringify(from[i]) === JSON.stringify(to[i])) return;
      const a = el.animate([from[i], to[i]], { duration: MINI_MS, easing: MINI_EASE });
      a.lgMini = true;
    });
    // 경로 글자는 바뀌는 순간 살짝 나타나게
    const text = header && header.querySelector(".lg-path-text");
    if (text) text.animate([{ opacity: 0 }, { opacity: 1 }], { duration: MINI_MS, easing: MINI_EASE });
  }

  // 경로 줄: 지금 탭 문서의 상위 폴더들(누르면 파일 탐색기에서 보여 줌) / 파일 이름
  updatePath(tabsEl, view) {
    const el = tabsEl.querySelector(":scope > .workspace-tab-header-container > .lg-path .lg-path-text");
    if (!el) return;
    const file = view && view.file;
    const key = file ? file.path : "";
    if (el.lgView === view && el.dataset.path === key) return;
    el.lgView = view;
    el.dataset.path = key;
    this.returnTitle(el);
    el.empty();
    if (!file) return;
    // 상위 폴더(view.titleParentEl)와 파일 이름(view.titleEl)은 새로 그리지 않고 Obsidian 원래 제목 줄의 요소를 옮겨 와 쓴다
    // (사용자 요청). 폴더를 누르면 보여 주기, 제목을 눌러 이름 바꾸기, 이름·위치가 바뀔 때 다시 쓰기는 Obsidian 이 그대로 한다
    el.lgMoved = [];
    for (const node of [view.titleParentEl, view.titleEl]) {
      if (!node || !node.parentElement) continue;
      el.lgMoved.push({ node, parent: node.parentElement, next: node.nextSibling });
      el.appendChild(node);
    }
    if (view.titleEl && view.titleEl.parentElement === el) view.titleEl.classList.add("lg-path-file");
  }

  // 옮겨 온 원래 요소를 제자리(문서 보기의 제목 줄)로 돌려보낸다. 넣을 때와 반대 순서로 돌려 순서가 그대로다
  returnTitle(el) {
    const moved = el.lgMoved || [];
    el.lgMoved = null;
    for (const { node, parent, next } of moved.reverse()) {
      node.classList.remove("lg-path-file");
      if (node.parentElement !== el) continue;
      parent.insertBefore(node, next && next.parentElement === parent ? next : null);
    }
  }

  // 원래 버튼의 상태를 새 버튼에 옮긴다
  syncTabBar(tabsEl, nav, mode) {
    const leaf = this.activeLeafOf(tabsEl);
    const view = leaf && leaf.view;

    const hist = leaf && leaf.history;
    const back = nav.querySelector(".lg-tab-back");
    const fwd = nav.querySelector(".lg-tab-forward");
    const canBack = !!hist && hist.backHistory.length > 0;
    const canFwd = !!hist && hist.forwardHistory.length > 0;
    back.toggleClass("is-disabled", !canBack);
    fwd.toggleClass("is-disabled", !canFwd);
    // 갈 곳이 없으면 알약째 접는다. 뒤로만 있으면 뒤로만, 앞으로가 있으면 둘 다 보인다
    const state = () => `${nav.hasClass("lg-nav-empty")}${fwd.hasClass("lg-nav-hide")}${mode.hasClass("lg-mode-off")}`;
    const was = state();
    back.toggleClass("lg-nav-hide", !canBack && !canFwd);
    fwd.toggleClass("lg-nav-hide", !canFwd);
    nav.toggleClass("lg-nav-empty", !canBack && !canFwd);

    this.updatePath(tabsEl, view);

    const isMd = view instanceof MarkdownView;
    // 숨길 때 바로 없애지 않고 폭을 접어서, 탭 길이가 부드럽게 바뀌게 한다
    mode.classList.remove(HIDDEN);
    mode.classList.toggle("lg-mode-off", !isMd);

    this.balanceTabs(tabsEl);
    // 뒤로·앞으로·읽기 모드 버튼이 나타나고 사라지는 동안(0.24초) 매 프레임 다시 맞춘다.
    // 크기 감시(ResizeObserver)에만 맡기면 가운데 맞춤 빈칸이 한 박자 늦게 따라가 탭 알약이 흔들린다
    if (was !== state()) {
      const win = nav.ownerDocument.defaultView || window;
      const t0 = win.performance.now();
      const step = () => {
        this.balanceTabs(tabsEl);
        if (win.performance.now() - t0 < 280) win.requestAnimationFrame(step);
      };
      win.requestAnimationFrame(step);
    }
    if (isMd) {
      const reading = view.getMode() === "preview";
      const icon = reading ? "edit-3" : "book-open";
      if (mode.dataset.icon !== icon) {
        setIcon(mode, icon);
        mode.dataset.icon = icon;
        setTooltip(mode, reading ? tr("편집 모드로 전환", "Switch to editing view") : tr("읽기 모드로 전환", "Switch to reading view"));
      }
    }
  }
};

// 렌즈 움직임 (탭 렌즈·토글 공통). u: 0~1 진행도, reach: 0~1 이동 거리 비율
// ease: 위치 (천천히 출발·천천히 도착), g: 렌즈 정도 (시작·끝 0, 가운데 1),
// d: 가로로 늘고 세로로 눌리는 정도 (속도에 비례, 시작·끝 0)
function lensMotion(u, reach) {
  const ease = u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
  const vel = u < 0.5 ? 12 * u * u : 3 * Math.pow(-2 * u + 2, 2); // 0~3
  const g = Math.pow(Math.sin(Math.PI * u), 0.6);
  const d = 0.5 * reach * (vel / 3);
  return { ease, g, d };
}

const LENS_CLEAR_K = 2.2; // 토글 손잡이가 투명해지는 속도 배율 (렌즈 정도 대비)
const LENS_TG_TALL = 3; // 토글 렌즈가 되었을 때 실제 높이가 더 커지는 양(px)

// 사이드바 탭 렌즈 움직임 (사용자 설명, 26.10.06). 오른쪽 → 왼쪽 이동이면 왼쪽 끝이 "도착 쪽 끝".
// "작아짐·커짐"은 곡률을 지킨 채 실제 폭·높이가 바뀌는 것, "찌그러짐"은 잡고 늘리거나 누른 것처럼 변형(scale)되는 것.
// 1) 이동: TAB_LENS_MS 만에 선택 알약이 렌즈로 바뀐다 (높이 = 컨테이너 알약, 폭 = 선택 알약 + 기본 탭 폭 × (TAB_LENS_W − 1)). 도착 근처까지 유지
// 2) 커짐: 도착 전 TAB_GROW_MS 동안 더 커진다 (높이 = 컨테이너 알약 × TAB_LENS_H2, 폭 = 기본 탭이 그만큼 커질 때와 같은 px 만큼 더)
// 3) 작아짐: 도착 쪽 끝은 그대로, 반대쪽 끝이 관성처럼 밀려와 찌그러지고(TAB_SQUASH), 이어 폭이 늘어나게 찌그러지며
//    높이는 조금 낮아진다(TAB_STRETCH·TAB_STRETCH_H). 그동안 렌즈가 선택 알약 크기로 작아지며 유리가 빠지고, 가장 길 때 끝난다
// 4) 원상복구: 길고 조금 낮은 찌그러짐이 선택 알약 비율로 돌아온다
const TAB_LENS_MS = 80; // 선택 알약 → 렌즈
const TAB_PRESS_K = 0.5; // 패널 탭을 누를 때 탭 줄 알약이 커지는 정도 (다른 알약 대비)
const TAB_LENS_W = 1.15; // 이동 중 렌즈 폭 (기본 탭 폭 대비, 더하는 양은 절대값)
const TAB_GROW_MS = 90; // 도착 전 커지는 시간
const TAB_LENS_H2 = 1.08; // 커졌을 때 높이 (컨테이너 알약 높이 대비)
const TAB_SHRINK_MS = 280; // 작아짐 (렌즈 → 선택 알약)
const TAB_SQUASH = 0.414; // 기본 탭(33.8px) 기준 약 14px.  반대쪽 끝이 밀려와 폭이 눌리는 정도
const TAB_SQUASH_AT = 0.25; // 작아짐 구간에서 가장 눌리는 지점 (0~1)
const TAB_SQUASH_HOLD = 0.25; // 가장 눌린 채 머무는 길이 (작아짐 구간 대비, 사용자 요청)
const TAB_STRETCH = 0.08; // 작아짐이 끝날 때 폭이 늘어난 정도
const TAB_STRETCH_H = 0.08; // 그때 높이가 낮아진 정도
// 모바일 서랍 보기 전환: 이동 중 높이는 선택 알약 그대로, 도착 전 선택 알약의 이 배율로 커지고, 눌림은 이만큼 (사용자 요청)
const MOBILE_TAB_GROW = 1.1;
const MOBILE_TAB_SQUASH = 0.1;
const TAB_RESTORE_MS = 600; // 원상복구
// 폭 쪽 변화(렌즈 폭·커짐·눌림·늘어남)는 탭 폭의 비율이 아니라 기본 탭(높이 × 이 비율, 이름 없는 34px 탭) 기준의 절대값(px)이다.
// 이름·넓게로 탭이 길어져도 같은 만큼만 변한다 (사용자 요청: 비율이면 긴 탭에서 너무 튄다)
const TAB_REF_RATIO = 1.3;
// 이동 시간(ms): 거리에 따라 늘되 상한이 있다
const tabTravelMs = (dist) => Math.min(220, 130 + dist * 0.6);
// 이동 곡선: 완만한 가속·감속 (2차)
const tabTravelEase = (u) => (u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2);

// =========================================================
// 사이드바 탭 렌즈.
// 회색 선택 알약이 출발하며 유리 렌즈로 부풀어 옮겨 가고, 도착하면 회색 알약으로 줄어든다 (움직임은 위 TAB_* 상수)
// =========================================================
class SegmentLens {
  constructor(header, inner, plugin) {
    this.header = header;
    this.inner = inner;
    this.plugin = plugin;
    this.el = null;
    this.raf = null;
    this.cur = null; // 지금 보이는 위치 {cx, cy, w, h}
  }

  ensureEl() {
    if (this.el && this.el.isConnected) return this.el;
    // 헤더에 렌즈는 하나만
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

  moveTo(fromTab, toTab) {
    // 효과 없음 설정이면 렌즈를 띄우지 않는다
    if (this.plugin.settings.tabAnim === "none") return this.stop();
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
  filterAt(w, h) {
    const q = (v) => Math.max(4, Math.round(v / 2) * 2);
    return this.plugin.refractor.filterFor(q(w), q(h), 42, false, true, this.header.ownerDocument, undefined, undefined, LENS_TAB);
  }

  // 탭 하나가 지나는 렌즈 크기들의 지도를 쉬는 틈에 미리 굽는다. 처음 탭을 바꿀 때 매 프레임 새 지도를 굽느라 끊기던 것 (측정 확인)
  prebake(tab) {
    if (!this.plugin.refractOn() || !tab || this.plugin.settings.tabAnim === "none") return;
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
    const w2 = r.width + h2 * TAB_REF_RATIO - R;
    // 출발 알약 → 렌즈 → 커진 렌즈 → 선택 알약
    const legs = [[r.width, r.height, w1, h1], [w1, h1, w2, h2], [w2, h2, r.width, r.height]];
    const sizes = [];
    for (const [w0, h0, wa, ha] of legs) for (let k = 0; k <= 1.0001; k += 0.05) sizes.push([w0 + (wa - w0) * k, h0 + (ha - h0) * k]);
    const win = this.header.ownerDocument.defaultView || window;
    const idle = win.requestIdleCallback ? (fn) => win.requestIdleCallback(fn, { timeout: 2000 }) : (fn) => win.setTimeout(fn, 50);
    const next = () =>
      idle((dl) => {
        while (sizes.length && (!dl || dl.timeRemaining() > 4)) {
          const [w, h] = sizes.shift();
          try {
            this.filterAt(w, h);
          } catch (err) {
            console.error("[glass-shelf] prebake", err);
            return;
          }
        }
        if (sizes.length) next();
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

    // 도착할 탭의 지금 자리 (··· 이 접히거나 펼쳐져 탭 줄이 밀리면 따라간다).
    // 출발점도 같은 만큼 옮긴다 (탭 줄 전체가 함께 밀리므로)
    const live = this.toTab && this.toTab.isConnected ? this.rectOf(this.toTab) : this.to;
    const a = Object.assign({}, this.from, { cx: this.from.cx + live.cx - this.to.cx, cy: this.from.cy + live.cy - this.to.cy });
    const b = live;
    const dir = Math.sign(b.cx - a.cx) || 1;
    const lerp = (p, q, k) => p + (q - p) * k;
    const smooth = (x) => x * x * (3 - 2 * x);
    const clamp01 = (x) => Math.min(1, Math.max(0, x));

    const Hc = this.inner.getBoundingClientRect().height || b.h;
    // 기본 탭 폭 R 기준의 절대값: 렌즈 폭은 R × 0.15 만큼 넓고, 커진 렌즈는 기본 탭이 커질 때와 같은 px 만큼 넓다
    const R = b.h * TAB_REF_RATIO;
    const w1 = b.w + R * (TAB_LENS_W - 1);
    const h1 = this.keepH ? b.h : Hc;
    const h2 = this.keepH ? b.h * MOBILE_TAB_GROW : Hc * TAB_LENS_H2;
    const SQ = this.keepH ? MOBILE_TAB_SQUASH : TAB_SQUASH;
    const w2 = b.w + h2 * TAB_REF_RATIO - R;
    // 도착 쪽 끝: 선택 알약의 그쪽 끝. 도착하는 순간부터 끝까지 여기 선다
    const lead = b.cx + (dir * b.w) / 2;

    // bw·bh: 실제 크기(곡률 유지), sx·sy: 찌그러짐, cx: 보이는 가운데, g: 렌즈 정도
    let bw;
    let bh;
    let sx = 1;
    let sy = 1;
    let cx;
    let cy;
    let g;
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
    this.raf = window.requestAnimationFrame((tt) => this.step(tt));
  }
}

// =========================================================
// 굴절: kube.io 방식.
// 볼록 스퀘어클 곡면의 가장자리(베젤)에서 스넬 법칙으로 빛이 꺾이는 양을 계산해
// 변위맵(R = x, G = y)으로 굽고, SVG feDisplacementMap을 backdrop-filter로 건다.
// 색수차(RGB 채널마다 다르게 휘어 생기는 무지개 번짐)는 필터 비용이 세 배라 모든 곳에서 끈다 (chroma 인자는 남겨 둠)
// =========================================================
class Refractor {
  constructor() {
    this.enabled = false;
    // 창(document)마다 SVG 필터 모음이 따로 있어야 url(#id)가 그 창에서 보인다
    this.stores = new Map();
    this.maps = new Map();
    // 크기가 바뀌는 동안(애니메이션·창 크기 조절)은 기존 필터를 두고, 멈춘 뒤 한 번만 새 크기로 굽는다
    this.resizeObs = new ResizeObserver((entries) => {
      for (const e of entries) {
        const el = e.target;
        if (!el.lgRefract) continue;
        window.clearTimeout(el.lgRfTimer);
        el.lgRfTimer = window.setTimeout(() => el.lgRefract && this.update(el), 150);
      }
    });
    this.tracked = new Set();
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
    st = { svg, defs, filters: new Map() };
    this.stores.set(doc, st);
    return st;
  }

  // strength: 휘는 세기(px), chroma: 색수차 여부, w/h를 주면 그 크기로 고정
  // outward: true면 탭 렌즈·토글 렌즈용 축소 렌즈(가운데는 작게, 테두리로 갈수록 크게, bakeLensMap),
  // false면 가장자리에서 안쪽 내용을 끌어와 가장자리가 부풀어 보인다(bakeMap)
  attach(el, strength, chroma, w, h, outward, look) {
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

  update(el) {
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
  filterFor(w, h, strength, chroma, outward, doc = document, bezel = BEZEL_RATIO, spread = REFRACT_SPREAD, lens = LENS_DEFAULT, bezelMax = BEZEL_MAX) {
    // 렌즈(outward)는 가장자리 굴절 대신 축소 렌즈 지도(bakeLensMap)를 쓴다. 세기는 지도가 정한다.
    // lens 는 렌즈 굴절 값 묶음. 기본값이 아니면 id 에 값을 붙여 따로 굽는다
    const bz = Math.round(bezel * 100);
    const sp = Math.round(spread * 100);
    const lensTag = lens === LENS_DEFAULT ? "lens" : `lens-${[lens.minify, lens.flat, lens.edge, lens.reach, lens.shape || 2].join("-").replace(/\./g, "p")}`;
    const bm = Math.round(bezelMax * 10);
    const mapKey = outward ? `${w}x${h}-${lensTag}` : `${w}x${h}-b${bz}-s${sp}-m${bm}`;
    if (!this.maps.has(mapKey)) {
      this.maps.set(mapKey, outward ? this.bakeLensMap(w, h, lens) : { url: this.bakeMap(w, h, false, bezel, spread, bezelMax) });
      // 변위 맵 캐시는 최근 80개만 (오래된 것부터 버린다)
      if (this.maps.size > 80) this.maps.delete(this.maps.keys().next().value);
    }
    const baked = this.maps.get(mapKey);
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
  pruneFilters(doc, st, keep) {
    const inUse = new Set([keep]);
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
    const cv = document.createElement("canvas");
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
  bakeLensMap(w, h, lens = LENS_DEFAULT) {
    const M = lens.minify;
    const T = lens.flat;
    const E = lens.edge;
    const R = lens.reach;
    const S = lens.shape || 2;
    const RXR = parseFloat(getComputedStyle(document.body).getPropertyValue("--lg-pill-rx")) || 0.5;
    const L = 1 - T;
    // f(t) = 읽는 자리 - t. 가운데(t <= T)는 기울기 M-1, 바깥 띠는 (T, (M-1)T, 기울기 M-1) 에서
    // (1, R-1, 기울기 E-1) 로 이어지는 3차 곡선. 가운데 배율이 1이어도 테두리 값만으로 띠가 휜다
    const f = (t) => {
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
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const px = x + 0.5 - ax;
        const py = y + 0.5 - ay;
        // 렌즈 가운데에서의 거리 (테두리 = 1). S 가 1 이하면 알약, 2면 타원, 클수록 둥근 사각형을 따라간다
        const t = S <= 1 ? pillT(px, py, ax, ay, RXR) : S === 2 ? Math.hypot(px / ax, py / ay) : (Math.abs(px / ax) ** S + Math.abs(py / ay) ** S) ** (1 / S);
        if (t >= 1 || t < 1e-6) continue;
        const k = ratio(t);
        const j = y * w + x;
        ox[j] = px * k;
        oy[j] = py * k;
        max = Math.max(max, Math.abs(ox[j]), Math.abs(oy[j]));
      }
    }
    max = Math.max(max, 0.5);
    const cv = document.createElement("canvas");
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

class GlassShelfSettingTab extends PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  // 설정을 바꿔 항목이 생기거나 사라질 때 다시 그린다. 다시 그리면(비우고 채움) 스크롤이 맨 위로 가므로 자리를 지킨다
  redraw() {
    // 스크롤되는 상자: 설정 내용 자신이거나 그 바깥 (테마가 별도 창에선 바깥 상자를 스크롤시킨다)
    let el = this.containerEl;
    while (el && el.parentElement && el.scrollHeight <= el.clientHeight + 1 && !el.classList.contains("modal")) el = el.parentElement;
    const top = el ? el.scrollTop : 0;
    this.display();
    if (el) el.scrollTop = top;
  }

  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.addClass("lg-settings");
    // 묶음 제목 (위에 여백, CSS: .lg-settings .lg-settings-group)
    const group = (name) => new Setting(containerEl).setName(name).setHeading().setClass("lg-settings-group");
    // 위 설정을 켜거나 고르면 생기는 하위 항목: 왼쪽으로 들여 구별한다 (CSS: .lg-settings-sub)
    const sub = (setting) => setting.setClass("lg-settings-sub");

    group(tr("유리", "Glass"));
    new Setting(containerEl)
      .setName(tr("유리 투명도", "Glass opacity"))
      .setDesc(tr("숫자가 클수록 유리가 덜 투명해집니다. 0은 맑은 유리이고, 1~5는 유리 뒤의 내용이 배경색 쪽으로 점점 옅어지며, 6~10은 그 위에 색을 채워 점점 뿌옇게 만듭니다. 버튼과 편집창 위쪽 유리판에 적용되며 메뉴와 팝업은 제외됩니다.", "Higher values make the glass less transparent. 0 is clear glass; 1–5 gradually fade what is behind the glass toward the background color; 6–10 add a fill on top that makes it increasingly frosted. Applies to buttons and the glass panel above the editor, not to menus and popups."))
      .addSlider((slider) =>
        slider
          .setLimits(0, 10, 1)
          .setValue(this.plugin.settings.glassLevel)
          .setDynamicTooltip()
          .onChange(async (value) => {
            this.plugin.settings.glassLevel = value;
            await this.plugin.saveSettings();
          })
      )
      .addExtraButton((btn) =>
        btn
          .setIcon("rotate-ccw")
          .setTooltip(tr("기본값으로 되돌리기", "Restore default"))
          .onClick(async () => {
            this.plugin.settings.glassLevel = DEFAULTS.glassLevel;
            await this.plugin.saveSettings();
            this.redraw();
          })
      );

    new Setting(containerEl)
      .setName(tr("틴트", "Tint"))
      .setDesc(tr("유리에 옅은 색을 입힙니다. 버튼, 탭, 메뉴, 팝업에 함께 적용됩니다.", "Adds a light color to the glass. Applies to buttons, tabs, menus and popups."))
      .addDropdown((d) =>
        d
          .addOption("none", tr("없음 (투명)", "None (clear)"))
          .addOption("accent", tr("강조색", "Accent color"))
          .addOption("obsidian", tr("Obsidian 보라", "Obsidian purple"))
          .addOption("custom", tr("색상 지정", "Custom color"))
          .setValue(this.plugin.settings.tint)
          .onChange(async (value) => {
            this.plugin.settings.tint = value;
            await this.plugin.saveSettings();
            this.redraw();
          })
      );

    if (this.plugin.settings.tint === "custom") {
      sub(new Setting(containerEl).setName(tr("틴트 색", "Tint color"))).addColorPicker((c) =>
        c.setValue(this.plugin.settings.tintColor).onChange(async (value) => {
          this.plugin.settings.tintColor = value;
          await this.plugin.saveSettings();
        })
      );
    }

    if (this.plugin.settings.tint !== "none") {
      sub(new Setting(containerEl))
        .setName(tr("틴트 세기", "Tint strength"))
        .setDesc(tr("1은 아주 옅게, 10은 가장 진하게 입힙니다.", "1 is very light, 10 is the strongest."))
        .addSlider((slider) =>
          slider
            .setLimits(1, 10, 1)
            .setValue(this.plugin.settings.tintLevel)
            .setDynamicTooltip()
            .onChange(async (value) => {
              this.plugin.settings.tintLevel = value;
              await this.plugin.saveSettings();
            })
        );

      sub(new Setting(containerEl))
        .setName(tr("흰색 글자", "White text"))
        .setDesc(tr("유리 위의 아이콘과 글자를 흰색으로 표시합니다. 진한 틴트와 잘 어울립니다. 다크 모드에서는 원래 흰색이라 차이가 없습니다.", "Shows icons and text on glass in white. Works well with strong tints. No difference in dark mode, where they are already white."))
        .addToggle((t) =>
          t.setValue(!!this.plugin.settings.tintWhiteInk).onChange(async (value) => {
            this.plugin.settings.tintWhiteInk = value;
            await this.plugin.saveSettings();
          })
        );
    }

    new Setting(containerEl)
      .setName(tr("불투명한 팝업", "Opaque popups"))
      .setDesc(tr("대화상자, 명령 팔레트, 링크 미리보기, 알림, 툴팁 같은 팝업의 배경입니다. 끄면 메뉴처럼 뒤가 살짝 비치고, 켜면 불투명하게 채웁니다.", "Background of popups such as dialogs, the command palette, link previews, notices and tooltips. Off: slightly see-through like menus. On: filled opaque."))
      .addToggle((t) =>
        t.setValue(!!this.plugin.settings.popupOpaque).onChange(async (value) => {
          this.plugin.settings.popupOpaque = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName(tr("굴절", "Refraction"))
      .setDesc(tr("유리 가장자리에서 뒤 배경이 렌즈처럼 휘어 보입니다. 화면이 느려지면 꺼 주세요. iOS와 iPadOS에서는 지원되지 않습니다.", "Bends the background at the glass edges like a lens. Turn off if the app feels slow. Not supported on iOS and iPadOS."))
      .addToggle((t) =>
        t.setValue(this.plugin.settings.refraction).onChange(async (value) => {
          this.plugin.settings.refraction = value;
          await this.plugin.saveSettings();
        })
      );
    new Setting(containerEl)
      .setName(tr("큰 호버 효과", "Large hover effect"))
      .setDesc(tr("버튼에 마우스를 올렸을 때 나타나는 유리의 크기입니다. 끄면 버튼에 맞춰 작게, 켜면 버튼 묶음의 높이만큼 크게 표시됩니다.", "Size of the glass that appears when hovering a button. Off: fits the button. On: as tall as the button group."))
      .addToggle((t) =>
        t.setValue(this.plugin.settings.hoverLarge).onChange(async (value) => {
          this.plugin.settings.hoverLarge = value;
          await this.plugin.saveSettings();
        })
      );

    if (!Platform.isMobile) new Setting(containerEl)
      .setName(tr("창 제어 버튼 축소", "Compact window controls"))
      .setDesc(tr("최소화, 최대화, 닫기 버튼을 평소에는 작은 점으로 줄여 두고, 마우스를 올리면 원래 크기로 보여 줍니다. 줄어든 만큼 탭 줄이 넓어집니다. (Windows, Linux)", "Shrinks the minimize, maximize and close buttons to small dots until you hover them. The tab bar gets the freed space. (Windows, Linux)"))
      .addToggle((t) =>
        t.setValue(!!this.plugin.settings.compactWindowControls).onChange(async (value) => {
          this.plugin.settings.compactWindowControls = value;
          await this.plugin.saveSettings();
        })
      );

    group(tr("편집창", "Editor"));
    if (!Platform.isPhone) new Setting(containerEl)
      .setName(tr("경로 표시", "Show path"))
      .setDesc(tr("편집창 탭 줄 위쪽 가운데에 현재 문서의 경로를 표시하고, 탭은 그 아래 줄에 좌우 폭을 모두 써서 배치합니다. 폴더 이름을 누르면 파일 탐색기에서 해당 폴더를 보여 줍니다. (데스크톱, 태블릿)", "Shows the current note's path at the top center of the editor tab bar and moves the tabs to a full-width row below. Click a folder name to reveal it in the file explorer. (Desktop, tablet)"))
      .addToggle((t) =>
        t.setValue(!!this.plugin.settings.showPath).onChange(async (value) => {
          this.plugin.settings.showPath = value;
          await this.plugin.saveSettings();
        })
      );

    if (!Platform.isPhone) new Setting(containerEl)
      .setName(tr("스크롤 시 탭 줄 축소", "Collapse tab bar on scroll"))
      .setDesc(tr("편집창을 아래로 스크롤하면 탭 줄을 접고 현재 문서 제목만 작게 표시합니다. 위로 스크롤하거나 제목을 누르면 다시 펼칩니다. (데스크톱, 태블릿)", "Scrolling down in the editor collapses the tab bar to a small title of the current note. Scroll up or click the title to expand it again. (Desktop, tablet)"))
      .addToggle((t) =>
        t.setValue(!!this.plugin.settings.miniBar).onChange(async (value) => {
          this.plugin.settings.miniBar = value;
          if (!value) document.querySelectorAll(".workspace-tabs.lg-mini").forEach((el) => this.plugin.setMini(el, false));
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName(tr("제목 아래 가로줄", "Line under headings"))
      .setDesc(tr("제목(H1~H6) 아래에 얇은 가로줄을 긋습니다. 라이트 모드에서는 검은색, 다크 모드에서는 흰색입니다.", "Draws a thin line under headings (H1–H6). Black in light mode, white in dark mode."))
      .addToggle((t) =>
        t.setValue(!!this.plugin.settings.headingRule).onChange(async (value) => {
          this.plugin.settings.headingRule = value;
          await this.plugin.saveSettings();
        })
      );

    group(tr("사이드바 탭", "Sidebar tabs"));
    new Setting(containerEl)
      .setName(tr("탭 전환 효과", "Tab switch effect"))
      .setDesc(tr("렌즈: 선택 표시가 렌즈처럼 미끄러지며 옮겨 갑니다. 없음: 효과 없이 선택한 탭을 강조색으로 표시합니다.", "Lens: the selection slides over like a lens. None: no effect; the selected tab is shown in the accent color."))
      .addDropdown((d) =>
        d
          .addOption("lens", tr("렌즈", "Lens"))
          .addOption("none", tr("없음 (강조색)", "None (accent color)"))
          .setValue(this.plugin.settings.tabAnim)
          .onChange(async (value) => {
            this.plugin.settings.tabAnim = value;
            await this.plugin.saveSettings();
          })
      );

    if (!Platform.isMobile) new Setting(containerEl)
      .setName(tr("탭 줄 넓게", "Wide tab bar"))
      .setDesc(tr("사이드바 탭을 사이드바 좌우 끝까지 넓히고, 보기의 버튼들을 펼쳐서 보여 줍니다. 맨 위 탭 묶음은 버튼 줄 아래로 한 줄 내려 배치합니다. (데스크톱, 태블릿)", "Stretches the sidebar tabs across the full sidebar width and shows the view's buttons expanded. The top tab group moves one row down, below the button row. (Desktop, tablet)"))
      .addToggle((t) =>
        t.setValue(!!this.plugin.settings.tabWide).onChange(async (value) => {
          this.plugin.settings.tabWide = value;
          await this.plugin.saveSettings();
        })
      );

    if (!Platform.isMobile) new Setting(containerEl)
      .setName(tr("탭 이름 표시", "Show tab names"))
      .setDesc(tr("사이드바 탭 아이콘 옆에 이름을 표시합니다. 탭이 하나뿐인 묶음은 이 설정과 관계없이 이름을 표시합니다. (데스크톱, 태블릿)", "Shows names next to sidebar tab icons. Groups with a single tab always show the name. (Desktop, tablet)"))
      .addToggle((t) =>
        t.setValue(!!this.plugin.settings.tabNames).onChange(async (value) => {
          this.plugin.settings.tabNames = value;
          await this.plugin.saveSettings();
        })
      );

    group(tr("토글과 체크박스", "Toggles and checkboxes"));
    new Setting(containerEl)
      .setName(tr("토글·슬라이더 iOS 색상", "iOS colors for toggles and sliders"))
      .setDesc(tr("켜면 토글은 초록색, 슬라이더는 파란색으로 표시합니다. 끄면 둘 다 강조색을 사용합니다.", "On: toggles are green and sliders are blue. Off: both use the accent color."))
      .addToggle((t) =>
        t.setValue(this.plugin.settings.toggleColor !== "accent").onChange(async (value) => {
          this.plugin.settings.toggleColor = value ? "green" : "accent";
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName(tr("할 일 체크박스 모양", "Task checkbox style"))
      .setDesc(tr("체크: 색이 채워진 원에 체크 표시가 나타납니다. 링: 테두리 원 안에 작은 원이 나타납니다.", "Check: a filled circle with a check mark. Ring: a small dot inside an outlined circle."))
      .addDropdown((d) =>
        d
          .addOption("check", tr("체크", "Check"))
          .addOption("ring", tr("링", "Ring"))
          .setValue(this.plugin.settings.taskStyle)
          .onChange(async (value) => {
            this.plugin.settings.taskStyle = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName(tr("할 일 체크박스 색", "Task checkbox color"))
      .addDropdown((d) =>
        d
          .addOption("yellow", tr("노랑", "Yellow"))
          .addOption("accent", tr("강조색", "Accent color"))
          .addOption("custom", tr("색상 지정", "Custom color"))
          .setValue(this.plugin.settings.taskColor)
          .onChange(async (value) => {
            this.plugin.settings.taskColor = value;
            await this.plugin.saveSettings();
            this.redraw();
          })
      );

    if (this.plugin.settings.taskColor === "custom") {
      sub(new Setting(containerEl).setName(tr("체크박스 색 지정", "Checkbox color"))).addColorPicker((c) =>
        c.setValue(this.plugin.settings.taskColorCustom).onChange(async (value) => {
          this.plugin.settings.taskColorCustom = value;
          await this.plugin.saveSettings();
        })
      );
    }

    group(tr("파일 탐색기", "File explorer"));
    if (!Platform.isMobile) new Setting(containerEl)
      .setName(tr("줄무늬 배경", "Striped rows"))
      .setDesc(tr("파일 목록에 한 줄씩 번갈아 줄무늬를 깔아 항목을 구분하기 쉽게 합니다.", "Alternates row backgrounds in the file list so items are easier to tell apart."))
      .addToggle((t) =>
        t.setValue(!!this.plugin.settings.fileStripes).onChange(async (value) => {
          this.plugin.settings.fileStripes = value;
          await this.plugin.saveSettings();
          this.plugin.requestFolderColors(true);
        })
      );


    new Setting(containerEl)
      .setName(tr("폴더 아이콘 색", "Folder icon color"))
      .addDropdown((d) =>
        d
          .addOption("blue", tr("기본 파랑", "Default blue"))
          .addOption("accent", tr("강조색", "Accent color"))
          .addOption("custom", tr("색상 지정", "Custom color"))
          .setValue(this.plugin.settings.folderColor)
          .onChange(async (value) => {
            this.plugin.settings.folderColor = value;
            await this.plugin.saveSettings();
            this.redraw();
          })
      );

    if (this.plugin.settings.folderColor === "custom") {
      sub(new Setting(containerEl).setName(tr("폴더 아이콘 색 지정", "Folder icon color"))).addColorPicker((c) =>
        c.setValue(this.plugin.settings.folderColorCustom).onChange(async (value) => {
          this.plugin.settings.folderColorCustom = value;
          await this.plugin.saveSettings();
        })
      );
    }

    this.displayFolderColors(containerEl, group);
  }

  // 폴더 색 관리: 이름별로 지정된 색(바꾸기·지우기·더하기)과 색 고르기 창의 팔레트(고치기·끌어서 순서·더하기·빼기·기본으로).
  // 둘 다 data.json 에 둔다.
  // 줄은 위아래를 줄여 표처럼 쓴다 (CSS: .lg-fc-row, 사용자 요청)
  displayFolderColors(containerEl, group) {
    const pl = this.plugin;
    const map = pl.shared.folderColorsByName || (pl.shared.folderColorsByName = {});
    group(tr("폴더 색", "Folder color"));
    new Setting(containerEl).setDesc(
      tr("폴더 이름별로 색을 지정합니다. 이름이 같은 폴더는 위치와 관계없이 같은 색이 되고, 하위 폴더와 문서는 따로 지정하지 않으면 상위 폴더의 색을 따릅니다. 파일 탐색기에서 폴더를 우클릭한 뒤 '폴더 색'을 선택해도 지정할 수 있습니다.", "Assigns colors by folder name. Folders with the same name get the same color wherever they are, and subfolders and notes follow their parent's color unless set separately. You can also right-click a folder in the file explorer and choose 'Folder color'.")
    );

    // 지정된 색: [이름 ……… 폴더 n곳 | 색 | 지우기]
    const names = Object.keys(map).sort((x, y) => x.localeCompare(y, "ko"));
    if (!names.length) new Setting(containerEl).setName(tr("지정된 색 없음", "No colors assigned")).setClass("lg-settings-sub").setClass("lg-fc-row");
    for (const name of names) {
      const n = pl.folderCount(name);
      const row = new Setting(containerEl)
        .setName(name)
        .setClass("lg-settings-sub")
        .setClass("lg-fc-row")
        .addColorPicker((c) =>
          c.setValue(map[name]).onChange(async (value) => {
            map[name] = value.toUpperCase();
            await pl.saveFolderColors();
          })
        )
        .addExtraButton((btn) =>
          btn
            .setIcon("trash-2")
            .setTooltip(tr("색 지우기", "Clear color"))
            .onClick(async () => {
              delete map[name];
              await pl.saveFolderColors();
              this.redraw();
            })
        );
      row.controlEl.prepend(createSpan({ cls: "lg-fc-count", text: n ? tr(`폴더 ${n}개`, `${n} folder${n === 1 ? "" : "s"}`) : tr("해당 폴더 없음", "No matching folders") }));
    }
    // 더하기: 폴더 이름과 색
    let newName = "";
    let newHex = (pl.folderPalette()[0] || ["", "#4981D0"])[1];
    new Setting(containerEl)
      .setName(tr("색 추가", "Add color"))
      .setClass("lg-settings-sub")
      .setClass("lg-fc-row")
      .addText((t) => t.setPlaceholder(tr("폴더 이름", "Folder name")).onChange((v) => (newName = v.trim())))
      .addColorPicker((c) => c.setValue(newHex).onChange((v) => (newHex = v.toUpperCase())))
      .addButton((btn) =>
        btn.setButtonText(tr("추가", "Add")).onClick(async () => {
          if (!newName) return;
          map[newName] = newHex;
          await pl.saveFolderColors();
          this.redraw();
        })
      );

    // 팔레트
    new Setting(containerEl)
      .setName(tr("팔레트", "Palette"))
      .setDesc(tr("폴더 색 선택 창에 표시되는 색입니다. 오른쪽 손잡이를 끌어 순서를 바꿀 수 있고, 색 코드 칸에 HEX 값을 붙여 넣을 수도 있습니다. 팔레트를 바꿔도 이미 지정한 폴더 색은 바뀌지 않습니다.", "Colors shown in the folder color picker. Drag the handle on the right to reorder, or paste a HEX value into the color code field. Changing the palette does not change colors already assigned to folders."))
      .addExtraButton((btn) =>
        btn
          .setIcon("rotate-ccw")
          .setTooltip(tr("기본 팔레트로 되돌리기", "Restore default palette"))
          .onClick(async () => {
            delete pl.shared.folderPalette;
            await pl.saveData(pl.shared);
            this.redraw();
          })
      );
    // 고칠 때 기본 팔레트를 복사해 공유 설정에 둔다
    const edit = async (fn) => {
      if (!Array.isArray(pl.shared.folderPalette)) pl.shared.folderPalette = FOLDER_PALETTE.map((c) => c.slice());
      fn(pl.shared.folderPalette);
      await pl.saveData(pl.shared);
    };
    const rows = [];
    pl.folderPalette().forEach(([name, hex], i) => {
      let picker = null;
      let code = null;
      const setHex = (v) => edit((p) => (p[i][1] = v));
      const st = new Setting(containerEl)
        .setClass("lg-settings-sub")
        .setClass("lg-fc-row")
        .setClass("lg-fc-pal-row")
        .addText((t) => t.setValue(name).setPlaceholder(tr("이름", "Name")).onChange((v) => edit((p) => (p[i][0] = v.trim() || name))))
        // 색 코드: 복사·붙여 넣기용. #은 없어도 된다. 올바른 6자리일 때만 반영한다
        .addText((t) => {
          code = t;
          t.inputEl.addClass("lg-fc-hex");
          t.inputEl.spellcheck = false;
          t.setValue(hex.toUpperCase()).onChange((v) => {
            const m = /^#?([0-9a-f]{6})$/i.exec(v.trim());
            if (!m) return;
            const h = "#" + m[1].toUpperCase();
            if (picker) picker.setValue(h.toLowerCase());
            setHex(h);
          });
          t.inputEl.addEventListener("blur", () => {
            const cur = (pl.folderPalette()[i] || [])[1];
            if (cur) t.setValue(cur.toUpperCase());
          });
        })
        .addColorPicker((c) => {
          picker = c;
          c.setValue(hex.toLowerCase()).onChange((v) => {
            if (code) code.setValue(v.toUpperCase());
            setHex(v.toUpperCase());
          });
        })
        .addExtraButton((btn) =>
          btn
            .setIcon("trash-2")
            .setTooltip(tr("팔레트에서 빼기", "Remove from palette"))
            .onClick(async () => {
              await edit((p) => p.splice(i, 1));
              this.redraw();
            })
        );
      // 끌어서 순서 바꾸기 (손잡이는 줄 오른쪽 끝). 브라우저 끌어 놓기 대신 포인터로 직접 옮긴다: 끄는 동안 줄이 커서 위치의
      // 다른 줄 사이(각 줄의 위아래 가운데 기준)로 바로 들어가고, 놓으면 그 순서를 저장한다.
      // 움직임·놓기는 손잡이가 아니라 문서 전체에서 받는다: 줄을 DOM 에서 옮기면 손잡이의 포인터 잡기(capture)가 풀려,
      // 한 칸 옮긴 뒤로 움직임도 놓기도 안 와서 한 칸만 움직이고 끄는 표시(회색)가 남았다
      const el = st.settingEl;
      el.lgIdx = i;
      rows.push(el);
      const grip = createDiv({ cls: "lg-fc-grip" });
      setIcon(grip, "grip-vertical");
      setTooltip(grip, tr("끌어서 순서 바꾸기", "Drag to reorder"));
      el.appendChild(grip);
      grip.addEventListener("pointerdown", (e) => {
        if (e.button !== 0) return;
        e.preventDefault();
        const doc = grip.ownerDocument;
        el.addClass("lg-fc-dragging");
        doc.body.addClass("lg-fc-sorting"); // 끄는 동안 글자 선택 막기
        const move = (ev) => {
          const others = rows.filter((r) => r !== el);
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
        const up = async () => {
          doc.removeEventListener("pointermove", move);
          doc.removeEventListener("pointerup", up);
          doc.removeEventListener("pointercancel", up);
          el.removeClass("lg-fc-dragging");
          doc.body.removeClass("lg-fc-sorting");
          const order = rows
            .slice()
            .sort((x, y) => (x.compareDocumentPosition(y) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1))
            .map((r) => r.lgIdx);
          if (order.every((k, j) => k === j)) return;
          await edit((p) => {
            const copy = p.slice();
            p.splice(0, p.length, ...order.map((k) => copy[k]));
          });
          this.redraw();
        };
        doc.addEventListener("pointermove", move);
        doc.addEventListener("pointerup", up);
        doc.addEventListener("pointercancel", up);
      });
    });
    new Setting(containerEl)
      .setClass("lg-settings-sub")
      .setClass("lg-fc-row")
      .addButton((btn) =>
        btn.setButtonText(tr("팔레트에 색 추가", "Add color to palette")).onClick(async () => {
          await edit((p) => p.push([tr("새 색", "New color"), "#888888"]));
          this.redraw();
        })
      );
  }
}
