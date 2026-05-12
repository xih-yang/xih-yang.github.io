# 57、JavaScript AJAX
- 来源：https://ddkk.com/zhuanlan/qianduan/javascript/1/57.html
- 分类：前端框架
- 分组：教程目录
节省用户操作，事件，提高用户体验。减少数据请求，传输获取数据

ajax：异步的javascript和数据传输（传输格式：xml、json）

使用Ajax 使用ajax获取某一文件的内容

Ajax过程详解 创建对象**XMLHttpRequest（） ActiveXObject（‘Microsoft.XMLHTTP）**

xml:数据传输格式（大型门户网站：新浪、网易、凤凰网）

优点：标签名和行间属性由用户自定义，种类丰富；传输量非常大

缺点：解析麻烦；不太适合轻量级数据

json数据传输格式（字符串）：（95%移动端应用）

优点：1.轻量级数据 2.解析轻松

缺点：传输数量比较小；传输种类比较少

JSON.parse():字符串转成对象 JSON.stringfy() 对象转成字符串 。

### 异步与同步：

注：任何一个程序由很多个小程序组成的。每一个小程序都有不同的运行状态。

同步与异步用来描述一个程序运行的状态。

同步：阻塞，等待前一个程序运行完毕，在执行下一个程序

异步：非阻塞，当前程序运行和前面的程序是否运行完毕没有关系。

ajax：前后端数据交互的搬运工，都可以异步执行。

注：ajax请求服务，需要运行在服务器上，让文件暴露，其他用户可以访问本地磁盘文件

传输数据过程：

**1、** 创建ajax对象=>在浏览器打开新窗口；

**2、** 调用open=>在地址栏输入路径；

**3、** 调用send=>回车跳转；

**4、** 等待数据响应=>等待页面加载完成；

创建ajax对象：

XMLHttpRequest IE8以下不兼容。

ActiveXObject(‘Microsoft.XMLHTTP’) IE8以下

```java
/* 1.创建ajax对象 */
/* 方式一 */
// var xhr=null;
// if(window.XMLHttpRequest){
// 	xhr=new XMLHttpRequest;
// }else{
// 	xhr=new ActiveXObject('Microsoft.XMLHTTP')
// }
/* 方式二 */
// var xhr=window.XMLHttpRequest?new XMLHttpRequest:new ActiveXObject('Microsoft.XMLHTTP')
/* 方式三 */
var xhr=null;
try{
    xhr=new XMLHttpRequest();
}catch(error){
    xhr=new ActiveXObject('Microsoft.XMLHTTP')
```

#### try_catch:

```java
try{
​	尝试执行的代码
}catch（error）{
error  错误对象，try括号中代码执行的异常信息；
补救代码；
}
```

执行过程：

**1、** 先去执行try中的代码；

**2、** 如果try中的代码执行正常，catch中的代码就不执行了；

**3、** 如果try中的代码执行异常，直接catch中的代码；

注：如果try中出现错误代码，不会在执行try中的后续代码，而是直接执行catch内的代码。

##### 与if…else区别：

if…lese：不能判断是写在if…else的代码错误；程序中断

try…catch：查看该段程序是否执行异常；提示错误信息，执行补救代码。

作用：代码调试和后期维护。

升级版：try_throw_catch

```java
try{
​	尝试执行的代码
​	throw new Error（'异常信息文本'）
}catch（error）{
error  错误对象，throw括号中代码执行的异常信息文本；
}
```

作用：分段判断try中哪段代码出现错误，起到一个截断效果。加入try中的throw之前的代码正常运行，那么错误不在这段代码中，将throw代码往后挪动，就可以找代码错误出处。

**open（）方法**

```java
/* 第一个参数：请求方式  第二参数 请求地址  第三个参数：异步（true）、同步（false） */
```

#### 表单的get、post方法

GET：

案例：

提交方式：直接将数据拼接在url进行提交，通过？进行拼接（?username=122333&age=&password=122333），？后面称为查询字符串（username=122333&age=&password=122333）

好处：简单

缺点：不安全；地址栏数据有上限最多只能2kb，没法实现大数据上传。

POST：

enctype：提交数据格式的请求头，默认application/x-www-form-urlencoded

提交方式：浏览器内部进行提交

好处：安全，提交数量理论没有上限（但是存在一定的空间限制：网速、浏览器服务器空间大小）

缺点：提交比较复杂。

#### ajax的get和post：

get：

数据传输在url后面拼接

```java
xhr.open('GET','GET_POST/get.php?username=dog&password=123456&age=18' ,'true')
```

post：

```java
xhr.open('POST','GET_POST/post.php' ,'true')
/* 3.调用send 发送请求*/
/* 设置post请求头的格式 */
xhr.setRequestHeader('content-type','application/x-www-form-urlencoded')
xhr.send('username=dog&password=123456&age=18')
```

在send方法之前设置请求头的格式。

数据传输在send方法以传参的方式进行传输。

#### onreadystatechange事件 ：请求状态监控

readystatechange 事件类型

readyState属性：请求状态， 发生变化的时候调用

0：调用open方法之前 （初始化）

1：已调用send方法，正在发送数据 （载入）

2：send（）方法已完成，已收到全部响应内容（载入完成）

3：正在解析响应内容 （正在解析响应内容）

4：响应内容解析完成，可以在客户端调用了（完成）

