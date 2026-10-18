import { els, unitVec } from "./util";
import { MORPH_DASH, MORPH_OVERSHOOT, MORPH_NUDGE, EASE, KB_PILL_DOT, KB_DASH_MS } from "./constants";
import type { GlassShelfPlugin } from "./host";
import type { Box } from "./internal";

// 상자 모핑의 한 장면: 상자(없으면 모서리만), 모서리, 시점, 곡선
export interface MorphFrame {
  box?: Box;
  radius?: number;
  offset?: number;
  easing?: string;
}
// 상자 안에서 제자리에 머무는 내용과 붙어 있는 쪽
export interface MorphKid {
  el: HTMLElement;
  anchor: "left" | "right";
  // true: 반대로 옮기기를 translate 대신 여백(margin)으로 한다. 상자(left·width 등)는 메인 스레드에서, translate 는 합성기에서
  // 따로 돌아, 메인 스레드가 바쁜 프레임(Bases 메뉴)마다 상자와 안 내용이 어긋나 좌우로 오락가락했다 (사용자 녹화 지적).
  // 여백은 상자와 같은 프레임에 같이 계산된다
  layout?: boolean;
}

export const morphMethods = {
  // 창이 작은 동안 안의 내용이 따라 줄지 않게 크기를 잠시 고정한다
  pinSize(this: GlassShelfPlugin, el: HTMLElement) {
    el.style.width = `${el.offsetWidth}px`;
    el.style.height = `${el.offsetHeight}px`;
    el.classList.add("lg-pinned");
  },

  unpinSize(this: GlassShelfPlugin, el: HTMLElement) {
    el.style.removeProperty("width");
    el.style.removeProperty("height");
    el.classList.remove("lg-pinned");
  },

  // 돌진한 버튼이 사라지는 지점의 작은 원 (버튼 높이의 60%)
  dotAt(this: GlassShelfPlugin, x: number, y: number, h: number): Box {
    const d = h * 0.6;
    return { left: x - d / 2, top: y - d / 2, width: d, height: d, radius: d / 2 };
  },

  // 상자(left·top·width·height·모서리)를 from → to 로 바꾼다. 안의 내용(kids)은 keep 상자 기준 자리에
  // 머물도록 반대로 옮긴다 (anchor: 내용이 붙어 있는 쪽, left 또는 right)
  // 상자(left·top·width·height·모서리)를 frames 대로 바꾼다. frames: [{ box, radius?, offset?, easing? }]
  // (box 가 없으면 모서리만). 안의 내용(kids)은 keep 상자 기준 자리에 머물도록 반대로 옮긴다
  // (anchor: 내용이 붙어 있는 쪽, left 또는 right)
  boxMorph(this: GlassShelfPlugin, el: HTMLElement, kids: MorphKid[], frames: MorphFrame[], keep: Box, opt: KeyframeAnimationOptions): Animation {
    const meta = (fr: MorphFrame, k: Keyframe): Keyframe => {
      if (fr.offset != null) k.offset = fr.offset;
      if (fr.easing) k.easing = fr.easing;
      return k;
    };
    const anim = el.animate(
      frames.map((fr) => {
        const k: Keyframe = {};
        if (fr.box) {
          k.left = `${fr.box.left}px`;
          k.top = `${fr.box.top}px`;
          k.width = `${fr.box.width}px`;
          k.height = `${fr.box.height}px`;
        }
        const r = fr.radius != null ? fr.radius : fr.box && fr.box.radius;
        if (r != null) k.borderRadius = `${r}px`;
        return meta(fr, k);
      }),
      opt
    );
    for (const kid of kids) {
      const ax = (x: Box) => (kid.anchor === "right" ? x.left + x.width : x.left);
      kid.el.animate(
        frames.map((fr) =>
          meta(
            fr,
            !fr.box
              ? {}
              : kid.layout
                ? { marginLeft: `${ax(keep) - ax(fr.box)}px`, marginTop: `${keep.top - fr.box.top}px` }
                : { translate: `${ax(keep) - ax(fr.box)}px ${keep.top - fr.box.top}px` }
          )
        ),
        opt
      );
    }
    return anim;
  },

  // 작은 원(dot)에서 창(full)으로 넓어지며 나타난다. 넓어지는 도중엔 더 둥글다가 다 펼쳐지면 원래 곡률,
  // 살짝 지나친 크기에서 천천히 제 크기로 돌아온다. 좌표는 el 의 위치 기준 좌표계
  growBox(this: GlassShelfPlugin, el: HTMLElement, kids: MorphKid[], dot: Box, full: Box, delay: number): Animation {
    const grow = (p: "left" | "top" | "width" | "height") => full[p] + (full[p] - dot[p]) * 0.02;
    const over: Box = { left: grow("left"), top: grow("top"), width: grow("width"), height: grow("height") };
    const round = Math.min(full.width, full.height) / 2;
    const opt: KeyframeAnimationOptions = { duration: 300, delay, easing: "linear", fill: "backwards" }; // 420 → 300 (사용자 요청: 메뉴를 더 빠르게)
    el.animate([{ opacity: 0 }, { offset: 0.2, opacity: 1 }, { opacity: 1 }], opt);
    // 펼쳐지는 방향(작은 원 → 창 가운데)으로 창이 내용과 함께 MORPH_NUDGE 만큼 밀렸다가 제자리로
    const { ux, uy } = unitVec(dot.left + dot.width / 2, dot.top + dot.height / 2, full.left + full.width / 2, full.top + full.height / 2);
    el.animate(
      [
        { translate: "0 0", easing: EASE.burst },
        { offset: 0.42, translate: `${(ux * MORPH_NUDGE).toFixed(1)}px ${(uy * MORPH_NUDGE).toFixed(1)}px`, easing: EASE.ret },
        { translate: "0 0" },
      ],
      opt
    );
    return this.boxMorph(
      el,
      kids,
      [
        { box: dot, easing: EASE.burst },
        // 펼쳐지는 도중에 가장 둥글고, 다 펼쳐질 때(지나친 지점) 이미 원래 곡률
        { radius: round, offset: 0.18, easing: "cubic-bezier(0.3, 0, 0.5, 1)" },
        { box: over, radius: full.radius, offset: 0.42, easing: EASE.ret },
        { box: full },
      ],
      full,
      opt
    );
  },

  // 창(full)이 작은 원(dot)으로 줄며 사라진다 (반동 없이, 도중엔 더 둥글게)
  shrinkBox(this: GlassShelfPlugin, el: HTMLElement, kids: MorphKid[], full: Box, dot: Box): Animation {
    const round = Math.min(full.width, full.height) / 2;
    const opt: KeyframeAnimationOptions = { duration: 150, easing: EASE.exit, fill: "forwards" }; // 200 → 150 (사용자 요청)
    el.animate([{ opacity: 1 }, { offset: 0.7, opacity: 1 }, { opacity: 0 }], opt);
    return this.boxMorph(el, kids, [{ box: full }, { radius: round, offset: 0.45 }, { box: dot }], full, opt);
  },

  // 알약 버튼(가로가 긴 것)이 원이 되려면 유리 층을 양옆에서 얼마나 줄여야 하는지. 원형 버튼이면 0
  pillInset(this: GlassShelfPlugin, el: HTMLElement): number {
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    // 칸반 버튼 묶음은 높이는 그대로 두고 폭만 높이의 KB_PILL_DOT 배까지 줄인다 (사용자 요청: 좌우로만, 원이 될 때까지)
    if (el.matches(".lg-kb-group")) return (w - h * KB_PILL_DOT) / 2;
    return el.matches(".workspace-drawer-vault-switcher") && w > h * 1.3 ? (w - h) / 2 : 0;
  },

  // 버튼이 흐려지고 나타나는 효과. 요소 자체의 opacity 를 움직이면 그동안 요소가 뒤 화면을 떠 오는 경계(Backdrop Root)가 되어
  // 유리 층(::after)의 채움·색조·굴절이 꺼졌다가 애니메이션이 끝나야 돌아온다. 그래서 유리 층과 안의 내용에 따로 건다.
  // 유리 층이 없는 묶음(그래프 버튼들)은 그 안의 버튼마다 같은 방식으로 건다
  fadeParts(this: GlassShelfPlugin, el: HTMLElement, frames: Keyframe[], opt: KeyframeAnimationOptions) {
    if (el.lgFade) el.lgFade.forEach((a) => a.cancel());
    const win = el.ownerDocument.defaultView || window;
    const glassy = (n: Element) => win.getComputedStyle(n, "::after").backdropFilter !== "none";
    const anims: Animation[] = [];
    const walk = (n: Element, top: boolean) => {
      // 호버 유리 요소는 문서에 둘뿐이라 다른 버튼으로 옮겨 간다: 여기 건 애니메이션이 따라가 다음 버튼에서 아래쪽에서 끌려오듯 보였다 (사용자 지적)
      if (n.classList.contains("lg-hover-glass")) return;
      if (glassy(n)) {
        anims.push(n.animate(frames, { ...opt, pseudoElement: "::after" }));
        for (const c of n.children) walk(c, false);
      } else if (top) {
        for (const c of n.children) walk(c, false);
      } else {
        anims.push(n.animate(frames, opt));
      }
    };
    walk(el, true);
    el.lgFade = anims;
  },

  // 버튼이 (ux, uy) 방향으로 MORPH_DASH 만큼 움직이며 투명하게 사라진다 (사라진 채로 남는다)
  dashOut(this: GlassShelfPlugin, el: HTMLElement, ux: number, uy: number): Animation {
    const d = MORPH_DASH;
    // 사라진 동안 호버 유리를 띄우지 않게 알린다 (테마 .lg-dashed, dashBack 에서 뗀다)
    el.classList.add("lg-dashed");
    // 알약 버튼은 유리 층(::after)이 좌우로 줄어 원이 된다 (글자는 그대로)
    const c = this.pillInset(el);
    // 칸반 버튼 묶음은 좁아지는 모습이 보이게 천천히 줄고, 유리는 다 줄어든 뒤에 흐려진다(기호는 먼저 사라진다).
    // 보관함처럼 줄기와 흐려지기를 함께 하면 좁아지는 게 보이지 않았다 (사용자 지적)
    const slow = el.matches(".lg-kb-group");
    const dur = slow ? KB_DASH_MS : 160;
    if (el.lgGlassAnim) el.lgGlassAnim.cancel();
    el.lgGlassAnim = c
      ? el.animate([{ left: "0px", right: "0px" }, { left: `${c}px`, right: `${c}px` }], {
          duration: slow ? dur * 0.7 : dur,
          easing: "cubic-bezier(0.4, 0, 0.6, 1)",
          fill: "forwards",
          pseudoElement: "::after",
        })
      : null;
    const opt: KeyframeAnimationOptions = { duration: dur, easing: "cubic-bezier(0.4, 0, 0.6, 1)", fill: "forwards" };
    this.fadeParts(el, slow ? [{ opacity: 1 }, { offset: 0.7, opacity: 1 }, { opacity: 0 }] : [{ opacity: 1 }, { opacity: 0 }], opt);
    if (slow) {
      // 안의 기호는 좁아지는 유리 밖으로 삐져나오지 않게 먼저 사라진다 (다음 fadeParts 가 함께 걷어 내도록 목록에 넣는다)
      for (const k of el.children) el.lgFade?.push(k.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 90, easing: "ease-in", fill: "forwards" }));
    }
    // 숨긴 채 남은 투명도는 다음 fadeParts(dashBack·dashOut)가 걷어 낸다.
    // id 는 좌우 패널 투명의 구멍이 이 움직임을 따라가지 않게 알리는 표시 (acrylicHoles)
    const out = this.dashMove(el, [{ translate: "0 0" }, { translate: `${(ux * d).toFixed(1)}px ${(uy * d).toFixed(1)}px` }], opt);
    out.id = "lg-dash-out";
    return out;
  },

  // 사라졌던 버튼이 돌진했던 자리에서 나타나 제자리를 반대쪽으로 MORPH_OVERSHOOT 만큼 지나쳤다가 돌아온다
  dashBack(this: GlassShelfPlugin, el: HTMLElement, ux: number, uy: number, delay: number): Animation {
    const d = MORPH_DASH;
    el.classList.remove("lg-dashed");
    const o = MORPH_OVERSHOOT;
    // 알약 버튼은 원에서 좌우로 늘어나 제 폭을 조금 지나쳤다가 돌아온다
    if (el.lgGlassAnim) {
      el.lgGlassAnim.cancel();
      el.lgGlassAnim = null;
    }
    const c = this.pillInset(el);
    if (c) {
      el.animate(
        [
          { left: `${c}px`, right: `${c}px` },
          { offset: 0.6, left: "-2px", right: "-2px" },
          { left: "0px", right: "0px" },
        ],
        { duration: 360, delay, easing: "ease-out", fill: "backwards", pseudoElement: "::after" }
      );
    }
    const opt: KeyframeAnimationOptions = { duration: 360, delay, easing: "ease-out", fill: "backwards" };
    this.fadeParts(el, [{ opacity: 0 }, { offset: 0.3, opacity: 1 }, { opacity: 1 }], opt);
    const back = this.dashMove(
      el,
      [
        { translate: `${(ux * d).toFixed(1)}px ${(uy * d).toFixed(1)}px` },
        { offset: 0.6, translate: `${(-ux * o).toFixed(1)}px ${(-uy * o).toFixed(1)}px` },
        { translate: "0 0" },
      ],
      opt
    );
    back.id = "lg-dash-back";
    return back;
  },

  // 돌진 움직임
  dashMove(this: GlassShelfPlugin, el: HTMLElement, frames: Keyframe[], opt: KeyframeAnimationOptions): Animation {
    return el.animate(frames, opt);
  },

  // 그래프 설정 창: 설정 버튼(원)이 창의 오른쪽 위 꼭짓점. 버튼은 창 가운데를 향해 돌진하며 사라지고,
  // 둘 사이 중간 지점에서 창이 넓어져 나온다. 창 크기만 바뀌고 안의 내용은 제자리에 있다.
  // 창은 부모 안의 절대 위치라, 화면 좌표를 부모 기준 좌표로 바꿔 움직인다
  graphBoxes(this: GlassShelfPlugin, gc: HTMLElement, panel: DOMRect, btn: number) {
    const op = (gc.offsetParent as HTMLElement | null) || gc.parentElement || gc.ownerDocument.body;
    const o = op.getBoundingClientRect();
    const ox = o.left + op.clientLeft;
    const oy = o.top + op.clientTop;
    const win = gc.ownerDocument.defaultView || window;
    const radius = parseFloat(win.getComputedStyle(gc).borderTopLeftRadius) || btn / 2;
    const full: Box = { left: panel.left - ox, top: panel.top - oy, width: panel.width, height: panel.height, radius };
    // 설정 버튼 = 창의 오른쪽 위 꼭짓점 원
    const gx = panel.right - btn / 2;
    const gy = panel.top + btn / 2;
    const { ux, uy } = unitVec(gx, gy, panel.left + panel.width / 2, panel.top + panel.height / 2);
    const dot = this.dotAt(gx + ux * MORPH_DASH - ox, gy + uy * MORPH_DASH - oy, btn);
    return { full, dot, ux, uy };
  },

  // 창 안의 내용: 흐르는 부분(설정 묶음)은 왼쪽, 닫기·초기화 버튼은 오른쪽에 붙어 있다
  graphKids(this: GlassShelfPlugin, el: HTMLElement): MorphKid[] {
    return els(el.children).map((c): MorphKid => ({ el: c, anchor: c.classList.contains("graph-controls-button") ? "right" : "left" }));
  },

  graphOpen(this: GlassShelfPlugin, gc: HTMLElement | null) {
    if (!gc || !gc.parentElement) return;
    const parent = gc.parentElement;
    try {
      const doc = gc.ownerDocument;
      const win = doc.defaultView || window;
      const btn = parseFloat(win.getComputedStyle(doc.body).getPropertyValue("--lg-btn")) || 34;
      // 접힌 버튼들의 사본이 돌진하며 사라진다
      const ghost = gc.cloneNode(true) as HTMLElement;
      ghost.classList.add("lg-graph-ghost");
      parent.appendChild(ghost);
      win.setTimeout(() => ghost.remove(), 900);
      win.requestAnimationFrame(() => {
        if (gc.classList.contains("is-close")) return ghost.remove();
        const box = this.graphBoxes(gc, gc.getBoundingClientRect(), btn);
        this.dashOut(ghost, box.ux, box.uy).onfinish = () => ghost.remove();
        // 창이 좁아지는 동안 내용이 다시 줄바꿈되지 않게 폭을 잠시 고정한다
        const kids = this.graphKids(gc);
        const fixed = kids.filter((k) => k.anchor === "left").map((k) => {
          k.el.style.width = `${k.el.offsetWidth}px`;
          return k.el;
        });
        // 움직이는 동안 토글 트랙은 픽셀에 맞춰 그려지고(반올림) 손잡이는 아니라서 둘이 따로 덜그럭거렸고,
        // 멈춘 뒤에도 트랙이 반 픽셀 위로 그려진 채 남았다. 움직이는 동안은 트랙도 반올림 없이 그리고(lg-tg-float),
        // 완전히 멈춘 뒤 두 프레임 지나 떼어 픽셀에 맞춰 다시 그린다
        const tgs = gc.querySelectorAll<HTMLElement>(".checkbox-container");
        tgs.forEach((t) => t.classList.add("lg-tg-float"));
        const anim = this.growBox(gc, kids, box.dot, box.full, 90);
        const done = () => {
          fixed.forEach((c) => c.style.removeProperty("width"));
          win.requestAnimationFrame(() => win.requestAnimationFrame(() => tgs.forEach((t) => t.classList.remove("lg-tg-float"))));
        };
        anim.onfinish = done;
        anim.oncancel = done;
      });
    } catch (err) {
      console.error("[glass-shelf] graph-open", err);
    }
  },

  // 닫기: 열린 창의 사본이 중간 지점의 원으로 줄어 사라지고, 접힌 버튼들이 거기서 나타나
  // 반대쪽으로 조금 지나쳤다가 제자리로 온다
  graphClose(this: GlassShelfPlugin, gc: HTMLElement | null) {
    if (!gc || gc.classList.contains("is-close") || !gc.parentElement) return;
    const parent = gc.parentElement;
    try {
      const doc = gc.ownerDocument;
      const win = doc.defaultView || window;
      const btn = parseFloat(win.getComputedStyle(doc.body).getPropertyValue("--lg-btn")) || 34;
      const box = this.graphBoxes(gc, gc.getBoundingClientRect(), btn);
      const ghost = gc.cloneNode(true) as HTMLElement;
      ghost.classList.add("lg-graph-ghost");
      parent.appendChild(ghost);
      win.setTimeout(() => ghost.remove(), 900);
      const kids = this.graphKids(ghost);
      kids.forEach((k) => {
        if (k.anchor === "left") k.el.style.width = `${k.el.offsetWidth}px`;
        k.el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 60, easing: "ease-in", fill: "forwards" });
      });
      this.shrinkBox(ghost, kids, box.full, box.dot).onfinish = () => ghost.remove();
      win.requestAnimationFrame(() => this.dashBack(gc, box.ux, box.uy, 110));
    } catch (err) {
      console.error("[glass-shelf] graph-close", err);
    }
  },
};