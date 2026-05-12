# 155、HBase：过滤器计算顺序
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/155.html
- 分类：大数据框架
- 分组：教程目录
## 计算顺序

**1、** 括号具有最高优先级；

**2、** 然后是一元运算符SKIP和WHILE，并具有相同的优先级；

**3、** 接着是二元运算符，其中AND优先级最高，其次是OR；

优先级示例：

```java
Filter1 AND Filter2 OR Filter
is evaluated as
(Filter1 AND Filter2) OR Filter3
Filter1 AND SKIP Filter2 OR Filter3
is evaluated as
(Filter1 AND (SKIP Filter2)) OR Filter3
```

您可以使用括号明确的控制计算顺序。
