# 31、Angular 4 教程 - 统计图表G2
- 来源：https://ddkk.com/zhuanlan/qianduan/angular/1/31.html
- 分类：前端框架
- 分组：教程目录
G2是蚂蚁金服下的一款开源可视化的前端组件库，使用G2可以很简单地根据数据创建出统计图表，这篇文章中会使用简单的例子来创建一个柱状图，用于显示某一星期七天不断出现的bug数目。

## 安装g2

从版本3开始，data-set进行了分离，简单的方式可以不直接使用data-set，可以不必安装@antv/data-set，这篇文章便没有安装data-set

```java
liumiaocn:ng6demo liumiao$ npm install @antv/g2 --save
npm WARN ajv-keywords@3.2.0 requires a peer of ajv@^6.0.0 but none is installed. You must install peer dependencies yourself.
+ @antv/g2@3.2.6
added 38 packages in 10.817s
lium
```

> 安装data-set： npm install @antv/data-set –save

## 引入方式

npminstall之后，在angular中可以使用如下方式引入G2

```java
import G2 from '@antv/g2/build/g2';
```

## 使用方式

画出一个柱状图的代码如下：

```java
  drawBarChart() {
    const data = [
      { weekday: 'Mon', bugnum: 100 },
      { weekday: 'Tue', bugnum: 120 },
      { weekday: 'Wed', bugnum: 130 },
      { weekday: 'Thu', bugnum: 160 },
      { weekday: 'Fri', bugnum: 150 },
      { weekday: 'Sat', bugnum: 190 },
      { weekday: 'Sun', bugnum: 210 }
    ];
    const chart = new G2.Chart({
      container: 'g2_c1',
      width : 900,
      height : 500
    });
    chart.source(data);
    chart.interval().position('weekday*bugnum').color('weekday');
    chart.render();
  }
```

> 代码说明:
>
> 从代码中可以看出x轴设定为weekday，y轴为bugnum。数据可以通过一个json格式的数组来提供，而为了显示则需要创建一个指定长宽的container，这个容器的名称非常重要，在页面上会直接使用此id进行关联。
>
> 另外，与数据的关联通过source函数
>
> 图形的渲染和显示通过render函数来实现

## html页面

html中只需要添加一个div，通过id与ts文件中创建和render的图形进行关联。

```java
<div id="g2_c1"></div>
```

## 显示结果

## 关闭反馈

由于此组件缺省会光明正大地收集统计信息：向[https://kcart.alipay.com/web/bi.do](https://kcart.alipay.com/web/bi.do)发送诸如如下信息，其实也就是用户在使用哪个版本的信息而已。

```java
{"pg":"http://localhost:4200/layout/g2","r":1533521582661,"g2":true,"version":"3.2.6","page_type":"syslog"}
```

如果不希望从自己的应用程序出现奇怪的信息发送，可以用G2.track(false)进行关闭：

```java
  ngOnInit() {
    if (typeof G2 !== 'undefined') {
      G2.track(false);
    }
    this.drawBarChart();
  }
```
