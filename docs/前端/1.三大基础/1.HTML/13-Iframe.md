---
title: Iframe 标签
category: 前端
tags:
  - HTML
  - 基础
  - Iframe
---

# Iframe 标签

## 核心概念

`<iframe>`（Inline Frame，内联框架）是 HTML 中用于在当前页面嵌入另一个网页的标签，可无缝集成外部内容。

## 基本用法

```html
<iframe src="https://example.com" title="示例网站" width="800" height="600"></iframe>
```

## 核心属性

| 属性 | 说明 | 必填 |
|------|------|------|
| `src` | 嵌入页面的 URL 地址 | ✅ |
| `title` | 嵌入页面标题（提升可访问性） | ✅ |
| `width` | 框架宽度（px 或百分比） | ❌ |
| `height` | 框架高度（px 或百分比） | ❌ |
| `sandbox` | 沙箱模式（增强安全性） | ❌ |
| `loading` | 加载策略（eager/lazy） | ❌ |

## 常用场景

### 1. 嵌入第三方内容

```html
<!-- 嵌入地图 -->
<iframe src="https://www.google.com/maps/embed?pb=!1m18..." title="公司地图" width="100%" height="400"></iframe>

<!-- 嵌入视频 -->
<iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ" title="视频播放器" width="560" height="315" allowfullscreen></iframe>
```

### 2. 嵌入内部页面

```html
<!-- 嵌入帮助文档 -->
<iframe src="/help.html" title="帮助文档" width="100%" height="600"></iframe>
```

## 安全注意事项

1. **沙箱模式**：限制 iframe 权限，防止恶意代码执行
   ```html
   <iframe src="https://example.com" sandbox="allow-scripts allow-same-origin"></iframe>
   ```

2. **内容安全策略 (CSP)**：确保嵌入内容来源可信

3. **避免敏感信息**：不要在 iframe 中放置登录页或支付页面

4. **跨域限制**：不同域的内容受同源策略限制

## 性能优化

1. **延迟加载**：使用 `loading="lazy"` 减少初始加载时间
   ```html
   <iframe src="https://example.com" loading="lazy" title="示例"></iframe>
   ```

2. **响应式设计**：使用 CSS 确保在不同设备上正确显示
   ```css
   .iframe-container {
     position: relative;
     padding-bottom: 56.25%; /* 16:9 比例 */
     height: 0;
     overflow: hidden;
   }
   .iframe-container iframe {
     position: absolute;
     top: 0;
     left: 0;
     width: 100%;
     height: 100%;
   }
   ```

## 可访问性

1. **始终添加 `title` 属性**：帮助屏幕阅读器用户理解内容
2. **提供替代内容**：当 iframe 无法加载时显示
   ```html
   <iframe src="https://example.com" title="示例">
     <p>您的浏览器不支持 iframe</p>
   </iframe>
   ```

## 常见问题

1. **iframe 高度自适应**：使用 JavaScript 动态调整高度
   ```javascript
   function resizeIframe(iframe) {
     iframe.height = iframe.contentWindow.document.body.scrollHeight + 'px';
   }
   ```

2. **跨域通信**：使用 `postMessage` API
   ```javascript
   // 父页面
   iframe.contentWindow.postMessage('消息', 'https://example.com');
   
   // 子页面
   window.addEventListener('message', (event) => {
     if (event.origin === 'https://parent.com') {
       console.log(event.data);
     }
   });
   ```

## 最佳实践

1. **仅在必要时使用**：iframe 会增加页面复杂度和加载时间
2. **设置合理的尺寸**：避免过大或过小的 iframe
3. **使用现代属性**：如 `loading="lazy"` 和 `sandbox`
4. **测试兼容性**：确保在主流浏览器中正常显示
5. **监控性能**：定期检查 iframe 对页面加载速度的影响