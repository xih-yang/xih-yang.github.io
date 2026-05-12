# 02、MyCat 实战 - MyCat 安装 简单使用(Linux版)
- 来源：https://ddkk.com/zhuanlan/sharding/mycat/1/2.html
- 分类：分库分表
- 分组：教程目录
MyCat 官网：[http://www.mycat.io/](http://www.mycat.io/)

## 1.准备工作

**1、** MyCat版本：1.6.x[点击下载](http://dl.mycat.io/1.6.7.3/20190927161129/Mycat-server-1.6.7.3-release-20190927161129-linux.tar.gz)；

**2、** 数据库(MySQL为例，支持主从复制)主从复制教程：[MySQL5.7.28主从复制实现][MySQL5.7.28]；

**3、** MySQL版本：5.7.28安装教程：[CentOS6.2安装MySQL5.7.28][CentOS6.2_MySQL5.7.28]；

**4、** 服务器三台(192.168.204.201(MySQL)、192.168.204.202(MySQL)、192.168.204.203(MyCat))；

**5、** MyCat安装目录：**/usr/local/env**；

## 2.应用场景

## 3.MyCat安装

**1、** 将下载的MyCattar.gz包解压缩到/usr/local/env路径下；

**2、** 进入解压缩后mycat的bin目录，；

**3、** 通过如下命令，来启动(关闭)MyCat服务；

查看启动日志信息，在 mycat/logs 目录下，通过 tail -f logs/wrapper.log 命令来查看

> 启动命令：./mycat start 关闭命令：./mycat stop

**4、** 如需配置环境变量，可自行配置，将mycat命令目录添加到PATH路径即可；

**5、** 本文启动报如下错误：；

> java.net.MalformedURLException: Local host name unknown: java.net.UnknownHostException: Linux03: Linux03: Name or service not known

是因为服务器配置了 HOSTNAME (vi /etc/sysconfig/network 中配置)，导致机器无法识别名称 Linux03。

解决该问题：

第一种方法是直接修改 HOSTNAME 为 127.0.0.1或者本机IP。**修改后需重启机器**。如下图所示

第二种就是 修改 hosts 文件，通过命令 **vi /etc/hosts** 进行修改。如下图所示

**6、** mycat启动成功日志；

## 4.连接 MyCat 服务

MyCat 默认监听 8066 端口，所以需要关闭防火墙 或者 **开启 8066 端口**(开放端口，请点击查看**：**[Linux开放指定端口](https://blog.csdn.net/lzb348110175/article/details/97043620))，本文开放 8066 端口号。**开放端口号后，切记重启防火墙(命令：service iptables restart)**

接下来，我们便可以使用 MySQL 服务来连接 MyCat 了(前提是MySQL已启动，MySQL如何安装等内容，请参考本文开头提供的链接)

MyCat 默认用户名：**root** 默认密码：**123456**，在conf/server.xml 文件中有配置。如下图所示

接下来，便是使用 MySQL 服务来完成 MyCat 的连接了(因为MyCat 也算是一个 增强版的 MySQL 服务)。

我们使用 Navicate 等软件，来远程完成对 MyCat 的连接

连接成功后，初次使用 MyCat，你会发现 通过命令行执行特别慢的问题，或者 Navicate 直接报 Invalid DataSource:0，是因为 MyCat 中 schema.xml 文件的配置问题。毕竟 MyCat 只是一个逻辑库，真正提供服务的还是 实际的 DB 库。

schema.xml 配置文件内容部分。见文末附录 **1.schema.xml 文件**/zhuanlan/sharding/mycat/1/1.html，查看附录部分内容，本文在此不做过多介绍。

## 5. MyCat 的使用

**前提：**根据 2 中应用场景，来完成简单

**准备工作：**

**1、** 对①schema.xml②rule.xml③server.xml配置文件进行修改；

**2、** 使用MyCat中间件来完成对SQL服务的管理，前提是提供SQL服务的实际数据库中，已经存在相对应的库、表(即：本例中MyCat中有db_user、db_store两个逻辑库，users、user_address等一些逻辑表那么在使用MyCat进行管理前，提供SQL服务的数据库（本例为MySQL）中，需确保这些库、表已经存在)；

**MyCat 配置：**

**1、** 将mycat/conf文件夹下的schema.xml、rule.xml、server.xml文件内容替换为附录中的内容；

**2、** 本文涉及到db_user、db_store2个库，store、employee、data_dictionary、users、user_address5个表将这些库、表提前创建到实体数据库(MySQL)中**(创建库、表相关语句，见附录4)**；

**3、** **(启动前确保库、表已创建)**使用命令./mycatstart启动MyCat服务，此时MyCat便能正常提供服务了目前逻辑表中是没有任何数据的；

**接下来我们便可以通过 MyCat 来完成对 真正 MySQL数据库的操作了**

**4、** 通过MyCat来完成对数据的插入操作(SQL数据插入语句，见附录5)；

**测试部分：**

①store、employee 表数据，主从复制，在 MyCat 服务器执行 insert 语句，201、202 服务器上，数据（如下图，点击图放大查看）

②data_dictionary 数据字典表定义为全局表，users 表为分片表，user_address 表为 E-R表。在 MyCat 服务器执行 insert 语句，**数据字典表每个分片都有一份，****users分片表会将5条内容根据ID%2 进行分片保存，****user_address E-R表则会根据父类 users 表的分片结果进行分片存储**。201、202 服务器上，数据（如下图，点击图放大查看）

③data_dictionary 数据字典内容，通过在 MyCat 中修改，则会应用到201、202 SQL服务的不同分片中（修改其他表数据，201、202库数据也会改变，此处势力修改users 表中的数据）接下来我们只需要通过操作 MyCat 服务，便能够变相来操作 201 和 202 两个真正提供SQL服务的机器中的数据。（如下图，点击图放大查看）

## 接下来，我们便能够通过MyCat 来完成对 真正提供服务的 MySQL 的操作了

**附录：**

**1.schema.xml 文件**

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
    <!-- 节点配置(即数据来源于几台主机) -->
    <!-- db_store(主从复制) -->
    <dataNode name="db_store_dataNode" dataHost="db_storeHOST" database="db_store" />
    <!-- db_user -->
    <dataNode name="db_user_dataNode1" dataHost="db_userHOST1" database="db_user" />
    <dataNode name="db_user_dataNode2" dataHost="db_userHOST2" database="db_user" />
    <!-- 节点主机配置 -->
    <!-- 配置db_store的节点主机 -->
    <dataHost name="db_storeHOST" maxCon="1000" minCon="10" balance="1"
			  writeType="0" dbType="mysql" dbDriver="native" switchType="1"  slaveThreshold="100">
        <heartbeat>select user()</heartbeat>
        <!-- can have multi write hosts -->
        <writeHost host="hostM1" url="192.168.204.201:3306" user="root"  password="root">
            <!-- can have multi read hosts -->
            <readHost host="hostS1" url="192.168.204.202:3306" user="root" password="root" />
        </writeHost>
    </dataHost>
    <!-- 配置db_user的节点主机 -->
    <dataHost name="db_userHOST1" maxCon="1000" minCon="10" balance="0"
			  writeType="0" dbType="mysql" dbDriver="native" switchType="1"  slaveThreshold="100">
        <heartbeat>select user()</heartbeat>
        <writeHost host="userHost1" url="192.168.204.201:3306" user="root"  password="root">
        </writeHost>
    </dataHost>
    <dataHost name="db_userHOST2" maxCon="1000" minCon="10" balance="0"
			  writeType="0" dbType="mysql" dbDriver="native" switchType="1"  slaveThreshold="100">
        <heartbeat>select user()</heartbeat>
        <!-- can have multi write hosts -->
        <writeHost host="userHost2" url="192.168.204.202:3306" user="root"  password="root">
        </writeHost>
    </dataHost>
</mycat:schema>
```

**2.rule.xml 文件**

```java
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE mycat:rule SYSTEM "rule.dtd">
<mycat:rule xmlns:mycat="http://io.mycat/">
    <tableRule name="rule1">
        <rule>
            <columns>id</columns>
            <algorithm>func1</algorithm>
        </rule>
    </tableRule>
    <tableRule name="rule2">
        <rule>
            <columns>user_id</columns>
            <algorithm>func1</algorithm>
        </rule>
    </tableRule>
    <tableRule name="sharding-by-intfile">
        <rule>
            <columns>sharding_id</columns>
            <algorithm>hash-int</algorithm>
        </rule>
    </tableRule>
    <tableRule name="auto-sharding-long">
        <rule>
            <columns>id</columns>
            <algorithm>rang-long</algorithm>
        </rule>
    </tableRule>
    <!-- 分片规则 -->
    <tableRule name="mod-long">
        <rule>
            <columns>id</columns>
            <algorithm>mod-long</algorithm>
        </rule>
    </tableRule>
    <tableRule name="mod-userID-long">
        <rule>
            <columns>userID</columns>
            <algorithm>mod-long</algorithm>
        </rule>
    </tableRule>
    <tableRule name="sharding-by-murmur">
        <rule>
            <columns>id</columns>
            <algorithm>murmur</algorithm>
        </rule>
    </tableRule>
    <tableRule name="crc32slot">
        <rule>
            <columns>id</columns>
            <algorithm>crc32slot</algorithm>
        </rule>
    </tableRule>
    <tableRule name="sharding-by-month">
        <rule>
            <columns>create_time</columns>
            <algorithm>partbymonth</algorithm>
        </rule>
    </tableRule>
    <tableRule name="latest-month-calldate">
        <rule>
            <columns>calldate</columns>
            <algorithm>latestMonth</algorithm>
        </rule>
    </tableRule>
    <tableRule name="auto-sharding-rang-mod">
        <rule>
            <columns>id</columns>
            <algorithm>rang-mod</algorithm>
        </rule>
    </tableRule>
    <tableRule name="jch">
        <rule>
            <columns>id</columns>
            <algorithm>jump-consistent-hash</algorithm>
        </rule>
    </tableRule>
    <!-- 分片规则方法实现 -->
    <function name="mod-long" class="io.mycat.route.function.PartitionByMod">
        <!-- how many data nodes -->
        <property name="count">2</property>
    </function>
    <function name="murmur"
        class="io.mycat.route.function.PartitionByMurmurHash">
        <property name="seed">0</property><!-- 默认是0 -->
        <property name="count">2</property><!-- 要分片的数据库节点数量，必须指定，否则没法分片 -->
        <property name="virtualBucketTimes">160</property><!-- 一个实际的数据库节点被映射为这么多虚拟节点，默认是160倍，也就是虚拟节点数是物理节点数的160倍 -->
        <!-- <property name="weightMapFile">weightMapFile</property> 节点的权重，没有指定权重的节点默认是1。以properties文件的格式填写，以从0开始到count-1的整数值也就是节点索引为key，以节点权重值为值。所有权重值必须是正整数，否则以1代替 -->
        <!-- <property name="bucketMapPath">/etc/mycat/bucketMapPath</property> 
		     			用于测试时观察各物理节点与虚拟节点的分布情况，如果指定了这个属性，会把虚拟节点的murmur hash值与物理节点的映射按行输出到这个文件，没有默认值，如果不指定，就不会输出任何东西 -->
    </function>
    <function name="crc32slot"
            class="io.mycat.route.function.PartitionByCRC32PreSlot">
        <property name="count">2</property><!-- 要分片的数据库节点数量，必须指定，否则没法分片 -->
    </function>
    <function name="hash-int"
        class="io.mycat.route.function.PartitionByFileMap">
        <property name="mapFile">partition-hash-int.txt</property>
    </function>
    <function name="rang-long"
        class="io.mycat.route.function.AutoPartitionByLong">
        <property name="mapFile">autopartition-long.txt</property>
    </function>
    <function name="func1" class="io.mycat.route.function.PartitionByLong">
        <property name="partitionCount">8</property>
        <property name="partitionLength">128</property>
    </function>
    <function name="latestMonth"
        class="io.mycat.route.function.LatestMonthPartion">
        <property name="splitOneDay">24</property>
    </function>
    <function name="partbymonth"
        class="io.mycat.route.function.PartitionByMonth">
        <property name="dateFormat">yyyy-MM-dd</property>
        <property name="sBeginDate">2015-01-01</property>
    </function>
    <function name="rang-mod" class="io.mycat.route.function.PartitionByRangeMod">
        <property name="mapFile">partition-range-mod.txt</property>
    </function>
    <function name="jump-consistent-hash" class="io.mycat.route.function.PartitionByJumpConsistentHash">
        <property name="totalBuckets">3</property>
    </function>
</mycat:rule>
```

**3.server.xml 文件**

```java
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE mycat:server SYSTEM "server.dtd">
<mycat:server xmlns:mycat="http://io.mycat/">
    <system>
    <property name="useSqlStat">0</property>  <!-- 1为开启实时统计、0为关闭 -->
    <property name="useGlobleTableCheck">0</property>  <!-- 1为开启全加班一致性检测、0为关闭 -->
        <property name="sequnceHandlerType">2</property>
    <!--  <property name="useCompression">1</property>--> <!--1为开启mysql压缩协议-->
        <!--  <property name="fakeMySQLVersion">5.6.20</property>--> <!--设置模拟的MySQL版本号-->
    <!-- <property name="processorBufferChunk">40960</property> -->
    <!-- 
    <property name="processors">1</property> 
    <property name="processorExecutor">32</property> 
     -->
        <!--默认为type 0: DirectByteBufferPool | type 1 ByteBufferArena-->
        <property name="processorBufferPoolType">0</property>
        <!--默认是65535 64K 用于sql解析时最大文本长度 -->
        <!--<property name="maxStringLiteralLength">65535</property>-->
        <!--<property name="sequnceHandlerType">0</property>-->
        <!--<property name="backSocketNoDelay">1</property>-->
        <!--<property name="frontSocketNoDelay">1</property>-->
        <!--<property name="processorExecutor">16</property>-->
        <!--
            <property name="serverPort">8066</property> <property name="managerPort">9066</property> 
            <property name="idleTimeout">300000</property> <property name="bindIp">0.0.0.0</property> 
            <property name="frontWriteQueueSize">4096</property> <property name="processors">32</property> -->
        <!--分布式事务开关，0为不过滤分布式事务，1为过滤分布式事务（如果分布式事务内只涉及全局表，则不过滤），2为不过滤分布式事务,但是记录分布式事务日志-->
        <property name="handleDistributedTransactions">0</property>
        <!-- off heap for merge/order/group/limit   1开启   0关闭 -->
        <property name="useOffHeapForMerge">1</property>
        <!-- 单位为m  -->
        <property name="memoryPageSize">1m</property>
        <!-- 单位为k -->
        <property name="spillsFileBufferSize">1k</property>
        <property name="useStreamOutput">0</property>
        <!-- 单位为m -->
        <property name="systemReserveMemorySize">384m</property>
        <!--是否采用zookeeper协调切换  -->
        <property name="useZKSwitch">true</property>
    </system>
    <!-- 全局SQL防火墙设置 -->
    <!-- 
    <firewall> 
        <whitehost>
            <host host="127.0.0.1" user="mycat"/>
            <host host="127.0.0.2" user="mycat"/>
        </whitehost>
        <blacklist check="false"></blacklist>
    </firewall>
    -->
    <user name="root" defaultAccount="true">
        <property name="password">123456</property>
        <!-- 可访问的逻辑库，可为多个逗号分开 -->
        <property name="schemas">db_store,db_user</property>
        <!-- 表级 DML 权限设置 -->
        <!-- 		
        <privileges check="false">
            <schema name="db_user" dml="0110" >
                <table name="users" dml="1111"></table>  IUSD
                <table name="useraddres" dml="1110"></table>
            </schema>
        </privileges>		
        -->
    </user>
    <!-- 新建的用户 -->
    <!-- <user name="user"> -->
        <!-- <property name="password">user</property> -->
        <!-- <property name="schemas">TESTDB</property> -->
        <!-- <property name="readOnly">true</property> -->
    <!-- </user> -->
</mycat:server>
```

**4.创建库、表语句**

①db_store 库、表

```java
CREATE DATABASE  db_store DEFAULT CHARACTER SET utf8 COLLATE utf8_general_ci;
use db_store;
-- ----------------------------
-- Table structure for employee
-- ----------------------------
DROP TABLE IF EXISTS employee;
CREATE TABLE employee (
  employeeID int(11) NOT NULL,
  userName varchar(16) COLLATE utf8_bin DEFAULT NULL,
  phoneNum varchar(32) COLLATE utf8_bin DEFAULT NULL,
  age int(11) DEFAULT NULL,
  createTime datetime DEFAULT NULL,
  lastUpdate datetime DEFAULT NULL,
  PRIMARY KEY (employeeID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;
-- ----------------------------
-- Table structure for store
-- ----------------------------
DROP TABLE IF EXISTS store;
CREATE TABLE store (
  storeID int(11) NOT NULL,
  storeName varchar(32) COLLATE utf8_bin DEFAULT NULL,
  storeAddress varchar(256) COLLATE utf8_bin DEFAULT NULL,
  createTime datetime DEFAULT NULL,
  lastUpdate datetime DEFAULT NULL,
  PRIMARY KEY (storeID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;
```

②db_user 库、表

```java
CREATE DATABASE db_user DEFAULT CHARACTER SET utf8 COLLATE utf8_general_ci;
use db_user;
-- ----------------------------
-- Table structure for data_dictionary
-- ----------------------------
DROP TABLE IF EXISTS data_dictionary;
CREATE TABLE data_dictionary (
  dataDictionaryID int(11) NOT NULL COMMENT '数据字典ID',
  displayName varchar(32) COLLATE utf8_bin DEFAULT NULL COMMENT '显示名称',
  value varchar(255) COLLATE utf8_bin DEFAULT NULL COMMENT '数据字典取值',
  createTime datetime DEFAULT NULL COMMENT '创建时间',
  lastUpdate datetime DEFAULT NULL COMMENT '最后更新时间',
  PRIMARY KEY (dataDictionaryID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;
-- ----------------------------
-- Table structure for user_address
-- ----------------------------
DROP TABLE IF EXISTS user_address;
CREATE TABLE user_address (
  addressID int(11) NOT NULL COMMENT '地址ID',
  receiver varchar(16) COLLATE utf8_bin DEFAULT NULL COMMENT '收货人',
  addressDetail varchar(32) COLLATE utf8_bin DEFAULT NULL COMMENT '地址详细',
  userID int(11) NOT NULL COMMENT '用户ID',
  createTime datetime DEFAULT NULL COMMENT '创建时间',
  lastUpdate datetime DEFAULT NULL COMMENT '最后更新时间',
  PRIMARY KEY (addressID,userID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;
-- ----------------------------
-- Table structure for users
-- ----------------------------
DROP TABLE IF EXISTS users;
CREATE TABLE users (
  userID int(11) NOT NULL COMMENT '用户ID',
  username varchar(16) COLLATE utf8_bin DEFAULT NULL COMMENT '用户名',
  phoneNum varchar(32) COLLATE utf8_bin DEFAULT NULL COMMENT '手机号码',
  age int(11) DEFAULT NULL COMMENT '年龄',
  ddID int(11) DEFAULT NULL COMMENT '所属会员类型',
  createTime datetime DEFAULT NULL COMMENT '注册时间',
  lastUpdate datetime DEFAULT NULL COMMENT '最后更新时间',
  PRIMARY KEY (userID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;
```

**5.插入数据语句**

①db_store 库

**store 表** 数据(主从复制)

```java
INSERT INTO store (storeID, storeName, storeAddress, createTime, lastUpdate) VALUES (1, '深圳宝安区圣淘沙店', '宝安区圣淘沙骏园5栋18号商铺', '20170413101010', '20170413101010');
INSERT INTO store (storeID, storeName, storeAddress, createTime, lastUpdate) VALUES (2, '深圳罗湖区红宝路1店', '罗湖区红宝路112号', '20170330101010', '20170330101010');
INSERT INTO store (storeID, storeName, storeAddress, createTime, lastUpdate) VALUES (3, '深圳福田区梅华路店', '福田区上梅林梅华路上梅林菜场斜对面', '20170330101010', '20170330101010');
INSERT INTO store (storeID, storeName, storeAddress, createTime, lastUpdate) VALUES (4, '深圳福田区景田店', '福田区景田西住宅区七栋首层(民润超对面)', '20170330101010', '20170330101010');
INSERT INTO store (storeID, storeName, storeAddress, createTime, lastUpdate) VALUES (5, '深圳宝安区富通苑店', '宝安区新安街道48区富通苑A栋115号', '20170413101010', '20170413101010');
INSERT INTO store (storeID, storeName, storeAddress, createTime, lastUpdate) VALUES (6, '深圳罗湖区海富花园店', '罗湖区深南东路海富花园福怡阁底层A8铺', '20170330101010', '20170330101010');
INSERT INTO store (storeID, storeName, storeAddress, createTime, lastUpdate) VALUES (7, '深圳龙岗区四季花城店', '龙岗区坂田四季花城B19号商铺', '20180131101010', '20180131101010');
INSERT INTO store (storeID, storeName, storeAddress, createTime, lastUpdate) VALUES (8, '深圳南山区蔚蓝海岸店', '南山区登良路蔚蓝海岸商铺B09号', '20170330101010', '20170330101010');
INSERT INTO store (storeID, storeName, storeAddress, createTime, lastUpdate) VALUES (9, '深圳福田区中康路店', '福田区上梅林中康路梅林医院斜对面振业梅苑B栋110号', '20170330101010', '20170330101010');
INSERT INTO store (storeID, storeName, storeAddress, createTime, lastUpdate) VALUES (10, '深圳罗湖区松泉山庄店', '罗湖区太白路松泉山庄4栋6栋楼裙碧涟阁首层商场103-3号铺', '20170330101010', '20170330101010');
INSERT INTO store (storeID, storeName, storeAddress, createTime, lastUpdate) VALUES (11, '深圳福田区沙嘴店', '福田区沙嘴村1坊96号', '20170330101010', '20170330101010');
INSERT INTO store (storeID, storeName, storeAddress, createTime, lastUpdate) VALUES (12, '深圳宝安区桃源居3店', '宝安区前进路桃源居48区', '20170330101010', '20170330101010');
INSERT INTO store (storeID, storeName, storeAddress, createTime, lastUpdate) VALUES (13, '深圳南山区学府店', '南山区后海大道西宏观苑商铺', '20170330101010', '20170330101010');
INSERT INTO store (storeID, storeName, storeAddress, createTime, lastUpdate) VALUES (14, '深圳福田区车公庙店', '福田区泰然工贸园四路105栋首层(泰康轩旁)', '20170330101010', '20170330101010');
INSERT INTO store (storeID, storeName, storeAddress, createTime, lastUpdate) VALUES (15, '深圳福田区金地店', '福田区金地一路金海丽名居102号商铺', '20170330101010', '20170330101010');
INSERT INTO store (storeID, storeName, storeAddress, createTime, lastUpdate) VALUES (16, '深圳罗湖区龙园山庄店', '罗湖区龙园山庄1栋102A', '20170330101010', '20170330101010');
INSERT INTO store (storeID, storeName, storeAddress, createTime, lastUpdate) VALUES (17, '深圳福田区天然居店', '福田区翔名苑B—8A商铺', '20170330101010', '20170330101010');
INSERT INTO store (storeID, storeName, storeAddress, createTime, lastUpdate) VALUES (18, '深圳宝安区三联路店', '宝安区龙华镇三联路181号一楼右层', '20170330101010', '20170330101010');
INSERT INTO store (storeID, storeName, storeAddress, createTime, lastUpdate) VALUES (19, '深圳宝安区深业新岸线店', '宝安区深业新岸线2栋11号铺', '20170413101010', '20170413101010');
INSERT INTO store (storeID, storeName, storeAddress, createTime, lastUpdate) VALUES (20, '深圳宝安区风和日丽店', '宝安区龙华镇丰润花园13栋21号铺', '20171016101010', '20171016101010');
INSERT INTO store (storeID, storeName, storeAddress, createTime, lastUpdate) VALUES (21, '深圳龙岗区茂盛路店', '龙岗区横岗镇茂盛路16号', '20170330101010', '20170330101010');
INSERT INTO store (storeID, storeName, storeAddress, createTime, lastUpdate) VALUES (22, '深圳南山区西海湾店', '南山区南商路西海湾花园单身公寓A4号商铺', '20170330101010', '20170330101010');
INSERT INTO store (storeID, storeName, storeAddress, createTime, lastUpdate) VALUES (23, '深圳南山区招商海月店', '南山区后海路招商海月花园24栋1-1', '20170330101010', '20170330101010');
INSERT INTO store (storeID, storeName, storeAddress, createTime, lastUpdate) VALUES (24, '深圳罗湖区布心店', '罗湖区布心村太白路1号', '20170330101010', '20170330101010');
INSERT INTO store (storeID, storeName, storeAddress, createTime, lastUpdate) VALUES (25, '深圳宝安区美丽365花园店', '宝安区龙华镇东环一路美丽365花园B2栋102商铺', '20170330101010', '20170330101010');
INSERT INTO store (storeID, storeName, storeAddress, createTime, lastUpdate) VALUES (26, '深圳南山区阳光棕榈园店', '南山区阳光棕榈园商业街九栋105室', '20180404101010', '20180404101010');
INSERT INTO store (storeID, storeName, storeAddress, createTime, lastUpdate) VALUES (27, '深圳宝安区天骄店', '宝安区天骄世家花园125#商铺', '20170330101010', '20170330101010');
INSERT INTO store (storeID, storeName, storeAddress, createTime, lastUpdate) VALUES (28, '深圳宝安区东源阁店', '宝安区龙华镇东环二路东源阁C区一栋112商铺', '20170330101010', '20170330101010');
INSERT INTO store (storeID, storeName, storeAddress, createTime, lastUpdate) VALUES (29, '深圳福田区中信广场店', '福田区同心路铺尾村54栋103号商铺', '20170330101010', '20170330101010');
INSERT INTO store (storeID, storeName, storeAddress, createTime, lastUpdate) VALUES (30, '深圳福田区碧海云天店', '福田白石洲路以北红树东方家园15栋一层商场10#', '20170330101010', '20170330101010');
INSERT INTO store (storeID, storeName, storeAddress, createTime, lastUpdate) VALUES (31, '深圳宝安区建安新村店', '宝安区西乡镇上川路建安新村104号铺', '20170413101010', '20170413101010');
```

**employee表** 数据(主从复制)

```java
insert employee (employeeID,userName,phoneNum,age,createTime,lastUpdate ) value (1,"张三","13611111111",21,'2018-10-10 11:31:23','2018-10-10 11:31:23'); 
insert employee (employeeID,userName,phoneNum,age,createTime,lastUpdate ) value (2,"李四","13622222222",22,'2018-10-10 11:31:23','2018-10-10 11:31:23'); 
insert employee (employeeID,userName,phoneNum,age,createTime,lastUpdate ) value (3,"王五","13633333333",23,'2018-10-10 11:31:23','2018-10-10 11:31:23'); 
insert employee (employeeID,userName,phoneNum,age,createTime,lastUpdate ) value (4,"赵六","13644444444",24,'2018-10-10 11:31:23','2018-10-10 11:31:23'); 
insert employee (employeeID,userName,phoneNum,age,createTime,lastUpdate ) value (5,"田七","13655555555",25,'2018-10-10 11:31:23','2018-10-10 11:31:23'); 
```

②db_user 库

**users表** 数据

```java
INSERT INTO users(userID,userName,phoneNum,age,ddID,createTime,lastUpdate) VALUES ('1', '张1', '13611111111', '31', '2', '2018-10-10 13:39:41', '2018-10-10 13:39:41');
INSERT INTO users(userID,userName,phoneNum,age,ddID,createTime,lastUpdate) VALUES ('2', '王二', '13622222222', '32', '5', '2018-10-10 13:39:41', '2018-10-10 13:39:41');
INSERT INTO users(userID,userName,phoneNum,age,ddID,createTime,lastUpdate) VALUES ('3', '李三', '13633333333', '33', '3', '2018-10-10 13:39:41', '2018-10-10 13:39:41');
INSERT INTO users(userID,userName,phoneNum,age,ddID,createTime,lastUpdate) VALUES ('4', '赵四', '13644444444', '34', '1', '2018-10-10 13:39:41', '2018-10-10 13:39:41');
INSERT INTO users(userID,userName,phoneNum,age,ddID,createTime,lastUpdate) VALUES ('5', '田五', '13655555555', '35', '3', '2018-10-10 13:39:41', '2018-10-10 13:39:41');
```

**user_address表** 数据

```java
INSERT INTO user_address(addressID,receiver,addressDetail,userID,createTime,lastUPdate) VALUE ('1', '张一', '深圳南山科技园', '1', '2018-10-10 13:39:41', '2018-10-10 13:39:41');
INSERT INTO user_address(addressID,receiver,addressDetail,userID,createTime,lastUPdate) VALUE ('2', '张一', '深圳龙华地铁站', '1', '2018-10-10 13:39:41', '2018-10-10 13:39:41');
INSERT INTO user_address(addressID,receiver,addressDetail,userID,createTime,lastUPdate) VALUE ('3', '王二', '长沙麓谷软件园', '2', '2018-10-10 13:39:41', '2018-10-10 13:39:41');
INSERT INTO user_address(addressID,receiver,addressDetail,userID,createTime,lastUPdate) VALUE ('4', '赵四', '长沙麓谷企业广场', '4', '2018-10-10 13:46:36', '2018-10-10 13:46:36');
INSERT INTO user_address(addressID,receiver,addressDetail,userID,createTime,lastUPdate) VALUE ('5', '李三', '深圳福田侨香', '3', '2018-10-10 13:46:36', '2018-10-10 13:46:36');
```

**data_dictionary表** 数据

```java
INSERT INTO data_dictionary(dataDictionaryID,displayName,value,createTime,lastUpdate) VALUE ('1', '白银', 'BY', '2018-10-10 13:39:41', '2018-10-10 13:39:41');
INSERT INTO data_dictionary(dataDictionaryID,displayName,value,createTime,lastUpdate) VALUE ('2', '黄金', 'HJ', '2018-10-10 13:39:41', '2018-10-10 13:39:41');
INSERT INTO data_dictionary(dataDictionaryID,displayName,value,createTime,lastUpdate) VALUE ('3', '砖石', 'ZS', '2018-10-10 13:39:41', '2018-10-10 13:39:41');
INSERT INTO data_dictionary(dataDictionaryID,displayName,value,createTime,lastUpdate) VALUE ('4', '大师', 'DS', '2018-10-10 13:39:41', '2018-10-10 13:39:41');
INSERT INTO data_dictionary(dataDictionaryID,displayName,value,createTime,lastUpdate) VALUE ('5', '王者', 'WZ', '2018-10-10 13:39:41', '2018-10-10 13:39:41');
```
