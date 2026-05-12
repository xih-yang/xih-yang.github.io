# 30、Spring源码分析 - 30-Spring编程式事物的设计与实现
- 来源：https://ddkk.com/zhuanlan/j2ee/spring/7/30.html
- 分类：J2EE框架
- 分组：教程目录
## 1、Spring事物处理的编程式使用

```java
TransactionDefinition td = new DefaultTransactionDefinition();
Transactionstatus status = transactionManager.getTransaction(td);
try {
   //这里是需要进行事务处理的方法调用
}catch (ApplicationException e){
   transactionManager.rollback(status);
   throw e;
}
transactionManager.commit(status);
```

在编程式使用事务处理的过程中,利用DefaultTransactionDefinition对象来持有事务处理属性。同时,在创建事务的过程中得到一个 TransactionStatus对象,然后通过直接调用transactionManager的commit和rollback方法来完成事务处理。在这个编程式使用事务管理的过程中,没有看到框架特性的使用,非常简单和直接,很好地说明了事务管理的基本实现过程,以及在Spring事务处理实现中涉及一些主要的类,比如TransactionStatus, TransactionManager等,

### 1.1、TransactionDefinition

TransactionDefinition中定义了Spring事物的传播行为、隔离级别、超时时间、是否为只读事物和事物名称的接口方法。

```java
public interface TransactionDefinition {
   //支持当前事务，如果当前没有事务，就新建一个事务。这是最常见的选择，也是Spring默认的事务的传播。
   int PROPAGATION_REQUIRED = 0;
   //支持当前事务，如果当前没有事务，就以非事务方式执行。
   int PROPAGATION_SUPPORTS = 1;
   //支持当前事务，如果当前没有事务，就抛出异常。
   int PROPAGATION_MANDATORY = 2;
   //新建事务，如果当前存在事务，把当前事务挂起。新建的事务将和被挂起的事务没有任何关系，是两个独立的事务，
   //外层事务失败回滚之后不能回滚内层事务执行的结果，内层事务失败抛出异常外层事务捕获，也可以不处理回滚操作
   int PROPAGATION_REQUIRES_NEW = 3;
   //以非事务方式执行操作，如果当前存在事务，就把当前事务挂起。
   int PROPAGATION_NOT_SUPPORTED = 4;
   //以非事务方式执行，如果当前存在事务，则抛出异常。
   int PROPAGATION_NEVER = 5;
   //如果一个活动的事务存在，则运行在一个嵌套的事务中。如果没有活动事务，则按REQUIRED属性执行。
   //它使用了一个单独的事务，这个事务拥有多个可以回滚的保存点。内部事务的回滚不会对外部事务造成影响。
   //它只对DataSourceTransactionManager事务管理器起效。
   int PROPAGATION_NESTED = 6;
   //这是个PlatfromTransactionManager默认的隔离级别，使用数据库默认的事务隔离级别。另外四个与 JDBC的隔离级别相对应。
   int ISOLATION_DEFAULT = -1;
   //脏读、不可重复读和幻象读可能发生。这个级别允许一个事务修改的行被另一个事务读取提交行中的任何更改之前的事务(“脏读”)。
   //如果回滚任何更改，则第二个事务将具有检索无效行。
   int ISOLATION_READ_UNCOMMITTED = Connection.TRANSACTION_READ_UNCOMMITTED;
   //可能发生不可重复读取和幻象读取。此级别仅禁止事务读取其它事物未提交的行。
   int ISOLATION_READ_COMMITTED = Connection.TRANSACTION_READ_COMMITTED;
   //指示防止脏读和不可重复读;可以发生幻象读。
   //这个级别禁止事务读取未提交更改的行，还禁止一个事务读取另一个事务更改行和第一个事务重新读取行第二次获取不同的值(“不可重复读取”)。
   int ISOLATION_REPEATABLE_READ = Connection.TRANSACTION_REPEATABLE_READ;
   //防止脏读、不可重复读和幻象读。这个级别包括ISOLATION_REPEATABLE_READ的禁忌和禁止下面这种的情况：
   //一个事务读取所有满足where条件行,第二个事务插入一行满足此where条件的行,
   //然后第一个事务使用相同的where条件读取,第二次读将会获得额外的“幻象”。
   int ISOLATION_SERIALIZABLE = Connection.TRANSACTION_SERIALIZABLE;
   //使用事务系统的默认超时，如果不支持超时，则为none。
   int TIMEOUT_DEFAULT = -1;
   //返回传播行为。必须返回此接口上定义的PROPAGATION_XXX常量之一。
   int getPropagationBehavior();
   //返回隔离级别。必须返回此接口上定义的ISOLATION_XXX常量之一。这些常量的设计目的是匹配 java.sql.Connection上相同常量的值。
   //专为使用PROPAGATION_REQUIRED或PROPAGATION_REQUIRES_NEW而设计，因为它只适用于新启动的事务。
   //如果您希望在使用不同的隔离级别参与现有事务时拒绝隔离级别声明，请考虑将事务管理器上的"validateExistingTransactions"标记切换为"true"。
   //注意，不支持自定义隔离级别的事务管理器在给定ISOLATION_DEFAULT以外的任何级别时都会抛出异常。
   int getIsolationLevel();
   //返回事务超时时间。必须返回若干秒，或TIMEOUT_DEFAULT。
   //专为使用PROPAGATION_REQUIRED或PROPAGATION_REQUIRES_NEW而设计，因为它只适用于新启动的事务。
   //注意，不支持超时的事务管理器在给出除TIMEOUT_DEFAULT之外的任何超时时将抛出异常。
   int getTimeout();
   //返回是否优化为只读事务。
   //只读标志适用于任何事务上下文，无论是受实际资源事务(PROPAGATION_REQUIRED/PROPAGATION_REQUIRES_NEW)支持的事务，
   //还是在资源级别上以非事务方式操作的事务(PROPAGATION_SUPPORTS)。在后一种情况下，标志将只应用于应用程序中的托管资源，例如Hibernate的Session。
   //这只是作为实际事务子系统的提示;它不一定会导致写访问尝试失败。
   //不能解释只读提示的事务管理器在请求只读事务时不会抛出异常。
   boolean isReadOnly();
   //返回此事务的名称。可以是。
   //如果可以的话，它将用作事务监视器中显示的事务名称(例如WebLogic的)。
   //对于Spring的声明式事务，公开的名称将是全限定类名+"."+方法名(默认)。
   @Nullable
   String getName();
}
```

