# 21、分布式事务 Seata 教程 - @GlobalLock注解使用场景及源码分析
- 来源：https://ddkk.com/zhuanlan/transaction/5/21.html
- 分类：分布式事务
- 分组：教程目录
### 前言

在Seata 中提供了一个全局锁注解`@GlobalLock`，字面意思是全局锁，搜索相关文档，发现资料很少，所以分析下它的应用场景和基本原理，首先看下源码中对该注解的说明：

```java
// 声明事务仅在单个本地RM中执行
// 但事务需要确保要更新（或选择更新）的记录不在全局事务中
// 在上述情况下，使用此注解而不是@GlobalTransaction将有助于提高性能。
// @see io.seata.spring.annotation.GlobalTransactionScanner#wrapIfNecessary(Object, String, Object)用于TM、GlobalLock和TCC模式的扫描器
// @see io.seata.spring.annotation.GlobalTransactionalInterceptor#handleGlobalLock(MethodInvocation)@GlobalLock的拦截器
// @see io.seata.spring.annotation.datasource.SeataAutoDataSourceProxyAdvice#invoke(MethodInvocation) GlobalLockLogic和AT/XA模式的拦截器
@Retention(RetentionPolicy.RUNTIME)
@Target({
     ElementType.METHOD,ElementType.TYPE})
@Inherited
public @interface GlobalLock {
    /**
     * 自定义全局锁重试间隔（单位：毫秒）
     * 您可以使用它覆盖“client.rm.lock.retryInterval”的全局配置，默认10
     * 注意：0或负数将不起作用（这意味着返回到全局配置）
     */
    int lockRetryInternal() default 0;
    /**
     * 自定义全局锁重试次数
     * 您可以使用它覆盖“client.rm.lock.retryTimes”的全局配置，默认30
     * 注：负数无效（这意味着返回全局配置
     */
    int lockRetryTimes() default -1;
}
```

**源码注释大概意思**：对于某条数据进行更新操作，如果全局事务正在进行，当某个本地事务需要更新该数据时，需要使用`@GlobalLock`确保其不会对全局事务正在操作的数据进行修改。

### 问题场景

我们参考下图，搭建一个测试案例：

#### 1. 编写代码

首先编写一个全局事务，调用订单服务下订单，扣除余额-1。

```java
    @GlobalTransactional(rollbackFor = Throwable.class, timeoutMills = 300000)
    public void test() throws InterruptedException {
        log.info("Assign Service Begin ... xid: " + RootContext.getXID() + "\n");
        //1.创建账户 扣款
        AccountTbl accountTbl = accountTblMapper.selectById(11111111);
        AccountTbl accountTbl1 = accountTbl.setMoney(accountTbl.getMoney() - 1);
        accountTblMapper.updateById(accountTbl1);
        //2.创建订单
        orderClint.insert(accountTbl.getUserId() + "", "iphone11", 1 + "");
        // 休眠5秒
        TimeUnit.SECONDS.sleep(5);
        int i = 5 / 0;
         //模拟异常
    }
```

在编写一个本地`@Transactional`事务，直接扣除余额-1。

```java
    @GetMapping("/GlobalLock")
    @Transactional
    public Object GlobalLock() {
        AccountTbl accountTbl = accountTblMapper.selectById(11111111);
        AccountTbl accountTbl1 = accountTbl.setMoney(accountTbl.getMoney()-1);
        accountTblMapper.updateById(accountTbl1);
        return "成功执行！！！";
    }
```

#### 2. 测试

数据库修改余额为100 元，然后测试全局事务接口，发现异常时能正常全局回滚。

在执行全局事务的过程中，调用`GlobalLock`接口，修改数据，因为全局事务接口中休眠了5秒，所以需要在访问全局接口打印全局事务日志后，快速访问`GlobalLock`接口。

这个时候会发现，全局事务第二阶段回滚失败，并一直在重试：

**原因分析**： 因为在全局事务执行的过程中，一阶段会直接提交本地事务，其他本地事务可直接修改该数据，所以会导致全局事务二阶段回滚时，发现数据被修改过，认为数据已经脏了，回滚失败。

#### 3. 解决方案

**解决方案**：

- 手动处理：锁表，然后直接将数据修改为正常状态，但是这种比较麻烦，需要梳理脏数据的原因，也影响业务实际运行
- 提前预防：使用@GlobalLock，在执行本地事务时，去获取该数据的全局锁，如果获取不到，说明该数据正在被全局事务执行，可以进行重试获取。

