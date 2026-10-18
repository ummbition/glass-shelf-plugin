import { Platform } from "obsidian";
import { els, isEl } from "./util";
import { BASES_MENU_BTN } from "./constants";
import type { GlassShelfPlugin } from "./host";
import type { PressInfo } from "./internal";

export const eventsMenusMethods = {
  // 메뉴·드롭다운·팝오버: 누른 자리 기록, 드롭다운을 Obsidian 메뉴로, 새 메뉴 준비
  attachMenuEvents(this: GlassShelfPlugin, doc: Document, win: typeof window) {
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
    // 컴팩트 모드(설정)를 켠 기기에서는 드롭다운도 다른 메뉴처럼 누른 자리에 열고 그 자리에서 커진다 (사용자 요청).
    // 누른 대상을 드롭다운의 부모로 두면 setupMenu 가 드롭다운에서 넓어지는 효과(morphMenu) 대신 보통 메뉴로 다룬다
    const openSelect = (sel: HTMLSelectElement) => {
      const prev = lastPress;
      if (this.reduceMotion() && prev && prev.x + prev.y > 0 && win.performance.now() - prev.t < 3000) {
        lastPress = { x: prev.x, y: prev.y, t: win.performance.now(), target: sel.parentElement || doc.body };
        this.openDropdownMenu(sel, { x: prev.x, y: prev.y });
        return;
      }
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
    // 태블릿: 메뉴가 열린 채 메뉴 밖이 스크롤되면 메뉴를 닫는다 (사용자 요청). 메뉴 안 스크롤(긴 메뉴)은 그대로.
    // 닫기는 메뉴 바깥을 누른 것처럼 창에 알린다 (tellMenus)
    if (Platform.isTablet) {
      this.registerDomEvent(
        doc,
        "scroll",
        (e) => {
          if (!doc.querySelector("body > .menu:not(.lg-menu-ghost)")) return;
          if (isEl(e.target) && e.target.closest(".menu")) return;
          this.tellMenus(doc.body, "mousedown");
        },
        { capture: true, passive: true }
      );
    }
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
    // 전용 버튼(Bases 툴바의 메뉴 버튼, Kanban 보드 버튼 줄에서 메뉴를 여는 버튼)은 우클릭으로도 그 메뉴를 연다 (사용자 요청).
    // 위에서 누른 기록을 이 버튼으로 남겨 두었으므로 메뉴는 왼쪽 클릭과 같이 버튼에서 넓어진다
    if (!Platform.isPhone) {
      this.registerDomEvent(
        doc,
        "contextmenu",
        (e) => {
          if (!isEl(e.target)) return;
          const btn = (e.target as HTMLElement).closest<HTMLElement>(`${BASES_MENU_BTN}, .bases-toolbar-new-item-menu > .text-icon-button, .workspace-leaf-content[data-type="kanban"] > .view-header .view-actions .clickable-icon`);
          if (!btn || (btn.matches(".view-actions .clickable-icon") && !this.opensMenu(btn))) return;
          e.preventDefault();
          e.stopPropagation();
          btn.click();
        },
        { capture: true }
      );
    }
    // 링크 미리보기 팝오버가 가리킬 링크를 기억해 둔다 (Obsidian 은 미리보기 창에 어느 링크에서 열렸는지 남기지 않는다)
    this.registerDomEvent(
      doc,
      "mouseover",
      (e) => {
        const t = e.target;
        if (!isEl(t)) return;
        const a = t.closest<HTMLElement>("a.internal-link, .internal-link, a.footnote-link, .footnote-link, .cm-hmd-internal-link, .cm-footref, a[data-href]");
        if (a) this.lastHoverLink = { el: a, t: win.performance.now() };
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
          // 링크 미리보기: 마우스를 올린 링크를 가리키는 팝오버 (사용자 요청). 휴대폰은 길게 눌러 여는 시트라 뺀다
          else if (isEl(n) && n.matches(".popover.hover-popover") && !Platform.isPhone) {
            const h = this.lastHoverLink;
            if (h && h.el.isConnected && win.performance.now() - h.t < 4000) this.popArrow(n, h.el);
          }
          else if (isEl(n) && n.classList.contains("mod-search-suggestion")) this.attachSearchSuggest(n, doc);
          else if (isEl(n) && n.classList.contains("suggestion-container")) this.attachWebSuggest(n, doc);
          else if (isEl(n) && n.classList.contains("modal-container")) this.modalRefract(doc);
          // 칸반 날짜 고르기: 마지막으로 누른 카드 ⋮ 버튼(또는 날짜)을 가리키는 팝오버 (사용자 요청). 보이는 판은 안의 달력.
          // 칸반은 창을 먼저 넣고 클래스를 나중에 달아, 다음 그림에서 알아본다 (다른 갈래와 따로 본다)
          const k = this.lastKbAnchor;
          if (isEl(n) && !Platform.isPhone && k && win.performance.now() - k.t < 8000) {
            win.requestAnimationFrame(() => {
              const cal = n.matches(".kanban-plugin__date-picker") ? n.querySelector<HTMLElement>(".flatpickr-calendar") : null;
              if (cal && k.el.isConnected && !cal.classList.contains("lg-menu-arrow")) this.popArrow(cal, k.el);
            });
          }
        }
        for (const n of r.removedNodes) if (isMenu(n) && !Platform.isPhone) this.closeMenu(n, doc);
      }
      // 메뉴가 열려 있는지 (테마: 그동안 창 끌기 영역을 끈다. :has() 대신)
      doc.body.classList.toggle("lg-menu-open", !!doc.querySelector("body > .menu:not(.lg-menu-ghost)"));
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
  },

};
