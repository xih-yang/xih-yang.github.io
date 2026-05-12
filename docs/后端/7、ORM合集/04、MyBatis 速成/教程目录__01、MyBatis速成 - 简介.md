# 01、MyBatis速成 - 简介
- 来源：https://ddkk.com/zhuanlan/orm/mybatis/9/1.html
- 分类：ORM框架
- 分组：教程目录
## 1.什么是 MyBatis？

MyBatis 是一款优秀的持久层框架，它支持定制化 SQL、存储过程以及高级映射。MyBatis 避免了几乎所有的 JDBC 代码和手动设置参数以及获取结果集。MyBatis 可以使用简单的 XML 或注解来配置和映射原生信息，将接口和 Java 的 POJOs(Plain Old Java Objects,普通的 Java对象)映射成数据库中的记录。

## 2.下载安装

要使用MyBatis， 只需将 mybatis-x.x.x.jar 文件置于 classpath 中即可。

如果使用 Maven 来构建项目，则需将下面的 dependency 代码置于 pom.xml 文件中：

```xml
<dependency>
  <groupId>org.mybatis</groupId>
  <artifactId>mybatis</artifactId>
  <version>x.x.x</version>
</dependency>
```

## 3.源码下载

mybatis转移到github上了

[https://github.com/mybatis](https://github.com/mybatis)
