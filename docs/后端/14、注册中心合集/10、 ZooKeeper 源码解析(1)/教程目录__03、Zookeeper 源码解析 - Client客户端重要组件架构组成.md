# 03、Zookeeper 源码解析 - Client客户端重要组件架构组成
- 来源：https://ddkk.com/zhuanlan/registered/zookeeper/1/3.html
- 分类：注册中心
- 分组：教程目录
## 一、Client客户端架构组件

### 1.前话

第二篇介绍了Server服务端的重要组件架构以及启动流程，感兴趣的可以跳至[（二）Zookeeper原理源码分析之单机Server服务端组件架构启动流程分析](/zhuanlan/registered/zookeeper/1/2.html)观看。

这一篇要介绍的是ZK的Client客户端重要架构组件，这个部分是我们平时开发连接ZK用的最多的，不管是使用ZK原生API还是使用Curator封装的ZK操作等都避不开这个部分。

在分析Client端前抱着如下疑问：ZK的客户端在连接时、发送数据以及通知回调时具体是由哪些重要的类通过何种方式完成的？在进行不同操作时ZK的原生API到底做了一些什么？ZK的客户端又是通过哪些组件来管理Wacther的？本篇将从这几个角度切入，且以Java编程式使用流程来分析。

而对于ZK客户端和服务端之间的具体如创建的具体流程和实现不同操作时的交互留在下篇再详细分析。

**注：本篇基于ZK版本3.4.8分析的，且归为基本组件都是个人认为在ZK的执行流程中完成主要功能必不可少的组件。**

### 2.基本组件

其Client端基本重要组件如下：

从图中可以看出主要有五个基本组件，包括程序API操作类ZooKeeper和其它四个子组件，接下来大致介绍一下其主要的功能职责：

**1、** ZooKeeper：客户端连接服务端的API操作类，包括连接、创建节点、删除节点及获取数据等操作都是由这个类发起的，提供的都是ZK的原生接口功能；

**2、** WatchRegistration：从名字也可以看出来，这个组件是负责注册客户端定义的Watcher到ZK的，但实际上Watcher的注册并不是在Server端完成的，而是在Client端通过Packet组件调用这个类完成本地的注册；

**3、** ClientCnxn：服务端有ServerCnxn，那么客户端自然就又ClientCnxn，每个对象代表服务端的一个连接这个对象将负责把Packet包发送至服务端，并接受处理服务端的响应及触发的监听事件，实际和服务端的通信都是通过这个组件完成的；

**4、** Packet：字面意思，就是ZK中客户端和服务端交互的包对象，这里面包含了请求头、响应头、请求、相应及其它的一些对象，在ClientCnxn中，交互的数据元便是Packet类，在Client端是数据的载体；

**5、** ZKWatcherManager：客户端的Watcher管理器，客户端所有注册的Watcher都会在这个组件中，并且Watcher的注册是通过前面提到过的WatchRegistration类完成的，连接ZK时默认的Watcher监听器也是由这个类管理的；

接下来具体介绍下在Client端连接及交互时的重要组件。

#### 2.1 ClientCnxn及内部类

其UML类图如下：

以上这几个类除了ClientCnxnSocketNIO是继承自ClientCnxnSocket，其它的几个类都没有继承关系，但从UML图可以看出来其大致关系，接下来详细介绍一波：

**1、** ClientCnxn：从图中可以看出基本上所有的类都和其有关联，SendThread、EventThread还有WatcherSetEventPair三个都是其内部类，并且SendThread和EventThread是通过ClientCnxn创建调用的这个类的具体作用这里便不再阐述；

**2、** SendThread：这个类是一个线程对象，在Client端运行时这个类也会一直运行直到Client关闭连接，其负责发送消息和接收Server端的回调通知，运行期间会一直监听NIO的通信以及监听一个Packet数组，当有可发送包时将会读取Packet数组解析包并发送，这个类和EventThread类一起合作完成了ZK客户端的通信和回调；

**3、** EventThread：同样是线程对象，这个类负责处理Client端的各类事件，运行期间会一直监听waitingEvents阻塞队列，当有事件被放到这个类中后将会被拿出来进行事件回调需要注意的是Client端的Watcher并没有被发送到Server端，只是通知了Server端哪个路径被监听了，当触发监听事件时将会通知Client端可以执行本地的Watcher了；

**4、** WatcherSetEventPair：顾名思义，这个类的作用便是Watcher的Set集合和对应的Event事件组成的类，执行事件时如果判断是这种类型，将会依次调用这个类中的Watcher集合（也就是Client端本地被使用的Watcher）的process回调方法，另一种回调是实现AsyncCallback接口的，但是很少见到使用，因此暂不分析；

