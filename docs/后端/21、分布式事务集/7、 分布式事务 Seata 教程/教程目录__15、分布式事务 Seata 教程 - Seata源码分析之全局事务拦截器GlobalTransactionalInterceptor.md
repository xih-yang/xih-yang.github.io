# 15、分布式事务 Seata 教程 - Seata源码分析之全局事务拦截器GlobalTransactionalInterceptor
- 来源：https://ddkk.com/zhuanlan/transaction/5/15.html
- 分类：分布式事务
- 分组：教程目录
### 全局事务拦截器

#### 前言

在上篇文档，我们分析了全局事务扫描器会为使用了分布式事务注解的Bean 添加拦截器，接下来我们分析下全局事务拦截器`GlobalTransactionalInterceptor`是如何进行拦截的？

#### 方法代理拦截

`GlobalTransactionalInterceptor` 实现了`MethodInterceptor`接口，`MethodInterceptor`是AOP中的拦截器，它拦截的目标是方法，实现该接口可以对需要增强的方法进行增强，扫描器扫描到标注了`@GlobalTransaction`的方法，就会添加这个AOP，所以执行目标方法时，实际是进入了拦截器的`invoke`方法。

在`invoke`方法中，会获取当前执行方法上的注解信息，然后开启全局事务：

```java
    @Override
    public Object invoke(final MethodInvocation methodInvocation) throws Throwable {
    	// 目标的Class 类型
        Class<?> targetClass =
            methodInvocation.getThis() != null ? AopUtils.getTargetClass(methodInvocation.getThis()) : null;
        // 目标的执行方法
        Method specificMethod = ClassUtils.getMostSpecificMethod(methodInvocation.getMethod(), targetClass);
        if (specificMethod != null && !specificMethod.getDeclaringClass().equals(Object.class)) {
            final Method method = BridgeMethodResolver.findBridgedMethod(specificMethod);
            // 获取@GlobalTransactional注解
            final GlobalTransactional globalTransactionalAnnotation =
                getAnnotation(method, targetClass, GlobalTransactional.class);
            // 获取@GlobalLock 注解
            final GlobalLock globalLockAnnotation = getAnnotation(method, targetClass, GlobalLock.class);
            boolean localDisable = disable || (degradeCheck && degradeNum >= degradeCheckAllowTimes);
            if (!localDisable) {
                if (globalTransactionalAnnotation != null) {
                // 执行@GlobalTransactional全局事务
                    return handleGlobalTransaction(methodInvocation, globalTransactionalAnnotation);
                } else if (globalLockAnnotation != null) {
                // 执行@GlobalLock事务
                    return handleGlobalLock(methodInvocation, globalLockAnnotation);
                }
            }
        }
		// 没有注解，直接执行
        return methodInvocation.proceed();
    }
```

#### 事务执行器

在使用了`@GlobalTransactional`注解时，会进入到`handleGlobalTransaction`方法中，该方法首先会创建一个事务执行器，然后使用事务处理模板类，进入`execute`方法执行。

`TransactionalExecutor` 事务执行器接口，提供了两个方法，具体说明如下：

```java
public interface TransactionalExecutor {
    /**
     * 执行实际业务逻辑
     */
    Object execute() throws Throwable;
    /**
     * 获取事务配置或其他属性
     */
    TransactionInfo getTransactionInfo();
}
```

在`TransactionalExecutor`声明了一个内部枚举，用于标记事务异常时的状态：

```java
    public static enum Code {
    	// 开始失败
        BeginFailure,
        // 提交失败
        CommitFailure,
        // 回滚失败
        RollbackFailure,
        //  回滚完成
        RollbackDone,
        // 报告失败
        ReportFailure,
        // 回滚重试中
        RollbackRetrying;
    }
```

`handleGlobalTransaction`方法中，直接使用内部类创建了一个`TransactionalExecutor`实例，代码如下：

