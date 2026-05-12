# 04、分布式事务 Seata 教程 - Spring Cloud 2集成Seata1.4
- 来源：https://ddkk.com/zhuanlan/transaction/5/4.html
- 分类：分布式事务
- 分组：教程目录
### 引出分布式事务问题

**1、** seata-service-account编写查询用户、远程调用下订单接口；

```java
@RestController
@RequestMapping("/accountTbl")
public class AccountTblController {
    @Autowired
    AccountTblMapper accountTblMapper;
    @Autowired
    OrderFeign orderFeign;
    @GetMapping("/insertOrder")
    public Object insertOrder() {
        // 查询用户
        AccountTbl accountTbl = accountTblMapper.selectById("11111111");
        // 下单
        Object order = orderFeign.insertOrder(accountTbl.getUserId(), "iphone11", 1, 1);
        // 修改余额
        accountTbl.setMoney(accountTbl.getMoney() - 1);
        accountTblMapper.updateById(accountTbl);
        return order;
    }
}
```

```java
@FeignClient(name = "seata-service-order")
public interface OrderFeign {
    @GetMapping("orderTbl/insertOrder")
    Object insertOrder(@RequestParam String userId,@RequestParam  String commodityCode,@RequestParam  int count,@RequestParam  int money);
}
```

**1、** seata-service-order编写下订单，远程调用减库存接口；

```java
@RestController
@RequestMapping("/orderTbl")
public class OrderTblController {
    @Autowired
    OrderTblMapper orderTblMapper;
    @Autowired
    StorageFeign storageFeign;
    @GetMapping("insertOrder")
    public Object insertOrder(String userId, String commodityCode, int count, int money) {
        // 下定单
        OrderTbl orderTbl = new OrderTbl();
        orderTbl.setUserId(userId);
        orderTbl.setCommodityCode(commodityCode);
        orderTbl.setCount(count);
        orderTbl.setMoney(1);
        // 下订单扣库存
        orderTblMapper.insert(orderTbl);
        Object storage = storageFeign.updateStorage(commodityCode, count);
        return orderTbl;
    }
}
```

```java
@FeignClient(name = "seata-service-storage")
public interface StorageFeign {
    @GetMapping("/storageTbl/updateStorage")
    Object updateStorage(@RequestParam String commodityCode,@RequestParam  int count);
}
```

**1、** seata-service-storage编写减库存接口；

```java
@RestController
@RequestMapping("/storageTbl")
public class StorageTblController {
    @Autowired
    StorageTblMapper storageTblMapper;
    @GetMapping("updateStorage")
    Object updateStorage(String commodityCode, int count){
        // 查询库存
        StorageTbl storageTbl = storageTblMapper.selectOne(new LambdaQueryWrapper<StorageTbl>().eq(StorageTbl::getCommodityCode, commodityCode));
        // 减去库存更新
        storageTbl.setCount(storageTbl.getCount()-count);
        int i = storageTblMapper.updateById(storageTbl);
        return storageTbl;
    }
}
```

**1、** 访问http://localhost:10000/accountTbl/insertOrder，查看整个流程；

**2、** 关闭seata-service-storage，访问接口，发现下程序报错，但是依然下单成功，库存未减，出现数据不一致问题；

### 集成Seata解决分布式事务问题

**1、** 各个数据据添加undo_log表；

```java
-- for AT mode you must to init this sql for you business database. the seata server not need it.
CREATE TABLE IF NOT EXISTS undo_log
(
    branch_id     BIGINT(20)   NOT NULL COMMENT 'branch transaction id',
    xid           VARCHAR(100) NOT NULL COMMENT 'global transaction id',
    context       VARCHAR(128) NOT NULL COMMENT 'undo_log context,such as serialization',
    rollback_info LONGBLOB     NOT NULL COMMENT 'rollback info',
    log_status    INT(11)      NOT NULL COMMENT '0:normal status,1:defense status',
    log_created   DATETIME(6)  NOT NULL COMMENT 'create datetime',
    log_modified  DATETIME(6)  NOT NULL COMMENT 'modify datetime',
    UNIQUE KEY ux_undo_log (xid, branch_id)
) ENGINE = InnoDB
  AUTO_INCREMENT = 1
  DEFAULT CHARSET = utf8 COMMENT ='AT transaction mode undo table';
```

**1、** 父pom添加seata依赖；

```java
        <dependency>
            <groupId>io.seata</groupId>
            <artifactId>seata-spring-boot-starter</artifactId>
            <version>1.4.0</version>
            <exclusions>
                <exclusion>
                    <groupId>com.alibaba</groupId>
                    <artifactId>druid</artifactId>
                </exclusion>
            </exclusions>
        </dependency>
        <dependency>
            <groupId>com.alibaba.cloud</groupId>
            <artifactId>spring-cloud-starter-alibaba-seata</artifactId>
            <exclusions>
                <exclusion>
                    <groupId>io.seata</groupId>
                    <artifactId>seata-spring-boot-starter</artifactId>
                </exclusion>
            </exclusions>
        </dependency>
```

**1、** 各模块添加yml配置；

```java
seata:
  enabled: true
  application-id: seata-service-account 添加为服务名
  tx-service-group: my_test_tx_group
  config:
    type: nacos
    nacos:
      namespace:
      serverAddr: 127.0.0.1:8848
      group: SEATA_GROUP
  registry:
    type: nacos
    nacos:
      application: seata-server
      server-addr: 127.0.0.1:8848
      group: SEATA_GROUP
      namespace:
```

**1、** 调用链开端AccountTblController接口添加@GlobalTransactional注解；

**2、** 手动实现xid传递，实际cloudalibaba通过已实现了自动传递，但是新版openfeign移除了很多组件，需要自己实现，添加配置类，并重新去掉自动配置；

```java
import feign.RequestInterceptor;
import feign.RequestTemplate;
import io.seata.core.context.RootContext;
import org.springframework.context.annotation.Configuration;
/**
 * Created by TD on 2021/2/4
 */
@Configuration
public class SeataFeignInterceptor  implements RequestInterceptor {
    @Override
    public void apply(RequestTemplate requestTemplate) {
        requestTemplate.header(RootContext.KEY_XID, RootContext.getXID());
    }
}
```

```java
@Configuration
public class WebMvcConfig implements WebMvcConfigurer {
    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(new SeataHandlerInterceptor()).addPathPatterns("/**");
    }
}
```

```java
@SpringBootApplication(exclude = {
     SeataFeignClientAutoConfiguration.class})
```

**1、** 启动各个项目，访问接口,全局事务提交成功；

**2、** 模拟异常；

**3、** 当账户因为异常回滚后，并没有订单及库存数据不一致，全局事务回滚；
