# 11、Netty学习 - Reactor 模型
- 来源：https://ddkk.com/zhuanlan/server/netty/5/11.html
- 分类：服务器框架
- 分组：教程目录
说到NIO、Netty，Reactor模型一定是绕不开的，因为这种模式架构太经典了，接下来我们就静下心来好好看看Netty的基石——Reactor模型。

本文就带着大家看看 Reactor 模型，让大家对 Reactor 模型有个浅显而又感性的认识。

## 传统服务的设计模型

这是最为传统的Socket服务设计，有多个客户端连接服务端，服务端会开启很多线程，一个线程为一个客户端服务。

在绝大多数场景下，处理一个网络请求有如下几个步骤：

**1、**`read`：从socket读取数据；

**2、**`decode`：解码，网络上的数据都是以byte的形式进行传输的，要想获取真正的请求，必定需要解码；

**3、**`compute`：计算，也就是业务处理，你想干啥就干啥；

**4、**`encode`：编码，同理，因为网络上的数据都是以byte的形式进行传输的，也就是socket只接收byte，所以必定需要编码；

关于这种模型的缺陷，可以阅读之前文章：深入分析 Java IO （二）BIO

## NIO 分发模型

NIO就很好的解决了传统Socket问题：

**1、** 一个线程可以监听多个Socket，不再是一夫当关，万夫莫开；

**2、** 基于事件驱动：等发生了各种事件，系统可以通知我，我再去处理；

具体细节这里不做过多赘述，可以阅读之前文章：深入分析 Java IO （三）NIO

## Reactor 模型

Reactor 也可以称作**反应器模型**，它有以下几个特点：

- Reactor 模型中会通过分配适当的处理器来响应 I/O 事件。
- 每个处理器执行非阻塞的操作。
- 通过将处理器绑定到事件进行管理。

Reactor 模型整合了分发模型和事件驱动这两大优势，特别适合处理海量的 I/O 事件及高并发的场景。

### 1、Reactor 处理请求的流程

Reactor 处理请求的流程主要分为读取和写入两种操作。

对于读取操作而言，流程如下：

- 应用程序注册读就绪事件和相关联的事件处理器。
- 事件分发器等待事件的发生。
- 当发生读就绪事件时，事件分离器调用第一步注册的事件处理器。

写入操作类似于读取操作，只不过第一步注册的是写就绪事件。

### 2、Reactor 三种角色

Reactor 模型中定义了 3 种角色。

- Reactor ：负责监听和分配事件，将 I/O 事件分派给对应的 Handler。新的事件包含连接建立就绪、读就绪、写就绪等。
- Acceptor：处理客户端新连接，并分派请求到处理器链中。
- Handler：将自身与事件绑定，执行非阻塞读/写任务，完成 channel 的读入，完成处理业务逻辑后，负责将结果写出 Channel。可用资源池来管理。

根据不同的应用场景，Reactor 模型又可以细分为：单Reactor 单线程模型、单Reactor 多线程模型及主从Reactor 多线程模型。

## 单Reactor 单线程模型

下图展示的就是单线程下的 Reactor 设计模型。Reactor 线程负责多路分离套接字，Accept 负责接收新连接，并分派请求到 Handler。

### 1、消息处理流程

单Reactor 单线程模型的消息处理流程如下：

- Reactor 对象通过 select 监控连接事件，收到事件后通过 dispatch 进行转发。
- 如果是连接建立的事件，则由 Acceptor 接收连接，并创建 Handler 处理后续的事件。
- 如果不是建立连接事件，则 Reactor 会分发调用 Handler 来响应。
- Handler 会完成 read、decode、compute、encode、send等一整套流程。

### 2、缺点

**单Reactor 单线程模型**只是在代码上进行了组件的区分，但是整体操作还是单线程，**不能充分利用硬件资源**。Handler 业务处理部分没有异步。

对于一些小容量应用场景，可以使用单Reactor 单线程模型。但是对于高负载、高并发的应用场景却不合适。主要原因如下：

