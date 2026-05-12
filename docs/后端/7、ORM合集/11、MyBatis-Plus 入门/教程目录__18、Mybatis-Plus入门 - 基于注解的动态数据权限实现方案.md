# 18、Mybatis-Plus入门 - 基于注解的动态数据权限实现方案
- 来源：https://ddkk.com/zhuanlan/orm/mybatisplus/5/18.html
- 分类：ORM框架
- 分组：教程目录
### 数据权限简介

#### 前言

一般的系统都离不开权限模块，它是支撑整个系统运行的基础模块。而根据项目类型和需求的不同，权限模块的设计更是大相径庭。但不管怎么变，权限模块从大的方面来说，可以分为三种大的类型：功能权限、接口权限、数据权限。

**功能权限**：也就是我们最熟悉的菜单、按钮权限。可以配置各个角色能看到的菜单、按钮从而从最表层分配好权限

**接口权限**：顾名思义，配置不通角色调用接口的权限。有些敏感接口，是只能有固定的一些角色才能调用，普通角色是不能调用的。这种情况需要有一个明确的系统来控制对应的访问权限

**数据权限**：是大家最为需求也是最广为谈资的一个设计理念。我们需要控制不通的角色、机构人员有查看不通数据范围的权限。如果你动手去设计数据权限，当你去各大平台、百度、谷歌查找设计思路的时候，你会发现很难找到有用的资料，很多设计思路局限性非常大。

#### 寻找一些开源解决方案

##### Mybatis-Plus

Mybatis-Plus的3.4.1 +版本，提供了DataPermissionInterceptor数据权限处理器，需要自己实现DataPermissionHandler接口，其实现规则是获取SQL中的where条件，根据不同的部门或者自定义的权限规则，拼接where条件进行数据权限处理。

