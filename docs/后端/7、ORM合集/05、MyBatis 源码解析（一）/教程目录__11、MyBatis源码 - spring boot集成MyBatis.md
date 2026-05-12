# 11、MyBatis源码 - spring boot集成MyBatis
- 来源：https://ddkk.com/zhuanlan/orm/mybatis/5/11.html
- 分类：ORM框架
- 分组：教程目录
### 1. 创建基础工程

**1、** 创建新模块；

**2、** 选择SpringInitializr方式；

**3、** 添加模块项目名、报名等基本信息；

**4、** 添加springMVC；

**5、** 添加mybatis、mysql驱动；

**6、** 添加lombok；

**7、** 点击完成，开始创建工程；

**8、** 创建完成，引入了相关依赖；

### 2. 集成MyBatis

**1、** 复制之前的mapper接口、xml、pojo类，到图中所示文件夹；

**2、** yml添加数据源配置；

```java
server:
  port: 8888
spring:
  application:
    name: spring-boot-mybatis-demo
  datasource:
    url: jdbc:mysql://localhost:3306/angel_admin?serverTimezone=Asia/Shanghai&useUnicode=true&characterEncoding=utf8&useSSL=false&allowMultiQueries=true
    username: root
    password: 123456
    driver-class-name: com.mysql.cj.jdbc.Driver
mybatis:
  xml文件的路径配置
  mapper-locations: mybatis/*.xml
```

**1、** 测试，集成完毕；

```java
@SpringBootTest
class SpringBootMybatisDemoApplicationTests {
    @Autowired
    UserMapper userMapper;
    @Test
    void contextLoads() {
        UserQuery userQuery = new UserQuery();
        userQuery.setLoginName("zhangwei");
        List<User> dynamicUserList = userMapper.selectDynamicUserList(userQuery);
        System.out.println(dynamicUserList);
    }
}
```

### 3. 配置

#### SpringBoot自动装配

自动装配是SpringBoot中一大特性，SpringBoot在程序初始化时可以根据classpath、property属性、context中实例、以及运行容器特征等各种动态条件，来按需初始化相应的bean，并注册到IOC容器中。

