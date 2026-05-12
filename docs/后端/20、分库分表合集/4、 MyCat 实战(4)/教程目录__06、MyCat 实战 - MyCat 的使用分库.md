# 06、MyCat 实战 - MyCat 的使用分库
- 来源：https://ddkk.com/zhuanlan/sharding/mycat/4/6.html
- 分类：分库分表
- 分组：教程目录
### 1.配置读写分离

#### 1.1 Schema.xml

```java
<?xml version="1.0"?>
<!DOCTYPE mycat:schema SYSTEM "schema.dtd">
<mycat:schema xmlns:mycat="http://io.mycat/">
	<schema name="suibian" checkSQLschema="false" sqlMaxLimit="100">
		<table name="t_users" dataNode="dn1" />
	</schema>
	<dataNode name="dn1" dataHost="localhost1" database="demo1" />
	<dataHost name="localhost1" maxCon="1000" minCon="10" balance="0" writeType="0" dbType="mysql" dbDriver="native" switchType="1" slaveThreshold="100">
		<heartbeat>select user()</heartbeat>
		<!-- can have multi write hosts -->
		<writeHost host="hostM1" url="192.168.70.148:3306" user="root" password="root">
			<!-- can have multi read hosts -->
			<readHost host="hostS2" url="192.168.70.149:3306" user="root" password="root" />
		</writeHost>
	</dataHost>
</mycat:schema>
```

#### 1.2 Server.xml

```java
<user name="root">
	<property name="password">123456</property>
	<property name="schemas">suibian</property>
	<!-- 表级 DML 权限设置 -->
	<!--
	<privileges check="false">
		<schema name="TESTDB" dml="0110" >
			<table name="tb01" dml="0000"></table>
			<table name="tb02" dml="1111"></table>
		</schema>
	</privileges>
	-->
</user>
<user name="user">
	<property name="password">user</property>
	<property name="schemas">suibian</property>
	<property name="readOnly">true</property>
</user>
```

#### 1.3 测试读写分离

##### 1.3.1 启动 Mycat 命令

- bin/mycat start

##### 1.3.2 停止命令

- bin/mycat stop

##### 1.3.3 重启命令

- bin/mycat restart

##### 1.3.4 查看 MyCat 状态

- bin/mycat status

##### 1.3.5 访问方式

- 可以使用命令行访问或客户端软件访问.

##### 1.3.6 命令行访问方式

- mysql -u 用户名 -p 密码 -hmycat 主机 IP -P8066
- 链接成功后,可以当做 MySQL 数据库使用.
- 访问约束

##### 1.3.7 查看 Mycat 日志

- logs/wrapper.log
- 日志中记录的是所有的 mycat 操作. 查看的时候主要看异常信息 caused by 信息

##### 1.3.8 balance

- balance=”0”, 不开启读写分离机制，所有读操作都发送到当前可用的 writeHost 上
- balance=”1”，全部的 readHost 与 stand by writeHost 参与 select 语句的负载均衡
- balance=”2”，所有读操作都随机的在 writeHost、 readhost 上分发。
- balance=”3”， 所有读请求随机的分发到 writeHost 对应的 readhost 执行,writerHost 不负担读压力
