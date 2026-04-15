import { ssrRenderAttrs } from "vue/server-renderer";
import { useSSRContext } from "vue";
import { _ as _export_sfc } from "./plugin-vue_export-helper.1tPrXgE0.js";
const __pageData = JSON.parse('{"title":"数组题目","description":"","frontmatter":{"title":"数组题目","category":"刷题","tags":["LeetCode","数组","题单"]},"headers":[],"relativePath":"leetcode/array/index.md","filePath":"leetcode/array/index.md","lastUpdated":1773916058000}');
const _sfc_main = { name: "leetcode/array/index.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  _push(`<div${ssrRenderAttrs(_attrs)}><h1 id="数组题目" tabindex="-1">数组题目 <a class="header-anchor" href="#数组题目" aria-label="Permalink to “数组题目”">​</a></h1><p>数组题目通常围绕下标访问、双指针、前缀和、滑动窗口和原地修改展开，是刷题里最适合建立题感的一类。</p><h2 id="已更新" tabindex="-1">已更新 <a class="header-anchor" href="#已更新" aria-label="Permalink to “已更新”">​</a></h2><ul><li><a href="./2619-array-prototype-last.html">2619. 数组原型对象的最后一个元素</a></li><li><a href="./2626-array-reduce-transformation.html">2626. 数组归约运算</a></li><li><a href="./2634-filter-elements-from-array.html">2634. 过滤数组中的元素</a></li><li><a href="./2635-apply-transform-over-each-element-in-array.html">2635. 数组元素转换</a></li><li><a href="./2631-group-by.html">2631. 数组分组</a></li></ul><h2 id="标签建议" tabindex="-1">标签建议 <a class="header-anchor" href="#标签建议" aria-label="Permalink to “标签建议”">​</a></h2><ul><li>题型标签：数组、原型、遍历、模拟、哈希分组</li><li>难度标签：简单、中等、困难</li><li>语言标签：JavaScript、TypeScript、Java</li></ul></div>`);
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("leetcode/array/index.md");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const index = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
export {
  __pageData,
  index as default
};
