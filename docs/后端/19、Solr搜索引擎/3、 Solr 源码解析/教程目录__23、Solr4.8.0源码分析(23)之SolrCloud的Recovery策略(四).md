# 23、Solr4.8.0源码分析(23)之SolrCloud的Recovery策略(四)
- 来源：https://ddkk.com/zhuanlan/search/solr/1/23.html
- 分类：搜索引擎
- 分组：教程目录
题记：本来计划的SolrCloud的Recovery策略的文章是3篇的，但是没想到Recovery的内容蛮多的，前面三章分别介绍了Recovery的原理和总体流程，PeerSync策略，Replication策略。本章主要介绍我在实际生产环境中碰到的recovery的几个问题，以及前面漏下的几个点。

## 一. 日志中多次出现"Stopping recovery for zkNodeName= ..."

我在公司的生产环境中总是会看到连续多次出现 " WARN : Stopping recovery for zkNodeName= ..." 或者 "INFO : Starting recovery process. core=..." 这样的日志(由于公司的东西无法拿出了，所以只能意会下日志了)。

这种现象的原因是因为：前文讲到过出现Recovery的原因之一是Leader转发update request到replica后没有接收到replica的表示成功的返回，那么这是Leader会发送RequestRecovery request给replia，命令它进行recovery。这是一次转发失败的过程。而每当Solr出现Leader转发update失败时候往往不会只出现一次，所以Leader会发送多次RequestRecovery request给replia。

Relica的Recovery过程起始于DefaultSolrCoreState类的doRecovery()函数，在进行doRecovery()时候Replica会取消之前的Recovery。所以出现上述现象的根本原因就在于cancelRecovery上。需要指出的是DefaultSolrCoreState类的doRecovery()函数不但在RequestRecovery请求后会被调用，在leader 选举失败的时候也会被掉用。

```java
@Override
public void cancelRecovery() {
  synchronized (recoveryLock) {
    if (recoveryStrat != null && recoveryRunning) {
      recoveryStrat.close();
      while (true) {
        try {
          recoveryStrat.join();
        } catch (InterruptedException e) {
          // not interruptible - keep waiting
          continue;
        }
        break;
      }
      recoveryRunning = false;
      recoveryLock.notifyAll();
    }
  }
}
```

```java
@Override
public void close() {
  close = true;
  try {
    prevSendPreRecoveryHttpUriRequest.abort();
  } catch (NullPointerException e) {
    // okay
  }
  log.warn("Stopping recovery for zkNodeName=" + coreZkNodeName + "core=" + coreName);
}
```

## 二. Recovery过程中的rollback

之前有@从前 网友给我留言说出现了"持续向solrcloud提交数据的同时调用了optimize 方法。导致索引文件同步失败，就一直无法recovery。"的现象。造成这个现象的原因大致由以下两点：

- optimize的操作的本质是Merge策略中的forceMerge，默认情况下一旦触发了forceMerge，那么Solr会把所有的Segment合并成一个Segment。可以想象下，几十甚至几百GB的数据合成一个Segment，这样的符合会有多大？而且这还不算，一旦触发了forceMerge，如果有实时数据进来，那么它会把新进来的数据也merge进去，也就是说会一直merge进去根本不会停下来。关于forceMerge的具体情况，将在接下来介绍Merge的文章中详述。
- Replication策略介绍的时候提到，如果isFullCopyNeeded为false，那么Solr就会调用closeIndexWriter.

```java
if (!isFullCopyNeeded) {
    // rollback - and do it before we download any files
    // so we don't remove files we thought we didn't need
    // to download later
    solrCore.getUpdateHandler().getSolrCoreState()
    .closeIndexWriter(core, true);
}
```

我们很容会忽视closeIndexWriter传入的true参数，如果传入的为true，表示Solr关闭IndexWriter时候会进行回滚rollback，它的作用就是将IndexWriter退回到上次commit之后的状态，清空上次commit之后的所有add进来的数据。

```java
if (indexWriter != null) {
  if (!rollback) {
    try {
      log.info("Closing old IndexWriter... core=" + coreName);
      indexWriter.close();
    } catch (Exception e) {
      SolrException.log(log, "Error closing old IndexWriter. core="
          + coreName, e);
    }
  } else {
    try {
      log.info("Rollback old IndexWriter... core=" + coreName);
      indexWriter.rollback();
    } catch (Exception e) {
      SolrException.log(log, "Error rolling back old IndexWriter. core="
          + coreName, e);
    }
  }
}
```

那么问题就出在rollback中，Lucene的IndexWriter在进行回滚的时候会尝试去关闭正在进行的mergePolicy和mergeScheduler，如果发现还有segment正在进行那么它会一直等待，所以当optimize(forceMerge)进行时且有实时数据进来，那么Recovery就会一直停在那里直到超时。

```java
/** Wait for any running merge threads to finish. This call is not interruptible as used by {@linkclose()}. */
public void sync() {
  boolean interrupted = false;
  try {
    while (true) {
      MergeThread toSync = null;
      synchronized (this) {
        for (MergeThread t : mergeThreads) {
          if (t.isAlive()) {
            toSync = t;
            break;
          }
        }
      }
      if (toSync != null) {
        try {
          toSync.join();
        } catch (InterruptedException ie) {
          // ignore this Exception, we will retry until all threads are dead
          interrupted = true;
        }
      } else {
        break;
      }
    }
  } finally {
    // finally, restore interrupt status:
    if (interrupted) Thread.currentThread().interrupt();
  }
}
```

