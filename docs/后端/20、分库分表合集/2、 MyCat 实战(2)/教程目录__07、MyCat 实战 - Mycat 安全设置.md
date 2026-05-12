# 07、MyCat 实战 - Mycat 安全设置
- 来源：https://ddkk.com/zhuanlan/sharding/mycat/2/7.html
- 分类：分库分表
- 分组：教程目录
## 7.1、权限配置

**1、** user标签权限控制；

目前 Mycat 对于中间件的连接控制并没有做太复杂的控制，目前只做了中间件逻辑库级别的读写权限控制。是通过 server.xml 的 user 标签进行配置。

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

如下图

配置说明

标签属性
说明

name
应用连接中间件逻辑库的用户名

password
该用户对应的密码

TESTDB
应用当前连接的逻辑库中所对应的逻辑表。schemas 中可以配置一个或多个

readOnly
应用连接中间件逻辑库所具有的权限。true 为只读，false 为读写都有，默认为 false

测试案例

```java
#测试案例一
# 使用user用户，权限为只读（readOnly：true）
# 验证是否可以查询出数据，验证是否可以写入数据
#1、用user用户登录，运行命令如下：
mysql -uuser -puser -h 192.168.140.128 -P8066
#2、切换到TESTDB数据库，查询orders表数据，如下：
use TESTDB
select * from orders;
#3、可以查询到数据，如下图
```

```java
#4、执行插入数据sql，如下：
insert into orders(id,order_type,customer_id,amount) values(7,101,101,10000);
#5、可看到运行结果，插入失败，只有只读权限，如下图：
```

```java
#测试案例二
# 使用mycat用户，权限为可读写（readOnly：false）
# 验证是否可以查询出数据，验证是否可以写入数据
#1、用mycat用户登录，运行命令如下：
mysql -umycat -p123456 -h 192.168.140.128 -P8066
#2、切换到TESTDB数据库，查询orders表数据，如下：
use TESTDB
select * from orders;
#3、可以查询到数据，如下图
```

```java
#4、执行插入数据sql，如下：
insert into orders(id,order_type,customer_id,amount) values(7,101,101,10000);
#5、可看到运行结果，插入成功，如下图：
```

**2、** privileges标签权限控制；

在user 标签下的 privileges 标签可以对逻辑库（schema）、表（table）进行精细化的 DML 权限控制。

privileges 标签下的 check 属性，如为 true 开启权限检查，为 false 不开启，默认为 false。由于 Mycat 一个用户的 schemas 属性可配置多个逻辑库（schema） ，所以 privileges 的下级节点 schema 节点同样可配置多个，对多库多表进行细粒度的 DML 权限控制。

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

配置说明

DML**权限**
增加**insert**
更新**update**
查询**select**
删除**select**

0000
禁止
禁止
禁止
禁止

0010
禁止
禁止
可以
禁止

1110
可以
禁止
禁止
禁止

1111
可以
可以
可以
可以

测试案例

```java
#测试案例一
# 使用mycat用户，privileges配置orders表权限为禁止增删改查（dml="0000"）
# 验证是否可以查询出数据，验证是否可以写入数据
#1、重启mycat，用mycat用户登录，运行命令如下：
mysql -umycat -p123456 -h 192.168.140.128 -P8066
#2、切换到TESTDB数据库，查询orders表数据，如下：
use TESTDB
select * from orders;
#3、禁止该用户查询数据，如下图
```

```java
#测试案例二
# 使用mycat用户，privileges配置orders表权限为可以增删改查（dml="1111"）
# 验证是否可以查询出数据，验证是否可以写入数据
#1、重启mycat，用mycat用户登录，运行命令如下：
mysql -umycat -p123456 -h 192.168.140.128 -P8066
#2、切换到TESTDB数据库，查询orders表数据，如下：
use TESTDB
select * from orders;
#3、可以查询到数据，如下图
```

```java
#4、执行插入数据sql，如下：
insert into orders(id,order_type,customer_id,amount) values(8,101,101,10000);
#5、可看到运行结果，插入成功，如下图：
```

```java
#4、执行插入数据sql，如下：
delete from orders where id in (7,8);
#5、可看到运行结果，插入成功，如下图：
```

## 7.2、SQL 拦截

firewall 标签用来定义防火墙；firewall 下 whitehost 标签用来定义 IP 白名单 ，blacklist 用来定义SQL 黑名单。

**1、** 白名单；

可以通过设置白名单，实现某主机某用户可以访问 Mycat，而其他主机用户禁止访问。

```java
#设置白名单
#server.xml配置文件firewall标签
#配置只有192.168.140.128主机可以通过mycat用户访问
<firewall>
<whitehost>
<host host="192.168.140.128" user="mycat"/>
</whitehost>
</firewall>
```

如下图

```java
#重启Mycat后，192.168.140.128主机使用mycat用户访问
mysql -umycat -p123456 -h 192.168.140.128 -P 8066
#可以正常访问，如下图
```

在此主机换user用户访问，禁止访问

在192.168.140.127主机用mycat用户访问，禁止访问

2、黑名单

可以通过设置黑名单，实现 Mycat 对具体 SQL 操作的拦截，如增删改查等操作的拦截。

```java
#设置黑名单
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

如下图

```java
#重启Mycat后，192.168.140.128主机使用mycat用户访问
mysql -umycat -p123456 -h 192.168.140.128 -P 8066
#可以正常访问，如下图
```

```java
#切换TESTDB数据库后，执行删除数据语句
delete from orders where id=7;
#运行后发现已禁止删除数据，如下图
```

可以设置的黑名单 SQL 拦截功能列表

配置项
缺省值
描述

selelctAllow
true
是否允许执行 SELECT 语句

deleteAllow
true
是否允许执行 DELETE 语句

updateAllow
true
是否允许执行 UPDATE 语句

insertAllow
true
是否允许执行 INSERT 语句

createTableAllow
true
是否允许创建表

setAllow
true
是否允许使用 SET 语法

alterTableAllow
true
是否允许执行 Alter Table 语句

dropTableAllow
true
是否允许修改表

commitAllow
true
是否允许执行 commit 操作

rollbackAllow
true
是否允许执行 roll back 操作