```java
new TransactionalExecutor() {
				// 执行业务逻辑
                @Override
                public Object execute() throws Throwable {
                    return methodInvocation.proceed();
                }
				// 自定义或者格式化生成事务的名称
                public String name() {
                    String name = globalTrxAnno.name();
                    if (!StringUtils.isNullOrEmpty(name)) {
                        return name;
                    }
                    return formatMethod(methodInvocation.getMethod());
                }
				// 将注解封装为成TransactionInfo对象
                @Override
                public TransactionInfo getTransactionInfo() {
                    // reset the value of timeout
                    // 超时时间
                    int timeout = globalTrxAnno.timeoutMills();
                    if (timeout <= 0 || timeout == DEFAULT_GLOBAL_TRANSACTION_TIMEOUT) {
                        timeout = defaultGlobalTransactionTimeout;
                    }
                    TransactionInfo transactionInfo = new TransactionInfo();
                    transactionInfo.setTimeOut(timeout);
                    // 事务名=》test()
                    transactionInfo.setName(name());
                    // 传播行为=》REQUIRED
                    transactionInfo.setPropagation(globalTrxAnno.propagation());
                    transactionInfo.setLockRetryInternal(globalTrxAnno.lockRetryInternal());
                    transactionInfo.setLockRetryTimes(globalTrxAnno.lockRetryTimes());
                    // 回滚规则
                    Set<RollbackRule> rollbackRules = new LinkedHashSet<>();
                    for (Class<?> rbRule : globalTrxAnno.rollbackFor()) {
                        rollbackRules.add(new RollbackRule(rbRule));
                    }
                    for (String rbRule : globalTrxAnno.rollbackForClassName()) {
                        rollbackRules.add(new RollbackRule(rbRule));
                    }
                    for (Class<?> rbRule : globalTrxAnno.noRollbackFor()) {
                        rollbackRules.add(new NoRollbackRule(rbRule));
                    }
                    for (String rbRule : globalTrxAnno.noRollbackForClassName()) {
                        rollbackRules.add(new NoRollbackRule(rbRule));
                    }
                    transactionInfo.setRollbackRules(rollbackRules);
                    return transactionInfo;
                }
            });
```

最终当前`TransactionalExecutor`实例，包含的事务信息如下图所示：

#### 事务模板处理类

`TransactionalExecutor`实例创建后，它包含了当前事务注解的信息和被代理执行的方法，接着就会调用执行模板`TransactionalTemplate`的`execute`方法，该方法是执行全局事务的核心方法，其中包含了AT模式下，两个阶段处理逻辑：

```java
    public Object execute(TransactionalExecutor business) throws Throwable {
    	// 注解信息
        TransactionInfo txInfo = business.getTransactionInfo();
        if (txInfo == null) {
            throw new ShouldNeverHappenException("transactionInfo does not exist");
        } else {
        	// 1. 从RootContext中获取xid，没有则返回NULL,
        	// 这里是全局事务发起方，所有没有，直接返回NULL
        	// 如果是被调用方，则会存在传递过来的xid,使用xid创建GlobalTransaction 对象
            GlobalTransaction tx = GlobalTransactionContext.getCurrent();
            // 2. 事务传播行为，默认为REQUIRED
            // REQUIRED：如果本来有事务，则加入该事务，如果没有事务，则创建新的事务
            Propagation propagation = txInfo.getPropagation();
            SuspendedResourcesHolder suspendedResourcesHolder = null;
            Object ex;
            try {
                Object var6;
                // 3. 根据不同的传播行为，执行不同的逻辑
                switch(propagation) {
                case NOT_SUPPORTED:
                    if (this.existingTransaction(tx)) {
                        suspendedResourcesHolder = tx.suspend();
                    }
                    var6 = business.execute();
                    return var6;
                case REQUIRES_NEW:
                    if (this.existingTransaction(tx)) {
                        suspendedResourcesHolder = tx.suspend();
                        tx = GlobalTransactionContext.createNew();
                    }
                    break;
                case SUPPORTS:
                    if (this.notExistingTransaction(tx)) {
                        var6 = business.execute();
                        return var6;
                    }
                case REQUIRED:
                    break;
                case NEVER:
                    if (this.existingTransaction(tx)) {
                        throw new TransactionException(String.format("Existing transaction found for transaction marked with propagation 'never', xid = %s", tx.getXid()));
                    }
                    var6 = business.execute();
                    return var6;
                case MANDATORY:
                    if (this.notExistingTransaction(tx)) {
                        throw new TransactionException("No existing transaction found for transaction marked with propagation 'mandatory'");
                    }
                    break;
                default:
                    throw new TransactionException("Not Supported Propagation:" + propagation);
                }
				// 4. 不存在全局事务信息，创建一个
                if (tx == null) {
                    tx = GlobalTransactionContext.createNew();
                }
                GlobalLockConfig previousConfig = this.replaceGlobalLockConfig(txInfo);
				// 5. 执行全局事务
                try {
                	// 5.1 开启全局事务
                    this.beginTransaction(txInfo, tx);
                    Object rs;
                    try {
                    	// 5.2 执行业务逻辑
                        rs = business.execute();
                    } catch (Throwable var17) {
                        ex = var17;
                        // 5.3 发生异常全局回滚
                        this.completeTransactionAfterThrowing(txInfo, tx, var17);
                        throw var17;
                    }
					// 5.4 没有异常，提交全局事务
                    this.commitTransaction(tx);
                    ex = rs;
                } finally {
                	// 释放资源
                    this.resumeGlobalLockConfig(previousConfig);
                    this.triggerAfterCompletion();
                    this.cleanUp();
                }
            } finally {
                if (suspendedResourcesHolder != null) {
                    tx.resume(suspendedResourcesHolder);
                }
            }
            return ex;
        }
    }
```

