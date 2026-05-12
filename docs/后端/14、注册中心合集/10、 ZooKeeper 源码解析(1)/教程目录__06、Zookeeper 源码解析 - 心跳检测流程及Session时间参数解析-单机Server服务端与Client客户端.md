# 06、Zookeeper 源码解析 - 心跳检测流程及Session时间参数解析-单机Server服务端与Client客户端
- 来源：https://ddkk.com/zhuanlan/registered/zookeeper/1/6.html
- 分类：注册中心
- 分组：教程目录
## 一、交互重要组件及流程

### 1.前话

上几篇文章分析过了ZK的单机架构以及大致的新建连接交互流程，本篇便从心跳检测这一方面入手，来看看ZK的Server端和Client端的心跳检测是如何设置的、如何进行简单的计算得出ZK的心跳检测间隔、大致的检测流程如何等问题。

**注：本篇基于ZK版本3.4.8分析的，且需要对ZK的架构以及重要组件组成有一定的基础了解，当然先看完流程再去了解那些架构组件也行，但还是推荐先去了解Server端以及Client端的架构组件，因为本篇不会进行一些基础性的分析。**

### 2.交互流程

对于ZK来说，Client和Server端的交互流程值得学习，无论是对于NIO或者Netty的使用，还是为了解决通信数据传递问题。

本次交互流程只考虑正常连接情况，并且将其流程拆解为三步走，分别为：1、客户端发起连接Server端请求；2、Server端收到并处理响应Client端的连接请求；3、接收到ping的响应更新最后一次心跳检测时间。大致交互流程图如下：

接下来看看三步走的具体详细交互流程图。

#### 2.1 Client端发起连接

三步走中的第一步具体详细流程图如下：

ping的初步发送数据包相比于新建连接来说无疑要简单一点，涉及到发送数据包的情况便离不开SendThread类，因此以SendThread线程类的轮询为流程开始点，图中简单的把流程分为了9个步骤，相比于新建连接的11个步骤少了两个，但大致的处理流程都是类似的。这个图中如果看过了上几篇关于ZK服务和客户端端的重要组件便可以清晰都知道其大致作用，只是图中加入了NIO的一些类而已。接下来具体分析一下在各个步骤中的一些小细节：

- C1：经过初始化后，SendThread便一直在轮询NIO是否有新的事件产生或者本身是否需要主动向Server端发送数据包；
- C2：这个步骤会判断readTimeout属性和发送时间间隔，当超出阈值时将会判断为需要发送一次ping请求；
- C3：当判断需要进行ping请求时，将会使用RequestHeader对象封装成Packet对象并添加到outgoingQueue待发送数组中；
- C4：执行完上个流程后会紧接着判断outgoingQueue是否有需要发送的数据包，如果有则会开启OP_WRITE写操作；
- C5：当C4开启了写操作后，调用了NIO的select()方法将会立马产生OP_WRITE类型的NIO事件；
- C6：当这个步骤产生了写事件后续的流程便可以执行了；
- C7：当确认进入写操作时将会把Packet取出来以便后续流程使用；
- C8：调用C7流程拿出来的Packet对象的createBB()方法，将其序列化并存放到Packet对象中的ByteBuffer缓存对象中；
- C9：使用获取到的SocketChannel对象将ByteBuffer缓存对象中的序列化数据发送至Server端，并随后继续判断outgoingQueue和Packet对象是否还有数据，如果有数据则保持OP_WRITE事件开启，否则关闭OP_WRITE，只进行监听Server端的数据。

对于ping的发送阶段，看源码流程是会经过两次调用doTransport()，当然如果恰好当时有写事件那只会执行一次。

#### 2.2 Server接收处理及响应

三步走中的第二步Server端交互处理流程如下：

从ZK系列的第二篇文章可以知道NIOServerCnxnFactory在ZK启动时也是以一个守护线程对象运行的，会一直通过Selector轮询是否有新的IO事件，如果有则根据IO事件类型进行相应的处理，接下来详细分析下其具体的交互流程：

