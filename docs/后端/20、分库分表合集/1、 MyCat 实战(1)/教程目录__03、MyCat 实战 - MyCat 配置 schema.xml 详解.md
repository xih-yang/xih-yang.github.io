# 03、MyCat 实战 - MyCat 配置 schema.xml 详解
- 来源：https://ddkk.com/zhuanlan/sharding/mycat/1/3.html
- 分类：分库分表
- 分组：教程目录
> schema.xml MyCat对应的逻辑数据库和物理数据库表的配置关系

schema 逻辑数据库设置

dataNode 节点配置，也就是分库相关配置，即数据来源于哪几台主机

dataHost 节点主机配置，即：物理数据库（真正存储数据的数据库）

## 文末附：schema.xml 配置文件，本文基于该配置进行介绍

**1. 标签**

```java
<!-- 逻辑库配置 -->
<!-- 一个schema标签就是一个逻辑库 -->
<schema name="db_store" checkSQLschema="true" sqlMaxLimit="100">
    xxx
</schema>
```

> 1.name 逻辑数据库名
>
> 2.checkSQLschema 数据库前缀设置
>
> 当该值为true时，例如我们执行语句select * from TESTDB.company 。mycat会把语句修改为 select * from company 去掉TESTDB。
>
> 3.sqlMaxLimit mycat 查询限制条数
>
> 当该值设置为某个数值时，每条执行的sql语句，如果没有加上limit语句，Mycat会自动加上对应的值。不写的话，默认返回所有的值。
>
> 需要注意的是，如果运行的schema为非拆分库的，那么该属性不会生效。需要自己sql语句加limit。

**1.1  标签**

```java
<schema name="db_store" checkSQLschema="true" sqlMaxLimit="100">
    <table name="store" dataNode="db_store_dataNode" primaryKey="storeID"/>
    <table name="employee" dataNode="db_store_dataNode" primaryKey="employeeID"/>
</schema>
```

> 1.name 表名
>
> 物理数据库中的表名(真实表)
>
> 2.dataNode 表存储到哪些节点
>
> 多个节点用逗号分隔。节点名为 标签设置的 name
>
> 3.primaryKey 主键字段名
>
> 分片规则，能不用主键做分片规则的话，尽量不用(提高性能方案)
>
> 4.autoIncrement 是否自增
>
> mysql 对非自增长主键，使用last_insert_id()是不会返回结果的，只会返回0。所以，只有定义了自增长主键的表，才可以用last_insert_id()返回主键值。
>
> MyCat 提供了自增长主键功能，但是对应到 mysql 节点上数据表，没有auto_increment，那么在 MyCat 层调用last_insert_id() 也是不会返回结果的。
>
> 5.rule 分片规则名
>
> 具体规则 rule.xml 详细介绍
>
> 6.type 该属性定义了逻辑表的类型
>
> 目前逻辑表只有全局表和普通表。
>
> 全局表： global 普通表：无
>
> 7.needAddLimit 指定表是否需要自动的在每个语句后面加上limit限制
>
> 由于使用了分库分表，数据量有时候会特别庞大，这时候执行查询语句，忘记加上limt就会等好久，所以mycat自动为我们加上了limit 100，这个属性默认为true，可以自己设置为false禁用。如果使用这个功能，最好配合使用数据库模式的全局序列。
>
> 8.subTables 分表
>
> 分表目前不支持Join。

**1.2  标签**

```java
<!-- 分片库 -->
<schema name="db_user" checkSQLschema="true" sqlMaxLimit="100">
    <!-- 全局表 -->
    <table name="data_dictionary" type="global" dataNode="db_user_dataNode1,db_user_dataNode2" primaryKey="dataDictionaryID"/>
    <!-- 分片表 -->   <!-- rule="mod-userID-long" 是分片规则，定义在rule.xml文件中-->
    <table name="users" dataNode="db_user_dataNode$1-2"  rule="mod-userID-long" primaryKey="userID">
        <!-- ER表 -->
        <childTable name="user_address"  joinKey="userID" parentKey="userID" primaryKey="addressID"/>
    </table>
</schema>
```

> 1.childTable 标签用于定义 E-R 分片的子表
>
> 通过标签上的属性与父表进行关联。
>
> 2.name 子表的名称
>
> 3.joinKey 子表中字段的名称(与父表关联字表键值)
>
> 4.parentKey 父表中字段名称(与子表关联父表键值)
>
> 5.primaryKey 同  标签
>
> 6.needAddLimit 同  标签

