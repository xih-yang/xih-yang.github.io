# 24、Redis 源码解析 - Redis 集群模式扩展性
- 来源：https://ddkk.com/zhuanlan/db/redis/6/24.html
- 分类：缓存数据库
- 分组：教程目录
Redis通过集群模式来实现扩展性和可用性，Redis将所有的Key划分到16284个slot中，集群每个分片负责一定数量的slot，如果当前集群的内存容量或者处理能力达到上限后，通过增加分片数，然后把一部分slot的key迁移到新的分片上来扩展集群。本节会介绍这种扩展性。

### 集群模式下访问key

使用Redis的人大多都听说过ASK错误以及MOVED错误，下面先看看MOVED错误是如何产生的。

在集群模式下，客户端可能向集群中的任何一个分片发送命令，节点接受到命令之后，先根据key的hash值计算出key所属的slot，判断这个slot是否是自己负责，如果是，则处理完成后给客户端返回，如果不是，由于集群节点的信息通过gossip协议传播之后，该节点能够判断出来负责该slot的节点地址，然后就会给客户端返回一个MOVED错误，客户端根据MOVED错误中的ip，再去访问负责这个slot的节点。

在[Redis 源码解析 - Redis 命令端到端的过程](/zhuanlan/db/redis/6/5.html)中，读取并解析完客户端发送过来的命令之后，就会调用processCommand函数来处理命令，processCommand函数首先检查命令的有效性、鉴权信息，然后就会判断这个key是否是自己负责：

```java
int processCommand(client *c) {
	...
	 /* If cluster is enabled perform the cluster redirection here.
     * However we don't perform the redirection if:
     * 1) The sender of this command is our master.
     * 2) The command has no key arguments. */
    if (server.cluster_enabled &&
        !(c->flags & CLIENT_MASTER) &&
        !(c->flags & CLIENT_LUA &&
          server.lua_caller->flags & CLIENT_MASTER) &&
        !(c->cmd->getkeys_proc == NULL && c->cmd->firstkey == 0 &&
          c->cmd->proc != execCommand))
    {
        int hashslot;
        int error_code;
        clusterNode *n = getNodeByQuery(c,c->cmd,c->argv,c->argc,
                                        &hashslot,&error_code);
        if (n == NULL || n != server.cluster->myself) {
            if (c->cmd->proc == execCommand) {
                discardTransaction(c);
            } else {
                flagTransaction(c);
            }
            clusterRedirectClient(c,n,hashslot,error_code);
            return C_OK;
        }
    }
	...
}
```

通过getNodeByQuery函数判断key的slot是否属于自己，如果不属于，会中断这个客户端的事务，同时通过clusterRedirectClient发送MOVED错误。

getNodeByQuery首先把本次命令封装为事务，然后逐个判断事务中的key，是否属于同一个slot，如果不属于，直接返回错误。然后判断负责这个key的slot是否是自己，如果不是，返回CLUSTER_REDIR_MOVED：

