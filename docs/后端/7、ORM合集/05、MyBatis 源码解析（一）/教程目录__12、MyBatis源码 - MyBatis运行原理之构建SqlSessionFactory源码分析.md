# 12、MyBatis源码 - MyBatis运行原理之构建SqlSessionFactory源码分析
- 来源：https://ddkk.com/zhuanlan/orm/mybatis/5/12.html
- 分类：ORM框架
- 分组：教程目录
### 功能架构图

Mybatis的功能架构分为以下几层：

- API接口层：提供给外部使用的接口API，开发人员通过这些本地API来操纵数据库。接口层接收到调用请求就会调用数据处理层来完成具体的数据处理。
- 数据处理层：负责具体的SQL查找、SQL解析、SQL执行和执行结果映射处理等。它主要的目的是根据调用的请求完成一次数据库操作。
- 基础支撑层：负责最基础的功能支撑，包括连接管理、事务管理、配置加载和缓存处理，这些都是共用的东西，将他们抽取出来作为最基础的组件。为上层的数据处理层提供最基础的支撑。
- 引导层：使用XML或者JAVA代码方式，构建及配置Mybatis。

### 大致流程

之间的案例通过以下代码，就能完成正删改查操作，简单的流程为：

**1、** 读取配置文件，创建SqlSessionFactory；

**2、** 通过工厂获取SqlSession对象；

**3、** SqlSession获取Mapper接口的代理对象；

**4、** 代理对象执行SQL；

**5、** 封装结果集并返回；

```java
    String resource = "mybatis-config.xml";
        InputStream inputStream = Resources.getResourceAsStream(resource);
        SqlSessionFactory sqlSessionFactory = new SqlSessionFactoryBuilder().build(inputStream);
        SqlSession sqlSession = sqlSessionFactory.openSession();
        UserMapper userMapper = sqlSession.getMapper(UserMapper.class);
        UserQuery userQuery = new UserQuery();
        userQuery.setLoginName("zhangwei");
        List<User> dynamicUserList = userMapper.selectDynamicUserList(userQuery);
        System.out.println(dynamicUserList);
        sqlSession.commit();
        sqlSession.close();
```

### 构建SqlSessionFactory

#### 简介

在MyBatis 中，既可以通过读取配置的 XML 文件的形式生成 SqlSessionFactory，也可以通过 Java 代码的形式去生成 SqlSessionFactory。SqlSessionFactory 是一个接口，在 MyBatis 中它存在两个实现类：SqlSessionManager 和 DefaultSqlSessionFactory。

一般而言，具体是由 DefaultSqlSessionFactory 去实现的，而 SqlSessionManager 使用在多线程的环境中。

每个基于 MyBatis 的应用都是以一个 SqlSessionFactory 的实例为中心的，它是线程安全的，SqlSessionFactory一旦被创建，应该在应用执行期间都存在，而 SqlSessionFactory 唯一的作用就是生产 MyBatis 的核心接口对象 SqlSession，所以它的责任是唯一的，我们往往会采用单例模式。

**SqlSessionFactory接口：**

```java
public interface SqlSessionFactory {
  SqlSession openSession();
  SqlSession openSession(boolean autoCommit);
  SqlSession openSession(Connection connection);
  SqlSession openSession(TransactionIsolationLevel level);
  SqlSession openSession(ExecutorType execType);
  SqlSession openSession(ExecutorType execType, boolean autoCommit);
  SqlSession openSession(ExecutorType execType, TransactionIsolationLevel level);
  SqlSession openSession(ExecutorType execType, Connection connection);
  Configuration getConfiguration();
}
```

**实现类DefaultSqlSessionFactory：**

```java
public class DefaultSqlSessionFactory implements SqlSessionFactory {
  private final Configuration configuration;
  public DefaultSqlSessionFactory(Configuration configuration) {
    this.configuration = configuration;
  }
  // 省略 大量openSession方法
}
```

#### 核心流程

对下以下代码，详细分析

```java
        String resource = "mybatis-config.xml";
        InputStream inputStream = Resources.getResourceAsStream(resource);
        SqlSessionFactory sqlSessionFactory = new SqlSessionFactoryBuilder().build(inputStream);
```

