# 12、SpringCloud Zuul 性能优化
- 来源：https://ddkk.com/zhuanlan/gateway/springcloudzuul/12.html
- 分类：API网关
- 分组：教程目录
## 1、Tomcat

Tomcat的最大并发数是可以配置的，实际运用中，最大并发数与硬件性能有很大关系的。Tomcat默认的HTTP实现是采用阻塞式的Socket通信，每个请求都需要创建一个线程处理。Tomcat默认配置的最大请求数是150，也就是说同时支持150个并发，并发越大，GC的负担也越大。

Windows每个进程的线程数不能超过2000，Linux每个进程中的线程数不允许超过1000，在Java中每开启一个线程需要耗用1MB的JVM内存空间用于线程栈之用。

所以我们修改tomcat(内嵌)的默认配置，如下：

```sh
server:
  tomcat:
    accept-count: 1000 
    max-threads: 1000
    max-connections: 2000
```

我们知道http请求底层实际是socket连接，只是每次请求完成之后，socket会关闭，所以才说http是短连接。而Max-connections就是与tomcat建立的最大socket连接数。

max-threads是tomcat工作线程池最大线程数。

acceptCount是当tomcat线程数达到最大时，接受排队的请求个数。

一般的服务器操作都包括两个方面：计算（主要消耗cpu）、等待（io、数据库等）

第一种极端情况，如果我们的操作是纯粹的计算，那么系统响应的主要限制就是cpu的运算能力，此时max-threads应该尽量设的小，降低同一时间内争抢cpu的线程个数。

另一种极端情况，如查我们的操作纯粹是IO或者数据库，那么响应时间的主要限制就变为等待外部资源，此时max-threads应该尽量设置的大，这样才能提高同时处理请求的个数，另外还要关注tomcat的内存调置和linux的open file限制 。

## 2、zuul

zuul内部路由可以理解为使用一个线程池去发送路由请求，所以我们也需要扩大这个线程池的容量。

```sh
zuul:
  host:
    max-per-route-connections: 1000
    max-total-connections: 1000
```

## 3、监控工具

为了确保上述配置真正起作用，我们使用Java VisualVM或jconsol这个工具监控这几台服务器上部署的tomcat的线程以及内存使用情况。

启动脚本上加上如下参数，之后通过工具连接2099端口即可监控。

```sh
Dcom.sun.management.jmxremote.port=2099 -Dcom.sun.management.jmxremote.ssl=false -Dcom.sun.management.jmxremote.authenticate=false -Djava.rmi.server.hostname=10.19.52.8
```

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有
