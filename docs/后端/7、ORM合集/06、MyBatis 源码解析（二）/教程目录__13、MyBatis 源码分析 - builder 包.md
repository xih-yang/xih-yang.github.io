# 13、MyBatis 源码分析 - builder 包
- 来源：https://ddkk.com/zhuanlan/orm/mybatis/7/13.html
- 分类：ORM框架
- 分组：教程目录
> 在上一篇文章中，我们学习了 binding 包，它的作用就是将 Java 的方法和映射文件中的 SQL 做绑定。但是我们只看到了 MethodSignature 从 Configuration 中去找到对应的 MappedStatement，但是并不知道 MethodStatement 是怎么构建出来的。
>
> 并且在之前的 parsing 包，我们也有提到过。解析是将 XML 格式的文本进行解析，并提取出其中的关键信息，但是一般在解析之后，下一步操作就是构建。如果 XML 中的内容只需要用一次就不用再管了，那么就无所谓，但是 XML 中的内容在程序运行的过程中经常被用到的话，我们一般都会将它构建为 Java 的对象，以便在后面使用的时候可以直接去对象中拿，而不需要再对 XML 进行解析。

将与配置解析相关的类分为两种：解析器类、解析实体类

- 解析器类：提供配置的解析功能，负责完成配置信息的提取、转换。Mybatis 中这样的类有 XMLConfigBuilder 类、XMLMapperBuilder 类、CacheRefResolver 类和 XMLStatementBuilder 类等。
- 解析实体类：提供配置的保存功能。该类在机构上与配置信息有对应关系。配置信息最终会保存到解析实体类的属性中。Mybatis 中这样的类有 Configuration 类、ReflectorFactory 类、Environment 类、DataSource 类、ParameterMap 类、ParameterMapping 类、Discriminator 类和 SqlNode 类等。

由于配置文件中的各个节点和解析器类以及解析实体类是有对应关系的。所以我们在配置文件中进行标注，使在阅读源码的过程中不会那么头晕。

```xml
<!--mybatis-config.xml -->
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE configuration PUBLIC "-//mybatis.org//DTD Config 3.0//EN" "http://mybatis.org/dtd/mybatis-3-config.dtd">
<configuration> -- 对应 Configuration 类，由 XMLConfigBuilder 解析
  <properties>
    <property name="jdbc.username" value="{username}"/>
  </properties>
  <settings>
    <setting name="cacheEnable" value="true"/>
  </settings>
  <typeAliases> -- 对应 TypeAliasRegistry 类
    <typeAlias type="com.yinxy.demo.User" alias="user"/>
    <package name="com.yinxy.demo" /> -- 由 TypeAliasRegistry 类解析
  </typeAliases>
  <typeHandlers> -- 对应 TypeHanlderRegistry 类
    <typeHandler handler="com.yinxy.demo.TestTypeHandler"/>
  </typeHandlers>
  <objectFactory type="com.yinxy.TestObjectFactory"> -- 对应 ObjectFactory 类
    <property name="" value=""/>
  </objectFactory>
  <objectWrapperFactory type="com.yinxy.demo.TestObjectWrapperFactory"/> -- 对应 ObjectWrapperFactory 类
  <reflectorFactory type="com.yinxy.demo.TestReflectorFactory"/> -- 对应 ReflectorFactory 类
  <plugins>
    <plugin interceptor="com.yinxy.demo.TestInterceptor"> -- 对应 Interceptor 类
      <property name="" value=""/>
    </plugin>
  </plugins>
  <environments default="development">
    <environment id="development"> -- 对应 Environment 类
      <transactionManager type="JDBC"/>
      <dataSource type="POOLED"> -- 对应 DataSource 类
        <property name="driver" value="com.mysql.cj.jdbc.Driver"/>
        <property name="url" value="jdbc:mysql://127.0.0.1:3306/test1"/>
        <property name="username" value="${username}"/>
        <property name="password" value="${password}"/>
      </dataSource>
    </environment>
  </environments>
  <databaseIdProvider type="com.yiny.demo.MyDatabaseIdProvider"/> -- 对应 DatabaseIdProvider 类
  <mappers>
    <mapper resource="mapper.com.yinxy.demo/UserMapper.xml" /> -- 由 XMLMapperBuilder 解析
  </mappers>
</configuration>
```

