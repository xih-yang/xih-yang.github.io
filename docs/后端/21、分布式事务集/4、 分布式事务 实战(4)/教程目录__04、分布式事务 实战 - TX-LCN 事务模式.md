# 04、分布式事务 实战 - TX-LCN 事务模式
- 来源：https://ddkk.com/zhuanlan/transaction/4/4.html
- 分类：分布式事务
- 分组：教程目录
- Tx-LCN 5.0 开始支持三种事务模式，分别是：LCN、TCC、TXC 模式。
- 每种模式在实际使用时有着自己对应的注解。

```java
LCN：@LcnTransaction 
TCC：@TccTransaction 
TXC：@TxcTransaction
```

### 1.LCN 模式

#### 1.1 原理介绍

- LCN 模式是通过代理 JDBC 中 Connection 的方式实现对本地事务的操作，然后在由TxManager 统一协调控制事务。当本地事务提交回滚或者关闭连接时将会执行假操作，该代 理的连接将由 LCN 连接池管理

#### 1.2 模式特点

- 该模式对代码的嵌入性低。
- 该模式仅限于本地存在连接对象且可通过连接对象控制事务的模块。
- 该模式下的事务提交与回滚是由本地事务方控制，对于数据一致性上有较高的保障
- 该模式缺陷在于代理的连接需要随事务发起方一同释放连接，增加了连接占用的时间
- **总结：LCN 模式适合能用 JDBC 连接的所有支持事务的数据库**

### 2.TCC 事务模式

#### 2.1 原理介绍

- TCC 事务机制相对于传统事务机制（X/Open XA Two-Phase-Commit），其特征在于它不依赖资源管理器(RM)对 XA 的支持，而是通过对（由业务系统提供的）业务逻辑的调度来实现分布式事务。主要由三步操作，Try: 尝试执行业务、 Confirm:确认执行业务、 Cancel: 取消执行业务

#### 2.2 代码说明

- 每个 TCC 事务处理方法可以额外包含 confirmXxx 和 cancelXxx 的方法（），出现失败问题，需要在 cancel 中通过业务逻辑把改变的数据还原回来
- confirmXxx 和 cancelXxx 两个方法会由 TxManager 进行统一协调调用
- confirmXxx 和 cancelXxx 也可以在@TccTransaction 注解中通过属性明确指定

```java
@TccTransaction 
public String demo(){
	// 正常的 service 方法，也是 Try 尝试执行执行 
}
public void confirmDemo(){
	// 当 demo 方法没有出现异常时执行的方法 
	// 方法名称必须叫做 confirm+代理方法首字母 
}
public void cancelDemo(){
	// 当 demo 方法出现异常时执行的方法 
	// 方法名称必须叫做 cancel+代理方法首字母 
}
```

#### 2.3 模式特点

- 该模式对代码的嵌入性高，要求每个业务需要写二个以上步骤的操作
- 该模式对有无本地事务控制都可以支持，使用面更广
- 数据一致性控制几乎完全由开发者控制，对业务开发难度要求高
- 总结：Tcc 模式应用于所有不支持 XA 事务的软件。例如：redis，mongodb 等

### 3.TXC 事务模式

#### 3.1 原理介绍

- TXC 模式命名来源于淘宝，实现原理是在执行 SQL 之前，先查询 SQL 的影响数据，然后保存执行的 SQL 信息和创建锁。当需要回滚的时候就采用这些记录数据回滚数据库，目前锁实现依赖 redis 分布式锁控制。（在使用 lcn 时必须要配置 redis 参数）

#### 3.2 模式特点

- 该模式同样对代码的嵌入性低
- 该模式仅限于对支持 SQL 方式的模块支持
- 该模式由于每次执行 SQL 之前需要先查询影响数据，因此相比 LCN 模式消耗资源与时间要多
- 该模式不会占用数据库的连接资源
- **总结：只能用在支持 SQL 的数据库。对资源消耗较多。建议使用 LCN 模式**
