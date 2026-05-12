# 10、分布式事务 Seata 教程 - Seata之TCC模式入门案例
- 来源：https://ddkk.com/zhuanlan/transaction/5/10.html
- 分类：分布式事务
- 分组：教程目录
### 前言

Seata 将为用户提供了 AT、TCC、SAGA 和 XA 事务模式，为用户打造一站式的分布式解决方案。

TCC与 Seata AT 事务一样都是两阶段事务，它与 AT 事务的主要区别为：

- TCC 对业务代码侵入严重：每个阶段的数据操作都要自己进行编码来实现，事务框架无法自动处理。
- TCC 效率更高：不必对数据加全局锁，允许多个事务同时操作数据。

接下来分析下Seata 如何使用TCC 模式。

### TCC 案例

**案例需求**：账户服务调用订单和库存服务进行下单操作，保证某个环节异常时，事务能实现全局一致。

#### 1. 环境搭建

参考[Seata 专栏](https://blog.csdn.net/qq_43437874/category_10263413.html?spm=1001.2014.3001.5482)搭建三个测试模块，注意这里不需要undo_log 表。

当前主要组件版本为：

- spring.boot：2.3.12.RELEASE
- spring.cloud：Hoxton.SR12
- spring.cloud.alibaba：2.2.7.RELEASE
- Nacos : 2.0.3
- Seata: 1.4.2
- mybatis-plus: 3.4.2

#### 2. 自定义两个阶段处理逻辑

TCC模式，不依赖于底层数据资源的事务支持：

- 一阶段 prepare 行为：调用 自定义 的 prepare 逻辑。
- 二阶段 commit 行为：调用 自定义 的 commit 逻辑。
- 二阶段 rollback 行为：调用 自定义 的 rollback 逻辑。

因为TCC 需要自定义分支事务处理逻辑，所以我们需要编写一个账户购买商品服务接口，并添加相关注解。

```java
@LocalTCC
public interface AccountTblService extends IService<AccountTbl> {
    /**
     * 执行资源检查及预留操作
     */
    @TwoPhaseBusinessAction(name = "prepareBuy", commitMethod = "commit", rollbackMethod = "rollback")
    Object prepareBuy(@BusinessActionContextParameter(paramName = "userId") String userId, String code, @BusinessActionContextParameter(paramName = "count") Long count);
    /**
     * 全局事物进行提交
     */
    boolean commit(BusinessActionContext actionContext);
    /**
     * 全局事务进行回滚
     */
    boolean rollback(BusinessActionContext actionContext);
}
```

相关注解说明：

- @LocalTCC：作用于服务接口上，表示实现该接口的实现类被 seata 来管理，seata 根据事务的状态，自动调用我们定义的方法，如果没问题则调用 Commit 方法，否则调用 Rollback 方法。
- @TwoPhaseBusinessAction：该注解用在接口的 Try 方法上，name 为 tcc 方法的 bean 名称，需要全局唯一，一般写方法名即可；commitMethod指定事务成功后的commit方法；rollbackMethod 指定事务失败后的rollback方法。
- @BusinessActionContextParameter： 该注解用来修饰 Try 方法的入参，被修饰的入参可以在 Commit 方法和 Rollback 方法中通过 BusinessActionContext 获取。

编写接口实现类：

```java
@Service
@Slf4j
public class AccountTblServiceImpl extends ServiceImpl<AccountTblMapper, AccountTbl> implements AccountTblService {
    @Autowired
    AccountTblMapper accountTblMapper;
    @Autowired
    OrderClint orderClint;
    @Autowired
    StorageApi storageApi;
    @Override
    public Object prepareBuy(String userId, String code, Long count) {
        log.info("开始TCC xid:" + RootContext.getXID());
        //1.查询账户 扣款
        AccountTbl accountTbl = accountTblMapper.selectById(userId);
        AccountTbl accountTbl1 = accountTbl.setMoney(accountTbl.getMoney() - count);
        accountTblMapper.updateById(accountTbl1);
        //2.远程创建订单
        orderClint.insertOrder(accountTbl.getUserId(), code, count);
        //3.远程扣库存
        storageApi.tcc("iphone11", count);
        return "执行完毕！";
    }
    @Override
    public boolean commit(BusinessActionContext actionContext) {
        log.info("xid = " + actionContext.getXid() + "提交成功");
        return true;
    }
    @Override
    public boolean rollback(BusinessActionContext actionContext) {
        // 获取下单时的提交参数
        String userId = actionContext.getActionContext("userId").toString();
        Long count = Long.parseLong(actionContext.getActionContext("count").toString());
        // 进行分支事务扣掉的金额回滚
        AccountTbl accountTbl = accountTblMapper.selectById(userId);
        AccountTbl accountTbl1 = accountTbl.setMoney(accountTbl.getMoney() + count);
        accountTblMapper.updateById(accountTbl1);
        log.info("xid = " + actionContext.getXid() + "进行回滚操作");
        return true;
    }
}
```

使用`@GlobalTransactional`开启全局事务：

```java
    @GetMapping("/testTcc")
    @GlobalTransactional
    public Object test() {
        return  accountTblService.prepareBuy("11111111","iphone11",1L);
    }
```

订单和库存服务也仿照上面书写。

#### 3. 测试

发生异常时，可以看到，TCC模式进行了回滚操作。

#### 4. 总结

上面简单实现了TCC 模式，但是存在很多问题，使用起来也巨麻烦，所以就不再深究了。。。。