**2.  标签**

```java
<!-- 节点配置(分库相关配置,即数据来源于几台主机) -->
<!-- db_store(主从复制) -->
<dataNode name="db_store_dataNode" dataHost="db_storeHOST" database="db_store" />
<!-- db_user -->
<dataNode name="db_user_dataNode1" dataHost="db_userHOST1" database="db_user" />
<dataNode name="db_user_dataNode2" dataHost="db_userHOST2" database="db_user" />
```

` 标签定义了 MyCat 中的数据节点，也就是我们所说的数据分片。一个  标签就是一个独立的数据分片`

> 1.name 定义 MyCat 数据节点的名字，这个名字需要唯一。
>
> 我们在  标签上用这个名字来建立表与分片对应的关系
>
> 2.dataHost 用于定义该分片属于哪个数据库实例
>
> 属性与 标签上定义的 name 对应
>
> 3.database
>
> 用于定义该分片属于数据库实例上的具体库。

**3.  标签**

```java
<!-- 配置db_user的节点主机 -->
<dataHost name="db_userHOST1" maxCon="1000" minCon="10" balance="0" writeType="0" dbType="mysql" dbDriver="native" switchType="1"  slaveThreshold="100">
    <heartbeat>select user()</heartbeat>
    <writeHost host="userHost1" url="192.168.204.201:3306" user="root"  password="root"></writeHost>
</dataHost>
<dataHost name="db_userHOST2" maxCon="1000" minCon="10" balance="0" writeType="0" dbType="mysql" dbDriver="native" switchType="1"  slaveThreshold="100">
    <heartbeat>select user()</heartbeat>
    <!-- can have multi write hosts -->
    <writeHost host="userHost2" url="192.168.204.202:3306" user="root"  password="root"></writeHost>
</dataHost>
```

> 1.balance 负载均衡类型
>
> balance="0"：不开启读写分离机制，所有读操作都发送到当前可用的writeHost上
>
> balance="1"：全部的readHost与stand by writeHost参与select语句的负载均衡，简单的说，当双主双从模式（M1-S1，M2-S2 并且M1 M2互为主备），正常情况下，M2,S1,S2都参与select语句的负载均衡。
>
> balance="2"：所有读操作都随机的在writeHost、readHost上分发
>
> balance="3"：所有读请求随机的分发到writeHst对应的readHost执行，writeHost不负担读写压力。（1.4之后版本有）
>
> 2.writeType 负载均衡类型(一般指定0即可)
>
> writeType="0", 所有写操作发送到配置的第一个 writeHost，第一个挂了切到还生存的第二个writeHost，重新启动后以切换后的为准，切换记录在配置文件中:dnindex.properties .
>
> writeType="1"，所有写操作都随机的发送到配置的 writeHost。1.5以后版本废弃，不推荐。
>
> 3.dbType 指定后端连接的数据库类型
>
> 目前支持二进制的mysql协议，还有其他使用 JDBC 连接的数据库，例如：mysql、mongodb、oracle、sqlserver、spark等
>
> 4.dbDriver 指定连接后端数据库使用的driver
>
> 目前可选的值有 native 和 JDBC 。
>
> 使用 native 的话，因为这个值执行的是二进制的 mysql 协议，所以可以使用 mysql 和 maridb，其他类型的则需要使用JDBC驱动来支持。(可以理解为：mysql 使用 native，其他的使用 JDBC)
>
> 如果使用 JDBC 的话需要符合 JDBC4 标准的驱动 jar 放到 mycat\lib 目录下，并检查驱动jar包中包括如下目录结构文件 META-INF\services\java.sql.Driver。 在这个文件写上具体的driver类名，例如 com.mysql.jdbc.Driver
>
> writeHost readHost 指定后端数据库的相关配置给 mycat ，用于实例化后端连接池。
>
> 5.switchType 主从切换策略 (schema.xml 可以配置多主多从)
>
> -1 不自动切换
>
> 1默认值 自动切换
>
> 2基于 MySql 主从同步(是否延时)的状态决定是否切换，心跳语句为 show slave status
>
> 备注： switchType=2、slaveThreshold="100"(设置延时时间)、心跳语句 show slave status 三者结合，从应用层方面来解决主从延时，进行切换操作

**3.1  标签**

> 这个标签内指明用于和后端数据库进行心跳检查的语句。
>
> 例如：MYSQL 可以使用 select user()，Oracle 可以使用 select 1 from dual 等。

