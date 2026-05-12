# 17、Redis 源码解析 - Redis 哨兵机制[4] 故障转移
- 来源：https://ddkk.com/zhuanlan/db/redis/7/17.html
- 分类：缓存数据库
- 分组：教程目录
开始故障转移的前提是我们已经确定某个节点是要下线的了,但是此时可能不止我们一个sentinel节点这样认为,可能有很多节点都得到了这个结论.这里我们先确定故障转移需要一个sentinel成为leader,去向宕机的主服务器的从服务器中选出一个作为新的主服务器,sentinel作为其客户端,向这个升级的节点发送`slave no one`,向其他节点发送`slave of`,作为这个升级的主服务器的从服务器.问题来了,选哪一个sentinel呢?问题的关键在于当前sentinel不确定其他sentinel结点是否也是此次的选举的竞争者,只是知道有多少个sentinel而已.因为sentinel之间对于从节点的信息可能有所不同,毕竟是一个分布式的系统.那么如果两个sentinel结点都认为自己是leader的话就可能会造成在一个主从复制的集群中出现了两个主节点,且其他从节点会分别`slaveo`f,这样就完全混乱了.那么该如何解决呢?**答案就是用Raft算法解决这个分布式的一致性问题**.但确并没有使用完整的Raft算法,只是使用了其中的选举制度,并没有使用其中的`log replcate`来确保数据一致性.还有就是Raft中采用随机选举超时时间(150ms到300ms),在这段时间内没有收到leader的心跳包则视为任期结束,开始下一个的任期的选举.redis中是在判断节点出现客观下线的时候进行下一个任期的选举,但还是会以1秒一次的频率发送PING来检测是否下线.Raft算法具体可参考文末链接

### redis如何做?

但在源码解析之前,我们还要解决一个问题,就是在所有sentinel节点间选出一个leader. 上面已经说了是Raft算法的思路,但具体过程是什么呢?

**首先所有的节点有三个状态,追随者,候选者和领导者.我们Redis中故障转移已经开始为条件,此时在sentinel集群中可能有多个节点检测到nodeA已经下线并收到了其他sentinel节点的确认,这时这些结点我们成候选者**,**它们会向除自己外的全部sentinel发送一个消息,请求使自己成为这个任期内的leader,会受到一个回复,内容包括目标node返回的此任期内的leader,当然有可能是请求者,也有可能不是.每个节点在一个任期内只能投一次票,这样可能会有一个节点收到大于(总结点/2+1)的回复投票给这个节点,然后它就成了leader.显然这样收到(总结点/2+1)个投票的node在一次任期内最多有一个.其他的结点检测到自己的votes不足,则不会成为leader,这样就确保了一致性.但可能会出现每一个节点都没有收到多于半数的投票,这样此次投票作废,等待下次投票.在redis中的行为则是每个节点都没有成为leader,什么也不做,等待下次serverCron函数,因为状态还是主观下线,所以下次还会继续投票,注意两次投票之间时长不少于1秒.而raft中的做法则是所有节点在规定时间内未收到leader发送的心跳包,开始下次选举**.

理论都OK了 代码中其实选举这部分是与源码解析(16)中的函数解析重叠了,其中`sentinelAskMasterStateToOtherSentinels`和`sentinelCheckObjectivelyDown(ri)`即充当了使状态从`主观下线`升级为`客观下线`,还有选举的功能,且会在选举成功后执行`sentinelFailoverStateMachine`,也就是故障转移的主体函数,那么这个函数要执行的任务其实就比较简单了,只需要选择一个从服务器对器发送`slave no one`升级为主服务器,等待其升级成功的INFO发回来的时候(此时INFO一秒一次),对剩下的从服务器只需`slave of`即可完成这次状态转移.

### 源码解析

这里其实只剩下一个函数的解析,就是`sentinelFailoverStateMachine`