DefaultTransactionDefinition是TransactionDefinition最基本的实现。TransactionAttribute此接口将rollbackOn规范添加到TransactionDefinition。由于自定义rollbackOn仅在AOP中可以使用，所以该类驻留在AOP事务包中。

```java
public interface TransactionAttribute extends TransactionDefinition {
   //返回与此事务属性关联的限定符值。这可以用于选择相应的事务管理器以处理此特定事务。
   @Nullable
   String getQualifier();
   //我们应该回滚给定的异常吗?
   boolean rollbackOn(Throwable ex);
}
```

### 1.2、TransactionStatus

事务状态的表示。事务代码可以使用它检索状态信息，并以编程方式请求回滚(而不是抛出导致隐式回滚的异常)。扩展SavepointManager接口，以提供对保存点管理工具的访问。注意，只有在底层事务管理器支持时，保存点管理才可用。

```java
public interface SavepointManager {
   //创建一个新的保存点。您可以通过rollbackToSavepoint()回滚到特定的保存点，并通过releaseSavepoint()显式地释放不再需要的保存点。
   //请注意，大多数事务管理器将在事务完成时自动释放保存点。
   Object createSavepoint() throws TransactionException;
   //回滚到给定的保存点。保存点之后不会自动释放。您可以显式调用releaseSavepoint()或依赖于事务完成时的自动释放。
   void rollbackToSavepoint(Object savepoint) throws TransactionException;
   //显式释放给定的保存点。请注意，大多数事务管理器将在事务完成时自动释放保存点。
   //如果最终会在事务完成时进行适当的资源清理，则实现应该尽可能悄无声息地失败。
   void releaseSavepoint(Object savepoint) throws TransactionException;
}
```

```java
public interface TransactionStatus extends SavepointManager, Flushable {
   //返回当前事务是否为新事务;否则将参与现有事务，或者可能首先不在实际事务中运行。
   boolean isNewTransaction();
   //返回此事务内部是否带有保存点，即是否已基于保存点创建嵌套事务。
   //此方法主要用于诊断目的，与isNewTransaction()一起使用。对于定制保存点的编程处理，使用SavepointManager提供的操作。
   boolean hasSavepoint();
   //设置事务只回滚属性。这将指示事务管理器，事务的唯一可能结果可能是回滚，作为抛出异常的替代方法，而异常反过来又会触发回滚。
   //这主要用于由TransactionTemplate或TransactionInterceptor管理的事务，其中实际的提交/回滚决策是由容器做出的。
   void setRollbackOnly();
   //是否是只回滚
   boolean isRollbackOnly();
   //如果适用，将底层会话刷新到数据存储:例如，所有受影响的Hibernate/JPA会话。
   //这实际上只是一个提示，如果底层事务管理器没有刷新概念，那么这可能是一个no-op。刷新信号可以应用于主资源或事务同步，取决于底层资源。
   @Override
   void flush();
   //返回该事务是否已完成，即它是否已被提交或回滚。
   boolean isCompleted();
}
```

### 1.3、PlatformTransactionManager

这是Spring事务基础结构中的中心接口。应用程序可以直接使用它，但它主要不是指API:通常，应用程序将通过TransactionTemplate或AOP声明性事务使用。对于实现类，建议从提供的AbstractPlatformTransactionManager类派生，该类预先实现了定义的传播行为，并负责事务同步处理。子类必须为底层事务的特定状态实现模板方法，例如:begin、suspend、resume、commit。这个策略接口的默认实现是JtaTransactionManager和DataSourceTransactionManager，它可以作为其他事务策略的实现指南。

```java
public interface PlatformTransactionManager {
   //根据指定的传播行为，返回当前活动的事务或创建一个新事务。请注意，隔离级别或超时等参数只应用于新事务，因此在参与活动事务时将被忽略。
   //此外，并非每个事务管理器都支持所有事务定义设置:当遇到不受支持的设置时，适当的事务管理器实现应该抛出异常。
   //上述规则的一个例外是只读标志，如果不支持显式只读模式，则应忽略该标志。从本质上说，只读标志只是潜在优化的一个提示。
   TransactionStatus getTransaction(@Nullable TransactionDefinition definition) throws TransactionException;
   //根据给定事务的状态提交该事务。如果事务仅以编程方式标记回滚，则执行回滚。
   //如果事务不是一个新事务，则忽略提交，以便适当地参与周围的事务。
   //如果前一个事务已经挂起，以便能够创建一个新事务，那么在提交新事务之后恢复前一个事务。
   //注意，当提交调用完成时，无论是否正常或抛出异常，事务都必须完全完成并清理。在这种情况下，不应该期望回滚调用。
   //如果该方法抛出的异常不是TransactionException，那么提交前的一些错误会导致提交尝试失败。
   //例如，O/R映射工具可能在提交之前尝试刷新对数据库的更改，结果导致DataAccessException导致事务失败。
   //在这种情况下，原始异常将传播到此提交方法的调用方。
   void commit(TransactionStatus status) throws TransactionException;
   //执行给定事务的回滚。如果事务不是新事务，只需将其回滚设置为仅用于适当参与周围事务。
   //如果前一个事务已经挂起，以便能够创建一个新事务，那么在回滚新事务之后恢复前一个事务。
   //如果提交引发异常，不要调用事务回滚。当提交返回时，事务将已经完成并被清理，即使在提交异常的情况下也是如此。
   //因此，提交失败后的回滚调用将导致llegalTransactionStateException。
   void rollback(TransactionStatus status) throws TransactionException;
}
```

## 2、事物的创建

