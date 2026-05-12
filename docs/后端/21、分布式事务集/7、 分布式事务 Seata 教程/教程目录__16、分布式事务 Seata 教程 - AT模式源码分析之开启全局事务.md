# 16、分布式事务 Seata 教程 - AT模式源码分析之开启全局事务
- 来源：https://ddkk.com/zhuanlan/transaction/5/16.html
- 分类：分布式事务
- 分组：教程目录
### 开启全局事务

在之前，我们分析了`TransactionalTemplate`会进行全局事务的开启、提交或者回滚，接下来分析下，是如何开启全局事务的。

开始全局事务调用的是`beginTransaction`方法：

```java
private void beginTransaction(TransactionInfo txInfo, GlobalTransaction tx) throws TransactionalExecutor.ExecutionException {
    try {
        // 开启全局事务之前钩子
        triggerBeforeBegin();
        // 开始全局事务
        tx.begin(txInfo.getTimeOut(), txInfo.getName());
        // 开启全局事务之后钩子
        triggerAfterBegin();
    } catch (TransactionException txe) {
        throw new TransactionalExecutor.ExecutionException(tx, txe,
            TransactionalExecutor.Code.BeginFailure);
    }
}
```

#### 1. 事务钩子TransactionHook

在开始全局事务会调用`triggerBeforeBegin`和`triggerAfterBegin`方法，会从`ThreadLocal`中获取当前事务的`TransactionHook`事务钩子，执行其钩子方法：

```java
    private void triggerBeforeBegin() {
        for (TransactionHook hook : getCurrentHooks()) {
            try {
            	// 钩子中的beforeBegin
                hook.beforeBegin();
            } catch (Exception e) {
                LOGGER.error("Failed execute beforeBegin in hook {}", e.getMessage(), e);
            }
        }
    }
    private void triggerAfterBegin() {
        for (TransactionHook hook : getCurrentHooks()) {
            try {
            	// 钩子中的afterBegin
                hook.afterBegin();
            } catch (Exception e) {
                LOGGER.error("Failed execute afterBegin in hook {}", e.getMessage(), e);
            }
        }
    }
```

`TransactionHook` 接口就是事务钩子，可以在事务的各个状态中添加钩子，比如在事务回滚之后记录全局事务失败日志。

```java
public interface TransactionHook {
    /**
     * before tx begin
     */
    void beforeBegin();
    /**
     * after tx begin
     */
    void afterBegin();
    /**
     * before tx commit
     */
    void beforeCommit();
    /**
     * after tx commit
     */
    void afterCommit();
    /**
     * before tx rollback
     */
    void beforeRollback();
    /**
     * after tx rollback
     */
    void afterRollback();
    /**
     * after tx all Completed
     */
    void afterCompletion();
}
```

#### 2. 事务角色

`TransactionalTemplate.beginTransaction`方法传入了`TransactionInfo`和`GlobalTransaction`参数，`TransactionInfo`封装了`@GlobalTransactional`注解的配置信息，而`GlobalTransaction`就是全局事务。

在`GlobalTransaction`实例对象有，有一个全局事务角色枚举类，源码如下：

```java
public enum GlobalTransactionRole {
    /**
     * 发起者，开启全局事务
     */
    Launcher,
    /**
     * 参与者，加入已存在的全局事务
     */
    Participant
}
```

TM开启事务时，在线程中是没有`xid`的，所以会创建一个全局事务，直接创建一个`DefaultGlobalTransaction`对象：

```java
    /**
     * Try to create a new GlobalTransaction.
     *
     * @return the new global transaction
     */
    public static GlobalTransaction createNew() {
        return new DefaultGlobalTransaction();
    }
```

在`DefaultGlobalTransaction`的构造方法中，可以看到这里设置事务角色为`Launcher`

```java
    DefaultGlobalTransaction() {
        this(null, GlobalStatus.UnKnown, GlobalTransactionRole.Launcher);
    }
```

在`DefaultGlobalTransaction.begin`开始方法中，首先就会判断角色

```java
    @Override
    public void begin(int timeout, String name) throws TransactionException {
    	// 当前角色不是事务发起者
        if (role != GlobalTransactionRole.Launcher) {
        	// 不是发起者，判断xid 是否存在，不存在抛出IllegalStateException异常
        	// 存在xid ，直接return，说明只能TC 开启全局事务。
            assertXIDNotNull();
            if (LOGGER.isDebugEnabled()) {
                LOGGER.debug("Ignore Begin(): just involved in global transaction [{}]", xid);
            }
            return;
        }
		// 省略....
```

#### 3. 全局事务管理器

`DefaultGlobalTransaction.begin`校验角色之后，就会调用事务管理器开始全局事务，这里有一个xid 的生成及传递。

```java
		// 开始全局事务之前xid 必须为空
        assertXIDNull();
        String currentXid = RootContext.getXID();
        if (currentXid != null) {
            throw new IllegalStateException("Global transaction already exists," +
                " can't begin a new global transaction, currentXid = " + currentXid);
        }
        // 调用事务管理器开始全局事务
        xid = transactionManager.begin(null, null, name, timeout);
        // 标记事务状态为开始
        status = GlobalStatus.Begin;
        // 绑定xid 
        RootContext.bind(xid);
        if (LOGGER.isInfoEnabled()) {
            LOGGER.info("Begin new global transaction [{}]", xid);
        }
```