```xml
<!-- TestMapper.xml -->
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper   PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
  "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="com.yinxy.demo.UserMapper"> -- 由 XMLMapperBuilder 类解析
  <cache-ref namespace="com.yinxy.demo.UserMapper"/> -- 由 CacheRefResovler 类解析
  <cache eviction="FIFO" flushInterval="60000"/> -- 对应 Cache 类
  <parameterMap id="testParameterMap" type="User"> -- 对应 ParameterMap 类
    <parameter property="name" javaType="String"/> -- 对应 ParameterMapping 类
    <parameter property="age" javaType="Integer"/> -- 对应 ParameterMapping 类
  </parameterMap>
  <resultMap id="testResultMap" type="User"> -- 对应 ResultMap 类
    <result property="id" column="id"/> -- 对应 ResultMapping 类
    <discriminator javaType="int" column="sex"> 对应 Discriminator 类
      <case value="0" resultMap="boyUserMap"/>
      <case value="1" resultMap="girlUserMap"/>
    </discriminator>
  </resultMap>
  <select id="selectById" resultMap="userMap"> -- 对应 MappedStatement 类，由 XMLStatementBuilder 解析
    SELECT * FROM user -- 对应 SqlSource 类，由 SqlSourceBuilder 解析
    <include refid="byId"/> -- 对应 XMLIncludeTransformer 解析
  </select>
  <select id="selectUsers" resultMap="userMapFull"> -- 对应 MappedStatement 类，由 XMLStatementBuilder 解析
    SELECT * -- 对应 SqlSource 类，由 SqlSourceBuilder 解析
    FROM user
    WHERE id IN
    <foreach collection="array" item="id" open="(" close=")"> -- 对应 SqlNode 类，由自身解析
     {id}
    </foreach>
  </select>
</mapper>
```

注：上面的两段代码浏览一下，大概明白就行了，等你们看源码的时候再对着看就会有恍然大悟的感觉了。现在看的话，可能还是比较迷茫的。

### 建造者模式

在这个包中，我们能看到很多都使用了**建造者模式**，为了方便小伙伴们的学习，所以要先帮大家分析一下建造者模式。

> 建造者模式：将一个复杂对象的构建与其表示分离，使得同样的构建过程可以创建不同表示。

可以用一种更通俗的话来解释，如果一个对象中有很多成员变量，但是其中的成员变量不是都是必须的，也有很多非必须的也就是可选的，如果要构建这样的一个对象，一般的做法就是通过对象的 set 方法。

但是这样是有弊端的，或者说并不灵活，如果有很多的规则的话，那么在你创建对象，并且 set 值的时候，你可能需要做很多的事情，写很多的判断语句。这样就将业务代码和校验逻辑混杂在了一起。所以就需要寻求一种更加好的方式。

将必要的属性通过构造方法初始化，可选的属性可以通过 `set` 方法来设置，最后调用 build 方法生成对象，并在里面做必要的逻辑判断。样例如下：

```java
public class User {
  Long id;
  String name;
  Integer age;
  String email;
  User() {
  }
  public static class Builder {
    private User user = new User();
    public Builder(Long id) {
      user.id = id;
    }
    public User build() {
      validate();
      return user;
    }
    private void validate() {
    }
    public Builder name(String name) {
      user.name = name;
      return this;
    }
    public Builder age(Integer age) {
      user.age = age;
      return this;
    }
    public Builder email(String email) {
      user.email = email;
      return this;
    }
  }
}
```

在翻阅Mybatis 源码的时候，你会看到很多类似的代码，使用的就是建造者模式。

### BaseBuilder 及其实现类

在builder 包中如果说有一个类是基石，那么这个类一定是 BaseBuilder。它是所有建造者的基类，虽然它是一个抽象类，但是并没有抽象方法，其中的方法也都是工具方法，被抽象出来提供给所有的子类使用。所以可能会看到继承 BaseBuilder 的也不一定是建造者类，而有些建造者也不一定会继承它，因为用不上它提供的方法。

[外链图片转存失败,源站可能有防盗链机制,建议将图片保存下来直接上传(img-gdFgFBap-1622465638561)(media/16218243879016/BaseBuilder.png)]

#### MapperBuilderAssistant

在`BaseBuilder` 的所有子类中最特殊的就是 `MapperBuilderAssistant`，因为它不是一个建造者而是一个辅助类，Mybatis 映射文件中的设置非常多，包括命名空间、缓存共享、结果映射等。最终这些设置将解析为不同的类，而 `MapperBuilderAssistant` 就是这些解析类的辅助类。

### SqlSourceBuilder 和 StaticSqlSource

`SqlSourceBuilder` 作为一个建造者类，是用来构建 `StaticSqlSource` 的，看上去像是构建其实更多的是解析，将 `DynamicSqlSource` 和 `RawSqlSource` 解析为 `StaticSqlSource`。

准确的来说，SqlSourceBuilder 能够将 DynamicSqlSource 和 RawSqlSource 中的 “#{}” 符号替换为 ‘?’，从而将他们转换为 StaticSqlSource。SqlSourceBuilder 解析过程如下：

```java
  /*
    originalSql：SELECT id, name, age, email FROM user WHERE id ={userId}
    newSql：SELECT id, name, age, email FROM user WHERE id = ?、将每个{} 都解析为了一个 ParameterMapping
  */
  public SqlSource parse(String originalSql, Class<?> parameterType,
    Map<String, Object> additionalParameters) {
    ParameterMappingTokenHandler handler = new ParameterMappingTokenHandler(configuration,
      parameterType, additionalParameters);
    GenericTokenParser parser = new GenericTokenParser("#{", "}", handler);
    String sql;
    // 是否需要去除多余的空格
    if (configuration.isShrinkWhitespacesInSql()) {
      // 去除多余的空格并替换{}
      sql = parser.parse(removeExtraWhitespaces(originalSql));
    } else {
      // 替换{}
      sql = parser.parse(originalSql);
    }
    return new StaticSqlSource(configuration, sql, handler.getParameterMappings());
  }
```

