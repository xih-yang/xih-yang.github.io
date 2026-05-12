# 59、JavaScript mysql
- 来源：https://ddkk.com/zhuanlan/qianduan/javascript/1/59.html
- 分类：前端框架
- 分组：教程目录
假设我们的各个网站的数据保存在**文档**当中,那么就会存在以下弊端。

**1、** 文件的安全性；

**2、** 文件不利查询和对数据的管理；

**3、** 文件不利于存放海量数据；

**4、** 文件在程序中控制不方便；

为了解决以上问题：因此有了数据库的出现。

数据库本质也是文件。功能主要是保存数据并且配套一套数据管理系统，更有利于对数据的管理，比如**增删改查**。数据库水平衡量一个程序员水平的重要指标。

我自己使用的Phpnow软件是mysql、php、apache集成环境，大家要是想单独使用mysql，可以单独去下载使用。（phpnow安装完之后会自带mysql）

phpnow中的mysql使用流程：

**1、** 在浏览器输入localhost/phpMyAdmin就可以进入数据库可视化界面；

**2、** 输入用户名root，密码：下载phpnow初始化时自己设置的密码执行，登陆即可；

**初学者可以先使用终端进行编程**

终端：shell

数据库：core 核

通过控制台（DOS）界面（终端）操作数据库：称为shell编程。

如果在终端报错：不是内部命令或外部命令。说明当前电脑虽然已经安装了mysql但是没有配置环境变量

解决办法：配置环境变量。

phpnow 的mysql环境变量的配置

**1、** 查看phpnow当前的mysql版本（浏览器输入localhost/index.php）；

**2、** 进入下载phpnow的根目录下，进入与MySQL版本号一致的文件夹下；

**3、** 进去与MySQL版本号一致的文件夹之后,点击进入bin文件夹；

**4、** 点击我的电脑，右键属性->高级系统设置->环境变量；

**5、** 找到用户变量->path->双击打开；

**6、** 点击新建->复制刚刚打开MySQL版本一致的文件夹下的bin路径，粘贴到新建区域，点击确定；

**7、** 一路点击确定，直到所有窗口关闭；

**8、** 重启控制台:输入mysql-uroot-p回车输入密码；

-u：用户名 -p:密码

出现下图mysql >表示环境变量配置成功

mysql 命令操作

mysql数据结构示意图：

**1、** 客户端：client就是我们命令行控制台，通过这个控制台我们可以发送给mysql的各种操作指令；

**2、** MySQLdbms（mysql的管理系统），DB（数据库），然后DB中有许多表和其他数据对象（比如触发器，存储过程，视图等）上面的三个部分都属于数据库管理系统；

**3、** 我们的mysql数据库在3306监听（默认的端口），这个端口可以修改；

**mysql和apache关闭和启动：**

第一种方式手动关闭和启动：

右键我的电脑->管理->服务与应用程序->服务->找到apache和MySQL->右键启动和关闭

第二种：命令行

打开控制台->net stop mysql(停止)

打开控制台->net start mysql(打开)

**登录mysql：**

控制台：mysql -u root -p

标准模式：mysql -h localhost(主机) -u root -p[回车后输入密码即可] 注：p后面不要有空格，输完p直接回车

**查看当前数据库**

注：在mysql输入的命令都要加；否则不会结束

show database

**创建新的数据库**（不区分大小写）

character set utf8：指定使用utf-8字符集

**选择数据库**

use数据库名字；

**删除数据库**

drop database [if exists] 数据库名

ifexists 可选的 如果存在的话删除，如果不存在的话，就不删除，当然也不会报错。

**创建表（一定要设置ID）：**

ID是该行数据的重要标识，其他字段名都可能重复，但是id一定不能重复

```java
create table 表名（
​	字段名1 数据类型，
​	字段名2 数据类型，
​	......
  字段名n 数据类型
）character set 字符集 collate 校对规则
```

注：表是可以执行字符集的，遵从以表为准。表如果不写字符集和校对规则以数据库为准。

说明：1.表中有多个字段，根据需求来确定

**2、** 这里表中的数据类型，指的是mysql的数据类型，API；

bit（1-64）tinyint（带符号-128-127、无符号0-255） smallint （带符号-32768-32767，无符号0-65535）等等

数据类型：

int整形

float 浮点型

char（参数）：字符型；参数表示可以存在的字符数，固定，超出不可存

varchar（参数）：可变，参数表示可以存在的字符数，固定，超出自动增加

date 日期 ‘200-01-01’

