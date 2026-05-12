# 09、Sharding-JDBC 实战：5.3.0版本，实现按月分表、自动建表、自动刷新节点
- 来源：https://ddkk.com/zhuanlan/sharding/shardingjdbc/2/9.html
- 分类：分库分表
- 分组：教程目录
补充：如果要看 5.4.0 的文档，直接把地址中的 5.3.0 改为 5.4.0 即可，以此类推。

## 一、简介

> 背景： 之前使用 ShardingSphere-JDBC 的 5.1.0 版本进行数据分片，后来开源组件扫描发现 5.1.0 版本存在如下漏洞，需要升级到 5.3.0 及以上版本：
>
>
> Apache ShardingSphere远程代码执行漏洞(CVE-2020-1947)： Apache ShardingSphere存在YAML解析远程代码执行漏洞，开发人员直接使用unmarshal方法对输入的YAML直接进行解析，没有做校验，攻击者在相应漏洞触发点输入payload即可完成攻击。

升级到`5.3.0` 改动还是很大的，新版本**移除了 Spring 全部依赖和配置支持**，引入了 **ShardingSphereDriver** 数据库驱动，也就意味着需要**使用新的配置方式**。

注意：由于 Druid 集成过程中遇到些问题，本文集成内容未使用 Druid 连接池，如果后续集成完毕，会再补充一篇文章说明。

## 二、Maven依赖

```java
<!-- Sharding-JDBC -->
<dependency>
    <groupId>org.apache.shardingsphere</groupId>
    <artifactId>shardingsphere-jdbc-core</artifactId>
    <version>5.3.0</version>
</dependency>
```

## 三、配置文件

### application.yml

```java
server:
  port: 8081
spring:
  处理连接池冲突
  main:
    allow-bean-definition-overriding: true
  datasource:
    driver-class-name: org.apache.shardingsphere.driver.ShardingSphereDriver
    url: jdbc:shardingsphere:classpath:sharding.yaml
# mybatis-plus
mybatis-plus:
  mapper-locations: classpath*:/mapper/*Mapper.xml
  实体扫描，多个package用逗号或者分号分隔
  typeAliasesPackage: com.demo.*.entity
  测试环境打印sql
  configuration:
    log-impl: org.apache.ibatis.logging.stdout.StdOutImpl
pagehelper:
  helperDialect: postgresql
my:
  sharding:
    create-table:
      url: jdbc:mysql://localhost:3306/mydb?useUnicode=true&characterEncoding=UTF-8&serverTimezone=Asia/Shanghai
      username: root
      password: root
```

### sharding.yaml

```java
#
# Licensed to the Apache Software Foundation (ASF) under one or more
# contributor license agreements.  See the NOTICE file distributed with
# this work for additional information regarding copyright ownership.
# The ASF licenses this file to You under the Apache License, Version 2.0
# (the "License"); you may not use this file except in compliance with
# the License.  You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#
dataSources:
  ds:
    dataSourceClassName: com.zaxxer.hikari.HikariDataSource
    driverClassName: com.mysql.jdbc.Driver
    jdbcUrl: jdbc:mysql://localhost:3306/mydb?useUnicode=true&characterEncoding=UTF-8&serverTimezone=Asia/Shanghai
    username: root
    password: root
rules:
- !SHARDING
  tables:
    t_user:
      actualDataNodes: ds.t_user
      tableStrategy:
        standard:
          shardingColumn: create_time
          shardingAlgorithmName: auto-custom
  shardingAlgorithms:
    auto-custom:
      type: CLASS_BASED
      props:
        strategy: standard
        algorithmClassName: com.demo.module.config.sharding.TimeShardingAlgorithm
#    auto-interval:
#      type: AUTO_INTERVAL
#      props:
#        datetime-lower: '2023-01-01 00:00:00'
#        datetime-upper: '2023-12-01 00:00:00'
#        60 * 60 * 24 * 30=30天
#        sharding-seconds: '2592000'
#    interval:
#      type: INTERVAL
#      props:
#        datetime-pattern: 'yyyy-MM'
#        datetime-lower: '2023-01'
#        datetime-upper: '2023-12'
#        sharding-suffix-pattern: 'yyyyMM'
#        间隔大小
#        datetime-interval-amount: 1
#        datetime-interval-unit: 'Months'
props:
  sql-show: false
```

