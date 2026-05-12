# 18、执行SQL分析打印
- 来源：https://ddkk.com/zhuanlan/orm/mybatisplus/1/18.html
- 分类：ORM框架
- 分组：扩展
> 该功能依赖 p6spy 组件，完美的输出打印 SQL 及执行时长 3.1.0 以上版本

示例工程：

👉[mybatis-plus-sample-crud(opens new window)](https://gitee.com/baomidou/mybatis-plus-samples/tree/master/mybatis-plus-sample-crud)

- p6spy 依赖引入

Maven：

```xml
<dependency>
  <groupId>p6spy</groupId>
  <artifactId>p6spy</artifactId>
  <version>最新版本</version>
</dependency>
```

Gradle：

```java
compile group: 'p6spy', name: 'p6spy', version: '最新版本'
```

- application.yml 配置：

```java
spring:
  datasource:
    driver-class-name: com.p6spy.engine.spy.P6SpyDriver
    url: jdbc:p6spy:h2:mem:test
    ...
```

- spy.properties 配置：

```java
#3.2.1以上使用
modulelist=com.baomidou.mybatisplus.extension.p6spy.MybatisPlusLogFactory,com.p6spy.engine.outage.P6OutageFactory
#3.2.1以下使用或者不配置
#modulelist=com.p6spy.engine.logging.P6LogFactory,com.p6spy.engine.outage.P6OutageFactory
# 自定义日志打印
logMessageFormat=com.baomidou.mybatisplus.extension.p6spy.P6SpyLogger
#日志输出到控制台
appender=com.baomidou.mybatisplus.extension.p6spy.StdoutLogger
# 使用日志系统记录 sql
#appender=com.p6spy.engine.spy.appender.Slf4JLogger
# 设置 p6spy driver 代理
deregisterdrivers=true
# 取消JDBC URL前缀
useprefix=true
# 配置记录 Log 例外,可去掉的结果集有error,info,batch,debug,statement,commit,rollback,result,resultset.
excludecategories=info,debug,result,commit,resultset
# 日期格式
dateformat=yyyy-MM-dd HH:mm:ss
# 实际驱动可多个
#driverlist=org.h2.Driver
# 是否开启慢SQL记录
outagedetection=true
# 慢SQL记录标准 2 秒
outagedetectioninterval=2
```

注意！

- driver-class-name 为 p6spy 提供的驱动类
- url 前缀为 jdbc:p6spy 跟着冒号为对应数据库连接地址
- 打印出 sql 为 null,在 excludecategories 增加 commit
- 批量操作不打印 sql,去除 excludecategories 中的 batch
- 批量操作打印重复的问题请使用 MybatisPlusLogFactory (3.2.1 新增）
- 该插件有性能损耗，不建议生产环境使用。

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有

> 来源：MyBatis-Plus | https://baomidou.com