mybatis提供了Spring Boot自动装配模块[mybatis-spring-boot-starter](https://github.com/mybatis/spring-boot-starter)，只要引入了这个包，yml中配置相关属性，就可以快速开发。相比之前XML的复杂配置，简化了很多。

#### 配置类

##### MybatisProperties

MybatisProperties是mybatis的最外层配置类，会读取mybatis前缀的配置

```java
/**
 * MyBatis属性配置
 */
// @ConfigurationProperties。只要在bean上添加上这个注解，指定好配置文件的前缀，那么对应的配置文件数据就会自动填充到bean中
// @EnableConfigurationProperties({MybatisProperties.class})会使@ConfigurationProperties 注解的类生效
// 会读取mybatis前缀的配置加载到当前Bean中
@ConfigurationProperties(prefix = MybatisProperties.MYBATIS_PREFIX)
public class MybatisProperties {
    // 配置文件前缀
    public static final String MYBATIS_PREFIX = "mybatis";
    private static final ResourcePatternResolver resourceResolver = new PathMatchingResourcePatternResolver();
    // MyBatis xml配置文件的位置
    private String configLocation;
    // MyBatis xml映射文件的位置
    private String[] mapperLocations;
    // 别名包的位置，使用分隔符（,; \t\n"）
    private String typeAliasesPackage;
    // 别名类的父类。指定之后，只会加载配置了此超类的文件，如果没有指定，MyBatis会将所有从 ypeAliasesPackage中搜索到的类作为类型别名处理
    private Class<?> typeAliasesSuperType;
    // 扫描类型处理器所在的包，使用分隔符（,; \t\n"）
    private String typeHandlersPackage;
    // 指示是否对 MyBatis xml 配置文件进行存在检查, 使用了自动装配，所以不需要xml配置了
    private boolean checkConfigLocation = false;
    // sql执行器，可配置项：SIMPLE、REUSE、BATCH，
    // SIMPLE是默认执行器，根据对应的sql直接执行，不会做一些额外的操作
    // REUSE是可重用执行器，重用对象是Statement（即该执行器会缓存同一个sql的Statement，省去Statement的重新创建，优化性能）（即会重用预处理语句）
    // BATCH执行器会重用预处理语句，并执行批量更新。
    private ExecutorType executorType;
    // 默认脚本语言驱动程序类。 (与mybatis-spring 2.0.2+一起使用时可用)
    private Class<? extends LanguageDriver> defaultScriptingLanguageDriver;
    // MyBatis外部配置属性
    private Properties configurationProperties;
    // 配置对象，如果指定了configLocation，也不使用此属性
    @NestedConfigurationProperty // 表示这是一个嵌套类型
    private Configuration configuration;
}
```

##### Configuration

Configuration是MybatisProperties中的嵌套配置类，相当于之前的全局配置文件。

```java
public class Configuration {
  // 环境配置，配置数据源、事务管理器
  protected Environment environment;
  // 是否允许在嵌套语句中使用分页（RowBounds）。如果允许使用则设置为 false。
  protected boolean safeRowBoundsEnabled;
  // 是否允许在嵌套语句中使用结果处理器（ResultHandler）。如果允许使用则设置为 false
  protected boolean safeResultHandlerEnabled = true;
  // 是否开启驼峰命名自动映射，即从经典数据库列名 A_COLUMN 映射到经典 Java 属性名 aColumn
  protected boolean mapUnderscoreToCamelCase;
  // 开启时，任一方法的调用都会加载该对象的所有延迟加载属性。 否则，每个延迟加载属性会按需加载（参考 lazyLoadTriggerMethods)。
  protected boolean aggressiveLazyLoading;
  // 	是否允许单个语句返回多结果集（需要数据库驱动支持）。
  protected boolean multipleResultSetsEnabled = true;
  // 允许 JDBC 支持自动生成主键，需要数据库驱动支持。如果设置为 true，将强制使用自动生成主键。尽管一些数据库驱动不支持此特性，但仍可正常工作（如 Derby）。
  protected boolean useGeneratedKeys;
  // 使用列标签代替列名。实际表现依赖于数据库驱动，具体可参考数据库驱动的相关文档，或通过对比测试来观察。
  protected boolean useColumnLabel = true;
  // 全局性地开启或关闭所有映射器配置文件中已配置的任何缓存。
  protected boolean cacheEnabled = true;
  // 指定当结果集中值为 null 的时候是否调用映射对象的 setter（map 对象时为 put）方法，这在依赖于 Map.keySet() 或 null 值进行初始化时比较有用。注意基本类型（int、boolean 等）是不能设置成 null 的。
  protected boolean callSettersOnNulls;
  // 允许使用方法签名中的名称作为语句参数名称。 为了使用该特性，你的项目必须采用 Java 8 编译，并且加上 -parameters 选项。（新增于 3.4.1）
  protected boolean useActualParamName = true;
  // 当返回行的所有列都是空时，MyBatis默认返回 null。 当开启这个设置时，MyBatis会返回一个空实例。 请注意，它也适用于嵌套的结果集（如集合或关联）。（新增于 3.4.2）
  protected boolean returnInstanceForEmptyRow;
  // 从SQL中删除多余的空格字符。请注意，这也会影响SQL中的文字字符串。 (新增于 3.5.5)
  protected boolean shrinkWhitespacesInSql;
  // 指定 MyBatis 增加到日志名称的前缀。
  protected String logPrefix;
  // 指定 MyBatis 所用日志的具体实现，未指定时将自动查找。
  protected Class<? extends Log> logImpl;
  // 指定 VFS 的实现
  // Mybatis 中使用 VFS 表示虚拟文件系统,用来查找指定路径下的资源,VFS 是一个抽象类,我们可以看到官方提供了 JBoss6VFS 和 DefaultVFS
  // spring boot使用的是而是 SpringbootVFS
  protected Class<? extends VFS> vfsImpl;
  // 指定保存提供程序方法的sql提供程序类（自3.5.6起）。当省略这些属性时，此类将应用于sql提供程序批注（例如@SelectProvider）上的type（或value）属性.
  protected Class<?> defaultSqlProviderType;
  // MyBatis 利用本地缓存机制（Local Cache）防止循环引用和加速重复的嵌套查询。 默认值为 SESSION，会缓存一个会话中执行的所有查询。 若设置值为 STATEMENT，本地缓存将仅用于执行语句，对相同 SqlSession 的不同查询将不会进行缓存。
  protected LocalCacheScope localCacheScope = LocalCacheScope.SESSION;
  // 当没有为参数指定特定的 JDBC 类型时，空值的默认 JDBC 类型。 某些数据库驱动需要指定列的 JDBC 类型，多数情况直接用一般类型即可，比如 NULL、VARCHAR 或 OTHER。 JdbcType 常量，常用值：NULL、VARCHAR 或 OTHER。
  protected JdbcType jdbcTypeForNull = JdbcType.OTHER;
  // 指定对象的哪些方法触发一次延迟加载。
  protected Set<String> lazyLoadTriggerMethods = new HashSet<>(Arrays.asList("equals", "clone", "hashCode", "toString"));
  // 设置超时时间，它决定数据库驱动等待数据库响应的秒数。
  protected Integer defaultStatementTimeout;
  // 为驱动的结果集获取数量（fetchSize）设置一个建议值。此参数只可以在查询设置中被覆盖。
  protected Integer defaultFetchSize;
  // 指定语句默认的滚动策略。（新增于 3.5.2）
  // FORWARD_ONLY /SCROLL_SENSITIVE /SCROLL_INSENSITIVE/DEFAULT（等同于未设置）
  protected ResultSetType defaultResultSetType;
  // 配置默认的执行器。SIMPLE 就是普通的执行器；REUSE 执行器会重用预处理语句（PreparedStatement）； BATCH 执行器不仅重用语句还会执行批量更新。
  protected ExecutorType defaultExecutorType = ExecutorType.SIMPLE;
  // 指定 MyBatis 应如何自动映射列到字段或属性。 NONE 表示关闭自动映射；PARTIAL 只会自动映射没有定义嵌套结果映射的字段。 FULL 会自动映射任何复杂的结果集（无论是否嵌套）。
  protected AutoMappingBehavior autoMappingBehavior = AutoMappingBehavior.PARTIAL;
  // 指定发现自动映射目标未知列（或未知属性类型）的行为。
  protected AutoMappingUnknownColumnBehavior autoMappingUnknownColumnBehavior = AutoMappingUnknownColumnBehavior.NONE;
  protected Properties variables = new Properties();
  protected ReflectorFactory reflectorFactory = new DefaultReflectorFactory();
  protected ObjectFactory objectFactory = new DefaultObjectFactory();
  protected ObjectWrapperFactory objectWrapperFactory = new DefaultObjectWrapperFactory();
  // 延迟加载的全局开关。当开启时，所有关联对象都会延迟加载。 特定关联关系中可通过设置 fetchType 属性来覆盖该项的开关状态。
  protected boolean lazyLoadingEnabled = false;
  // 指定 Mybatis 创建可延迟加载对象所用到的代理工具。
  protected ProxyFactory proxyFactory = new JavassistProxyFactory(); //224 Using internal Javassist instead of OGNL
```

##### 常用YML配置

一般如下配置即可，如果需要其他配置，参考以上即可

```java
mybatis:
  xml文件的路径配置
  mapper-locations: mybatis/*.xml
  别名包的位置，使用分隔符（,; \t\n"）
  type-aliases-package: org.pearl.boot.mybatis.demo.pojo
  configuration:
  	# 转驼峰配置
    map-underscore-to-camel-case: true
```
