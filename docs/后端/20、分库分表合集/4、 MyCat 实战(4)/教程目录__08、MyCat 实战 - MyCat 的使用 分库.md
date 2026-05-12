# 08、MyCat 实战 - MyCat 的使用 分库
- 来源：https://ddkk.com/zhuanlan/sharding/mycat/4/8.html
- 分类：分库分表
- 分组：教程目录
### 1.分片规则

#### 1.1 auto-sharding-long 范围约定

- 以 500 万为单位,实现分片规则.
- 逻辑库 A 对应 dataNode - db1 和 db2. 1-500 万保存在 db1 中, 500 万零 1 到 1000 万保存在 db2 中,1000 万零 1 到 1500 万保存在 db1 中.依次类推.

#### 1.2 crc32slot 规则

- 在 CRUD 操作时,根据具体数据的 crc32 算法计算,数据应该保存在哪一个 dataNode 中

### 2.配置分片规则需要注意的地方

- id中推荐配置主键列
- 所有的 tableRule 只能使用一次。如果需要为多个表配置相同的分片规则，那么需要在此重新定义该规则
- 在 crc32Slot 算法中的分片数量一旦给定，MyCat 会将该分片数量和 slor 的取值范围保存到文件中。在次修改分片数量时是不会生效的，需要将该文件删除。文件位置位于 conf 目录中的 ruledata 目录中

### 3.配置分库

#### 3.1 需求

- 在 master 中创建 3 个数据库
- 在 MyCat 中配置分库

#### 3.2 创建数据库

```java
create database demo1 default character set utf8; 
create database demo2 default character set utf8; 
create database demo3 default character set utf8;
```

- 创建 t_users 表

```java
CREATE TABLE t_users (
	id int(11) NOT NULL, 
	name varchar(30) DEFAULT NULL, 
	PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
```

#### 3.3 修改 Schema.xml

```java
<?xml version="1.0"?>
<!DOCTYPE mycat:schema SYSTEM "schema.dtd">
<mycat:schema xmlns:mycat="http://io.mycat/">
	<schema name="suibian" checkSQLschema="false" sqlMaxLimit="100">
		<table name="t_users" dataNode="dn1,dn2,dn3" rule="crc32slot" />
	</schema>
	<dataNode name="dn1" dataHost="localhost1" database="demo1" />
	<dataNode name="dn2" dataHost="localhost1" database="demo2" />
	<dataNode name="dn3" dataHost="localhost1" database="demo3" />
	<dataHost name="localhost1" maxCon="1000" minCon="10" balance="1" writeType="0" dbType="mysql" dbDriver="native" switchType="1" slaveThreshold="100">
		<heartbeat>select user()</heartbeat>
		<!-- can have multi write hosts -->
		<writeHost host="hostM1" url="192.168.70.148:3306" user="root" password="root">
			<!-- can have multi read hosts -->
			<readHost host="hostS2" url="192.168.70.149:3306" user="root" password="root" />
		</writeHost>
	</dataHost>
</mycat:schema>
```

#### 3.4 测试

### 4.注意

- 使用 MyCat 实现分库时，先在 MyCat 中定义逻辑库与逻辑表，然后在 MyCat 的链接中执行创建表的命令必须要在 MyCat 中运行。因为 MyCat 在创建表时，会在表中添加一个新的列，列名为_slot。
- 使用 MyCat 插入数据时，语句中必须要指定所有的列。即便是一个完全项插入也不允许省略列名。