```java
void sentinelFailoverStateMachine(sentinelRedisInstance *ri) {
    redisAssert(ri->flags & SRI_MASTER);
    // master 未进入故障转移状态，直接返回
    if (!(ri->flags & SRI_FAILOVER_IN_PROGRESS)) return;
    switch(ri->failover_state) {
      //故障转移操作的状态机
        // 等待故障转移开始 sentinelStartFailoverIfNeeded执行成功会把状态变更为这个
        case SENTINEL_FAILOVER_STATE_WAIT_START:
            // 判断当前哨兵结点是否为leader
            // 是的话 状态改变为SENTINEL_FAILOVER_STATE_SELECT_SLAVE
            // 否的话 取消故障转移.
            sentinelFailoverWaitStart(ri);
            break;
        // 选择新主服务器
        // 在全部的从服务器中选择一个最适合的从服务器作为主服务器
        // promoted_slave中记录选举出来的主服务器信息 状态改变为SENTINEL_FAILOVER_STATE_SEND_SLAVEOF_NOONE
        case SENTINEL_FAILOVER_STATE_SELECT_SLAVE:
            sentinelFailoverSelectSlave(ri);
            break;
        // 升级被选中的从服务器为新主服务器
        case SENTINEL_FAILOVER_STATE_SEND_SLAVEOF_NOONE:
            sentinelFailoverSendSlaveOfNoOne(ri);
            break;
        // 等待升级生效，如果升级超时，那么重新选择新主服务器
        // 具体情况请看 sentinelRefreshInstanceInfo 函数 即info处理函数
        // 其中在判断了服务器状态由从变为主后 会更新状态为SENTINEL_FAILOVER_STATE_RECONF_SLAVES
        case SENTINEL_FAILOVER_STATE_WAIT_PROMOTION:
            sentinelFailoverWaitPromotion(ri);
            break;
        // 向从服务器发送 SLAVEOF 命令，让它们同步新主服务器
        case SENTINEL_FAILOVER_STATE_RECONF_SLAVES:
            sentinelFailoverReconfNextSlave(ri);
            break;
    }
}
```

我们可以看到其实故障转移的过程就是一个状态机的转换.我们来重点看看如何在全部的从服务器中选择一个最适合的从服务器作为主服务器.

