# 11、Mybatis-Plus入门 - Sql注入器及源码分析
- 来源：https://ddkk.com/zhuanlan/orm/mybatisplus/5/11.html
- 分类：ORM框架
- 分组：教程目录
### Mybatis执行流程

**1、** 加载配置：配置来源于两个地方，一处是配置文件，一处是Java代码的注解，将SQL的配置信息加载成为一个个MappedStatement对象（包括了传入参数映射配置、执行的SQL语句、结果映射配置），存储在内存中；

**2、** SQL解析：当API接口层接收到调用请求时，会接收到传入SQL的ID和传入对象（可以是Map、JavaBean或者基本数据类型），Mybatis会根据SQL的ID找到对应的MappedStatement，然后根据传入参数对象对MappedStatement进行解析，解析后可以得到最终要执行的SQL语句和参数；

**3、** SQL执行：将最终得到的SQL和参数拿到数据库进行执行，得到操作数据库的结果；

**4、** 结果映射：将操作数据库的结果按照映射的配置进行转换，可以转换成HashMap、JavaBean或者基本数据类型，并将最终结果返回；

### Plus中的默认SQL注入器

**1、** SQL注入器相关源码在core包下；

**2、** SelectById对象源码；

```java
/**
 * 根据ID 查询一条数据
 *
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @since 2018-04-06
 */
public class SelectById extends AbstractMethod {
    /**
     *
     * @param mapperClass mapper 接口
     * @param modelClass  mapper 泛型
     * @param tableInfo   数据库表反射信息
     * @return
     */
    @Override
    public MappedStatement injectMappedStatement(Class<?> mapperClass, Class<?> modelClass, TableInfo tableInfo) {
        //  获取通用SQL语句： SELECT_BY_ID("selectById", "根据ID 查询一条数据", "SELECT %s FROM %s WHERE %s=#{%s} %s"),
        SqlMethod sqlMethod = SqlMethod.SELECT_BY_ID;
        // 根据相关信息构造SQL sqlSource=》处理SQL
        // SELECT id,user_id,commodity_code,count,money,dept_id,tenant_id,is_deleted,version,oper_user,gmt_create,gmt_modified FROM order_tbl WHERE id=?  AND is_deleted=0
        SqlSource sqlSource = new RawSqlSource(configuration,
            String.format(sqlMethod.getSql(), // 格式化SQL语句
            sqlSelectColumns(tableInfo, false), //  获取查询列
            tableInfo.getTableName(), tableInfo.getKeyColumn(), tableInfo.getKeyProperty(), // 表名
            tableInfo.getLogicDeleteSql(true, true)), Object.class); // 处理逻辑删除
        //
        return this.addSelectMappedStatementForTable(mapperClass, getMethod(sqlMethod), sqlSource, tableInfo);
    }
}
```

**1、** AbstractSqlInjector源码；

```java
public abstract class AbstractSqlInjector implements ISqlInjector {
    private static final Log logger = LogFactory.getLog(AbstractSqlInjector.class);
    /**
     * 检查SQL是否注入(已经注入过不再注入)
     *
     * @param builderAssistant mapper 信息
     * @param mapperClass      mapper 接口的 class 对象
     */
    @Override
    public void inspectInject(MapperBuilderAssistant builderAssistant, Class<?> mapperClass) {
        // 获取实体类Class
        Class<?> modelClass = extractModelClass(mapperClass);
        if (modelClass != null) {
            // 获取Mapper接口Class名
            String className = mapperClass.toString();
            // Mapper注册表缓存
            Set<String> mapperRegistryCache = GlobalConfigUtils.getMapperRegistryCache(builderAssistant.getConfiguration());
            // 缓存中没有当前Mapper接口
            if (!mapperRegistryCache.contains(className)) {
                // 获取 注入的方法集合
                List<AbstractMethod> methodList = this.getMethodList(mapperClass);
                if (CollectionUtils.isNotEmpty(methodList)) {
                    // 获取表信息
                    TableInfo tableInfo = TableInfoHelper.initTableInfo(builderAssistant, modelClass);
                    // 循环注入自定义方法
                    methodList.forEach(m -> m.inject(builderAssistant, mapperClass, modelClass, tableInfo));
                } else {
                    logger.debug(mapperClass.toString() + ", No effective injection method was found.");
                }
                mapperRegistryCache.add(className);
            }
        }
    }
    /**
     * <p>
     * 获取 注入的方法
     * </p>
     *
     * @param mapperClass 当前mapper
     * @return 注入的方法集合
     * @since 3.1.2 add  mapperClass
     */
    public abstract List<AbstractMethod> getMethodList(Class<?> mapperClass);
    /**
     * 提取泛型模型,多泛型的时候请将泛型T放在第一位
     *
     * @param mapperClass mapper 接口
     * @return mapper 泛型
     */
    protected Class<?> extractModelClass(Class<?> mapperClass) {
        Type[] types = mapperClass.getGenericInterfaces();
        ParameterizedType target = null;
        for (Type type : types) {
            if (type instanceof ParameterizedType) {
                Type[] typeArray = ((ParameterizedType) type).getActualTypeArguments();
                if (ArrayUtils.isNotEmpty(typeArray)) {
                    for (Type t : typeArray) {
                        if (t instanceof TypeVariable || t instanceof WildcardType) {
                            break;
                        } else {
                            target = (ParameterizedType) type;
                            break;
                        }
                    }
                }
                break;
            }
        }
        return target == null ? null : (Class<?>) target.getActualTypeArguments()[0];
    }
}
```

**1、** Debug可发现，这些通用的方法都注册到MappedStatement集合中，可以通过Mapper直接调用；

### 分析MybatisPlus的sql注入器

通过mybatis流程及plus源码分析，可以知道以下几点：

