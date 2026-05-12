# 09、ElasticSearch 实战：讲透document看这篇文章就够了
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/3/9.html
- 分类：搜索引擎
- 分组：教程目录
### 1、document的核心元数据

我们针对一次查询结果来解析它的元数据

#### (1) _index元数据

1个index等同于1张数据库表，index名称等同于表名

index名称必须小写，不能用下划线开头，不能包含逗号

#### (2) _type元数据

1个type等同于数据库表里的"类别"字段,用来区分不同类别的数据，例如商品索引里有书/报纸/海报的类别

不同type的document的fields要大体上一样，等同于1个表里面不同类别的数据使用的字段大体是一样的

type名称必须小写，不能用下划线开头，不能包含逗号

#### (3) _id元数据

代表document的唯一标识，等同于一行表数据的id，index和type和id一起可以定位1个document

生成document id的两种方式

1手动指定document的id：一般用于从其它系统导入数据到es中，就会使用已有数据的唯一标识来作为es中 document的id

2不手动指定，由es来生成：一般用于一个系统主要的数据存储就是es这一种，数据在塞进es之前本身就没有唯 一标识，此时可以由es来生成。自动生成的document的id，长度为20个字符，URL安全，base64编码，GUID，并行生成时不会发生冲突

#### (4) _source元数据

写入的document的json串会在查询结果的_resource中原封不动的返回，当然返回结果的字段也是可以定制的

```java
GET /product/book/1?_source=product_name,price
```

### 2、 document的全量替换

```java
#语法
PUT /product/book/1
{
	"product_name": "yuwen shu",
}
```

如果document id不存在，就是创建document，如果document id已经存在，就是全量替换原来document的json串

全量替换时，es会将旧的document标记为deleted，然后新增我们写入的document，当我们创建越来越多的document的时候，es会在适当的时机在后台自动删除被标记为deleted的document

### 3、document的删除(lazy delete机制)

```java
DELETE /product/book/1
```

不会直接删除，只会将其标记为deleted，当document越来越多的时候，在后台自动删除被标记为deleted的document
