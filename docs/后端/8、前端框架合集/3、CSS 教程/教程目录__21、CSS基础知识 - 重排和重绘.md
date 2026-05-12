# 21、CSS基础知识 - 重排和重绘
- 来源：https://ddkk.com/zhuanlan/qianduan/css/1/21.html
- 分类：前端框架
- 分组：教程目录
**重排一定会重绘，但重绘不一定会重排**

**重排(Reflow)**：当渲染树的一部分必须更新并且节点的尺寸发生了变化，浏览器会使渲染树中受到影响的部分失效，并重新构造渲染树。当元素的尺寸、结构或者触发某些属性时

**重绘(Repaint)**：是在一个元素的外观被改变所触发的浏览器行为，浏览器会根据元素的新属性重新绘制，使元素呈现新的外观。比如改变某个元素的背景色、文字颜色、边框颜色等等当元素样式的改变不影响布局时

**引发重排**：添加、删除可见的dom，元素的位置改变，元素的尺寸改变(外边距、内边距、边框厚度、宽高、等几何属性)，页面渲染初始化，浏览器窗口尺寸改变，获取某些属性。当获取一些属性时，浏览器为取得正确的值也会触发重排,它会导致队列刷新，这些属性包括：offsetTop、offsetLeft、 offsetWidth、offsetHeight、scrollTop、scrollLeft、scrollWidth、scrollHeight、clientTop、clientLeft、clientWidth、clientHeight、getComputedStyle() (currentStyle in IE)。所以，在多次使用这些值时应进行缓存。

**减少 reflow/repaint：**

（1）不要一条一条地修改 DOM 的样式。可以先定义好 css 的 class，然后修改 DOM 的 className。

（2）不要把 DOM 结点的属性值放在一个循环里当成循环里的变量。

（3）为动画的 HTML 元件使用 fixed 或 absoult 的 position，那么修改他们的 CSS 是不会 reflow 的。

（4）千万不要使用 table 布局。因为可能很小的一个小改动会造成整个 table 的重新布局。(table及其内部元素除外，它可能需要多次计算才能确定好其在渲染树中节点的属性，通常要花3倍于同等元素的时间。这也是为什么我们要避免使用table做布局的一个原因。)

（5）不要在布局信息改变的时候做查询（会导致渲染队列强制刷新）