核心代码执行流程如下图所示：

##### 1. 加载配置文件

通过getResourceAsStream方法将全局配置文件转化为InputStream。

```java
Resources.getResourceAsStream(resource)
```

##### 2. SqlSessionFactoryBuilder.build

通过SqlSessionFactoryBuilder中的build方法，获取SqlSessionFactory对象。

**build方法的作用**：

- 通过解析XML文件，生成XMLConfigBuilder对象
- 通过XMLConfigBuilde中的Configuration对象，生成DefaultSqlSessionFactory对象

**build方法核心源码**：

```java
public class SqlSessionFactoryBuilder {
  /**
   * 构建SqlSessionFactory 对象
   *
   * @param inputStream 配置文件流
   * @param environment 多环境ID
   * @param properties  属性配置
   * @return SqlSessionFactory
   */
  public SqlSessionFactory build(InputStream inputStream, String environment, Properties properties) {
    try {
      // 解析xml文件，构建XMLConfigBuilder对象(解析器)
      XMLConfigBuilder parser = new XMLConfigBuilder(inputStream, environment, properties);
      // 调用解析器解析对象，并构建SqlSessionFactory
      return build(parser.parse());
    } catch (Exception e) {
      // 捕获异常并包装
      throw ExceptionFactory.wrapException("Error building SqlSession.", e);
    } finally {
      ErrorContext.instance().reset();
      try {
      	// 关闭流
        inputStream.close();
      } catch (IOException e) {
        // Intentionally ignore. Prefer previous error.
      }
    }
  }
  /**
   * 获取默认的SqlSessionFactory对象
   *
   * @param config Mybatis Configuration对象
   * @return SqlSessionFactory
   */
  public SqlSessionFactory build(Configuration config) {
    return new DefaultSqlSessionFactory(config);
  }
```

##### 3. 创建XMLConfigBuilder对象

XMLConfigBuilder的作用是把MyBatis的XML及相关配置解析出来。

```java
 XMLConfigBuilder parser = new XMLConfigBuilder(inputStream, environment, properties);
```

XMLConfigBuilder继承了BaseBuilder，它的成员变量中较为重要的有两个。一个是Configuration类,这个是用来存储mybatis的配置信息的;另一个是XPathParser类，是XPath解析器，用的都是JDK的类包,封装了一下，用来解析XML文件。

XMLConfigBuilder类的主要作用有

- 实例化Configuration，并设置默认属性
- 创建默认反射工厂
- 初始化XML解析器

**XMLConfigBuilder有参构造器：**

```java
    private XMLConfigBuilder(XPathParser parser, String environment, Properties props) {
    	// 通过new Configuration()的方式实例化实例化Configuration
        super(new Configuration());
        this.localReflectorFactory = new DefaultReflectorFactory();
        ErrorContext.instance().resource("SQL Mapper Configuration");
        this.configuration.setVariables(props);
        this.parsed = false;
        this.environment = environment;
        this.parser = parser;
    }
```

##### 4. parse()处理Configuration

XMLConfigBuilder对象创建后，会调用parse()方法，解析XML并将相关配置设置到Configuration对象中。

**XMLConfigBuilder的parse()方法：**

```java
    /**
     * 解析XML
     *
     * @return Configuration
     */
    public Configuration parse() {
        if (parsed) {
            throw new BuilderException("Each XMLConfigBuilder can only be used once.");
        }
        parsed = true;
        // 解析配置文件，根标签为configuration
        parseConfiguration(parser.evalNode("/configuration"));
        return configuration;
    }
```

**parseConfiguration**：解析xml中的每一个配置标签并设置到Configuration对象中

