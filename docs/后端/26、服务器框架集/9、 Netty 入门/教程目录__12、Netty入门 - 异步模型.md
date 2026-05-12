# 12、Netty入门 - 异步模型
- 来源：https://ddkk.com/zhuanlan/server/netty/2/12.html
- 分类：服务器框架
- 分组：教程目录
## 1.Netty异步模型介绍

**1、** 异步的概念和同步相对当一个异步过程调用发出后，调用者不能立刻得到结果实际处理这个调用的组件在完成后，通过状态、通知和回调来通知调用者；

**2、** Netty中的I**/O操作**是异步的，包括**Bind、Write、Connect**等操作会简单的返回一个**ChannelFuture**；

**3、** 调用者并不能立刻获得结果，而是通过**Future-Listener机制**，用户可以方便的**主动获取**或者通过**通知机制**获得IO操作结果；

**4、** Netty的异步模型是建立在**future**和**callback**的之上的；

- callback就是回调。
- 重点说Future，它的核心思想是：假设一个方法 fun，计算过程可能非常耗时，等待 fun 返回显然不合适。那么可以在调用 fun 的时候，立马返回一个 Future，后续可以通过 Future去监控方法 fun 的处理过程（即：Future-Listener机制）

## 1.1 Future说明

**1、** 表示异步的执行结果，可以通过它提供的方法来检测执行是否完成，比如检索计算等等；

**2、** ChannelFuture是一个接口：publicinterfaceChannelFutureextendsFuture，我们可以添加监听器，当监听的事件发生时，就会通知到监听器；

工作原理示意图，如下所示。

**说明：**

1、在使用Netty进行编程时，拦截操作和转换出入站数据只需要您提供 callback 或利用 future 即可。这使得**链式操作**简单、高效，并有利于编写可重用的、通用的代码。

2、Netty框架的目标就是让你的业务逻辑从网络基础应用编码中分离出来、解脱出来。

## 1.2 Future-Listener机制

**1、** 当Future对象刚刚创建时，处于非完成状态，调用者可以通过返回的ChannelFuture来获取操作执行的状态，注册监听函数来执行完成后的操作；

**2、** 常见有如下操作：

- 通过 isDone 方法来判断当前操作是否完成；
- 通过 isSuccess 方法来判断已完成的当前操作是否完成；
- 通过 getCause 方法来获取已完成的当前操作失败的原因；
- 通过 isCancelled 方法来判断已完成的当前操作是否被取消；
- 通过 addListener 方法来注册监听器，当操作已完成（isDone 方法返回完成），将会通知指定的监听器；如果 Future 对象已完成，则通知指定的监听器。

举例说明

演示：绑定端口是异步操作，当绑定操作处理完，将会调用相应的监听器处理逻辑

```java
// 绑定一个端口，并且同步，生成一个ChannelFuture对象
// 启动服务器
ChannelFuture cf = bootstrap.bind(6668).sync();
// 给 cf 注册监听器，监控我们关心的事件
cf.addListener(new ChannelFutureListener() {
    @Override
    public void operationComplete(ChannelFuture future) throws Exception {
        if (cf.isSuccess()) {
            System.out.println("监听端口 6668 成功");
        } else {
            System.out.println("监听端口 6668 失败");
        }
    }
});
```

**小结：**相比传统阻塞 I/O，执行 I/O 操作后线程会被阻塞住，直到操作完成；异步处理的好处是不会造成线程阻塞，线程在 I/O 操作期间可以执行别的程序，在高并发情形下会更稳定和更高的吞吐量。