所以解决的方法有两个：

- optimize时候保证没有实时数据进来。
- 修改forceMerge的策略，只对启动forceMerge时候的Segment进行合并，之后的Segment选择无视(我司采用的策略)。

## 三. Recovery触发的三个地方

触发Recovery有三个地方，也就是上文中doRecovery()被调用的三个地方：

- 之前一直在讲的RequestRecovery请求

```java
protected void handleRequestRecoveryAction(SolrQueryRequest req,
  SolrQueryResponse rsp) throws IOException {
final SolrParams params = req.getParams();
log.info("It has been requested that we recover");
Thread thread = new Thread() {
  @Override
  public void run() {
    String cname = params.get(CoreAdminParams.CORE);
    if (cname == null) {
      cname = "";
    }
    try (SolrCore core = coreContainer.getCore(cname)) {
      if (core != null) {
        // try to publish as recovering right away
        try {
          coreContainer.getZkController().publish(core.getCoreDescriptor(), ZkStateReader.RECOVERING);
        }  catch (InterruptedException e) {
          Thread.currentThread().interrupt();
          SolrException.log(log, "", e);
        } catch (Throwable e) {
          SolrException.log(log, "", e);
          if (e instanceof Error) {
            throw (Error) e;
          }
        }
        core.getUpdateHandler().getSolrCoreState().doRecovery(coreContainer, core.getCoreDescriptor());
      } else {
        SolrException.log(log, "Could not find core to call recovery:" + cname);
      }
    }
  }
};
thread.start();
}
```

当Leader选举失败的时候，它会先进行recovery，然后再重新加入选举。

```java
private void rejoinLeaderElection(String leaderSeqPath, SolrCore core)
    throws InterruptedException, KeeperException, IOException {
  // remove our ephemeral and re join the election
  if (cc.isShutDown()) {
    log.info("Not rejoining election because CoreContainer is shutdown");
    return;
  }
  log.info("There may be a better leader candidate than us - going back into recovery");
  cancelElection();
  core.getUpdateHandler().getSolrCoreState().doRecovery(cc, core.getCoreDescriptor());
  leaderElector.joinElection(this, true);
}
```

Register 注册shard的时候，会去检测shard是否处于recovery状态。如果满足recovery条件就会触发recovery。

```java
/**
 * Returns whether or not a recovery was started
 */
private boolean checkRecovery(String coreName, final CoreDescriptor desc,
    boolean recoverReloadedCores, final boolean isLeader,
    final CloudDescriptor cloudDesc, final String collection,
    final String shardZkNodeName, String shardId, ZkNodeProps leaderProps,
    SolrCore core, CoreContainer cc) {
  if (SKIP_AUTO_RECOVERY) {
    log.warn("Skipping recovery according to sys prop solrcloud.skip.autorecovery");
    return false;
  }
  boolean doRecovery = true;
  if (!isLeader) {
    if (core.isReloaded() && !recoverReloadedCores) {
      doRecovery = false;
    }
    if (doRecovery) {
      log.info("Core needs to recover:" + core.getName());
      core.getUpdateHandler().getSolrCoreState().doRecovery(cc, core.getCoreDescriptor());
      return true;
    }
  } else {
    log.info("I am the leader, no recovery necessary");
  }
  return false;
}
```

##

## 四. recoverFromLog

之前写到Recovery过程中在Replicate之后都进行一次applyBufferedUpdates来实现doplay以获取UpdateLog内保存的request。那么除了applyBufferedUpdates还有一种方式recoverFromLog来获取UpdateLog内保存的request。它跟applyBufferedUpdates不同之处在于，它主要用于单机的Solr模式下。当创建core的时候就会触发：

```java
/**
 * Creates a new core based on a descriptor but does not register it.
 *
 * @param dcore a core descriptor
 * @return the newly created core
 */
public SolrCore create(CoreDescriptor dcore) {
  if (isShutDown) {
    throw new SolrException(ErrorCode.SERVICE_UNAVAILABLE, "Solr has shutdown.");
  }
  try {
    ConfigSet coreConfig = coreConfigService.getConfig(dcore);
    log.info("Creating SolrCore '{}' using configuration from {}", dcore.getName(), coreConfig.getName());
    SolrCore core = new SolrCore(dcore, coreConfig);
    solrCores.addCreated(core);
    // always kick off recovery if we are in non-Cloud mode
    if (!isZooKeeperAware() && core.getUpdateHandler().getUpdateLog() != null) {
      core.getUpdateHandler().getUpdateLog().recoverFromLog();
    }
    return core;
  }
  catch (Exception e) {
    throw recordAndThrow(dcore.getName(), "Unable to create core: " + dcore.getName(), e);
  }
}
```

总结：

本节列举了几个Recovery过程中遇到的问题，以及补充说明了之前漏下的内容。下文会介绍Recovery系列的最后一文，Replication主从模式的配置。
