# 06、Solr 查询参数
- 来源：https://ddkk.com/zhuanlan/search/solrcloud/6.html
- 分类：搜索引擎
- 分组：教程目录
## 基本查询

> q查询的关键字，此参数最为重要，例如，q=id:1，默认为q=*:*，
>
> fl (field list)指定返回哪些字段，用逗号或空格分隔，注意：字段区分大小写，例如，fl= id,title,sort
>
> start 返回结果的第几条记录开始，一般分页用，默认0开始
>
> rows 指定返回结果最多有多少条记录，默认值为 10，配合start实现分页
>
> sort 排序方式，例如price asc, id desc
>
> wt (writer type)指定输出格式，有 xml, json, php等
>
> fq (filter query)过滤查询，提供一个可选的筛选器查询。返回在q查询符合结果中同时符合的fq条件的查询结果，例如：q=id:1&fq=sort:[1 TO 5]，找关键字id为1 的，并且sort是1到5之间的。
>
> q.op – 覆盖schema.xml的defaultOperator（有空格时用”AND”还是用”OR”操作逻辑），一般默认指定
>
> df 默认的查询字段，一般默认指定。
>
> qt （query type）指定那个类型来处理查询请求，一般不用指定，默认是standard。
>
> indent 返回的结果是否缩进，默认关闭，用 indent=true|on 开启，一般调试json,php,phps,ruby输出才有必要用这个参数。
>
> version 查询语法的版本，建议不使用它，由服务器指定默认值。

## Solr的检索运算符

> “:” 指定字段查指定值，如返回所有值*:*
> “?” 表示单个任意字符的通配
> “*” 表示多个任意字符的通配（不能在检索的项开始使用*或者?符号）
> “~” 表示模糊检索，如检索拼写类似于”roam”的项这样写：roam~将找到形如foam和roams的单词；roam~0.8，检索返回相似度在0.8以上的记录。
> 邻近检索，如检索相隔10个单词的”apache”和”jakarta”，”jakarta apache”~10
> “^” 控制相关度检索，如检索jakarta apache，同时希望去让”jakarta”的相关度更加好，那么在其后加上”^”符号和增量值，即jakarta^4 apache
> 布尔操作符AND、||
> 布尔操作符OR、&&
> 布尔操作符NOT、!、- （排除操作符不能单独与项使用构成查询）
> “+” 存在操作符，要求符号”+”后的项必须在文档相应的域中存在
> ( ) 用于构成子查询
> [] 包含范围检索，如检索某时间段记录，包含头尾date:[200707 TO 200710]
> {} 不包含范围检索，如检索某时间段记录，不包含头尾date:{200707 TO 200710}
> / 转义操作符，特殊字符包括+ - && || ! ( ) { } [ ] ^ ” ~ * ? : /

注：①“+”和”-“表示对单个查询单元的修饰，and 、or 、 not 是对两个查询单元是否做交集或者做差集还是取反的操作的符号

> 比如:AB:china +AB:america ,表示的是AB:china忽略不计可有可无，必须满足第二个条件才是对的,而不是你所认为的必须满足这两个搜索条件
>
> 如果输入:AB:china AND AB:america ,解析出来的结果是两个条件同时满足，即+AB:china AND +AB:america或+AB:china +AB:america
>
> 总而言之，查询语法： 修饰符 字段名:查询关键词 AND/OR/NOT 修饰符 字段名:查询关键词

## Solr查询语法

1.最普通的查询，比如查询姓张的人（ Name:张）,如果是精准性搜索相当于SQL SERVER中的LIKE搜索这需要带引号（""）,比如查询含有北京的（Address:"北京"）

2.多条件查询，注：如果是针对单个字段进行搜索的可以用（Name:搜索条件加运算符(OR、AND、NOT) Name：搜索条件）,比如模糊查询（ Name:张 OR Name:李 ）单个字段多条件搜索不建议这样写，一般建议是在单个字段里进行条件筛选，如（ Name:张 OR 李），多个字段查询（Name:张 + Address:北京 ）

3.排序，比如根据姓名升序（Name asc）,降序（Name desc）