```java
    /**
     * 解析XMLconfiguration标签下的每一个标签
     *
     * @param root 配置文件
     */
    private void parseConfiguration(XNode root) {
        try {
            //issue117 read properties first
            // properties标签
            propertiesElement(root.evalNode("properties"));
            // settings标签
            Properties settings = settingsAsProperties(root.evalNode("settings"));
            // Vfs
            loadCustomVfs(settings);
            // 别名
            typeAliasesElement(root.evalNode("typeAliases"));
            // 插件
            pluginElement(root.evalNode("plugins"));
            // 对象工厂
            objectFactoryElement(root.evalNode("objectFactory"));
            // 对象包装工厂
            objectWrapperFactoryElement(root.evalNode("objectWrapperFactory"));
            // 反射工厂
            reflectorFactoryElement(root.evalNode("reflectorFactory"));
            // 设置配置项
            settingsElement(settings);
            // read it after objectFactory and objectWrapperFactory issue631
            // 环境
            environmentsElement(root.evalNode("environments"));
            // 多个数据库支持
            databaseIdProviderElement(root.evalNode("databaseIdProvider"));
            // 类型处理器
            typeHandlerElement(root.evalNode("typeHandlers"));
            // 解析Mapper
            mapperElement(root.evalNode("mappers"));
        } catch (Exception e) {
            throw new BuilderException("Error parsing SQL Mapper Configuration. Cause: " + e, e);
        }
    }
```

解析完成后，配置文件就转化为了XMLConfigBuilder中的Configuration对象，可以看到下图中，相关XML配置已经解析到了对象中。

##### 5. Configuration对象解析

Configuration是mybatis的核心配置对象，涵盖了几乎所有配置项，Mybatis所有的配置信息以及mapper的配置信息，全部存储于Configuration对象中，Configuration对象从初始创建会一直贯穿Mybatis运行的整个生命周期，为Mybatis的运行提供必要的配置信息。

**核心源码如下：**

```java
public class Configuration {
  // 环境，数据源、事务管理器等
  protected Environment environment;
  // boolean类型的相关配置
  protected boolean safeRowBoundsEnabled;
  protected boolean safeResultHandlerEnabled = true;
  protected boolean mapUnderscoreToCamelCase;
  protected boolean aggressiveLazyLoading;
  protected boolean multipleResultSetsEnabled = true;
  protected boolean useGeneratedKeys;
  protected boolean useColumnLabel = true;
  protected boolean cacheEnabled = true;
  protected boolean callSettersOnNulls;
  protected boolean useActualParamName = true;
  protected boolean returnInstanceForEmptyRow;
  // 日志、缓存等配置
  protected String logPrefix;
  protected Class <? extends Log> logImpl;
  protected Class <? extends VFS> vfsImpl;
  protected LocalCacheScope localCacheScope = LocalCacheScope.SESSION;
  protected JdbcType jdbcTypeForNull = JdbcType.OTHER;
  protected Set<String> lazyLoadTriggerMethods = new HashSet<String>(Arrays.asList(new String[] {
      "equals", "clone", "hashCode", "toString" }));
  protected Integer defaultStatementTimeout;
  protected Integer defaultFetchSize;
  protected ExecutorType defaultExecutorType = ExecutorType.SIMPLE;
  protected AutoMappingBehavior autoMappingBehavior = AutoMappingBehavior.PARTIAL;
  protected AutoMappingUnknownColumnBehavior autoMappingUnknownColumnBehavior = AutoMappingUnknownColumnBehavior.NONE;
  // 数据库连接属性、对象、反射工厂等配置
  protected Properties variables = new Properties();
  protected ReflectorFactory reflectorFactory = new DefaultReflectorFactory();
  protected ObjectFactory objectFactory = new DefaultObjectFactory();
  protected ObjectWrapperFactory objectWrapperFactory = new DefaultObjectWrapperFactory();
  // 懒加载、代理工厂
  protected boolean lazyLoadingEnabled = false;
  protected ProxyFactory proxyFactory = new JavassistProxyFactory(); //224 Using internal Javassist instead of OGNL
  protected String databaseId;
  protected Class<?> configurationFactory;
  // mapper注册器，将所有的mapper接口添加到内存中
  protected final MapperRegistry mapperRegistry = new MapperRegistry(this);
  // 拦截器链，存放所有拦截器
  protected final InterceptorChain interceptorChain = new InterceptorChain();
  // 类型处理注册器，存放所有的类型处理器
  protected final TypeHandlerRegistry typeHandlerRegistry = new TypeHandlerRegistry();
  // 别名处理注册器，存放所有别名处理器
  protected final TypeAliasRegistry typeAliasRegistry = new TypeAliasRegistry();
  // 语言驱动注册器，存放所有的语言驱动处理类
  protected final LanguageDriverRegistry languageRegistry = new LanguageDriverRegistry();
  // Map 
  // 存放所有的mappedStatements
  protected final Map<String, MappedStatement> mappedStatements = new StrictMap<MappedStatement>("Mapped Statements collection");
  protected final Map<String, Cache> caches = new StrictMap<Cache>("Caches collection");
  protected final Map<String, ResultMap> resultMaps = new StrictMap<ResultMap>("Result Maps collection");
  protected final Map<String, ParameterMap> parameterMaps = new StrictMap<ParameterMap>("Parameter Maps collection");
  protected final Map<String, KeyGenerator> keyGenerators = new StrictMap<KeyGenerator>("Key Generators collection");
  protected final Set<String> loadedResources = new HashSet<String>();
  protected final Map<String, XNode> sqlFragments = new StrictMap<XNode>("XML fragments parsed from previous mappers");
  protected final Collection<XMLStatementBuilder> incompleteStatements = new LinkedList<XMLStatementBuilder>();
  protected final Collection<CacheRefResolver> incompleteCacheRefs = new LinkedList<CacheRefResolver>();
  protected final Collection<ResultMapResolver> incompleteResultMaps = new LinkedList<ResultMapResolver>();
  protected final Collection<MethodResolver> incompleteMethods = new LinkedList<MethodResolver>();
}
```

