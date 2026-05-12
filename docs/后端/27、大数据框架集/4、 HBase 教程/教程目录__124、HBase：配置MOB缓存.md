# 124、HBase：配置MOB缓存
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/124.html
- 分类：大数据框架
- 分组：教程目录
## 配置MOB缓存

因为可以随时存在大量MOB文件，与HFiles的数量相比，MOB文件并不总是保持打开状态。MOB文件读取器缓存是一个LRU缓存，它保持最近使用的MOB文件打开。要在每个RegionServer上配置MOB文件读取器的缓存，请将以下属性添加到RegionServer的hbase-site.xml中，根据您的环境自定义配置，然后重新启动或滚动重新启动RegionServer。

MOB缓存配置示例：

```java
<property>
    <name>hbase.mob.file.cache.size</name>
    <value>1000</value>
    <description>
      Number of opened file handlers to cache.
      A larger value will benefit reads by providing more file handlers per mob
      file cache and would reduce frequent file opening and closing.
      However, if this is set too high, this could lead to a "too many opened file handers"
      The default value is 1000.
    </description>
</property>
<property>
    <name>hbase.mob.cache.evict.period</name>
    <value>3600</value>
    <description>
      The amount of time in seconds after which an unused file is evicted from the
      MOB cache. The default value is 3600 seconds.
    </description>
</property>
<property>
    <name>hbase.mob.cache.evict.remain.ratio</name>
    <value>0.5f</value>
    <description>
      A multiplier (between 0.0 and 1.0), which determines how many files remain cached
      after the threshold of files that remains cached after a cache eviction occurs
      which is triggered by reaching the hbase.mob.file.cache.size threshold.
      The default value is 0.5f, which means that half the files (the least-recently-used
      ones) are evicted.
    </description>
</property>
```
