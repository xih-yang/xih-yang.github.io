# 20、MyBatis源码 - MyBatis之插件机制源码及流程分析
- 来源：https://ddkk.com/zhuanlan/orm/mybatis/5/20.html
- 分类：ORM框架
- 分组：教程目录
### 官网案例

话不多说，先来个spring boot使用mybatis插件案例。

**1、** 创建插件类，并注入到IOC中；

```java
@Component
@Intercepts({
     @Signature(
        type = Executor.class,
        method = "query",
        args = {
     MappedStatement.class, Object.class, RowBounds.class, ResultHandler.class})})
public class ExamplePlugin implements Interceptor {
    private Properties properties = new Properties();
    @Override
    public Object intercept(Invocation invocation) throws Throwable {
        // do something ...... 方法拦截前执行代码块
        System.out.println("do something ...... 方法拦截前执行代码块");
        Object result = invocation.proceed();
        // do something .......方法拦截后执行代码块
        System.out.println(" do something .......方法拦截后执行代码块");
        return result;
    }
    @Override
    public void setProperties(Properties properties) {
        this.properties = properties;
    }
    @Override
    public Object plugin(Object target) {
        return Plugin.wrap(target, this);
    }
}
```

**1、** 执行查询，在SQL执行前后，都输出了插件中的代码；

可以看出，和AOP机制差不多，可以对执行的方法进行拦截处理，插件实际就是拦截器。

### 插件简介

#### 官网说明

MyBatis 允许你在映射语句执行过程中的某一点进行拦截调用。默认情况下，MyBatis 允许使用插件来拦截的方法调用包括：

- Executor (update, query, flushStatements, commit, rollback, getTransaction, close, isClosed)
- ParameterHandler (getParameterObject, setParameters)
- ResultSetHandler (handleResultSets, handleOutputParameters)
- StatementHandler (prepare, parameterize, batch, update, query)

实际就是插件可以对四大组件进项拦截，在这些对象进行操作的前后植入自己的代码，类似于Spring中的AOP机制。 在试图修改或重写已有方法的行为时，很可能会破坏 MyBatis 的核心模块。 这些都是更底层的类和方法，所以使用插件的时候要特别当心。

### 使用场景

MyBatis的使用场景十分多，比如mybatis plus就扩展了很多插件，分页、数据权限、租户等等，MyBatis 的插件可以在不修改原来的代码的情况下，通过拦截的方式，改变四大核心对象的行为，比如处理参数，处理 SQL，处理结果。

一般用来：

- 分页
- 数据权限
- SQL日志
- 性能分析

### 插件原理

#### 代理模式

mybatis中大量使用了设计模式和反射机制，其中插件机制基于代理模式实现，所以先复习下代理模式(Proxy)。

##### 代理模式简介

**代理模式**: 为一个对象提供一个替身，以控制对这个对象的访问。即通过代理对象访问目标对象.这样做的好处是:可以在目标对象实现的基础上.增强额外的功能操作,即扩展目标对象的功能。

代理模式有不同的形式,主要有三种静态代理、动态代理(JDK 代理、接口代理)和Cglib 代理(可以在内存动态的创建对象，而不需要实现接口，他是属于动态代理的范畴)。

简单示意图： 通过访问代理对象，最终访问到目标对象，代理对象可以对目标对象进行增强扩展。

##### 动态代理

代理对象不需要实现接口，但是目标对象要实现接口，否则不能用动态代理代理对象的生成，是利用JDK的API，动态的在内存中构建代理对象，动态代理也叫做:JDK代理、接口代理。

所以动态是因为在程序运行时，通过反射机制动态创建而成。

在java的动态代理机制中，有两个重要的接口和类。一个是接口InvoactionHandler，一个是类Proxy，这一个类和一个接口是实现动态代理所必须用到的。

**案例**：

**1、** 创建目标对象接口，并实现接口；

```java
public interface Target {
    void test();
}
```

```java
/**
 * Created by TD on 2021/6/28
 * 被代理对象
 */
public class TargetObject implements Target {
    @Override
    public void test() {
        System.out.println("TargetObject test");
    }
}
```

