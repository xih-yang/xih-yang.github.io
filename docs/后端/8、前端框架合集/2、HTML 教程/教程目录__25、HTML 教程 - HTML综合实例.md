# 25、HTML 教程 - HTML综合实例
- 来源：https://ddkk.com/zhuanlan/qianduan/html/1/25.html
- 分类：前端框架
- 分组：教程目录
## 1. 背景

通过前面22篇文章的学习，我们对HTML有了一个比较全面的了解。

本篇，我们编写一个网站实例，来看看通过已经掌握的HTML知识，能开发出什么样子的网站。

## 2. 开发流程

### 2.1 网站功能设计

我们打算开发一个介绍苏轼的网站，没错，就是那个鼎鼎有名的大文人苏轼，网站我们就起名为【苏轼网】。

我们打算设计如下网页：

- 首页：展示网站标题【苏轼网】，及苏轼大图一张。
- 生平简介：展示一篇介绍苏轼生平的文章
- 经典诗词：通过表格展示苏轼经典的诗词
- 苏轼图集：展示苏轼相关的图片
- 留言板：提供网友填写留言的表单

### 2.2 建立网站目录结构

通过VSCode建立目录结构如下：

解释下，所有文件都放到项目文件夹`023-html-demo`下，表示第23篇博客-HTML相关-实例的意思。

内有5个网页，home是首页，introduce是生平简介，message是留言板，picture是苏轼图集，poem是经典诗词。

还有一个images文件夹，里面包含5张图片，是我从网上下载的苏轼相关图片，当做网站的图片资源，集中放到images文件夹下。

此处需要注意的是images文件夹和5个网页处于同一目录下，即项目文件夹`023-html-demo`下，而5张图片是处于images文件夹之内的。

### 2.3 开发首页

首页需要放置一个导航栏，导航栏可以展示所有页面的超级链接，然后需要放置网站标题和首页大图。

整体代码如下：

```java
<html>
<head>
    <meta charset="utf-8">
    <title>首页</title>
</head>
<body>
    <!-- 导航栏 -->
    <div>
        <ul>
            <li><a href="home.html">首页</a></li>
            <li><a href="introduce.html">生平简介</a></li>
            <li><a href="poem.html">经典诗词</a></li>
            <li><a href="picture.html">苏轼图集</a></li>
            <li><a href="message.html">留言板</a></li>
        </ul>
    </div>
    <!-- 网站标题 -->
    <h1>苏轼网</h1>
    <!-- 首页大图 -->
    <img src="images/su01.png">
</body>
</html>
```

效果如下：

### 2.2 生平简介页

生平简介页面，导航栏跟首页是一样的，其实所有页面的导航栏都相同，因为导航是用于跳转任意网页的。

然后生平简介页面在导航下面还需要放置生平简介文章，所以代码如下：

```java
<html>
<head>
    <meta charset="utf-8">
    <title>生平简介</title>
</head>
<body>
    <!-- 导航栏 -->
    <div>
        <ul>
            <li><a href="home.html">首页</a></li>
            <li><a href="introduce.html">生平简介</a></li>
            <li><a href="poem.html">经典诗词</a></li>
            <li><a href="picture.html">苏轼图集</a></li>
            <li><a href="message.html">留言板</a></li>
        </ul>
    </div>
    <!-- 内容 -->
    <p>
        苏轼（1037年1月8日—1101年8月24日），字子瞻，一字和仲，号铁冠道人、东坡居士，世称苏东坡、苏仙 、坡仙
        ，汉族，眉州眉山（今四川省眉山市）人，祖籍河北栾城，北宋文学家、书法家、美食家、画家，历史治水名人。
        苏轼是北宋中期文坛领袖，在诗、词、散文、书、画等方面取得很高成就。
    </p>
</body>
</html>
```

效果如下：

### 2.3 经典诗词页

经典诗词页，上面同样是导航栏，下面通过表格展示一些经典诗词即可。

```java
<html>
<head>
    <meta charset="utf-8">
    <title>生平简介</title>
</head>
<body>
    <!-- 导航栏 -->
    <div>
        <ul>
            <li><a href="home.html">首页</a></li>
            <li><a href="introduce.html">生平简介</a></li>
            <li><a href="poem.html">经典诗词</a></li>
            <li><a href="picture.html">苏轼图集</a></li>
            <li><a href="message.html">留言板</a></li>
        </ul>
    </div>
    <!-- 诗词表格 -->
    <table border="1">
        <thead>
            <th>题目</th>
            <th>名句</th>
        </thead>
        <tbody>
            <tr>
                <td>念奴娇·赤壁怀古</td>
                <td>大江东去，浪淘尽，千古风流人物</td>
            </tr>
            <tr>
                <td>江城子·乙卯正月二十日夜记梦</td>
                <td>十年生死两茫茫。不思量，自难忘</td>
            </tr>
            <tr>
                <td>水调歌头·明月几时有</td>
                <td>人有悲欢离合，月有阴晴圆缺，此事古难全</td>
            </tr>
        </tbody>
    </table>
</body>
</html>
```

效果如下：

### 2.4 苏轼图集页

除了导航栏外，添加一些苏轼相关图片即可。

```java
<html>
<head>
    <meta charset="utf-8">
    <title>苏轼图集</title>
</head>
<body>
    <!-- 导航栏 -->
    <div>
        <ul>
            <li><a href="home.html">首页</a></li>
            <li><a href="introduce.html">生平简介</a></li>
            <li><a href="poem.html">经典诗词</a></li>
            <li><a href="picture.html">苏轼图集</a></li>
            <li><a href="message.html">留言板</a></li>
        </ul>
    </div>
    <!-- 图集 -->
    <img src="images/su02.png"><br>
    <img src="images/su03.png"><br>
    <img src="images/su04.png"><br>
    <img src="images/su05.png"><br>
</body>
</html>
```

效果如下：

### 2.5 留言板

除了导航栏之外，我们可以通过表单制作一个留言板。当然由于我们目前只学习了HTML，所以留言板只能显示一个界面，并不能真正将留言提交给我们的后台，这个留待以后完善。

留言板代码如下：

```java
<html>
<head>
    <meta charset="utf-8">
    <title>留言板</title>
</head>
<body>
    <!-- 导航栏 -->
    <div>
        <ul>
            <li><a href="home.html">首页</a></li>
            <li><a href="introduce.html">生平简介</a></li>
            <li><a href="poem.html">经典诗词</a></li>
            <li><a href="picture.html">苏轼图集</a></li>
            <li><a href="message.html">留言板</a></li>
        </ul>
    </div>
    <!-- 图集 -->
    <form action="#" method="get">
        请输入姓名：<input type="text" name="username"><br>
        请输入留言：<input type="text" name="content"><br>
        <input type="submit" value="提交留言">
    </form>
</body>
</html>
```

效果如下：

## 3. 小结

通过23篇文章的学习，并且编写了一个综合实例，如果认真学习的话，现在想必对HTML网页世界有了一个完全不一样的认识。

实际上这23片文章的内容并不多，1天学习两三篇也是很正常的事情，1天学习1篇也不算慢。难的是持之以恒，凡事积小成多，努力努力再努力，直到量变引起质变。

哪有什么天赋异禀，谁的本事不是刻苦学来的。