### CacheRefResolver 和 ResultMapResolver

从名字上看这两个类都是解析器类，分别用来解析 `` 和 `` 这两种节点，属性中包含了被解析类的相关属性，同时还包含了一个解析器，通过 `MapperBuilderAssistant` 的辅助就能完成解析工作。

那么为什么 Mybatis 在设计的时候还要封装一层呢？而不是直接在创建解析器类的时候，直接调用 `MapperBuilderAssistant` 完成解析呢？其实这样的设计主要是为了解决在解析过程中又依赖，但是依赖还没有被解析，那么当前的解析过程其实是失败的，如果再将解析过程封装为 `XXXResolver`，那么就可以将失败的解析器暂存起来，等到必要的时候再进行重试(其实在每次解析成功后，都会去尝试把之前失败的解析重试)。

#### CacheRefResolver

**核心成员变量**

```java
  // Mapper 建造者辅助类
  private final MapperBuilderAssistant assistant;
  // 被应用的 namespace，即要使用 cacheRef 的 namespace 缓存空间
  private final String cacheRefNamespace;
```

**核心方法**

```java
  // CacheRefResolver.java
  public Cache resolveCacheRef() {
    return assistant.useCacheRef(cacheRefNamespace);
  }
  // MapperBuilderAssistant.java
  public Cache useCacheRef(String namespace) {
    if (namespace == null) {
      throw new BuilderException("cache-ref element requires a namespace attribute.");
    }
    try {
      // 是否未解析缓存引用标示，防止在没有成功解析完缓存引用的情况下将 MappedStatement 纳入使用
      // true 没有解析或没有解析成功
      // false 解析完成
      unresolvedCacheRef = true;
      Cache cache = configuration.getCache(namespace);
      if (cache == null) {
        throw new IncompleteElementException(
          "No cache for namespace '" + namespace + "' could be found.");
      }
      currentCache = cache;
      unresolvedCacheRef = false;
      return cache;
    } catch (IllegalArgumentException e) {
      throw new IncompleteElementException(
        "No cache for namespace '" + namespace + "' could be found.", e);
    }
  }
```

#### ResultMapResolver

**核心成员变量**

```java
  // Mapper 建造者辅助类
  private final MapperBuilderAssistant assistant;
  // ResultMap 的id
  private final String id;
  // ResultMap 的 type 属性，即目标对象类型
  private final Class<?> type;
  // ResultMap 的 extends 属性，标志的父级 ResultMap 的id
  private final String extend;
  // ResultMap 中的 Discriminator 节点，即鉴别器
  private final Discriminator discriminator;
  // ResultMap 中的属性映射列表
  private final List<ResultMapping> resultMappings;
  // ResultMap 的 autoMapping 属性，即是否开启自动映射
  private final Boolean autoMapping;
```

**核心方法**

```java
  // ResultMapResolver.java
  public ResultMap resolve() {
    return assistant.addResultMap(this.id, this.type, this.extend, this.discriminator, this.resultMappings, this.autoMapping);
  }
  // MapperBuilderAssistant.java
  public ResultMap addResultMap(
    String id,
    Class<?> type,
    String extend,
    Discriminator discriminator,
    List<ResultMapping> resultMappings,
    Boolean autoMapping) {
    id = applyCurrentNamespace(id, false);
    extend = applyCurrentNamespace(extend, true);
    if (extend != null) {
      if (!configuration.hasResultMap(extend)) {
        throw new IncompleteElementException(
          "Could not find a parent resultmap with id '" + extend + "'");
      }
      ResultMap resultMap = configuration.getResultMap(extend);
      List<ResultMapping> extendedResultMappings = new ArrayList<>(resultMap.getResultMappings());
      // 删除当前 ResultMap 中已有的父级属性映射，为当前属性映射覆盖父级属性映射创建条件
      extendedResultMappings.removeAll(resultMappings);
      // 如果当前 ResultMap 声明了 <constructor>，就需要删除父级 ResultMap 声明的 constructor
      // 只保留一个 constructor 的定义
      boolean declaresConstructor = false;
      for (ResultMapping resultMapping : resultMappings) {
        if (resultMapping.getFlags().contains(ResultFlag.CONSTRUCTOR)) {
          declaresConstructor = true;
          break;
        }
      }
      if (declaresConstructor) {
        extendedResultMappings
          .removeIf(resultMapping -> resultMapping.getFlags().contains(ResultFlag.CONSTRUCTOR));
      }
      // 从父级 ResultMap 继承所有的属性映射
      resultMappings.addAll(extendedResultMappings);
    }
    ResultMap resultMap = new ResultMap.Builder(configuration, id, type, resultMappings,
      autoMapping)
      .discriminator(discriminator)
      .build();
    configuration.addResultMap(resultMap);
    return resultMap;
  }
```

### ParameterExpression

