import { ssrRenderAttrs } from "vue/server-renderer";
import { useSSRContext } from "vue";
import { _ as _export_sfc } from "./plugin-vue_export-helper.1tPrXgE0.js";
const __pageData = JSON.parse('{"title":"部署、架构与 AI 前端","description":"","frontmatter":{"title":"部署、架构与 AI 前端","category":"知识点","tags":["前端","部署","架构","AI"]},"headers":[],"relativePath":"知识点/前端/08-deployment-architecture-ai/index.md","filePath":"知识点/前端/08-deployment-architecture-ai/index.md","lastUpdated":0}');
const _sfc_main = { name: "知识点/前端/08-deployment-architecture-ai/index.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  _push(`<div${ssrRenderAttrs(_attrs)}><h1 id="部署、架构与-ai-前端" tabindex="-1">部署、架构与 AI 前端 <a class="header-anchor" href="#部署、架构与-ai-前端" aria-label="Permalink to “部署、架构与 AI 前端”">​</a></h1><p>这一层更偏高级拓展，关注的是如何把前端系统做大、做稳、做成平台能力，并与 AI 场景真正结合。</p><h2 id="模块内容" tabindex="-1">模块内容 <a class="header-anchor" href="#模块内容" aria-label="Permalink to “模块内容”">​</a></h2><ul><li><a href="./deployment.html">容器化部署与 CI/CD</a></li><li><a href="./architecture.html">高级架构</a></li><li><a href="./ai-frontend.html">AI 前端全体系</a></li></ul><h2 id="推荐顺序" tabindex="-1">推荐顺序 <a class="header-anchor" href="#推荐顺序" aria-label="Permalink to “推荐顺序”">​</a></h2><ol><li>先补 Docker、Nginx 和 CI/CD 的发布链路。</li><li>再理解微前端、Monorepo 和模块联邦等复杂协作架构。</li><li>最后把 AI 能力接入真实前端产品场景。</li></ol></div>`);
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("知识点/前端/08-deployment-architecture-ai/index.md");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const index = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
export {
  __pageData,
  index as default
};
