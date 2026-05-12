# 01、Solr速成之配置文件
- 来源：https://ddkk.com/zhuanlan/search/solr/3/1.html
- 分类：搜索引擎
- 分组：Solr 教程 (A)
## 什么是solr

Solr是一个独立的企业级搜索应用服务器，它对外提供类似于Web-service的API接口。用户可以通过http请求，向搜索引擎服务器提交一定格式的XML文件，生成索引；也可以通过Http Get操作提出查找请求，并得到XML格式的返回结果

## solr的特点

Solr是一个高性能，采用Java开发，Solr基于Lucene的全文搜索服务器。同时对其进行了扩展，提供了比Lucene更为丰富的查询语言，同时实现了可配置、可扩展并对查询性能进行了优化，并且提供了一个完善的功能管理界面，是一款非常优秀的全文搜索引擎.文档通过Http利用XML 加到一个搜索集合中。Solr查询该集合也是通过http收到一个XML/JSON响应来实现。它的主要特性包括：高效、灵活的缓存功能，垂直搜索功能，高亮显示搜索结果，通过索引复制来提高可用性，提供一套强大Data Schema来定义字段，类型和设置文本分析，提供基于Web的管理界面等。

## 什么是Lucene？

Lucene是apache软件基金会 jakarta项目组的一个子项目，是一个开放源代码的全文检索引擎工具包，即它不是一个完整的全文检索引擎，而是一个全文检索引擎的架构，提供了完整的查询引擎和索引引擎，部分文本分析引擎（英文与德文两种西方语言）.Lucene的目的是为软件开发人员提供一个简单易用的工具包，以方便的在目标系统中实现全文检索的功能，或者是以此为基础建立起完整的全文检索引擎。Solr和Lucene的本质区别有以下三点：搜索服务器，企业级和管理。Lucene本质上是搜索库，不是独立的应用程序，而Solr是。Lucene专注于搜索底层的建设，而Solr专注于企业应用。Lucene不负责支撑搜索服务所必须的管理，而Solr负责。所以说，一句话概括Solr: Solr是Lucene面向企业搜索应用的扩展。

## Solr服务原理

Solr对外提供标准的http接口来实现对数据的索引的增加、删除,修改,查询。在Solr中，用户通过向部署在servlet 容器中的Solr Web应用程序发送 HTTP 请求来启动索引和搜索。Solr接受请求，确定要使用的适当SolrRequestHandler，然后处理请求。通过 HTTP 以同样的方式返回响应。默认配置返回Solr的标准 XML 响应，也可以配置Solr的备用响应格式。

## 配置文件schema.xml

schema.xml 是用来定义索引数据中的域的，包括域名称，域类型，域是否索引，是否分词，是否存储，是否标准化即 Norms ，是否存储项向量等等。

schema.xml下有两个标签 field和fieldType,field定义域,fieldType定义域类型

```xml
<field name="id" type="string" indexed="true" stored="true" required="true" multiValued="false" /> 
```

name表示域名称 必须有

type表示域类型的名称,与fieldType元素的name属性值对应,必须有

indexed true表示需要对该域进行索引,一般当你需要在该域上进行查询或排序时,则需要配置为true,默认false

stored 是否需要把值存储到硬盘上,方便你后续查询时,能再次提取出来原样显示给客户

docValues 表示此域是否需要添加一个docValues域,这对facet查询,group分组,排序,function查询有好处,尽管这个属性

不是必须的,但他能加快索引数据加载,对NRT近实时搜索比较好,且更节省内存, 但他也有一些限制,比如当前

docValues域只支持strField,UUIDField Trie*Field等域,且要求域的域值是单值不能是多域值

multiValued 表示这个域是否可以存储多个值,若设置为true,即表示这是一个多值域

omitNorms 此属性若设置为true,即表示将忽略域值的长度标准化,忽略在索引过程中对当前域的权重设置,且会节省内存

,只有全文本域或者你需要在索引创建过程中设置域的权重时才需要把这个值设为false,对于基本数据类型且不可

分词的域如,intField.longField,StrField等默认属性值就是true,否则默认就是false.

termVectors 设置为true即表示需要为该field存储项向量信息,当你需要MoreLikeThis功能时,则需要将此属性值设为true

这样会带来一些性能提升

termPositions 是否存储Term的起始位置信息,,这会增加索引的体积,但高亮度功能需要依赖此项设置否则无法高亮

termOffsets 表示是否存储索引的位置偏移量,高亮功能需要此项配置,当你使用SpanQuery时,此项配置会影响匹配的结果集

field里还有两个比较难理解的域,是Solr扩展的,在Lucene中没有的概念,即dynamicField

动态域和copyField复制域

动态域的属性配置跟普通的field差不多,区别就是name的属性值,可以使用通配符,这样就可以模糊匹配多个域啦遮掩设计的目的就是不用频繁的去修改schema.xml中的field配置去增加field域啦,比如之前有个link_s域,某一天你想再增加一个url_s域,那你就需要去修改schema.xml配置文件,由于schema.xml修改过后需要重启tomcat才能生效,重启即意味着程序的中断,这往往是不可接受的所以引入动态域来避免频繁的添加修改域,但前提是你的域需要符合你提前定义的动态域的域名称命名规则