ParameterExpression 是一个属性解析器，用来将描述属性的字符串解析为键值对的形式，并且它继承了 HashMap 会保存解析后的结果。将 #{property|(expression), var1=value1, var2=value2, …} 中的内容，解析为键值对形式，目的就是为了提取行内的参数映射。例如从{age,javaType=int,jdbcType=NUMERIC,typeHandler=MyTypeHandler} 就能解析出 property、javaType、jdbcType、typeHandler 等信息。

### XML 文件解析

Mybatis 的配置文件和映射文件都是 XML 文件，最终这些 XML 需要被解析成对应的类。builder 包的 xml 子包用来完成 XML 文件的解析工作。

Mybatis 配置文件和映射文件中包含的节点很多。这些节点的解析是由 xml 子包中的五个解析器类逐层配合完成的。如下图所示：

[外链图片转存失败,源站可能有防盗链机制,建议将图片保存下来直接上传(img-2olWJJp5-1622465638563)(media/16218243879016/save_share_review_picture_1622083122.jpeg)]

注：图片来源为《通用源码阅读指导书：Mybatis源码详解》—— 易哥

#### XML 文件的声明解析

在XML 中可以引入外部的 DTD 文件来对 XML 文件进行校验，校验是否符合规则。但是在如下代码声明中，表明当前 XML 文件引用的 DTD 文件地址 “http://mybatis.org/dtd/mybatis-3-config.dtd” 是线上的。

```xml
<!DOCTYPE configuration PUBLIC "-//mybatis.org//DTD Config 3.0//EN" "http://mybatis.org/dtd/mybatis-3-config.dtd">
```

但是Mybatis 可能会运行在一个没有网络的环境中，根本不能将这个文件下载下来，也就不能对 XML 的格式进行校验。`XMLMapperEntityResolver` 就是用来解决这个问题的。

它实现了 `org.xml.sax.EntityResolver` 的 `resolveEntity` 方法，返回的是一个 `InputSource`，即一个 DTD 文件的流，在这里可以直接将线上的地址改为本地文件路径。

```java
  public InputSource resolveEntity(String publicId, String systemId) throws SAXException {
    // <!DOCTYPE configuration PUBLIC "-//mybatis.org//DTD Config 3.0//EN" "http://mybatis.org/dtd/mybatis-3-config.dtd">
    // publicId 是 PUBLIC 后面的参数，即 "-//mybatis.org//DTD Config 3.0//EN"
    // systemId 是 publicId 后面的参数，即 "http://mybatis.org/dtd/mybatis-3-config.dtd"
    // 将指向线上的文档路径，都修改为指向本地的文件路径，保证在离线状态下都能正常的校验 XML 文件
    if (systemId != null) {
        String lowerCaseSystemId = systemId.toLowerCase(Locale.ENGLISH);
      if (lowerCaseSystemId.contains("mybatis-3-config.dtd") || lowerCaseSystemId.contains("ibatis-3-config.dtd")) {
        return getInputSource("org/apache/ibatis/builder/xml/mybatis-3-config.dtd", publicId, systemId);
      } else if (lowerCaseSystemId.contains("mybatis-3-mapper.dtd") || lowerCaseSystemId.contains("ibatis-3-mapper.dtd")) {
        return getInputSource("org/apache/ibatis/builder/xml/mybatis-3-mapper.dtd", publicId, systemId);
      }
    }
    return null;
  }
```

#### 配置文件解析

配置文件的解析工作是由 `XMLConfigBuilder` 类负责的，同时该类会用解析的结果建造出一个 Configuration 对象。

**核心成员变量**

```java
  // 不允许重复解析
  private boolean parsed;
  // XML 文件解析器
  private final XPathParser parser;
  // 当前环境，通过构造方法传入，优先级高于配置文件中所配置的
  private String environment;
```

**核心方法**

```java
  private void parseConfiguration(XNode root) {
    // 先解析并加载 <properties> 节点，在后面的构建过程中就可以使用这些变量
    // 将配置信息放到了 XPathParser 和 Configuration 中，所以在解析的时候就能完成变量的替换
    propertiesElement(root.evalNode("properties"));
    // 解析 <settings> 节点
    Properties settings = settingsAsProperties(root.evalNode("settings"));
    // 加载用户自定义的 VFS
    loadCustomVfs(settings);
    // 加载用户自定义的 LogImpl
    loadCustomLogImpl(settings);
    // 解析并加载 <typeAliases> 节点
    typeAliasesElement(root.evalNode("typeAliases"));
    // 解析并加载 <plugins> 节点
    pluginElement(root.evalNode("plugins"));
    // ObjectFactory、ObjectWrapperFactory、ReflectorFactory 如果没有自定义的
    // 使用的就是 Mybatis 内置的默认实现
    // 解析 <objectFactory> 节点，加载用户自定义的 ObjectFactory
    objectFactoryElement(root.evalNode("objectFactory"));
    // 解析 <objectWrapperFactory> 节点，加载用户自定义的 ObjectWrapperFactory
    objectWrapperFactoryElement(root.evalNode("objectWrapperFactory"));
    // 解析 <reflectorFactory> 节点，加载用户自定义的 ReflectorFactory
    reflectorFactoryElement(root.evalNode("reflectorFactory"));
    // 为 Configuration 中的相关参数设置默认值，<setting> 中的配置优先级更高
    settingsElement(settings);
    // 解析并加载 <environments> 节点
    environmentsElement(root.evalNode("environments"));
    // 解析并加载 <databaseIdProvider>，设置当前环境的 databaseId
    databaseIdProviderElement(root.evalNode("databaseIdProvider"));
    // 解析并加载 <typeHandlers>
    typeHandlerElement(root.evalNode("typeHandlers"));
    // 解析并加载 <mappers> 节点
    mapperElement(root.evalNode("mappers"));
  }
```