```java
clusterNode *getNodeByQuery(client *c, struct redisCommand *cmd, robj **argv, int argc, int *hashslot, int *error_code) {
    clusterNode *n = NULL;
    robj *firstkey = NULL;
    int multiple_keys = 0;
    multiState *ms, _ms;
    multiCmd mc;
    int i, slot = 0, migrating_slot = 0, importing_slot = 0, missing_keys = 0;
    ...
    /* We handle all the cases as if they were EXEC commands, so we have
     * a common code path for everything */
    // 将所有的命令封装为事务
    if (cmd->proc == execCommand) {
        /* If CLIENT_MULTI flag is not set EXEC is just going to return an
         * error. */
        if (!(c->flags & CLIENT_MULTI)) return myself;
        ms = &c->mstate;
    } else {
        /* In order to have a single codepath create a fake Multi State
         * structure if the client is not in MULTI/EXEC state, this way
         * we have a single codepath below. */
        ms = &_ms;
        _ms.commands = &mc;
        _ms.count = 1;
        mc.argv = argv;
        mc.argc = argc;
        mc.cmd = cmd;
    }
    /* Check that all the keys are in the same hash slot, and obtain this
     * slot and the node associated. */
    // 逐个检查key
    for (i = 0; i < ms->count; i++) {
        struct redisCommand *mcmd;
        robj **margv;
        int margc, *keyindex, numkeys, j;
        mcmd = ms->commands[i].cmd;
        margc = ms->commands[i].argc;
        margv = ms->commands[i].argv;
        keyindex = getKeysFromCommand(mcmd,margv,margc,&numkeys);
        for (j = 0; j < numkeys; j++) {
            robj *thiskey = margv[keyindex[j]];
            int thisslot = keyHashSlot((char*)thiskey->ptr,
                                       sdslen(thiskey->ptr));
            if (firstkey == NULL) {
                /* This is the first key we see. Check what is the slot
                 * and node. */
                firstkey = thiskey;
                slot = thisslot;
                n = server.cluster->slots[slot];
                /* Error: If a slot is not served, we are in "cluster down"
                 * state. However the state is yet to be updated, so this was
                 * not trapped earlier in processCommand(). Report the same
                 * error to the client. */
                if (n == NULL) {
                    getKeysFreeResult(keyindex);
                    if (error_code)
                        *error_code = CLUSTER_REDIR_DOWN_UNBOUND;
                    return NULL;
                }
                /* If we are migrating or importing this slot, we need to check
                 * if we have all the keys in the request (the only way we
                 * can safely serve the request, otherwise we return a TRYAGAIN
                 * error). To do so we set the importing/migrating state and
                 * increment a counter for every missing key. */
                // key是否在迁移中
                if (n == myself &&
                    server.cluster->migrating_slots_to[slot] != NULL)
                {
                    migrating_slot = 1;
                } else if (server.cluster->importing_slots_from[slot] != NULL) {
                    importing_slot = 1;
                }
            } else {
                /* If it is not the first key, make sure it is exactly
                 * the same key as the first we saw. */
                // 事务中所有的key是否属于同一个slot
                if (!equalStringObjects(firstkey,thiskey)) {
                    if (slot != thisslot) {
                        /* Error: multiple keys from different slots. */
                        getKeysFreeResult(keyindex);
                        if (error_code)
                            *error_code = CLUSTER_REDIR_CROSS_SLOT;
                        return NULL;
                    } else {
                        /* Flag this request as one with multiple different
                         * keys. */
                        multiple_keys = 1;
                    }
                }
            }
            /* Migarting / Improrting slot? Count keys we don't have. */
            if ((migrating_slot || importing_slot) &&
                lookupKeyRead(&server.db[0],thiskey) == NULL)
            {
                missing_keys++;
            }
        }
        getKeysFreeResult(keyindex);
    }
    /* Cluster is globally down but we got keys? We can't serve the request. */
    // 集群状态是否正确
    if (server.cluster->state != CLUSTER_OK) {
        if (error_code) *error_code = CLUSTER_REDIR_DOWN_STATE;
        return NULL;
    }
    /* Return the hashslot by reference. */
    if (hashslot) *hashslot = slot;
    /* MIGRATE always works in the context of the local node if the slot
     * is open (migrating or importing state). We need to be able to freely
     * move keys among instances in this case. */
    if ((migrating_slot || importing_slot) && cmd->proc == migrateCommand)
        return myself;
    /* If we don't have all the keys and we are migrating the slot, send
     * an ASK redirection. */
    // 在迁移中，并且slot是从自身迁移出去的，则返回ASK错误
    if (migrating_slot && missing_keys) {
        if (error_code) *error_code = CLUSTER_REDIR_ASK;
        return server.cluster->migrating_slots_to[slot];
    }
    /* If we are receiving the slot, and the client correctly flagged the
     * request as "ASKING", we can serve the request. However if the request
     * involves multiple keys and we don't have them all, the only option is
     * to send a TRYAGAIN error. */
    if (importing_slot &&
        (c->flags & CLIENT_ASKING || cmd->flags & CMD_ASKING))
    {
        if (multiple_keys && missing_keys) {
            if (error_code) *error_code = CLUSTER_REDIR_UNSTABLE;
            return NULL;
        } else {
            return myself;
        }
    }
    /* Handle the read-only client case reading from a slave: if this
     * node is a slave and the request is about an hash slot our master
     * is serving, we can reply without redirection. */
    if (c->flags & CLIENT_READONLY &&
        (cmd->flags & CMD_READONLY || cmd->proc == evalCommand ||
         cmd->proc == evalShaCommand) &&
        nodeIsSlave(myself) &&
        myself->slaveof == n)
    {
        return myself;
    }
    /* Base case: just return the right node. However if this node is not
     * myself, set error_code to MOVED since we need to issue a rediretion. */
    // slot不是自己负责，则返回MOVED错误
    if (n != myself && error_code) *error_code = CLUSTER_REDIR_MOVED;
    return n;
}
```

