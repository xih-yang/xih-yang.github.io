import { ssrRenderAttrs } from "vue/server-renderer";
import { useSSRContext } from "vue";
import { _ as _export_sfc } from "./plugin-vue_export-helper.1tPrXgE0.js";
const __pageData = JSON.parse('{"title":"现代前端框架生态","description":"","frontmatter":{"title":"现代前端框架生态","category":"知识点","tags":["前端","框架","React","Vue"]},"headers":[],"relativePath":"知识点/前端/02现代前端框架生态/index.md","filePath":"知识点/前端/02现代前端框架生态/index.md","lastUpdated":0}');
const _sfc_main = { name: "知识点/前端/02现代前端框架生态/index.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  _push(`<div${ssrRenderAttrs(_attrs)}><h1 id="现代前端框架生态" tabindex="-1">现代前端框架生态 <a class="header-anchor" href="#现代前端框架生态" aria-label="Permalink to “现代前端框架生态”">​</a></h1><p>框架层关注的是组件化、状态管理、路由组织、服务端渲染和开发体验。这里按主流框架、性能导向框架和 SSR/SSG 方案来整理。</p><h2 id="模块内容" tabindex="-1">模块内容 <a class="header-anchor" href="#模块内容" aria-label="Permalink to “模块内容”">​</a></h2><ul><li><a href="./1.三大主流/React生态/React全家桶.html">React 全家桶</a></li><li><a href="./1.三大主流/React生态/React知识点.html">React 知识点</a></li><li><a href="./1.三大主流/Vue生态/Vue全家桶.html">Vue 全家桶</a></li><li><a href="./1.三大主流/Angular生态/Angular全家桶.html">Angular 全家桶</a></li><li><a href="./3.SSR全栈/什么是SSR、SSG.html">SSR / SSG 框架</a></li></ul><h2 id="推荐顺序" tabindex="-1">推荐顺序 <a class="header-anchor" href="#推荐顺序" aria-label="Permalink to “推荐顺序”">​</a></h2><ol><li>先选一套主流框架深入学习：React 或 Vue。</li><li>再补路由、状态管理和工程协作模式。</li><li>最后横向了解 SSR/SSG 与新兴框架的设计差异。</li></ol></div>`);
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("知识点/前端/02现代前端框架生态/index.md");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const index = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
export {
  __pageData,
  index as default
};
