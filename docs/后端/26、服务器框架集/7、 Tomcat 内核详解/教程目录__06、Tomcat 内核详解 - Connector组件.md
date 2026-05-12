# 06、Tomcat 内核详解 - Connector组件
- 来源：https://ddkk.com/zhuanlan/server/tomcat/3/6.html
- 分类：服务器框架
- 分组：教程目录
Connector（连接器）组件是Tomcat最核心的两个组件之一，主要的职责就是负责接收客户端连接和客户端请求的处理加工。每个Connector都将指定一个端口进行监听，分别负责对请求报文的解析和响应报文组装，解析过程生成Request对象，而组装过程涉及Response对象；

如果将Tomcat整体比作一个巨大的城堡，那么Connector组件就是城堡的城门，每个人要进入城门就必须通过城门，它为人们进出城堡提供了通道。同时，一个城堡还可能有两个或者多个城门，每个城门代表了不同的通道；

Connector组件其中包含Protocol组件、Mapper组件和CoyoteAdapter组件；

Protocol组件：协议的抽象，对不同的通信协议进行了封装，比如HTTP协议和AJP协议；

Endpoint是接收端的抽象，由于使用了不同的I/O模式，因此存在很多类型的Endpoint，如BIO模式的JionPoint、NIO模式的NioEndPoint和本地库I/O模式的APREndpoint。

Acceptor是专门用于接收客户端连接的接收器组件；

Executor则是处理客户端请求的连接池，Connector可能使用了Service组件的共享线程池，也可能是Connector自己私有的线程池。

Processor组件是处理客户端请求的处理器，不同的协议和不同的I/O模式都有不同的处理方式，所以存在不同类型的Processor；

Mapper组件可以称为路由器，它提供了对客户端请求URL的映射功能，即可以通过它将请求转发到对应的Host组件、Context组件、Wrapper组件以进行处理并响应客户端，也就是我们说的将某客户端请求发送到某虚拟机上的某个Web应用的某个Servlet。

CoyoteAdapter组件是一个适配器，它负责将Connector组件和Engine容器适配连接起来。把接收到的客户端请求报文解析生成的请求对象Request和响应对象Response传递到Engine容器，交由容器处理；

HTTP Connector所支持的协议版本为HTTP/1.1和HTTP/1.0，无须显式适配HTTP的版本，Connector会自动适配版本。每个Connector实例对应一个端口，在同个service实例内可以配置若干个Connector实例；

AJPConnector组件用于支持AJP协议通信，当我们想将Web应用中包含的静态内容交给Apache处理的时候，Apache与Tomcat之间的通信协议则使用AJP协议；

Connector也在服务器端提供了SSL安全通道的支持，用于客户端以HTTPS方式访问，可以通过配置server.xml的节点SSLEnabled属性开启；

【BIO模式】

对于每个客户端的请求连接都将消耗线程池里面的一条连接，知道整个请求相应完毕。此时，如果有很多请求几乎同时到达Connector，当线程池中的空闲线程用完之后，则会创建新的线程，直到达到线程池最大的线程数。但是如果此时还有更多的请求到达进来，虽然线程池已经处理不过来，但操作系统还是会将客户端接受起来放置到一个队列中，这个队列的大小通过SocketServer设置backlog而来。如果还是有再多的请求过来，队列已经超出了backlog大小，那么连接将会直接被拒绝掉；

【NIO模式】

在该模式下，所有客户端的请求连接先由一个接收线程接收，然后由若干（一般由CPU个数）线程轮询读写事件，最后将具体的读写请求交由线程池处理。可以看到，以这种方式，客户端连接不会在整个请求响应过程占用连接池内的连接，它可以同时处理比BIO模式多得多的客户端连接数，此种模式能够承受更大的并发，机器资源使用效率高很多。另外，APR/native模式也是NIO模式，它直接用本地代码实现NIO模式；

## 1.HTTP阻塞模式协议——HTTP11Protocol

Http11Protocol表示阻塞式的HTTP协议的通信，它包含从套接字接收、处理、响应客户端的整个过程。它主要包含JionPoint组件和Http11Processor组件。

启动的时候，JionPoint组件将启动某个端口的监听，一个请求到来之后将会扔进线程池，线程池进行任务处理，处理过程中将通过Http11Processor组件对HTTP协议解析，并且通过适配器Adapter匹配到指定的容器进行处理以及响应客户端。当然，整个过程相对比较复杂，涉及到很多的组件。

## 1.1套接字接收终端——JioEndPoint

**1、** 连接数控制器——LimitLatch；