clusterRedirectClient函数根据错误类型给客户端响应，如果是ASK、MOVED错误，则返回ASK/MOVED ip：

```java
/* Send the client the right redirection code, according to error_code
 * that should be set to one of CLUSTER_REDIR_* macros.
 *  * If CLUSTER_REDIR_ASK or CLUSTER_REDIR_MOVED error codes
 * are used, then the node 'n' should not be NULL, but should be the
 * node we want to mention in the redirection. Moreover hashslot should
 * be set to the hash slot that caused the redirection. */
void clusterRedirectClient(client *c, clusterNode *n, int hashslot, int error_code) {
    if (error_code == CLUSTER_REDIR_CROSS_SLOT) {
        addReplySds(c,sdsnew("-CROSSSLOT Keys in request don't hash to the same slot\r\n"));
    } else if (error_code == CLUSTER_REDIR_UNSTABLE) {
        /* The request spawns multiple keys in the same slot,
         * but the slot is not "stable" currently as there is
         * a migration or import in progress. */
        addReplySds(c,sdsnew("-TRYAGAIN Multiple keys request during rehashing of slot\r\n"));
    } else if (error_code == CLUSTER_REDIR_DOWN_STATE) {
        addReplySds(c,sdsnew("-CLUSTERDOWN The cluster is down\r\n"));
    } else if (error_code == CLUSTER_REDIR_DOWN_UNBOUND) {
        addReplySds(c,sdsnew("-CLUSTERDOWN Hash slot not served\r\n"));
    } else if (error_code == CLUSTER_REDIR_MOVED ||
               error_code == CLUSTER_REDIR_ASK)
    {
        addReplySds(c,sdscatprintf(sdsempty(),
            "-%s %d %s:%d\r\n",
            (error_code == CLUSTER_REDIR_ASK) ? "ASK" : "MOVED",
            hashslot,n->ip,n->port));
    } else {
        serverPanic("getNodeByQuery() unknown error.");
    }
}
```

### 集群扩容

当集群内存容量不足或者处理能力不足时，就需要扩容，增加分片，然后把一部分slot中的key迁移过去，分为以下几个步骤，这些步骤被集成在redis-cli中：

- 向节点A发送 SETSLOT `` MIGRATING `` 命令，表示将会把属于节点A的的sloti这个slot迁移到B节点
- 向节点B发送 SETSLOT `` IMPORTING `` 命令，表示节点B将要受到来自节点A的sloti中的数据
- 向节点A发送 CLUSTER GETKEYSINSLOT ````，查询节点A中属于sloti的key
- 向节点A发送 MIGRATE命令，节点A会把key逐个dump下来，发送给RESTORE命令给节点B，让节点B保存这些key
- 重复上述两个过程，直到节点A中sloti中的key全部迁移完成，然后分别给节点A和节点B发送 SETSLOT `` NODE ``

上述步骤在ClusterCommand函数中实现：

