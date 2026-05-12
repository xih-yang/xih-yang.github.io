# 26、JavaScript 自定义ByClassName
- 来源：https://ddkk.com/zhuanlan/qianduan/javascript/1/26.html
- 分类：前端框架
- 分组：教程目录
功能：可以解决document.getElementByClassName()不兼容问题

```java
function elementsByClassName(node,classStr){
    //1.获取node这个节点所有的子节点
    var nodes=node.getElementsByTagName('*');
    var arr=[];  //存放符合条件的节点
    for(var i=0;i<nodes.length;i++){
        if(nodes[i].className==classStr){
            arr.push(nodes[i])
        }
    }
    return arr
}
```