**5、** ClientCnxnSocket：ClientCnxn连接Server端的套接字，ClientCnxnSocketNIO实现类是我们平时使用过最多的，这些实现类负责使用对应的IO框架来连接Server端，最常见的有NIO和Netty两种方法（换个角度来说都是使用的NIO），其内部的逻辑和平时使用对应的IO框架没有区别；

#### 2.2 信息载体类Packet

其组成UML类图如下：

其UML图结构很简单，由于Packet是一个数据包对象，因此其内部必然就会包含很多其它的对象，诸如请求头、响应头、请求及响应等这些东西，接下来简单的介绍下其内部的一些对象：

**1、** RequestHeader：请求头，实现了Record接口，提供了相应的序列化和反序列化方法，其内部只有xid操作id和type按操作类型（），所有的请求都有请求头（如果没有请求头ZK的Server不知道要执行什么操作），其内部的参数意义如下；

**1、** xid：可以看成是计数器，从1开始依次+1，同一次请求的RequestHeader和ReplyHeader都是一样的，可以用来判断Packet对象是否发送正常；

**2、** type：ZK的很多操作都是通过这个字段表示的，具体有哪些值可以看到ZooDefs.OpCode中的对象，ZK的所有操作类型都在这里面；

**2、** ReplyHeader：响应头，实现了Record接口，有固定的序列化和反序列化方法，所有正常接收的响应都有响应头，这里面包含了和RequestHeader一样的xid、xid当前的事务id和err错误码，其内部参数意义如下：；

**1、** xid：和RequestHeader一样，相当于当前客户端的计数器，可用来判断请求头和响应头是否是同一次请求的；

**2、** zxid：响应当前这次操作的事务ID；

**3、** err：Server端返回的错误码，对应KeeperException.Code里面的各种enum错误；

**3、** Record：在Packet中，Record实际上有四种类型，RequestHeader和ReplyHeader单独拿出来分析了因为这两个是固定的，另外两个便是response响应体和request请求体，不同的操作请求体和响应体都不是样的，并且也不是所有的操作都有请求体和响应体的，需要在具体的操作下才能分析这两个成员变量，因此这里单独拎出来说一下；

**4、** bb：看到这个是不是有点懵逼？实际上这是NIO的ByteBuffer类型对象，ZK在发送Client的报文时用的最多的类型便是HeapByteBuffer，并且这个对象将会保存请求头和请求体序列化之后的数据，在发送时将会把里面数据写到Socket中进行通信；

#### 2.3 Watcher之监听组件

其组成UML类图如下：

Client端的监听器这一块组件不是很多，基本上就三个及包括的几个监听事件，接下来稍微分析下这几个组件：

**1、** Watcher：ZK的Client端在实现监听功能的基本单位，所有的监听动作都是从Watcher的实现类进入的，并且Client端管理监听也是以该类为基本这个类有两个内部枚举类为不同的监听事件，稍微介绍下几个值的意义：；

**1、** KeeperState：代表ZK客户端状态的枚举类，目前官方推荐使用的属性有六种：；

1. Disconnected：代表ZK客户端已经断开连接状态，当发生了异常或者关闭ZK客户端就会触发；
2. SyncConnected：代表异步连接成功事件，此时Server端已经生成了Session信息，并返回确认消息触发这个事件；
3. AuthFailed：在Server端认证失败后将会触发这个事件；
4. ConnectedReadOnly：连接成功但是只能读取ZK服务端的内容，而不能进行增删改操作；
5. SaslAuthenticated：在Server端的认证已经成功完成将会触发；
6. Expired：客户端的Session在服务端已经过期将会触发的事件，可能是连接超时、可能是太久没有进行ping通信也有可能是sessionTimeout事件配置不合理。

**2、** EventType：对于客户端来说可处理的几种事件类型，一共有五种，一起和KeeperState枚举类搭配组成了ZK的监听回调事件区分：；

1. None：这个事件类型是由Client端来设置的，一般都是被用在连接ZK的Server端，当处于这个事件时，代表事件类型是由Client端发布的，其它的事件都是由Server端发布的，且Server端发布其它类型的EventType事件时，KeeperState状态必为SyncConnected；
2. NodeCreated：代表监听的路径在Server端有节点被创建；
3. NodeDeleted：代表监听的路径在Server端有节点被删除；
4. NodeDataChanged：代表Server端监听路径的节点中节点数据被修改了；
5. NodeChildrenChanged：代表在Server端监听路径的子节点发生了修改，包括增删改三种操作。

