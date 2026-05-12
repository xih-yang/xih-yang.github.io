# 06、JMeter 教程 - 建立数据库测试计划实战
- 来源：https://ddkk.com/zhuanlan/tools/jmeter/1/6.html
- 分类：开发工具
- 分组：教程目录
## 1.简介

在实际工作中，我们经常会听到数据库的性能和稳定性等等，这些有时候也需要测试工程师去评估和测试，上一篇文章宏哥主要介绍了jmeter连接和创建数据库测试计划的过程,宏哥在文中通过示例和代码非常详细地介绍给大家，希望对各位小伙伴和童鞋们的学习或者工作具有一定的指导和参考学习价值,遇到类似的问题脑子一片空白的童鞋们可以参考一下。这一篇宏哥就以MySQL数据为例结合上一篇的理论知识在这里带领小伙伴和童鞋们实战一下。这里宏哥为了增加小伙伴们的学习兴趣和便于记忆理解，因此列举了一个谍战剧中执行刺杀任务的场景，首先组成刺杀任务的小队，然后通过接头暗号建立联系，其次就开始执行刺杀任务，期间有核查组员的人物背景、其他组员支援、以及自己组员的牺牲、任务的变更等等，最后确认暗杀任务是否执行成功。

## 2.环境准备

**1、** MySQL数据库2、下载mysqljdbc驱动3、JMeter；

**2、** 1安装MySQL；

首先确保你已经安装好数据库MySQL。如果没有可以参考宏哥的这篇文章：传送门。查看有没有安装MySQL命令：net start，打开控制台(在开始，运行输入cmd)然后出入“net start” 就是打开了服务看看列出来的有没有 MySQL之类的如果没有，就是没有安装。

**2、** 2JMeter；

JMeter安装启动好待用。

**2、** 3下载MySQL驱动；

**1、** 下载MySQL驱动下载地址：[MySQL::DownloadConnector/J][MySQL_DownloadConnector_J]常用的包如下：Windows下mysql-connector-java-5.1.7-bin.jarMac下MySQLConnector/J没有对应的Mac版，可以选择PlatformIndependent：mysql-connector-java-8.0.15.zip注意：驱动包的版本一定要与你数据库的版本匹配，驱动版本低于mysql版本有可能会导致连接失败报错；

**2、** 解压下载的MySQL驱动；

**3、** 将解压的MySQL的jdbc驱动（mysql-connector-java-8.0.20.jar），将其放到D:\software\apache-jmeter-5.1.1\lib目录下如下图所示：；

注意：敲黑板，敲脑壳啦！！！放完驱动以后，要记得重启jmeter

## 3.建立数据库测试计划

在本节中，您将学习如何创建基本的测试计划以测试数据库服务器和操作数据库（增、删、改、查）。本示例使用MySQL数据库驱动程序。要使用该驱动程序，必须将其包含的.jar文件（例如mysql-connector-java-XXX-bin.jar）复制到JMeter ./lib目录。

### 3.1新建测试计划

首先我们新建一个测试计划，并将其命名为：Test MySQLDB Plan

### 3.2在测试计划下添加驱动地址

在建立好测试计划以后，点击“Browse...”,选择我们前边下载解压好的驱动路径，我们需要将驱动的地址（路径）添加到测试计划下边

### 3.3添加用户

新建完测试计划以后，我们前边也讲过了，这时候就要添加用户了。你要对每个JMeter测试计划进行的第一步是添加一个线程组（用户）。线程组告诉JMeter您要模拟的用户数量，用户应多久发送一次请求以及应发送多少次请求。这里就相当于谍战片中我们开始选择队员组队的过程，默认是一人一个小组，如果你觉得不够可以在控制面板修改人数等等。

### 3.4添加JDBC连接配置

通过上边的操作，我们已经定义了用户挑选了队员组成了精干小组，然后我们必须定义这些用户（队员）所要去的目的地，和目的地建立联系。不要这些用户累死累活的干了半天的活，知不道是为谁干得活。在本部分中，你需要和目的地建立联系。我们需要设置一些字段，这些字段相当于谍战片中的接头暗号，例如：《智取威虎山》杨子荣与坐山雕的接头暗号：脸红什么？精神焕发。怎么又黄拉？度防冷涂的蜡；长江长江我是黄河，等等。暗号对上了，才可以建立联系。否则认为有危险，不是建立联系，具体在测试中的表现就是报错了！！！