- 即便 Reactor 线程的 CPU 负荷达到 100%，也无法满足海量消息的 read、decode、compute、encode和send。
- 单 Reactor 线程负载过重后，处理速度将变慢，这会导致大量客户端连接超时，超时之后往往会进行重发，这更加重了 Reactor 线程的负荷，最终会导致大量消息积压和处理超时，成为系统的性能瓶颈。
- 一旦 Reactor 线程意外中断或者进入死循环，会导致整个系统通信模块不可用，不能接收和处理外部消息，造成节点故障。

> 为了解决上述的问题，单Reactor 多线程模型便出现了。

## 单Reactor 多线程模型

下图展示的就是单 Reactor 多线程的设计模型。该模型在事件处理器（Handler）部分采用了多线程（线程池）。

### 1、消息处理流程

单Reactor 多线程模型的消息处理流程如下：

- Reactor 对象通过 select 监控客户端请求事件，收到事件后通过 dispatch 进行分发。
- 如果是建立连接请求事件，则由 Acceptor 通过 accept 处理连接请求，然后创建一个 Handler 对象处理连接完成后续的各种事件。
- 如果不是建立连接事件，则 Reactor 会分发调用 Handler 来响应。
- Handler 只负责响应事件，不做具体业务处理，通过 read 读取数据后，会分发给后面的 Worker 线程池进行业务处理。
- Worker 线程池会分配独立的线程完成真正的业务处理，将响应的结果发送给 Handler 进行处理。
- Handler 收到响应结果后会通过 send 将响应结果返回给 Client。

相对于第一种模型来说，该业务逻辑是交由线程池来处理的，Handler 收到响应后通过 send 将响应结果返回给客户端。这样可以降低 Reactor 的性能开销，从而更专注地做事件分发工作，提升了整个应用的吞吐性能。

### 2、缺点

单Reactor 多线程模型存在以下问题。

- 多线程数据共享和访问比较复杂。如果子线程完成业务处理后，把结果传递给主线程 Reactor 进行发送，就会涉及共享数据的互斥和保护机制。
- Reactor 承担所有事件的监听和响应，只在主线程中运行，可能会存在性能问题。例如，并发百万客户端连接，或者服务端需要对客户端握手进行安全认证，但是认证本身非常损耗性能。

> 为了解决上述的性能问题，产生了第三种 主从 Reactor 多线程模型。

## 主从Reactor 多线程模型

相较于单Reactor 多线程模型，主从Reactor 多线程模型是将 Reactor 分成两部分。

- mainReactor（主 Reactor）负责监听 Server Socket，用来**处理网络 I/O 连接事件操作**，将建立的 SocketChannel 指定注册给 SubReactor。
- SubReactor（从 Reactor）主要和建立连接起来的 socket 做数据交互和事件业务处理操作。通常，**SubReactor 个数可与 CPU 个数等同**。

**Nginx、Swoole、Memcached和 Netty 都采用了这种实现。**

主从Reactor 多线程模型的消息处理流程如下：

- 从主线程池随机选择一个 Reactor 线程作为 Acceptor 线程，用于绑定监听端口，接收客户端连接。
- Acceptor 线程接收客户端连接请求之后创建新的 SocketChannel ，将其注册到主线程池的其他 Reactor 线程上，由其负责**接入认证、IP黑白名单过滤、握手**等操作。
- 上述步骤完成之后，业务层的链路正式建立，将 SocketChannel 从主线程池的 Reactor 线程的多路复用器上摘除，重新注册到子线程池的线程上，并创建一个 Handler 用于处理各种连接事件。
- 当有新的事件发生时，SubReactor 会调用连接对应的 Handler 进行响应。
- Handler 通过 Read 读取数据后，会分发给后面的 Worker 线程池进行业务处理。
- Worker 线程池会分配独立的线程完成真正的业务处理，将响应的结果发送给 Handler 进行处理。
- Handler 收到响应结果后会通过 send 将响应结果返回给 Client。

## 主从Reactor 多线程模型示例

### 1、Reactor

