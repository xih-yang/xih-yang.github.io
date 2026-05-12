# 14、MyBatis 源码分析 - mapping 包
- 来源：https://ddkk.com/zhuanlan/orm/mybatis/7/14.html
- 分类：ORM框架
- 分组：教程目录
> 在上一篇文章中，我们学习了 builder 包，它的作用就是借助解析器将 XML 进行解析，然后构建为解析实体类。可以认为解析实体类就是用来存储相关信息的类。

mapping 包中就定义了很多解析实体类。从总的来看，其实大都是和 XML Mapper 文件中的一个数据库操作节点相关的实体类，还有当前环境相关的实体类。

**数据库操作节点相关实体类**

- MappedStatement
- StatementType
- SqlSource
- ResultMap

ResultMapping

ParameterMap

- ParameterMapping

Discriminator

ResultSetType

**环境相关实体类**

- Environment
- DatabaseIdProvider

### 数据库操作节点相关实体类

数据库操作节点相关实体类如果再细分的话，其实还可以细分为 **SQL**、**输入参数处理**、**输出结果处理**。

#### SQL 语句处理

在`mapping` 包中和 SQL 语句处理相关的类主要有三个，分别是 `MappedStatement`、`SqlSource`、`BoundSql`。`MappedStatement` 保存了数据库操作节点的相关信息，其中就包含了 SQL 语句也就是 `SqlSource`，但是 `SqlSource` 只是一个接口，它还有四个实现类，通过不同的情况选用不用的实现类，但最终得到的都是 `BoundSql`。

##### MappedStatement

由于`MappedStatement` 保存了数据库操作节点的全部信息，所以其中有很多成员变量，但是根据操作节点的类型不同(select、insert、update、delete)，参数不一定都是必须的，所以在 `MappedStatement` 的内部就声明了静态内部类，也就是 `MappedStatement.Builder`，专门用来创建 `MappedStatement`。

**核心成员变量**

```java
  // 操作节点所属的 XML Mapper 文件
  private String resource;
  // 全局配置信息
  private Configuration configuration;
  // 当前操作节点的ID
  private String id;
  // 这是一个给驱动的建议值，尝试让驱动程序每次批量返回的结果行数等于这个设置值。 默认值为未设置（unset）（依赖驱动）。
  private Integer fetchSize;
  // 这个设置是在抛出异常之前，驱动程序等待数据库返回请求结果的秒数。默认值为未设置（unset）（依赖数据库驱动）。
  private Integer timeout;
  // 可选 STATEMENT，PREPARED 或 CALLABLE。这会让 MyBatis 分别使用 Statement，PreparedStatement 或 CallableStatement。
  // 默认值：PREPARED。
  private StatementType statementType;
  // FORWARD_ONLY，SCROLL_SENSITIVE, SCROLL_INSENSITIVE 或 DEFAULT（等价于 unset） 中的一个，默认值为 unset （依赖数据库驱动）。
  private ResultSetType resultSetType;
  // SQL 信息
  private SqlSource sqlSource;
  // 二级缓存
  private Cache cache;
  // 请求参数映射
  private ParameterMap parameterMap;
  // 结果映射列表，由于可能是多结果集，所以是列表形式。例如 resultMap="aa,bb"
  private List<ResultMap> resultMaps;
  // 将其设置为 true 后，只要语句被调用，都会导致本地缓存和二级缓存被清空，默认值：false。
  private boolean flushCacheRequired;
  // 将其设置为 true 后，将会导致本条语句的结果被二级缓存缓存起来，默认值：对 select 元素为 true。
  private boolean useCache;
  // 这个设置仅针对嵌套结果 select 语句：如果为 true，将会假设包含了嵌套结果集或是分组，当返回一个主结果行时，就不会产生对前面结果集的引用。
  // 这就使得在获取嵌套结果集的时候不至于内存不够用。默认值：false。
  private boolean resultOrdered;
  // SQL 语句类型 UNKNOWN, INSERT, UPDATE, DELETE, SELECT, FLUSH
  private SqlCommandType sqlCommandType;
  /* 以下三个成员变量用于 insert 和 update 类型的语句*/
  // keyGenerator
  private KeyGenerator keyGenerator;
  // 主键对应的成员变量名称
  private String[] keyProperties;
  // 主键列名称
  private String[] keyColumns;
  // 是否有关联的 ResultMap
  private boolean hasNestedResultMaps;
  // 数据库ID
  private String databaseId;
  // 用于打印日志
  private Log statementLog;
  // 语言驱动。默认值：RawLanguageDriver。
  private LanguageDriver lang;
  // 这个设置仅适用于多结果集的情况，每个结果集的名称
  private String[] resultSets;
```