事物管理器的getTransaction()方法返回当前活动的事务或创建一个新事务，这个创建Transaction事务对象的过程,在AbstractPlatformTransactionManager实现中需要对事务的情况做出不同的处理,然后,创建一个TransactionStatus,从而完成事务的创建过程。

```java
@Override
public final TransactionStatus getTransaction(@Nullable TransactionDefinition definition) throws TransactionException {
   //这个doGettransaction()是抽象函数, Transaction对象的取得由具体的事务处理器实现,比如DataSourceTransactionManager
   Object transaction = doGetTransaction();
   // Cache debug flag to avoid repeated checks.
   boolean debugEnabled = logger.isDebugEnabled();
   if (definition == null) {
      // Use defaults if no transaction definition given.
      definition = new DefaultTransactionDefinition();
   }
   //检查当前线程是否巳经存在事务,如果已经存在事务,那么需要根据在事务属性中定义的事务传播属性配置来处理事务的产生
   if (isExistingTransaction(transaction)) {
      //如果当前线程存在事物，封装TransactionStatus 
      return handleExistingTransaction(definition, transaction, debugEnabled);
   }
   // Check definition settings for new transaction.
   if (definition.getTimeout() < TransactionDefinition.TIMEOUT_DEFAULT) {
      throw new InvalidTimeoutException("Invalid transaction timeout", definition.getTimeout());
   }
   //当前没有事务存在,这时需要根据事务属性设置来创建事务
   //这里会看到对事务传播属性设置的处理,比如 mandatory、required, required_new、nested等
   //这里的处理对理解这些属性的使用是非常有帮助的
   if (definition.getPropagationBehavior() == TransactionDefinition.PROPAGATION_MANDATORY) {
      throw new IllegalTransactionStateException(
            "No existing transaction found for transaction marked with propagation 'mandatory'");
   }
   else if (definition.getPropagationBehavior() == TransactionDefinition.PROPAGATION_REQUIRED ||
         definition.getPropagationBehavior() == TransactionDefinition.PROPAGATION_REQUIRES_NEW ||
         definition.getPropagationBehavior() == TransactionDefinition.PROPAGATION_NESTED) {
      SuspendedResourcesHolder suspendedResources = suspend(null);
      if (debugEnabled) {
         logger.debug("Creating new transaction with name [" + definition.getName() + "]: " + definition);
      }
      try {
         boolean newSynchronization = (getTransactionSynchronization() != SYNCHRONIZATION_NEVER);
         DefaultTransactionStatus status = newTransactionStatus(
               definition, transaction, true, newSynchronization, debugEnabled, suspendedResources);
         //这里是创建事务的调用,由具体的事务处理器来完成,比如DataSourceTransactionManager等
         doBegin(transaction, definition);
         //初始化事物同步状态
         prepareSynchronization(status, definition);
         return status;
      }
      catch (RuntimeException | Error ex) {
         resume(null, suspendedResources);
         throw ex;
      }
   }
   else {
      // Create "empty" transaction: no actual transaction, but potentially synchronization.
      if (definition.getIsolationLevel() != TransactionDefinition.ISOLATION_DEFAULT && logger.isWarnEnabled()) {
         logger.warn("Custom isolation level specified but no actual transaction initiated; " +
               "isolation level will effectively be ignored: " + definition);
      }
      boolean newSynchronization = (getTransactionSynchronization() == SYNCHRONIZATION_ALWAYS);
      return prepareTransactionStatus(definition, null, true, newSynchronization, debugEnabled, null);
   }
}
```

从代码中可以看到AbstractTransactionManager提供的创建事务的实现模板,在这个模板的基础上,具体的事务处理器需要定义自己的实现来完成底层的事务创建工作,比如需要实现isExistingTransaction和doBegin方法。关于这些由具体事务处理器实现的方法会在下面结合具体的事务处理器实现比如DataSourceTransactionManager进行分析。事务创建的结果是生成一个TransactionStatus对象保存在ThreadLocal对象里,这样当前线程可以通过ThreadLocal对象取得TransactionStatus对象,从而把事务的处理信息与调用事务方法的当前线程绑定起来。在 AbstractPlatformTransactionManager创建事务的过程中,可以看到 TransactionStatus的创建过程所示。

```java
protected DefaultTransactionStatus newTransactionStatus(
      TransactionDefinition definition, @Nullable Object transaction, boolean newTransaction,
      boolean newSynchronization, boolean debug, @Nullable Object suspendedResources) {
   boolean actualNewSynchronization = newSynchronization &&
         !TransactionSynchronizationManager.isSynchronizationActive();
   return new DefaultTransactionStatus(
         transaction, newTransaction, actualNewSynchronization,
         definition.isReadOnly(), debug, suspendedResources);
}
```

TransactionSynchronizationManager中有很多与线程有关ThreadLocal用来保存当前线程需要的事物属性属性。isSynchronizationActive()方法是判断synchronizations属性是否有Set，这个属性会在prepareSynchronization()方法中也就是一个事物对象创建后被赋值。

```java
protected void prepareSynchronization(DefaultTransactionStatus status, TransactionDefinition definition) {
   if (status.isNewSynchronization()) {
      TransactionSynchronizationManager.setActualTransactionActive(status.hasTransaction());
      TransactionSynchronizationManager.setCurrentTransactionIsolationLevel(
            definition.getIsolationLevel() != TransactionDefinition.ISOLATION_DEFAULT ?
                  definition.getIsolationLevel() : null);
      TransactionSynchronizationManager.setCurrentTransactionReadOnly(definition.isReadOnly());
      TransactionSynchronizationManager.setCurrentTransactionName(definition.getName());
      TransactionSynchronizationManager.initSynchronization();
   }
}
public static void initSynchronization() throws IllegalStateException {
   if (isSynchronizationActive()) {
      throw new IllegalStateException("Cannot activate transaction synchronization - already active");
   }
   logger.trace("Initializing transaction synchronization");
   synchronizations.set(new LinkedHashSet<>());
}
```

