# 14、MyBatis源码 - MyBatis运行原理之获取Mapper代理对象源码分析
- 来源：https://ddkk.com/zhuanlan/orm/mybatis/5/14.html
- 分类：ORM框架
- 分组：教程目录
### 获取Mapper代理对象

在获取了SqlSession对象后，调用getMapper方法传入一个Mapper接口，就会返回一个实例对象，众所周知，接口是不能实例化的，那么返回的肯定是接口的代理对象。

```java
UserMapper userMapper = sqlSession.getMapper(UserMapper.class);
```

#### 大致流程

#### 源码分析

##### 1. DefaultSqlSession.getMapper(type, this)

SqlSession对象为DefaultSqlSession，那么实际调用的是DefaultSqlSession.getMapper(type, this)方法，这个方式实际调用的又是configuration对象的getMapper方法。

```java
  @Override
  public <T> T getMapper(Class<T> type) {
    // 调用configuration
    return configuration.<T>getMapper(type, this);
  }
```

##### 2. Configuration.getMapper(Class type, SqlSession sqlSession)

configuration.getMapper()方法实际调用的是configuration对象中mapperRegistry的getMapper方法。

```java
    public <T> T getMapper(Class<T> type, SqlSession sqlSession) {
        return mapperRegistry.getMapper(type, sqlSession);
    }
```

##### 3. MapperRegistry.getMapper(Class type, SqlSession sqlSession)

mapperRegistry是Configuration的一个成员变量，其类为MapperRegistry，可以理解为Mapper注册器。

mapper注册器用于将所有的mapper接口添加到内存中,Mapper注册器自身维护着两个属性，config和knownMappers，其中knownMappers是一个Map集合。

```java
    private final Configuration config;
    private final Map<Class<?>, MapperProxyFactory<?>> knownMappers = new HashMap<Class<?>, MapperProxyFactory<?>>();
```

SqlSessionFactory创建之后，mapperRegistry会完成初始化，knownMapper中存放各种键值对，键为每个每个mapper接口，值为MapperProxyFactory对象，MapperProxyFactory是一个工厂类，用于创建MapperProxy。

```java
knownMappers.put(type, new MapperProxyFactory<T>(type));  
```

MapperRegistry获取Mapper对象的源码如下：

```java
    /**
     * 获取Mapper 实例对象
     *
     * @param type       接口
     * @param sqlSession SqlSession
     * @return MapperProxy
     */
    public <T> T getMapper(Class<T> type, SqlSession sqlSession) {
        // 在knownMappers中获取Mapper代理对象工厂
        final MapperProxyFactory<T> mapperProxyFactory = (MapperProxyFactory<T>) knownMappers.get(type);
        if (mapperProxyFactory == null) {
            throw new BindingException("Type " + type + " is not known to the MapperRegistry.");
        }
        try {
            return mapperProxyFactory.newInstance(sqlSession);
        } catch (Exception e) {
            throw new BindingException("Error getting mapper instance. Cause: " + e, e);
        }
    }
```

##### 4. mapperProxyFactory.newInstance(sqlSession)

mapper代理对象工厂通过newInstance()方法创建实例mapper接口对应的代理对象MapperProxy。

```java
    /**
     *
     * @param sqlSession SqlSession
     * @return
     */
    public T newInstance(SqlSession sqlSession) {
        // 创建MapperProxy
        final MapperProxy<T> mapperProxy = new MapperProxy<T>(sqlSession, mapperInterface, methodCache);
        return newInstance(mapperProxy);
    }
```

##### 5. new MapperProxy(sqlSession, mapperInterface, methodCache)

通过MapperProxy构造方法创建MapperProxy对象。

```java
 final MapperProxy<T> mapperProxy = new MapperProxy<T>(sqlSession, mapperInterface, methodCache);
```

MapperProxy类实现了JDK中的InvocationHandler接口，InvocationHandler接口是proxy代理实例的调用处理程序实现的一个接口，每一个proxy代理实例都有一个关联的调用处理程序；在代理实例调用方法时，方法调用被编码分派到调用处理程序的invoke方法。

```java
    /**
     *  构造方法
     * @param sqlSession SqlSession
     * @param mapperInterface mapper接口
     * @param methodCache 方法缓存
     */
    public MapperProxy(SqlSession sqlSession, Class<T> mapperInterface, Map<Method, MapperMethod> methodCache) {
        this.sqlSession = sqlSession;
        this.mapperInterface = mapperInterface;
        this.methodCache = methodCache;
    }
```

##### 6. Proxy.newProxyInstance()

获取了基础的MapperProxy对象后，调用Proxy.newProxyInstance()方法通过反射技术创建mapper接口正真的JAVA动态代理对象。

```java
    protected T newInstance(MapperProxy<T> mapperProxy) {
        return Proxy.newProxyInstance(this.mapperInterface.getClassLoader(), new Class[]{
     this.mapperInterface}, mapperProxy);
    }
```

#### 总结

获取Mapper代理对象的流程很简单，大致就是通过Configuration对象中加载好的mapper接口信息，然后使用JDK动态代理，返回MapperProxy代理对象。
