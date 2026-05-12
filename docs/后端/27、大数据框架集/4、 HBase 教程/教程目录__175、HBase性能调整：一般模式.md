# 175、HBase性能调整：一般模式
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/175.html
- 分类：大数据框架
- 分组：教程目录
## HBase一般模式

### 常量

当人们开始使用HBase时，他们倾向于编写如下所示的代码：

```java
Get get = new Get(rowkey);
Result r = table.get(get);
byte[] b = r.getValue(Bytes.toBytes("cf"), Bytes.toBytes("attr"));  // returns current version of value
```

但是特别是当内部循环（和MapReduce作业）时，将columnFamily和column-names重复转换为字节数组的成本非常高。最好对字节数组使用常量，如下所示：

```java
public static final byte[] CF = "cf".getBytes();
public static final byte[] ATTR = "attr".getBytes();
...
Get get = new Get(rowkey);
Result r = table.get(get);
byte[] b = r.getValue(CF, ATTR);  // returns current version of value
```