- S1：守护线程对象将会每隔1s使用Selector轮询是否有新的IO事件；
- S2：此时Server端将会收到来自Client端Socket的IO事件；
- S3：前面收到的IO事件对应的SelectionKey操作类型是OP_READ，将会获取和其绑定的NIOServerCnxn对象；
- S4：这一步会调用NIOServerCnxn对象的doIO()方法，这里面将会根据是否初始化来判断是读取连接请求还是普通的请求，当然在我们这个流程中读取的是普通请求；
- S5：将接收到的ByteBuffer反序列化成RequestHeader请求头对象，并根据请求头的type属性来判断具体的操作类型，当然ping只是普通的请求；
- S6：根据已有对象信息创建Request对象，这个对象代表Client的每次具体请求，请求的内容以及相关的session信息都会在这个类中，并且后续的RequestProcessor系列对象处理最小单元便是Request对象类型，调用下一个流程前会更新一波session的过期时间；
- S7：这个流程的具体执行是在RequestProcessor处理器实现类PrepRequestProcessor中完成的，其也是一系列实现类中的第一个执行类，主要完成的操作便是判断session和当前请求是否是同一个；
- S8：直接调用下一个处理器；
- S9：此时已经调用到了第二个RequestProcessor处理器SyncRequestProcessor中，这个处理器做的事情便是保存请求日志和运行快照，具体的处理细节后续看有机会再仔细分析一波；
- S10：当完成对logDir位置进行日志新增时，将会调用到下一个RequestProcessor处理器FinalRequestProcessor中，在这里面完成最后的处理及响应；
- S11：在这个流程中倒是没什么特别的流程了，只是简单的更新ServerCnxn连接对象和ZK的状态并生成ReplyHeader对象发送ping响应数据，注意，此时的xid=-2，这个判断后续客户端接收到会用到；
- S12：这一步便是将S11生成的ReplyHeader对象序列化并发送ByteBuffer对象的数据到Socket当中，如果这些数据没空间当然ping请求基本上一次性就能发送了完，会将剩余的数据添加到outgoingBuffers数组中并将和当前Socket绑定的SelectionKey设置为OP_WRITE操作；
- S13：在S12添加ByteBuffer对象到outgoingBuffers数组且切换为读NIO操作时，这一步骤将会被触发；
- S14：这一步将会遍历outgoingBuffers中的对象，并将这些对象的剩余未发送的数据通过Socket再次发送出去；
- S15：当这步完成之后便说明Server端的流程已经结束，接下来的流程又留回到了Client端的SendThread线程对象中了。

整个流程和新建流程差不多，只是在RequestProcessor之前和具体的类型操作中逻辑有点差别而已，其它的流程倒是基本一致。

#### 2.3 Client端接收Server端响应

三步走中的最后一步交互流程图如下：

这个流程相对于新建流程来说无疑是简单的非常多，只是使用NIO的select()方法监听NIO事件，并根据事件类型从Socket中读取数据反序列化，最后再根据反序列化的属性进行相应的判断。具体流程分析如下：

- C1：这个步骤可以看成两个同时进行的步骤：C1.1为SendThread线程轮询Selector监听Server端是否有新的响应，C2.2为EventThread监听waitingEvents数组是否有等待事件处理，需要注意的是waitingEvents数组中的元素只会通过SendThread线程收到响应处理后添加进去，因此waitingEvents数组的来源可以看成就是SendThread添加的容易理解一点；
- C2：只针对新建连接而言，这个步骤获取到的IO事件为OP_READ；
- C3：判断IO事件的类型，将会进入doIO()方法读取SocketChannel的数据；
- C4：使用前面读取到的ByteBuffer数据，反序列化成ReplyHeader对象，并根据对象的xid属性进行判断，如果为-2说明是ping，结束流程并在最后更新lastHeard属性。

相比于其它的操作而言，ping操作不算麻烦的，第一步和第二步和普通的请求差不多，只是第三步收到回应后无需做其它的处理，只需要更新最后一次监听时间即可。

