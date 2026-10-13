import type { App, TFolder } from "obsidian";
import { ButtonComponent, Modal, setTooltip } from "obsidian";
import { tr } from "./util";
import { FOLDER_PALETTE } from "./color";
import type { Palette } from "./settings";

// 되돌릴 수 없는 일을 하기 전에 한 번 더 묻는 창. 확인을 누를 때만 onOk 를 부른다
export class ConfirmModal extends Modal {
  constructor(app: App, title: string, message: string, okText: string, onOk: () => void) {
    super(app);
    this.setTitle(title);
    this.contentEl.createEl("p", { text: message });
    // Obsidian 확인 창과 같은 버튼 줄 (오른쪽 정렬, 위 구분선 없음)
    const bar = this.modalEl.createDiv("modal-button-container");
    new ButtonComponent(bar).setButtonText(tr("취소", "Cancel")).onClick(() => this.close());
    new ButtonComponent(bar)
      .setButtonText(okText)
      .setDestructive()
      .setCta()
      .onClick(() => {
        this.close();
        onOk();
      });
  }
}

// 폴더 색 고르기 창
export class FolderColorModal extends Modal {
  declare current: string | undefined;
  declare folder: TFolder;
  declare onPick: (hex: string | null) => void;
  declare palette: Palette;

  constructor(app: App, folder: TFolder, current: string | undefined, onPick: (hex: string | null) => void, palette: Palette) {
    super(app);
    this.palette = palette || FOLDER_PALETTE;
    this.folder = folder;
    this.current = current ? current.toLowerCase() : null;
    this.onPick = onPick;
  }

  onOpen() {
    const { contentEl } = this;
    this.modalEl.addClass("lg-fc-modal");
    this.titleEl.setText(this.folder.name);
    const grid = contentEl.createDiv("lg-fc-grid");
    for (const [name, hex] of this.palette) {
      const sw = grid.createDiv("lg-fc-swatch");
      sw.style.backgroundColor = hex;
      setTooltip(sw, name);
      if (this.current === hex.toLowerCase()) sw.addClass("is-selected");
      sw.addEventListener("click", () => {
        this.close();
        this.onPick(hex);
      });
    }
    // 직접 고르기: 무지개 칸을 누르면 색 고르기 창이 열리고, 고르면 바로 적용한다.
    // 지금 색이 팔레트에 없는 색이면 칸 안에 그 색을 보이고 선택 표시를 한다
    const custom = grid.createEl("label", { cls: "lg-fc-swatch lg-fc-custom" });
    setTooltip(custom, tr("직접 고르기", "Pick a color"));
    const inPalette = this.palette.some(([, hex]) => hex.toLowerCase() === this.current);
    if (this.current && !inPalette) {
      custom.addClass("is-selected");
      custom.style.setProperty("--lg-fc-pick", this.current);
    }
    const input = custom.createEl("input", { type: "color" });
    input.value = this.current || "#007aff";
    input.addEventListener("change", () => {
      this.close();
      this.onPick(input.value.toUpperCase());
    });
    const clear = contentEl.createEl("button", { text: tr("색 지우기", "Clear color"), cls: "lg-fc-clear" });
    clear.addEventListener("click", () => {
      this.close();
      this.onPick(null);
    });
  }

  onClose() {
    this.contentEl.empty();
  }
}
