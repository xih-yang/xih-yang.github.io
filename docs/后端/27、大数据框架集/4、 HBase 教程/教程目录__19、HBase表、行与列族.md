# 19、HBase表、行与列族
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/19.html
- 分类：大数据框架
- 分组：教程目录
## HBase表

HBase 中表是在 schema 定义时被预先声明的。

可以使用以下的命令来创建一个表，在这里必须指定表名和列族名。在 HBase shell 中创建表的语法如下所示：

```java
create ‘<table name>’,’<column family>’ 
```

## HBase行

HBase中的行是逻辑上的行，物理上模型上行是按列族(colomn family)分别存取的。

行键是未解释的字节，行是按字母顺序排序的，最低顺序首先出现在表中。空字节数组用于表示表命名空间的开始和结束。

## HBase列族

Apache HBase 中的列被分组为列族。列族的所有列成员具有相同的前缀。例如，courses:history 和 courses:math 都是 courses 列族的成员。冒号字符（:）从列族限定符中分隔列族。列族前缀必须由可打印字符组成。限定尾部，列族限定符可以由任意字节组成。必须在 schema 定义时提前声明列族，而列不需要在 schema 时定义，但可以在表启动并运行时动态地变为列。

在物理上，所有列族成员一起存储在文件系统上。由于调音（tunings）和存储（storage）规范是在列族级完成的，因此建议所有列族成员具有相同的一般访问模式和大小特征。

## HBase Cell

由{row key, column( = + ), version} 唯一确定的单元。cell 中的数据是没有类型的，全部是字节码形式存储。
