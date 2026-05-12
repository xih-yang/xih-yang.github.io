# 19、MySQL 调优 - MySQL不使用分析函数实现排名
- 来源：https://ddkk.com/zhuanlan/db/mysql/3/19.html
- 分类：缓存数据库
- 分组：教程目录
## 一.问题描述

MySQL8.0开始支持分析函数，MySQL8.0之前如果有排名需求，不使用分析函数的情况下会比较麻烦。

我们可以通过变量、子查询、表的自连接来实现排名的功能。

数据准备:

[scott建表及录入数据sql脚本](https://www.jianshu.com/p/532fe68924cb)

## 二.解决方案

此处我选择变量来实现rownum，用标量子查询的方式来实现rank及dese_rank.

代码:

```java
set @x=0;
SELECT e.ename,
       e.sal,
       @x:=ifnull(@x,0)+1 as rownum1,
       (select count(*) from emp e2 where e2.sal < e.sal) + 1 as rank,
       (select count(distinct sal) from emp e2 where e2.sal < e.sal) + 1 as des_rank
  from emp e
order by e.sal;
```

测试记录:
