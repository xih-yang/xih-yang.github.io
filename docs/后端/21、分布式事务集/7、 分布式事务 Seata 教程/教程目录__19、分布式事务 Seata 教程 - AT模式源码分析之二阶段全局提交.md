# 19、分布式事务 Seata 教程 - AT模式源码分析之二阶段全局提交
- 来源：https://ddkk.com/zhuanlan/transaction/5/19.html
- 分类：分布式事务
- 分组：教程目录
### 前言

在之前我们分析了，开启全局事务，和业务执行时是如何校验全局锁和提交本地事务的，接下来分析下是如何进行全局提交的。

### 二阶段全局提交

核心代码还是在`TransactionalTemplate`类中，当TC 没有收到异常时，就会进行全局提交逻辑：

提交和开启全局事务一样，也会在执行前后，添加钩子方法：

```java
    private void commitTransaction(GlobalTransaction tx) throws TransactionalExecutor.ExecutionException {
        try {
            triggerBeforeCommit();
            tx.commit();
            triggerAfterCommit();
        } catch (TransactionException txe) {
            // 4.1 Failed to commit
            throw new TransactionalExecutor.ExecutionException(tx, txe,
                TransactionalExecutor.Code.CommitFailure);
        }
    }
```

前置钩子执行完成后，进入到提交方法：

```java
    @Override
    public void commit() throws TransactionException {
    	// 只有TC 才能进行全局提交
        if (role == GlobalTransactionRole.Participant) {
            // Participant has no responsibility of committing
            if (LOGGER.isDebugEnabled()) {
                LOGGER.debug("Ignore Commit(): just involved in global transaction [{}]", xid);
            }
            return;
        }
        // 检查XID 
        assertXIDNotNull();
        // 重试次数，默认为5次
        int retry = COMMIT_RETRY_COUNT <= 0 ? DEFAULT_TM_COMMIT_RETRY_COUNT : COMMIT_RETRY_COUNT;
        try {
        	// 循环重试次数
            while (retry > 0) {
                try {
                	// 调用事务管理器，进行提交
                    status = transactionManager.commit(xid);
                    // 无异常退出循环
                    break;
                } catch (Throwable ex) {
                    LOGGER.error("Failed to report global commit [{}],Retry Countdown: {}, reason: {}", this.getXid(), retry, ex.getMessage());
                    // 异常，进行重试
                    retry--;
                    if (retry == 0) {
                        throw new TransactionException("Failed to report global commit", ex);
                    }
                }
            }
        } finally {
            if (xid.equals(RootContext.getXID())) {
                suspend();
            }
        }
        if (LOGGER.isInfoEnabled()) {
            LOGGER.info("[{}] commit status: {}", xid, status);
        }
    }
```

接着调用`DefaultTransactionManager`的提交方法，创建全局提交请求对象，设置xid，向TC 发起全局提交请求，并返回响应。

```java
    public GlobalStatus commit(String xid) throws TransactionException {
        GlobalCommitRequest globalCommit = new GlobalCommitRequest();
        globalCommit.setXid(xid);
        GlobalCommitResponse response = (GlobalCommitResponse)this.syncCall(globalCommit);
        return response.getGlobalStatus();
    }
```

#### TC 接受全局提交请求

在TC端，处理请求的依然是`DefaultCore`类，它接受来自RM的rpc网络请求（branchRegister，branchReport，lockQuery）。同时`DefaultCore`继承TransactionManager接口，接受来自TM的rpc网络请求（begin，commit,rollback,getStatus）。

这里全局提交会进入到其commit 方法：

