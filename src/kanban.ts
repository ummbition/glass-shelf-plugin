import type { ItemView } from "obsidian";
import { INJECTED, els, isEl, newEl } from "./util";
import { NAV_SEARCH_MAX, NAV_SEARCH_MIN, EASE, RIPPLE_K, RIPPLE_HOLD, MINI_EASE, KB_GROUP_ICONS, KB_LANE_MS } from "./constants";
import { PRESS_WHITE, PRESS_IMG } from "./refract";
import type { GlassShelfPlugin } from "./host";

export const kanbanMethods = {
  // ---------- Kanban 연동 (테마 Kanban 절과 짝) ----------
  setupKanban(this: GlassShelfPlugin, view: ItemView) {
    const root = view && view.containerEl;
    if (!root || !root.isConnected) return;
    const acts = root.querySelector<HTMLElement>(":scope > .view-header .view-actions");
    if (acts) {
      this.groupKanbanActions(acts);
      // Kanban 은 보드 설정이 바뀌면 버튼을 지우고 다시 단다
      if (!this.kbWatched.has(acts)) {
        const win = acts.ownerDocument.defaultView || window;
        const obs = new win.MutationObserver(() => this.groupKanbanActions(acts));
        obs.observe(acts, { childList: true });
        this.kbWatched.add(acts);
        this.observers.push(obs);
      }
    }
    // Kanban 은 파일을 읽은 뒤 보드를 그리고, 다시 읽으면 보드를 새로 그린다. 화면 배치가 바뀔 때(refresh)만 붙이면 그보다 늦게 그려진
    // 보드를 놓치므로, 보기 안 바로 아래 자식이 바뀌면 다시 붙인다 (예전엔 0.5초마다 다시 붙였다, 사용자 요청으로 바꿈)
    const content = view.contentEl;
    if (content && !this.kbWatched.has(content)) {
      const win = content.ownerDocument.defaultView || window;
      const watch = new win.MutationObserver(() => this.setupKanban(view));
      watch.observe(content, { childList: true });
      this.kbWatched.add(content);
      this.observers.push(watch);
    }
    const board = root.querySelector<HTMLElement>(".kanban-plugin");
    if (board && !this.kbWatched.has(board)) {
      const win = board.ownerDocument.defaultView || window;
      const obs = new win.MutationObserver(() => this.kanbanSearch(root, board));
      obs.observe(board, { childList: true });
      this.kbWatched.add(board);
      this.observers.push(obs);
      this.kanbanSearch(root, board);
      const formObs = new win.MutationObserver((ms) => {
        this.kanbanFormBack(board);
        this.kanbanLaneForm(root, ms);
      });
      formObs.observe(board, { childList: true, subtree: true });
      this.observers.push(formObs);
    }
  },

  // 세 버튼을 알약(.lg-kb-group) 하나로 묶는다. 버튼은 원래 것을 그대로 옮겨 Kanban 동작이 그대로다.
  // 이미 묶여 있으면 아무것도 옮기지 않는다 (옮기면 지켜보기가 다시 불려 끝없이 돈다)
  groupKanbanActions(this: GlassShelfPlugin, acts: HTMLElement) {
    const all = els(acts.querySelectorAll<HTMLElement>(".view-action"));
    const btns = KB_GROUP_ICONS.map((ic) => all.find((b) => b.querySelector<HTMLElement>("svg." + ic))).filter(Boolean);
    let g = acts.querySelector<HTMLElement>(":scope > .lg-kb-group");
    if (!btns.length) {
      if (g) g.remove();
    } else {
      if (!g) g = createDiv({ cls: ["lg-kb-group", INJECTED] });
      if (btns[0].parentElement === acts) acts.insertBefore(g, btns[0]);
      else if (g.parentElement !== acts) acts.prepend(g);
      const kids = els(g.children);
      if (kids.length !== btns.length || kids.some((c, i) => c !== btns[i])) btns.forEach((b) => g.appendChild(b));
    }
    const search = all.find((b) => b.querySelector<HTMLElement>("svg.lucide-search"));
    if (search) search.classList.add("lg-kb-search-btn");
  },

  // 검색: 검색 버튼이 왼쪽으로 넓어지며 알약이 되고, 그 안에 Kanban 검색 칸이 놓인다 (사용자 요청).
  // 검색 칸은 Kanban 이 보드 맨 위에 그리는 것을 그대로 쓰고, 자리만 넓어진 버튼 위로 옮긴다(테마: .lg-kb-searching).
  // 버튼은 오른쪽 끝이 고정된 채 넓어지므로(뒤의 버튼들은 제자리) 오른쪽 끝·위 끝만 알려 준다
  kanbanSearch(this: GlassShelfPlugin, root: HTMLElement, board: HTMLElement) {
    const sw = board.querySelector<HTMLElement>(":scope > .kanban-plugin__search-wrapper");
    const btn = root.querySelector<HTMLElement>(".view-actions .lg-kb-search-btn");
    const on = !!(sw && btn);
    root.classList.toggle("lg-kb-searching", on);
    if (!on) return;
    const op = sw.offsetParent || root;
    const pr = op.getBoundingClientRect();
    const br = btn.getBoundingClientRect();
    sw.style.setProperty("--lg-kb-top", `${br.top - pr.top}px`);
    sw.style.setProperty("--lg-kb-right", `${pr.right - br.right}px`);
  },

  // ---------- Bases (테마 Bases 절과 짝) ----------
  // 검색 버튼은 칸반 검색과 같은 클래스(.lg-kb-search-btn, 보기에 .lg-kb-searching)를 써서 같은 넓어짐·누름 효과를 받는다 (사용자 요청).
  // Obsidian 은 검색 줄(.bases-search-row)을 툴바 아래 보기 내용 맨 위에 그린다. 켜져 있는 동안 그 줄을 넓어진 버튼 위로 옮긴다(테마)
  setupBases(this: GlassShelfPlugin, view: ItemView) {
    const root = view && view.containerEl;
    const content = view && view.contentEl;
    if (!root || !root.isConnected || !content) return;
    const btn = content.querySelector<HTMLElement>(".bases-toolbar-search > .text-icon-button");
    if (btn && !btn.classList.contains("lg-kb-search-btn")) btn.classList.add("lg-kb-search-btn");
    const win = content.ownerDocument.defaultView || window;
    // 툴바·검색 줄은 보기를 다시 그릴 때 새로 생긴다: 보기 내용 바로 아래 자식이 바뀌면 다시 붙인다
    if (!this.kbWatched.has(content)) {
      const watch = new win.MutationObserver(() => this.setupBases(view));
      watch.observe(content, { childList: true });
      this.kbWatched.add(content);
      this.observers.push(watch);
    }
    const row = content.querySelector<HTMLElement>(":scope > .bases-search-row");
    if (row && !this.kbWatched.has(row)) {
      const obs = new win.MutationObserver(() => this.basesSearch(root, content));
      obs.observe(row, { attributes: true, attributeFilter: ["style", "class"] });
      this.kbWatched.add(row);
      this.observers.push(obs);
    }
    if (btn && !this.kbWatched.has(btn)) {
      const obs = new win.MutationObserver(() => this.basesSearch(root, content));
      obs.observe(btn, { attributes: true, attributeFilter: ["class"] });
      this.kbWatched.add(btn);
      this.observers.push(obs);
    }
    // 그룹 표시: 툴바가 다시 그려지면(보기 바꿈·설정 바뀜) 다시 본다
    const bar = content.querySelector<HTMLElement>(".bases-toolbar");
    // 툴바 폭이 바뀌면 검색 칸이 툴바 안에 들어가는지 다시 잰다 (basesSearch)
    if (bar && !bar.lgSearchRo) {
      bar.lgSearchRo = new win.ResizeObserver(() => this.basesSearch(root, content));
      bar.lgSearchRo.observe(bar);
      this.observers.push(bar.lgSearchRo);
    }
    if (bar && !this.kbWatched.has(bar)) {
      const obs = new win.MutationObserver(() => this.basesGroupMark(view));
      obs.observe(bar, { childList: true, subtree: true, characterData: true });
      this.kbWatched.add(bar);
      this.observers.push(obs);
    }
    this.basesGroupMark(view);
    this.basesSearch(root, content);
  },

  // 지금 보기에 그룹이 걸려 있으면 그룹 버튼에 .lg-on (테마: 강조색). Obsidian 은 그룹 버튼에 표시가 없다.
  // 설정은 Bases 내부 값(controller.view.config)을 읽기만 한다
  basesGroupMark(this: GlassShelfPlugin, view: ItemView) {
    const btn = view.contentEl.querySelector<HTMLElement>(".bases-toolbar-group-menu > .text-icon-button");
    if (!btn) return;
    const ctl = (view as unknown as { controller?: { view?: { config?: { get?: (k: string) => unknown } } } }).controller;
    let on = false;
    try {
      const cfg = ctl && ctl.view && ctl.view.config;
      const g = cfg && cfg.get ? cfg.get("groupBy") : null;
      on = !!g;
    } catch {
      on = false;
    }
    if (btn.classList.contains("lg-on") !== on) btn.classList.toggle("lg-on", on);
  },

  // 검색이 켜져 있으면 검색 칸을 넓어진 검색 버튼 위로 옮긴다(테마 .lg-kb-searching). 툴바에 남는 폭이 NAV_SEARCH_MIN 보다 적으면
  // 옮기지 않고 Obsidian 원래 자리(툴바 아래 줄)에 둔다 (사용자 요청, 패널 검색 칸과 같은 방식). 남는 폭만큼 넓히되 NAV_SEARCH_MAX 까지
  basesSearch(this: GlassShelfPlugin, root: HTMLElement, content: HTMLElement) {
    const row = content.querySelector<HTMLElement>(":scope > .bases-search-row");
    const btn = content.querySelector<HTMLElement>(".bases-toolbar-search > .lg-kb-search-btn");
    let on = !!(row && btn && btn.classList.contains("is-active") && row.style.display !== "none");
    const bar = btn && btn.closest<HTMLElement>(".bases-toolbar");
    const item = btn && btn.parentElement;
    if (on && bar && item) {
      // 검색 칸을 뺀 툴바 칸들의 배치 폭 + 사이 간격을 빼고 남는 폭 (넓어지는 중인 검색 칸 폭에 흔들리지 않는다)
      const gap = parseFloat(getComputedStyle(bar).columnGap) || 0;
      const others = els(bar.children).filter((x): x is HTMLElement => x !== item && x.instanceOf(HTMLElement) && x.offsetWidth > 0);
      const free = bar.clientWidth - others.reduce((sum, x) => sum + x.offsetWidth, 0) - gap * others.length;
      if (free >= NAV_SEARCH_MIN) root.style.setProperty("--lg-kb-search-w", `${Math.min(NAV_SEARCH_MAX, free)}px`);
      else on = false;
    }
    if (!on) root.style.removeProperty("--lg-kb-search-w");
    if (root.classList.contains("lg-kb-searching") !== on) root.classList.toggle("lg-kb-searching", on);
    if (!on || !row || !btn) return;
    const op = row.offsetParent || content;
    const pr = op.getBoundingClientRect();
    const br = btn.getBoundingClientRect();
    row.style.setProperty("--lg-kb-top", `${br.top - pr.top}px`);
    row.style.setProperty("--lg-kb-right", `${pr.right - br.right}px`);
  },

  // 카드 추가 입력 칸을 닫으면 Kanban 이 입력 칸을 다시 카드 추가 버튼으로 바꿔 끼운다.
  // 그 버튼이 유리 흰색에서 강조색으로 서서히 돌아오게 한다 (사용자 요청, 열 때의 반대)
  kanbanFormBack(this: GlassShelfPlugin, board: HTMLElement) {
    board.querySelectorAll<HTMLElement>(".kanban-plugin__lane").forEach((lane: HTMLElement) => {
      if (lane.querySelector<HTMLElement>(":scope > .kanban-plugin__item-form")) {
        lane.lgKbForm = true;
        return;
      }
      if (!lane.lgKbForm) return;
      lane.lgKbForm = false;
      const btn = lane.querySelector<HTMLElement>(":scope > .kanban-plugin__item-button-wrapper .kanban-plugin__new-item-button");
      if (!btn) return;
      const win = lane.ownerDocument.defaultView || window;
      // 목록 유리판과 같은 채움·글자색에서 시작한다
      const cs = win.getComputedStyle(lane);
      // 키프레임이 하나면 끝 값으로 쳐지므로 시작(offset 0)이라고 적는다
      btn.animate([{ offset: 0, backgroundColor: cs.backgroundColor, color: cs.color }], { duration: 320, easing: EASE.settle });
    });
  },

  // 칸반 검색 버튼을 누르면: 알약 안 버튼과 같은 흰 빛이, 열 때는 넓어지는 쪽(왼쪽)으로, 닫을 때는 줄어드는 쪽(오른쪽)으로
  // 돋보기를 따라 움직이며 퍼진다 (사용자 요청). 버튼은 오른쪽 끝이 고정된 채 넓어지므로 빛 자리를 오른쪽 끝에서 잰다
  pressKbSearch(this: GlassShelfPlugin, btn: HTMLElement) {
    try {
      const doc = btn.ownerDocument;
      const win = doc.defaultView || window;
      // 넓게 모드 패널 검색 버튼(.lg-nav-find, navSearchSync)도 같은 효과. 오른쪽 패널에서는 왼쪽 끝이 고정된 채 넓어지므로 빛 자리를 왼쪽 끝에서 잰다
      const nav = btn.classList.contains("lg-nav-find");
      const side = nav && btn.closest<HTMLElement>(".mod-right-split") ? "left" : "right";
      const tx = side === "left" ? "-50%" : "50%";
      const opening = nav ? !btn.classList.contains("lg-nav-search") : !btn.closest<HTMLElement>(".lg-kb-searching");
      const h = btn.offsetHeight;
      const wide = parseFloat(win.getComputedStyle(btn).getPropertyValue(nav ? "--lg-ns-w" : "--lg-kb-search-w")) || (nav ? NAV_SEARCH_MAX : 240);
      const near = h / 2; // 접힌 버튼(돋보기) 가운데
      const far = wide - h / 2; // 넓어진 알약의 돋보기 자리
      // 열 때는 오른쪽 끝(넓어져도 제자리)에 머문 채 퍼진다. 돋보기를 따라 움직이면 빛이 돋보기에서 나오는 것처럼 보였다 (사용자 지적)
      let [a, b] = opening ? [0, 0] : [far, near];
      // 패널 검색 버튼: 빛은 늘 누른 자리(돋보기)에서 나온다 (사용자 요청). 열 때는 누른 자리에 머물고, 닫을 때는 돋보기를 따라간다.
      // 오른쪽 패널은 돋보기가 고정된 끝(왼쪽)에 있어 늘 그 자리, 왼쪽 패널은 열린 동안 돋보기가 움직이는 끝(왼쪽)에 있다
      if (nav) [a, b] = opening || side === "left" ? [near, near] : [far, near];
      const same = opening || nav;
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
      const wrap = newEl(doc, "span");
      wrap.className = "lg-ripple";
      const dot = newEl(doc, "span");
      dot.className = "lg-ripple-dot";
      dot.style.top = `${h / 2}px`;
      // 열 때는 넓어진 알약 왼쪽 끝까지 닿게 (흰 빛은 반지름의 80% 에서 투명해지므로 그만큼 크게, 사용자 요청)
      const d = same ? (wide * 2) / 0.8 : h * RIPPLE_K;
      dot.style.width = dot.style.height = `${d}px`;
      wrap.appendChild(dot);
      btn.prepend(wrap);
      const anim = dot.animate(
        [
          { offset: 0, [side]: `${a}px`, transform: `translate(${tx}, -50%) scale(0)`, opacity: 1 },
          { offset: RIPPLE_HOLD, opacity: 1 },
          { offset: 1, [side]: `${b}px`, transform: `translate(${tx}, -50%) scale(1)`, opacity: 0 },
        ],
        { duration: 640, easing: EASE.burst, fill: "both" }
      );
      const done = () => wrap.remove();
      anim.onfinish = done;
      anim.oncancel = done;
    } catch (err) {
      console.error("[glass-shelf] kanban-search", err);
    }
  },

  // 목록 추가 창 (보드 위 + 버튼): 화살표 없는 일반 메뉴창처럼 버튼 아래에 연다 (사용자 요청: 드롭다운처럼 버튼에서 넓어지지 않게.
  // 예전엔 + 버튼을 가리키는 말풍선 화살표를 달았는데, 애플 가이드라인도 팝오버라고 늘 화살표를 달지는 않아 뺐다).
  // 창은 보드 안에 그려지는데 보드(contain)와 보기 내용(스크롤 상자)이 밖을 잘라, 여는 동안 보드의 제한을 푼다(테마 .lg-kb-laneform)
  kanbanLaneForm(this: GlassShelfPlugin, root: HTMLElement, ms: MutationRecord[]) {
    const sel = ".kanban-plugin__lane-form-wrapper";
    const find = (n: Node) => (isEl(n) ? (n.matches(sel) ? n : n.querySelector<HTMLElement>(sel)) : null);
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
  },

  laneFormOpen(this: GlassShelfPlugin, root: HTMLElement, form: HTMLElement) {
    try {
      const group = root.querySelector<HTMLElement>(".view-actions > .lg-kb-group");
      const btn = (group && group.querySelector<HTMLElement>(".clickable-icon.kanban-plugin__ignore-click-outside")) || group;
      if (!group || !btn) return;
      root.classList.add("lg-kb-laneform");
      const op = form.offsetParent || root;
      const o = op.getBoundingClientRect();
      const ox = o.left + op.clientLeft;
      const oy = o.top + op.clientTop;
      const g = group.getBoundingClientRect();
      const b = btn.getBoundingClientRect();
      // 오른쪽 끝은 버튼 묶음 오른쪽 끝, 위 끝은 버튼 아래 끝 + 4px
      const left = g.right - form.offsetWidth - ox;
      const top = b.bottom + 4 - oy;
      form.setCssProps({ left: `${left}px`, top: `${top}px` });
      form.style.transformOrigin = `${(b.left + b.width / 2 - ox - left).toFixed(1)}px -4px`;
      form.classList.add("lg-right-auto", "lg-kb-pop");
      // 다른 메뉴처럼 버튼 가운데 아래에서 커지며 나타난다. 컴팩트 모드면 바로 뜬다
      if (!this.reduceMotion()) {
        form.animate(
          [
            { opacity: 0, transform: "scale(0.2)", easing: EASE.burst },
            { offset: 0.42, opacity: 1, transform: "scale(1.02)", easing: EASE.ret },
            { opacity: 1, transform: "scale(1)" },
          ],
          { duration: 280 }
        );
      }
    } catch (err) {
      console.error("[glass-shelf] lane-form", err);
    }
  },

  laneFormClose(this: GlassShelfPlugin, root: HTMLElement, form: HTMLElement) {
    if (!root.querySelector<HTMLElement>(".kanban-plugin__lane-form-wrapper")) root.classList.remove("lg-kb-laneform");
    if (this.reduceMotion() || !root.isConnected || !form.classList.contains("lg-kb-pop")) return;
    try {
      // 사본이 버튼 쪽으로 줄며 흐려진다 (다른 메뉴가 닫히는 것과 같다)
      const ghost = form.cloneNode(true) as HTMLElement;
      ghost.classList.add("lg-kb-ghost");
      root.appendChild(ghost);
      const win = root.ownerDocument.defaultView || window;
      win.setTimeout(() => ghost.remove(), 600);
      ghost.animate(
        [
          { opacity: 1, transform: "scale(1)" },
          { opacity: 0, transform: "scale(0.5)" },
        ],
        { duration: 110, easing: EASE.exit, fill: "forwards" }
      ).onfinish = () => ghost.remove();
    } catch (err) {
      console.error("[glass-shelf] lane-form-close", err);
    }
  },


  // 목록 접기·펴기: Kanban 은 접으면 카드 줄을 지우고 펴면 다시 그린다. 누를 때 크기를 재 두고, 다시 그려지면
  // 예전 크기에서 새 크기로 움직인다. 펼 때는 다시 나온 카드 줄이 서서히 나타난다
  animateLaneCollapse(this: GlassShelfPlugin, btn: HTMLElement) {
    const wrap = btn.closest<HTMLElement>(".kanban-plugin__lane-wrapper");
    const lane = wrap && wrap.querySelector<HTMLElement>(":scope > .kanban-plugin__lane");
    if (!lane) return;
    const win = wrap.ownerDocument.defaultView || window;
    const h0 = lane.offsetHeight;
    const w0 = lane.offsetWidth;
    const ww0 = wrap.offsetWidth;
    const opening = wrap.matches(".collapse-vertical, .collapse-horizontal");
    const obs = new win.MutationObserver(() => {
      obs.disconnect();
      const ln = wrap.querySelector<HTMLElement>(":scope > .kanban-plugin__lane");
      if (!ln) return;
      // Kanban 은 접힘 표시를 바꾼 뒤에도 목록 안(세로 제목 등)을 조금 늦게 그린다. 표시가 바뀐 즉시 재면 다 그려지기 전 크기라,
      // 그 크기까지 움직인 뒤 높이가 한 번 더 툭 늘어났다 (사용자 영상). 예전 크기로 잠깐 붙잡아 두고(그동안 화면은 예전 크기),
      // 두 프레임 뒤 다 그려진 크기를 재서 그때부터 움직인다
      const holdOpt: KeyframeAnimationOptions = { duration: 1000, fill: "forwards" };
      const holdLn = ln.animate([{ width: `${w0}px`, height: `${h0}px` }, { width: `${w0}px`, height: `${h0}px` }], holdOpt);
      const holdWrap = wrap.animate([{ width: `${ww0}px`, minWidth: "0px" }, { width: `${ww0}px`, minWidth: "0px" }], holdOpt);
      ln.classList.add("lg-clip");
      const head = ln.querySelector<HTMLElement>(".kanban-plugin__lane-header-wrapper");
      const run = () => {
        holdLn.cancel();
        holdWrap.cancel();
        const h1 = ln.offsetHeight;
        const w1 = ln.offsetWidth;
        const ww1 = wrap.offsetWidth;
        const opt = { duration: KB_LANE_MS, easing: MINI_EASE };
        // 옆으로 늘어선 목록(가로 보드)을 접으면 Kanban 이 목록 칸(wrapper) 폭을 좁히고 제목을 세로로 세운다 (사용자 지적: 폭이 한 번에 바뀌었다).
        // 칸 폭과 목록 폭·높이를 함께 움직이고, 제목 줄은 모양이 바뀌므로 흐려졌다 다시 나타난다
        const sideways = ww0 !== ww1;
        const a = ln.animate([{ width: `${w0}px`, height: `${h0}px` }, { width: `${w1}px`, height: `${h1}px` }], opt);
        const done = () => ln.classList.remove("lg-clip");
        a.onfinish = done;
        a.oncancel = done;
        // 칸은 자르지 않는다 (목록 유리판의 그림자가 잘린다)
        if (sideways) {
          wrap.animate([{ width: `${ww0}px`, minWidth: "0px" }, { width: `${ww1}px`, minWidth: "0px" }], opt);
          const hd = ln.querySelector<HTMLElement>(".kanban-plugin__lane-header-wrapper") || head;
          if (hd) hd.animate([{ opacity: 0 }, { opacity: 0, offset: 0.3 }, { opacity: 1 }], opt);
        }
        if (opening) els(ln.children).slice(1).forEach((k) => k.animate([{ opacity: 0 }, { opacity: 1 }], opt));
      };
      // 붙잡은 동안 제목 줄은 숨겨 둔다 (모양이 바뀐 제목이 예전 크기 상자 안에 먼저 보이지 않게)
      if (head) head.animate([{ opacity: 0 }, { opacity: 0 }], { duration: 60 });
      win.requestAnimationFrame(() => win.requestAnimationFrame(run));
    });
    obs.observe(wrap, { attributes: true, attributeFilter: ["class"] });
    win.setTimeout(() => obs.disconnect(), 1000);
  },

  // 칸반 카드 추가 버튼 (테마 Kanban 연동): 다른 알약처럼 커지며 하얘졌다 돌아온다 (사용자 요청).
  // 누르면 Kanban 이 버튼을 입력 칸으로 바꿔 끼우므로, 입력 칸이 나타나면 같은 애니메이션을 같은 시점부터 이어받는다
  // (강조색 → 흰색 → 유리 흰색)
  pressKanbanAdd(this: GlassShelfPlugin, btn: HTMLElement) {
    try {
      const win = btn.ownerDocument.defaultView || window;
      const r = btn.getBoundingClientRect();
      const k = (1 + Math.min(0.2, 16 / Math.max(r.width, r.height, 1))).toFixed(3);
      const opt = { duration: 570, easing: EASE.press };
      const peak = { scale: k, backgroundColor: PRESS_WHITE, backgroundImage: PRESS_IMG };
      const accent = win.getComputedStyle(btn).backgroundColor;
      const t0 = win.performance.now();
      btn.animate([{ offset: 0.34, ...peak }, { offset: 0.46, ...peak }], opt);
      const lane = btn.closest<HTMLElement>(".kanban-plugin__lane");
      if (!lane) return;
      const obs = new win.MutationObserver(() => {
        const box = lane.querySelector<HTMLElement>(".kanban-plugin__item-form .kanban-plugin__item-input-wrapper");
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
  },
};