##### 6. MappedStatement解析过程

在Configuration对象中，存放了一个MappedStatement对象的Map集合。

```java
 protected final Map<String, MappedStatement> mappedStatements = new StrictMap<MappedStatement>("Mapped Statements collection");
```

mapper中的每一个增删改查最终会被解析成一个MappedStatement。MappedStatement中存放了关于当前操作接口的所有信息，包括xml位置、原始SQL、配置、参数等等。

**MappedStatement核心属性如下：**

```java
public final class MappedStatement {
  //
  private String resource;
  // 配置对象
  private Configuration configuration;
  // 在命名空间中唯一的标识符，可以被用来引用这条配置信息
  private String id;
  // 用于设置JDBC中Statement对象的fetchSize属性，该属性用于指定SQL执行后返回的最大行数。
  private Integer fetchSize;
  // 驱动程序等待数据库返回请求结果的秒数，超时将会抛出异常。
  private Integer timeout;
  // 参数可选值为STATEMENT、PREPARED或CALLABLE，这会让MyBatis分别使用Statement、PreparedStatement或CallableStatement与数据库交互，默认值为PREPARED。
  private StatementType statementType;
  // 参数可选值为FORWARD_ONLY、SCROLL_SENSITIVE或SCROLL_INSENSITIVE，用于设置ResultSet对象的特征，默认未设置，由JDBC驱动决定。
  private ResultSetType resultSetType;
  //
  private SqlSource sqlSource;
  //
  private Cache cache;
  // 引用通过<parameterMap>标签定义的参数映射，该属性已经废弃。
  private ParameterMap parameterMap;
  //
  private List<ResultMap> resultMaps;
  //
  private boolean flushCacheRequired;
  // 是否使用二级缓存。如果将其设置为true，则会导致本条语句的结果被缓存在MyBatis的二级缓存中，对应<select>标签，该属性的默认值为true。
  private boolean useCache;
  // 这个设置仅针对嵌套结果select语句适用，如果为true，就是假定嵌套结果包含在一起或分组在一起，这样的话，当返回一个主结果行的时候，就不会发生对前面结果集引用的情况。这就使得在获取嵌套结果集的时候不至于导致内存不够用，默认值为false。
  private boolean resultOrdered;
  //
  private SqlCommandType sqlCommandType;
  //
  private KeyGenerator keyGenerator;
  private String[] keyProperties;
  private String[] keyColumns;
  private boolean hasNestedResultMaps;
  private String databaseId;
  private Log statementLog;
  private LanguageDriver lang;
  private String[] resultSets;
}
```