```java
// 选择合适的从服务器作为新的主服务器
void sentinelFailoverSelectSlave(sentinelRedisInstance *ri) {
    // 在旧主服务器所属的从服务器中，选择新服务器
    sentinelRedisInstance *slave = sentinelSelectSlave(ri);
    /* We don't handle the timeout in this state as the function aborts
     * the failover or go forward in the next state. */
    // 没有合适的从服务器，直接终止故障转移操作
    if (slave == NULL) {
        // 没有可用的从服务器可以提升为新主服务器，故障转移操作无法执行
        sentinelEvent(REDIS_WARNING,"-failover-abort-no-good-slave",ri,"%@");
        // 中止故障转移
        sentinelAbortFailover(ri);
    } else {
        // 成功选定新主服务器
        // 发送事件
        sentinelEvent(REDIS_WARNING,"+selected-slave",slave,"%@");
        // 打开实例的升级标记
        slave->flags |= SRI_PROMOTED;
        // 记录被选中的从服务器
        ri->promoted_slave = slave;
        // 更新故障转移状态 准备向选择出来的新主服务器发送slave no one,将其升级为主服务器
        ri->failover_state = SENTINEL_FAILOVER_STATE_SEND_SLAVEOF_NOONE;
        // 更新状态改变时间
        ri->failover_state_change_time = mstime();
        // 发送事件
        sentinelEvent(REDIS_NOTICE,"+failover-state-send-slaveof-noone",
            slave, "%@");
    }
}
sentinelRedisInstance *sentinelSelectSlave(sentinelRedisInstance *master) {
    sentinelRedisInstance **instance =
        zmalloc(sizeof(instance[0])*dictSize(master->slaves));
    sentinelRedisInstance *selected = NULL;
    int instances = 0;
    dictIterator *di;
    dictEntry *de;
    mstime_t max_master_down_time = 0;
    // 计算可以接收的，从服务器与主服务器之间的最大下线时间
    // 这个值可以保证被选中的从服务器的数据库不会太旧
    if (master->flags & SRI_S_DOWN)   //s_down_since_time为被判断为主观下线的时刻
        max_master_down_time += mstime() - master->s_down_since_time;
    max_master_down_time += master->down_after_period * 10;
    // 遍历所有从服务器
    di = dictGetIterator(master->slaves);
    while((de = dictNext(di)) != NULL) {
        // 从服务器实例
        sentinelRedisInstance *slave = dictGetVal(de);
        mstime_t info_validity_time;
        // 忽略所有 SDOWN 、ODOWN 或者已断线的从服务器
        if (slave->flags & (SRI_S_DOWN|SRI_O_DOWN|SRI_DISCONNECTED)) continue;
        if (mstime() - slave->last_avail_time > SENTINEL_PING_PERIOD*5) continue;
        if (slave->slave_priority == 0) continue;
        /* If the master is in SDOWN state we get INFO for slaves every second.
         * Otherwise we get it with the usual period so we need to account for
         * a larger delay. */
        // 如果主服务器处于 SDOWN 状态，那么 Sentinel 以每秒一次的频率向从服务器发送 INFO 命令
        // 否则以平常频率向从服务器发送 INFO 命令
        // 这里要检查 INFO 命令的返回值是否合法，检查的时间会乘以一个倍数，以计算延迟
        if (master->flags & SRI_S_DOWN)
            info_validity_time = SENTINEL_PING_PERIOD*5;
        else
            info_validity_time = SENTINEL_INFO_PERIOD*3;
        // INFO 回复已过期，不考虑 info_refresh为从实例获取 INFO 命令的回复的时间
        // 如果大于五秒的话删除
        if (mstime() - slave->info_refresh > info_validity_time) continue;
        // 从挂掉的主服务器下线的时间过长，不考虑 保证数据更新
        // master_link_down_time->与主服务器连接断开的的时间
        if (slave->master_link_down_time > max_master_down_time) continue;
        // 将被选中的 slave 保存到数组中
        instance[instances++] = slave;
    }
    dictReleaseIterator(di);
    if (instances) {
        // 对被选中的从服务器进行排序
        qsort(instance,instances,sizeof(sentinelRedisInstance*),
            compareSlavesForPromotion);
        // 这里的比较规则为先比较服务器优先级 相同的情况下比较偏移量,偏移量越大证明数据越新
        // 分值最低的从服务器为被选中服务器
        selected = instance[0];
    }
    zfree(instance);
    // 返回被选中的从服务区
    return selected;
}
```

选择一个从服务器升级主要取决于以下几点:

**1、** 忽略所有SDOWN,ODOWN或者已断线的从服务器；

**2、** 忽略五秒内没有回复过INFO的服务器；

**3、** 忽略与宕机主服务器断开连接超过down_after_period*10的服务器.；

**4、** 再剩下的服务器中以优先级进行排序,优先级相同以offset排序.偏移量越大证明数据越新.；

此时我们就选出了一个主服务器,状态更改为`SENTINEL_FAILOVER_STATE_SEND_SLAVEOF_NOONE`,在下一次时间循环时执行`sentinelFailoverSendSlaveOfNoOne`

