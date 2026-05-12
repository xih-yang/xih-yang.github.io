# 20、分布式事务 Seata 教程 - AT模式源码分析之二阶段全局回滚
- 来源：https://ddkk.com/zhuanlan/transaction/5/20.html
- 分类：分布式事务
- 分组：教程目录
### 前言

之前我们分析了全局提交，而当TC 收到异常时，会执行全局事务回滚。

#### 1. TM 发起回滚

发生异常，TM会 catch捕获到异常，进入到`completeTransactionAfterThrowing`方法：

```java
    private void completeTransactionAfterThrowing(TransactionInfo txInfo, GlobalTransaction tx, Throwable originalException) throws ExecutionException {
        // 事务注解信息存在，异常是注解配置的回滚策略
        if (txInfo != null && txInfo.rollbackOn(originalException)) {
            try {
            	// 执行事务回滚
                this.rollbackTransaction(tx, originalException);
            } catch (TransactionException var5) {
                throw new ExecutionException(tx, var5, Code.RollbackFailure, originalException);
            }
        } else {
            this.commitTransaction(tx);
        }
    }
```

回滚会调用`rollbackTransaction`，执行相关钩子方法：

```java
    private void rollbackTransaction(GlobalTransaction tx, Throwable originalException) throws TransactionException, ExecutionException {
        this.triggerBeforeRollback();
        // 执行回滚
        tx.rollback();
        this.triggerAfterRollback();
        // 抛出异常
        throw new ExecutionException(tx, GlobalStatus.RollbackRetrying.equals(tx.getLocalStatus()) ? Code.RollbackRetrying : Code.RollbackDone, originalException);
    }
```

然后调用`DefaultGlobalTransaction`的`rollback()`方法进行回滚，回滚发生异常时，还会进行重试操作。

```java
    public void rollback() throws TransactionException {
       // 只有TC 能进行全局回滚命令
        if (this.role == GlobalTransactionRole.Participant) {
            if (LOGGER.isDebugEnabled()) {
                LOGGER.debug("Ignore Rollback(): just involved in global transaction [{}]", this.xid);
            }
        } else {
            this.assertXIDNotNull();
            int retry = ROLLBACK_RETRY_COUNT <= 0 ? 5 : ROLLBACK_RETRY_COUNT;
            try {
            	// 重试循环
                while(retry > 0) {
                    try {
                    	// TM 执行回滚
                        this.status = this.transactionManager.rollback(this.xid);
                        break;
                    } catch (Throwable var6) {
                        LOGGER.error("Failed to report global rollback [{}],Retry Countdown: {}, reason: {}", new Object[]{
     this.getXid(), retry, var6.getMessage()});
                        --retry;
                        if (retry == 0) {
                            throw new TransactionException("Failed to report global rollback", var6);
                        }
                    }
                }
            } finally {
                if (this.xid.equals(RootContext.getXID())) {
                    this.suspend();
                }
            }
        }
    }
```

最终调用到事务管理器，像TC 发送全局回滚请求 。

```java
    public GlobalStatus rollback(String xid) throws TransactionException {
        GlobalRollbackRequest globalRollback = new GlobalRollbackRequest();
        globalRollback.setXid(xid);
        // 请求TC 
        GlobalRollbackResponse response = (GlobalRollbackResponse)this.syncCall(globalRollback);
        return response.getGlobalStatus();
    }
```

#### 2. TC 处理回滚请求

TC协调器收到TM 发送的全局回滚请求后，依然是进入到`DefaultCore`类进行处理。

在其`rollback`方法中，会修改当前全局事务的状态为`Rollbacking`。

```java
    @Override
    public GlobalStatus rollback(String xid) throws TransactionException {
    	// 查询全局事务信息 
        GlobalSession globalSession = SessionHolder.findGlobalSession(xid);
        if (globalSession == null) {
            return GlobalStatus.Finished;
        }
		// 添加监听器         globalSession.addSessionLifecycleListener(SessionHolder.getRootSessionManager());
        // just lock changeStatus
        boolean shouldRollBack = SessionHolder.lockAndExecute(globalSession, () -> {
        	// 关闭事务，设置状态为未激活
            globalSession.close(); // Highlight: Firstly, close the session, then no more branch can be registered.
            // 修改状态为 Rollbacking 
            if (globalSession.getStatus() == GlobalStatus.Begin) {
                globalSession.changeStatus(GlobalStatus.Rollbacking);
                return true;
            }
            return false;
        });
        if (!shouldRollBack) {
            return globalSession.getStatus();
        }
		// 执行全局回滚
        doGlobalRollback(globalSession, false);
        return globalSession.getStatus();
    }
```