status属性：服务器（请求资源）的状态 HTTP状态码

1**：请求收到，继续处理

2**：操作成功收到，分析、接受

3**：完成此请求必须进一步处理

4**：请求包含一个错误语法或不能完成

5**：服务器执行一个完全有效请求失败

100–客户必须继续发出请求

101–客户要求服务根据请求转换HTTP协议版本

200–交易成功

201–提示直到新文件的URL

202–接受和处理、但处理未完成

203–返回信息不确定或不完整

204–请求受到，但返回信息为空

205–服务器完成请求，用户代理必须复为当前已经浏览过的文件

206–服务器已经完成了部分用户的GET请求

300–请求额资源可在多处得到

301–删除请求数据

302–在其他地址发现请求数据

303–建议客户访问其他URL或访问方式

304–客户端已经执行GET，但文件未变化

305–请求的资源必须从服务器指定的地址得到

306–前一版本的HTTP中使用的代码，现行版本中不再使用

307–申明请求的资源临时性删除

400–错误请求，语法错误

401–请求授权失败

402–保留有效ChargeTo头响应

403–请求不允许

404–没有发现文件、查询或URL

405–用户在Request-line字段定义的方法不允许

406–根据用户发送的Accept，请求资源不可访问

408–客户端没有在用户指定的时间内完成请求

409–对当前资源状态，请求不能完成。

410–服务器不再有此资源且无法进一步的参考地址

411–服务器拒绝用户顶的Content-Length属性请求

412–一个或多个请求头字段在当前请求中错误

413–请求的资源大于服务器允许的大小

414–请求的资源URL长于服务器允许的长度

415–请求资源不支持请求项目的格式

416–请求包含Range氢气头字段，在当前资源范围内没有range指示值，请求也不包含If-Range请求头字段

417–服务器不满足请求Expect头字段指定的期望值，如果是代理服务器，可能时下以及服务器不能满足请求

500–服务器产生内部错误

501–服务器不支持请求的函数

502–服务器暂时不可用，又是为了防止发生系统过载

503–服务器过载或暂停维修

504–关口过载，服务器使用另一个关口来响应用户，等待事件设定值较长

505–服务器不支持或拒绝请求投中的指定HTTP版本

注：不管请求数据是否成功和失败，都会有响应值。

返回内容：

responseText：返回以文本形式存放的内容

responseXML：返回XML形式的内容

#### ajax函数封装：

```java
function ajax_package({
     method='get',url,data}) {
	/* 1.创建ajax对象 */
	var xhr = null;
	try {
		xhr = new XMLHttpRequest();
	} catch (error) {
		xhr = new ActiveXObject('Microsoft.XMLHTTP')
	}
	if(method.toLowerCase()=='get'&&data){
		url+='?'+data;
	}
	//2.调用open
	xhr.open(method, url, 'true')
	//3.调用send，发送数据
	if(method.toLowerCase()==='get'){
		xhr.send()
	}else {
		xhr.setRequestHeader('content-type','application/x-www-form-urlencoded');
		xhr.send(data)
	}
	/* 4.等待数据响应 */
	xhr.onreadystatechange = function() {
		console.log(xhr.readyState)
		/* 响应内容是否解析完成 */
		if (xhr.readyState == 4) {
			/* 判断数据请求是否成功 */
			if (xhr.status == 200) {
				console.log('请求成功：', xhr.responseText)
			} else {
				console.log('请求失败：', xhr.status)
			}
		}
	}
}
```

示例：

但是上述方式封装有个小bug

bug1:如果用户传输数据时都是以字符串形式传入的话，那么就会

比较麻烦，而且可读性差。所以我们要将在调用ajax封装函数时**传入数据的形式从字符串转成对象形式，然后再在封装函数内部将对象转成字符串**。

优化：

```java
function queryString(obj){
	let str=''
	for(let attr in obj){
		str+=attr+'='+obj[attr]+'&'
	}
	let newstr=str.substr(0,str.length-1)
	return newstr
}
function ajax_package({
     method='get',url,dataobj}) {
	var data=''
	/* 对象转字符串 */
	if(dataobj){
		var data=queryString(dataobj)
	}
	/* 1.创建ajax对象 */
	var xhr = null;
	try {
		xhr = new XMLHttpRequest();
	} catch (error) {
		xhr = new ActiveXObject('Microsoft.XMLHTTP')
	}
	if(method.toLowerCase()=='get'&&data){
		url+='?'+data;
	}
	xhr.open(method, url, 'true')
	if(method.toLowerCase()==='get'){
		xhr.send()
	}else {
		xhr.setRequestHeader('content-type','application/x-www-form-urlencoded');
		xhr.send(data)
	}
	/* 4.等待数据响应 */
	xhr.onreadystatechange = function() {
		/* 响应内容是否解析完成 */
		if (xhr.readyState == 4) {
			/* 判断数据请求是否成功 */
			if (xhr.status == 200) {
				console.log('请求成功：', xhr.responseText)
			} else {
				console.log('请求失败：', xhr.status)
			}
		}
	}
}
```

bug2:请求成功之后的数据处理不能永远是只输出数据。对于不同的请求，我们可能希望对数据处理的方式不同，此时我们可以传入**回调函数**方式进行对不同数据进行不同处理方式。

最终版：

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
