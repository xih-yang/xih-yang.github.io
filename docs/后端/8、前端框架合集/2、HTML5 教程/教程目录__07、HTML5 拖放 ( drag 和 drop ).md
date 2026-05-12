# 07、HTML5 拖放 ( drag 和 drop )
- 来源：https://ddkk.com/zhuanlan/qianduan/html5/7.html
- 分类：前端框架
- 分组：教程目录
拖放( drag 和 drop ）是 HTML5 标准的组成部分

你可以尝试拖动下面的图片到右边的矩形框中

## 拖放

拖放是一种常见的特性，即抓取对象以后拖到另一个位置

HTML5 中，拖放成为标准的一部分，任何元素都能够拖放

## 浏览器支持

Internet Explorer 9+, Firefox, Opera, Chrome, 和 Safari 支持拖动

> Safari 5.1.2 不支持拖动

### HTML5 拖放范例

下面的范例演示了一个简单的拖放实现

```html
<!DOCTYPE HTML>
<meta charset="utf-8"> 
<style>
#div1 {width:200px;height:113px;padding:10px;border:1px solid #aaaaaa;}
</style>
<script>
function allowDrop(ev)
{
    ev.preventDefault();
}
function drag(ev)
{
    ev.dataTransfer.setData("Text",ev.target.id);
}
function drop(ev)
{
    ev.preventDefault();
    var data=ev.dataTransfer.getData("Text");
    ev.target.appendChild(document.getElementById(data));
}
</script>
<p>拖动 图片到矩形框中</p>
<div id="div1" ondrop="drop(event)" ondragover="allowDrop(event)"></div>
<br>
<img id="drag1" src="/static/i/img1.jpg" draggable="true" ondragstart="drag(event)" width="336" height="69">
```

是不是也能简单，只要简单的三个 JavaScript 函数就可以了

## 如何实现 HTML5 拖放

**1、** 设置元素为可拖放；

首先，为了使元素可拖动，把元素的 draggable 属性设置为 true

```html
    <img draggable="true">
```

**2、** 设置拖动什么-ondragstart和setData()函数；

然后，规定当元素被拖动时，会发生什么

使用事件属性 ondragstart 调用了一个函数 drag(event) 来设置被拖动的数据

dataTransfer.setData() 方法设置被拖数据的数据类型和值

```html
function drag(ev){
    ev.dataTransfer.setData("Text",ev.target.id);
}
```

上面这个范例中，数据类型是 "Text"，值是可拖动元素的 id ("drag1")
**3、** 设置放到何处-ondragover；

事件属性 ondragover 设置用于设置在何处放置被拖动的数据

默认地，无法将数据/元素放置到其它元素中

如果需要设置允许放置，我们必须阻止对元素的默认处理方式

这要通过调用 ondragover 事件的 event.preventDefault() 方法

```html
event.preventDefault()
```

**4、** 设置放置-ondrop；

当放置被拖数据时，会发生 drop 事件

可以为事件 ondrop 设置一个调用函数来响应放置事件

上面的范例中，设置 ondrop 属性为函数 drop(event)

```html
function drop(ev){
    ev.preventDefault();
    var data=ev.dataTransfer.getData("Text");
    ev.target.appendChild(document.getElementById(data));
}
```

**1、** 调用preventDefault()来避免浏览器对数据的默认处理，哦，对了，drop事件的默认行为是以链接形式打开；

**2、** 通过dataTransfer.getData("Text")方法获得被拖的数据；

```plaintext
该方法将返回在 setData() 方法中设置为相同类型的任何数据
```

**3、** 被拖数据是被拖元素的id("drag1")；

**4、** 把被拖元素追加到放置元素（目标元素）中；

## 更多范例

**1、** 来回拖放图片；

如何在两个`` 元素之间拖放图像