解析的顺序和配置文件的声明顺序大概一致。

#### 数据库操作语句解析

映射文件的解析由 `XMLMapperBuilder` 类负责，该类的结构上和 `XMLConfigBuilder` 很相似。

**核心成员变量**

```java
  // XML 文件解析器
  private final XPathParser parser;
  // XMLMapper 建造器辅助类
  private final MapperBuilderAssistant builderAssistant;
  // 存储了当前 databaseId 下所有的 <sql/> 节点
  private final Map<String, XNode> sqlFragments;
  // 当前映射文件完整名称
  private final String resource;
```

**核心方法**

```java
  public void parse() {
    // 如果 resource 没有被加载，则需要加载
    if (!configuration.isResourceLoaded(resource)) {
      // 解析 XMLMapper
      configurationElement(parser.evalNode("/mapper"));
      configuration.addLoadedResource(resource);
      // 绑定 XMLMapper 到对应的 Mapper，通过 XML 文件中的 namespace 找到对应的 Mapper
      bindMapperForNamespace();
    }
    // 重试之前失败的解析
    parsePendingResultMaps();
    parsePendingCacheRefs();
    parsePendingStatements();
  }
  private void configurationElement(XNode context) {
    // 获取当前映射文件配置的命名空间
    String namespace = context.getStringAttribute("namespace");
    if (namespace == null || namespace.isEmpty()) {
      throw new BuilderException("Mapper's namespace cannot be empty");
    }
    builderAssistant.setCurrentNamespace(namespace);
    // 解析 <cache-ref> 标签，添加指向其他 namespace 的缓存引用
    cacheRefElement(context.evalNode("cache-ref"));
    // 解析 <cache> 标签，加载当前 namespace 的缓存
    // <cache> 的优先级高于 <cache-ref> 的优先级
    cacheElement(context.evalNode("cache"));
    // 老式风格的参数映射。此元素已被废弃，并可能在将来被移除！，所以不再讲解
    parameterMapElement(context.evalNodes("/mapper/parameterMap"));
    // 解析 <resultMap> 标签
    resultMapElements(context.evalNodes("/mapper/resultMap"));
    // 解析 SQL 节点
    sqlElement(context.evalNodes("/mapper/sql"));
    // 解析所有的 select、insert、update、delete 节点
    buildStatementFromContext(context.evalNodes("select|insert|update|delete"));
  }
```

在解析过程中，如果出现依赖没有被提前解析而导致的失败都会抛出 `IncompleteElementException` 这个异常，当捕获到这个异常的时候，说明是这个解析过程是需要进行重试的，待重试的解析都是存储在 `Configuration` 中。

```java
  /* Configuration.java */
  // 存储暂时失败的 select、insert、update、delete 节点的解析
  protected final Collection<XMLStatementBuilder> incompleteStatements = new LinkedList<>();
  // 存储暂时失败的 cache-ref 节点的解析
  protected final Collection<CacheRefResolver> incompleteCacheRefs = new LinkedList<>();
  // 存储暂时失败的 resultMap 节点解析
  protected final Collection<ResultMapResolver> incompleteResultMaps = new LinkedList<>();
  // 存储暂时失败的 Method 解析
  protected final Collection<MethodResolver> incompleteMethods = new LinkedList<>();
```

#### Statement 解析

在映射文件的解析中，其实小伙伴们最关注的应该是数据库操作节点的解析，即 `select`、`insert`、`update`、`delete` 这四种节点。它们是由 `XMLStatementBuilder` 解析的。

**核心方法**

