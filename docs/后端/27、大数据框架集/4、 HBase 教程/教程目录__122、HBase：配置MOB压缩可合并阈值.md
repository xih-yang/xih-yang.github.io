# 122、HBase：配置MOB压缩可合并阈值
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/122.html
- 分类：大数据框架
- 分组：教程目录
## 配置MOB压缩可合并阈值

如果一个mob文件的大小小于默认值1280MB，它被认为是一个小文件，需要在mob compaction中合并。

```java
<property>
    <name>hbase.mob.compaction.mergeable.threshold</name>
    <value>10000000000</value>
</property>
```
