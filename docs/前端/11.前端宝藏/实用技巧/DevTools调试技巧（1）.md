# DevTools 调试技巧（1）

### 1. Chrome DevTools功能简介

![1612688976273-20295a0c-3f3f-442d-960a-174d76ebc8c9.png](./img/vfqa-QK0LMynCf5f/1612688976273-20295a0c-3f3f-442d-960a-174d76ebc8c9-088447.png)

Chrome DevTools由以下九部分组成：

* **Element元素面板**：检查和调整页面，调式DOM，调试CSS
* **Network网络面板**：调试请求，了解页面静态资源分布以及网页性能的检测
* **Console控制台面**板：调试JavaScript。查看Console log日志、交互式代码调试
* **Sources源代码资源面板**：调试JavaScript页面源代码，进行断点调试代码
* **Application应用面板**：查看、调试客户端存储，如Cookie、LocalStorage、SessionStorage等
* **Performance性能面板**：查看网页的细节，细粒度对网页载入进行性能优化
* **Memory内存面板**： JavaScript CPU分析器，内存堆分析器
* **Security安全面板**： 查看网页安全及证书问题
* **LightHouse面板**：进行性能分析，给出优化建议

![1612691203792-c2eb5e35-b918-4385-b398-15e0db6b2173.png](./img/vfqa-QK0LMynCf5f/1612691203792-c2eb5e35-b918-4385-b398-15e0db6b2173-833174.png)

打开Chrome开发者工具**快捷键**：

![1612688976209-bf0154a9-8ce5-4ac3-8891-05f17ee0959b.png](./img/vfqa-QK0LMynCf5f/1612688976209-bf0154a9-8ce5-4ac3-8891-05f17ee0959b-506215.png)

### 2. 使用Elements调试DOM

#### 2.1 查看编辑HTML和DOM

可以在页面中选中DOM，在DOM中反向定位到页面位置

可以对HTML和DOM进行编辑操作：

* 编辑内容
* 编辑属性
* 修改元素类型
* 调整DOM节点顺序
* 编辑HTML代码
* 删除、隐藏、增加、拷贝节点

#### 2.2 在Console中访问节点

我们也可以在`console`访问节点：

**（1）使用**<code>**document.querySelectorAll()**</code>**访问**

我们进入Element模块，点击ESC键即可。这个方法返回一个`NodeList`数组，数组中是所有的选中的标签

![1612688976236-7b224823-d436-4c1d-b3f6-8730c490e0d2.png](./img/vfqa-QK0LMynCf5f/1612688976236-7b224823-d436-4c1d-b3f6-8730c490e0d2-009804.png)

**（2）使用$0快速访问选中的元素**

当我们选中一个元素时，会显示下面这样的提示：

![1612688976216-e418efec-2e40-4358-bfed-2f6dcacbd798.png](./img/vfqa-QK0LMynCf5f/1612688976216-e418efec-2e40-4358-bfed-2f6dcacbd798-774423.png)

这也就是说，我们可以使用`$0`来访问该元素，这样就会显示出我们选中的元素：

![1612688976249-e64201b8-70ed-4f45-b1f7-d885f900cfd8.png](./img/vfqa-QK0LMynCf5f/1612688976249-e64201b8-70ed-4f45-b1f7-d885f900cfd8-734763.png)

**（3）拷贝 JS Path 进行访问**

右键点击选中的元素，点击`Copy`，选择`Copy JS path`，即可复制该元素的路径，在`Console`中粘贴就会显示出对应的元素：

显示的结果：

![1612688976278-583fc3f2-e380-41da-b226-737192f7d037.png](./img/vfqa-QK0LMynCf5f/1612688976278-583fc3f2-e380-41da-b226-737192f7d037-991970.png)

#### 2.3 在DOM中断点调试

我们可以在以下几种情况下进行断点调试：

**（1）属性修改时打断点**

我们将选中的a标签的href值进行修改：

步骤：`右键点击元素 => Break on =>attribute modifications` ，这样就给元素打上断点，复制该元素的JS path，并对其值进行修改，然后执行断点：

![1612688976218-70f114aa-177c-4a35-8241-70d21016f32e.png](./img/vfqa-QK0LMynCf5f/1612688976218-70f114aa-177c-4a35-8241-70d21016f32e-109446.png)

