// 호버 유리가 뜨는 요소들 (테마의 '호버 유리' 목록과 같아야 한다)
// 편집창 탭(제목·X·≡)은 플랫한 하이라이트라 빠진다
// 호버 유리를 요소(.lg-hover-glass)로 받는 아이콘 버튼 (나머지 호버 유리는 ::before)
export const HOVER_ICON = ".clickable-icon:not(.lg-tab-menu):not(.workspace-tab-header-inner-close-button), .bases-toolbar .bases-toolbar-item > .text-icon-button, .bases-kanban-column-footer > .text-icon-button";
export const HOVER_GLASS = [
  ".clickable-icon:not(.lg-tab-menu):not(.workspace-tab-header-inner-close-button)",
  ".workspace-drawer-vault-switcher",
  ".bases-toolbar .bases-toolbar-item > .text-icon-button",
  ".bases-kanban-column-footer > .text-icon-button",
  ".mod-left-split .workspace-tab-header",
  ".mod-right-split .workspace-tab-header",
  ".titlebar-button-container.mod-right .titlebar-button",
  "input.task-list-item-checkbox",
].join(", ");

// 클릭 효과: 단독 원형 버튼(유리가 흰색으로 부풀었다 돌아온다)
export const PRESS_POP = [
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
  ".bases-kanban-column-footer > .text-icon-button",
].join(", ");

// 버튼 → 메뉴(창): 버튼은 메뉴 가운데를 향해 MORPH_DASH 만큼 돌진하며 사라지고, 메뉴는 그 지점에서 넓어져 나온다.
// 닫힐 때는 거기서 나타나 반대쪽으로 MORPH_OVERSHOOT 만큼 지나쳤다가 제자리로 온다. 크기와 상관없이 같은 거리(px)
export const MORPH_DASH = 30;
// Bases 툴바에서 메뉴를 여는 버튼들: 보관함 버튼처럼 메뉴 쪽으로 돌진하고 메뉴는 버튼에서 넓어진다 (사용자 요청).
// 메뉴 자리는 Obsidian 이 정한 대로(버튼 왼쪽 끝, 버튼 아래)
export const BASES_MENU_BTN = ":is(.bases-toolbar-views-menu, .bases-toolbar-result-count, .bases-toolbar-sort-menu, .bases-toolbar-group-menu, .bases-toolbar-filter-menu, .bases-toolbar-properties-menu) > .text-icon-button";
// 모바일 누름 효과: 시작을 늦추는 시간(ms)과 스크롤로 보는 손가락 이동 거리(px)
export const PRESS_DELAY_MS = 90;
// 꾹 눌렀다 뗄 때 가장 커진 모습에서 원래대로 돌아오는 시간(ms)
export const HOLD_RETURN_MS = 260;
// 꾹 누를 때 가장 큰 자리 앞 이만큼의 진행도 구간에서 재생 속도를 차츰 늦춰 부드럽게 멈춘다
export const HOLD_EASE_SPAN = 0.14;
export const PRESS_SLOP = 10;
export const MORPH_OVERSHOOT = 5;
// 창이 펼쳐질 때 펼쳐지는 방향으로 살짝 밀렸다 돌아오는 거리(px)
export const MORPH_NUDGE = 3;
// 버튼 밑에 여는 메뉴(패널 ···, 편집창 ≡·탭 목록)와 버튼 사이 간격(px)
export const MENU_DROP = 6;

// 움직임 곡선. 테마의 --lg-ease-* 와 같은 값이다 (WAAPI 는 CSS 변수를 못 읽어 따로 적는다)
// 넓게 모드 패널 검색: 돋보기 버튼이 넓어질 최대 폭, 그만큼 넓히려면 버튼 줄에 남아야 할 최소 빈 폭 (navSearchSync)
export const NAV_SEARCH_MAX = 240;
export const NAV_SEARCH_MIN = 120;

