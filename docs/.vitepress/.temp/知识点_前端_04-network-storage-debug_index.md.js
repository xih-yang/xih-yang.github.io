import { ssrRenderAttrs } from "vue/server-renderer";
import { useSSRContext } from "vue";
import { _ as _export_sfc } from "./plugin-vue_export-helper.1tPrXgE0.js";
const __pageData = JSON.parse('{"title":"网络通信、存储与调试","description":"","frontmatter":{"title":"网络通信、存储与调试","category":"知识点","tags":["前端","网络","调试","鉴权"]},"headers":[],"relativePath":"知识点/前端/04-network-storage-debug/index.md","filePath":"知识点/前端/04-network-storage-debug/index.md","lastUpdated":0}');
const _sfc_main = { name: "知识点/前端/04-network-storage-debug/index.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  _push(`<div${ssrRenderAttrs(_attrs)}><h1 id="网络通信、存储与调试" tabindex="-1">网络通信、存储与调试 <a class="header-anchor" href="#网络通信、存储与调试" aria-label="Permalink to “网络通信、存储与调试”">​</a></h1><p>这一层解决的是“数据怎么来、状态怎么存、问题怎么查”。它直接影响线上稳定性和排障效率。</p><h2 id="模块内容" tabindex="-1">模块内容 <a class="header-anchor" href="#模块内容" aria-label="Permalink to “模块内容”">​</a></h2><ul><li><a href="./networking.html">网络请求与实时通信</a></li><li><a href="./communication.html">页面与端间通信方案</a></li><li><a href="./storage-auth.html">存储、鉴权与离线能力</a></li><li><a href="./debugging.html">调试、抓包与线上排障</a></li></ul><h2 id="实战路线" tabindex="-1">实战路线 <a class="header-anchor" href="#实战路线" aria-label="Permalink to “实战路线”">​</a></h2><ol><li>先把请求封装、跨域和错误处理打通。</li><li>再整理 Cookie、JWT、本地存储和刷新机制。</li><li>最后补抓包、性能面板和线上排障流程。</li></ol></div>`);
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("知识点/前端/04-network-storage-debug/index.md");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const index = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
export {
  __pageData,
  index as default
};