执行后：

![1612688976282-24d2b858-2ffa-4b22-b61a-0d66b218c412.png](./img/vfqa-QK0LMynCf5f/1612688976282-24d2b858-2ffa-4b22-b61a-0d66b218c412-432351.png)

**（2）节点删除时打断点**

这个和上面的步骤类似，我们来删除一个a节点，需要使用其父元素的`removeChild`属性，断点设置为`Break on=> node removal`：

![1612688976213-6ed9d272-251d-4920-b50b-fd7a81c47a72.png](./img/vfqa-QK0LMynCf5f/1612688976213-6ed9d272-251d-4920-b50b-fd7a81c47a72-705554.png)

执行后（删除了左上角的“地图”标签）：

![1612688976256-a068dbda-aaea-400e-bb12-6557605ed61e.png](./img/vfqa-QK0LMynCf5f/1612688976256-a068dbda-aaea-400e-bb12-6557605ed61e-706116.png)

**（3）在子树修改时打断点**

这种方式，我们需要对父元素打断点，这次来删除左上角的“贴吧”标签，断点设置为`Break on=> subtree modifications`：

![1612688976274-9d4b3e87-f95f-40af-96b6-c29655f82683.png](./img/vfqa-QK0LMynCf5f/1612688976274-9d4b3e87-f95f-40af-96b6-c29655f82683-630125.png)

执行后：

![1612688976215-b26baeaf-9f3a-4d3c-bda4-8382063cd934.png](./img/vfqa-QK0LMynCf5f/1612688976215-b26baeaf-9f3a-4d3c-bda4-8382063cd934-343486.png)

### 3. 调试样式及CSS

#### 3.1 查看和编辑CSS

查看一下百度输入框的样式：

![1612688976271-c73b6e4f-5042-4226-91bc-24623f7c868c.png](./img/vfqa-QK0LMynCf5f/1612688976271-c73b6e4f-5042-4226-91bc-24623f7c868c-558483.png)

在这些样式中，从上到下，优先级依次降低。因为有些样式优先级较低，会被较高优先级的样式覆盖掉，所以会被划掉。我们可以对这些样式的属性或属性值进行修改，也可以划掉这个样式，使其隐藏。

可以通过`Filter`过滤需要的属性，过滤出来的属性会进行高亮显示：

![1612688976211-9eb4c92f-6b8f-4cf2-94b9-e7ff94929a53.png](./img/vfqa-QK0LMynCf5f/1612688976211-9eb4c92f-6b8f-4cf2-94b9-e7ff94929a53-198872.png)

还可以实时查看该元素的盒模型：

![1612688976330-77ba9546-dbbf-41ab-8706-cbd0ac5a6002.png](./img/vfqa-QK0LMynCf5f/1612688976330-77ba9546-dbbf-41ab-8706-cbd0ac5a6002-368745.png)

#### 3.2 在元素中动态添加类与伪类

可以通过点击右上角的`:hov`、`.cla`来动态的添加类与伪类，也可以对已有的类伪类进行查看：

![1612688976329-32e2b561-675c-4495-a372-db4f40998e1f.png](./img/vfqa-QK0LMynCf5f/1612688976329-32e2b561-675c-4495-a372-db4f40998e1f-367865.png)

动态的添加类：

![1612688976279-885f275e-116a-427e-be32-050e44e01c11.png](./img/vfqa-QK0LMynCf5f/1612688976279-885f275e-116a-427e-be32-050e44e01c11-571816.png)

添加伪类需要勾选上面的伪类类型，在进行添加。

#### 3.3 快速调试CSS数值及颜色图形动画等

在右上角element.style右侧有三个点，鼠标移动上去就可以看到以下四个按钮：

![1612688976271-09ea238c-ac23-4f67-817d-c5bb4c08ddc0.png](./img/vfqa-QK0LMynCf5f/1612688976271-09ea238c-ac23-4f67-817d-c5bb4c08ddc0-112072.png)

这四个按钮分别是：

* `text-shadow`：文字阴影
* `box-shadow`：盒子阴影
* `color`：文字颜色
* `background-color`：背景颜色