新事务的创建是比较好理解的,这里需要根据事务属性配置进行创建。所谓创建,首先是把创建工作交给具体的事务处理器来完成,比如DataSourceTransactionManager,把创建的事务对象在TransactionStatus中保存下来,然后将其他的事务属性和线程ThreadLocal变量进行绑定。

相对于创建全新事务的另一种情况是:在创建当前事务时,线程中已经有事务存在了。

这种情况同样需要处理,在声明式事务处理中,在当前线程调用事务方法的时候,就会考虑事务的创建处理,这个处理在方法handleExistingTransaction中完成的。这里对现有事务的处理,会涉及事务传播属性的具体处理,比如PROPAGATION_NOT_SUPPORTED、PROPAGATION_REQUIRES_NEW等。

```java
private TransactionStatus handleExistingTransaction(
      TransactionDefinition definition, Object transaction, boolean debugEnabled)
      throws TransactionException {
   //如果当前线程巳有事务存在,且当前事务的传播属性设置是never那么抛出异常,说明这种情况是有问题的,Spring无法处理当前的事务创建
   if (definition.getPropagationBehavior() == TransactionDefinition.PROPAGATION_NEVER) {
      throw new IllegalTransactionStateException(
            "Existing transaction found for transaction marked with propagation 'never'");
   }
   //如果当前事务的配置属性是PROPAGATION_NOT_SUPPORTED,同时当前线程已经存在事务了,那么将事务挂起
   if (definition.getPropagationBehavior() == TransactionDefinition.PROPAGATION_NOT_SUPPORTED) {
      if (debugEnabled) {
         logger.debug("Suspending current transaction");
      }
      Object suspendedResources = suspend(transaction);
      boolean newSynchronization = (getTransactionSynchronization() == SYNCHRONIZATION_ALWAYS);
      //注意这里的参数, transaction为nu11, newTransaction为false意味着事务方法不需要放在事务环境中执行
      //同时挂起事务的信息记录也保存在TransactionStatus中,这里包括了进程 Threadlocal对事务信息的记录
      return prepareTransactionStatus(
            definition, null, false, newSynchronization, debugEnabled, suspendedResources);
   }
   //如果当前事务的配置属性是PROPAGATION_REQUIRES_NEW,创建新事务同时把当前线程中存在的事务挂起
   //与创建全新事务的过程类似,区别在于在创建全新事务时不用考虑已有事务的挂起,但在这里需要考虑已有事务的挂起处理
   if (definition.getPropagationBehavior() == TransactionDefinition.PROPAGATION_REQUIRES_NEW) {
      if (debugEnabled) {
         logger.debug("Suspending current transaction, creating new transaction with name [" +
               definition.getName() + "]");
      }
      SuspendedResourcesHolder suspendedResources = suspend(transaction);
      try {
         //挂起事务的信息记录保存在TransactionStatus中,这里包括了进程Threadlocal对事务信息的记录
         boolean newSynchronization = (getTransactionSynchronization() != SYNCHRONIZATION_NEVER);
         DefaultTransactionStatus status = newTransactionStatus(
               definition, transaction, true, newSynchronization, debugEnabled, suspendedResources);
         //PROPAGATION_REQUIRES_NEW需要事物管理器新开启一个事物
         doBegin(transaction, definition);
         prepareSynchronization(status, definition);
         return status;
      }
      catch (RuntimeException | Error beginEx) {
         resumeAfterBeginException(transaction, suspendedResources, beginEx);
         throw beginEx;
      }
   }
   //嵌套事物的创建
   if (definition.getPropagationBehavior() == TransactionDefinition.PROPAGATION_NESTED) {
      if (!isNestedTransactionAllowed()) {
         throw new NestedTransactionNotSupportedException(
               "Transaction manager does not allow nested transactions by default - " +
               "specify 'nestedTransactionAllowed' property with value 'true'");
      }
      if (debugEnabled) {
         logger.debug("Creating nested transaction with name [" + definition.getName() + "]");
      }
      //默认true
      if (useSavepointForNestedTransaction()) {
         //通过TransactionStatus实现的SavepointManager API，在现有spring管理的事务中创建保存点。
         //通常使用JDBC3.0保存点。永远不要激活Spring同步。
         DefaultTransactionStatus status =
               prepareTransactionStatus(definition, transaction, false, false, debugEnabled, null);
         status.createAndHoldSavepoint();
         return status;
      }
      else {
         // Nested transaction through nested begin and commit/rollback calls.
         // Usually only for JTA: Spring synchronization might get activated here
         // in case of a pre-existing JTA transaction.
         boolean newSynchronization = (getTransactionSynchronization() != SYNCHRONIZATION_NEVER);
         DefaultTransactionStatus status = newTransactionStatus(
               definition, transaction, true, newSynchronization, debugEnabled, null);
         doBegin(transaction, definition);
         prepareSynchronization(status, definition);
         return status;
      }
   }
   // Assumably PROPAGATION_SUPPORTS or PROPAGATION_REQUIRED.
   if (debugEnabled) {
      logger.debug("Participating in existing transaction");
   }
   //这里判断在当前事务方法中的属性配置与已有事务的属性配置是否一致,如果不一致,
   //那么不执行事务方法并抛出异常
   if (isValidateExistingTransaction()) {
      if (definition.getIsolationLevel() != TransactionDefinition.ISOLATION_DEFAULT) {
         Integer currentIsolationLevel = TransactionSynchronizationManager.getCurrentTransactionIsolationLevel();
         if (currentIsolationLevel == null || currentIsolationLevel != definition.getIsolationLevel()) {
            Constants isoConstants = DefaultTransactionDefinition.constants;
            throw new IllegalTransactionStateException("Participating transaction with definition [" +
                  definition + "] specifies isolation level which is incompatible with existing transaction: " +
                  (currentIsolationLevel != null ?
                        isoConstants.toCode(currentIsolationLevel, DefaultTransactionDefinition.PREFIX_ISOLATION) :
                        "(unknown)"));
         }
      }
      if (!definition.isReadOnly()) {
         if (TransactionSynchronizationManager.isCurrentTransactionReadOnly()) {
            throw new IllegalTransactionStateException("Participating transaction with definition [" +
                  definition + "] is not marked as read-only but existing transaction is");
         }
      }
   }
   //PROPAGATION_REQUIRED 参与到现有事物中
   boolean newSynchronization = (getTransactionSynchronization() != SYNCHRONIZATION_NEVER);
   return prepareTransactionStatus(definition, transaction, false, newSynchronization, debugEnabled, null);
}
```