## 四、代码实现

### 1.自动建表、自动刷新节点思路

大概思路为：

- **配置：** 编写配置的时候，我们只编写逻辑表 t_user。
- **启动初始化：** 在启动后执行脚本 LoadRunner.run() 的时候，触发精确分片来初始化数据库中表名到配置中。
- **建表并刷新配置：** 如果初始化后的配置中不存在表名，则创建表并刷新分表配置。

### 2.创建表结构

```java
-- ------------------------------
-- 用户表
-- ------------------------------
CREATE TABLE t_user (
  id bigint(16) NOT NULL COMMENT '主键',
  username varchar(64) NOT NULL COMMENT '用户名',
  password varchar(64) NOT NULL COMMENT '密码',
  age int(8) NOT NULL COMMENT '年龄',
  create_time timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  update_time timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='用户表';
-- ------------------------------
-- 用户表202201
-- ------------------------------
CREATE TABLE t_user_202201 (
  id bigint(16) NOT NULL COMMENT '主键',
  username varchar(64) NOT NULL COMMENT '用户名',
  password varchar(64) NOT NULL COMMENT '密码',
  age int(8) NOT NULL COMMENT '年龄',
  create_time timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  update_time timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='用户表202201';
```

### 3.TimeShardingAlgorithm.java 分片算法类