```java
public class Reactor implements Runnable {
	private final Selector selector;
	private final ServerSocketChannel serverSocketChannel;
	public Reactor(int port) throws IOException {
		selector = Selector.open(); // 打开一个Selector
		serverSocketChannel = ServerSocketChannel.open(); // 建立一个Server端通道
		serverSocketChannel.socket().bind(new InetSocketAddress(port)); // 绑定服务端口
		serverSocketChannel.configureBlocking(false); // selector模式下，所有通道必须是非阻塞的
		// Reactor是入口，最初给一个channel注册上去的事件都是accept
		SelectionKey sk = serverSocketChannel.register(selector, SelectionKey.OP_ACCEPT);
		// 绑定Acceptor处理类
		sk.attach(new Acceptor(serverSocketChannel));
	}
	@Override
	public void run() {
		try {
			while (!Thread.interrupted()) {
				int count = selector.select(); // 就绪事件到达之前，阻塞
				if (count == 0) {
					continue;
				}
				Set<SelectionKey> selected = selector.selectedKeys(); // 拿到本次select获取的就绪事件
				Iterator<SelectionKey> it = selected.iterator();
				while (it.hasNext()) {
					// 这里进行任务分发
					dispatch((SelectionKey) (it.next()));
				}
				selected.clear();
			}
		} catch (IOException e) {
			e.printStackTrace();
		}
	}
	void dispatch(SelectionKey k) {
		// 附带对象为Acceptor
		Runnable r = (Runnable) (k.attachment());
		// 调用之前注册的回调对象
		if (r != null) {
			r.run();
		}
	}
}
```

该模块内容包含两个核心方法，即`select`和`dispatch`，该模块负责监听就绪事件和对事件的分发处理。分发附带对象为`Acceptor`处理类。

### 2、Acceptor

```java
public class Acceptor implements Runnable {
	private final ServerSocketChannel serverSocketChannel;
	private final int coreNum = Runtime.getRuntime().availableProcessors(); // CPU核心数
	private final Selector[] selectors = new Selector[coreNum]; // 创建selector给SubReactor使用
	private int next = 0; // 轮询使用subReactor的下标索引
	private SubReactor[] reactors = new SubReactor[coreNum]; // subReactor
	private Thread[] threads = new Thread[coreNum]; // subReactor的处理线程
	Acceptor(ServerSocketChannel serverSocketChannel) throws IOException {
		this.serverSocketChannel = serverSocketChannel;
		// 初始化
		for (int i = 0; i < coreNum; i++) {
			selectors[i] = Selector.open();
			reactors[i] = new SubReactor(selectors[i], i); // 初始化sub reactor
			threads[i] = new Thread(reactors[i]); // 初始化运行sub reactor的线程
			threads[i].start(); // 启动（启动后的执行参考SubReactor里的run方法）
		}
	}
	@Override
	public void run() {
		SocketChannel socketChannel;
		try {
			socketChannel = serverSocketChannel.accept(); // 连接
			if (socketChannel != null) {
				System.out.println(String.format("accpet %s", socketChannel.getRemoteAddress()));
				socketChannel.configureBlocking(false);
				// 注意一个selector在select时是无法注册新事件的，因此这里要先暂停下select方法触发的程序段，
				// 下面的weakup和这里的setRestart都是做这个事情的，具体参考SubReactor里的run方法
				reactors[next].registering(true);
				selectors[next].wakeup(); // 使一个阻塞住的selector操作立即返回
				SelectionKey selectionKey = 
						socketChannel.register(selectors[next], SelectionKey.OP_READ); // 注册一个读事件
				selectors[next].wakeup(); // 使一个阻塞住的selector操作立即返回
				// 本次事件注册完成后，需要再次触发select的执行，
				// 因此这里Restart要在设置回false（具体参考SubReactor里的run方法）
				reactors[next].registering(false);
				// 绑定Handler
				selectionKey.attach(new AsyncHandler(socketChannel, selectors[next], next));
				if (++next == selectors.length) {
					next = 0; // 越界后重新分配
				}
			}
		} catch (IOException e) {
			e.printStackTrace();
		}
	}
}
```

该模块负责处理连接就绪的事件，并初始化一批`subReactor`进行分发处理，拿到客户端的`socketChannel`，绑定`Handler`，这样就可以继续完成接下来的读写任务了。

### 3、subReactor