**2、** ZKwatcchManager：ZooKeeper类的内部类，负责管理不同类型的Watcher以及ZooKeeper的默认Watcher，在这个类中Watcher被分成了四种：；

**1、** defaultWatcher：ZK客户端连接的默认监听器，一般是用来处理KeeperState枚举类中的触发事件，如连接成功、连接超时或者认证失败这些；

**2、** dataWatches：用来处理和数据相关的事件，除了NodeChildrenChanged事件类型以外的四种事件类型都会触发，当使用getData()操作时将会添加此类型监听器；

**3、** existWatches：处理事件类型同dataWatches，使用exists()操作时将会添加此类型；

**4、** childWatches：处理None、NodeChildrenChanged和NodeDeleted三种事件类型，当使用getChildren()操作时将会添加此类型监听器；

**3、** WatchRegistration：从名字就可以看出来这个类的作用就是注册Watcher到ZKWatchManager中，这个抽象类有三个实现类，分别对应ZKwatcchManager中的几种Watcher类型三个实现子类也简单的说下：；

**1、** DataWatchRegistration：用来注册Watcher到ZKwatcchManager中dataWatches集合的具体实现类；

**2、** ExistsWatchRegistration：用来注册Watcher到ZKwatcchManager中existWatches集合的具体实现类；

**3、** ChildWatchRegistration：用来注册Watcher到ZKwatcchManager中childWatches集合的具体实现类；

### 3.主要组件交互

上面介绍了主要组件以及大致功能，接下来大致介绍一下在Client端这些组件的交互关系，交互关系图如下：

这个这个主要交互图乍一看比较复杂，但实际上可以分为三个部分：发送消息、接收消息处理响应事件及轮询事件数组调用相应监听器。接下来再大致分析一下这三个部分的一些具体细节交互：

**1、** 发送消息：这个部分的交互的核心便是ClientCnxn、ClientCnxnSocket、SendThread以及消息载体Packet了，接下来分别聊下其交互：；

**1、** ClientCnxn负责对接ZooKeeperAPI类，所有客户端的操作都需要从ZooKeeper类到ClientCnxn，然后在ClientCnxn中调用各个组件进行处理；

**2、** 除了建立连接是由ClientCnxn直接使用SendThread发送请求连接消息之外，其它的操作都是先拼装对应的Packet消息载体，随后由ClientCnxn保存到包数组中；

**3、** 当ClientCnxn发起相应的操作时，SendThread线程一直轮询将会获取到请求的数据，随后调用ClientCnxnSocket序列化Packet并发送到ZK的Server端；

**2、** 接收消息处理响应事件：这个部分的交互核心便是SendThread、WatchRegistration以及监听器和相应事件的载体WatcherSetEventPair，接下来分别聊下其交互：；

**1、** 当ZK的Server端收到Client的请求后，并且Server处理完请求之后将会发送一个响应给对应监听的Client，而Client接收响应的类便是SendThread（是的，这个线程类负责接收和发送消息，承担着IO多路复用的作用），当接收到响应后，将会根据操作类型判断是通过Watcher监听器还是AsyncCallback异步回调处理响应事件；

**2、** 如果确认时Watcher来处理，将会使用WatchRegistration来注册对应的Watcher监听器，并生成对应的WatcherSetEventPair对象，把对应的事件和Watcher进行绑定放到事件数组中，以便后续EventThread获取使用；而如果确认时AsyncCallback来处理，将会直接把Packet放到事件数组中（因为AsyncCallback在对应的Packet中），以便后续直接使用；

**3、** 轮询事件数组调用相应监听器：这个部分在一次操作流程中属于结尾部分，将会使用前面保存的轮询事件来判断进行相应的调用，这部分交互核心为EventThread、Watcher、AsyncCallback以及WatcherSetEventPair，接下来分别聊下其交互：；

**1、** EventThread会一直轮询waitingEvents阻塞数组，当前面的SendThread收到响应后将会把对应的响应事件放到这里面，而EventThread便可以通过轮询的方式获取到前面获取的响应事件；

**2、** 当获取到响应事件后，会有两种处理，第一种是WatcherSetEventPair，这种响应一般对应普通的Watcher实现类监听器，如果判断是这种的类型时，将会从WatcherSetEventPair中获取对应的Watcher，并把响应的事件类型传进去；

**3、** 而如果是AsyncCallback类型，则会直接根据操作类型判断进行转换并调用具体实现类的processResult方法；

本篇只是稍微分析一下Client客户端的重要组件以及简单的交互，后续将会从源码分析Client端及Server端的详细交互和具体参数配置原理，敬请期待。