可以看到，其实是和数据库操作节点十分相近的，由于很多成员变量之前有讲过，或者是后面才会慢慢讲到，所以这里就不会展开的去解释了，大家对照着操作操作节点看一遍有个印象就好了。

##### SqlSource

`SqlSource` 是一个解析实体接口，它对应了数据库操作节点的 SQL 语句。例如下面的代码中，2、3、4 行都是属于 SqlSource。

```java
1  <select id="selectById" resultType="user">
2    SELECT id, name, age, email
3    FROM user
4    WHERE id = ${userId}
5  </select>
```

由于Mybatis 中的 SQL 是特别灵活的，所以为了高效的解析，将它们的解析类做了区分。`SqlSource` 接口有四个实现类，如下图所示。

- DynamicSqlSource：动态 SQL 语句。所谓动态 SQL 是指含有动态 SQL 节点(如 “if” 节点)或者含有 “`$`{}” 占位符的语句。
- RawSqlSource：原生 SQL 语句。指非动态语句，语句中可能含有 “#{}” 占位符，但不含有动态 SQL 节点，也不含有 “`$`{}” 占位符的语句。
- StaticSqlSource：静态语句。语句中可能含有 “?”，可以直接提交给数据库执行。
- ProviderSqlSource：上面的三种都是从 XML 文件中提取出来的。而这个是从注解中提取出来的。由于在上篇文章中已经大概讲过了，这里就不再重复的说明了。

它们关系转换如下图所示。

##### BoundSql

`BoundSql` 是 `SqlSource` 层层转换得到的重要的产物，它存储的基本上就是最终形式的 SQL，并且还有实参信息。

**核心成员变量**

```java
  // 可能有 "?" 占位符的 SQL 语句
  private final String sql;
  // 参数映射列表
  private final List<ParameterMapping> parameterMappings;
  // 实参对象本身
  private final Object parameterObject;
  // 实参
  private final Map<String, Object> additionalParameters;
  // additionalParameters 的包装对象
  private final MetaObject metaParameters;
```

#### 输入参数的处理

主要是为了处理请求参数类型的转换，格式，保留小数位数等问题。

##### ParameterMap

对应的是 XML Mapper 文件中的 。例如：

```java
  <parameterMap id="user" type="User">
    <parameter property="id" javaType="Long"/>
    <parameter property="name" javaType="String"/>
  </parameterMap>
```

> 这是老式风格的参数映射。此元素已被废弃，并可能在将来被移除！请使用行内参数映射。文档中不会介绍此元素。—— Mybatis 官网。

新式的行内参数映射格式为：#{id, javaType=Long, …}

##### ParameterMapping

不管是老式参数映射还是行内参数映射，每个属性对应的参数映射都是由一个 `ParameterMapping` 来表示的。只是存放的位置不同了，老式参数映射是存放到 `ParameterMap` 中的，而行内参数映射的是保存在 `BoundSql` 中的。

**核心成员变量**

```java
  // 全局配置
  private Configuration configuration;
  // 成员变量名称
  private String property;
  // 请求参数模式 IN, OUT, INOUT
  private ParameterMode mode;
  // java类型
  private Class<?> javaType = Object.class;
  // jdbc类型
  private JdbcType jdbcType;
  // 保留小数的位数
  private Integer numericScale;
  // 类型处理器
  private TypeHandler<?> typeHandler;
  // 结果映射ID
  private String resultMapId;
  // jdbc类型名称
  private String jdbcTypeName;
  // 表达式(在当前版本的 Mybatis 中还没有使用到)
  private String expression;
```

#### 输出结果处理

在映射文件的数据库操作节点中，可以直接设置 `resultType` 属性将输出结果映射为 Java 对象。但是更为灵活也更为强大的方式为设置 `resultMap` 属性，它支持输出结果的组装、判断、懒加载等。

例如：

```java
  <resultMap id="userMap" type="User" autoMapping="false"> -- ResultMap 开始
    <id property="id" column="id"/> -- ResultMapping
    <result property="name" column="name"/> -- ResultMapping
    <discriminator javaType="int" column="sex"> -- Discriminator 开始
      <case value="0" resultMap="boyUserMap"/>
      <case value="1" resultMap="girlUserMap"/>
    </discriminator> -- Discriminator 结束
  </resultMap> -- ResultMap 结束
  <resultMap id="girlUserMap" type="Girl" extends="userMap">
    <result property="email" column="email" />
  </resultMap>
  <resultMap id="boyUserMap" type="Boy" extends="userMap">
    <result property="age" column="age" />
  </resultMap>
```