```java
    @Override
    public GlobalStatus commit(String xid) throws TransactionException {
    // 查询全局事务信息
        GlobalSession globalSession = SessionHolder.findGlobalSession(xid);
        // 没有全局事务信息，则会标记为已完成
        if (globalSession == null) {
            return GlobalStatus.Finished;
        }
        globalSession.addSessionLifecycleListener(SessionHolder.getRootSessionManager());
        // 只需锁定状态即可
        boolean shouldCommit = SessionHolder.lockAndExecute(globalSession, () -> {
            // Highlight: Firstly, close the session, then no more branch can be registered.
            // 关闭会话，然后不能再注册分支。
            // 设置事务状态为未激活，
            // 如果是AT 模式，还会释放全局锁，删除锁记录
            globalSession.closeAndClean();
            if (globalSession.getStatus() == GlobalStatus.Begin) {
                if (globalSession.canBeCommittedAsync()) {
                // 如果可以异步，则执行异步提交
                    globalSession.asyncCommit();
                    return false;
                } else {
                    globalSession.changeStatus(GlobalStatus.Committing);
                    return true;
                }
            }
            return false;
        });
		// 执行同步提交 
        if (shouldCommit) {
        	// 
            boolean success = doGlobalCommit(globalSession, false);
            //If successful and all remaining branches can be committed asynchronously, do async commit.
            if (success && globalSession.hasBranch() && globalSession.canBeCommittedAsync()) {
                globalSession.asyncCommit();
                return GlobalStatus.Committed;
            } else {
                return globalSession.getStatus();
            }
        } else {
        	// 异步提交时，直接返回已提交给TM 客户端Committed 
            return globalSession.getStatus() == GlobalStatus.AsyncCommitting ? GlobalStatus.Committed : globalSession.getStatus();
        }
    }
```

`releaseGlobalSessionLock`方法会进行全局锁的释放：

```java
    @Override
    public boolean releaseGlobalSessionLock(GlobalSession globalSession) throws TransactionException {
    // 获取当前事务的所有分支事务信息
        List<BranchSession> branchSessions = globalSession.getBranchSessions();
        if (CollectionUtils.isEmpty(branchSessions)) {
            return true;
        }
        // 分支事务ID 集合
        List<Long> branchIds = branchSessions.stream().map(BranchSession::getBranchId).collect(Collectors.toList());
        try {
        	// 释放锁
            return getLocker().releaseLock(globalSession.getXid(), branchIds);
        } catch (Exception t) {
            LOGGER.error("unLock globalSession error, xid:{} branchIds:{}", globalSession.getXid(),
                CollectionUtils.toString(branchIds), t);
            return false;
        }
    }
```

释放锁调用的是`LockStoreDataBaseDAO.unLock`，删除lock-table中改记录的全局锁。

```java
    @Override
    public boolean unLock(String xid, List<Long> branchIds) {
        Connection conn = null;
        PreparedStatement ps = null;
        try {
            conn = lockStoreDataSource.getConnection();
            conn.setAutoCommit(true);
            StringJoiner sj = new StringJoiner(",");
            branchIds.forEach(branchId -> sj.add("?"));
            //batch release lock by branch list
            // delete from lock_table where xid = ? and branch_id in (?,?) 
            String batchDeleteSQL = LockStoreSqlFactory.getLogStoreSql(dbType).getBatchDeleteLockSqlByBranchs(lockTable, sj.toString());
            ps = conn.prepareStatement(batchDeleteSQL);
            ps.setString(1, xid);
            for (int i = 0; i < branchIds.size(); i++) {
                ps.setLong(i + 2, branchIds.get(i));
            }
            ps.executeUpdate();
        } catch (SQLException e) {
            throw new StoreException(e);
        } finally {
            IOUtil.close(ps, conn);
        }
        return true;
    }
```

#### 异步提交

释放全局锁之后，进行异步提交，进入的是`asyncCommit()`方法，它只负责修改全局事务的状态，而具体的提交处理是交给TC 协调器来处理的。

```java
    public void asyncCommit() throws TransactionException {
    	// 添加监听器 DataBaseSessionManager
        this.addSessionLifecycleListener(SessionHolder.getAsyncCommittingSessionManager());
        // 修改数据库中 全局事务状态
        SessionHolder.getAsyncCommittingSessionManager().addGlobalSession(this);
        // 根据 AsyncCommitting 状态，数据库修改事务信息，状态为8（异步提交中）
        this.changeStatus(GlobalStatus.AsyncCommitting);
    }
```

#### TC 协调器

`DefaultCoordinator`是全球事务默认的事务控制协调器。它继承`AbstractTCInboundHandler`，可为TC接受到RM和TM的请求数据，并进行相应处理的处理器。实现`TransactionMessageHandler`接口，去处理收到的RPC信息，在顶级层面上，实现`ResourceManagerInbound`接口，发送至RM的branchCommit分支提交，branchRollback分支回滚请求。

在`DefaultCoordinator`类中定义了五个`ScheduledThreadPoolExecutor（任务线程池执行器）`属性：

