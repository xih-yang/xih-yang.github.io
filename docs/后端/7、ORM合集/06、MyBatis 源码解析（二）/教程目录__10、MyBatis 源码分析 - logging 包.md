# 10、MyBatis 源码分析 - logging 包
- 来源：https://ddkk.com/zhuanlan/orm/mybatis/7/10.html
- 分类：ORM框架
- 分组：教程目录
> 对于一个健壮的系统，日志的记录是必不可少的，因为它能帮助我们追踪系统的状态或找到问题所在。而 logging 包的作用就是如此。
>
> 在 Mybatis 运行过程中，可能会在配置解析、参数处理、数据查询、结果转换等各个步骤出现错误，这个时候良好的日志记录就能帮助我们快速的定位到问题的所在。

由于现存在很多的日志框架，`slf4j`、`jcl`、`log4j`、`log4j2`、`jul`、`logback`等。所以 Mybatis 并不知道用户使用的到底是哪一个，这个时候只能根据一定的优先级去加载，找到第一个有效的日志框架。(注：slf4j 和 jcl 虽然是门面，但是也可以视为日志框架)

如果在每次需要打印日志的地方，都要先判断哪个日志框架是有效的，然后在调用对应的打印方法的话，那么就会出现很多冗余的代码。那么有什么方法能解决这个问题吗？有！那就是设计模式中的适配器模式。首先我们需要定义一个 Mybatis 使用的 Log，其中定义了必要的方法，而适配器的作用就是起一个转换的作用，简单来说就是用各种日志框架来实现 Mybatis 的这个 Log 中的方法。

可以用更形象的说法，产品提了一个需求，那么手下开发人员要去实现，不管用什么技术或方法，其实这也就是一个适配器的感觉，用自己的能力去实现这个需求，每个人的能力不同，所以实现的方式也不同。但是从产品的角度来看是实现了的。

### 类 UML 图

Log 就是 Mybatis 中调用的打印日志的标准接口，而它的实现类便是适配器类，为的就是将那些不符合标准的各种日志框架转换为符合 Mybatis 要求的类。而 LogFactory 就是从众多的日志框架中选择最合适的一个，然后来创建 Log 对象。

可能有读者注意到了，有些包下有多个实现类。这是因为采用的是装饰者模式，对原来的日志打印功能做了增强。

#### Log

```java
public interface Log {
  // 是允许打印 debug 级别的日志
  boolean isDebugEnabled();
  // 是允许打印 trace 级别的日志
  boolean isTraceEnabled();
  // 打印 error 级别的日志
  void error(String s, Throwable e);
  // 打印 error 级别的日志
  void error(String s);
  // 打印 debug 级别的日志
  void debug(String s);
  // 打印 trace 级别的日志
  void trace(String s);
  // 打印 warn 级别的日志
  void warn(String s);
}
```

可能有的读者不是很清楚为什么有 `isDebugEnabled` 和 `isTraceEnabled` 这两个接口，而且也经常在看源码的时候会看到如下代码：

```java
if (log.isDebugEnabled()) {
        log.debug("xxx '" + param1 + "' xxxx" + param2 + " xxxx.");
      }
```

为什么要先判断会不会输出再调用 log.debug 呢。正常来说如果不允许输出 debug 日志的话，那么就算调用了 log.debug 也不会打印，没错，这样理解是对的。但是为什么要先判断，其实是从性能能上去考虑的，因为我们在调用的时候，传递的参数一般都是字符串，所以需要去创建一个字符串对象，而且如果想要打印的比较细致的话，可能还要进行字符串的拼接，等传递进去了，发现这个字符串又不能打印，那么就生成了无用的对象。

所以我们在打印这种级别比较低的日志时，建议最好先去判断一下，防止白白消耗内存资源。

#### LogFactory

由于现在的日志框架有很多，知名的就有那么多个，还有一些不知名的。而且也可能存在更换日志框架的情况，所以就有了 LogFactory，专门用来创建 Log 对象。

##### 日志框架优先级

```java
  private static Constructor<? extends Log> logConstructor;
  static {
    tryImplementation(LogFactory::useSlf4jLogging);
    tryImplementation(LogFactory::useCommonsLogging);
    tryImplementation(LogFactory::useLog4J2Logging);
    tryImplementation(LogFactory::useLog4JLogging);
    tryImplementation(LogFactory::useJdkLogging);
    tryImplementation(LogFactory::useNoLogging);
  }
  private static void tryImplementation(Runnable runnable) {
    if (logConstructor == null) {
      try {
        runnable.run();
      } catch (Throwable t) {
      }
    }
  }
  private static void setImplementation(Class<? extends Log> implClass) {
    try {
      Constructor<? extends Log> candidate = implClass.getConstructor(String.class);
      Log log = candidate.newInstance(LogFactory.class.getName());
      logConstructor = candidate;
    } catch (Throwable t) {
      throw new LogException("Error setting Log implementation.  Cause: " + t, t);
    }
  }
```

可以看到日志框架的加载优先级是 slf4j > jcl > log4j2 > log4j > jul。有些读者可能会好奇为什么 tryImplementation 的请求参数类型是 Runnable 呢，而在传递的时候写的是 `LogFactory::useXXX` 呢，其实这是 Java8 的特性之一方法引用，可以简单的理解为传递了一个方法，而这个方法被封装到了 Runnable 的 run 方法内。非简化版本如下：

```java
    tryImplementation(new Runnable() {
      @Override
      public void run() {
        useCommonsLogging();
      }
    });
```

然后在 `tryImplementation` 内部直接调用的 run，方法，而不是将其放在 Thread 中然后 start，所以就像普通的方法调用一样。这样的写的好处就是不用在每处都进行异常的处理，只需要在 tryImplementation 里处理就行了，而且不管传什么方法进来执行都可以。

`setImplementation` 中就是将当前的想要使用的日志框架拿出来出用一下，如果没有抛出异常说明是可以用的，如果抛出了异常说明不能使用，忽略即可。

**参考文献**

**1、** 《通用源码阅读指导书：Mybatis源码阅读详解》——易哥；