```java
public class SubReactor implements Runnable {
	private final Selector selector;
	private boolean register = false; // 注册开关表示
	private int num; // 序号，也就是Acceptor初始化SubReactor时的下标
	SubReactor(Selector selector, int num) {
		this.selector = selector;
		this.num = num;
	}
	@Override
	public void run() {
		while (!Thread.interrupted()) {
			System.out.println(String.format("NO %d SubReactor waitting for register...", num));
			while (!Thread.interrupted() && !register) {
				try {
					if (selector.select() == 0) {
						continue;
					}
				} catch (IOException e) {
					e.printStackTrace();
				}
				Set<SelectionKey> selectedKeys = selector.selectedKeys();
				Iterator<SelectionKey> it = selectedKeys.iterator();
				while (it.hasNext()) {
					dispatch(it.next());
					it.remove();
				}
			}
		}
	}
	private void dispatch(SelectionKey key) {
		Runnable r = (Runnable) (key.attachment());
		if (r != null) {
			r.run();
		}
	}
	void registering(boolean register) {
		this.register = register;
	}
}
```

这个类负责`Acceptor`交给自己的事件`select`，在上述例子中实际就是`read`和`send`操作。

### 4、AsyncHandler

```java
public class AsyncHandler implements Runnable {
	private final Selector selector;
	private final SelectionKey selectionKey;
	private final SocketChannel socketChannel;
	private ByteBuffer readBuffer = ByteBuffer.allocate(1024);
	private ByteBuffer sendBuffer = ByteBuffer.allocate(2048);
	private final static int READ = 0; // 读取就绪
	private final static int SEND = 1; // 响应就绪
	private final static int PROCESSING = 2; // 处理中
	private int status = READ; // 所有连接完成后都是从一个读取动作开始的
	private int num; // 从反应堆序号
	// 开启线程数为4的异步处理线程池
	private static final ExecutorService workers = Executors.newFixedThreadPool(5);
	AsyncHandler(SocketChannel socketChannel, Selector selector, int num) throws IOException {
		this.num = num; // 为了区分Handler被哪个从反应堆触发执行做的标记
		this.socketChannel = socketChannel; // 接收客户端连接
		this.socketChannel.configureBlocking(false); // 置为非阻塞模式
		selectionKey = socketChannel.register(selector, 0); // 将该客户端注册到selector
		selectionKey.attach(this); // 附加处理对象，当前是Handler对象
		selectionKey.interestOps(SelectionKey.OP_READ); // 连接已完成，那么接下来就是读取动作
		this.selector = selector;
		this.selector.wakeup();
	}
	@Override
	public void run() {
		// 如果一个任务正在异步处理，那么这个run是直接不触发任何处理的，
		// read和send只负责简单的数据读取和响应，业务处理完全不阻塞这里的处理
		switch (status) {
		case READ:
			read();
			break;
		case SEND:
			send();
			break;
		default:
		}
	}
	private void read() {
		if (selectionKey.isValid()) {
			try {
				readBuffer.clear();
				// read方法结束，意味着本次"读就绪"变为"读完毕"，标记着一次就绪事件的结束
				int count = socketChannel.read(readBuffer);
				if (count > 0) {
					status = PROCESSING; // 置为处理中
					workers.execute(this::readWorker); // 异步处理
				} else {
					selectionKey.cancel();
					socketChannel.close();
					System.out.println(String.format("NO %d SubReactor read closed", num));
				}
			} catch (IOException e) {
				System.err.println("处理read业务时发生异常！异常信息：" + e.getMessage());
				selectionKey.cancel();
				try {
					socketChannel.close();
				} catch (IOException e1) {
					System.err.println("处理read业务关闭通道时发生异常！异常信息：" + e.getMessage());
				}
			}
		}
	}
	void send() {
		if (selectionKey.isValid()) {
			status = PROCESSING; // 置为执行中
			workers.execute(this::sendWorker); // 异步处理
			selectionKey.interestOps(SelectionKey.OP_READ); // 重新设置为读
		}
	}
	// 读入信息后的业务处理
	private void readWorker() {
		try {
			// 模拟一段耗时操作
			Thread.sleep(5000L);
		} catch (InterruptedException e) {
			e.printStackTrace();
		}
		try {
			System.out.println(String.format("NO %d %s -> Server：%s", 
					num, socketChannel.getRemoteAddress(),
					new String(readBuffer.array())));
		} catch (IOException e) {
			System.err.println("异步处理read业务时发生异常！异常信息：" + e.getMessage());
		}
		status = SEND;
		selectionKey.interestOps(SelectionKey.OP_WRITE); // 注册写事件
		this.selector.wakeup(); // 唤醒阻塞在select的线程
	}
	private void sendWorker() {
		try {
			sendBuffer.clear();
			sendBuffer.put(String.format("NO %d SubReactor recived %s from %s", num,
					new String(readBuffer.array()), 
					socketChannel.getRemoteAddress()).getBytes());
			sendBuffer.flip();
			// write方法结束，意味着本次写就绪变为写完毕，标记着一次事件的结束
			int count = socketChannel.write(sendBuffer);
			if (count < 0) {
				// 同上，write场景下，取到-1，也意味着客户端断开连接
				selectionKey.cancel();
				socketChannel.close();
				System.out.println(String.format("%d SubReactor send closed", num));
			}
			// 没断开连接，则再次切换到读
			status = READ;
		} catch (IOException e) {
			System.err.println("异步处理send业务时发生异常！异常信息：" + e.getMessage());
			selectionKey.cancel();
			try {
				socketChannel.close();
			} catch (IOException e1) {
				System.err.println("异步处理send业务关闭通道时发生异常！异常信息：" + e.getMessage());
			}
		}
	}
}
```