```java
    //处理需要重试回滚的事务
    private ScheduledThreadPoolExecutor retryRollbacking = new ScheduledThreadPoolExecutor(1,
        new NamedThreadFactory("RetryRollbacking", 1));
    //处理需要重试提交的事务
    private ScheduledThreadPoolExecutor retryCommitting = new ScheduledThreadPoolExecutor(1,
        new NamedThreadFactory("RetryCommitting", 1));
    //处理需要异步提交的事务
    private ScheduledThreadPoolExecutor asyncCommitting = new ScheduledThreadPoolExecutor(1,
        new NamedThreadFactory("AsyncCommitting", 1));
    //检测超时事务
    private ScheduledThreadPoolExecutor timeoutCheck = new ScheduledThreadPoolExecutor(1,
        new NamedThreadFactory("TxTimeoutCheck", 1));
    //通知RM删除回滚日志
    private ScheduledThreadPoolExecutor undoLogDelete = new ScheduledThreadPoolExecutor(1,
        new NamedThreadFactory("UndoLogDelete", 1));
```

这五个定时线程池就是用于处理加入到事务管理器之后的事务。它们是在`DefaultCoordinator`的init方法中启动的：

```java
	public void init() {
        //当通知分支事务回滚失败后，将全局事务加入到重试回滚管理器中，
        //下面的线程池用于处理需要回滚的事务
        retryRollbacking.scheduleAtFixedRate(() -> {
            try {
                handleRetryRollbacking();
            } catch (Exception e) {
                LOGGER.info("Exception retry rollbacking ... ", e);
            }
        }, 0, ROLLBACKING_RETRY_PERIOD, TimeUnit.MILLISECONDS);
        //在AT模式下，下面的线程池不会使用
        retryCommitting.scheduleAtFixedRate(() -> {
            try {
                handleRetryCommitting();
            } catch (Exception e) {
                LOGGER.info("Exception retry committing ... ", e);
            }
        }, 0, COMMITTING_RETRY_PERIOD, TimeUnit.MILLISECONDS);
        //AT模式下全局事务提交都是异步提交，需要提交的全局事务都加入到异步提交管理器中，
        //由下面的线程池处理
        asyncCommitting.scheduleAtFixedRate(() -> {
            try {
                handleAsyncCommitting();
            } catch (Exception e) {
                LOGGER.info("Exception async committing ... ", e);
            }
        }, 0, ASYNC_COMMITTING_RETRY_PERIOD, TimeUnit.MILLISECONDS);
        //遍历全局事务对象，查看是否有超时事务，如果事务超时了，
        //则将全局事务对象加入到重试回滚管理器中，也就是下面交给retryRollbacking线程池处理
        timeoutCheck.scheduleAtFixedRate(() -> {
            try {
                timeoutCheck();
            } catch (Exception e) {
                LOGGER.info("Exception timeout checking ... ", e);
            }
        }, 0, TIMEOUT_RETRY_PERIOD, TimeUnit.MILLISECONDS);
        //通知RM删除若干天前的回滚日志，默认是7天，该线程池的线程定时每天运行一次
        undoLogDelete.scheduleAtFixedRate(() -> {
            try {
                undoLogDelete();
            } catch (Exception e) {
                LOGGER.info("Exception undoLog deleting ... ", e);
            }
        }, UNDO_LOG_DELAY_DELETE_PERIOD, UNDO_LOG_DELETE_PERIOD, TimeUnit.MILLISECONDS);
    }
```

除了`undoLogDelete`是每天运行一次之外，其他的都是每秒运行一次。

在上面全局异步提交中，当前事务的状态被修改了`asyncCommitting`提交中了，所以线程池`asyncCommitting`执行时，会获取到该全局事务并进行处理，进入的是`handleAsyncCommitting`方法：