执行执行全局回滚的方法最终是`doGlobalRollback`，它会查询当前全局事务下的所有分支事务，远程请求所有的分支服务：

```java
    @Override
    public boolean doGlobalRollback(GlobalSession globalSession, boolean retrying) throws TransactionException {
        boolean success = true;
        // start rollback event
        // 发布回滚事件
        eventBus.post(new GlobalTransactionEvent(globalSession.getTransactionId(),
                GlobalTransactionEvent.ROLE_TC, globalSession.getTransactionName(),
                globalSession.getApplicationId(),
                globalSession.getTransactionServiceGroup(), globalSession.getBeginTime(),
                null, globalSession.getStatus()));
		// 处理Saga
        if (globalSession.isSaga()) {
            success = getCore(BranchType.SAGA).doGlobalRollback(globalSession, retrying);
        } else {
        // 循环所有分支事务 
            Boolean result = SessionHelper.forEach(globalSession.getReverseSortedBranches(), branchSession -> {
                BranchStatus currentBranchStatus = branchSession.getStatus();
                if (currentBranchStatus == BranchStatus.PhaseOne_Failed) {
                    globalSession.removeBranch(branchSession);
                    return CONTINUE;
                }
                try {
                	// 执行分支回滚 
                    BranchStatus branchStatus = branchRollback(globalSession, branchSession);
                    switch (branchStatus) {
                        // 两阶段回滚成功，删除分支事务信息
                        case PhaseTwo_Rollbacked:
                            globalSession.removeBranch(branchSession);
                            LOGGER.info("Rollback branch transaction successfully, xid = {} branchId = {}", globalSession.getXid(), branchSession.getBranchId());
                            return CONTINUE;
                        case PhaseTwo_RollbackFailed_Unretryable:
                            SessionHelper.endRollbackFailed(globalSession);
                            LOGGER.info("Rollback branch transaction fail and stop retry, xid = {} branchId = {}", globalSession.getXid(), branchSession.getBranchId());
                            return false;
                        default:
                            LOGGER.info("Rollback branch transaction fail and will retry, xid = {} branchId = {}", globalSession.getXid(), branchSession.getBranchId());
                            if (!retrying) {
                                globalSession.queueToRetryRollback();
                            }
                            return false;
                    }
                } catch (Exception ex) {
                    StackTraceLogger.error(LOGGER, ex,
                        "Rollback branch transaction exception, xid = {} branchId = {} exception = {}",
                        new String[] {
     globalSession.getXid(), String.valueOf(branchSession.getBranchId()), ex.getMessage()});
                    if (!retrying) {
                        globalSession.queueToRetryRollback();
                    }
                    throw new TransactionException(ex);
                }
            });
            // Return if the result is not null
            if (result != null) {
                return result;
            }
        // 在db模式下，多个副本中存在数据不一致的问题，导致出现新的分支
		//回滚时进行事务注册。
		// 1. 新建分支事务和回滚分支事务没有数据关联
		// 2. 新分支事务与回滚分支事务有数据关联
		//第二个查询可以解决第一个问题，如果是第二个问题，可能会导致回滚
		//由于数据更改而失败。
            GlobalSession globalSessionTwice = SessionHolder.findGlobalSession(globalSession.getXid());
            if (globalSessionTwice != null && globalSessionTwice.hasBranch()) {
                LOGGER.info("Rollbacking global transaction is NOT done, xid = {}.", globalSession.getXid());
                return false;
            }
        }
        // 所有分支回滚成功 发布事件
        if (success) {
            SessionHelper.endRollbacked(globalSession);
            // rollbacked event
            eventBus.post(new GlobalTransactionEvent(globalSession.getTransactionId(),
                    GlobalTransactionEvent.ROLE_TC, globalSession.getTransactionName(),
                    globalSession.getApplicationId(),
                    globalSession.getTransactionServiceGroup(),
                    globalSession.getBeginTime(), System.currentTimeMillis(),
                    globalSession.getStatus()));
            LOGGER.info("Rollback global transaction successfully, xid = {}.", globalSession.getXid());
        }
        return success;
    }
```

