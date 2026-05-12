# 32、Angular 4 教程 - 移动端统计图表F2
- 来源：https://ddkk.com/zhuanlan/qianduan/angular/1/32.html
- 分类：前端框架
- 分组：教程目录
F2应该就是Fast & Flexible的缩写，从名称上就能看出其所关注的场景。F2也是蚂蚁金服下的一款开源可视化的前端组件库，使用F2可以很简单地根据数据创建出统计图表，F2源于早期的G2-Mobile，所以它是针对于移动端的。移动端有很多需要考虑的因素，比如：性能/大小/扩展性等。这篇文章中会使用简单的例子来创建一个柱状图，用于显示某一星期七天不断出现的bug数目。

## 安装f2

```java
liumiaocn:ng6demo liumiao$ ls
README.md         e2e               package-lock.json src               tslint.json       yarn.lock
angular.json      node_modules      package.json      tsconfig.json     yarn-error.log
liumiaocn:ng6demo liumiao$ npm install @antv/f2 --save
npm WARN ajv-keywords@3.2.0 requires a peer of ajv@^6.0.0 but none is installed. You must install peer dependencies yourself.
+ @antv/f2@3.1.17
added 2 packages in 13.771s
liumiaocn:ng6demo liumiao$ 
```

## 引入方式

npminstall之后，在angular中可以使用如下方式引入F2

```java
import F2 from '@antv/f2/build/f2';
```

## 创建f2用于demo的组件

```java
liumiaocn:content-module liumiao$ ls
content-module.module.spec.ts content-module.module.ts      g2-demo
liumiaocn:content-module liumiao$ ng generate component f2-demo
CREATE src/app/default-layout/content-module/f2-demo/f2-demo.component.css (0 bytes)
CREATE src/app/default-layout/content-module/f2-demo/f2-demo.component.html (26 bytes)
CREATE src/app/default-layout/content-module/f2-demo/f2-demo.component.spec.ts (629 bytes)
CREATE src/app/default-layout/content-module/f2-demo/f2-demo.component.ts (272 bytes)
UPDATE src/app/default-layout/content-module/content-module.module.ts (545 bytes)
liumiaocn:content-module liumiao$ 
```

## 设定路由

在layout下添加路由

```java
    path: 'layout',
    component: DefaultLayoutComponent,
    children: [
      {
        path: 'g2',
        component: G2DemoComponent
      },
      {
        path: 'f2',
        component: F2DemoComponent
      },
    ]
```

在菜单中添加routerlink

```java
<li nz-menu-item><a routerLink="/layout/f2" routerLinkActive="active">F2</a></li>
```

## 使用方式

画出一个柱状图的代码如下：

```java
  drawBarChart() {
    F2.track(false);
    const data = [
      { weekday: 'Mon', bugnum: 100 },
      { weekday: 'Tue', bugnum: 120 },
      { weekday: 'Wed', bugnum: 130 },
      { weekday: 'Thu', bugnum: 160 },
      { weekday: 'Fri', bugnum: 150 },
      { weekday: 'Sat', bugnum: 190 },
      { weekday: 'Sun', bugnum: 210 }
    ];
    const chart = new F2.Chart({
      id: 'f2_c1',
      pixelRatio: window.devicePixelRatio // 指定分辨率
    });
    chart.source(data);
    chart.interval().position('weekday*bugnum').color('weekday');
    chart.render();
  }
```

> 代码说明:
>
> 从代码中可以看出x轴设定为weekday，y轴为bugnum。数据可以通过一个json格式的数组来提供，而为了显示则需要创建一个指定分辨率的id，这个id的名称非常重要，在页面上会直接使用此id进行关联，与G2使用不同的地方在于G2在此处直接指定了长宽，而F2在页面的canvas中进行的设定
>
> 另外，与数据的关联通过source函数
>
> 图形的渲染和显示通过render函数来实现

## html页面

html中只需要添加一个canvas，通过id与ts文件中创建和render的图形进行关联。

```java
<canvas id="f2_c1" width="900" height="500"></canvas>
```

## 显示结果

## 关闭反馈

关闭反馈可以使用F2.track(false)进行。
