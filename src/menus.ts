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
      menu.classList.remove("lg-menu-ready", "lg-menu-morph", "lg-bottom-auto", "lg-no-anim", "lg-min-w0");
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
        // 편집창 탭 줄의 메뉴는 탭을 가리지 않게 탭 줄 밑으로
        const list = target && target.closest<HTMLElement>(".mod-root .workspace-tab-header-tab-list");
        const tabMenu = target && target.closest<HTMLElement>(".lg-tab-menu");
        const pathMenu = target && target.closest<HTMLElement>(".lg-path-menu");
        if (list) this.placeUnderTabBar(menu, list, null);
        else if (pathMenu) this.placeUnderTabBar(menu, pathMenu, pathMenu.closest<HTMLElement>(".lg-path-pill"));
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
        menu.lgReady = true;
        this.followHover(menu);
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
  placeUnderTabBar(this: GlassShelfPlugin, menu: HTMLElement, btn: HTMLElement, alignEl: HTMLElement) {
    const tabs = btn.closest<HTMLElement>(".workspace-tabs");
    const header = tabs && tabs.querySelector<HTMLElement>(":scope > .workspace-tab-header-container");
    if (!header) return;
    const win = menu.ownerDocument.defaultView || window;
    const gap = parseFloat(win.getComputedStyle(menu.ownerDocument.body).getPropertyValue("--lg-gap")) || 10;
    const right = alignEl ? alignEl.getBoundingClientRect().right : tabs.getBoundingClientRect().right - gap;
    const left = Math.max(gap, right - menu.offsetWidth);
    menu.style.left = `${left}px`;
    // 탭 줄 버튼·알약 아래 끝(탭 줄 아래 끝 - 아래 여백) + MENU_DROP.
    // 탭 목록·경로 알약의 ≡ 는 그 버튼(알약) 아래 끝 기준: 경로 표시로 탭 줄이 두 줄이 되어도 리본 메뉴와 같은 높이에 연다 (사용자 요청)
    // 탭 목록이 버튼 묶음(.lg-tab-tools) 안에 들어가면 버튼이 알약보다 작아 메뉴가 리본 메뉴보다 높게 열렸다: 묶음 알약 아래 끝 기준 (사용자 지적)
    const rowEl = btn.closest<HTMLElement>(".lg-path-pill, .lg-tab-tools") || (btn.matches(".workspace-tab-header-tab-list") ? btn : null);
    const bottom = rowEl ? layoutBottom(rowEl) : header.getBoundingClientRect().bottom - gap;
    menu.style.top = `${bottom + MENU_DROP}px`;
  },

  // 드롭다운을 Obsidian 메뉴로 연다: 항목마다 고른 것은 체크 표시. 고르면 드롭다운 값을 바꾸고 input·change 를 알려
  // 설정 화면 등이 운영체제 목록에서 고른 것과 똑같이 받는다
  openDropdownMenu(this: GlassShelfPlugin, sel: HTMLSelectElement) {
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
      if (sel.isConnected) sel.focus({ preventScroll: true });
    });
    const b = sel.getBoundingClientRect();
    menu.showAtPosition({ x: b.right, y: b.bottom, width: b.width, overlap: true, left: true }, sel.ownerDocument);
  },

  // 보관함 전환 메뉴: 버튼이 메뉴의 왼쪽 아래 꼭짓점에 오게 둔다(위에 자리가 없으면 왼쪽 위 꼭짓점).
  // 버튼은 메뉴 가운데를 향해 돌진하며 작아져 사라지고, 둘 사이 중간 지점에서 메뉴 창이 넓어져 나온다.
  // 창 크기만 바뀌고 안의 내용은 제자리에 그대로 있다
  // keep: 메뉴를 옮기지 않고 Obsidian 이 둔 자리를 목표로 넓어진다 (Bases 보기 메뉴)
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
    // 최소 폭은 고정 폭으로 바꾼다: 최소 폭이 남아 있으면 넓어지기·줄어들기 애니메이션의 폭이 그 아래로 못 내려가
    // 점으로 줄지 않고 옆으로 밀려갔다 (사용자 지적). 애니메이션은 고정 폭보다 우선한다
    if (drop) {
      menu.style.width = `${W}px`;
      menu.style.removeProperty("min-width");
    }
    // Bases 메뉴는 Obsidian 이 최소 폭(220px)을 CSS 로 걸어, 넓어지는 동안 폭이 줄지 못하고 다 큰 메뉴가 버튼 쪽 점에서
    // 옆으로 미끄러져 왔다 (사용자 지적: 좌우로 흔들림). 넓어지는 동안만 잰 폭으로 고정하고 최소 폭은 푼다 (styles.css .lg-min-w0).
    // 다 넓어지면 둘 다 걷는다: 고정 폭이 남으면 뒤늦게 넓어지는 내용(필터의 속성 칸)이 "폴…"처럼 잘렸다 (사용자 지적)
    if (keep) {
      menu.style.width = `${W}px`;
      menu.classList.add("lg-min-w0");
    }
    // 커뮤니티 찾기 창 정렬 메뉴는 버튼에서 오른쪽 아래로 연다(사용자 요청). 아래 자리가 모자라면 위로
    const downFirst = src.matches(".mod-community-modal .community-modal-search > .clickable-icon");
    // Bases 메뉴는 Obsidian 이 정하는 자리 그대로 둔다(버튼 왼쪽 끝, 버튼 아래 끝 + 4px, 화면 끝 10px 안, 사용자 결정).
    // Obsidian 은 메뉴 크기가 바뀔 때마다(메뉴에 건 ResizeObserver) 버튼 자리를 기준으로 다시 놓는데, 같은 자리라 맞서지 않는다.
    // 다른 자리에 두면 넓어지는 동안 매 프레임 덮어써져, 되돌리거나 고정하는 방식은 깜빡임·렉·닫힘 사본 어긋남이 생겼다
    const top = keep
      ? b.bottom + 4
      : drop
      ? (up ? b.bottom - H : b.top)
      : downFirst
        ? (b.top + H <= win.innerHeight - 8 ? b.top : Math.max(8, b.bottom - H))
        : (b.bottom - H >= 8 ? b.bottom - H : b.top);
    // 보관함 메뉴는 창 왼쪽 끝에서 16px 띄운다: 버튼 자리(10px)에 붙여 열면 왼쪽이 너무 붙어 보였다 (사용자 지적)
    const left = keep ? Math.max(10, Math.min(win.innerWidth - W - 10, b.left)) : drop ? Math.max(8, b.right - W) : src.matches(".workspace-drawer-vault-switcher") ? Math.max(16, b.left) : b.left;
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