发起分支回滚请求的执行方法是`branchRollback`，依然是通过Netty 进行通信：

```java
    @Override
    public BranchStatus branchRollback(GlobalSession globalSession, BranchSession branchSession) throws TransactionException {
        try {
        	// 创建请求
            BranchRollbackRequest request = new BranchRollbackRequest();
            request.setXid(branchSession.getXid());
            request.setBranchId(branchSession.getBranchId());
            request.setResourceId(branchSession.getResourceId());
            request.setApplicationData(branchSession.getApplicationData());
            request.setBranchType(branchSession.getBranchType());
            // 请求各个分支客户端，返回状态
            return branchRollbackSend(request, globalSession, branchSession);
        } catch (IOException | TimeoutException e) {
            throw new BranchTransactionException(FailedToSendBranchRollbackRequest,
                    String.format("Send branch rollback failed, xid = %s branchId = %s",
                            branchSession.getXid(), branchSession.getBranchId()), e);
        }
    }
```

分支服务返回的状态枚举类入下图所示：

```java
public enum BranchStatus {
    /**
     * The Unknown.
     * description:Unknown branch status.
     */
    Unknown(0),
    /**
     * The Registered.
     * description:Registered to TC.
     */
    Registered(1),
    /**
     * The Phase one done.
     * description:Branch logic is successfully done at phase one.
     */
    PhaseOne_Done(2),
    /**
     * The Phase one failed.
     * description:Branch logic is failed at phase one.
     */
    PhaseOne_Failed(3),
    /**
     * The Phase one timeout.
     * description:Branch logic is NOT reported for a timeout.
     */
    PhaseOne_Timeout(4),
    /**
     * The Phase two committed.
     * description:Commit logic is successfully done at phase two.
     */
    PhaseTwo_Committed(5),
    /**
     * The Phase two commit failed retryable.
     * description:Commit logic is failed but retryable.
     */
    PhaseTwo_CommitFailed_Retryable(6),
    /**
     * The Phase two commit failed unretryable.
     * description:Commit logic is failed and NOT retryable.
     */
    PhaseTwo_CommitFailed_Unretryable(7),
    /**
     * The Phase two rollbacked.
     * description:Rollback logic is successfully done at phase two.
     */
    PhaseTwo_Rollbacked(8),
    /**
     * The Phase two rollback failed retryable.
     * description:Rollback logic is failed but retryable.
     */
    PhaseTwo_RollbackFailed_Retryable(9),
    /**
     * The Phase two rollback failed unretryable.
     * description:Rollback logic is failed but NOT retryable.
     */
    PhaseTwo_RollbackFailed_Unretryable(10);
```

#### 3. RM 接受回滚请求

RM接受到回滚请求，执行回滚，进入到`RMHandlerAT`处理器，首先进入到抽象父类的`doBranchRollback`方法中，解析请求，调用RM 资源管理器执行回滚：

```java
    protected void doBranchRollback(BranchRollbackRequest request, BranchRollbackResponse response) throws TransactionException {
       // 请求信息
        String xid = request.getXid();
        long branchId = request.getBranchId();
        String resourceId = request.getResourceId();
        String applicationData = request.getApplicationData();
        if (LOGGER.isInfoEnabled()) {
            LOGGER.info("Branch Rollbacking: " + xid + " " + branchId + " " + resourceId);
        }
		// RM  资源管理回滚
        BranchStatus status = this.getResourceManager().branchRollback(request.getBranchType(), xid, branchId, resourceId, applicationData);
        response.setXid(xid);
        response.setBranchId(branchId);
        response.setBranchStatus(status);
        // 返回响应
        if (LOGGER.isInfoEnabled()) {
            LOGGER.info("Branch Rollbacked result: " + status);
        }
    }
```

RM资源管理器的分支事务回滚方法，会查询回滚日志，并调用`UndoLogManager`管理器进行回滚处理：

