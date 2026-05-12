# 11、RocketMQ 实战 - 工作原理之indexFile
- 来源：https://ddkk.com/zhuanlan/mq/rocketmq/5/11.html
- 分类：消息队列
- 分组：教程目录
除了通过通常的指定Topic进行消息消费外，RocketMQ还提供了根据key进行消息查询的功能。该查询

是通过store目录中的index子目录中的indexFile进行索引实现的快速查询。当然，这个indexFile中的索

引数据是在包含了key的消息被发送到Broker时写入的。如果消息中没有包含key，则不会写入。

## 1 索引条目结构

每个Broker中会包含一组indexFile，每个indexFile都是以一个时间戳命名的（这个indexFile被创建时

的时间戳）。每个indexFile文件由三部分构成：indexHeader，slots槽位，indexes索引数据。每个

indexFile文件中包含500w个slot槽。而每个slot槽又可能会挂载很多的index索引单元。

indexHeader固定40个字节，其中存放着如下数据：

- beginTimestamp：该indexFile中第一条消息的存储时间
- endTimestamp：该indexFile中最后一条消息存储时间
- beginPhyoffset：该indexFile中第一条消息在commitlog中的偏移量commitlog offset
- endPhyoffset：该indexFile中最后一条消息在commitlog中的偏移量commitlog offset
- hashSlotCount：已经填充有index的slot数量（并不是每个slot槽下都挂载有index索引单元，这里统计的是所有挂载了index索引单元的slot槽的数量）
- indexCount：该indexFile中包含的索引单元个数（统计出当前indexFile中所有slot槽下挂载的所有index索引单元的数量之和）

indexFile中最复杂的是Slots与Indexes间的关系。在实际存储时，Indexes是在Slots后面的，但为了便于理解，将它们的关系展示为如下形式：

key的hash值 % 500w 的结果即为slot槽位，然后将该slot值修改为该index索引单元的indexNo，根据这个indexNo可以计算出该index单元在indexFile中的位置。不过，该取模结果的重复率是很高的，为了解决该问题，在每个index索引单元中增加了preIndexNo，用于指定该slot中当前index索引单元的前一个index索引单元。而slot中始终存放的是其下最新的index索引单元的indexNo，这样的话，只要找到了slot就可以找到其最新的index索引单元，而通过这个index索引单元就可以找到其之前的所有index索引单元。

> indexNo是一个在indexFile中的流水号，从0开始依次递增。即在一个indexFile中所有indexNo是
>
> 以此递增的。indexNo在index索引单元中是没有体现的，其是通过indexes中依次数出来的。

index索引单元默写20个字节，其中存放着以下四个属性：

- keyHash：消息中指定的业务key的hash值
- phyOffset：当前key对应的消息在commitlog中的偏移量commitlog offset
- timeDiff：当前key对应消息的存储时间与当前indexFile创建时间的时间差
- preIndexNo：当前slot下当前index索引单元的前一个index索引单元的indexNo

## 2 indexFile的创建

indexFile的文件名为当前文件被创建时的时间戳。这个时间戳有什么用处呢？

根据业务key进行查询时，查询条件除了key之外，还需要指定一个要查询的时间戳，表示要查询不大于

该时间戳的最新的消息，即查询指定时间戳之前存储的最新消息。这个时间戳文件名可以简化查询，提

高查询效率。具体后面会详细讲解。

indexFile文件是何时创建的？其创建的条件（时机）有两个：

- 当第一条带key的消息发送来后，系统发现没有indexFile，此时会创建第一个indexFile文件
- 当一个indexFile中挂载的index索引单元数量超出2000w个时，会创建新的indexFile。当带key的

消息发送到来后，系统会找到最新的indexFile，并从其indexHeader的最后4字节中读取到

indexCount。若indexCount >= 2000w时，会创建新的indexFile。

> 由于可以推算出，一个indexFile的最大大小是：(40 + 500w * 4 + 2000w * 20)字节

## 3 查询流程

当消费者通过业务key来查询相应的消息时，其需要经过一个相对较复杂的查询流程。不过，在分析查

询流程之前，首先要清楚几个定位计算式子：

> 计算指定消息key的slot槽位序号：
>
> slot槽位序号 = key的hash % 500w (式子1)

> 计算槽位序号为n的slot在indexFile中的起始位置：
>
> slot(n)位置 = 40 + (n - 1) * 4 (式子2)

> 计算indexNo为m的index在indexFile中的位置：
>
> index(m)位置 = 40 + 500w * 4 + (m - 1) * 20 (式子3)

> 40为indexFile中indexHeader的字节数
>
> 500w * 4 是所有slots所占的字节数

具体查询流程如下：