复制域即表示把某个域的值复制到另一个目标域上面,那如果把多个域的值复制到一个目标域上面,你可以进行多次复制,体现到xml配置上就是类似这样的配置:

```xml
<copyField source="title" dest="text"/>
<copyField source="body" dest="text"/>
```

如上配置就是表示把title和body这两个域的值全部复制到text这个新域上面要注意的是,如果只是复制单个域,那么如果你被复制域本身就是多值域,那么目标域也是多值域,这毋容置疑,那如果你复制的域是多个域,只要其中有一个域是多值域,那么目标域就一定是多值域.

## 配置文件solrconfig

solrconfig.xml配置包含了很多solr自身配置相关的参数,分为以下几块

**1、** 依赖的lucene版本配置,这决定了你创建的lucene索引结构,因为lucene各版本之间的索引结构并不是完全兼容的；

```xml
<luceneMatchVersion>5.3.1</luceneMatchVersion>
```

**2、** 索引创建相关的配置,如索引目录,IndexWriterConfig类中的相关配置(它决定了你的索引创建性能)；

```xml
<filter class="solr.LimitTokenCountFilterFactory"
maxTokenCount="10000"/><writeLockTimeout>1000</writeLockTimeout>
```

```bash
maxTokenCount即在对某个域分词的时候,最多只提取前10000个Token,后续的域值将被抛弃
```

writeLockTimeout表示IndexWriter实例在获取写锁的时候最大等待超时时间,超过指定的超时时间仍未获取

到写锁,则indexWriter写索引操作将会抛出异常

```xml
<maxIndexingThreads>8<maxIndexingThreads>
```

表示创建索引的最大线程数,默认是开辟8个线程开创建索引

```xml
<ramBufferSizeMB>100</ramBufferSizeMB>
```

表示创建索引时内存缓存大小,单位是MB,默认最大是100MB

```xml
<ramBufferedDocs>1000</ramBufferedDocs>
```

表示在document写入硬盘之前,缓存的document最大个数,超过这个最大值会触发索引的flush操作

**3、** solrconfig.xml中依赖的外部jar包加载路径配置；

如:

```xml
<lib dir="./lib" regex="lucene-\w+\.jar"/>
```

这里的dir表示一个jar包目录路径,该目录路径是相对于你当前core根目录的;regex表示一个正则表达式,是用来过滤文件名的.

```xml
<dataDir>${solr.data.dir:}</dataDir>
```

如果solr_home下不存在core的话,那dataDir默认就是相对于solr_home

**4、** 缓存相关配置,缓存包括过滤器缓存,查询结果集缓存,Document缓存,以及自定义缓存等；

```xml
<filterCache class="solr.FastLRUCache"
             size="512"
             initialSize="512"
             autowarmCount="0"/>
```

用来配置filter过滤器的缓存相关的参数

```xml
<queryResultCache class="solr.LRUCache"
             size="512"
             initialSize="512"
             autowarmCount="0"/>
```

用来配置对Query返回的查询结果集即TopDocs的缓存

```xml
<documentCache class="solr.LRUCache"
           size="512"
           initialSize="512"
           autowarmCount="0"/>
```

用来配置对Document中存储域的缓存,因为每次从硬盘上加载存储域的值

都是很昂贵的操作,这里说的存储域指的是那些store.YES的Field.

**6、** updateHandler配置即索引更新操作相关配置；

```xml
<updateHandler class="solr.DirectUpdateHandler2">
```

指定索引更新操作处理类,directUpdateHandler2是一个高性能的索引更新处理类,它支持软提交

```xml
<updateLog>
  <str name="dir">${solr.ulog.dir:}</str>
</updateLog>
```

设置索引库更新日志.默认路径为solr_home下面的data/tlog

```bash
<autoCommit> 
<maxTime>15000</maxTime> 
<maxDocs>10000</maxDocs>
<openSearcher>false</openSearcher> 
</autoCommit>
```

自动赢提交方式:

maxTime;设置多长时间提交一次

maxDocs;设置达到多少文档提交一次

openSearcher;文档提交后是否开启新的searcher,如果false,文档只是提交到index

索引库,搜索结果中搜不到此次提交的文档如果true,既提交到index索引库,也能在搜索结果

中搜索到此次提交的内容

**7、** requestHandler相关配置,即接受客户端http请求的处理类配置,输入的请求会通过请求中的路径被转发到特定的处理器；

```bash
<requestHandler name="/query" class="solr.SearchHandler">
 <lst name="defaults">
   <str name="echoParams">explicit</str>
   <str name="wt">json</str>
   <str name="indent">true</str>
 </lst>
</requestHandler>
```

这个requestHandler配置的是请求URL /query跟请求处理类SearcherHandler之间的一个映射关系

，即你访问http://localhost:8080/solr/coreName/query?q=xxx时，会交给SearcherHandler类来处理这个http请求，

你可以配置一些参数来干预SearcherHandler处理细节，

比如echoParams表示是否打印HTTP请求参数，wt即writer type,即返回的数据的MIME类型，如json,xml等等，

indent表示返回的json或者XML数据是否需要缩进，否则返回的数据没有缩进也没有换行，不利于阅读