export const EASE = {
  move: "cubic-bezier(0.65, 0, 0.35, 1)",
  settle: "cubic-bezier(0.3, 0, 0.2, 1)",
  pop: "cubic-bezier(0.3, 1.3, 0.5, 1)",
  exit: "cubic-bezier(0.4, 0, 1, 1)",
  burst: "cubic-bezier(0.2, 0.7, 0.3, 1)",
  ret: "cubic-bezier(0.45, 0, 0.35, 1)",
  press: "cubic-bezier(0.3, 0, 0.3, 1)",
};

export const STRIPE_FOLLOW_MS = 400; // 폴더를 열고 닫은 뒤 줄무늬를 매 프레임 따라 맞추는 시간 (Obsidian 애니메이션보다 넉넉히)
export const DRAG_SCROLL_ZONE = 48; // 끌기 자동 스크롤: 보이는 위·아래 끝에서 이 거리(px) 안이면 스크롤
export const DRAG_SCROLL_MAX = 14; // 끝에 붙었을 때 한 프레임 스크롤 양(px)
export const TASK_PRESS_MS = 260; // 할 일 체크박스를 누르면 작아졌다 되돌아오는 시간
export const MENU_MOVE_MS = 320; // 같은 대상을 다시 우클릭했을 때 메뉴가 새 자리로 옮겨 가는 시간

// 패널을 여닫는 토글. 누르면 패널이 접히거나 펼쳐지며 다른 자리의 토글로 바뀐다
export const PANEL_TOGGLES = ".sidebar-toggle-button .clickable-icon, .lg-panel-toggle";

// 클릭 효과: 한 번 누르고 마는 알약 안 버튼(누른 자리에서 흰 그라데이션이 퍼진다)
// 알약 안 버튼을 누를 때 퍼지는 흰 빛 지름 = 알약 높이 × RIPPLE_K. 2 면 누른 자리에서 알약 높이만큼 퍼진다 (사용자 요청)
export const RIPPLE_K = 6;
// 알약 안 흰 빛이 가장 밝은(불투명) 채로 퍼지는 구간: 전체 시간 중 이 비율까지는 흐려지지 않는다 (사용자 요청: 더 밝게)
export const RIPPLE_HOLD = 0.6;
// 메뉴 항목을 누를 때 흰 빛의 처음 크기 (다 퍼진 크기 대비)
export const MENU_RIPPLE_FROM = 0.5;
// 패널 탭(효과 없음 모드)을 누를 때 흰 빛이 다 퍼진 지름 = 알약 높이 × TAB_RIPPLE_K
export const TAB_RIPPLE_K = 16;
export const PRESS_RIPPLE = [
  ".lg-kb-group .clickable-icon",
  ".lg-tab-tools .clickable-icon",
  ".lg-tab-nav .clickable-icon",
  ".lg-nav-run .clickable-icon",
  ".lg-path-pill .clickable-icon",
  ".side-dock-actions .side-dock-ribbon-action",
  ".side-dock-settings .side-dock-ribbon-action",
  ".titlebar-button-container.mod-right .titlebar-button",
].join(", ");

// 버튼이 든 컨테이너 알약
export const PRESS_PILL = ".lg-kb-group, .lg-tab-tools, .lg-tab-nav, .lg-nav-run, .lg-path-pill, .side-dock-actions, .side-dock-settings, .workspace-tab-header-container-inner, .titlebar-button-container.mod-right, .workspace-drawer-vault-switcher";

// 버튼 묶음 알약: 누를 때 커지는 정도를 줄인다 (GROUP_PRESS_K 배, 사용자 요청)
export const PRESS_GROUP = ".lg-kb-group, .lg-tab-tools, .lg-tab-nav, .lg-nav-run, .lg-path-pill";
export const GROUP_PRESS_K = 0.5;