`AsyncHandler`负责接下来的读写操作。

### 5、MainSubReactorDemo

```java
public class MainSubReactorDemo {
    public static void main(String[] args) throws IOException {
        new Thread(new Reactor(2333)).start();
    }
}
```

## 客户端

### 1、Connector

```java
public class Connector implements Runnable {
	private final Selector selector;
	private final SocketChannel socketChannel;
	Connector(SocketChannel socketChannel, Selector selector) {
		this.socketChannel = socketChannel;
		this.selector = selector;
	}
	@Override
	public void run() {
		try {
			if (socketChannel.finishConnect()) {
				// 这里连接完成（与服务端的三次握手完成）
				System.out.println(String.format("connected to %s", socketChannel.getRemoteAddress()));
				// 连接建立完成后，接下来的动作交给Handler去处理（读写等）
				new Handler(socketChannel, selector);
			}
		} catch (IOException e) {
			e.printStackTrace();
		}
	}
}
```

### 2、Handler

```java
public class Handler implements Runnable {
	private final SelectionKey selectionKey;
	private final SocketChannel socketChannel;
	private ByteBuffer readBuffer = ByteBuffer.allocate(2048);
	private ByteBuffer sendBuffer = ByteBuffer.allocate(1024);
	private final static int READ = 0;
	private final static int SEND = 1;
	private int status = SEND; // 与服务端不同，默认最开始是发送数据
	private AtomicInteger counter = new AtomicInteger();
	Handler(SocketChannel socketChannel, Selector selector) throws IOException {
		this.socketChannel = socketChannel; // 接收客户端连接
		this.socketChannel.configureBlocking(false); // 置为非阻塞模式
		selectionKey = socketChannel.register(selector, 0); // 将该客户端注册到selector
		selectionKey.attach(this); // 附加处理对象，当前是Handler对象
		selectionKey.interestOps(SelectionKey.OP_WRITE); // 建连已完成，那么接下来就是读取动作
		selector.wakeup(); // 唤起select阻塞
	}
	@Override
	public void run() {
		try {
			switch (status) {
			case SEND:
				send();
				break;
			case READ:
				read();
				break;
			default:
			}
		} catch (IOException e) {
			// 这里的异常处理是做了汇总，同样的，客户端也面临着正在与服务端进行写/读数据时，
			// 突然因为网络等原因，服务端直接断掉连接，这个时候客户端需要关闭自己并退出程序
			System.err.println("send或read时发生异常！异常信息：" + e.getMessage());
			selectionKey.cancel();
			try {
				socketChannel.close();
			} catch (IOException e2) {
				System.err.println("关闭通道时发生异常！异常信息：" + e2.getMessage());
				e2.printStackTrace();
			}
		}
	}
	void send() throws IOException {
		if (selectionKey.isValid()) {
			sendBuffer.clear();
			int count = counter.incrementAndGet();
			if (count <= 10) {
				sendBuffer.put(String.format("msg is %s", count).getBytes());
				sendBuffer.flip(); // 切换到读模式，用于让通道读到buffer里的数据
				socketChannel.write(sendBuffer);
				// 则再次切换到读，用以接收服务端的响应
				status = READ;
				selectionKey.interestOps(SelectionKey.OP_READ);
			} else {
				selectionKey.cancel();
				socketChannel.close();
			}
		}
	}
	private void read() throws IOException {
		if (selectionKey.isValid()) {
			readBuffer.clear(); // 切换成buffer的写模式，用于让通道将自己的内容写入到buffer里
			socketChannel.read(readBuffer);
			System.out.println(String.format("Server -> Client: %s", new String(readBuffer.array())));
			// 收到服务端的响应后，再继续往服务端发送数据
			status = SEND;
			selectionKey.interestOps(SelectionKey.OP_WRITE); // 注册写事件
		}
	}
}
```

