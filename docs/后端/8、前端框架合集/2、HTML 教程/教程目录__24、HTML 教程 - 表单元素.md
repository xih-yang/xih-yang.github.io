# 24、HTML 教程 - 表单元素
- 来源：https://ddkk.com/zhuanlan/qianduan/html/1/24.html
- 分类：前端框架
- 分组：教程目录
## 1. 任务背景

上一节我们介绍了，表单是用来收集用户输入的。

那么具体收集用户输入的姓名、密码、性别等信息，就要靠表单元素来实现。

我们以QQ邮箱登录界面为例（如下图）：红框部分就是表单了，然后表单里面每个绿框（QQ号输入框、QQ密码输入框、登录按钮）就是具体的表单元素了。

可见表单要依赖具体的表单元素，才能获取用户输入的信息。

## 2. 任务目标

掌握常见的表单元素的用法。

## 3. 相关知识点

### 3.1 文本框

第一个要学习的表单元素是文本框，文本框用来让用户输入一段文本，格式如下：

```java
<form action="#" method="POST">
    请输入姓名: <input type="text" name="username"><br>
</form>
```

其中``表示这是一个表单输入元素，`type="text"`表示这个表单输入元素的类型是文本框，最后`name="username"`是给这个输入标签起了个名字，之所以要起名字，是当网页上有多个输入标签时，能把他们区分开。

文本框效果如下：

> 注意name跟界面显示没关系，是为了往后端传递数据使用的，用来区分不同的表单元素。此处name不要求理解，大概知道一下就行。

### 3.2 密码框

密码框也是用来输入文本的，但是密码框为了保护密码的私密性，输入的内容会被隐藏，别人是看不到的，例如：

```java
请输入与密码：<input type="password" name="password"><br>
```

效果如下：

### 3.3 单选框

单选框用于从若干选项中选择其中一个，例如性别只能从男、女中选择一个：

```java
<form action="#" method="POST">
    请选择性别：
    <input type="radio" name="sex" value="male">男
    <input type="radio" name="sex" value="female">女
</form>
```

注意这两个单选框都是表示性别，所以name相同。还有一个重要属性是value，当我们的表单提交给后台程序时，会将选中项的value值提交到后台，这样后台就知道用户从网页上选择了哪个选项了。

上面代码效果如下：

> 同组的单选框，name必须相同，浏览器会保证name相同的单选框不能被同时选中。name与value主要是为了从前端向后端传递数据，此处大体了解即可。

### 3.4 复选框

单选框只能选择一个，复选框可以选择多个，例如可以选择兴趣爱好：

```java
<form action="#" method="POST">
    请选择爱好：
    <input type="checkbox" name="hobby" value="basketball">篮球
    <input type="checkbox" name="hobby" value="football">足球
</form>
```

由于两个复选框都是表示爱好，所以name相同。当表单提交到后台时，会将选中项的value值全部传递给后台程序。

上面的例子效果如下：

> name与value主要是为了从前端向后端传递数据，此处大体了解即可。

### 3.5 按钮

表单内还需要包含按钮，一般来说，点击按钮后会将表单提交给后端。

按钮其实分2大类，提交按钮点击后会提交表单，但是普通按钮点击后则不会提交表单，例如：

```java
<form action="#" method="POST">
    请选择爱好：
    <input type="checkbox" name="hobby" value="basketball">篮球
    <input type="checkbox" name="hobby" value="football">足球
    <br>
    <input type="button" value="普通按钮">
    <input type="submit" value="提交按钮">
</form>
```

效果如下：

可以尝试下，点击普通按钮没反应，但是点提交按钮，页面会刷新一下。

这样可能不够直观，我们修改下表单提交的action如下：

```java
<form action="http://www.baidu.com" method="POST">
    请选择爱好：
    <input type="checkbox" name="hobby" value="basketball">篮球
    <input type="checkbox" name="hobby" value="football">足球
    <br>
    <input type="button" value="普通按钮">
    <input type="submit" value="提交按钮">
</form>
```

也就是说，我们的表单提交给百度去处理(当然百度不会搭理我们，因为百度不是我们开发的，不会理会我们的请求)。

此时点击普通按钮，没反应，因为表单不会提交。而点击提交按钮，则会进入百度网页，表示当前信息交给百度处理了。

### 3.6 文本域

文本域跟文本框功能是一样的，都是用来输入一段文本。区别是：文本框只能容纳一行文字，而文本域可以更大一些，容纳一段文本。

如下代码：

```java
<form action="#" method="POST">
    <textarea></textarea>
</form>
```

效果如下：

另外，还可以通过cols属性设置文本域宽度，rows设置文本域高度。注意col是英文单词column(列)的缩写，row的中文意思是行。

如下代码：

```java
<form action="#" method="POST">
    <textarea cols="30" rows="6"></textarea>
</form>
```

效果如下：

> 提示：文本域右下角是可拖拽区域，鼠标靠近后按住左键拖拽，可以改变文本域大小，堪称黑科技！

### 3.7 下拉菜单

当我们使用单选框时，如果选项太多，会让界面显得凌乱。例如选择省份时，30多个省级行政区都显示到界面上比较困难。

此时可以使用下拉菜单，只显示选中项，备选项只有点击触发时才展示出来。

如下代码是一个下拉菜单：

```java
请选择省级行政区：
<select>
    <option>山东</option>
    <option>山西</option>
    <option>河北</option>
    <option>香港</option>
    <option>澳门</option>
    <option>台湾</option>
    <!-- 为了方便讲解，此处未展示我国全部省级行政区，但祖国领土一寸都不能少！ -->
</select>
```

其中select表示下拉菜单整体，里面的每个option标签表示下拉菜单中的一个选项。上述代码效果如下：

## 4. 任务实操

本节内容很多，而且都是使用频率很高的表单元素，强烈建议大家编写、并运行一下。

## 5. 任务总结

表单元素是显示到界面上，用于可以输入相关的信息。表单元素可以指定name属性，来区分不同的采集目的。

当表单被提交到对应的后端处理程序，后端可以通过name属性来区分数据来自哪个表单元素。

当然了，我们在学习HTML阶段，不需要知道后端是咋处理的，此处简单了解即可。