```java
/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package com.demo.module.config.sharding;
import com.google.common.collect.Range;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.apache.shardingsphere.sharding.api.sharding.ShardingAutoTableAlgorithm;
import org.apache.shardingsphere.sharding.api.sharding.standard.PreciseShardingValue;
import org.apache.shardingsphere.sharding.api.sharding.standard.RangeShardingValue;
import org.apache.shardingsphere.sharding.api.sharding.standard.StandardShardingAlgorithm;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;
/**
 * <p> @Title TimeShardingAlgorithm
 * <p> @Description 分片算法，按月分片
 *
 * @author ACGkaka
 * @date 2022/12/20 11:33
 */
@Slf4j
public final class TimeShardingAlgorithm implements StandardShardingAlgorithm<LocalDateTime>, ShardingAutoTableAlgorithm {
    /**
     * 分片时间格式
     */
    private static final DateTimeFormatter TABLE_SHARD_TIME_FORMATTER = DateTimeFormatter.ofPattern("yyyyMM");
    /**
     * 完整时间格式
     */
    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("yyyyMMdd HH:mm:ss");
    /**
     * 表分片符号，例：t_contract_202201 中，分片符号为 "_"
     */
    private final String TABLE_SPLIT_SYMBOL = "_";
    @Getter
    private Properties props;
    @Getter
    private int autoTablesAmount;
    @Override
    public void init(final Properties props) {
        this.props = props;
    }
    @Override
    public String doSharding(final Collection<String> availableTargetNames, final PreciseShardingValue<LocalDateTime> preciseShardingValue) {
        String logicTableName = preciseShardingValue.getLogicTableName();
        /// 打印分片信息
        log.info(">>>>>>>>>> 【INFO】精确分片，节点配置表名：{}", availableTargetNames);
        LocalDateTime dateTime = preciseShardingValue.getValue();
        String resultTableName = logicTableName + "_" + dateTime.format(TABLE_SHARD_TIME_FORMATTER);
        // 检查是否需要初始化
        if (availableTargetNames.size() == 1) {
            // 如果只有一个表，说明需要获取所有表名
            List<String> allTableNameBySchema = ShardingAlgorithmTool.getAllTableNameBySchema(logicTableName);
            availableTargetNames.clear();
            availableTargetNames.addAll(allTableNameBySchema);
            autoTablesAmount = allTableNameBySchema.size();
            return resultTableName;
        }
        return getShardingTableAndCreate(logicTableName, resultTableName, availableTargetNames);
    }
    @Override
    public Collection<String> doSharding(final Collection<String> availableTargetNames, final RangeShardingValue<LocalDateTime> rangeShardingValue) {
        String logicTableName = rangeShardingValue.getLogicTableName();
        /// 打印分片信息
        log.info(">>>>>>>>>> 【INFO】范围分片，节点配置表名：{}", availableTargetNames);
        // between and 的起始值
        Range<LocalDateTime> valueRange = rangeShardingValue.getValueRange();
        boolean hasLowerBound = valueRange.hasLowerBound();
        boolean hasUpperBound = valueRange.hasUpperBound();
        // 获取最大值和最小值
        LocalDateTime min = hasLowerBound ? valueRange.lowerEndpoint() :getLowerEndpoint(availableTargetNames);
        LocalDateTime max = hasUpperBound ? valueRange.upperEndpoint() :getUpperEndpoint(availableTargetNames);
        // 循环计算分表范围
        Set<String> resultTableNames = new LinkedHashSet<>();
        while (min.isBefore(max) || min.equals(max)) {
            String tableName = logicTableName + TABLE_SPLIT_SYMBOL + min.format(TABLE_SHARD_TIME_FORMATTER);
            resultTableNames.add(tableName);
            min = min.plusMinutes(1);
        }
        return getShardingTablesAndCreate(logicTableName, resultTableNames, availableTargetNames);
    }
    @Override
    public String getType() {
        return "AUTO_CUSTOM";
    }
    // --------------------------------------------------------------------------------------------------------------
    // 私有方法
    // --------------------------------------------------------------------------------------------------------------
    /**
     * 检查分表获取的表名是否存在，不存在则自动建表
     *
     * @param logicTableName        逻辑表
     * @param resultTableNames     真实表名，例：t_user_202201
     * @param availableTargetNames 可用的数据库表名
     * @return 存在于数据库中的真实表名集合
     */
    public Set<String> getShardingTablesAndCreate(String logicTableName, Collection<String> resultTableNames, Collection<String> availableTargetNames) {
        return resultTableNames.stream().map(o -> getShardingTableAndCreate(logicTableName, o, availableTargetNames)).collect(Collectors.toSet());
    }
    /**
     * 检查分表获取的表名是否存在，不存在则自动建表
     * @param logicTableName   逻辑表
     * @param resultTableName 真实表名，例：t_user_202201
     * @return 确认存在于数据库中的真实表名
     */
    private String getShardingTableAndCreate(String logicTableName, String resultTableName, Collection<String> availableTargetNames) {
        // 缓存中有此表则返回，没有则判断创建
        if (availableTargetNames.contains(resultTableName)) {
            return resultTableName;
        } else {
            // 检查分表获取的表名不存在，需要自动建表
            boolean isSuccess = ShardingAlgorithmTool.createShardingTable(logicTableName, resultTableName);
            if (isSuccess) {
                // 如果建表成功，需要更新缓存
                availableTargetNames.add(resultTableName);
                autoTablesAmount++;
                return resultTableName;
            } else {
                // 如果建表失败，返回逻辑空表
                return logicTableName;
            }
        }
    }
    /**
     * 获取 最小分片值
     * @param tableNames 表名集合
     * @return 最小分片值
     */
    private LocalDateTime getLowerEndpoint(Collection<String> tableNames) {
        Optional<LocalDateTime> optional = tableNames.stream()
                .map(o -> LocalDateTime.parse(o.replace(TABLE_SPLIT_SYMBOL, "") + "01 00:00:00", DATE_TIME_FORMATTER))
                .min(Comparator.comparing(Function.identity()));
        if (optional.isPresent()) {
            return optional.get();
        } else {
            log.error(">>>>>>>>>> 【ERROR】获取数据最小分表失败，请稍后重试，tableName：{}", tableNames);
            throw new IllegalArgumentException("获取数据最小分表失败，请稍后重试");
        }
    }
    /**
     * 获取 最大分片值
     * @param tableNames 表名集合
     * @return 最大分片值
     */
    private LocalDateTime getUpperEndpoint(Collection<String> tableNames) {
        Optional<LocalDateTime> optional = tableNames.stream()
                .map(o -> LocalDateTime.parse(o.replace(TABLE_SPLIT_SYMBOL, "") + "01 00:00:00", DATE_TIME_FORMATTER))
                .max(Comparator.comparing(Function.identity()));
        if (optional.isPresent()) {
            return optional.get();
        } else {
            log.error(">>>>>>>>>> 【ERROR】获取数据最大分表失败，请稍后重试，tableName：{}", tableNames);
            throw new IllegalArgumentException("获取数据最大分表失败，请稍后重试");
        }
    }
}
```

