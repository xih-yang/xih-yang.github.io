# 06、Mybatis-Plus入门 - 防止全表更新与删除插件BlockAttackInnerInterceptor
- 来源：https://ddkk.com/zhuanlan/orm/mybatisplus/5/6.html
- 分类：ORM框架
- 分组：教程目录
### 前言

业务bug或者漏洞可能导致把整个表都更新或者删除，在生产环境中这是十分危险的事情，plus也考虑到了这一点，提供了防止全表更新与删除插件

```java
public class BlockAttackInnerInterceptor extends JsqlParserSupport implements InnerInterceptor {
    @Override
    public void beforePrepare(StatementHandler sh, Connection connection, Integer transactionTimeout) {
        PluginUtils.MPStatementHandler handler = PluginUtils.mpStatementHandler(sh);
        MappedStatement ms = handler.mappedStatement();
        SqlCommandType sct = ms.getSqlCommandType();
        if (sct == SqlCommandType.UPDATE || sct == SqlCommandType.DELETE) {
            if (InterceptorIgnoreHelper.willIgnoreBlockAttack(ms.getId())) return;
            BoundSql boundSql = handler.boundSql();
            parserMulti(boundSql.getSql(), null);
        }
    }
    @Override
    protected void processDelete(Delete delete, int index, String sql, Object obj) {
        this.checkWhere(delete.getTable().getName(), delete.getWhere(), "Prohibition of full table deletion");
    }
    @Override
    protected void processUpdate(Update update, int index, String sql, Object obj) {
        this.checkWhere(update.getTable().getName(), update.getWhere(), "Prohibition of table update operation");
    }
    protected void checkWhere(String tableName, Expression where, String ex) {
        Assert.isFalse(this.fullMatch(where, this.getTableLogicField(tableName)), ex);
    }
    private boolean fullMatch(Expression where, String logicField) {
        if (where == null) {
            return true;
        }
        if (StringUtils.isNotBlank(logicField) && (where instanceof BinaryExpression)) {
            BinaryExpression binaryExpression = (BinaryExpression) where;
            if (StringUtils.equals(binaryExpression.getLeftExpression().toString(), logicField) || StringUtils.equals(binaryExpression.getRightExpression().toString(), logicField)) {
                return true;
            }
        }
        if (where instanceof EqualsTo) {
            // example: 1=1
            EqualsTo equalsTo = (EqualsTo) where;
            return StringUtils.equals(equalsTo.getLeftExpression().toString(), equalsTo.getRightExpression().toString());
        } else if (where instanceof NotEqualsTo) {
            // example: 1 != 2
            NotEqualsTo notEqualsTo = (NotEqualsTo) where;
            return !StringUtils.equals(notEqualsTo.getLeftExpression().toString(), notEqualsTo.getRightExpression().toString());
        } else if (where instanceof OrExpression) {
            OrExpression orExpression = (OrExpression) where;
            return fullMatch(orExpression.getLeftExpression(), logicField) || fullMatch(orExpression.getRightExpression(), logicField);
        } else if (where instanceof AndExpression) {
            AndExpression andExpression = (AndExpression) where;
            return fullMatch(andExpression.getLeftExpression(), logicField) && fullMatch(andExpression.getRightExpression(), logicField);
        } else if (where instanceof Parenthesis) {
            // example: (1 = 1)
            Parenthesis parenthesis = (Parenthesis) where;
            return fullMatch(parenthesis.getExpression(), logicField);
        }
        return false;
    }
    /**
     * 获取表名中的逻辑删除字段
     *
     * @param tableName 表名
     * @return 逻辑删除字段
     */
    private String getTableLogicField(String tableName) {
        if (StringUtils.isBlank(tableName)) {
            return StringUtils.EMPTY;
        }
        TableInfo tableInfo = TableInfoHelper.getTableInfo(tableName);
        if (tableInfo == null || !tableInfo.isWithLogicDelete() || tableInfo.getLogicDeleteFieldInfo() == null) {
            return StringUtils.EMPTY;
        }
        return tableInfo.getLogicDeleteFieldInfo().getColumn();
    }
}
```

### 测试案例

**1、** 创建全表删除与更新接口，先测试发现可以删除或更新表所有数据；

```java
    @GetMapping("deleteAll")
    public Object deleteAll() {
        int delete = orderTblMapper.delete(null);
        return "删除成功";
    }
    @GetMapping("updateAll")
    public Object updateAll() {
        LambdaUpdateWrapper<OrderTbl> updateWrapper = new LambdaUpdateWrapper<OrderTbl>().set(OrderTbl::getCommodityCode, "005");
        orderTblMapper.update(null, updateWrapper);
        return "修改成功";
    }
```

**1、** 配置类添加拦截插件；

```java
        // 添加防止全表更新与删除插件
        BlockAttackInnerInterceptor blockAttackInnerInterceptor=new BlockAttackInnerInterceptor();
        interceptor.addInnerInterceptor(blockAttackInnerInterceptor);
```

**1、** 测试：发现全表更新或删除已被拦截，无法执行；
