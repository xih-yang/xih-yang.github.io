# 36、JavaScript 事件和事件类型
- 来源：https://ddkk.com/zhuanlan/qianduan/javascript/1/36.html
- 分类：前端框架
- 分组：教程目录
事件：发生并得到处理的操作。即：’事情来了，然后处理。

例如：电话铃声响起（事件发生）—需要接电话（事件处理）

事件绑定方式：Javascript事件是由访问Web页面的用户，引起的一系列操作，例如：用户点击。当用户执行某些操作的时候，再去执行一系列代码

JavaScript有两种事件模型：内联模型、脚本模型

内联模型：在HTML中把事件处理函数作为属性执行JS代码。

最传统简单的一种处理时间的方法。在内联模型中，事件处理函数是HTML标签中的一个**属性**，用于处理指定的事件，虽然内联早期使用较多，但他是和HTML混写的，并没有与HTML分离。

外联（脚本）模式：

绑定事件格式：

元素节点.on+事件类型=匿名函数。

onclick： click 事件类型 onclick事件处理函数

### 事件类型：

#### 一、鼠标事件 ：可以绑定在任意元素节点上

click 单击 dbclick 双击 mouseover 鼠标移入 mouseout 鼠标移出 mousemove 鼠标移动（会不停触发）mouseenter 鼠标移入 mouseleave 鼠标移出 mouseup 鼠标抬起瞬间 mousedown 鼠标摁下瞬间

#### mouseover 、mouseout与mouseenter、mouseleave区别：

mouseover 、mouseout：如果事件绑定在父节点身上时，不仅会在进入父节点那一刻触发，在子节点和父节点来回移动时也会触发。**不适合子节点过多的情况**

mouseenter、mouseleave：（IE8以后才有）如果事件绑定在父节点身上时，只会在进入父节点那一刻触发，在子节点和父节点来回移动时不会触发。

由上图就能够知道，当鼠标从绿色元素外部进入到子元素灰色边框是，mouseenter只触发了一次，而mouseover触发了两次。

#### 二、键盘事件（表单元素，全局window）

keydown 键盘摁下(一直不放手一直触发)

keyup 抬起

keypress 键盘摁下(一直不放手一直触发) （只支持字符键（字母、数字））

#### 三、HTML事件

**1、** window事件；

load 当页面加载完成以后会触发

unload 当页面解构的时候触发（刷新页面，关闭当前页面）仅IE浏览器兼容

scroll 页面滚动的时候触发

resize 窗口大小发生变化的时候触发

**2、** 表单事件；

blur：失去焦点（光标）

focus：获取焦点（光标）

select：当我们在输入框内选中文本的时候被触发

change：修改输入框内容并且失去焦点时候触发

submit ：表单提交时触发、

reset ：表单重置时触发 （必须是form标签才会触发）
