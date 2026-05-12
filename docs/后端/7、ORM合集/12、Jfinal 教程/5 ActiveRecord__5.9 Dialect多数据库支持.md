# 5.9 Dialect多数据库支持
- 来源：https://ddkk.com/zhuanlan/orm/jfinal/49.html
- 分类：ORM框架
- 分组：5 ActiveRecord
目前ActiveRecordPlugin提供了MysqlDialect、OracleDialect、PostgresqlDialect、SqlServerDialect、Sqlite3Dialect、AnsiSqlDialect实现类。MysqlDialect与OracleDialect分别实现对Mysql与Oracle的支持，AnsiSqlDialect实现对遵守ANSI SQL数据库的支持。以下是数据库Dialect的配置代码：

```java
public class DemoConfig extends JFinalConfig {
  public void configPlugin(Plugins me) {
    ActiveRecordPlugin arp = new ActiveRecordPlugin(…);
    me.add(arp);
    // 配置Postgresql方言
    arp.setDialect(new PostgresqlDialect());
  }
}
```

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有

> JFinal 官方 | https://jfinal.com
