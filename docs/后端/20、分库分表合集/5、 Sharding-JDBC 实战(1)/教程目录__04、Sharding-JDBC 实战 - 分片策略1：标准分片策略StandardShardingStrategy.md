# 04、Sharding-JDBC 实战 - 分片策略1：标准分片策略StandardShardingStrategy
- 来源：https://ddkk.com/zhuanlan/sharding/shardingjdbc/1/4.html
- 分类：分库分表
- 分组：教程目录
## 一、标准分片策略StandardShardingStrategy

提供对SQL语句中的=, IN和BETWEEN AND的分片操作支持

StandardShardingStrategy只支持单分片键，提供PreciseShardingAlgorithm（精准分片）和RangeShardingAlgorithm（范围分片）两个分片算法

PreciseShardingAlgorithm是必选的，用于处理=和IN的分片

RangeShardingAlgorithm是可选的，用于处理BETWEEN AND分片，如果不配置RangeShardingAlgorithm，SQL中的BETWEEN AND将按照全库路由处理

如果需要使用RangeShardingAlgorithm，必须和PreciseShardingAlgorithm配套使用

## 二、StandardShardingStrategy配置实现

Sharding -jdbc 在使用分片策略的时候，与分片算法是成对出现的，每种策略都对应一到两种分片算法（不分片策略NoneShardingStrategy除外）

### 分库分表最核心的两点SQL 路由 、 SQL 改写

**SQL 路由:解析原生SQL，确定需要使用哪些数据库，哪些数据表**

Route （路由）引擎：为什么要用Route 引擎呢？

在实际查询当中，数据可能不只是存在一台MYSQL服务器上，

> SELECT * FROM t_order WHERE order _id IN(1,3,6)

数据分布：

> ds0.t_order0 (1,3,5,7)
>
> ds1.t_order0(2,4,6)

这个SELECT 查询就需要走2个database,如果这个SQL原封不动的执行，肯定会报错（表不存在），Sharding-jdbc 必须要对这个sql进行改写，将库名和表名 2个路由加上

> SELECT * FROM ds0.t_order0 WHERE order _id IN(1,3)
>
> SELECT * FROM ds0.t_order1 WHERE order _id IN(6)

**SQL 改写：将SQL 按照一定规则，重写FROM 的数据库和表名（Route 返回路由决定需要去哪些库表中执行SQL）**

### application.properties 配置

**配置主要分为三个部分**

**1、** 配置数据源；

**2、** 分库配置；

**3、** 分表配置；

