# 05、JMeter 教程 - 建立数据库测试计划
- 来源：https://ddkk.com/zhuanlan/tools/jmeter/1/5.html
- 分类：开发工具
- 分组：教程目录
## 1.简介

在实际工作中，我们经常会听到数据库的性能和稳定性等等，这些有时候也需要测试工程师去评估和测试，因此这篇文章宏哥主要介绍了jmeter连接和创建数据库测试计划的过程,宏哥在文中通过示例和代码非常详细地介绍给大家，希望对各位小伙伴和童鞋们的学习或者工作具有一定的指导和参考学习价值,遇到类似的问题脑子一片空白的童鞋们可以参考一下。

## 2.建立数据库测试计划

在本节中，您将学习如何创建基本的测试计划以测试数据服务器器和操作数据库（增、删、改、查）。本示例使用MySQL数据库驱动程序。要使用该驱动程序，必须将其包含的.jar文件（例如mysql-connector-java-XXX-bin.jar）复制到JMeter ./lib目录。

### 2.1新建测试计划

首先启动JMeter我们新建一个测试计划

### 2.2添加用户

新建完测试计划以后，我们前边也讲过了，这时候就要添加用户了。你要对每个JMeter测试计划进行的第一步是添加一个线程组（用户）。线程组告诉JMeter您要模拟的用户数量，用户应多久发送一次请求以及应发送多少次请求。

添加用户的步骤：首先选择“测试计划”来添加ThreadGroup元件，单击鼠标右键以获得“ 添加”菜单，然后选择“ 添加” →“ ThreadGroup”。

添加完用户以后，你应该在“测试计划”下可以看到“线程组”元素。如果没有看到该元素，则通过单击“测试计划”元素前边的“ + ”来展开 “测试计划”树，就可以看到你添加的用户了。

最后，你需要修改默认属性（如果需要修改，不需要修改默认即可）。如果尚未选择线程组元素，则在树中选择它。那么你就可以在“ JMeter”窗口的右侧部分中看到“线程组控制面板”

### 2.3添加JDBC连接配置

通过上边的操作，我们已经定义了用户，然后我们必须定义这些用户所要去的目的地，和目的地建立联系。不要这些用户累死累活的干了半天的活，知不道是为谁干得活。在本部分中，你需要和目的地建立联系。

具体步骤：首先选择ThreadGroup元件。单击鼠标右键获得“ 添加”菜单，然后选择“ 添加” →“ 配置元素” →“ JDBC连接配置”。然后，选择此新元件以查看其控制面板。我们需要设置一些字段，这些字段相当于谍战片中的接头暗号，例如：《智取威虎山》杨子荣与坐山雕的接头暗号：脸红什么？精神焕发。怎么又黄拉？度防冷涂的蜡；长江长江我是黄河，等等。暗号对上了，才可以建立联系。否则认为有危险，不是建立联系，具体在测试中的表现就是报错了！！！

设置以下字段（这些假设我们将使用名为“sxlf_wifi ” 的MySQL数据库）：

**1、** 名称：默认为空，填写你所想设置的名称，可为空2、注释：默认为空，可为空3、VariableName：变量名称，需要唯一标识，与JDBC取样器中的相对应，简单理解就是jdbcrequest的时候确定去哪个绑定的配置4、MaxNumberofConnections数据库最大连接数，默认10，建议设置为5005、PoolTimeout数据库连接超时，单位ms，默认10000默认即可6、IdleClearupInterval空闲连接清理时间间隔默认即可7、AutoCommit自动提交，有三个选项：true、false、编辑（jmeter提供的函数设置）默认为true默认即可8、TransactionIsolation有TRANSACTION_NODE事务节点、TRANSACTION_READ_UNCOMMITTED事务未提交读、TRANSACTION_READ_COMMITTED事务已提交读、TRANSACTION_SERIALIZABLE事务序列化、DEFAULT默认、TRANSACTION_REPEATABLE_READ事务重复读、编辑等选项，默认为default默认即可9、Keep-Alive是否保持连接，默认为true默认即可10、MaxConnectionage(ms)最大连接时长，超过时长的会被拒绝，默认为500011、ValidationQuery验证sql语法，默认为select112、DatabaseURL数据库url，可以带上字符集，比如jdbc:mysql://10.199.132.12:3306/xqy-portal?useUnicode=true&characterEncoding=utf8&allowMultiQueries=true13、JDBCDriverclassJDBC的类，默认为空，必填，mysql一般输入com.mysql.jdbc.Driver14、Username数据库的用户名15、Password数据库的密码；

注意：敲脑壳，敲黑板啦！！！

JMeter使用“控制面板”中指定的配置设置创建数据库连接池。在“ 变量名 ”字段的JDBC请求中引用该池。可以使用几种不同的JDBC Configuration元素，但是它们必须具有唯一的名称。每个JDBC请求必须引用一个JDBC配置池。一个以上的JDBC请求可以引用同一个池。

连接配置的控制面板的其他字段可以保留为默认值。如下图所示：

### 2.4添加JDBC请求

通过上边的操作，我们已经定义了用户并且已经知道目的地和接头人建立了联系之后，然后我们就需要给这些用户分配具体的任务了（谁负责监视，谁负责刺杀，谁负责放哨）。在本部分中，你将指定要执行的JDBC请求（刺杀任务）。

具体步骤：选择ThreadGroup元件。单击鼠标右键获得“ 添加”菜单，然后选择“ 添加” →“ 取样器” →“ JDBC请求”。然后，选择此新元素以查看其控制面板。