```java
void sentinelFailoverSendSlaveOfNoOne(sentinelRedisInstance *ri) {
    int retval;
    /* We can't send the command to the promoted slave if it is now
     * disconnected. Retry again and again with this state until the timeout
     * is reached, then abort the failover. */
    // 如果选中的从服务器断线了，那么在给定的时间内重试
    // 如果给定时间内选中的从服务器也没有上线，那么终止故障迁移操作
    // （一般来说出现这种情况的机会很小，因为在选择新的主服务器时，
    // 已经断线的从服务器是不会被选中的，所以这种情况只会出现在
    // 从服务器被选中，并且发送 SLAVEOF NO ONE 命令之前的这段时间内）
    if (ri->promoted_slave->flags & SRI_DISCONNECTED) {
        // 如果超过时限，就不再重试
        if (mstime() - ri->failover_state_change_time > ri->failover_timeout) {
            sentinelEvent(REDIS_WARNING,"-failover-abort-slave-timeout",ri,"%@");
            sentinelAbortFailover(ri);
        }
        return;
    }
    /* Send SLAVEOF NO ONE command to turn the slave into a master.
     *
     * 向被升级的从服务器发送 SLAVEOF NO ONE 命令，将它变为一个主服务器。
     *
     * We actually register a generic callback for this command as we don't
     * really care about the reply. We check if it worked indirectly observing
     * if INFO returns a different role (master instead of slave). 
     *
     * 这里没有为命令回复关联一个回调函数，因为从服务器是否已经转变为主服务器可以
     * 通过向从服务器发送 INFO 命令来确认
     */
    retval = sentinelSendSlaveOf(ri->promoted_slave,NULL,0);
    if (retval != REDIS_OK) return;
    sentinelEvent(REDIS_NOTICE, "+failover-state-wait-promotion",
        ri->promoted_slave,"%@");
    // 更新状态
    // 这个状态会让 Sentinel 等待被选中的从服务器升级为主服务器
    ri->failover_state = SENTINEL_FAILOVER_STATE_WAIT_PROMOTION;
    // 更新状态改变的时间
    ri->failover_state_change_time = mstime();
}
```

此时我们已经向这个从服务器发送`slave no one`了,我们只需要等待INFO信息就好了,但是我们可以发现进行了状态转换,看看状态转换后的函数吧.

```java
// Sentinel 会通过 INFO 命令的回复检查从服务器是否已经转变为主服务器
// 这里只负责检查时限
void sentinelFailoverWaitPromotion(sentinelRedisInstance *ri) {
    /* Just handle the timeout. Switching to the next state is handled
     * by the function parsing the INFO command of the promoted slave. */
    if (mstime() - ri->failover_state_change_time > ri->failover_timeout) {
        sentinelEvent(REDIS_WARNING,"-failover-abort-slave-timeout",ri,"%@");
        sentinelAbortFailover(ri);
    }
}
```

这里只检验超时,在接收到转换成功后会把状态改为`SENTINEL_FAILOVER_STATE_RECONF_SLAVES`,这个过程在INFO的解析回调中执行.前面文章应该提到过,在`sentinelRefreshInstanceInfo`中进行INFO解析.

```java
void sentinelRefreshInstanceInfo(sentinelRedisInstance *ri, const char *info) {
	.......................
    if ((ri->flags & SRI_SLAVE) && role == SRI_MASTER) {
        /* If this is a promoted slave we can change state to the
         * failover state machine. */
        // 如果这是被选中升级为新主服务器的从服务器
        // 那么更新相关的故障转移属性
        if ((ri->master->flags & SRI_FAILOVER_IN_PROGRESS) &&
            (ri->master->failover_state ==
                SENTINEL_FAILOVER_STATE_WAIT_PROMOTION))
        {
            /* Now that we are sure the slave was reconfigured as a master
             * set the master configuration epoch to the epoch we won the
             * election to perform this failover. This will force the other
             * Sentinels to update their config (assuming there is not
             * a newer one already available). */
            // 这是一个被 Sentinel 发送 SLAVEOF no one 之后由从服务器变为主服务器的实例
            // 将这个新主服务器的配置纪元设置为 Sentinel 赢得领头选举的纪元
            // 这一操作会强制其他 Sentinel 更新它们自己的配置
            // （假设没有一个更新的纪元存在的话）
            // 更新从服务器的主服务器（已下线）的配置纪元
            ri->master->config_epoch = ri->master->failover_epoch;
            // 设置从服务器的主服务器（已下线）的故障转移状态
            // 这个状态会让从服务器开始同步新的主服务器
            ri->master->failover_state = SENTINEL_FAILOVER_STATE_RECONF_SLAVES;
            // 更新从服务器的主服务器（已下线）的故障转移状态变更时间
            ri->master->failover_state_change_time = mstime();
            // 将当前 Sentinel 状态保存到配置文件里面
            sentinelFlushConfig();
            // 发送事件
            sentinelEvent(REDIS_WARNING,"+promoted-slave",ri,"%@");
            sentinelEvent(REDIS_WARNING,"+failover-state-reconf-slaves",
                ri->master,"%@");
            // 执行脚本
            sentinelCallClientReconfScript(ri->master,SENTINEL_LEADER,
                "start",ri->master->addr,ri->addr);
        } 
        .........................
}
```

