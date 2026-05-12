# 15、Redis 源码解析 - Redis 哨兵机制[2] 信息同步与TILT模式
- 来源：https://ddkk.com/zhuanlan/db/redis/7/15.html
- 分类：缓存数据库
- 分组：教程目录
其实这里的副标题"信息同步"是有点混淆视听,这篇文章并不是将"一致性"这样一个问题.在我们使用redis提供的哨兵时,我们只需要在每一个哨兵的配置文件中写上它所要监控的主服务器地址即可,我们根本不必去关心其他sentinel节点和从服务器,它们会在sentinel集群的交互过程中自动交换信息,这篇文章要将的就是这样一个区间[初始化完成后,主服务器主观下线前],在这个区间中所有有关系的sentinel节点,主服务器,从服务器将连成一张网.那么是如何做到`信息同步`的呢?我们就来看看吧!

这篇文章的思路如下

**1、** 首先用文字简要的阐述如何可以做到信息同步；

**2、** 对于每一步进行源码分析；

#### 如何?

首先我们在每个sentinel节点启动的时候它们都只会加载配置文件中指定的所有主服务器,然后建立两个连接,一个是命令连接,负责发送命令.一个是订阅连接,负责接收发到此主服务器上的发布消息.它们分别负责获取从服务器节点信息和其他sentinel节点信息.sentinel节点一般会每十秒向主服务器发送INFO信息获取从服务器信息,当然还有其他主服务器的状态,当解析出从服务器信息的时候对从服务器进行连接,然后创建一个实例,上一篇文章说过,就是加到sentinel的主字典中,然后在对应的主服务器中建立一个slave链表,方便调用.这样我们就获取了主服务器的信息.

sentinel节点的信息通过订阅连接来获取.每个sentinel节点在监视了主服务器节点和从服务器节点后会已命令的形式以默认两秒一次的频率发送`PUBLISH`信息,这样其他与这个服务器建立订阅连接的sentinel节点就可以获取到这条信息,从而知道这个sentinel节点的存在,然后与之建立一个连接,即命令连接,负责之间的PING与SENTINEL命令的传递,它们之间不需要订阅连接.当然它本身也会接到这条消息,只需要判断其中的消息是不是自己发的很容易的排除.当然还会在知道服务器建立一个sentinel链表,存着所有监视这个服务器节点的sentinel信息.

sentinel发送的信息格式如下

`PUBLISH __sentinel__:hello ", , , ,,, ,"`

参数
意义

s_ip
sentinel本身的IP

s_port
sentinel本身的port IP和port使得其他sentinel可以发起连接

s_runid
sentinel运行时ID

s_epoch
sentinel的纪元 用于故障转移 默认两秒更新一次

m_name
主服务器名称由配置文件加载 从服务自动生成 格式为

m_ip
服务器IP

m_port
服务器port

m_epoch
服务器当前纪元

可以看到根据上述信息我们可以很好的得到发送这个信息的sentinel的重要信息,然后其他接收到这条消息的sentinel就可以与之发起命令连接了,并更新其信息.当然这个过程是相互的,第一次是为了初始化信息,两秒一次则是为了更新信息.

到这这个系统就稳定下来了,这也是这篇文章的要将的内容,接下来我们在源码中看看这一切是如何运作的.

### 源码解析

我们从哨兵机制的主函数`sentinelTimer`入手

```java
void sentinelTimer(void) {
    // 记录本次 sentinel 调用的事件，
    // 并判断是否需要进入 TITL 模式
    sentinelCheckTiltCondition();
    // 执行定期操作
    // 比如 PING 实例、分析主服务器和从服务器的 INFO 命令
    // 向其他监视相同主服务器的 sentinel 发送问候信息
    // 并接收其他 sentinel 发来的问候信息
    // 执行故障转移操作，等等
    sentinelHandleDictOfRedisInstances(sentinel.masters);
	//脚本相关操作
	....................
    /* We continuously change the frequency of the Redis "timer interrupt"
     * in order to desynchronize every Sentinel from every other.
     * This non-determinism avoids that Sentinels started at the same time
     * exactly continue to stay synchronized asking to be voted at the
     * same time again and again (resulting in nobody likely winning the
     * election because of split brain voting). */
     //用一个巧妙的操作降低选举sentinel时重新选举的概率
    server.hz = REDIS_DEFAULT_HZ + rand() % REDIS_DEFAULT_HZ;
}
```

