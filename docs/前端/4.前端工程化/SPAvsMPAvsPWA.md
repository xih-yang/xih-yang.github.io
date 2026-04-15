# SPA vs MPA vs PWA

## 1. <font style="color:rgba(0, 0, 0, 0.75);">单页面应用程序</font>（SPA）
SPA 全称为 <font style="color:rgb(61, 72, 82);">Single-Page Application，表示单页面应用程序。在单页面应用程序中，我们不会为每个路径创建多个 HTML 文件，而是使用 JavaScript 为同一页面上的不同路径呈现不同的组件。当从浏览器请求单页面应用程序时，就会下载一个bundle.js文件，该文件包含所有请求网站的已编译 JavaScript 代码。使用这种方法，</font>浏览器会通过使用 HTML5 History API <font style="color:rgb(61, 72, 82);">根据用户选择的路径呈现单个页面。</font>

<font style="color:rgb(61, 72, 82);"></font>

<font style="color:rgb(61, 72, 82);">如果网站使用了延迟加载，那么可能会有多有bundle.js文件会根据请求的路径进行下载。因此，除了特殊情况，否则不会重新加载页面（再次从服务器请求）。如果想维护应用程序的状态，这一点是非常重要的，因为重新刷新页面就会重置应用程序的状态。</font>



#### <font style="color:rgb(61, 72, 82);">☀</font><font style="color:rgb(61, 72, 82);"> SPA 优点</font>
+ **<font style="color:rgb(61, 72, 82);">提高页面加载速度，从而获得更好的用户体验：</font>**<font style="color:rgb(61, 72, 82);">它们通常只加载一次。加载后，页面渲染取决于浏览器的速度。</font>
+ **<font style="color:rgb(61, 72, 82);">更少的服务器负载：</font>**<font style="color:rgb(61, 72, 82);">渲染逻辑在浏览器中执行。服务器和客户端之间只发送相关数据。</font>
+ **<font style="color:rgb(61, 72, 82);">缓存：</font>**<font style="color:rgb(61, 72, 82);">只向服务器发送一次请求，返回的响应会被缓存，也可以离线使用SPA。</font>
+ **<font style="color:rgb(61, 72, 82);">调试：</font>**<font style="color:rgb(61, 72, 82);"> React 和 Vue 等 SPA 框架提供了调试工具，这使开发人员的开发调试更加轻松。</font>
+ **<font style="color:rgb(61, 72, 82);">代码可重用性：</font>**<font style="color:rgb(61, 72, 82);">开发人员可以重用代码，这使得开发效率更高。</font>
+ **转场动画：**容易实现。
+ **页面间数据传递**：因为在一个页面内，多以页面之间数据传递很容易



#### <font style="color:rgb(61, 72, 82);">☀</font><font style="color:rgb(61, 72, 82);"> SPA 缺点</font>
+ **<font style="color:rgb(61, 72, 82);">搜索引擎优化 (SEO) 较差：</font>**<font style="color:rgb(61, 72, 82);">搜索引擎具有可以解析 JavaScript 的爬虫，但它们很难爬取异步内容。加载初始页面后，不知道还有其他数据的爬虫将停止爬取，从而导致 SEO 效率低。</font>
+ **<font style="color:rgb(61, 72, 82);">内存泄漏：</font>**<font style="color:rgb(61, 72, 82);">事件监听器占用大量空间。使用 SPA 在客户端很容易引入内存泄漏，如果将事件侦听器添加到全局对象，而没有在卸载组件时删除它们，就会产生内存泄漏。如果不想导致内存泄漏，则需要清理事件侦听器、定时器等。</font>
+ **<font style="color:rgb(61, 72, 82);">安全性：</font>**<font style="color:rgb(61, 72, 82);">与 MPA 相比，</font>SPA更容易受到跨站点脚本攻击（XSS）。

## 2. 多页面应用程序（MPA）
MPA 全称 <font style="color:rgb(61, 72, 82);">Multi-Page Application，表示多页面应用程序。</font>多页面应用程序由多个 HTML 文件组成，<font style="color:rgb(61, 72, 82);">每当请求页面时就会下载这些文件。我们在地址栏输入的每个新的 URL 或单击的每个超链接时都会向服务器发送一个新请求，并下载一个新的页面。在这种方法中，服务器完成了较为繁重的工作。因此，如果用户的网络连接较差，每个页面可能需要很长时间才能加载出来。</font>





