# 18、分布式事务 Seata 教程 - AT模式源码分析之一阶段本地分支事务
- 来源：https://ddkk.com/zhuanlan/transaction/5/18.html
- 分类：分布式事务
- 分组：教程目录
### 前言

之前我们分析了开启全局事务后，会执行本地业务逻辑，接下来分析下，本地分支事务时如何进行操作的。

### 分支事务源码分析

#### 1. 进入代理PreparedStatementProxy

全局事务流程接着进入到标注有`@GlobalTransactional`注解的业务方法中，当执行到SQL语句时，由于Seata 对数据源进行了代理，所以所以的SQL 执行都会进入到其代理方法中。

在JDBC 操作数据库时，执行SQL 语句的是`PreparedStatement`，在Seata 中其代理类为`PreparedStatementProxy`，其execute 方法会调用`ExecuteTemplate`的`execute`方法。

```java
    public boolean execute() throws SQLException {
        return (Boolean)ExecuteTemplate.execute(this, (statement, args) -> {
            return statement.execute();
        }, new Object[0]);
    }
```

#### 2. 进入到ExecuteTemplate 创建执行器

`ExecuteTemplate`中，会根据不同的SQL 操作类型创建不同的执行器：

```java
    /**
     * Execute t.
     *
     * @param <T>               the type parameter
     * @param <S>               the type parameter
     * @param sqlRecognizers    the sql recognizer list
     * @param statementProxy    the statement proxy
     * @param statementCallback the statement callback
     * @param args              the args
     * @return the t
     * @throws SQLException the sql exception
     */
    public static <T, S extends Statement> T execute(List<SQLRecognizer> sqlRecognizers,
                                                     StatementProxy<S> statementProxy,
                                                     StatementCallback<T, S> statementCallback,
                                                     Object... args) throws SQLException {
         // 1. 如果没有GlobalLock 并且不是AT 模式，直接执行 
        if (!RootContext.requireGlobalLock() && BranchType.AT != RootContext.getBranchType()) {
            // Just work as original statement
            return statementCallback.execute(statementProxy.getTargetStatement(), args);
        }
		// 2. 数据库类型=》mysql
        String dbType = statementProxy.getConnectionProxy().getDbType();
        // 3. 获取执行的SQL ，将SQL 解析为表达式(SQL 解析器) ，sqlRecognizers参数初始为NULL，所以这里都需要获取，普通SELECT 查询这里为null, 增删改都会解析出对应的SQL表达式
        if (CollectionUtils.isEmpty(sqlRecognizers)) {
            sqlRecognizers = SQLVisitorFactory.get(
                    statementProxy.getTargetSQL(),
                    dbType);
        }
        Executor<T> executor;
        if (CollectionUtils.isEmpty(sqlRecognizers)) {
            executor = new PlainExecutor<>(statementProxy, statementCallback);
        } else {
            if (sqlRecognizers.size() == 1) {
                SQLRecognizer sqlRecognizer = sqlRecognizers.get(0);
                 // 4. 不同的操作类型，创建不同的执行器
                switch (sqlRecognizer.getSQLType()) {
                	// 插入
                    case INSERT:
                        executor = EnhancedServiceLoader.load(InsertExecutor.class, dbType,
                                new Class[]{
     StatementProxy.class, StatementCallback.class, SQLRecognizer.class},
                                new Object[]{
     statementProxy, statementCallback, sqlRecognizer});
                        break;
                    // 更新 
                    case UPDATE:
                        executor = new UpdateExecutor<>(statementProxy, statementCallback, sqlRecognizer);
                        break;
                    // 删除
                    case DELETE:
                        executor = new DeleteExecutor<>(statementProxy, statementCallback, sqlRecognizer);
                        break;
                    // 排它锁语句
                    case SELECT_FOR_UPDATE:
                        executor = new SelectForUpdateExecutor<>(statementProxy, statementCallback, sqlRecognizer);
                        break;
                    default:
                        executor = new PlainExecutor<>(statementProxy, statementCallback);
                        break;
                }
            } else {
                executor = new MultiExecutor<>(statementProxy, statementCallback, sqlRecognizers);
            }
        }
        T rs;
        try {
        	// 执行器执行，更新时使用的是UpdateExecutor
            rs = executor.execute(args);
        } catch (Throwable ex) {
            if (!(ex instanceof SQLException)) {
                // Turn other exception into SQLException
                ex = new SQLException(ex);
            }
            throw (SQLException) ex;
        }
        return rs;
    }
```

#### 3. 执行器执行

创建执行器之后，会进行执行，首先会设置相关参数：