我们可以看到第一个函数是判断是否进入`TILT模式`,那么TILT是什么呢?通过[查阅文档](https://redis.io/topics/sentinel)我们可以得到如下信息

> Redis Sentinel is heavily dependent on the computer time: for instance in order to understand if an instance is available it remembers the time of the latest successful reply to the PING command, and compares it with the current time to understand how old it is.
>
> However if the computer time changes in an unexpected way, or if the computer is very busy, or the process blocked for some reason, Sentinel may start to behave in an unexpected way.
>
> The TILT mode is a special “protection” mode that a Sentinel can enter when something odd is detected that can lower the reliability of the system. The Sentinel timer interrupt is normally called 10 times per second, so we expect that more or less 100 milliseconds will elapse between two calls to the timer interrupt.
>
> What a Sentinel does is to register the previous time the timer interrupt was called, and compare it with the current call: if the time difference is negative or unexpectedly big (2 seconds or more) the TILT mode is entered (or if it was already entered the exit from the TILT mode postponed).
>
> When in TILT mode the Sentinel will continue to monitor everything, but:
>
>
> It stops acting at all.
> It starts to reply negatively to SENTINEL is-master-down-by-addr requests as the ability to detect a failure is no longer trusted.
>
> If everything appears to be normal for 30 second, the TILT mode is exited.
>
> Note that in some way TILT mode could be replaced using the monotonic clock API that many kernels offer. However it is not still clear if this is a good solution since the current system avoids issues in case the process is just suspended or not executed by the scheduler for a long time.

> Redis哨兵是及其依赖于系统时间的,例如为了了解某个实例是否是可用的,其会记住最后一次成功回复PING命令的时间,然后与现在时间进行比较判断生存时间.
>
> 但是如果计算机时间发生了意外的变化,或者计算机现在非常忙碌,或者进程因为某些原因阻塞,哨兵可能会有意料之外的行为
>
> TILT是一个特殊的保护模式,当检测到一些异常情况时会进入,这会降低系统的可靠性(笔者注:因为此时故障转移无法进行).sentinel计时器中断一般一秒十次.我们希望两次定时器中断的时间内控制在大约100毫秒.
>
> Sentinel的作用是在上次调用计时器中断时进行注册,并将其与当前调用进行比较,如果时差为负或者出乎意料的大(2秒或更长时间),则进入TILT模式(如果已经进入了TILT模式则延迟退出)
>
> 当进入TILT模式时哨兵将会继续监视所有内容,但是
>
>
> 停止所有的动作
> 会开始否定SENTINEL is-master-down-by-addr命令因为其不信任故障检测的能力
>
> 如果30秒以内一切正常则退出TILT模式.
>
> 注意可以使用很多内核提供的单调时钟API已替换TILT模式.但是尚不清楚这是否是一个好的解决方案,因为当前系统避免了如果进程只是被挂起或长时间未由调度程序执行这种问题.

所以我们可以看到其只是一种保护模式,在计算机时间发生严重变化的时候进入`TILT模式`,并禁止除了监控以外的操作,因为此时sentinel依赖于时间,判断某个节点下线是根据PING的间隔来实现的,如果进入`TILT模式`证明时钟出现问题,此时这个sentinel已经不能被相信了.

```java
void sentinelCheckTiltCondition(void) {
    // 计算当前时间
    mstime_t now = mstime();
    // 计算上次运行 sentinel 和当前时间的差
    mstime_t delta = now - sentinel.previous_time;
    // 如果差为负数，或者大于 2 秒钟，那么进入 TILT 模式
    if (delta < 0 || delta > SENTINEL_TILT_TRIGGER) {
        // 打开标记
        sentinel.tilt = 1;
        // 记录进入 TILT 模式的开始时间
        sentinel.tilt_start_time = mstime();
        // 打印事件
        sentinelEvent(REDIS_WARNING,"+tilt",NULL,"#tilt mode entered");
    }
    // 更新最后一次 sentinel 运行时间
    sentinel.previous_time = mstime();
}
```

我们可以看到函数的实现其实很简单,判断的两个条件文档中已经说了.差为负的话说明时钟出现问题.大于二的话则证明当前进程可能被阻塞或十分繁忙.

接下来就是重点中的重点,`sentinelHandleDictOfRedisInstances`,它遍历所有在此sentinel中存储的节点,并执行`sentinelHandleRedisInstance`

```java
void sentinelHandleDictOfRedisInstances(dict *instances) {
    dictIterator *di;
    dictEntry *de;
    sentinelRedisInstance *switch_to_promoted = NULL;
    /* There are a number of things we need to perform against every master. */
    // 遍历多个实例，这些实例可以是多个主服务器、多个从服务器或者多个 sentinel
    di = dictGetIterator(instances);
    while((de = dictNext(di)) != NULL) {
        // 取出实例对应的实例结构
        sentinelRedisInstance *ri = dictGetVal(de);
        // 执行调度操作
        sentinelHandleRedisInstance(ri);
        // 如果被遍历的是主服务器，那么递归地遍历该主服务器的所有从服务器
        // 以及所有 sentinel
        if (ri->flags & SRI_MASTER) {
            // 所有从服务器
            sentinelHandleDictOfRedisInstances(ri->slaves);
            // 所有 sentinel
            sentinelHandleDictOfRedisInstances(ri->sentinels);
            // 对已下线主服务器（ri）的故障迁移已经完成
            // ri 的所有从服务器都已经同步到新主服务器
            if (ri->failover_state == SENTINEL_FAILOVER_STATE_UPDATE_CONFIG) {
                // 已选出新的主服务器
                switch_to_promoted = ri;
            }
        }
    }
    // 将原主服务器（已下线）从主服务器表格中移除，并使用新主服务器代替它
    if (switch_to_promoted)
        sentinelFailoverSwitchToPromotedSlave(switch_to_promoted);
    dictReleaseIterator(di); //释放迭代器
}
```

```java
// 对给定的实例执行定期操作
void sentinelHandleRedisInstance(sentinelRedisInstance *ri) {
    /* ========== MONITORING HALF ============ */
    /* ==========     监控操作    =========*/
    /* Every kind of instance */
    /* 对所有类型实例进行处理 */
    // 如果有需要的话，创建连向实例的网络连接
    // 这也会在哨兵刚刚启动的时候连接所有的主服务器
    sentinelReconnectInstance(ri);
    // 根据情况，向实例发送 PING、 INFO 或者 PUBLISH 命令
    sentinelSendPeriodicCommands(ri);
    /* ============== ACTING HALF ============= */
    /* ==============  故障检测   ============= */
	........................
}
```

注释掉的地方是故障检测与故障转移操作,我们在下一篇文章中分析.

```java
void sentinelReconnectInstance(sentinelRedisInstance *ri) {
    // 示例未断线（已连接）
    // 因为这个函数在每次定时器中断被调用,所以需要排除很多已连接的
    if (!(ri->flags & SRI_DISCONNECTED)) return;
    /* Commands connection. */
    // 对所有实例创建一个用于发送 Redis 命令的连接
    if (ri->cc == NULL) {
        // 连接实例
        ri->cc = redisAsyncConnect(ri->addr->ip,ri->addr->port);
        // 连接出错
        if (ri->cc->err) {
            sentinelEvent(REDIS_DEBUG,"-cmd-link-reconnection",ri,"%@%s",
                ri->cc->errstr);
            sentinelKillLink(ri,ri->cc);
        // 连接成功
        } else {
            // 设置连接属性
            ri->cc_conn_time = mstime();
            ri->cc->data = ri;
            redisAeAttach(server.el,ri->cc);
            // 设置连线 callback
            redisAsyncSetConnectCallback(ri->cc,
                                            sentinelLinkEstablishedCallback);
            // 设置断线 callback
            redisAsyncSetDisconnectCallback(ri->cc,
                                            sentinelDisconnectCallback);
            // 发送 AUTH 命令，验证身份
            sentinelSendAuthIfNeeded(ri,ri->cc);
            sentinelSetClientName(ri,ri->cc,"cmd");
            // 发送一个PING
            sentinelSendPing(ri);
        }
    }
    /* Pub / Sub */
    // 对主服务器和从服务器，创建一个用于订阅频道的连接 sentinel不需要 
    if ((ri->flags & (SRI_MASTER|SRI_SLAVE)) && ri->pc == NULL) {
        // 连接实例
        ri->pc = redisAsyncConnect(ri->addr->ip,ri->addr->port);
        // 连接出错
        if (ri->pc->err) {
            sentinelEvent(REDIS_DEBUG,"-pubsub-link-reconnection",ri,"%@%s",
                ri->pc->errstr);
            sentinelKillLink(ri,ri->pc);
        // 连接成功
        } else {
            int retval;
            // 设置连接属性
            ri->pc_conn_time = mstime();
            ri->pc->data = ri;
            redisAeAttach(server.el,ri->pc);
            // 设置连接 callback
            redisAsyncSetConnectCallback(ri->pc,
                                            sentinelLinkEstablishedCallback);
            // 设置断线 callback
            redisAsyncSetDisconnectCallback(ri->pc,
                                            sentinelDisconnectCallback);
            // 发送 AUTH 命令，验证身份
            sentinelSendAuthIfNeeded(ri,ri->pc);
            // 为客户端设置名字 "pubsub"
            sentinelSetClientName(ri,ri->pc,"pubsub");
            /* Now we subscribe to the Sentinels "Hello" channel. */
            // 发送 SUBSCRIBE __sentinel__:hello 命令，订阅频道
            retval = redisAsyncCommand(ri->pc,
                sentinelReceiveHelloMessages, NULL, "SUBSCRIBE %s",
                    SENTINEL_HELLO_CHANNEL);
            // 订阅出错，断开连接
            if (retval != REDIS_OK) {
                /* If we can't subscribe, the Pub/Sub connection is useless
                 * and we can simply disconnect it and try again. */
                sentinelKillLink(ri,ri->pc);
                return;
            }
        }
    }
    /* Clear the DISCONNECTED flags only if we have both the connections
     * (or just the commands connection if this is a sentinel instance). */
    // 如果实例是主服务器或者从服务器，那么当 cc 和 pc 两个连接都创建成功时，关闭 DISCONNECTED 标识
    // 如果实例是 Sentinel ，那么当 cc 连接创建成功时，关闭 DISCONNECTED 标识 即此时已连接成功
    if (ri->cc && (ri->flags & SRI_SENTINEL || ri->pc))
        ri->flags &= ~SRI_DISCONNECTED;
}
```

在这个函数过后,如果是第一次调用,所有被创建实例的主服务器会被发起异步连接,如果不是第一次,其他被新加入的从服务器和sentinel节点会发起异步连接.

```java
// INFO用于获取从服务器信息 PUBLISH用来获取其他哨兵的信息 PING用来检测现在的连接状况
void sentinelSendPeriodicCommands(sentinelRedisInstance *ri) {
    mstime_t now = mstime();
    mstime_t info_period, ping_period;
    int retval;
    /* Return ASAP if we have already a PING or INFO already pending, or
     * in the case the instance is not properly connected. */
    // 函数不能在网络连接未创建时执行
    if (ri->flags & SRI_DISCONNECTED) return;
    /* For INFO, PING, PUBLISH that are not critical commands to send we
     * also have a limit of SENTINEL_MAX_PENDING_COMMANDS. We don't
     * want to use a lot of memory just because a link is not working
     * properly (note that anyway there is a redundant protection about this,
     * that is, the link will be disconnected and reconnected if a long
     * timeout condition is detected. */
    // 为了避免 sentinel 在实例处于不正常状态时，发送过多命令
    // sentinel 只在待发送命令的数量未超过 SENTINEL_MAX_PENDING_COMMANDS 常量时
    // 才进行命令发送 在每次发送命令还未回复时会使pending_commands加一
    if (ri->pending_commands >= SENTINEL_MAX_PENDING_COMMANDS) return;
    /* If this is a slave of a master in O_DOWN condition we start sending
     * it INFO every second, instead of the usual SENTINEL_INFO_PERIOD
     * period. In this state we want to closely monitor slaves in case they
     * are turned into masters by another Sentinel, or by the sysadmin. */
    // 对于从服务器来说， sentinel 默认每 SENTINEL_INFO_PERIOD 秒向它发送一次 INFO 命令
    // 但是，当从服务器的主服务器处于 SDOWN 状态，或者正在执行故障转移时
    // 为了更快速地捕捉从服务器的变动， sentinel 会将发送 INFO 命令的频率该为每秒一次
    // 需要更快的发现一个从服务器升级为主服务器 从而进行故障转移
    if ((ri->flags & SRI_SLAVE) && //减少INFO间隔是为了更快的获取其身份信息
        (ri->master->flags & (SRI_O_DOWN|SRI_FAILOVER_IN_PROGRESS))) {
        info_period = 1000; //减小INFO命令时间间隔
    } else {
        info_period = SENTINEL_INFO_PERIOD;
    }
    /* We ping instances every time the last received pong is older than
     * the configured 'down-after-milliseconds' time, but every second
     * anyway if 'down-after-milliseconds' is greater than 1 second. */
    // 这里就是把配置文件中的down_after_period的时间与正常PING的间隔作比较,最小为1秒
    ping_period = ri->down_after_period;
    if (ping_period > SENTINEL_PING_PERIOD) ping_period = SENTINEL_PING_PERIOD;
    // 实例不是 Sentinel （而是主服务器或者从服务器）
    // 并且以下条件的其中一个成立：
    // 1）SENTINEL 未收到过这个服务器的 INFO 命令回复
    // 2）距离上一次该实例回复 INFO 命令已经超过 info_period 间隔
    // 那么向实例发送 INFO 命令
    // sentinel会向其连接的哨兵发送PING,但不会发送PUBLISH
    if ((ri->flags & SRI_SENTINEL) == 0 &&
        (ri->info_refresh == 0 ||
        (now - ri->info_refresh) > info_period)) //间隔一般为十秒 特殊为1秒
    {
        /* Send INFO to masters and slaves, not sentinels. */
        retval = redisAsyncCommand(ri->cc, //命令均为异步执行
            sentinelInfoReplyCallback, NULL, "INFO"); //回调为对INFO命令的回复
        if (retval == REDIS_OK) ri->pending_commands++; //已发送但尚未回复的命令
    } else if ((now - ri->last_pong_time) > ping_period) {
      //间隔一般为一秒 取决于down_after_period
        /* Send PING to all the three kinds of instances. */
        sentinelSendPing(ri);
    } else if ((now - ri->last_pub_time) > SENTINEL_PUBLISH_PERIOD) {
      //间隔两秒
        /* PUBLISH hello messages to all the three kinds of instances. */
        sentinelSendHello(ri);
    }
}
```

`sentinelInfoReplyCallback`这个函数就是一个对INFO命令回复的解析过程,我们会在需要时分析一部分,比如原来是从服务器,现在是主服务器,证明升级成功,看看会发生什么事情.这里我们看看当接收到一个新的服务器连接时会发生什么

```java
...............
// 如果发现有新的从服务器出现，那么为它添加实例
if (sentinelRedisInstanceLookupSlave(ri,ip,atoi(port)) == NULL) {
    if ((slave = createSentinelRedisInstance(NULL,SRI_SLAVE,ip,
                atoi(port), ri->quorum, ri)) != NULL)
    {
        sentinelEvent(REDIS_NOTICE,"+slave",slave,"%@");
    }
}
.................
```

我们可以看到解析出来信息以后会先查看主服务器是否存在这个slave,不存在的话创建一个实例.这样我们就可以得到其他从服务器了.

我们再来看看处理PUBLISH的返回处理回调,其中会把主服务器中不存在的slave加入主服务器

```java
void sentinelProcessHelloMessage(char *hello, int hello_len) {
    /* Format is composed of 8 tokens:
     * 0=ip,1=port,2=runid,3=current_epoch,4=master_name,
     * 5=master_ip,6=master_port,7=master_config_epoch. */
    int numtokens, port, removed, master_port;
    uint64_t current_epoch, master_config_epoch;
    char **token = sdssplitlen(hello, hello_len, ",", 1, &numtokens);
    sentinelRedisInstance *si, *master;
    if (numtokens == 8) {
        /* Obtain a reference to the master this hello message is about */
        // 获取主服务器的名字，并丢弃和未知主服务器相关的消息。
        master = sentinelGetMasterByName(token[4]);
        if (!master) goto cleanup; /* Unknown master, skip the message. */
        /* First, try to see if we already have this sentinel. */
        // 看这个 Sentinel 是否已经认识发送消息的 Sentinel
        port = atoi(token[1]);
        master_port = atoi(token[6]);
        // 会遍历所有的输入实例 看是否存在 不存在返回NULL
        si = getSentinelRedisInstanceByAddrAndRunID(
                        master->sentinels,token[0],port,token[2]);
        current_epoch = strtoull(token[3],NULL,10);
        master_config_epoch = strtoull(token[7],NULL,10);
        if (!si) {
            // 这个 Sentinel 不认识发送消息的 Sentinel 
            // 将对方加入到 Sentinel 列表中
            /* If not, remove all the sentinels that have the same runid
             * OR the same ip/port, because it's either a restart or a
             * network topology change. */
            /*删除所有具有相同runid或相同ip/port的实例,因为这是重新启动或网络拓扑更改。*/
            removed = removeMatchingSentinelsFromMaster(master,token[0],port,
                            token[2]);
            if (removed) {
                sentinelEvent(REDIS_NOTICE,"-dup-sentinel",master,
                    "%@duplicate of %s:%d or %s",
                    token[0],port,token[2]);
            }
            /* Add the new sentinel. */ //创建一个新实例 这里更新了sentinel
            si = createSentinelRedisInstance(NULL,SRI_SENTINEL,
                            token[0],port,master->quorum,master);
            if (si) {
                sentinelEvent(REDIS_NOTICE,"+sentinel",si,"%@");
                /* The runid is NULL after a new instance creation and
                 * for Sentinels we don't have a later chance to fill it,
                 * so do it now. */
                si->runid = sdsnew(token[2]);
                sentinelFlushConfig();
            }
        }
        /* Update local current_epoch if received current_epoch is greater.*/
        // 如果消息中记录的纪元比 Sentinel 当前的纪元要高，那么更新纪元
        // 这里的sentinel是此sentinel的主结构体 即 struct sentinelState
        if (current_epoch > sentinel.current_epoch) {
            sentinel.current_epoch = current_epoch;
            sentinelFlushConfig();
            sentinelEvent(REDIS_WARNING,"+new-epoch",master,"%llu",
                (unsigned long long) sentinel.current_epoch);
        }
        /* Update master info if received configuration is newer. */
        // 如果消息中记录的配置信息更新，那么对主服务器的信息进行更新
        // 这里也是主服务器信息改变的地方 
        if (master->config_epoch < master_config_epoch) {
      //纪元增大 下一轮投票
            master->config_epoch = master_config_epoch;
            if (master_port != master->addr->port ||  //端口变了
                strcmp(master->addr->ip, token[5]))
            {
                sentinelAddr *old_addr;
                sentinelEvent(REDIS_WARNING,"+config-update-from",si,"%@");
                sentinelEvent(REDIS_WARNING,"+switch-master",
                    master,"%s %s %d %s %d",
                    master->name,
                    master->addr->ip, master->addr->port,
                    token[5], master_port);
                old_addr = dupSentinelAddr(master->addr); //复制并返回给定地址的一个副本
                //端口改变当然要改变信息啦
                sentinelResetMasterAndChangeAddress(master, token[5], master_port);
                sentinelCallClientReconfScript(master,
                    SENTINEL_OBSERVER,"start",
                    old_addr,master->addr);
                releaseSentinelAddr(old_addr);
            }
        }
        /* Update the state of the Sentinel. */
        // 更新我方 Sentinel 记录的对方 Sentinel 的信息。
        if (si) si->last_hello_time = mstime();
    }
cleanup:
    sdsfreesplitres(token,numtokens);
}
```

我们使用`INFO`信息的返回这添加从节点,`订阅`机制获取其他sentinel并更新服务器,并使用`PING`命令不停的更新与其他主服务器,从服务器,sentinel节点最后一次通信的时间,用于判断下线,此时这个系统就构成了一张网,下一篇我们来看看如何判断下线和在sentinel集群中找到leader,使其进行开始故障转移.