可以通过这四个按钮功能实现可视化的调节元素对应的样式。

（1）以`text-shadow`为例，可以通过调整数值来调整阴影的偏移位置以及模糊程度：

![1612688976324-199dbe3d-3132-4001-9a74-f2340a987451.png](./img/vfqa-QK0LMynCf5f/1612688976324-199dbe3d-3132-4001-9a74-f2340a987451-194398.png)

（2）**box-shadow：**

![1612688976370-73ff8e04-805f-4739-96a5-7374951164ef.png](./img/vfqa-QK0LMynCf5f/1612688976370-73ff8e04-805f-4739-96a5-7374951164ef-576467.png)

（3）**color：**

![1612688976299-fc619c2c-7486-4005-a680-83bfdf0a5c73.png](./img/vfqa-QK0LMynCf5f/1612688976299-fc619c2c-7486-4005-a680-83bfdf0a5c73-291972.png)

（4）**background-color**

![1612688976268-da3a4dfc-1503-460b-bfe3-c5c888d6b63d.png](./img/vfqa-QK0LMynCf5f/1612688976268-da3a4dfc-1503-460b-bfe3-c5c888d6b63d-136517.png)

可以打开Animations来调试动画：

![1612688976370-fd4cc77b-49d6-4974-a040-0502b2f7af10.png](./img/vfqa-QK0LMynCf5f/1612688976370-fd4cc77b-49d6-4974-a040-0502b2f7af10-179397.png)

我们给百度的输入搜索框加了一个`:hover`之后高度变高的效果，这个工具就会录制这个动画的开始和离开，并显示在下方：

![1612688976278-4dd39a2d-cdcb-4b75-9c08-ce6fb0652bf3.png](./img/vfqa-QK0LMynCf5f/1612688976278-4dd39a2d-cdcb-4b75-9c08-ce6fb0652bf3-060815.png)

随便点击一个进去，就可以对动画的属性值进行调试：

![1612688976297-580cd9fc-2abf-41e7-ae23-ebd496ddd0e5.png](./img/vfqa-QK0LMynCf5f/1612688976297-580cd9fc-2abf-41e7-ae23-ebd496ddd0e5-752528.png)

### 4. 使用 Console 和 Sources 调试 JavaScript

#### 4.1 Console面板简介及交互式命令

可以使用Console面板执行以下功能：

* 运行JavaScript代码，交互式编程
* 查看程序中打印的Log日志

（1）在Console中输入一些JavaScript代码，表达式，算法等来进行调试：

![1612688976386-5df95794-3222-477e-8625-db2fd45cdee5.png](./img/vfqa-QK0LMynCf5f/1612688976386-5df95794-3222-477e-8625-db2fd45cdee5-032795.png)

（2）查看程序中打印的Log日志：

在平时项目，可能使用console来打印后端传来的请求响应数据，来查看数据格式。还会查看一些代码的运行结果等等。

`console`提供了很多方法打印方法：

![1612688976292-ab2c51a2-14f3-41ef-9125-e4c048ad6ffe.png](./img/vfqa-QK0LMynCf5f/1612688976292-ab2c51a2-14f3-41ef-9125-e4c048ad6ffe-429662.png)

主要的调试方法有以下四种，其中`error`和`warn`方法有特定的图标和颜色标识：

* `console.log()`：打印普通信息
* `console.info()`：打印提示性信息
* `console.error()`：打印错误信息
* `console.warn()`：打印警示信息

![1612688976394-f34fb01c-49f5-4417-b3f3-cc0effd192b5.png](./img/vfqa-QK0LMynCf5f/1612688976394-f34fb01c-49f5-4417-b3f3-cc0effd192b5-932171.png)

#### 4.2 调试JavaScript的基本流程及断点调试

对于JavaScript的调试主要有以下两种方式：

* 传统的`console.log`或者是`alert()`打印运行时信息进行调试
* JavaScript断点调试

**（1）使用debugger进行断点调试**

断点调试，在需要断点的位置设置一个`debugger`：

![1612688976350-33f9eaa1-c8bd-4413-a2bc-e9d6337839ce.png](./img/vfqa-QK0LMynCf5f/1612688976350-33f9eaa1-c8bd-4413-a2bc-e9d6337839ce-123399.png)代码下面有一行工具栏，可以进行单步的调试：

