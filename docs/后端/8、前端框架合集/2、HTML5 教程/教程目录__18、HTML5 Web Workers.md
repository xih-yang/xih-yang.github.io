# 18、HTML5 Web Workers
- 来源：https://ddkk.com/zhuanlan/qianduan/html5/18.html
- 分类：前端框架
- 分组：教程目录
HTML5 Web Worker 是运行在后台的 JavaScript，不会影响页面的性能

## 什么是 Web Worker？

当在HTML 页面中执行脚本时，页面的状态是不可响应的，直到脚本已完成

WebWorker 是运行在后台的 JavaScript，独立于其它脚本，不会影响页面的性能

我们可以继续做任何愿意做的事情：点击、选取内容等等，而此时 web worker 在后台运行

## 浏览器支持

Internet Explorer 10, Firefox, Chrome, Safari 和 Opera 都支持 Web workers

## HTML5 Web Workers 范例

下面的范例创建了一个简单的 web worker，用于在后台计数

计数:

开始Worker 停止 Worker

#### demo_workers.js 文件代码

```html
var i=0;
function timedCount(){
  i=i+1;
  postMessage(i);
  setTimeout("timedCount()",500);
}
timedCount();
```

## 检测浏览器是否支持 Web Worker

在创建web worker 之前，我们需要检测用户的浏览器是否支持

```html
if(typeof(Worker)!=="undefined"){
  // 是的! Web worker 支持!
  // *一些代码.....* 
}else{
  //抱歉! Web Worker 不支持
}
```

## 创建 web worker 文件

现在，让我们在一个外部 JavaScript 中创建我们的 web worker

我们来创建一个计数脚本

该脚本存储于 "demo_workers.js" 文件中

```html
var i=0;
function timedCount(){
  i=i+1;
  postMessage(i);
  setTimeout("timedCount()",500);
}
timedCount();
```

这个文件中最重要的部分是 postMessage() 方法，它用于向 HTML 页面传回一段消息

> 注意: web worker 通常不用于如此简单的脚本，而是用于更耗费 CPU 资源的任务

## 创建 Web Worker 对象

既然我们已经有了 web worker 文件，那么我们现在需要从 HTML 页面调用它

下面的代码检测是否存在 worker，如果不存在，- 它会创建一个新的 web worker 对象，然后运行 "demo_workers.js" 中的代码

```html
if(typeof(w)=="undefined"){
  w=new Worker("demo_workers.js");
}
```

然后我们就可以从 web worker 发生和接收消息了

向web worker 添加一个 "onmessage" 事件监听器

```html
w.onmessage=function(event){
  document.getElementById("result").innerHTML=event.data;
};
```

## 终止 Web Worker

当我们创建 web worker 对象后，它会继续监听消息（即使在外部脚本完成之后）直到其被终止为止

如果要终止 web worker，并释放浏览器/计算机资源，需要使用 terminate() 方法

```html
w.terminate();
```

## 完整的 Web Worker 范例代码

现在，我们把所有的代码组合在一起

```html
<!DOCTYPE html>
<meta charset="utf-8"> 
<p>计数： <output id="result"></output></p>
<button onclick="startWorker()">开始工作</button> 
<button onclick="stopWorker()">停止工作</button>
<p><strong>注意：</strong> Internet Explorer 9 及更早 IE 版本浏览器不支持 Web Workers</p>
<script>
var w;
function startWorker()
{
  if(typeof(Worker)!=="undefined")
  {
    if(typeof(w)=="undefined")
    {
      w=new Worker("/static/media/html/demo_workers.js");
    }
    w.onmessage = function(event){
      document.getElementById("result").innerHTML=event.data;
    };
  }else{
    document.getElementById("result").innerHTML="抱歉，你的浏览器不支持 Web Workers...";
  }
}
function stopWorker(){
  w.terminate();
  w=undefined;
}
</script>
```

## Web Workers 和 DOM

由于web worker 位于外部文件中，它们无法访问下列 JavaScript 对象

**1、** window对象；

**2、** document对象；

**3、** parent对象；
