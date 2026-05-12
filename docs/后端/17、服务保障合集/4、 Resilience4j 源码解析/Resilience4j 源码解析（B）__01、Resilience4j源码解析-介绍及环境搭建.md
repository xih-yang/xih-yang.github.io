# 01、Resilience4j源码解析-介绍及环境搭建
- 来源：https://ddkk.com/zhuanlan/guarantee/resilience4j/14.html
- 分类：服务保障
- 分组：Resilience4j 源码解析（B）
## 1、简介

Resilience4j是受Hystrix启发而做的新一代轻量级熔断器，基于Java8的函数式编程开发。resilience4j只依赖一个Vavr包(函数式库)，不需要再引入其他包，所以相对于Hystrix是轻量级的。同时resilience4j的模块化程度更好，很容易的扩展附加模块。

目前Resilience4j包括熔断(CircuitBreaker)、限流(RateLimiter)、隔离(BulkHead)、重试(Retry)、缓存(Cache)、执行时间限制(TimeLimiter)等模块及一些附加模块(Add-on modules)。

## 2、环境搭建

**1，安装Gradle及设置**

由于Resilience4j采用gradle进行编译及打包，所以我们需要下载及安装最新版本的gradle，同时在IDE中进行环境设置。Resilience4j在github上的地址： [https://github.com/resilience4j/resilience4j.git](https://github.com/resilience4j/resilience4j.git) clone下来及导入到IntelliJ IDEA中，设置resilience4j的gradle环境，如图：

Service directory path是放置类包的仓库。勾选Use auto-import选项，grade会对resilience4j源码进行依赖导入及编译。

**2，代码调试**

编译好的Resilience4j代码，如下图：

如果我们要研究circuitbreaker的源码，就可以进入到resilience4j-circuitbreaker模块中，找到单元测试类CircuitBreakerTest类，设置断点，进行代码跟踪调试了。

测试类路径在：

其中的一个测试方法如下图：

**3，本系列文章重点研究源码，源码的中文注释地址：**

[https://github.com/Justin02180218/resilience4j](https://github.com/Justin02180218/resilience4j) 会持续完善。

至于项目中如何使用Resilience4j

请参考的官方文档：[http://resilience4j.github.io/resilience4j/#_getting_started](http://resilience4j.github.io/resilience4j/#_getting_started)

下一篇文章《Resilience4j源码解析-2.1 CircuitBreaker模块》讲解熔断器模块。
