import { Platform } from "obsidian";
import { INJECTED, els, tgPad, newEl } from "./util";
import { EASE, HOVER_ICON, RIPPLE_K, RIPPLE_HOLD, PRESS_PILL, PRESS_GROUP, GROUP_PRESS_K, MOBILE_PRESS_POP, MOBILE_PRESS_PILL, MOBILE_PRESS_BTN } from "./constants";
import { CAN_REFRACT, HOVER_REFRACT, LENS_TOGGLE, LENS_SLIDER, PRESS_WHITE, PRESS_IMG } from "./refract";
import { SL_SHADOW_A, SL_SQUASH, SL_STOP_MS, SL_SQUASH_MOVING, SL_SQUASH_Y, SL_SQUASH_Y_STOP, SL_STOP_MIN, SL_STOP_IN_S, SL_SETTLE_S, lensMotion, LENS_CLEAR_K, LENS_TG_TALL, TAB_PRESS_K } from "./lens";
import type { GlassShelfPlugin } from "./host";

export const pressMethods = {
  // 설정 창 검색창 굴절 (사용자 요청). 설정 창은 별도 창으로도 떠서 refresh() 가 보지 않으므로 창마다 따로 건다.
  // 이미 걸려 있으면 attach 가 바로 돌아온다
  modalRefract(this: GlassShelfPlugin, doc: Document) {
    if (!this.refractOn() || !doc.body) return;
    doc.querySelectorAll<HTMLElement>(".modal.mod-settings .setting-search-container input").forEach((el: HTMLElement) => this.refractor.attach(el, 26, false));
  },

  // 아이콘 버튼의 호버 유리 (사용자 요청): 버튼마다 ::before 를 쓰지 않고, 문서에 둘뿐인 요소(.lg-hover-glass)를 커서가 올라간 버튼 맨 앞에 넣는다.
  // 호버는 한 번에 한 버튼에만 보이므로, 비게 된 ::before 를 알약 링 그림자에 쓴다(테마). 보이고 사라지는 것은 테마의 :hover 규칙이 맡고,
  // 둘을 번갈아 써서 옆 버튼으로 옮겨 갈 때 떠나는 버튼의 유리가 흐려지는 중에 빼앗기지 않게 한다
  hoverGlassInto(this: GlassShelfPlugin, el: HTMLElement): HTMLElement | null {
    if (Platform.isMobile || !el.matches(HOVER_ICON)) return null;
    const have = el.querySelector<HTMLElement>(":scope > .lg-hover-glass");
    if (have) return have;
    const doc = el.ownerDocument;
    if (!doc.lgHoverPool) {
      doc.lgHoverPool = [0, 1].map(() => {
        const g = newEl(doc, "span");
        g.className = `lg-hover-glass ${INJECTED}`;
        g.setAttribute("aria-hidden", "true");
        return g;
      });
      this.register(() => {
        doc.lgHoverPool?.forEach((g) => g.remove());
        doc.lgHoverPool = undefined;
      });
    }
    // 더 오래전에 쓴 것을 가져온다 (맨 뒤로 보낸다)
    const pool = doc.lgHoverPool;
    const g = pool.shift();
    pool.push(g);
    el.prepend(g);
    return g;
  },

  // 단독 원형 버튼: 유리 층이 흰색으로 바뀌며 커졌다가 제자리로
  // 흰색 피크 동안 호버 유리를 거의 투명하게 해 흰 빛이 가려지지 않게 한다
  fadeHover(this: GlassShelfPlugin, el: HTMLElement, opt: KeyframeAnimationOptions) {
    const frames = [
      { offset: 0.2, opacity: 0.08 },
      { offset: 0.55, opacity: 0.08 },
    ];
    const g = el.querySelector<HTMLElement>(":scope > .lg-hover-glass");
    if (g) return g.animate(frames, opt);
    return el.animate(frames, { ...opt, pseudoElement: "::before" });
  },

  // k: 가장 클 때 배율 (기본 1.28)
  pressPop(this: GlassShelfPlugin, el: HTMLElement, k = 1.28) {
    try {
      const hover = this.fadeHover(el, { duration: 600, easing: EASE.press });
      // 가운데쯤 흰 원이 되어 잠깐(약 0.08초) 머문다 (광택은 사라지고 테두리는 남는다)
      const pop = el.animate(
        [
          { offset: 0.34, transform: `scale(${k})`, backgroundColor: PRESS_WHITE, backgroundImage: PRESS_IMG },
          { offset: 0.46, transform: `scale(${k})`, backgroundColor: PRESS_WHITE, backgroundImage: PRESS_IMG },
        ],
        { duration: 600, easing: EASE.press, pseudoElement: "::after" }
      );
      return [hover, pop];
    } catch (err) {
      console.error("[glass-shelf] pop", err);
      return [];
    }
  },

  // pressPop 과 같은 값인데 유리가 요소 자체에 있는 버튼용. 누를 때 작아지는 transform 과 겹치지 않게 scale 속성으로 건다
  pressPopSelf(this: GlassShelfPlugin, el: HTMLElement, k = 1.28) {
    try {
      this.fadeHover(el, { duration: 600, easing: EASE.press });
      const peak = { scale: String(k), backgroundColor: PRESS_WHITE, backgroundImage: PRESS_IMG };
      el.animate([{ offset: 0.34, ...peak }, { offset: 0.46, ...peak }], { duration: 600, easing: EASE.press });
    } catch (err) {
      console.error("[glass-shelf] pop-self", err);
    }
  },

  // 패널 토글은 누르면 패널과 함께 가려지고 다른 자리의 토글이 나타난다.
  // 누른 버튼이 가려지면, 새로 보이는 같은 쪽 토글이 흰 빛 효과를 같은 진행 시점부터 이어받는다
  handoffPop(this: GlassShelfPlugin, el: HTMLElement, anims: (Animation | null)[]) {
    const doc = el.ownerDocument;
    const win = doc.defaultView || window;
    const t0 = win.performance.now();
    const side = el.closest<HTMLElement>(".sidebar-toggle-button.mod-left, .lg-panel-toggle-left") ? "left" : "right";
    const sel =
      side === "left"
        ? ".sidebar-toggle-button.mod-left .clickable-icon, .lg-panel-toggle-left"
        : ".sidebar-toggle-button.mod-right .clickable-icon, .lg-panel-toggle:not(.lg-panel-toggle-left)";
    const shown = (n: HTMLElement) => n.isConnected && n.getClientRects().length > 0 && !n.closest<HTMLElement>(".is-sidedock-collapsed");
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
      const next = els(doc.querySelectorAll<HTMLElement>(sel)).find((n) => n !== el && shown(n));
      if (!next) return win.requestAnimationFrame(tick);
      anims.forEach((a) => a && a.cancel());
      // 왼쪽 리본에 나타난 토글은 흰 빛을 이어받지 않는다 (사용자 요청: 누른 버튼에서만 보이게)
      if (next.closest<HTMLElement>(".workspace-ribbon")) return;
      this.pressPop(next).forEach((a) => a && (a.currentTime = t));
    };
    win.requestAnimationFrame(tick);
  },

  // 누른 버튼이 든 컨테이너 알약이 통째로 커졌다가 돌아온다 (알약이 클수록 조금만)
  pressScale(this: GlassShelfPlugin, el: HTMLElement) {
    try {
      const pill = el.closest<HTMLElement>(PRESS_PILL);
      if (!pill) return;
      // 목록 방식 패널의 탭은 누름 효과가 없다 (사용자 요청)
      if (el.matches(".workspace-tab-header") && el.closest(".lg-tab-list")) return;
      const r = pill.getBoundingClientRect();
      // 효과 없음 모드의 패널 탭은 다른 알약과 같은 값으로 커지고 하얘진다 (사용자 요청)
      const tab = el.matches(".workspace-tab-header") && !this.tabPlain();
      // 패널 탭 줄은 커지는 정도를 TAB_PRESS_K 배로, 버튼 묶음 알약은 GROUP_PRESS_K 배로 줄인다 (사용자 요청)
      const group = pill.matches(PRESS_GROUP);
      const k = 1 + Math.min(0.2, 16 / Math.max(r.width, r.height, 1)) * (tab ? TAB_PRESS_K : group ? GROUP_PRESS_K : 1);
      const opt = { duration: 570, easing: EASE.press };
      pill.animate([{ offset: 0.34, scale: k.toFixed(3) }, { offset: 0.46, scale: k.toFixed(3) }], opt);
      // 패널 탭은 커졌다 줄어들기만 한다 (흰 빛 없음)
      if (tab) return;
      this.fadeHover(el, opt);
      // 알약 전체를 흰색으로 칠하던 것은 뺐다: 누른 버튼과 그 근처만 밝아지게 (사용자 요청). 그 빛은 pressRipple 이 그린다
    } catch (err) {
      console.error("[glass-shelf] scale", err);
    }
  },

  // 알약 버튼 하나를 누름: 크기에 맞춰 조금 커지고(최대 20%, 16px 만큼) 가장 클 때 하얘졌다 돌아온다
  pressPill(this: GlassShelfPlugin, btn: HTMLElement) {
    try {
      const r = btn.getBoundingClientRect();
      const k = (1 + Math.min(0.2, 16 / Math.max(r.width, r.height, 1))).toFixed(3);
      const peak = { scale: k, backgroundColor: PRESS_WHITE, backgroundImage: PRESS_IMG };
      btn.animate([{ offset: 0.34, ...peak }, { offset: 0.46, ...peak }], { duration: 570, easing: EASE.press });
    } catch (err) {
      console.error("[glass-shelf] press-pill", err);
    }
  },

  // 모바일: 누른 곳이 원형 버튼이면 버튼을, 알약 안 버튼이면 알약을 통째로 키우고 가장 클 때 하얗게 한다. 효과를 걸었으면 true
  pressMobile(this: GlassShelfPlugin, t: HTMLElement) {
    try {
      let el = t.closest<HTMLElement>(MOBILE_PRESS_POP);
      let k = 1.28;
      let white = true;
      let dur = 600;
      if (!el) {
        const btn = t.closest<HTMLElement>(MOBILE_PRESS_BTN);
        el = btn && btn.closest<HTMLElement>(MOBILE_PRESS_PILL);
        if (!el) return false;
        const r = el.getBoundingClientRect();
        k = 1 + Math.min(0.2, 16 / Math.max(r.width, r.height, 1));
        white = !el.matches(".workspace-drawer-tab-options-list") || this.tabPlain();
        dur = 570;
      }
      // 설정 창 뒤로 버튼은 누르는 순간 커지며 사라진다 (backGhost)
      if (el.matches(".modal-setting-back-button")) {
        this.backGhost(el, k);
        return true;
      }
      const peak = { scale: k.toFixed(3) };
      if (white) Object.assign(peak, { backgroundColor: PRESS_WHITE, backgroundImage: PRESS_IMG });
      el.animate([Object.assign({ offset: 0.34 }, peak), Object.assign({ offset: 0.46 }, peak)], {
        duration: dur,
        easing: EASE.press,
      });
      return true;
    } catch (err) {
      console.error("[glass-shelf] press-mobile", err);
      return false;
    }
  },

  // 설정 창 뒤로 버튼: 누르면 Obsidian 이 목록으로 돌아가며 버튼을 바로 숨겨, 누름 효과가 중간에 뚝 끊기고 사라졌다 (사용자 지적).
  // 누르는 순간 그 자리에 같은 모양의 사본을 띄워 커지며 흐려지게 하고(사용자 요청), 원래 버튼은 그동안 투명하게 둔다.
  // 버튼이 숨지 않고 남아 있으면(누름이 취소되는 등) 0.6초 뒤 다시 보인다
  backGhost(this: GlassShelfPlugin, el: HTMLElement, k: number) {
    const doc = el.ownerDocument;
    const win = doc.defaultView || window;
    const r = el.getBoundingClientRect();
    const g = el.cloneNode(true) as HTMLElement;
    g.removeAttribute("id");
    g.classList.add("lg-back-ghost");
    g.setCssProps({ "--lg-gx": `${r.left}px`, "--lg-gy": `${r.top}px`, "--lg-gw": `${r.width}px`, "--lg-gh": `${r.height}px` });
    doc.body.appendChild(g);
    el.classList.add("lg-back-hidden");
    g.animate([{ scale: "1", opacity: 1 }, { scale: Number(k).toFixed(3), opacity: 0 }], { duration: 260, easing: "cubic-bezier(0.2, 0, 0.2, 1)", fill: "forwards" }).onfinish = () => g.remove();
    win.setTimeout(() => {
      g.remove();
      el.classList.remove("lg-back-hidden");
    }, 600);
  },

  // 검색 탭 검색창: 안의 내용까지 통째로 커졌다 돌아오고, 누른 자리 근처만 하얘진다
  pressField(this: GlassShelfPlugin, el: HTMLElement, e: MouseEvent) {
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
  },

  // 알약 안 버튼: 누른 자리에서 흰 그라데이션이 퍼지며 사라진다
  // size: 흰 빛 지름 (없으면 알약 높이 × RIPPLE_K), cls: 덧붙일 클래스,
  // hold: 지름을 줘도 가장 밝은 채로 퍼지는 구간을 둔다, from: 처음 크기(지름 대비, 기본 0)
  pressRipple(this: GlassShelfPlugin, btn: HTMLElement, e: MouseEvent, size?: number, cls?: string, hold = false, from: number | string = 0) {
    const el = btn.closest<HTMLElement>(PRESS_PILL) || btn;
    const doc = el.ownerDocument;
    const r = el.getBoundingClientRect();
    // 기본 지름은 알약 높이 기준 (예전엔 긴 변의 2.2배라 긴 알약은 끝까지 다 하얘졌다, 사용자 요청으로 줄임)
    const d = size || r.height * RIPPLE_K;
    const wrap = newEl(doc, "span");
    wrap.className = cls ? `lg-ripple ${cls}` : "lg-ripple";
    const dot = newEl(doc, "span");
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
  },

  // 할 일 체크박스 애니메이션. elapsed 는 이미 지난 시간(ms): 체크박스가 새로 그려져 바뀐 경우 이어서 재생한다.
  // 사용자가 보낸 iPadOS 영상(60fps로 잘라 봄)을 따라 했다:
  // - 켤 때: 노란 원이 80ms 동안 나타나며 호버 유리를 덮어(유리는 80ms 에 사라짐) 유리가 노랗게 물드는 것처럼 보이고,
  //   이어서 체크가 왼쪽부터 180ms 동안 그려진다(--lg-task-wipe). 체크된 호버면 그 사이 원이 커지고 빛난다(CSS, 80ms 뒤 시작)
  // - 끌 때: 노란 원(체크)이 40ms 만에 사라지고, 노란 링이 160ms 동안 사라진다(호버 중이면 투명, 아니면 회색 링으로).
  //   링이 사라지기 시작할 때 호버 유리가 함께 나타난다 (CSS: .lg-task-hold 동안 호버 유리를 숨긴다)
  // - 링 모양(설정): 켤 때 링이 색으로 바뀌며 안쪽 원이 가운데서 커져 나온다
  // 링 색(--lg-task-ring) CSS 전환은 애니메이션 동안 끈다 (전환이 애니메이션보다 우선이라).
  // 모든 애니메이션은 끝 상태로 멈춰 있다가, 다 끝나면 한 번에 걷어 낸다
  animateTask(this: GlassShelfPlugin, cb: HTMLElement, on: boolean, elapsed: number, hov: boolean) {
    const win = cb.ownerDocument.defaultView || window;
    // 칸반 카드의 체크박스는 설정과 상관없이 늘 링 모양 (테마 Kanban 연동)
    const ring = cb.ownerDocument.body.classList.contains("lg-task-ring") || !!cb.closest<HTMLElement>(".kanban-plugin, .kanban-plugin__drag-container");
    if (cb.lgTaskAnims) for (const a of cb.lgTaskAnims) a.cancel();
    cb.classList.add("lg-task-anim");
    const hovered = hov != null ? hov : cb.matches(":hover");
    const cs = win.getComputedStyle(cb);
    const color = cs.getPropertyValue("--lg-task-color").trim();
    const border = cs.getPropertyValue("--lg-task-border").trim();
    // 호버 중이면 링은 숨어 있다(투명). 아니면 회색 링
    const bare = hovered ? "transparent" : border;
    const ringAnim = (frames: (string | { c: string; o: number })[], opt: KeyframeAnimationOptions) => cb.animate(frames.map((c): Keyframe => (typeof c === "string" ? { "--lg-task-ring": c } : { "--lg-task-ring": c.c, offset: c.o })), opt);
    const anims: Animation[] = [];
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
  },

  // 토글 손잡이 애니메이션: 탭 렌즈와 같은 곡선으로 이동하며 가운데서 통통한 유리 렌즈가 된다
  animateToggle(this: GlassShelfPlugin, c: HTMLElement) {
    const doc = c.ownerDocument;
    const win = doc.defaultView || window;
    const cs = win.getComputedStyle(c);
    const W = c.clientWidth;
    const H = c.getBoundingClientRect().height;
    const pad = tgPad(cs, win);
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

    const frames: Keyframe[] = [];
    const N = 24;
    for (let i = 0; i <= N; i++) {
      const u = i / N;
      // 이동 거리가 짧으니 늘어남은 약하게
      const m = lensMotion(u, 0.35);
      const x = x0 + (x1 - x0) * m.ease;
      const puff = 1 + 0.5 * m.g; // 가장 커질 때 약 1.5배(늘어남 포함 약 1.76배, 테마 상자 배율 1.75·1.8 근처)
      const sx = puff * (1 + m.d);
      const g = m.g;
      // 모바일은 렌즈를 위아래로 키울 때 높이(height·top) 대신 같은 양만큼 세로 배율로 키운다. 높이를 바꾸면 매 프레임 배치를 다시 계산해,
      // 카드가 수백 장인 휴대폰 커뮤니티 창에서 토글을 누를 때 창 머리(제목·X)가 한 프레임씩 사라졌다 (실기기 녹화로 확인, 원인은 추정).
      // 모서리는 그만큼 살짝 늘어난다
      const sy = puff * (1 - m.d * 0.7) * (Platform.isMobile ? (th + LENS_TG_TALL * g) / th : 1);
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
        boxShadow: lensShadow ? lensShadow.replace(/\/\s*([\d.]+)\s*\)/g, (m: string, v: string) => `/ ${(parseFloat(v) * g).toFixed(3)})`) : "none",
        backgroundImage: sheen,
        backdropFilter: backdrop,
        webkitBackdropFilter: backdrop,
      });
    }

    if (Platform.isMobile) for (const f of frames) { delete f.height; delete f.top; }
    // 모바일은 렌즈 그림자를 애니메이션하지 않는다: 매 프레임 바뀌는 넓은 그림자가 화면을 다시 그리게 해, 휴대폰 커뮤니티 창에서 토글을 누를 때
    // 위쪽 버튼들이 깜빡였다 (사용자 지적, 그림자만 뺀 시험에서 거의 사라짐을 사용자가 확인). 굴절·채움·모양 변화는 그대로다
    if (Platform.isMobile) for (const f of frames) delete f.boxShadow;
    const anim = c.animate(frames, { duration: 320, easing: "linear", pseudoElement: "::after" });
    const done = () => c.classList.remove("lg-tg-anim");
    anim.onfinish = done;
    anim.oncancel = done;
  },

  // 슬라이더 렌즈: 누르는 동안 손잡이를 숨기고 그 자리에 토글 렌즈와 같은 유리 렌즈를 띄운다.
  // 손잡이(::-webkit-slider-thumb)에는 backdrop-filter 굴절이 먹지 않아서 문서에 따로 띄운다.
  // 상자는 K 배 크게 그리고 줄여 보인다 (작게 그린 것을 키우면 테두리가 뿌옇다). 값이 바뀌면 syncSlider 가 place 를 부른다
  sliderLens(this: GlassShelfPlugin, el: HTMLElement) {
    if (el.lgLens) return;
    const doc = el.ownerDocument;
    const win = doc.defaultView || window;
    const cs = win.getComputedStyle(el);
    const tw = parseFloat(cs.getPropertyValue("--lg-sl-tw")) || 26;
    const th = parseFloat(cs.getPropertyValue("--lg-sl-th")) || 16;
    const K = parseFloat(cs.getPropertyValue("--lg-tg-k")) || 1;
    const w = Math.round(tw * K);
    const h = Math.round(th * K);
    const lens = newEl(doc, "div");
    lens.className = "lg-sl-lens " + INJECTED; // 누른 채 플러그인을 끄면 남지 않게 정리 대상에 넣는다 (검토 지적)
    lens.style.width = `${w}px`;
    lens.style.height = `${h}px`;
    const rx = parseFloat(cs.getPropertyValue("--lg-pill-rx")) || 0.5;
    lens.style.borderRadius = `${(h * rx).toFixed(2)}px / ${(h / 2).toFixed(2)}px`;
    let backdrop = "brightness(1.06)";
    if (this.refractOn()) backdrop = `url(#${this.refractor.filterFor(w, h, 42, false, true, doc, undefined, undefined, LENS_SLIDER)}) ${backdrop}`;
    lens.style.backdropFilter = backdrop;
    lens.style.setProperty("-webkit-backdrop-filter", backdrop);
    // 찌부: 끄는 동안 가로로 일정하게(SL_SQUASH) 양쪽으로 늘고 세로로 조금(SL_SQUASH_Y 배) 눌린다.
    // 멈추면 앞쪽 끝(오른쪽으로 끌었으면 오른쪽)이 먼저 서고, 뒤쪽 끝만 관성으로 앞으로 밀려 제자리를 지나 줄어든 뒤(일정한 속도), 부드럽게 제자리로 돌아온다.
    // scale·translate 속성이라 렌즈가 커지는 애니메이션(transform)과 따로 곱해진다
    const visW = w * (1.32 / K); // 다 커진 렌즈의 보이는 폭
    const squash: { x: number | null; t: number; v: number; dir: number; k: number; k0: number; stop: number; raf: number; anchor: number } = { x: null, t: 0, v: 0, dir: 1, k: 0, k0: 0, stop: 0, raf: 0, anchor: 0 };
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
    if (last >= 0) parts[last] = parts[last].replace(/\/\s*([\d.]+)\s*\)/, (m: string, a: string) => `/ ${(parseFloat(a) * SL_SHADOW_A).toFixed(3)})`);
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
    const state: { place: () => void; off?: () => void } = { place };
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
  },

  // 호버 유리의 모양(아이콘은 높이만 한 원, 글자는 요소 크기)에 맞춘 굴절 필터
  // 굴절: 설정이 켜져 있고 이 기기가 쓸 수 있을 때
  refractOn(this: GlassShelfPlugin) {
    return !!this.settings.refraction && CAN_REFRACT;
  },

  // 창 제어 알약(작게 모드): 크기가 바뀐 뒤에 굴절을 다시 구우면 커지는 동안 굴절이 없다가 다 커진 뒤에 생긴다.
  // 그래서 큰 크기·작은 크기 두 지도를 정해진 크기로 걸어 두고, 커서가 들어오는 순간 큰 지도로, 다 줄어든 뒤 작은 지도로 바꾼다.
  // 크기는 테마 변수(--lg-wc-w, --lg-pill-h, --lg-wc-k)를 임시 요소로 재서 얻는다
  wcRefract(this: GlassShelfPlugin, doc: Document, big: boolean) {
    const el = doc.querySelector<HTMLElement>(".titlebar-button-container.mod-right");
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
  },

  refractHover(this: GlassShelfPlugin, el: HTMLElement) {
    if (!this.refractOn()) return;
    const win = el.ownerDocument.defaultView || window;
    // 아이콘 버튼은 호버 유리 요소, 나머지(패널 탭·창 버튼·보관함 전환)는 ::before
    const g = this.hoverGlassInto(el);
    const cs = g ? win.getComputedStyle(g) : win.getComputedStyle(el, "::before");
    const w = Math.round(parseFloat(cs.width));
    const h = Math.round(parseFloat(cs.height));
    if (!(w >= 4 && h >= 4)) return;
    // 호버 유리는 굴절 폭을 좁게, 색수차 없음 (값은 HOVER_REFRACT, 렌즈 조율기 "호버 유리")
    const id = this.refractor.filterFor(w, h, HOVER_REFRACT.strength, false, false, el.ownerDocument, HOVER_REFRACT.bezel, HOVER_REFRACT.spread, undefined, HOVER_REFRACT.bezelMax);
    el.style.setProperty("--lg-refract-h", `url(#${id})`);
  },
};