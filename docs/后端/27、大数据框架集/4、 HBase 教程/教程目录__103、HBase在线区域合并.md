# 103、HBase在线区域合并
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/103.html
- 分类：大数据框架
- 分组：教程目录
## 在线区域合并

Master和RegionServer都参与在线区域合并事件。客户端将合并RPC发送到主服务器，然后主服务器将这些区域一起移动到负载较重的区域所在的RegionServer。最后，主服务器将合并请求发送到该RegionServer，然后运行合并。与区域拆分过程类似，区域合并在RegionServer上作为本地事务运行。它将区域划分为多个区域，然后合并文件系统上的两个区域，从hbase:meta中删除合并区域，并将合并后的区域添加到hbase:meta，在RegionServer中打开合并区域并将合并报告给Master。

HBase shell中的区域合并示例：

```java
$ hbase> merge_region 'ENCODED_REGIONNAME', 'ENCODED_REGIONNAME'
$ hbase> merge_region 'ENCODED_REGIONNAME', 'ENCODED_REGIONNAME', true
```

这是一个异步操作，并且在没有等待合并完成的情况下立即调用返回。true作为可选的第三个参数传递将强制合并。通常只有相邻的区域可以合并。该force参数将覆盖此行为，仅供专门使用。
