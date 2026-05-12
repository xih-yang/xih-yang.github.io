# 12、MyBatis 源码分析 - binding 包
- 来源：https://ddkk.com/zhuanlan/orm/mybatis/7/12.html
- 分类：ORM框架
- 分组：教程目录
> 可能在刚学 Java 和 Mybatis 的小伙伴，会很好奇为什么明明是一个接口，但是居然可以调用，但是明明并没有声明它的实现类，并且它是怎么找到我们要执行的 SQL 呢。那么这一个包就能解开你的疑惑。

binding 包的主要作用是处理 Java 方法和映射文件中 SQL 语句之间绑定关系。也就是我们常常用到的 userMapper.getById() 方法，是怎么绑定到一条具体 SQL 语句的。

虽然binding 包下的类不多，但是每个都很**经典**，只要能理解透的话，你就会发现其实真想要手写一个简单的 ORM 框架也没有那么难。就让我们奔着这个目标继续学习下去吧。

### 类关系概览

`图片来自 《通用源码指导书：Mybatis源码详解》—— 易哥`

首先观察一下上图，看到这样的一个关系，MapperProxyFactory 用来创建 MapperProxy 而 MapperProxy 用来执行 MapperMethod。现在我们将这三个类对应到我们使用 Mybatis 时所写的。

```java
// 这是一个简单的 Mapper 文件，除了没有那么多方法以外，基本上都差不多
@Mapper
public interface UserMapper {
  User selectById(@Param("userId") Long userId);
  List<User> selectListByName(@Param("name") String name);
}
```

我们把MapperProxyFactory 看作 UserMapper，而 MapperProxy 看作 UserMapper 的实现类，MapperMethod 则是 UserMapper 中的某一个方法。

MapperProxyFactory 通过 JDK 动态代理来实现 new 一个 UserMapper 的实现类。

看了这个图，我觉得你们心里应该有个底了，但是细心的读者可能会发现一个地方特别奇怪，为啥和上一张图有点不太一样，MapperProxy 下面不是不是 MapperMethod 吗，从哪里冒出来了一个 MapperMethodInvoker。图中的两个 MapperMehtodInvoker 中又分别包含了 MapperMethod 和 MethodHandle。

```java
/*
    由于在 JDK8 中又引入了默认方法，所以实际上 Java 映射文件中已经不是所有都是接口了。
    默认方法是没有映射到具体的 SQL 的，所以也不能去找到它所指向的 SQL，而是直接通过反射去调用。
    所以 Mybatis 抽象出了一个通用的接口 MapperMehtodInvoker，有两个实现类 PlainMethodInvoker、DefaultMethodInvoker 分别对应普通的接口方法 和默认方法。根据不同的方法类型来选用对应的实现。
*/
if (m.isDefault()) {
  // 如果是一个默认方法
  /*
    通过判断是否存在特定的方法来区分版本，如果有 privateLookupInMethod 方法的话，说明是 JDK9 及以上版本，如果没有则是 JDK8。
    可能有的小伙伴会疑惑，为什么不都选用同一种方法呢，是因为 JDK9 中就把对应的实现删除了吗？
    其实并不是的，而是由于每个版本可能反射都做了一些优化，比如在 JDK8 中可能某一种反射的方式可能更加安全更加快，但是在 JDK9 中另一种方法更好，所以才会出现这种情况。
  */
  if (privateLookupInMethod == null) {
    // 如果当前 JDK 版本为 8
    return new DefaultMethodInvoker(getMethodHandleJava8(method));
  } else {
    // 如果当前 JDK 版本为 9+
    return new DefaultMethodInvoker(getMethodHandleJava9(method));
  }
} else {
  // 如果是一个接口的话，说明是一个映射方法，即我们常用的 getById 这种。
  return new PlainMethodInvoker(
    new MapperMethod(mapperInterface, method, sqlSession.getConfiguration()));
}
```

### 类详解

终于到了最令人激动的环节了(不知道你们激不激动，反正我是挺激动的)。我们还是跟着之前的类关系图，从最外层的也就是 `MapperRegistry` 到内层的 `MapperMethod` 类，一个一个去分析。

#### MapperRegistry

在分析类关系的时候，我们已经提到了这个类，它保存了 Mybatis 中所有的 `Mapper`，从注册表中拿到了对应的 Mapper 我们就可以直接调用 Mapper 中的方法了。

**核心成员变量**

```java
private final Map<Class<?>, MapperProxyFactory<?>> knownMappers = new HashMap<>();
```

关键的成员变量就是 `knowMappers` 这x 是一个 `Map`，可以通过 Class 获取对应的 `MapperProxyFactory`。

**核心方法**

作为一个保存 MapperProxyFactory **容器**，最关键的两个功能就是两个：`addMapper` 和 `getMapper`。