```java
    public T execute(Object... args) throws Throwable {
    	// 1. 获取xid,在开启全局事务时已创建并绑定
        String xid = RootContext.getXID();
        if (xid != null) {
        	// 将XID 绑定到StatementProxy
            this.statementProxy.getConnectionProxy().bind(xid);
        }
      // 处理@GlobalLock
      this.statementProxy.getConnectionProxy().setGlobalLockRequire(RootContext.requireGlobalLock());
      // 调用 doExecute
        return this.doExecute(args);
    }
```

`doExecute`方法会获取代理的连接，然后执行对应的方法：

```java
    public T doExecute(Object... args) throws Throwable {
    	// 1. 获取连接
        AbstractConnectionProxy connectionProxy = this.statementProxy.getConnectionProxy();
        // 2. 根据是否自动提交，执行不同的方法
        return connectionProxy.getAutoCommit() ? this.executeAutoCommitTrue(args) : this.executeAutoCommitFalse(args);
    }
```

因为在使用Mybatis Plus 时是设置了自动提交的，所以会进入到`executeAutoCommitTrue`方法。

```java
    protected T executeAutoCommitTrue(Object[] args) throws Throwable {
    // 1. 获取代理的连接
        ConnectionProxy connectionProxy = statementProxy.getConnectionProxy();
        try {
        	// 2. 设置不自动提交
            connectionProxy.changeAutoCommit();
            // 3. 使用LockRetryPolicy.execute 开启一条线程去执行，LockRetryPolicy 是一个策略，
            // 策略对应配置retry-policy-branch-rollback-on-conflict
            // 分支事务与其它全局回滚事务冲突时锁策略，默认true，优先释放本地锁让回滚成功
            return new LockRetryPolicy(connectionProxy).execute(new Callable<T>() {
                @Override
                public T call() throws Exception {
                // 4. 执行
                    T result = AbstractDMLBaseExecutor.this.executeAutoCommitFalse(args);
                    // 5.执行完毕提交事务
                    connectionProxy.commit();
                    return result;
                }
            });
        } catch (Exception e) {
            // when exception occur in finally,this exception will lost, so just print it here
            LOGGER.error("execute executeAutoCommitTrue error:{}", e.getMessage(), e);
            if (!LockRetryPolicy.isLockRetryPolicyBranchRollbackOnConflict()) {
                connectionProxy.getTargetConnection().rollback();
            }
            throw e;
        } finally {
        	// 清理资源，设置提供提交为true
            connectionProxy.getContext().reset();
            connectionProxy.setAutoCommit(true);
        }
    }
```

接着执行到`executeAutoCommitFalse`，也就是不自动提交执行，会在SQL 实际执行前后，构建镜像，记录数据状态，比如更新语句，会记录该条数据修改前和修改后的数据状态，并添加排他锁。

```java
    protected T executeAutoCommitFalse(Object[] args) throws Exception {
        if (!"mysql".equalsIgnoreCase(this.getDbType()) && this.isMultiPk()) {
            throw new NotSupportYetException("multi pk only support mysql!");
        } else {
        	// 构建前置镜像，缓存中查询表结构，更新语句会使用SELECT 查询
        	// eg: SELECT id, user_id, money FROM account_tbl WHERE id = 11111111 FOR UPDATE
			// 这里加了一个排他锁，所以只能当前事务修改该条数据
            TableRecords beforeImage = this.beforeImage();
            // 执行业务SQL =》 UPDATE account_tbl SET user_id='2', money=-2561 WHERE id=11111111
            T result = this.statementCallback.execute(this.statementProxy.getTargetStatement(), args);		
            // 后置镜像 ，记录改数据被修改后的状态
            TableRecords afterImage = this.afterImage(beforeImage);
            // 构建undo_log 
            this.prepareUndoLog(beforeImage, afterImage);
            return result;
        }
    }
```

#### 4. 构建undo_log

对于更新语句，修改自动提交为false=》添加排他锁=》执行实际业务SQL=》构建前后镜像，之后就会构建回滚日志undo_log 。