```java
    /**
     * Handle async committing.
     */
    protected void handleAsyncCommitting() {
       // 获取到 状态为提交中的所有事务信息
        Collection<GlobalSession> asyncCommittingSessions = SessionHolder.getAsyncCommittingSessionManager()
            .allSessions();
            // 为空直接返回 
        if (CollectionUtils.isEmpty(asyncCommittingSessions)) {
            return;
        }
        //asyncCommittingSession =》 GlobalSessionHandler内部类
        SessionHelper.forEach(asyncCommittingSessions, asyncCommittingSession -> {
            try {
                // Instruction reordering in DefaultCore#asyncCommit may cause this situation
                if (GlobalStatus.AsyncCommitting != asyncCommittingSession.getStatus()) {
                    //The function of this 'return' is 'continue'.
                    return;
                }
                asyncCommittingSession.addSessionLifecycleListener(SessionHolder.getRootSessionManager());
                // 调用 DefaultCore  的doGlobalCommit
                core.doGlobalCommit(asyncCommittingSession, true);
            } catch (TransactionException ex) {
                LOGGER.error("Failed to async committing [{}] {} {}", asyncCommittingSession.getXid(), ex.getCode(), ex.getMessage(), ex);
            }
        });
    }
```

在`DefaultCore` 的`doGlobalCommit`中，完成全局事务提交：

```java
    @Override
    public boolean doGlobalCommit(GlobalSession globalSession, boolean retrying) throws TransactionException {
        boolean success = true;
        // start committing event
        // 发布事件 
        eventBus.post(new GlobalTransactionEvent(globalSession.getTransactionId(), GlobalTransactionEvent.ROLE_TC,
            globalSession.getTransactionName(), globalSession.getApplicationId(), globalSession.getTransactionServiceGroup(),
            globalSession.getBeginTime(), null, globalSession.getStatus()));
		// 如果是SAGA 模式
        if (globalSession.isSaga()) {
            success = getCore(BranchType.SAGA).doGlobalCommit(globalSession, retrying);
        } else {
        	// 遍历分支事务 
            Boolean result = SessionHelper.forEach(globalSession.getSortedBranches(), branchSession -> {
                // if not retrying, skip the canBeCommittedAsync branches
                // 不是重试中，毕竟能被异步提交，调到下一次循环
                if (!retrying && branchSession.canBeCommittedAsync()) {
                    return CONTINUE;
                }
                BranchStatus currentStatus = branchSession.getStatus();
                // 如果分支事务状态为 PhaseOne_Failed，则移除该分支并 调到下一次循环
                if (currentStatus == BranchStatus.PhaseOne_Failed) {
                    globalSession.removeBranch(branchSession);
                    return CONTINUE;
                }
                try {
                	// 请求分支，提交分支事务
                    BranchStatus branchStatus = getCore(branchSession.getBranchType()).branchCommit(globalSession, branchSession);
					// 判断分支事务的状态
                    switch (branchStatus) {
                    	// 两阶段提交成功，移除分支事务信息
                        case PhaseTwo_Committed:
                            globalSession.removeBranch(branchSession);
                            return CONTINUE;
                           // 分支提交失败且不可重试
                        case PhaseTwo_CommitFailed_Unretryable:
                        	// 全局事务是否能异步提交
                        	// 可以，继续下一次循环
                            if (globalSession.canBeCommittedAsync()) {
                                LOGGER.error(
                                    "Committing branch transaction[{}], status: PhaseTwo_CommitFailed_Unretryable, please check the business log.", branchSession.getBranchId());
                                return CONTINUE;
                            } else {
                            	// 不可以，设置全局状态为 CommitFailed 
                                SessionHelper.endCommitFailed(globalSession);
                                LOGGER.error("Committing global transaction[{}] finally failed, caused by branch transaction[{}] commit failed.", globalSession.getXid(), branchSession.getBranchId());
                                return false;
                            }
                        default:
                        	// 没有成功，也没有不可重试，说明是可重试的
                            if (!retrying) {
                                globalSession.queueToRetryCommit();
                                return false;
                            }
                            if (globalSession.canBeCommittedAsync()) {
                                LOGGER.error("Committing branch transaction[{}], status:{} and will retry later",
                                    branchSession.getBranchId(), branchStatus);
                                return CONTINUE;
                            } else {
                                LOGGER.error(
                                    "Committing global transaction[{}] failed, caused by branch transaction[{}] commit failed, will retry later.", globalSession.getXid(), branchSession.getBranchId());
                                return false;
                            }
                    }
                } catch (Exception ex) {
                    StackTraceLogger.error(LOGGER, ex, "Committing branch transaction exception: {}",
                        new String[] {
     branchSession.toString()});
                    if (!retrying) {
                        globalSession.queueToRetryCommit();
                        throw new TransactionException(ex);
                    }
                }
                return CONTINUE;
            });
            // Return if the result is not null
            if (result != null) {
                return result;
            }
            //如果有分支，并且不是所有剩余的分支都可以异步提交，打印日志并返回false
            if (globalSession.hasBranch() && !globalSession.canBeCommittedAsync()) {
                LOGGER.info("Committing global transaction is NOT done, xid = {}.", globalSession.getXid());
                return false;
            }
        }
        // 如果成功且没有分支事务，则结束全局事务 
        if (success && globalSession.getBranchSessions().isEmpty()) {
            SessionHelper.endCommitted(globalSession);
            // 发布提交成功通知
            eventBus.post(new GlobalTransactionEvent(globalSession.getTransactionId(), GlobalTransactionEvent.ROLE_TC,
                globalSession.getTransactionName(), globalSession.getApplicationId(), globalSession.getTransactionServiceGroup(),
                globalSession.getBeginTime(), System.currentTimeMillis(), globalSession.getStatus()));
            LOGGER.info("Committing global transaction is successfully done, xid = {}.", globalSession.getXid());
        }
        // 返回成功
        return success;
    }
```