#### 全局事务

`GlobalTransaction`就是Seata 中的全局事务，默认实现类为`DefaultGlobalTransaction`，实现了其开始、提交、回滚等方法。

```java
public interface GlobalTransaction {
    /**
     * Begin a new global transaction with default timeout and name.
     *
     * @throws TransactionException Any exception that fails this will be wrapped with TransactionException and thrown
     * out.
     */
    void begin() throws TransactionException;
    /**
     * Begin a new global transaction with given timeout and default name.
     *
     * @param timeout Global transaction timeout in MILLISECONDS
     * @throws TransactionException Any exception that fails this will be wrapped with TransactionException and thrown
     * out.
     */
    void begin(int timeout) throws TransactionException;
    /**
     * Begin a new global transaction with given timeout and given name.
     *
     * @param timeout Given timeout in MILLISECONDS.
     * @param name    Given name.
     * @throws TransactionException Any exception that fails this will be wrapped with TransactionException and thrown
     * out.
     */
    void begin(int timeout, String name) throws TransactionException;
    /**
     * Commit the global transaction.
     *
     * @throws TransactionException Any exception that fails this will be wrapped with TransactionException and thrown
     * out.
     */
    void commit() throws TransactionException;
    /**
     * Rollback the global transaction.
     *
     * @throws TransactionException Any exception that fails this will be wrapped with TransactionException and thrown
     * out.
     */
    void rollback() throws TransactionException;
    /**
     * Suspend the global transaction.
     *
     * @return the SuspendedResourcesHolder which holds the suspend resources
     * @throws TransactionException Any exception that fails this will be wrapped with TransactionException and thrown
     * @see SuspendedResourcesHolder
     */
    SuspendedResourcesHolder suspend() throws TransactionException;
    /**
     * Resume the global transaction.
     *
     * @param suspendedResourcesHolder the suspended resources to resume
     * @throws TransactionException Any exception that fails this will be wrapped with TransactionException and thrown
     * out.
     * @see SuspendedResourcesHolder
     */
    void resume(SuspendedResourcesHolder suspendedResourcesHolder) throws TransactionException;
    /**
     * Ask TC for current status of the corresponding global transaction.
     *
     * @return Status of the corresponding global transaction.
     * @throws TransactionException Any exception that fails this will be wrapped with TransactionException and thrown
     * out.
     * @see GlobalStatus
     */
    GlobalStatus getStatus() throws TransactionException;
    /**
     * Get XID.
     *
     * @return XID. xid
     */
    String getXid();
    /**
     * report the global transaction status.
     *
     * @param globalStatus global status.
     *
     * @throws TransactionException Any exception that fails this will be wrapped with TransactionException and thrown
     * out.
     */
    void globalReport(GlobalStatus globalStatus) throws TransactionException;
    /**
     * local status of the global transaction.
     *
     * @return Status of the corresponding global transaction.
     * @see GlobalStatus
     */
    GlobalStatus getLocalStatus();
    /**
     * get global transaction role.
     *
     * @return global transaction Role.
     * @see GlobalTransactionRole
     */
    GlobalTransactionRole getGlobalTransactionRole();
}
```

#### 总结

**1、**`GlobalTransactionalInterceptor`使用AOP对添加了事务注解的方法进行代理执行；

**2、** 创建事务执行器`TransactionalExecutor`，实际封装了被代理的业务逻辑执行对象和注解信息；

**3、** 调用`TransactionalTemplate`，进行分布式事务的两个阶段执行，发生异常回滚，无异常全局提交；