## 3、事物的挂起

事务的挂起牵涉线程与事务处理信息的保存。

```java
//返回的SuspendedResourcesHolder会作为参数传给TransactionStastus
@Nullable
protected final SuspendedResourcesHolder suspend(@Nullable Object transaction) throws TransactionException {
   //如果当前线程已经开启了事物同步，将事物挂起
   if (TransactionSynchronizationManager.isSynchronizationActive()) {
      //挂起当前线程的所有当前事务同步并停用
      List<TransactionSynchronization> suspendedSynchronizations = doSuspendSynchronization();
      try {
         Object suspendedResources = null;
         if (transaction != null) {
            //暂停当前事务的资源，具体的事物管理器实现
            //默认实现抛出一个TransactionSuspensionNotSupportedException，假设通常不支持事务挂起。
            suspendedResources = doSuspend(transaction);
         }
         String name = TransactionSynchronizationManager.getCurrentTransactionName();
         TransactionSynchronizationManager.setCurrentTransactionName(null);
         boolean readOnly = TransactionSynchronizationManager.isCurrentTransactionReadOnly();
         TransactionSynchronizationManager.setCurrentTransactionReadOnly(false);
         Integer isolationLevel = TransactionSynchronizationManager.getCurrentTransactionIsolationLevel();
         TransactionSynchronizationManager.setCurrentTransactionIsolationLevel(null);
         boolean wasActive = TransactionSynchronizationManager.isActualTransactionActive();
         TransactionSynchronizationManager.setActualTransactionActive(false);
         return new SuspendedResourcesHolder(
               suspendedResources, suspendedSynchronizations, name, readOnly, isolationLevel, wasActive);
      }
      catch (RuntimeException | Error ex) {
         //dosuspend()方法失败,而初始的事务依然存在
         doResumeSynchronization(suspendedSynchronizations);
         throw ex;
      }
   }
   else if (transaction != null) {
      // Transaction active but no synchronization active.
      Object suspendedResources = doSuspend(transaction);
      return new SuspendedResourcesHolder(suspendedResources);
   }
   else {
      // Neither transaction nor synchronization active.
      return null;
   }
}
private List<TransactionSynchronization> doSuspendSynchronization() {
   List<TransactionSynchronization> suspendedSynchronizations =
         TransactionSynchronizationManager.getSynchronizations();
   for (TransactionSynchronization synchronization : suspendedSynchronizations) {
      //不同事物管理器有着不同TransactionSynchronization实现，后面看
      synchronization.suspend();
   }
   TransactionSynchronizationManager.clearSynchronization();
   return suspendedSynchronizations;
}
```

## 4、事物的恢复

恢复给定的事务。首先委托给doResume()模板方法，然后恢复事务同步。

```java
protected final void resume(@Nullable Object transaction, @Nullable SuspendedResourcesHolder resourcesHolder)
      throws TransactionException {
   if (resourcesHolder != null) {
      Object suspendedResources = resourcesHolder.suspendedResources;
      if (suspendedResources != null) {
         doResume(transaction, suspendedResources);
      }
      List<TransactionSynchronization> suspendedSynchronizations = resourcesHolder.suspendedSynchronizations;
      if (suspendedSynchronizations != null) {
         TransactionSynchronizationManager.setActualTransactionActive(resourcesHolder.wasActive);
         TransactionSynchronizationManager.setCurrentTransactionIsolationLevel(resourcesHolder.isolationLevel);
         TransactionSynchronizationManager.setCurrentTransactionReadOnly(resourcesHolder.readOnly);
         TransactionSynchronizationManager.setCurrentTransactionName(resourcesHolder.name);
         doResumeSynchronization(suspendedSynchronizations);
      }
   }
}
```

## 5、事物的提交

与前面分析事务的创建过程一样,我们需要到事务处理器中去看看事务是如何提交的同样,在AbstractPlatformTransactionManager中也有一个模板方法支持具体的事务处理器对事务提交的实现,在AbstractPlatformTransactionManager中,这个模板方法的实现与前面我们看到的 getTransaction很类似。

```java
@Override
public final void commit(TransactionStatus status) throws TransactionException {
   if (status.isCompleted()) {
      throw new IllegalTransactionStateException(
            "Transaction is already completed - do not call commit or rollback more than once per transaction");
   }
   DefaultTransactionStatus defStatus = (DefaultTransactionStatus) status;
   //事物只支持回滚
   if (defStatus.isLocalRollbackOnly()) {
      if (defStatus.isDebug()) {
         logger.debug("Transactional code has requested rollback");
      }
      processRollback(defStatus, false);
      return;
   }
   //shouldCommitOnGlobalRollbackOnly()默认为false
   //如果事务对象实现SmartTransactionObject接口，则通过检查事务对象来确定只回滚标志。
   //如果全局事务本身仅由事务协调器标记回滚，则返回true，例如在超时的情况下。
   if (!shouldCommitOnGlobalRollbackOnly() && defStatus.isGlobalRollbackOnly()) {
      if (defStatus.isDebug()) {
         logger.debug("Global transaction is marked as rollback-only but transactional code requested commit");
      }
      processRollback(defStatus, true);
      return;
   }
   //处理提交
   processCommit(defStatus);
}
```

