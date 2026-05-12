# 63、JavaScript 本地存储技术cookie （会话跟踪技术）
- 来源：https://ddkk.com/zhuanlan/qianduan/javascript/1/63.html
- 分类：前端框架
- 分组：教程目录
### 什么会叫会话跟踪技术？

在一次会话从开始到结束的整个过程，全程跟踪记录客户端的状态（例如：是否登录，购物车信息、是否已下载、是否已点赞、视频播放进度等等）

你把cookie就当成第一次跟服务器连接后，服务器发给你的身份牌，上面旧纪录跟你相关的信息 以后只要在跟服务器通信，必须带着这个身份牌，这样一来，关于你是谁？是否登录过购物车里有什么信息？服务器当然就很容易知道了。

### cookie与localStorage以及sessionStorage区别

localStorage（客户端微型数据库）：

**1、** 永久存储；2.最大存储5M3.只能去存储字符串和数字，如果存储内容多的话会消耗内存空间，导致页面变卡4.localStorage不能被爬虫抓取到5.在浏览器的隐私模式下面是不可读取的；

cookie

**1、** 可以设置过期时间；

**2、** 最大可以存储4KB；

**3、** 每一个域名下面可以存储50条数据（如果已经4kb，可能不到50条，但是也不可以继续存储）；

sessionStorage（结合后台使用）

**1、** 存储容量小2.只能存储一次会话（窗口打开和关闭）；

### cookie原理

### cookie组成

cookie 由名/值形式的文本组成：name=value（name、value都是自定义的）。完整格式为：

name=value；[expires=date];[path=path];[domain=somewhere.com];[secure],中括号是可选的，name=value是必选的,使用时,记得将中括号去掉.

注：cookie只能存储字符串（如果非要存储对象，可以使用json）

### cookie语法

cookie设置：document.cookie=‘name=value’

cookie查看：

谷歌浏览器：控制台->application->cookie->找到当前的连接，并点击

火狐浏览器：查看元素->存储->cookie->找到当前的连接，并点击

注:火狐支持本地加载的文件缓存cookie,谷歌只支持服务器加载的文件缓存cookie

cookie获取

cookie中的中文

为了保证在存储cookie和读取cookie的过程中,防止中文乱码.一般情况下,将中文编码存储,读取的时候在解码读取。

```java
document.cookie='name='+encodeURIComponent('value')//编码写入
decodeURIComponent(document.cookie)//解码读取
```

cookie中的可选项

**expires:过期时间,必须填写日期对象**

封装返回n天后日期的函数

设置过期时间:记得使用分号隔开

如果不设置过期时间,默认过期时间是session(会话)

一个会话时间是:将整个浏览器打开到关闭,表示这次会话结束

注:是整个浏览器,而不是将页面关闭,将页面关闭的话,会话还是存在的

关闭前

关闭后重启浏览器

对比设置过期时间和没有设置过期时间.浏览器打开关闭效果

关闭前

重新打开

注:系统会自动清除过期时间

点击之前,过期时间是一天后,

点击之后,过期时间设置在一天前,记录自动自动删除(刷新之后清除)

快速获取过去时间

newDate(0) //1970年(传入毫秒数)

**path:限制访问路径**

默认是当前加载html路径

注:我们设置的cookie的路径和加载当前文件的路径必须一致,如果不一致cookie访问失败.

只有更改的路径下,有同样的html文件,才能够访问到

domain 限制访问域名

默认:默认是加载当前.html文件的服务器域名/ip

注:我们设置的cookie的域名和加载当前文件的域名必须一致,如果不一致cookie访问失败.

secure

默认:空

如果不设置,设置cookie可以通过http协议加载文件设置,也可以通过https协议加载文件设置.

注:设置这个字段之后,只能设置https协议加载cookie,否则访问不到. https协议要专门去申请证书,还要去公安局备案。

### cookie函数封装

初步：

```java
// setCookie  设置cookie
			function setCookie({
     name,value,expires='',path='',domin='',secure=''}){
				function  afterday(expires){
					let d=new Date();
					let day=d.getDate()
					d.setDate(day+expires)
					return d
				} //返回对相应天数的日期对象
				expires=afterday(expires);
				document.cookie=encodeURIComponent(name)+'='+encodeURIComponent(value)+';expires='+expires+';'+';path='+path+';domain='+domin+secure  
			}
//getCookie   通过键值获取值
			function getCookie(name){
				name=name+'='   //避免出现username 和username2获取同一个下标
				let str=decodeURIComponent(document.cookie) 
				if(str.indexOf(name)){
					let index=str.indexOf(name);  //获取下标
					let index2=str.indexOf(';',index);  //获取该字段默认结束
					if(index2>0){
						return str.slice(index+name.length,index2)  //截取对应的字段
					}else{
						return str.slice(index+name.length,str.length)
					}
				}
			}
//removecookie  删除cookie
			function removeCookie(name){
				document.cookie=encodeURIComponent(name)+'=;expires='+(new Date(0))
			}
			removeCookie('username2')
```

