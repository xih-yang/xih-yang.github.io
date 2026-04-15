import { ssrRenderAttrs } from "vue/server-renderer";
import { useSSRContext } from "vue";
import { _ as _export_sfc } from "./plugin-vue_export-helper.1tPrXgE0.js";
const __pageData = JSON.parse('{"title":"跨端与原生客户端开发","description":"","frontmatter":{"title":"跨端与原生客户端开发","category":"知识点","tags":["前端","跨端","小程序","App"]},"headers":[],"relativePath":"知识点/前端/05-cross-platform/index.md","filePath":"知识点/前端/05-cross-platform/index.md","lastUpdated":0}');
const _sfc_main = { name: "知识点/前端/05-cross-platform/index.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  _push(`<div${ssrRenderAttrs(_attrs)}><h1 id="跨端与原生客户端开发" tabindex="-1">跨端与原生客户端开发 <a class="header-anchor" href="#跨端与原生客户端开发" aria-label="Permalink to “跨端与原生客户端开发”">​</a></h1><p>跨端的核心不是“一套代码跑 everywhere”这句口号，而是搞清楚每种容器的能力边界、性能成本和团队收益。</p><h2 id="模块内容" tabindex="-1">模块内容 <a class="header-anchor" href="#模块内容" aria-label="Permalink to “模块内容”">​</a></h2><ul><li><a href="./mini-programs.html">小程序生态</a></li><li><a href="./hybrid-apps.html">混合 App</a></li><li><a href="./desktop.html">桌面端</a></li><li><a href="./native-clients.html">原生客户端</a></li></ul><h2 id="选型建议" tabindex="-1">选型建议 <a class="header-anchor" href="#选型建议" aria-label="Permalink to “选型建议”">​</a></h2><ul><li>想快速覆盖内容与营销场景时，优先看小程序。</li><li>想承接移动应用时，重点看 React Native、Expo 和 Flutter。</li><li>想做桌面工具时，优先对比 Electron 和 Tauri。</li></ul></div>`);
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("知识点/前端/05-cross-platform/index.md");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const index = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
export {
  __pageData,
  index as default
};
