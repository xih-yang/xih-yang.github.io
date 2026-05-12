# 169、HBase限制协处理器的使用
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/169.html
- 分类：大数据框架
- 分组：教程目录
## 限制协处理器的使用

在多租户环境中，限制任意用户协处理器可能是一个很大的问题。HBase提供了连续的选项，以确保只有预期的协处理器运行：

- hbase.coprocessor.enabled：启用或禁用所有协处理器。这将限制HBase的功能，因为禁用所有协处理器将禁用某些安全提供程序。一个受影响的示例是org.apache.hadoop.hbase.security.access.AccessController。
- hbase.coprocessor.user.enabled：启用或禁用在表（即用户协处理器）上加载协处理器。
- 在hbase-site.xml中，可以通过以下可调参数静态加载协处理器：

hbase.coprocessor.regionserver.classes：由区域服务器加载的以逗号分隔的协处理器列表；
- hbase.coprocessor.region.classes：逗号分隔的RegionObserver和Endpoint协处理器列表；
- hbase.coprocessor.user.region.classes：由所有区域加载的以逗号分隔的协处理器列表；
- hbase.coprocessor.master.classes：由主服务器（MasterObserver协处理器）加载的以逗号分隔的协处理器列表；
- hbase.coprocessor.wal.classes：要加载的以逗号分隔的WALObserver协处理器列表；

hbase.coprocessor.abortonerror：如果协处理器应该出错而不是IOError，是否中止已加载协处理器的守护进程。如果将此设置为false，并且访问控制器协处理器应该有致命错误，则将绕过协处理器，因此在安全安装中应建议为true；但是，可以在每个表的基础上为用户协处理器重写此操作，以确保它们不会中止其运行区域服务器，而是在出错时卸载。

hbase.coprocessor.region.whitelist.paths：可用于加载org.apache.hadoop.hbase.security.access.CoprocessorWhitelistMasterObserver的逗号分隔列表，通过这个列表，人们可以使用下列选项来加载协处理器的白名单路径。

- 类路径上的协处理器隐式列入白名单；
- *通配符所有协处理器路径；
- 整个文件系统（例如，hdfs://my-cluster/）；
- 由FilenameUtils.wildcardMatch计算的通配符路径；
- 注意：路径可以指定方案或不指定方案（例如，file:///usr/hbase/lib/coprocessors或所有文件系统：/usr/hbase/lib/coprocessors）
