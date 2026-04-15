import { ssrRenderAttrs, ssrRenderAttr } from "vue/server-renderer";
import { _ as _imports_0$1 } from "./knowledge-3d.Ct42_ht2.js";
import { _ as _imports_0$2 } from "./leetcode-3d.DEgrN26X.js";
import { _ as _imports_0$3 } from "./daily-3d.BR3cy9n5.js";
import { useSSRContext } from "vue";
import { _ as _export_sfc } from "./plugin-vue_export-helper.1tPrXgE0.js";
const _imports_0 = "/icons/studio-logo.svg";
const _imports_2 = "/icons/interview-3d.svg";
const __pageData = JSON.parse('{"title":"","description":"","frontmatter":{"layout":"home","hero":{"name":"随笔","text":"逻辑之外，随笔之内","tagline":"用更有设计感的方式整理知识体系、题库、技巧沉淀与开发灵感","image":{"src":"/icons/hero-scene.svg","alt":"作品集风格主视觉插画"},"actions":[{"theme":"brand","text":"知识点","link":"/知识点/"},{"theme":"brand","text":"面试题","link":"/面试题/"},{"theme":"brand","text":"刷题","link":"/leetcode/"},{"theme":"brand","text":"AI","link":"/AI/"},{"theme":"alt","text":"私房推荐","link":"/私房推荐/"},{"theme":"alt","text":"前端知识体系","link":"/知识点/前端/"}]},"features":[{"title":"每日技巧","details":"适合快速回查的短知识卡片，覆盖前端、工具、工作流和后端小技巧。"},{"title":"知识点","details":"从前端基础到架构与 AI 的系统化知识地图，适合按模块深入学习。"},{"title":"面试与刷题","details":"面试题库、回答框架和按题型整理的刷题记录，适合集中复习。"}]},"headers":[],"relativePath":"index.md","filePath":"index.md","lastUpdated":1773916058000}');
const _sfc_main = { name: "index.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  _push(`<div${ssrRenderAttrs(_attrs)}><div class="home-portfolio-panel"><div class="home-portfolio-copy"><span class="home-portfolio-kicker">Curated Knowledge Workspace</span><h2>不是简单的文档首页，而是一个带作品感的知识入口。</h2><p>把知识体系、刷题记录、面试表达和日常技巧整理成统一的视觉与结构语言，既方便回看，也更适合长期迭代。</p><div class="home-portfolio-metrics"><div class="home-portfolio-metric"><strong>5</strong><span>主内容分区</span></div><div class="home-portfolio-metric"><strong>9+</strong><span>前端知识模块</span></div><div class="home-portfolio-metric"><strong>持续</strong><span>更新中的题库与技巧</span></div></div></div><div class="home-portfolio-stage"><div class="home-stage-card home-stage-card-primary"><img${ssrRenderAttr("src", _imports_0)} alt="站点 Logo"><strong>Notebook Studio</strong><span>知识整理、答题训练、表达沉淀</span></div><div class="home-stage-card home-stage-card-floating"><img${ssrRenderAttr("src", _imports_0$1)} alt="知识点图标"><div><strong>Knowledge Map</strong><span>系统结构优先</span></div></div><div class="home-stage-card home-stage-card-floating home-stage-card-secondary"><img${ssrRenderAttr("src", _imports_2)} alt="面试图标"><div><strong>Interview Notes</strong><span>回答框架与项目表达</span></div></div><div class="home-stage-orb home-stage-orb-primary"></div><div class="home-stage-orb home-stage-orb-secondary"></div></div></div><h2 id="快速导航" tabindex="-1">快速导航 <a class="header-anchor" href="#快速导航" aria-label="Permalink to “快速导航”">​</a></h2><div class="home-tag-grid"><a class="home-tag-card" href="/知识点/"><img class="home-card-icon"${ssrRenderAttr("src", _imports_0$1)} alt="知识点图标"><span class="home-card-badge">Knowledge</span><strong>知识点</strong><span>系统化知识地图，目前以前端体系为主，持续补充中。</span></a><a class="home-tag-card" href="/面试题/"><img class="home-card-icon"${ssrRenderAttr("src", _imports_2)} alt="面试图标"><span class="home-card-badge">Interview</span><strong>面试题</strong><span>按专题整理题库、回答要点、追问点和项目表达模板。</span></a><a class="home-tag-card" href="/leetcode/"><img class="home-card-icon"${ssrRenderAttr("src", _imports_0$2)} alt="刷题图标"><span class="home-card-badge">Problems</span><strong>刷题</strong><span>按题型沉淀题解和解题思路，方便横向复习。</span></a><a class="home-tag-card" href="/AI/"><img class="home-card-icon"${ssrRenderAttr("src", _imports_0$1)} alt="AI 图标"><span class="home-card-badge">AI</span><strong>AI</strong><span>整理 AI 学习大纲、能力树和后续要扩展的专题入口。</span></a><a class="home-tag-card" href="/私房推荐/"><img class="home-card-icon"${ssrRenderAttr("src", _imports_0$3)} alt="私房推荐图标"><span class="home-card-badge">Curated</span><strong>私房推荐</strong><span>面向当前生态的精选整理，适合快速把握方向和做选型参考。</span></a></div></div>`);
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("index.md");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const index = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
export {
  __pageData,
  index as default
};
