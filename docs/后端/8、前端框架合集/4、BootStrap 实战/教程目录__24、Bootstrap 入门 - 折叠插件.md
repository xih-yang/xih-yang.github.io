# 24、Bootstrap 入门 - 折叠插件
- 来源：https://ddkk.com/zhuanlan/qianduan/bootstrap/1/24.html
- 分类：前端框架
- 分组：教程目录
## 1. 概述

折叠的意义是当内容需要是，则显示在界面上，而内容不需要时，就是折叠收藏起来。

Bootstrap对折叠的实现非常简单，我们本篇就来演示一番。

## 2. 通过a元素控制折叠

先看一段代码：

```java
<a type="button" class="btn btn-primary" data-toggle="collapse" href="#section1">显示春晓文字</a>
<div id="section1" class="collapse">
    春眠不觉晓，处处闻啼鸟。夜来风雨声，花落知多少。
</div>
```

解释下：

**1、** section1是折叠部分，通过设置`collapse`类使section1部分内容默认折叠不显示；

**2、** a按钮负责控制折叠，通过`data-toggle="collapse"`告知JS本按钮是折叠控制按钮，然后其href属性指向的元素即为点击按钮时切换折叠状态的元素；

所以具体效果是每次点击按钮，section1部分按钮即切换折叠/显示两个状态。

注意div部分内容可以任意嵌套，如下代码同样可以折叠：

```java
<a type="button" class="btn btn-primary" data-toggle="collapse" href="#section2">显示春晓表格</a>
   <div id="section2" class="collapse">
       <table>
           <tr>
               <td>春眠不觉晓</td>
           </tr>
           <tr>
               <td>处处闻啼鸟</td>
           </tr>
           <tr>
               <td>夜来风雨声</td>
           </tr>
           <tr>
               <td>花落知多少</td>
           </tr>
       </table>
   </div>
```

折叠与显示时对应效果分别如下：

## 3. 通过JS控制折叠

有时候，我们希望能实现通过JS代码灵活的控制折叠的时机，所以代码如下：

```java
<button type="button" class="btn btn-primary" onclick="btnShow()">显示春晓</button>
<div id="section3" class="collapse">
    春眠不觉晓，处处闻啼鸟。夜来风雨声，花落知多少。
</div>
```

```java
function btnShow() {
$("#section3").collapse("toggle");
}
```

如上面的代码，当点击按钮时，触发btnShow事件。

在事件中通过collapse方法即可切换折叠状态，注意参数toggle表示切换状态。

## 4. 小结

Bootstrap折叠插件的实现也比较简单，但是需要注意折叠样式类直接应用到段落、表格等元素时，可能会导致失效。

所以此处建议折叠部分都使用`div`元素，避免折叠失效。
