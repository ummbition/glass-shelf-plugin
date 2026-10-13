import type { View, WorkspaceLeaf, WorkspaceTabs } from "obsidian";
import { Menu, MarkdownView, Platform, setIcon, setTooltip } from "obsidian";
import { tr, INJECTED, HIDDEN, els, strs, layoutBottom, isEl } from "./util";
import { isWebView, WEB_KEYS_PASS } from "./web-page";
import { MENU_DROP, MINI_TOP, MINI_STEP, MINI_MS, MINI_EASE, MINI_PULL } from "./constants";
import type { GlassShelfPlugin } from "./host";
import type { LgState } from "./internal";

export const tabsMethods = {
  // 탭 그룹 요소에서 지금 선택된 리프를 찾는다
  activeLeafOf(this: GlassShelfPlugin, tabsEl: HTMLElement): WorkspaceLeaf | null {
    let found: WorkspaceLeaf | null = null;
    this.app.workspace.iterateAllLeaves((leaf) => {
      if (found) return;
      if (leaf.parent && leaf.parent.containerEl === tabsEl && leaf.tabHeaderEl && leaf.tabHeaderEl.hasClass("is-active")) {
        found = leaf;
      }
    });
    return found;
  },

  makeButton(this: GlassShelfPlugin, cls: string, icon: string, tooltip: string, onClick: (e: MouseEvent, el: HTMLElement) => void): HTMLElement {
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
  },

  setupRootTabs(this: GlassShelfPlugin, tabsEl: HTMLElement) {
    const header = tabsEl.querySelector<HTMLElement>(":scope > .workspace-tab-header-container");
    if (!header) return;

    // 유리판 층: 헤더 자체가 아닌 별도 층에 블러를 걸어야 안의 버튼들이 진짜 뒤 배경을 굴절시킨다
    if (!header.querySelector<HTMLElement>(":scope > .lg-slab")) {
      header.prepend(createDiv({ cls: ["lg-slab", INJECTED] }));
    }

    // 뒤로·앞으로: 탭 바 맨 왼쪽
    let nav = header.querySelector<HTMLElement>(":scope > .lg-tab-nav");
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

    // 읽기 모드 전환: 문서는 읽기/편집, 웹 뷰어는 읽기 모드(기호만 바뀐다, 사용자 요청)
    let mode = header.querySelector<HTMLElement>(".lg-tab-mode");
    if (!mode) {
      mode = this.makeButton("lg-tab-mode", "book-open", tr("읽기/편집 전환", "Toggle reading/editing"), (e) => {
        const leaf = this.activeLeafOf(tabsEl);
        const v = leaf && leaf.view;
        if (isWebView(v) && typeof v.toggleReaderMode === "function") v.toggleReaderMode();
        else if (v instanceof MarkdownView && typeof v.onSwitchView === "function") v.onSwitchView(e);
        window.setTimeout(() => this.requestRefresh(), 50);
      });
      const tabList = header.querySelector<HTMLElement>(":scope > .workspace-tab-header-tab-list");
      header.insertBefore(mode, tabList || null);
    }

    // +·읽기 모드·탭 목록(쌓기 메뉴)을 알약 하나(.lg-tab-tools)로 묶는다 (사용자 요청). + 와 탭 목록은 Obsidian 원래 버튼을 옮겨
    // 동작이 그대로다. 읽기 모드가 필요 없으면 버튼이 좌우로 접혀 알약이 좁아진다(테마). 휴대폰은 탭 줄이 달라 묶지 않는다
    if (!Platform.isPhone) {
      const newTab = header.querySelector<HTMLElement>(".workspace-tab-header-new-tab");
      const list = header.querySelector<HTMLElement>(".workspace-tab-header-tab-list");
      let tools = header.querySelector<HTMLElement>(":scope > .lg-tab-tools");
      if (!tools) {
        tools = createDiv({ cls: ["lg-tab-tools", INJECTED] });
        if (header.lgBalanceObs) header.lgBalanceObs.observe(tools);
      }
      if (tools.parentElement !== header) header.insertBefore(tools, newTab && newTab.parentElement === header ? newTab : mode);
      const want = [newTab, mode, list].filter(Boolean);
      const kids = els(tools.children);
      if (kids.length !== want.length || kids.some((c, i) => c !== want[i])) want.forEach((el) => tools.appendChild(el));
    }

    // 경로 줄은 탭 줄(inner) 바로 앞에 둔다: 경로 표시를 켜면 첫 줄 가운데(탭 알약 자리)에 오고 탭 줄은 둘째 줄로 내려간다
    let path = header.querySelector<HTMLElement>(":scope > .lg-path");
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
      for (const type of ["keydown", "keyup", "keypress"] as const) {
        pill.addEventListener(type, (e) => {
          if (isEl(e.target) && (e.target.isContentEditable || e.target.tagName === "INPUT") && !e.ctrlKey && !e.metaKey && !e.altKey && !WEB_KEYS_PASS.has(e.key)) e.stopPropagation();
        });
      }
      // 지금 탭의 더 보기 메뉴 (경로 표시를 켜면 탭 안의 ≡ 대신 이것을 쓴다)
      pill.appendChild(
        this.makeButton("lg-path-menu", "menu", tr("더 보기", "More options"), (e, el: HTMLElement) =>
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
    const tabInner = header.querySelector<HTMLElement>(":scope > .workspace-tab-header-container-inner");
    if (tabInner && path.nextSibling !== tabInner) header.insertBefore(path, tabInner);
    else if (!path.parentElement) header.appendChild(path);

    this.watchTabWidths(header.querySelector<HTMLElement>(":scope > .workspace-tab-header-container-inner"));

    // 각 탭 안의 메뉴 버튼 (활성 탭에서만 보임)
    const leaves: WorkspaceLeaf[] = [];
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
  },

  // 창 끌기 띠 (CSS: .lg-drag-band, 탭 줄 첫 줄만 창을 잡는다). 끌기 영역은 문서 순서대로 겹쳐 뒤에 오는 버튼의 끌기 제외가
  // 띠를 파내므로, 띠는 늘 탭 줄의 첫 자식이어야 한다. Obsidian 은 패널을 닫을 때 패널 열기 버튼을 탭 줄 맨 앞에 넣는데,
  // 그러면 버튼이 띠보다 앞이 되어 띠에 덮여 눌리지 않았다 (사용자 제보). 탭 줄의 자식이 바뀔 때마다 띠를 맨 앞으로 되돌린다
  keepDragBand(this: GlassShelfPlugin, header: HTMLElement) {
    let band = header.querySelector<HTMLElement>(":scope > .lg-drag-band");
    if (!band) band = createDiv({ cls: ["lg-drag-band", INJECTED] });
    if (header.firstElementChild !== band) header.prepend(band);
    if (header.lgBandObs) return;
    const win = header.ownerDocument.defaultView || window;
    const obs = new win.MutationObserver(() => {
      const b = header.querySelector<HTMLElement>(":scope > .lg-drag-band");
      if (b && header.firstElementChild !== b) header.prepend(b);
    });
    obs.observe(header, { childList: true });
    header.lgBandObs = obs;
    this.observers.push(obs);
  },

  // 왼쪽 리본을 숨기고(styles.css), 그 버튼들은 편집창 탭 줄 맨 왼쪽의 리본 메뉴 버튼 하나로 모은다 (사용자 요청).
  // 리본에 있던 왼쪽 패널 열기 토글은 리본이 숨으면 Obsidian 이 스스로 이 탭 줄 맨 왼쪽으로 옮긴다(패널이 닫혀 있을 때).
  // 데스크톱·태블릿(태블릿은 서랍 안 리본의 실행 버튼 묶음을 숨긴다, styles.css), 편집창의 맨 위 왼쪽 탭 묶음 하나에만 단다
  setupRibbonButtons(this: GlassShelfPlugin, tabsEl: HTMLElement, header: HTMLElement, nav: HTMLElement) {
    if (Platform.isPhone) return;
    const root = this.app.workspace.rootSplit;
    const first = !!root && root.containerEl.querySelector<HTMLElement>(".workspace-tabs") === tabsEl;
    let rib = header.querySelector<HTMLElement>(":scope > .lg-rib-menu");
    if (!first) {
      if (rib) rib.remove();
      return;
    }
    if (!rib) {
      rib = this.makeButton("lg-rib-menu", "layout-grid", tr("리본 메뉴", "Ribbon menu"), (e, el: HTMLElement) => this.toggleMenu(el, () => this.openRibbonMenu(el)));
      header.insertBefore(rib, nav);
      if (header.lgBalanceObs) header.lgBalanceObs.observe(rib);
    }
  },

  // 숨긴 왼쪽 리본의 버튼들을 메뉴로 보인다. 항목을 누르면 원래 리본 버튼을 대신 눌러 Obsidian·플러그인 동작을 그대로 쓴다
  openRibbonMenu(this: GlassShelfPlugin, anchor: HTMLElement) {
    const doc = anchor.ownerDocument;
    const win = doc.defaultView || window;
    // 설정(외관 > 리본 메뉴)에서 숨긴 버튼은 뺀다. 순서는 리본에 놓인 순서(설정에서 바꾼 순서)를 따른다.
    // 메뉴를 열 때마다 새로 읽으므로 설정을 바꾸면 다음에 열 때 반영된다
    const rb = this.app.workspace.leftRibbon;
    const hidden = new Set(((rb && rb.items) || []).filter((i) => i.hidden).map((i) => i.buttonEl));
    const buttons = els(doc.querySelectorAll<HTMLElement>(":is(.workspace-ribbon:is(.mod-left, .mod-primary), .workspace-drawer-ribbon) .side-dock-actions .side-dock-ribbon-action")).filter(
      (b) => !hidden.has(b) && !b.hidden && win.getComputedStyle(b).display !== "none"
    );
    // 태블릿은 서랍 리본을 통째로 숨기므로(styles.css) 그 아래쪽 버튼(보관함·도움말·설정)도 메뉴 끝에 둔다
    const extra = els(doc.querySelectorAll<HTMLElement>(".workspace-drawer-ribbon .side-dock-settings [aria-label]"));
    const menu = new Menu();
    if (buttons.length === 0 && extra.length === 0) menu.addItem((item) => item.setTitle(tr("리본에 버튼이 없습니다", "No ribbon buttons")).setDisabled(true));
    let sep = buttons.length > 0;
    for (const b of buttons.concat(extra)) {
      if (sep && b === extra[0]) menu.addSeparator();
      const svg = b.querySelector<HTMLElement>("svg");
      const icon = svg ? strs(svg.classList).find((c) => c.startsWith("lucide-")) : null;
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
    menu.showAtPosition({ x: r.left, y: layoutBottom(anchor) + MENU_DROP }, doc);
  },

  // inner(탭 줄)를 가진 탭 묶음 객체
  tabsOf(this: GlassShelfPlugin, inner: HTMLElement): WorkspaceTabs | null {
    let found: WorkspaceTabs | null = null;
    this.app.workspace.iterateAllLeaves((l) => {
      if (l.parent && l.parent.tabsInnerEl === inner) {
        found = l.parent as WorkspaceTabs;
        return true; // 찾으면 순회를 멈춘다
      }
    });
    return found;
  },

  // 탭 추가·닫기 폭 애니메이션은 Obsidian 자체 전환(새 탭은 0에서 커지고, 닫힌 탭은 복제본이 줄어든다)을 쓴다.
  // 여기서는 줄어드는 복제본에 표시만 달아, 테마가 그 구분선 등을 정리할 수 있게 한다
  watchTabWidths(this: GlassShelfPlugin, inner: HTMLElement) {
    if (!inner || this.tabsWatched.has(inner)) return;
    this.tabsWatched.add(inner);
    const obs = new MutationObserver(() => {
      const tabs = this.tabsOf(inner);
      if (!tabs) return;
      const live = new Set<Element | undefined>(tabs.tabHeaderEls || tabs.children.map((l) => l.tabHeaderEl));
      for (const el of inner.children) {
        if (el.classList.contains("workspace-tab-header")) el.classList.toggle("lg-tab-leaving", !live.has(el));
      }
    });
    obs.observe(inner, { childList: true });
    this.observers.push(obs);
  },

  setupTabMenu(this: GlassShelfPlugin, leaf: WorkspaceLeaf) {
    const inner = leaf.tabHeaderEl && leaf.tabHeaderEl.querySelector<HTMLElement>(".workspace-tab-header-inner");
    if (!inner || inner.querySelector<HTMLElement>(":scope > .lg-tab-menu")) return;
    const btn = this.makeButton("lg-tab-menu", "menu", tr("더 보기", "More options"), (e, el: HTMLElement) => this.toggleMenu(el, () => this.openViewMenu(leaf, el)));
    inner.appendChild(btn);
  },

  // 뷰의 더 보기 메뉴를 연다 (탭 안의 ≡, 경로 알약의 ≡)
  openViewMenu(this: GlassShelfPlugin, leaf: WorkspaceLeaf, el: HTMLElement) {
    const view = leaf.view;
    if (!view) return;
    if (typeof view.onMoreOptions === "function") {
      view.onMoreOptions({ preventDefault() {}, target: el });
    } else if (view.moreOptionsButtonEl) {
      view.moreOptionsButtonEl.click();
    }
  },

  goHistory(this: GlassShelfPlugin, tabsEl: HTMLElement, dir: "back" | "forward") {
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
  balanceTabs(this: GlassShelfPlugin, tabsEl: HTMLElement) {
    const header = tabsEl.querySelector<HTMLElement>(":scope > .workspace-tab-header-container");
    const inner = header && header.querySelector<HTMLElement>(":scope > .workspace-tab-header-container-inner");
    if (!inner) return;
    let sp = header.querySelector<HTMLElement>(":scope > .lg-tab-balance");
    if (!sp) {
      sp = createDiv({ cls: ["lg-tab-balance", INJECTED] });
      header.insertBefore(sp, inner);
    }
    if (!header.lgBalanceObs) {
      const win = header.ownerDocument.defaultView || window;
      header.lgBalanceObs = new win.ResizeObserver(() => this.balanceTabs(tabsEl));
      header.lgBalanceObs.observe(header);
      els(header.children).forEach((c) => c !== inner && c !== sp && header.lgBalanceObs.observe(c));
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
    const path = header.querySelector<HTMLElement>(":scope > .lg-path");
    const stacked = tabsEl.classList.contains("mod-stacked");
    const anchor = !Platform.isPhone && path && (stacked || this.settings.showPath) ? path : inner;
    // 화면 순서로 늘어놓는다: 왼쪽 패널 버튼·리본 메뉴는 CSS order 로 맨 앞에 오지만 문서 순서로는 뒤로·앞으로 다음에 있어,
    // 문서 순서로 보면 왼쪽 무리의 끝을 잘못 잡아 경로 알약이 오른쪽으로 치우쳤다 (태블릿, 사용자 지적)
    const kids = els(header.children)
      .filter(
        (c) => c !== sp && (anchor === inner || c !== inner) && !c.classList.contains("lg-slab") && !c.classList.contains("lg-seg-indicator") && c.getClientRects().length && getComputedStyle(c).position !== "absolute"
      )
      .map((c, k) => ({ c, k, o: parseFloat(getComputedStyle(c).order) || 0 }))
      .sort((a, b) => a.o - b.o || a.k - b.k)
      .map((x) => x.c);
    const i = kids.indexOf(anchor);
    // 자리는 배치 자리(offset)로 잰다: 화면에 보이는 크기(getBoundingClientRect)는 버튼이 커지고 줄어드는 애니메이션(transform)
    // 도중의 크기라, 그때 재면 그 값으로 남아 탭 줄이 살짝 치우쳤다 (태블릿, 사용자 지적. transform 은 크기 감시에 안 걸려 다시 재지 않는다)
    const box = (c: HTMLElement) => {
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
  },

  // 탭 줄 축소: 편집창 본문(편집·읽기 보기의 스크롤 칸)의 스크롤 방향을 본다
  onMiniScroll(this: GlassShelfPlugin, t: EventTarget | null) {
    if (!isEl(t) || !this.settings.miniBar) return;
    if (!t.matches(".cm-scroller, .markdown-preview-view")) return;
    const tabs = t.closest<HTMLElement>(".mod-root .workspace-tabs");
    if (!tabs || tabs.classList.contains("mod-stacked")) return;
    this.miniFeed(tabs, t, t.scrollTop);
  },

  // 스크롤 위치 y 를 받아 접거나 편다. h 는 스크롤 상태를 들고 있는 것(편집창 스크롤 칸, 웹 뷰어는 보기)
  miniFeed(this: GlassShelfPlugin, tabs: HTMLElement, h: LgState, y: number) {
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
  setMini(this: GlassShelfPlugin, tabs: HTMLElement, on: boolean) {
    if (tabs.classList.contains("lg-mini") === on) return;
    const header = tabs.querySelector<HTMLElement>(":scope > .workspace-tab-header-container");
    const win = tabs.ownerDocument.defaultView || window;
    const items: [HTMLElement, string[]][] = [];
    if (header) {
      for (const c of els(header.children)) {
        if (c.classList.contains("lg-drag-band")) continue;
        if (c.classList.contains("lg-slab")) items.push([c, ["height"]]);
        else if (c.classList.contains("lg-path")) {
          const p = c.querySelector<HTMLElement>(".lg-path-pill");
          // 경로 표시를 끈 경우 알약은 접힐 때만 보인다 (나타날 때는 커지며 나타나고, 사라질 때는 바로 사라진다).
          // 폭은 애니메이션하지 않는다 (좌우로 좁아지는 움직임을 빼 달라는 사용자 요청)
          if (p) items.push([p, ["height", "translate", "scale", "opacity"]]);
        } else if (c.getClientRects().length) items.push([c, ["opacity", "scale", "translate", "visibility"]]);
      }
    }
    const read = () =>
      items.map(([el, ps]) => {
        const cs = win.getComputedStyle(el);
        const o: Record<string, string> = {};
        for (const p of ps) o[p] = cs.getPropertyValue(p);
        return o;
      });
    const from = read();
    const shown = items.map(([el]) => el.getClientRects().length > 0);
    // 사라지는 요소는 접힌 알약 자리(띠 가운데) 쪽으로 조금(거리의 MINI_PULL) 움직이며 작아진다 (사용자 요청).
    // 요소마다 그 이동량을 변수(--lg-mini-tx/ty)로 준다. offsetLeft/Top 은 애니메이션 중의 이동을 빼고 잰 자리다(탭 줄 기준)
    const path = header && header.querySelector<HTMLElement>(":scope > .lg-path");
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
    // 웹 뷰어 경로 알약의 글자 칸은 여백에 전환이 걸려 있어(주소 고칠 때용), 접고 펼 때 그 여백을 따라 알약 폭이 줄었다 늘며
    // 좌우로 움직였다(위아래 이동과 합쳐 반원을 그림, 사용자 지적). 이 칸도 함께 전환을 끈다
    const noTr = items.map(([el]) => el);
    const pathText = header && header.querySelector<HTMLElement>(".lg-path-text");
    if (pathText) noTr.push(pathText);
    for (const el of noTr) el.classList.add("lg-no-tr");
    tabs.classList.toggle("lg-mini", on);
    const to = read();
    for (const el of noTr) el.classList.remove("lg-no-tr");
    // 웹 뷰어: 페이지 위 여백을 띠 밑변에 다시 맞춘다. 지금(바뀐 뒤 자리, 애니메이션을 걸기 전) 재고, 페이지 고정 막대는
    // 띠와 같은 시간·곡선으로 움직인다 (펼 때 띠가 다 내려온 뒤 맞추면 막대가 한발 늦었다, 사용자 지적)
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
  updatePath(this: GlassShelfPlugin, tabsEl: HTMLElement, view: View) {
    const el = tabsEl.querySelector<HTMLElement>(":scope > .workspace-tab-header-container > .lg-path .lg-path-text");
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
    // 웹 뷰어: Obsidian 원래 주소칸(.webviewer-address)을 경로 글자 자리에, 새로고침 버튼을 알약 오른쪽 ≡ 앞에 옮겨 온다 (사용자 요청).
    // 주소 고치기·제안 목록·이동은 Obsidian 이 그대로 한다
    if (web) {
      el.lgMoved = [];
      const menu = pill && pill.querySelector<HTMLElement>(":scope > .lg-path-menu");
      for (const [node, holder, before] of [
        [web.addr, el, null],
        [web.reload, pill, menu],
      ]) {
        if (!node || !node.parentElement || !holder) continue;
        el.lgMoved.push({ node, parent: node.parentElement, next: node.nextSibling, holder });
        holder.insertBefore(node, before);
      }
      this.webUrlLabel(el, view, web.addr);
      return;
    }
    if (!file) return;
    // 상위 폴더(view.titleParentEl)와 파일 이름(view.titleEl)은 새로 그리지 않고 Obsidian 원래 제목 줄의 요소를 옮겨 와 쓴다
    // (사용자 요청). 폴더를 누르면 보여 주기, 제목을 눌러 이름 바꾸기, 이름·위치가 바뀔 때 다시 쓰기는 Obsidian 이 그대로 한다
    el.lgMoved = [];
    for (const node of [view.titleParentEl, view.titleEl]) {
      if (!node || !node.parentElement) continue;
      el.lgMoved.push({ node, parent: node.parentElement, next: node.nextSibling, holder: el });
      el.appendChild(node);
    }
    if (view.titleEl && view.titleEl.parentElement === el) view.titleEl.classList.add("lg-path-file");
    // 이름 바꾸기: Obsidian 은 제목을 누르면 상위 폴더 줄을 떼어 두고, 끝나면 원래 제목 줄(titleContainerEl) 맨 앞에 다시 끼운다.
    // 그래서 이름을 바꾼 뒤 알약엔 파일 이름만 남고 폴더 줄은 원래 자리에 가거나(숨은 자리라) 안 보였다 (사용자 지적).
    // 원래 제목 줄을 지켜보다 폴더 줄이 돌아오면 알약의 파일 이름 앞으로 다시 옮긴다
    const box = view.titleContainerEl;
    if (box && view.titleParentEl) {
      if (!this.titleWatched) this.titleWatched = new WeakSet();
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
  returnTitle(this: GlassShelfPlugin, el: HTMLElement) {
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
  pathShown(this: GlassShelfPlugin, tabsEl: HTMLElement) {
    return !Platform.isPhone && (tabsEl.classList.contains("mod-stacked") || !!this.settings.showPath);
  },

  // 원래 버튼의 상태를 새 버튼에 옮긴다
  syncTabBar(this: GlassShelfPlugin, tabsEl: HTMLElement, nav: HTMLElement, mode: HTMLElement) {
    const leaf = this.activeLeafOf(tabsEl);
    const view = leaf && leaf.view;
    const isWeb = isWebView(view) && !Platform.isPhone;
    // 웹 뷰어는 보기 헤더(주소 줄)를 늘 보이게 하는데, 주소칸·새로고침·읽기 모드를 탭 줄로 옮기므로 다른 보기처럼 숨긴다 (끌 때 되돌린다)
    if (isWeb && view.headerEl && view.headerEl.classList.contains("view-header-always-show")) {
      view.headerEl.classList.remove("view-header-always-show");
      view.headerEl.classList.add("lg-web-head");
    }

    if (isWeb) this.webNavWire(view);
    const hist = leaf && leaf.history;
    const back = nav.querySelector<HTMLElement>(".lg-tab-back");
    const fwd = nav.querySelector<HTMLElement>(".lg-tab-forward");
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

    // 탭 알약에 옮겨 둔 주소칸을 먼저 되돌리고(경로 알약으로 갈 수 있게), 경로 알약을 맞춘 뒤 탭 알약에 둔다
    this.webTab(tabsEl, leaf, false);
    this.updatePath(tabsEl, view);
    this.webTab(tabsEl, leaf, true);
    if (isWeb && !Platform.isPhone) this.webMouseWire(view);
    // 탭을 바꿀 때는 유리판 색을 바로 바꾼다. 색 전환(0.3초)을 그대로 두면 웹 탭으로 갈 때 편집창의 옅은 유리 너머로
    // 페이지가 또렷이 비치다가 페이지 색으로 차올라, 띠의 흐림이 늦게 들어오는 것처럼 보였다 (사용자 지적).
    // 같은 페이지 안에서 색이 바뀔 때(이동 등)는 전환을 둔다
    const slab = tabsEl.querySelector<HTMLElement>(":scope > .workspace-tab-header-container > .lg-slab");
    const switched = !!slab && tabsEl.lgSlabView !== view;
    tabsEl.lgSlabView = view;
    if (switched) slab.classList.add("lg-no-tr");
    if (isWeb && this.settings.webTint) {
      this.webWire(view);
      this.webInject(view, false);
      this.webTint(view);
    } else if (tabsEl.classList.contains("lg-web-tinted")) {
      tabsEl.classList.remove("lg-web-tinted");
      const h = tabsEl.querySelector<HTMLElement>(":scope > .workspace-tab-header-container");
      if (h) { h.classList.remove("lg-glass-mix"); h.style.removeProperty("--lg-glass-t"); }
    }
    if (switched) {
      void slab.offsetWidth;
      slab.classList.remove("lg-no-tr");
    }

    const isMd = view instanceof MarkdownView;
    // 숨길 때 바로 없애지 않고 폭을 접어서, 탭 길이가 부드럽게 바뀌게 한다
    mode.classList.remove(HIDDEN);
    mode.classList.toggle("lg-mode-off", !isMd && !isWeb);

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
    // 웹 뷰어 읽기 모드는 켜져 있으면 강조색으로 보인다
    mode.classList.toggle("is-active", isWeb && view.mode === "reader");
    if (isMd || isWeb) {
      const reading = isMd ? view.getMode() === "preview" : view.mode === "reader";
      const icon = isWeb ? "glasses" : reading ? "edit-3" : "book-open";
      const key = `${icon}:${reading}`;
      if (mode.dataset.icon !== key) {
        setIcon(mode, icon);
        mode.dataset.icon = key;
        if (isWeb) setTooltip(mode, reading ? tr("웹 페이지로 보기", "Show web page") : tr("읽기 모드", "Reader view"));
        else setTooltip(mode, reading ? tr("편집 모드로 전환", "Switch to editing view") : tr("읽기 모드로 전환", "Switch to reading view"));
      }
    }
  },
};