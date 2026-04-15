# DevTools 调试技巧（2）

## 1. 选择和检查 DOM 元素

在 Chrome DevTools 的 Console 面板中，可以输入一些带 `$` 的命令来选择和检查 DOM 元素。

`$0` - `$4` 命令可以用来显示在 Elements 面板中检查的最后五个 DOM 元素，`$0` 返回最近一次选择的元素，`$1` 返回最近一次之前选择的元素，依此类推。

![1659018387645-9b4e70e2-42ce-4faa-9216-a94b9ff15615.png](./img/WqlyVFsV2FyYm0mO/1659018387645-9b4e70e2-42ce-4faa-9216-a94b9ff15615-381982.png)

`$(selector)` 返回带有指定的 CSS 选择器的第一个 DOM 元素的引用。这个命令就等同于 `document.querySelector()` 函数：

![1659018615608-1fb1ead8-c115-49b5-8166-f2a461ccbb62.png](./img/WqlyVFsV2FyYm0mO/1659018615608-1fb1ead8-c115-49b5-8166-f2a461ccbb62-881990.png)

`$$(selector)` 返回与给定 CSS 选择器匹配的元素数组。这个命令等同于 `document.querySelectorAll()` 函数：

![1659018778594-de20431f-5692-4f80-a909-418255a62f0a.png](./img/WqlyVFsV2FyYm0mO/1659018778594-de20431f-5692-4f80-a909-418255a62f0a-241033.png)

## 2. 复制数据

在日常开发中，我们会使用 Chrome DevTools 来调试页面，比如修改页面的样式、节点属性等。其为我们提供了复制数据的功能，可以将修改后的内容复制到源代码中。

**复制 CSS 样式：**

![1659016208578-621bfac7-d67b-44da-b213-039f520e3227.png](./img/WqlyVFsV2FyYm0mO/1659016208578-621bfac7-d67b-44da-b213-039f520e3227-882722.png)

我们可以复制 CSS 规则或声明，甚至可以将内容复制为 JavaScript 键值对：

```javascript
// Copy rule
element.style {
    max-height: 90%;
    max-width: 90%;
}

// Copy all decalarations as js
maxHeight: '90%',
maxWidth: '90%'

// Copy property
max-height

// Copy value
90%
```

**复制 HTML 内容**，右键点击要复制的元素 -> Copy，点击要复制的内容类型即可：

![1659016731273-6bf1d143-b94d-4f98-9196-6a326be5e7d2.png](./img/WqlyVFsV2FyYm0mO/1659016731273-6bf1d143-b94d-4f98-9196-6a326be5e7d2-115845.png)

**复制请求数据：**

![1659017222776-6b942996-60a9-470f-930b-a7dc1b9399ba.png](./img/WqlyVFsV2FyYm0mO/1659017222776-6b942996-60a9-470f-930b-a7dc1b9399ba-071158.png)

## 3. 发送 XHR 请求

Chrome DevTools 支持重新发送 XHR 请求。在和后端进行接口联调时，如果想要重新发送请求，并且参数保持不变，可以直接右键点击要重新发送的 XHR 请求，点击 Replay XHR 即可重新发送该请求：

![1659022161060-09f750fa-7456-4298-b63b-e3e2a61c19c3.png](./img/WqlyVFsV2FyYm0mO/1659022161060-09f750fa-7456-4298-b63b-e3e2a61c19c3-314778.png)

对于一个请求，有时需要修改请求参数并重新发送，可以直接在控制台发送请求。只需要先右键点击需要重新发送的 XHR 请求，选择 Copy -> Copy as fetch：

![1659022304350-25e8bbac-6152-4cde-a416-4912a33b543e.png](./img/WqlyVFsV2FyYm0mO/1659022304350-25e8bbac-6152-4cde-a416-4912a33b543e-739868.png)

在 Console 面板中粘贴已经复制的请求内容，修改所需参数，按下回车发送请求即可：

![1659022492098-15e1eaf6-19c4-45bd-8bd8-25994bd7f50c.png](./img/WqlyVFsV2FyYm0mO/1659022492098-15e1eaf6-19c4-45bd-8bd8-25994bd7f50c-153398.png)

## 4. 颜色选择器

Chrome DevTools 提供了一个颜色选择器来设置背景颜色和文本颜色。颜色选择器具有各种功能：

颜色选择器具有各种功能，例如

* 色调控制；
* 使用吸管从页面元素中选择颜色；
* 切换调色板；
* 可以在当前颜色的 RGBA、HSLA 和十六进制表示之间切换；
* 不透明度控制。

只需在元素样式的颜色显示块上点击即可弹出颜色选择器：

![1659017634970-3ea4399b-4fe9-49fa-8e54-efa11eb4739c.png](./img/WqlyVFsV2FyYm0mO/1659017634970-3ea4399b-4fe9-49fa-8e54-efa11eb4739c-556664.png)

可以使用吸管从页面上直接吸取颜色：

![1659017806680-2496288c-1963-4cfa-87b2-2868815aa1ee.png](./img/WqlyVFsV2FyYm0mO/1659017806680-2496288c-1963-4cfa-87b2-2868815aa1ee-031194.png)

## 5. 监听事件

可以在 Chrome Devtools 的 Console 面板中输入 `monitorEvents()` 来监听指定目标事件的信息。

该方法有两个参数，第一个参数是要监听的对象。如果未提供第二个参数，所有事件都会返回。要指定要监听的事件，传递一个字符串或字符串数组作为第二个参数。

