import type { Palette } from "./settings";
import { tr, newEl } from "./util";

// 색을 sRGB 로 바꿀 때 쓰는 1px 캔버스 (한 번 만들어 같이 쓴다)
let lightCanvas: CanvasRenderingContext2D | null = null;
const canvasOf = (doc: Document): CanvasRenderingContext2D => {
  if (!lightCanvas) lightCanvas = newEl(doc || document, "canvas").getContext("2d", { willReadFrequently: true });
  if (!lightCanvas) throw new Error("canvas");
  return lightCanvas;
};

// CSS 색을 검정 쪽으로 k 만큼 섞은 rgb(). 캔버스로 sRGB 로 바꾼다
export const colorDim = function (c: string, k: number, doc: Document): string {
  try {
    const ctx = canvasOf(doc);
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = "#000";
    ctx.fillStyle = c;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
    const f = (v: number) => Math.round(v * (1 - k));
    return `rgb(${f(r)}, ${f(g)}, ${f(b)})`;
  } catch {
    return c;
  }
};

// 웹 탭 줄 유리를 라이트·다크 사이에서 섞는 명도 구간 (OKLab). 명도 전 구간에 비례해 섞는다 (사용자 요청, 예전엔 0.45~0.8 에서만 섞었다)
export const GLASS_MIX_LO = 0;
export const GLASS_MIX_HI = 1;

// CSS 색의 OKLab 명도(0~1). 어떤 색 표기든 캔버스로 sRGB 로 바꿔 계산한다
export const colorLightness = function (c: string, doc: Document): number | null {
  try {
    const ctx = canvasOf(doc);
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = "#000";
    ctx.fillStyle = c;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
    const lin = (v: number) => ((v /= 255) <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
    const R = lin(r), G = lin(g), B = lin(b);
    const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B);
    const mm = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B);
    const s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B);
    return 0.2104542553 * l + 0.793617785 * mm - 0.0040720468 * s;
  } catch {
    return null;
  }
};

// CSS 색 값(var() 포함)을 [r, g, b] 로 푼다
export const resolveRgb = function (doc: Document, value: string): [number, number, number] | null {
  const el = newEl(doc, "div");
  el.style.color = value;
  el.hide();
  doc.body.appendChild(el);
  const c = (doc.defaultView || window).getComputedStyle(el).color;
  el.remove();
  let m = c.match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/);
  if (m) return [+m[1], +m[2], +m[3]];
  m = c.match(/color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)/);
  if (m) return [+m[1] * 255, +m[2] * 255, +m[3] * 255];
  return null;
};

// 테마의 파랑 폴더 기호(theme.css --lg-folder-icon)와 같은 모양을 주어진 색으로
export const folderIconUrl = function (rgb: number[]): string {
  const mix = (t: number, k: number) => "#" + rgb.map((v) => Math.round(v + (t - v) * k).toString(16).padStart(2, "0")).join("");
  const front = mix(0, 0);
  const top = mix(255, 0.22);
  const back = mix(0, 0.15);
  const shine = mix(255, 0.55);
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 17.6'>` +
    `<defs><linearGradient id='f' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='${top}'/><stop offset='1' stop-color='${front}'/></linearGradient></defs>` +
    `<path d='M1 2.6C1 1.7 1.7 1 2.6 1h4.3c.4 0 .8.2 1.1.5L9.3 2.8h8.1c.9 0 1.6.7 1.6 1.6v10.6c0 .9-.7 1.6-1.6 1.6H2.6C1.7 16.6 1 15.9 1 15z' fill='${back}'/>` +
    `<rect x='1' y='4.6' width='18' height='12' rx='1.5' fill='url(#f)'/>` +
    `<rect x='1.6' y='4.6' width='16.8' height='0.7' rx='0.35' fill='${shine}'/>` +
    `</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
};

// 폴더 색 팔레트: 사용자가 폴더 색 조율기 아티팩트에서 고른 색 (애플 태그 색 계열을 채도 낮춰 누그러뜨림 + 더한 색).
// 끝의 무지개 칸은 색을 직접 고른다
export const FOLDER_PALETTE: Palette = [
  [tr("빨강", "Red"), "#D85D4D"],
  [tr("주황", "Orange"), "#E4A367"],
  [tr("노랑", "Yellow"), "#D6B86D"],
  [tr("올리브", "Olive"), "#969859"],
  [tr("초록", "Green"), "#5CA95F"],
  [tr("청록", "Teal"), "#6AB9B0"],
  [tr("파랑", "Blue"), "#4981D0"],
  [tr("남색", "Indigo"), "#5D63AF"],
  [tr("분홍", "Pink"), "#D95D8A"],
  [tr("보라", "Purple"), "#9F6BBD"],
  [tr("회색", "Gray"), "#84848F"],
];

export const hexToRgb = function (hex: string) {
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex || "");
  return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : null;
};

// 테마의 문서 기호(theme.css --lg-file-icon)를 주어진 색 쪽으로 물들인다 (폴더 색 안의 문서).
// 종이 그라데이션 세 곳과 접힌 귀퉁이를 그 색과 흰색 사이로. 흰 끝도 색을 20% 섞는다 (사용자 요청, 예전엔 흰색 그대로)
export const fileIconUrl = function (rgb: number[]): string {
  const mix = (k: number) => "#" + rgb.map((v) => Math.round(v + (255 - v) * k).toString(16).padStart(2, "0")).join("");
  // 테두리: 폴더 색을 어둡게(60%) 한 색, 반투명 (사용자 요청, 예전엔 색과 상관없이 검정 22%)
  const edge = `rgb(${rgb.map((v) => Math.round(v * 0.6)).join(" ")} / 0.55)`;
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='-0.3 -0.3 14.6 17.6'>` +
    `<defs><linearGradient id='p' x1='0' y1='1' x2='1' y2='0'><stop offset='0' stop-color='${mix(0.8)}'/><stop offset='0.55' stop-color='${mix(0.62)}'/><stop offset='1' stop-color='${mix(0.2)}'/></linearGradient></defs>` +
    `<path d='M1.5 0h6.9L14 5.6v9.9c0 .8-.7 1.5-1.5 1.5h-11C.7 17 0 16.3 0 15.5v-14C0 .7.7 0 1.5 0z' fill='url(#p)' stroke='${edge}' stroke-width='0.5' stroke-linejoin='round'/>` +
    `<path d='M8.4 0v4.1c0 .8.7 1.5 1.5 1.5H14z' fill='${mix(0.72)}' stroke='${edge}' stroke-width='0.5' stroke-linejoin='round'/>` +
    `</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
};
