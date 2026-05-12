# 06、RocketMQ 实战 - 集群搭建理论
- 来源：https://ddkk.com/zhuanlan/mq/rocketmq/5/6.html
- 分类：消息队列
- 分组：教程目录
## 1 数据复制与刷盘策略

### 复制策略

复制策略是Broker的Master与Slave间的数据同步方式。分为同步复制与异步复制：

- 同步复制：消息写入master后，master会等待slave同步数据成功后才向producer返回成功ACK
- 异步复制：消息写入master后，master立即向producer返回成功ACK，无需等待slave同步数据成

功

> 异步复制策略会降低系统的写入延迟，RT变小，提高了系统的吞吐量

### 刷盘策略

刷盘策略指的是broker中消息的落盘方式，即消息发送到broker内存后消息持久化到磁盘的方式。分为

同步刷盘与异步刷盘：

- 同步刷盘：当消息持久化到broker的磁盘后才算是消息写入成功。
- 异步刷盘：当消息写入到broker的内存后即表示消息写入成功，无需等待消息持久化到磁盘。

> 1）异步刷盘策略会降低系统的写入延迟，RT变小，提高了系统的吞吐量
>
> 2）消息写入到Broker的内存，一般是写入到了PageCache
>
> 3）对于异步 刷盘策略，消息会写入到PageCache后立即返回成功ACK。但并不会立即做落盘操
>
> 作，而是当PageCache到达一定量时会自动进行落盘

## 2 Broker集群模式

根据Broker集群中各个节点间关系的不同，Broker集群可以分为以下几类：

### 单Master

只有一个broker（其本质上就不能称为集群）。这种方式也只能是在测试时使用，生产环境下不能使

用，因为存在单点问题。

### 多Master

broker集群仅由多个master构成，不存在Slave。同一Topic的各个Queue会平均分布在各个master节点

上。

- 优点：配置简单，单个Master宕机或重启维护对应用无影响，在磁盘配置为RAID10时，即使机器

宕机不可恢复情况下，由于RAID10磁盘非常可靠，消息也不会丢（异步刷盘丢失少量消息，同步

刷盘一条不丢），性能最高；
- 缺点：单台机器宕机期间，这台机器上未被消费的消息在机器恢复之前不可订阅（不可消费），

消息实时性会受到影响。

> 以上优点的前提是，这些Master都配置了RAID磁盘阵列。如果没有配置，一旦出现某Master宕
>
> 机，则会发生大量消息丢失的情况。

### 多Master多Slave模式-异步复制

broker集群由多个master构成，每个master又配置了多个slave（在配置了RAID磁盘阵列的情况下，一

个master一般配置一个slave即可）。master与slave的关系是主备关系，即master负责处理消息的读写

请求，而slave仅负责消息的备份与master宕机后的角色切换。

异步复制即前面所讲的复制策略中的异步复制策略，即消息写入master成功后，master立即向

producer返回成功ACK，无需等待slave同步数据成功。

该模式的最大特点之一是，当master宕机后slave能够自动切换为master。不过由于slave从master的同

步具有短暂的延迟（毫秒级），所以当master宕机后，这种异步复制方式可能会存在少量消息的丢失问

题。

> Slave从Master同步的延迟越短，其可能丢失的消息就越少
>
> 对于Master的RAID磁盘阵列，若使用的也是异步复制策略，同样也存在延迟问题，同样也可能
>
> 会丢失消息。但RAID阵列的秘诀是微秒级的（因为是由硬盘支持的），所以其丢失的数据量会
>
> 更少。

### 多Master多Slave模式-同步双写

该模式是多Master多Slave模式的同步复制实现。所谓同步双写，指的是消息写入master成功后，

master会等待slave同步数据成功后才向producer返回成功ACK，即master与slave都要写入成功后才会

返回成功ACK，也即双写。

该模式与异步复制模式相比，优点是消息的安全性更高，不存在消息丢失的情况。但单个消息的RT略

高，从而导致性能要略低（大约低10%）。

该模式存在一个大的问题：对于目前的版本，Master宕机后，Slave 不会自动切换到Master。

### 最佳实践

一般会为Master配置RAID10磁盘阵列，然后再为其配置一个Slave。即利用了RAID10磁盘阵列的高

效、安全性，又解决了可能会影响订阅的问题。

1）RAID磁盘阵列的效率要高于Master-Slave集群。因为RAID是硬件支持的。也正因为如此，

所以RAID阵列的搭建成本较高。

2）多Master+RAID阵列，与多Master多Slave集群的区别是什么？

- 多Master+RAID阵列，其仅仅可以保证数据不丢失，即不影响消息写入，但其可能会影响到

消息的订阅。但其执行效率要远高于多Master多Slave集群
- 多Master多Slave集群，其不仅可以保证数据不丢失，也不会影响消息写入。其运行效率要低

于多Master+RAID阵列