`TransactionManager`接口用于定义并控制全局事务，全局事务的开启、提交、回滚、状态报告，都由该接口完成，其默认实现类为`DefaultTransactionManager`。

所以开启事务，会进入到了`DefaultTransactionManager`的begin 方法，该方法会创建开始全局事务请求对象，请求Seata 服务端，并获取响应回来的xid :

```java
    @Override
    public String begin(String applicationId, String transactionServiceGroup, String name, int timeout)
        throws TransactionException {
        // 请求对象
        GlobalBeginRequest request = new GlobalBeginRequest();
        request.setTransactionName(name);
        request.setTimeout(timeout);
        // 请求并返回响应
        GlobalBeginResponse response = (GlobalBeginResponse) syncCall(request);
        if (response.getResultCode() == ResultCode.Failed) {
            throw new TmTransactionException(TransactionExceptionCode.BeginFailed, response.getMsg());
        }
        // 返回响应中的xid
        return response.getXid();
    }
```

`GlobalBeginRequest`对象中，只传递了事务超时时间和当前执行的方法名：

`GlobalBeginResponse`对象中，只返回了xid 和响应状态。

#### 4. RPC 请求TC 服务端

TM发送请求是基于Netty 框架，会获取TC 服务端地址，然后发送消息，具体源码就不分析了，内容太多。

```java
    private AbstractTransactionResponse syncCall(AbstractTransactionRequest request) throws TransactionException {
        try {
            return (AbstractTransactionResponse)TmNettyRemotingClient.getInstance().sendSyncRequest(request);
        } catch (TimeoutException var3) {
            throw new TmTransactionException(TransactionExceptionCode.IO, "RPC timeout", var3);
        }
    }
```

在Seata 服务端，开启、提交、回滚全局事务，注册、提交、回滚分支事务都是由`DefaultCoordinator（协调这）`负责协调处理的。

TC开始全局事务时，就会进入到`DefaultCoordinator`的`doGlobalBegin`方法：

```java
    @Override
    protected void doGlobalBegin(GlobalBeginRequest request, GlobalBeginResponse response, RpcContext rpcContext)
        throws TransactionException {
        // 调用DefaultCore的 begin方法
        response.setXid(core.begin(rpcContext.getApplicationId(), rpcContext.getTransactionServiceGroup(),
            request.getTransactionName(), request.getTimeout()));
            // 打印开始全局事务日志
        if (LOGGER.isInfoEnabled()) {
            LOGGER.info("Begin new global transaction applicationId: {},transactionServiceGroup: {}, transactionName: {},timeout:{},xid:{}",
                rpcContext.getApplicationId(), rpcContext.getTransactionServiceGroup(), request.getTransactionName(), request.getTimeout(), response.getXid());
        }
    }
```

在`DefaultCore`的 begin方法中，完成服务端整个开始全局事务的处理逻辑：

```java
    @Override
    public String begin(String applicationId, String transactionServiceGroup, String name, int timeout)
        throws TransactionException {
        // 1. 创建全局事务Session
        GlobalSession session = GlobalSession.createGlobalSession(applicationId, transactionServiceGroup, name,
            timeout);
            // 2. 将xid 绑定到日志Slf4j的MDC机制中，用于追踪全局日志
        MDC.put(RootContext.MDC_KEY_XID, session.getXid());
        //Session 中添加回调监听 ，Session 管理器（观察者模式）
 session.addSessionLifecycleListener(SessionHolder.getRootSessionManager());
		// 会话开启
        session.begin();
        // 事务开始事件
        eventBus.post(new GlobalTransactionEvent(session.getTransactionId(), GlobalTransactionEvent.ROLE_TC,
            session.getTransactionName(), applicationId, transactionServiceGroup, session.getBeginTime(), null, session.getStatus()));
		// 响应XID 给TM端
        return session.getXid();
    }
```

在创建全局会话的代码中，可以看到xid 是使用服务端IP+端口+雪花ID 方式生成的：

```java
    public GlobalSession(String applicationId, String transactionServiceGroup, String transactionName, int timeout) {
        this.transactionId = UUIDGenerator.generateUUID();
        this.status = GlobalStatus.Begin;
        this.applicationId = applicationId;
        this.transactionServiceGroup = transactionServiceGroup;
        this.transactionName = transactionName;
        this.timeout = timeout;
        this.xid = XID.generateXID(transactionId);
    }
```

#### 5. TC 服务端的事务会话管理器

服务端在开启全局事务时，会添加事务会话管理器，这里设置的是数据库存储，所以使用的是的`DataBaseSessionManager`：

Seata 支持三种事务会话存储，分别为数据库、文件、Redis:

之后begin 方法就到了`DataBaseSessionManager`的`addGlobalSession`方法：

```java
    @Override
    public void addGlobalSession(GlobalSession session) throws TransactionException {
        if (StringUtils.isBlank(taskName)) {
        // 写入会话
            boolean ret = transactionStoreManager.writeSession(LogOperation.GLOBAL_ADD, session);
            if (!ret) {
                throw new StoreException("addGlobalSession failed.");
            }
        } else {
            boolean ret = transactionStoreManager.writeSession(LogOperation.GLOBAL_UPDATE, session);
            if (!ret) {
                throw new StoreException("addGlobalSession failed.");
            }
        }
    }
```

#### 6. 存储全局事务信息

在第五步写入Session 时，会将全局事务信息插入到`global_table`表中，并将xid 返回给TC，整个开始事务的流程就结束了
