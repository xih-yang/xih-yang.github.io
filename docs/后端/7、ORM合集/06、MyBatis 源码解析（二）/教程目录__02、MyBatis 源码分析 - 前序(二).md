# 02、MyBatis 源码分析 - 前序(二)
- 来源：https://ddkk.com/zhuanlan/orm/mybatis/7/2.html
- 分类：ORM框架
- 分组：教程目录
> 在上一篇文章中，我们了解到了 Mybatis，但是它相较于原生的 JDBC 到底为我们做了哪些易用性的封装其实并没有做分析，所以在这篇文章中，我们先浅浅了解 Mybatis 到底为我们做了哪些事情（如果说的太深入，可能有些读者会有疑惑，所以我们先说表面上能看出来的，更深入的后面解析过程中都会提出来）

### 相较于原生的 JDBC，Mybatis 所做的事情

**1、****各种资源的管理**：在JDBC实例的开始，能看到获取连接，但是Mybatis的实例代码中是不需要我们写的，当然还有Statement、ResultSet…这些资源，那么可以推断出Mybatis帮我们管理的这些资源（获取和回收）；

**2、****解耦**(可能有点宽泛，但是我已经想不到更好的描述了)：将sql从代码里面拆分出来，并通过一个映射接口类(Mapper.class)作为桥梁来执行真实的sql语句，这种处理方式能使代码看上去更清晰；

3. **sql语句变量赋值**：将复杂且丑陋的 setXXX(idx, value) 改为可以让 sql 语句更为清晰的变量赋值，即 #{value} 或 `$`{value}，两者的区别后面的解析过程也会提到的。
**4、****动态sql**：虽然在Demo中没有体现，但是只要是用过Mybatis的人应该都觉得Mybatis的动态sql用来还是很爽的，而且也相当的强大；

**5、****结果集映射**：从Demo中可以看到，JDBC需要我们自己手动编写代码将sql的执行结果变为想要的实体类对象而Mybatis能自动的帮我们完成（这个可是写者在初学Mybatis最好奇的功能呢）；

**6、** …；

实际上这些只是写者从表面上能看出来的，其实还有很多东西可能都隐藏在背后。我们后面会一一将他们刨出来的。

### Mybatis 的运行流程（生命周期）

要学习和了解一门框架，从运行流程入手是一个不错的选择。接下来要做的事就是解析 Mybatis 的运行流程。

**MybatisDemo.java**

```java
// 1. 通过 mybatis 的工具类 Resources 获取配置文件
InputStream inputStream = Resources.getResourceAsStream("mybatis-config.xml");
// 2. 将配置文件交给 SqlSessionFactoryBuilder 以构建 SqlSessionFactory
SqlSessionFactory sqlSessionFactory = new SqlSessionFactoryBuilder().build(inputStream);
// 3. 得到 SqlSession
SqlSession sqlSession = sqlSessionFactory.openSession();
// 4. 获取代理后的 UserMapper
UserMapper userMapper = sqlSession.getMapper(UserMapper.class);
// 5. 调用方法打印结果
userMapper.selectById(1L);
```

#### 1. 得到配置信息(XML)

先读取mybatis 的配置文件，因为其中包含了 mybatis 启动必要的配置信息。

```java
InputStream inputStream = Resources.getResourceAsStream("mybatis-config.xml");
```

以下就是 mybatis 配置文档的顶层结构。

```xml
<configuration> <!-- myabtis 配置文件根节点 -->
    <properties></properties> <!-- 属性 -->
    <settings></settings> <!-- 设置 -->
    <typeAliases></typeAliases> <!-- 类型别名 -->
    <typeHandlers></typeHandlers> <!-- 类型处理器 -->
    <objectFactory></objectFactory> <!-- 对象工厂 -->
    <plugins></plugins> <!-- 插件 -->
    <environments></environments> <!-- 环境配置 -->
    <databaseIdProvider></databaseIdProvider> <!-- 数据库厂商标识 -->
    <mappers></mappers> <!-- 映射器 -->
</configuration>
```

其中`` 和 `` 是必须要在文档中声明的，其他的要么是有默认值，要么就是可选的，在学习使用阶段是可以暂时忽略的。

#### 2. 构建 SqlSessionFactory

由于配置文件是 XML 格式的，在 Java 代码中想要直接从 XML 中获取关键信息的话，每次都需要去解析一遍配置文件是比较麻烦的。所以我们需要对配置文件进行解析，然后构建为一个 Java 的对象，直接对配置对象进行操作的话，会相对简单很多。

