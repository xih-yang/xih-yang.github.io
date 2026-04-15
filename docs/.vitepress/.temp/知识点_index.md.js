import { ssrRenderAttrs, ssrRenderAttr } from "vue/server-renderer";
import { _ as _imports_0 } from "./knowledge-3d.Ct42_ht2.js";
import { useSSRContext } from "vue";
import { _ as _export_sfc } from "./plugin-vue_export-helper.1tPrXgE0.js";
const __pageData = JSON.parse('{"title":"知识点","description":"","frontmatter":{"title":"知识点","category":"知识点","tags":["知识点","分类"]},"headers":[],"relativePath":"知识点/index.md","filePath":"知识点/index.md","lastUpdated":0}');
const _sfc_main = { name: "知识点/index.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  _push(`<div${ssrRenderAttrs(_attrs)}><h1 id="知识点" tabindex="-1">知识点 <a class="header-anchor" href="#知识点" aria-label="Permalink to “知识点”">​</a></h1><div class="section-banner"><span class="section-banner-kicker">Knowledge Map</span><strong>从零散概念到完整知识体系的结构化整理</strong><p>更适合系统学习和查漏补缺，目前以前端体系作为主干持续扩展。</p><img class="section-banner-hero-icon"${ssrRenderAttr("src", _imports_0)} alt="知识点图标"></div><h2 id="关于本分类" tabindex="-1">关于本分类 <a class="header-anchor" href="#关于本分类" aria-label="Permalink to “关于本分类”">​</a></h2><p>本分类整理了各种技术知识点，包括前端、后端、数据库、AI等方面的核心概念和重要知识。</p><h3 id="前端" tabindex="-1">前端 <a class="header-anchor" href="#前端" aria-label="Permalink to “前端”">​</a></h3><ul><li><a href="./前端/">前端知识体系总览</a></li><li><a href="./前端/01.前端核心基础/">一、前端核心基础</a></li><li><a href="./前端/02现代前端框架生态/">二、现代前端框架生态</a></li><li><a href="./前端/03-engineering-toolchain/">三、前端工程化全工具链</a></li><li><a href="./前端/04-network-storage-debug/">四、网络通信、存储与调试</a></li><li><a href="./前端/05-cross-platform/">五、跨端与原生客户端开发</a></li><li><a href="./前端/06-fullstack-backend/">六、全栈后端与数据库</a></li><li><a href="./前端/07-performance-security-monitoring/">七、性能、安全与监控</a></li><li><a href="./前端/08-deployment-architecture-ai/">八、部署、架构与 AI 前端</a></li><li><a href="./前端/09-tools-career-growth/">九、工具协作与职业成长</a></li></ul><h2 id="学习路径" tabindex="-1">学习路径 <a class="header-anchor" href="#学习路径" aria-label="Permalink to “学习路径”">​</a></h2><ol><li><strong>基础阶段</strong>：HTML/CSS/JavaScript、Java 基础</li><li><strong>进阶阶段</strong>：框架使用、数据库、网络</li><li><strong>高级阶段</strong>：性能优化、架构设计、DevOps</li></ol></div>`);
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("知识点/index.md");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const index = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
export {
  __pageData,
  index as default
};
