# 05、Solr：配置从mysql同步数据
- 来源：https://ddkk.com/zhuanlan/search/solr/2/5.html
- 分类：搜索引擎
- 分组：Solr 实战 (A)
## 0. 引言

上一节我们已经配置了新的索引，但是数据还是手动添加的，并没有实现自动从数据库同步，所以这一节，继续来实现从mysql同步数据到solr

## 1. 数据准备

**1、** 要配置数据库同步，首先我们要确保我们`managed-schema`或者`schema.xml`配置文件中配置的字段和数据库中是能够对应的上的；

订单表：

为了模拟关联表同步的效果，我们再创建一张标签子表：

订单标签表

```sql
CREATE TABLE orders (
  id bigint NOT NULL,
  order_no varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  product_name varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  create_time datetime DEFAULT NULL,
  create_user varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  remarks varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  status int DEFAULT NULL,
  address varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
CREATE TABLE orders_label (
  id int NOT NULL,
  name varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  order_id bigint DEFAULT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
```

再准备一些数据

```sql
# 订单表
INSERT INTO orders (id, order_no, product_name, create_time, create_user, remarks, status, address) VALUES (1, '202306010001', '苹果', '2023-06-01 23:22:26', 'mike', '送货上门，不想下楼', 1, '贵阳市观山湖xxx路');
INSERT INTO orders (id, order_no, product_name, create_time, create_user, remarks, status, address) VALUES (2, '202306010002', '凤梨', '2023-05-09 23:23:12', 'lili', '挑大个的', 1, '贵阳市花溪区ttt路');
INSERT INTO orders (id, order_no, product_name, create_time, create_user, remarks, status, address) VALUES (3, '202306010003', '草莓', '2023-06-01 23:24:20', 'ben', '要红的，注意新鲜', 2, '无锡市滨湖区yyy路');
# 标签表
INSERT INTO orders_label (id, name, order_id) VALUES (1, '送货上门', 1);
INSERT INTO orders_label (id, name, order_id) VALUES (2, '生鲜', 1);
INSERT INTO orders_label (id, name, order_id) VALUES (3, '24小时', 1);
INSERT INTO orders_label (id, name, order_id) VALUES (4, '生鲜', 2);
INSERT INTO orders_label (id, name, order_id) VALUES (5, '保质服务', 2);
INSERT INTO orders_label (id, name, order_id) VALUES (6, '生鲜', 3);
INSERT INTO orders_label (id, name, order_id) VALUES (7, '24小时', 3);
```

## 2. 数据同步配置文件详解

我们实现数据同步的核心在于配置同步配置文件，该配置文件的核心标签和属性如下

dataSource 标签

> 用于声明同步的数据库地址、账号、密码、驱动器等连接信息
>
> 其中batchSize表示每次读取数据库的数量，-1表示不限制，如果同步的数据量较大，可以设置每次读取的限制，防止solr一次性建立索引数据过多导致的内存溢出问题
>
> dataSource标签可以配置多个，用于声明多个数据源，比如需要跨库链接查询时使用，可以通过name标签声明数据库名称

```xml
<dataSource driver="com.mysql.cj.jdbc.Driver"
url="jdbc:mysql://192.168.244.50:3306/test?useUnicode=true&characterEncoding=UTF8&autoReconnect=true&zeroDateTimeBehavior=convertToNull"
name="test"
user="root" 
password="123456" 
batchSize="-1"/>
```

document 标签

> document标签用于声明主要文档配置，核心子标签是entity

entity 标签

entity标签就是用来声明我们要同步的sql以及字段映射的，核心的属性如下

> name 定义对应的solr中索引/核心名称
> pk 主键字段名称，确保实体每一条记录唯一
> dataSource 数据源，如果只有一个数据源时可以不用配置，与dataSource标签中的name属性对应
> query 定义全量同步时的查询sql
> deltaImportQuery 定义增量同步时的查询sql，自带的${dataimporter.delta.id}属性表示正在同步的数据的主键
> deltaQuery 定义需要增量同步的id, d a t a i m p o r t e r . d e l t a . i d 的值也就来源于此， {dataimporter.delta.id}的值也就来源于此， dataimporter.delta.id的值也就来源于此，{dataimporter.last_index_time}表示上一次完成增量同步的时间，由系统自动记录生成

```xml
<entity name="orders"
query="select id,order_no,product_name,create_time,create_user,remarks,status,address from orders"
deltaImportQuery="select id,order_no,product_name,create_time,create_user,remarks,status,address from orders WHERE id='${dataimporter.delta.id}'"
deltaQuery="SELECT id FROM orders WHERE create_time >= '${dataimporter.last_index_time}'">
<field name="id" column="id"/>
<field name="order_no" column="order_no"/>
<field name="product_name" column="product_name"/>
<field name="create_time" column="create_time"/>
</entity>
```

## 3. 实操

**1、** 修改`solrconfig.xml`配置文件，配置数据库同步配置文件；

```java
# 进入solr安装目录
cd /data/solr-8.2.0
# orders是上一节创建的索引/核心 文件夹
vim server/solr/orders/solrconfig.xml
```

添加如下内容

```xml
<lib dir="${solr.install.dir:../../../..}/dist/" regex="solr-dataimporthandler-.*\.jar" />
<lib dir="${solr.install.dir:../../../..}/dist/" regex="mysql-connector-java-.*\.jar" />
<requestHandler name="/dataimport" class="org.apache.solr.handler.dataimport.DataImportHandler">
 <lst name="defaults">
    <str name="config">data-config.xml</str>
 </lst>
</requestHandler>
```