![1612688976350-9be20881-8171-45af-a8a6-b2bcb606bae5.png](./img/vfqa-QK0LMynCf5f/1612688976350-9be20881-8171-45af-a8a6-b2bcb606bae5-602441.png)

他们分别代表：

* Resume script execution：恢复脚本的执行
* Step over next function call：跳过下一个函数的执行
* Step into next function call：进入到下一个函数的执行
* Step out of current function：跳出当前函数
* Step（快捷键F9）：单步执行

**（2）使用事件监听进行断点调试**

除了使用`debugger`之外，还可以直接进行断点设置：

![1612688976421-a067a603-7276-40fa-865d-f9956e0eff33.png](./img/vfqa-QK0LMynCf5f/1612688976421-a067a603-7276-40fa-865d-f9956e0eff33-045913.png)

最下面这个是事件监听的事件，我们只要选中相应的事件，再在页面执行响应的事件，就可以进行断点调试。

**（3）在代码行上设置断点**

通常我们会在有问题的那几行代码设置断点，然后进行断点调试（可以同时设置多个断点）：

![1612688976379-6e7ee0f4-2c77-4590-a5df-502a754903ed.png](./img/vfqa-QK0LMynCf5f/1612688976379-6e7ee0f4-2c77-4590-a5df-502a754903ed-824733.png)

可以在Scope中查看相关变量的值。

#### 4.3 Sources源代码面板简介

Sources面板包含了该网站的静态资源：

![1612688976334-3c459b8c-6757-4315-ad3c-59ff12922926.png](./img/vfqa-QK0LMynCf5f/1612688976334-3c459b8c-6757-4315-ad3c-59ff12922926-263325.png)

我们可以使用快捷键`Ctrl+P`来搜索相关的静态资源文件来查看，还可以使用快捷键`Ctrl+ Shift+P`来调出命令行，命名行中有所有命令的快捷键：

![1612688976304-e9fb39a5-7754-4743-a94f-d1d9bd821160.png](./img/vfqa-QK0LMynCf5f/1612688976304-e9fb39a5-7754-4743-a94f-d1d9bd821160-258574.png)

打开需要调试的文件，就可以在右侧进行编辑调试。

#### 4.4 使用Snippets来辅助Debugging

![1612688976422-1b18e2f8-0e04-417b-bc6e-5b0e2c29f226.png](./img/vfqa-QK0LMynCf5f/1612688976422-1b18e2f8-0e04-417b-bc6e-5b0e2c29f226-086699.png)

我们可以点击`New snippet`来添加一个代码片段来辅助调试，比如，可以引入JQuery来赋值调试：

![1612688976416-f15f3bb0-8aae-4229-aa2f-24e3aa95d7f2.png](./img/vfqa-QK0LMynCf5f/1612688976416-f15f3bb0-8aae-4229-aa2f-24e3aa95d7f2-435503.png)

引入片段之后，右键点击该引入的文件，点击`run`，就可以使用JQuery对原来的样式、事件等进行调试了。

需要注意的是：新引入的代码片段不会对原有代码产生影响。

#### 4.5 使用DevTools作为代码编辑器

在Sources中有一个`Filesystem`，在里面可以添加本地文件进行编辑操作，相当于一个编辑器（这种方法是对本地源代码的编辑）：

![1612688976363-7c549063-0e09-4ad5-8a4d-fffd129c6de2.png](./img/vfqa-QK0LMynCf5f/1612688976363-7c549063-0e09-4ad5-8a4d-fffd129c6de2-965231.png)

### 5. 调试网络

#### 5. 1 Network 面板简介

我们可以用Network面板来完成以下事情：

* 查看网页资源请求预览，查看资源分布
* 针对单一请求查看Request/Response或消耗时间等
* 分析网页性能优化，使用工具代理页面请求数据等

我们可以看到执行一个操作之后，所有的网络请求数据：

![1612688976513-a5535193-95d1-4d43-bc75-2f27a14d3e9a.png](./img/vfqa-QK0LMynCf5f/1612688976513-a5535193-95d1-4d43-bc75-2f27a14d3e9a-863531.png)