```java
void clusterCommand(client *c) {
	...
	if (!strcasecmp(c->argv[1]->ptr,"setslot") && c->argc >= 4) {
        /* SETSLOT 10 MIGRATING <node ID> */
        /* SETSLOT 10 IMPORTING <node ID> */
        /* SETSLOT 10 STABLE */
        /* SETSLOT 10 NODE <node ID> */
        int slot;
        clusterNode *n;
        if (nodeIsSlave(myself)) {
            addReplyError(c,"Please use SETSLOT only with masters.");
            return;
        }
        if ((slot = getSlotOrReply(c,c->argv[2])) == -1) return;
        if (!strcasecmp(c->argv[3]->ptr,"migrating") && c->argc == 5) {
            if (server.cluster->slots[slot] != myself) {
                addReplyErrorFormat(c,"I'm not the owner of hash slot %u",slot);
                return;
            }
            if ((n = clusterLookupNode(c->argv[4]->ptr)) == NULL) {
                addReplyErrorFormat(c,"I don't know about node %s",
                    (char*)c->argv[4]->ptr);
                return;
            }
            // 设置migrating状态
            server.cluster->migrating_slots_to[slot] = n;
        } else if (!strcasecmp(c->argv[3]->ptr,"importing") && c->argc == 5) {
            if (server.cluster->slots[slot] == myself) {
                addReplyErrorFormat(c,
                    "I'm already the owner of hash slot %u",slot);
                return;
            }
            if ((n = clusterLookupNode(c->argv[4]->ptr)) == NULL) {
                addReplyErrorFormat(c,"I don't know about node %s",
                    (char*)c->argv[4]->ptr);
                return;
            }
            // 设置importing状态
            server.cluster->importing_slots_from[slot] = n;
        } else if (!strcasecmp(c->argv[3]->ptr,"stable") && c->argc == 4) {
            /* CLUSTER SETSLOT <SLOT> STABLE */
            // 取消迁移
            server.cluster->importing_slots_from[slot] = NULL;
            server.cluster->migrating_slots_to[slot] = NULL;
        } else if (!strcasecmp(c->argv[3]->ptr,"node") && c->argc == 5) {
            /* CLUSTER SETSLOT <SLOT> NODE <NODE ID> */
            // 设置slot归属
            clusterNode *n = clusterLookupNode(c->argv[4]->ptr);
            if (!n) {
                addReplyErrorFormat(c,"Unknown node %s",
                    (char*)c->argv[4]->ptr);
                return;
            }
            /* If this hash slot was served by 'myself' before to switch
             * make sure there are no longer local keys for this hash slot. */
            if (server.cluster->slots[slot] == myself && n != myself) {
                if (countKeysInSlot(slot) != 0) {
                    addReplyErrorFormat(c,
                        "Can't assign hashslot %d to a different node "
                        "while I still hold keys for this hash slot.", slot);
                    return;
                }
            }
            /* If this slot is in migrating status but we have no keys
             * for it assigning the slot to another node will clear
             * the migratig status. */
            if (countKeysInSlot(slot) == 0 &&
                server.cluster->migrating_slots_to[slot])
                server.cluster->migrating_slots_to[slot] = NULL;
            /* If this node was importing this slot, assigning the slot to
             * itself also clears the importing status. */
            if (n == myself &&
                server.cluster->importing_slots_from[slot])
            {
                /* This slot was manually migrated, set this node configEpoch
                 * to a new epoch so that the new version can be propagated
                 * by the cluster.
                 *
                 * Note that if this ever results in a collision with another
                 * node getting the same configEpoch, for example because a
                 * failover happens at the same time we close the slot, the
                 * configEpoch collision resolution will fix it assigning
                 * a different epoch to each node. */
                // 提升config epoch，一遍在gossip协议中通知集群中其他节点该slot已经被新的节点负责了
                if (clusterBumpConfigEpochWithoutConsensus() == C_OK) {
                    serverLog(LL_WARNING,
                        "configEpoch updated after importing slot %d", slot);
                }
                server.cluster->importing_slots_from[slot] = NULL;
            }
            clusterDelSlot(slot);
            clusterAddSlot(n,slot);
        } else {
            addReplyError(c,
                "Invalid CLUSTER SETSLOT action or number of arguments. Try CLUSTER HELP");
            return;
        }
        clusterDoBeforeSleep(CLUSTER_TODO_SAVE_CONFIG|CLUSTER_TODO_UPDATE_STATE);
        addReply(c,shared.ok);
    }
    ...
}
```

这里面需要注意一下几点：

**1、** 如果slot在迁移中，客户端发送对应的命令给节点A，A如果发现找不到这个key，但是这个key的slot正在迁移中，那么A会回复ASK错误，让客户端去节点B重试；

**2、** 注意迁移过程中的migrate命令，会一次性迁移多个key，同时这个命令也是在主线程中执行的，如果key比较大，migrate可能会阻塞一段时间，导致正常的用户命令超时，这也是大key的危害之一；

**3、** 最后迁移完成之后节点B会执行clusterBumpConfigEpochWithoutConsensus函数，目的是提升节点B的configepoch，这很重要，关系到集群中其他节点对于这个slot的归属判断，下节会详细介绍这点；

最后在看看具体的迁移过程migrateCommand，命令的具体格式：MIGRATE host port “” dbid timeout [COPY | REPLACE | AUTH password] KEYS key1 key2 … keyN

