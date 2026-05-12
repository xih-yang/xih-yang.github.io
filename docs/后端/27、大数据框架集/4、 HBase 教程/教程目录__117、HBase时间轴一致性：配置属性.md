# 117、HBase时间轴一致性：配置属性
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/117.html
- 分类：大数据框架
- 分组：教程目录
## 配置属性

要使用高可用读取，您应该在hbase-site.xml文件中设置以下属性。没有特定配置可启用或禁用区域副本。相反，您可以在创建表时或使用alter table更改每个表的区域副本数量以增加或减少。以下配置用于使用异步wal复制和使用3的元副本。

### 服务器端属性

```java
<property>
    <name>hbase.regionserver.storefile.refresh.period</name>
    <value>0</value>
    <description>
      The period (in milliseconds) for refreshing the store files for the secondary regions. 0 means this feature is disabled. Secondary regions sees new files (from flushes and compactions) from primary once the secondary region refreshes the list of files in the region (there is no notification mechanism). But too frequent refreshes might cause extra Namenode pressure. If the files cannot be refreshed for longer than HFile TTL (hbase.master.hfilecleaner.ttl) the requests are rejected. Configuring HFile TTL to a larger value is also recommended with this setting.
    </description>
</property>
<property>
    <name>hbase.regionserver.meta.storefile.refresh.period</name>
    <value>300000</value>
    <description>
      The period (in milliseconds) for refreshing the store files for the hbase:meta tables secondary regions. 0 means this feature is disabled. Secondary regions sees new files (from flushes and compactions) from primary once the secondary region refreshes the list of files in the region (there is no notification mechanism). But too frequent refreshes might cause extra Namenode pressure. If the files cannot be refreshed for longer than HFile TTL (hbase.master.hfilecleaner.ttl) the requests are rejected. Configuring HFile TTL to a larger value is also recommended with this setting. This should be a non-zero number if meta replicas are enabled (via hbase.meta.replica.count set to greater than 1).
    </description>
</property>
<property>
    <name>hbase.region.replica.replication.enabled</name>
    <value>true</value>
    <description>
      Whether asynchronous WAL replication to the secondary region replicas is enabled or not. If this is enabled, a replication peer named "region_replica_replication" will be created which will tail the logs and replicate the mutations to region replicas for tables that have region replication > 1. If this is enabled once, disabling this replication also requires disabling the replication peer using shell or Admin java class. Replication to secondary region replicas works over standard inter-cluster replication.
    </description>
</property>
<property>
  <name>hbase.region.replica.replication.memstore.enabled</name>
  <value>true</value>
  <description>
    If you set this to false, replicas do not receive memstore updates from
    the primary RegionServer. If you set this to true, you can still disable
    memstore replication on a per-table basis, by setting the table's
    REGION_MEMSTORE_REPLICATION configuration property to false. If
    memstore replication is disabled, the secondaries will only receive
    updates for events like flushes and bulkloads, and will not have access to
    data which the primary has not yet flushed. This preserves the guarantee
    of row-level consistency, even when the read requests Consistency.TIMELINE.
  </description>
</property>
<property>
    <name>hbase.master.hfilecleaner.ttl</name>
    <value>3600000</value>
    <description>
      The period (in milliseconds) to keep store files in the archive folder before deleting them from the file system.</description>
</property>
<property>
    <name>hbase.meta.replica.count</name>
    <value>3</value>
    <description>
      Region replication count for the meta regions. Defaults to 1.
    </description>
</property>
<property>
    <name>hbase.region.replica.storefile.refresh.memstore.multiplier</name>
    <value>4</value>
    <description>
      The multiplier for a “store file refresh” operation for the secondary region replica. If a region server has memory pressure, the secondary region will refresh it’s store files if the memstore size of the biggest secondary replica is bigger this many times than the memstore size of the biggest primary replica. Set this to a very big value to disable this feature (not recommended).
    </description>
</property>
<property>
 <name>hbase.region.replica.wait.for.primary.flush</name>
    <value>true</value>
    <description>
      Whether to wait for observing a full flush cycle from the primary before start serving data in a secondary. Disabling this might cause the secondary region replicas to go back in time for reads between region movements.
    </description>
</property>
```

还要记住的一点是，区域副本放置策略仅由StochasticLoadBalancer默认平衡器强制执行。如果您在hbase-site.xml（hbase.master.loadbalancer.class）中使用自定义负载平衡器属性，则区域副本最终可能会托管在同一台服务器中。

### 客户端属性

确保为将使用区域副本的所有客户端（和服务器）设置以下内容。

```java
<property>
    <name>hbase.ipc.client.specificThreadForWriting</name>
    <value>true</value>
    <description>
      Whether to enable interruption of RPC threads at the client side. This is required for region replicas with fallback RPC’s to secondary regions.
    </description>
</property>
<property>
  <name>hbase.client.primaryCallTimeout.get</name>
  <value>10000</value>
  <description>
    The timeout (in microseconds), before secondary fallback RPC’s are submitted for get requests with Consistency.TIMELINE to the secondary replicas of the regions. Defaults to 10ms. Setting this lower will increase the number of RPC’s, but will lower the p99 latencies.
  </description>
</property>
<property>
  <name>hbase.client.primaryCallTimeout.multiget</name>
  <value>10000</value>
  <description>
      The timeout (in microseconds), before secondary fallback RPC’s are submitted for multi-get requests (Table.get(List<Get>)) with Consistency.TIMELINE to the secondary replicas of the regions. Defaults to 10ms. Setting this lower will increase the number of RPC’s, but will lower the p99 latencies.
  </description>
</property>
<property>
  <name>hbase.client.replicaCallTimeout.scan</name>
  <value>1000000</value>
  <description>
    The timeout (in microseconds), before secondary fallback RPC’s are submitted for scan requests with Consistency.TIMELINE to the secondary replicas of the regions. Defaults to 1 sec. Setting this lower will increase the number of RPC’s, but will lower the p99 latencies.
  </description>
</property>
<property>
    <name>hbase.meta.replicas.use</name>
    <value>true</value>
    <description>
      Whether to use meta table replicas or not. Default is false.
    </description>
</property>
```

注意HBase-1.0.x用户应该使用hbase.ipc.client.allowsInterrupt而不是hbase.ipc.client.specificThreadForWriting。