```java
    public BranchStatus branchRollback(BranchType branchType, String xid, long branchId, String resourceId, String applicationData) throws TransactionException {
        DataSourceProxy dataSourceProxy = this.get(resourceId);
        if (dataSourceProxy == null) {
            throw new ShouldNeverHappenException();
        } else {
            try {
                //查询 回滚日志并回滚
                UndoLogManagerFactory.getUndoLogManager(dataSourceProxy.getDbType()).undo(dataSourceProxy, xid, branchId);
            } catch (TransactionException var9) {
                StackTraceLogger.info(LOGGER, var9, "branchRollback failed. branchType:[{}], xid:[{}], branchId:[{}], resourceId:[{}], applicationData:[{}]. reason:[{}]", new Object[]{
     branchType, xid, branchId, resourceId, applicationData, var9.getMessage()});
                if (var9.getCode() == TransactionExceptionCode.BranchRollbackFailed_Unretriable) {
                    return BranchStatus.PhaseTwo_RollbackFailed_Unretryable;
                }
                return BranchStatus.PhaseTwo_RollbackFailed_Retryable;
            }
            return BranchStatus.PhaseTwo_Rollbacked;
        }
    }
```

#### 4. RM 执行回滚

执行回滚是由回滚日志管理器`UndoLogManager`来进行处理的，其`undo`方法会开启一个死循环，查询数据库中的回滚日志，将存储的序列化信息转换为JAVA 对象，然后调用回滚执行器进行回滚解析处理，处理完成后，删除日志并提交事务。

```java
    public void undo(DataSourceProxy dataSourceProxy, String xid, long branchId) throws TransactionException {
        Connection conn = null;
        ResultSet rs = null;
        PreparedStatement selectPST = null;
        boolean originalAutoCommit = true;
        while(true) {
            try {
                conn = dataSourceProxy.getPlainConnection();
                if (originalAutoCommit = conn.getAutoCommit()) {
                    conn.setAutoCommit(false);
                }
				// SELECT * FROM undo_log WHERE branch_id = ? AND xid = ? FOR UPDATE
                selectPST = conn.prepareStatement(SELECT_UNDO_LOG_SQL);
                selectPST.setLong(1, branchId);
                selectPST.setString(2, xid);
                rs = selectPST.executeQuery();
                boolean exists = false;
                while(rs.next()) {
                    exists = true;
                    // 日志状态 0 正常
                    int state = rs.getInt("log_status");
                    if (!canUndo(state)) {
                        if (LOGGER.isInfoEnabled()) {
                            LOGGER.info("xid {} branch {}, ignore {} undo_log", new Object[]{
     xid, branchId, state});
                        }
                        return;
                    }
					// 反序列化回滚信息 
                    String contextString = rs.getString("context");
                    Map<String, String> context = this.parseContext(contextString);
                    byte[] rollbackInfo = this.getRollbackInfo(rs);
                    String serializer = context == null ? null : (String)context.get("serializer");
                    UndoLogParser parser = serializer == null ? UndoLogParserFactory.getInstance() : UndoLogParserFactory.getInstance(serializer);
                    BranchUndoLog branchUndoLog = parser.decode(rollbackInfo);
                    try {
                        setCurrentSerializer(parser.getName());
                        // 回滚日志对象
                        List<SQLUndoLog> sqlUndoLogs = branchUndoLog.getSqlUndoLogs();
                        if (sqlUndoLogs.size() > 1) {
                            Collections.reverse(sqlUndoLogs);
                        }
                        Iterator var18 = sqlUndoLogs.iterator();
                        while(var18.hasNext()) {
                            SQLUndoLog sqlUndoLog = (SQLUndoLog)var18.next();
                            TableMeta tableMeta = TableMetaCacheFactory.getTableMetaCache(dataSourceProxy.getDbType()).getTableMeta(conn, sqlUndoLog.getTableName(), dataSourceProxy.getResourceId());
                            sqlUndoLog.setTableMeta(tableMeta);
                            AbstractUndoExecutor undoExecutor = UndoExecutorFactory.getUndoExecutor(dataSourceProxy.getDbType(), sqlUndoLog);
                            // MySQLUndoUpdateExecutor 回滚执行器
                            undoExecutor.executeOn(conn);
                        }
                    } finally {
                        removeCurrentSerializer();
                    }
                }
                if (exists) {
                   // 删除回滚日志 
                    this.deleteUndoLog(xid, branchId, conn);
                    // 提交事务
                    conn.commit();
                    if (LOGGER.isInfoEnabled()) {
                        LOGGER.info("xid {} branch {}, undo_log deleted with {}", new Object[]{
     xid, branchId, AbstractUndoLogManager.State.GlobalFinished.name()});
                    }
                } else {
                    this.insertUndoLogWithGlobalFinished(xid, branchId, UndoLogParserFactory.getInstance(), conn);
                    conn.commit();
                    if (LOGGER.isInfoEnabled()) {
                        LOGGER.info("xid {} branch {}, undo_log added with {}", new Object[]{
     xid, branchId, AbstractUndoLogManager.State.GlobalFinished.name()});
                    }
                }
                break;
            } catch (SQLIntegrityConstraintViolationException var43) {
                if (LOGGER.isInfoEnabled()) {
                    LOGGER.info("xid {} branch {}, undo_log inserted, retry rollback", xid, branchId);
                }
            } catch 
		// 省略大量代码....
    }
```