```java
//处理实际提交。在调用之前已经检查并应用了仅回滚标志。
private void processCommit(DefaultTransactionStatus status) throws TransactionException {
   try {
      boolean beforeCompletionInvoked = false;
      try {
         //事务提交的准备工作由具体的事务处理器来完成
         boolean unexpectedRollback = false;
         prepareForCommit(status);
         triggerBeforeCommit(status);
         triggerBeforeCompletion(status);
         beforeCompletionInvoked = true;
         //嵌套事物处理
         if (status.hasSavepoint()) {
            if (status.isDebug()) {
               logger.debug("Releasing transaction savepoint");
            }
            unexpectedRollback = status.isGlobalRollbackOnly();
            status.releaseHeldSavepoint();
         }
         //下面对根据当前线程中保存的事务状态进行处理,如果当前的事务是一个新事务,调用具体事务处理器的完成提交,
         //如果当前所持有的事务不是一个新事务,则不提交,由已经存在的事务来完成提交
         else if (status.isNewTransaction()) {
            if (status.isDebug()) {
               logger.debug("Initiating transaction commit");
            }
            unexpectedRollback = status.isGlobalRollbackOnly();
            //具体事物提交由具体事物管理器完成
            doCommit(status);
         }
         else if (isFailEarlyOnGlobalRollbackOnly()) {
            unexpectedRollback = status.isGlobalRollbackOnly();
         }
         // Throw UnexpectedRollbackException if we have a global rollback-only
         // marker but still didn't get a corresponding exception from commit.
         if (unexpectedRollback) {
            throw new UnexpectedRollbackException(
                  "Transaction silently rolled back because it has been marked as rollback-only");
         }
      }
      catch (UnexpectedRollbackException ex) {
         // can only be caused by doCommit
         triggerAfterCompletion(status, TransactionSynchronization.STATUS_ROLLED_BACK);
         throw ex;
      }
      catch (TransactionException ex) {
         // can only be caused by doCommit
         if (isRollbackOnCommitFailure()) {
            doRollbackOnCommitException(status, ex);
         }
         else {
            triggerAfterCompletion(status, TransactionSynchronization.STATUS_UNKNOWN);
         }
         throw ex;
      }
      catch (RuntimeException | Error ex) {
         if (!beforeCompletionInvoked) {
            triggerBeforeCompletion(status);
         }
         doRollbackOnCommitException(status, ex);
         throw ex;
      }
      //触发器afterCommit回调，其中抛出的异常传播给调用者，但事务仍被视为已提交。
      try {
         triggerAfterCommit(status);
      }
      finally {
         triggerAfterCompletion(status, TransactionSynchronization.STATUS_COMMITTED);
      }
   }
   finally {
      //在完成之后进行清理，如果需要，清除同步，并在完成之后调用docleanup。
      cleanupAfterCompletion(status);
   }
}
```

可以看到,事务提交的准备都是由具体的事务处理器来实现的。当然,对这些事务提交的处理,需要通过对TransactionStatus保存的事务处理的相关状态进行判断。提交过程涉及AbstractPlatformTransactionManager中的doCommit和prepareForCommit方法,它们都是抽象方法,都在具体的事务处理器中完成实现,在下面对具体事务处理器的实现原理的分析中,可以看到对这些实现方法的具体分析。

## 6、事物的回滚

```java
@Override
public final void rollback(TransactionStatus status) throws TransactionException {
   if (status.isCompleted()) {
      throw new IllegalTransactionStateException(
            "Transaction is already completed - do not call commit or rollback more than once per transaction");
   }
   DefaultTransactionStatus defStatus = (DefaultTransactionStatus) status;
   processRollback(defStatus, false);
}
private void processRollback(DefaultTransactionStatus status, boolean unexpected) {
   try {
      boolean unexpectedRollback = unexpected;
      try {
         triggerBeforeCompletion(status);
         //嵌套事物的回滚处理
         if (status.hasSavepoint()) {
            if (status.isDebug()) {
               logger.debug("Rolling back transaction to savepoint");
            }
            status.rollbackToHeldSavepoint();
         }
         //当前事务调用方法中新建事务的回滚处理
         else if (status.isNewTransaction()) {
            if (status.isDebug()) {
               logger.debug("Initiating transaction rollback");
            }
            doRollback(status);
         }
         else {
            //如果在当前事务调用方法中没有新建事务的回滾处理
            if (status.hasTransaction()) {
               if (status.isLocalRollbackOnly() || isGlobalRollbackOnParticipationFailure()) {
                  if (status.isDebug()) {
                     logger.debug("Participating transaction failed - marking existing transaction as rollback-only");
                  }
                  doSetRollbackOnly(status);
               }
               //由线程中的前一个事务来处理回滚,这里不执行任何操作
               else {
                  if (status.isDebug()) {
                     logger.debug("Participating transaction failed - letting transaction originator decide on rollback");
                  }
               }
            }
            else {
               logger.debug("Should roll back transaction but cannot - no transaction available");
            }
            // Unexpected rollback only matters here if we're asked to fail early
            if (!isFailEarlyOnGlobalRollbackOnly()) {
               unexpectedRollback = false;
            }
         }
      }
      catch (RuntimeException | Error ex) {
         triggerAfterCompletion(status, TransactionSynchronization.STATUS_UNKNOWN);
         throw ex;
      }
      triggerAfterCompletion(status, TransactionSynchronization.STATUS_ROLLED_BACK);
      // Raise UnexpectedRollbackException if we had a global rollback-only marker
      if (unexpectedRollback) {
         throw new UnexpectedRollbackException(
               "Transaction rolled back because it has been marked as rollback-only");
      }
   }
   finally {
      cleanupAfterCompletion(status);
   }
}
```

## 7、DataSourceTransactionManager的实现

在DataSourceTransactionManager中,在事务开始的时候,会调用doBegin()方法,首先会得到相对应的Connection,然后可以根据事务设置的需要,对Connection的相关属性进行配置,比如将Connection的autoCommit()功能关闭,并对像TimeoutInSeconds这样的事务处理参数进行设置,最后通过TransactionSynchronizationManager来对资源进行绑定。