## 二、Session时间参数解析

想必如果对ZK研究不深的话看到ZK的各种参数配置都只会止步于哪个参数大致是什么作用，而对于这个参数到底是如何产生作用以及影响的紧密相关性都会忽略。因此在这里结合ZK的几个参数配置来详细分析一下在ZK里面各种重要参数的产生及影响。

### 1.ZK服务器配置

ZK服务器端有关Session过期时间的配置有三个：

**1、** tickTime：Server端每隔多少时间处理一次过期Session，如果minSessionTimeout和maxSessionTimeout没有配置则有公式minSessionTimeout=2*tickTime，maxSessionTimeout=20*tickTime；

**2、** minSessionTimeout：与Client端协商的后Server端最小可接受sessionTimeout时间，如果Client端传过来的sessionTimeout小于这个值，则会被minSessionTimeout代替；

**3、** maxSessionTimeout：与Client端协商的后Server端最大可接受sessionTimeout时间，如果Client端传过来的sessionTimeout大于这个值，则会被maxSessionTimeout代替；

**实例：**

**1、** 假设tickTime=10000(10s)，minSessionTimeout=5000，maxSessionTimeout=20000，那么Client端的sessionTimeout取值区间为：5000<=sessionTimeout<=20000；

**2、** 假设tickTime=10000(10s)，minSessionTimeout和maxSessionTimeout未设置，那么Client端的sessionTimeout取值区间为：10000*2=20000<=sessionTimeout<=20*10000=200000；

**总结：**因此可以得出，如果只配置了tickTime，那么Client端的sessionTimeout生效区间为：2*tickTime <= sessionTimeout <= 20*tickTime；而如果minSessionTimeout和maxSessionTimeout都配置了，那么Client端的sessionTimeout生效区间为：minSessionTimeout <= sessionTimeout <= maxSessionTimeout。如果闲得无聊想直接看看ZK服务器的大致配置，可以用两个区间关系大致了解ZK关于Session时间配置，从而了解到底Client端的SessionTimeout配置取多少可以生效，免得到时候糊里糊涂的想自己配置的sessionTimeout什么没用。

### 2.SessionTracker计算清除失效时间间隔

Client端会计算每隔多久时间进行一次ping请求，Server端也会每隔一个时间段把已经失效的Session清除，接下来举个例子分析一下到底是如何计算的。

在这次计算中，涉及了三个属性：

**1、** tickTime：即ZK服务端配置的属性，每隔多久进行一次清除；

**2、** expirationInterval：其值为tickTime，可以说是在SessionTracker中的tickTime；

**3、** nextExpirationTime：记过计算后的下一次清除过期Session时间点；

**实例：**

假设tickTime=10000(10s)，那么expirationInterval=tickTime=10000，当SessionTracker实现类被创建时将会直接计算nextExpirationTime的值，公式为：(timestamp / expirationInterval + 1) * expirationInterval，即nextExpirationTime=(timestamp / expirationInterval + 1)*expirationInterval，假设当前时间戳timestamp=1611728113721，代入值则可以得到(1611728113721/10000+1)*10000=(161172811+1)*10000=161172812*10000=1611728120000。第一个区间是1611728120000，那么后续区间便是nextExpirationTime+=expirationInterval，值为

1611728130000、1611728140000...依次这样下去。

**总结：**从刚刚的公式可以看出(timestamp / expirationInterval + 1) * expirationInterval只是为了将当前时间戳的基本单位转换为expirationInterval（tickTime），从刚刚的例子便可以清晰的看出来。

### 3.SessionTracker具体的Session清除时间

当每次Client端的请求被Server端处理时，Server端也会根据具体的Client端sessionTimeout更新在Server的session失效时间，接下来便来分析一波。

在这次计算中，涉及了3个属性：

**1、** sessionTimeout：与Server端协商之后的sessionTimeout，即刚刚在ZK服务器配置中介绍过的sessionTimeout取值空间；