##### ResultMap

`ResultMap` 对应的就是 `resultMap` 节点，其属性和 `resultMap` 节点的信息基本一致。

**核心成员变量**

```java
  // 全局配置信息
  private Configuration configuration;
  // resultMap 的编号
  private String id;
  // 最终输出结果对应的 Java 类
  private Class<?> type;
  /*
  * 根据属性是否在 <constructor> 中，将属性分为了两类：构造方法中的属性和非构造方法中的属性
  * 根据属性是否为 <id> 或 <idArg>，将属性分为了两类：id 属性和非 id 属性
  * */
  // XML 中的 <result> 的列表，即 ResultMapping 的列表
  private List<ResultMapping> resultMappings;
  // XML 中 <id> 和 <idArg> 的列表
  private List<ResultMapping> idResultMappings;
  // XML 中 <constructor> 中各个属性的列表
  private List<ResultMapping> constructorResultMappings;
  // XML 中非 <constructor> 相关的属性列表
  private List<ResultMapping> propertyResultMappings;
  // 所有参与映射的数据库中字段的集合
  private Set<String> mappedColumns;
  // 所有参与映射的 Java 对象属性集合
  private Set<String> mappedProperties;
  // 鉴别器
  private Discriminator discriminator;
  // 是否存在嵌套映射
  private boolean hasNestedResultMaps;
  // 是否存在嵌套查询
  private boolean hasNestedQueries;
  // 是否启动自动映射
  private Boolean autoMapping;
```

其中稍微难以理解的就是四个 *ResultMappings 列表。不过我相信通过下面的例子你应该就能明白了。

```java
  <resultMap id="testResultMap" type="User">
    <constructor>
      <idArg column="id" name="id"/>  -- 是ID，也是构造器参数，保存在 idResultMappings 和 constructorResultMappings。
      <arg column="name" name="name"/> -- 是构造器参数，但不是ID，只保存在 constructorResultMappings 中。
    </constructor>
    <id column="pId" property="pId" /> -- 是ID，但不是构造器参数，保存在 idResultMappings 和 propertyResultMappings 中。
    <result column="pName" property="pName"/> -- 既不是ID，也不是构造器参数，只保存在 propertyResultMappings 中。
  </resultMap>
```

##### ResultMapping 类

`` 中的 `idArg`、`arg`、`id`、`result` 标签都对应一个 `ResultMap` 对象。

**核心成员变量**

```java
  // 全局配置信息
  private Configuration configuration;
  // Java Bean 成员变量名称
  private String property;
  // SQL 查询返回结果的列名称
  private String column;
  // Java 类型
  private Class<?> javaType;
  // JDBC 类型
  private JdbcType jdbcType;
  // 类型处理器
  private TypeHandler<?> typeHandler;
  // 关联的结果集ID
  private String nestedResultMapId;
  // 关联的查询语句ID
  private String nestedQueryId;
  // 不为 NULL 的列
  private Set<String> notNullColumns;
  // SQL 查询返回结果的列名称前缀
  private String columnPrefix;
  // 结果标志，枚举类型 ID, CONSTRUCTOR
  // 只会有四种情况
  // 1. 既不是ID，也不是构造器参数
  // 2. 是ID，但不是构造器参数
  // 3. 是构造器参数，但不是ID
  // 4. 是ID，也是构造器参数
  private List<ResultFlag> flags;
  // 聚合的结果集映射
  private List<ResultMapping> composites;
  // ResultSet
  private String resultSet;
  // 外键
  private String foreignColumn;
  // 懒加载
  private boolean lazy;
```

##### Discriminator

`Discriminator` 是 resultMap 内部的鉴别器，类似于 `case when` 语句，它能够根据查询结果的某些条件的不同，从而选用不同的映射。

在前面的例子中，根据 `sex` 字段的值来决定返回 `Boy` 还是 `Girl`。即，`` 其实就是为了选择出最终要返回的 `ResultMap`。接下来让我们来看看它的选择逻辑。

