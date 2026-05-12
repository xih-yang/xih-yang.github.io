# 79、HBase异步客户端
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/79.html
- 分类：大数据框架
- 分组：教程目录
## HBase异步客户端

它是HBase 2.0中引入的新API，旨在提供异步访问HBase的能力。

您可以从ConnectionFactory获取AsyncConnectionfrom，然后从中获取一个异步表实例来访问HBase。完成后关闭AsyncConnection实例（通常在程序退出时）。

对于异步表，大多数方法与旧Table界面有相同的含义，预期返回值通常包含CompletableFuture。我们在这里没有任何缓冲区，所以没有关于异步表的close方法，你不需要关闭它。它是线程安全的。

扫描（scan）有以下几个不同之处：

- getScanner方法可以返回一个ResultScanner。你可以以旧的方式使用它，它的工作原理与旧的ClientAsyncPrefetchScanner一样。
- scanAll方法会一次返回所有的结果。它旨在为小扫描提供一种更简单的方法，您通常希望一次获得全部结果。
- 观察者（Observer）模式。有一种扫描方法接受ScanResultConsumer作为参数。它会将结果传递给消费者。

注意，AsyncTable接口是模板化的。模板参数指定扫描使用的ScanResultConsumerBase类型，这意味着观察者模式扫描API是不同的。这两种类型的扫描用户是 ScanResultConsumer和AdvancedScanResultConsumer。

ScanResultConsumer需要一个单独的线程池，用于执行向返回的CompletableFuture注册的回调。由于使用单独的线程池可以释放RPC线程，所以回调可以自由地执行任何操作。如果回调不快，或者有疑问，请使用此功能。

AdvancedScanResultConsumer在框架线程内执行回调。不允许在回调中执行耗时的工作，否则它可能会阻塞框架线程并导致非常糟糕的性能影响。顾名思义，它是为想要编写高性能代码的高级用户而设计的。