- 可以自定义注入通用 SQL 语句方法
- 自定义一个基础的Mapper然后继承 BaseMapper 添加自定义方法
- 全局配置 sqlInjector 注入 MP 会自动将类所有方法注入到 mybatis 容器中。
- 这样就可以各个业务Mapper只需要继承基础Mapper,就可以调用公用方法。

### 测试案例

#### 1. 基础环境

**1、** 定义一个基础Mapper并继承BaseMapper；

```java
public interface MyBaseMapper<T> extends BaseMapper<T> {
    int deleteByIdWithFill(T entity);
}
```

**1、** 业务Mapper继承自定义Mapper；

```java
@Mapper
public interface OrderTblMapper extends MyBaseMapper<OrderTbl> {
}
```

**1、** 自定义一个SQL注入器，用于添加自定义方法；

```java
@Component
public class MySqlInjector extends DefaultSqlInjector {
    @Override
    public List<AbstractMethod> getMethodList(Class<?> mapperClass) {
        List<AbstractMethod> methodList = super.getMethodList(mapperClass);
        return methodList;
    }
}
```

#### 2. 添加默认的装载器

**1、** Plus扩展包提供了几个内置选装件，可以直接拿来使用；

**2、** 修改MySqlInjector注入器，添加内置选装件；

```java
@Component
public class MySqlInjector extends DefaultSqlInjector {
    @Override
    public List<AbstractMethod> getMethodList(Class<?> mapperClass) {
        List<AbstractMethod> methodList = super.getMethodList(mapperClass);
        // 添加内置选装件
        methodList.add(new InsertBatchSomeColumn(i -> i.getFieldFill() != FieldFill.UPDATE));
        methodList.add(new AlwaysUpdateSomeColumnById());
        methodList.add(new LogicDeleteByIdWithFill());
        return methodList;
    }
}
```

**1、** MyBaseMapper添加方法；

```java
public interface MyBaseMapper<T> extends BaseMapper<T> {
    int insertBatchSomeColumn(List<T> entityList);
    int alwaysUpdateSomeColumnById(@Param(Constants.ENTITY) T entity);
    int deleteByIdWithFill(T entity);
}
```

**1、** insertBatchSomeColumn说明及注意事项：；

（1）如果个别字段在 entity 里为 null 但是数据库中有配置默认值, insert 后数据库字段是为 null 而不是默认值

（2）这个方法，会把entity存在的字段都插入，如果某个字段没有值时，会插入NULL。

```java
    /**
     *  普通Insert:  Execute SQL：INSERT INTO order_tbl ( user_id, commodity_code, money, oper_user, gmt_create, gmt_modified ) VALUES ( '123', 'PHONE', 100, 'zhangsan', '2021-03-31T13:10:45.240', '2021-03-31T13:10:45.242' )
     *  Execute SQL：INSERT INTO order_tbl (user_id,commodity_code,count,money,dept_id,tenant_id,is_deleted,version,oper_user,gmt_create,gmt_modified) VALUES ('123','PHONE',NULL,100,NULL,NULL,NULL,NULL,'zhangsan','2021-03-31T13:09:31.011','2021-03-31T13:09:31.014')
     */
    @Test
    public void insertBatchSomeColumnTest() {
        List<OrderTbl> list = new ArrayList<>();
        for (int i = 0; i < 100; i++) {
            OrderTbl orderTbl = new OrderTbl().setMoney(100).setUserId("123").setCommodityCode("PHONE");
            list.add(orderTbl);
        }
        orderTblMapper.insertBatchSomeColumn(list);
    }
```

**1、** alwaysUpdateSomeColumnById说明及注意事项：；

（1）根据 ID 更新固定的那几个字段(但是不包含逻辑删除)

（2）这个方法，会把entity存在的字段都更新，如果某个字段没有值时，更新为NULL。

```java
    @Test
    public void alwaysUpdateSomeColumnByIdTest() {
        OrderTbl orderTbl = new OrderTbl().setMoney(100).setUserId("123").setCommodityCode("PHONE");
        orderTblMapper.alwaysUpdateSomeColumnById(orderTbl);
    }
```

**1、** deleteByIdWithFill说明及注意事项：；

（1）根据 id 逻辑删除数据,并带字段填充功能

（2）注意入参是 entity !!! ,如果字段没有自动填充,就只是单纯的逻辑删除

```java
    @Test
    public void deleteByIdWithFillTest() {
        OrderTbl orderTbl1 = orderTblMapper.selectById(18587);
        orderTbl1.setMoney(100);
        orderTblMapper.deleteByIdWithFill(orderTbl1);
    }
```

#### 3. 自定义公用方法

**1、** 自定义方法继承AbstractMethod；

```java
public class FindOne extends AbstractMethod {
    @Override
    public MappedStatement injectMappedStatement(Class<?> mapperClass, Class<?> modelClass, TableInfo tableInfo) {
        /* 执行 SQL ，动态 SQL 参考类 SqlMethod */
        String sql = "select * from " + tableInfo.getTableName()
                + " where " + tableInfo.getKeyColumn() + "=#{" + tableInfo.getKeyProperty() + "}";
        /* mapper 接口方法名一致 */
        String method = "findOne";
        SqlSource sqlSource = languageDriver.createSqlSource(configuration, sql, modelClass);
        return addSelectMappedStatementForTable(mapperClass, method, sqlSource, tableInfo);
    }
}
```

**1、** MySqlInjector添加自定义方法；

```java
        // 添加自定义方法
        methodList.add(new FindOne());
```

**1、** MyBaseMapper中添加自定义方法；

```java
 T findOne(Serializable id);
```

**1、** 测试：；

```java
    @Test
    public void findOneTest() {
        OrderTbl one = orderTblMapper.findOne(18587);
    }
```
