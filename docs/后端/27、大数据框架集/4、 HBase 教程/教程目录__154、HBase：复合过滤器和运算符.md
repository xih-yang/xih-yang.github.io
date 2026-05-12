# 154、HBase：复合过滤器和运算符
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/154.html
- 分类：大数据框架
- 分组：教程目录
## 复合过滤器和运算符

二元运算符

AND

如果使用AND运算符，则键值必须满足两个过滤器。

OR

如果使用OR运算符，则键值必须满足至少一个过滤器。

一元运算符

SKIP

对于特定行，如果任何键值未通过过滤条件，则跳过整行。

WHILE

对于特定行，将发出键值，直到达到未通过过滤条件的键值。

示例-复合运算符

您可以组合多个运算符来创建过滤器层次结构，例如以下示例：

```java
(Filter1 AND Filter2) OR (Filter3 AND Filter4)
```
