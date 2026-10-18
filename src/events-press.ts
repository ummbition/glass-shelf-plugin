import { Platform } from "obsidian";
import { isEl } from "./util";
import { PRESS_POP, PRESS_ABORT_RATE, HOLD_RETURN_MS, HOLD_EASE_SPAN, RIPPLE_HOLD, PRESS_SLOP, EASE, PANEL_TOGGLES, MENU_RIPPLE_FROM, TAB_RIPPLE_K, PRESS_RIPPLE, PRESS_PILL, PRESS_SCALE } from "./constants";
import type { GlassShelfPlugin } from "./host";

export const eventsPressMethods = {
  // 누름 효과와 꾹 누름 멈춤
  attachPressFx(this: GlassShelfPlugin, doc: Document, win: typeof window) {
    // 클릭 효과 (누를 때만)
    const pressFx =
      (e: PointerEvent) => {
        if (e.button !== 0 || !isEl(e.target)) return;
        // 컴팩트 모드(설정)를 켠 기기에서는 알약 버튼 누름 효과를 줄인다 (사용자 요청: 클릭·터치로 나누던 것을 설정으로)
        this.pressClick = this.reduceMotion();
        // 메뉴 항목: 메뉴 판 안에서 누른 자리부터 알약 안 버튼과 같은 흰 빛이 퍼진다 (사용자 요청).
        // 누르는 순간 이미 반쯤 퍼져 있고(MENU_RIPPLE_FROM), 다 퍼지면 메뉴 판 전체를 덮는다(누른 자리에서 가장 먼 모서리까지)
        const menuItem = (e.target as HTMLElement).closest<HTMLElement>(".menu .menu-item:not(.is-disabled):not(.is-label)");
        if (menuItem) {
          // 컴팩트 모드면 메뉴 항목을 눌러도 빛이 퍼지지 않는다 (사용자 요청)
          if (this.pressClick) return;
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
        // 컴팩트 모드면 펼쳐지는 검색창은 커지고 빛나는 효과 없이 펼쳐지기만 한다 (사용자 요청)
        if (kbSearch) return this.pressClick ? undefined : this.pressKbSearch(kbSearch);
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
    // 이번 누름 전부터 돌아가던 효과(앞 누름의 줄어드는 부분)는 멈추지 않는다.
    // 예전엔 앞 효과가 가장 큰 자리를 지났다고 보고 그 자리로 되돌려 멈춰, 효과가 끝나기 전에 다시 누르면 커지는 과정 없이 뚝 커졌다 (사용자 지적, 모바일).
    // 시작 시각으로 가르면 안 된다: 가장 큰 자리 앞에서 재생 속도를 늦추면 시작 시각이 앞당겨져 이번 효과도 앞 효과로 보였다 (측정)
    let before = new WeakSet<Animation>();
    // 꾹 누름 멈춤 구간: 누름 효과(0.34~0.46)와 호버 유리 옅게(0.2~0.55)는 키프레임으로, 그 밖의 효과는 id(lg-hold-<진행도>)로 알아본다
    const holdSpan = (a: Animation): [number, number] | null => {
      if (a.id.startsWith("lg-hold-")) {
        const v = Number(a.id.slice(8));
        return Number.isFinite(v) ? [v, v] : null;
      }
      return hasOffsets(a, 0.34, 0.46) ? [0.34, 0.46] : hasOffsets(a, 0.2, 0.55) ? [0.2, 0.55] : null;
    };
    const heldPeak = new WeakMap<Animation, number>();
    const hasOffsets = (a: Animation, x: number, y: number) => {
      const ef = a.effect as KeyframeEffect | null;
      const k = ef && typeof ef.getKeyframes === "function" ? ef.getKeyframes() : [];
      return k.some((f) => Math.abs((f.offset ?? -1) - x) < 0.001) && k.some((f) => Math.abs((f.offset ?? -1) - y) < 0.001);
    };
    const holdScan = () => {
      if (!holding) return;
      for (const a of doc.getAnimations()) {
        if (a.playState !== "running" || held.includes(a) || heldPlay.includes(a)) continue;
        if (before.has(a)) continue;
        // 가장 큰 자리(키프레임 구간)는 진행도(곡선을 거친 값) 기준이다. 시간 기준으로 멈추면 곡선 때문에 이미 그 자리를 지나 조금 줄어든 채 멈췄고,
        // 뗄 때 가장 큰 모습부터 다시 줄어들어 '살짝 커졌다 줄어드는' 단계가 생겼다 (사용자 지적, 측정: 알약 폭 74.8 → 72.9 에서 멈춤)
        // 메뉴 흰 빛: 가장 밝은 채로 다 나타난 자리(RIPPLE_HOLD)에서 멈추고, 떼면 남은 흐려짐을 이어 돈다 (사용자 요청)
        const tgt = (a.effect as KeyframeEffect | null)?.target;
        const menuRip = !!tgt && !!tgt.parentElement?.classList.contains("lg-ripple-menu");
        const span = menuRip ? [RIPPLE_HOLD, RIPPLE_HOLD] : holdSpan(a);
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
        heldPeak.set(a, span[0]);
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
          const at = heldPeak.get(a) ?? 0.34;
          const peak = kf.find((f) => Math.abs((f.offset ?? -1) - at) < 0.001);
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
      before = new WeakSet(doc.getAnimations());
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
      // 모바일: 누르는 순간 컴퓨터처럼 바로 효과를 시작한다 (사용자 요청: 예전엔 스크롤과 구별하려고 90ms 늦게 시작해 누르고 잠깐 있어야 커졌다).
      // 스크롤하려고 손가락을 댄 것이면(PRESS_SLOP px 넘게 움직이거나 터치 취소) 이 누름으로 시작한 효과를 지금 모습에서 거꾸로 되감아 지운다.
      // 메뉴 흰 빛은 누른 채 옮기면 따라오므로 되감지 않는다
      let pend: { x: number; y: number; fresh: Animation[] } | null = null;
      const abort = () => {
        if (!pend || doc.querySelector(".lg-ripple-menu")) return;
        const { fresh } = pend;
        pend = null;
        holdRelease();
        for (const a of fresh) {
          try {
            if (a.playState !== "running" && a.playState !== "paused") continue;
            a.updatePlaybackRate(-PRESS_ABORT_RATE);
            a.play();
          } catch {
            // 이미 떨어진 요소의 애니메이션
          }
        }
      };
      this.registerDomEvent(doc, "pointerdown", (e) => {
        pend = null;
        if (e.button !== 0 || !isEl(e.target)) return;
        const prior = new Set(doc.getAnimations());
        pressFx(e);
        pend = { x: e.clientX, y: e.clientY, fresh: doc.getAnimations().filter((a) => !prior.has(a)) };
      }, { capture: true, passive: true });
      this.registerDomEvent(doc, "pointermove", (e) => {
        if (pend && Math.hypot(e.clientX - pend.x, e.clientY - pend.y) > PRESS_SLOP) abort();
      }, { capture: true, passive: true });
      this.registerDomEvent(doc, "pointercancel", abort, { capture: true, passive: true });
      this.registerDomEvent(doc, "pointerup", () => (pend = null), { capture: true, passive: true });
    }
  },

};
