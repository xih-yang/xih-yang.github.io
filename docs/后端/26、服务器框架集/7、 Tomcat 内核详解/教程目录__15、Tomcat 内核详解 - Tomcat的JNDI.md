# 15、Tomcat 内核详解 - Tomcat的JNDI
- 来源：https://ddkk.com/zhuanlan/server/tomcat/3/15.html
- 分类：服务器框架
- 分组：教程目录
一般来讲，要使用JNDI需要完成以下三个步骤：

**1、** 驱动器jar包放置；

**2、** 配置文件的配置；

**3、** 在程序中调用；

根据范围层次，可分为两种配置方案。一种是Web应用层次上的局部配置方式，它只可以在自己的Web项目中使用。另一个是全局配置方式，通过资源连接，它可以供该Tomcat下的所有Web应用使用；

### 4.1 Web应用的局部配置方式

找到Tomcat的server.xml找到工程的Context节点,添加一个私有数据源

```xml
<Context docBase="WebApp" path="/WebApp" reloadable="true" source="org.eclipse.jst.jee.server:WebApp">
<Resource
name="jdbc/mysql"
scope="Shareable"
type="javax.sql.DataSource"
factory="org.apache.tomcat.dbcp.dbcp.BasicDataSourceFactory"
url="jdbc:mysql://localhost:3306/test"
driverClassName ="com.mysql.jdbc.Driver"
username="root"
password="root"
/>
</Context>
```

### 4.2 服务器的全局配置方式

- 配置全局JNDI数据源,应用到单个应用

找到Tomcat的server.xml中GlobalNamingResources节点,在节点下加一个全局数据源

```xml
<GlobalNamingResources>
<Resource
name="jdbc/mysql"
scope="Shareable"
type="javax.sql.DataSource"
factory="org.apache.tomcat.dbcp.dbcp.BasicDataSourceFactory"
url="jdbc:mysql://localhost:3306/test"
driverClassName ="com.mysql.jdbc.Driver"
username="root"
password="root"
/>
</GlobalNamingResources>
```

找到要应用此JNDI数据源的工程Context节点,增加对全局数据源的引用ResourceLink

【Spring对JNDI数据源的引用】

在applicationContext.xml中加一个bean,替代原来的dataSource

**1、****[jee:jndi-lookup**id="dataSource"jndi-name="jdbc/mysql"**/](jee:jndi-lookup**id="dataSource"jndi-name="jdbc/mysql"**/)**；

对Tomcat内部来讲，全局资源和局部命名资源都有各自的命令上下文。全局命名资源对Web应用是不可见的。只能通过ResourceLink从全局命名资源中查找对应的资源。局部部署只能有对应的web 应用使用，而全局部署可供所有的Web 应用使用。

## 5.Tomcat的标准资源

Tomcat标准资源包括如下几类：

**1、** 普通JavaBean资源：；

主要用于创建某个Java类对象供Web应用使用。

**1、** UserDatabase资源：；

它一般会配置成为一个全局资源，作为具有认证功能的数据源使用，一般该数据源通过XML（conf/tomcat-user.xml）文件存储

**2、** JavaMail会话资源：；

Tomcat提供JavaMail服务，可以使用发送Email功能；

**3、** JDBC数据源资源；

默认的JDBC数据源基于DBCP连接池；
