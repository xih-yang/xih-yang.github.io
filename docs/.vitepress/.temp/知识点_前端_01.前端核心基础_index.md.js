import { ssrRenderAttrs } from "vue/server-renderer";
import { useSSRContext } from "vue";
import { _ as _export_sfc } from "./plugin-vue_export-helper.1tPrXgE0.js";
const __pageData = JSON.parse('{"title":"前端核心基础","description":"","frontmatter":{"title":"前端核心基础","category":"知识点","tags":["前端","基础","HTML","CSS","JavaScript"]},"headers":[],"relativePath":"知识点/前端/01.前端核心基础/index.md","filePath":"知识点/前端/01.前端核心基础/index.md","lastUpdated":0}');
const _sfc_main = { name: "知识点/前端/01.前端核心基础/index.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  _push(`<div${ssrRenderAttrs(_attrs)}><h1 id="前端核心基础" tabindex="-1">前端核心基础 <a class="header-anchor" href="#前端核心基础" aria-label="Permalink to “前端核心基础”">​</a></h1><p>这一层解决的是“页面为什么能工作”。结构、样式、脚本、浏览器环境和原生能力，是后续框架与工程化的底座。</p><h2 id="模块内容" tabindex="-1">模块内容 <a class="header-anchor" href="#模块内容" aria-label="Permalink to “模块内容”">​</a></h2><ul><li><a href="./html.html">HTML 全体系</a></li><li><a href="./css.html">CSS 全体系</a></li><li><a href="./JavaScript基础.html">JavaScript 基础</a></li><li><a href="./JavaScript高级.html">JavaScript 高级</a></li><li><a href="./jQuery与自定义框架.html">jQuery 与自定义框架</a></li></ul><h2 id="学习重点" tabindex="-1">学习重点 <a class="header-anchor" href="#学习重点" aria-label="Permalink to “学习重点”">​</a></h2><ul><li>先把语义化、布局、响应式和 DOM 操作练熟。</li><li>再把闭包、原型链、异步、模块化和面向对象串起来。</li><li>最后回头看 jQuery 与原生封装，理解框架出现前后分别解决了什么问题。</li></ul><h2 id="推荐顺序" tabindex="-1">推荐顺序 <a class="header-anchor" href="#推荐顺序" aria-label="Permalink to “推荐顺序”">​</a></h2><ol><li><a href="./html.html">HTML 全体系</a></li><li><a href="./css.html">CSS 全体系</a></li><li><a href="./JavaScript基础.html">JavaScript 基础</a></li><li><a href="./JavaScript高级.html">JavaScript 高级</a></li><li><a href="./jQuery与自定义框架.html">jQuery 与自定义框架</a></li></ol></div>`);
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("知识点/前端/01.前端核心基础/index.md");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const index = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
export {
  __pageData,
  index as default
};