[使用案例](https://blog.csdn.net/qq_43437874/article/details/114691376)

##### 若依

若依使用了AOP机制，提供DataScopeAspect及DataScope注解实现权限数据。实现原理为，接口添加DataScope注解，AOP前置拦截接口，获取角色信息，根据不同的权限，拼接SQL，然后设置到参数中，在Mapper中，获取参数的SQL拼接到最后的SQL中。

##### JeecgBoot

JeecgBoot也采用的AOP机制，提供了PermissionData注解及切面PermissionDataAspect。

可以看出切面的主要功能是获取当前请求的用户角色及权限信息。

然后将请求中的权限信息，加载到MP的QueryWrapper中，实现SQL数据权限。

使用时，需要代码添加数据规则。

##### 分析总结

在以上开源的框架中，可以了解到，实现原理差不多都是根据用户的角色及其他信息，拼接SQL，最终实现不同用户，查询不同的角色信息。还有一些框架是使用了Mybatis插件，对查询方法进行拦截，道理大致一样。

思路：

**1、** 添加一个数据权限表，存储规则，关联角色；

**2、** 添加基于角色的权限配置、查询；

**3、** 添加注解、拦截规则枚举分类；

**4、** 添加插件，拦截执行器query方法；

**5、** 登录获取用户数据权限，存在redis；

**6、** 用户查询时，redis获取拥有数据权限，不同规则拼接不同的SQL；

### 开发数据权限

#### 1. 环境搭建

首先，我们搭建一个集成Mybatis-Plus的项目，将用户部门等表导入数据库中，并生成对应的Mapper及实体类。

#### 2. 添加数据权限注解及枚举类

##### 问题1 注解位置

因为数据权限是和SQL绑定的，所以注解最优的地方是放在mapper接口上，但是MP基础的CRUD接口是内置的，所以内置的这些方法，使用时，需要自己移入到Mapper文件中。

##### 问题2 注解属性值

数据权限的分类可能有很多种，比如：

- 根据部门分类，比如最高级部门可以查看所有部门的数据，中级部门可以查看本级及下属部门的数据，最下面的部门则只能查看当前部门的数据
- 根据用户分类，用户只能查看自己的数据
- 自定义数据权限，比如用户只能查看一年的用户，管理员则能查看所有数据，而且是动态的，可以通过页面配置

所有数据权限注解，应该有类型分类、是否开启、自定义等属性，我们需要创建枚举定义这些类型分类。

##### 2.1 创建权限注解和枚举

创建枚举DataScopeType，我们主要分两类，一个是根据用户所属部门，一个是动态查询的数据权限，可以根据实际业务场景添加多个。

```java
@Getter
@AllArgsConstructor
public enum DataScopeType {
    ALL(1, "所有部门"),
    OWN_AND_CHILD_DEPT(2, "本部门及子部门"),
    OWN_ONLY_DEPT(3, "仅本部门"),
    OWN_ONLY(4, "仅创建用户自己"),
    DB_DYNAMIC(5, "数据库动态配置");
    int type;
    String desc;
}
```

创建数据权限注解@DataScope，配置在Mapper接口方法或者接口上，主要配置不同的数据权限类型：

```java
@Documented
@Inherited
@Retention(RetentionPolicy.RUNTIME)
@Target({
     ElementType.METHOD, ElementType.TYPE})
public @interface DataScope {
    /**
     * 是否开启 默认true
     */
    boolean enabled() default true;
    /**
     * 数据权限类型。默认一般是查询自己部门及下属部门数据
     */
    DataScopeType type() default DataScopeType.OWN_AND_CHILD_DEPT;
}
```

#### 3. 添加配置类

添加配置类PearlDataScopeProperties，可以在YML中配置是否开启数据权限插件，及配置部门字段：

```java
@Data
@ConfigurationProperties(prefix = "pearl.data-scope")
public class PearlDataScopeProperties {
    Boolean enabled;
    String deptField;
}
```

在YML中，添加如下配置：

```java
pearl:
  data-scope:
    enabled: true
    dept-field: dept_id
```

#### 4. 添加数据权限处理器

首先添加数据权限处理器接口，针对不同类型，处理数据权限：

```java
public interface IDataScopeHandler {
    /**
     * 构建IN (xxx,xxx) 表达式
     *
     * @param plainSelect       普通查询对象
     * @param dataScopeProperty DataScope注解属性
     */
    void buildInExpression(PlainSelect plainSelect, DataScopeMapperProperty dataScopeProperty);
    /**
     * 构建 部门 = xx 表达式
     *
     * @param plainSelect       普通查询对象
     * @param dataScopeProperty DataScope注解属性
     */
    void buildDeptEqualToExpression(PlainSelect plainSelect, DataScopeMapperProperty dataScopeProperty);
    /**
     * 构建 创建用户 = xx 表达式
     *
     * @param plainSelect 普通查询对象
     */
    void buildUserEqualToExpression(PlainSelect plainSelect);
    /**
     * 构建 动态权限（数据库或缓存查询）表达式
     *
     * @param plainSelect 普通查询对象
     * @param msId        MappedStatementID
     * @throws JSQLParserException 解析异常
     */
    void buildDynamicExpression(PlainSelect plainSelect, Object msId) throws JSQLParserException;
}
```

添加处理器抽象类，实现部分方法：

```java
public abstract class AbstractDataScopeHandler implements IDataScopeHandler {
    /**
     * 默认部门字段名称
     */
    public String defaultDeptFiled;
    /**
     * 所有字段关键字
     */
    public static final String ALL_COLUMN_FILED = "*";
    /**
     * 获取 ItemsList，由子类实现
     *
     * @return ItemsList IN 表达式元素集合
     */
    abstract ItemsList renderInExpressionList();
    /**
     * 获取动态的数据权限，由子类实现
     *
     * @param msId MappedStatementID
     * @return DynamicDataPermission 动态的数据权限
     */
    abstract DynamicDataPermission renderDataPermission(Object msId);
    @Override
    public void buildInExpression(PlainSelect plainSelect, DataScopeMapperProperty dataScopeProperty) {
        // 1. 构建In 表达式
        FromItem fromItem = plainSelect.getFromItem();
        if (fromItem instanceof Table) {
            Column aliasColumn = getAliasColumn((Table) fromItem, defaultDeptFiled);
            InExpression inExpression = new InExpression(aliasColumn, renderInExpressionList());
            // 2. 添加新的Where语句
            if (null == plainSelect.getWhere()) {
                plainSelect.setWhere(new Parenthesis(inExpression));
            } else {
                plainSelect.setWhere(new AndExpression(plainSelect.getWhere(), inExpression));
            }
        }
    }
    @Override
    public void buildDynamicExpression(PlainSelect plainSelect, Object msId) throws JSQLParserException {
        // 1. 子类查询动态数据权限
        DynamicDataPermission dynamicDataPermission = renderDataPermission(msId);
        String dataPermissionSql = dynamicDataPermission.getExpression();// 数据库中的SQL表表示
        // 2.  处理查询字段
        String fields = dynamicDataPermission.getSelectItems();
        if (StrUtil.isNotEmpty(fields)) {
      // 配置了查询哪些字段
            List<SelectItem> selectItems = new ArrayList<>();
            if (ALL_COLUMN_FILED.equals(fields)) {
      // 所有字段
                selectItems.add(new AllColumns());
            } else {
                String[] fieldArray = fields.split(StrPool.COMMA);
                for (String field : fieldArray) {
                    SelectExpressionItem selectExpressionItem = new SelectExpressionItem();
                    selectExpressionItem.setExpression(new Column(field));
                    selectItems.add(selectExpressionItem);
                }
                plainSelect.setSelectItems(selectItems);
            }
        }
        // 2. 添加查询条件
        Expression expression = CCJSqlParserUtil.parseCondExpression(dataPermissionSql);
        Expression where = plainSelect.getWhere();
        if (where == null) {
            plainSelect.setWhere(expression);
        } else {
            plainSelect.setWhere(where instanceof OrExpression ? new AndExpression(new Parenthesis(where), expression) : new AndExpression(where, expression));
        }
    }
    /**
     * 获取带别名的列
     *
     * @param table      表
     * @param columnName 列名
     * @return 新的列名
     */
    public Column getAliasColumn(Table table, String columnName) {
        StringBuilder column = new StringBuilder();
        if (table.getAlias() != null) {
            column.append(table.getAlias().getName()).append(".");
        }
        column.append(columnName);
        return new Column(column.toString());
    }
    /**
     * 构建 = 表达式
     *
     * @param plainSelect 普通查询对象
     * @param column      列名
     * @param value       值
     */
    protected void buildEqualToExpression(PlainSelect plainSelect, String column, Expression value) {
        // 1. 构建等于表达式
        FromItem fromItem = plainSelect.getFromItem();
        Column aliasColumn = getAliasColumn((Table) fromItem, column);
        Expression where = plainSelect.getWhere();
        EqualsTo equalsToExpression = new EqualsTo();
        equalsToExpression.setLeftExpression(aliasColumn);
        equalsToExpression.setRightExpression(value);
        // 2. 添加表达式
        if (where == null) {
            plainSelect.setWhere(equalsToExpression);
        } else {
            plainSelect.setWhere(where instanceof OrExpression ? new AndExpression(new Parenthesis(where), equalsToExpression) : new AndExpression(where, equalsToExpression));
        }
    }
```

实现自己的处理器，主要是设置字段，查询动态数据权限，查询用户信息，查询登陆用户部门信息等。

```java
@Data
public class PearlDataScopeHandler extends AbstractDataScopeHandler {
    public PearlDataScopeHandler(PearlDataScopeProperties pearlDataScopeProperties) {
        this.defaultDeptFiled = pearlDataScopeProperties.deptField;
    }
    @Override
    public void buildUserEqualToExpression(PlainSelect plainSelect) {
        buildEqualToExpression(plainSelect, "create_user_id", new LongValue(123555L)); // 值
    }
    @Override
    public void buildDeptEqualToExpression(PlainSelect plainSelect, DataScopeMapperProperty dataScopeProperty) {
        buildEqualToExpression(plainSelect, defaultDeptFiled, new LongValue(001L));
    }
    @Override
    ItemsList renderInExpressionList() {
        // 1. 查询部门集合（本部门及下属部门）
        return new ExpressionList(
                // 部门集合实际应当从用户信息中获取
                Arrays.asList(
                        new LongValue("001"),
                        new LongValue("002"),
                        new LongValue("003")
                ));
    }
    @Override
    public DynamicDataPermission renderDataPermission(Object obj) {
        // 1. 数据库或者缓存根据当前用户角色查询拥有的数据权限值
        DataPermission dataPermission = new DataPermission(); // 模拟数据=》数据库查询的应该是集合
        List<DataPermission> list = new ArrayList<>();
        dataPermission.setCode("test001")
                .setClassName("org.pearl.springbootsecurity.demo.dao.UserMapper.getUserInfoByUserName")
                .setColumn("bbb")
                .setName("只能查看2021年之后的数据")
                .setField("aaa,bbb,ccc")
                .setValue("u.create_date > \"2021-01-01 00:00:00\"");
        list.add(dataPermission);
        // 2. 根据执行的MS,查询当前有没有配置的数据权限
        DataPermission dbPermission = list.stream().filter(permission -> obj.toString().equals(permission.getClassName())).findAny().orElse(null);
        if (dataPermission == null) {
            throw new DataScopeException("当前用户未查询到数据权限");
        }
        DynamicDataPermission dynamicDataPermission = new DynamicDataPermission();
        dynamicDataPermission.setExpression(dbPermission.getValue());
        dynamicDataPermission.setMapperMethodName(dbPermission.getClassName());
        dynamicDataPermission.setSelectItems(dataPermission.getField());
        return dynamicDataPermission;
    }
}
```

#### 5. 添加拦截器

添加拦截器，这里使用MP提供的InnerInterceptor拦截器，注入一个IDataScopeHandler 实现类，然后根据不同的类型，执行不同的逻辑。

```java
public class DataScopeInterceptor extends JsqlParserSupport implements InnerInterceptor {
    /**
     * 数据权限处理器
     */
    private IDataScopeHandler dataScopeHandler;
    public DataScopeInterceptor(IDataScopeHandler dataScopeHandler) {
        if (null != dataScopeHandler) {
            this.dataScopeHandler = dataScopeHandler;
        }
    }
    /**
     * 查询之前
     */
    @Override
    public void beforeQuery(Executor executor, MappedStatement ms, Object parameter, RowBounds rowBounds, ResultHandler resultHandler, BoundSql boundSql) throws SQLException {
        // 1. 查询是否配置了忽略@InterceptorIgnore
        if (!InterceptorIgnoreHelper.willIgnoreDataPermission(ms.getId())) {
            // 2. 获取BoundSql
            PluginUtils.MPBoundSql mpBs = PluginUtils.mpBoundSql(boundSql);
            // 3. 获取新的SQL 并设置到BoundSql对象中
            mpBs.sql(this.parserSingle(mpBs.sql(), ms.getId()));
        }
    }
    /**
     * 处理查询
     *
     * @param select 查询对象Select
     * @param index  序列
     * @param sql    语句：
     * @param obj    查询Mapper方法全路径
     */
    @SneakyThrows
    @Override
    protected void processSelect(Select select, int index, String sql, Object obj) {
        this.processSelectBody(select.getSelectBody(), obj);
        List<WithItem> withItemsList = select.getWithItemsList();
        if (!CollectionUtils.isEmpty(withItemsList)) {
            withItemsList.forEach(e -> {
                try {
                    processSelectBody(e, obj);
                } catch (JSQLParserException ex) {
                    ex.printStackTrace();
                }
            });
        }
    }
    /**
     * 处理  selectBody
     *
     * @param selectBody
     */
    void processSelectBody(SelectBody selectBody, Object obj) throws JSQLParserException {
        if (selectBody != null) {
            if (selectBody instanceof PlainSelect) {
                this.processPlainSelect((PlainSelect) selectBody, obj);
            } else if (selectBody instanceof WithItem) {
                WithItem withItem = (WithItem) selectBody;
                // 处理每个With 语句的查询
                this.processSelectBody(withItem.getSelectBody(), obj);
            } else {
                SetOperationList operationList = (SetOperationList) selectBody;
                if (operationList.getSelects() != null && operationList.getSelects().size() > 0) {
                    operationList.getSelects().forEach(e -> {
                        try {
                            processSelectBody(e, obj);
                        } catch (JSQLParserException ex) {
                            ex.printStackTrace();
                        }
                    });
                }
            }
        }
    }
    /**
     * 处理查询 添加 WHERE 条件
     *
     * @param plainSelect
     * @param obj
     * @throws JSQLParserException
     */
    protected void processPlainSelect(PlainSelect plainSelect, Object obj) throws JSQLParserException {
        // 1. 缓存中获取当前执行
        DataScopeMapperProperty dataScopeProperty = InMemoryDataScopeMetaStore.getCache(obj.toString().substring(0, obj.toString().lastIndexOf(StrUtil.C_DOT)));
        if (dataScopeProperty == null) {
            dataScopeProperty = InMemoryDataScopeMetaStore.getCache(obj.toString());
        }
        if (dataScopeProperty != null) {
      // 没有注解或者配置的不开启，执行放行
            // 2. 处理查询
            DataScopeType type = dataScopeProperty.type; // 注解类型
            // 2.1.1 首先处理部门数据权限，添加到Where中
            if (DataScopeType.OWN_AND_CHILD_DEPT == type) {
                // 2.1.1.2 本部门及以下部门，查询当前用户部门信息及下属部门信息，拼接IN语句
                dataScopeHandler.buildInExpression(plainSelect, dataScopeProperty);// 调用处理器构建In 表达式
            } else if (DataScopeType.OWN_ONLY_DEPT == type) {
                // 2.1.1.3  仅本部门数据
                dataScopeHandler.buildDeptEqualToExpression(plainSelect, dataScopeProperty);
            } else if (DataScopeType.OWN_ONLY == type) {
                // 2.1.1.4 仅仅本人数据
                dataScopeHandler.buildUserEqualToExpression(plainSelect);
            } else if (DataScopeType.DB_DYNAMIC == type) {
                // 2.1.1.5 数据库动态权限
                dataScopeHandler.buildDynamicExpression(plainSelect, obj);
            } else {
                System.out.println("if (DataScopeType.ALL == type) {\n" +
                        "                // 2.1.1.1 全部数据 直接放行\n" +
                        "            } else ");
            }
        }
    }
}
```

#### 6. 注入拦截器

在MybatisPlus配置类中，将数据权限拦截器，添加到连接器链中。

```java
    @Bean
    public MybatisPlusInterceptor mybatisPlusInterceptor(PearlDataScopeProperties pearlDataScopeProperties,PearlDataScopeHandler dataScopeHandler) {
        // 添加租户插件
        // 如果用了分页插件注意先 add TenantLineInnerInterceptor 再 add PaginationInnerInterceptor
        // 用了分页插件必须设置 MybatisConfiguration#useDeprecatedExecutor = false ,3.4已移除
        MybatisPlusInterceptor interceptor = new MybatisPlusInterceptor();
        if (pearlDataScopeProperties.getEnabled()) {
            // 开启配置，添加数据权限插件
            interceptor.addInnerInterceptor(new DataScopeInterceptor(dataScopeHandler));
        }
        // 分页插件
        interceptor.addInnerInterceptor(new PaginationInnerInterceptor(DbType.MYSQL));
        return interceptor;
    }
```

#### 7. 测试

添加注解，配置不同的属性，发现数据权限表达式成功添加。
