# 16、Redis 源码解析 - Redis 哨兵机制[3] 判断下线
- 来源：https://ddkk.com/zhuanlan/db/redis/7/16.html
- 分类：缓存数据库
- 分组：教程目录
上一篇文章我们分析了如何使得sentinel在配置文件中只有主服务器节点的情况下经过节点间通信,构成一个拥有主服务器,从服务器和sentinel节点的网状结构.这篇文章来说说如何进行判断下线,即一个主服务器当前已经宕机.

### sentinelHandleRedisInstance

我们接着上一篇中`sentinelHandleRedisInstance`没说完的地方继续

```java
void sentinelHandleRedisInstance(sentinelRedisInstance *ri) {
    /* ========== MONITORING HALF ============ */
    /* ==========     监控操作    =========*/
	.......................
    /* ============== ACTING HALF ============= */
    /* ==============  故障检测   ============= */
    /* We don't proceed with the acting half if we are in TILT mode.
     * TILT happens when we find something odd with the time, like a
     * sudden change in the clock. */
    // 如果 Sentinel 处于 TILT 模式，那么不执行故障检测。
    if (sentinel.tilt) {
        // 如果 TILI 模式未解除，那么不执行动作 默认为PING间隔的30倍
        // PING间隔默认为一秒 但是配置文件中判断多长时间为下线的那个参数小于一秒时PING会更新为那个值
        if (mstime()-sentinel.tilt_start_time < SENTINEL_TILT_PERIOD) return;
        // 时间已过，退出 TILT 模式
        sentinel.tilt = 0;
        sentinelEvent(REDIS_WARNING,"-tilt",NULL,"#tilt mode exited");
    }
    /* Every kind of instance */
    // 检查给定实例是否进入 主观下降 状态 
    // 也就是在down_after时间内连续收到无效回复或者无回复时设置
    sentinelCheckSubjectivelyDown(ri);
    /* Masters and slaves */
    if (ri->flags & (SRI_MASTER|SRI_SLAVE)) {
        /* Nothing so far. */
    }
    /* Only masters */
    /* 对主服务器进行处理 */
    if (ri->flags & SRI_MASTER) {
        // 判断 master 是否进入 客观下降(ODOWN) 状态
        sentinelCheckObjectivelyDown(ri);
        // 如果主服务器进入了 ODOWN 状态，那么开始一次故障转移操作
        //里面会执行sentinelStartFailover 变更状态为SRI_FAILOVER_IN_PROGRESS
        if (sentinelStartFailoverIfNeeded(ri)) 
            // 强制向其他 Sentinel 发送 SENTINEL is-master-down-by-addr 命令
            // 刷新其他 Sentinel 关于主服务器的状态
            sentinelAskMasterStateToOtherSentinels(ri,SENTINEL_ASK_FORCED);
        // 执行故障转移
        // 第一次由主观下降到客观下降会执行sentinelAskMasterStateToOtherSentinels
        // 但同样会执行sentinelFailoverStateMachine 因为状态不对 第一条语句就会跳出
        sentinelFailoverStateMachine(ri);
        // 如果有需要的话，向其他 Sentinel 发送 SENTINEL is-master-down-by-addr 命令
        // 刷新其他 Sentinel 关于主服务器的状态
        // 这一句是对那些没有进入 if(sentinelStartFailoverIfNeeded(ri)) { /* ... */ }
        // 语句的主服务器使用的
        // 显然第一次由主观下降到客观下降会执行这个语句
        sentinelAskMasterStateToOtherSentinels(ri,SENTINEL_NO_FLAGS);
    }
}
```

这里需要说的是`SRI_S_DOWN`为主观下降,即自己认为这个服务器节点下线.`SRI_O_DOWN`为客观下降,即发起投票后认为其下线.我们先列出这些函数的功能

函数名
功能

sentinelCheckSubjectivelyDown
判断进入主观下线

sentinelCheckObjectivelyDown
判断进入客观下线

sentinelStartFailoverIfNeeded
判断是否进行故障转移

sentinelAskMasterStateToOtherSentinels
根据当前flag状态决定向其他sentinel发送判断下线还是投票选举

sentinelFailoverStateMachine
执行故障转移 下一篇再谈它

最有意思的是`sentinelAskMasterStateToOtherSentinels`,它可以根据状态的不同来执行不同的功能,所以它出现了两次.

#### sentinelCheckSubjectivelyDown

我们来看看如何判断进入`主观下线`