JMeter按照将请求添加到树中的顺序发送请求。

首先编辑以下属性

**1、** VariableName和上面JDBCConnectionConfiguration中的VariableName保持一致2、Querytype主要包括：Select、Update、CallableStatement、Commit、Rollback选项，详见下文使用方法3、Parametervalues默认为空，填写sql中要添加的数据，也可以参数化4、Parametertypes：默认为空，赋值参数的数据类型，需与Parametervalues对应起来，并以逗号隔开5、VariableName：默认为空，自定义值，供其他接口调用返回值，详见下文使用方法6、Resultvariablename：把sql执行结果保存到一个数组中7、Querytimeout(s):定义查询超时时间，单位s，默认为空；

如下图所示：

其中Query Type（SQL语句类型）包含十个类型，每个类型作用都不同，下面分别介绍。

**1、** Selectstatement；

这是一个查询语句类型；如果JDBC Request中的Query内容为一条查询语句，则选择这种类型。

PS：多个查询语句(不使用参数的情况下)可以放在一起顺序执行，需要设置Query Type为：Callable Statement；

如果Query Type为：select Statement，则只执行第一条select语句。

**2、** Updatestatement；

这是一个更新语句类型（包含insert和update）；如果JDBC Request中的Query内容为一条更新语句，则选择这种类型。

PS：如果该类型下写入多条update语句，依然只执行第一条（原因同上，具体下面介绍）。

**3、** Callablestatement；

这是一个可调用语句类型，CallableStatement 为所有的 DBMS 提供了一种以标准形式调用已储存过程的方法。

已储存过程储存在数据库中，对已储存过程的调用是 CallableStatement 对象所含的内容。

这种调用是用一种换码语法来写的，有两种形式：一种形式带结果参数，另一种形式不带结果参数；结果参数是一种输出 (OUT) 参数，是已储存过程的返回值。

两种形式都可带有数量可变的输入（IN 参数）、输出（OUT 参数）或输入和输出（INOUT 参数）的参数，问号将用作参数的占位符。

在JDBC 中调用已储存过程的语法如下所示。注意，方括号表示其间的内容是可选项；方括号本身并不是语法的组成部份。

{call 过程名[(?, ?, ...)]}，返回结果参数的过程的语法为： {? = call 过程名[(?, ?, ...)]}；

不带参数的已储存过程的语法类似：{call 过程名}。

更详细的使用方法可参考这篇文章：[CallableStatement的用法-CSDN博客](http://blog.csdn.net/imust_can/article/details/6989954)

**4、** Preparedselectstatement；

statement用于为一条SQL语句生成执行计划（这也是为什么select statement只会执行第一条select语句的原因），如果只执行一次SQL语句，statement是最好的类型；

Prepared statement用于绑定变量重用执行计划，对于多次执行的SQL语句，Prepared statement无疑是最好的类型（生成执行计划极为消耗资源，两种实现速度差距可能成百上千倍）；

PS：PreparedStatement的第一次执行消耗是很高的. 它的性能体现在后面的重复执行。

更详细的解释请参考这一篇文章：[http://blog.csdn.net/jiangwei0910410003/article/details/26143977](http://blog.csdn.net/jiangwei0910410003/article/details/26143977)

**5、** Preparedupdatestatement；

Prepared update statement和Prepared select statement的用法是极为相似的，具体可以参照第四种类型。

**6、** Commit；

commit的意思是：将未存储的SQL语句结果写入数据库表；而在jmeter的JDBC请求中，同样可以根据具体使用情况，选择这种Query类型。

**7、** Rollback；

rollback指的是：撤销指定SQL语句的过程；在jmeter的JDBC请求中，同样可以根据需要使用这种类型。

**8、** AutoCommit(false)；

MySQL默认操作模式就是autocommit自动提交模式。表示除非显式地开始一个事务，否则每条SQL语句都被当做一个单独的事务自动执行；

我们可以通过设置autocommit的值改变是否是自动提交autocommit模式；

而AutoCommit(false)的意思是AutoCommit（假），即将用户操作一直处于某个事务中，直到执行一条commit提交或rollback语句才会结束当前事务重新开始一个新的事务。

**9、** AutoCommit(true)；

这个选项的作用和上面一项作用相反，即：无论何种情况，都自动提交将结果写入，结束当前事务开始下一个事务。

**10、** 编辑（${}）；

jmeter中的JDBC请求中的SQL语句是无法使用参数的，比如： SELECT * FROM ${table_name} 是无效的。

如果需实现同时多个不同用户使用不同的SQL，可以通过把整条SQL语句参数化来实现；（把SQL语句放在csv文件中，然后在JDBC Request的Query 中使用参数代替 ${SQL_Statement}）。

备注：后面的七项项涉及到数据库的事务控制等知识点，如果有不明白的地方请自行查询相关知识。

### 2.5添加侦听器以查看/存储测试结果

您需要添加到测试计划中的最后一个元件是 Listener。该元素负责将JDBC请求的所有结果存储在文件中并显示结果。

具体步骤：选择ThreadGroup元件并添加一个结果树的侦听器（添加 → 侦听器 → 结果树）。

侦听器显示结果及控制面板。

### 2.6保存测试

在菜单点击“保存”按钮图标，选择保存位置，点击“Save”保存测试计划

### 2.7运行测试

保存测试计划以后，在菜单运行 → 开始或 Ctrl + R运行测试，如下图所示：