```java
//这里是产生Transaction的地方,为Transaction的创楚提供服务
//对数据库而言,事务工作是由Connection来完成的。这里把数据库的Connection对象放到一个ConnectionHolder中,
//然后封装到一个DataSourceTransactionobject对象中,在这个封装过程中增加了许多为事务处理服务的控制数据
@Override
protected Object doGetTransaction() {
   DataSourceTransactionObject txObject = new DataSourceTransactionObject();
   txObject.setSavepointAllowed(isNestedTransactionAllowed());
   //获取与当前线程绑定的数据库Connection,这个Connection在第一个事务开始的地方与线程绑定
   ConnectionHolder conHolder = (ConnectionHolder) TransactionSynchronizationManager.getResource(obtainDataSource());
   txObject.setConnectionHolder(conHolder, false);
   return txObject;
}
```

```java
//这里是判断是否已经存在事务的地方,由ConnectionHolder的isTransactionActive属性来控制
@Override
protected boolean isExistingTransaction(Object transaction) {
   DataSourceTransactionObject txObject = (DataSourceTransactionObject) transaction;
   //transactionActive的设置在doBegin()方法中
   return (txObject.hasConnectionHolder() && txObject.getConnectionHolder().isTransactionActive());
}
```

```java
@Override
protected void doBegin(Object transaction, TransactionDefinition definition) {
   DataSourceTransactionObject txObject = (DataSourceTransactionObject) transaction;
   Connection con = null;
   try {
      if (!txObject.hasConnectionHolder() ||
            txObject.getConnectionHolder().isSynchronizedWithTransaction()) {
         //新事物第一次获取数据库连接
         Connection newCon = obtainDataSource().getConnection();
         if (logger.isDebugEnabled()) {
            logger.debug("Acquired Connection [" + newCon + "] for JDBC transaction");
         }
         txObject.setConnectionHolder(new ConnectionHolder(newCon), true);
      }
      txObject.getConnectionHolder().setSynchronizedWithTransaction(true);
      con = txObject.getConnectionHolder().getConnection();
      //使用TransactionDefinition设置Connection的readonly和IsolationLevel，并返回Connection原有的隔离级别
      Integer previousIsolationLevel = DataSourceUtils.prepareConnectionForTransaction(con, definition);
      txObject.setPreviousIsolationLevel(previousIsolationLevel);
      // Switch to manual commit if necessary. This is very expensive in some JDBC drivers,
      // so we don't want to do it unnecessarily (for example if we've explicitly
      // configured the connection pool to set it already).
      //事物必须是非自动提交的才能自己控制
      if (con.getAutoCommit()) {
         txObject.setMustRestoreAutoCommit(true);
         if (logger.isDebugEnabled()) {
            logger.debug("Switching JDBC Connection [" + con + "] to manual commit");
         }
         //事物开始
         con.setAutoCommit(false);
      }
      prepareTransactionalConnection(con, definition);
      txObject.getConnectionHolder().setTransactionActive(true);
      int timeout = determineTimeout(definition);
      if (timeout != TransactionDefinition.TIMEOUT_DEFAULT) {
         txObject.getConnectionHolder().setTimeoutInSeconds(timeout);
      }
      // Bind the connection holder to the thread.
      if (txObject.isNewConnectionHolder()) {
         TransactionSynchronizationManager.bindResource(obtainDataSource(), txObject.getConnectionHolder());
      }
   }
   catch (Throwable ex) {
      if (txObject.isNewConnectionHolder()) {
         DataSourceUtils.releaseConnection(con, obtainDataSource());
         txObject.setConnectionHolder(null, false);
      }
      throw new CannotCreateTransactionException("Could not open JDBC Connection for transaction", ex);
   }
}
//只读事物的设置
protected void prepareTransactionalConnection(Connection con, TransactionDefinition definition)
      throws SQLException {
   if (isEnforceReadOnly() && definition.isReadOnly()) {
      Statement stmt = con.createStatement();
      try {
​​​​​​         stmt.executeUpdate("SET TRANSACTION READ ONLY");
      }
      finally {
         stmt.close();
      }
   }
}
```

```java
//挂起
@Override
protected Object doSuspend(Object transaction) {
   DataSourceTransactionObject txObject = (DataSourceTransactionObject) transaction;
   txObject.setConnectionHolder(null);
   return TransactionSynchronizationManager.unbindResource(obtainDataSource());
}
```

```java
//恢复挂起的资源到当前状态
@Override
protected void doResume(@Nullable Object transaction, Object suspendedResources) {
   TransactionSynchronizationManager.bindResource(obtainDataSource(), suspendedResources);
}
```

```java
@Override
protected void doCommit(DefaultTransactionStatus status) {
   DataSourceTransactionObject txObject = (DataSourceTransactionObject) status.getTransaction();
   //取得Connection然后提交数据库事物
   Connection con = txObject.getConnectionHolder().getConnection();
   if (status.isDebug()) {
      logger.debug("Committing JDBC transaction on Connection [" + con + "]");
   }
   try {
      con.commit();
   }
   catch (SQLException ex) {
      throw new TransactionSystemException("Could not commit JDBC transaction", ex);
   }
}
```

```java
//回滚数据库事物
@Override
protected void doRollback(DefaultTransactionStatus status) {
   DataSourceTransactionObject txObject = (DataSourceTransactionObject) status.getTransaction();
   Connection con = txObject.getConnectionHolder().getConnection();
   if (status.isDebug()) {
      logger.debug("Rolling back JDBC transaction on Connection [" + con + "]");
   }
   try {
      con.rollback();
   }
   catch (SQLException ex) {
      throw new TransactionSystemException("Could not roll back JDBC transaction", ex);
   }
}
```

```java
//事物完成（提交或回滚）的清理工作
@Override
protected void doCleanupAfterCompletion(Object transaction) {
   DataSourceTransactionObject txObject = (DataSourceTransactionObject) transaction;
   // Remove the connection holder from the thread, if exposed.
   if (txObject.isNewConnectionHolder()) {
      TransactionSynchronizationManager.unbindResource(obtainDataSource());
   }
   // Reset connection.
   Connection con = txObject.getConnectionHolder().getConnection();
   try {
      if (txObject.isMustRestoreAutoCommit()) {
         con.setAutoCommit(true);
      }
      DataSourceUtils.resetConnectionAfterTransaction(con, txObject.getPreviousIsolationLevel());
   }
   catch (Throwable ex) {
      logger.debug("Could not reset JDBC Connection after transaction", ex);
   }
   if (txObject.isNewConnectionHolder()) {
      if (logger.isDebugEnabled()) {
         logger.debug("Releasing JDBC Connection [" + con + "] after transaction");
      }
      DataSourceUtils.releaseConnection(con, this.dataSource);
   }
   txObject.getConnectionHolder().clear();
}
```