```java
void sentinelCheckSubjectivelyDown(sentinelRedisInstance *ri) {
    mstime_t elapsed = 0;
    if (ri->last_ping_time) //实例最后一次发送PING命令的时间
        elapsed = mstime() - ri->last_ping_time;
    /* Check if we are in need for a reconnection of one of the 
     * links, because we are detecting low activity.
     *
     * 如果检测到连接的活跃度（activity）很低，那么考虑重断开连接，并进行重连
     *
     * 1) Check if the command link seems connected, was connected not less
     *    than SENTINEL_MIN_LINK_RECONNECT_PERIOD, but still we have a
     *    pending ping for more than half the timeout. */
    // 考虑断开实例的 cc 连接
    if (ri->cc &&
        (mstime() - ri->cc_conn_time) > SENTINEL_MIN_LINK_RECONNECT_PERIOD &&
        ri->last_ping_time != 0 && /* Ther is a pending ping... */
        /* The pending ping is delayed, and we did not received
         * error replies as well. */
        (mstime() - ri->last_ping_time) > (ri->down_after_period/2) &&
        (mstime() - ri->last_pong_time) > (ri->down_after_period/2)) 
        //连接时长已超过最短连接间隔 ping已经发出 但在down_after_period/2的时间内没有收到pong
    {
        sentinelKillLink(ri,ri->cc); //断开实例的连接
    }
    /* 2) Check if the pubsub link seems connected, was connected not less
     *    than SENTINEL_MIN_LINK_RECONNECT_PERIOD, but still we have no
     *    activity in the Pub/Sub channel for more than
     *    SENTINEL_PUBLISH_PERIOD * 3.
     */
    // 考虑断开实例的 pc 连接
    if (ri->pc &&
        (mstime() - ri->pc_conn_time) > SENTINEL_MIN_LINK_RECONNECT_PERIOD &&
        (mstime() - ri->pc_last_activity) > (SENTINEL_PUBLISH_PERIOD*3))
        //最后一次从这个服务器接收消息的时间大于发送publish的最大时间的三倍,也就是6秒时断开接收频道信息的连接
    {
        sentinelKillLink(ri,ri->pc); //断开连接 设置flag为SRI_DISCONNECTED,
    }
    /* Update the SDOWN flag. We believe the instance is SDOWN if:
     *
     * 更新 SDOWN 标识。如果以下条件被满足，那么 Sentinel 认为实例已下线：
     *
     * 1) It is not replying.
     *    它没有回应命令
     * 2) We believe it is a master, it reports to be a slave for enough time
     *    to meet the down_after_period, plus enough time to get two times
     *    INFO report from the instance. 
     *    Sentinel 认为实例是主服务器，这个服务器向 Sentinel 报告它将成为从服务器，
     *    但在超过给定时限之后，服务器仍然没有完成这一角色转换。
     *    发送在主服务器宕机重连的时候
     */
    if (elapsed > ri->down_after_period || //现在距离上次ping的时间已经超过了down_after_period
        (ri->flags & SRI_MASTER &&
         ri->role_reported == SRI_SLAVE &&
         mstime() - ri->role_reported_time >
          (ri->down_after_period+SENTINEL_INFO_PERIOD*2))) //两个INFO的间隔
    {
        /* Is subjectively down */
        if ((ri->flags & SRI_S_DOWN) == 0) {
            // 发送事件
            sentinelEvent(REDIS_WARNING,"+sdown",ri,"%@");
            // 记录进入 SDOWN 状态的时间
            ri->s_down_since_time = mstime();
            // 这一点很重要 判断为主观下线时更新SDOWN标志
            ri->flags |= SRI_S_DOWN; 
        }
    } else {
        // 移除（可能有的） SDOWN 状态
        /* Is subjectively up */
        if (ri->flags & SRI_S_DOWN) {
            // 发送事件
            sentinelEvent(REDIS_WARNING,"-sdown",ri,"%@");
            // 移除相关标志
            ri->flags &= ~(SRI_S_DOWN|SRI_SCRIPT_KILL_SENT);
        }
    }
}
```

**我们可以在源码中看到会在连接不活跃的时候采取重连措施.**

判断进入主观下线有两个条件

**1、** 距离上次ping的时间已经超过了down_after_period,配置文件中指定；

**2、** Sentinel认为实例是主服务器,这个服务器向Sentinel报告它将成为从服务器,且在两个INFO命令间隔还是没有转换成功,认为其下线.；

