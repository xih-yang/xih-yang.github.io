# 125、HBase：MOB优化任务
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/125.html
- 分类：大数据框架
- 分组：教程目录
## MOB优化任务

### 手动压缩MOB文件

要手动压缩MOB文件，而不是等待配置触发压缩，请使用compact或major_compactHBase shell命令。这些命令要求第一个参数为表名，并将列族作为第二个参数。并将压缩类型作为第三个参数。

```java
hbase> compact't1'，'c1'，'MOB'
hbase> major_compact't1'，'c1'，'MOB'
```

这些命令也可以通过Admin.compact和Admin.majorCompact方法获得。
