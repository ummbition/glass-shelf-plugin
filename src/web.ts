import type { View, WorkspaceLeaf } from "obsidian";
import { setTooltip } from "obsidian";
import { tr, INJECTED, isEl, placeSugg } from "./util";
import { isWebView, WEB_CARD_K, WEB_PAGE_SCRIPT, WEB_MOUSE_SCRIPT, WEB_SCROLL_SCRIPT, WEB_COLOR_SCRIPT, WEB_TINT_POLL_MS, webHost, WEB_DARK_DIM, WEB_DARK_DIM_FROM } from "./web-page";
import { colorDim, GLASS_MIX_LO, GLASS_MIX_HI, colorLightness } from "./color";
import { EASE } from "./constants";
import type { GlassShelfPlugin } from "./host";

// 주소 카드: 웹 탭 알약을 눌러 연 넓은 주소 알약과 옮겨 온 주소칸의 원래 자리
export interface WebCard {
  card: HTMLElement;
  leaf: WorkspaceLeaf;
  view: View;
  tab: HTMLElement;
  addr: HTMLElement;
  parent: HTMLElement | null;
  next: Node | null;
  off?: () => void;
}

export const webMethods = {
  // 웹 뷰어 탭 줄 축소 (사용자 요청): 보이는 웹 탭의 페이지 스크롤 위치를 물어 편집창과 같은 판단(miniFeed)에 넣는다.
  // 같은 질문으로 마우스 옆 버튼 요청(WEB_MOUSE_SCRIPT)도 받는다.
  // 앞 질문이 끝나기 전엔 다시 묻지 않는다. 여백을 다시 맞춘 직후(lgMiniSkip)는 그 때문에 옮긴 스크롤을 기준으로만 삼는다
  webMiniTick(this: GlassShelfPlugin) {
    if (this.unloaded || document.hidden) return;
    this.app.workspace.getLeavesOfType("webviewer").forEach((leaf) => {
      const view = leaf.view;
      const wv = view && view.webview;
      const tabs = leaf.parent && leaf.parent.containerEl;
      if (!tabs || !tabs.closest<HTMLElement>(".mod-root") || tabs.classList.contains("mod-stacked") || this.activeLeafOf(tabs) !== leaf) return;
      // 주소 표시도 여기서 맞춘다: 페이지 이동 알림이 오지 않는 경우(웹 화면 요소가 바뀌는 중 등)에도 늦어도 다음 물음 때 따라온다
      const pathText = tabs.querySelector<HTMLElement>(":scope > .workspace-tab-header-container > .lg-path .lg-path-text");
      if (pathText && pathText.lgWebUrl) pathText.lgWebUrl.set();
      if (view.mode !== "webview" || !wv || !view.webviewMounted || !wv.isConnected || view.lgMiniBusy) return;
      view.lgMiniBusy = true;
      try {
        wv.executeJavaScript(WEB_SCROLL_SCRIPT).then(
          (res) => {
            view.lgMiniBusy = false;
            if (this.unloaded || !Array.isArray(res)) return;
            const [y, nav] = res as [unknown, unknown];
            // 마우스 옆 버튼 요청 (WEB_MOUSE_SCRIPT)
            if (nav === "back" || nav === "forward") this.goHistory(tabs, nav);
            if (typeof y !== "number" || !this.settings.miniBar) return;
            if (view.lgMiniSkip) {
              view.lgMiniSkip = false;
              view.lgMiniY = y;
              return;
            }
            this.miniFeed(tabs, view, y);
          },
          () => {
            view.lgMiniBusy = false;
          }
        );
      } catch {
        view.lgMiniBusy = false;
      }
    });
  },

  // 경로 알약의 웹 주소 표시 (사용자 요청): 주소칸을 고치지 않을 때는 도메인만 보인다(전체 주소는 누를 때만).
  // 주소칸(Obsidian 원래 입력칸) 값은 건드리지 않고 그 위에 덮어 보인다(테마: 그동안 입력칸 글자는 투명). 페이지를 옮기면 다시 쓴다
  webUrlLabel(this: GlassShelfPlugin, el: HTMLElement, view: View, addr: HTMLElement) {
    const label = addr.createSpan({ cls: ["lg-web-url", INJECTED] });
    const set = () => {
      const url = (view && view.url) || "";
      let h = "";
      try {
        const u = new URL(url);
        if (/^https?:$/.test(u.protocol)) h = u.hostname;
      } catch {
        /* 주소가 아니다 */
      }
      if (label.textContent !== (h || url)) label.setText(h || url);
    };
    set();
    const watch = this.watchWebview(view, ["did-navigate", "did-navigate-in-page"], () => window.setTimeout(set, 0));
    // 주소를 고치는 중(입력칸 포커스)을 알약에 알린다(테마: 넓히고 전체 주소를 보인다). 알약 안 포커스 전체로 보면 새로고침 버튼(button)을
    // 눌러도 포커스가 들어가 알약이 넓어졌다 (사용자 지적)
    const input = addr.querySelector("input");
    const pill = el.parentElement;
    // 고치는 동안은 body 에도 알려 창 끌기 띠를 끈다(테마 .lg-addr-typing): 탭 줄 빈 곳은 창 끌기 영역이라 눌러도 페이지가 누름을 받지 못해
    // 입력칸 포커스가 빠지지 않았고, 알약이 넓어진 채 남았다 (사용자 지적)
    // 웹 페이지 본문을 실제로 누르면 포커스가 페이지(다른 화면)로 넘어가는데, 이때 Obsidian 문서의 입력칸은 blur 없이 포커스를 쥔 채로 남는다
    // (창만 포커스를 잃는다, 사용자 지적: 본문을 눌러도 알약이 넓은 채). 그래서 창이 포커스를 가졌는지도 본다
    const typing = () => {
      const doc = input ? input.ownerDocument : null;
      const on = !!doc && doc.activeElement === input && doc.hasFocus();
      if (pill) pill.classList.toggle("lg-web-typing", on);
      if (doc) doc.body.classList.toggle("lg-addr-typing", on);
    };
    const win = input ? input.ownerDocument.defaultView : null;
    if (input) {
      input.addEventListener("focus", typing);
      input.addEventListener("blur", typing);
    }
    if (win) {
      win.addEventListener("blur", typing);
      win.addEventListener("focus", typing);
    }
    typing();
    el.lgWebUrl = {
      label,
      set,
      off: () => {
        watch();
        if (input) {
          input.removeEventListener("focus", typing);
          input.removeEventListener("blur", typing);
        }
        if (win) {
          win.removeEventListener("blur", typing);
          win.removeEventListener("focus", typing);
        }
        if (pill) pill.classList.remove("lg-web-typing");
        if (input) input.ownerDocument.body.classList.remove("lg-addr-typing");
      },
    };
  },

  // 웹 화면(<webview>)의 페이지 이동 알림을 단다. 새 탭(빈 화면)에서 처음 주소를 열면 Obsidian 이 웹 화면 요소(view.webview)를
  // 새로 만들어, 처음 단 알림이 끊겨 주소 표시가 about:blank 로 남았다 (사용자 지적, 맥 러너 확인). 보기 안에서 웹 화면이 바뀌면
  // 새 요소에 다시 달고 한 번 부른다. 반환값은 떼기
  watchWebview(this: GlassShelfPlugin, view: View, evs: string[], cb: () => void) {
    let wv: HTMLElement | null = null;
    const bind = () => {
      const cur = (view && view.webview) || null;
      if (cur === wv) return;
      if (wv) for (const ev of evs) wv.removeEventListener(ev, cb);
      wv = cur;
      if (wv) for (const ev of evs) wv.addEventListener(ev, cb);
      cb();
    };
    bind();
    const host = view && view.containerEl;
    const mo = host ? new MutationObserver(bind) : null;
    if (mo && host) mo.observe(host, { childList: true, subtree: true });
    return () => {
      if (mo) mo.disconnect();
      if (wv) for (const ev of evs) wv.removeEventListener(ev, cb);
      wv = null;
    };
  },

  // 웹 뷰어의 주소칸과 새로고침 버튼 묶음 (Obsidian 원래 요소)
  webParts(this: GlassShelfPlugin, view: View) {
    const input = view.addressBar && view.addressBar.addrInputEl;
    const addr = input && input.parentElement;
    const reload = view.reloadButtonEl && view.reloadButtonEl.parentElement;
    if (!addr) return null;
    // 탭 알약 안에서는 누름이 탭을 끌거나 고르는 데로 가지 않게 한다 (글자를 끌어 고르기)
    if (!this.addrWired) this.addrWired = new WeakSet();
    if (!this.addrWired.has(addr)) {
      this.addrWired.add(addr);
      for (const type of ["mousedown", "pointerdown"] as const) this.registerDomEvent(addr, type, (e) => e.stopPropagation());
    }
    return { addr, reload };
  },

  // 경로 표시를 껐을 때: 지금 탭 알약의 이름 자리에 웹 페이지 도메인을, ≡ 왼쪽에 새로고침을 둔다 (사용자 요청).
  // 도메인을 누르면 탭 알약이 커지며 탭 줄 가운데로 가 주소칸이 된다(openWebCard, 사파리처럼 다른 탭을 밀지 않는다).
  // place 가 false 면 옮겨 둔 것을 되돌리기만 한다
  webTab(this: GlassShelfPlugin, tabsEl: HTMLElement, leaf: WorkspaceLeaf | null, place: boolean) {
    const view = leaf && leaf.view;
    const want = isWebView(view) && !this.pathShown(tabsEl) && leaf.tabHeaderEl ? leaf : null;
    const cur = tabsEl.lgWebTab;
    if (cur && cur.leaf === want && cur.view === view) {
      const host = webHost(view);
      if (cur.hostEl.textContent !== host) cur.hostEl.setText(host);
      if (cur.pathHostEl && cur.pathHostEl.textContent !== host) cur.pathHostEl.setText(host);
      return;
    }
    if (cur) {
      for (const { node, parent, next, holder } of cur.moved.reverse()) {
        if (node.parentElement !== holder) continue;
        parent.insertBefore(node, next && next.parentElement === parent ? next : null);
      }
      cur.hostEl.remove();
      if (cur.pathHostEl) cur.pathHostEl.remove();
      if (cur.off) cur.off();
      if (cur.leaf.tabHeaderEl) cur.leaf.tabHeaderEl.classList.remove("lg-web-tab");
      tabsEl.lgWebTab = null;
    }
    if (!want || !place) return;
    const parts = this.webParts(view);
    const inner = leaf.tabHeaderEl.querySelector<HTMLElement>(":scope > .workspace-tab-header-inner");
    if (!parts || !inner) return;
    this.setupTabMenu(leaf);
    const title = inner.querySelector<HTMLElement>(":scope > .workspace-tab-header-inner-title");
    const menu = inner.querySelector<HTMLElement>(":scope > .lg-tab-menu");
    const hostEl = createDiv({ cls: ["lg-web-host", INJECTED], text: webHost(view) });
    setTooltip(hostEl, tr("주소 고치기", "Edit address"));
    // 누름이 탭을 끌거나 고르는 데로 가지 않게 한다
    for (const type of ["mousedown", "pointerdown"]) hostEl.addEventListener(type, (e) => e.stopPropagation());
    hostEl.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.openWebCard(leaf);
    });
    inner.insertBefore(hostEl, title ? title.nextSibling : null);
    const moved: { node: HTMLElement; parent: HTMLElement | null; next: Node | null; holder: HTMLElement }[] = [];
    if (parts.reload && parts.reload.parentElement) {
      moved.push({ node: parts.reload, parent: parts.reload.parentElement, next: parts.reload.nextSibling, holder: inner });
      inner.insertBefore(parts.reload, menu);
    }
    leaf.tabHeaderEl.classList.add("lg-web-tab");
    // 탭 줄을 접으면 경로 알약만 남는데, 경로 표시를 끈 웹 뷰어는 알약에 글자가 없어 빈 알약이 됐다 (사용자 제보).
    // 접힌 알약에 보일 도메인을 경로 글자 자리에 둔다 (펼친 상태에서는 경로 줄이 숨어 있다)
    const pathText = tabsEl.querySelector<HTMLElement>(":scope > .workspace-tab-header-container > .lg-path .lg-path-text");
    const pathHostEl = pathText ? pathText.createSpan({ cls: ["lg-path-host", INJECTED], text: webHost(view) }) : null;
    // 페이지를 옮길 때마다 도메인을 다시 쓴다 (탭 줄 갱신이 따로 오지 않아 빈 탭 이름이 남았다)
    const off = this.watchWebview(view, ["did-navigate", "did-navigate-in-page", "did-stop-loading"], () => window.setTimeout(() => {
      if (hostEl.isConnected) hostEl.setText(webHost(view));
      if (pathHostEl && pathHostEl.isConnected) pathHostEl.setText(webHost(view));
    }, 60));
    tabsEl.lgWebTab = { leaf, view, moved, hostEl, pathHostEl, off };
  },

  // 주소 고치기 (사용자 요청, iPadOS 사파리 영상): 지금 탭 알약이 그대로 커지며 탭 줄 가운데로 옮겨 가 주소칸이 된다.
  // 다른 탭은 밀지 않는다. 진짜 탭을 배치에서 빼면 탭 줄이 흔들리므로, 고치는 동안 탭은 숨기고(자리는 그대로)
  // 탭과 같은 유리 알약(.lg-web-card)이 탭 자리에서 폭·위치를 바꿔 가운데로 간다 (늘이기 대신 실제 크기를 바꿔 찌그러지지 않는다).
  // 알약에는 Obsidian 원래 주소칸을 옮겨 와 전체 주소를 고른 채로 고치고, 제안 목록은 알약 유리가 아래로 늘어난 자리에 붙는다
  // (attachWebSuggest). 주소칸에서 포커스가 빠지면(Enter 로 이동, Esc, 바깥 누름) 탭 자리로 돌아가 다시 탭이 된다
  openWebCard(this: GlassShelfPlugin, leaf: WorkspaceLeaf) {
    const view = leaf && leaf.view;
    const tab = leaf && leaf.tabHeaderEl;
    const parts = isWebView(view) ? this.webParts(view) : null;
    const input = view && view.addressBar && view.addressBar.addrInputEl;
    if (!parts || !tab || !input) return;
    if (this.webCard) this.closeWebCard(true);
    const doc = tab.ownerDocument;
    const win = doc.defaultView || window;
    const header = tab.closest<HTMLElement>(".workspace-tab-header-container") || tab;
    const track = header.querySelector<HTMLElement>(":scope > .workspace-tab-header-container-inner") || header;
    const cs = win.getComputedStyle(header);
    const H = parseFloat(cs.getPropertyValue("--lg-pill-h")) || 34;
    const tabW = parseFloat(cs.getPropertyValue("--lg-tab-w")) || 320;
    const t = tab.getBoundingClientRect();
    const hr = header.getBoundingClientRect();
    const kr = track.getBoundingClientRect();
    const W = Math.max(t.width, Math.min(tabW * WEB_CARD_K, hr.width - 16));
    // 가운데 = 탭 줄(트랙) 가운데. 헤더 밖으로 나가지 않게 맞춘다
    const left = Math.max(hr.left + 8, Math.min(kr.left + kr.width / 2 - W / 2, hr.right - 8 - W));
    const top = t.top + t.height / 2 - H / 2;
    const card = doc.body.createDiv({ cls: ["lg-web-card", INJECTED] });
    this.webPopTint(card, tab);
    card.setCssProps({ "--lg-cx": `${left}px`, "--lg-cy": `${top}px`, "--lg-cw": `${W}px`, "--lg-ch": `${H}px` });
    const rec: WebCard = { card, leaf, view, tab, addr: parts.addr, parent: parts.addr.parentElement, next: parts.addr.nextSibling };
    card.appendChild(parts.addr);
    tab.classList.add("lg-web-editing");
    this.webCard = rec;
    const box = (r: { left: number; top: number; width: number; height: number }) => ({ left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px` });
    card.animate([box(t), box({ left, top, width: W, height: H })], { duration: 300, easing: EASE.settle });
    parts.addr.animate([{ opacity: 0 }, { opacity: 0, offset: 0.25 }, { opacity: 1 }], { duration: 300, easing: "ease-out" });
    const onBlur = () =>
      win.setTimeout(() => {
        if (this.webCard === rec && doc.activeElement !== input) this.closeWebCard(false);
      }, 0);
    input.addEventListener("blur", onBlur);
    rec.off = () => input.removeEventListener("blur", onBlur);
    input.focus();
  },

  closeWebCard(this: GlassShelfPlugin, instant: boolean) {
    const rec = this.webCard;
    if (!rec) return;
    this.webCard = null;
    if (rec.off) rec.off();
    let ended = false;
    let fade: Animation | null = null;
    const finish = () => {
      if (ended) return;
      ended = true;
      // 흐려지는 움직임을 남겨 두면 다음에 열 때 주소칸이 보이지 않는다
      if (fade) fade.cancel();
      if (rec.addr.parentElement === rec.card) rec.parent.insertBefore(rec.addr, rec.next && rec.next.parentElement === rec.parent ? rec.next : null);
      rec.card.remove();
      rec.tab.classList.remove("lg-web-editing");
    };
    const tab = rec.tab;
    if (instant || !tab.isConnected || !tab.getClientRects().length) return finish();
    const c = rec.card.getBoundingClientRect();
    const t = tab.getBoundingClientRect();
    const box = (r: { left: number; top: number; width: number; height: number }) => ({ left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px` });
    const anim = rec.card.animate([box(c), box(t)], { duration: 260, easing: EASE.settle, fill: "forwards" });
    fade = rec.addr.animate([{ opacity: 1 }, { opacity: 0, offset: 0.4 }, { opacity: 0 }], { duration: 260, fill: "forwards" });
    anim.onfinish = anim.oncancel = finish;
    window.setTimeout(finish, 450);
  },

  // 커서가 빠진 웹 주소칸 아래에 뜬 제안 목록은 닫는다 (사용자 지적). 한글은 마지막 글자를 조합하는 중에 엔터로 이동하면
  // 주소칸에서 커서가 빠진 뒤 조합이 끝나며 입력이 한 번 더 와(추정) Obsidian 이 제안 목록을 다시 띄웠고, 커서가 없어 닫히지 않았다.
  // 그 주소칸에 커서가 빠졌다고(blur) 알려 Obsidian 이 스스로 닫게 한다
  dropStrayWebSuggest(this: GlassShelfPlugin, pop: HTMLElement, doc: Document) {
    const win = doc.defaultView || window;
    win.requestAnimationFrame(() => {
      if (this.unloaded || !pop.isConnected) return;
      const pr = pop.getBoundingClientRect();
      for (const inp of doc.querySelectorAll<HTMLElement>(".webviewer-address > input")) {
        if (doc.activeElement === inp) continue;
        const ir = inp.getBoundingClientRect();
        if (ir.width && Math.abs(pr.top - ir.bottom) < 24 && pr.left < ir.right && pr.right > ir.left) inp.dispatchEvent(new win.FocusEvent("blur"));
      }
    });
  },

  // 웹 뷰어 주소 제안 목록: 주소 카드나 경로 알약의 유리가 제안 높이만큼 아래로 늘어나고, 목록은 배경 없이 그 자리에 놓인다
  // (검색 탭 제안과 같은 방식). 한 덩어리로 보이게 폭도 맞춘다
  attachWebSuggest(this: GlassShelfPlugin, pop: HTMLElement, doc: Document) {
    const input = doc.activeElement;
    const host = input && input.closest && input.closest<HTMLElement>(".lg-web-card, .lg-path-pill.lg-path-web");
    if (!host) {
      this.dropStrayWebSuggest(pop, doc);
      return false;
    }
    const win = doc.defaultView || window;
    pop.classList.add("lg-sugg-in", "lg-web-sugg");
    this.webPopTint(pop, host);
    host.classList.add("lg-sugg-host");
    const card = host.classList.contains("lg-web-card");
    const place = () => {
      if (!pop.isConnected) return;
      let x: number, y: number, w: number, h: number;
      if (card) {
        // 카드는 커지는 중일 수 있어 화면 좌표 대신 놓일 자리(변수)로 잰다
        const st = host.style;
        x = parseFloat(st.getPropertyValue("--lg-cx"));
        y = parseFloat(st.getPropertyValue("--lg-cy"));
        w = parseFloat(st.getPropertyValue("--lg-cw"));
        h = parseFloat(st.getPropertyValue("--lg-ch"));
      } else {
        const hr = host.getBoundingClientRect();
        w = host.offsetWidth;
        h = host.offsetHeight;
        x = hr.left + hr.width / 2 - w / 2;
        y = hr.top + hr.height / 2 - h / 2;
      }
      placeSugg(pop, x, y + h, w);
      host.setCssProps({ "--lg-sugg-h": `${pop.offsetHeight}px` });
    };
    const ro = new win.ResizeObserver(place);
    ro.observe(pop);
    ro.observe(host);
    // Obsidian 이 목록 자리를 다시 넣으면(style) 차이를 다시 잰다
    const moved = new win.MutationObserver(place);
    moved.observe(pop, { attributes: true, attributeFilter: ["style"] });
    place();
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
    return true;
  },

  // ---------- 웹 페이지가 탭 줄 뒤로 지나가게 + 대표 색 (사용자 요청, 사파리처럼) ----------
  // 웹 화면을 편집창 맨 위까지 늘리고(테마), 페이지 안에 탭 줄 높이만큼 위 여백을 넣어 맨 위에서는 내용이 탭 줄 아래에서 시작한다.
  // 화면 위에 붙는 고정·스티키 헤더는 그만큼 내린다 (Obsidian 웹 뷰어에는 사파리의 콘텐츠 여백 기능이 없어 페이지 안에서 한다).
  // 페이지 배경색(html, 없으면 body)을 읽어 탭 줄 유리판을 그 색으로 칠한다. 페이지 스크립트가 바뀔 때마다 알린다
  webWire(this: GlassShelfPlugin, view: View) {
    const wv = view.webview;
    // 연결 표시와 리스너는 플러그인 쪽에 둔다: 웹 뷰어(요소)에 남기면 플러그인을 다시 켰을 때 "이미 연결됨"으로 보고 건너뛰고,
    // 옛 리스너는 꺼진 플러그인을 계속 깨웠다 (검토 지적). registerDomEvent 는 끌 때 리스너를 뗀다
    if (!this.wvWired) this.wvWired = new WeakSet();
    if (!wv || this.wvWired.has(wv)) return;
    this.wvWired.add(wv);
    this.registerDomEvent(wv as HTMLElement, "dom-ready" as keyof HTMLElementEventMap, () => {
      view.lgInjectTries = 0;
      this.webInject(view, true);
    });
    // 새 페이지로 옮기면(문서가 바뀐 순간) 바로 여백을 넣는다 (사용자 지적: 사이트를 옮길 때마다 고정 막대가 맨 위에 있다가 내려왔다).
    // dom-ready 는 첫 화면을 그린 뒤라 늦다
    this.registerDomEvent(wv as HTMLElement, "did-navigate" as keyof HTMLElementEventMap, () => this.webEarly(view));
    // 다른 페이지로 옮겨 가는 동안은 지금 색을 그대로 둔다 (사용자 요청: 옮길 때마다 툴바 색이 초기화됐다). 새 페이지 색은 다 불러온 뒤 읽는다
    // 페이지를 다 불러왔을 때와 페이지 안 이동 뒤에 색을 다시 읽는다
    this.registerDomEvent(wv as HTMLElement, "did-stop-loading" as keyof HTMLElementEventMap, () => this.webReadTint(view));
    this.registerDomEvent(wv as HTMLElement, "did-navigate-in-page" as keyof HTMLElementEventMap, () => this.webReadTint(view));
    if (view.webviewMounted) this.webInject(view, true);
    // 보이는 웹 페이지 색을 주기적으로 다시 읽는다 (플러그인 전체에 하나, 끌 때 registerInterval 이 멈춘다)
    if (!this.webTintPoll) {
      this.webTintPoll = window.setInterval(() => {
        if (this.unloaded || !this.settings.webTint) return;
        this.app.workspace.getLeavesOfType("webviewer").forEach((leaf) => {
          const tabs = leaf.parent && leaf.parent.containerEl;
          if (tabs && this.activeLeafOf(tabs) === leaf) this.webReadTint(leaf.view);
        });
      }, WEB_TINT_POLL_MS);
      this.registerInterval(this.webTintPoll);
    }
  },

  // 웹 뷰어 마우스 옆 버튼 (WEB_MOUSE_SCRIPT): 페이지가 준비될 때마다 넣는다. 몰입형 웹 보기와 상관없이
  webMouseWire(this: GlassShelfPlugin, view: View) {
    const wv = view && view.webview;
    if (!this.wvMouse) this.wvMouse = new WeakSet();
    if (!wv || this.wvMouse.has(wv)) return;
    this.wvMouse.add(wv);
    const put = () => {
      try {
        wv.executeJavaScript(WEB_MOUSE_SCRIPT).catch(() => {});
      } catch {
        /* 아직 준비 전 */
      }
    };
    this.registerDomEvent(wv as HTMLElement, "dom-ready" as keyof HTMLElementEventMap, put);
    if (view.webviewMounted) put();
  },

  // 페이지 배경색을 물어 받아 탭 줄을 칠한다. 앞 질문이 끝나기 전엔 다시 묻지 않는다
  webReadTint(this: GlassShelfPlugin, view: View) {
    const wv = view && view.webview;
    if (!wv || !view.webviewMounted || !wv.isConnected || view.lgTintBusy) return;
    // 불러오는 중에는 묻지 않는다: 새 페이지가 그려지기 전 빈 흰 화면 색을 읽었다
    if (typeof wv.isLoading === "function" && wv.isLoading()) return;
    view.lgTintBusy = true;
    const done = (c: unknown) => {
      view.lgTintBusy = false;
      if (this.unloaded) return;
      const v = typeof c === "string" && CSS.supports("color", c) ? c : null;
      if (v === view.lgTint) return;
      view.lgTint = v;
      this.webTint(view);
    };
    try {
      wv.executeJavaScript(WEB_COLOR_SCRIPT).then(done, () => { view.lgTintBusy = false; });
    } catch {
      view.lgTintBusy = false;
    }
  },

  // 열린 웹 페이지를 모두 새로고침한다: 경로 표시를 켜고 끄면 탭 줄 높이가 바뀌어 페이지 안 위 여백·내린 헤더가 어긋나서
  // 새로 불러와 처음부터 다시 맞춘다 (사용자 요청). 탭 줄이 새 높이로 그려진 뒤에 한다
  reloadWebViews(this: GlassShelfPlugin) {
    window.setTimeout(() => {
      this.app.workspace.getLeavesOfType("webviewer").forEach((leaf) => {
        const view = leaf.view;
        const wv = view && view.webview;
        if (!wv || !view.webviewMounted || !wv.isConnected) return;
        try {
          wv.reload();
        } catch {
          /* 이미 닫힌 페이지 */
        }
      });
    }, 300);
  },

  // 웹 페이지를 옮기면 탭 줄을 다시 맞춘다: 웹 뷰어는 페이지 이동을 탭 방문 기록에 넣지만 Obsidian 이 따로 알리지 않아,
  // 새 탭에서 페이지를 옮겨도 뒤로·앞으로 버튼이 다른 탭에 갔다 올 때까지 나오지 않았다 (사용자 지적)
  webNavWire(this: GlassShelfPlugin, view: View) {
    const wv = view.webview;
    if (!this.wvNavWired) this.wvNavWired = new WeakSet();
    if (!wv || this.wvNavWired.has(wv)) return;
    this.wvNavWired.add(wv);
    const upd = () => window.setTimeout(() => this.requestRefresh(), 60);
    this.registerDomEvent(wv as HTMLElement, "did-navigate" as keyof HTMLElementEventMap, upd);
    this.registerDomEvent(wv as HTMLElement, "did-navigate-in-page" as keyof HTMLElementEventMap, upd);
    // 방문 기록은 이동 알림보다 늦게(다 불러온 무렵) 늘어나서, 다 불러왔을 때도 다시 맞춘다 (재 보니 이동 알림 때는 아직 0)
    this.registerDomEvent(wv as HTMLElement, "did-stop-loading" as keyof HTMLElementEventMap, upd);
  },

  // 페이지에 위 여백(탭 줄 아래 끝까지의 높이)을 알린다. 높이가 바뀌었을 때(경로 표시 켜고 끄기 등)만 다시 보낸다
  // anim: 페이지 고정 요소가 새 자리로 움직이는 시간(ms, 탭 줄 축소 때 띠와 같이)
  // 새 문서가 막 열렸을 때 페이지 스크립트를 넣는다. webview.executeJavaScript 는 페이지를 다 불러올 때까지 기다려 첫 화면보다 늦어,
  // 공개 API 인 웹 화면 주 프레임(webContents.mainFrame.executeJavaScript)으로 바로 넣는다. 못 쓰는 환경이면 dom-ready 때 넣는 것만 남는다
  webEarly(this: GlassShelfPlugin, view: View) {
    const wv = view.webview;
    // 접힌 탭 줄에서 다른 주소로 가면 먼저 편다. 새 페이지는 맨 위에서 시작해 어차피 펴지는데, 접힌 여백으로 넣은 뒤 펴지면
    // 내용은 바로, 고정 막대는 띠를 따라 움직여 덜컹거렸다 (사용자 지적). setMini 가 펼친 뒤 여백(view.lgInset)을 바로 잰다
    const tabs = view.leaf && view.leaf.parent && view.leaf.parent.containerEl;
    if (tabs && tabs.classList.contains("lg-mini") && this.activeLeafOf(tabs) === view.leaf) {
      view.lgMiniY = 0;
      this.setMini(tabs, false);
    }
    const inset = view.lgInset;
    if (!wv || !inset || !view.webviewMounted || !wv.isConnected) return;
    try {
      const remote = window.require ? window.require("electron").remote : undefined;
      const wc = remote && typeof wv.getWebContentsId === "function" && remote.webContents.fromId(wv.getWebContentsId());
      const frame = wc && wc.mainFrame;
      if (!frame) return;
      frame.executeJavaScript(WEB_PAGE_SCRIPT.replace("__LG_INSET__", String(inset)).replace("__LG_ANIM__", "0").replace("__LG_SENT__", String(Date.now()))).catch(() => {});
    } catch {
      // dom-ready 때 다시 넣는다
    }
  },

  webInject(this: GlassShelfPlugin, view: View, force: boolean, anim = 0) {
    const wv = view.webview;
    const tabs = view.leaf && view.leaf.parent && view.leaf.parent.containerEl;
    const header = tabs && tabs.querySelector<HTMLElement>(":scope > .workspace-tab-header-container");
    if (!wv || !header || !view.webviewMounted || !wv.isConnected) return;
    const wr = wv.getBoundingClientRect();
    // 웹 뷰어 새 탭(빈 화면)에서 주소를 넣어 이동하면 페이지가 준비될 때 웹 화면이 아직 숨어 있어(높이 0) 여백을 못 넣었다 (사용자 지적).
    // 보일 때까지 잠깐씩 다시 해 본다
    window.clearTimeout(view.lgInjectTimer);
    if (!wr.height) {
      const tries = (view.lgInjectTries || 0) + 1;
      view.lgInjectTries = tries;
      if (tries <= 40) view.lgInjectTimer = window.setTimeout(() => this.webInject(view, true), 150);
      return;
    }
    view.lgInjectTries = 0;
    // 탭 줄 칸이 아니라 유리 띠(.lg-slab) 밑변에 맞춘다: 칸은 띠보다 1px 길어, 페이지 고정 막대가 띠 아래 1px 떨어져 보였다 (사용자 지적)
    const band = header.querySelector<HTMLElement>(".lg-slab") || header;
    const inset = Math.max(0, Math.round(band.getBoundingClientRect().bottom - wr.top));
    if (!force && view.lgInset === inset) return;
    if (view.lgInset != null && view.lgInset !== inset) view.lgMiniSkip = true;
    view.lgInset = inset;
    try {
      wv.executeJavaScript(WEB_PAGE_SCRIPT.replace("__LG_INSET__", String(inset)).replace("__LG_ANIM__", String(anim)).replace("__LG_SENT__", String(Date.now()))).then(() => this.webReadTint(view), () => {});
    } catch (err) {
      console.error("[glass-shelf] web inset", err);
    }
  },

  // 탭 줄 유리판 색: 이 탭 묶음에서 지금 보이는 탭이 이 웹 뷰어일 때만
  webTint(this: GlassShelfPlugin, view: View) {
    const leaf = view.leaf;
    const tabs = leaf && leaf.parent && leaf.parent.containerEl;
    if (!tabs || this.activeLeafOf(tabs) !== leaf) return;
    // 다크 모드면 페이지 배경색에 검정을 조금 섞는다 (사용자 요청)
    const dark = tabs.ownerDocument.body.classList.contains("theme-dark");
    // 새 탭(빈 화면)은 웹 페이지가 아니라 Obsidian 화면이므로 칠하지 않는다. 뒤의 빈 웹 화면(about:blank) 흰색을 읽어
    // 탭 줄 버튼·경로·선택 탭이 회색 유리로 바뀌었다 (사용자 지적)
    const tint = view.mode === "webview" ? view.lgTint : null;
    const L0 = tint && dark ? colorLightness(tint, tabs.ownerDocument) : null;
    const k = L0 == null ? 0 : WEB_DARK_DIM * Math.min(1, Math.max(0, (L0 - WEB_DARK_DIM_FROM) / (1 - WEB_DARK_DIM_FROM)));
    const c = k > 0 ? colorDim(tint, k, tabs.ownerDocument) : tint;
    if (c) tabs.setCssProps({ "--lg-web-tint": c });
    tabs.classList.toggle("lg-web-tinted", !!c);
    // 유리 세트: 대표 색 밝기에 따라 라이트·다크 유리 값을 섞는다 (모드와 상관없이, 사용자 요청). 라이트 유리의 흰 반사광이
    // 어두운 색 위에서 너무 밝게 떴고, 둘 중 하나로 바꾸면 중간 밝기 색에서 어색했다. OKLab 명도 GLASS_MIX_LO 이하는 다크,
    // GLASS_MIX_HI 이상은 라이트, 그 사이는 명도에 비례해 섞는다
    const header = tabs.querySelector<HTMLElement>(":scope > .workspace-tab-header-container");
    const L = c ? colorLightness(c, tabs.ownerDocument) : null;
    if (header) {
      header.classList.toggle("lg-glass-mix", L != null);
      const t = L != null ? Math.round(Math.min(1, Math.max(0, (GLASS_MIX_HI - L) / (GLASS_MIX_HI - GLASS_MIX_LO))) * 1000) / 1000 : 0;
      if (L != null) header.setCssProps({ "--lg-glass-t": String(t) });
      else header.style.removeProperty("--lg-glass-t");
      // 밝기 곡선(필터라 섞을 수 없다)은 다크 쪽이 많으면 다크 곡선 (.lg-glass-dk, 테마). 라이트 곡선은 어두운 페이지 위에서
      // 알약 가장자리를 밝혀 흰 테두리처럼 보였다 (사용자 지적)
      header.classList.toggle("lg-glass-dk", L != null && t >= 0.5);
    }
  },

  // 색을 칠한 웹 탭 줄에서 연 메뉴·주소 카드·주소 제안도 같은 색 유리로 (사용자 요청). from 이 그 탭 줄이나 이미 칠한 팝업 안에 있으면
  // 탭 줄의 색(--lg-web-tint)과 유리 섞기 비율(--lg-glass-t)을 el 에 옮긴다. 팝업은 body 에 붙어 탭 줄 변수를 물려받지 못한다
  webPopTint(this: GlassShelfPlugin, el: HTMLElement, from: unknown) {
    if (!isEl(from)) return;
    let tint = "", t = "";
    const pop = from.closest<HTMLElement>(".lg-web-pop");
    if (pop) {
      tint = pop.style.getPropertyValue("--lg-web-tint");
      t = pop.style.getPropertyValue("--lg-glass-t");
    } else {
      const tabs = from.closest<HTMLElement>(".mod-root .workspace-tabs.lg-web-tinted");
      if (!tabs) return;
      const header = tabs.querySelector<HTMLElement>(":scope > .workspace-tab-header-container");
      tint = tabs.style.getPropertyValue("--lg-web-tint");
      t = header ? header.style.getPropertyValue("--lg-glass-t") : "";
    }
    if (!tint) return;
    el.classList.add("lg-web-pop", "lg-glass-mix");
    el.classList.toggle("lg-glass-dk", parseFloat(t || "0") >= 0.5);
    el.setCssProps({ "--lg-web-tint": tint, "--lg-glass-t": t || "0" });
  },

  // 설정을 켜고 끌 때: 끄면 페이지 여백·탭 줄 색을 되돌리고, 켜면 다음 갱신 때 다시 넣는다
  webReset(this: GlassShelfPlugin, on: boolean) {
    if (!on) this.webUninject();
    this.app.workspace.iterateAllLeaves((leaf) => {
      if (isWebView(leaf.view)) leaf.view.lgInset = null;
    });
    for (const doc of this.docs) {
      if (!doc.body) continue;
      doc.querySelectorAll<HTMLElement>(".lg-web-tinted").forEach((el: HTMLElement) => el.classList.remove("lg-web-tinted"));
      doc.querySelectorAll<HTMLElement>(".mod-root .lg-glass-mix").forEach((el: HTMLElement) => { el.classList.remove("lg-glass-mix", "lg-glass-dk"); el.style.removeProperty("--lg-glass-t"); });
    }
  },

  // 끌 때: 페이지에 넣은 여백과 내린 헤더를 되돌린다
  webUninject(this: GlassShelfPlugin) {
    this.app.workspace.iterateAllLeaves((leaf) => {
      const wv = isWebView(leaf.view) && leaf.view.webview;
      if (!wv || !leaf.view.webviewMounted) return;
      try {
        wv.executeJavaScript("window.__lgInset = 0; window.__lgGS && window.__lgGS(true);").catch(() => {});
      } catch {
        /* 이미 닫힌 페이지 */
      }
    });
  },
};