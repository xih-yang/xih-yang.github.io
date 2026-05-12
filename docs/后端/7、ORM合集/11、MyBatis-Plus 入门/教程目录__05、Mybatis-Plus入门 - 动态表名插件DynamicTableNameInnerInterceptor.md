# 05、Mybatis-Plus入门 - 动态表名插件DynamicTableNameInnerInterceptor
- 来源：https://ddkk.com/zhuanlan/orm/mybatisplus/5/5.html
- 分类：ORM框架
- 分组：教程目录
### 动态表名

**描述**： Sql执行时，动态的修改表名

**简单业务场景**： 日志或者其他数据量大的表，通过日期进行了水平分表，需要通过日期参数，动态的查询数据。

```java
@Data
@NoArgsConstructor
@AllArgsConstructor
@SuppressWarnings({
     "rawtypes"})
public class DynamicTableNameInnerInterceptor implements InnerInterceptor {
    private Map<String, TableNameHandler> tableNameHandlerMap;
    @Override
    public void beforeQuery(Executor executor, MappedStatement ms, Object parameter, RowBounds rowBounds, ResultHandler resultHandler, BoundSql boundSql) throws SQLException {
        PluginUtils.MPBoundSql mpBs = PluginUtils.mpBoundSql(boundSql);
        if (InterceptorIgnoreHelper.willIgnoreDynamicTableName(ms.getId())) return;
        mpBs.sql(this.changeTable(mpBs.sql()));
    }
    @Override
    public void beforePrepare(StatementHandler sh, Connection connection, Integer transactionTimeout) {
        PluginUtils.MPStatementHandler mpSh = PluginUtils.mpStatementHandler(sh);
        MappedStatement ms = mpSh.mappedStatement();
        SqlCommandType sct = ms.getSqlCommandType();
        if (sct == SqlCommandType.INSERT || sct == SqlCommandType.UPDATE || sct == SqlCommandType.DELETE) {
            if (InterceptorIgnoreHelper.willIgnoreDynamicTableName(ms.getId())) return;
            PluginUtils.MPBoundSql mpBs = mpSh.mPBoundSql();
            mpBs.sql(this.changeTable(mpBs.sql()));
        }
    }
    protected String changeTable(String sql) {
        TableNameParser parser = new TableNameParser(sql);
        List<TableNameParser.SqlToken> names = new ArrayList<>();
        parser.accept(names::add);
        StringBuilder builder = new StringBuilder();
        int last = 0;
        for (TableNameParser.SqlToken name : names) {
            int start = name.getStart();
            if (start != last) {
                builder.append(sql, last, start);
                String value = name.getValue();
                TableNameHandler handler = tableNameHandlerMap.get(value);
                if (handler != null) {
                    builder.append(handler.dynamicTableName(sql, value));
                } else {
                    builder.append(value);
                }
            }
            last = name.getEnd();
        }
        if (last != sql.length()) {
            builder.append(sql.substring(last));
        }
        return builder.toString();
    }
}
```

### 测试案例

案例目标：根据传入的月份参数，动态的查询xx_月份的表

**1、** 复制几张表，并插入一些测试数据；

**2、** 实现TableNameHandler接口；

```java
public class MyTableNameHandler implements TableNameHandler {
    /**
     * @param sql       原始SQL
     * @param tableName 表名
     * @return 动态表名
     */
    @Override
    public String dynamicTableName(String sql, String tableName) {
        // 模拟获取月份参数，实际应该从参数中获取
        String[] month = {
     "", "_03", "_04"};
        // 随机获取
        int nextInt = new Random().nextInt(2);
        String dynamicTableName = "order_tbl" + month[nextInt];
        System.err.println("动态查询表：" + dynamicTableName);
        return dynamicTableName;
    }
}
```

**1、** 配置类添加插件；

```java
        // 添加动态表名插件
        DynamicTableNameInnerInterceptor dynamicTableNameInnerInterceptor=new DynamicTableNameInnerInterceptor();
        TableNameHandler tableNameHandler=new MyTableNameHandler();
        Map<String, TableNameHandler> tableNameHandlerMap=new HashMap<>();
        tableNameHandlerMap.put("order_tbl",tableNameHandler); // order_tbl表配置动态表名插件
        dynamicTableNameInnerInterceptor.setTableNameHandlerMap(tableNameHandlerMap);
        interceptor.addInnerInterceptor(dynamicTableNameInnerInterceptor);
```

**1、** 测试：后台SQL已经实现，不同的参数查询不同表的功能；
