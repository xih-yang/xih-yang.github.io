# 1、JavaScript 基础语法
- 来源：https://ddkk.com/zhuanlan/qianduan/javascript/1/1.html
- 分类：前端框架
- 分组：教程目录
跨平台的脚本语言。

平台：运行环境，这里一般指操作系统。

跨平台：就是在各种环境下，都可以运行

脚本语言：不能独立运行，要依赖于网页

HTML的运行离不开浏览器，JS程序的运行离不开HTML网页

Javascript组成

**1、** ECMAScript3.05.0；

**2、** DOM文档；

**3、** BOM浏览器；

【注】：所有的js代码都是在script标签中编写

属性：

**1、** type=‘text/javascript’声明当前标签的文本格式（省略）；

**2、** src=‘demo.js’引入外部js；

alert（），在当前页面弹出一个警告框，警告框中显示（）里的内容

注意点：

**1、** 可以有多个script标签，多个script标签都是自上而下的顺序执行；

**2、** script标签不能同时作为引入外部js文件和书写本页面的js代码只能选其一；

以下就是错误做法

```java
<script type="text/javascript" src="./demo.js">
			alert(4)
</script>//此时只能执行外部引用的标签，scirpt内部的js代码不会执行
```

向页面输出内容方式：

**1、** document.write（‘这是一些内容’）；

注意项：①标签解析 标签会直接被解析

②转义字符

```java
 <代表<     > 代表  >      代表空格
```

**2、** alert（‘这是一些内容’）；在页面弹出警告框；

**3、** console.log(‘这是一些内容’)；在浏览器调试面板控制输出内容（用于代码调试）；

注释：

单行注释 // 快捷键： ctrl+/

多行注释/**/ 快捷键： ctrl+shfit+/

在编写js代码的时候，要在每一行代码结束的位置加;分号。否则会影响代码的压缩（去掉代码当中所有的空格、tab键、换行）