### 4.ShardingAlgorithmTool.java 分片工具类

```java
package com.demo.module.config.sharding;
import com.demo.module.utils.SpringUtil;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.apache.shardingsphere.driver.jdbc.core.datasource.ShardingSphereDataSource;
import org.apache.shardingsphere.infra.config.rule.RuleConfiguration;
import org.apache.shardingsphere.infra.metadata.ShardingSphereMetaData;
import org.apache.shardingsphere.mode.manager.ContextManager;
import org.apache.shardingsphere.sharding.api.config.ShardingRuleConfiguration;
import org.apache.shardingsphere.sharding.api.config.rule.ShardingTableRuleConfiguration;
import org.springframework.core.env.Environment;
import org.springframework.util.ReflectionUtils;
import java.io.File;
import java.lang.reflect.Field;
import java.sql.*;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.*;
/**
 * <p> @Title ShardingAlgorithmTool
 * <p> @Description 按月分片算法工具
 *
 * @author ACGkaka
 * @date 2022/12/20 14:03
 */
@Slf4j
public class ShardingAlgorithmTool {
    /** 表分片符号，例：t_user_202201 中，分片符号为 "_" */
    private static final String TABLE_SPLIT_SYMBOL = "_";
    /** 数据库配置 */
    private static final Environment ENV = SpringUtil.getApplicationContext().getEnvironment();
    private static final String DATASOURCE_URL = ENV.getProperty("my.sharding.create-table.url");
    private static final String DATASOURCE_USERNAME = ENV.getProperty("my.sharding.create-table.username");
    private static final String DATASOURCE_PASSWORD = ENV.getProperty("my.sharding.create-table.password");
    /** 配置文件路径 */
    private static final String CONFIG_FILE = "sharding-tables.yaml";
    /**
     * 获取所有表名
     * @return 表名集合
     * @param logicTableName 逻辑表
     */
    public static List<String> getAllTableNameBySchema(String logicTableName) {
        List<String> tableNames = new ArrayList<>();
        if (StringUtils.isEmpty(DATASOURCE_URL) || StringUtils.isEmpty(DATASOURCE_USERNAME) || StringUtils.isEmpty(DATASOURCE_PASSWORD)) {
            log.error(">>>>>>>>>> 【ERROR】数据库连接配置有误，请稍后重试，URL:{}, username:{}, password:{}", DATASOURCE_URL, DATASOURCE_USERNAME, DATASOURCE_PASSWORD);
            throw new IllegalArgumentException("数据库连接配置有误，请稍后重试");
        }
        try (Connection conn = DriverManager.getConnection(DATASOURCE_URL, DATASOURCE_USERNAME, DATASOURCE_PASSWORD);
             Statement st = conn.createStatement()) {
            try (ResultSet rs = st.executeQuery("show TABLES like '" + logicTableName + TABLE_SPLIT_SYMBOL + "%'")) {
                while (rs.next()) {
                    String tableName = rs.getString(1);
                    // 匹配分表格式 例：^(t\_contract_\d{6})$
                    if (tableName != null && tableName.matches(String.format("^(%s\\d{6})$", logicTableName + TABLE_SPLIT_SYMBOL))) {
                        tableNames.add(rs.getString(1));
                    }
                }
            }
        } catch (SQLException e) {
            log.error(">>>>>>>>>> 【ERROR】数据库连接失败，请稍后重试，原因：{}", e.getMessage(), e);
            throw new IllegalArgumentException("数据库连接失败，请稍后重试");
        }
        return tableNames;
    }
    // --------------------------------------------------------------------------------------------------------------
    // 私有方法
    // --------------------------------------------------------------------------------------------------------------
    /**
     * 获取数据源
     */
//    private static Map<String, DataSource> getDataSourceMap() {
//        return getActualDataSources().entrySet().stream().filter(entry -> ACTUAL_DATA_SOURCE_NAMES.contains(entry.getKey())).collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));
//    }
    /**
     * 获取数据源配置
     */
    private static File getShardingYAMLFile() {
        return new File(Objects.requireNonNull(
                ShardingAlgorithmTool.class.getClassLoader().getResource(CONFIG_FILE), String.format("File %s is not existed.", CONFIG_FILE)).getFile());
    }
    /**
     * 刷新ActualDataNodes
     */
    private static void updateShardRuleActualDataNodes(ShardingSphereDataSource dataSource, String logicTableName, String newActualDataNodes) throws NoSuchFieldException {
        // Context manager.
        Field contextManagerField = dataSource.getClass().getDeclaredField("contextManager");
        ContextManager contextManager = (ContextManager) ReflectionUtils.getField(contextManagerField, dataSource);
        // Rule configuration.
        ShardingSphereMetaData shardingSphereMetaData = contextManager
                .getMetaDataContexts()
                .getMetaData();
        Collection<RuleConfiguration> newRuleConfigList = new LinkedList<>();
        Collection<RuleConfiguration> oldRuleConfigList = shardingSphereMetaData
                .getGlobalRuleMetaData()
                .getConfigurations();
        for (RuleConfiguration oldRuleConfig : oldRuleConfigList) {
            if (oldRuleConfig instanceof ShardingRuleConfiguration) {
                // Algorithm provided sharding rule configuration
                ShardingRuleConfiguration oldAlgorithmConfig = (ShardingRuleConfiguration) oldRuleConfig;
                ShardingRuleConfiguration newAlgorithmConfig = new ShardingRuleConfiguration();
                // Sharding table rule configuration Collection
                Collection<ShardingTableRuleConfiguration> newTableRuleConfigList = new LinkedList<>();
                Collection<ShardingTableRuleConfiguration> oldTableRuleConfigList = oldAlgorithmConfig.getTables();
                oldTableRuleConfigList.forEach(oldTableRuleConfig -> {
                    if (logicTableName.equals(oldTableRuleConfig.getLogicTable())) {
                        ShardingTableRuleConfiguration newTableRuleConfig = new ShardingTableRuleConfiguration(oldTableRuleConfig.getLogicTable(), newActualDataNodes);
                        newTableRuleConfig.setTableShardingStrategy(oldTableRuleConfig.getTableShardingStrategy());
                        newTableRuleConfig.setDatabaseShardingStrategy(oldTableRuleConfig.getDatabaseShardingStrategy());
                        newTableRuleConfig.setKeyGenerateStrategy(oldTableRuleConfig.getKeyGenerateStrategy());
                        newTableRuleConfigList.add(newTableRuleConfig);
                    } else {
                        newTableRuleConfigList.add(oldTableRuleConfig);
                    }
                });
                newAlgorithmConfig.setTables(newTableRuleConfigList);
                newAlgorithmConfig.setAutoTables(oldAlgorithmConfig.getAutoTables());
                newAlgorithmConfig.setBindingTableGroups(oldAlgorithmConfig.getBindingTableGroups());
                newAlgorithmConfig.setBroadcastTables(oldAlgorithmConfig.getBroadcastTables());
                newAlgorithmConfig.setDefaultDatabaseShardingStrategy(oldAlgorithmConfig.getDefaultDatabaseShardingStrategy());
                newAlgorithmConfig.setDefaultTableShardingStrategy(oldAlgorithmConfig.getDefaultTableShardingStrategy());
                newAlgorithmConfig.setDefaultKeyGenerateStrategy(oldAlgorithmConfig.getDefaultKeyGenerateStrategy());
                newAlgorithmConfig.setDefaultShardingColumn(oldAlgorithmConfig.getDefaultShardingColumn());
                newAlgorithmConfig.setShardingAlgorithms(oldAlgorithmConfig.getShardingAlgorithms());
                newAlgorithmConfig.setKeyGenerators(oldAlgorithmConfig.getKeyGenerators());
                newRuleConfigList.add(newAlgorithmConfig);
            }
        }
        // update context
        String schemaName = "logic_db";
        contextManager.alterRuleConfiguration(schemaName, newRuleConfigList);
    }
    /**
     * 创建分表2
     * @param logicTableName  逻辑表
     * @param resultTableName 真实表名，例：t_user_202201
     * @return 创建结果（true创建成功，false未创建）
     */
    public static boolean createShardingTable(String logicTableName, String resultTableName) {
        // 根据日期判断，当前月份之后分表不提前创建
        String month = resultTableName.replace(logicTableName + TABLE_SPLIT_SYMBOL,"");
        YearMonth shardingMonth = YearMonth.parse(month, DateTimeFormatter.ofPattern("yyyyMM"));
        if (shardingMonth.isAfter(YearMonth.now())) {
            return false;
        }
        synchronized (logicTableName.intern()) {
            // 缓存中无此表，则建表并添加缓存
            executeSql(Collections.singletonList("CREATE TABLE IF NOT EXISTS " + resultTableName + " LIKE " + logicTableName + ";"));
        }
        return true;
    }
    /**
     * 执行SQL
     * @param sqlList SQL集合
     */
    private static void executeSql(List<String> sqlList) {
        if (StringUtils.isEmpty(DATASOURCE_URL) || StringUtils.isEmpty(DATASOURCE_USERNAME) || StringUtils.isEmpty(DATASOURCE_PASSWORD)) {
            log.error(">>>>>>>>>> 【ERROR】数据库连接配置有误，请稍后重试，URL:{}, username:{}, password:{}", DATASOURCE_URL, DATASOURCE_USERNAME, DATASOURCE_PASSWORD);
            throw new IllegalArgumentException("数据库连接配置有误，请稍后重试");
        }
        try (Connection conn = DriverManager.getConnection(DATASOURCE_URL, DATASOURCE_USERNAME, DATASOURCE_PASSWORD)) {
            try (Statement st = conn.createStatement()) {
                conn.setAutoCommit(false);
                for (String sql : sqlList) {
                    st.execute(sql);
                }
            } catch (Exception e) {
                conn.rollback();
                log.error(">>>>>>>>>> 【ERROR】数据表创建执行失败，请稍后重试，原因：{}", e.getMessage(), e);
                throw new IllegalArgumentException("数据表创建执行失败，请稍后重试");
            }
        } catch (SQLException e) {
            log.error(">>>>>>>>>> 【ERROR】数据库连接失败，请稍后重试，原因：{}", e.getMessage(), e);
            throw new IllegalArgumentException("数据库连接失败，请稍后重试");
        }
    }
}
```