会根据不同的操作类型，创建不同的回滚执行器，比如更新操作调用的是`MySQLUndoUpdateExecutor`。其`executeOn`方法会进行数据校验，然后执行更新回滚：

```java
 public void executeOn(Connection conn) throws SQLException {
 		// 数据校验
        if (!IS_UNDO_DATA_VALIDATION_ENABLE || this.dataValidationAndGoOn(conn)) {
            try {
            	// 构建回滚SQL不带参数 
               // UPDATE account_tbl SET user_id = ?, money = ? WHERE id = ?  
                String undoSQL = this.buildUndoSQL();
                PreparedStatement undoPST = conn.prepareStatement(undoSQL);
                TableRecords undoRows = this.getUndoRows();
                Iterator var5 = undoRows.getRows().iterator();
				// 循环回滚的行 
                while(var5.hasNext()) {
                    Row undoRow = (Row)var5.next();
                    ArrayList<Field> undoValues = new ArrayList();
                    // 主键 
                    List<Field> pkValueList = this.getOrderedPkList(undoRows, undoRow, this.getDbType(conn));
                    Iterator var9 = undoRow.getFields().iterator();
                    while(var9.hasNext()) {
                        Field field = (Field)var9.next();
                        if (field.getKeyType() != KeyType.PRIMARY_KEY) {
                            undoValues.add(field);
                        }
                    }
				// 构建回滚的SQL 带参数 =》  UPDATE account_tbl SET user_id = '2', money = -2612 WHERE id = 11111111  
                    this.undoPrepare(undoPST, undoValues, pkValueList);
                    // 执行
                    undoPST.executeUpdate();
                }
            } catch (Exception var11) {
                if (var11 instanceof SQLException) {
                    throw (SQLException)var11;
                } else {
                    throw new SQLException(var11);
                }
            }
        }
    }
```

数据校验，调用的是`dataValidationAndGoOn`方法，将前后数据快照使用工具类`DataCompareUtils`进行校验，其校验的情况分为以下几种：

- 前后镜像的数据一样，返回false，停止回滚，因为前数据快照和后数据快照之间没有数据更改
- **前后镜像不一样， 查询当前数据库该条记录，校验后置镜像和当前数据是否一致,应该是一致的，说明数据没有被其他事务修改过，数据没有脏**
- 前后镜像不一样， 查询当前数据库该条记录，校验前置镜像和当前数据是不一致，返回false ,停止回滚，因为之前的数据快照和当前数据快照之间没有数据更改
- 前后镜像不一样， 查询当前数据库该条记录，校验前置镜像和当前数据，如果一致，返回false ,停止回滚，数据被修改过，认为数据已经脏了，抛出异常

所以只有在前后镜像数据不一致时，毕竟后置镜像和当前数据对的上时，才会返回数据校验通过。

