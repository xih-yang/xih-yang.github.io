# 08、MyCat 实战 - 安全设置
- 来源：https://ddkk.com/zhuanlan/sharding/mycat/3/8.html
- 分类：分库分表
- 分组：教程目录
## 1 权限配置

**1、 user 标签权限控制**

目前Mycat 对于中间件的连接控制并没有做太复杂的控制，目前只做了中间件逻辑库级别的读

写权限控制。是通过 server.xml 的 user 标签进行配置。

```java
#server.xml配置文件user部分
<user name="mycat">
 <property name="password">123456</property>
 <property name="schemas">TESTDB</property>
</user>
<user name="user">
 <property name="password">user</property>
 <property name="schemas">TESTDB</property>
 <property name="readOnly">true</property>
</user>
```

**2、 privileges 标签权限控制**

在user 标签下的 privileges 标签可以对逻辑库（schema）、表（table）进行精细化的 DML 权限控制。

privileges 标签下的 check 属性，如为 true **开启权限检**查，为 false 不开启，默认为 false。

由于Mycat 一个用户的 schemas 属性可配置多个逻辑库（schema） ，所以 privileges 的下级

节点schema 节点同样可配置多个，对多库多表进行细粒度的 DML 权限控制

```java
#server.xml配置文件privileges部分
#配置orders表没有增删改查权限
<user name="mycat">
 　　<property name="password">123456</property>
 　　<property name="schemas">TESTDB</property>
 　　<!-- 表级 DML 权限设置 -->
　　<privileges check="true">
　　　　<schema name="TESTDB" dml="1111" >
　　　　　　<table name="orders" dml="0000"></table>
　　　　　　<!--<table name="tb02" dml="1111"></table>-->
　　　　</schema>
　　</privileges>
</user>
```

## 2 SQL 拦截

firewall 标签用来定义防火墙；

firewall 下 whitehost 标签用来定义 IP 白名单 ，

blacklist 用来定义SQL 黑名单。

**1、 白名单**

可以通过设置白名单，实现某主机某用户可以访问 Mycat，而其他主机用户禁止访问。

```java
#server.xml配置文件firewall标签
#配置只有192.168.140.128主机可以通过mycat用户访问
<firewall>
　　 <whitehost>
　　　　 <host host="192.168.140.128" user="mycat"/>
 　　</whitehost>
</firewall>
```

**2、 黑名单**

可以通过设置黑名单，实现 Mycat 对具体 SQL 操作的拦截，如增删改查等操作的拦截。

```java
#server.xml配置文件firewall标签
#配置禁止mycat用户进行删除操作
<firewall>
 　　　　<whitehost>
　　　　　　 <host host="192.168.140.128" user="mycat"/>
　　　　 </whitehost>
 　　　　<blacklist check="true">
　　　　　　 <property name="deleteAllow">false</property>
　　　　　</blacklist>
</firewall>
```