#### 分支处理提交请求

在上面的TC 进行`doGlobalCommit` 方法处理提交时，会循环调用每一个分支，向分支发送提交请求。

Netty 客户端收到请求后，RM 会调用处理器`DefaultRMHandler`处理分支提交

```java
    protected void doBranchCommit(BranchCommitRequest request, BranchCommitResponse response) throws TransactionException {
    	// 提交事务信息
        String xid = request.getXid();
        long branchId = request.getBranchId();
        String resourceId = request.getResourceId();
        String applicationData = request.getApplicationData();
        if (LOGGER.isInfoEnabled()) {
            LOGGER.info("Branch committing: " + xid + " " + branchId + " " + resourceId + " " + applicationData);
        }
		// 调用RM 进行提交
        BranchStatus status = this.getResourceManager().branchCommit(request.getBranchType(), xid, branchId, resourceId, applicationData);
        // 返回给TC 提交结果
        response.setXid(xid);
        response.setBranchId(branchId);
        response.setBranchStatus(status);
        if (LOGGER.isInfoEnabled()) {
            LOGGER.info("Branch commit result: " + status);
        }
    }
```

RM会调用一个异步处理类`AsyncWorker`进行处理 ，会添加到异步队列，然后直接返回成功给TC 。

```java
    public BranchStatus branchCommit(String xid, long branchId, String resourceId) {
      // 获取上下文
        AsyncWorker.Phase2Context context = new AsyncWorker.Phase2Context(xid, branchId, resourceId);
        // 添加到提交队列中
        this.addToCommitQueue(context);
        // 返回提交成功
        return BranchStatus.PhaseTwo_Committed;
    }
	// 添加到异步队列
    private void addToCommitQueue(AsyncWorker.Phase2Context context) {
        if (!this.commitQueue.offer(context)) {
            CompletableFuture.runAsync(this::doBranchCommitSafely, this.scheduledExecutor).thenRun(() -> {
                this.addToCommitQueue(context);
            });
        }
    }
```

在异步队列中，`AsyncWorker`会批量地删除相应 UNDO LOG 记录，至此，分支事务提交就全部完成了。

```java
    private void dealWithGroupedContexts(String resourceId, List<AsyncWorker.Phase2Context> contexts) {
        DataSourceProxy dataSourceProxy = this.dataSourceManager.get(resourceId);
        if (dataSourceProxy == null) {
            LOGGER.warn("Failed to find resource for {}", resourceId);
        } else {
            Connection conn;
            try {
                conn = dataSourceProxy.getPlainConnection();
            } catch (SQLException var7) {
                LOGGER.error("Failed to get connection for async committing on {}", resourceId, var7);
                return;
            }
            UndoLogManager undoLogManager = UndoLogManagerFactory.getUndoLogManager(dataSourceProxy.getDbType());
            List<List<AsyncWorker.Phase2Context>> splitByLimit = Lists.partition(contexts, 1000);
            // 批量删除
            splitByLimit.forEach((partition) -> {
                this.deleteUndoLog(conn, undoLogManager, partition);
            });
        }
    }
```