```java
    protected boolean dataValidationAndGoOn(Connection conn) throws SQLException {
        // 前镜像
        TableRecords beforeRecords = this.sqlUndoLog.getBeforeImage();
        // 后镜像
        TableRecords afterRecords = this.sqlUndoLog.getAfterImage();
        // 使用工具类校验 前后镜像的数据是否一样
        Result<Boolean> beforeEqualsAfterResult = DataCompareUtils.isRecordsEquals(beforeRecords, afterRecords);
        // 前后镜像的数据是有区别的，如果一样，则会打印日志，返回Fasle Stop rollback because there is no data change between the before data snapshot and the after data snapshot
        if ((Boolean)beforeEqualsAfterResult.getResult()) {
            if (LOGGER.isInfoEnabled()) {
                LOGGER.info("Stop rollback because there is no data change between the before data snapshot and the after data snapshot.");
            }
            return false;
        } else {
        	// 前后镜像不一样时 查询当前数据库该条记录并加排它锁
        	// SELECT * FROM account_tbl WHERE (id) in ( (11111111) ) FOR UPDATE
            TableRecords currentRecords = this.queryCurrentRecords(conn);
            // 校验后置镜像和当前数据是否一致,应该是一致的，说明数据没有被其他事务修改过，数据没有脏
            Result<Boolean> afterEqualsCurrentResult = DataCompareUtils.isRecordsEquals(afterRecords, currentRecords);
            if (!(Boolean)afterEqualsCurrentResult.getResult()) {
            	// 不一致时，再校验前置镜像和当前数据是否一致
                Result<Boolean> beforeEqualsCurrentResult = DataCompareUtils.isRecordsEquals(beforeRecords, currentRecords);
                // 如果前置快照和当前一致，则返回校验失败
                // Stop rollback because there is no data change between the before data snapshot and the current data snapshot
                if ((Boolean)beforeEqualsCurrentResult.getResult()) {
                    if (LOGGER.isInfoEnabled()) {
                        LOGGER.info("Stop rollback because there is no data change between the before data snapshot and the current data snapshot.");
                    }
                    return false;
                } else {
                	// 前置快照（数据修改前）和当前不一致，说明在Seata 全局事务时，
                	// 数据被修改过，认为数据已经脏了，抛出异常
                    if (LOGGER.isInfoEnabled() && StringUtils.isNotBlank(afterEqualsCurrentResult.getErrMsg())) {
                        LOGGER.info(afterEqualsCurrentResult.getErrMsg(), afterEqualsCurrentResult.getErrMsgParams());
                    }
                    if (LOGGER.isDebugEnabled()) {
                        LOGGER.debug("check dirty datas failed, old and new data are not equal,tableName:[" + this.sqlUndoLog.getTableName() + "],oldRows:[" + JSON.toJSONString(afterRecords.getRows()) + "],newRows:[" + JSON.toJSONString(currentRecords.getRows()) + "].");
                    }
                    throw new SQLException("Has dirty records when undo.");
                }
            } else {
               // 当前一致，则返回校验成功通过
                return true;
            }
        }
    }
```

校验数据是否一致，是会比较其字段名、字段值、字段类型是否一致，具体执行逻辑如下：

```java
    public static Result<Boolean> isRecordsEquals(TableRecords beforeImage, TableRecords afterImage) {
    	// 前后镜像不存在 返回False 
        if (beforeImage == null) {
            return Result.build(afterImage == null, (String)null);
        } else if (afterImage == null) {
            return Result.build(false, (String)null);
         // 前后镜像的表名、行数是否一致，
        } else if (beforeImage.getTableName().equalsIgnoreCase(afterImage.getTableName()) && CollectionUtils.isSizeEquals(beforeImage.getRows(), afterImage.getRows())) {
        	// 前置镜像行为不空，则
            return CollectionUtils.isEmpty(beforeImage.getRows()) ? Result.ok() : compareRows(beforeImage.getTableMeta(), beforeImage.getRows(), afterImage.getRows());
        } else {
            return Result.build(false, (String)null);
        }
    }
```

```java
    private static Result<Boolean> compareRows(TableMeta tableMetaData, List<Row> oldRows, List<Row> newRows) {
        // old row to map
        // 前置镜像转给Map
        Map<String, Map<String, Field>> oldRowsMap = rowListToMap(oldRows, tableMetaData.getPrimaryKeyOnlyName());
        // new row to map
       	// 后置镜像转为Map 
        Map<String, Map<String, Field>> newRowsMap = rowListToMap(newRows, tableMetaData.getPrimaryKeyOnlyName());
        // compare data\
        // 循环前置镜像
        for (Map.Entry<String, Map<String, Field>> oldEntry : oldRowsMap.entrySet()) {
        	// 主键
            String key = oldEntry.getKey();
            // 前置镜像键值对
            Map<String, Field> oldRow = oldEntry.getValue();
            // 后置镜像键值对
            Map<String, Field> newRow = newRowsMap.get(key);
            // 后置镜像为null 抛出compare row failed, rowKey {}, reason [newRow is null]
            if (newRow == null) {
                return Result.buildWithParams(false, "compare row failed, rowKey {}, reason [newRow is null]", key);
            }
            // 循环 前置镜像键值对
            for (Map.Entry<String, Field> oldRowEntry : oldRow.entrySet()) {
            	// 字段名
                String fieldName = oldRowEntry.getKey();
                // 字段值
                Field oldField = oldRowEntry.getValue();
                // 后置镜像字段名对应的字段值
                Field newField = newRow.get(fieldName);
                // 字段为null 抛出异常compare row failed, rowKey {}, fieldName {}, reason [newField is null]"
                if (newField == null) {
                    return Result.buildWithParams(false, "compare row failed, rowKey {}, fieldName {}, reason [newField is null]", key, fieldName);
                }
                // 检验前后镜像的字段  
                Result<Boolean> oldEqualsNewFieldResult = isFieldEquals(oldField, newField);
                if (!oldEqualsNewFieldResult.getResult()) {
                    return oldEqualsNewFieldResult;
                }
            }
        }
        return Result.ok();
    }
```