text 文本（理论无上限）

案例：

intunsigned(无符号整型)：正整数

notnull default ’ '：不填写内容就以空字符长代替

float not null default 0.0；

**查看当前数据库下的表**

show tables

查看表头结构**

desc 表名

Mysql的sql语句

数据库的crud语句

**insert语句 （插入语句）**

insert into 表名（字段1，字段2，…）values（具体值1，具体值2，…）

添加数据有两种方式：1.指定字段名 2.添加全部字段

注意事项：

**1、** 插入的数据英语字段的数据类型相同；

**2、** 数据的大小应在列的规定范围内，例如不能将一个长度为80的字符串加入到长度为40的列中；

**3、** 在values中的累出数据位置必须与被加入的列的排序的位置相对应；

**4、** 字符和日期数据应包含在单引号中；

**5、** 如果我们添加的字段是包含所有的字段，可以不写前面的字段列表反之，如果你添加的字段，不是所有的，而是一部分字段，则一定要写清楚字段列表；

当我们添加多条数据时，用逗号隔开。

查看表格中所有的数据**：select * from employee

**update语句 （更新语句）**

update 表名 set 字段1=新值，字段名2=新值…where 条件

delete语句 （删除语句）**

delete from 表名 where 条件；

注意事项：

**1、** 如果我们的delete语句，没有where条件，则是把整个表的所有记录全部删除；

**2、** delete语句不能删除某一列的值（可以使用update）；

**3、** 使用delete语句删除记录，不删除表本身，如果删除表，使用**droptable**表名；

**4、** 删除表中的数据我们可以使用truncatetable语句，他和delete有所不同，truncatetable表名；不能带条件，所以尽量使用delete；

select语句 （查找语句）**

select 字段1，字段2，… from 表名 where 条件；

select * from 表名 where 条件；

说明：如果我们想把该表所有的字段信息都取出来，则可以直接*表示

distinct：过滤掉重复数据

and与 or或 not 非

**模糊查询**：where 字段 like %代表一个或者多个字符

排序**

select 字段1，字段2，… from 表名 where 条件 order by 字段 [asc|desc]

注：我么在查询结构的时候，我么通常都希望按照某个字段的顺序进行排序后，在显示，比如按照数学或者英语的高低排序。

**1、** orderby字段该字段为排序字段；

**2、** orderby后面可以带asc或者desc，asc表示升序排列，desc表示降序排序，默认是asc；

可视化界面操作数据库

新建数据库

新键表

注：保证id不重复，设置id为这个表的主键 主键设置：索引值设置为：PRIMARY

选中：AI 在我们不填写该字段的情况，该字段的值会自增长

保存->选择插入

填写相应的值，所有的表格点击执行

通过php操作数据库 天龙八部

```java
<?php
	header('content-type:text/html;charset="utf-8"');
	/* 连接数据库 */
	/* 1.连接数据库 */
	/* 
	第一个参数，连接数据库的ip 如果是本地数据库：直接填locahost
	第二个参数：数据库用户名
	第三个参数：数据库密码
	*/
	$link=mysql_connect("localhost","root","123456");
	/* 判断是否连接成功 */
	if(!$link){
		echo  '连接失败';
		exit; /* 终止后续所有代码*/
	}
	/* 3.设置字符集 */
	mysql_set_charset('utf8');
	/* 4.选择数据库 */
	mysql_select_db('xxx');
	/* 5.准备sql语句 */
	$sql='select * from employee';
	/* 6.发送sql语句 */
	$res=mysql_query($sql);
	// var_dump($res);
	/* 7.处理结果 */
	/* 执行几次mysql_fetch_assoc 获取到的就是第几条数据 */
	// $row=mysql_fetch_assoc($res);
	// var_dump($row);
	// /* 优化：只要mysql_fetch_assoc($res)存在，就会不断输出 */
	while($row=mysql_fetch_assoc($res)){
		 var_dump($row);
	}
	echo '</table>';
	/*8.关闭数据库  */
	mysql_close($link);
?>
```

PHP和HTML混编展现数据