```java
  public void parseStatementNode() {
    // 得到唯一ID
    String id = context.getStringAttribute("id");
    // 当前 Statement 所属的 databaseId
    String databaseId = context.getStringAttribute("databaseId");
    // 如果当前语句不是当前 databaseId 的，则不需要解析，直接忽略
    if (!databaseIdMatchesCurrent(id, databaseId, this.requiredDatabaseId)) {
      return;
    }
    String nodeName = context.getNode().getNodeName();
    // 根据标签名称判断 SQL 语句的类型
    SqlCommandType sqlCommandType = SqlCommandType.valueOf(nodeName.toUpperCase(Locale.ENGLISH));
    boolean isSelect = sqlCommandType == SqlCommandType.SELECT;
    boolean flushCache = context.getBooleanAttribute("flushCache", !isSelect);
    boolean useCache = context.getBooleanAttribute("useCache", isSelect);
    boolean resultOrdered = context.getBooleanAttribute("resultOrdered", false);
    // 处理语句中的 include 节点
    XMLIncludeTransformer includeParser = new XMLIncludeTransformer(configuration, builderAssistant);
    includeParser.applyIncludes(context.getNode());
    // 参数类型
    String parameterType = context.getStringAttribute("parameterType");
    Class<?> parameterTypeClass = resolveClass(parameterType);
    // 语句类型
    String lang = context.getStringAttribute("lang");
    LanguageDriver langDriver = getLanguageDriver(lang);
    // 处理 SelectKey 节点，在这里会将 KeyGenerator 加入到 Configuration.keyGenerator 中
    processSelectKeyNodes(id, parameterTypeClass, langDriver);
    // 此时 <selectKey> 和 <include> 节点均已被解析完毕并删除，开始进行 SQL 解析
    KeyGenerator keyGenerator;
    String keyStatementId = id + SelectKeyGenerator.SELECT_KEY_SUFFIX;
    keyStatementId = builderAssistant.applyCurrentNamespace(keyStatementId, true);
    if (configuration.hasKeyGenerator(keyStatementId)) {
      keyGenerator = configuration.getKeyGenerator(keyStatementId);
    } else {
      // 全局或本语句只要启用自动生成 key 生成，则使用 key 自动生成
      keyGenerator = context.getBooleanAttribute("useGeneratedKeys",
          configuration.isUseGeneratedKeys() && SqlCommandType.INSERT.equals(sqlCommandType))
          ? Jdbc3KeyGenerator.INSTANCE : NoKeyGenerator.INSTANCE;
    }
    // 读取配置，并设置部分配置的默认值
    SqlSource sqlSource = langDriver.createSqlSource(configuration, context, parameterTypeClass);
    StatementType statementType = StatementType.valueOf(context.getStringAttribute("statementType", StatementType.PREPARED.toString()));
    Integer fetchSize = context.getIntAttribute("fetchSize");
    Integer timeout = context.getIntAttribute("timeout");
    String parameterMap = context.getStringAttribute("parameterMap");
    String resultType = context.getStringAttribute("resultType");
    Class<?> resultTypeClass = resolveClass(resultType);
    String resultMap = context.getStringAttribute("resultMap");
    String resultSetType = context.getStringAttribute("resultSetType");
    ResultSetType resultSetTypeEnum = resolveResultSetType(resultSetType);
    if (resultSetTypeEnum == null) {
      resultSetTypeEnum = configuration.getDefaultResultSetType();
    }
    String keyProperty = context.getStringAttribute("keyProperty");
    String keyColumn = context.getStringAttribute("keyColumn");
    String resultSets = context.getStringAttribute("resultSets");
    // 通过辅助类创建 MappedStatement 对象，最后添加到 Configuration 中
    builderAssistant.addMappedStatement(id, sqlSource, statementType, sqlCommandType,
        fetchSize, timeout, parameterMap, parameterTypeClass, resultMap, resultTypeClass,
        resultSetTypeEnum, flushCache, useCache, resultOrdered,
        keyGenerator, keyProperty, keyColumn, databaseId, langDriver, resultSets);
  }
```

#### XMLIncludeTransformer

在解析`Statement` 的过程中，我们能看到有一步是对 `include` 节点的解析，解析的过程就是通过 `XMLIncludeTransformer` 实现的。

**核心方法**

```java
  private void applyIncludes(Node source, final Properties variablesContext, boolean included) {
    if ("include".equals(source.getNodeName())) {
     // 当前节点是 include 节点
      // 1. 找出被应用的节点
      Node toInclude = findSqlFragment(getStringAttribute(source, "refid"), variablesContext);
      // 得到目标节点的环境变量，当前节点的环境变量，加上新声明的
      Properties toIncludeContext = getVariablesContext(source, variablesContext);
      // 递归处理被引用节点中的 include 节点
      applyIncludes(toInclude, toIncludeContext, true);
      if (toInclude.getOwnerDocument() != source.getOwnerDocument()) {
        toInclude = source.getOwnerDocument().importNode(toInclude, true);
      }
      // 2. 替换 include 节点，把 include 节点修改为具体的语句
      source.getParentNode().replaceChild(toInclude, source);
      // 3. 将目标节点的内容复制到节点前
      while (toInclude.hasChildNodes()) {
        toInclude.getParentNode().insertBefore(toInclude.getFirstChild(), toInclude);
      }
      // 4. 删除目标节点
      toInclude.getParentNode().removeChild(toInclude);
    } else if (source.getNodeType() == Node.ELEMENT_NODE) {
      if (included && !variablesContext.isEmpty()) {
        // 用属性值替代变量
        NamedNodeMap attributes = source.getAttributes();
        for (int i = 0; i < attributes.getLength(); i++) {
          Node attr = attributes.item(i);
          attr.setNodeValue(PropertyParser.parse(attr.getNodeValue(), variablesContext));
        }
      }
      // 循环到下层节点，递归处理下层的节点
      NodeList children = source.getChildNodes();
      for (int i = 0; i < children.getLength(); i++) {
        applyIncludes(children.item(i), variablesContext, included);
      }
    } else if (included && (source.getNodeType() == Node.TEXT_NODE || source.getNodeType() == Node.CDATA_SECTION_NODE)
        && !variablesContext.isEmpty()) {
     // 文本节点
      // 用属性值替代变量
      source.setNodeValue(PropertyParser.parse(source.getNodeValue(), variablesContext));
    }
  }
```

