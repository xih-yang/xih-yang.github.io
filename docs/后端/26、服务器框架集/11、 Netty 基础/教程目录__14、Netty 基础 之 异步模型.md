# 14、Netty 基础 之 异步模型
- 来源：https://ddkk.com/zhuanlan/server/netty/4/14.html
- 分类：服务器框架
- 分组：教程目录
## 一、基本介绍

**1、** 异步的概念和同步相对当一个异步过程调用发出后，调用者不能立刻得到结果实际处理这个调用的组件在完成后，通过状态、通知和回调来通知调用者；

**2、** netty中的I/O操作是异步的，包括Bind、Write、Connect等操作会简单的返回一个ChannelFuture；

**3、** 调用者并不能立刻获得结果，而是通过Future-Listener机制，用户可以方便的主动获取或者通过通知机制获得IO操作结果；

**4、** netty的异步模型是建立在future和callback之上的callback就是回调重点说future，它的核心思想是：假设一个方法fun，计算过程可能非常耗时，等待fun返回显然不合适那么可以在调用fun的时候，立马返回一个future，后续可以通过future去监控方法fun的处理过程（即：Future-Listener机制）；

**5、** 异步+监听；异步不阻塞，监听获取异步执行结果；

## 二、Future说明

**1、** 表示异步的执行结果，可以通过它提供的方法来检查执行是否完成，比如检索计算等；

**2、** ChannelFuture是一个接口；

public interface ChannelFuture extends Future

我们可以添加监听器，当监听的事件发生时，就会通知到监听器。

## 三、工作原理图

**1、** 在使用netty进行编程时，拦截操作和转换出入站数据只需要您提供callback或利用future即可这使得链式操作简单、高效，并有利于编写可重用的、通用的代码；

**2、** netty框架的目标就是让你的业务逻辑从网络基础应用编码中分离出来，解脱出来；

## 四、Future-Listener机制

**1、** 当future对象刚刚创建时，处于非完成状态，调用者可以通过返回的ChannelFuture来获取操作执行的状态，注册监听函数来执行完成后的操作；

**2、** 常见有如下操作；

1、通过isDone方法来判断当前操作是否完成。

2、通过isSuccess方法来判断已完成的当前操作是否成功。

3、通过getCause方法来获取已完成的当前操作失败的原因。

4、通过isCancelled方法来判断已完成的当前操作是否被取消。

5、通过addListener方法来注册监听器，当操作已完成（isDone方法返回完成），将会通知指定的监听器。

**3、** 举例说明；

绑定端口是异步操作，当绑定操作处理完，将会调用相应的监听器处理逻辑。

```java
serverBootstrap.bind(port).addListener(future -> {
  if(future.isSuccess()) {
    System.out.println(newDate() + "：端口[" + port + "]绑定成功！");
  } else {
    System.out.println("端口[" + port + "]绑定失败！");
  }
});
```

**4、** 相比传统阻塞I/O，执行I/O操作后线程会被阻塞住，直到操作完成；异步处理的好处是不会造成线程阻塞，线程在I/O操作期间可以执行别的程序，在高并发情形下会更稳定和更高的吞吐量；