```java
public <T> T getMapper(Class<T> type, SqlSession sqlSession) {
    final MapperProxyFactory<T> mapperProxyFactory = (MapperProxyFactory<T>) knownMappers.get(type);
    // 如果找不到直接抛出异常
    if (mapperProxyFactory == null) {
      throw new BindingException("Type " + type + " is not known to the MapperRegistry.");
    }
    // 实例化对象
    return mapperProxyFactory.newInstance(sqlSession);
}
public <T> void addMapper(Class<T> type) {
    if (type.isInterface()) {
      // 只添加 interface
      if (hasMapper(type)) {
        throw new BindingException("Type " + type + " is already known to the MapperRegistry.");
      }
      // 是否加载完成的标志，
      boolean loadCompleted = false;
      try {
        // 先把坑占好，防止循环加载
        knownMappers.put(type, new MapperProxyFactory<>(type));
        MapperAnnotationBuilder parser = new MapperAnnotationBuilder(config, type);
        // 加载并解析
        parser.parse();
        loadCompleted = true;
      } finally {
        // 如果由于报错没有加载完成，那么就要将预先生成好的 MapperProxyFactory 删掉
        if (!loadCompleted) {
          knownMappers.remove(type);
        }
      }
    }
}
```

Mybatis 为什么会有循环加载示意图。

这里没有讲解析的细节是因为 `MapperAnnotationBuilder` 是 `builder` 包的内容，下一篇文章应该就会分析 `builder` 包，大家可以好好期待一下。

#### MapperProxyFactory

MapperProxyFactory 作为一个 Mapper 的’原型’，包含了 Mapper 中的方法。

**核心成员变量**

```java
// 当前 MapperProxyFactory 代表的 Mapper 的类型
private final Class<T> mapperInterface;
// Java 映射文件中的方法及其对应的调用器
private final Map<Method, MapperMethodInvoker> methodCache = new ConcurrentHashMap<>();
```

**核心方法**

```java
  protected T newInstance(MapperProxy<T> mapperProxy) {
    // JDK 动态代理生成代理对象
    return (T) Proxy.newProxyInstance(mapperInterface.getClassLoader(), new Class[] {
      mapperInterface }, mapperProxy);
  }
  public T newInstance(SqlSession sqlSession) {
    // MapperProxy 实现了 InvocationHandler 所以只要调用被代理对象的任何方法，实际上都会进入到 invoke 方法中
    final MapperProxy<T> mapperProxy = new MapperProxy<>(sqlSession, mapperInterface, methodCache);
    return newInstance(mapperProxy);
  }
```

其实最关键的就是 `Proxy.newProxyInstance`，可以说这句话就是 Mybatis 实现 Java 方法到执行 SQL 执行映射的底层。JDK 动态代理我就不在这里讲述了，相信聪明的小伙伴能找到不少相关的资料。

#### MapperProxy

`MapperProxy` 可以理解为 Java 映射接口的实现类。

**核心成员变量**

```java
  // 只允许以下作用域的方法能执行反射，利用二进制的每一位代表一种修饰符，可以节省空间
  private static final int ALLOWED_MODES =
    MethodHandles.Lookup.PRIVATE | MethodHandles.Lookup.PROTECTED
      | MethodHandles.Lookup.PACKAGE | MethodHandles.Lookup.PUBLIC;
  // JDK8 中只有 Lookup(Class, int)
  private static final Constructor<Lookup> lookupConstructor;
  // 在 JDK9 中才有 privateLookupIn(Class, Lookup)
  private static final Method privateLookupInMethod;
  // 会话
  private final SqlSession sqlSession;
  // 被代理对象
  private final Class<T> mapperInterface;
  // Java 映射文件中的方法及其对应的调用器，对象是由 MapperProxyFactory 创建的，生成的每个代理对象都是其的引用
  // 所以，所有的代理对象都共享这些内容
  private final Map<Method, MapperMethodInvoker> methodCache;
```

**核心方法**

```java
  public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
    if (Object.class.equals(method.getDeclaringClass())) {
      // 如果调用的时 Object 类中声明的方法，直接反射调用
      return method.invoke(this, args);
    } else {
      return cachedInvoker(method).invoke(proxy, method, args, sqlSession);
    }
  }
  // 获取已经缓存好的 MapperMethodInvoker
  private MapperMethodInvoker cachedInvoker(Method method) throws Throwable {
    MapperMethodInvoker invoker = methodCache.get(method);
    if (invoker != null) {
      // 如果在缓存中找到了对应的 invoker 方法，那么则直接返回
      return invoker;
    }
    // 如果没有缓存对应的 invoker 方法，则构建并缓存起来
    return methodCache.computeIfAbsent(method, m -> {
      if (m.isDefault()) {
          // 如果是一个默认方法
          if (privateLookupInMethod == null) {
            // 当前版本为JDK 8
            return new DefaultMethodInvoker(getMethodHandleJava8(method));
          } else {
            // 当前版本为JDK 9+
            return new DefaultMethodInvoker(getMethodHandleJava9(method));
          }
      } else {
        // 如果不是默认方法，说明是一个需要映射的方法，即我们常用的 userMapper.getById 这种。
        return new PlainMethodInvoker(
          new MapperMethod(mapperInterface, method, sqlSession.getConfiguration()));
      }
  }
```