例如，监听页面 body 上的点击事件：

![1659019104317-39770de7-ae60-4739-8989-38067819ffcd.png](./img/WqlyVFsV2FyYm0mO/1659019104317-39770de7-ae60-4739-8989-38067819ffcd-369727.png)

可以调用 `unmonitorEvents()` 方法来停止监听事件，需要传递一个停止监视对象的参数。例如，停止监听 body 对象上的事件：

![1659019223334-d61531d3-2d04-41ed-91fe-bbac5c1bfd89.png](./img/WqlyVFsV2FyYm0mO/1659019223334-d61531d3-2d04-41ed-91fe-bbac5c1bfd89-857939.png)

## 6. **检查未使用的 CSS**

可以在 Coverage 面板中检查页面中没有使用的 CSS 和 JavaScript 代码，可以通过以下步骤来打开 Coverage 面板：

![1659019750309-35ab5eb5-00a2-40e1-b637-d4a60fe8d8a5.png](./img/WqlyVFsV2FyYm0mO/1659019750309-35ab5eb5-00a2-40e1-b637-d4a60fe8d8a5-627527.png)

点击刷新按钮开始重新加载页面，以测试页面的代码覆盖率：

![1659020070424-1324e38e-ec25-418a-9415-0cc96b667ed9.png](./img/WqlyVFsV2FyYm0mO/1659020070424-1324e38e-ec25-418a-9415-0cc96b667ed9-777923.png)

检查页面的资源使用情况，点击可以查看哪些代码是没有使用的，可以通过删除那些未使用的代码来最小化 CSS 文件的大小：

![1659019839373-472977df-cbc2-4f32-a5cd-1efd18386f22.png](./img/WqlyVFsV2FyYm0mO/1659019839373-472977df-cbc2-4f32-a5cd-1efd18386f22-926483.png)

对于测试结果，可以进行筛选、过滤、下载等操作。

## 7. 引用 HTML 元素

在 Chrome DevTools 的 Elements 面板中右键点击要引用的 HTML 元素，选择 `Store as global variable` 即可将其保存为一个变量，其变量名会在 Console 面板中打印出来：

![1659020771309-743d7f5d-7cfd-490e-9976-de1e49f62354.gif](./img/WqlyVFsV2FyYm0mO/1659020771309-743d7f5d-7cfd-490e-9976-de1e49f62354-488905.gif)

## 8. 日志点

Logpoints （日志点）是一种向控制台提供调试信息的方式，而无需使用 console.log()，这在线上应用调试时会很有用。可以通过右键单击 DevTools 中的 Source 选项卡中的任何行并指定要记录的表达式来添加新的 Logpoint。执行该行时，就会在控制台中获得它的值。

![1659020998651-0bda1a14-fbdf-45dd-a7a2-adbfe730ee24.gif](./img/WqlyVFsV2FyYm0mO/1659020998651-0bda1a14-fbdf-45dd-a7a2-adbfe730ee24-533392.gif)

使用该功能可以减少调试代码，提高代码的整洁性。并且，线上应用也可以直接添加控制台输出。

## 9. 动态表达式

实时表达式是一种在表达式更改时显示其值的功能。 这有助于追踪代价高昂的表达式（如动画中使用的表达式）或变化很大的表达式（例如，如果正在遍历数组）的问题。它会将 Console 面板里的表达式置顶，并且能随着用户点击的变化，而动态刷新该置顶的表达式。

只需点击下图中眼睛图标，输入一个想要置顶的 JavaScript 表达式即可：

![1659021513378-84c97608-09dc-4b07-9db2-5452cc4bcfa7.png](./img/WqlyVFsV2FyYm0mO/1659021513378-84c97608-09dc-4b07-9db2-5452cc4bcfa7-926684.png)

![1659021564630-c9b722ad-c63e-4c72-9ad7-fec8ec3b71b0.gif](./img/WqlyVFsV2FyYm0mO/1659021564630-c9b722ad-c63e-4c72-9ad7-fec8ec3b71b0-125248.gif)

## 10. 调试动画

Chrome DevTools 提供了检查和修改动画的功能。它可以帮助我们播放动画、修改动画时间并分析特定时间范围内的视图。

![1659015627803-0c11b7a2-e72b-4887-9091-a6f5b51867d9.png](./img/WqlyVFsV2FyYm0mO/1659015627803-0c11b7a2-e72b-4887-9091-a6f5b51867d9-331329.png)\
只需在 More tools -> Animations中打开动画面板进行调试即可：

![1659015014003-d0266985-55ff-47d3-91c2-efa3bca89cd4.png](./img/WqlyVFsV2FyYm0mO/1659015014003-d0266985-55ff-47d3-91c2-efa3bca89cd4-571630.png)

Animation Inspector (动画检查器）分为四个主要部分：

* Controls (控件) ：从此处可以清除所有当前捕获的动画组，或更改当前选定动画组的速度。
* Overview (概述) ：在此处选择一个动画组以在详细窗格中检查和修改它。
* Timeline (时间轴) ：暂停并从此处开始播放动画，或跳到动画中的特定点。
* Details (详细) ：检查并修改当前选定的动画组。

![1659015440948-3e5f957d-12dd-4dd9-88ff-9485ea8ef903.png](./img/WqlyVFsV2FyYm0mO/1659015440948-3e5f957d-12dd-4dd9-88ff-9485ea8ef903-942804.png)


> 更新: 2022-07-29 19:57:48  
> 原文: <https://www.yuque.com/cuggz/feplus/cb7gy9>