### 5.ShardingTablesLoadRunner.java 初始化缓存类

```java
package com.demo.module.config.sharding;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.demo.module.entity.User;
import com.demo.module.service.UserService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import javax.annotation.Resource;
import java.time.LocalDateTime;
/**
 * <p> @Title ShardingTablesLoadRunner
 * <p> @Description 项目启动后，读取已有分表，进行缓存
 *
 * @author ACGkaka
 * @date 2022/12/20 15:41
 */
@Slf4j
@Order(value = 1) // 数字越小，越先执行
@Component
public class ShardingTablesLoadRunner implements CommandLineRunner {
    @Resource
    private UserService userService;
    @Override
    public void run(String... args) {
        // 读取已有分表，进行缓存
        LambdaQueryWrapper<User> queryWrapper = new LambdaQueryWrapper<>();
        queryWrapper.eq(User::getCreateTime, LocalDateTime.now()).last("limit 1");
        userService.list(queryWrapper);
        log.info(">>>>>>>>>> 【ShardingTablesLoadRunner】缓存已有分表成功 <<<<<<<<<<");
    }
}
```

### 6.SpringUtil.java Spring工具类

```java
package com.demo.module.utils;
import org.springframework.beans.BeansException;
import org.springframework.context.ApplicationContext;
import org.springframework.context.ApplicationContextAware;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;
/**
 * <p> @Title SpringUtil
 * <p> @Description Spring工具类
 *
 * @author ACGkaka
 * @date 2022/12/20 14:39
 */
@Component
public class SpringUtil implements ApplicationContextAware {
    private static ApplicationContext applicationContext = null;
    @Override
    public void setApplicationContext(ApplicationContext applicationContext) throws BeansException {
        SpringUtil.applicationContext = applicationContext;
    }
    public static ApplicationContext getApplicationContext() {
        return SpringUtil.applicationContext;
    }
    public static <T> T getBean(Class<T> cla) {
        return applicationContext.getBean(cla);
    }
    public static <T> T getBean(String name, Class<T> cal) {
        return applicationContext.getBean(name, cal);
    }
    public static String getProperty(String key) {
        return applicationContext.getBean(Environment.class).getProperty(key);
    }
}
```