注：我在粘贴代码段的时候，除非 `try catch` 中有重要逻辑，否则都会将其删除掉。尽量减少代码数量，让小伙伴们能专注于重点的逻辑。

小伙伴们应该知道在 JDK8 中接口引入了默认方法，默认方法其实和普通类的方法一样，是不强制子类去实现它的。所以直接反射调用默认方法就好了，而非默认方法就不行，必须要自己去实现方法中的业务逻辑。

可以看到返回的是 `MapperMethodInvoker` 的两个实现类：`DefaultMethodInvoker` 和 `PlainMethodInvoker`，对应 `invoke` 方法实现如下。

```java
    // PlainMethodInvoker
    public Object invoke(Object proxy, Method method, Object[] args, SqlSession sqlSession)
      throws Throwable {
      // 执行对应的 SQL
      return mapperMethod.execute(sqlSession, args);
    }
    // DefaultMethodInvoker
    public Object invoke(Object proxy, Method method, Object[] args, SqlSession sqlSession)
      throws Throwable {
      // 等同于 method.invoke()，但是比它的性能更高
      return methodHandle.bindTo(proxy).invokeWithArguments(args);
    }
```

#### MapperMethod

`MapperMethod` 对应的是一个映射方法。映射方法包含两个关键要素，一个是要执行的 SQL，一个是方法的签名。

**核心成员变量**

```java
  // SQL 信息
  private final SqlCommand command;
   // 方法签名
  private final MethodSignature method;
```

**核心方法**

```java
  public Object execute(SqlSession sqlSession, Object[] args) {
    Object result;
    switch (command.getType()) {
      // 插入语句
      case INSERT: {
        Object param = method.convertArgsToSqlCommandParam(args);
        result = rowCountResult(sqlSession.insert(command.getName(), param));
        break;
      }
      // 修改语句
      case UPDATE: {
        Object param = method.convertArgsToSqlCommandParam(args);
        result = rowCountResult(sqlSession.update(command.getName(), param));
        break;
      }
      // 删除语句
      case DELETE: {
        Object param = method.convertArgsToSqlCommandParam(args);
        result = rowCountResult(sqlSession.delete(command.getName(), param));
        break;
      }
      // 查询语句
      case SELECT:
        if (method.returnsVoid() && method.hasResultHandler()) {
          // 如果没有返回值，并且请求参数中有 ResultHandler 才执行这个方法
          executeWithResultHandler(sqlSession, args);
          result = null;
        } else if (method.returnsMany()) {
          // 如果返回参数是一个集合或者数组的话，则调用这个方法
          result = executeForMany(sqlSession, args);
        } else if (method.returnsMap()) {
          // 如果返回的是一个 Map 类型
          result = executeForMap(sqlSession, args);
        } else if (method.returnsCursor()) {
          // 如果返回的是一个游标
          result = executeForCursor(sqlSession, args);
        } else {
          // 如果只是普通的返回类型
          Object param = method.convertArgsToSqlCommandParam(args);
          result = sqlSession.selectOne(command.getName(), param);
          if (method.returnsOptional()
            && (result == null || !method.getReturnType().equals(result.getClass()))) {
            result = Optional.ofNullable(result);
          }
        }
        break;
        // 只是用来刷新缓存的语句，不映射任何一条 SQL
      case FLUSH:
        result = sqlSession.flushStatements();
        break;
      default:
        throw new BindingException("Unknown execution method for: " + command.getName());
    }
    // 如果要求返回一个原生类型，但是 result 又是 null，那么就需要抛出异常，因为 null 转换为 int 或者其他基本类型会报空指针异常。
    if (result == null && method.getReturnType().isPrimitive() && !method.returnsVoid()) {
      throw new BindingException();
    }
    return result;
  }
```

可以看到说的是 execute 方法，实际上调用的还是 SqlSession 的方法，这是设计模式中的委派者模式。至于 SqlSession 里面的代码，我们会在后面的分析，一步一步慢慢来哟。

#### MapperMethod 的静态内部类 MethodSignature、SqlCommand、ParamMap

##### MethodSignature

`MethodSignature` 是方法的签名，在 Java 语言中签名就是方法的名称和方法的请求参数，而 Mybatis 中定义的这个签名和 Java 的有点区别。

