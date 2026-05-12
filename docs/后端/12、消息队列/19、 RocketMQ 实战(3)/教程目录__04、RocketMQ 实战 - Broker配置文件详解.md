# 04、RocketMQ 实战 - Broker配置文件详解
- 来源：https://ddkk.com/zhuanlan/mq/rocketmq/7/4.html
- 分类：消息队列
- 分组：教程目录
```java
# Licensed to the Apache Software Foundation (ASF) under one or more
# contributor license agreements.  See the NOTICE file distributed with
# this work for additional information regarding copyright ownership.
# The ASF licenses this file to You under the Apache License, Version 2.0
# (the "License"); you may not use this file except in compliance with
# the License.  You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
#  Unless required by applicable law or agreed to in writing, software
#  distributed under the License is distributed on an "AS IS" BASIS,
#  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#  See the License for the specific language governing permissions and
#  limitations under the License.
# broker所属集群的名称
brokerClusterName = DefaultCluster
# broker的名称
brokerName = broker-a
# broker的ID, 0表示Master，非0表示Slave
brokerId = 0
# 删除文件时间点,默认是凌晨4点
deleteWhen = 04
# 文件保留时间,默认保留48小时
fileReservedTime = 48
# broker的角色
# ASYNC_MASTER: 异步复制Master
# SYNC_MASTER: 同步双写Master
# SLAVE: slave
brokerRole = ASYNC_MASTER
# 刷盘方式
# ASYNC_FLUSH: 异步刷盘
# SYNC_FLUSH: 同步刷盘
flushDiskType = ASYNC_FLUSH
# NameServer的地址，如果有多个的话，使用分号分隔开
namesrvAddr=10.0.90.59:9876
# 当前broker监听的IP地址
brokerIP1=10.0.90.59
# 在发送消息时，自动创建服务器不存在的topic，默认创建4个队列 
defaultTopicQueueNums=4
# 是否允许broker自动创建Topic
autoCreateTopicEnable=true
#是否允许broker自动创建订阅组
autoCreateSubscriptionGroup=true
# broker对外服务的监听端口 
listenPort=10911
# 每个commitLog文件的大小默认是1G
mapedFileSizeCommitLog=1073741824
# ConsumeQueue每个文件默认存30W条
mapedFileSizeConsumeQueue=300000
# store的存储路径
storePathRootDir=/rocketmq/rocketmq-4.9.2/store
# commitLog的存储路径 
storePathCommitLog=/rocketmq/rocketmq-4.9.2/store/commitlog
# 消费队列的存储路径
storePathConsumeQueue=/rocketmq/rocketmq-4.9.2/store/consumequeue
# 消息索引的存储路径
storePathIndex=/rocketmq/rocketmq-4.9.2/store/index
# checkpoint文件的存储路径
storeCheckpoint=/rocketmq/rocketmq-4.9.2/store/checkpoint
# abort文件的存储路径
abortFile=/rocketmq/rocketmq-4.9.2/store/abort
# 限制的消息大小,默认为4M 
maxMessageSize=65536
# 检测物理文件磁盘空间
diskMaxUsedSpaceRatio=75
```
