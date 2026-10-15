import { Platform } from "obsidian";
import { INJECTED, els, isEl, tgPad } from "./util";
import { HOVER_GLASS, PRESS_POP, PRESS_DELAY_MS, HOLD_RETURN_MS, HOLD_EASE_SPAN, RIPPLE_HOLD, PRESS_SLOP, EASE, DRAG_SCROLL_ZONE, DRAG_SCROLL_MAX, TASK_PRESS_MS, PANEL_TOGGLES, MENU_RIPPLE_FROM, TAB_RIPPLE_K, PRESS_RIPPLE, PRESS_PILL, PRESS_SCALE } from "./constants";
import { LENS_TOGGLE } from "./refract";
import type { GlassShelfPlugin } from "./host";
import type { PressInfo } from "./internal";

export const eventsMethods = {
  // 별도 창(설정·커뮤니티)의 창 제목을 왼쪽 요소 끝과 창 제어 알약 사이 가운데에 둔다
  placeTitle(this: GlassShelfPlugin, doc: Document) {
    try {
      const t = doc.querySelector<HTMLElement>(".titlebar-text");
      const ctr = doc.querySelector<HTMLElement>(".titlebar-button-container.mod-right");
      if (!t || !ctr) return;
      let leftEdge: number | null = null;
      const search = doc.querySelector<HTMLElement>(".mod-community-modal .community-modal-search");
      if (search) {
        const last = search.lastElementChild || search;
        leftEdge = last.getBoundingClientRect().right;
      } else {
        const side = doc.querySelector<HTMLElement>(".modal.mod-settings .vertical-tab-header");
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
  },

  // 한 창(document)에 호버 자석·스크롤바·토글 애니메이션을 붙인다
  // 끌기 중 자동 스크롤 (패널 목록). 테마는 목록을 떠 있는 탭 줄·보관함 줄 밑까지 늘려 두므로, 목록의 실제 위·아래 끝이
  // 그 줄들에 가려 Obsidian(브라우저)의 끝 근처 자동 스크롤이 걸리지 않았다. 보이는 위·아래 끝에서 DRAG_SCROLL_ZONE 안에 두면
  // 가까울수록 빠르게 스크롤한다
  attachDragScroll(this: GlassShelfPlugin, doc: Document, win: Window) {
    let pos: { x: number; y: number } | null = null;
    let frame = 0;
    const visibleEdges = (sc: HTMLElement) => {
      const r = sc.getBoundingClientRect();
      let top = r.top;
      let bottom = r.bottom;
      const tabs = sc.closest<HTMLElement>(".workspace-tabs");
      const head = tabs && tabs.querySelector<HTMLElement>(":scope > .workspace-tab-header-container");
      if (head && head.getClientRects().length) top = Math.max(top, head.getBoundingClientRect().bottom);
      const split = sc.closest<HTMLElement>(".mod-left-split");
      const vault = split && split.querySelector<HTMLElement>(".workspace-sidedock-vault-profile");
      if (vault && vault.getClientRects().length) {
        const vr = vault.getBoundingClientRect();
        if (vr.top < bottom && vr.bottom > top) bottom = Math.min(bottom, vr.top);
      }
      return { top, bottom, left: r.left, right: r.right };
    };
    // 커서 아래의 패널 스크롤 영역
    const scrollerAt = (x: number, y: number) => {
      for (const sc of doc.querySelectorAll<HTMLElement>(":is(.mod-left-split, .mod-right-split) :is(.nav-files-container, .workspace-leaf-content > .view-content, .search-result-container)")) {
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
  },

  attachDoc(this: GlassShelfPlugin, doc: Document) {
    if (this.unloaded) return;
    if (this.docs.has(doc)) return;
    this.docs.add(doc);
    try {
      this.attachDocInner(doc);
    } catch (err) {
      console.error("[glass-shelf] attach-fail", err);
    }
  },

  attachDocInner(this: GlassShelfPlugin, doc: Document) {
    const win = doc.defaultView || window;
    if (!Platform.isMobile) this.attachDragScroll(doc, win);
    this.applyBodyState(doc);

    // 설정 창 등 창(.modal-container)과 Bases 툴바 메뉴(뷰 설정 등)의 드롭다운 줄 표시 (markDropdownRows).
    // body 의 직속 자식만 보고, 창·메뉴가 붙으면 그 안을 지켜본다
    const watchModal = (m: HTMLElement) => {
      if (!m.classList || !(m.classList.contains("modal-container") || m.classList.contains("bases-toolbar-menu"))) return;
      if (!this.ddWatched) this.ddWatched = new WeakSet();
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

    // 파일 탐색기를 마지막으로 눌렀으면 body 에 lg-explorer-on 을 붙인다 (CSS: 선택한 문서가 강조색으로 빛난다).
    // 편집창이나 다른 패널을 누르면 뗀다. 메뉴·창(모달)·알림을 누를 때는 그대로 둔다 (우클릭 메뉴 등).
    // 파일을 누르면 Obsidian 이 편집창을 활성 칸으로 바꾸므로 활성 칸(.mod-active)이 아니라 마지막으로 누른 곳을 본다
    this.registerDomEvent(
      doc,
      "pointerdown",
      (e) => {
        const t = e.target as HTMLElement;
        if (!isEl(t) || t.closest<HTMLElement>(".menu, .modal-container, .notice-container, .tooltip")) return;
        doc.body.classList.toggle("lg-explorer-on", !!t.closest<HTMLElement>('.workspace-leaf-content[data-type="file-explorer"]'));
        // 마지막으로 누른 좌우 패널에 lg-split-on (CSS: 목록 방식 탭 줄의 선택 탭이 그 패널을 눌렀을 때만 강조색, 아니면 회색. 사용자 요청)
        const sp = t.closest<HTMLElement>(".workspace-split.mod-sidedock");
        doc.querySelectorAll<HTMLElement>(".workspace-split.mod-sidedock").forEach((s) => s.classList.toggle("lg-split-on", s === sp));
      },
      true
    );
    this.register(() => {
      doc.body.classList.remove("lg-explorer-on");
      doc.querySelectorAll(".lg-split-on").forEach((s) => s.classList.remove("lg-split-on"));
    });

    // 편집창 스크롤로 탭 줄 접기·펴기 (데스크톱·태블릿)
    if (!Platform.isPhone) this.registerDomEvent(doc, "scroll", (e) => this.onMiniScroll(e.target), { capture: true, passive: true });

    // 메뉴를 연 채 메뉴 밖에서 휠을 굴리면 메뉴를 닫는다 (사용자 요청). Obsidian 은 메뉴 밖을 누를 때만 닫는다.
    // Esc 를 한 번 보내 Obsidian 이 스스로 닫게 한다. 여러 번 보내면 닫히는 애니메이션 중인 메뉴 때문에 남은 Esc 가
    // 뒤의 설정 창까지 닫는다. 메뉴 안의 휠(긴 메뉴 스크롤)은 그대로 둔다
    if (!Platform.isPhone)
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

    // 상태 표시줄(오른쪽 아래에 떠 있는 동기화·백링크·글자 수 알약)이 창 아래에서 차지하는 높이를 body 에 알린다
    // (CSS: --lg-status-h, 오른쪽 패널의 그래프 설정 창이 그 밑으로 내려가지 않게). 비어 있으면 0
    if (!Platform.isMobile) {
      const sb = doc.querySelector<HTMLElement>(".status-bar");
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
    const inWc = (t: EventTarget | null) => t instanceof win.Element && !!t.closest<HTMLElement>(".titlebar-button-container.mod-right");
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
    let magnetEl: HTMLElement | null = null;
    let magnetFrame: number | null = null;
    let lastMove: PointerEvent | null = null;
    // 버튼 자리는 올라갈 때 한 번 재 두고 커서가 움직이는 동안 다시 쓴다.
    // (움직일 때마다 재면 그때마다 브라우저가 밀린 스타일 계산을 먼저 치러야 한다)
    // 스크롤·창 크기 변화가 있거나 0.5초가 지나면 다시 잰다
    let magnetRect: { left: number; top: number; width: number; height: number; near?: boolean } | null = null;
    let magnetAt = 0;
    const dropRect = () => {
      magnetRect = null;
    };
    this.registerDomEvent(doc, "scroll", dropRect, { capture: true, passive: true });
    this.registerDomEvent(win, "resize", dropRect, { passive: true });
    // 창을 배율이 다른 모니터로 옮기거나 확대·축소하면 화면 한 픽셀 길이를 다시 준다 (배율이 바뀌면 resize 가 온다)
    this.registerDomEvent(win, "resize", () => this.applyDevicePx(doc), { passive: true });
    // 끌림 기준 자리. 넓어진 칸반·패널 검색 버튼은 왼쪽 돋보기 자리(정사각형)를 기준으로 끈다 (호버 유리도 그 자리에 뜬다, 테마).
    // 이때는 커서가 그 정사각형 안에 있을 때만 끌린다(near): 검색 칸 위에서도 끌리면 칸 전체를 기준으로 돋보기가 끌려갔다 (사용자 요청)
    const magnetBox = (el: HTMLElement): { left: number; top: number; width: number; height: number; near?: boolean } => {
      const q = el.getBoundingClientRect();
      if (!el.matches(".lg-kb-searching .lg-kb-search-btn, .lg-nav-search")) return q;
      return { left: q.left, top: q.top, width: q.height, height: q.height, near: true };
    };
    const resetMagnet = (el: HTMLElement) => {
      if (!el) return;
      el.style.removeProperty("--lg-mx");
      el.style.removeProperty("--lg-my");
      // 좌우 패널 투명 위 버튼은 호버 유리가 흐려지는 동안(테마 180ms)에도 굴절 필터를 남겨 둔다(테마: .lg-holes 의 호버 유리 필터는 늘 단다).
      // 벗어나는 순간 필터를 떼면 흐려지는 동안 잠깐 까맣게 보였다 (사용자 지적, 원인은 추정). 다시 올라오면 refractHover 가 새로 건다
      if (el.closest(".lg-holes")) win.setTimeout(() => el !== magnetEl && el.style.removeProperty("--lg-refract-h"), 260);
      else el.style.removeProperty("--lg-refract-h");
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
          // 목록 방식 패널의 탭은 호버 유리 대신 평평한 회색이다
          const hit = isEl(ev.target) ? ev.target.closest<HTMLElement>(HOVER_GLASS) : null;
          const el = hit && hit.matches(".workspace-tab-header") && hit.closest(".lg-tab-list") ? null : hit;
          if (el !== magnetEl) {
            resetMagnet(magnetEl);
            magnetEl = el;
            magnetRect = null;
            if (el) {
              // 먼저 자리를 재고(읽기) 그다음 굴절을 건다(쓰기): 읽기·쓰기가 번갈지 않게
              magnetRect = magnetBox(el);
              magnetAt = win.performance.now();
              // 아이콘 버튼은 호버 유리 요소를 그 버튼에 넣는다 (굴절이 꺼져 있어도)
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
    const pressFx =
      (e: PointerEvent) => {
        if (e.button !== 0 || !isEl(e.target)) return;
        // 메뉴 항목: 메뉴 판 안에서 누른 자리부터 알약 안 버튼과 같은 흰 빛이 퍼진다 (사용자 요청).
        // 누르는 순간 이미 반쯤 퍼져 있고(MENU_RIPPLE_FROM), 다 퍼지면 메뉴 판 전체를 덮는다(누른 자리에서 가장 먼 모서리까지)
        const menuItem = (e.target as HTMLElement).closest<HTMLElement>(".menu .menu-item:not(.is-disabled):not(.is-label)");
        if (menuItem) {
          const menu = menuItem.closest<HTMLElement>(".menu");
          const m = menu.getBoundingClientRect();
          const far = Math.hypot(Math.max(e.clientX - m.left, m.right - e.clientX), Math.max(e.clientY - m.top, m.bottom - e.clientY));
          // 흰 빛은 반지름의 80% 에서 투명해지므로 그만큼 크게
          return this.pressRipple(menu, e, (far * 2) / 0.8, "lg-ripple-menu", true, MENU_RIPPLE_FROM);
        }
        const kbAdd = (e.target as HTMLElement).closest<HTMLElement>(".kanban-plugin__new-item-button");
        if (kbAdd) return this.pressKanbanAdd(kbAdd);
        // 칸반 목록 추가 창의 버튼(목록 추가·취소): 다른 알약처럼 커지며 하얘졌다 돌아온다 (사용자 요청)
        const laneBtn = (e.target as HTMLElement).closest<HTMLElement>(".kanban-plugin__lane-input-actions button");
        if (laneBtn) return this.pressPill(laneBtn);
        if (Platform.isMobile && this.pressMobile(e.target)) return;
        // 앱 안 설정·커뮤니티 창의 닫기(X): 유리를 ::after 가 아니라 요소 자체에 그려(테마), 요소를 통째로 단독 버튼과 같은 값으로 키우고 하얗게 한다
        const modalX = (e.target as HTMLElement).closest<HTMLElement>("body:not(.is-popout-modal) .modal:is(.mod-settings, .mod-community-modal) > :is(.modal-close-button, .modal-header-button)");
        if (modalX) return this.pressPopSelf(modalX);
        // 넓어진 패널 검색 버튼 안의 검색 칸: 효과 없이 입력만
        if ((e.target as HTMLElement).closest<HTMLElement>(".lg-nav-find .search-input-container")) return;
        // 탭 줄 오른쪽 묶음(.lg-tab-tools) 안의 +·목록·읽기 모드는 단독 버튼이 아니라 알약 안 버튼이다
        const pop0 = (e.target as HTMLElement).closest<HTMLElement>(PRESS_POP);
        const pop = pop0 && !pop0.closest<HTMLElement>(".lg-tab-tools") ? pop0 : null;
        // 칸반 검색 버튼: 흰 빛이 열리는(닫히는) 쪽으로 퍼진다
        const kbSearch = (e.target as HTMLElement).closest<HTMLElement>(".lg-kb-search-btn, .lg-nav-find");
        if (kbSearch) return this.pressKbSearch(kbSearch);
        if (pop) {
          const anims = this.pressPop(pop);
          if (pop.matches(PANEL_TOGGLES)) this.handoffPop(pop, anims);
          return;
        }
        // 검색 탭 검색창: 처음 누를 때(아직 입력 중이 아닐 때) 알약이 커지며 하얘졌다 돌아온다
        const field = (e.target as HTMLElement).closest<HTMLElement>('.workspace-leaf-content[data-type="search"] .search-input-container');
        if (field) {
          const input = field.querySelector("input");
          if (input && doc.activeElement !== input) this.pressField(field, e);
          return;
        }
        const sc = (e.target as HTMLElement).closest<HTMLElement>(PRESS_SCALE);
        if (sc) this.pressScale(sc);
        const rip = (e.target as HTMLElement).closest<HTMLElement>(PRESS_RIPPLE);
        if (rip) this.pressRipple(rip, e);
        // 패널 탭: 효과 없음 모드에서는 알약 안 버튼과 같은 흰 빛이 탭 가운데에서 퍼진다 (사용자 요청, 렌즈 모드는 렌즈가 대신한다)
        else if (this.tabPlain()) {
          const tab = (e.target as HTMLElement).closest<HTMLElement>(":is(.mod-left-split, .mod-right-split) .workspace-tab-header-container .workspace-tab-header");
          // 목록 방식 패널의 탭은 흰 빛이 없다: 알약이 목록 전체라 패널 투명(심플로 보임)에서 목록만 한 흰 알약이 퍼졌다 (사용자 지적)
          if (tab && !tab.closest(".lg-tab-list")) {
            // 누르는 순간 이미 탭 버튼 크기만큼 퍼져 있다 (사용자 요청, 메뉴처럼). 다 퍼진 크기는 알약 높이 × TAB_RIPPLE_K
            const pill = tab.closest<HTMLElement>(PRESS_PILL);
            const d = (pill ? pill.offsetHeight : tab.offsetHeight) * TAB_RIPPLE_K;
            const from = Math.min(1, Math.max(tab.offsetWidth, tab.offsetHeight) / d);
            this.pressRipple(tab, e, d, "lg-ripple-tab", true, from.toFixed(3));
          }
        }
      };
    // 누르고 있는 동안 누름 효과를 가장 커지고 하얀 자리에서 멈춰 두고, 뗄 때 이어서 돌아오게 한다 (사용자 요청: 버튼은 떼야 동작하는데
    // 효과는 누르는 순간 혼자 끝났다). 누름 효과(커졌다 하얘지는 것, 0.34~0.46 구간이 가장 큰 자리)와 그동안 호버 유리를 옅게 하는 것(0.2~0.55)을
    // 키프레임으로 알아보고, 진행이 0.4 를 지나면 멈춘다. 떼거나 취소되면(스크롤 시작 등) 다시 돌린다. 놓친 떼기에 대비해 5초 뒤에는 저절로 푼다
    let holding = false;
    let held: Animation[] = [];
    let slowed: Animation[] = [];
    let heldPlay: Animation[] = [];
    let holdRaf = 0;
    let holdTimer = 0;
    const hasOffsets = (a: Animation, x: number, y: number) => {
      const ef = a.effect as KeyframeEffect | null;
      const k = ef && typeof ef.getKeyframes === "function" ? ef.getKeyframes() : [];
      return k.some((f) => Math.abs((f.offset ?? -1) - x) < 0.001) && k.some((f) => Math.abs((f.offset ?? -1) - y) < 0.001);
    };
    const holdScan = () => {
      if (!holding) return;
      for (const a of doc.getAnimations()) {
        if (a.playState !== "running" || held.includes(a) || heldPlay.includes(a)) continue;
        // 가장 큰 자리(키프레임 구간)는 진행도(곡선을 거친 값) 기준이다. 시간 기준으로 멈추면 곡선 때문에 이미 그 자리를 지나 조금 줄어든 채 멈췄고,
        // 뗄 때 가장 큰 모습부터 다시 줄어들어 '살짝 커졌다 줄어드는' 단계가 생겼다 (사용자 지적, 측정: 알약 폭 74.8 → 72.9 에서 멈춤)
        // 메뉴 흰 빛: 가장 밝은 채로 다 나타난 자리(RIPPLE_HOLD)에서 멈추고, 떼면 남은 흐려짐을 이어 돈다 (사용자 요청)
        const tgt = (a.effect as KeyframeEffect | null)?.target;
        const menuRip = !!tgt && !!tgt.parentElement?.classList.contains("lg-ripple-menu");
        const span = menuRip ? [RIPPLE_HOLD, RIPPLE_HOLD] : hasOffsets(a, 0.34, 0.46) ? [0.34, 0.46] : hasOffsets(a, 0.2, 0.55) ? [0.2, 0.55] : null;
        if (!span || !a.effect) continue;
        const prog = () => Number(a.effect.getComputedTiming().progress) || 0;
        const p = prog();
        // 가장 큰 자리에 가까워지면 재생 속도를 차츰 늦춰 부드럽게 멈춘다 (사용자 요청: 최대치에서 뚝 멈췄다). 짧은 클릭은 이 구간 전에 떼어 그대로다
        if (p < span[0]) {
          if (p >= span[0] - HOLD_EASE_SPAN) {
            a.updatePlaybackRate(Math.max(0.15, (span[0] - p) / HOLD_EASE_SPAN));
            if (!slowed.includes(a)) slowed.push(a);
          }
          continue;
        }
        // 구간 한가운데 진행도가 되는 시각을 찾아 거기서 멈춘다 (한 프레임에 구간을 건너뛰었어도 되돌려 맞춘다)
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
      // 꾹 눌렀다 뗄 때는 남은 효과(가장 큰 자리를 지나 관성처럼 줄어드는 부분)를 이어 돌리지 않고, 멈춘 모습에서 원래대로 곧장 돌아오게 한다
      // (사용자 요청: 짧은 클릭의 관성은 그대로, 꾹 눌렀을 때만 뺀다)
      for (const a of held) {
        try {
          const ef = a.effect as KeyframeEffect | null;
          const target = ef && ef.target;
          if (!ef || !target || !target.isConnected) {
            a.cancel();
            continue;
          }
          const kf = ef.getKeyframes();
          const peak = kf.find((f) => Math.abs((f.offset ?? -1) - 0.34) < 0.001) || kf.find((f) => Math.abs((f.offset ?? -1) - 0.2) < 0.001);
          const from: Keyframe = {};
          if (peak) for (const [k, v] of Object.entries(peak)) if (!["offset", "computedOffset", "easing", "composite"].includes(k)) from[k] = v;
          a.cancel();
          target.animate([{ ...from, offset: 0 }], { duration: HOLD_RETURN_MS, easing: EASE.press, pseudoElement: ef.pseudoElement || undefined });
        } catch {
          // 이미 떨어진 요소의 애니메이션
        }
      }
      held = [];
      for (const a of heldPlay) {
        try {
          a.updatePlaybackRate(1);
          a.play();
        } catch {
          // 이미 떨어진 요소의 애니메이션
        }
      }
      heldPlay = [];
      // 늦추던 중에 뗀 것(가장 큰 자리 전)은 원래 속도로 이어 돈다
      for (const a of slowed) {
        try {
          if (a.playState !== "idle") a.updatePlaybackRate(1);
        } catch {
          // 이미 떨어진 요소의 애니메이션
        }
      }
      slowed = [];
    };
    this.registerDomEvent(doc, "pointerdown", (e) => {
      if (e.button !== 0) return;
      holdRelease();
      holding = true;
      holdRaf = win.requestAnimationFrame(holdScan);
      holdTimer = win.setTimeout(holdRelease, 5000);
    }, { capture: true });
    // 메뉴를 누르고 있는 동안 커서를 옮기면 흰 빛도 따라온다 (사용자 요청). 빛은 메뉴 판 기준 자리(left·top)에 그려진다
    const followMenu = (x: number, y: number) => {
      doc.querySelectorAll<HTMLElement>(".lg-ripple-menu > .lg-ripple-dot").forEach((dot) => {
        const host = dot.parentElement && dot.parentElement.parentElement;
        if (!host) return;
        const r = host.getBoundingClientRect();
        dot.style.left = `${x - r.left}px`;
        dot.style.top = `${y - r.top}px`;
      });
    };
    // 모바일: 손가락이 움직이면 브라우저가 메뉴 스크롤로 가져가 포인터가 취소(pointercancel)되고 포인터 이동도 끊긴다.
    // 메뉴 빛이 있는 동안은 취소로 놓지 않고 터치 이벤트로 따라가다 손을 뗄 때 놓는다 (사용자 요청: 모바일에서도 누른 채 옮기기)
    if (Platform.isMobile) {
      this.registerDomEvent(doc, "touchmove", (e: TouchEvent) => {
        if (holding && e.touches[0]) followMenu(e.touches[0].clientX, e.touches[0].clientY);
      }, { capture: true, passive: true });
      this.registerDomEvent(doc, "touchend", holdRelease, { capture: true, passive: true });
      this.registerDomEvent(doc, "touchcancel", holdRelease, { capture: true, passive: true });
    }
    this.registerDomEvent(doc, "pointermove", (e: PointerEvent) => {
      if (!holding) return;
      followMenu(e.clientX, e.clientY);
    }, { capture: true, passive: true });
    this.registerDomEvent(doc, "pointerup", holdRelease, { capture: true });
    this.registerDomEvent(doc, "pointercancel", (e: PointerEvent) => {
      if (Platform.isMobile && e.pointerType === "touch" && doc.querySelector(".lg-ripple-menu")) return;
      holdRelease();
    }, { capture: true });
    this.register(holdRelease);

    if (!Platform.isMobile) {
      this.registerDomEvent(doc, "pointerdown", pressFx, { capture: true });
    } else {
      // 모바일: 스크롤하려고 손가락을 대기만 해도 누름 효과가 나왔다 (검토 지적). 효과를 PRESS_DELAY_MS 늦게 시작하고,
      // 그 사이 손가락이 PRESS_SLOP px 넘게 움직이거나 터치가 취소(pointercancel, 스크롤 시작)되면 취소한다. 그 전에 떼면 뗄 때 바로 시작한다
      let pend: { e: PointerEvent; x: number; y: number; t: number } | null = null;
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

    // 칸반 목록 접기·펴기 (테마 Kanban 연동)
    this.registerDomEvent(
      doc,
      "click",
      (e) => {
        if (!isEl(e.target)) return;
        const col = (e.target as HTMLElement).closest<HTMLElement>(".kanban-plugin__lane-collapse");
        if (col) this.animateLaneCollapse(col);
      },
      { capture: true }
    );

    // 메뉴(··· · 보관함 전환 · 우클릭): 누른 곳에서 커지며 나타나고, 닫힐 때는 그 자리로 줄며 사라진다
    let lastPress: PressInfo | null = null;
    this.registerDomEvent(
      doc,
      "pointerdown",
      (e) => {
        lastPress = { x: e.clientX, y: e.clientY, t: win.performance.now(), target: e.target };
      },
      { capture: true, passive: true }
    );
    // 드롭다운(select.dropdown): 운영체제 목록 대신 Obsidian 메뉴로 열어 보관함 전환 메뉴처럼 드롭다운에서 넓어지게 한다 (사용자 요청).
    // 모바일(사용자 요청): 운영체제 고르기 화면은 손을 뗄 때(click) 뜨므로, 움직이지 않고 뗀 탭이면 touchend 를 막아 click 이 생기지 않게 하고
    // 그때 메뉴를 연다. 끌어서 스크롤한 것은 그대로 둔다. 휴대폰은 Obsidian 메뉴가 아래에서 올라오는 시트로 뜬다
    const openSelect = (sel: HTMLSelectElement) => {
      lastPress = { x: 0, y: 0, t: win.performance.now(), target: sel };
      this.openDropdownMenu(sel);
    };
    // 누를 때(mousedown)는 운영체제 목록만 막고, 메뉴는 뗀 뒤(click) 연다: 누를 때 열면 떼는 순간 메뉴 바깥 누름으로 보고 닫혔다 (사용자 지적).
    // 메뉴가 열린 채 드롭다운을 다시 누르면 그 누름에 메뉴가 닫히므로, 이어지는 click 에 다시 열지 않는다
    this.registerDomEvent(
      doc,
      "mousedown",
      (e) => {
        if (Platform.isMobile || e.button !== 0 || !isEl(e.target)) return;
        const sel = (e.target as HTMLElement).closest<HTMLSelectElement>("select.dropdown");
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
        if (Platform.isMobile || e.button !== 0 || !isEl(e.target)) return;
        const sel = (e.target as HTMLElement).closest<HTMLSelectElement>("select.dropdown");
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
    if (Platform.isMobile) {
      let touch: { sel: HTMLSelectElement; x: number; y: number } | null = null;
      this.registerDomEvent(
        doc,
        "touchstart",
        (e) => {
          const t = e.touches[0];
          const sel = isEl(e.target) && (e.target as HTMLElement).closest<HTMLSelectElement>("select.dropdown");
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
          if (!isEl(e.target) || (e.target as HTMLElement).closest<HTMLSelectElement>("select.dropdown") !== p.sel) return;
          e.preventDefault();
          if (!p.sel.classList.contains("has-active-menu")) openSelect(p.sel);
        },
        { capture: true }
      );
      // 그래도 click 이 오면(마우스·펜 등) 운영체제 화면 대신 메뉴로
      this.registerDomEvent(
        doc,
        "click",
        (e) => {
          const sel = isEl(e.target) && (e.target as HTMLElement).closest<HTMLSelectElement>("select.dropdown");
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
        if (Platform.isMobile || !isEl(e.target) || !e.target.matches("select.dropdown")) return;
        const sel = e.target as HTMLSelectElement;
        if (sel.disabled || sel.classList.contains("has-active-menu")) return;
        if (e.key === " " || e.key === "Enter" || (e.altKey && (e.key === "ArrowDown" || e.key === "ArrowUp"))) {
          e.preventDefault();
          openSelect(sel);
        }
      },
      { capture: true }
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
    const isMenu = (n: Node): n is HTMLElement => isEl(n) && n.classList.contains("menu") && !n.classList.contains("lg-menu-ghost");
    const menuObs = new win.MutationObserver((recs) => {
      for (const r of recs) {
        for (const n of r.addedNodes) {
          // 휴대폰 메뉴는 아래에서 올라오는 시트라 데스크톱 팝업 애니메이션을 걸지 않는다 (태블릿은 팝업이라 건다)
          if (isMenu(n)) {
            // 모바일: 길게 누르기로 부른 메뉴는 Obsidian 이 열린 메뉴를 닫지 않아(데스크톱은 우클릭·누름이 닫는다) 겹쳐 쌓였다.
            // 방금 누른 곳이 메뉴 안이 아니면(하위 메뉴가 아니면) 새 메뉴 자리를 누른 것처럼 알려 다른 메뉴를 닫는다.
            // 새 메뉴는 아직 준비 전(_loaded 전)이라 이 알림에 닫히지 않는다
            const pt = lastPress && lastPress.target;
            if (Platform.isMobile && !(isEl(pt) && pt.closest<HTMLElement>(".menu")) &&
              els(doc.querySelectorAll<HTMLElement>(".menu")).some((m) => m !== n && !m.classList.contains("lg-menu-ghost"))) {
              this.tellMenus(n, "click");
            }
            if (!Platform.isPhone) this.setupMenu(n, lastPress);
          }
          else if (isEl(n) && n.classList.contains("mod-search-suggestion")) this.attachSearchSuggest(n, doc);
          else if (isEl(n) && n.classList.contains("suggestion-container")) this.attachWebSuggest(n, doc);
          else if (isEl(n) && n.classList.contains("modal-container")) this.modalRefract(doc);
        }
        for (const n of r.removedNodes) if (isMenu(n) && !Platform.isPhone) this.closeMenu(n, doc);
      }
      if (Platform.isPhone) phonePause();
    });
    menuObs.observe(doc.body, { childList: true });
    this.observers.push(menuObs);

    // 휴대폰: 메뉴 시트가 열려 있거나(올라오고 내려가는 동안 포함) 서랍이 움직이는 동안(열고 닫는 전환, 손가락으로 끄는 동안) 굴절을 멈춘다 (Refractor.setPaused).
    // 시트·서랍이 움직이면 그 위아래에 떠 있는 유리(뷰 헤더 버튼·하단 막대)의 뒤가 바뀌어 굴절 필터가 매 프레임 다시 계산돼 끊겼다
    // (사용자 지적, 휴대폰 녹화 측정: 서랍 열 때 프레임 간격 평균 약 21~27ms → 굴절을 끄면 약 12~16ms).
    // 서랍이 움직이는 동안만 Obsidian 이 서랍에 인라인 transform 을 둔다(다 열리면 걷는다). 열려 있는 동안 내내 멈추면 서랍 안 유리(보기 전환 알약)의 굴절이 늘 빠졌다
    const phonePause = () => {
      const menu = els(doc.querySelectorAll<HTMLElement>(".menu")).some((m) => !m.classList.contains("lg-menu-ghost"));
      const drawer = els(doc.querySelectorAll<HTMLElement>(".workspace-drawer")).some((d) => d.style.display !== "none" && !!d.style.transform);
      this.refractor.setPaused(menu || drawer);
    };
    // 서랍은 화면 배치가 준비된 뒤에 생긴다: 플러그인이 켜질 때(attachDoc)는 아직 없어 감시가 하나도 붙지 않았다
    // (검토 측정: 서랍에서는 멈춤이 안 걸리고, 메뉴를 한 번 연 뒤로는 굴절이 꺼진 채 남았다). 배치가 준비되거나 바뀔 때마다
    // 새 서랍에 감시를 붙이고 상태를 다시 판정한다
    if (Platform.isPhone && doc === document) {
      const drawerObs = new win.MutationObserver(phonePause);
      const seen = new WeakSet<HTMLElement>();
      const hookDrawers = () => {
        els(doc.querySelectorAll<HTMLElement>(".workspace-drawer")).forEach((d) => {
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

    // 편집창 탭을 마우스로 닫으면 Obsidian 은 커서가 탭 줄을 벗어날 때까지 탭 폭을 고정해 둔다(lockTabWidths).
    // 사용자 요청으로 닫은 뒤 바로 풀리게, 닫는 전환(240ms)이 끝나면 탭 줄에 mouseleave 를 보내 Obsidian 이 스스로 풀게 한다
    const unlockTabs = (e: MouseEvent) => {
      if (!isEl(e.target)) return;
      const close = (e.target as HTMLElement).closest<HTMLElement>(".mod-root .workspace-tab-header-inner-close-button");
      const middle = e.type === "auxclick" && e.button === 1 && (e.target as HTMLElement).closest<HTMLElement>(".mod-root .workspace-tab-header");
      if (!close && !middle) return;
      const bar = (close || middle).closest<HTMLElement>(".workspace-tab-header-container");
      if (!bar) return;
      // 닫는 탭이 줄어드는 동안 남은 탭이 같이 넓어지게 바로 푼다 (Obsidian 이 고정한 직후). 닫는 전환이 끝난 뒤 풀면
      // 닫힌 탭 폭만큼 탭 줄이 줄었다가 다시 늘어났다
      win.setTimeout(() => bar.isConnected && bar.dispatchEvent(new win.MouseEvent("mouseleave")), 0);
    };
    // 캡처 단계로 듣는다: Obsidian 의 닫기 버튼 처리가 이벤트 전파를 막으면 문서까지 올라오지 않는다
    this.registerDomEvent(doc, "click", unlockTabs, { capture: true, passive: true });
    this.registerDomEvent(doc, "auxclick", unlockTabs, { capture: true, passive: true });

    // 패널 머리 줄 검색창(개요·북마크 등)을 켜고 끌 때 (사용자 요청). 버튼을 누른 때만 움직인다(패널 탭 전환·앱 시작 때는 그대로).
    // 움직임은 편집창·패널 버튼이 나타나고 사라지는 것과 같은 결: 켜면 0.4배에서 살짝 넘치며 커지고(EASE.pop), 끄면 0.4배로 줄며 흐려진다(EASE.exit).
    // Obsidian 은 검색창을 바로 보이고 숨기므로, 그 아래 목록은 바뀌기 전 자리에서 새 자리로 미끄러지게 하고(FLIP),
    // 끌 때는 누르기 전(캡처 단계)에 검색창을 복사해 두었다가 그 복사본이 제자리에서 사라진다.
    // 바뀐 직후(그리기 전) 재려고 검색창의 style 변화를 MutationObserver 로 기다린다 (머리 줄 판정 lg-bare-head 가 먼저 돈다)
    this.registerDomEvent(
      doc,
      "click",
      (e) => {
        if (this.unloaded || doc.body.classList.contains("is-mobile") || !isEl(e.target)) return;
        const btn = (e.target as HTMLElement).closest<HTMLElement>(".nav-action-button");
        const leafEl = btn && btn.closest<HTMLElement>(".workspace-split:not(.mod-root) .workspace-leaf-content");
        const sc = leafEl && leafEl.querySelector<HTMLElement>(":scope > .nav-header > .search-input-container");
        if (!sc) return;
        const head = sc.parentElement;
        // 넓게 모드의 버튼은 원래 버튼을 대신 누르기 직전에 머리 줄을 보이지 않게 띄워 둔다(.lg-nav-proxy, clickOriginal).
        // 그 상태로 재면 검색창·목록 자리가 틀리므로(사라질 때 엉뚱한 곳으로 갔다, 사용자 지적) 잠시 풀고 잰다
        const proxy = head.classList.contains("lg-nav-proxy");
        if (proxy) head.classList.remove("lg-nav-proxy");
        const shown = !!sc.getClientRects().length;
        const below = this.headBelow(head);
        const lr = leafEl.getBoundingClientRect();
        const r = sc.getBoundingClientRect();
        let ghost: HTMLElement | null = null;
        if (shown) {
          ghost = sc.cloneNode(true) as HTMLElement;
          const input = sc.querySelector("input");
          const gInput = ghost.querySelector("input");
          if (input && gInput) gInput.value = input.value;
        }
        if (proxy) head.classList.add("lg-nav-proxy");
        const run = () => {
          if (this.unloaded || !leafEl.isConnected) return;
          const tabsEl = leafEl.closest<HTMLElement>(".workspace-tabs");
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
              { transform: "scale(0.4)", opacity: 0 },
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

    // 그래프 설정 창 열기·닫기: Obsidian 이 바꾸기 전에(캡처 단계) 지금 모습을 떠 둔다.
    // 창이 퍼져 나오는 애니메이션은 테마(CSS)가 맡는다
    this.registerDomEvent(
      doc,
      "click",
      (e) => {
        if (!isEl(e.target)) return;
        const close = (e.target as HTMLElement).closest<HTMLElement>(".graph-controls-button.mod-close");
        if (close) return this.graphClose(close.closest<HTMLElement>(".graph-controls"));
        const open = (e.target as HTMLElement).closest<HTMLElement>(".graph-controls.is-close .graph-controls-button.mod-open");
        if (open) this.graphOpen(open.closest<HTMLElement>(".graph-controls"));
      },
      { capture: true }
    );

    // 토글: Obsidian 토글은 클릭 시 change, 키보드(스페이스·엔터) 시 keydown 으로 바뀐다.
    // 둘 다 문서까지 올라왔을 때는 이미 켜짐 상태가 바뀐 뒤라, 그 자리에서 렌즈 애니메이션을 건다.
    // 페이지를 열 때 값이 채워지는 경우는 이벤트가 없어 애니메이션도 없다
    const onToggle = (c: HTMLElement | null) => {
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
      if (isEl(e.target)) onToggle((e.target as HTMLElement).closest<HTMLElement>(".checkbox-container"));
    });
    // 안에 체크박스가 없는 토글(Kanban 목록 추가 창·보드 설정 등): 누르면 표시(is-enabled)만 바꿔 change 가 없다.
    // 그래서 꾹 누를 때(테마 :active)만 렌즈가 보였다 (사용자 지적). 누른 뒤 표시가 바뀌는 것을 잠깐(0.5초) 지켜보다 그때 애니메이션을 건다
    this.registerDomEvent(
      doc,
      "click",
      (e) => {
        if (!isEl(e.target)) return;
        const c = (e.target as HTMLElement).closest<HTMLElement>(".checkbox-container");
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

    // 슬라이더: CSS 는 값을 읽지 못하므로 채움 비율(--lg-sl-n, 0~1)을 넣어 준다.
    // 끌 때는 input, 새로 그려질 때는 테마가 거는 짧은 애니메이션(lg-sl-born)의 시작으로 안다
    const syncSlider = (el: HTMLElement) => {
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
        const tg = el.closest<HTMLElement>(".checkbox-container");
        if (tg && this.refractOn() && !tg.style.getPropertyValue("--lg-tg-refract")) {
          const cs = win.getComputedStyle(tg);
          const KX = parseFloat(cs.getPropertyValue("--lg-tg-kx")) || 1;
          const KY = parseFloat(cs.getPropertyValue("--lg-tg-ky")) || 1;
          const pad = tgPad(cs, win);
          const tw = parseFloat(cs.getPropertyValue("--lg-tg-thumb")) || 32;
          const th = tg.getBoundingClientRect().height - pad * 2;
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
    this.registerDomEvent(doc, "input", (e) => syncSlider(e.target as HTMLElement), { capture: true, passive: true });
    this.registerDomEvent(doc, "change", (e) => syncSlider(e.target as HTMLElement), { capture: true, passive: true });
    this.registerDomEvent(doc, "animationstart", (e) => {
      if (e.animationName === "lg-sl-born") syncSlider(e.target as HTMLElement);
    });
    for (const el of doc.querySelectorAll<HTMLElement>('input[type="range"]')) syncSlider(el);

    // 패널 탭을 누르면 Obsidian 이 고른 탭을 탭 줄 맨 앞으로 스크롤하고, ··· 가 접히거나 펴지며 알약 폭이 바뀌어도
    // 스크롤이 밀린다. 누른 탭이 다 보이던 중이면 화면에서 그 자리에 그대로 두고,
    // 반쯤 가려져 있었으면 다 보이는 만큼만 스크롤한다. ··· 전환이 끝날 때까지(0.4초) 매 프레임 맞춘다
    this.registerDomEvent(
      doc,
      "pointerdown",
      (e) => {
        if (e.button !== 0 || !isEl(e.target)) return;
        const tab = (e.target as HTMLElement).closest<HTMLElement>(".mod-left-split .workspace-tab-header, .mod-right-split .workspace-tab-header");
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
    let taskMo: MutationObserver | null = null;
    this.registerDomEvent(
      doc,
      "click",
      (e) => {
        const cb = isEl(e.target) && (e.target as HTMLElement).closest<HTMLInputElement>("input.task-list-item-checkbox");
        if (!cb) return;
        // 앞 클릭의 감시는 끝낸다: 1.6초 안에 다시 누르면 앞 클릭의 감시가 문서 변화를 보고 앞 상태(끄기) 애니메이션을 다시 걸어
        // 새 애니메이션을 덮었다 (사용자 지적: 체크된 채 호버해 끄고 그대로 다시 켜면 애니메이션이 안 나왔다. 편집 모드 콜아웃 밖)
        if (taskMo) taskMo.disconnect();
        const x = e.clientX;
        const y = e.clientY;
        const t0 = win.performance.now();
        let cur = cb;
        cb.lgTaskDone = false;
        // 누름: 작아졌다가 되돌아온다. 편집기가 체크박스를 바꿔 끼우면 새것에서 이어서 (아래 step).
        // transform 으로 걸어 CSS 의 커짐(scale)·끌림(translate)과 곱해진다
        const press = (el: HTMLElement, at: number) => {
          const p = el.animate([{ transform: "scale(1)" }, { transform: "scale(0.82)", offset: 0.35 }, { transform: "scale(1)" }], { duration: TASK_PRESS_MS, easing: "cubic-bezier(0.3, 0, 0.3, 1)" });
          if (at > 0) p.currentTime = at;
        };
        press(cb, 0);
        // 마우스로 눌렀으면 커서가 위에 있다 (편집기가 체크박스를 새로 그려 바꾸면 새것은 커서가 움직이기 전까지 :hover 가 아니다)
        const hov = e.detail > 0 && (!e.pointerType || e.pointerType === "mouse");
        // 바뀔 상태는 누른 순간(클릭 처리 앞)의 값으로 정한다. 편집 모드 콜아웃 등은 Obsidian 이 클릭을 막아 체크박스를 원래대로 되돌리고
        // 문서를 고쳐 다시 그리는데, 다음 프레임에 체크 상태를 읽으면 되돌려진 값이라 끌 때 켜는 애니메이션이 나왔다 (사용자 지적)
        const want = cb.checked;
        // 끌 때는 누른 순간부터 호버 유리를 숨긴다 (애니메이션은 다음 프레임에 시작해, 그 사이 호버가 먼저 나타났다)
        if (!want && hov) cb.classList.add("lg-task-hold");
        // 눌린 체크박스에서 숨김을 반드시 걷어 낸다: 편집기·읽기 보기가 체크박스를 바꿔 끼우면 애니메이션은 새것에서 돌고 이것은 숨긴 채 남는데,
        // 같은 것이 다시 쓰이면(콜아웃 등) 그 뒤로 호버 유리가 영영 안 보였다 (사용자 지적, 원인은 추정)
        if (!want && hov) win.setTimeout(() => cb.classList.remove("lg-task-hold"), 600);
        // 바꿔 끼워진 체크박스 찾기: 문서가 바뀌는 즉시(MutationObserver, 그리는 것보다 먼저) 찾는다.
        // 프레임으로만 찾으면 새것이 아무 효과 없는 모습으로 한 번 그려진 뒤에 애니메이션이 붙어, 읽기 모드에서 끌 때
        // 링이 사라졌다 다시 나타나 두 번 재생되는 것처럼 보였다 (사용자 영상). 편집 모드 콜아웃은 한참 뒤에 다시 그려지기도 해
        // 최대 1.6초 지켜본다. 0.6초가 지난 뒤 나타난 것은 애니메이션 없이 호버 모양만 붙인다.
        // 예전엔 1.5초 동안 매 프레임도 확인했는데, 문서 감시는 문서가 바뀔 때만 깨어나므로 그것만 둔다 (사용자 요청: 더 가볍게).
        // 누른 것의 애니메이션은 다음 프레임에 한 번 시작하고, 새것을 처리하면 감시를 바로 끝낸다
        const step = () => {
          const elapsed = win.performance.now() - t0;
          if (!cur.isConnected) {
            const hit = doc.elementFromPoint(x, y);
            const next = hit && hit.closest && hit.closest<HTMLInputElement>("input.task-list-item-checkbox");
            if (next) {
              cur = next;
              if (elapsed < TASK_PRESS_MS) press(cur, elapsed);
            }
          }
          // 누른 것은 되돌려졌어도 바뀔 상태로 재생하고, 새로 그려진 것은 바뀐 상태로 그려졌을 때만 이어서 재생한다
          // (아직 예전 상태로 그려진 것이면 다음 것을 기다린다)
          if (cur.isConnected && !cur.lgTaskDone && (cur === cb || cur.checked === want)) {
            cur.lgTaskDone = true;
            if (cur !== cb) mo.disconnect();
            if (cur === cb || elapsed < 600) this.animateTask(cur, want, elapsed, hov);
            // 새로 그려진 체크박스는 커서가 위에 있어도 마우스가 움직이기 전까지 :hover 가 아니라, 끈 뒤 한동안 아무것도 없다가
            // 호버 유리가 나타났다 (사용자 지적). 마우스가 움직일 때까지 호버 모양을 붙여 둔다 (CSS: .lg-task-hov)
            if (cur !== cb && hov) {
              const el = cur;
              el.classList.add("lg-task-hov");
              const off = () => {
                el.classList.remove("lg-task-hov");
                doc.removeEventListener("pointermove", off, true);
              };
              doc.addEventListener("pointermove", off, true);
              win.setTimeout(off, 3000);
            }
          }
        };
        const mo = new win.MutationObserver(step);
        taskMo = mo;
        // 문서 전체 대신 그 체크박스가 든 보기 칸만 본다 (검토 지적). 칸 밖(칸반 끌기 등)이면 문서 전체
        mo.observe(cb.closest<HTMLElement>(".workspace-leaf-content") || doc.body, { childList: true, subtree: true });
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

    // 별도 창: 창이나 왼쪽 요소의 크기가 바뀔 때만 창 제목 위치를 다시 잰다
    if (doc !== document) {
      const ro = new win.ResizeObserver(() => this.placeTitle(doc));
      ro.observe(doc.body);
      const left = doc.querySelector<HTMLElement>(".mod-community-modal .community-modal-search, .modal.mod-settings .vertical-tab-header");
      if (left) ro.observe(left);
      this.register(() => ro.disconnect());
    }
  },
};