可能有的小伙伴看的还不是很明白，就让我来给大家举个例子吧。每一步都对应上面代码的编号。

```java
          第一步：找到目标节点
          <sql id="bySchool">
            AND schoolName ={schoolName}
          </sql>
          <select id="selectUserByNameAndSchoolName" resultType="User">
            SELECT * FROM user WHERE name ={name}
            <include refid="bySchool"/>
          </select>
          第二步：用目标节点替换 include 节点
          <select id="selectUserByNameAndSchoolName" resultType="User">
            SELECT * FROM user WHERE name ={name}
            <sql id="bySchool">
              AND schoolName ={schoolName}
            </sql>
          </select>
          第三步：将目标节点的内容复制到节点前
          <select id="selectUserByNameAndSchoolName" resultType="User">
            SELECT * FROM user WHERE name ={name}
            AND schoolName ={schoolName} -- 被复制的内容
            <sql id="bySchool">
              AND schoolName ={schoolName}
            </sql>
          </select>
          第四步：删除目标节点
          <select id="selectUserByNameAndSchoolName" resultType="User">
            SELECT * FROM user WHERE name ={name}
            AND schoolName ={schoolName}
          </select>
```

### 注解映射的解析

通常我们使用的都是 XML 形式的映射文件来完成 Mybatis 的映射配置。同时，Mybatis 也支持使用注解来配置映射，builder 包中的 annotation 子包就可以用来完成这种形式的映射解析工作。

#### MapperAnnotationBuilder

注解映射的解析主要是由 `MapperAnnotationBuilder` 来完成的。

**核心成员变量**

```java
  // 支持解析的注解类型
  private static final Set<Class<? extends Annotation>> statementAnnotationTypes = Stream
    .of(Select.class, Update.class, Insert.class, Delete.class, SelectProvider.class,
      UpdateProvider.class,
      InsertProvider.class, DeleteProvider.class)
    .collect(Collectors.toSet());
  // 全局配置信息
  private final Configuration configuration;
  // 建造器辅助类
  private final MapperBuilderAssistant assistant;
  // 当前解析的类
  private final Class<?> type;
```

**核心方法**

```java
  public void parse() {
    String resource = type.toString();
    if (!configuration.isResourceLoaded(resource)) {
      // 先解析对应类的 XML 资源，只支持相同路径和名称的 XML 文件
      loadXmlResource();
      // 资源添加到已被加载列表
      configuration.addLoadedResource(resource);
      // 设置当前的命名空间为类型的名称
      assistant.setCurrentNamespace(type.getName());
      // 解析 CacheNamespace 注解
      parseCache();
      // 解析 CacheNamespaceRef 注解
      parseCacheRef();
      for (Method method : type.getMethods()) {
        if (!canHaveStatement(method)) {
          // 排除桥接方法和默认方法
          continue;
        }
        if (getAnnotationWrapper(method, false, Select.class, SelectProvider.class).isPresent()
          && method.getAnnotation(ResultMap.class) == null) {
          // 存在 Select 或 SelectProvider 注解，但是没有 ResultMap 注解，则需要解析出 resultMap
          parseResultMap(method);
        }
        try {
          // 解析所有声明的注解！！！
          parseStatement(method);
        } catch (IncompleteElementException e) {
          // 如果出现了异常，就先暂存起来
          configuration.addIncompleteMethod(new MethodResolver(this, method));
        }
      }
    }
    // 再次尝试解析失败的方法
    parsePendingMethods();
  }
    void parseStatement(Method method) {
    // 得到请求参数类型
    final Class<?> parameterTypeClass = getParameterType(method);
    // 获取语言驱动
    final LanguageDriver languageDriver = getLanguageDriver(method);
    // 得到指定的注解 Select、Update、Insert、Delete 及对应的 Provider
    getAnnotationWrapper(method, true, statementAnnotationTypes).ifPresent(statementAnnotation -> {
      // 最关键的一步，如果直接映射实现类为 DynamicSqlSource 或 RawSqlSource
      // 如果为间接映射实现类为 ProviderSqlSource
      final SqlSource sqlSource = buildSqlSource(statementAnnotation.getAnnotation(),
        parameterTypeClass, languageDriver, method);
      // 得到 KeyGenerator
      ...
      // 初始化配置参数，如果有 Options 注解，则注解中的配置优先级更高
      ...
      // 得到 resultMapId，ResultMap 注解的优先级更高
      ...
      // 借助 MapperBuilderAssistant 创建 MappedStament
      assistant.addMappedStatement(...);
    });
  }
```

#### MethodResolver

`MethodResolver` 的作用很简单，只是为了在出现解析方法失败的时候，将关键的信息存放进去，并写好了重试的逻辑，以便在合适的时候只需要简单的调用其方法就可以进行重试。

**核心成员变量**