### 3.5添加JDBC请求

通过上边的操作，我们已经定义了用户并且已经知道目的地和接头人建立了联系之后，然后我们就需要给这些用户分配具体的任务了（谁负责监视，谁负责刺杀，谁负责放哨）。在本部分中，你将指定要执行的JDBC请求（刺杀任务）。这里就开始执行刺杀任务，期间有核查组员的人物背景、其他组员支援、以及自己组员的牺牲、任务的变更等等

**3、** 5.1查询（核查组员信息）；

**3、** 5.2插入（其他组员支援）；

**3、** 5.3修改（组员档案变更）；

**3、** 5.4删除（自己组员牺牲）；

### 3.6添加监听器以查看/存储测试结果（监听器-查看任务是否成功）

您需要添加到测试计划中的最后一个元素是 Listener。该元素负责将JDBC请求的所有结果存储在文件中并显示结果。

### 3.7保存与执行测试计划

保存与执行测试计划，查看任务结果

**3、** 7.1核查人员信息情况；

**1、** 首先查询MySQL数据，如下图所示：；

**2、** 看一下JMeter执行后与上边的查询结果一致，说明核查人员信息成功如下图所示：；

**3、** 7.2核查人员支援情况；

JMeter执行后，插入数据“name”，我们分别查看MySQL和JMeter的结果，如下图所示：

JMeter：

MySQL：

**3、** 7.3核查人员变更情况；

JMeter执行后，将“yang”变更成“小羊”，我们分别查看MySQL和JMeter的结果，如下图所示：

JMeter：

MySQL：

**3、** 7.4核查人员牺牲情况；

JMeter执行后，name在任务中牺牲，我们分别查看MySQL和JMeter的结果，如下图所示：

JMeter：

MySQL：

## 4.小结

**1、** CannotloadJDBCdriverclass'com.mysql.jdbc.Driver'；

原因：未在jmeter安装目录下的./lib目录下放入mysql-connector-java-X.X.X-bin.jar

解决方法：将mysql-connector-java-X.X.X-bin.jar放入到./lib目录，并重启jmeter

**2、** CLIENT_PLUGIN_AUTHisrequired；

原因：导入的 mysql-connector-java-X.X.X-bin.jar版本问题（原来导入mysql-connector-java-8.0.17.jar），上网查资料，知驱动和mysql数据库的版本也有关系（参考mysql-connector-java之6.0.6版本，SQLNonTransientConnectionException: CLIENT_PLUGIN_AUTH is required异常问题 - wenqi0501的个人空间 - OSCHINA [https://my.oschina.net/u/3640994/blog/3000068](https://my.oschina.net/u/3640994/blog/3000068)）

mysql官网驱动版本和数据库版本说明，地址：[https://dev.mysql.com/doc/connector-j/8.0/en/connector-j-versions.html](https://dev.mysql.com/doc/connector-j/8.0/en/connector-j-versions.html)

解决方法：替换成mysql-connector-java-5.1.47.jar后问题解决

**3、** VariableNamemustnotbenullinInsert；

原因：未在JDBC Request的控制面板里填写绑定的连接池

解决办法：填写和JDBC Connection Configuration一样的连接池即可

**4、** 以下是各数据库DatabaseURL、JDBCDriverclass填写方式；

数据库名

Database URL

Driver class

MySQL

jdbc:mysql://host[:port]/dbname

com.mysql.jdbc.Driver

PostgreSQL

jdbc:postgresql:{dbname}

org.postgresql.Driver

Oracle

jdbc:oracle:thin:@//host:port/service

jdbc:oracle:thin:@(description=(address=(host={mc-name})(protocol=tcp)(port={port-no}))(connect_data=(sid={sid})))

oracle.jdbc.OracleDriver

Ingress (2006)

jdbc:ingres://host:port/db[;attr=value]

ingres.jdbc.IngresDriver

Microsoft SQL Server (MS JDBC driver)

jdbc:sqlserver://host:port;DatabaseName=dbname

com.microsoft.sqlserver.jdbc.SQLServerDriver

Apache Derby

jdbc:derby://server[:port]/databaseName[;URLAttributes=value[;…]]

org.apache.derby.jdbc.ClientDriver