```java
void migrateCommand(client *c) {
	...
	// 获取对端的网络socket,Redis会缓存迁移过程中的socket
	cs = migrateGetSocket(c,c->argv[1],c->argv[2],timeout);
	// 准备带发送的命令
	rioInitWithBuffer(&cmd,sdsempty());
	/* Create RESTORE payload and generate the protocol to call the command. */
	// 逐个dump每个KV对
    for (j = 0; j < num_keys; j++) {
        long long ttl = 0;
        long long expireat = getExpire(c->db,kv[j]);
        if (expireat != -1) {
            ttl = expireat-mstime();
            if (ttl < 0) {
                continue;
            }
            if (ttl < 1) ttl = 1;
        }
        /* Relocate valid (non expired) keys into the array in successive
         * positions to remove holes created by the keys that were present
         * in the first lookup but are now expired after the second lookup. */
        kv[non_expired++] = kv[j];
        serverAssertWithInfo(c,NULL,
            rioWriteBulkCount(&cmd,'*',replace ? 5 : 4));
        if (server.cluster_enabled)
            serverAssertWithInfo(c,NULL,
                rioWriteBulkString(&cmd,"RESTORE-ASKING",14));
        else
            serverAssertWithInfo(c,NULL,rioWriteBulkString(&cmd,"RESTORE",7));
        serverAssertWithInfo(c,NULL,sdsEncodedObject(kv[j]));
        serverAssertWithInfo(c,NULL,rioWriteBulkString(&cmd,kv[j]->ptr,
                sdslen(kv[j]->ptr)));
        serverAssertWithInfo(c,NULL,rioWriteBulkLongLong(&cmd,ttl));
        /* Emit the payload argument, that is the serialized object using
         * the DUMP format. */
        createDumpPayload(&payload,ov[j],kv[j]);
        serverAssertWithInfo(c,NULL,
            rioWriteBulkString(&cmd,payload.io.buffer.ptr,
                               sdslen(payload.io.buffer.ptr)));
        sdsfree(payload.io.buffer.ptr);
        /* Add the REPLACE option to the RESTORE command if it was specified
         * as a MIGRATE option. */
        if (replace)
            serverAssertWithInfo(c,NULL,rioWriteBulkString(&cmd,"REPLACE",7));
    }
    ...
    /* Transfer the query to the other node in 64K chunks. */
    errno = 0;
    {
        sds buf = cmd.io.buffer.ptr;
        size_t pos = 0, towrite;
        int nwritten = 0;
		// 每64k发送一次
        while ((towrite = sdslen(buf)-pos) > 0) {
            towrite = (towrite > (64*1024) ? (64*1024) : towrite);
            nwritten = syncWrite(cs->fd,buf+pos,towrite,timeout);
            if (nwritten != (signed)towrite) {
                write_error = 1;
                goto socket_err;
            }
            pos += nwritten;
        }
    }
    ...
    // 读取对端每个restore命令的回复
    for (j = 0; j < num_keys; j++) {
      if (syncReadLine(cs->fd, buf2, sizeof(buf2), timeout) <= 0) {
          socket_error = 1;
          break;
      }
      if ((password && buf0[0] == '-') ||
          (select && buf1[0] == '-') ||
          buf2[0] == '-')
      {
          /* On error assume that last_dbid is no longer valid. */
          if (!error_from_target) {
              cs->last_dbid = -1;
              char *errbuf;
              if (password && buf0[0] == '-') errbuf = buf0;
              else if (select && buf1[0] == '-') errbuf = buf1;
              else errbuf = buf2;
              error_from_target = 1;
              addReplyErrorFormat(c,"Target instance replied with error: %s",
                  errbuf+1);
          }
      } else {
          if (!copy) {
              /* No COPY option: remove the local key, signal the change. */
              dbDelete(c->db,kv[j]);
              signalModifiedKey(c->db,kv[j]);
              server.dirty++;
              /* Populate the argument vector to replace the old one. */
              newargv[del_idx++] = kv[j];
              incrRefCount(kv[j]);
          }
    }
    // 对于已经迁移成功的key，需要在本地删除，构造删除命令，并传播到AOF和slave中
  	if (!copy) {
        /* Translate MIGRATE as DEL for replication/AOF. Note that we do
         * this only for the keys for which we received an acknowledgement
         * from the receiving Redis server, by using the del_idx index. */
        if (del_idx > 1) {
            newargv[0] = createStringObject("DEL",3);
            /* Note that the following call takes ownership of newargv. */
            replaceClientCommandVector(c,del_idx,newargv);
            argv_rewritten = 1;
        } else {
            /* No key transfer acknowledged, no need to rewrite as DEL. */
            zfree(newargv);
        }
        newargv = NULL; /* Make it safe to call zfree() on it in the future. */
    }
    ...
}
```
