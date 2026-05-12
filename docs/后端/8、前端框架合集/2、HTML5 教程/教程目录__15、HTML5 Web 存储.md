# 15、HTML5 Web 存储
- 来源：https://ddkk.com/zhuanlan/qianduan/html5/15.html
- 分类：前端框架
- 分组：教程目录
HTML5 web 存储是一个比 Cookie 更好的本地存储方式

## 什么是 HTML5 Web 存储 ?

我们可以使用 HTML5 在用于的浏览器上存储用户的浏览数据

在HTML5 之前，本地存储使用的是 Cookie

但是Web 存储需要更加的安全与快速. 这些数据不会被保存在服务器上，但是这些数据只用于用户请求网站数据上

它也可以存储大量的数据，而不影响网站的性能

数据以**键/值** 对存在, web 网页的数据只允许该网页访问使用

## 浏览器支持

Internet Explorer 8+, Firefox, Opera, Chrome, 和 Safari 支持 Web 存储

> 注意: Internet Explorer 7 及更早 IE 版本不支持 web 存储

## localStorage 和 sessionStorage

HTML5 客户端存储数据的两个对象为

**1、** localStorage-没有时间限制的数据存储；

**2、** sessionStorage-针对一个session的数据存储；

我们需要在使用 Web 存储前，检查浏览器是否支持 localStorage 和 sessionStorage

```html
if(typeof(Storage)!=="undefined")
{
    // 是的! 支持 localStorage  sessionStorage 对象
    // 一些代码.....
} else {
    // 抱歉! 不支持 web 存储
}
```

## localStorage 对象

localStorage 对象存储的数据没有时间限制

第二天、第二周或下一年之后，数据依然可用

```html
localStorage.sitename="DDKK.COM 弟弟快看，程序员编程资料站";
document.getElementById("result").innerHTML="网站名：" + localStorage.sitename;
```

localStorage 使用 key="sitename" 和 value="DDKK.COM 弟弟快看，程序员编程资料站" 创建一个 localStorage 键/值对

然后检索键值为 "sitename" 的值后将数据插入 id="result" 的元素中

### 移除

可以使用下面的方法移除 localStorage 中的 "lastname"

```html
localStorage.removeItem("lastname");
```

不管是localStorage，还是 sessionStorage，可使用的 API 都相同

常用的有如下几个

说明
localStorage
sessionStorage

保存数据
localStorage.setItem(key,value)
sessionStorage.setItem(key,value)

读取数据
localStorage.getItem(key)
sessionStorage.getItem(key)

删除单个数据
localStorage.removeItem(key)
sessionStorage.removeItem(key)

删除所有数据
localStorage.clear()
sessionStorage.clear()

得到某个索引的 key
localStorage.key(index)
sessionStorage.key(index)

> 提示: 键/值对通常以字符串存储，当然了，我们可以按自己的需要转换该格式

### 范例

下面的范例演示了用户点击按钮的次数

```html
if (localStorage.clickcount)
{
    localStorage.clickcount=Number(localStorage.clickcount)+1;
}
else
{
    localStorage.clickcount=1;
}
document.getElementById("result").innerHTML=" 你已经点击了按钮 " + localStorage.clickcount + " 次 ";
```

## sessionStorage 对象

sessionStorage 方法针对一个 session 进行数据存储

当用户关闭浏览器窗口后，数据会被删除

下面的范例演示了如何创建并访问一个 sessionStorage

```html
if (sessionStorage.clickcount)
{
    sessionStorage.clickcount=Number(sessionStorage.clickcount)+1;
}
else
{
    sessionStorage.clickcount=1;
}
document.getElementById("result").innerHTML="在这个会话中你已经点击了该按钮 " + sessionStorage.clickcount + " 次 ";
```

## Web Storage 开发一个简单的网站列表程序

接下来我们使用 Web Storage 来开发一个简单的网站列表程序，它包含以下功能

**1、** 可以输入网站名，网址，以网站名作为key存入localStorage；

**2、** 根据网站名，查找网址；

**3、** 列出当前已保存的所有网站；

下面的代码用于保存数据

```html
//保存数据  
function save(){  
    var siteurl = document.getElementById("siteurl").value;  
    var sitename = document.getElementById("sitename").value;  
    localStorage.setItem(sitename, siteurl);
    alert("添加成功");
}
```

下面的代码用于查找数据

```html
//查找数据  
function find(){  
    var search_site = document.getElementById("search_site").value;  
    var sitename = localStorage.getItem(search_site);  
    var find_result = document.getElementById("find_result");  
    find_result.innerHTML = search_site + "的网址是：" + sitename;  
}
```

完整的代码如下

```html
<div style="border: 2px dashed #ccc;width:320px;text-align:center;">     
    <label for="sitename">网站名(key)：</label>  
    <input type="text" id="sitename" name="sitename" class="text"/>  
    <br/>  
    <label for="siteurl">网 址(value)：</label>  
    <input type="text" id="siteurl" name="siteurl"/>  
    <br/>  
    <input type="button" onclick="save()" value="新增记录"/>  
    <hr/>  
    <label for="search_site">输入网站名：</label>  
    <input type="text" id="search_site" name="search_site"/>  
    <input type="button" onclick="find()" value="查找网站"/>  
    <p id="find_result"><br/></p>  
</div>
```

在浏览器上使用效果如下

这个范例知识简单的演示了下 localStorage 存储与查找，更多情况下我们存储的数据会更复杂

接下来我们使用 JSON.stringify 来存储对象数据

JSON.stringify 可以将对象转换为字符串

```html
var site = new Object;
...
var str = JSON.stringify(site); // 将对象转换为字符串
```

然后再使用 JSON.parse 方法将字符串转换为 JSON 对象

```html
var site = JSON.parse(str);
```

### save() 方法

```html
//保存数据  
function save(){  
    var site = new Object;
    site.keyname = document.getElementById("keyname").value;
    site.sitename = document.getElementById("sitename").value;  
    site.siteurl = document.getElementById("siteurl").value;
    var str = JSON.stringify(site); // 将对象转换为字符串
    localStorage.setItem(site.keyname,str);  
    alert("保存成功");
}
```

### find() 方法

```html
//查找数据  
function find(){  
    var search_site = document.getElementById("search_site").value;  
    var str = localStorage.getItem(search_site);  
    var find_result = document.getElementById("find_result");
    var site = JSON.parse(str);  
    find_result.innerHTML = search_site + "的网站名是：" + site.sitename + "，网址是：" + site.siteurl;  
}
```

完整的代码如下

```html
<div style="border: 2px dashed #ccc;width:320px;text-align:center;">
    <label for="keyname">别名(key):</label>  
    <input type="text" id="keyname" name="keyname" class="text"/>  
    <br/>  
    <label for="sitename">网站名：</label>  
    <input type="text" id="sitename" name="sitename" class="text"/>  
    <br/>  
    <label for="siteurl">网 址：</label>  
    <input type="text" id="siteurl" name="siteurl"/>  
    <br/>  
    <input type="button" onclick="save()" value="新增记录"/>  
    <hr/>  
    <label for="search_site">输入别名(key)：</label>  
    <input type="text" id="search_site" name="search_site"/>  
    <input type="button" onclick="find()" value="查找网站"/>  
    <p id="find_result"><br/></p>  
</div>
```

范例中的 loadAll 输出了所有存储的数据，我们需要确保 localStorage 存储的数据都为 JSON 格式，否则 JSON.parse(str) 将会报错

在浏览器上使用效果如下
