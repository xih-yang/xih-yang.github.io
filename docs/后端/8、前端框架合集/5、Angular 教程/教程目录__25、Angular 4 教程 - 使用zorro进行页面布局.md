# 25、Angular 4 教程 - 使用zorro进行页面布局
- 来源：https://ddkk.com/zhuanlan/qianduan/angular/1/25.html
- 分类：前端框架
- 分组：教程目录
这篇文章介绍一下Angular应用的页面布局方式，这里直接使用ng-zorro-antd的页面布局方式进行举例。

## zorro的页面布局

简单的来说，zorro的layout有如下几种组件

类型
说明

nz-layout
布局容器，与其他layout组件结合使用

nz-header
顶部布局部分，与nz-layout结合使用

nz-sider
侧边栏，与nz-layout结合使用

nz-content
内容布局，与nz-layout结合使用

nz-footer
底部布局，与nz-layout结合使用

同时，zorro也支持grid方式，将页面进行24栅格进行划分

## Default Layout

创建Default Layout的组件

```java
liumiaocn:app liumiao$ ng generate component default-layout
CREATE src/app/default-layout/default-layout.component.css (0 bytes)
CREATE src/app/default-layout/default-layout.component.html (33 bytes)
CREATE src/app/default-layout/default-layout.component.spec.ts (678 bytes)
CREATE src/app/default-layout/default-layout.component.ts (300 bytes)
UPDATE src/app/app.module.ts (928 bytes)
liumiaocn:app liumiao$ 
```

## html页面

```java
liumiaocn:default-layout liumiao$ cat default-layout.component.html 
<nz-layout>
  <nz-header>Layout Header</nz-header>
  <nz-layout>
    <nz-sider>Layout Sider</nz-sider>
    <nz-layout>
      <nz-content>
    <div class="content-box">
      <div nz-row nzGutter="16">
        <div nz-col class="gutter-row" nzSpan="8">
          <div class="gutter-box">col-8</div>
        </div>
        <div nz-col class="gutter-row" nzSpan="8">
          <div class="gutter-box">col-8</div>
        </div>
        <div nz-col class="gutter-row" nzSpan="8">
          <div class="gutter-box">col-8</div>
        </div>
      </div>
    </div>
      </nz-content>
      <nz-footer>Layout Fotter</nz-footer>
    </nz-layout>
  </nz-layout>
</nz-layout>
liumiaocn:default-layout liumiao$ 
```

## css

```java
liumiaocn:default-layout liumiao$ cat default-layout.component.css
.ant-layout {
  text-align: center;
}
.ant-layout-header {
  background:11aa88;
}
.ant-layout-sider {
  background:ebebeb;
}
.ant-layout-content {
  background:fff;
  line-height: 120px;
  color:0;
  margin-left: 10px;
}
.ant-layout-footer {
  background:ebebeb;
  margin-top: 10px;
  margin-left: 10px;
}
.gutter-box {
  height: 400px;
  background:ebebeb;
  margin: 1px;
}
liumiaocn:default-layout liumiao$
```

## 显示

将app.component.html进行设定，就可以确认显示内容了

```java
liumiaocn:app liumiao$ cat app.component.html 
<app-default-layout></app-default-layout>
liumiaocn:app liumiao$
```

使用grid和layout进行结合，基本上就能作出大部分所需要的实际页面布局。

## 参考文献

[http://ng.ant.design/components/grid/zh](http://ng.ant.design/components/grid/zh)

[http://ng.ant.design/components/layout/zh](http://ng.ant.design/components/layout/zh)
