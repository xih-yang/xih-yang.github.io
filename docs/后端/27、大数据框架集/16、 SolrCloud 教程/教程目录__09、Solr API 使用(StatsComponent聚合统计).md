# 09、Solr API 使用(StatsComponent聚合统计)
- 来源：https://ddkk.com/zhuanlan/search/solrcloud/9.html
- 分类：搜索引擎
- 分组：教程目录
转载请出自出处：[http://eksliang.iteye.com/blog/2169134](http://eksliang.iteye.com/blog/2169134)

## 1、概述

Solr可以利用StatsComponent 实现数据库的聚合统计查询，也就是min、max、avg、count、sum的功能

## 2、参数

参数

含义

stats

是否开启stats（true/false）

stats.field

添加一个字段来统计，可以有多个

stats.facet

在给定的面返回值的子结果。

## 3、参考实例

参考实例一：查询参数

```bash
q=*:*   
&stats=true  
&stats.field=price  
&stats.field=popularity  
&rows=0
```

返回结果如下：

```xml
<lst name="stats">  
 <lst name="stats_fields">  
  <lst name="price">  
    <double name="min">0.0</double>        --最小值  
    <double name="max">2199.0</double>     --最大值  
    <double name="sum">5251.2699999999995</double> --总和  
    <long name="count">15</long>                   --记录数，也就是多少行记录  
    <long name="missing">11</long>                 --结果集中，有多少条记录是空值  
    <double name="sumOfSquares">6038619.160300001</double> --平方和（x1^2 + x2^2+xn^2）  
    <double name="mean">350.08466666666664</double>        --平均数（x1+x2+xn）/n  
    <double name="stddev">547.737557906113</double>        --标准差  
  </lst>  
  <lst name="popularity">  
    <double name="min">0.0</double>  
    <double name="max">10.0</double>  
    <double name="sum">90.0</double>  
    <long name="count">26</long>  
    <long name="missing">0</long>  
    <double name="sumOfSquares">628.0</double>  
    <double name="mean">3.4615384615384617</double>  
    <double name="stddev">3.5578731762756157</double>  
  </lst>  
 </lst>  
</lst>
```

参数含义如下：

返回字段

字段含义

min

最小值

max

最大值

sum

总和

count

记录数，也就是多少行记录

missing

结果集中，有多少条记录是空值

sumOfSquares

平方和（x1^2 + x2^2+xn^2）

mean

平均数（x1+x2+xn）/n

stddev

标准差

参考实例二：查询参数如下

```bash
q=*:*   
&stats=true  
&stats.field=price  
&stats.field=popularity  
&stats.facet=inStock  
&rows=0
```

返回结果如下所示：

```xml
<lst name="stats">  
 <lst name="stats_fields">  
  <lst name="price">  
  <double name="min">0.0</double>  
  <double name="max">2199.0</double>  
  <double name="sum">5251.2699999999995</double>  
  <long name="count">15</long>  
  <long name="missing">11</long>  
  <double name="sumOfSquares">6038619.160300001</double>  
  <double name="mean">350.08466666666664</double>  
  <double name="stddev">547.737557906113</double>  
  <lst name="facets">  
   <lst name="inStock">  
    <lst name="false">  --统计的是：在返回结果中inStock等于false部分,price的统计  
      <double name="min">11.5</double>   --在inStock等于false的记录中pirce的最小值  
      <double name="max">649.99</double> --在inStock等于false的记录中pirce的最大值  
      <double name="sum">1161.39</double>--在inStock等于false的记录中pirce的总和  
      <long name="count">4</long>        --inStock等于false的记录数  
      <long name="missing">0</long>      --在inStock等于false的记录中pirce等于空的记录  
      <double name="sumOfSquares">653369.2551</double>--在inStock等于false的记录中pirce的平方和  
      <double name="mean">290.3475</double>--在inStock等于false的记录中pirce的平均值  
      <double name="stddev">324.63444676281654</double>--在inStock等于false的记录中pirce的标准差  
    </lst>  
    <lst name="true">  
      <double name="min">0.0</double>  
      <double name="max">2199.0</double>  
      <double name="sum">4089.879999999999</double>  
      <long name="count">11</long>  
      <long name="missing">0</long>  
      <double name="sumOfSquares">5385249.905200001</double>  
      <double name="mean">371.8072727272727</double>  
      <double name="stddev">621.6592938755265</double>  
    </lst>  
   </lst>  
  </lst>  
 </lst>  
</lst>
```

温馨提示：如果统计的列不是数字类型。而是字符串，那么统计的结果中只有如下列

参考实例如下：查询参数

```bash
q=*:*  
&stats=true  
&stats.field=CAR_NUM  
&rows=0
```

返回结果如下所示：

```xml
<lst name="stats">  
  <lst name="stats_fields">  
    <lst name="CAR_NUM">  
        <str name="min">08449</str>  
        <str name="max">黑ZZ6T8警</str>  
        <long name="count">9999999</long>  
        <long name="missing">0</long>  
        <lst name="facets"/>  
    </lst>  
   </lst>  
</lst>
```

官方API地址：http://wiki.apache.org/solr/StatsComponent