#### 5.2 使用Network查看网页查看站点网络

选择过滤，就可以对网络请求数据进行筛选，可以搜索数据名称，也可以根据类型进行筛选：

![1612688976451-9fb7b197-62cb-4736-b1ca-1b7add1aa240.png](./img/vfqa-QK0LMynCf5f/1612688976451-9fb7b197-62cb-4736-b1ca-1b7add1aa240-709540.png)

`All`是请求回来的所有数据，`XHR`是所有异步请求的数据。

点开`XHR`中的一条请求数据，就可以查看它的详细信息：

![1612688976603-37755662-b542-42d7-8d94-4af99b9967f2.png](./img/vfqa-QK0LMynCf5f/1612688976603-37755662-b542-42d7-8d94-4af99b9967f2-840038.png)

过滤按钮后面是search，过滤只能过滤请求数据，而`search`不仅可以搜索到请求数据还可以搜索数据的请求头和请求体，还可以进行正则匹配：

![1612688976618-7444da37-2e4f-4ab5-8f71-bc44f8e0f5f8.png](./img/vfqa-QK0LMynCf5f/1612688976618-7444da37-2e4f-4ab5-8f71-bc44f8e0f5f8-873617.png)

可以通过Preserve log可以记录上一个网页的请求，可以通过Disable cache禁用缓存：

![1612688976459-9863fc3e-21c5-45a8-80ef-7d9828ec0ea9.png](./img/vfqa-QK0LMynCf5f/1612688976459-9863fc3e-21c5-45a8-80ef-7d9828ec0ea9-364123.png)

对于单一的请求，`Headers` 是请求头相关数据，`Preview`是对请求回来的数据进行预览，`Response`是请求回来的数据，`Timing`在心性能优化时会用到：

![1612688976377-ebf4f0b3-04fc-4b22-b53f-784c7f311639.png](./img/vfqa-QK0LMynCf5f/1612688976377-ebf4f0b3-04fc-4b22-b53f-784c7f311639-820971.png)

`timing`内容：

![1612688976501-258d0fa5-9a22-4596-b3dd-21f54476501c.png](./img/vfqa-QK0LMynCf5f/1612688976501-258d0fa5-9a22-4596-b3dd-21f54476501c-638464.png)

在请求的最下面，有对所有请求的统计信息:

![1612688976822-53d7653f-01d7-41f8-9cf3-81d14b6650d2.png](./img/vfqa-QK0LMynCf5f/1612688976822-53d7653f-01d7-41f8-9cf3-81d14b6650d2-962648.png)

#### 5.3 使用Network Waterfall分析页面载入性能

对于请求数据，右侧会显示请求时间：

![1612688976636-f8df6dff-0126-4162-9c41-08a2d6bb06ca.png](./img/vfqa-QK0LMynCf5f/1612688976636-f8df6dff-0126-4162-9c41-08a2d6bb06ca-326063.png)

可以根据请求时间的长短，对项目做出相应的优化。如，有些JS、CSS文件可以合并、进行压缩等操作，对于图片可以懒加载等。

可以查看某个请求的具体请求时间，来确定是哪里耗时较多：

![1612688976380-741a2dfd-8de8-4ffb-808d-71b600e25e70.png](./img/vfqa-QK0LMynCf5f/1612688976380-741a2dfd-8de8-4ffb-808d-71b600e25e70-206368.png)

### 6. 客户端存储Application面板

#### 6.1 查看与调试Cookie

可以在Application面板查看Cookie：

![1612688976388-fc474edc-8779-442d-88f3-678c63511f17.png](./img/vfqa-QK0LMynCf5f/1612688976388-fc474edc-8779-442d-88f3-678c63511f17-382120.png)

可以直接点击添加、删除、修改上面Cookie的属性值，还可以通过`document.cookie ='cookie名称 = cookie值'`来添加新的cookie：

![1612688976634-9352dda6-a71f-4159-8f79-dcd9cc65b740.png](./img/vfqa-QK0LMynCf5f/1612688976634-9352dda6-a71f-4159-8f79-dcd9cc65b740-483485.png)

#### 6.2 查看与调试LocalStorage与SessionStorage

