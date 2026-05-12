# 06、Bootstrap 入门 - 使用面板
- 来源：https://ddkk.com/zhuanlan/qianduan/bootstrap/1/6.html
- 分类：前端框架
- 分组：教程目录
## 1. 概述

Bootstrap的面板是使用较多的元素，通常可以包含标题、内容、脚注信息。

使用的场景非常广泛，例如使用面板来展示一则新闻的信息，标题部分可以显示新闻的标题，内容部分可以显示新闻的导语，而脚注部分可以显示新闻的发布时间。

## 2. 基本用法

一个完整的面板代码如下：

```java
<div class="panel panel-default">
    <div class="panel-heading">
        标题部分
    </div>
    <div class="panel-body">
        内容部分
    </div>
    <div class="panel-footer">
        脚注部分
    </div>
</div>
```

对应效果如下：

注意面板也可只显示标题或者内容或者脚注部分。

## 3. 面板的不同样式

面板还有一些不同的样式类：

- .panel-default
- .panel-primary
- .panel-success
- .panel-info
- .panel-warning
- .panel-danger

例如我们采用`.panel-primary`时：

```java
<div class="panel panel-primary">
   <div class="panel-heading">
       标题部分
   </div>
   <div class="panel-body">
       内容部分
   </div>
   <div class="panel-footer">
       脚注部分
   </div>
</div>
```

效果如下：

可见标题栏与边框颜色发生变化，而内容部分和脚注部分样式未变。

## 4. 小结

面板是Bootstrap中较为常用的组件，使用起来比较灵活，也可以根据情况选用不同样式的面板。