// 클릭 효과: 커졌다가 줄어든다 (패널 탭, 뒤로·앞으로, 리본, 창 제어)
export const PRESS_SCALE = [
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
  ".workspace-drawer-vault-switcher",
].join(", ");

// 모바일 클릭 효과. 모바일 유리는 요소 자체(.mod-raised)에 그려져 있어 요소를 통째로 키우고 하얗게 한다
// 단독 원형 버튼: 커지며 흰색이 됐다가 돌아온다
export const MOBILE_PRESS_POP = [
  ".sidebar-toggle-button.mod-raised",
  ".workspace-drawer-header-icon.mod-raised",
  ".modal-close-button.mod-raised",
  ".modal-header-button.mod-raised",
  ".modal-setting-back-button.mod-raised",
  ".mobile-toolbar-floating-options",
  ".mobile-tab-switcher-menu-spacer > .clickable-icon",
].join(", ");

// 버튼이 든 알약: 안 버튼(MOBILE_PRESS_BTN)을 누르면 알약이 통째로 커지며 하얘진다. 서랍 보기 전환 줄은 커지기만 (패널 탭과 같다)
export const MOBILE_PRESS_PILL = ".is-floating-nav .mobile-navbar.mod-raised, .view-header .view-actions.mod-raised, .mobile-toolbar-options-list-container.mod-raised, .workspace-drawer-tab-options-list, .mobile-tab-switcher-menu-button";
export const MOBILE_PRESS_BTN = ".clickable-icon, button, .mobile-navbar-action, .mobile-toolbar-option, .workspace-tab-header, .mobile-tab-switcher-menu-button";

// 스크롤 시 탭 줄 축소 (사용자 요청, 사파리 주소창처럼): 맨 위에서 MINI_TOP(px) 넘게 내려온 뒤
// 한 방향으로 MINI_STEP(px) 넘게 스크롤하면 접거나(아래로) 편다(위로). 파일을 열거나 탭을 바꾼 직후 MINI_HOLD(ms)는
// 스크롤 위치 복원 때문에 생기는 스크롤을 무시한다
// 메뉴가 열릴 때 살짝 더 커지는 양(px). 메뉴의 긴 변이 이만큼 커지고, 짧은 변은 같은 비율로 따라 커져 모양(가로세로 비)은 그대로다.
// 비율이 아니라 절대값이라 큰 메뉴도 작은 메뉴도 긴 변이 같은 만큼 커진다 (사용자 요청).
// 테마 애니메이션(lg-menu-in)이 쓰는 배율(--lg-menu-kx/ky)을 메뉴 크기로 바꿔 넣는다
export const MENU_POP = 4;
export const MINI_TOP = 40;
export const MINI_STEP = 24;
export const MINI_HOLD = 400;
export const MINI_MS = 280;
export const MINI_EASE = "cubic-bezier(0.2, 0.8, 0.2, 1)";
export const MINI_PULL = 0.3; // 사라지는 요소가 알약 쪽으로 움직이는 비율 (거리 전체가 아니라 방향만 보이게, 사용자 요청)

// Kanban 플러그인 연동 (테마 Kanban 절과 짝). 보드 위 버튼 중 목록 추가·완료된 카드 보관·마크다운으로 열기를 알약 하나로 묶는다
// (사용자 요청). 이름은 언어마다 달라 기호로 찾는다
export const KB_GROUP_ICONS = ["lucide-plus-circle", "lucide-archive", "lucide-file-text"];
// 목록을 접고 펼 때 높이(가로 보드는 폭)가 바뀌는 시간
export const KB_LANE_MS = 300;
// 목록 추가 창을 열 때 버튼 묶음 알약이 좌우로 좁아지는 폭 (알약 높이 대비, 높이는 그대로)
export const KB_PILL_DOT = 1;
// 그 알약이 좁아지며 돌진해 사라지는 시간 (보관함 버튼은 160ms)
export const KB_DASH_MS = 300;
