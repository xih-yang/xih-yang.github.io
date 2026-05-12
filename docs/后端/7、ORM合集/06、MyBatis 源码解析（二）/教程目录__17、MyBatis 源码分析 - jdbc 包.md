# 17、MyBatis 源码分析 - jdbc 包
- 来源：https://ddkk.com/zhuanlan/orm/mybatis/7/17.html
- 分类：ORM框架
- 分组：教程目录
JDBC 包算是一个十分独立的包，因为它没有什么外部的依赖，基本上可以作为一个工具类提供给外部使用。而且在 Mybatis 内部也并没有使到这个 JDBC 包中的内容，因为这个包主要是给使用这个框架的人准备的。

它提供了通过代码动态拼接数据库操作语句和执行脚本的能力。

```java
    // 动态拼接数据库操作语句
    SQL sql = new SQL();
    sql.SELECT("id", "name", "age", "email")
        .FROM("user")
        .WHERE("id = 1");
    // 执行脚本
    SqlRunner runner = new SqlRunner(conn);
    System.out.println(runner.selectOne(sql.toString()));
```

### AbstractSQL 和 SQL

AbstractSQL 是一个抽象类，它只包含一个抽象方法 getSelf。**SQL 作为内置的实现类，实现了这个方法并返回本身，可以实现链式调用**。

#### SafeAppendable

`SafeAppendable` 只是一个拼接器，不过它本身并不具备字符串拼接的能力，而是使用的 `StringBuilder`，并在其基础上增加了一个 `isEmpty` 方法。

代码整体上也是非常简单的，所以就不多讲了。

```java
  private static class SafeAppendable {
    // 本身不拼接字符串，而是使用调用者传递进来的方法
    private final Appendable appendable;
    // 用来判断是否为空
    private boolean empty = true;
    public SafeAppendable(Appendable a) {
      super();
      this.appendable = a;
    }
    public SafeAppendable append(CharSequence s) {
      try {
        if (empty && s.length() > 0) {
          empty = false;
        }
        appendable.append(s);
      } catch (IOException e) {
        throw new RuntimeException(e);
      }
      return this;
    }
    public boolean isEmpty() {
      return empty;
    }
  }
```

#### SQLStatement

在`SQLStatement` 中保存了待拼接 SQL 的所有组成部分。

```java
    // 当前 SQL 语句类型
    StatementType statementType;
    // 保存 UPDATE 语句中要修改的值
    List<String> sets = new ArrayList<>();
    // 保存 SELECT 语句中要查询的字段
    List<String> select = new ArrayList<>();
    // 保存要操作的表名称，多张表通过 , 连接
    List<String> tables = new ArrayList<>();
    // 保存 SELECT 语句中要 JOIN 的语句
    List<String> join = new ArrayList<>();
    // 保存 SELECT 语句中要 INNER JOIN 的语句
    List<String> innerJoin = new ArrayList<>();
    // 保存 SELECT 语句中要 OUTER JOIN 的语句
    List<String> outerJoin = new ArrayList<>();
    // 保存 SELECT 语句中要 LEFT JOIN 的语句
    List<String> leftOuterJoin = new ArrayList<>();
    // 保存 SELECT 语句中要 RIGHT JOIN 的语句
    List<String> rightOuterJoin = new ArrayList<>();
    // 保存 WHERE 语句后面要拼接的条件语句
    List<String> where = new ArrayList<>();
    // 保存 HAVING 语句后面要拼接的条件语句
    List<String> having = new ArrayList<>();
    // 保存 GROUP BY 语句后面要拼接的分组语句
    List<String> groupBy = new ArrayList<>();
    // 保存 ORDER BY 语句后面要拼接的排序字段
    List<String> orderBy = new ArrayList<>();
    // 暂时没有用上
    List<String> lastList = new ArrayList<>();
    // 保存 INSERT 语句中要插入的字段名称
    List<String> columns = new ArrayList<>();
    // 保存 INSERT 语句中要插入的值
    List<List<String>> valuesList = new ArrayList<>();
    // 是否去重
    boolean distinct;
    // 偏移量
    String offset;
    // 限制的记录条数
    String limit;
    // LIMIT 策略，不同类型的数据库，实现 LIMIT 的方式不同
    LimitingRowsStrategy limitingRowsStrategy = LimitingRowsStrategy.NOP;
```

它可以根据当前的 SQL 类型，拼接出对应的可执行 SQL 语句。

```java
    public String sql(Appendable a) {
      SafeAppendable builder = new SafeAppendable(a);
      // 没有设置语句类型，直接返回 null
      if (statementType == null) {
        return null;
      }
      String answer;
      // 根据不同的语句类型选择不同的拼接方法
      switch (statementType) {
        case DELETE:
          answer = deleteSQL(builder);
          break;
        case INSERT:
          answer = insertSQL(builder);
          break;
        case SELECT:
          answer = selectSQL(builder);
          break;
        case UPDATE:
          answer = updateSQL(builder);
          break;
        default:
          answer = null;
      }
      return answer;
    }
```

