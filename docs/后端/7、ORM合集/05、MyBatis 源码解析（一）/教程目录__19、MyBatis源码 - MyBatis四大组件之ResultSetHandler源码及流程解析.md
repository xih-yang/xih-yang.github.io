# 19、MyBatis源码 - MyBatis四大组件之ResultSetHandler源码及流程解析
- 来源：https://ddkk.com/zhuanlan/orm/mybatis/5/19.html
- 分类：ORM框架
- 分组：教程目录
### ResultSetHandler

之前说过在创建StatementHandler处理器时会同时创建ParameterHandler及ResultSetHandler。

ResultSetHandler是Mybatis的核心组件，主要负责将结果集resultSets转化成结果列表（或cursor）和处理储存过程的输出。

### 源码分析

#### ResultSet

在原生JDBC查询的代码中，使用Statement进行操作，会返回ResultSet对象

。

ResultSet也是java.sql中的接口，它表示通过执行查询数据库的语句生成的结果集对象，在JDBC的操作中数据库的所有查询记录将使用ResultSet进行接收。

我们获取到ResultSet后，就可以将其转换为程序中的JAVA对象进行数据展示，但是原生的操作非常繁琐，所以Mybatis提供了ResultSet处理器，我们只需要定义好返回类型，Mybatis就可以自动进行转换映射了。

#### ResultSetHandler

ResultSetHandler是一个接口，也只有一个实现类，ResultSetHandler定义了一些处理结果集的方法。

```java
/**
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * 结果集处理器
 */
public interface ResultSetHandler {
    //处理结果集
    <E> List<E> handleResultSets(Statement stmt) throws SQLException;
    // 处理游标
    <E> Cursor<E> handleCursorResultSets(Statement stmt) throws SQLException;
    //处理结果集
    void handleOutputParameters(CallableStatement cs) throws SQLException;
}
```

#### DefaultResultSetHandler

DefaultResultSetHandler是默认的结果集处理器，其中实现了很多处理一对一、一对多、嵌套查询等结果集的处理方法。实在太多了，后面再分析某一个。

### 流程分析

#### 1. 创建ResultSetHandler

创建StatementHandler时，构造方法进入BaseStatementHandler，调用configuration的方法开始创建ResultSetHandler处理器。

之后会调用DefaultResultSetHandler的构造方法，并且也使用了拦截器包装。

DefaultResultSetHandler构造方法中，也设置了执行器、configuration、boundSql等重要参数，其中有一个reflectorFactory反射工厂，因为转为我们需要的对象是通过反射机制来实现的。

#### 2. 结果集处理

执行了查询之后，数据库的结果集就设置到了Statement对象中，接下来就是需要把Statement中的数据转换处理了。

首先调用DefaultResultSetHandler的handleResultSets方法处理Statement。

#### 3. 结果集包装

handleResultSets首先调用getFirstResultSet获取ResultSetWrapper。

```java
    // ResultSet包装
    private ResultSetWrapper getFirstResultSet(Statement stmt) throws SQLException {
        // 获取ResultSet
        ResultSet rs = stmt.getResultSet();
        while (rs == null) {
            // move forward to get the first resultset in case the driver
            // doesn't return the resultset as the first result (HSQLDB 2.1)
            // 是否有多个ResultSet
            if (stmt.getMoreResults()) {
                rs = stmt.getResultSet();
            } else {
                if (stmt.getUpdateCount() == -1) {
                    // no more results. Must be no resultset
                    break;
                }
            }
        }
        // 包装
        return rs != null ? new ResultSetWrapper(rs, configuration) : null;
    }
```

调用ResultSetWrapper构造方法创建包装类，会封装当前查询返回的列名、数据类型等。

```java
    public ResultSetWrapper(ResultSet rs, Configuration configuration) throws SQLException {
        super();
        // 类型处理器
        this.typeHandlerRegistry = configuration.getTypeHandlerRegistry();
        this.resultSet = rs;
        // 元数据 ，表名、列名、数据库中数据类型等
        // com.mysql.cj.result.Field@668a32a4[dbName=angel_admin,tableName=base_user,originalTableName=base_user,columnName=user_id,originalColumnName=user_id,mysqlType=8(FIELD_TYPE_BIGINT),sqlType=-5,flags= AUTO_INCREMENT PRIMARY_KEY, charsetIndex=63, charsetName=ISO-8859-1]
        final ResultSetMetaData metaData = rs.getMetaData();
        // 列数 14
        final int columnCount = metaData.getColumnCount();
        // 循环所有列，从configuration配置中，获取对应信息
        for (int i = 1; i <= columnCount; i++) {
            // 列名集合
            columnNames.add(configuration.isUseColumnLabel() ? metaData.getColumnLabel(i) : metaData.getColumnName(i));
            // JDBC类型集合
            jdbcTypes.add(JdbcType.forCode(metaData.getColumnType(i)));
            // 返回的数据类型集合
            classNames.add(metaData.getColumnClassName(i));
        }
    }
```

#### 4. 获取ResultMap

下一步通过mappedStatement获取我们配置的ResultMap。

#### 5. 反射创建对象

可以看出返回对象使用反射机制创建的。

#### 6. 返回数据

经过比较复杂的结果集处理，返回了我们想要的数据。
