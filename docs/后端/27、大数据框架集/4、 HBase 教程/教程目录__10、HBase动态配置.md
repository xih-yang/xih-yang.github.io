# 10、HBase动态配置
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/10.html
- 分类：大数据框架
- 分组：教程目录
## HBase 动态配置

从HBase 1.0.0 版本开始，你可以在不重新启动服务器的情况下更改配置的子集。在 HBase shell 中，有新的操作符，update_config 以及 update_all_config，它们会提示服务器或所有服务器重新加载配置。

当前正在运行的服务器中，只能更改所有配置的子集。以下是这些支持动态更改的配置：

Key

hbase.ipc.server.fallback-to-simple-auth-allowed

hbase.cleaner.scan.dir.concurrent.size

hbase.regionserver.thread.compaction.large

hbase.regionserver.thread.compaction.small

hbase.regionserver.thread.split

hbase.regionserver.throughput.controller

hbase.regionserver.thread.hfilecleaner.throttle

hbase.regionserver.hfilecleaner.large.queue.size

hbase.regionserver.hfilecleaner.small.queue.size

hbase.regionserver.hfilecleaner.large.thread.count

hbase.regionserver.hfilecleaner.small.thread.count

hbase.regionserver.flush.throughput.controller

hbase.hstore.compaction.max.size

hbase.hstore.compaction.max.size.offpeak

hbase.hstore.compaction.min.size

hbase.hstore.compaction.min

hbase.hstore.compaction.max

hbase.hstore.compaction.ratio

hbase.hstore.compaction.ratio.offpeak

hbase.regionserver.thread.compaction.throttle

hbase.hregion.majorcompaction

hbase.hregion.majorcompaction.jitter

hbase.hstore.min.locality.to.skip.major.compact

hbase.hstore.compaction.date.tiered.max.storefile.age.millis

hbase.hstore.compaction.date.tiered.incoming.window.min

hbase.hstore.compaction.date.tiered.window.policy.class

hbase.hstore.compaction.date.tiered.single.output.for.minor.compaction

hbase.hstore.compaction.date.tiered.window.factory.class

hbase.offpeak.start.hour

hbase.offpeak.end.hour

hbase.oldwals.cleaner.thread.size

hbase.procedure.worker.keep.alive.time.msec

hbase.procedure.worker.add.stuck.percentage

hbase.procedure.worker.monitor.interval.msec

hbase.procedure.worker.stuck.threshold.msec

hbase.regions.slop

hbase.regions.overallSlop

hbase.balancer.tablesOnMaster

hbase.balancer.tablesOnMaster.systemTablesOnly

hbase.util.ip.to.rack.determiner

hbase.ipc.server.max.callqueue.length

hbase.ipc.server.priority.max.callqueue.length

hbase.ipc.server.callqueue.type

hbase.ipc.server.callqueue.codel.target.delay

hbase.ipc.server.callqueue.codel.interval

hbase.ipc.server.callqueue.codel.lifo.threshold

hbase.master.balancer.stochastic.maxSteps

hbase.master.balancer.stochastic.stepsPerRegion

hbase.master.balancer.stochastic.maxRunningTime

hbase.master.balancer.stochastic.runMaxSteps

hbase.master.balancer.stochastic.numRegionLoadsToRemember

hbase.master.loadbalance.bytable

hbase.master.balancer.stochastic.minCostNeedBalance

hbase.master.balancer.stochastic.localityCost

hbase.master.balancer.stochastic.rackLocalityCost

hbase.master.balancer.stochastic.readRequestCost

hbase.master.balancer.stochastic.writeRequestCost

hbase.master.balancer.stochastic.memstoreSizeCost

hbase.master.balancer.stochastic.storefileSizeCost

hbase.master.balancer.stochastic.regionReplicaHostCostKey

hbase.master.balancer.stochastic.regionReplicaRackCostKey

hbase.master.balancer.stochastic.regionCountCost

hbase.master.balancer.stochastic.primaryRegionCountCost

hbase.master.balancer.stochastic.moveCost

hbase.master.balancer.stochastic.maxMovePercent

hbase.master.balancer.stochastic.tableSkewCost
