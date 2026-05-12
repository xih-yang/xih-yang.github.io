# 20、Tomcat 源码解析 - Tomcat socket处理流程分析
- 来源：https://ddkk.com/zhuanlan/server/tomcat/2/20.html
- 分类：服务器框架
- 分组：教程目录
第十七篇分析了tomcat socket处理的概览，这篇对流程进行梳理，达到分析到主流程和大概的处理逻辑，比如request和response的创建等后续分析请求处理需要解决的疑惑，后面分析请求处理的时候碰到的涉及到这篇的问题将持续更新这篇

十七篇分析了socket处理的主流程如下

`NIOEndPoint.startInternal->Poller->NIOEndPoint.processKey->`

`NIOEndPoint.createSocketProcessor() 得到SocketProcessor 调用run->ConnectionHandler.process->Http11Processor.service->CoyoteAdapter.service(request, response);->connector.getService().getContainer().getPipeline().getFirst().invoke(request, response)`

上面将NIO的处理和主流程即父类的处理流程混在一起，下面分析的时候会区分开来

**1、** NIOEndPoint的processKey方法，是在Poller线程中selector.select()后处理socket的时候调用，这个是NIOEndPoint独有，下面是processKey的代码片段,可以看出后续会调用processSocket方法，除了processSocket外还有个方法processSendfile，这个方法后续再看；

```java
protected void processKey(SelectionKey sk, NioSocketWrapper attachment) {
           …………..
                     if (!processSocket(attachment, SocketEvent.OPEN_READ, true)) {
                                    closeSocket = true;
                                }
                            }
                            if (!closeSocket && sk.isWritable()) {
                                if (!processSocket(attachment, SocketEvent.OPEN_WRITE, true)) {
                                    closeSocket = true;
                                }
                            }
                            if (closeSocket) {
                                cancelledKey(sk);
                            }
                        }
   ………………………..
        }
```

**2、** AbstractEndPoint子类(例如NIOEndPoint)会调用到processSocket方法，processSocket方法是AbstractEndPoint中的方法，也就是说每个EndPoint的子类都会调用processSocket，目前为止主流程应该是：；

StartInternal->EndPoint子类触发调用processSocket方法(对于NIOEndPoint就是Poller->processKey)->EndPoint父类的processSocket方法

下面是processSocket方法的代码片段，参数socketWrapper是SocketWrapperBase类实例，对于NIO来说就是NioSocketWrapper，S是NioChannel，就是说子类在调用processSocket方法的时候会传入相关的SocketWrapper,对于NIO来说是NioSocketWrapper.下面的逻辑会在缓存processorCache中取SocketProcessorBase，processorCache是在各子类的EndPoint中实例化，而SocketProcessorBase的子类在每个子类EndPoint中定义，是每个子类的内部类，以NIOEndPoint举例，下面是NioEndPoint中SocketProcessorBase子类SocketProcessor的定义片段，可以看到最后会调用到handler的process方法,还要注意一点就是processSocket会用server.xml配置的executor执行SocketProcessorBase，如果配置了的话(会有默认的)，目前为止主流程应该是：

`StartInternal->EndPoint子类触发调用processSocket方法(对于NIOEndPoint就是Poller->processKey)->EndPoint父类的processSocket方法->子类EndPoint的createSocketProcessor方法创建SocketProcessorBase(每个子类不同，定义在子类的java文件中)->调用SocketProcessorBase子类的run方法(Executor或者直接调用)`

```java
public boolean processSocket(SocketWrapperBase<S> socketWrapper,
            SocketEvent event, boolean dispatch) {
        ………………..
     SocketProcessorBase<S> sc = processorCache.pop();
            if (sc == null) {
                sc = createSocketProcessor(socketWrapper, event);
            } else {
                sc.reset(socketWrapper, event);
            }
            Executor executor = getExecutor();
            if (dispatch && executor != null) {
                executor.execute(sc);
            } else {
                sc.run();
            }
     ………………………
}
```

NioEndPoint中SocketProcessorBase子类片段：

```java
protected class SocketProcessor extends SocketProcessorBase<NioChannel> {
        public SocketProcessor(SocketWrapperBase<NioChannel> socketWrapper, SocketEvent event) {
            super(socketWrapper, event);
        }
        @Override
        protected void doRun() {
          ………………..
                        state = getHandler().process(socketWrapper, event);
                  ………………………………
                socketWrapper = null;
                event = null;
                //return to cache
                if (running && !paused) {
                    processorCache.push(this);
        ……………….
}
```

**3、** SocketProcessorBase子类的doRun方法，以NioEndPoint举例(SocketProcessor)，上面有SocketProcessordoRun方法的代码片段，可以看到会调用到Handler的process方法，这个Handler是顶级抽象接口，主流程的一个环节，它的实现类定义在AbstractProtocol中，是AbstractProtocol类的一个静态内部类ConnectionHandler，这个handler的实例是在Protocol创建EndPoint的时候设置进去的，下面是代码片段；

```java
…………………
public AbstractHttp11Protocol(AbstractEndpoint<S,?> endpoint) {
        super(endpoint);
        setConnectionTimeout(Constants.DEFAULT_CONNECTION_TIMEOUT);
        ConnectionHandler<S> cHandler = new ConnectionHandler<>(this);
        setHandler(cHandler);
        getEndpoint().setHandler(cHandler);
}
………………………
```

现在主流程应该是下面：

