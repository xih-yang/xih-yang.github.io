# 10、MyBatis - 日志
- 来源：https://ddkk.com/zhuanlan/orm/mybatis/1/10.html
- 分类：ORM框架
- 分组：教程目录
MyBatis 通过使用内置的日志工厂提供日志功能。

在这里我们对STDOUT_LOGGING和LOG4J进行学习。

## 一、STDOUT_LOGGING

**1、** 什么是STDOUT_LOGGING；

STDOUT_LOGGING是MyBatis的标准日志配置。STDOUT_LOGGING的使用无需其他的依赖，只需要在MyBatis的核心配置文件中进行**标签的配置即可。

**2、** STDOUT_LOGGING的具体使用实例；

1、配置myvatis-config.xml核心配置文件

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE configuration
        PUBLIC "-//mybatis.org//DTD Config 3.0//EN"
        "http://mybatis.org/dtd/mybatis-3-config.dtd">
<configuration>
  <properties resource="db.properties" />
  <settings>
    <setting name="logImpl" value="STDOUT_LOGGING"/>
  </settings>
  <typeAliases>
    <typeAlias type="com.jms.pojo.User" alias="User"/>
  </typeAliases>
  <environments default="development">
    <environment id="development">
      <transactionManager type="JDBC"/>
      <dataSource type="POOLED">
        <property name="driver" value="${driver}"/>
        <property name="url" value="${url}"/>
        <property name="username" value="${username}"/>
        <property name="password" value="${password}"/>
      </dataSource>
    </environment>
  </environments>
  <mappers>
    <mapper resource="com/jms/dao/UserMapper.xml"/>
  </mappers>
</configuration>
```

关键即

```java
  <settings>
    <setting name="logImpl" value="STDOUT_LOGGING"/> </settings>
```

标签的配置。

2、测试并查看打印的信息

我们可以看到，首先打开一个JDBC的连接，建立一个一串数字的连接（个人认为这个连接应该是SqlSession），JDBC的事务自动提交设置的是false，接下来是几个值：

Preparing：SQL语句

Parameters：传入的值

Columns：需要查询的列名

Row：结果

Total：结果的数量

然后是查询的结果的展示，JDBC的事务自动提交重新设置的为true，关闭JDBC的连接，将一串数字的连接放回池内。

## 二、log4j

**1、** 什么是log4j；

Log4j是Apache的一个开源项目，通过使用Log4j，我们可以控制日志信息输送的目的地是控制台、文件、GUI组件，甚至是套接口服务器、NT的事件记录器、UNIX Syslog守护进程等；我们也可以控制每一条日志的输出格式；通过定义每一条日志信息的级别，我们能够更加细致地控制日志的生成过程。最令人感兴趣的就是，这些可以通过一个配置文件来灵活地进行配置，而不需要修改应用的代码。

**2、** 配置log4j；

1、导入依赖

```xml
<!-- https://mvnrepository.com/artifact/log4j/log4j -->
<dependency>
    <groupId>log4j</groupId>
    <artifactId>log4j</artifactId>
    <version>1.2.17</version>
</dependency>
```

2、在CLASSPATH下建立一个log4j.properties文件

文件内内容即对log4j的配置，配置内容不固定，按需求填写，具体格式查阅即可。

以下是我的文件内容：

```java
#将等级为DEBUG的日志信息输出到console和file这两个目的地，console和file的定义在下面的代码
log4j.rootLogger=DEBUG,console,file
#控制台输出的相关设置
log4j.appender.console = org.apache.log4j.ConsoleAppender
log4j.appender.console.Target = System.out
log4j.appender.console.Threshold=DEBUG
log4j.appender.console.layout = org.apache.log4j.PatternLayout
log4j.appender.console.layout.ConversionPattern=[%c]-%m%n
#文件输出的相关设置
log4j.appender.file = org.apache.log4j.RollingFileAppender
log4j.appender.file.File=./log/jms.log
log4j.appender.file.MaxFileSize=2mb
log4j.appender.file.Threshold=DEBUG
log4j.appender.file.layout=org.apache.log4j.PatternLayout
log4j.appender.file.layout.ConversionPattern=[%p][%d{yy-MM-dd}][%c]%m%n
log4j.appender.file.append=false
#日志输出级别
log4j.logger.org.mybatis=DEBUG
log4j.logger.java.sql=DEBUG
log4j.logger.java.sql.Statement=DEBUG
log4j.logger.java.sql.ResultSet=DEBUG
log4j.logger.java.sql.PreparedStatement=DEBUG
```

3、在MyBatis的核心配置文件mybatis-config.xml中进行log4j的配置

```java
  <settings>
    <setting name="logImpl" value="LOG4J"/>
  </settings>
```

4、运行一下之前的测试类，看一下结果：

首先看控制台：

再看生成的log文件：

其实除了前面多了具体的类，与标准日志似乎差别不大。

5、还可以在要输出的类中加入相关语句

我们就在测试类中加入相关语句，修改测试类如下：

```java
package com.jms.dao;
import com.jms.pojo.User;
import com.jms.utils.MyBatisUtil;
import org.apache.ibatis.session.SqlSession;
import org.apache.log4j.Logger;
import org.junit.Test;
public class UserMapperTest {
    static Logger logger = Logger.getLogger(UserMapperTest.class);
    @Test
    public void test() {
        logger.info("进入测试");
        //利用工具类获取SqlSession
        SqlSession sqlSession = MyBatisUtil.getSqlSession();
        //利用SqlSession获取UserMapper接口
        UserMapper userMapper = sqlSession.getMapper(UserMapper.class);
        //调用方法
        User user = userMapper.getUserbyid(10001);
        System.out.println(user);
        sqlSession.close();
        logger.info("测试完成");
    }
}
```

进行测试，测试结果如下：

控制台：

日志文件：

很明显，在开始和结束多了两句我们自定义等级的日志信息。

以下是log4j的等级：

级别
描述

ALL
所有级别包括自定义级别。

DEBUG
调试消息日志。

ERROR
错误消息日志，应用程序可以继续运行。

FATAL
严重错误消息日志，必须中止运行应用程序。

INFO
信息消息。

OFF
最高可能的排名，旨在关闭日志记录。

TRACE
高于DEBUG。

WARN
用于警告消息。

标准等级由低到高：ALL <DEBUG<INFO<WARN<ERROR<FATAL<OFF

当logger设置为某一级时，比它等级低的日志信息就会被过滤掉。

（本文仅作人人学习记录用，如有纰漏敬请指正）