在本地修改事务上加上`@GlobalLock`，配置重试间隔为100ms，次数为100次，说明在10S内会不断重试获取全局锁，如果该记录在全局事务中，则会失败：

```java
    @GlobalLock(lockRetryInternal = 100, lockRetryTimes = 100)
    @GetMapping("/GlobalLock")
    @Transactional
    public Object GlobalLock() {
        AccountTbl accountTbl = accountTblMapper.selectById(11111111);
        AccountTbl accountTbl1 = accountTbl.setMoney(accountTbl.getMoney() - 1);
        accountTblMapper.updateById(accountTbl1);
        return "成功执行！！！";
    }
```

#### 4. 注意事项

在使用`@GlobalLock`注解的时候，我们需要更新之前，在查询方法中添加排它锁，比如根据ID 查询时，需要如下SQL 书写：

```java
    <select id="selectById" parameterType="integer" resultType="com.hnmqet.demo01.entity.AccountTbl">
        SELECT id,user_id,money FROM account_tbl WHERE id=#{id} FOR UPDATE
    </select>
```

这是因为，只有添加了 `FOR UPDATE`，Seata 才会进行创建重试的执行器，这样事务失败时，会释放本地锁，等待一定时间再重试。如果不添加，则会一直占有本地锁，全局事务回滚需要本地锁，则全局事务就只能等`@GlobalLock`事务超时失败才能拿到本地锁释放全局锁，造成`@GlobalLock`永远获取不到全局锁。

### 源码分析

#### 1. 进入拦截器

之前分析过`GlobalTransactionScanner`（全局事务扫描器）会扫描`@GlobalLock`、`@GlobalTransactional`注解标识的方法，并为其添加`GlobalTransactionalInterceptor`（全局事务拦截器）。

所以`@GlobalLock`标注的方法执行时，会进入到`GlobalTransactionalInterceptor`的`invoke`方法，获取`@GlobalLock`注解，然后进入到`handleGlobalLock`方法处理。

`handleGlobalLock`方法会创建一个`GlobalLockExecutor`匿名内部类，然后调用`GlobalLockTemplate` 的`execute`方法：

```java
    Object handleGlobalLock(final MethodInvocation methodInvocation, final GlobalLock globalLockAnno) throws Throwable {
        return this.globalLockTemplate.execute(new GlobalLockExecutor() {
            public Object execute() throws Throwable {
                return methodInvocation.proceed();
            }
            public GlobalLockConfig getGlobalLockConfig() {
            	// 获取@GlobalLock 注解上的配置
                GlobalLockConfig config = new GlobalLockConfig();
                config.setLockRetryInternal(globalLockAnno.lockRetryInternal());
                config.setLockRetryTimes(globalLockAnno.lockRetryTimes());
                return config;
            }
        });
    }
```

`GlobalLockTemplate`模板类只有一个方法，处理逻辑也很简单，就是将注解配置塞入线程中，结束后清理：

```java
    public Object execute(GlobalLockExecutor executor) throws Throwable {
        boolean alreadyInGlobalLock = RootContext.requireGlobalLock();
        if (!alreadyInGlobalLock) {
            RootContext.bindGlobalLockFlag();
        }
        // 将注解配置塞入ThreadLocal中
        GlobalLockConfig myConfig = executor.getGlobalLockConfig();
        GlobalLockConfig previousConfig = GlobalLockConfigHolder.setAndReturnPrevious(myConfig);
        try {
        	// 调用内部类的执行方法执行业务逻辑
            return executor.execute();
        } finally {
            //仅当这是根调用者时解除绑定。
			//否则，外部调用方将丢失全局锁标志
            if (!alreadyInGlobalLock) {
                RootContext.unbindGlobalLockFlag();
            }
            //如果前面的配置不是空的，我们需要将其设置回原来的配置
			//这样外部逻辑仍然可以使用它们的配置
            if (previousConfig != null) {
                GlobalLockConfigHolder.setAndReturnPrevious(previousConfig);
            } else {
                GlobalLockConfigHolder.remove();
            }
        }
    }
```

#### 2. 进入数据源代理

在执行业务逻辑时，因为配置了数据源代理，SQL 操作都会进入到代理数据源中，大概流程为`PreparedStatementProxy.execute`=>`ExecuteTemplate.execute`=>`Executor.executor`。