我们同样可以直接点击添加、删除、修改LocalStorage与SessionStorage的属性值:

![1612688976479-4a81dc5f-0c09-4642-b42b-1aab5b08d459.png](./img/vfqa-QK0LMynCf5f/1612688976479-4a81dc5f-0c09-4642-b42b-1aab5b08d459-932580.png)

使用localStorage的API可以对其进行增删改查的操作（sessionStorage也有类似的操作）:

![1612688976434-1a803ee1-d3a5-42e8-9093-e62f7eeb1cff.png](./img/vfqa-QK0LMynCf5f/1612688976434-1a803ee1-d3a5-42e8-9093-e62f7eeb1cff-937716.png)

LocalStorage会永久存储在该站点的本地存储下，SessionStorage的本地存储会在一次会话或者登出、关闭浏览器等情况之后删除。

### 7. 调试移动设备、H5页面及远程调试

#### 7.1 移动端H5页面调试

点击如图所示的按钮，就可以切换为移动端显示，可以在上面的工具栏切换显示的设备，以及缩放的大小：

![1612688976477-fc0ee3e2-9176-453f-a99a-cca809c3f1cc.png](./img/vfqa-QK0LMynCf5f/1612688976477-fc0ee3e2-9176-453f-a99a-cca809c3f1cc-449866.png)

#### 7.2 使用Chrome DevTools 进行H5页面的开发

当针对移动设备进行开发时，会有一些诸如获取地理位置，角度、尺寸、方向等操作。我们使用快捷键`Ctrl+shift+p`调出菜单，然后搜索sensors，点击会出现Sensors面板：

![1612688976532-3aa6d008-2294-413f-9002-b76707282543.png](./img/vfqa-QK0LMynCf5f/1612688976532-3aa6d008-2294-413f-9002-b76707282543-174095.png)

这三个选项分别是：

* Location：地理位置信息
* Orientation：设备的方向信息
* Touch：触摸信息

我们可以通过这些选项**更改地理位置信息**、**更改模拟设备的方向**、**更改触摸相关属性**。

还可以使用快捷键`Ctrl+shift+p`调出菜单，然后搜索`Network conditions`，点开会出现一个菜单：

![1612688976427-84430a1e-b84d-4013-99cb-13a4cd5f44bc.png](./img/vfqa-QK0LMynCf5f/1612688976427-84430a1e-b84d-4013-99cb-13a4cd5f44bc-478408.png)

第一项是禁用缓存，第二项是模拟网络情况，第三项是模拟用户的`user-agent`，里面有很多选项可以选择：

![1612688976513-dea49c94-0810-4661-8f7b-96b2953337aa.png](./img/vfqa-QK0LMynCf5f/1612688976513-dea49c94-0810-4661-8f7b-96b2953337aa-553614.png)

### 8. 在DevTools中集成Vue和React插件

我们可以在扩展程序中添加React和Vue的插件，安装之后，浏览器的右上角会显示相应的图标。如果该网站是使用Vue开发的，Vue的图标就会点亮，React也一样。

我们打开Vue官网，就可看到Vue的图标点亮了，说明该网站是使用Vue开发的（废话，Vue官网肯定用Vue开发的啦）：

![1612688976502-2a7c8379-c877-4b12-a232-cbede62e58cc.png](./img/vfqa-QK0LMynCf5f/1612688976502-2a7c8379-c877-4b12-a232-cbede62e58cc-819962.png)

添加之后，就可以在DevTools中看到Vue的选项，在里面查看组件、数据、Vuex等内容：

![1612688976455-a39a3739-34b3-48ac-96e0-a83d259e5dc6.png](./img/vfqa-QK0LMynCf5f/1612688976455-a39a3739-34b3-48ac-96e0-a83d259e5dc6-555537.png)

**最后的最后：**

Chrome DevTools开发者工具是前端开发中必不可少的工具，当然，学习这些理论基础是远远不够的，我们还需要根据实际的开发需要去使用不用的工具对代码进行调试，用的多了自然就知道怎么使用了。

“工欲善其事，必先利其器！”


> 更新: 2021-02-07 17:47:08  
> 原文: <https://www.yuque.com/cuggz/feplus/wh3ipr>