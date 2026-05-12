# 08、FlinkSQL - 校验FlinkSQL
- 来源：https://ddkk.com/zhuanlan/bigdata/flink/3/8.html
- 分类：大数据框架
- 分组：教程目录
FlinkSQL 和常见的SQL一样，也分为 DDL,DML,DQL,DCL。

本文的主要内容是探讨如何利用FlinkAPI 对多行SQL语句进行校验。

> SQL语言共分为四大类：数据查询语言DQL，数据操纵语言DML，数据定义语言DDL，数据控制语言DCL。

以下是几个例子

DDL
DML
DQL
DCL

CREATE TABLE...
INSERT/UPDATE/DELETE...
SELECT
GRANT ROLLBACK/COMMNIT

## 校验

校验可以利用Calcite 结合Flink的一些API来进行校验。

## Parser

```java
org.apache.flink.table.delegation.Parser
public interface Parser {
    /**
     * Entry point for parsing SQL queries expressed as a String.
     *
     * <p><b>Note:</b>If the created {@link Operation} is a {@link QueryOperation} it must be in a
     * form that will be understood by the {@link Planner#translate(List)} method.
     *
     * <p>The produced Operation trees should already be validated.
     *
     * @param statement the SQL statement to evaluate
     * @return parsed queries as trees of relational {@link Operation}s
     * @throws org.apache.flink.table.api.SqlParserException when failed to parse the statement
     */
    List<Operation> parse(String statement);
    /**
     * Entry point for parsing SQL identifiers expressed as a String.
     *
     * @param identifier the SQL identifier to parse
     * @return parsed identifier
     * @throws org.apache.flink.table.api.SqlParserException when failed to parse the identifier
     */
    UnresolvedIdentifier parseIdentifier(String identifier);
    /**
     * Entry point for parsing SQL expressions expressed as a String.
     *
     * @param sqlExpression the SQL expression to parse
     * @param inputSchema the schema of the fields in sql expression
     * @return resolved expression
     * @throws org.apache.flink.table.api.SqlParserException when failed to parse the sql expression
     */
    ResolvedExpression parseSqlExpression(String sqlExpression, TableSchema inputSchema);
}
org.apache.flink.table.planner.delegation.ParserImpl
```

### 如何获取这个Parser?

```java
//1. 先创建ExecutionEnvironment
StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
EnvironmentSettings settings = EnvironmentSettings.newInstance()
	.useBlinkPlanner()
	.inStreamingMode()
	.build();
tableEnv = StreamTableEnvironment.create(env, settings);
//tableEnv.registerCatalog...
//2. 从这个TableEnv中获取ParserImpl
Parser parserImpl = ((TableEnvironmentImpl) tableEnv).getParser();
```

## 思考

有了这个Parser就可以校验单条SQL了。那么如果有多条语句怎么校验？

## 多行SQL校验

有两种思路

**1、** 用换行符号分割，一般`;\n`作为一条SQL；

**2、** 用Calcite的API进行分割；

这里只讲述Calcite的方式

## 用Calcite进行多条语句分割

```java
SqlParser.Config sqlParserConfig = ...
SqlParser calciteSqlParser = SqlParser.create(sql, sqlParserConfig);
SqlNodeList sqlNodes = calciteSqlParser.parseStmtList();
```

这里就获得了SqlNodes，每一个SqlNode就是一行语句。

## 如何对SqlNode进行校验

这里就有一个问题:

***org.apache.flink.table.delegation.Parser***

的方法都是针对SQL 字符串的，形参不是SqlNode。

```java
//ParserImpl的方法
    @Override
    public List<Operation> parse(String statement) {
        CalciteParser parser = calciteParserSupplier.get();
        FlinkPlannerImpl planner = validatorSupplier.get();
        // parse the sql query
        SqlNode parsed = parser.parse(statement);
        Operation operation =
                SqlToOperationConverter.convert(planner, catalogManager, parsed)
                        .orElseThrow(() -> new TableException("Unsupported query: " + statement));
        return Collections.singletonList(operation);
    }
```

可以看到这里也是用的calciteParser把Statement转换成SqlNode。我们已经转换成SqlNode了，也就是直接使用

```java
SqlToOperationConverter.convert(planner, catalogManager, parsed)
```

即可。

## Planner和catalogManager，如何获取

这里的Planner是`FlinkPlannerImpl`，只能是这个，**他没有接口**。

前面提到的`tableEnv`实际上就是`TableEnvironmentImpl`类的实例了。

可以通过`TableEnvironmentImpl`类来获取`CatalogManager`和`Planner`

这个就是`StreamPlanner`了，他是`Planner`接口的实现类。

利用这个`StreamPlanner`可以创建一个`FlinkPlannerImpl`实例。

```java
CatalogManager catalogManager = ((TableEnvironmentImpl) tableEnv).getCatalogManager();
StreamPlanner planner = (StreamPlanner) ((TableEnvironmentImpl) tableEnv).getPlanner();
//创建实例
FlinkPlannerImpl flinkPlanner = planner.createFlinkPlanner();
```

## 最终校验的表达式

```java
SqlNode node = ...
Optional<Operation> operationOptional = SqlToOperationConverter.convert(planner, catalogManager, node)
```

通过InstanceOf 可以判断Operation具体的类别，看看是对应DML，DQL，DDL的哪一种。