**1、** 调用XMLConfigBuilder.parseConfiguration(XNoderoot)方法开始解析mappers标签；

```java
            // 解析Mapper XML
            mapperElement(root.evalNode("mappers"));
```

**1、** 调用XMLConfigBuilder.mapperElement(XNodeparent)解析mapper标签内容；

```java
    /**
     *  解析 mappers 标签
     * @param parent XML 文件对象
     * @throws Exception
     */
    private void mapperElement(XNode parent) throws Exception {
        if (parent != null) {
            // 遍历XML节点
            for (XNode child : parent.getChildren()) {
                // 如果配置的是package
                if ("package".equals(child.getName())) {
                    // 获取package的配置项 org.pearl.mybatis.demo.dao
                    String mapperPackage = child.getStringAttribute("name");
                    //  调用addMappers方法
                    configuration.addMappers(mapperPackage);
                } else {
                    String resource = child.getStringAttribute("resource");
                    String url = child.getStringAttribute("url");
                    String mapperClass = child.getStringAttribute("class");
                    if (resource != null && url == null && mapperClass == null) {
                        ErrorContext.instance().resource(resource);
                        InputStream inputStream = Resources.getResourceAsStream(resource);
                        XMLMapperBuilder mapperParser = new XMLMapperBuilder(inputStream, configuration, resource, configuration.getSqlFragments());
                        mapperParser.parse();
                    } else if (resource == null && url != null && mapperClass == null) {
                        ErrorContext.instance().resource(url);
                        InputStream inputStream = Resources.getUrlAsStream(url);
                        XMLMapperBuilder mapperParser = new XMLMapperBuilder(inputStream, configuration, url, configuration.getSqlFragments());
                        mapperParser.parse();
                    } else if (resource == null && url == null && mapperClass != null) {
                        Class<?> mapperInterface = Resources.classForName(mapperClass);
                        configuration.addMapper(mapperInterface);
                    } else {
                        throw new BuilderException("A mapper element may only specify a url, resource or class, but not more than one.");
                    }
                }
            }
        }
    }
```

**1、** 调用Configuration.addMappers(StringpackageName)；

```java
  public void addMappers(String packageName) {
    // mapper注册器添加mapper包
    mapperRegistry.addMappers(packageName);
  }
```

**1、** 通过MapperRegistry注册器，调用addMappers方法；

```java
    /**
     * 添加mapper
     *
     * @param packageName mapper包名 org.pearl.mybatis.demo.dao
     * @param superType   父类 java.lang.Object
     */
    public void addMappers(String packageName, Class<?> superType) {
        // ResolverUtil 工具类，获取mapper扫描包下所有mapper接口
        ResolverUtil<Class<?>> resolverUtil = new ResolverUtil<Class<?>>();
        resolverUtil.find(new ResolverUtil.IsA(superType), packageName);
        // 遍历mapper接口 
        Set<Class<? extends Class<?>>> mapperSet = resolverUtil.getClasses();
        for (Class<?> mapperClass : mapperSet) {
            addMapper(mapperClass);
        }
    }
```

**1、** 在循环中继续调用addMappers方法；

```java
    /**
     * 添加 Mapper
     *
     * @param type Mapper 接口
     * @param <T>  泛型
     */
    public <T> void addMapper(Class<T> type) {
        if (type.isInterface()) {
            // 如果添加此名称的mapper  报错
            if (hasMapper(type)) {
                throw new BindingException("Type " + type + " is already known to the MapperRegistry.");
            }
            boolean loadCompleted = false;
            try {
                //   private final Map<Class<?>, MapperProxyFactory<?>> knownMappers
                //   knownMappers中添加 mapper的代理工厂对象
                knownMappers.put(type, new MapperProxyFactory<T>(type));
                // It's important that the type is added before the parser is run
                // otherwise the binding may automatically be attempted by the
                // mapper parser. If the type is already known, it won't try.
                // 解析映射接口
                MapperAnnotationBuilder parser = new MapperAnnotationBuilder(config, type);
                parser.parse();
                loadCompleted = true;
            } finally {
                if (!loadCompleted) {
                    knownMappers.remove(type);
                }
            }
        }
    }
```

