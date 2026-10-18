import { Menu, Platform } from "obsidian";
import { els, strs, menuKey, layoutBottom, unitVec, isEl, placeSugg } from "./util";
import { BASES_MENU_BTN, MORPH_DASH, MENU_DROP, EASE, MENU_MOVE_MS, MENU_POP } from "./constants";
import type { GlassShelfPlugin } from "./host";
import type { PressInfo } from "./internal";

// 메뉴 항목의 메뉴 안 세로 자리. 메뉴는 커지는 중일 수 있어 화면 좌표 대신 offset 으로 잰다
function itemTop(el: HTMLElement, menu: HTMLElement) {
  let y = 0;
  for (let e: HTMLElement | null = el; e && e !== menu; e = e.offsetParent as HTMLElement | null) y += e.offsetTop;
  return y;
}

// 메뉴 항목 하나를 읽은 것 (readMenu)
// 말풍선 화살표 메뉴(팝오버)의 화살표: 메뉴(둥근 사각형, 그림자·외곽선 그대로) 위 끝에 붙는 작은 SVG.
// 끝이 둥글고 밑동이 몸통 윗선으로 짧게 퍼진다. cx = 화살표 가운데, yb = 밑동(몸통 윗선 가운데) 높이
const ARROW_H = 11; // 화살표 높이 (꼭짓점 기준, 둥글린 끝은 조금 낮다). CSS .lg-menu-arrow 의 margin-top 과 같게
const ARROW_W = 10; // 밑동 반폭 (퍼지는 곡선 제외). macOS 창 정렬 팝오버 화살표처럼 낮고 넓게, 끝은 크게 둥글게 (사용자 요청: 정삼각형은 홀쭉했다)
const HI_REACH = 0.6; // 메뉴 하이라이트가 모서리 곡선을 따라 도는 몫 (사용자 요청: 곡선 중간을 살짝 넘게)
const ARROW_R = 5.5; // 끝과 밑동(몸통 윗선과 만나는 곳)을 둥글리는 반지름. 둘 다 같은 반지름 (사용자 요청: 진짜 같은 곡률)
// 밑동 곡선이 윗선에서 시작하는 곳까지의 거리 (반지름 ARROW_R, 밑동 안쪽 각 180° − atan(높이/반폭))
function arrowBaseT(yb: number) {
  return ARROW_R / Math.tan((Math.PI - Math.atan(yb / ARROW_W)) / 2);
}
// (x, y) 자리에서 창 뒤에 보이는 첫 불투명 바탕색. 창(과 그 안)은 건너뛰고, 반투명 바탕은 위로 올라가며 찾는다. 못 찾으면 null
const backdropColor = (menu: HTMLElement, x: number, y: number): string | null => {
  const doc = menu.ownerDocument;
  const win = doc.defaultView || window;
  const under = doc.elementsFromPoint(x, y).find((el) => !menu.contains(el) && !el.closest(".menu"));
  for (let el: Element | null = under || null; el; el = el.parentElement) {
    const bg = win.getComputedStyle(el).backgroundColor;
    const a = /rgba?\([^)]*,\s*([\d.]+)\)$/.exec(bg);
    if (bg && bg !== "transparent" && !(a && Number(a[1]) < 0.99) && !/\/\s*0(\.\d+)?\)$/.test(bg)) return bg;
  }
  return null;
};

function arrowTip(cx: number, yb: number) {
  const f = (v: number) => v.toFixed(2);
  // 옆선은 곧은 선(밑동 꼭짓점 → 끝). 끝과 밑동(몸통 윗선과 만나는 곳)만 같은 반지름(ARROW_R)으로 둥글린다
  const bx = cx - ARROW_W; // 옆선과 윗선이 만나는 꼭짓점 (곡선의 조절점)
  const len = Math.hypot(ARROW_W, yb);
  const ux = ARROW_W / len;
  const uy = yb / len;
  // 같은 반지름이 되도록 꺾이는 각마다 곡선이 시작하는 거리를 구한다: 거리 = 반지름 / tan(안쪽 각 / 2).
  // 끝은 안쪽 각 2·atan(반폭/높이), 밑동은 180° − atan(높이/반폭)
  const tipHalf = Math.atan(ARROW_W / yb);
  const t = ARROW_R / Math.tan(tipHalf);
  const tb = arrowBaseT(yb);
  const p0 = bx - tb; // 밑동 곡선이 윗선에서 시작하는 곳
  const p1x = bx + ux * tb; // 밑동 곡선이 옆선에 닿는 곳
  const p1y = yb - uy * tb;
  const p2x = cx - ux * t; // 끝 곡선이 시작하는 곳
  const p2y = uy * t;
  const b = bx;
  const m = (x: number) => 2 * cx - x;
  return (
    `M ${f(p0)} ${f(yb)} Q ${f(b)} ${f(yb)} ${f(p1x)} ${f(p1y)} L ${f(p2x)} ${f(p2y)} ` +
    `Q ${f(cx)} 0 ${f(m(p2x))} ${f(p2y)} L ${f(m(p1x))} ${f(p1y)} Q ${f(m(b))} ${f(yb)} ${f(m(p0))} ${f(yb)}`
  );
}

export interface MenuSnap {
  sep?: boolean;
  title?: string;
  icon?: string | null;
  checked?: boolean;
  disabled?: boolean;
}

