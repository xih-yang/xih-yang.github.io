# 24、MyBatis 源码分析 - plugin 包
- 来源：https://ddkk.com/zhuanlan/orm/mybatis/7/24.html
- 分类：ORM框架
- 分组：教程目录
MyBatis 提供了插件功能，允许其他开发者为 MyBatis 开发插件以扩展 MyBatis 的功能。利用这个插件功能开发者可以扩展 MyBatis 的功能。

### 开发一个插件

在学习源码之前，我们首先要知道它有哪些功能，利用这个功能我们能干什么事情。所以我决定先带大家开发一个打印查询结果在控制台的插件。

#### 创建插件类

```java
@Intercepts({
    @Signature(type = ResultSetHandler.class, method = "handleResultSets", args = {
     Statement.class})
})
public class MyInterceptor implements Interceptor {
  @Override
  public Object intercept(Invocation invocation) throws Throwable {
    Object results = invocation.proceed();
    System.out.println("查询结果：");
    for (Object result : ((List) results)) {
      System.out.println(result);
    }
    return results;
  }
}
```

可以发现在类上我还声明了一些注解 `Intercepts` 表明当前类是一个插件类，由于拦截器是通用的，所以需要通过 `Signature` 声明我们需要拦截的方法，如果有多个方法，就需要设置多个 `Signature`。

- type：要拦截的类名称。
- method：要拦截的方法名称。
- args：要拦截的方法参数类型。

由于我们要打算拦截的是如下方法，所以配置就如上面的代码所示。并且由于返回值是 `List` 所以我们才能放心的将结果强转为 `List` 类型。

```java
public interface ResultSetHandler {
  <E> List<E> handleResultSets(Statement stmt) throws SQLException;
}
```

#### 配置插件

除了要创建对应的插件类，还需要在 myabtis-config.xml 中配置这个插件。

```java
  <plugins>
    <plugin interceptor="com.yinxy.plugin.MyInterceptor"/>
  </plugins>
```

#### 效果展示

**控制台打印信息**

```java
查询结果：
User(id=1, name=Jone, age=18)
User(id=2, name=Jack, age=20)
User(id=3, name=Tom, age=28)
User(id=4, name=Sandy, age=21)
User(id=5, name=Billie, age=24)
....
```

### plugin 包

**类图**

[外链图片转存失败,源站可能有防盗链机制,建议将图片保存下来直接上传(img-lmoT9dYk-1630483416241)(media/16300505124116/16300531480986.jpeg)]

#### Plugin

在 **plugin** 包中最为关键的就是 Plugin 类，它继承了 java.lang.reflect.InvocationHandler 是基动态代理类。

**成员变量**

```java
  // 被代理对象
  private final Object target;
  // 拦截器
  private final Interceptor interceptor;
  // 要拦截的方法，从 Signature 注解中提取出来的
  private final Map<Class<?>, Set<Method>> signatureMap;
```

**获取要拦截的方法**

```java
  private static Map<Class<?>, Set<Method>> getSignatureMap(Interceptor interceptor) {
    // 得到 Intercepts 注解
    Intercepts interceptsAnnotation = interceptor.getClass().getAnnotation(Intercepts.class);
    if (interceptsAnnotation == null) {
      throw new PluginException("");
    }
    // 得到 Signature 注解
    Signature[] sigs = interceptsAnnotation.value();
    Map<Class<?>, Set<Method>> signatureMap = new HashMap<>();
    // 遍历所有 Signature 注解，得到拦截的方法
    for (Signature sig : sigs) {
      // 将同一个类方法放到同一个 Set 集合中
      Set<Method> methods = signatureMap.computeIfAbsent(sig.type(), k -> new HashSet<>());
      try {
        Method method = sig.type().getMethod(sig.method(), sig.args());
        methods.add(method);
      } catch (NoSuchMethodException e) {
        throw new PluginException("");
      }
    }
    return signatureMap;
  }
```

**生成代理类**

插件的装载其实就是生成代理类。

```java
  public static Object wrap(Object target, Interceptor interceptor) {
    // 得到所有需要拦截的方法
    Map<Class<?>, Set<Method>> signatureMap = getSignatureMap(interceptor);
    Class<?> type = target.getClass();
    // 得到被代理对象所有需要实现的接口
    Class<?>[] interfaces = getAllInterfaces(type, signatureMap);
    if (interfaces.length > 0) {
      // 因为使用的是 JDK 动态代理，所以需要有接口才能生成对应的代理对象
      return Proxy.newProxyInstance(
          type.getClassLoader(),
          interfaces,
          new Plugin(target, interceptor, signatureMap));
    }
    // 直接返回原对象
    return target;
  }
```

**是否需要拦截**

由于插件是通用的，所以 `Executor` 可能会装载一个拦截 `ResultSetHandler` 的插件，那么就需要判断这个插件是否能拦截被代理对象。

```java
  @Override
  public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
    try {
      Set<Method> methods = signatureMap.get(method.getDeclaringClass());
      // 判断是否拦截被代理对象的当前方法
      if (methods != null && methods.contains(method)) {
        return interceptor.intercept(new Invocation(target, method, args));
      }
      return method.invoke(target, args);
    } catch (Exception e) {
      throw ExceptionUtil.unwrapThrowable(e);
    }
  }
```

#### Invocation

`Invocation` 是负责在拦截器间传递数据的。

```java
public class Invocation {
  // 被代理对象
  private final Object target;
  // 调用的方法
  private final Method method;
  // 请求参数
  private final Object[] args;
  // 执行方法
  public Object proceed() throws InvocationTargetException, IllegalAccessException {
    return method.invoke(target, args);
  }
}
```

#### InterceptorChain

`InterceptorChain` 存储了所有的拦截器，并且可以为对象装载拦截器。

```java
public class InterceptorChain {
  private final List<Interceptor> interceptors = new ArrayList<>();
  public Object pluginAll(Object target) {
    // 插件装载
    for (Interceptor interceptor : interceptors) {
      target = interceptor.plugin(target);
    }
    return target;
  }
  // 新增插件
  public void addInterceptor(Interceptor interceptor) {
    interceptors.add(interceptor);
  }
}
```

其实 **plugin** 包整体的代码并不复杂，重要是其中使用了责任链设计模式，如果你不了解责任链设计模式的话，可能就比较难理解。到此整个 MyBatis 的源码我已经讲解完了，带注释的源码也已经上传到 **GitHub** 上了。

**参考文献**

**1、** 《通用源码阅读指导书：Mybatis源码阅读详解》——易哥；
