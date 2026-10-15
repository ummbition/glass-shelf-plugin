import type { MenuSnap } from "./menus";
import type { WorkspaceItem, WorkspaceLeaf, WorkspaceMobileDrawer, WorkspaceSidedock } from "obsidian";
import { Menu, Platform, setIcon, setTooltip } from "obsidian";
import { tr, INJECTED, els, strs, isEl } from "./util";
import { MENU_DROP, NAV_SEARCH_MAX, NAV_SEARCH_MIN, EASE } from "./constants";
import { SegmentLens } from "./lens";
import type { GlassShelfPlugin } from "./host";

export const sidebarMethods = {
  // 좌우 패널 투명(아크릴)에서 패널 위 알약·버튼 밑 구멍 (사용자 요청): 알약 유리는 Obsidian 화면만 떠 와 창 뒤 아크릴을 비추지 못하므로,
  // 패널 바탕은 패널 밖 바로 뒤의 층(.lg-panel-under, 패널 자리·크기를 따라간다)에 칠하고, 그 층을 패널마다 문서 안 SVG 마스크
  // (#lg-holes-left, #lg-holes-right)로 버튼 모양만큼 비운다. 패널 자신은 유리가 뒤를 떠 오는 범위(backdrop root)라, 모든 버튼이
  // 패널 안 내용(목록 등)만 굴절하고 바탕은 한 겹만 남는다 (보관함 줄 버튼도 목록을 굴절한다, 사용자 요청).
  // 패널을 접고 펴는 동안(너비 전환)은 따라가지 않고 패널을 불투명한 패널색으로 막는다(.lg-under-busy, 사용자 요청).
  // 버튼이 메뉴로 바뀌며 돌진하는 움직임(morph 의 lg-dash-out·lg-dash-back)은 구멍이 따라가지 않는다: 메뉴가 열릴 때 한 번에 닫히고,
  // 닫힌 뒤 버튼이 돌아오는 움직임이 끝나면 서서히 열린다(사용자 요청).
  // 구멍은 버튼을 매 프레임 따라 그리지 않고 따로 움직인다: 버튼과 그 위 묶음에 걸린 애니메이션(플러그인 animate, 테마 CSS 전환)을
  // 그대로 읽어(getAnimations) 같은 키프레임·시간·곡선·시작 시각으로 구멍 층에도 건다. 버튼 쪽 값이 바뀌어도 구멍 쪽은 고칠 것이 없다.
  // 크기·자리를 바꾸는 애니메이션(검색 칸 넓어짐 등)만은 끝날 때까지 매 프레임 자리를 다시 잰다.
  // 가로로 긴 알약이 제자리에서 줄며 사라지거나 커지며 나타날 때는 구멍의 가로를 더 빨리 줄인다(사용자 요청): 같은 비율이면 양옆 테두리가
  // 세로보다 훨씬 많이 움직여 조금만 어긋나도 티가 난다. 구멍은 긴 알약에서 최종 높이만 한 크기로 접혀, 줄어드는 내내 양옆이 버튼 유리 안쪽에 있다.
  // 구멍은 버튼보다 화면 픽셀 1칸 안쪽까지만 뚫는다: 버튼 가장자리와 구멍 가장자리가 같은 픽셀에서 반씩 걸치면 그 픽셀만 패널도 버튼도 덜 덮여
  // 버튼 둘레에 어두운 실선이 생긴다(측정). 가장자리 픽셀은 패널 위에 버튼이 얹히게 둔다.
  // 투명도만은 그대로 옮기지 않는다: 버튼 채움(약 80%)이 패널(70%)보다 진해, 구멍이 버튼 투명도(o)만큼 열리면 흐려지는 동안
  // 그 자리가 패널보다 더 비쳐 어두운 원이 생긴다(측정). 구멍 깊이를 o³ 으로 해 그 자리가 패널과 버튼 사이에서 거의 고르게 이어지게 한다
  // (정확한 값 1-(1-o)/(1-0.8·o) 에 가장 가까운 어림값, 사용자 요청). 구멍 층을 세 겹으로 겹치고 겹마다 버튼과 같은 투명도 애니메이션을 건다.
  // 구멍의 투명도 변화는 버튼 시간의 HOLE_SPAN(90%) 안에 끝낸다(사용자 요청): 사라질 때는 앞쪽에서 먼저 닫히고, 나타날 때는 늦게 시작해 함께 끝난다
  acrylicHoles(this: GlassShelfPlugin, on: boolean) {
    if (this.holesOff) {
      this.holesOff();
      this.holesOff = null;
    }
    if (!on) return;
    // 구멍을 뚫는 것: 패널 위에서 유리를 그리는 알약·버튼
    const BTN = ".lg-nav-run, .lg-nav-rest > .clickable-icon, .lg-nav-more, .lg-panel-toggle, .workspace-tab-header-container-inner, .workspace-drawer-vault-switcher, .workspace-drawer-vault-actions .clickable-icon, .graph-controls.is-close .graph-controls-button";
    // 버튼이 들어 있는 줄 (이 안의 변화만 본다)
    const ROWS = ".workspace-tab-header-container, .workspace-sidedock-vault-profile, .graph-controls";
    const EVENTS = ["transitionrun", "transitionend", "transitioncancel", "animationstart", "animationend"];
    // 구멍과 상관없는 애니메이션 속성 (색·그림자 전환 등). 키프레임의 속성 이름은 camelCase
    const HOLE_SPAN = 0.9;
    const IDLE = /^(offset|easing|composite|computedOffset|background.*|color|boxShadow|border.*Color|outline.*|filter|backdropFilter|webkitBackdropFilter|fill|stroke|--.*)$/;
    // 층 하나는 세 겹(gs): 변형은 바깥 겹에만, 투명도는 세 겹 모두에 걸어 o³ 이 된다
    type Layer = { el: HTMLElement; gs: SVGGElement[]; origin: string; mirrors: Map<Animation, Animation[]> };
    type Hole = { root: SVGGElement; rect: SVGRectElement; layers: Layer[]; dash?: Animation | null };
    // 모서리 반지름 (가로·세로가 다른 타원 모서리, % 값도)
    const radii = (btn: HTMLElement, w: number, h: number) => {
      const [a, b = a] = getComputedStyle(btn).borderTopLeftRadius.split(" ");
      const len = (v: string, of: number) => (v.endsWith("%") ? (parseFloat(v) / 100) * of : parseFloat(v) || 0);
      return [len(a, w), len(b, h)];
    };
    type Box = { x: number; y: number; w: number; h: number };
    const n3 = (v: number) => String(+v.toFixed(3));
    // 값이 바뀐 것만 쓴다. 같은 값이어도 쓰면 마스크를 다시 그려, 탭을 바꾸는 바쁜 프레임에 일이 더 쌓였다(측정: 다시 잴 때마다 40~100번)
    const setAttrs = (el: Element, attrs: Record<string, string>) => {
      for (const k in attrs) if (el.getAttribute(k) !== attrs[k]) el.setAttribute(k, attrs[k]);
    };
    const setStyle = (el: HTMLElement | SVGElement, prop: "transform" | "opacity" | "left" | "top" | "width" | "height", v: string) => {
      if (el.style[prop] !== v) el.style[prop] = v;
    };
    // 가로세로 같은 배율 변형(scale(s), 같은 값의 matrix)이면 그 배율
    const uniformScale = (t: string | number | null | undefined) => {
      if (typeof t !== "string") return null;
      const m = /^scale\(([\d.]+)\)$/.exec(t) || /^matrix\(([\d.]+), 0, 0, ([\d.]+), 0, 0\)$/.exec(t);
      return m && (m[2] === undefined || m[1] === m[2]) ? +m[1] : null;
    };
    const relevant = (a: Animation) => {
      const fx = a.effect;
      if (!(fx instanceof KeyframeEffect) || a.playState === "idle") return null;
      const kfs = fx.getKeyframes();
      // 메뉴로 바뀌며 돌진하는 움직임: 따라가지 않고 구멍을 닫아 둔다 (mirror)
      if (a.id.startsWith("lg-dash")) return { fx, kfs, shape: true, geo: false, moved: true };
      let shape = false;
      let geo = false;
      // 개별 변형 속성(누름 효과의 scale 등): 구멍이 따라 그리지는 않지만 그동안 버튼 화면 자리가 배치 자리와 달라 "가만히 있음"이 아니다
      let moved = false;
      for (const k of kfs)
        for (const p of Object.keys(k)) {
          if (p === "transform" || p === "opacity") shape = true;
          else if (!IDLE.test(p)) geo = true;
          if (p === "scale" || p === "translate" || p === "rotate") moved = true;
        }
      return { fx, kfs, shape, geo, moved };
    };
    // SVG 도형은 사용자 좌표 원점 기준으로 변형되므로, 요소의 변형 기준점(패널 기준 px)으로 옮겼다가 되돌린다
    const around = (t: string | number | null | undefined, origin: string) => {
      const [ox, oy] = origin.split(",").map(Number);
      const mid = typeof t === "string" && t !== "none" ? ` ${t}` : "";
      return `translate(${ox}px, ${oy}px)${mid} translate(${-ox}px, ${-oy}px)`;
    };
    // 패널 하나(왼쪽·오른쪽)의 구멍. 끄는 함수를 돌려준다
    const side = (splitSel: string, id: string) => {
      const svg = createSvg("svg", { cls: [INJECTED, "lg-holes-svg"], attr: { "aria-hidden": "true" } });
      const mask = svg.createSvg("mask", { attr: { id, maskUnits: "userSpaceOnUse", maskContentUnits: "userSpaceOnUse", x: "-10000", y: "-10000", width: "20000", height: "20000" } });
      mask.createSvg("rect", { attr: { x: "-10000", y: "-10000", width: "20000", height: "20000", fill: "#fff" } });
      document.body.appendChild(svg);
      const holes = new Map<HTMLElement, Hole>();
      // 배치 자리(offsetLeft 등)는 정수로 잘려, 변형이 없을 때 잰 정확한 자리와의 차이를 기억해 둔다
      const frac = new WeakMap<HTMLElement, [number, number]>();
      let dock: HTMLElement | null = null;
      let frame = 0;
      // 패널 바탕 층
      const under = createDiv({ cls: [INJECTED, "lg-panel-under", id] });
      const place = () => {
        if (!dock || under.classList.contains("lg-busy")) return;
        const r = dock.getBoundingClientRect();
        setStyle(dots[0], "left", `${r.left}px`);
        setStyle(dots[0], "top", `${r.top}px`);
        setStyle(dots[1], "left", `${r.right - 1}px`);
        setStyle(dots[1], "top", `${r.bottom - 1}px`);
        setStyle(under, "left", `${r.left}px`);
        setStyle(under, "top", `${r.top}px`);
        setStyle(under, "width", `${r.width}px`);
        setStyle(under, "height", `${r.height}px`);
      };
      // 변형을 빼고 잰 요소의 배치 자리 (패널 기준). still 이면 요소와 그 위에 변형이 없어 화면 자리가 곧 배치 자리다
      const boxOf = (el: HTMLElement, still: boolean): Box => {
        let x = 0;
        let y = 0;
        for (let e: HTMLElement | null = el; e && e !== dock; ) {
          const p: Element | null = e.offsetParent;
          x += e.offsetLeft;
          y += e.offsetTop;
          if (!p || !p.instanceOf(HTMLElement)) break;
          x += p.clientLeft - (p === dock ? 0 : p.scrollLeft);
          y += p.clientTop - (p === dock ? 0 : p.scrollTop);
          e = p;
        }
        const w = el.offsetWidth;
        const h = el.offsetHeight;
        if (still && dock) {
          const r = el.getBoundingClientRect();
          const d = dock.getBoundingClientRect();
          const bx = r.left - d.left;
          const by = r.top - d.top;
          frac.set(el, [bx - x, by - y]);
          return { x: bx, y: by, w: r.width, h: r.height };
        }
        const [fx, fy] = frac.get(el) || [0, 0];
        return { x: x + fx, y: y + fy, w, h };
      };
      // own: 구멍 주인(버튼) 자신의 층이면 그 크기
      const mirror = (layer: Layer, a: Animation, fx: KeyframeEffect, kfs: ComputedKeyframe[], own: { w: number; h: number } | null) => {
        const ms: Animation[] = [];
        // 변형: 같은 키프레임·시간·곡선 (긴 알약의 나타나기·사라지기만 가로를 따로)
        if (kfs.some((k) => "transform" in k)) {
          const tks = kfs.filter((k) => "transform" in k);
          const ss = tks.map((k) => uniformScale(k.transform));
          const smin = Math.min(...ss.map((v) => (v == null ? 1 : v)));
          const wide = own && own.w > own.h * 1.2 && ss.every((v) => v != null) && smin <= 0.6 ? own : null;
          // 배율 s 일 때 구멍 가로 배율: s=1 이면 1, s=smin 이면 높이(h·smin)만 한 폭. 그 사이는 s 에 곧게
          const sx = (v: number) => (!wide || v >= 1 ? v : ((v - smin) * wide.w + smin * wide.h * (1 - v)) / ((1 - smin) * wide.w));
          const out: Keyframe[] = tks.map((k, i) => {
            const v = ss[i];
            const t = wide && v != null ? `scale(${n3(sx(v))}, ${v})` : k.transform;
            return { offset: k.offset, easing: k.easing, composite: k.composite, transform: around(t, layer.origin) };
          });
          ms.push(layer.gs[0].animate(out, fx.getTiming()));
        }
        // 투명도: 같은 키프레임·시간·곡선을 세 겹에 (o³)
        if (kfs.some((k) => "opacity" in k)) {
          const out: Keyframe[] = kfs.filter((k) => "opacity" in k).map((k) => ({ offset: k.offset, easing: k.easing, composite: k.composite, opacity: k.opacity }));
          const tm = fx.getTiming();
          const dur = Number(tm.duration) || 0;
          const ops = out.map((k) => Number(k.opacity));
          const fading = ops[0] > ops[ops.length - 1];
          const span: OptionalEffectTiming = {
            ...tm,
            duration: dur * HOLE_SPAN,
            delay: (tm.delay || 0) + (fading ? 0 : dur * (1 - HOLE_SPAN)),
            fill: fading ? (tm.fill === "backwards" || tm.fill === "both" ? "both" : "forwards") : "both",
          };
          for (const g of layer.gs) ms.push(g.animate(out, span));
        }
        for (const m of ms) m.playbackRate = a.playbackRate;
        const mine = () => layer.mirrors.get(a) === ms;
        // 시작 시각을 버튼 쪽과 같게: 아직 시작 전이면 시작할 때 맞춘다
        const sync = () => {
          if (mine() && a.startTime != null) for (const m of ms) if (m.startTime !== a.startTime) m.startTime = a.startTime;
        };
        layer.mirrors.set(a, ms);
        sync();
        a.ready.then(sync, () => {});
        a.addEventListener("cancel", () => mine() && ms.forEach((m) => m.cancel()));
        a.addEventListener("finish", () => {
          if (mine()) ms.forEach((m) => m.finish());
          schedule();
        });
      };
      // 메뉴로 바뀌며 돌진할 때(lg-dash-out)는 구멍을 한 번에 닫고, 메뉴가 닫혀 버튼이 돌아오는 움직임(lg-dash-back)이 끝난 뒤
      // DASH_OPEN_MS 동안 서서히 연다 (사용자 요청). 구멍 묶음 자체(root)에 걸어 층을 다시 만들어도 이어진다
      const DASH_OPEN_MS = 300;
      const dashHole = (hole: Hole, a: Animation, fx: KeyframeEffect) => {
        if (hole.dash) hole.dash.cancel();
        let m: Animation;
        if (a.id === "lg-dash-out") {
          m = hole.root.animate([{ opacity: 0 }, { opacity: 0 }], { duration: 1, fill: "forwards" });
          // 메뉴가 닫히면 돌진 애니메이션이 먼저 취소되고 돌아오는 움직임이 이어 걸린다. 바로 열면 그 사이 한 프레임 구멍이 보였다(측정)
          // 두 프레임 기다려 돌아오는 움직임(lg-dash-back)이 이어받지 않았을 때만 연다
          const later = () => window.requestAnimationFrame(() => window.requestAnimationFrame(() => hole.dash === m && m.cancel()));
          a.addEventListener("cancel", later);
          a.addEventListener("remove", later);
        } else {
          const t = fx.getComputedTiming();
          const tm = fx.getTiming();
          m = hole.root.animate([{ opacity: 0 }, { opacity: 1 }], { delay: (Number(tm.delay) || 0) + (Number(t.activeDuration) || 0), duration: DASH_OPEN_MS, easing: "ease-in-out", fill: "backwards" });
          // 돌아온 뒤 가만히 있는 버튼으로 한 번 다시 잰다 (돌아오는 동안은 배치 자리로만 쟀다)
          a.addEventListener("finish", () => schedule());
          const sync = () => {
            if (hole.dash === m && a.startTime != null) m.startTime = a.startTime;
          };
          sync();
          a.ready.then(sync, () => {});
        }
        hole.dash = m;
      };
      const clear = (layer: Layer) => {
        layer.mirrors.forEach((ms) => ms.forEach((m) => m.cancel()));
        layer.mirrors.clear();
      };
      const drop = (h: Hole) => {
        h.layers.forEach(clear);
        h.root.remove();
      };
      const scan = () => {
        if (frame) window.cancelAnimationFrame(frame);
        frame = 0;
        if (!dock || !dock.isConnected) return;
        place();
        let follow = false;
        const seen = new Set<HTMLElement>();
        for (const btn of els(dock.querySelectorAll<HTMLElement>(BTN))) {
          // 목록 방식 패널의 탭 줄은 유리 알약이 아니라 구멍을 뚫지 않는다
          if (btn.matches(".workspace-tab-header-container-inner") && btn.closest(".lg-tab-list")) continue;
          seen.add(btn);
          let h = holes.get(btn);
          if (!h) {
            const root = mask.createSvg("g");
            h = { root, rect: root.createSvg("rect", { attr: { fill: "#000" } }), layers: [] };
            holes.set(btn, h);
          }
          if (!btn.offsetParent || !btn.offsetWidth) {
            h.root.setAttribute("visibility", "hidden");
            continue;
          }
          h.root.removeAttribute("visibility");
          // 구멍에 영향을 주는 층: 버튼과 그 위 묶음 중 움직이거나 변형·투명도가 걸린 것 (바깥부터)
          const chain: { el: HTMLElement; cs: CSSStyleDeclaration; as: Animation[]; rs: ReturnType<typeof relevant>[] }[] = [];
          let still = true;
          for (let e: HTMLElement | null = btn; e && e !== dock; e = e.parentElement) {
            const cs = getComputedStyle(e);
            const as = e.getAnimations();
            const rs = as.map(relevant);
            if (rs.some((r) => r && r.geo)) follow = true;
            const shaped = rs.some((r) => r && r.shape);
            // 누름 효과(scale)로 커진 채 재면 그 크기로 보정값(frac)을 기억해, 메뉴가 열고 닫히는 동안 구멍이 왼쪽으로 넓게 남았다 (사용자 지적)
            const moved = rs.some((r) => r && r.moved) || cs.scale !== "none" || cs.translate !== "none" || cs.rotate !== "none";
            if (shaped || moved || cs.transform !== "none") still = false;
            if (shaped || cs.transform !== "none" || +cs.opacity < 0.99) chain.unshift({ el: e, cs, as, rs });
          }
          const hole = h;
          if (chain.length !== hole.layers.length || chain.some((c, i) => c.el !== hole.layers[i].el)) {
            hole.layers.forEach(clear);
            hole.root.empty();
            let parent: SVGElement = hole.root;
            hole.layers = chain.map((c) => {
              const gs: SVGGElement[] = [];
              for (let k = 0; k < 3; k++) {
                const g = parent.createSvg("g");
                gs.push(g);
                parent = g;
              }
              return { el: c.el, gs, origin: "", mirrors: new Map<Animation, Animation[]>() };
            });
            hole.rect = parent.createSvg("rect", { attr: { fill: "#000" } });
          }
          chain.forEach((c, i) => {
            const layer = hole.layers[i];
            const b = boxOf(c.el, still);
            const [ox, oy] = c.cs.transformOrigin.split(" ").map(parseFloat);
            const origin = `${n3(b.x + (ox || 0))},${n3(b.y + (oy || 0))}`;
            if (origin !== layer.origin) {
              layer.origin = origin;
              clear(layer);
            }
            // 애니메이션 밖의 변형·투명도 (누르고 있는 동안 작아진 크기 등). 애니메이션이 돌면 그쪽이 앞선다
            const op = +c.cs.opacity < 0.99 ? c.cs.opacity : "";
            setStyle(layer.gs[0], "transform", around(c.cs.transform, origin));
            for (const g of layer.gs) setStyle(g, "opacity", op);
            for (const [a, ms] of layer.mirrors)
              if (!c.as.includes(a)) {
                ms.forEach((m) => m.cancel());
                layer.mirrors.delete(a);
              }
            c.as.forEach((a, j) => {
              const r = c.rs[j];
              if (!r || !r.shape || layer.mirrors.has(a)) return;
              if (a.id.startsWith("lg-dash")) {
                dashHole(hole, a, r.fx);
                layer.mirrors.set(a, []);
              } else mirror(layer, a, r.fx, r.kfs, c.el === btn ? { w: btn.offsetWidth, h: btn.offsetHeight } : null);
            });
          });
          const b = boxOf(btn, still);
          const [rx, ry] = radii(btn, b.w, b.h);
          const px = 1 / (window.devicePixelRatio || 1);
          const w = Math.max(0, b.w - 2 * px);
          const hh = Math.max(0, b.h - 2 * px);
          setAttrs(hole.rect, { x: n3(b.x + px), y: n3(b.y + px), width: n3(w), height: n3(hh), rx: n3(Math.max(0, Math.min(rx - px, w / 2))), ry: n3(Math.max(0, Math.min(ry - px, hh / 2))) });
        }
        for (const [btn, h] of holes)
          if (!seen.has(btn)) {
            drop(h);
            holes.delete(btn);
          }
        if (follow) schedule();
      };
      const schedule = () => {
        if (!frame) frame = window.requestAnimationFrame(scan);
      };
      const ro = new ResizeObserver(() => scan());
      // 패널 너비 전환(접기·펴기) 동안은 바탕 층을 숨기고 패널을 불투명하게 막는다
      const busy = (on: boolean) => {
        if (!dock) return;
        dock.classList.toggle("lg-under-busy", on);
        under.classList.toggle("lg-busy", on);
        if (!on) place();
      };
      const onWidth = (e: Event) => {
        if (e.target !== dock || !(e instanceof TransitionEvent) || e.propertyName !== "width") return;
        busy(e.type === "transitionrun");
      };
      // 버튼 줄이 바뀌면(보기 전환, 버튼이 들고 남) 다음 그리기 직전에 한 번 다시 맞춘다. 목록 칸 안의 변화는 건너뛴다.
      // 바뀔 때마다 바로 재면 플러그인이 버튼 줄을 고치는 도중에 배치 계산을 여러 번 강제해 프레임이 밀리고(측정: 전환마다 33ms 한 번),
      // 그동안 GPU 에서 도는 버튼 애니메이션만 앞서가 구멍이 늦게 닫혀 보였다
      const mo = new MutationObserver((recs) => {
        if (recs.some((r) => isEl(r.target) && (r.target === dock || r.target.matches(".workspace-tabs") || !!r.target.closest(ROWS)))) schedule();
      });
      // 테마 CSS 전환(누를 때 작아지기 등)은 DOM 이 바뀌지 않으므로 전환 이벤트로 안다
      const onAnim = (e: Event) => {
        if (isEl(e.target) && e.target.closest(ROWS)) schedule();
      };
      // 화면 내보내기 우회 (사용자 지적): 투명 창은 바뀐 부분만 다시 내보내는데, 패널 위 버튼에 호버하거나 커서를 움직이면 바뀐 영역 경계가
      // 옆 버튼을 가로질러 그 버튼 일부가 깨져 보였다(Chromium 이 그린 화면 캡처에는 없음, 화면에만 보임). 리본 메뉴 버튼 호버, 편집창 스크롤,
      // 편집창 탭 줄 위를 지날 때도 깨졌다(사용자 지적). 화면이 바뀔 만한 일이 생긴 동안과 그 뒤 DAMAGE_MS 동안 매 프레임 패널 왼쪽 위·오른쪽 아래 끝의 1px 점 두 개(.lg-dmg-dot)를 아주 조금 바꾼다(원인은 추정).
      // 한 프레임에 바뀐 곳들을 사각형 하나로 합쳐 넘긴다면 그 사각형이 패널 전체를 덮는다. 다시 칠하는 것은 점 두 개뿐이다.
      // 패널 전체(바탕 층)를 매 프레임 다시 칠하면 탭을 누를 때 무거웠고, 두 프레임에 한 번이면 깨짐이 보였다(사용자 확인)
      // 점의 깜빡임은 CSS 투명도 애니메이션이라 GPU(합성기)에서 혼자 돈다. 매 프레임 클래스를 바꾸면 메인 스레드가 매 프레임
      // 스타일·그리기를 다시 돌아 클릭·스크롤이 무거웠다(측정). 여기서는 일이 생기면 켜고 DAMAGE_MS 뒤 끄기만 한다
      const DAMAGE_MS = 600;
      let damageTimer = 0;
      const dots = [createDiv({ cls: [INJECTED, "lg-dmg-dot"] }), createDiv({ cls: [INJECTED, "lg-dmg-dot"] })];
      const damageOff = () => {
        damageTimer = 0;
        dots.forEach((d) => d.classList.remove("lg-damage"));
      };
      // 화면이 바뀔 만한 일(커서 움직임·누름, 스크롤, 키 입력, 애니메이션·전환 시작)이 창 어디서든 생기면 돈다.
      // 늘 돌리지 않는 것은 아무 일 없을 때도 매 프레임 그려 전력을 쓰기 때문이다
      const DAMAGE_ON = ["pointermove", "pointerdown", "pointerup", "scroll", "wheel", "keydown", "transitionrun", "animationstart"];
      const onActivity = (e: Event) => {
        if (!dock || (isEl(e.target) && e.target.classList.contains("lg-dmg-dot"))) return;
        if (damageTimer) window.clearTimeout(damageTimer);
        else dots.forEach((d) => d.classList.add("lg-damage"));
        damageTimer = window.setTimeout(damageOff, DAMAGE_MS);
      };
      const unbindDock = () => {
        if (!dock) return;
        if (damageTimer) window.clearTimeout(damageTimer);
        damageTimer = 0;
        dock.classList.remove("lg-holes", "lg-under-busy");
        dots.forEach((d) => d.classList.remove("lg-damage"));
        under.classList.remove("lg-busy");
        for (const t of EVENTS) dock.removeEventListener(t, onAnim, true);
        for (const t of ["transitionrun", "transitionend", "transitioncancel"]) dock.removeEventListener(t, onWidth);
      };
      const bind = () => {
        const d = document.querySelector<HTMLElement>(splitSel);
        if (d !== dock) {
          unbindDock();
          dock = d;
          if (dock) {
            dock.classList.add("lg-holes");
            for (const t of EVENTS) dock.addEventListener(t, onAnim, true);
            for (const t of ["transitionrun", "transitionend", "transitioncancel"]) dock.addEventListener(t, onWidth);
            // 패널 바로 앞(같은 쌓임 순서)에 둔다
            if (dock.parentElement) dock.parentElement.insertBefore(under, dock);
            if (Platform.isWin) for (const d of dots) document.body.appendChild(d);
          }
        }
        ro.disconnect();
        mo.disconnect();
        if (!dock) return;
        ro.observe(dock);
        for (const hc of els(dock.querySelectorAll<HTMLElement>(ROWS))) ro.observe(hc);
        mo.observe(dock, { subtree: true, childList: true, attributes: true, attributeFilter: ["class", "style"] });
        scan();
      };
      const refs = [this.app.workspace.on("layout-change", bind)];
      // 배율이 다른 모니터로 옮기면 화면 픽셀 단위가 바뀐다
      window.addEventListener("resize", schedule);
      // 맥은 창 합성 방식이 달라 우회를 쓰지 않는다 (깨짐은 Windows 에서만 봤다)
      if (Platform.isWin) for (const t of DAMAGE_ON) document.addEventListener(t, onActivity, { capture: true, passive: true });
      bind();
      return () => {
        ro.disconnect();
        mo.disconnect();
        if (frame) window.cancelAnimationFrame(frame);
        refs.forEach((r) => this.app.workspace.offref(r));
        window.removeEventListener("resize", schedule);
        for (const t of DAMAGE_ON) document.removeEventListener(t, onActivity, { capture: true });
        holes.forEach(drop);
        holes.clear();
        unbindDock();
        dock = null;
        under.remove();
        dots.forEach((d) => d.remove());
        svg.remove();
      };
    };
    const offs = [side(".workspace-split.mod-left-split", "lg-holes-left"), side(".workspace-split.mod-right-split", "lg-holes-right")];
    this.holesOff = () => offs.forEach((off) => off());
  },

  // 설정 창의 드롭다운 줄 표시 (테마가 :has 로 보던 것): 드롭다운이 든 조작부 .lg-dd-ctrl, 그 줄 .lg-dd-row,
  // 강조 버튼(.mod-cta, 언어의 숨은 재시작 버튼)이 아닌 버튼도 있으면 .lg-dd-btn. 창이 뜨거나 내용이 바뀌면 그 자리에서(그리기 전) 붙인다
  markDropdownRows(this: GlassShelfPlugin, root: HTMLElement) {
    root.querySelectorAll<HTMLElement>(".setting-item-control").forEach((c) => {
      const dd = !!c.querySelector<HTMLElement>(":scope > .dropdown");
      c.classList.toggle("lg-dd-ctrl", dd);
      const row = c.parentElement;
      if (!row || !row.classList.contains("setting-item")) return;
      row.classList.toggle("lg-dd-row", dd);
      row.classList.toggle("lg-dd-btn", dd && !!c.querySelector<HTMLElement>(":scope > button:not(.mod-cta)"));
    });
    // Bases 뷰 설정의 드롭다운 줄(행 높이 등): 이름과 드롭다운을 한 줄에 둔다 (테마)
    root.querySelectorAll<HTMLElement>(".bases-toolbar-menu-form .input-row").forEach((r) => {
      const dd = !!r.querySelector<HTMLElement>(":scope > .input-row-content > select.dropdown");
      if (r.classList.contains("lg-dd-row") !== dd) r.classList.toggle("lg-dd-row", dd);
    });
  },

  // 사이드바 보기 중 머리 줄(.nav-header)에 버튼 줄 말고 보이는 것이 없는 보기에 lg-bare-head 를 붙인다.
  // 테마는 이런 보기의 내용을 탭 줄 밑까지 올려 그 아래로 스크롤되게 한다.
  // 예전엔 테마가 :has(… [style*="display: none"]) 로 직접 판정했는데, 파일·개요 항목을 끌 때 Obsidian 이
  // 매 움직임마다 인라인 스타일을 바꿔 그 판정이 계속 다시 돌며 렉이 걸렸다(추정). 판정은 머리 줄이 바뀔 때만 한다
  markBareHeads(this: GlassShelfPlugin, split: WorkspaceItem | null) {
    const c = split && split.containerEl;
    if (!c) return;
    if (!this.bareWatched) this.bareWatched = new WeakSet();
    c.querySelectorAll<HTMLElement>(".workspace-leaf-content").forEach((el: HTMLElement) => {
      const sync = () => {
        const head = el.querySelector<HTMLElement>(":scope > .nav-header");
        const bare = !head || !els(head.children).some((k) => !k.classList.contains("nav-buttons-container") && k.style.display !== "none");
        el.classList.toggle("lg-bare-head", bare);
      };
      sync();
      if (this.bareWatched.has(el)) return;
      this.bareWatched.add(el);
      // 머리 줄이 생기거나 바뀔 때만 다시 판정 (내용 칸은 보지 않는다)
      const obs = new MutationObserver((recs) => {
        if (recs.some((r) => r.target === el || ((r.target as Element).closest && (r.target as Element).closest<HTMLElement>(".nav-header") && (r.target as Element).closest<HTMLElement>(".workspace-leaf-content") === el))) sync();
      });
      obs.observe(el, { childList: true });
      const head = el.querySelector<HTMLElement>(":scope > .nav-header");
      if (head) obs.observe(head, { childList: true, subtree: true, attributes: true, attributeFilter: ["style"] });
      this.observers.push(obs);
    });
  },

  // 탭 전환 효과 "목록"을 쓰는 패널 (CSS: .workspace-split.lg-tab-list, 태블릿은 서랍 .workspace-drawer.lg-tab-list, 사용자 요청). 휴대폰은 렌즈
  markTabList(this: GlassShelfPlugin, split: WorkspaceItem | null, side: "left" | "right") {
    if (!split || !split.containerEl) return;
    const st = this.settings;
    split.containerEl.classList.toggle("lg-tab-list", st.tabAnim === "list" && !Platform.isPhone && (st.tabListSides === "both" || st.tabListSides === side));
  },

  setupSidebar(this: GlassShelfPlugin, split: WorkspaceSidedock | WorkspaceMobileDrawer | null, side: "left" | "right") {
    if (!split || !split.containerEl) return;
    this.markTabList(split, side);
    // 패널을 위아래로 나눈 탭 묶음(안쪽 분할 포함)마다 ··· 을 단다. 오른쪽 패널 닫기는 맨 위 묶음에만
    const groups = split.containerEl.querySelectorAll<HTMLElement>(".workspace-tabs");
    groups.forEach((tabsEl: HTMLElement, i: number) => {
      this.watchSegments(tabsEl);
      const header = tabsEl.querySelector<HTMLElement>(":scope > .workspace-tab-header-container");
      if (!header) return;
      if (!header.querySelector<HTMLElement>(":scope > .lg-nav-more")) {
        // [탭] ··· [···]. ··· 이 오른쪽 끝이라, 탭마다 ··· 이 생기고 사라져도 탭 줄 스크롤이 밀리지 않는다
        const btn = this.makeButton("lg-nav-more", "more-horizontal", tr("메뉴", "Menu"), (e, el: HTMLElement) =>
          this.toggleMenu(el, () => this.openNavMenu(tabsEl, el))
        );
        header.appendChild(btn);
      }
      // 맨 위 묶음의 편집창 쪽 끝에 패널 닫기: 오른쪽 [닫기] [탭] ··· [···], 왼쪽 [탭] ··· [···] [닫기].
      // 닫혀 있을 때는 원래 토글(탭 바·리본)이 그대로 보인다
      if (i === 0 && !split.containerEl.querySelector<HTMLElement>(".lg-panel-toggle")) {
        const left = side === "left";
        const close = this.makeButton("lg-panel-toggle", left ? "panel-left-close" : "panel-right-close", left ? tr("왼쪽 패널 닫기", "Close left sidebar") : tr("오른쪽 패널 닫기", "Close right sidebar"), () =>
          split.collapse()
        );
        if (left) {
          close.addClass("lg-panel-toggle-left");
          header.appendChild(close);
        } else {
          header.prepend(close);
        }
      }
      // 맨 위 묶음 탭 줄 맨 앞에 창 끌기 띠 (CSS: .lg-drag-band, 첫 줄만 창을 잡는다). 끌기 영역은 문서 순서대로 겹쳐
      // 뒤에 오는 버튼의 끌기 제외가 띠를 파내므로, 띠는 늘 첫 자식이어야 한다 (사용자 요청)
      if (i === 0) this.keepDragBand(header);
      // 탭 줄 폭이 바뀌면(패널을 줄이거나 창이 작아지면) 버튼 줄이 들어가는지 다시 본다
      if (!this.foldWatched) this.foldWatched = new WeakSet();
      if (!this.foldWatched.has(header)) {
        this.foldWatched.add(header);
        let lastW = -1;
        const ro = new ResizeObserver(() => {
          const w = header.clientWidth;
          if (w === lastW) return; // 접고 펴서 높이만 바뀐 것은 건너뛴다
          lastW = w;
          this.navFoldCheck(tabsEl);
          this.navSearchSync(tabsEl);
        });
        ro.observe(header);
        this.register(() => ro.disconnect());
      }
      this.updateNavMore(tabsEl);
    });
  },

  // 넓게 모드에서 버튼 줄이 탭 줄 폭에 다 들어가지 않으면 줄을 숨기고 ··· 하나로 묶는다 (사용자 요청: 패널을 줄이거나 창이 작아질 때).
  // ··· 은 보기의 버튼을 모두 메뉴로 보인다. 잠깐 펴서 버튼 줄에 필요한 폭과 받은 폭을 잰다(그리기 전이라 화면에는 보이지 않는다)
  // 넓게 모드처럼 버튼 줄을 펼치는 탭 묶음: 탭 줄 넓게 설정이거나, 목록 방식 패널 (목록은 넓게의 첫 줄 버튼을 그대로 쓴다)
  tabWideOf(this: GlassShelfPlugin, tabsEl: HTMLElement) {
    return tabsEl.ownerDocument.body.classList.contains("lg-tab-wide") || !!tabsEl.closest(".lg-tab-list");
  },

  navFoldCheck(this: GlassShelfPlugin, tabsEl: HTMLElement) {
    const header = tabsEl.querySelector<HTMLElement>(":scope > .workspace-tab-header-container");
    const row = header && header.querySelector<HTMLElement>(":scope > .lg-nav-row");
    const wide = this.tabWideOf(tabsEl);
    if (!row || !wide || tabsEl.classList.contains("lg-one") || row.classList.contains("lg-nav-none")) {
      tabsEl.classList.remove("lg-nav-fold");
      return;
    }
    const was = tabsEl.classList.contains("lg-nav-fold");
    const more = header.querySelector<HTMLElement>(":scope > .lg-nav-more");
    // 펼 때 사라질 ··· 의 자리는 펴기 전에 잰다
    const moreRect = was && more ? more.getBoundingClientRect() : null;
    if (was) tabsEl.classList.remove("lg-nav-fold");
    if (!row.offsetParent) {
      if (was) tabsEl.classList.add("lg-nav-fold");
      return;
    }
    const parts = els(row.querySelectorAll<HTMLElement>(":scope > .lg-nav-run, :scope > .lg-nav-rest")).filter((p) => p.childElementCount > 0);
    const gap = parseFloat(getComputedStyle(row).columnGap) || 0;
    // 넓어진 검색 버튼(navSearchSync)은 원래 크기로 친다
    const ns = tabsEl.lgSearchIn;
    // 폭은 배치 폭으로 잰다 (나타나는 중인 버튼 묶음의 scale 에 흔들리지 않게, navSearchSync 와 같다)
    const extra = ns ? ns.p.offsetWidth - ns.p.offsetHeight : 0;
    const need = parts.reduce((sum, p) => sum + p.offsetWidth, 0) + gap * Math.max(0, parts.length - 1) - extra;
    const fold = need > row.getBoundingClientRect().width + 0.5;
    // 바뀔 때 모션 (사용자 요청): 사라지는 쪽은 그 자리에 복제본을 띄워 줄어들며 흐려지게, 나타나는 쪽은 가운데서 퍼져 나오게.
    // 처음 판단할 때(앱을 켤 때·보기를 처음 그릴 때)는 바로 둔다
    const animate = tabsEl.lgFoldSeen && fold !== was;
    tabsEl.lgFoldSeen = true;
    if (animate && fold) this.foldGhost(row, header, row.getBoundingClientRect());
    tabsEl.classList.toggle("lg-nav-fold", fold);
    if (!animate) return;
    if (fold) {
      if (more) this.navBtnEnter(more);
    } else {
      if (more && moreRect) this.foldGhost(more, header, moreRect);
      parts.forEach((p) => this.navBtnEnter(p));
    }
  },

  // 사라지는 버튼 줄이나 ··· 의 복제본을 그 자리(rect)에 띄워 줄어들며 흐려지게 한 뒤 지운다. 원래 것은 바로 숨는다
  foldGhost(this: GlassShelfPlugin, el: HTMLElement, header: HTMLElement, rect: DOMRect) {
    if (!rect || !rect.width) return;
    const g = el.cloneNode(true) as HTMLElement;
    g.classList.add(INJECTED, "lg-fold-ghost");
    g.removeAttribute("aria-label");
    g.setAttribute("aria-hidden", "true");
    header.appendChild(g);
    const op = g.offsetParent || header;
    const or = op.getBoundingClientRect();
    // 숨김 규칙(테마 display: none)보다 인라인 값이 앞선다
    g.setCssStyles({
      display: "flex",
      position: "absolute",
      margin: "0",
      left: `${rect.left - or.left - op.clientLeft}px`,
      top: `${rect.top - or.top - op.clientTop}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`,
      pointerEvents: "none",
    });
    const anim = g.animate(
      [
        { transform: "scale(1)", opacity: 1 },
        { transform: "scale(0.6)", opacity: 0 },
      ],
      { duration: 200, easing: EASE.exit, fill: "forwards" }
    );
    const done = () => g.remove();
    anim.onfinish = anim.oncancel = done;
    window.setTimeout(done, 400);
  },

  // 넓게 모드의 버튼 줄: 지금 보기의 버튼(파일 탐색기의 새 노트·정렬 등)을 ··· 메뉴 대신 펼쳐 둔다.
  // 실행 버튼은 알약(.lg-nav-run) 하나로 묶고, 토글·메뉴 버튼은 단독 원형 버튼(.lg-nav-rest)으로 둔다.
  // 각 버튼은 원래 버튼을 대신 누른다. 원래 버튼의 상태(켜짐·기호·이름)가 바뀌면 따라 바꾼다. 보일지는 테마가 정한다
  renderNavRow(this: GlassShelfPlugin, tabsEl: HTMLElement) {
    const header = tabsEl.querySelector<HTMLElement>(":scope > .workspace-tab-header-container");
    if (!header) return;
    let row = header.querySelector<HTMLElement>(":scope > .lg-nav-row");
    if (!row) {
      row = createDiv({ cls: ["lg-nav-row", INJECTED] });
      row.createDiv("lg-nav-run");
      row.createDiv("lg-nav-rest");
      header.appendChild(row);
    }
    const leaf = this.activeLeafOf(tabsEl);
    const root = leaf && leaf.view ? leaf.view.containerEl : null;
    // 원래 버튼 줄을 지켜본다 (보기가 바뀌면 새 보기로 옮긴다)
    if (tabsEl.lgNavRoot !== root) {
      if (tabsEl.lgNavObs) tabsEl.lgNavObs.disconnect();
      tabsEl.lgNavRoot = root;
      tabsEl.lgNavObs = null;
      if (root) {
        const obs = new MutationObserver(() => {
          if (tabsEl.lgNavTimer) return;
          tabsEl.lgNavTimer = window.setTimeout(() => {
            tabsEl.lgNavTimer = 0;
            this.renderNavRow(tabsEl);
          }, 0);
        });
        root.querySelectorAll<HTMLElement>(":scope > .nav-header, :scope > .search-row").forEach((el: HTMLElement) =>
          obs.observe(el, { subtree: true, childList: true, attributes: true, attributeFilter: ["class", "aria-label", "style"] })
        );
        tabsEl.lgNavObs = obs;
        this.register(() => obs.disconnect());
      }
    }
    const buttons = this.navItemsOf(leaf);
    const kinds = buttons.map((b) => this.navKind(b));
    const run = row.querySelector<HTMLElement>(":scope > .lg-nav-run");
    const rest = row.querySelector<HTMLElement>(":scope > .lg-nav-rest");
    // 실행 버튼을 앞에, 나머지를 뒤에 (각각 원래 순서대로)
    const order = buttons.map((b, i) => i).filter((i) => kinds[i] === "run").concat(buttons.map((b, i) => i).filter((i) => kinds[i] !== "run"));
    const key = kinds.join(",");
    // 버튼 구성이 같으면 만든 버튼을 그대로 두고 상태만 고친다 (다시 만들면 누름 효과·호버가 끊긴다)
    let entering: HTMLElement[] | null = null;
    if (row.lgNavKey !== key || row.lgNavLeaf !== leaf) {
      // 보기가 바뀌어 버튼이 바뀔 때: 처음 그릴 때가 아니면 옛 버튼은 가운데로 줄어들며 자리를 거둬들이고, 새 버튼은 가운데서 퍼져 나온다
      // (편집창 뒤로·앞으로 버튼과 같은 방식, 사용자 요청). 처음 그릴 때는 바로 그린다
      const animate = row.lgNavKey != null && row.isConnected && row.offsetParent !== null;
      row.lgNavKey = key;
      row.lgNavLeaf = leaf;
      // 알약(.lg-nav-run)이 통째로 사라지거나 새로 생길 때는 알약째 움직인다. 안의 버튼만 움직이면 알약이 먼저 접혔다가 사라졌다 (사용자 지적)
      if (run.lgPillAnim) run.lgPillAnim.cancel();
      const oldRun = run.querySelectorAll<HTMLElement>(":scope > .lg-nav-btn:not(.lg-nav-leaving)").length;
      const newRun = kinds.filter((k) => k === "run").length;
      const pillLeave = animate && oldRun > 0 && newRun === 0;
      const pillEnter = animate && oldRun === 0 && newRun > 0;
      const olds = els(row.querySelectorAll<HTMLElement>(".lg-nav-btn:not(.lg-nav-leaving)"));
      // 자리는 모두 먼저 잰다: 하나를 띄우면 나머지가 당겨져, 차례로 재면 모두 첫 자리에 겹쳤다
      if (animate) olds.forEach((old) => this.navBtnMeasure(old));
      if (pillLeave) this.navPillPin(run);
      // 원형 버튼 묶음도 다 비면 크기를 고정한다. 높이가 0으로 줄어 사라지는 버튼이 아래로 밀렸다 (사용자 지적)
      const restEmpty = animate && rest.querySelector<HTMLElement>(":scope > .lg-nav-btn:not(.lg-nav-leaving)") && !kinds.some((k) => k !== "run");
      if (restEmpty) {
        this.navPillPin(rest);
        window.clearTimeout(rest.lgUnpinTimer);
        rest.lgUnpinTimer = window.setTimeout(() => rest.classList.remove("lg-nav-pinned"), 260);
      }
      for (const old of olds) {
        if (!animate) old.remove();
        else if (pillLeave && old.parentElement === run) old.classList.add("lg-nav-leaving");
        else this.navBtnLeave(old);
      }
      if (pillLeave) this.navPillLeave(run);
      if (animate) entering = [];
      run.lgPillEnter = !!pillEnter;
      order.forEach((i) => {
        const p = (kinds[i] === "run" ? run : rest).createDiv({ cls: ["clickable-icon", "lg-nav-btn"] });
        if (entering) entering.push(p);
        p.addEventListener("mousedown", (e) => {
          e.stopPropagation();
          p.lgWasOpen = !!(p.lgSrc && p.lgSrc.classList.contains("has-active-menu"));
          this.tellMenus(p, "mousedown");
        });
        p.addEventListener("pointerdown", (e) => e.stopPropagation());
        // 넓어진 검색 버튼: 검색 칸 위에서는 호버 유리를 보이지 않게 (돋보기 근처에서만, 사용자 요청)
        p.addEventListener("pointerover", (e) => p.classList.toggle("lg-nav-typing", isEl(e.target) && !!(e.target as HTMLElement).closest<HTMLElement>(".search-input-container")));
        p.addEventListener("pointerleave", () => p.classList.remove("lg-nav-typing"));
        p.addEventListener("click", (e) => {
          if (isEl(e.target) && (e.target as HTMLElement).closest<HTMLElement>(".search-input-container")) return;
          p.lgClickAt = performance.now();
          e.preventDefault();
          e.stopPropagation();
          const src = p.lgSrc;
          if (!src || !src.isConnected) return;
          // 이 버튼이 연 메뉴가 열려 있으면 닫기만 한다
          if (p.lgWasOpen) {
            p.lgWasOpen = false;
            this.tellMenus(src, "click");
            return;
          }
          this.clickOriginal(src, p);
        });
      });
    }
    const proxies = els(row.querySelectorAll<HTMLElement>(".lg-nav-btn:not(.lg-nav-leaving)"));
    order.forEach((bi, pi) => {
      const b = buttons[bi];
      const p = proxies[pi];
      if (!p) return;
      p.lgSrc = b;
      const svg = b.querySelector<HTMLElement>("svg");
      // 검색 버튼(돋보기 기호)은 테마가 패널 바깥쪽 끝에 둔다 (어느 보기·플러그인이든 같은 규칙)
      p.classList.toggle("lg-nav-find", !!svg && svg.classList.contains("lucide-search"));
      const icon = svg ? svg.getAttribute("class") : "";
      if (p.lgIcon !== icon) {
        p.lgIcon = icon;
        p.empty();
        if (svg) p.appendChild(svg.cloneNode(true));
      }
      const label = b.getAttribute("aria-label") || "";
      if (p.getAttribute("aria-label") !== label) setTooltip(p, label);
      p.classList.toggle("is-active", b.classList.contains("is-active"));
      p.classList.toggle("has-active-menu", b.classList.contains("has-active-menu"));
    });
    if (entering) {
      if (run.lgPillEnter) this.navBtnEnter(run);
      entering.forEach((p) => {
        if (!(run.lgPillEnter && p.parentElement === run)) this.navBtnEnter(p);
      });
    }
    // 새 보기에 버튼이 없으면 버튼 줄을 숨기는데, 사라지는 버튼이 있으면 다 줄어든 뒤에 숨긴다.
    // 둘째 줄 표시(lg-nav-two)도 함께 늦춘다: 먼저 떼면 아래 묶음에서 버튼 줄이 탭 알약 옆으로 올라가 사라지는 버튼이 자리를 옮기고 탭 알약이 좁아졌다 (사용자 지적)
    // 둘째 줄이 줄어드는 경우(아래 묶음)는 줄 자리를 바로 거둔다: 남겨 두면 새 보기(그래프 설정 버튼 등)가 빈 칸 아래에 있다가 올라왔다 (사용자 지적).
    // 버튼 줄은 그 자리에 띄워 두고(.lg-nav-row-out), 헤더 아래 여백을 줄어든 높이만큼에서 0으로 줄여 내용이 부드럽게 올라오게 한다
    window.clearTimeout(row.lgNoneTimer);
    if (buttons.length === 0 && row.querySelector<HTMLElement>(".lg-nav-leaving")) {
      if (tabsEl.classList.contains("lg-nav-two") && !row.classList.contains("lg-nav-row-out")) {
        const h0 = header.offsetHeight;
        const cb = row.offsetParent;
        const rr = row.getBoundingClientRect();
        const cr = cb ? cb.getBoundingClientRect() : null;
        tabsEl.classList.remove("lg-nav-two");
        if (cb && header.offsetHeight < h0) {
          row.setCssProps({ "--lg-rx": `${rr.left - cr.left - cb.clientLeft}px`, "--lg-ry": `${rr.top - cr.top - cb.clientTop}px`, "--lg-rw": `${rr.width}px` });
          row.classList.add("lg-nav-row-out");
          this.navRowCollapse(tabsEl, header, h0);
        } else tabsEl.classList.add("lg-nav-two");
      }
      row.lgNoneTimer = window.setTimeout(() => {
        const none = !row.querySelector<HTMLElement>(".lg-nav-btn:not(.lg-nav-leaving)");
        row.classList.remove("lg-nav-row-out");
        row.classList.toggle("lg-nav-none", none);
        tabsEl.classList.toggle("lg-nav-two", !none);
      }, 260);
    } else {
      if (row.classList.contains("lg-nav-row-out")) {
        row.classList.remove("lg-nav-row-out");
        if (tabsEl.lgCollapseEnd) tabsEl.lgCollapseEnd();
      }
      row.classList.toggle("lg-nav-none", buttons.length === 0);
      tabsEl.classList.toggle("lg-nav-two", buttons.length > 0);
    }
    // 탭이 하나뿐인 묶음 (CSS: .workspace-tabs.lg-one). 테마가 :has(… :only-child) 로 보던 것을 대신한다.
    // 목록 방식 패널은 탭이 하나여도 목록으로 두고(lg-one 없음), 목록 높이를 정할 탭 수(--lg-tab-n)를 알린다
    const inner = header.querySelector<HTMLElement>(":scope > .workspace-tab-header-container-inner");
    const count = inner ? inner.querySelectorAll<HTMLElement>(":scope > .workspace-tab-header").length : 0;
    const listed = !!tabsEl.closest(".lg-tab-list");
    tabsEl.classList.toggle("lg-one", !listed && count === 1);
    const n = String(Math.max(1, count));
    if (tabsEl.style.getPropertyValue("--lg-tab-n") !== n) tabsEl.setCssProps({ "--lg-tab-n": n });
    // 목록 방식: 탭 목록 맨 밑에 고른 탭 이름을 옅은 회색 구역 제목으로 단다 (macOS 사이드바 구역 제목처럼, 사용자 요청)
    // 탭이 하나뿐인 묶음은 고를 게 없어 달지 않는다 (사용자 요청)
    let sec = header.querySelector<HTMLElement>(":scope > .lg-list-section");
    const withSec = listed && count > 1;
    tabsEl.classList.toggle("lg-sec", withSec);
    if (withSec) {
      if (!sec) sec = header.createDiv({ cls: ["lg-list-section", INJECTED] });
      const name = leaf ? leaf.getDisplayText() : "";
      if (sec.textContent !== name) sec.setText(name);
    } else if (sec) sec.remove();
    this.navSearchSync(tabsEl);
  },

  // 패널 검색 (넓게 모드, 사용자 요청): 버튼 줄에 자리가 넉넉하면 돋보기 버튼이 알약으로 넓어지고 Obsidian 검색 칸이 그 안에 들어간다
  // (칸반 검색과 같은 방식). 켜고 끄는 것은 Obsidian 이 정하고(원래 버튼), 여기서는 켜져 있는 동안 검색 칸 자리만 옮긴다.
  // 남는 폭이 NAV_SEARCH_MIN 보다 적으면 머리 줄의 원래 자리에 둔다. 옮겨 온 동안은 tabsEl.lgSearchIn 에 기억한다.
  // 넓게 썼으면 true (머리 줄 검색창의 나타남·사라짐 움직임은 건너뛴다)
  navSearchSync(this: GlassShelfPlugin, tabsEl: HTMLElement) {
    const doc = tabsEl.ownerDocument;
    const header = tabsEl.querySelector<HTMLElement>(":scope > .workspace-tab-header-container");
    const row = header && header.querySelector<HTMLElement>(":scope > .lg-nav-row");
    const leaf = this.activeLeafOf(tabsEl);
    const root = leaf && leaf.view ? leaf.view.containerEl : null;
    const cur = tabsEl.lgSearchIn || null;
    const ok = row && root && !this.unloaded && this.tabWideOf(tabsEl) && !tabsEl.classList.contains("lg-nav-fold");
    const p = ok
      ? els(row.querySelectorAll<HTMLElement>(".lg-nav-btn:not(.lg-nav-leaving)")).find(
          (x) => x.lgSrc && x.lgSrc.isConnected && root.contains(x.lgSrc) && x.lgSrc.querySelector<HTMLElement>(".lucide-search")
        )
      : null;
    const head = p ? p.lgSrc.closest<HTMLElement>(".nav-header") : null;
    const sc = cur && cur.head === head ? cur.sc : head && head.querySelector<HTMLElement>(":scope > .search-input-container");
    let w = 0;
    if (p && sc && sc.style.display !== "none") {
      const base = p.offsetHeight;
      const parts = els(row.querySelectorAll<HTMLElement>(":scope > .lg-nav-run, :scope > .lg-nav-rest")).filter((x) => x.childElementCount > 0);
      const gap = parseFloat(getComputedStyle(row).columnGap) || 0;
      // 넓어지는 중일 수 있어 검색 버튼은 원래 크기로 친다.
      // 폭은 배치 폭(offsetWidth)으로 잰다: 다른 탭에서 돌아오면 버튼 묶음이 커지며 나타나는(navBtnEnter, scale) 중이라
      // 화면 폭(getBoundingClientRect)으로 재면 잴 때마다 검색 칸 폭이 달라져 덜 펼쳐지거나 오른쪽 버튼을 밀었다 (사용자 지적)
      const need = parts.reduce((sum, x) => sum + x.offsetWidth, 0) + gap * Math.max(0, parts.length - 1) - (p.offsetWidth - base);
      const free = row.getBoundingClientRect().width - need;
      if (free >= NAV_SEARCH_MIN) w = base + Math.min(NAV_SEARCH_MAX - base, free);
    }
    if (cur && (!w || cur.p !== p || cur.sc !== sc)) this.navSearchOut(tabsEl);
    if (!w) return !!cur;
    // 폭을 먼저 정한다: 클래스를 붙인 뒤 폭 없이 스타일이 한 번 계산되면(포커스가 그렇게 한다) 폭이 auto 로 튀어 넓어지는 전환이 없었다
    p.setCssProps({ "--lg-ns-w": `${w}px` });
    if (!tabsEl.lgSearchIn) {
      const input = sc.querySelector("input");
      const focused = !!input && doc.activeElement === input;
      p.appendChild(sc);
      p.classList.add("lg-nav-search");
      // 버튼을 눌러 켰으면 바로 입력할 수 있게 (앱을 켤 때 되살아난 검색창은 포커스를 빼앗지 않는다)
      if (input && (focused || performance.now() - (p.lgClickAt || 0) < 600)) input.focus();
      // 원래 머리 줄을 떠났으므로 버튼 줄 감시(머리 줄)로는 꺼짐을 알 수 없어 따로 지켜본다
      const mo = new MutationObserver(() => this.navSearchSync(tabsEl));
      mo.observe(sc, { attributes: true, attributeFilter: ["style"] });
      tabsEl.lgSearchIn = { p, sc, head, mo };
    }
    return true;
  },

  // 넓혀 둔 검색 칸을 원래 머리 줄로 돌려보내고 버튼을 원으로 되돌린다 (머리 줄이 닫힌 보기여도 돌려보낸다)
  // 버튼이 사라지는 중이면(다른 보기로 바뀜) 버튼은 넓은 채로 두고 검색 칸 사본을 남겨, 버튼과 함께 줄며 흐려지게 한다.
  // 켜진 채로 돌려보내면(패널이 좁아짐) 머리 줄 검색창이 나타나는 움직임을 건다
  navSearchOut(this: GlassShelfPlugin, tabsEl: HTMLElement) {
    const cur = tabsEl.lgSearchIn;
    if (!cur) return;
    tabsEl.lgSearchIn = null;
    cur.mo.disconnect();
    const leaving = cur.p.classList.contains("lg-nav-leaving");
    const show = !leaving && !this.unloaded && cur.sc.style.display !== "none" && cur.head.isConnected;
    const below = show ? this.headBelow(cur.head) : null;
    if (leaving) {
      const ghost = cur.sc.cloneNode(true) as HTMLElement;
      const input = cur.sc.querySelector("input");
      const gInput = ghost.querySelector("input");
      if (input && gInput) gInput.value = input.value;
      ghost.classList.add(INJECTED);
      cur.p.appendChild(ghost);
    }
    cur.head.appendChild(cur.sc);
    if (!leaving) {
      cur.p.classList.remove("lg-nav-search");
      cur.p.style.removeProperty("--lg-ns-w");
    }
    // 머리 줄 판정(lg-bare-head, MutationObserver)이 먼저 돈 뒤에 잰다 (둘 다 그리기 전)
    if (show) queueMicrotask(() => cur.sc.getClientRects().length && this.headSearchIn(cur.sc, below));
  },

  // 머리 줄 아래 내용의 지금 자리. 칸이 아니라 안의 첫 내용으로 잰다: 머리 줄 판정(lg-bare-head)이 바뀌면 칸의 위 여백이 함께 바뀌어
  // 칸 자체는 탭 줄 높이만큼 더 움직이지만 내용은 검색창 높이만큼만 움직인다
  headBelow(this: GlassShelfPlugin, head: HTMLElement): [HTMLElement, number][] {
    const out: [HTMLElement, number][] = [];
    for (let k = head.nextElementSibling as HTMLElement | null; k; k = k.nextElementSibling as HTMLElement | null) out.push([k, (k.firstElementChild || k).getBoundingClientRect().top]);
    return out;
  },

  // 머리 줄 아래 내용이 headBelow 로 잰 자리에서 지금 자리로 미끄러진다
  headSlide(this: GlassShelfPlugin, below: [HTMLElement, number][], duration: number) {
    for (const [k, top] of below) {
      const dy = top - (k.firstElementChild || k).getBoundingClientRect().top;
      if (Math.abs(dy) > 0.5) k.animate([{ transform: `translateY(${dy}px)` }, { transform: "translateY(0)" }], { duration, easing: EASE.settle });
    }
  },

  // 머리 줄 검색창이 나타남: 0.4배에서 살짝 넘치며 커지고, 아래 내용은 미끄러져 내려간다
  headSearchIn(this: GlassShelfPlugin, sc: HTMLElement, below: [HTMLElement, number][] | null) {
    const opt = { duration: 260, easing: EASE.pop };
    this.headSlide(below, opt.duration);
    sc.animate(
      [
        { transform: "scale(0.4)", opacity: 0 },
        { transform: "scale(1)", opacity: 1 },
      ],
      opt
    );
  },

  // 넓게 모드 버튼 줄의 버튼이 나타나고 사라지는 움직임 (사용자 요청): 제자리에서 가로세로가 같이 줄어들며 흐려지고,
  // 나타날 때는 반대로 제자리에서 커지며 또렷해진다. 자리를 밀거나 당기지 않는다.
  // 사라지는 버튼은 원래 자리 그대로 띄워(배치에서 빼) 새 버튼이 처음부터 제자리에 놓이게 한다 (CSS: .lg-nav-leaving).
  // 부모(알약 .lg-nav-run 또는 원형 버튼 묶음)는 바꾸지 않는다: 원형 버튼의 유리는 부모 기준 규칙이라 옮기면 사라진다.
  // 띄우는 기준은 위치 기준 요소(offsetParent)
  navBtnMeasure(this: GlassShelfPlugin, p: HTMLElement) {
    const cb = p.offsetParent;
    if (!cb) return;
    const cr = cb.getBoundingClientRect();
    const br = p.getBoundingClientRect();
    p.setCssProps({ "--lg-gx": `${br.left - cr.left - cb.clientLeft}px`, "--lg-gy": `${br.top - cr.top - cb.clientTop}px`, "--lg-gw": `${br.width}px`, "--lg-gh": `${br.height}px` });
    p.lgMeasured = true;
  },

  // 둘째 줄이 빠질 때 내용이 올라오는 움직임: 헤더는 내용 위에 떠 있고 내용은 탭 줄 높이(--header-height)만큼 내려 두므로,
  // 그 값을 옛 높이에서 새 높이로 프레임마다 줄인다. 그동안 헤더 자체는 새 높이로 묶어 탭 알약이 움직이지 않게 한다
  navRowCollapse(this: GlassShelfPlugin, tabsEl: HTMLElement, header: HTMLElement, h0: number) {
    if (tabsEl.lgCollapseEnd) tabsEl.lgCollapseEnd();
    const h1 = header.offsetHeight;
    header.setCssProps({ height: `${h1}px` });
    const t0 = window.performance.now();
    let raf = 0;
    const end = () => {
      window.cancelAnimationFrame(raf);
      tabsEl.style.removeProperty("--header-height");
      header.style.removeProperty("height");
      if (tabsEl.lgCollapseEnd === end) tabsEl.lgCollapseEnd = null;
    };
    const step = (now: number) => {
      const u = Math.min(1, Math.max(0, (now - t0) / 240));
      const e = 1 - Math.pow(1 - u, 3);
      tabsEl.setCssProps({ "--header-height": `${h0 + (h1 - h0) * e}px` });
      if (u < 1) raf = window.requestAnimationFrame(step);
      else end();
    };
    tabsEl.lgCollapseEnd = end;
    step(t0);
  },

  navBtnLeave(this: GlassShelfPlugin, p: HTMLElement) {
    if (!p.lgMeasured) return p.remove();
    p.classList.add("lg-nav-leaving");
    const anim = p.animate(
      [
        { transform: "scale(1)", opacity: 1 },
        { transform: "scale(0.4)", opacity: 0 },
      ],
      { duration: 200, easing: EASE.exit, fill: "forwards" }
    );
    const done = () => p.remove();
    anim.onfinish = anim.oncancel = done;
    window.setTimeout(done, 400);
  },

  // 알약째 사라질 때: 크기를 지금 그대로 고정하고(안의 버튼이 배치에서 빠져도 접히지 않게) 제자리에서 줄어들며 흐려진다
  navPillPin(this: GlassShelfPlugin, run: HTMLElement) {
    const r = run.getBoundingClientRect();
    run.setCssProps({ "--lg-pw": `${r.width}px`, "--lg-ph": `${r.height}px` });
    run.classList.add("lg-nav-pinned");
  },

  navPillLeave(this: GlassShelfPlugin, run: HTMLElement) {
    const anim = run.animate(
      [
        { transform: "scale(1)", opacity: 1 },
        { transform: "scale(0.4)", opacity: 0 },
      ],
      { duration: 200, easing: EASE.exit, fill: "forwards" }
    );
    run.lgPillAnim = anim;
    let ended = false;
    const done = () => {
      if (ended) return;
      ended = true;
      if (run.lgPillAnim === anim) run.lgPillAnim = null;
      run.querySelectorAll<HTMLElement>(":scope > .lg-nav-leaving").forEach((g) => g.remove());
      run.classList.remove("lg-nav-pinned");
      anim.cancel();
    };
    anim.onfinish = anim.oncancel = done;
    window.setTimeout(done, 400);
  },

  navBtnEnter(this: GlassShelfPlugin, p: HTMLElement) {
    p.animate(
      [
        { transform: "scale(0.4)", opacity: 0 },
        { transform: "scale(1)", opacity: 1 },
      ],
      { duration: 240, easing: EASE.settle }
    );
  },

  // 버튼 종류: "menu" = 누르면 메뉴가 뜬다, "toggle" = 켜고 끈다(모두 접기·펼치기 포함, 사용자 요청), "run" = 눌러서 실행
  navKind(this: GlassShelfPlugin, b: HTMLElement) {
    if (this.opensMenu(b)) return "menu";
    const label = b.getAttribute("aria-label") || "";
    const svg = b.querySelector<HTMLElement>("svg");
    const icon = svg ? svg.getAttribute("class") || "" : "";
    // 한 번이라도 켜짐 표시가 붙었던 버튼은 토글
    this.toggleLabels = this.toggleLabels || new Set();
    if (b.classList.contains("is-active")) this.toggleLabels.add(label);
    if (this.toggleLabels.has(label)) return "toggle";
    if (/lucide-(chevrons-down-up|chevrons-up-down|gallery-vertical|sliders)/.test(icon)) return "toggle";
    if (/접기|펼치기|자동|보기|표시|설정|필터|collapse|expand|auto|show|toggle|setting|filter/i.test(label)) return "toggle";
    return "run";
  },

  // 패널 탭 알약을 패널 머리 줄 가운데에 둔다. 알약 양옆 버튼(닫기····)의 폭 차이만큼 좁은 쪽에 빈칸을 둔다.
  // 자리가 넉넉하면 가운데, 모자라면 빈칸부터 줄어 알약이 밀리고, 그래도 모자라면 알약 안에서 스크롤된다.
  // ··· 이 접히고 펼쳐지는 애니메이션과 같이 움직이도록, 재는 값은 애니메이션 중의 자리가 아니라 접힘 여부로 정한다
  balanceSide(this: GlassShelfPlugin, tabsEl: HTMLElement) {
    const header = tabsEl.querySelector<HTMLElement>(":scope > .workspace-tab-header-container");
    const inner = header && header.querySelector<HTMLElement>(":scope > .workspace-tab-header-container-inner");
    if (!inner) return;
    let sp = header.querySelector<HTMLElement>(":scope > .lg-side-balance");
    if (!sp) {
      sp = createDiv({ cls: ["lg-side-balance", INJECTED] });
      header.insertBefore(sp, inner);
    }
    // 패널 탭 알약의 링 그림자 층 (테마 .lg-ptab-ring). 알약은 가로로 스크롤되어 제 ::before 에 그리면 같이 밀리고 잘린다:
    // 알약 바로 앞 형제로 두고 테마가 앵커 위치로 알약에 겹친다 (앞에 있어야 알약 유리 아래에 그려진다)
    if (!header.querySelector(":scope > .lg-ptab-ring")) header.insertBefore(createDiv({ cls: ["lg-ptab-ring", INJECTED] }), inner);
    const gap = parseFloat(getComputedStyle(header).columnGap) || 0;
    const kids = els(header.children).filter(
      (c) => c !== sp && c !== inner && !c.classList.contains("lg-seg-indicator") && c.getClientRects().length && getComputedStyle(c).position !== "absolute"
    );
    // 머리 줄 안쪽 여백(창 제어 자리 등)도 양옆 고정 자리로 셈해, 패널 전체 기준으로 가운데 둔다.
    // 왼쪽 패널은 리본이 패널 왼쪽에 붙어 있으므로 리본까지 포함한 폭의 가운데에 둔다
    const cs = getComputedStyle(header);
    let L = parseFloat(cs.paddingLeft) || 0;
    let R = parseFloat(cs.paddingRight) || 0;
    if (header.closest<HTMLElement>(".mod-left-split")) {
      const ribbon = header.ownerDocument.querySelector<HTMLElement>(".workspace-ribbon:is(.mod-left, .mod-primary)");
      const rr = ribbon && ribbon.getClientRects().length ? ribbon.getBoundingClientRect() : null;
      const hl = header.getBoundingClientRect().left;
      if (rr && rr.width > 0.5 && rr.left < hl) L += hl - rr.left;
    }
    let after = false;
    for (const c of els(header.children)) {
      if (c === inner) after = true;
      if (!kids.includes(c)) continue;
      const w = c.classList.contains("lg-nav-more-off") ? 0 : c.offsetWidth + gap;
      if (after) R += w;
      else L += w;
    }
    const diff = R - L;
    const w = Math.abs(diff);
    if (w < 1) {
      sp.style.removeProperty("flex-basis");
      sp.classList.toggle("lg-basis-0", true);
      return;
    }
    const want = diff > 0 ? inner : inner.nextSibling;
    if (diff > 0 ? sp.nextSibling !== inner : sp.previousSibling !== inner) header.insertBefore(sp, want);
    sp.classList.toggle("lg-basis-0", false);
    sp.style.flexBasis = `${w.toFixed(1)}px`;
  },

  // 사이드바 탭의 ··· 메뉴에 넣을 원래 버튼들: 버튼 줄(숨겨지지 않은 것) + 검색 탭의 검색 설정 버튼
  navItemsOf(this: GlassShelfPlugin, leaf: WorkspaceLeaf) {
    if (!leaf || !leaf.view || !leaf.view.containerEl) return [];
    const root = leaf.view.containerEl;
    const items = els(root.querySelectorAll<HTMLElement>(":scope > .nav-header .nav-buttons-container > .clickable-icon")).filter(
      (b) => b.style.display !== "none"
    );
    const searchSettings = root.querySelector<HTMLElement>(":scope > .search-row > .clickable-icon");
    if (searchSettings) items.push(searchSettings);
    return items;
  },

  // 메뉴에 넣을 게 없는 탭이면 ··· 을 접는다
  updateNavMore(this: GlassShelfPlugin, tabsEl: HTMLElement) {
    const btn = tabsEl.querySelector<HTMLElement>(":scope > .workspace-tab-header-container > .lg-nav-more");
    if (!btn) return;
    btn.classList.toggle("lg-nav-more-off", this.navItemsOf(this.activeLeafOf(tabsEl)).length === 0);
    this.renderNavRow(tabsEl);
    this.balanceSide(tabsEl);
    // 보기가 바뀌어 버튼 수가 달라지면 다시 본다. 버튼이 나타나고 사라지는 애니메이션(약 0.25초)이 끝난 뒤에도 한 번 더
    this.navFoldCheck(tabsEl);
    window.clearTimeout(tabsEl.lgFoldTimer);
    tabsEl.lgFoldTimer = window.setTimeout(() => !this.unloaded && this.navFoldCheck(tabsEl), 300);
  },

  openNavMenu(this: GlassShelfPlugin, tabsEl: HTMLElement, anchor: HTMLElement) {
    const leaf = this.activeLeafOf(tabsEl);
    const buttons = this.navItemsOf(leaf);
    // 메뉴를 여는 버튼(정렬 등)은 그 메뉴를 보이지 않게 열어 항목을 읽어 둔 뒤 하위 메뉴로 단다 (사용자 요청:
    // 누르면 부모 메뉴가 닫히고 하위 메뉴 화살표도 없었다). 읽는 동안 메뉴는 아직 열지 않는다
    if (!anchor.lgNavSnap) {
      const subs = buttons.filter((b) => this.opensMenu(b));
      if (subs.length) {
        anchor.lgNavSnap = true;
        const snaps = new Map<HTMLElement, MenuSnap[] | null>();
        void subs
          .reduce<Promise<unknown>>((p, b) => p.then(() => this.withHiddenMenu(b, (m) => this.readMenu(m)).then((v) => v && snaps.set(b, v))), Promise.resolve())
          .then(() => {
            anchor.lgNavSnap = false;
            this.showNavMenu(buttons, anchor, snaps);
          });
        return;
      }
    }
    this.showNavMenu(buttons, anchor, new Map());
  },

  showNavMenu(this: GlassShelfPlugin, buttons: HTMLElement[], anchor: HTMLElement, snaps: Map<HTMLElement, MenuSnap[] | null>) {
    const menu = new Menu();
    if (buttons.length === 0) {
      menu.addItem((item) => item.setTitle(tr("사용할 메뉴가 없습니다", "No menu items available")).setDisabled(true));
    }
    for (const b of buttons) {
      const svg = b.querySelector<HTMLElement>("svg");
      const icon = svg ? strs(svg.classList).find((c) => c.startsWith("lucide-")) : null;
      const snap = snaps.get(b);
      if (snap && snap.length) {
        menu.addItem((item) => {
          item.setTitle(b.getAttribute("aria-label") || "").setIcon(icon || null);
          const sub = item.setSubmenu();
          snap.forEach((it, i: number) => {
            if (it.sep) return sub.addSeparator();
            sub.addItem((si) => {
              si.setTitle(it.title).setIcon(it.icon || null);
              if (it.checked) si.setChecked(true);
              if (it.disabled) si.setDisabled(true);
              // 메뉴가 닫힌 뒤 원래 메뉴를 보이지 않게 다시 열어 같은 자리 항목을 누른다
              si.onClick(() => window.setTimeout(() => {
                void this.withHiddenMenu(b, (m) => {
                  const el = m.querySelectorAll<HTMLElement>(".menu-item, .menu-separator")[i];
                  if (el) el.click();
                });
              }, 0));
            });
          });
        });
        continue;
      }
      menu.addItem((item) => {
        item.setTitle(b.getAttribute("aria-label") || "").setIcon(icon || null);
        if (b.hasClass("is-active")) item.setChecked(true);
        item.onClick(() => this.clickOriginal(b, anchor, 0));
      });
    }

    // 양쪽 패널 모두 ··· 이 탭 줄 오른쪽 끝이라, 메뉴 오른쪽 끝을 ··· 버튼 오른쪽 끝에 맞춰 왼쪽으로 펼친다.
    // Obsidian 은 width·overlap 을 주면 x ~ x+width 사이에 붙이고, left 면 오른쪽 끝을 x+width 에 둔다
    const r = anchor.getBoundingClientRect();
    menu.setParentElement(anchor);
    menu.showAtPosition({ x: r.right - 1, y: r.bottom + MENU_DROP, width: 1, overlap: true, left: true });
  },

  // 모바일 서랍의 보기 전환 줄(테마가 Obsidian 보기 목록을 가로 알약으로 펼친 것)에 렌즈를 붙인다.
  // 목록 항목의 .is-active 는 Obsidian 이 바꾼다 (recomputeChildrenDimensions)
  watchDrawerTabs(this: GlassShelfPlugin, drawer: WorkspaceItem | null) {
    const opts = drawer && drawer.containerEl && drawer.containerEl.querySelector<HTMLElement>(".workspace-drawer-tab-options");
    const list = opts && opts.querySelector<HTMLElement>(":scope > .workspace-drawer-tab-options-list");
    if (!list || this.segWatched.has(opts)) return;
    this.segWatched.add(opts);
    const lens = new SegmentLens(opts, list, this);
    // 모바일 서랍 보기 전환은 렌즈가 위아래로 커지지 않는다 (사용자 요청)
    lens.keepH = true;
    // 렌즈 크기별 굴절 지도를 쉬는 틈에 미리 굽는다: 굽지 않으면 첫 전환 동안 매 프레임 그 자리에서 구워 첫 전환만 느렸다
    // (사용자 지적: 처음만 느리고 그다음부터 빠르다). 패널 탭 렌즈와 같다 (watchTabs).
    // 닫힌 서랍은 숨겨져(display: none) 탭 크기가 0 이라 못 재므로, 목록 크기가 생기거나 바뀔 때마다 부른다 (같은 크기는 한 번만 굽는다)
    const bakeRo = new ResizeObserver(() => lens.prebakeAll());
    bakeRo.observe(list);
    this.register(() => bakeRo.disconnect());
    const current = () => list.querySelector<HTMLElement>(":scope > .workspace-tab-header.is-active");
    let last = current();
    const obs = new MutationObserver(() => {
      const cur = current();
      if (cur && last && cur !== last && last.isConnected && list.children.length > 1) lens.moveTo(last, cur);
      last = cur;
    });
    obs.observe(list, { subtree: true, childList: true, attributes: true, attributeFilter: ["class"] });
    this.observers.push(obs);
    this.register(() => lens.stop());
  },

  // 모바일 서랍: 지금 보기의 버튼 줄(새 노트·새 폴더·정렬 등, 테마가 숨긴다)을 서랍 머리 오른쪽 ··· 버튼의 메뉴로 모은다.
  // 메뉴 항목을 누르면 원래 버튼을 눌러 Obsidian 동작을 그대로 쓴다. 버튼 줄이 없는 보기에서는 ··· 을 숨긴다
  setupDrawerMore(this: GlassShelfPlugin, drawer: WorkspaceItem | null) {
    const c = drawer && drawer.containerEl;
    const head = c && c.querySelector<HTMLElement>(".workspace-drawer-header");
    const content = c && c.querySelector<HTMLElement>(".workspace-drawer-active-tab-content");
    if (!head || !content || head.querySelector<HTMLElement>(":scope > .lg-drawer-more")) return;
    // 휴대폰: 테마가 보관함 줄을 목록 위에 겹쳐 두므로(목록이 그 뒤로 지나간다) 줄 높이를 재어 서랍에 넣는다.
    // 테마가 목록 끝 여백을 그만큼 늘려 마지막 항목이 줄에 가리지 않게 한다 (값이 없으면 테마가 어림값을 쓴다)
    if (Platform.isPhone) {
      const win = c.ownerDocument.defaultView || window;
      // 닫힌 서랍은 숨겨져(display: none) 높이가 0 이라 그때는 쓰지 않는다: 닫을 때 0, 열 때 87px 로 오가며 서랍 아래 요소
      // 약 500개의 스타일을 열 때마다 한 번 더 계산했다 (검토 측정: 첫 화면까지 약 25ms). 같은 값도 다시 쓰지 않는다
      const put = () => {
        const h = head.offsetHeight;
        if (!h) return;
        const v = `${h}px`;
        if (c.style.getPropertyValue("--lg-dhead-h") !== v) c.style.setProperty("--lg-dhead-h", v);
      };
      const ro = new win.ResizeObserver(put);
      ro.observe(head);
      put();
      this.register(() => {
        ro.disconnect();
        c.style.removeProperty("--lg-dhead-h");
      });
    }
    const btn = head.createDiv({ cls: ["clickable-icon", "workspace-drawer-header-icon", "mod-raised", "lg-drawer-more", INJECTED] });
    setIcon(btn, "more-horizontal");
    btn.setAttribute("aria-label", tr("메뉴", "Menu"));
    // 버튼 줄 + 검색 탭의 검색 설정 버튼 (테마가 숨긴다. 데스크톱 navItemsOf 와 같다)
    const buttons = () => {
      const bar = content.querySelector<HTMLElement>(".nav-buttons-container");
      const list = bar
        ? els(bar.querySelectorAll<HTMLElement>(":scope > .clickable-icon")).filter((b) => b.style.display !== "none" && !b.classList.contains("is-hidden"))
        : [];
      const searchSettings = content.querySelector<HTMLElement>('.workspace-leaf-content[data-type="search"] > .search-row > .clickable-icon');
      if (searchSettings) list.push(searchSettings);
      return list;
    };
    const sync = () => btn.toggle(buttons().length > 0);
    sync();
    btn.addEventListener("click", (e: MouseEvent) => {
      // 이 버튼의 메뉴가 열려 있으면 닫기만 한다. 터치의 누름은 버튼 안이라 Obsidian 이 메뉴를 닫지 않고,
      // 그대로 새 메뉴를 열면 열린 메뉴 위에 하위 메뉴처럼 떠 왼쪽 위 기준으로 커지고 줄었다
      if (btn.classList.contains("has-active-menu")) {
        this.tellMenus(btn, "click");
        return;
      }
      // 다른 메뉴가 열려 있으면 먼저 닫는다
      if (btn.ownerDocument.querySelector<HTMLElement>(".menu:not(.lg-menu-ghost)")) this.tellMenus(btn, "mousedown");
      const list = buttons();
      if (!list.length) return;
      const menu = new Menu();
      for (const b of list) {
        const svg = b.querySelector<HTMLElement>("svg");
        const icon = svg && strs(svg.classList).find((k) => k !== "svg-icon");
        menu.addItem((item) => {
          item.setTitle(b.getAttribute("aria-label") || "");
          if (icon) item.setIcon(icon);
          if (b.classList.contains("is-active")) item.setChecked(true);
          // 메뉴가 닫힌 다음 누른다 (정렬처럼 버튼이 다시 메뉴를 여는 경우)
          item.onClick(() => window.setTimeout(() => b.isConnected && b.click(), 0));
        });
      }
      // 데스크톱 ··· 처럼 버튼에 붙여 연다: 오른쪽 끝을 버튼 오른쪽 끝에 맞춰 왼쪽으로 펼친다.
      // 버튼이 화면 아래쪽(보관함 줄)이면 버튼 위로 연다. Obsidian 은 메뉴가 아래로 넘치면 y 위로 올려 둔다
      const r = btn.getBoundingClientRect();
      const winH = btn.ownerDocument.documentElement.clientHeight;
      const up = r.top + r.height / 2 > winH / 2;
      menu.setParentElement(btn);
      menu.showAtPosition({ x: r.right - 1, y: up ? r.top - MENU_DROP : r.bottom + MENU_DROP, width: 1, overlap: true, left: true });
    });
    // 보기가 바뀌거나(active-tab-content 의 자식 교체) 보기가 늦게 그려질 때 ··· 을 보이거나 숨긴다
    // 목록(파일 탐색기·검색 결과 등)은 스크롤할 때마다 줄이 바뀐다. 그 안의 변화는 버튼 줄과 무관하니 다시 세지 않는다 (검토 지적: 스크롤마다 sync 가 돌았다)
    const LIST = ".nav-files-container, .tree-item-children, .search-result-container, .search-results-children";
    const obs = new MutationObserver((recs) => {
      if (recs.every((r) => r.target.nodeType === 1 && (r.target as Element).closest<HTMLElement>(LIST))) return;
      sync();
    });
    obs.observe(content, { subtree: true, childList: true });
    this.observers.push(obs);
  },

  // 사이드바 탭 그룹마다 렌즈 하나를 붙이고 선택 변화를 지켜본다
  watchSegments(this: GlassShelfPlugin, tabsEl: HTMLElement) {
    if (this.segWatched.has(tabsEl)) return;
    const header = tabsEl.querySelector<HTMLElement>(":scope > .workspace-tab-header-container");
    const inner = header && header.querySelector<HTMLElement>(":scope > .workspace-tab-header-container-inner");
    if (!inner) return;
    this.segWatched.add(tabsEl);

    const lens = new SegmentLens(header, inner, this);
    // 묶음의 모든 탭을 미리 굽는다: 렌즈 크기는 도착 탭 폭에 따르므로 선택 탭만 구우면 폭이 다른 탭으로 갈 때 전환 중에 구웠다
    // (데스크톱 측정: 전환 한 번에 지도 11장, 91·157ms 긴 작업)
    lens.prebakeAll();
    // 알약이 좁아 탭이 스크롤되면 유리 층(::after)이 따라 밀리지 않게 되돌려 둔다
    this.registerDomEvent(inner, "scroll", () => inner.style.setProperty("--lg-sx", `${inner.scrollLeft}px`), { passive: true });
    // 패널을 닫았다 열거나 폭이 바뀌면 가운데 맞춤을 다시 잰다. 닫힌 동안 잰 값(버튼이 안 보여 0)이 남아
    // 알약이 한쪽으로 치우치던 것
    const win = header.ownerDocument.defaultView || window;
    let rb = 0;
    const ro = new win.ResizeObserver(() => {
      if (rb) return;
      rb = win.requestAnimationFrame(() => {
        rb = 0;
        if (header.isConnected && header.getBoundingClientRect().width > 0) this.balanceSide(tabsEl);
      });
    });
    ro.observe(header);
    this.register(() => ro.disconnect());
    const current = () => inner.querySelector<HTMLElement>(":scope > .workspace-tab-header.is-active");
    let last = current();

    const obs = new MutationObserver(() => {
      const cur = current();
      if (cur && last && cur !== last && last.isConnected && inner.children.length > 1) lens.moveTo(last, cur);
      if (cur !== last) this.updateNavMore(tabsEl);
      else {
        this.renderNavRow(tabsEl); // 탭이 생기거나 사라졌을 때 (lg-one)
        lens.prebakeAll(); // 새 탭 폭의 지도를 쉬는 틈에 미리 굽는다 (같은 크기는 건너뛴다)
      }
      last = cur;
    });
    obs.observe(inner, { subtree: true, childList: true, attributes: true, attributeFilter: ["class"] });
    this.observers.push(obs);

    this.register(() => lens.stop());
  },
};