## 五、测试

### 1.测试代码

```java
package com.demo;
import com.demo.module.entity.User;
import com.demo.module.service.UserService;
import com.github.pagehelper.PageHelper;
import com.github.pagehelper.PageInfo;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
@SpringBootTest
class SpringbootDemoApplicationTests {
    private final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
    @Autowired
    private UserService userService;
    @Test
    void saveTest() {
        List<User> user1s = new ArrayList<>(3);
        LocalDateTime time1 = LocalDateTime.parse("2022-01-01 00:00:00", DATE_TIME_FORMATTER);
        LocalDateTime time2 = LocalDateTime.parse("2022-02-01 00:00:00", DATE_TIME_FORMATTER);
        user1s.add(new User("ACGkaka_1", "123456", 10, time1, time1));
        user1s.add(new User("ACGkaka_2", "123456", 11, time2, time2));
        userService.saveBatch(user1s);
    }
    @Test
    void listTest() {
        PageHelper.startPage(1, 1);
        List<User> user1s = userService.list();
        PageInfo<User> pageInfo = new PageInfo<>(user1s);
        System.out.println(">>>>>>>>>> 【Result】<<<<<<<<<< ");
        System.out.println(pageInfo);
    }
}
```

### 2.测试结果

新增和查询可以正常分页查询，测试成功。

## 六、代码地址

> 地址：https://gitee.com/acgkaka/SpringBootExamples/tree/master/springboot-sharding-jdbc-month-5.3.0

整理完毕，完结撒花~ 🌻

参考地址：

**1、** ShardingSphere5.3系列升级解读：Spring配置升级指南，https://blog.csdn.net/ShardingSphere/article/details/128910559；
