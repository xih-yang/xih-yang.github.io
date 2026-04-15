import { ssrRenderAttrs } from "vue/server-renderer";
import { useSSRContext } from "vue";
import { _ as _export_sfc } from "./plugin-vue_export-helper.1tPrXgE0.js";
const __pageData = JSON.parse('{"title":"面试题","description":"","frontmatter":{"title":"面试题","category":"面试题","tags":["面试题","前端","分类"]},"headers":[],"relativePath":"面试题/index.md","filePath":"面试题/index.md","lastUpdated":0}');
const _sfc_main = { name: "面试题/index.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  _push(`<div${ssrRenderAttrs(_attrs)}><h1 id="面试题" tabindex="-1">面试题 <a class="header-anchor" href="#面试题" aria-label="Permalink to “面试题”">​</a></h1><h2 id="关于本分类" tabindex="-1">关于本分类 <a class="header-anchor" href="#关于本分类" aria-label="Permalink to “关于本分类”">​</a></h2><p>这里按方向整理面试题、准备清单和常见题型，当前以前端内容为主。</p><h2 id="当前内容" tabindex="-1">当前内容 <a class="header-anchor" href="#当前内容" aria-label="Permalink to “当前内容”">​</a></h2><ul><li>当前面试题正文正在按新目录逐步整理，现阶段先保留分类入口与总览说明。</li></ul><h2 id="覆盖范围" tabindex="-1">覆盖范围 <a class="header-anchor" href="#覆盖范围" aria-label="Permalink to “覆盖范围”">​</a></h2><ul><li>学习路线与准备清单</li><li>HTML、CSS、JavaScript</li><li>Vue、React、工程化</li><li>计算机网络、浏览器原理</li><li>手写代码、代码输出、算法题单</li></ul></div>`);
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("面试题/index.md");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const index = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
export {
  __pageData,
  index as default
};