#### <font style="color:rgb(61, 72, 82);">☀</font><font style="color:rgb(61, 72, 82);"> MPA 优点</font>
+ <font style="color:rgb(61, 72, 82);"></font>**<font style="color:rgb(61, 72, 82);">搜索引擎优化（SEO）更好：</font>**<font style="color:rgb(61, 72, 82);">单页可以只有有限数量的关键字，但多页应用程序可以为多个页面提供相同数量的关键字，这为爬虫提供了更多关于网站的信息.</font>
+ **<font style="color:rgb(61, 72, 82);">良好的可扩展性：</font>**<font style="color:rgb(61, 72, 82);">可以持续添加功能，不断扩展。但在 SPA 中，随着不断添加功能，bundle.js 将会不断增长，因此要么减少内容，要么进行延迟加载。</font>
+ **<font style="color:rgb(61, 72, 82);">内存泄漏很少见：</font>**<font style="color:rgb(61, 72, 82);">服务器端很有可能出现内存泄漏，但客户端内存泄漏很少见，因为浏览器将为每个导航链接加载不同的脚本。</font>



#### <font style="color:rgb(61, 72, 82);">☀</font><font style="color:rgb(61, 72, 82);">MPA 缺点</font>
+ **<font style="color:rgb(61, 72, 82);">加载速度慢：</font>**<font style="color:rgb(61, 72, 82);">它们不断地为每个请求加载新页面（即使 UI 发生了细微的变化，页面也必须重新加载）。如果客户端的网络连接不好或服务器速度慢，加载速度就会下降，最终导致用户体验不佳。</font>
+ **<font style="color:rgb(61, 72, 82);">开发效率低：</font>**<font style="color:rgb(61, 72, 82);">代码可重用性较低，文件较大，前端与后端的耦合更紧密。这些因素会使开发效率低。</font>
+ <font style="color:rgb(61, 72, 82);"></font>**<font style="color:rgb(61, 72, 82);">增加服务器负载：</font>**<font style="color:rgb(61, 72, 82);">与服务器的每次交互都包含一个需要渲染的 UI 包。</font>
+ **转场动画：**无法实现。
+ **页面间数据传递**：依赖URL、Cookie、或者localStorage等，实现麻烦。

## 3. 渐进式应用程序（PWA）
PWA 全称 Progressive Web Apps，表示渐进式应用程序。渐进式应用程序可以在独立的窗口中运行，而不是在浏览器的选项卡中运行。简单的说，它们是一种web应用程序，类似于本地应用程序，可以安装在手机、平板电脑或者笔记本电脑上。下载后，用户可以通过屏幕上的图标访问该应用。这种应用还可以向用户发送推送消息和通知。渐进式应用程序可以是 单页面应用（SPA）也可以是多页面应用（MPA）。



想要申请 PWA 应用，<font style="color:rgb(61, 72, 82);">必须满足三个条件：</font>

1. **<font style="color:rgb(61, 72, 82);">安全上下文 (HTTPS)：</font>**<font style="color:rgb(61, 72, 82);"> </font>安全上下文<font style="color:rgb(61, 72, 82);">是为用户身份验证和机密性定义的最低标准。</font><font style="color:rgb(61, 72, 82);">PWA 的许多 API 和许多功能（如地理定位）只有在应用程序通过安全网络提供服务时才可用。</font>
2. **<font style="color:rgb(61, 72, 82);">Service Worker：</font>**<font style="color:rgb(61, 72, 82);"> </font><font style="color:rgb(61, 72, 82);">Service Worker 是在后台运行并控制浏览器如何处理网络请求和内容缓存的脚本。</font><font style="color:rgb(61, 72, 82);">PWA 通过服务工作者提供离线服务。</font>
3. **<font style="color:rgb(61, 72, 82);">清单文件：</font>**<font style="color:rgb(61, 72, 82);">这是一个 JSON 文件，用于保存 PWA 所需的应用程序信息，例如应用程序的名称、启动 URL、多种尺寸的图标和主题颜色。</font>

<font style="color:rgb(61, 72, 82);"></font>

<font style="color:rgb(61, 72, 82);">与原生移动应用程序相比，渐进式 Web 应用程序更小。研究表明它们有助于增加流量和用户参与度，并降低跳出率，这主要归功于它的离线可用性。</font>



> 更新: 2022-03-22 19:52:51  
> 原文: <https://www.yuque.com/cuggz/feplus/bkkuq8>