**1、** 调用MapperAnnotationBuilder.parse()解析当前mapper接口信息；

```java
  public void parse() {
    // 接口：interface org.pearl.mybatis.demo.dao.MenuMapper
    String resource = type.toString();
    //  先加载xml资源
    if (!configuration.isResourceLoaded(resource)) {
      // 先加载xml资源
      loadXmlResource();
      // 添加解析过的映射，下次判断有就不在解析
      configuration.addLoadedResource(resource);
      // 命名空间
      assistant.setCurrentNamespace(type.getName());
      // 二级缓存的处理
      parseCache();
      parseCacheRef();
      // 方法
      Method[] methods = type.getMethods();
      for (Method method : methods) {
        try {
          // issue237
          if (!method.isBridge()) {
            // 解析方法
            parseStatement(method);
          }
        } catch (IncompleteElementException e) {
          configuration.addIncompleteMethod(new MethodResolver(this, method));
        }
      }
    }
    parsePendingMethods();
  }
```

**1、** 调用MapperAnnotationBuilder.parseStatement(method)方法，解析每个mapper中的每一个方法；

```java
/**
   *  遍历解析映射接口的方法
   * @param method mapper 中的方法
   */
  void parseStatement(Method method) {
    // 获取方法入参类型 class org.pearl.mybatis.demo.pojo.query.UserQuery
    Class<?> parameterTypeClass = getParameterType(method);
    // 获取自定义SQL的XML解析方式
    LanguageDriver languageDriver = getLanguageDriver(method);
    // 处理方法上的注解
    SqlSource sqlSource = getSqlSourceFromAnnotations(method, parameterTypeClass, languageDriver);
    if (sqlSource != null) {
      // 处理Options注解
      Options options = method.getAnnotation(Options.class);
      final String mappedStatementId = type.getName() + "." + method.getName();
      Integer fetchSize = null;
      Integer timeout = null;
      StatementType statementType = StatementType.PREPARED;
      ResultSetType resultSetType = ResultSetType.FORWARD_ONLY;
      SqlCommandType sqlCommandType = getSqlCommandType(method);
      boolean isSelect = sqlCommandType == SqlCommandType.SELECT;
      boolean flushCache = !isSelect;
      boolean useCache = isSelect;
      KeyGenerator keyGenerator;
      String keyProperty = "id";
      String keyColumn = null;
      //  处理SelectKey注解
      if (SqlCommandType.INSERT.equals(sqlCommandType) || SqlCommandType.UPDATE.equals(sqlCommandType)) {
        // first check for SelectKey annotation - that overrides everything else
        SelectKey selectKey = method.getAnnotation(SelectKey.class);
        if (selectKey != null) {
          keyGenerator = handleSelectKeyAnnotation(selectKey, mappedStatementId, getParameterType(method), languageDriver);
          keyProperty = selectKey.keyProperty();
        } else if (options == null) {
          keyGenerator = configuration.isUseGeneratedKeys() ? Jdbc3KeyGenerator.INSTANCE : NoKeyGenerator.INSTANCE;
        } else {
          keyGenerator = options.useGeneratedKeys() ? Jdbc3KeyGenerator.INSTANCE : NoKeyGenerator.INSTANCE;
          keyProperty = options.keyProperty();
          keyColumn = options.keyColumn();
        }
      } else {
        keyGenerator = NoKeyGenerator.INSTANCE;
      }
      if (options != null) {
        if (FlushCachePolicy.TRUE.equals(options.flushCache())) {
          flushCache = true;
        } else if (FlushCachePolicy.FALSE.equals(options.flushCache())) {
          flushCache = false;
        }
        useCache = options.useCache();
        fetchSize = options.fetchSize() > -1 || options.fetchSize() == Integer.MIN_VALUE ? options.fetchSize() : null; //issue348
        timeout = options.timeout() > -1 ? options.timeout() : null;
        statementType = options.statementType();
        resultSetType = options.resultSetType();
      }
      String resultMapId = null;
      // 处理ResultMap
      ResultMap resultMapAnnotation = method.getAnnotation(ResultMap.class);
      if (resultMapAnnotation != null) {
        String[] resultMaps = resultMapAnnotation.value();
        StringBuilder sb = new StringBuilder();
        for (String resultMap : resultMaps) {
          if (sb.length() > 0) {
            sb.append(",");
          }
          sb.append(resultMap);
        }
        resultMapId = sb.toString();
      } else if (isSelect) {
        resultMapId = parseResultMap(method);
      }
      //
      assistant.addMappedStatement(
          mappedStatementId,
          sqlSource,
          statementType,
          sqlCommandType,
          fetchSize,
          timeout,
          // ParameterMapID
          null,
          parameterTypeClass,
          resultMapId,
          getReturnType(method),
          resultSetType,
          flushCache,
          useCache,
          // TODO gcode issue577
          false,
          keyGenerator,
          keyProperty,
          keyColumn,
          // DatabaseID
          null,
          languageDriver,
          // ResultSets
          options != null ? nullOrEmpty(options.resultSets()) : null);
    }
  }
```