我们在来看看当判断为`主观下线`时如果转换为`客观下线`.

我们来看看`sentinelCheckObjectivelyDown`,其可以判断master是否进入`客观下线`.先说一点在真的发生主观下线的时候第一次执行这个函数只有很小的概率可以使状态转为`客观下线`,因为它并没有向其他sentinel节点询问,只是简单的检测当前sentinel中存储的状态而已.此时我们需要询问其他sentinel,看看是否真的使得这个节点下线,就是`sentinelAskMasterStateToOtherSentinels`函数所做的事情.

#### sentinelCheckObjectivelyDown

```java
void sentinelCheckObjectivelyDown(sentinelRedisInstance *master) {
    dictIterator *di;
    dictEntry *de;
    int quorum = 0, odown = 0;
    // 如果当前 Sentinel 将主服务器判断为主观下线
    // 那么检查是否有其他 Sentinel 同意这一判断
    // 当同意的数量足够时，将主服务器判断为客观下线
    if (master->flags & SRI_S_DOWN) {
        /* Is down for enough sentinels? */
        // 统计同意的 Sentinel 数量（起始的 1 代表本 Sentinel）
        quorum = 1; /* the current sentinel. */
        /* Count all the other sentinels. */
        // 统计其他认为 master 进入下线状态的 Sentinel 的数量
        di = dictGetIterator(master->sentinels); //得到监视这个服务器的其他哨兵结点
        while((de = dictNext(di)) != NULL) {
            sentinelRedisInstance *ri = dictGetVal(de);
            // 该 SENTINEL 也认为 master 已下线
            if (ri->flags & SRI_MASTER_DOWN) quorum++;
        }
        dictReleaseIterator(di);
        // 如果投票得出的支持数目大于等于判断 ODOWN 所需的票数
        // 那么进入 ODOWN 状态
        if (quorum >= master->quorum) odown = 1;
    }
    /* Set the flag accordingly to the outcome. */
    if (odown) {
        // master 已 ODOWN
        if ((master->flags & SRI_O_DOWN) == 0) {
            // 发送事件
            sentinelEvent(REDIS_WARNING,"+odown",master,"%@quorum %d/%d",
                quorum, master->quorum);
            // 状态转移为ODOWN 
            master->flags |= SRI_O_DOWN;
            // 记录进入 ODOWN 的时间
            master->o_down_since_time = mstime();
        }
    } else {
        // 未进入 ODOWN
        if (master->flags & SRI_O_DOWN) {
            // 如果 master 曾经进入过 ODOWN 状态，那么移除该状态
            // 发送事件
            sentinelEvent(REDIS_WARNING,"-odown",master,"%@");
            // 移除 ODOWN 标志
            master->flags &= ~SRI_O_DOWN;
        }
    }
}
```

#### sentinelAskMasterStateToOtherSentinels