```java
    protected void prepareUndoLog(TableRecords beforeImage, TableRecords afterImage) throws SQLException {
    	// 前后镜像都为空，执行返回
        if (beforeImage.getRows().isEmpty() && afterImage.getRows().isEmpty()) {
            return;
        }
        // UPDATE 时，没有前后镜像，抛出异常
        if (SQLType.UPDATE == sqlRecognizer.getSQLType()) {
            if (beforeImage.getRows().size() != afterImage.getRows().size()) {
                throw new ShouldNeverHappenException("Before image size is not equaled to after image size, probably because you updated the primary keys.");
            }
        }
        ConnectionProxy connectionProxy = statementProxy.getConnectionProxy();
		// 如果是删除，则只记录删除前的数据
        TableRecords lockKeyRecords = sqlRecognizer.getSQLType() == SQLType.DELETE ? beforeImage : afterImage;
        // 构建全局锁的key =>account_tbl:11111111(表名+主键 )
        String lockKeys = buildLockKey(lockKeyRecords);
        if (null != lockKeys) {
        	// 添加全局锁的KEY　　和滚回日志到　SQL　连接中
            connectionProxy.appendLockKey(lockKeys);
            SQLUndoLog sqlUndoLog = buildUndoItem(beforeImage, afterImage);
            connectionProxy.appendUndoLog(sqlUndoLog);
        }
    }
```

#### 5. 本地事务提交

最后进入到本地事务提交方法中：

```java
    private void doCommit() throws SQLException {
    // 如果是全局事务
        if (context.inGlobalTransaction()) {
            processGlobalTransactionCommit();
            // 如果是GlobalLock
        } else if (context.isGlobalLockRequire()) {
            processLocalCommitWithGlobalLocks();
            // 其他直接提交
        } else {
            targetConnection.commit();
        }
    }
```

因为这是全局事务，所以会进入到`processGlobalTransactionCommit`方法，首先会调用`register`方法，RM 向TC 注册分支事务，在TC 的branch_table 插入一条分支事务数据。

```java
    private void processGlobalTransactionCommit() throws SQLException {
        try {
        	// 注册分支事务
            register();
        } catch (TransactionException e) {
            recognizeLockKeyConflictException(e, context.buildLockKeys());
        }
        try {
        	// 提交事务，包括业务操作和插入的UNDO_LOG 记录
            UndoLogManagerFactory.getUndoLogManager(this.getDbType()).flushUndoLogs(this);
            targetConnection.commit();
        } catch (Throwable ex) {
            LOGGER.error("process connectionProxy commit error: {}", ex.getMessage(), ex);
            report(false);
            throw new SQLException(ex);
        }
        if (IS_REPORT_SUCCESS_ENABLE) {
            report(true);
        }
        context.reset();
    }
```

#### 6. 注册本地事务

在事务提交以前，会注册本地事务，调用的是`AbstractResourceManager`的`branchRegister`方法，向TC 发送请求：

TC中，负责注册分支的是`AbstractCore`的`branchRegister`方法，其中最重要的一步就是获取该分支事务的全局锁。

```java
    @Override
    public Long branchRegister(BranchType branchType, String resourceId, String clientId, String xid,
                               String applicationData, String lockKeys) throws TransactionException {
        // 1. 数据库中查询全局事务信息，=》global_table 表
        GlobalSession globalSession = assertGlobalSessionNotNull(xid, false);
        return SessionHolder.lockAndExecute(globalSession, () -> {
        	// 检查全局事务的状态是否正常
            globalSessionStatusCheck(globalSession);
            globalSession.addSessionLifecycleListener(SessionHolder.getRootSessionManager());
            // 创建分支事务信息
            BranchSession branchSession = SessionHelper.newBranchByGlobal(globalSession, branchType, resourceId,
                    applicationData, lockKeys, clientId);
            MDC.put(RootContext.MDC_KEY_BRANCH_ID, String.valueOf(branchSession.getBranchId()));
            // 校验全局锁
            branchSessionLock(globalSession, branchSession);
            try {
            	// 添加分支信息
                globalSession.addBranch(branchSession);
            } catch (RuntimeException ex) {
                branchSessionUnlock(branchSession);
                throw new BranchTransactionException(FailedToAddBranch, String
                        .format("Failed to store branch xid = %s branchId = %s", globalSession.getXid(),
                                branchSession.getBranchId()), ex);
            }
            // 返回分支事务ID 
            return branchSession.getBranchId();
        });
    }
```

在校验全局锁时，最终调用的是`LockStoreDataBaseDAO`的`acquireLock`方法，

