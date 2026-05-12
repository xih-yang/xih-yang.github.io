# 23、Bootstrap 入门 - 标签页
- 来源：https://ddkk.com/zhuanlan/qianduan/bootstrap/1/23.html
- 分类：前端框架
- 分组：教程目录
## 1. 概述

标签页使用频率不算高，也不算太低，主要用于同一显示区域内切换不同的内容。本篇来简单讲一下如何使用标签页。

## 2. 使用方法

首先我们先来看一个标准的标签页代码：

```java
<ul class="nav nav-tabs">
    <li><a href="#section1" data-toggle="tab">春晓</a></li>
    <li><a href="#section2" data-toggle="tab">悯农</a></li>
</ul>
<div class="tab-content">
    <div class="tab-pane active" id="section1">
        春眠不觉晓 处处闻啼鸟 夜来风雨声 花落知多少
    </div>
    <div class="tab-pane" id="section2">
        锄禾日当午 汗滴禾下土 谁知盘中餐 粒粒皆辛苦
    </div>
</div>
```

对应效果如下：

接下来我们来具体讲解下，上面代码时如何描述出一个标签页的。

**1、**`navnav-tabs`类修饰ul元素，使ul元素表现出标签的样式；

**2、** 为li元素添加`data-toggle="tab"`类，是为了JS语言能识别标签选项，所以在点击选项时会触发JS事件；

3. href="#section1"是点击标签是，显示的对应元素的id。
**4、**`tab-content`修饰的div元素，表示标签页的内容部分；

**5、**`tab-paneactive`，其中tab-pan表示具体的一个标签页内容，而active表示当前被`显示的标签页；

**6、**`id="section1"`对应a标签指向的id；

## 3. 小结

标签页的语法相对固定，实际上理解了每个属性的意义，再看标签页的语法就很顺溜了。