Tomcat的流量控制器是通过AQS并发框架来实现的，通过AQS实现起来，更具有灵活性和定制性。

**2、** Socket接收器——Acceptor；

Acceptor主要职责就是监听是否有客户端套接字连接并接收套接字，再将套接字交由任务处理器（Executor）执行；

**3、** 套接字工厂——ServerSocketFactory；

接收器Acceptor在接收连接的过程中，根据不同的使用场合可能需要不同的安全级别，反映到应用层就是使用HTTP和HTTPS的问题；

SSL/TLS协议为通信层提供以下的服务：

**1、** 提供验证服务：验证会话内实体身份的合法性；

**2、** 提供加密服务：强加密机制能够保证通信过程中的消息不会被破译；

**3、** 提供防窜改服务：利用Hash算法对消息进行签名，通过验证签名保证通信内容不被篡改；

实际上，我们通过对server.xml进行配置就可以定义某个端口开放并指出是否使用安全通道；

**1、** 任务执行器——Executor；

Tomcat中用于客户端请求的线程池——Executor

它是一个拥有最大最小线程数限制的线程池。之所以称为任务执行器，是因为可以认为线程池启动了若干线程不断地检测某个任务队列，一旦发现需要有执行的任务则执行。

每个线程都不断循环检测任务队列，线程数量不会少于最小线程数也不能大于最大线程数；

任务执行器的实现使用JUC工具包的ThreadPoolExecutor类，它提供了线程池的多种机制，例如：有最大最小线程数限制、多余线程回收时间、超出最大线程数的时候线程池做出的拒绝动作等基本可以满足Tomcat的个性化需求；

Connector组件的Executor分为两种类型：

共享Executor和私有的Executor；

【共享Executor是指直接使用Service组件的线程池】

多个Connector可以共用这些线程池，在service组件下配置一个Executor，然后在节点中指定tomcatThreadPool作为任务执行器，对于多个Connector，可以同时指向同一个Executor，已达到共享的目的；

【私有Executor是指未使用共享线程池】

可以配置maxThreads指定最大线程数量，配置minSpareThreads指定最小线程池数量；

**1、** 任务定义器——SocketProcessor；

将套接字放进线程池之前需要定义好任务，而需要进行哪些逻辑处理则由SocketProcessor定义，根据线程池的定义，作为任务必须扩展Runnable接口；

SocketProcessor任务：

处理套接字并响应客户端；

连接数减1；

关闭套接字；

## 1.2HTTP阻塞处理器——Http11Processor

**Http11Processor****组价提供了对HTTP****协议通信的处理，包括对套接字的读写和过滤，对HTTP****协议的解析以及封装成请求对象，HTTP****协议响应对象的生成等操作。**

**1、** 套接字输入缓冲装置——InternalInputBuffer；

**2、** 消息字节——MessageBytes；

**3、** 需要注意的是：Tomcat实际运行中并不会在将请求行、请求头部等参数解析之后直接转换为String类型设置到request中，而继续使用ASCII码存放这些值，因为对这些ASCII码转码对导致性能问题其中的思想就是只有到需要的时候才进行转码，很多参数没有使用到就不进行转码，以此提高处理性能；

MessageBytes就是为了解决这个问题实现的类；

**1、** 字节块——ByteChunk；

是一个很重要的字节数组处理缓冲工具，它封装了字节缓冲器以及对字节缓存区的操作，包括对缓冲区的写入、读取、扩展缓冲区大小等。另外，它还提供了相应字符编码的转码操作，使缓冲操作变得更加方便。除了缓冲区之外，它还有两个通道——ByteInputChannel和ByteOutputChannel，一个用于读取数据，一个用于输出数据，并且会自动判断缓冲区是否超出规定缓冲大小，一旦超出，则把缓冲区数据全部输出；

**1、** 套接字输入流-InputStream；

**2、** 请求体读取器——InputStreamInputBuffer；

**3、** 输入过滤器——InputFilter；

过滤器是一种设计模式，在Java各种框架以及容器中都频繁的使用以实现更好的扩展性和逻辑解耦。

Tomcat主要包括4个过滤器：

**1、** IdentityInputFilter；

**2、** VoidInputFilter；

**3、** BufferedInputFilter；

**4、** ChunkedInputFilter；

**5、** 套接字输出缓冲装置——InternalOutputBuffer；

套接字输出缓冲装置就是向客户端提供响应输出的组件，它与套接字输入缓冲装置具有类似的结构，包含OutputStream、OutputStreamOutputBuffer、OutputFilter和ByteChunk等元素；