export const menusMethods = {
  // 메뉴가 뜰 때: 커지는 기준점을 누른 자리로 둔다.
  // 방금 누른 게 없으면(하위 메뉴·키보드) 부모 메뉴 쪽 위 모서리에서 커진다.
  // 우클릭·보관함 메뉴처럼 이벤트가 끝난 뒤 채워지는 메뉴는 붙은 직후엔 크기가 없으므로,
  // 첫 화면을 그리기 직전(다음 프레임)에 잰다
  setupMenu(this: GlassShelfPlugin, menu: HTMLElement, press: PressInfo | null) {
    if (menu.lgSnap) return;
    const doc = menu.ownerDocument;
    const win = doc.defaultView || window;
    // Bases 툴바 메뉴는 Obsidian 이 버튼마다 메뉴 요소를 두고 떼었다 다시 붙여 쓴다. 지난번 열림의 준비 표시(.lg-menu-ready)와
    // 자리 고정 애니메이션이 남아, 넓어지기를 시작하기 전 두 프레임 동안 메뉴가 제자리에 다 그려져 보였다가 버튼 쪽 점으로 튀어
    // 거기서 다시 넓어졌다 (사용자 지적: 좌우로 흔들림). 지난번 상태를 걷어 내고 처음 붙은 메뉴처럼 준비한다
    if (menu.lgReady) {
      menu.classList.remove("lg-menu-ready", "lg-menu-morph", "lg-bottom-auto", "lg-no-anim", "lg-layer-still");
      menu.style.removeProperty("width");
      menu.getAnimations().forEach((a) => a.cancel());
      menu.lgReady = false;
      menu.lgMorph = null;
      menu.lgMoveFrom = null;
      menu.lgReplaced = false;
    }
    // 안전장치 (검토 지적): 태블릿은 준비(.lg-menu-ready) 전까지 메뉴의 커지는 애니메이션을 멈춰 둔다(테마). 아래에서 오류가 나 준비 표시를
    // 못 붙이면 메뉴가 투명한 채 남으므로, 0.4초 뒤에는 무조건 붙인다
    win.setTimeout(() => menu.classList.add("lg-menu-ready"), 400);
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
    if (pressed) this.webPopTint(menu, press.target);
    const outside = pressed && !(isEl(press.target) && press.target.closest<HTMLElement>(".menu"));
    const sub = els(doc.querySelectorAll<HTMLElement>(".menu")).some((m) =>
      m !== menu && !m.classList.contains("lg-menu-ghost") && !(outside && press.t > (m.lgBorn || 0)));
    // 모바일은 길게 누르기(약 0.5초 뒤 메뉴)도 누른 자리에서 커지게 더 오래 봐 준다
    const fresh = !sub && pressed;
    // 같은 대상을 다시 우클릭: 새로 커지지 않고 옛 메뉴 자리에서 새 자리로 옮겨 온다 (사용자 요청).
    // 옛 메뉴가 아직 떠 있으면 그 자리를, 막 닫혔으면(사라지는 사본) 닫히기 전 자리를 쓴다
    if (fresh && isEl(press.target)) {
      const key = menuKey(press.target);
      menu.lgKey = key;
      const live = els(doc.querySelectorAll<HTMLElement>(".menu")).find((m) => m !== menu && m.lgKey === key && !m.classList.contains("lg-menu-ghost"));
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
    // 커뮤니티 찾기 창의 정렬 버튼도 그래프 뷰 설정처럼 버튼에서 넓어진다 (사용자 요청, 휴대폰은 Obsidian 그대로)
    // Bases 보기 고르기 버튼도 보관함 버튼처럼 메뉴가 버튼에서 넓어진다 (사용자 요청)
    const morphSel = Platform.isPhone
      ? `.workspace-drawer-vault-switcher, select.dropdown, ${BASES_MENU_BTN}`
      : `.workspace-drawer-vault-switcher, select.dropdown, .mod-community-modal .community-modal-search > .clickable-icon, ${BASES_MENU_BTN}`;
    const src = target && target.closest<HTMLElement>(morphSel);
    // 버튼에서 넓어지는 메뉴는 준비될 때까지 숨긴다 (CSS: .lg-menu-morph)
    if (src) menu.classList.add("lg-menu-morph");
    // Bases 메뉴는 내용을 다 그린 뒤 Obsidian 이 버튼 기준으로 자리를 다시 잡는다: 넓어지기를 마친 뒤 아래로 툭 옮겨 갔다 (사용자 지적).
    // 자리가 한 프레임 그대로일 때까지 기다렸다가 넓어진다. 예전엔 세 프레임을 기다려 열리는 게 늦었다 (사용자 지적: 렉).
    // 그 뒤 Obsidian 이 다시 옮기는 자리는 morphMenu 가 되돌린다
    const settle = !!src && src.matches(BASES_MENU_BTN);
    let lastPos = "";
    let still = 0;
    const run = (tries: number): void => {
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
        // 상태 막대 Sync 아이콘의 메뉴는 아이콘을 가리키는 팝오버 (사용자 요청)
        const syncIcon = target && target.closest<HTMLElement>(".status-bar-item.plugin-sync");
        if (syncIcon) {
          // Obsidian 은 누른 자리에 메뉴를 띄워 아이콘을 덮었다 (사용자 지적). 아이콘 위 가운데에, 화살표 끝이 아이콘 위 4px 에 오게 둔다
          // (아래 화살표 메뉴는 테마가 화살표 높이만큼 더 올린다)
          const ir = syncIcon.getBoundingClientRect();
          const mw = menu.offsetWidth;
          const mh = menu.offsetHeight;
          const mx = Math.max(8, Math.min(win.innerWidth - mw - 8, ir.left + ir.width / 2 - mw / 2));
          menu.style.left = `${mx}px`;
          menu.style.top = `${ir.top - 4 - mh}px`;
          this.popArrow(menu, syncIcon);
          return;
        }
        // 편집창 탭 줄의 메뉴는 탭을 가리지 않게 탭 줄 밑으로
        const list = target && target.closest<HTMLElement>(".mod-root .workspace-tab-header-tab-list");
        const tabMenu = target && target.closest<HTMLElement>(".lg-tab-menu");
        const pathMenu = target && target.closest<HTMLElement>(".lg-path-menu");
        if (list) this.placeUnderTabBar(menu, list, null);
        // 경로 알약 ≡ 는 알약 왼쪽 끝에 있어 메뉴도 알약 왼쪽 끝에 맞춘다 (사용자 요청)
        else if (pathMenu) this.placeUnderTabBar(menu, pathMenu, pathMenu.closest<HTMLElement>(".lg-path-pill"), true);
        else if (tabMenu) this.placeUnderTabBar(menu, tabMenu, tabMenu.closest<HTMLElement>(".workspace-tab-header"));
        // 리본 메뉴: Obsidian 이 준 자리보다 2px 아래에 열려 탭 목록 메뉴와 높이가 달랐다. 같은 기준(버튼 아래 끝 + MENU_DROP)으로 (사용자 요청)
        const rib = target && target.closest<HTMLElement>(".lg-rib-menu");
        if (rib) menu.style.top = `${layoutBottom(rib) + MENU_DROP}px`;
        // 속성(메타데이터) 칸에서 연 메뉴: 그 칸이 밝은 알약으로 떠오르고 메뉴는 칸 바로 밑에
        const row = target && target.closest<HTMLElement>(".metadata-property");
        if (row) this.focusRow(menu, row);
        // 하위 메뉴: Obsidian 은 부모 메뉴 바깥 끝에 붙여 연다. 부모 메뉴의 선택 하이라이트(고른 항목) 끝에 닿게 안쪽으로 당긴다 (사용자 요청)
        const subUp = sub ? this.tuckSubmenu(menu) : false;
        // Bases 필터 메뉴의 묶음 조건 드롭다운(다음 중 전체가 참임): 필터 메뉴가 떠 있어 하위 메뉴로 잡히고 Obsidian 자리(드롭다운 아래)에
        // 열렸다. 하위 메뉴처럼 드롭다운 오른쪽 옆에 열고, 첫 항목 위 끝을 드롭다운(호버 바탕) 위 끝에 맞춘다 (사용자 요청)
        const conj = sub && pressed && isEl(press.target) ? press.target.closest<HTMLSelectElement>(".bases-query-container select.conjunction.dropdown") : null;
        if (conj) this.placeBesideSelect(menu, conj);
        // 커지는 애니메이션(기준점 왼쪽 위) 중이므로 왼쪽 위 모서리만 쓴다
        const r = menu.getBoundingClientRect();
        let ox: number;
        let oy: number;
        if (fresh) {
          ox = press.x - r.left;
          oy = press.y - r.top;
        } else {
          const others = els(doc.querySelectorAll<HTMLElement>(".menu")).filter((m) => m !== menu && !m.classList.contains("lg-menu-ghost"));
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
        if (!Platform.isPhone) this.menuHi(menu);
        if (!Platform.isPhone) this.layerStill(menu);
        menu.lgReady = true;
        // 컴팩트 모드면 호버 판이 항목을 따라 미끄러지지 않는다: 올린 항목이 바로 강조색으로 칠해진다 (테마 body.lg-rm, 사용자 요청)
        if (!this.reduceMotion()) this.followHover(menu);
      }
    };
    win.requestAnimationFrame(() => run(0));
  },

  // 하위 메뉴를 부모 메뉴의 고른 항목 끝에 닿게 옮긴다. 오른쪽으로 열렸으면 왼쪽으로, 왼쪽으로 열렸으면 오른쪽으로
  tuckSubmenu(this: GlassShelfPlugin, menu: HTMLElement) {
    const doc = menu.ownerDocument;
    const r = menu.getBoundingClientRect();
    const parents = els(doc.querySelectorAll<HTMLElement>(".menu")).filter((m) => m !== menu && !m.classList.contains("lg-menu-ghost"));
    const parent = parents[parents.length - 1];
    if (!parent) return;
    const pr = parent.getBoundingClientRect();
    const item = parent.querySelector<HTMLElement>(".menu-item.selected") || parent.querySelector<HTMLElement>(".menu-item.has-submenu:hover");
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
    const items = menu.querySelectorAll<HTMLElement>(".menu-item");
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
  placeBesideSelect(this: GlassShelfPlugin, menu: HTMLElement, sel: HTMLElement) {
    const win = menu.ownerDocument.defaultView || window;
    const items = menu.querySelectorAll<HTMLElement>(".menu-item");
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
  attachSearchSuggest(this: GlassShelfPlugin, pop: HTMLElement, doc: Document) {
    const input = doc.activeElement as HTMLElement;
    const host = input && input.closest && input.closest<HTMLElement>('.workspace-leaf-content[data-type="search"] .search-input-container');
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
      placeSugg(pop, cx - w / 2, cy - host.offsetHeight / 2 + input.offsetTop + input.offsetHeight, w);
      host.style.setProperty("--lg-sugg-h", `${pop.offsetHeight}px`);
    };
    const ro = new win.ResizeObserver(place);
    ro.observe(pop);
    // Obsidian 이 목록 자리를 다시 넣으면(style) 차이를 다시 잰다
    const moved = new win.MutationObserver(place);
    moved.observe(pop, { attributes: true, attributeFilter: ["style"] });
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
  releasePop(this: GlassShelfPlugin, pop: HTMLElement) {
    const cls = strs(pop.classList).filter((c) => c.startsWith("lg-"));
    if (cls.length) pop.classList.remove(...cls);
    for (const p of strs(pop.style)) if (p.startsWith("--lg-")) pop.style.removeProperty(p);
    pop.style.removeProperty("transform-origin");
  },

  // 메뉴 호버: Obsidian 이 항목에 붙이는 selected 를 지켜보고, 판 하나(.lg-menu-hl)가 그 항목으로 미끄러져 간다.
  // 처음 나타날 때는 제자리에서 흐려졌다 나타나고, 선택이 없어지면 흐려진다
  followHover(this: GlassShelfPlugin, menu: HTMLElement) {
    const scroll = menu.querySelector<HTMLElement>(".menu-scroll");
    if (!scroll || scroll.querySelector<HTMLElement>(":scope > .lg-menu-hl")) return;
    const hl = scroll.createDiv({ cls: "lg-menu-hl", prepend: true });
    menu.classList.add("lg-menu-follow");
    let shown = false;
    const place = () => {
      const item = scroll.querySelector<HTMLElement>(".menu-item.selected:not(.is-label):not(.is-disabled)");
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
  },

  // 속성 칸 강조: 칸이 살짝 커지며 밝은 알약이 되고(CSS: .lg-row-focus), 메뉴는 칸 왼쪽 끝에 맞춰 10px 밑에.
  // 밑에 자리가 없으면 칸 바로 위에. 메뉴가 닫히면 칸은 제자리로 (closeMenu)
  focusRow(this: GlassShelfPlugin, menu: HTMLElement, row: HTMLElement) {
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
  // alignLeft: 기준 알약의 왼쪽 끝에 맞춘다 (경로 알약: ≡ 가 왼쪽 끝이다)
  placeUnderTabBar(this: GlassShelfPlugin, menu: HTMLElement, btn: HTMLElement, alignEl: HTMLElement | null, alignLeft = false) {
    const tabs = btn.closest<HTMLElement>(".workspace-tabs");
    const header = tabs && tabs.querySelector<HTMLElement>(":scope > .workspace-tab-header-container");
    if (!header) return;
    const win = menu.ownerDocument.defaultView || window;
    const gap = parseFloat(win.getComputedStyle(menu.ownerDocument.body).getPropertyValue("--lg-gap")) || 10;
    const right = alignEl ? alignEl.getBoundingClientRect().right : tabs.getBoundingClientRect().right - gap;
    const left = alignLeft && alignEl
      ? Math.max(gap, Math.min(win.innerWidth - menu.offsetWidth - gap, alignEl.getBoundingClientRect().left))
      : Math.max(gap, right - menu.offsetWidth);
    menu.style.left = `${left}px`;
    // 탭 줄 버튼·알약 아래 끝(탭 줄 아래 끝 - 아래 여백) + MENU_DROP.
    // 탭 목록·경로 알약의 ≡ 는 그 버튼(알약) 아래 끝 기준: 경로 표시로 탭 줄이 두 줄이 되어도 리본 메뉴와 같은 높이에 연다 (사용자 요청)
    // 탭 목록이 버튼 묶음(.lg-tab-tools) 안에 들어가면 버튼이 알약보다 작아 메뉴가 리본 메뉴보다 높게 열렸다: 묶음 알약 아래 끝 기준 (사용자 지적)
    const rowEl = btn.closest<HTMLElement>(".lg-path-pill, .lg-tab-tools") || (btn.matches(".workspace-tab-header-tab-list") ? btn : null);
    const bottom = rowEl ? layoutBottom(rowEl) : header.getBoundingClientRect().bottom - gap;
    menu.style.top = `${bottom + MENU_DROP}px`;
  },

  // 컴팩트 모드(설정)를 이 기기에서 쓰는지: 끔 / 데스크톱만 / 데스크톱·태블릿. 휴대폰은 늘 원래 효과
  reduceMotion(this: GlassShelfPlugin) {
    const rm = this.settings.reduceMotion;
    return !Platform.isPhone && (Platform.isTablet ? rm === "pcTablet" : rm !== "off");
  },

  // 드롭다운을 Obsidian 메뉴로 연다: 항목마다 고른 것은 체크 표시. 고르면 드롭다운 값을 바꾸고 input·change 를 알려
  // 설정 화면 등이 운영체제 목록에서 고른 것과 똑같이 받는다.
  // at: 누른 자리 (컴팩트 모드일 때 그 자리에 연다). 없으면 드롭다운 오른쪽 아래 기준
  openDropdownMenu(this: GlassShelfPlugin, sel: HTMLSelectElement, at?: { x: number; y: number }) {
    const win = sel.ownerDocument.defaultView || window;
    const menu = new Menu();
    // 고른 항목이 메뉴에서 몇 번째인지 (잘린 메뉴를 그 자리로 스크롤할 때 morphMenu 가 쓴다)
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
      // 모바일은 포커스를 돌려주지 않는다: 드롭다운에 포커스가 가면 운영체제 고르기 화면이 떠, 항목을 고르거나 다른 드롭다운을 눌러
      // 메뉴가 닫힐 때마다 첫 드롭다운의 운영체제 목록이 다시 떴다 (태블릿, 사용자 지적)
      if (sel.isConnected && !Platform.isMobile) sel.focus({ preventScroll: true });
    });
    if (at) {
      menu.showAtPosition({ x: at.x, y: at.y }, sel.ownerDocument);
      return;
    }
    const b = sel.getBoundingClientRect();
    menu.showAtPosition({ x: b.right, y: b.bottom, width: b.width, overlap: true, left: true }, sel.ownerDocument);
  },

  // 보관함 전환 메뉴: 버튼이 메뉴의 왼쪽 아래 꼭짓점에 오게 둔다(위에 자리가 없으면 왼쪽 위 꼭짓점).
  // 버튼은 메뉴 가운데를 향해 돌진하며 작아져 사라지고, 둘 사이 중간 지점에서 메뉴 창이 넓어져 나온다.
  // 창 크기만 바뀌고 안의 내용은 제자리에 그대로 있다
  // keep: 메뉴를 옮기지 않고 Obsidian 이 둔 자리에서 일반 메뉴처럼 연다 (Bases 보기 메뉴)
  morphMenu(this: GlassShelfPlugin, menu: HTMLElement, src: HTMLElement, keep = false) {
    const win = menu.ownerDocument.defaultView || window;
    const b = src.getBoundingClientRect();
    // 드롭다운: 메뉴는 드롭다운 폭 이상, 왼쪽으로 열린다: 드롭다운이 메뉴의 오른쪽 위 꼭짓점에 온다(아래에 자리가 없으면 오른쪽 아래 꼭짓점) (사용자 요청)
    const drop = src.matches("select");
    // 드롭다운 메뉴는 드롭다운에서 아래로만 연다(드롭다운 위 끝 ~ 창 아래 8px). 길면 그 높이로 자르고 메뉴 안에서 스크롤한다 (CSS: .lg-dd-menu).
    // 예전엔 창 밖으로 내려가 아래 항목이 안 보였고, 그다음엔 창 위아래를 다 차지했다 (사용자 지적).
    // 아래 자리가 너무 좁고(120px 미만) 위가 더 넓을 때만 위로 연다(드롭다운 아래 끝 ~ 창 위 8px)
    let up = false;
    if (drop) {
      // 테마의 최소 폭(컴팩트 모드를 끈 기기 250px)보다 좁아지지 않게 둘 중 큰 쪽으로
      const cssMin = parseFloat(win.getComputedStyle(menu).minWidth) || 0;
      menu.style.minWidth = `${Math.max(b.width, cssMin)}px`;
      menu.classList.add("lg-dd-menu");
      const below = win.innerHeight - 8 - b.top;
      const above = b.bottom - 8;
      up = below < 120 && above > below;
      const room = up ? above : below;
      if (menu.offsetHeight > room) menu.style.maxHeight = `${room}px`;
    }
    // Bases 툴바 메뉴는 화살표 없는 일반 메뉴로 연다 (사용자 요청: 애플 가이드라인도 팝오버라고 늘 화살표를 달지는 않는다. 예전엔 말풍선 화살표를 달았다).
    // 버튼에서 넓어지지 않고 다른 메뉴처럼 커지며 열린다. 기준점은 버튼 가운데 아래 끝.
    // 자리는 Obsidian 이 정한 대로(버튼 왼쪽 끝, 버튼 아래 끝 + 4px)
    if (keep) {
      const mr = menu.getBoundingClientRect();
      const ax = Math.max(0, Math.min(mr.width, b.left + b.width / 2 - mr.left));
      menu.style.transformOrigin = `${ax.toFixed(1)}px ${(b.bottom - mr.top).toFixed(1)}px`;
      menu.lgOrigin = { x: mr.left + ax, y: b.bottom };
      // 커지는 애니메이션(CSS lg-menu-in)은 숨김 클래스를 걷는 이 순간 시작된다
      menu.classList.remove("lg-menu-morph");
      return;
    }
    const W = Math.max(menu.offsetWidth, b.width);
    const H = Math.max(menu.offsetHeight, b.height);
    // 최소 폭은 고정 폭으로 바꾼다: 최소 폭이 남아 있으면 넓어지기·줄어들기 애니메이션의 폭이 그 아래로 못 내려가
    // 점으로 줄지 않고 옆으로 밀려갔다 (사용자 지적). 애니메이션은 고정 폭보다 우선한다
    // 테마 최소 폭(컴팩트 모드를 끈 기기 250px)도 끈다(.lg-morph-w): 남아 있으면 드롭다운 메뉴가 왼쪽이 아니라 오른쪽으로 열리고,
    // 드롭다운·보관함 메뉴가 닫힐 때 버튼 쪽이 아니라 오른쪽으로 사라졌다 (사용자 지적)
    menu.style.width = `${W}px`;
    menu.style.removeProperty("min-width");
    menu.classList.add("lg-morph-w");
    // 커뮤니티 찾기 창 정렬 메뉴는 버튼에서 오른쪽 아래로 연다(사용자 요청). 아래 자리가 모자라면 위로
    const downFirst = src.matches(".mod-community-modal .community-modal-search > .clickable-icon");
    const top = drop
      ? (up ? b.bottom - H : b.top)
      : downFirst
        ? (b.top + H <= win.innerHeight - 8 ? b.top : Math.max(8, b.bottom - H))
        : (b.bottom - H >= 8 ? b.bottom - H : b.top);
    // 보관함 메뉴는 창 왼쪽 끝에서 16px 띄운다: 버튼 자리(10px)에 붙여 열면 왼쪽이 너무 붙어 보였다 (사용자 지적)
    const left = drop ? Math.max(8, b.right - W) : src.matches(".workspace-drawer-vault-switcher") ? Math.max(16, b.left) : b.left;
    const anchor: "left" | "right" = drop ? "right" : "left";
    menu.style.left = `${left}px`;
    menu.style.top = `${top}px`;
    menu.classList.add("lg-bottom-auto");
    const mr = parseFloat(win.getComputedStyle(menu).borderTopLeftRadius) || 22;
    const full = { left, top, width: W, height: H, radius: mr };
    const bx = b.left + b.width / 2;
    const by = b.top + b.height / 2;
    const { ux, uy } = unitVec(bx, by, left + W / 2, top + H / 2);
    // 드롭다운 메뉴는 드롭다운(글자와 화살표 원 전체) 가운데의 점에서 나타나고 그 점으로 사라진다 (사용자 요청)
    const dot = drop ? this.dotAt(bx, by, b.height) : this.dotAt(bx + ux * MORPH_DASH, by + uy * MORPH_DASH, b.height);
    menu.lgSrc = src;
    menu.lgMorph = { ux, uy, dot, anchor };
    // 드롭다운은 제자리에 그대로 두고 메뉴만 허공에서 넓어져 나온다 (사용자 요청)
    if (!drop) {
      if (src.lgHide) src.lgHide.cancel();
      src.lgHide = this.dashOut(src, ux, uy);
    }
    const inner = menu.querySelector<HTMLElement>(".menu-scroll");
    // Obsidian 메뉴는 목록이 넘치면 마우스 높이에 비례해 목록을 굴린다(목록에 붙은 mousemove). 잘린 드롭다운 메뉴에선 목록이 커서를 따라
    // 움직였다 (사용자 지적). 그 mousemove 가 목록에 닿기 전에 막는다. 휠 스크롤은 그대로다
    if (drop && inner) inner.addEventListener("mousemove", (e) => e.stopPropagation(), { capture: true });
    // 잘린 드롭다운 메뉴는 고른 항목이 보이게 그 자리까지 스크롤해 둔다 (가운데)
    const picked = drop && inner && inner.querySelectorAll<HTMLElement>(".menu-item")[src.lgPickIdx];
    if (picked && inner.scrollHeight > inner.clientHeight) {
      const pr = picked.getBoundingClientRect();
      const ir = inner.getBoundingClientRect();
      inner.scrollTop += pr.top - ir.top - (inner.clientHeight - pr.height) / 2;
    }
    // 창이 작은 동안 안의 내용이 따라 줄지 않게 크기를 잠시 고정한다
    if (inner) this.pinSize(inner);
    // 안의 목록은 넓어지는 동안 화면 위 제자리에 둔다: 목록은 창 왼쪽 끝 기준으로 놓이므로 왼쪽 끝 기준으로 맞춘다.
    // 예전엔 드롭다운 메뉴를 오른쪽 끝 기준으로 맞춰, 넓어지는 동안 목록이 창 폭 차이만큼 오른쪽으로 밀렸다가 잘려 보였다 (사용자 지적)
    const grow = this.growBox(menu, inner ? [{ el: inner, anchor: "left", layout: true }] : [], dot, full, 90);
    grow.onfinish = grow.oncancel = () => {
      if (inner) this.unpinSize(inner);
    };
    if (inner) inner.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 100, delay: 85, easing: "ease-out", fill: "backwards" });
  },

  // 말풍선 화살표 켜기: 메뉴는 원래 둥근 사각형(그림자·외곽선·모서리 모양 그대로)이고, 위 끝에 화살표 SVG(.lg-arrow-line)를 붙인다.
  // 예전엔 메뉴 전체를 "몸통 + 화살표" 경로로 잘라 그림자까지 잘렸다 (사용자 지적: 태블릿에서 그림자가 안 보임).
  // 화살표 채움은 메뉴 유리 채움색, 선은 메뉴 윗선과 같은 외곽선 색·두께. 밑동은 메뉴 윗선을 덮어 이어진다.
  // 화살표 끝은 버튼 가운데: 메뉴 크기(ResizeObserver)나 자리(Obsidian 이 style 로 옮김)가 바뀌면 다시 잰다
  // (사용자 지적: 태블릿에서 화살표가 버튼을 제대로 가리키지 않았다)
  arrowOn(this: GlassShelfPlugin, menu: HTMLElement): number {
    const win = menu.ownerDocument.defaultView || window;
    // 화살표 층은 메뉴에 붙여 둔 참조로 찾는다 (메뉴가 두 번 준비되면 하나 더 만들었다). 자리 잡기(absolute)도 인라인으로 둔다
    let svg = menu.lgArrowSvg && menu.lgArrowSvg.parentElement === menu ? menu.lgArrowSvg : null;
    if (!svg) {
      svg = createSvg("svg", { cls: "lg-arrow-line", attr: { "aria-hidden": "true" } });
      // 바탕 층: 창 몸통은 뒤를 흐려 덮지만 화살표는 흐림이 없어 반투명 채움 너머로 뒤 화면(툴바 선 등)이 비쳐, 몸통과 밝기가 달라 보였다 (사용자 지적).
      // 화살표 밑에 화면 바탕색을 먼저 깔아 몸통처럼 뒤가 비치지 않게 한다
      svg.createSvg("path", { cls: "lg-arrow-base" });
      svg.createSvg("path", { cls: "lg-arrow-fill" });
      // 창 위아래 안쪽의 옅은 흰 그라데이션(--lg-sheen) 끝 색을 화살표 전체에 깐다: 바탕색만이면 화살표가 창과 따로 보였다 (사용자 지적)
      svg.createSvg("path", { cls: "lg-arrow-sheen" });
      svg.createSvg("path", { cls: "lg-arrow-stroke" });
      svg.setCssProps({ position: "absolute" });
      menu.append(svg);
      menu.lgArrowSvg = svg;
    }
    const fill = svg.querySelector<SVGPathElement>(".lg-arrow-fill");
    const sheen = svg.querySelector<SVGPathElement>(".lg-arrow-sheen");
    const base = svg.querySelector<SVGPathElement>(".lg-arrow-base");
    const stroke = svg.querySelector<SVGPathElement>(".lg-arrow-stroke");
    if (!fill || !stroke) return 0;
    let lastAx = 0;
    const sync = () => {
      if (!menu.isConnected) {
        if (menu.lgArrowRo) menu.lgArrowRo.disconnect();
        if (menu.lgArrowMo) menu.lgArrowMo.disconnect();
        menu.lgArrowRo = null;
        menu.lgArrowMo = null;
        return;
      }
      // 커지는 애니메이션(transform) 중에도 원래 자리·크기로 잰다: 계산된 left·폭 (fixed 자리)
      const cs = win.getComputedStyle(menu);
      const W = parseFloat(cs.width) || menu.offsetWidth;
      // 화면에 고정된 창(fixed: 메뉴)은 계산된 left·top 이 화면 좌표라 애니메이션(transform)에 흔들리지 않는다.
      // 다른 상자 안에 놓인 창(캔버스 도구 막대 등)은 화면 위치로 잰다
      const fixed = cs.position === "fixed";
      const mrect = menu.getBoundingClientRect();
      let left = fixed ? parseFloat(cs.left) : mrect.left;
      if (!Number.isFinite(left)) left = mrect.left;
      const src = menu.lgSrc && menu.lgSrc.isConnected ? menu.lgSrc : null;
      const b = src && src.getBoundingClientRect();
      // 모서리 곡률은 창마다 다르다(메뉴 18, 링크 미리보기 26 등): 계산된 값을 쓴다
      // (알약 모양 창은 반지름을 999px 처럼 크게 적으므로 높이의 반까지만 친다)
      const R = Math.min(parseFloat(cs.borderTopLeftRadius) || parseFloat(cs.getPropertyValue("--lg-menu-radius")) || 18, (parseFloat(cs.height) || menu.offsetHeight) / 2);
      // 창이 버튼(대상)보다 위에 있으면 화살표를 아래에 둔다 (상태 막대 Sync, 링크 위에 뜬 미리보기 등).
      // 아래 화살표는 위 화살표를 그대로 위아래로 뒤집어 그린다(아래 끝 기준). 하이라이트도 아래 것이 화살표를 따라간다
      let top = fixed ? parseFloat(cs.top) : mrect.top;
      if (!Number.isFinite(top)) top = mrect.top;
      const Hb = parseFloat(cs.height) || menu.offsetHeight;
      const half = ARROW_W + ARROW_R; // 밑동 곡선까지 넉넉히 (곡선은 ARROW_R 보다 짧다)
      const lo = R + half;
      const ax = W > lo * 2 ? Math.max(lo, Math.min(W - lo, b ? b.left + b.width / 2 - left : W / 2)) : W / 2;
      const down = !!b && top + Hb / 2 < b.top + b.height / 2;
      if (menu.classList.contains("lg-arrow-down") !== down) menu.classList.toggle("lg-arrow-down", down);
      const bl = parseFloat(cs.borderLeftWidth) || 0;
      const bt = parseFloat(down ? cs.borderBottomWidth : cs.borderTopWidth) || 0;
      // 위 화살표 자리의 세로 위치(svg 위 끝). 아래 화살표는 아래 끝에서 뒤집는다: svg 의 y = ARROW_H 줄(창 바깥 끝)을 창 아래 끝에 두고 scaleY(-1)
      const yTop = down ? Hb - (parseFloat(cs.borderTopWidth) || 0) - ARROW_H : -ARROW_H - bt;
      const flip = down ? { transform: "scaleY(-1)", "transform-origin": `0 ${ARROW_H}px` } : { transform: "", "transform-origin": "" };
      const lw = bt || 1 / (win.devicePixelRatio || 1);
      const SW = half * 2 + 2;
      const cx = SW / 2;
      const yb = ARROW_H + lw / 2;
      svg.setAttribute("width", String(SW));
      svg.setAttribute("height", String(ARROW_H + lw + 2));
      svg.setCssProps({ left: `${(ax - cx - bl).toFixed(2)}px`, top: `${yTop.toFixed(2)}px`, ...flip });
      // 채움은 창 바탕색 그대로 (메뉴 유리 채움, 링크 미리보기 바탕 등)
      fill.setAttribute("style", `fill: ${cs.backgroundColor}`);
      const tip = arrowTip(cx, yb);
      // 채움은 밑동에서 메뉴 윗선 아래 끝까지 내려 윗선을 덮는다
      // 1px 더 내려 덮는다: 윗선이 이제 일반 테두리라(테마) 경계에서 반쯤 비쳤다
      fill.setAttribute("d", `${tip} L ${(cx + half).toFixed(2)} ${(ARROW_H + lw + 1).toFixed(2)} L ${(cx - half).toFixed(2)} ${(ARROW_H + lw + 1).toFixed(2)} Z`);
      if (sheen) sheen.setAttribute("d", fill.getAttribute("d") || "");
      if (base) {
        base.setAttribute("d", fill.getAttribute("d") || "");
        // 바탕 층 색: 몸통이 비추는 뒤 화면(몸통 위쪽 가운데 바로 뒤 요소)의 바탕색. 화면 바탕색으로 두면 몸통보다 밝았다 (사용자 지적, 측정 255 대 250)
        // 몸통은 반투명이라 창 그림자(drop-shadow)가 몸통 안으로 비쳐 조금 어둡다: 그림자 색 × 몸통 불투명도만큼 검정을 섞는다
        const behind = backdropColor(menu, mrect.left + mrect.width / 2, mrect.top + (down ? mrect.height - 12 : 12)) || "var(--background-primary)";
        const sa = /drop-shadow\(rgba\(0, 0, 0, ([\d.]+)\)/.exec(cs.filter);
        const fa = /,\s*([\d.]+)\)$/.exec(cs.backgroundColor) || /\/\s*([\d.]+)\)$/.exec(cs.backgroundColor);
        const dark = sa ? Number(sa[1]) * (fa ? Number(fa[1]) : 1) : 0;
        base.setAttribute("style", `fill: color-mix(in srgb, ${behind}, #000 ${(dark * 100).toFixed(1)}%)`);
      }
      stroke.setAttribute("d", tip);
      stroke.setAttribute("stroke-width", String(lw));
      // 하이라이트는 화살표 자리까지 menuHi 가 그린다
      menu.lgArrowAt = { ax, down };
      this.menuHi(menu);
      lastAx = ax;
      // 메뉴 윗선(아래 화살표면 아랫선)을 비울 자리: 화살표 밑동 곡선이 그 선에서 시작하는 두 곳 (CSS). 값이 같으면 쓰지 않는다(style 감시 되먹임 방지)
      const gap = ARROW_W + arrowBaseT(ARROW_H + lw / 2);
      const gl = `${(ax - gap).toFixed(2)}px`;
      const gr = `${(ax + gap).toFixed(2)}px`;
      if (menu.style.getPropertyValue("--lg-arrow-gl") !== gl) menu.style.setProperty("--lg-arrow-gl", gl);
      if (menu.style.getPropertyValue("--lg-arrow-gr") !== gr) menu.style.setProperty("--lg-arrow-gr", gr);
    };
    menu.classList.add("lg-arrow-on");
    sync();
    if (!menu.lgArrowRo) {
      menu.lgArrowRo = new ResizeObserver(() => sync());
      menu.lgArrowRo.observe(menu);
    }
    if (!menu.lgArrowMo) {
      // Obsidian 이 메뉴를 옮기면(style 의 left·top) 다시 잰다. sync 는 값이 바뀔 때만 메뉴 style 을 써서 되먹임이 끝난다
      let busy = false;
      menu.lgArrowMo = new MutationObserver(() => {
        if (busy) return;
        busy = true;
        sync();
        win.requestAnimationFrame(() => (busy = false));
      });
      menu.lgArrowMo.observe(menu, { attributes: true, attributeFilter: ["style"] });
    }
    return lastAx;
  },

  // 메뉴 안쪽 하이라이트(위아래 흰 선): 상자 그림자로는 모서리 곡선 어디서 끝낼지 정할 수 없어 SVG 선(.lg-arrow-hi)으로 그린다 (사용자 요청).
  // 위아래 선이 모서리 곡선의 HI_REACH(60%)까지 따라 돌고 끝으로 갈수록 옅어진다. 곡선은 메뉴 모서리 모양(corner-shape: 원 또는 superellipse)대로 계산한다.
  // 화살표가 있으면 그쪽 선은 화살표 안쪽을 따라 잇는다. 옆면의 옅은 하이라이트는 상자 그림자(테마)가 맡는다
  menuHi(this: GlassShelfPlugin, menu: HTMLElement) {
    const win = menu.ownerDocument.defaultView || window;
    let hi = menu.lgArrowHi && menu.lgArrowHi.parentElement === menu ? menu.lgArrowHi : null;
    if (!hi) {
      hi = createSvg("svg", { cls: "lg-arrow-hi", attr: { "aria-hidden": "true" } });
      // 위아래 색이 달라(위 --lg-hi-t-c, 아래 --lg-hi-b-c) 같은 옅어짐을 두 그라데이션에 건다
      const gid = `lg-hi-${Math.random().toString(36).slice(2, 8)}`;
      const defs = hi.createSvg("defs");
      for (const [k, c] of [["t", "--lg-hi-t-c"], ["b", "--lg-hi-b-c"]]) {
        const g = defs.createSvg("linearGradient", { cls: `lg-hi-g${k}`, attr: { id: `${gid}-${k}`, gradientUnits: "userSpaceOnUse", y1: "0", y2: "0" } });
        for (let i = 0; i < 4; i++) g.createSvg("stop", { attr: { style: `stop-color: var(${c})` } });
      }
      hi.createSvg("path", { cls: "lg-hi-top", attr: { fill: "none", stroke: `url(#${gid}-t)`, "stroke-width": "1" } });
      hi.createSvg("path", { cls: "lg-hi-bot", attr: { fill: "none", stroke: `url(#${gid}-b)`, "stroke-width": "1" } });
      hi.setCssProps({ position: "absolute" });
      menu.append(hi);
      menu.lgArrowHi = hi;
      menu.classList.add("lg-has-hi");
      if (!menu.lgHiRo) {
        menu.lgHiRo = new ResizeObserver(() => {
          if (!menu.isConnected) {
            if (menu.lgHiRo) menu.lgHiRo.disconnect();
            menu.lgHiRo = null;
            return;
          }
          this.menuHi(menu);
        });
        menu.lgHiRo.observe(menu);
      }
    }
    const grads = hi.querySelectorAll("linearGradient");
    const top = hi.querySelector<SVGPathElement>(".lg-hi-top");
    const bot = hi.querySelector<SVGPathElement>(".lg-hi-bot");
    if (grads.length < 2 || !top || !bot) return;
    const cs = win.getComputedStyle(menu);
    const W = parseFloat(cs.width) || menu.offsetWidth;
    const Hb = parseFloat(cs.height) || menu.offsetHeight;
    if (W < 20 || Hb < 20) return;
    const R = Math.min(parseFloat(cs.borderTopLeftRadius) || 0, W / 2, Hb / 2);
    const bl = parseFloat(cs.borderLeftWidth) || 0;
    const bt = parseFloat(cs.borderTopWidth) || 0;
    // 모서리 모양: superellipse(K) 는 지수 2^K 곡선, round 는 원(지수 2)
    const shape = cs.getPropertyValue("corner-shape") || "round";
    const km = /superellipse\(\s*([\d.]+)/.exec(shape);
    const n = km ? Math.pow(2, parseFloat(km[1])) : 2;
    const M = ARROW_H; // 화살표 자리만큼 위아래로 넉넉한 층. 층 안에서 창 바깥 끝(위)은 y = M
    const o = bt + 0.5; // 선 가운데: 창 안쪽 끝에서 반 픽셀
    const r = Math.max(0, R - o);
    const f = (v: number) => v.toFixed(2);
    // 왼쪽 위 모서리 곡선 위의 점 (φ: 0 = 옆면 끝, π/2 = 윗면 끝)
    const pt = (phi: number) => {
      const c = Math.pow(Math.max(0, Math.cos(phi)), 2 / n);
      const sn = Math.pow(Math.max(0, Math.sin(phi)), 2 / n);
      return [o + r * (1 - c), M + o + r * (1 - sn)];
    };
    const p0 = (Math.PI / 2) * (1 - HI_REACH);
    const steps = 10;
    const left: string[] = [];
    for (let i = 0; i <= steps; i++) {
      const [x, y] = pt(p0 + ((Math.PI / 2 - p0) * i) / steps);
      left.push(`${i ? "L" : "M"} ${f(x)} ${f(y)}`);
    }
    const right: string[] = [];
    for (let i = steps; i >= 0; i--) {
      const [x, y] = pt(p0 + ((Math.PI / 2 - p0) * i) / steps);
      right.push(`L ${f(W - x)} ${f(y)}`);
    }
    const yh = M + o;
    const at = menu.classList.contains("lg-arrow-on") ? menu.lgArrowAt : null;
    // 윗선(아래 화살표면 그 쪽 선을 위로 뒤집어 그린다): 화살표가 있으면 밑동 사이를 화살표 안쪽 선으로 바꾼다
    const line = (withArrow: boolean) => {
      if (!withArrow || !at) return `${left.join(" ")} L ${f(W - o - r)} ${f(yh)} ${right.join(" ")}`;
      const lw = bt || 1 / (win.devicePixelRatio || 1);
      const yb = ARROW_H + lw / 2;
      const hb = ARROW_W + arrowBaseT(yb);
      const dy = yh - yb;
      const tip = arrowTip(at.ax, yb).replace(/(-?\d+\.?\d*) (-?\d+\.?\d*)/g, (_m: string, x: string, y: string) => `${x} ${f(parseFloat(y) + dy)}`).replace(/^M/, "L");
      return `${left.join(" ")} L ${f(at.ax - hb)} ${f(yh)} ${tip} L ${f(W - o - r)} ${f(yh)} ${right.join(" ")}`;
    };
    hi.setAttribute("width", String(W));
    hi.setAttribute("height", String(Hb + M * 2));
    hi.setCssProps({ left: `${f(-bl)}px`, top: `${f(-bt - M)}px` });
    top.setAttribute("d", line(!!at && !at.down));
    bot.setAttribute("d", line(!!at && at.down));
    // 아랫선은 윗선 모양을 위아래로 뒤집는다 (층 가운데 기준)
    bot.setAttribute("transform", `matrix(1 0 0 -1 0 ${f(Hb + M * 2)})`);
    // 끝으로 갈수록 옅게: 곡선 끝(0) → 곡선 가운데쯤(1). 위아래 같은 그라데이션, 색은 위아래 따로
    const xe = pt(p0)[0];
    const xm = pt((p0 + Math.PI / 2) / 2)[0];
    grads.forEach((grad) => {
      grad.setAttribute("x1", "0");
      grad.setAttribute("x2", f(W));
      grad.querySelectorAll("stop").forEach((st, i) => {
        st.setAttribute("offset", String([xe / W, xm / W, 1 - xm / W, 1 - xe / W][i]));
        st.setAttribute("stop-opacity", i === 0 || i === 3 ? "0" : "1");
      });
    });
  },

  // 버튼·링크 같은 대상(src)을 가리키는 팝오버로 만든다: 화살표를 붙이고, 열리는 기준점을 화살표 끝으로.
  // 위·아래 어느 쪽 화살표인지는 창과 대상의 자리로 정한다 (Sync 상태 메뉴, 링크 미리보기 등)
  popArrow(this: GlassShelfPlugin, el: HTMLElement, src: HTMLElement) {
    el.classList.add("lg-menu-arrow");
    el.lgSrc = src;
    const ax = this.arrowOn(el);
    const down = el.classList.contains("lg-arrow-down");
    const r = el.getBoundingClientRect();
    el.style.transformOrigin = `${ax.toFixed(1)}px ${down ? `calc(100% + ${ARROW_H}px)` : `-${ARROW_H}px`}`;
    el.lgOrigin = { x: r.left + ax, y: down ? r.bottom + ARROW_H : r.top - ARROW_H };
    if (!Platform.isPhone) this.layerStill(el);
  },

  // 링 그림자 층을 따로 합성되는 층으로 두는 표시(.lg-layer-still, 테마가 링 층 ::before 에 will-change 를 건다)를 여는 애니메이션이 끝난 직후에 붙인다.
  // 메뉴 전체에 처음부터 걸면 0.2배에서 커지기 시작할 때 그린 그림을 그대로 늘려 써 글자가 흐렸고 (사용자 지적),
  // 아예 안 걸면 125% 배율에서 링 그림자가 오른쪽으로 치우치고, 애니메이션이 끝나 합성이 풀릴 때 깜빡였다
  layerStill(this: GlassShelfPlugin, el: HTMLElement) {
    const done = () => {
      if (el.isConnected) el.classList.add("lg-layer-still");
    };
    const anims = el.getAnimations().filter((a) => a.playState !== "finished");
    if (!anims.length) return done();
    Promise.all(anims.map((a) => a.finished)).then(done, done);
  },

  // 캔버스: 카드 위 도구 막대는 xl 흰 유리 알약(테마), 그 안 색상 버튼을 누르면 뜨는 색 고르기는 색상 버튼을 가리키는 팝오버 (사용자 요청)
  canvasArrows(this: GlassShelfPlugin, wrap: HTMLElement) {
    const bar = wrap.querySelector<HTMLElement>(".canvas-menu");
    if (!bar || !bar.childElementCount || !bar.getClientRects().length) return;
    // 도구 막대는 카드를 고를 때 생겨 화면 정리(refresh) 때 못 볼 수 있다: 여기서도 굴절을 건다
    if (this.refractOn()) this.refractor.attach(bar, 26, false);
    const sub = bar.querySelector<HTMLElement>(":scope > .canvas-submenu");
    const color = bar.querySelector<HTMLElement>(":scope > .clickable-icon:has(.lucide-palette)") || bar.querySelector<HTMLElement>(":scope > .clickable-icon.is-active");
    if (sub && color && sub.lgSrc !== color) this.popArrow(sub, color);
  },

  // 캔버스 아래 가운데의 카드 추가 버튼 묶음을 오른쪽 조작 버튼 묶음 밑으로 옮긴다 (사용자 요청). 버튼에 걸린 끌기 동작은 요소를 옮겨도 그대로다.
  // 플러그인을 끄면 원래 자리로 돌려놓는다 (core.ts 정리)
  canvasCards(this: GlassShelfPlugin, root: HTMLElement) {
    const ctl = root.querySelector<HTMLElement>(".canvas-controls");
    // 되돌리기·다시 하기 묶음: 두 버튼 사이 구분선 (테마 .lg-canvas-undo, 사용자 요청)
    const undo = ctl && ctl.querySelector<HTMLElement>(".canvas-control-item .lucide-undo-2");
    const undoGroup = undo && undo.closest<HTMLElement>(".canvas-control-group");
    if (undoGroup && !undoGroup.classList.contains("lg-canvas-undo")) undoGroup.classList.add("lg-canvas-undo");
    const cards = root.querySelector<HTMLElement>(".canvas-card-menu");
    if (!cards || !ctl || cards.parentElement === ctl) return;
    cards.lgHome = cards.parentElement;
    cards.classList.add("lg-canvas-cards");
    ctl.appendChild(cards);
  },

  // 메뉴가 닫히면(Obsidian 이 떼어 낸 직후, 그리기 전) 똑같은 사본을 띄워 사라지는 모습을 그린다.
  // 보통 메뉴는 커졌던 기준점으로 줄며 흐려지고, 보관함 메뉴는 중간 지점으로 줄어든 뒤
  // 버튼이 거기서 나타나 메뉴 반대쪽으로 관성으로 지나쳤다가 제자리로 온다
  closeMenu(this: GlassShelfPlugin, menu: HTMLElement, doc: Document) {
    if (menu.lgSnap) return;
    if (menu.lgRow && !menu.lgReplaced) menu.lgRow.classList.remove("lg-row-focus");
    if (!menu.lgReady || menu.lgReplaced) return;
    try {
      const win = doc.defaultView || window;
      const ghost = menu.cloneNode(true) as HTMLElement;
      ghost.classList.add("lg-menu-ghost");
      doc.body.appendChild(ghost);
      win.setTimeout(() => ghost.remove(), 900);
      // 같은 대상을 다시 우클릭해 곧바로 새 메뉴가 붙으면 이 자리에서 옮겨 간다 (setupMenu)
      if (menu.lgKey) this.lastShut = { key: menu.lgKey, rect: ghost.getBoundingClientRect(), t: win.performance.now(), ghost };
      const src = menu.lgSrc;
      if (menu.lgMorph && src && src.isConnected) {
        const { ux, uy, dot, anchor } = menu.lgMorph;
        const r = ghost.getBoundingClientRect();
        const mr = parseFloat(win.getComputedStyle(ghost).borderTopLeftRadius) || 22;
        const full = { left: r.left, top: r.top, width: r.width, height: r.height, radius: mr };
        // 드롭다운은 움직이지 않으므로 돌아오는 동작이 없다. 메뉴는 열릴 때와 같은 드롭다운 가운데 점으로 줄어든다
        const drop = src.matches("select");
        const inner = ghost.querySelector<HTMLElement>(".menu-scroll");
        if (inner) this.pinSize(inner);
        if (inner) inner.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 60, easing: "ease-in", fill: "forwards" });
        this.shrinkBox(ghost, inner && !drop ? [{ el: inner, anchor: anchor || "left", layout: true }] : [], full, dot).onfinish = () => ghost.remove();
        if (src.lgHide) {
          src.lgHide.cancel();
          src.lgHide = null;
        }
        if (!drop) this.dashBack(src, ux, uy, 110);
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
  },

  // 버튼이 메뉴를 연다. 이 버튼이 연 메뉴가 열려 있으면 새로 열지 않고 닫는다.
  // 메뉴는 이 버튼을 부모(setParentElement)로 두므로, 열려 있는 동안 Obsidian 이 버튼에 has-active-menu 를 붙인다
  // (CSS: 버튼 기호가 회색. Obsidian 기본 버튼과 같은 표시)
  toggleMenu(this: GlassShelfPlugin, el: HTMLElement, open: () => void) {
    // 누를 때(mousedown) 이미 열려 있었으면 닫기만 한다 (그사이 닫혔어도 다시 열지 않는다)
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
  tellMenus(this: GlassShelfPlugin, el: HTMLElement, type: string) {
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
  opensMenu(this: GlassShelfPlugin, b: HTMLElement) {
    const label = b.getAttribute("aria-label") || "";
    if (this.menuButtons && this.menuButtons.has(label)) return true;
    const svg = b.querySelector<HTMLElement>("svg");
    const icon = svg ? strs(svg.classList).join(" ") : "";
    return /정렬|sort/i.test(label) || /lucide-(sort|arrow-up-narrow|arrow-down-narrow|arrow-up-down)/.test(icon);
  },

  // 메뉴 항목 목록 읽기: 제목·기호·체크·비활성·구분선
  readMenu(this: GlassShelfPlugin, m: HTMLElement): MenuSnap[] {
    return els(m.querySelectorAll<HTMLElement>(".menu-item, .menu-separator")).map((el): MenuSnap => {
      if (el.classList.contains("menu-separator")) return { sep: true };
      const svg = el.querySelector<HTMLElement>(".menu-item-icon:not(.mod-checked) svg");
      const icon = svg ? strs(svg.classList).find((c) => c.startsWith("lucide-")) : null;
      return {
        title: ((el.querySelector<HTMLElement>(".menu-item-title") || el).textContent || "").trim(),
        icon,
        checked: el.classList.contains("mod-checked") || !!el.querySelector<HTMLElement>(".mod-checked"),
        disabled: el.classList.contains("is-disabled"),
      };
    });
  },

  // 버튼이 여는 Obsidian 메뉴를 보이지 않게 열어 run(메뉴)을 한 뒤 닫는다 (run 이 항목을 누르면 Obsidian 이 알아서 닫는다).
  // 이 메뉴는 애니메이션·닫힘 사본을 만들지 않는다 (lgSnap: setupMenu·closeMenu 가 건너뛴다)
  withHiddenMenu<T>(this: GlassShelfPlugin, b: HTMLElement, run: (m: HTMLElement) => T): Promise<T | null> {
    return new Promise<T | null>((resolve) => {
      const doc = b.ownerDocument;
      const win = doc.defaultView || window;
      const head = b.closest<HTMLElement>(".nav-header");
      const before = new Set(doc.querySelectorAll<HTMLElement>(".menu"));
      doc.body.classList.add("lg-menu-snap");
      if (head) head.classList.add("lg-nav-proxy");
      let m: HTMLElement | null = null;
      try {
        b.dispatchEvent(new win.MouseEvent("click", { bubbles: true, cancelable: true, view: win }));
        m = els(doc.querySelectorAll<HTMLElement>(".menu")).find((x) => !before.has(x)) || null;
      } catch (err) {
        console.error("[glass-shelf] nav menu", err);
      }
      const done = (v: T | null) => {
        doc.body.classList.remove("lg-menu-snap");
        if (head) head.classList.remove("lg-nav-proxy");
        resolve(v);
      };
      if (!m) return done(null);
      const menu = m;
      menu.lgSnap = true;
      // 새 메뉴는 준비(_loaded)된 뒤에야 바깥 누름 알림에 닫힌다
      win.setTimeout(() => {
        let v: T | null = null;
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
  clickOriginal(this: GlassShelfPlugin, b: HTMLElement, anchor: HTMLElement, drop = MENU_DROP) {
    const r = anchor.getBoundingClientRect();
    const head = b.closest<HTMLElement>(".nav-header");
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
  },
};