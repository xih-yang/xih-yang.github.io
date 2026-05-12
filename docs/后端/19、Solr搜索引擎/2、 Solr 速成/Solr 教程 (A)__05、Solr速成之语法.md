# 05、Solr速成之语法
- 来源：https://ddkk.com/zhuanlan/search/solr/3/5.html
- 分类：搜索引擎
- 分组：Solr 教程 (A)
## 常用查询参数

q-查询字符串，必须的。

fl- 指定返回那些字段内容，用逗号或空格分隔多个。 start - 返回第一条记录在完整找到结果中的偏移位置，0开始。

rows - 指定返回结果最多有多少条记录，配合start来实现分页。

sort - 排序，示例：(inStock desc, price asc)表示先 “inStock”降序, 再 “price”升序，默认是相关性降序。

wt- (writer type)指定输出格式，可以有 xml, json, php, phps。 fq - (filter query )过虑查询，作用：在q查询符合结果中同时是fq查询符合的，例如：q=mm&fq=date_time:[20081001 TO 20091031]，找关键字mm，并且date_time是20081001到20091031之间的。

这两句是一样的意思

```java
query.setQuery("*:*");
query.set("q", "*:*"); 
```

以某个字段排序

```java
query.setSort("score_i",ORDER.desc);
```

q.op - 覆盖schema.xml的defaultOperator（有空格时用“AND”还是用“OR”操作逻辑），一般默认指定 “OR”

df- 默认的查询字段，一般默认指定

qt– (query type)指定那个类型来处理查询请求，一般不用指定，默认是standard。

indent - 返回的结果是否缩进，默认关闭，用 indent=true|on 开启，一般调试json,php,phps,ruby输出才有必要用这个参数。

version - 查询语法的版本，建议不使用它，由服务器指定默认值。

## Solrj的检索运算符

“:”指定字段查指定值，如返回所有值*:*

“?”表示单个任意字符的通配

“*” 表示多个任意字符的通配（不能在检索的项开始使用*或者?符号）

“~”表示模糊检索，如检索拼写类似于”roam”的项这样写：roam~将找到形如foam和roams的单词；roam~0.8，检索返回相似度在0.8以上的记录。

邻近检索，如检索相隔10个单词的“apache”和”“akarta”，“jakarta apache”~10

“^”控制相关度检索，如检索jakarta apache，同时希望去让“jakarta”的相关度更加好，那么在其后加上”^”符号和增量值，即jakarta^4 apache

布尔操作符AND、||

布尔操作符OR、&&

布尔操作符NOT、!、-（排除操作符不能单独与项使用构成查询） “+” 存在操作符，要求符号“+”后的项必须在文档相应的域中存在

()用于构成子查询

[] 包含范围检索，如检索某时间段记录，包含头尾，date:[200707 TO 200710]

{}不包含范围检索，如检索某时间段记录，不包含头尾 date:{200707 TO 200710}

"转义操作符，特殊字符包括+ - && || ! ( ) { } [ ] ^ ” ~ * ? : "

查询某个字段非空的记录 比如：fq=FieldName:[‘’ TO *] 查询FieldName非空的数据。

查询某个字段为空的记录 比如：查询公司名称为空的记录可以采用如下语法实现(似乎目前为止只有此方法可行):

-company:[* TO *]

取反实例：fq=!fstate:1
