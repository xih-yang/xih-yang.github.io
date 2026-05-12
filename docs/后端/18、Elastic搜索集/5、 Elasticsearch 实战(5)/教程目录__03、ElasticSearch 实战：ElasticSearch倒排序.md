# 03、ElasticSearch 实战：ElasticSearch倒排序
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/5/3.html
- 分类：搜索引擎
- 分组：教程目录
## 倒排序

### 数据格式

Elasticsearch是面向文档型数据库，一条数据在这里就是一个文档。为了方便大家理解，我们将Elasticsearch里存储文档数据和关系型数据库Mysql存储数据的概念进行一个类比

Eslsticsearch
index(索引)
Type(类型)
Document(文档)
Fields(字段)

Mysql
Database(数据库)
Table(表)
Row(行)
Column（列）

ES里面的Index可以看做一个库，而Types相当于表,Documents则相当于表的行。 这里Type的概念已经被逐渐弱化，Elasticsearch6.X中，一个index下已经只能包含一个type，Elasticsearch7.x中，`Type`的概念已经被删除了。

而弱化、甚至删除整个`Type`的原因就是其违背了`全文`检索的思想。

### 倒排索引

要理解倒排索引我们就要先考虑个问题，那是不是有正排索引？

#### 正排索引

正排序最好的理解其实就是我们的关系型数据库中的`mysql``innodedb` 引擎。例如下列数据。

id
content

1001
my name is zhangsan

1002
my name is lisi

mysql在存储是时候会根据主键索引将数据存放到磁盘上， 也就是主键索引定位到数据行，比如 `1001` 就能直接查询到 `my name is zhangsan`这一行数据。

简单来讲就是根据数据是索引直接定位到了数据就是正排（正向）索引。

#### 倒排索引

倒排索引是为能更好的进行检索而诞生的。同样以上面的数据为例。

id
content

1001
my name is zhangsan

1002
my name is lisi

倒排索引的处理会将数据中含有的关键字提出出来作为索引构建`key-value`的索引表， 而`key`就是关键字。存储的结构如下。

keyword
id

name
1001,1002

zhang san
1001

san
1001

li si
1002

所以倒排索引强调的是关键字和文档的关联，已经突破了表（Type）的概念。所以也就被弱化掉了。

### 抛砖引玉

以上是我自己的理解，可能存在问题，欢迎大家指正。