```java
SqlSessionFactory sqlSessionFactory = new SqlSessionFactoryBuilder().build(inputStream);
```

ActorSqlSessionFactoryBuilderXMLConfigBuilderDefaultSqlSessionFactorynewbuildnewparsebuildnewActorSqlSessionFactoryBuilderXMLConfigBuilderDefaultSqlSessionFactory

简述：由于构建 DefaultSqlSessionFactory 需要 Configuration 对象，所以不能直接 new 而是要借助 SqlSessionFactoryBuilder 来构建。在内部使用的是 XMLConfigBuilder 来解析 mybatis-config.xml 文件并构建 Configuration 对象。

##### XMLConfigBuilder 解析流程一览

```java
/* 
  可以看到解析顺序和配置文件的声明基本一致
  还忽略了一些其他的 Configuration 属性的设置 
*/
private void parseConfiguration(XNode root) {
  // 解析 <properties> 标签
  propertiesElement();
  ...
  // 解析 <typeAliases> 标签
  typeAliasesElement();
  // 解析 <plugins> 标签
  pluginElement();
  // 解析 <objectFactory> 标签
  objectFactoryElement();
  ...
  // 解析 <settings> 标签
  settingsElement();
  // 解析 <environments> 标签
  environmentsElement();
  // 解析 <databaseIdProvider> 标签
  databaseIdProviderElement();
  // 解析 <typeHandlers> 标签
  typeHandlerElement();
  // 解析 <mappers> 标签
  mapperElement();
}
```

#### 3. 获取 SqlSession

SqlSession 是 Mybatis 中非常重要的一个接口，可以通过这个接口来执行命令，获取映射器示例和管理事务。

```java
SqlSession sqlSession = sqlSessionFactory.openSession();
```

ActorDefaultSqlSessionFactoryDefaultSqlSessionopenSessionopenSessionFromDataSourcenewActorDefaultSqlSessionFactoryDefaultSqlSession

**关键步骤解析：**

```java
private SqlSession openSessionFromDataSource(ExecutorType execType, TransactionIsolationLevel level, boolean autoCommit) {
  // 获取 Mybatis 的运行环境(包含事务工厂和数据源)
  Environment environment = configuration.getEnvironment();
  // 从运行环境中获取事务工厂
  TransactionFactory transactionFactory = getTransactionFactoryFromEnvironment(environment);
  // 通过事务工厂创建事务
  Transaction tx = transactionFactory.newTransaction(environment.getDataSource(), level, autoCommit);
  // 创建执行器，用于执行 sql 语句
  Executor executor = configuration.newExecutor(tx, execType);
  // 将 Configuration、Executor 传递给了 DefaultSqlSession，所以 SqlSession 可以用于执行命令、事务管理、获取映射器等功能
  return new DefaultSqlSession(configuration, executor, autoCommit);
}
```

#### 4. 获取 Mapper (映射器)

Mapper 在 Java 中只是一个接口，并且没有任何实现类，所以是不能直接通过 new 来进行实例化，在 Demo 中可以看到，能拿到实例化对象，并且能够直接调用，可以推测是使用了动态代理（不清楚的建议先去 Google 一下）。

```java
UserMapper userMapper = sqlSession.getMapper(UserMapper.class);
```

ActorDefaultSqlSessionConfigurationMapperRegistryMapperProxyFactorygetMappergetMappergetMappernewInstance(SqlSession)newInstance(MapperProxy)ActorDefaultSqlSessionConfigurationMapperRegistryMapperProxyFactory

**关键步骤解析：**

```java
protected T newInstance(MapperProxy<T> mapperProxy) {
  // 可以看到最底层使用的是 JDK 的动态代理
  return (T) Proxy.newProxyInstance(mapperInterface.getClassLoader(), new Class[] {
      mapperInterface }, mapperProxy);
}
```

#### 5. 调用映射器方法

在上一小节说到，映射器的实现类是通过 JDK 动态代理生成的，所以想要知道，在调用映射器方法的时候做了哪些事，就需要看 MapperProxy(实现了 InvocationHandler ) 中 `invoke()` 方法的处理逻辑就好了。

```java
userMapper.selectById(1L);
```

ActorUserMapperMapperProxyPlainMethodInvokerMapperMethodSqlSessionselectByIdinvokecachedInvokerinvokeexecuteinsert,update,delete,selectActorUserMapperMapperProxyPlainMethodInvokerMapperMethodSqlSession

**关键步骤解析**：可以看到，实质上还是使用的是 SqlSession 执行命令的能力，只是进行了层层封装。