```java
<?php
	header('content-type:text/html;charset="utf-8"');
	/* 连接数据库 */
	/* 1.连接数据库 */
	/* 
	第一个参数，连接数据库的ip 如果是本地数据库：直接填locahost
	第二个参数：数据库用户名
	第三个参数：数据库密码
	*/
	$link=mysql_connect("localhost","root","123456");
	/* 判断是否连接成功 */
	if(!$link){
		echo  '连接失败';
		exit; /* 终止后续所有代码*/
	}
	/* 3.设置字符集 */
	mysql_set_charset('utf8');
	/* 4.选择数据库 */
	mysql_select_db('xxx');
	/* 5.准备sql语句 */
	$sql='select * from employee';
	/* 6.发送sql语句 */
	$res=mysql_query($sql);
	// var_dump($res);
	//设置表头
	echo '<table border=1 >';
	echo '<tr><th>员工工号</th><th>员工姓名</th><th>员工工资</th><th>员工性别</th><th>员工职位</th></tr>';
	/* 7.处理结果 */
	/* 执行几次mysql_fetch_assoc 获取到的就是第几条数据 */
	// $row=mysql_fetch_assoc($res);
	// var_dump($row);
	// /* 优化：只要mysql_fetch_assoc($res)存在，就会不断输出 */
	while($row=mysql_fetch_assoc($res)){
		echo '<tr>';
		foreach($row as $key => $value){
			echo "<td>{$value}</td>";
		}
		echo '</tr>';
	}
	echo '</table>';
	/*8.关闭数据库  */
	mysql_close($link);
?>
```

上面方法，虽然能够在php页面展示，但是没有实现真正的前后端分离，因此，还需要改进。

前端向后端请求数据,并将数据展示在页面上。

注：前后端在进行数据传输的过程是以字符串格式，因此要将后端的数据结构里使用个json_encode()转成字符串输出，前端才能够获取到。

```java
<?php
	header('content-type:text/html;charset="utf-8"');
	/* 连接数据库 */
	/* 1.连接数据库 */
	/* 
	第一个参数，连接数据库的ip 如果是本地数据库：直接填locahost
	第二个参数：数据库用户名
	第三个参数：数据库密码
	*/
	$link=mysql_connect("localhost","root","123456");
	/* 判断是否连接成功 */
	if(!$link){
		echo  '连接失败';
		exit; /* 终止后续所有代码*/
	}
	/* 3.设置字符集 */
	mysql_set_charset('utf8');
	/* 4.选择数据库 */
	mysql_select_db('xxx');
	/* 5.准备sql语句 */
	$sql='select * from employee';
	/* 6.发送sql语句 */
	$res=mysql_query($sql);
	// var_dump($res);
	/* 定义索引数组 */
	$arr=array();
	/* 7.处理结果 */
	/* 执行几次mysql_fetch_assoc 获取到的就是第几条数据 */
	// $row=mysql_fetch_assoc($res);
	// var_dump($row);
	// /* 优化：只要mysql_fetch_assoc($res)存在，就会不断输出 */
	while($row=mysql_fetch_assoc($res)){
		array_push($arr,$row);
	}
	/*8.关闭数据库  */
	mysql_close($link);
	//数据结构转字符串输出
	echo json_encode($arr);
?>
```

前端向后端添加数据

**1、** from表单点击提交数据以后，需要跳转页面；

**2、** ajax异步进行数据传输，数据传输之后，不会进行页面跳转，可以继续在当前页面操作；

转到后端用$_POST

后端反馈给前端格式：code：xxx message：xxxx

```java
<?php
header('content-type:text/html;charset="utf-8"');
/* 定义返回数据格式 */
$response=array('code'=>0,'message'=>'');
$link=mysql_connect("localhost","root","123456");
/* 1.连接数据库 */
	/* 
	第一个参数，连接数据库的ip 如果是本地数据库：直接填locahost
	第二个参数：数据库用户名
	第三个参数：数据库密码
	*/
	$link=mysql_connect("localhost","root","123456");
	/* 判断是否连接成功 */
	if(!$link){
		$response['code']=1;
		$response['message']='数据库连接失败';
		echo json_encode($response);
		exit; /* 终止后续所有代码*/
	}
	/* 3.设置字符集 */
	mysql_set_charset('utf8');
	/* 4.选择数据库 */
	mysql_select_db('xxx');
	/* 5.准备sql语句 */
	$sql="insert into employee (name,salary,sex,position) values ('{$_POST['name']}','{$_POST['salary']}','{$_POST['sex']}','{$_POST['position']}')";
	/* 6.发送sql语句 返回值：true或false*/
	$res=mysql_query($sql);
	/* 7.处理数据 */
	if($res){
		$response['message']='数据插入成功';
		echo json_encode($response);
	}else{
		$response['code']=2;
		$response['message']='数据插入失败';
		echo json_encode($response);
	}
	/* 8.关闭数据库 */
	mysql_close($link);
?>
```
