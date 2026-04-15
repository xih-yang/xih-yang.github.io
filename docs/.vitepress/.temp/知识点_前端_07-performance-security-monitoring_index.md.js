import { ssrRenderAttrs } from "vue/server-renderer";
import { useSSRContext } from "vue";
import { _ as _export_sfc } from "./plugin-vue_export-helper.1tPrXgE0.js";
const __pageData = JSON.parse('{"title":"性能、安全与监控","description":"","frontmatter":{"title":"性能、安全与监控","category":"知识点","tags":["前端","性能","安全","监控"]},"headers":[],"relativePath":"知识点/前端/07-performance-security-monitoring/index.md","filePath":"知识点/前端/07-performance-security-monitoring/index.md","lastUpdated":0}');
const _sfc_main = { name: "知识点/前端/07-performance-security-monitoring/index.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  _push(`<div${ssrRenderAttrs(_attrs)}><h1 id="性能、安全与监控" tabindex="-1">性能、安全与监控 <a class="header-anchor" href="#性能、安全与监控" aria-label="Permalink to “性能、安全与监控”">​</a></h1><p>这是前端进入生产环境后的核心能力层。页面能不能快、能不能稳、出事能不能追到原因，都在这里。</p><h2 id="模块内容" tabindex="-1">模块内容 <a class="header-anchor" href="#模块内容" aria-label="Permalink to “模块内容”">​</a></h2><ul><li><a href="./performance.html">性能优化</a></li><li><a href="./security.html">前端安全</a></li><li><a href="./monitoring.html">监控体系</a></li></ul><h2 id="生产环境关注点" tabindex="-1">生产环境关注点 <a class="header-anchor" href="#生产环境关注点" aria-label="Permalink to “生产环境关注点”">​</a></h2><ul><li>性能要有指标，不只靠感觉。</li><li>安全要和后端、网关、鉴权方案一起看。</li><li>监控要能关联版本、用户行为和错误堆栈。</li></ul></div>`);
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("知识点/前端/07-performance-security-monitoring/index.md");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const index = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
export {
  __pageData,
  index as default
};