**1、** 请求——Request；

为了方便处理，同时根据面向对象的思想，将每个请求的相关属性

**2、** 请求头部——MimeHeaders；

HTTP请求的头部被封装成为MimeHeaders对象；

**3、** 小文本——Cookie；

HTTP协议的无状态性导致在会话的场景中需要借助于其他的机制来弥补。

HTTP头部的Cookie正是客户端和服务器会话机制的基础。

Cookie将信息存储在客户端，每次通信都要将这些信息附带在报文里面，这会导致带宽的浪费，敏感数据有安全隐患、对复杂结构力不从心等问题；

针对这些问题，提出一种解决方案——服务器会话（Session），它将数据存在服务器中，无须客户端携带，数据安全更加可控并且数据结构可以任意复杂。

浏览器将Cookie发送到Tomcat服务器之后，Tomcat需要将这些信息封装成为Cookie对象。

**1、** Request的门面模式；

Request使用了门面模式，门面模式的使用主要是出于数据安全的考虑。对敏感的数据进行组装，通过此门面完成数据的访问。对于敏感数据不提供任何访问通道；

**2、** 响应——Response；

**3、** Response的门面模式；

**客户端从请求到响应的处理过程会存在一个响应对象与请求对象相对应，它包含了HTTP****协议响应相关的参数，例如响应状态码、内容类型、内容长度、响应编码以及响应头部等。**

与Request类似，Response也使用了门面模式实现敏感数据的隔离。ServletResponse以及其子类HttpServletResponse都属于Servlet规范定义的标准接口，用于暴露给Web开发者调用。ResponseFacade是一个门面类，它实现所有的HttpServletResponse标准接口并使用连接器的Response具体实现；（coyote）Response是最底层的响应对象；

**1、** 响应钩子——ActionHook；

钩子是消息处理的一个重要机制，专门用于监控指定的某些事件消息。它的核心思想就是在整个复杂的处理流程中的所有关键点都触发相应的事件消息，假如添加了钩子则会调用钩子函数，函数中可以根据传递过来的事件消息判断执行不同的逻辑，它就好像透明的让程序挂上额外的处理；

【钩子机制】

按照钩子思想，最后实现的效果相当于是在一个适当的位置嵌入自定义代码，此机制保障了系统内部不被外界修改同时又可以预留足够的扩展空间；

**1、** Response的缓冲；

Tomcat并没有将所有响应体保存在内存中，而是选择使用缓冲机制，如果没有缓冲，则当响应体很大的时候将大量消耗内存。

【5】长连接

对于TCP/IP协议来讲，每次创建连接都会涉及到3次握手的过程，而HTTP协议基于TCP/IP协议，所以HTTP协议也会涉及到3次握手的过程。

HTTP1.0默认的都是短连接，每个HTTP请求都需要3次握手过程才可以创建连接，请求完之后又通过4次挥手以结束连接，这种通信信道的使用效率是非常低的；

为了提高HTTP的信道使用效率，HTTP1.1默认使用长连接，而如果是HTTP1.0协议，则通过在HTTP协议头部添加**Connection****：Keep-Alive****来实现长连接**；如果不想使用长连接，需要在头部显示声明**Connection:Close**

**长连接方式下，连接经过3****次握手可以进行N****次的HTTP****请求响应，然后才通过4****次挥手关闭连接；**

【Tomcat实现长连接的方式】

客户端连接被Acceptor接来之后创建了一个SocketProcessor任务，然后放到线程池中，刚刚定义的SocketProcessor任务就包含了N次请求响应周期的循环处理。循环步骤为首先读取客户端请求HTTP报文、解析报文、处理逻辑、响应客户端，然后结束一个请求响应周期。

接着又有一个这样的循环，**直到出现某些情况下才可能会关闭连接，比如超时或者发生异常；**

## 2.HTTP非阻塞模式协议——HTTP11NioProtocol

HTTP11NioProtocol表示非阻塞模式的HTTP协议的通信，它包含从套接字连接接收，处理请求，响应客户端的整个过程。它主要包含NioEndPoint和Http11NioProcessor组件

## 2.1套接字接收终端——NioEndPoint

NioEndPoint组件是非阻塞I/O终端的一个抽象，NIOEndPoint组件包含了很多子组件，其中包括：

- LimitLatch（连接数控制器）：负责对连接数控制

不论是BIO还是NIO模式，如果不对客户端的连接数进行限制可能会导致服务器崩溃，它是基于AQS并发框架实现的；

