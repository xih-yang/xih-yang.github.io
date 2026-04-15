import { ssrRenderAttrs } from "vue/server-renderer";
import { useSSRContext } from "vue";
import { _ as _export_sfc } from "./plugin-vue_export-helper.1tPrXgE0.js";
const __pageData = JSON.parse('{"title":"AI","description":"","frontmatter":{"title":"AI","category":"AI","tags":["AI","大纲","规划"]},"headers":[],"relativePath":"AI/index.md","filePath":"AI/index.md","lastUpdated":0}');
const _sfc_main = { name: "AI/index.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  _push(`<div${ssrRenderAttrs(_attrs)}><h1 id="ai" tabindex="-1">AI <a class="header-anchor" href="#ai" aria-label="Permalink to “AI”">​</a></h1><h2 id="关于本分类" tabindex="-1">关于本分类 <a class="header-anchor" href="#关于本分类" aria-label="Permalink to “关于本分类”">​</a></h2><p>这里整理 AI 相关的学习大纲、专题规划和后续准备扩展的内容入口。</p><h2 id="当前内容" tabindex="-1">当前内容 <a class="header-anchor" href="#当前内容" aria-label="Permalink to “当前内容”">​</a></h2><ul><li><a href="./大纲.html">AI 大纲</a></li><li><a href="./豆包整理大纲.html">豆包整理大纲</a></li></ul><h2 id="使用建议" tabindex="-1">使用建议 <a class="header-anchor" href="#使用建议" aria-label="Permalink to “使用建议”">​</a></h2><ul><li>想快速看全貌时，先读总大纲。</li><li>想对比不同整理方式时，再看补充版本。</li></ul></div>`);
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("AI/index.md");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const index = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
export {
  __pageData,
  index as default
};