**1、** 最终调用MapperBuilderAssistant.addMappedStatement方法将每个mapper中的方法添加到configuration对象中；

```java
  public MappedStatement addMappedStatement(
      String id,
      SqlSource sqlSource,
      StatementType statementType,
      SqlCommandType sqlCommandType,
      Integer fetchSize,
      Integer timeout,
      String parameterMap,
      Class<?> parameterType,
      String resultMap,
      Class<?> resultType,
      ResultSetType resultSetType,
      boolean flushCache,
      boolean useCache,
      boolean resultOrdered,
      KeyGenerator keyGenerator,
      String keyProperty,
      String keyColumn,
      String databaseId,
      LanguageDriver lang,
      String resultSets) {
    // 判断是否解决缓存引用
    if (unresolvedCacheRef) {
      throw new IncompleteElementException("Cache-ref not yet resolved");
    }
    // 创建ID org.pearl.mybatis.demo.dao.MenuMapper.selectDynamicUserList
    id = applyCurrentNamespace(id, false);
    // 判断是否是SELECT 语句
    boolean isSelect = sqlCommandType == SqlCommandType.SELECT;
   // 获取MappedStatement 构建者对象
    MappedStatement.Builder statementBuilder = new MappedStatement.Builder(configuration, id, sqlSource, sqlCommandType)
        .resource(resource)
        .fetchSize(fetchSize)
        .timeout(timeout)
        .statementType(statementType)
        .keyGenerator(keyGenerator)
        .keyProperty(keyProperty)
        .keyColumn(keyColumn)
        .databaseId(databaseId)
        .lang(lang)
        .resultOrdered(resultOrdered)
        .resultSets(resultSets)
        .resultMaps(getStatementResultMaps(resultMap, resultType, id))
        .resultSetType(resultSetType)
        .flushCacheRequired(valueOrDefault(flushCache, !isSelect))
        .useCache(valueOrDefault(useCache, isSelect))
        .cache(currentCache);
    // 获取ParameterMap对象
    ParameterMap statementParameterMap = getStatementParameterMap(parameterMap, parameterType, id);
    if (statementParameterMap != null) {
      statementBuilder.parameterMap(statementParameterMap);
    }
    // 构建MappedStatement
    MappedStatement statement = statementBuilder.build();
    // 将MappedStatement添加到configuration对象中
    configuration.addMappedStatement(statement);
    return statement;
  }
```

##### 7. 创建DefaultSqlSessionFactory

通过Configuration 对象，调用DefaultSqlSessionFactory构造参数创建SqlSessionFactory对象

```java
    public SqlSessionFactory build(Configuration config) {
        return new DefaultSqlSessionFactory(config);
    }
```

### 总结

通过以上流程，就构建了一个SqlSessionFactory对象，其核心就是Configuration 对象。