```java
    @Override
    public boolean acquireLock(List<LockDO> lockDOs) {
        Connection conn = null;
        PreparedStatement ps = null;
        ResultSet rs = null;
        Set<String> dbExistedRowKeys = new HashSet<>();
        boolean originalAutoCommit = true;
        if (lockDOs.size() > 1) {
            lockDOs = lockDOs.stream().filter(LambdaUtils.distinctByKey(LockDO::getRowKey)).collect(Collectors.toList());
        }
        try {
            conn = lockStoreDataSource.getConnection();
            if (originalAutoCommit = conn.getAutoCommit()) {
                conn.setAutoCommit(false);
            }
            //check lock
            StringJoiner sj = new StringJoiner(",");
            for (int i = 0; i < lockDOs.size(); i++) {
                sj.add("?");
            }
            boolean canLock = true;
            //query 查询当前该记录在lock_table 表中的数据
            // select xid, transaction_id, branch_id, resource_id, table_name, pk, row_key, gmt_create, gmt_modified from lock_table where row_key in (?)
            String checkLockSQL = LockStoreSqlFactory.getLogStoreSql(dbType).getCheckLockableSql(lockTable, sj.toString());
            ps = conn.prepareStatement(checkLockSQL);
            for (int i = 0; i < lockDOs.size(); i++) {
                ps.setString(i + 1, lockDOs.get(i).getRowKey());
            }
            rs = ps.executeQuery();
            String currentXID = lockDOs.get(0).getXid();
            while (rs.next()) {
                String dbXID = rs.getString(ServerTableColumnsName.LOCK_TABLE_XID);
                // 如果查询当前这条记录全局事务xid  和当前的全局xid 不一致，说明改数据正在被其他全局事务修改
            	// 
                if (!StringUtils.equals(dbXID, currentXID)) {
                    if (LOGGER.isInfoEnabled()) {
                        String dbPk = rs.getString(ServerTableColumnsName.LOCK_TABLE_PK);
                        String dbTableName = rs.getString(ServerTableColumnsName.LOCK_TABLE_TABLE_NAME);
                        Long dbBranchId = rs.getLong(ServerTableColumnsName.LOCK_TABLE_BRANCH_ID);
                        // 打印日志 数据正在被其他全局事务占用
                        LOGGER.info("Global lock on [{}:{}] is holding by xid {} branchId {}", dbTableName, dbPk, dbXID,
                            dbBranchId);
                    }
                    canLock &= false;
                    break;
                }
                // 将数据库中已存在的锁 添加到Set 中
                dbExistedRowKeys.add(rs.getString(ServerTableColumnsName.LOCK_TABLE_ROW_KEY));
            }
			// 锁被占用，返回False
            if (!canLock) {
                conn.rollback();
                return false;
            }
            List<LockDO> unrepeatedLockDOs = null;
            // 数据库存在全局锁，且没有冲突时
            if (CollectionUtils.isNotEmpty(dbExistedRowKeys)) {
                unrepeatedLockDOs = lockDOs.stream().filter(lockDO -> !dbExistedRowKeys.contains(lockDO.getRowKey()))
                    .collect(Collectors.toList());
            } else {
            	// 数据库没有锁，就将事务中的锁，赋值给unrepeatedLockDOs 
                unrepeatedLockDOs = lockDOs;
            }
            // 数据库没有锁，分支事务也没有传递锁，则直接回滚
            if (CollectionUtils.isEmpty(unrepeatedLockDOs)) {
                conn.rollback();
                return true;
            }
            //lock
            // 
            if (unrepeatedLockDOs.size() == 1) {
            	// 锁
                LockDO lockDO = unrepeatedLockDOs.get(0);
                // doAcquireLock 会往doAcquireLock 中插入一条锁记录
                // 插入失败，报错Global lock acquire failed，并回滚
                if (!doAcquireLock(conn, lockDO)) {
                    if (LOGGER.isInfoEnabled()) {
                        LOGGER.info("Global lock acquire failed, xid {} branchId {} pk {}", lockDO.getXid(), lockDO.getBranchId(), lockDO.getPk());
                    }
                    conn.rollback();
                    return false;
                }
            } else {
            	// 多个锁，则循环插入多条锁记录
                if (!doAcquireLocks(conn, unrepeatedLockDOs)) {
                    if (LOGGER.isInfoEnabled()) {
                        LOGGER.info("Global lock batch acquire failed, xid {} branchId {} pks {}", unrepeatedLockDOs.get(0).getXid(),
                            unrepeatedLockDOs.get(0).getBranchId(), unrepeatedLockDOs.stream().map(lockDO -> lockDO.getPk()).collect(Collectors.toList()));
                    }
                    conn.rollback();
                    return false;
                }
            }
            // 提交事务，插入锁记录，返回成功
            conn.commit();
            return true;
        } catch (SQLException e) {
            throw new StoreException(e);
        } finally {
            IOUtil.close(rs, ps);
            if (conn != null) {
                try {
                    if (originalAutoCommit) {
                        conn.setAutoCommit(true);
                    }
                    conn.close();
                } catch (SQLException e) {
                }
            }
        }
    }
```

检验全局锁成功之后，会添加分支事务信息到数据库中，并返回分支事务ID 给客户端，客户端收到后，提交本地事务，此时该记录的全局锁还是被当前客户端占用。而本地锁随着事务的提交就已经释放了。