```java
// DefaultResultSetHandler.java
  public ResultMap resolveDiscriminatedResultMap(ResultSet rs, ResultMap resultMap, String columnPrefix) throws SQLException {
    // 已经处理过的鉴别器
    Set<String> pastDiscriminators = new HashSet<>();
    Discriminator discriminator = resultMap.getDiscriminator();
    while (discriminator != null) {
      // 通过 column 找到 value
      final Object value = getDiscriminatorValue(rs, discriminator, columnPrefix);
      // 通过 value 找到对应的 resultMapId
      final String discriminatedMapId = discriminator.getMapIdFor(String.valueOf(value));
      if (configuration.hasResultMap(discriminatedMapId)) {
        resultMap = configuration.getResultMap(discriminatedMapId);
        // 继续分析下一层，因为当前的 ResultMap 也可能有鉴别器
        Discriminator lastDiscriminator = discriminator;
        discriminator = resultMap.getDiscriminator();
        // 如果辨别器出现了环路就停止继续递归向下查找
        if (discriminator == lastDiscriminator || !pastDiscriminators.add(discriminatedMapId)) {
          break;
        }
      } else {
        break;
      }
    }
    return resultMap;
  }
  private Object getDiscriminatorValue(ResultSet rs, Discriminator discriminator, String columnPrefix) throws SQLException {
    // 要判断的列信息，记录的信息包含 <discriminator javaType="int" column="sex">
    final ResultMapping resultMapping = discriminator.getResultMapping();
    final TypeHandler<?> typeHandler = resultMapping.getTypeHandler();
    // prependPrefix() 给列名拼接前缀。然后获取对应列的值
    return typeHandler.getResult(rs, prependPrefix(resultMapping.getColumn(), columnPrefix));
  }
```

#### 多数据库厂商处理功能

Mybatis 是可以支持多种数据库厂商的，可以根据不同的数据厂商执行不同的语句，这种多厂商的支持是基于映射语句中的 `databaseId` 属性。Mybatis 会加载带有匹配当前数据库 `databaseId` 属性和所有不带 `databaseId` 属性的语句。但是如果找到带有 `databaseId` 和不带 `databaseId` 的相同语句，则后者会被抛弃。

假设当前使用的是 mysql 数据库，样例如下：

```xml
<databaseIdProvider type="DB_VENDOR">
  <property name="Oracle" value="oracle" />
  <property name="MySQL" value="mysql" />
</databaseIdProvider>
// 有效：databaseId 匹配
<select id="selectById" resultType="user" databaseId="mysql">
  SELECT id, name, age, email
  FROM user
  WHERE id = ${userId}
</select>
// 无效：databaseId 不匹配
<select id="selectById" resultType="user" databaseId="oracle">
  SELECT id, name, age, email
  FROM user
  WHERE id = ${userId}
</select>
// 有效：没有设置 databaseId
<select id="selectMapById" resultType="Map">
  SELECT id, name, age, email
  FROM user
  WHERE id = ${userId}
</select>
```

`DB_VENDOR` 是 `VendorDatabaseIdProvider` 的别名，代表使用的是 `VendorDatabaseIdProvider` 作为数据库ID提供者，它是 `DatabaseIdProvider` 的子类，可以得到当前的 `databaseId`。代码如下：

```java
  // 实现的 DatabaseIdProvider 的抽象方法
  @Override
  public String getDatabaseId(DataSource dataSource) {
    if (dataSource == null) {
      throw new NullPointerException("dataSource cannot be null");
    }
    try {
      return getDatabaseName(dataSource);
    } catch (Exception e) {
    }
    return null;
  }
  private String getDatabaseName(DataSource dataSource) throws SQLException {
    // 通过 DataSource 获取到数据库的连接，从连接中就能得到数据库厂商的信息
    String productName = getDatabaseProductName(dataSource);
    // 如果没有声明了 <databaseIdProvider/> 节点，则直接返回数据库厂商名称
      // 如果设置了，则返回预设的数据库厂商名称的别名
    if (this.properties != null) {
      for (Map.Entry<Object, Object> property : properties.entrySet()) {
        if (productName.contains((String) property.getKey())) {
          return (String) property.getValue();
        }
      }
      // 没有匹配的，返回 null
      return null;
    }
    return productName;
  }
```

#### Environment

`Environment` 也是一个解析实体类，对应了 Mybatis 配置文件中的 `` 节点。对应关系如下：

**mybatis-config.xml 的 environments 节点配置**

