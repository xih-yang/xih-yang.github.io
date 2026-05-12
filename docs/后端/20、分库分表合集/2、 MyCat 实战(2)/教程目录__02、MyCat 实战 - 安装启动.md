# 02、MyCat 实战 - 安装启动
- 来源：https://ddkk.com/zhuanlan/sharding/mycat/2/2.html
- 分类：分库分表
- 分组：教程目录
## 2.1、安装

## 1、解压后 即可使用

解压缩文件拷贝到 linux 下 /usr/local/

## 2、三个配置文件

- schema.xml：定义逻辑库，表、分片节点等内容。
- rule.xml： 定义分片规则。
- server.xml：定义用户以及系统相关变量，如端口等。

## 2.2、启动

## 1、修改配置文件——server.xml

修改用户信息，与MySQL区分，如下：

```java
<user name="mycat">
    <property name="password">root</property>
    <property name="schemas">TESTDB</property>
</user>
```

## 2、件修改配置文件 schema.xml

删除标签间的表信息，标签只留一个，标签只留一个，只留一对

```java
<?xml version="1.0"?>
<!DOCTYPE mycat:schema SYSTEM "schema.dtd">
<mycat:schema xmlns:mycat="http://io.mycat/">
        <schema name="TESTDB" checkSQLschema="false" sqlMaxLimit="100" dataNode="dn1" >
        </schema>
        <dataNode name="dn1" dataHost="host1" database="db1" />
        <dataHost name="host1" maxCon="1000" minCon="10" balance="0" writeType="0"dbType="mysql" dbDriver="native" switchType="1"  slaveThreshold="100">
                <heartbeat>select user()</heartbeat>
                <writeHost host="hostM1" url="192.168.43.137:3306" user="root" password="root">
                        <readHost host="hostS2" url="192.168.43.139:3306" user="root" password="root" />
                </writeHost>
        </dataHost>
</mycat:schema>
```

## 3、验证数据库访问情况

Mycat 作为数据库中间件要和数据库部署在不同机器上，所以要验证远程访问情况。

```java
mysql -h 192.168.43.137 -P 3306 -uroot -p 
# 如远程访问报错，请建对应用户
GRANT ALL PRIVILEGES ON *.* TO 'root'@'%' IDENTIFIED BY 'root' WITH GRANT OPTION;
授权完成，重启才会生效
```

## 4、启动程序

1、控制台启动 ：去 mycat/bin 目录下执行 ./mycat console

2、后台启动 ：去 mycat/bin 目录下 ./mycat start

为了能第一时间看到启动日志，方便定位问题，我们选择1、控制台启动。

## 5、启动时可能出现报错

如果操作系统是 CentOS6.8，可能会出现域名解析失败错误，如下图

可以按照以下步骤解决

1、 用 vim 修改 /etc/hosts 文件， 在 127.0.0.1 后面增加你的机器名

2、 修改后重新启动网络服务

## 2.3、登录

## 1、登录后台管理窗口

```java
# 此登录方式用于管理维护 Mycat
mysql -umycat -proot -P 9066 -h 192.168.43.137
# 常用命令如下：
show database
show @@help
```

## 2、登录数据窗口

此登录方式用于通过 Mycat 查询数据，我们选择这种方式访问 Mycat

```java
mysql -umycat -proot -P 8066 -h 192.168.43.137
```
