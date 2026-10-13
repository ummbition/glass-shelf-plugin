// 사용: node esbuild.config.mjs [플러그인 폴더] [watch]
//   플러그인 폴더의 src/main.ts 를 main.js 로 묶는다. 폴더를 안 주면 이 파일이 있는 폴더(공개 저장소: npm run build)
//   watch 를 주면 고칠 때마다 다시 묶는다
// 경로 주석이 폴더 기준(// src/main.ts)으로 남아, 어느 PC 에서 묶어도 결과가 바이트 단위로 같다 (스토어 빌드 검증)
import esbuild from "esbuild";
import builtins from "builtin-modules";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const args = process.argv.slice(2);
const watch = args.includes("watch");
const root = args.find((a) => a !== "watch") ?? dirname(fileURLToPath(import.meta.url));
const ctx = await esbuild.context({
  absWorkingDir: root,
  entryPoints: ["src/main.ts"],
  outfile: "main.js",
  bundle: true,
  format: "cjs",
  platform: "browser",
  target: "es2021",
  // 클래스 필드를 tsconfig(target ES2021) 기준으로 변환한다. 볼트 플러그인 폴더에는 tsconfig 가 없어 esbuild 기본값(define)으로 묶여
  // 공개 저장소(tsconfig 있음)에서 다시 묶은 main.js 와 달랐다
  tsconfigRaw: { compilerOptions: { useDefineForClassFields: false } },
  external: ["obsidian", "electron", "@codemirror/*", "@lezer/*", ...builtins],
  banner: { js: "/* Glass Shelf Companion. 빌드 결과물: 원본은 src/ (esbuild) */" },
  logLevel: "info",
  sourcemap: false,
  treeShaking: true,
  minify: false,
});
if (watch) await ctx.watch();
else { await ctx.rebuild(); await ctx.dispose(); }