```java
standard.precise-algorithm  标准策略 + 精准分片f算法 SQL 就是  = in
standard.range-algorithm   标准策略 + 范围分片算法 （主要是between  and ）
sharding.jdbc.datasource.names=ds0,ds1
库配置
sharding.jdbc.config.sharding.default-database-strategy.standard.sharding-column=user_id
sharding.jdbc.datasource.ds0.type=com.alibaba.druid.pool.DruidDataSource
sharding.jdbc.datasource.ds0.driver-class-name=com.mysql.jdbc.Driver
sharding.jdbc.datasource.ds0.url=jdbc:mysql://127.0.0.1:5306/ds0?useUnicode=yes&characterEncoding=utf8
sharding.jdbc.datasource.ds0.username=root
sharding.jdbc.datasource.ds0.password=root
sharding.jdbc.datasource.ds1.type=com.alibaba.druid.pool.DruidDataSource
sharding.jdbc.datasource.ds1.driver-class-name=com.mysql.jdbc.Driver
sharding.jdbc.datasource.ds1.url=jdbc:mysql://127.0.0.1:5306/ds1?useUnicode=yes&characterEncoding=utf8
sharding.jdbc.datasource.ds1.username=root
sharding.jdbc.datasource.ds1.password=root
standard.precise-algorithm 标准策略下分片算法包含2个 precise + range，range是可选的，但是如果使用 range 就必须同 precise 配套一起使用
买precise赠送 range，可以选择不要赠品，但是你不能不买还想白嫖赠品
sharding.jdbc.config.sharding.default-database-strategy.standard.precise-algorithm-class-name=ai.yunxi.sharding.config.PreciseShardingDBAlgorithm
sharding.jdbc.config.sharding.default-database-strategy.standard.range-algorithm-class-name=ai.yunxi.sharding.config.RangeShardingDBAlgorithm
设置绑定表
sharding.jdbc.config.sharding.binding-tables=t_order,t_order_item
t_order分表配置
如果分片键相同，可以直接在后面凭拼接 例如 ：ds$->{0..1}.t_order$->{0..1},ds$->{0..1}.t_order_item$->{0..1}
sharding.jdbc.config.sharding.tables.t_order.actual-data-nodes=ds$->{0..1}.t_order$->{0..1}
sharding.jdbc.config.sharding.tables.t_order.table-strategy.standard.sharding-column=order_id
sharding.jdbc.config.sharding.tables.t_order.table-strategy.standard.precise-algorithm-class-name=ai.yunxi.sharding.config.PreciseShardingDBAlgorithm
sharding.jdbc.config.sharding.tables.t_order.table-strategy.standard.range-algorithm-class-name=ai.yunxi.sharding.config.RangeShardingDBAlgorithm
t_order_item分表配置
sharding.jdbc.config.sharding.tables.t_order_item.actual-data-nodes=ds$->{0..1}.t_order_item$->{0..1}
sharding.jdbc.config.sharding.tables.t_order_item.table-strategy.standard.sharding-column=order_id
sharding.jdbc.config.sharding.tables.t_order_item.table-strategy.standard.precise-algorithm-class-name=ai.yunxi.sharding.config.PreciseShardingDBAlgorithm
sharding.jdbc.config.sharding.tables.t_order_item.table-strategy.standard.range-algorithm-class-name=ai.yunxi.sharding.config.RangeShardingDBAlgorithm
```

### 精准分库PreciseShardingDBAlgorithm

```java
import io.shardingsphere.api.algorithm.sharding.PreciseShardingValue;
import io.shardingsphere.api.algorithm.sharding.standard.PreciseShardingAlgorithm;
import java.util.Collection;
/**
 * 自定义实现 精准分片算法（PreciseShardingAlgorithm）接口
 * 数据库DB的精准分片
 * @author Peng zhizhong
 * @version 1.0
 * fileName PreciseShardingDBAlgorithm1
 * createTime 2020/5/11  19:21
 */
public class PreciseShardingDBAlgorithm implements PreciseShardingAlgorithm<Integer> {
    /**
     *
     * @param databaseNames 有效的数据源 或者 表 的名字  databaseNames 就为配置文件中的 配置的数据源信息 -> ds0 , ds1
     * @param shardingValue  SQL 分片列 对应的实际值
     * @return
     */
    @Override
    public String doSharding(Collection<String> databaseNames,
                       PreciseShardingValue<Integer> shardingValue) {
  /*
   * 作用：散列到具体的哪个库里面去
         * shardingValue ： SQL -> SELECT *  FROM t_order WHERE order _id IN(1,3,6)
         * shardingValue = [1,3,6]
         * */
        for (String each : databaseNames) {
            /**
             * 此方法如果参数所表示的字符序列是由该对象表示的字符序列的后缀返回true, 否则为false;
             *  请注意，如果参数是空字符串或等于此String对象由equals（Object）方法确定结果为 true。
             *  String Str = new String("This is really not immutable!!");   retVal = Str.endsWith( "immutable!!" )
             *  为true
             *  ds0.endsWith("0") -> true ;
             */
            if (each.endsWith(String.valueOf(shardingValue.getValue() % databaseNames.size()))) {
                //返回相应的数据库
                System.out.println("each"+each);
                return each;
            }
        }
        throw new UnsupportedOperationException();
    }
}
```

### 范围分库RangeShardingDBAlgorithm

