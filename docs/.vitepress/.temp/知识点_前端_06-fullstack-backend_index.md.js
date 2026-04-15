import { ssrRenderAttrs } from "vue/server-renderer";
import { useSSRContext } from "vue";
import { _ as _export_sfc } from "./plugin-vue_export-helper.1tPrXgE0.js";
const __pageData = JSON.parse('{"title":"全栈后端与数据库","description":"","frontmatter":{"title":"全栈后端与数据库","category":"知识点","tags":["前端","Node.js","数据库","Serverless"]},"headers":[],"relativePath":"知识点/前端/06-fullstack-backend/index.md","filePath":"知识点/前端/06-fullstack-backend/index.md","lastUpdated":0}');
const _sfc_main = { name: "知识点/前端/06-fullstack-backend/index.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  _push(`<div${ssrRenderAttrs(_attrs)}><h1 id="全栈后端与数据库" tabindex="-1">全栈后端与数据库 <a class="header-anchor" href="#全栈后端与数据库" aria-label="Permalink to “全栈后端与数据库”">​</a></h1><p>前端向全栈延伸时，重点不是“把后端都学完”，而是补齐接口、数据、鉴权和部署这一整段链路认知。</p><h2 id="模块内容" tabindex="-1">模块内容 <a class="header-anchor" href="#模块内容" aria-label="Permalink to “模块内容”">​</a></h2><ul><li><a href="./node-fullstack.html">Node 全栈与 BFF</a></li><li><a href="./databases.html">数据库体系</a></li><li><a href="./mock-serverless.html">Mock 与 Serverless</a></li></ul><h2 id="学习建议" tabindex="-1">学习建议 <a class="header-anchor" href="#学习建议" aria-label="Permalink to “学习建议”">​</a></h2><ul><li>先从 Node.js 接口服务和 BFF 场景切入。</li><li>再理解 MySQL、Redis、MongoDB 各自解决什么问题。</li><li>最后用 Mock 和 Serverless 快速搭起小闭环练手。</li></ul></div>`);
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("知识点/前端/06-fullstack-backend/index.md");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const index = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
export {
  __pageData,
  index as default
};
