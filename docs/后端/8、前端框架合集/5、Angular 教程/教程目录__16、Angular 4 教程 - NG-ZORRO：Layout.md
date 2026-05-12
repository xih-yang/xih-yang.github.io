# 16、Angular 4 教程 - NG-ZORRO：Layout
- 来源：https://ddkk.com/zhuanlan/qianduan/angular/1/16.html
- 分类：前端框架
- 分组：教程目录
这篇文章介绍一下如何使用NG-ZORRO的layout相关的组件。

## layout

### 概述

组件
说明
限制

[nz-layout]
nz-layout布局容器
其下可嵌套 nz-header nz-sider nz-content nz-footer或 nz-layout本身，可以放在任何父容器中。

[nz-header]
nz-header顶部布局
自带默认样式，其下可嵌套任何元素，只能放在 nz-layout中。

[nz-sider]
nz-sider侧边栏
自带默认样式及基本功能，其下可嵌套任何元素，只能放在 nz-layout中。

[nz-content]
nz-content内容部分
自带默认样式，其下可嵌套任何元素，只能放在 nz-layout中。

[nz-footter]
nz-footer底部布局
自带默认样式，其下可嵌套任何元素，只能放在 nz-layout中。

### nz-sider

参数
说明
类型
默认值

nzCollapsible
是否可收起，当添加该属性时变为可收起
attribute
-

nzCollapsed
当前收起状态，可双向绑定
Boolean
-

nzCollapseChange
展开-收起时的回调函数
Func
-

nzTrigger
自定义 trigger，设置为 null 时隐藏 trigger

-

nzWidth
宽度
Number
200

nzCollapsedWidth 收
缩宽度，设置为 0 会出现特殊 trigger
Number
64

nzBreakpoint
触发响应式布局的断点
‘xs’, ‘sm’, ‘md’, ‘lg’, ‘xl’
-

## 例子

### CSS

```java
[root@mail app]# cat app.component.css 
.nz-sample {
  font-size:30px;
}
[root@mail app]# 
```

### HTML

```java
[root@mail app]# cat app.component.html 
<h1> Layout 1 </h1>
<nz-layout>
  <nz-header  style="text-align:center"><div class="nz-sample"> header</div> </nz-header>
  <nz-content style="text-align:center"><div class="nz-sample"> content</div> </nz-content>
  <nz-footer  style="text-align:center"><div class="nz-sample"> footer</div> </nz-footer>
</nz-layout>
<h1> Layout 2 </h1>
<nz-layout>
  <nz-header  style="text-align:center"><div class="nz-sample"> header</div> </nz-header>
  <nz-layout>
    <nz-sider   style="background:#CFCFCF;text-align:center"><div class="nz-sample"> sider </div> </nz-sider>
    <nz-content style="text-align:center"><div class="nz-sample"> content</div> </nz-content>
  </nz-layout>
  <nz-footer  style="text-align:center"><div class="nz-sample"> footer</div> </nz-footer>
</nz-layout>
<h1> Layout 3 </h1>
<nz-layout>
  <nz-header  style="text-align:center"><div class="nz-sample"> header</div> </nz-header>
  <nz-layout>
    <nz-content style="text-align:center"><div class="nz-sample"> content</div> </nz-content>
    <nz-sider   style="background:#CFCFCF;text-align:center"><div class="nz-sample"> sider </div> </nz-sider>
  </nz-layout>
  <nz-footer  style="text-align:center"><div class="nz-sample"> footer</div> </nz-footer>
</nz-layout>
<h1> Layout 4 </h1>
<nz-layout>
  <nz-sider   style="background:#CFCFCF;text-align:center"><div class="nz-sample"> sider </div> </nz-sider>
  <nz-layout>
    <nz-header  style="text-align:center"><div class="nz-sample"> header</div> </nz-header>
    <nz-content style="text-align:center"><div class="nz-sample"> content</div> </nz-content>
    <nz-footer  style="text-align:center"><div class="nz-sample"> footer</div> </nz-footer>
  </nz-layout>
</nz-layout>
[root@mail app]#
```

## 结果确认