```java
  // 注解映射建造者
  private final MapperAnnotationBuilder annotationBuilder;
  // 需要解析的方法
  private final Method method;
```

**核心方法**

```java
  public void resolve() {
    // 实际上调用的还是 annotationBuilder 的解析方法，为了方便重试
    annotationBuilder.parseStatement(method);
  }
```

#### ProviderSqlSource

在解析`Statement` 的过程中，最为关键的一步其实是获取 `SqlSource` 这一步，根据注解声明的类型选择不同的 `SqlSource` 实现类。如果是 `@xxxProvider`，使用的就是 `ProvderSqlSource`。

##### 核心成员变量

```java
  // 全局配置
  // 全局配置
  private final Configuration configuration;
  // languageDriver 用于解析 SQL
  private final LanguageDriver languageDriver;
  // 映射方法
  private final Method mapperMethod;
  // 提供 SQL 的方法所属的类
  private final Class<?> providerType;
  // 提供 SQL 的方法
  private final Method providerMethod;
  // 提供 SQL 的方法的请求参数名称
  private final String[] providerMethodArgumentNames;
  // 提供 SQL 的方法的请求参数类型
  private final Class<?>[] providerMethodParameterTypes;
  // 在提供 SQL 的方法的请求参数中只要设置了 ProviderContext，那么就会将 ProviderContext 传递进去
  // 提供当前环境的相关信息
  private final ProviderContext providerContext;
  // 提供 SQL 的方法的请求参数类型中如果有 ProviderContext 类型，这代表它的下标
  private final Integer providerContextIndex;
```

**核心方法**

```java
  public ProviderSqlSource(Configuration configuration, Annotation provider, Class<?> mapperType, Method mapperMethod) {
    String candidateProviderMethodName;
    Method candidateProviderMethod = null;
    this.configuration = configuration;
    this.mapperMethod = mapperMethod;
    Lang lang = mapperMethod == null ? null : mapperMethod.getAnnotation(Lang.class);
    this.languageDriver = configuration.getLanguageDriver(lang == null ? null : lang.value());
    // 得到提供 SQL 的类
    this.providerType = getProviderType(configuration, provider, mapperMethod);
    // 得到提供 SQL 的方法名称
    candidateProviderMethodName = (String) provider.annotationType().getMethod("method").invoke(provider);
    // 如果没有声明提供 SQL 的方法名称，但是提供 SQL 的类实现了 ProviderMethodResolver，那么就调用其解析方法
    if (candidateProviderMethodName.length() == 0 && ProviderMethodResolver.class.isAssignableFrom(this.providerType)) {
      candidateProviderMethod = ((ProviderMethodResolver) this.providerType.getDeclaredConstructor().newInstance())
          .resolveMethod(new ProviderContext(mapperType, mapperMethod, configuration.getDatabaseId()));
    }
    if (candidateProviderMethod == null) {
      // 如果没有声明提供 SQL 的方法名称，则默认名称为 "provideSql"
      // 通过名称在类中找到对应的方法
      ...
    }
    // 如果还是没有找到提供 SQL 的方法，则直接抛出异常
    if (candidateProviderMethod == null) {
      throw new BuilderException();
    }
    this.providerMethod = candidateProviderMethod;
    this.providerMethodArgumentNames = new ParamNameResolver(configuration, this.providerMethod).getNames();
    this.providerMethodParameterTypes = this.providerMethod.getParameterTypes();
    // 如果提供 SQL 的方法中声明了 ProviderContext 则需要得到它的下标和要传入的信息
    // 可以在调用的时候将参数传递进去
    ...
  }
```

#### ProviderMethodResolver

在分析`ProviderSqlSource` 的核心方法的时候，我们可以看到在只声明了提供 SQL 的类，但是没有提供具体的方法名称时，并且类实现了 `ProviderMethodResolver` 时，可以通过调用 `resolveMethod` 方法直接得到提供 SQL 的方法。

它的默认实现是直接找和映射方法相同的名字的方法。即有两个类，一个其中全是映射方法，另一个类就是用来提供 SQL 的，方法的名称都是一一对应的。

**核心方法**

```java
  default Method resolveMethod(ProviderContext context) {
    // 只保留名称相同的方法
    List<Method> sameNameMethods = Arrays.stream(getClass().getMethods())
        .filter(m -> m.getName().equals(context.getMapperMethod().getName()))
        .collect(Collectors.toList());
    if (sameNameMethods.isEmpty()) {
      // 没有找到符合规则的直接抛出异常
      ...
    }
    // 只保留返回值为 CharSequence 类型的
    List<Method> targetMethods = sameNameMethods.stream()
        .filter(m -> CharSequence.class.isAssignableFrom(m.getReturnType()))
        .collect(Collectors.toList());
    if (targetMethods.size() == 1) {
      return targetMethods.get(0);
    }
    // 没有找到符合规则的直接抛出异常
    ...
  }
```

在生产过程中，用户实现 `ProviderMethodResolver` 接口，并覆盖其方法。例如提供 SQL 的方法名称，是在原名称后面加了 “SqlProvider” 这种，都可以自己去实现。