**3.2 / 标签**

> 这两个标签都指定后端数据库的相关配置，用于实例化后端连接池。
>
> 唯一不同的是，writeHost 指定写实例、readHost 指定读实例。
>
> 在一个 dataHost 内可以定义多个 writeHost 和 readHost。但是，如果 writeHost 指定的后端数据库宕机，那么这个 writeHost 绑定的所有 readHost 都将不可用。
>
> 另一方面，由于这个 writeHost 宕机，系统会自动的检测到，并切换到备用的 writeHost 上去。这两个标签的属性相同，这样子便可以实现多主多从配置

> 1.host 用于标识不同实例
>
> 一般 writeHost 我们使用*M1，readHost 我们用*S1。
>
> 2.url 物理库URL地址
>
> eg：url="192.168.204.201:3306"
>
> 3.password 物理库密码
>
> 4.user 物理库用户名
>
> 5.weight 权重
>
> 配置在 readhost 中作为读节点的权重
>
> 6.usingDecrypt 是否对密码加密，默认0。
>
> 具体加密方法，请跳转链接查看：MyCat 密码加密方式

## 附：schema.xml 配置文件，基于该配置进行介绍

```java
<?xml version="1.0"?>
<!DOCTYPE mycat:schema SYSTEM "schema.dtd">
<mycat:schema xmlns:mycat="http://io.mycat/">
    <!-- 逻辑库配置 -->
    <!-- 一个schema标签就是一个逻辑库 -->
    <schema name="db_store" checkSQLschema="true" sqlMaxLimit="100">
        <table name="store" dataNode="db_store_dataNode" primaryKey="storeID"/>
        <table name="employee" dataNode="db_store_dataNode" primaryKey="employeeID"/>
    </schema>
    <!-- 分片库 -->
    <schema name="db_user" checkSQLschema="true" sqlMaxLimit="100">
        <!-- 全局表 -->
        <table name="data_dictionary" type="global" dataNode="db_user_dataNode1,db_user_dataNode2" primaryKey="dataDictionaryID"/>
        <!-- 分片表 -->   <!-- rule="mod-userID-long" 是分片规则，定义在rule.xml文件中-->
        <table name="users" dataNode="db_user_dataNode$1-2"  rule="mod-userID-long" primaryKey="userID">
            <!-- ER表 -->
            <childTable name="user_address"  joinKey="userID" parentKey="userID" primaryKey="addressID"/>
        </table>
    </schema>
    <!-- 节点配置(分库相关配置,即数据来源于几台主机) -->
    <!-- db_store(主从复制) -->
    <dataNode name="db_store_dataNode" dataHost="db_storeHOST" database="db_store" />
    <!-- db_user -->
    <dataNode name="db_user_dataNode1" dataHost="db_userHOST1" database="db_user" />
    <dataNode name="db_user_dataNode2" dataHost="db_userHOST2" database="db_user" />
    <!-- 节点主机配置 -->
    <!-- 配置db_store的节点主机 -->
    <dataHost name="db_storeHOST" maxCon="1000" minCon="10" balance="1" writeType="0" dbType="mysql" dbDriver="native" switchType="1"  slaveThreshold="100">
        <heartbeat>select user()</heartbeat>
        <!-- can have multi write hosts -->
        <writeHost host="hostM1" url="192.168.204.201:3306" user="root"  password="root">
            <!-- can have multi read hosts -->
            <readHost host="hostS1" url="192.168.204.202:3306" user="root" password="root" />
        </writeHost>
    </dataHost>
    <!-- 配置db_user的节点主机 -->
    <dataHost name="db_userHOST1" maxCon="1000" minCon="10" balance="0" writeType="0" dbType="mysql" dbDriver="native" switchType="1"  slaveThreshold="100">
        <heartbeat>select user()</heartbeat>
        <writeHost host="userHost1" url="192.168.204.201:3306" user="root"  password="root">
        </writeHost>
    </dataHost>
    <dataHost name="db_userHOST2" maxCon="1000" minCon="10" balance="0" writeType="0" dbType="mysql" dbDriver="native" switchType="1"  slaveThreshold="100">
        <heartbeat>select user()</heartbeat>
        <!-- can have multi write hosts -->
        <writeHost host="userHost2" url="192.168.204.202:3306" user="root"  password="root">
        </writeHost>
    </dataHost>
</mycat:schema>
```