**2、** tickTime：这个tickTime非ZK服务器的tickTime，而是在Session实现类中的属性，将其取名为expireTime过期时间可能更为妥当；

**3、** expirationInterval：ZK服务器的失效间隔时间，这个便是ZK服务器所配置的tickTime；

**实例：**

假设ZK服务器的tickTime值为10000，因此expirationInterval=tickTime=10000，并且Client端的sessionTimeout设置为10000，timestamp=1611728113721，因此有公式expireTime=((timestamp + sessionTimeout)/expirationInterval+1)*expirationInterval=(1611728123721/10000 + 1)*10000=(161172812+1)*10000=161172813*10000=1611728130000。

**总结：**这个流程和SessionTracker清除过期Session的公式是一样的，只是timestamp加上了sessionTimeout，但最终的结果依然是转换成了以expirationInterval为基本单位的数值。

### 4.Client端Session相关属性及作用

客户端也有很多属性，虽然关于session过期时间我们只能设置sessionTimeout，但这一个属性便是确定了客户端所有和session时间相关的属性。

在这次的计算中，涉及了6个属性：

**1、** sessionTimeout：新建ZK连接时开发人员自己定义的过期时间；

**2、** negotiatedSessionTimeout：与Server端协商之后Server端返回的sessionTimeout，也就是前面所说的sessionTimeout取值区间公式；

**3、** readTimeout：新建连接后所使用的的属性，代表着和Server端最大可容许交互间隔时间，如果是超过这个时间未收到Server端的响应，则代表Client端的session超时；如果是超过这个时间未向Server端发送数据，则发送ping请求；尚未连接时计算公式为sessionTimeout*2/3，而连接成功后计算公式为negotiatedSessionTimeout*2/3；

**4、** connectTimeout：未连接成功时所使用的的属性，代表着和Server端最大可容许交互时间间隔，如果超过这个时间还未收到Server端的响应，则代表session超时当未连接时的计算公式为sessionTimeout/hostSize；当连接成功后其计算公式是negotiatedSessionTimeout/hostSize(ZK主机数量)；

**5、** to：这个属性代表着Client端在调用selector.select()方法的阻塞时间当连接成功后其计算公式是readTimeout-idleRecv(即now-lastHeard)；当未连接时的计算公式为connectTimeout-idleRecv；

**6、** timeToNextPing：从名字就可以看出来，这个属性代表着下次ping的时间间隔当距离上次发送请求时间间隔大于1000ms时，计算公式为readTimeout/2-idleSend-1000；当距离上次发送请求时间间隔小于等于1000ms时，计算公式为readTimeout/2-idleSend；如果计算后的值小于to，那么to=timeToNextPing；

**实例：**

假设sessionTimemout为10000，返回的negotiatedSessionTimeout也是10000，主机串数量为1，那么readTimeout=negotiatedSessionTimeout * 2/3=6666，negotiatedSessionTimeout /hostSize=10000，假设刚开始idleRecv和idleSend都是0，即都是刚刚监听和发送完成的，那么to=readTimeout=6666，timeToNextPing=readTimeout/2 - idleSend=3333。

**总结：**从上面的实例可以得知，我们最终关注的select()阻塞时间to的取值为readTimeout-idleRecv，即最大值为readTimeout，而下次ping时间timeToNextPing的取值为两种，如果idleSend值大于1000，则为readTimeout/2 - idleSend - 1000，即最大值为readTimeout/2-2000，如果idleSend值小于等于1000，则为readTimeout/2 - idleSend，最大值为readTimeout/2，而readTimout又是等于negotiatedSessionTimeout * 2/3，因此最终的关系就十分明了了。select()最大阻塞时间为negotiatedSessionTimeout*2/3，最大ping间隔时间为negotiatedSessionTimeout/3。

## 三、源码分析

源码分析较长，如果有兴趣可跳至[（七）Zookeeper原理源码分析之心跳检测流程源码分析-单机Server服务端与Client客户端](/zhuanlan/registered/zookeeper/1/7.html)阅读。
