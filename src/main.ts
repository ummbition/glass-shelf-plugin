import type { App, PluginManifest } from "obsidian";
import { Plugin as ObsidianPlugin } from "obsidian";
import type { GlassShelfPlugin } from "./host";
import { coreMethods } from "./core";
import { eventsMethods } from "./events";
import { pressMethods } from "./press";
import { kanbanMethods } from "./kanban";
import { menusMethods } from "./menus";
import { morphMethods } from "./morph";
import { foldersMethods } from "./folders";
import { sidebarMethods } from "./sidebar";
import { tabsMethods } from "./tabs";
import { webMethods } from "./web";

// 인스턴스 타입이 GlassShelfPlugin(host.ts)인 Obsidian 플러그인. 메서드 묶음은 아래에서 prototype 에 붙인다
const Base = ObsidianPlugin as unknown as abstract new (app: App, manifest: PluginManifest) => GlassShelfPlugin;

export default class GlassShelfCompanion extends Base {
  // 테마가 켜져 있는 동안의 모든 동작은 자식 Component(this.core) 하나에 묶는다. 테마가 바뀌면(켜짐·꺼짐) 그 자식만 떼고 붙인다.
  // 예전엔 플러그인이 스스로 껐다 켰는데(app.plugins 비공개 API), 그 방식은 심사 지적 대상이고 끌 때마다 옛 인스턴스가 남기는 것이 생겼다 (검토 지적).
  // 동작 코드는 모두 this.register…(registerEvent·registerDomEvent·registerInterval·addSettingTab 도 안에서 register 를 부른다)로 정리를 맡기므로,
  // 자식이 붙어 있는 동안 register 를 자식에게 넘기면 기존 코드를 그대로 두고 자식을 뗄 때 함께 정리된다
  register(cb: () => unknown) {
    if (this.core) this.core.register(cb);
    else super.register(cb);
  }

  async onload() {
    this.unloaded = true; // 자식이 붙기 전(테마 꺼짐)엔 늦게 도는 동작이 아무것도 하지 않게 한다
    this.registerEvent(this.app.workspace.on("css-change", () => this.syncCore()));
    await this.syncCore();
  }
}

// 기능별 메서드 묶음을 붙인다 (각 파일의 메서드는 this 가 이 플러그인이다)
Object.assign(GlassShelfCompanion.prototype, coreMethods, eventsMethods, pressMethods, kanbanMethods, menusMethods, morphMethods, foldersMethods, sidebarMethods, tabsMethods, webMethods);
