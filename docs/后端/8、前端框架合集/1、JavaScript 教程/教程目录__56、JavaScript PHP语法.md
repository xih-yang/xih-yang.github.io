# 56、JavaScript PHP语法
- 来源：https://ddkk.com/zhuanlan/qianduan/javascript/1/56.html
- 分类：前端框架
- 分组：教程目录
### PHP简介

#### PHP语言的特点

**1、** PHP（超文本语文处理器）是一种通用开源语言；

**2、** PHP脚本在服务器上运行；

**3、** PHP可在不同平台上运行（window、Linux、Mac、OSX）；

**4、** PHP与目前拒户所有的正在被使用的服务器兼容（Apache、IIS等），全球95%以上的网站都是由PHP开发；

**5、** PHP是免费的，可以同官网上下载它“www.php.net；

**6、** PHP提供广泛的数据库支持；

**7、** PHP易于学习，并可高效的运行在服务器端；

php代码兼容html和css所有代码

php=》数据库

php=》编写Html代码

前后端分离开发：

前端工程师：网站 前端html+css++js

后端开发师：后端：MySQL+PHP（其他语言都可）

**PHP输入函数:print\echo\print_r\var_dump**

**注：一定要有分号结尾**

**php的输出函数 如果语句含有标签会自动解析**

```java
<?php
/* 规范代码格式 */
	header('content-type:text/html;charset="utf-8"');
	/* 输出函数 */
	echo "<h1>hello world</h1>";
	echo("<h1>hello world</h1>");
	print "<h1>hello world</h1>";
	print("<h1>hello world</h1>");
	print_r("<h1>hello world</h1>");
	var_dump("hello world");
?>
```

注：var_dump 不仅可以输出内容，还可以输出数据类型和长度。print_r在输出数组时，数组类型，以及对应下表的值和下标。

### 变量和数据类型

php语法非常严格，包括每一条语句结尾必须加分号，否则直接报错。

#### php声明变量：

php声明变量通过`$`符号进行声明

php声明的变量也是弱引用类型，也就是数据类型只有赋值的时候才确定变量数据类型是什么，而且变量的数据类型是可以随时更改的。

#### php字符串拼接

使用符号 `.` 进行拼接

使用占位符拼接：{变量/表达式} 与js反引号插入变量类似只不过反引号$在大括号外面，而这个在{}里面，注意：**只能用双引号括起来**

#### 数据类型：

String（字符串）、Integer（整型）、Float（浮点型）、Boolean（布尔型）、Array（数组）、Object（对象）、NULL（空对象）

#### 条件语句：

#### 循环语句：

#### 函数：

#### 数组：

**1、** 索引数组下标是数组的；

注：UTF-8一个中文字符占3个字节

数组声明:$变量=array(value1,value2)

数组访问：$变量[下标]

数组长度获取：count(数组)

数组遍历：for

**2、** 关联数组下标是字符串（类似于Map）；

数组声明：$变量=array( key1 => value1,key2=>value2 )

数组访问：$变量[key]

数组长度获取：count(数组)

数组遍历：foreach （数组 as k e y = > key => key=>value）{…}

**3、** 全局的关联数组；

```java
 $_GET：接受所有通过get提交过来的所有数据   
 $_POST：接受通过post提交来的所有数据
```

数组中的索引数组和关联数组可以相互结合，结合成多维数组。

二维数组

数组函数 与js数组函数差不多

array_key() //返回数组中所有的键名

array_pop() //删除数组最后一个元素（出栈）

array_push() //在数组最后插入一个元素（入站）

ayyay_rand() //从数组中随机选出一个或多个元素，返回键名

array_shifit() //从头部删除一个元素（出队列）

count() //返回数组的长度

in_array() //检查数组中是否存在指定的值