在使用一个函数去合并上述三种操作,通过传入参数的数量识别

设置cookie $cookie(name,value) $cookie(name,value,{expires,path,domin,secure})

获取cookie $cookie(name)

删除cookie $cookie(name,null)

因此,我们需要改动一下我们设置cookie

```java
// setCookie  设置cookie
function setCookie(name,value,{
expires='',path='',domin='',secure=''}){
    function  afterday(expires){
        let d=new Date();
        let day=d.getDate()
        d.setDate(day+expires)
        return d
    } //返回对相应天数的日期对象
    expires=afterday(expires);
    document.cookie=encodeURIComponent(name)+'='+encodeURIComponent(value)+';expires='+expires+';'+';path='+path+';domain='+domin+secure  
}
```

完整版

```java
function $cookie(name, value,{
expires = '',path = '',domin = '',secure = ''}='') {
        if (name && value) {
            function setCookie(name, value, {
expires = '',path = '',domin = '',secure = ''}) {
                function afterday(expires) {
                    let d = new Date();
                    let day = d.getDate()
                    d.setDate(day + expires)
                    return d
                } //返回对相应天数的日期对象
                expires = afterday(expires);
                document.cookie = encodeURIComponent(name) + '=' + encodeURIComponent(value) + ';expires=' + expires +
                    ';' + ';path=' + path + ';domain=' + domin + secure
            }
            setCookie(name, value, {
                expires,
                path,
                domin,
                secure
            })
        } else if (name && value === null) {
//注意null==undefined  如果只是value==null,那么(name)和(name,null)都会进入到这个条件中
            //removecookie  删除cookie
            function removeCookie(name) {
                document.cookie = encodeURIComponent(name) + '=;expires=' + (new Date(0))
            }
            removeCookie(name)
        } 
        else {
            //getCookie   通过键值获取值
            function getCookie(name) {
                name = name + '=' //避免出现username 和username2获取同一个下标
                let str = decodeURIComponent(document.cookie)
                console.log(str)
                if (str.indexOf(name)) {
                    let index = str.indexOf(name); //获取下标
                    let index2 = str.indexOf(';', index); //获取该字段默认结束
                    if (index2 > 0) {
                        return str.slice(index + name.length, index2) //截取对应的字段
                    } else {
                        return str.slice(index + name.length, str.length)
                    }
                }
            }
            return getCookie(name)
        }
    }
    $cookie('猪猪侠','棒棒糖',{
expires:5})
    $cookie('奥特曼','打怪兽')
    console.log($cookie('猪猪侠'))
    $cookie('奥特曼',null)
```

进一步优化

```java
<!DOCTYPE html>
<html>
	<head>
		<meta charset="utf-8">
		<title></title>
	</head>
	<body>
		<script type="text/javascript">
			function $cookie(name, value,{
     expires = '',path = '',domin = '',secure = ''}='') {
				if (name && value) {
						function afterday(expires) {
							let d = new Date();
							let day = d.getDate()
							d.setDate(day + expires)
							return d
						} //返回对相应天数的日期对象
						expires = afterday(expires);
						document.cookie = encodeURIComponent(name) + '=' + encodeURIComponent(value) + ';expires=' + expires +
							';' + ';path=' + path + ';domain=' + domin + secure
				} else if (name && value === null) {
						document.cookie = encodeURIComponent(name) + '=;expires=' + (new Date(0))
				} 
				else {
						name = name + '=' //避免出现username 和username2获取同一个下标
						let str = decodeURIComponent(document.cookie)
						console.log(str)
						if (str.indexOf(name)) {
							let index = str.indexOf(name); //获取下标
							let index2 = str.indexOf(';', index); //获取该字段默认结束
							if (index2 > 0) {
								return str.slice(index + name.length, index2) //截取对应的字段
							} else {
								return str.slice(index + name.length, str.length)
							}
						}
				}
			}
			$cookie('猪猪侠','棒棒糖',{
     expires:5})
			$cookie('奥特曼','打怪兽')
			console.log($cookie('猪猪侠'))
			$cookie('奥特曼',null)
		</script>
	</body>
</html>
```
