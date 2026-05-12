# 03、Mybatis-Plus入门 - 数据权限插件DataPermissionInterceptor
- 来源：https://ddkk.com/zhuanlan/orm/mybatisplus/5/3.html
- 分类：ORM框架
- 分组：教程目录
### 前言

在plus3.4.2版本中，阅读源码时发现了一个新插件DataPermissionInterceptor，但是在官网没有相关说明，从注释数据权限处理器来看，实现的功能是数据权限。

```java
/**
 * 数据权限处理器
 *
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @since 3.4.1 +
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@ToString(callSuper = true)
@EqualsAndHashCode(callSuper = true)
@SuppressWarnings({
     "rawtypes"})
public class DataPermissionInterceptor extends JsqlParserSupport implements InnerInterceptor {
    private DataPermissionHandler dataPermissionHandler;
    @Override
    public void beforeQuery(Executor executor, MappedStatement ms, Object parameter, RowBounds rowBounds, ResultHandler resultHandler, BoundSql boundSql) throws SQLException {
        if (InterceptorIgnoreHelper.willIgnoreDataPermission(ms.getId())) return;
        PluginUtils.MPBoundSql mpBs = PluginUtils.mpBoundSql(boundSql);
        mpBs.sql(parserSingle(mpBs.sql(), ms.getId()));
    }
    @Override
    protected void processSelect(Select select, int index, String sql, Object obj) {
        PlainSelect plainSelect = (PlainSelect) select.getSelectBody();
        Expression sqlSegment = dataPermissionHandler.getSqlSegment(plainSelect.getWhere(), (String) obj);
        if (null != sqlSegment) {
            plainSelect.setWhere(sqlSegment);
        }
    }
}
```

### 源码分析

**1、** 继承抽象类JsqlParserSupport并重写processSelect方法JSqlParser是一个SQL语句解析器，它将SQL转换为Java类的可遍历层次结构plus中也引入了JSqlParser包，processSelect可以对Select语句进行处理；

**2、** 实现InnerInterceptor接口并重写beforeQuery方法InnerInterceptor是plus的插件接口，beforeQuery可以对查询语句执行前进行处理；

**3、** DataPermissionHandler作为数据权限处理器，是一个接口，提供getSqlSegment方法添加数据权限SQL片段；

**4、** 由上可知，我们只需要实现DataPermissionHandler接口，并按照业务规则处理SQL，就可以实现数据权限的功能；

```java
/**
 * 数据权限处理器
 *
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @since 3.4.1 +
 */
public interface DataPermissionHandler {
    /**
     *
     * @param where             待执行 SQL Where 条件表达式
     * @param mappedStatementId Mybatis MappedStatement Id 根据该参数可以判断具体执行方法
     * @return JSqlParser 条件表达式
     */
    Expression getSqlSegment(Expression where, String mappedStatementId);
}
```

### 使用案例

实现同一个查询接口，本门经理只能查看当前部门的所有数据，老板则能查看所有部门数据类似的功能，员工则只能查看自己数据的数据权限功能。

**1、** 创建部门枚举类；

```java
@Getter
@AllArgsConstructor
@NoArgsConstructor
public enum  DeptEnum {
    BOOS(1,"老总"),
    MANAGER_01(2,"01部门经理"),
    MANAGER_06(6,"06部门经理");
    int type;
    String desc;
}
```

**1、** 表及实体类添加部门编号；

**2、** 编写MyDataPermissionHandler类，继承DataPermissionHandler，编写数据权限处理逻辑，对SQL进行拦截处理；