**1、** 创建代理对象类实现InvoactionHandler接口；

```java
public class ProxyObject implements InvocationHandler {
    // 维护一个目标对象
    private Object target;
    // 构造器 对target进行初始化
    public ProxyObject(Object target) {
        this.target = target;
    }
    @Override
    public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
        System.out.println("JDK代理 before");
        // 反射机制调用目标对象的方法
        Object invoke = method.invoke(target, args);
        System.out.println("JDK代理 after");
        return invoke;
    }
    // 使用JDK Proxy API 给目标对象生成一个代理对象
    public Object getJdkProxy() {
        // newProxyInstance
        // 参数1：类加载器
        // 参数2：目标对象实现的接口
        // 参数3：h:动态代理方法在执行时，会调用h里面的invoke方法去执行
        return Proxy.newProxyInstance(target.getClass().getClassLoader(), target.getClass().getInterfaces(), this);
    }
}
```

**1、** 测试；

```java
public class Test {
    public static void main(String[] args) {
        // 创建目标对象
        Target target = new TargetObject();
        // 使用目标对象创建代理对象
        ProxyObject proxyObject = new ProxyObject(target);
        // 获取代理对象并强转
        Target jdkProxy = (Target) proxyObject.getJdkProxy();
        // 调用方法
        jdkProxy.test();
    }
}
```

#### 插件源码分析

##### 拦截器链

之前我们介绍在加载Configuration对象时，会将所有拦截器加载到拦截器链中。

InterceptorChain 类提供了一个List集合存放所有拦截器，及其get/set 方法。

并提供了pluginAll方法，循环所有插件，对目标对象调用插件的plugin方法进行代理。

```java
public class InterceptorChain {
    private final List<Interceptor> interceptors = new ArrayList<Interceptor>();
    /**
     * 包装执行器
     *
     * @param target
     * @return
     */
    public Object pluginAll(Object target) {
        // 循环所有拦截器，使用拦截器重新包装一个执行器
        for (Interceptor interceptor : interceptors) {
            // 拦截器对每一个执行器，进行层层包装，当前执行器就绑定了所有的拦截器，当执行器运行时，拦截器就会根据规则进行拦截
            target = interceptor.plugin(target);
        }
        // 包装完成后 返回
        return target;
    }
    public void addInterceptor(Interceptor interceptor) {
        interceptors.add(interceptor);
    }
    public List<Interceptor> getInterceptors() {
        return Collections.unmodifiableList(interceptors);
    }
}
```

##### 代理执行

之前也介绍过在执行查询时，Executor创建执行器的时候，都会调用pluginAll方法对执行器进行包装（四大对象创建的时候都会进行此步骤）。

插件类会对这些拦截对象进行代理，进入的是插件的plugin方法。

Plugin就是我们的插件代理对象，维护了一个目标对象，当目标对象执行时，会实际执行代理对象，那么一旦四大组件对象被代理后，我们就可以使用代理模式对他们进行增强扩展处理了。

plugin方法会获取你插件配置需要拦截四大对象的哪些方法，如果执行的这个方法需要拦截，就会使用JDK中的 Proxy.newProxyInstance方法进行动态代理。

```java
    /**
     * 包装代理
     *
     * @param target      目标对象
     * @param interceptor 拦截器
     */
    public static Object wrap(Object target, Interceptor interceptor) {
        // 获取需要拦截的类及方法Map
        Map<Class<?>, Set<Method>> signatureMap = getSignatureMap(interceptor);
        // 获取目标对象的classorg.apache.ibatis.executor.SimpleExecutor
        Class<?> type = target.getClass();
        // 获取当前代理对象 是否在拦截器配置的拦截对象中
        Class<?>[] interfaces = getAllInterfaces(type, signatureMap);
        // 如果该代理需要拦截
        if (interfaces.length > 0) {
            // 创建代理对象并返回
            return Proxy.newProxyInstance(
                    type.getClassLoader(),
                    interfaces,
                    new Plugin(target, interceptor, signatureMap));
        }
        return target;
    }
```

经过对目标对象的层层代理，就实现了mybatis的插件机制。