由于四种类型的语句拼接步骤基本和实际的一致，所以在这里我只会分析一下查询语句的拼接，其他的语句基本上自己也能看得懂了。

```java
    private String selectSQL(SafeAppendable builder) {
      // 如果要去重的话，则需要多拼接一个 DISTINCT
      if (distinct) {
        sqlClause(builder, "SELECT DISTINCT", select, "", "", ", ");
      } else {
        sqlClause(builder, "SELECT", select, "", "", ", ");
      }
      // 拼接 FROM 后面的内容
      sqlClause(builder, "FROM", tables, "", "", ", ");
      // 拼接 JOIN 语句
      joins(builder);
      // 拼接 WHERE 以及后面的条件语句
      sqlClause(builder, "WHERE", where, "(", ")", " AND ");
      // 拼接 GROUP BY 以及后面的分组语句
      sqlClause(builder, "GROUP BY", groupBy, "", "", ", ");
      // 拼接 HAVING 以及后面的条件语句
      sqlClause(builder, "HAVING", having, "(", ")", " AND ");
      // 拼接 ORDER BY 以及后面的排序字段
      sqlClause(builder, "ORDER BY", orderBy, "", "", ", ");
      // 拼接结果约束语句
      limitingRowsStrategy.appendClause(builder, offset, limit);
      return builder.toString();
    }
```

### SqlRunner

`SqlRunner` 是可以用来直接执行 SQL 语句的工具类。

```java
    SqlRunner runner = new SqlRunner(conn);
    runner.selectOne("    SELECT id, name, age, email FROM user WHERE id = ?", 1);
```

注：如果是 `args` 是 `null` 的话，就需要使用对应的枚举类来代替。

#### Null 枚举

```java
  BOOLEAN(new BooleanTypeHandler(), JdbcType.BOOLEAN),
  BYTE(new ByteTypeHandler(), JdbcType.TINYINT),
  SHORT(new ShortTypeHandler(), JdbcType.SMALLINT),
  INTEGER(new IntegerTypeHandler(), JdbcType.INTEGER),
  LONG(new LongTypeHandler(), JdbcType.BIGINT),
  FLOAT(new FloatTypeHandler(), JdbcType.FLOAT),
  DOUBLE(new DoubleTypeHandler(), JdbcType.DOUBLE),
  BIGDECIMAL(new BigDecimalTypeHandler(), JdbcType.DECIMAL),
  STRING(new StringTypeHandler(), JdbcType.VARCHAR),
  CLOB(new ClobTypeHandler(), JdbcType.CLOB),
  LONGVARCHAR(new ClobTypeHandler(), JdbcType.LONGVARCHAR),
  BYTEARRAY(new ByteArrayTypeHandler(), JdbcType.LONGVARBINARY),
  BLOB(new BlobTypeHandler(), JdbcType.BLOB),
  LONGVARBINARY(new BlobTypeHandler(), JdbcType.LONGVARBINARY),
  OBJECT(new ObjectTypeHandler(), JdbcType.OTHER),
  OTHER(new ObjectTypeHandler(), JdbcType.OTHER),
  TIMESTAMP(new DateTypeHandler(), JdbcType.TIMESTAMP),
  DATE(new DateOnlyTypeHandler(), JdbcType.DATE),
  TIME(new TimeOnlyTypeHandler(), JdbcType.TIME),
  SQLTIMESTAMP(new SqlTimestampTypeHandler(), JdbcType.TIMESTAMP),
  SQLDATE(new SqlDateTypeHandler(), JdbcType.DATE),
  SQLTIME(new SqlTimeTypeHandler(), JdbcType.TIME);
  private TypeHandler<?> typeHandler;
  private JdbcType jdbcType;
```

### ScriptRunner

`ScriptRunner` 是 Mybatis 提供的直接执行 SQL 脚本的工具类。

```java
ScriptRunner runner = new ScriptRunner();
runner.runScript(Resource.getResourceAsReader("script.sql"));
```

关键代码如下：

```java
  private void executeFullScript(Reader reader) {
    StringBuilder script = new StringBuilder();
    try {
      // 保存脚本
      BufferedReader lineReader = new BufferedReader(reader);
      String line;
      while ((line = lineReader.readLine()) != null) {
        script.append(line);
        script.append(LINE_SEPARATOR);
      }
      String command = script.toString();
      println(command);
      // 执行命令
      executeStatement(command);
      // 如果没有启用自动提交，则执行提交操作
      commitConnection();
    } catch (Exception e) {
      String message = "Error executing: " + script + ".  Cause: " + e;
      printlnError(message);
      throw new RuntimeSqlException(message, e);
    }
  }
```

由于JDBC 包的内容并不多，所以也没有过分的去解析每一行代码，小伙伴们只需要了解有这么一个东西就好了，在需要用到的时候，在详细的去了解吧。
