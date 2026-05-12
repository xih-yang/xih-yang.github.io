# 10、Solr API 使用(Result Grouping分组查询)
- 来源：https://ddkk.com/zhuanlan/search/solrcloud/10.html
- 分类：搜索引擎
- 分组：教程目录
## 1、概述

分组统计查询不同于分组统计（Facet）,facet只是简单统计记录数，并不能为每组数据返回实际的数据回来，solr提供的grouping查询能够解决这一问题，也就是说，他除了能分组外，还能把每组数据返回来。

## 2、语法简介

**参考实例一**

查询参数如下：

```bash
q=*:*  
&group=true  
&group.field=price
```

返回结果如下：

Solr Grouping参数列表

参数

参数含义

group

（true/false） 是否开启分组查询

group.field

group字段，通过在请求中加入group.field参数加以声明，如果需要对多个字段进行group by,那么该参数可以声明多次

group.query

可以对任意条件进行分组统计查询

group.limit

返回的数据的条目，默认为1 3

group.offset

偏移量，跟上面的group.limit一起可以达到分页的效果

group.sort

排序

group.main

（true/false）等于true,将只返回最后一个group.query查询的分组数据，一定是最后一个group.query，如果最后的条件是group.field，也没有效果，同时其他分组统计条件都会失去作用

## 参考实例

**参考实例一：group.field多个字段同时一起做分组统计查询演示**，查询参数如下所示

```bash
q=*:*  
&group=true  
&group.field=price  
&group.field=brand  
&rows=2
```

返回结果如下所示：

[/images/2023/9/6/2024/1694003076292.png

**参考实例二：group.query自定义条件统计演示**，请求参数如下所示

```bash
q=*:*  
&group=true  
&group.query=price:[0 TO 3000]  
&group.query=price:[2000 TO *]  
&group.limit=2
```

返回结果如下所示：

**参考实例三：group.main参数演示**，请求参数如下所示

```bash
q=*:*  
&group=true  
&group.query=price:[0 TO 3000]  
&group.query=price:[2000 TO *]  
&group.field=price  
&group.main=true
```

返回结果如下所示：

**参考实例四：group.main参数演示**，请求参数如下所示

```bash
q=*:*  
&group=true  
&group.field=price  
&group.main=true  
&rows=1
```

返回结果如下所示，可以看到其他group统计条件都会失去作用因为加了group.main=true

```xml
<response>  
 <lst name="responseHeader">  
  <int name="status">0</int>  
  <int name="QTime">2</int>  
  <lst name="params">  
  <str name="q">*:*</str>  
  <str name="group.field">price</str>  
  <str name="group.main">true</str>  
  <str name="group">true</str>  
  <str name="rows">1</str>  
 </lst>  
 </lst>  
 <result name="response" numFound="9" start="0">  
  <doc>  
   <str name="id">a001</str>  
   <str name="brand">联想</str>  
   <float name="price">1100.0</float>  
   <date name="birthday">2014-11-06T09:15:00Z</date>  
   <str name="remark">联想A001</str>  
   <long name="_version_">1487193657358417920</long>  
  </doc>  
 </result>  
</response>
```
