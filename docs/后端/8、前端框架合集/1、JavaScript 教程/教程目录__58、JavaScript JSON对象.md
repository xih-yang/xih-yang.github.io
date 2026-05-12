# 58、JavaScript JSON对象
- 来源：https://ddkk.com/zhuanlan/qianduan/javascript/1/58.html
- 分类：前端框架
- 分组：教程目录
json数据传输格式：字符串的一种格式

xml数据传输格式：使用标签和属性形式存储，传的数据种类和数据量多

前端传输 后端

数据结构 字符串（运输成本低，传输数据，无法传输结构） 数据结构

JSON对象：

前端方法：JSON.parse() json格式的字符串=>数据结构

JSON.stringfy() 数据结构=>json字符串

前后端交互流程：

**1、** 通过ajax获取数据；

**2、** 分析数据，转成对应的数据结构；

**3、** 处理数据；

$ajax.js :ajax函数封装

```java
function queryString(obj){
    var str=''
    for(let key in obj){
        str+=key+'='+obj[key]+'&'
    }
    return str;
}
function $ajax({
method='get',url,data,success,error}){
    if(data){
        /* 字符串转对象 */
        data=queryString(data)
    }
    /* 1.创建ajax对象 */
    /* 兼容性处理 */
    var xhr=null
    try{
        xhr=new XMLHttpRequest();
    }catch(error){
        xhr=new ActiveXObject('Microsoft.XMLHTTP')
    }
    /* 2.调用open */
    method=method.toLowerCase();
    if(method=='get'&&data){
        url+='?'+data
    }
    xhr.open(method,url,true);
    /* 3.调用send */
    if(method=='get'){
        xhr.send()
    }else{
        /*post 请求头格式 */
        xhr.setRequestHeader('content-type','application/x-www-form-urlencoded')
        xhr.send(data)
    }
    /* 4.等待请求数据响应 */
    xhr.onreadystatechange=function(){
        /* 判断响应数据是否请求完成 */
        if(xhr.readyState==4){
            if(xhr.status==200){
                /* 请求成功回调函数 */
                success(xhr.responseText)
            }else{
                /* 请求失败回调函数 */
                error(xhr.status)
            }
        }
    }
}
```

向后端请求数据：数组

向后端请求数据：对象

格式化json数据：[在线JSON校验格式化工具（Be JSON）](https://www.bejson.com/)

将结构不清晰的json结构，转成可读性好的json数据

格式化之前：

格式化之后：

注：前端获取后端数据时，只有后端利用json_encode将数据结构转换成字符串，前端才能获取到

示例：新闻列表
