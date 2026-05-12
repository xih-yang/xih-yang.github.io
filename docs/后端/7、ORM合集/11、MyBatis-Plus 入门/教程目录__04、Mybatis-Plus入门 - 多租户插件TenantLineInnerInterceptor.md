# 04、Mybatis-Plus入门 - 多租户插件TenantLineInnerInterceptor
- 来源：https://ddkk.com/zhuanlan/orm/mybatisplus/5/4.html
- 分类：ORM框架
- 分组：教程目录
## 前言

### SaaS

SaaS，是Software-as-a-Service的缩写名称，意思为软件即服务，即通过网络提供软件服务。

SaaS平台供应商将应用软件统一部署在自己的服务器上，客户可以根据工作实际需求，通过互联网向厂商定购所需的应用软件服务，按定购的服务多少和时间长短向厂商支付费用，并通过互联网获得Saas平台供应商提供的服务。

SaaS服务通常基于一套标准软件系统为成百上千的不同客户(又称为租户)提供服务。这要求SaaS服务能够支持不同租户之间数据和配置的隔离，从而保证每个租户数据的安全与隐私，以及用户对诸如界面、业务逻辑、数据结构等的个性化需求。由于SaaS同时支持多个租户，每个租户又有很多用户，这对支撑软件的基础设施平台的性能、稳定性和扩展性提出很大挑战。

### 多租户

多租户技术（英语：multi-tenancy technology）或称多重租赁技术，是一种软件架构技术，它是在探讨与实现如何于多用户的环境下共用相同的系统或程序组件，并且仍可确保各用户间数据的隔离性。

多租户技术可以实现多个租户之间共享系统实例，同时又可以实现租户的系统实例的个性化定制。通过使用多租户技术可以保证系统共性的部分被共享，个性的部分被单独隔离。通过在多个租户之间的资源复用，运营管理维护资源，有效节省开发应用的成本。

多租户技术的实现重点，在于不同租户间应用程序环境的隔离（application context isolation）以及数据的隔离（data isolation)，以维持不同租户间应用程序不会相互干扰，同时数据的保密性也够强。

### 多租户实现方式

**1、** 独立数据库；

这是第一种方案，即一个租户一个数据库，这种方案的用户数据隔离级别最高，安全性最好，但成本也高。

**优点**：

为不同的租户提供独立的数据库，有助于简化数据模型的扩展设计，满足不同租户的独特需求；

如果出现故障，恢复数据比较简单。

**缺点**：

增大了数据库的安装数量，随之带来维护成本和购置成本的增加。

这种方案与传统的一个客户、一套数据、一套部署类似，差别只在于软件统一部署在运营商那里。如果面对的是银行、医院等需要非常高数据隔离级别的租户，可以选择这种模式，提高租用的定价。如果定价较低，产品走低价路线，这种方案一般对运营商来说是无法承受的。
**2、** 共享数据库，隔离数据架构；

这是第二种方案，即多个或所有租户共享Database，但一个Tenant一个Schema。

**优点**：

为安全性要求较高的租户提供了一定程度的逻辑数据隔离，并不是完全隔离；每个数据库可以支持更多的租户数量。

**缺点**：

如果出现故障，数据恢复比较困难，因为恢复数据库将牵扯到其他租户的数据；

如果需要跨租户统计数据，存在一定困难。
**3、** 共享数据库，共享数据架构；

这是第三种方案，即租户共享同一个Database、同一个Schema，但在表中通过TenantID区分租户的数据。这是共享程度最高、隔离级别最低的模式。

**优点**：

三种方案比较，第三种方案的维护和购置成本最低，允许每个数据库支持的租户数量最多。

**缺点**：

隔离级别最低，安全性最低，需要在设计开发时加大对安全的开发量；

数据备份和恢复最困难，需要逐表逐条备份和还原。

如果希望以最少的服务器为最多的租户提供服务，并且租户接受以牺牲隔离级别换取降低成本，这种方案最适合。

### MybatisPlus多租户插件

plus提供了租户处理器（ TenantId 行级 ），租户之间共享数据库，共享数据架构，通多表字段（租户ID）进行数据逻辑隔离。

**注意**:

- 多租户 != 权限过滤,不要乱用,租户之间是完全隔离的!!!
- 启用多租户后所有执行的method的sql都会进行处理.
- 自写的sql请按规范书写(sql涉及到多个表的每个表都要给别名,特别是 inner join 的要写标准的 inner join)

```java
/**
 * 租户处理器（ TenantId 行级 ）
 *
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @since 3.4.0
 */
public interface TenantLineHandler {
    /**
     * 获取租户 ID 值表达式，只支持单个 ID 值
     * <p>
     *
     * @return 租户 ID 值表达式
     */
    Expression getTenantId();
    /**
     * 获取租户字段名
     * <p>
     * 默认字段名叫: tenant_id
     *
     * @return 租户字段名
     */
    default String getTenantIdColumn() {
        return "tenant_id";
    }
    /**
     * 根据表名判断是否忽略拼接多租户条件
     * <p>
     * 默认都要进行解析并拼接多租户条件
     *
     * @param tableName 表名
     * @return 是否忽略, true:表示忽略，false:需要解析并拼接多租户条件
     */
    default boolean ignoreTable(String tableName) {
        return false;
    }
}
```

### 测试案例

**1、** 表及实体类添加租户ID；

**2、** 编写多租户处理器实现TenantLineHandler接口；

```java
@Slf4j
public class MyTenantLineHandler implements TenantLineHandler {
    /**
     * 获取租户ID 实际应该从用户信息中获取
     *
     * @return
     */
    @Override
    public Expression getTenantId() {
        // 模拟ID
        log.info("==========================getTenantId");
        String userTenantId = "000" + (new Random().nextInt(2) + 1);
        return new StringValue(userTenantId);
    }
    /**
     * 获取租户表字段 默认为tenant_id
     *
     * @return
     */
    @Override
    public String getTenantIdColumn() {
        log.info("==========================getTenantIdColumn");
        return "tenant_id";
    }
    /**
     * 表过滤，返回true，表示当前表不进行租户过滤
     *
     * @param tableName 表名
     * @return
     */
    @Override
    public boolean ignoreTable(String tableName) {
        // 排除user表
        log.info("==========================ignoreTable");
        return "user".equalsIgnoreCase(tableName);
    }
}
```

**1、** 配置类添加租户插件；

```java
        // 添加租户插件
        // 如果用了分页插件注意先 add TenantLineInnerInterceptor 再 add PaginationInnerInterceptor
        // 用了分页插件必须设置 MybatisConfiguration#useDeprecatedExecutor = false ,3.4已移除
        TenantLineInnerInterceptor tenantLineInnerInterceptor = new TenantLineInnerInterceptor();
        TenantLineHandler myTenantLineHandler = new MyTenantLineHandler();
        tenantLineInnerInterceptor.setTenantLineHandler(myTenantLineHandler);
        interceptor.addInnerInterceptor(tenantLineInnerInterceptor);
```

**1、** 测试发现，Sql语句自动拼接了租户过滤条件；

**2、** 同数据权限插件一样，也可使用@InterceptorIgnore进行是否拦截配置，但是只能做用于Mapper，还是需要自定义注解，方便使用；