这样状态就成功的转移到了`SENTINEL_FAILOVER_STATE_RECONF_SLAVES`,我们只需要对剩下的从服务器发送`slave of`就万事大吉了.即`sentinelFailoverReconfNextSlave`命令:

```java
void sentinelFailoverReconfNextSlave(sentinelRedisInstance *master) {
    dictIterator *di;
    dictEntry *de;
    int in_progress = 0;
    // 计算正在同步新主服务器的从服务器数量
    di = dictGetIterator(master->slaves);
    while((de = dictNext(di)) != NULL) {
        sentinelRedisInstance *slave = dictGetVal(de);
        // SLAVEOF 命令已发送，或者同步正在进行
        if (slave->flags & (SRI_RECONF_SENT|SRI_RECONF_INPROG))
            in_progress++;
    }
    dictReleaseIterator(di);
    // 如果正在同步的从服务器的数量少于 parallel-syncs 选项的值
    // 那么继续遍历从服务器，并让从服务器对新主服务器进行同步
    di = dictGetIterator(master->slaves);
    while(in_progress < master->parallel_syncs &&
          (de = dictNext(di)) != NULL)
    {
        sentinelRedisInstance *slave = dictGetVal(de);
        int retval;
        /* Skip the promoted slave, and already configured slaves. */
        // 跳过新主服务器，以及已经完成了同步的从服务器
        if (slave->flags & (SRI_PROMOTED|SRI_RECONF_DONE)) continue;
        /* If too much time elapsed without the slave moving forward to
         * the next state, consider it reconfigured even if it is not.
         * Sentinels will detect the slave as misconfigured and fix its
         * configuration later. */
        if ((slave->flags & SRI_RECONF_SENT) && //主从复制超时
            (mstime() - slave->slave_reconf_sent_time) >
            SENTINEL_SLAVE_RECONF_TIMEOUT)//默认十秒
        {
            // 发送重同步事件
            sentinelEvent(REDIS_NOTICE,"-slave-reconf-sent-timeout",slave,"%@");
            // 清除已发送 SLAVEOF 命令的标记
            slave->flags &= ~SRI_RECONF_SENT;
            slave->flags |= SRI_RECONF_DONE;
        }
        /* Nothing to do for instances that are disconnected or already
         * in RECONF_SENT state. */
        // 如果已向从服务器发送 SLAVEOF 命令，或者同步正在进行
        // 又或者从服务器已断线，那么略过该服务器
        if (slave->flags & (SRI_DISCONNECTED|SRI_RECONF_SENT|SRI_RECONF_INPROG))
            continue;
        /* Send SLAVEOF <new master>. */
        // 向从服务器发送 SLAVEOF 命令，让它同步新主服务器
        retval = sentinelSendSlaveOf(slave,
                master->promoted_slave->addr->ip, //选出的主服务器的IP和端口
                master->promoted_slave->addr->port);
        if (retval == REDIS_OK) {
            // 将状态改为 SLAVEOF 命令已发送
            slave->flags |= SRI_RECONF_SENT;
            // 更新发送 SLAVEOF 命令的时间
            slave->slave_reconf_sent_time = mstime();
            sentinelEvent(REDIS_NOTICE,"+slave-reconf-sent",slave,"%@");
            // 增加当前正在同步的从服务器的数量
            in_progress++;
        }
    }
    dictReleaseIterator(di);
    /* Check if all the slaves are reconfigured and handle timeout. */
    // 判断是否所有从服务器的同步都已经完成
    sentinelFailoverDetectEnd(master);
}
```

