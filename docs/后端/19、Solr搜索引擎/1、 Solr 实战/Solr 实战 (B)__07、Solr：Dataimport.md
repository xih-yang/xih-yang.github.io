# 07、Solr：Dataimport
- 来源：https://ddkk.com/zhuanlan/search/solr/2/21.html
- 分类：搜索引擎
- 分组：Solr 实战 (B)
可以使用 Solr 自带的 Dataimport 功能把数据库中数据快速导入到 solr 中

必须保证 managed-schema 和数据库中表的列对应

## 1.修改配置文件

修改 solrconfig.xml，添加下面内容

```xml
<!-- 配置数据导入的处理器 -->
<requestHandler name="/dataimport" class="org.apache.solr.handler.dataimport.DataImportHandler">
	<lst name="defaults">
		<!-- 加载 data-config.xml -->
		<str name="config">data-config.xml</str>
	</lst>
</requestHandler>
```

## 2.新建 data-config.xml

和 solrconfig.xml 同一目录下新建 data-config.xml

```xml
<?xml version="1.0" encoding="UTF-8"?>
<dataConfig>
	<dataSource type="JdbcDataSource" driver="com.mysql.jdbc.Driver" url="jdbc:mysql://192.168.51.241:3306/maven" user="root" password="root"/>
	<document>
		<entity name="product" query="SELECT id,name,price from product">
			<!-- 实现数据库的列和索引库的字段的映射 column 指定数据库的列表 name 指定索引库的字段名字，必须和 schema.xml 中定义的一样 -->
			<field column="id" name="id"/>
			<field column="name" name="name"/>
			<field column="price" name="price"/>
		</entity>
	</document>
</dataConfig>
```

## 3.添加 jar

向 solr-webapp 中添加三个 jar。在 dist 中两个还有一个数据库驱动。

## 4.操作

重启 solr 后，在可视化管理页面中进行数据导入

注意：

点击导入按钮后，要记得点击刷新按钮。