我们可以看到, DataSourceTransactionManager作为AbstractPlatformTransactionManager的子类,在AbstractPlatformTransactionManager中已经为事务实现设计好了一系列的模板方法,比如事务提交、回滚处理等。在DataSourceTransactionManager中,可以看到对模板方法中一些抽象方法的具体实现。例如,由DataSourceTransactionManager的 doBegin方法实现负责事务的创建工作。具体来说,如果使用DataSource创建事务,最终通过设置 Connection的AutoCommit属性来对事务处理进行配置。在实现过程中,需要把数据库的Connection和当前的线程进行绑定。对于事务的提交和回滚,都是通过直接调用 Connection的提交和回滚来完成的,在这个实现过程中如何取得事务处理场景中的 Connection对象,也是一个值得注意的地方。

## 8、TransactionTemplate手动提交事物

简化编程事务界定和事务异常处理的模板类。中心方法是execute()，支持实现TransactionCallback接口的事务代码，这样就可以避免文章开头的样板代码只需要使用execute()方法就好。这个模板处理事务生命周期和可能的异常，这样TransactionCallback实现和调用代码都不需要显式地处理事务。

典型用法:允许编写低级数据访问对象，这些对象使用JDBC数据源等资源，但本身不支持事务。相反，它们可以隐式地参与由使用该类的高级应用程序服务处理的事务，通过内部类回调对象调用低级服务。

可以通过事务管理器引用的直接实例化在服务实现中使用，也可以在应用程序上下文中准备，并作为bean引用传递给服务。注意:事务管理器应该始终在应用程序上下文中配置为bean:在第一种情况下直接提供给服务，在第二种情况下提供给准备好的模板。支持按名称设置传播行为和隔离级别，以便在上下文定义中进行方便的配置。

TransactionTemplate本身继承DefaultTransactionDefinition，可以直接用来配置事物属性，当然也可以接受外部传来的TransactionDefinition。

```java
public class TransactionTemplate extends DefaultTransactionDefinition
      implements TransactionOperations, InitializingBean {
   /** Logger available to subclasses. */
   protected final Log logger = LogFactory.getLog(getClass());
   @Nullable
   private PlatformTransactionManager transactionManager;
   /**
    * Construct a new TransactionTemplate for bean usage.
    * <p>Note: The PlatformTransactionManager needs to be set before
    * any {@code execute} calls.
    * @seesetTransactionManager
    */
   public TransactionTemplate() {
   }
   /**
    * Construct a new TransactionTemplate using the given transaction manager.
    * @param transactionManager the transaction management strategy to be used
    */
   public TransactionTemplate(PlatformTransactionManager transactionManager) {
      this.transactionManager = transactionManager;
   }
   /**
    * Construct a new TransactionTemplate using the given transaction manager,
    * taking its default settings from the given transaction definition.
    * @param transactionManager the transaction management strategy to be used
    * @param transactionDefinition the transaction definition to copy the
    * default settings from. Local properties can still be set to change values.
    */
   public TransactionTemplate(PlatformTransactionManager transactionManager, TransactionDefinition transactionDefinition) {
      super(transactionDefinition);
      this.transactionManager = transactionManager;
   }
   /**
    * Set the transaction management strategy to be used.
    */
   public void setTransactionManager(@Nullable PlatformTransactionManager transactionManager) {
      this.transactionManager = transactionManager;
   }
   /**
    * Return the transaction management strategy to be used.
    */
   @Nullable
   public PlatformTransactionManager getTransactionManager() {
      return this.transactionManager;
   }
   @Override
   public void afterPropertiesSet() {
      if (this.transactionManager == null) {
         throw new IllegalArgumentException("Property 'transactionManager' is required");
      }
   }
   @Override
   @Nullable
   public <T> T execute(TransactionCallback<T> action) throws TransactionException {
      Assert.state(this.transactionManager != null, "No PlatformTransactionManager set");
      if (this.transactionManager instanceof CallbackPreferringPlatformTransactionManager) {
         return ((CallbackPreferringPlatformTransactionManager) this.transactionManager).execute(this, action);
      }
      else {
         TransactionStatus status = this.transactionManager.getTransaction(this);
         T result;
         try {
            result = action.doInTransaction(status);
         }
         catch (RuntimeException | Error ex) {
            // Transactional code threw application exception -> rollback
            rollbackOnException(status, ex);
            throw ex;
         }
         catch (Throwable ex) {
            // Transactional code threw unexpected exception -> rollback
            rollbackOnException(status, ex);
            throw new UndeclaredThrowableException(ex, "TransactionCallback threw undeclared checked exception");
         }
         this.transactionManager.commit(status);
         return result;
      }
   }
   /**
    * Perform a rollback, handling rollback exceptions properly.
    * @param status object representing the transaction
    * @param ex the thrown application exception or error
    * @throws TransactionException in case of a rollback error
    */
   private void rollbackOnException(TransactionStatus status, Throwable ex) throws TransactionException {
      Assert.state(this.transactionManager != null, "No PlatformTransactionManager set");
      logger.debug("Initiating transaction rollback on application exception", ex);
      try {
         this.transactionManager.rollback(status);
      }
      catch (TransactionSystemException ex2) {
         logger.error("Application exception overridden by rollback exception", ex);
         ex2.initApplicationException(ex);
         throw ex2;
      }
      catch (RuntimeException | Error ex2) {
         logger.error("Application exception overridden by rollback exception", ex);
         throw ex2;
      }
   }
   @Override
   public boolean equals(Object other) {
      return (this == other || (super.equals(other) && (!(other instanceof TransactionTemplate) ||
            getTransactionManager() == ((TransactionTemplate) other).getTransactionManager())));
   }
}
```