因为我们根据ID 查询数据时加了 `FOR UPDATE`（排它锁），所以执行器为`SelectForUpdateExecutor`，在这个执行方法中，就会进行全局锁的获取，这个时候会遇到以下几种情况：

- 获取到全局锁，则正常执行，因为加了排它锁，其他事务都会被隔离，得等待当前事务执行完成
- 被全局事务占有全局锁和排它锁，则会等待全局一阶段事务提交释放本地锁，GlobalLock获取到本地锁后，等待全局事务提交，释放全局锁后，再执行，
- 如果全局失败，回滚时需要排它锁，这个时候，GlobalLock因为没有获取到全局锁抛出异常，会在异常中进行事务回滚，休眠一定时间，这个时候会让出排它锁，全局获取到排它锁后再进行全局回滚成功释放全局锁，GlobalLock在重试过程中，获取到全局锁，则成功执行，做到了很好的事务隔离性。

```java
    @Override
    public T doExecute(Object... args) throws Throwable {
    	// 1. 获取数据库连接
        Connection conn = statementProxy.getConnection();
        // 2. 获取数据库元数据
        DatabaseMetaData dbmd = conn.getMetaData();
        T rs;
        Savepoint sp = null;
        boolean originalAutoCommit = conn.getAutoCommit();
        try {
            if (originalAutoCommit) {
                /*
                 * 为了在全局锁检查期间保持本地数据库锁
                 * 如果原始自动提交为true，则首先将自动提交值设置为false
                 */
                conn.setAutoCommit(false);
            } else if (dbmd.supportsSavepoints()) {
                /*
                 * 为了在全局锁冲突时释放本地数据库锁
                 * 如果原始自动提交为false，则创建一个保存点，然后使用此处的保存点释放db
                 * 如有必要，在全局锁定检查期间锁定
                 */
                sp = conn.setSavepoint();
            } else {
                throw new SQLException("not support savepoint. please check your db version");
            }
			// 3. 创建一个锁重试控制器
            LockRetryController lockRetryController = new LockRetryController();
            ArrayList<List<Object>> paramAppenderList = new ArrayList<>();
            // 4. SELECT id FROM account_tbl WHERE id = ? FOR UPDATE
            // 
            String selectPKSQL = buildSelectSQL(paramAppenderList);
            while (true) {
                try {
                    //870
                    // 
                    rs = statementCallback.execute(statementProxy.getTargetStatement(), args);
                    // 尝试获取选定行的全局锁
                    // 获取主键列及值
                    TableRecords selectPKRows = buildTableRecords(getTableMeta(), selectPKSQL, paramAppenderList);
                    // 构建全局锁Key :account_tbl:11111111
                    String lockKeys = buildLockKey(selectPKRows);
                    if (StringUtils.isNullOrEmpty(lockKeys)) {
                        break;
                    }
                    if (RootContext.inGlobalTransaction() || RootContext.requireGlobalLock()) {
                        // 在@GlobalTransactional或@GlobalLock下做同样的事情
                        // 这里只检查全局锁
                        statementProxy.getConnectionProxy().checkLock(lockKeys);
                    } else {
                        throw new RuntimeException("Unknown situation!");
                    }
                    break;
                } catch (LockConflictException lce) {
                	// 如锁被占用，会抛出锁冲突异常 ：LockConflictException
                	// 直接回滚，释放本地锁
                    if (sp != null) {
                        conn.rollback(sp);
                    } else {
                        conn.rollback();
                    }
                    // 触发重试，线程睡眠设置的时间，超过重试此时，则会抛出LockWaitTimeoutException 异常
                    lockRetryController.sleep(lce);
                }
            }
        } finally {
            if (sp != null) {
                try {
                    if (!JdbcConstants.ORACLE.equalsIgnoreCase(getDbType())) {
                        conn.releaseSavepoint(sp);
                    }
                } catch (SQLException e) {
                    LOGGER.error("{} release save point error.", getDbType(), e);
                }
            }
            if (originalAutoCommit) {
                conn.setAutoCommit(true);
            }
        }
        return rs;
    }
```

#### 3. 更新数据

在通过`FOR UPDATE` 查询到数据后，再更新当前数据，因为查询和修改在一个`@Transactional`方法里，所以他们是一个事务，在查询的时候添加了排它锁，并且获取到了全局锁，才会执行到更新方法。

`FOR UPDATE` 获取到全局锁后，进入到业务的更新操作，这里和一阶段执行本地事务完全一致，之前分析过，就不赘述了。