```java
@Slf4j
public class MyDataPermissionHandler implements DataPermissionHandler {
    /**
     * @param where             原SQL Where 条件表达式
     * @param mappedStatementId Mapper接口方法ID
     * @return
     */
    @SneakyThrows
    @Override
    public Expression getSqlSegment(Expression where, String mappedStatementId) {
        log.info("=========================== start MyDataPermissionHandler");
        // 1. 模拟获取登录用户，从用户信息中获取部门ID
        Random random = new Random();
        int userDeptId = random.nextInt(9) + 1; // 随机部门ID 1-10 随机数
        Expression expression = null;
        log.info("=============== userDeptId:{}", userDeptId);
        if (userDeptId == DeptEnum.BOOS.getType()) {
            // 2.userDeptId为1，说明是老总，可查看所有数据无需处理
            return where;
        } else if (userDeptId == DeptEnum.MANAGER_02.getType()) {
            // 3. userDeptId为2，说明是02部门经理，可查看02部门及下属部门所有数据
            // 创建IN 表达式
            Set<String> deptIds = Sets.newLinkedHashSet(); // 创建IN范围的元素集合
            deptIds.add("2");
            deptIds.add("3");
            deptIds.add("4");
            deptIds.add("5");
            ItemsList itemsList = new ExpressionList(deptIds.stream().map(StringValue::new).collect(Collectors.toList())); // 把集合转变为JSQLParser需要的元素列表
            InExpression inExpression = new InExpression(new Column("order_tbl.dept_id"), itemsList); //  order_tbl.dept_id IN ('2', '3', '4', '5')
            return new AndExpression(where, inExpression);
        } else if (userDeptId == DeptEnum.MANAGER_06.getType()) {
            // 4. userDeptId为6，说明是06部门经理，可查看06部门及下属部门所有数据
            // 创建IN 表达式
            Set<String> deptIds = Sets.newLinkedHashSet(); // 创建IN范围的元素集合
            deptIds.add("6");
            deptIds.add("7");
            deptIds.add("8");
            deptIds.add("9");
            ItemsList itemsList = new ExpressionList(deptIds.stream().map(StringValue::new).collect(Collectors.toList())); // 把集合转变为JSQLParser需要的元素列表
            InExpression inExpression = new InExpression(new Column("order_tbl.dept_id"), itemsList);
            return new AndExpression(where, inExpression);
        } else {
            // 5. userDeptId为其他时，表示为员工级别没有下属机构，只能查看当前部门的数据
            //  = 表达式
            EqualsTo equalsTo = new EqualsTo(); // order_tbl.dept_id = userDeptId
            equalsTo.setLeftExpression(new Column("order_tbl.dept_id"));
            equalsTo.setRightExpression(new LongValue(userDeptId));
            // 创建 AND 表达式 拼接Where 和 = 表达式
            return new AndExpression(where, equalsTo); // WHERE user_id = 2 AND order_tbl.dept_id = 3
        }
    }
}
```

**1、** 配置类添加数据权限插件；

```java
        // 添加数据权限插件
        DataPermissionInterceptor dataPermissionInterceptor=new DataPermissionInterceptor();
        MyDataPermissionHandler myDataPermissionHandler=new MyDataPermissionHandler();
        // 添加自定义的数据权限处理器
        dataPermissionInterceptor.setDataPermissionHandler(myDataPermissionHandler);
        interceptor.addInnerInterceptor(dataPermissionInterceptor);
```

### 案例测试

**1、** 当部门ID为1时，查询出来所有数据；

**2、** 当部门ID为最下层机构时，只能查询到当前部门的数据；

**3、** 当为部门经理时，查到看当前及下属所有机构的数据；

**4、** 综上，通过简单的案例测试，能完成数据权限部分功能，可根据此深入，比如更深层次的按照用户、角色等绑定数据权限；

### 忽略拦截

plus提供了 @InterceptorIgnore方法对插件进行是否拦截配置，官网：该注解作用于 xxMapper.java 方法之上 各属性代表对应的插件 各属性不给值则默认为 false 设置为 true。既然此注解只能作用于Mapper，看来需要自己写一个注解，做用于service层，实现接口级别的拦截配置。。。

```java
@Documented
@Retention(RetentionPolicy.RUNTIME)
@Target({
     ElementType.TYPE, ElementType.METHOD})
public @interface InterceptorIgnore {
    /**
     * 行级租户 {@link com.baomidou.mybatisplus.extension.plugins.inner.TenantLineInnerInterceptor}
     */
    String tenantLine() default "";
    /**
     * 动态表名 {@link com.baomidou.mybatisplus.extension.plugins.inner.DynamicTableNameInnerInterceptor}
     */
    String dynamicTableName() default "";
    /**
     * 攻击 SQL 阻断解析器,防止全表更新与删除 {@link com.baomidou.mybatisplus.extension.plugins.inner.BlockAttackInnerInterceptor}
     */
    String blockAttack() default "";
    /**
     * 垃圾SQL拦截 {@link com.baomidou.mybatisplus.extension.plugins.inner.IllegalSQLInnerInterceptor}
     */
    String illegalSql() default "";
    /**
     * 数据权限 {@link com.baomidou.mybatisplus.extension.plugins.inner.DataPermissionInterceptor}
     * <p>
     * 默认关闭，需要注解打开
     */
    String dataPermission() default "1";
    /**
     * 分表 {@link com.baomidou.mybatisplus.extension.plugins.inner.ShardingInnerInterceptor}
     */
    String sharding() default "";
    /**
     * 其他的
     * <p>
     * 格式应该为:  "key"+"@"+可选项[false,true,1,0,on,off]
     * 例如: "xxx@1" 或 "xxx@true" 或 "xxx@on"
     * <p>
     * 如果配置了该属性的注解是注解在 Mapper 上的,则如果该 Mapper 的一部分 Method 需要取反则需要在 Method 上注解并配置此属性为反值
     * 例如: "xxx@1" 在 Mapper 上, 则 Method 上需要 "xxx@0"
     */
    String[] others() default {
     };
}
```
