import { ssrRenderAttrs } from "vue/server-renderer";
import { useSSRContext } from "vue";
import { _ as _export_sfc } from "./plugin-vue_export-helper.1tPrXgE0.js";
const __pageData = JSON.parse('{"title":"工具协作与职业成长","description":"","frontmatter":{"title":"工具协作与职业成长","category":"知识点","tags":["前端","工具","协作","面试"]},"headers":[],"relativePath":"知识点/前端/09-tools-career-growth/index.md","filePath":"知识点/前端/09-tools-career-growth/index.md","lastUpdated":0}');
const _sfc_main = { name: "知识点/前端/09-tools-career-growth/index.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  _push(`<div${ssrRenderAttrs(_attrs)}><h1 id="工具协作与职业成长" tabindex="-1">工具协作与职业成长 <a class="header-anchor" href="#工具协作与职业成长" aria-label="Permalink to “工具协作与职业成长”">​</a></h1><p>技术体系的最后一层，解决的是“如何把知识转成长期竞争力”。它覆盖协作工具、文档体系、表达能力和职业路线。</p><h2 id="模块内容" tabindex="-1">模块内容 <a class="header-anchor" href="#模块内容" aria-label="Permalink to “模块内容”">​</a></h2><ul><li><a href="./tooling-collaboration.html">工具文档与协作规范</a></li><li><a href="./interview-growth.html">面试、成长与职业路线</a></li></ul><h2 id="使用建议" tabindex="-1">使用建议 <a class="header-anchor" href="#使用建议" aria-label="Permalink to “使用建议”">​</a></h2><ul><li>把这部分当作长期复盘区，不是一次性学完的清单。</li><li>做完项目后回来看，会更容易沉淀自己的方法论。</li></ul></div>`);
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("知识点/前端/09-tools-career-growth/index.md");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const index = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
export {
  __pageData,
  index as default
};