**2、** 在`server/solr/orders`下创建`data-config.xml`配置文件；

这里需要注意，如果要配置父子表同步时再定义一个``标签即可，其中的``中的`name`要与`maneged-schema`文件中定义的`labels`保持一致，具体如下

```xml
<entity name="lables" pk="id" 
        query="select name from orders_label where order_id = '${orders.id}'">
        <field name="labels" column="name"/>
</entity>
```

完整配置文件：

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<dataConfig>
    <dataSource driver="com.mysql.cj.jdbc.Driver"
                url="jdbc:mysql://192.168.244.50:3306/test?useUnicode=true&characterEncoding=UTF8&autoReconnect=true&zeroDateTimeBehavior=convertToNull&serverTimezone=UTC&tinyInt1isBit=false"
                user="root" password="123456" batchSize="-1"/>
    <document>
        <entity name="orders"
                query="select id,order_no,product_name,create_time,create_user,remarks,status,address from orders"
                deltaImportQuery="select id,order_no,product_name,create_time,create_user,remarks,status,address from orders WHERE id='${dataimporter.delta.id}'"
                deltaQuery="SELECT id FROM orders WHERE create_time >= '${dataimporter.last_index_time}'">
            <field name="id" column="id"/>
            <field name="order_no" column="order_no"/>
            <field name="product_name" column="product_name"/>
            <field name="create_time" column="create_time"/>
            <field name="create_user" column="create_user"/>
            <field name="remarks" column="remarks"/>
            <field name="status" column="status"/>
            <field name="address" column="address"/>
            <entity name="lables" pk="id" 
              query="select name from orders_label where order_id = '${orders.id}'">
                <field name="labels" column="name"/>
            </entity>
         </entity>
    </document>
</dataConfig>
```

**3、** 在`server/solr/orders/conf/`下创建`dataimport.properties`配置文件；

```java
mkdir -p /data/solr-8.2.0/server/solr/orders/conf/
vim /data/solr-8.2.0/server/solr/orders/conf/dataimport.properties
```

配置内容为最后同步的时间，如果不填将会自动生成

```java
orders.last_index_time=2023-06-04 02\:25\:05
```

**4、** 添加`jar`包，因为我演示的数据库是mysql8.0，所以需要引入`com.mysql.cj.jdbc.Driver`的驱动器jar包，同时还要引入同步用的jar包`solr-dataimporthandler*`；

（1）将`solr安装路径/dist`目录下的两个`solr-dataimporthandler*` jar包复制到`server/solr-webapp/WEB-INF/lib`下

```java
cd /data/solr-8.2.0 
cp dist/solr-dataimporthandler-* server/solr-webapp/webapp/WEB-INF/lib/
```

（2）将数据库驱动jar包（自己下载）也添加到`server/solr-webapp/webapp/WEB-INF/lib`下

> 我这里因为采用的是mysql8.0，所以传输8.0版本的驱动器jar包

**5、** 重启solr；

**6、** 在solr-admin管理页面，`Dataimport`菜单中执行同步操作，选择`full-import`，第一次同步进行一次全量同步；

**7、** 如果发现没有同步成功，可以在`Logging`页面查看日志，点击具体的日志即可查看详情，如下所示，根据具体日志进行问题排查；

同时也可在服务端日志`server/logs/solr.log`中查询详细报错堆栈信息

**8、** 同步成功后，在输出页面会有绿色的标识，并告知同步了多少条数据；

**9、** 在`Query`菜单，查询全部数据，发现同步成功！；

**10、** 数据库新增一条数据；

**11、** 在solr-admin中点击`delta-import`进行增量同步，结果显示同步了一条新增数据；

查询可以看到新增的数据

至此，我们全量和增量同步都成功了！

## 4. 常见报错

## 1. Error creating document : SolrInputDocument

问题：

> Error creating document : SolrInputDocument(fields: [order_no=202306010001, address=贵阳市观山湖xxx路, create_time=2023-06-01 23:22:26.0, id=1, create_user=mike, product_name=苹果, remarks=送货上门，不想下楼, status=1, version=1767733224539160576])

解决：
从问题可以看到同步数据时出现了问题，没有写入数据，这一般是字段配置的问题，但是如果仅仅只是猜测的话，可能会花费较多的时间，这时候我们可以查看solr服务端日志，了解具体的报错详情

```java
tail -500f /data/solr-8.2.0/server/logs/solr.log
```

从上述日志可以看到是因为有一个必填字段`labels`，但是没有传值进来，导致新增数据失败

修改`managed-schema`或者`schema.xml`文件，将该字段设置为非必填即可

修改完重启solr，再重新同步即可

## 2. Could not write property file

问题：
solr-admin中查看Logging，发现报错`DocBuilder Could not write property file`

解决：

**1、** 查看详细的服务日志；

```java
tail -500f /data/solr-8.2.0/server/logs/solr.log
```

**2、** 通过日志可以看到是`FileNotFoundException:/data/solr-8.2.0/server/solr/orders/conf/dataimport.properties`；

这就非常清晰了，dataimport.properties 文件未找到，我们创建一个即可

```java
mkdir -p /data/solr-8.2.0/server/solr/orders/conf/
touch /data/solr-8.2.0/server/solr/orders/conf/dataimport.properties
```

**3、** 重启solr即可；

## 5. 总结

mysql同步solr的核心在于配置文件的书写，当发现有错误时，可以通过服务端日志排查具体错误。

但数据同步还未完成，我们目前还没有实现自动的同步，还需要手动点击同步，下一节继续讲解，solr从mysql自动同步数据