**核心成员变量**

```java
    /* 返回值的相关信息 */
    // 返回值类型为 Collection 或 Array
    private final boolean returnsMany;
    // 返回值类型为 Map
    private final boolean returnsMap;
    // 没有返回值
    private final boolean returnsVoid;
    // 返回值类型为 Cursor
    private final boolean returnsCursor;
    // 返回值类型为 Optional
    private final boolean returnsOptional;
    // 返回值类型
    private final Class<?> returnType;
    // mapKey的值
    private final String mapKey;
    /* 请求参数的相关信息 */
    // 请求参数中 ResultHandler 的下标
    private final Integer resultHandlerIndex;
    // 请求参数中 RowBounds 的下标
    private final Integer rowBoundsIndex;
    // 请求参数名称解析器，解析后返回的是一个 ParamMap
    private final ParamNameResolver paramNameResolver;
```

**核心方法**

```java
    public MethodSignature(Configuration configuration, Class<?> mapperInterface, Method method) {
      // 首先获取方法的返回值类型
      Type resolvedReturnType = TypeParameterResolver.resolveReturnType(method, mapperInterface);
      if (resolvedReturnType instanceof Class<?>) {
        this.returnType = (Class<?>) resolvedReturnType;
      } else if (resolvedReturnType instanceof ParameterizedType) {
        this.returnType = (Class<?>) ((ParameterizedType) resolvedReturnType).getRawType();
      } else {
        this.returnType = method.getReturnType();
      }
      // 是否返回的是 void
      this.returnsVoid = void.class.equals(this.returnType);
      // 是否返回的是集合或数组
      this.returnsMany =
        configuration.getObjectFactory().isCollection(this.returnType) || this.returnType.isArray();
      // 是否返回时游标
      this.returnsCursor = Cursor.class.equals(this.returnType);
      // 是否返回的是 optional
      this.returnsOptional = Optional.class.equals(this.returnType);
      // 得到 MapKey
      this.mapKey = getMapKey(method);
      // 如果存在 MapKey 说明返回值类型是 Map
      this.returnsMap = this.mapKey != null;
      // 得到请求参数类型为 RowBounds 的下标
      this.rowBoundsIndex = getUniqueParamIndex(method, RowBounds.class);
      // 得到请求参数类型为 ResultHandler 的下标
      this.resultHandlerIndex = getUniqueParamIndex(method, ResultHandler.class);
      // 得到参数名称解析器
      this.paramNameResolver = new ParamNameResolver(configuration, method);
    }
```

这是`MethodSignature` 的构造方法，是用来初始化会**初始化**所有的成员变量。

##### SqlCommand

`SqlCommand` 记录了该映射方法所映射到的 SQL 的一些关键信息。SQL 的类型和 SQL 的唯一ID，通过 SQL 的类型可以决定使用什么方式处理执行结果，通过 SQL 的唯一ID可以找到需要执行的 SQL。

**核心成员变量**

```java
    // SQL 的名称，在整个项目中是唯一的，等同于 ID
    private final String name;
    // SQL 的类型，枚举类型
    // UNKNOWN, INSERT, UPDATE, DELETE, SELECT, FLUSH
    private final SqlCommandType type;
```

**核心方法**

```java
    public SqlCommand(Configuration configuration, Class<?> mapperInterface, Method method) {
      final String methodName = method.getName();
      final Class<?> declaringClass = method.getDeclaringClass();
      // 解析 MappedStatement，实际上是从 Configuration 中获取的 MappedStatement
      MappedStatement ms = resolveMappedStatement(mapperInterface, methodName, declaringClass,
        configuration);
      if (ms == null) {
        if (method.getAnnotation(Flush.class) != null) {
          name = null;
          type = SqlCommandType.FLUSH;
        } else {
          throw new BindingException();
        }
      } else {
        // SQL 指令的名称为 MappedStatement 的ID，是唯一的
        name = ms.getId();
        type = ms.getSqlCommandType();
        if (type == SqlCommandType.UNKNOWN) {
          throw new BindingException();
        }
      }
    }
```

##### ParamMap

继承自`HashMap` ，`key` 代表请求参数的名称，`value` 代表请求参数具体的值，只覆盖了 `get` 方法。

**核心方法**

```java
    public V get(Object key) {
      if (!super.containsKey(key)) {
        throw new BindingException(
          "Parameter '" + key + "' not found. Available parameters are " + keySet());
      }
      return super.get(key);
    }
```

如果找不到对应的名称，直接抛出异常。

**总结**：可以发现，这篇文章的代码是相当的多的，因为这个包是相当重要的包。其中的类也不多，所以基本上每行代码都是非常的重要，因此希望大家可以去把这个包中的内容都仔细的看一下。肯定能对以后的编码有所帮助。