```java
#define SENTINEL_ASK_FORCED (1<<0)
void sentinelAskMasterStateToOtherSentinels(sentinelRedisInstance *master, int flags) {
    dictIterator *di;
    dictEntry *de;
    // 遍历正在监视相同 master 的所有 sentinel
    // 向它们发送 SENTINEL is-master-down-by-addr 命令
    di = dictGetIterator(master->sentinels);
    while((de = dictNext(di)) != NULL) {
        sentinelRedisInstance *ri = dictGetVal(de);
        // 距离该 sentinel 最后一次回复 SENTINEL master-down-by-addr 命令已经过了多久
        mstime_t elapsed = mstime() - ri->last_master_down_reply_time;
        char port[32];
        int retval;
        /* If the master state from other sentinel is too old, we clear it. */
        // 如果目标 Sentinel 关于主服务器的信息已经太久没更新，那么我们清除它
        if (elapsed > SENTINEL_ASK_PERIOD*5) {
            ri->flags &= ~SRI_MASTER_DOWN;
            sdsfree(ri->leader);
            ri->leader = NULL;
        }
        /* Only ask if master is down to other sentinels if:
         *
         * 只在以下情况满足时，才向其他 sentinel 询问主服务器是否已下线
         *
         * 1) We believe it is down, or there is a failover in progress.
         *    本 sentinel 相信服务器已经下线，或者针对该主服务器的故障转移操作正在执行
         * 2) Sentinel is connected.
         *    目标 Sentinel 与本 Sentinel 已连接
         * 3) We did not received the info within SENTINEL_ASK_PERIOD ms. 
         *    当前 Sentinel 在 SENTINEL_ASK_PERIOD 毫秒内没有获得过目标 Sentinel 发来的信息
         * 4) 条件 1 和条件 2 满足而条件 3 不满足，但是 flags 参数给定了 SENTINEL_ASK_FORCED 标识
         */
        if ((master->flags & SRI_S_DOWN) == 0) continue;
        if (ri->flags & SRI_DISCONNECTED) continue;
        if (!(flags & SENTINEL_ASK_FORCED) && //这个&&之前满足的话证明这是状态为主观下线时调用
        // 现在的时间减去上次上次SENTINEL命令回复之间时间小于1秒 
        // 原因是投票可能一轮不会出现leader 防止每次事件循环都会投票 所以设置最多一秒一次
            mstime() - ri->last_master_down_reply_time < SENTINEL_ASK_PERIOD)
            continue;
        /* Ask */
        // 发送 SENTINEL is-master-down-by-addr 命令
        ll2string(port,sizeof(port),master->addr->port);
        retval = redisAsyncCommand(ri->cc,
                    sentinelReceiveIsMasterDownReply, NULL,
                    //                          [IP][port][配置纪元][runid/*]
                    // 最后一项上为'*'代表这条命令仅仅用于检测服务器的客观下线
                    "SENTINEL is-master-down-by-addr %s %s %llu %s",
                    master->addr->ip, port,
                    sentinel.current_epoch,
                    // 如果本 Sentinel 已经检测到 master 进入 ODOWN 
                    // 并且要开始一次故障转移，那么向其他 Sentinel 发送自己的运行 ID
                    // 让对方将给自己投一票（如果对方在这个纪元内还没有投票的话）
                    // 当我们设置flag为客观下线时会设置failover_state为SENTINEL_FAILOVER_STATE_WAIT_START
                    // 即满足下述条件 开始选举leader
                    (master->failover_state > SENTINEL_FAILOVER_STATE_NONE) ?
                    server.runid : "*"); //
        if (retval == REDIS_OK) ri->pending_commands++;
    }
    dictReleaseIterator(di);
}
```

我们可以最后发送命令时会根据`failover_state`来决定发`server.runid` 还是 “*”,前者代表请求投票自己为leader,后者代表这只是一次判断是否进行客观下线,而在判断了`客观下线`后状态且进入故障转移的时候会设置为`SENTINEL_FAILOVER_STATE_WAIT_START`其大于`SENTINEL_FAILOVER_STATE_NONE`,满足条件.所以在转换为`客观下线`之前会向其他sentinel节点发送消息,请求判断这个节点是否真的下线,在下一次进入`sentinelHandleRedisInstance`的时候,`sentinelCheckSubjectivelyDown`就有效了.

#### sentinelStartFailoverIfNeeded

接下来看看`sentinelStartFailoverIfNeeded`

```java
int sentinelStartFailoverIfNeeded(sentinelRedisInstance *master) {
    /* We can't failover if the master is not in O_DOWN state. */
    // 客观下线直接退出 这就是第一次进入sentinelHandleRedisInstance不执行的原因
    if (!(master->flags & SRI_O_DOWN)) return 0; 
    /* Failover already in progress? */
    if (master->flags & SRI_FAILOVER_IN_PROGRESS) return 0;
    /* Last failover attempt started too little time ago? */
    // 上一次故障转移尝试开始的时间太短
    if (mstime() - master->failover_start_time <
        master->failover_timeout*2)
    {
        if (master->failover_delay_logged != master->failover_start_time) {
            time_t clock = (master->failover_start_time +
                            master->failover_timeout*2) / 1000;
            char ctimebuf[26];
            ctime_r(&clock,ctimebuf);
            ctimebuf[24] = '\0'; /* Remove newline. */
            master->failover_delay_logged = master->failover_start_time;
            redisLog(REDIS_WARNING,
                "Next failover delay: I will not start a failover before %s",
                ctimebuf);
        }
        return 0;
    }
    // 开始一次故障转移 此时已经确定这个节点是要下线的了
    sentinelStartFailover(master); //服务器flag变更为SRI_FAILOVER_IN_PROGRESS
                                //初始状态为SENTINEL_FAILOVER_STATE_WAIT_START
                                //状态转移很重要
    return 1;
}
```

此时我们已经判断出某个主服务器已经下线,并已经由其他sentinel确定.状态已改变为`客观下线`,这个时候可以开始故障转移了.