```xml
<environments default="development">
  <environment id="development">
    <transactionManager type="JDBC"/>
    <dataSource type="UNPOOLED">
      <property name="driver" value="com.mysql.cj.jdbc.Driver"/>
      <property name="url" value="jdbc:mysql://127.0.0.1:3306/test1"/>
      <property name="username" value="${username}"/>
      <property name="password" value="${password}"/>
    </dataSource>
  </environment>
</environments>
```

**Environment 核心成员变量**

```java
  // 数据源ID，在当前配置下为：development
  private final String id;
  // 事务工厂类
  private final TransactionFactory transactionFactory;
  // 数据源
  private final DataSource dataSource;
```

#### CacheBuilder

是用于构建 `Cache` 的建造器类。Mybatis 的缓存策略使用的是装饰者模式，所以有一个基础的实现类也就是 implementation，再其上通过 decorators 来实现缓存功能。Mybatis 的默认基础实现类为 `PerpetualCache` 其中的记录都是**永久保存**的。默认的装饰者为 LruCache 它会通过记录每次所有缓存的 key，在 key 的数量超过限定的时候可以通过调用代理类的删除方法，删除**最近最少使用**的缓存，防止缓存记录无限增长。

**核心成员变量**

```java
  // 映射文件的命名空间
  private final String id;
  // 缓存的实现类
  private Class<? extends Cache> implementation;
  // 装饰者
  private final List<Class<? extends Cache>> decorators;
  // 缓存大小
  private Integer size;
  // 定时清除缓存的间隔
  private Long clearInterval;
  // 允许读和写
  private boolean readWrite;
  // 需要向 Cache 中设置的配置
  private Properties properties;
  // 是否并发阻塞
  private boolean blocking;
```

**核心方法**

```java
  public Cache build() {
    // 设置默认的基础实现类和装饰者
    setDefaultImplementations();
    // 创建一个基础的 Cache 实现类
    Cache cache = newBaseCacheInstance(implementation, id);
    // 为参数设置属性
    setCacheProperties(cache);
    if (PerpetualCache.class.equals(cache.getClass())) {
      // 设置用户声明的装饰器类
      for (Class<? extends Cache> decorator : decorators) {
        cache = newCacheDecoratorInstance(decorator, cache);
        setCacheProperties(cache);
      }
      // 设置标准的装饰器类
      cache = setStandardDecorators(cache);
    } else if (!LoggingCache.class.isAssignableFrom(cache.getClass())) {
      // 如果基础实现类不是 PerpetualCache 说明是用户自定义的基础实现类，则装饰类就只有 Logging
      cache = new LoggingCache(cache);
    }
    return cache;
  }
  private void setDefaultImplementations() {
    if (implementation == null) {
      // 设置默认的基础实现类
      implementation = PerpetualCache.class;
      if (decorators.isEmpty()) {
        // 默认的装饰者类
        decorators.add(LruCache.class);
      }
    }
  }
  private Cache setStandardDecorators(Cache cache) {
    MetaObject metaCache = SystemMetaObject.forObject(cache);
    // 如果有 size 属性，则需要设置属性值
    if (size != null && metaCache.hasSetter("size")) {
      metaCache.setValue("size", size);
    }
    // 如果设置了缓存的清理间隔，则包装定期删除缓存的装饰类
    if (clearInterval != null) {
      cache = new ScheduledCache(cache);
      ((ScheduledCache) cache).setClearInterval(clearInterval);
    }
    // 如果允许读写缓存，则包装序列化的装饰类
    if (readWrite) {
      cache = new SerializedCache(cache);
    }
    // 包装能打印缓存命中率的装饰类
    cache = new LoggingCache(cache);
    // 包装能让方法修饰了 synchronized 的装饰类
    cache = new SynchronizedCache(cache);
    // 如果允许阻塞的话，就要包装支持阻塞的装饰类
    if (blocking) {
      cache = new BlockingCache(cache);
    }
    return cache;
  }
```

可以看到使用了很多的装饰类，由于后面都会讲到，所以就不在这里详细展开了。可以发现，通过**装饰者模式可以灵活的进行功能扩展**。

#### 辅助枚举类

在mapping 包中还有一些枚举类。作用如下：

- FetchType：延迟加载设置；
- ParameterMode：参数类型，指输入参数、输出参数等；
- ResultFlag：返回结果中属性的特殊标志，表示是否为ID属性、是否为构造器属性；
- ResultSetType：结果集支持的访问方式；
- SqlCommandType：SQL 命令类型，指增、删、改、查等；
- StatementType：SQL 语句种类，指是否为预编译的语句，是否为存储过程等。