当然对所有的从服务器节点执行`slave_of`可能会超时或者在同步信息时主服务器宕机.这是我们需要更新状态

```java
void sentinelFailoverDetectEnd(sentinelRedisInstance *master) {
    int not_reconfigured = 0, timeout = 0;
    dictIterator *di;
    dictEntry *de;
    // 上次 failover 状态更新以来，经过的时间,即slove_of已进行时长
    mstime_t elapsed = mstime() - master->failover_state_change_time;
    /* We can't consider failover finished if the promoted slave is
     * not reachable. */
    // 如果新主服务器已经下线，那么故障转移操作不成功
    if (master->promoted_slave == NULL ||
        master->promoted_slave->flags & SRI_S_DOWN) return;
    /* The failover terminates once all the reachable slaves are properly
     * configured. */
    // 计算未完成同步的从服务器的数量
    di = dictGetIterator(master->slaves);
    while((de = dictNext(di)) != NULL) {
        sentinelRedisInstance *slave = dictGetVal(de);
        // 新主服务器和已完成同步的从服务器不计算在内
        if (slave->flags & (SRI_PROMOTED|SRI_RECONF_DONE)) continue;
        // 已下线的从服务器不计算在内
        if (slave->flags & SRI_S_DOWN) continue;
        // 增一
        not_reconfigured++;
    }
    dictReleaseIterator(di);
    /* Force end of failover on timeout. */
    // 故障操作因为超时而结束
    // failover_timeout:刷新故障迁移状态的最大时限
    if (elapsed > master->failover_timeout) {
        // 忽略未完成的从服务器
        not_reconfigured = 0;
        // 打开超时标志
        timeout = 1;
        // 发送超时事件
        sentinelEvent(REDIS_WARNING,"+failover-end-for-timeout",master,"%@");
    }
    // 所有从服务器都已完成同步，故障转移结束
    if (not_reconfigured == 0) {
        sentinelEvent(REDIS_WARNING,"+failover-end",master,"%@");
        // 更新故障转移状态
        // 这一状态将告知 Sentinel ，所有从服务器都已经同步到新主服务器
        // 下次也就不会再执行这个函数了
        master->failover_state = SENTINEL_FAILOVER_STATE_UPDATE_CONFIG;
        // 更新状态改变的时间
        master->failover_state_change_time = mstime();
    }
    /* If I'm the leader it is a good idea to send a best effort SLAVEOF
     * command to all the slaves still not reconfigured to replicate with
     * the new master. */
    // 当然 就算超时也可能有很多以及完成的从服务器节点 会跳过那些已完成节点
    // 因为failover_state状态没变,等待某次进入时状态改变 从而不在执行这个函数 那个时候故障转移也OK了.
    if (timeout) {
      //超时的话 需要重新发送slaveof
        dictIterator *di;
        dictEntry *de;
        // 遍历所有从服务器
        di = dictGetIterator(master->slaves);
        while((de = dictNext(di)) != NULL) {
            sentinelRedisInstance *slave = dictGetVal(de);
            int retval;
            // 跳过已发送 SLAVEOF 命令，以及已经完成同步的所有从服务器
            if (slave->flags &
                (SRI_RECONF_DONE|SRI_RECONF_SENT|SRI_DISCONNECTED)) continue;
            // 发送命令
            retval = sentinelSendSlaveOf(slave,
                    master->promoted_slave->addr->ip,
                    master->promoted_slave->addr->port);
            if (retval == REDIS_OK) {
                sentinelEvent(REDIS_NOTICE,"+slave-reconf-sent-be",slave,"%@");
                // 打开从服务器的 SLAVEOF 命令已发送标记
                slave->flags |= SRI_RECONF_SENT;
            }
        }
        dictReleaseIterator(di);
    }
    // 根据master->failover_state我们就可以得出是否故障转移完成
}
```

到这里一次故障转移就完成了.我们耳熟能详的redis的哨兵机制也就算是说完了.
