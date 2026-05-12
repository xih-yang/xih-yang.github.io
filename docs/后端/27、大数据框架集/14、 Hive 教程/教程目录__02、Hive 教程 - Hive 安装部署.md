# 02、Hive 教程 - Hive 安装部署
- 来源：https://ddkk.com/zhuanlan/bigdata/hive/2/2.html
- 分类：大数据框架
- 分组：教程目录
## 1、前置安装 hadoop

参考：[Hadoop 分布式安装](https://blog.csdn.net/BeiisBei/article/details/103423562)

## 2、安装mysql数据库

参考：[手把手教你在Linux环境下安装JDK 1.8.0/Tomcat / MySQL（含字符编码集设置）亲测完美！](https://blog.csdn.net/BeiisBei/article/details/103196472)

## 3、安装hive

（1）把apache-hive-1.2.1-bin.tar.gz上传到linux的/opt/目录下

（2）解压apache-hive-1.2.1-bin.tar.gz到/opt/soft/目录下面

```java
tar –zxvf apache-hive-1.2.1.bin.tar.gz
```

（3）修改apache-hive-1.2.1-bin.tar.gz的名称为hive

```java
mv apache-hive-1.2.1-bin/ hive110
```

在hive110目录下新建一个文件夹warehouse

```java
mkdir /opt/soft/hive110/warehouse
```

（4）设置环境变量

```java
vi /etc/profile
```

加入：

```java
export HIVE_HOME=/opt/soft/hive110
export PATH=$PATH:$HIVE_HOME/bin
```

（5）进入conf文件目录下，修改`hive-site.xml`文件

删除里面内容，只留`` 节点

```java
<?xml version="1.0"?>
<?xml-stylesheet type="text/xsl" href="configuration.xsl"?>
<configuration>
        <property>
                <name>hive.metastore.warehouse.dir</name>
                <value>/opt/soft/hive110/warehouse</value>
        </property>
        <property>
                <name>hive.metastore.local</name>
                <value>true</value>
        </property>
        <property>
                <name>javax.jdo.option.ConnectionURL</name>
                <value>jdbc:mysql://192.168.56.137:3306/hive?createDatabaseIfNotExist=true</value>
        </property>
        <property>
                <name>javax.jdo.option.ConnectionDriverName</name>
                <value>com.mysql.jdbc.Driver</value>
        </property>
        <property>
                <name>javax.jdo.option.ConnectionUserName</name>
                <value>root</value>
        </property>
        <property>
                <name>javax.jdo.option.ConnectionPassword</name>
                <value>ok</value>
        </property>
</configuration>
```

## 4、mysql驱动包

下载mysql驱动包存放到`/opt/soft/hive110/lib`下

## 5、重新启动系统