NIO比BIO模式的好处就是：BIO的连接数与线程数比例为1:1，JVM线程数过多会导致线程之间切换的成本很高，默认情况下，Tomcat处理连接池的线程数为200，所以BIO流量控制阀门大小也为200，但是NIO可以克服BIO模式的不足，它能够基于事件同时维护大量的连接，对于事件的遍历只需要交给同一个或者少量的线程，再把具体的事件执行逻辑交给线程池。例如，Tomcat把套接字接收工作交给一个线程，而把套接字读写以及处理交给N个线程，N一般为CPU的核数。对于NIO模式，Tomcat默认把流量阀门大小设置为10000，可以通过server.xml的节点的mxConnections属性修改，同时需要注意，连接数到达最大值之后，操作系统仍然会接收客户端的连接，知道操作系统接收队列被塞满，对类默认长度为100，可以通过节点的acceptCount属性配置

- Acceptor（套接字接收器）：负责接收套接字连接并注册到通道队列中；

SocketChannel接收器

- Poller（轮询器）：负责轮询检查事件列表；

NIO模型需要同时对很多连接进行管理，管理的方式则是不断的遍历事件列表，对相应连接的相应事件作出处理，而遍历的工作正是交给Poller负责。在Java的层面上看，它不断的轮询事件列表，一旦发现相应的事件则封装成任务定义器SocketProcessor，进而扔进线程池中执行任务。

- Poller池：包含了若干Poller组件；
- SocketProcessor（任务定义器）
- Executor：负责处理套接字的线程池；

## 2.2 HTTP阻塞处理器——Http11NioProcessor

Http11NioProcessor组件提供了对HTTP协议非阻塞模式的处理，包括对套接字的读写和过滤，对HTTP协议的解析与封装成请求对象，HTTP协议响应对象的生成等操作。

### 1.非阻塞套接字输入缓冲装置——InternalNioInputBuffer

它与阻塞套接字输入缓冲装置之间的区别就在于读取套接字数据时候的方式，阻塞方式会一直阻塞，直到数据返回，而非阻塞的方式则是尝试读取，有没有数据都返回

### 2.非阻塞套接字输出缓冲装置——InternalNioOutputBuffer

## 3. HTTP APR模式协议——Http11AprProtocol

Http112AprProtocol表示使用APR模式的HTTP协议的通信，它包含从套接字连接接收、处理请求、响应客户端的整个过程。APR模式主要是指由Native库完成套接字的各种操作，APR库提供了sendfile、epoll和OpenSSL等I/O高级操作，Linux和Windows操作系统都有各自的实现库。Tomcat通过JNI方式调用这些Native库。

Http112AprProtocol组件主要包括APREndpoint组件和Http11AprProcessor组件。

### 3.1 APR接收终端——AprEndPoint

### 3.2 HTTP APR处理器——Http11AprProcessor

## 4.AJP Connector

一般会将静态资源交由Apache Server处理，而把动态资源交给Tomcat处理，以提升Web处理的整体性能。AJP Connector组件即提供了与Apache Server通信的支持。

当客户端请求静态资源，这时候将由Apache Server直接将静态资源输出给客户端。而第二种情况是客户端请求动态资源，此时Apache Server并没有匹配上静态资源，而是将请求封装成AJP协议发送到后端的Tomcat中，Tomcat的AJP Connector专门负责接收AJP协议报文并处理，然后使用AJP协议返回报文给Apache Server，最后返回给客户端。

AJPConnector是Tomcat除了HTTP Connector之外的另一类Connector，用于与Apache Server之间的AJP通信。同样，对于不同的I/O模式也有不同的处理，BIO、NIO、APR三种I/O模式分别对应AJPProtocol、AjpNioProtocol和AjpAprProtocol。

【AJP协议简介】

AJP协议是Web服务器和Web容器之间通信的一种协议：全称为Apache Jserv Protocol。

AJP是一种面向数据包的协议，并且使用二进制格式取代文本格式这样有助于提高性能。

AJP协议建立在TCP连接之上，一般Web容器会维护一个到Tomcat的套接字连接池，长连接的使用大大减少了创建套接字的次数，重复利用了连接池的连接，每个连接通道只能同时由一个请求使用，某连接一旦被占用则必须要等到该连接空闲出来之后才能继续使用；

### 4.1 AJP 阻塞模式协议——AjpProtocol

AjpProtocol表示阻塞式的AJP协议的通信

AjpNioProtocol表示非阻塞模式AJP协议的通信

### 4.2 AJP APR模式协议——AjpAprProtocol

## 5. HTTP三种模式的Connector

## 6.AJP三种模式的Connector

BIO、NIO、APR
