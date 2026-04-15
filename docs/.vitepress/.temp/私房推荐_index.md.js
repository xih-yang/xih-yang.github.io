import { ssrRenderAttrs, ssrRenderAttr } from "vue/server-renderer";
import { _ as _imports_0 } from "./daily-3d.BR3cy9n5.js";
import { useSSRContext } from "vue";
import { _ as _export_sfc } from "./plugin-vue_export-helper.1tPrXgE0.js";
const __pageData = JSON.parse('{"title":"私房推荐","description":"","frontmatter":{"title":"私房推荐","category":"每日技巧","tags":["技巧","效率","开发"]},"headers":[],"relativePath":"私房推荐/index.md","filePath":"私房推荐/index.md","lastUpdated":0}');
const _sfc_main = { name: "私房推荐/index.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  _push(`<div${ssrRenderAttrs(_attrs)}><h1 id="私房推荐" tabindex="-1">私房推荐 <a class="header-anchor" href="#私房推荐" aria-label="Permalink to “私房推荐”">​</a></h1><div class="section-banner"><span class="section-banner-kicker">Daily Notes</span><strong>用短卡片。。。。。。</strong><p>。。。。。</p><img class="section-banner-hero-icon"${ssrRenderAttr("src", _imports_0)} alt="私房推荐图标"></div><h2 id="关于本分类" tabindex="-1">关于本分类 <a class="header-anchor" href="#关于本分类" aria-label="Permalink to “关于本分类”">​</a></h2><p>本分类。。。。。。</p></div>`);
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("私房推荐/index.md");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const index = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
export {
  __pageData,
  index as default
};
