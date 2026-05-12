# 38 、JavaScript 事件冒泡
- 来源：https://ddkk.com/zhuanlan/qianduan/javascript/1/38.html
- 分类：前端框架
- 分组：教程目录
事件流：事件流是描述从页面接收事件的顺序，当几个都具有事件的元素层叠在一起的时候，那么你点击其中一个元素，并不是只有当前点击的元素会触发事件，而层叠在你点击范围的所有元素都会触发事件。事件流包括两种模式：冒泡和捕获

事件冒泡：现代浏览器默认情况下都是冒泡模式

上图：我只点击box3 应该只是触发box3的事件处理函数，可是box2，box也跟着触发了。这就是**由子元素冒泡形成从里到外的层级影响**，也就是事件冒泡。下图可以看到，只有点击box的时候，才不会出现冒泡。因为box没有祖先元素了。

注：这是浏览器天生的一个特点，称为事件冒泡

点击box2

点击box

阻止事件冒泡：

cancleBubble=true

stopProgapation()

阻止事件冒泡：浏览器兼容处理

```java
function stopBubble(e){
    if(e.stopPropagation){
        e.stopPropagation()
    }else{
        e.cancelBubble=true;
    }
}
```

事件捕获：点击box3，引起事件冒泡，box2，box跟着发生点击事件

事件发生顺序：box->box2->box3 (从里到外)

当事件捕获和冒泡事件同时出现时，**先捕获后冒泡**，**⭐最里的元素节点是先冒泡后捕获。**