### 3、NIOClient

```java
public class NIOClient implements Runnable {
    private Selector selector;
    private SocketChannel socketChannel;
    NIOClient(String ip, int port) {
        try {
            selector = Selector.open(); //打开一个Selector
            socketChannel = SocketChannel.open();
            socketChannel.configureBlocking(false); //设置为非阻塞模式
            socketChannel.connect(new InetSocketAddress(ip, port)); //连接服务
            //入口，最初给一个客户端channel注册上去的事件都是连接事件
            SelectionKey sk = socketChannel.register(selector, SelectionKey.OP_CONNECT);
            //附加处理类，第一次初始化放的是连接就绪处理类
            sk.attach(new Connector(socketChannel, selector));
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
    @Override
    public void run() {
        try {
            while (!Thread.interrupted()) {
            	 //就绪事件到达之前，阻塞
                selector.select();
                //拿到本次select获取的就绪事件
                Set<SelectionKey> selected = selector.selectedKeys();
                Iterator<SelectionKey> it = selected.iterator();
                while (it.hasNext()) {
                    //这里进行任务分发
                    dispatch((SelectionKey) (it.next()));
                }
                selected.clear();
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
    void dispatch(SelectionKey k) {
    	// 附带对象为Connector（
        Runnable r = (Runnable) (k.attachment()); 
        //调用之前注册的回调对象
        if (r != null) {
            r.run();
        }
    }
}
```

### 4、ClientDemo

```java
public class ClientDemo {
    public static void main(String[] args) {
        new Thread(new NIOClient("127.0.0.1", 2333)).start();
        new Thread(new NIOClient("127.0.0.1", 2333)).start();
    }
}
```

### 5、测试

运行上述应用及客户端，在控制台输出如下内容：

```java
NO 2 SubReactor waitting for register...
NO 1 SubReactor waitting for register...
NO 3 SubReactor waitting for register...
NO 0 SubReactor waitting for register...
accpet /127.0.0.1:63223
NO 0 SubReactor waitting for register...
accpet /127.0.0.1:63226
NO 1 SubReactor waitting for register...
NO 0 /127.0.0.1:63223 -> Server：msg is 1                                                                                       
NO 1 /127.0.0.1:63226 -> Server：msg is 1                                                                                       
NO 0 /127.0.0.1:63223 -> Server：msg is 2                                                                           
NO 1 /127.0.0.1:63226 -> Server：msg is 2                                                                                       
NO 0 /127.0.0.1:63223 -> Server：msg is 3                                                                              
NO 1 /127.0.0.1:63226 -> Server：msg is 3                                                                                       
```

## 总结

以上就是关于 Reactor 模型的详细介绍，相信看完的小伙伴对于 Reactor 模型也有了一定的认识，对于 Netty 的架构也更加深层次了解。下节我们继续深入 Netty 的源码。
