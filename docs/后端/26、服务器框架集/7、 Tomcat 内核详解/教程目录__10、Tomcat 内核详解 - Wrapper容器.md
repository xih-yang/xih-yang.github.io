# 10、Tomcat 内核详解 - Wrapper容器
- 来源：https://ddkk.com/zhuanlan/server/tomcat/3/10.html
- 分类：服务器框架
- 分组：教程目录
Wrapper容器是Tomcat中最小级别的容器，可能对应一个Servlet对象，也可能对应一个Servlet对象池；

## 1.Servlet工作机制

Servlet在初始化的时候调用init方法，在销毁时调用destroy方法，而对客户端的请求则调用service方法。对于这些机制，都必须由Tomcat在内部提供支持，具体则由Wrapper容器提供支持；

## 2.Servlet对象池

Servlet在不实现SingleThreadModel的情况下以单个实例运行，对应此Servlet的所有客户端请求都会使用此Servlet对象。

为了支持一个Servlet对应对应一个线程，Servlet规范提出了一个SingleThreadModel接口，对于这种模式，Tomcat的Wrapper容器使用了对象池策略；

Servlet对象池就是一个栈结构，需要的时候pop出一个对象，使用完就push回去；

## 3.过滤器链

## 4.Servlet种类

- 普通Servlet；
- JSP页面路由到JspServlet；

JSP页面最终也会被Tomcat编译成为Servlet

- 静态资源路由到DefaultServlet，它是Tomcat专门用于处理静态资源的Servlet

## 5.Comet模式的支持

Comet模式是一种服务端推技术，核心思想是一种能够让服务器往客户端发送数据的方式。

该模式可以大大减少发送到服务器端的请求，从而避免了开销，而且它还具备更好的实时性；

一般Comet模式需要NIO配合，而在BIO中无法使用Comet模式。

## 6.WebSocket协议的支持

WebSocket协议属于HTML5标准，它能够让客户端和浏览器实现双向通信。另外WebSocket协议摒弃了HTTP协议繁琐的请求头部，而是以数据帧的方式进行传输，效率更高；

WebSocketServlet

## 7.异步Servlet

Servlet中等待阻塞会导致Web容器整体的处理能力低下，因为对于比较耗时的操作，可以将它放置在一个单独的线程中处理，此过程保留了连接的请求和响应对象，在处理完成之后，可以把处理结果通知到客户端；