`StartInternal->EndPoint子类触发调用processSocket方法(对于NIOEndPoint就是Poller->processKey)->EndPoint父类的processSocket方法->子类EndPoint的createSocketProcessor方法创建SocketProcessorBase(每个子类不同，定义在子类的java文件中)->调用SocketProcessorBase子类的run方法(Executor或者直接调用)-> AbstractProtocol. ConnectionHandler的process(SocketWrapperBase wrapper, SocketEvent status)方法`

ConnectionHandler process(细节待后面分析)方法，下面的代码片段是handler处理的主逻辑

```java
………….
processor = getProtocol().createProcessor();
………..
processor.process(wrapper, status);
……………
```

getProtocol返回当前的protocol，上面是初始化时候的代码片段，会调用protocol的createProcessor方法,再调用proccessor的process方法，十七篇的时候画了uml继承图，对于NioEndPoint，getProtocol返回的应该是Http11NioProtocol，它的createProcessor方法返回的是Http11Processor，那么现在的主要流程是下面：

`StartInternal->EndPoint子类触发调用processSocket方法(对于NIOEndPoint就是Poller->processKey)->EndPoint父类的processSocket方法->子类EndPoint的createSocketProcessor方法创建SocketProcessorBase(每个子类不同，定义在子类的java文件中)->调用SocketProcessorBase子类的run方法(Executor或者直接调用)-> AbstractProtocol. ConnectionHandler的process(SocketWrapperBase wrapper, SocketEvent status)方法->调用Processor(NioEndPoint对应Http11NioProtocol, Http11NioProtocol初始化的时候创建NioEndPoint)的process方法`

protocol UML

processor UML

**4、** processor的process方法，process方法是在父类AbstractProcessorLightimplementsProcessor中，下面是代码片段,下面的主要逻辑后面分析，但可以从代码中看出会调用，会根据状态的不同去调用子类实现的dispatch、service和asyncPostProcess方法，现在的主流程应该是下面：；

`StartInternal->EndPoint子类触发调用processSocket方法(对于NIOEndPoint就是Poller->processKey)->EndPoint父类的processSocket方法->子类EndPoint的createSocketProcessor方法创建SocketProcessorBase(每个子类不同，定义在子类的java文件中)->调用SocketProcessorBase子类的run方法(Executor或者直接调用)-> AbstractProtocol. ConnectionHandler的process(SocketWrapperBase wrapper, SocketEvent status)方法->调用Processor(NioEndPoint对应Http11NioProtocol, Http11NioProtocol初始化的时候创建NioEndPoint)的process方法->processor(NioEndPoint为例就是Http11Processor)子类实现的service等`

```java
public SocketState process(SocketWrapperBase<?> socketWrapper, SocketEvent status)
            throws IOException {
        SocketState state = SocketState.CLOSED;
        Iterator<DispatchType> dispatches = null;
        do {
            if (dispatches != null) {
                DispatchType nextDispatch = dispatches.next();
                state = dispatch(nextDispatch.getSocketStatus());
            } else if (status == SocketEvent.DISCONNECT) {
            } else if (isAsync() || isUpgrade() || state == SocketState.ASYNC_END) {
                state = dispatch(status);
                if (state == SocketState.OPEN) {
                    state = service(socketWrapper);
                }
            } else if (status == SocketEvent.OPEN_WRITE) {
                state = SocketState.LONG;
            } else {
                state = service(socketWrapper);
            }
            if (state != SocketState.CLOSED && isAsync()) {
                state = asyncPostProcess();
            }
            if (getLog().isDebugEnabled()) {
                getLog().debug("Socket: [" + socketWrapper +
                        "], Status in: [" + status +
                        "], State out: [" + state + "]");
            }
……………………..
        } while (state == SocketState.ASYNC_END ||
                dispatches != null && state != SocketState.CLOSED);
        return state;
}
```

**5、** Processor子类(NioEndPoint举例就是Http11Processor)的process方法将调用Adapter的service方法等；

现在的主流程应该是下面：

`StartInternal->EndPoint子类触发调用processSocket方法(对于NIOEndPoint就是Poller->processKey)->EndPoint父类的processSocket方法->子类EndPoint的createSocketProcessor方法创建SocketProcessorBase(每个子类不同，定义在子类的java文件中)->调用SocketProcessorBase子类的run方法(Executor或者直接调用)-> AbstractProtocol. ConnectionHandler的process(SocketWrapperBase wrapper, SocketEvent status)方法->调用Processor(NioEndPoint对应Http11NioProtocol, Http11NioProtocol初始化的时候创建NioEndPoint)的process方法->processor(NioEndPoint为例就是Http11Processor)子类实现的service等àadapter的service方法等->XXXValve`

**6、** 更新的内容和问题；

Request和Response类都是在Processor的处理中创建,Processor子类中的Service方法中的while循环处理状态和AbstractProtocol类中的process方法while循环处理状态这里做个记录,这篇将tomcat的socket在十七篇概括的基础上大概具体的分析了一下,因为复杂性,这篇会随着后面tomcat的具体分析随时更新。

看了StandardXXXValve后的分析，因为代码复杂性的关系，现只做概要性的分析，Valve会跟随容器的层次关系依次调用，最后调用到的是StandardWrapperValve，这里会得到对应的Servlet和Chain处理请求，这里是请求最后的一环，如果是singleThreadModel的servlet，StandardWrapper会有一个servletPool，每个thread都创建一个servlet实例，默认是false的，所以一般写的servlet都要注意并发的处理，对这个只是简单的做个记录。