```java
    public static Result<Boolean> isFieldEquals(Field f0, Field f1) {
    // oldField 为null 表示之前该字段没有值，则看newField 是否也未null , 都为null 返回true
        if (f0 == null) {
            return Result.build(f1 == null);
        } else {
        	// oldField 不为null newField 为null 返回false 
            if (f1 == null) {
                return Result.build(false);
            } else {
            	// 字段名及类型都一致
                if (StringUtils.equalsIgnoreCase(f0.getName(), f1.getName())
                        && f0.getType() == f1.getType()) {
                    if (f0.getValue() == null) {
                        return Result.build(f1.getValue() == null);
                    } else {
                        if (f1.getValue() == null) {
                            return Result.buildWithParams(false, "Field not equals, name {}, new value is null", f0.getName());
                        } else {
                            String currentSerializer = AbstractUndoLogManager.getCurrentSerializer();
                            if (StringUtils.equals(currentSerializer, FastjsonUndoLogParser.NAME)) {
                                convertType(f0, f1);
                            }
                            // 比较字段值是否一致 如果是修改语句，肯定不一致，返回false
                            boolean result = Objects.deepEquals(f0.getValue(), f1.getValue());
                            if (result) {
                                return Result.ok();
                            } else {
                                return Result.buildWithParams(false, "Field not equals, name {}, old value {}, new value {}", f0.getName(), f0.getValue(), f1.getValue());
                            }
                        }
                    }
                } else {
                    return Result.buildWithParams(false, "Field not equals, old name {} type {}, new name {} type {}", f0.getName(), f0.getType(), f1.getName(), f1.getType());
                }
            }
        }
    }
```

数据校验通过后，会调用`buildUndoSQL`方法，构造回滚的SQL：

```java
    protected String buildUndoSQL() {
    // 前置镜像
        TableRecords beforeImage = this.sqlUndoLog.getBeforeImage();
        // 更新前的数据
        List<Row> beforeImageRows = beforeImage.getRows();
        if (CollectionUtils.isEmpty(beforeImageRows)) {
            throw new ShouldNeverHappenException("Invalid UNDO LOG");
        } else {
        // 当前数据的更新行 
            Row row = (Row)beforeImageRows.get(0);
            // 不包含主键的字段
            List<Field> nonPkFields = row.nonPrimaryKeys();
            // 更新的SQL 条件片段=》user_id = ?, money = ?
            String updateColumns = (String)nonPkFields.stream().map((field) -> {
                return ColumnUtils.addEscape(field.getName(), "mysql") + " = ?";
            }).collect(Collectors.joining(", "));
            // 主键 字段
            List<String> pkNameList = (List)this.getOrderedPkList(beforeImage, row, "mysql").stream().map((e) -> {
                return e.getName();
            }).collect(Collectors.toList());
            // Where 条件
            String whereSql = SqlGenerateUtils.buildWhereConditionByPKs(pkNameList, "mysql");
            return String.format("UPDATE %s SET %s WHERE %s ", this.sqlUndoLog.getTableName(), updateColumns, whereSql);
        }
    }
```

最终，返回到`UndoLogManager`，进行日志删除和事务提交，并把本地事务的执行结果（即分支事务回滚的结果）上报给 TC。

#### 5. TC 收到回滚完成消息

TC收到回滚完成消息，会删除相关分支事务数据，标记整个事务为已回滚状态，至此整个全局回滚流程结束：