```java
import io.shardingsphere.api.algorithm.sharding.RangeShardingValue;
import io.shardingsphere.api.algorithm.sharding.standard.RangeShardingAlgorithm;
import java.util.Collection;
import java.util.LinkedHashSet;
import java.util.Set;
/**
 * 自定义实现 范围分片算法（RangeShardingAlgorithm）接口
 * 数据库DB的范围分片
 * @author Peng zhizhong
 * @version 1.0
 * fileName RangeShardingDBAlgorithm
 * createTime 2020/5/11  19:21
 */
public class RangeShardingDBAlgorithm implements RangeShardingAlgorithm<Integer> {
    @Override
    public Collection<String> doSharding(final Collection<String> databaseNames,
                                         final RangeShardingValue<Integer> shardingValue) {
        /**
         * 自定义SQL -> SELECT *  FROM t_order WHERE order _id Between 2000 and 4000
         * ds0.t_order: 1000 ~ 3000
         * ds1.t_order: 3001 ~ 5000
         * ds2.t_order: 5001 ~ 7000
         *
         * 执行路由后的SQL 应为：
         * SELECT *  FROM ds0.t_order WHERE order _id Between 2000 and 3000
         * SELECT *  FROM ds1.t_order WHERE order _id Between 3001 and 4000
         */
        Set<String> result = new LinkedHashSet<>();
        // 从sql 中获取 Between 2000 and 4000   的值，将2000 赋值给 lower,  4000 赋值给 upper
        int lower = shardingValue.getValueRange().lowerEndpoint();
        int upper = shardingValue.getValueRange().upperEndpoint();
        for (int i = lower; i <= upper; i++) {
            for (String each : databaseNames) { //ds0,ds1
                if (each.endsWith(i % databaseNames.size() + "")) {
                    result.add(each);
                }
            }
        }
        return result;
    }
}
```

### 精准分表PreciseShardingTableAlgorithm

```java
import io.shardingsphere.api.algorithm.sharding.PreciseShardingValue;
import io.shardingsphere.api.algorithm.sharding.standard.PreciseShardingAlgorithm;
import java.util.Collection;
/**
 * 自定义实现 精准分片算法（PreciseShardingAlgorithm）接口
 * 数据表table的精准分片
 * @author Peng zhizhong
 * @version 1.0
 * fileName PreciseShardingTableAlgorithm
 * createTime 2020/5/11  19:21
 */
public class PreciseShardingTableAlgorithm implements PreciseShardingAlgorithm<Long> {
    /**
     * 注释键 PreciseShardingDBAlgorithm
     * @param tableNames
     * @param shardingValue
     * @return
     */
    @Override
    public String doSharding(Collection<String> tableNames,
                             PreciseShardingValue<Long> shardingValue) {
        for (String key : tableNames) {
            if (key.endsWith(String.valueOf(shardingValue.getValue() % tableNames.size()))) {
                System.out.println("key"+key);
                return key;
            }
        }
        throw new UnsupportedOperationException();
    }
}
```

### 范围分表RangeShardingTableAlgorithm：

```java
import com.google.common.collect.Range;
import io.shardingsphere.api.algorithm.sharding.RangeShardingValue;
import io.shardingsphere.api.algorithm.sharding.standard.RangeShardingAlgorithm;
import java.util.Collection;
import java.util.LinkedHashSet;
import java.util.Set;
/**
 * 自定义实现 范围分片算法（RangeShardingAlgorithm）接口
 * 数据表 table 的范围分片
 * @author Peng zhizhong
 * @version 1.0
 * fileName RangeShardingTableAlgorithm
 * createTime 2020/5/11  19:21
 */
public class RangeShardingTableAlgorithm implements RangeShardingAlgorithm<Integer> {
    @Override
    public Collection<String> doSharding(final Collection<String> tableNames,
                                         final RangeShardingValue<Integer> shardingValue) {
        Set<String> result = new LinkedHashSet<>();
        // 如果between  2000000 and 7000000
        if (Range.closed(2000000,
                7000000).encloses(shardingValue.getValueRange())) {
            for (String each : tableNames) {
                if (each.endsWith("0")) {
                    result.add(each);
                }
            }
        } else {
            throw new UnsupportedOperationException();
        }
        return result;
    }
}
```
