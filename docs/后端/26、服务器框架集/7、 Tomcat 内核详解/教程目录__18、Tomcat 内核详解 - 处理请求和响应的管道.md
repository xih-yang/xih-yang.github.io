# 18、Tomcat 内核详解 - 处理请求和响应的管道
- 来源：https://ddkk.com/zhuanlan/server/tomcat/3/18.html
- 分类：服务器框架
- 分组：教程目录
## 1.管道模式——管道与阀门

管道模式：

划分出的每个小模块之间互相独立并且各自负责一段处理逻辑，这些逻辑处理小模块根据顺序连接起来，前一模块的输出作为后一个模块的输入，最后一个模块的输出为最终的处理结果。如此依一来

这就是管道模式，在管道中连接一个或多个阀门，每个阀门负责一部分逻辑处理，数据按规定的顺序往下流。此模式分解了逻辑处理任务，可方便对某任务单元进行安装拆卸，提高了流程的可扩展性、可重用性、机动性、灵活性。

## 2.Tomcat中的管道

Tomcat中按照包含的关系一共有4个级别的容器，它们的标准实现分别为StandardEngine、StandarHost、StandardContext和StandardWrapper，请求对象以及响应对象将分别被这4个容器处理。

## 3.Tomcat中的定制阀门

步骤：

①自定义一个阀门PrintIPValve，只要继承ValveBase并重写invoke方法即可，ValveBase是Tomcat抽象的一个基础类，它帮我们实现了生命接口及MBean接口，使我们只需专注阀门的逻辑处理即可。需要注意的地方是一定要执行调用下一个阀门操作，即执行getNext().invoke(request,response)，否则运行时将出现错误，请求到这个阀门就停止往下处理。

```java
public classPrintIPValve extends ValveBase{
     @Override
     publicvoid invoke(Request request, Response response) throws IOException,
                        ServletException{
               System.out.println(request.getRemoteAddr());
               getNext().invoke(request,response);
     }
}
```

②配置tomcat服务器配置server.xml，这里把阀门配到Engine容器下，这样作用范围即在整个引擎，你也可以根据作用范围配置Host或Context下。

```xml
<Server port="8005"shutdown="SHUTDOWN">
……
<Engine name="Catalina"defaultHost="localhost">
<ValveclassName="org.apache.catalina.valves.PrintIPValve" />
……
</Engine>
……
</Server>
```

③将PrintIPValve类编译成.class文件，可以导出一个jar包放入tomcat安装目录lib目录下，也可直接将.class文件放入tomcat官方包catalina.jar中，这里的包名为org.apache.catalina.valves。

【使用Tomcat自带功能阀门，配置即可使用】

经过上面三个步骤配置好阀门，启动tomcat后对其进行的任何请求访问的客户端的IP都将被记录到日志中。除了自定义阀门以外，tomcat的开发者也十分友好，为我们提供了很多常用的阀门，对于这些阀门我们就无需再自定编写阀门类，要做的仅仅是在server.xml中配置即可生效。

lAccessLogValve，请求访问日志阀门，通过此阀门可以记录所有客户端的访问日志，包括远程主机IP、远程主机名、请求方法、请求协议、会话id、请求时间、处理时长、数据包大小等等。它提供了任意参数化的配置，可以通过任意组合来定制你的访问日志格式。

lJDBCAccessLogValve，同样是记录访问日志的阀门，但此类帮助将访问日志通过jdbc持久化到数据库中。

lErrorReportValve，这是一个将错误以html格式输出的阀门。

lPersistentValve，这是对每个请求的会话实现持久化的阀门。

lRemoteAddrValve，这是一个访问控制阀门，通过配置可以决定哪些ip可以访问web应用。

lRemoteHostValve，这也是一个访问控制阀门，与RemoteAddrValve不同的是它是通过主机名限制访问者。

lRemoteIPValve，这是一个针对代理或负载均衡处理的一个阀门，一般经过代理或负载均衡转发的请求都将自己的IP添加到请求头部"X-Forwarded-For"中，此时可以通过此阀门可以获取访问者真实的IP。

lSemaphoreValve，这是一个控制容器上并发访问的阀门，可以作用在不同容器上。例如放在Context则整个上下文只允许若干线程同时访问，并发数量可以自己配置。

在实际的使用过程中，如果你需要的阀门tomcat已经帮你写好，则只需要对配置文件进行配置即可生效，如果无法满足自己需求的话则可以通过自己定义一个阀门。
