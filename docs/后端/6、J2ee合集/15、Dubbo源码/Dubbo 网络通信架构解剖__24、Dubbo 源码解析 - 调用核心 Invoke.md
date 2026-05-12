# 24、Dubbo 源码解析 - 调用核心 Invoke
- 来源：https://ddkk.com/zhuanlan/j2ee/dubbo/1/24.html
- 分类：J2EE框架
- 分组：Dubbo 网络通信架构解剖
任何框架或组件，总会有核心领域模型，比如：Spring 的 Bean，Struts 的 Action，Napoli 的 Queue 。对于 Dubbo 来说它的核心就是 Service(服务接口)，而 Service 不管是 provider 暴露服务，还是 consumer 引用服务。它都是一个非常重要的概念，我们来看一下 Dubbo 的核心领域模型：

- Protocol 是服务域，它是 Invoker 暴露和引用的主功能入口，它负责 Invoker 的生命周期管理。
- Invoker 是实体域，它是 Dubbo 的核心模型，其它模型都向它靠扰，或转换成它，它代表一个可执行体，可向它发起 invoke 调用，它有可能是一个本地的实现，也可能是一个远程的实现，也可能一个集群实现。
- Invocation 是会话域，它持有调用过程中的变量，比如方法名，参数等。

#### 1、dubbo 服务暴露

服务提供者暴露一个服务的详细过程。

上图是服务提供者暴露服务的主过程：

首先ServiceConfig 类拿到对外提供服务的实际类 ref(如：HelloWorldImpl),然后通过 ProxyFactory 类的 getInvoker 方法使用 ref 生成一个 AbstractProxyInvoker 实例，到这一步就完成具体服务到 Invoker 的转化。接下来就是 Invoker 转换到 Exporter 的过程。

Dubbo 处理服务暴露的关键就在 Invoker 转换到 Exporter 的过程，上图中的红色部分。下面我们以 Dubbo 和 RMI 这两种典型协议的实现来进行说明：

**Dubbo 的实现**

Dubbo 协议的 Invoker 转为 Exporter 发生在 DubboProtocol 类的 export 方法，它主要是打开 socket 侦听服务，并接收客户端发来的各种请求，通讯细节由 Dubbo 自己实现。

**RMI 的实现**

RMI协议的 Invoker 转为 Exporter 发生在 RmiProtocol类的 export 方法，它通过 Spring 或 Dubbo 或 JDK 来实现 RMI 服务，通讯细节这一块由 JDK 底层来实现，这就省了不少工作量。

#### 2、dubbo 服务暴露

服务消费者消费一个服务的详细过程。

**上图是服务消费的主过程：**

首先ReferenceConfig 类的 init 方法调用 Protocol 的 refer 方法生成 Invoker 实例(如上图中的红色部分)，这是服务消费的关键。接下来把 Invoker 转换为客户端需要的接口(如：HelloWorld)。

关于每种协议如 RMI/Dubbo/Web service 等它们在调用 refer 方法生成 Invoker 实例的细节和上一章节所描述的类似。

#### 3、满眼都是 Invoker

由于Invoker 是 Dubbo 领域模型中非常重要的一个概念，很多设计思路都是向它靠拢。这就使得 Invoker 渗透在整个实现代码里，对于刚开始接触 Dubbo 的人，确实容易给搞混了。 下面我们用一个精简的图来说明最重要的两种 Invoker：服务提供 Invoker 和服务消费 Invoker：

为了更好的解释上面这张图，我们结合服务消费和提供者的代码示例来进行说明：

服务消费者代码：

```java
public class DemoClientAction {
    private DemoService demoService;
    public void setDemoService(DemoService demoService) {
        this.demoService = demoService;
    }
    public void start() {
        String hello = demoService.sayHello("world" + i);
    }
}
```

上面代码中的 `DemoService` 就是上图中服务消费端的 proxy，用户代码通过这个 proxy 调用其对应的 `Invoker`，而该 `Invoker` 实现了真正的远程服务调用。

服务提供者代码：

```java
public class DemoServiceImpl implements DemoService {
    public String sayHello(String name) throws RemoteException {
        return "Hello " + name;
    }
}
```

上面这个类会被封装成为一个 AbstractProxyInvoker 实例，并新生成一个 Exporter 实例。这样当网络通讯层收到一个请求后，会找到对应的 Exporter 实例，并调用它所对应的 AbstractProxyInvoker 实例，从而真正调用了服务提供者的代码。Dubbo 里还有一些其他的 Invoker 类，但上面两种是最重要的。

参考文章：

- http://dubbo.apache.org/books/dubbo-dev-book/principals/general-knowledge.html
- http://dubbo.apache.org/books/dubbo-dev-book/implementation.html
- http://dubbo.apache.org/books/dubbo-dev-book/design.html
