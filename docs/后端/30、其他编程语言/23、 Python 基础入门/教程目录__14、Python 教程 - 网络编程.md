# 14、Python 教程 - 网络编程
- 来源：https://ddkk.com/zhuanlan/other/python/6/14.html
- 分类：Python 基础入门
- 分组：教程目录
本章首先概述**Python标准库中的一些网络模块**。然后**讨论SocketServer和相关的类**，并介绍**同时处理多个连接的各种方法**。最后，简单地说一说**Twisted**，这是一个使用Python编写网络程序的框架，功能丰富而成熟。

## 几个网络模块

### 模块socket

网络编程中的一个基本组件是套接字（socket）。

套接字基本上是一个信息通道，两端各有一个程序。

套接字分为两类：服务器套接字和客户端套接字。

为传输数据，套接字提供了两个方法：send和recv（表示receive）。

要发送数据，可调用方法send并提供一个字符串；

要接收数据，可调用recv并指定最多接收多少个字节的数据。

**最简单的服务器**

服务器套接字先调用方法bind，再调用方法listen来监听特定的地址。

然后，客户端套接字就可连接到服务器了，办法是调用方法connect并提供调用方法bind时指定的地址（在服务器端，可使用函数socket.gethostname获取当前机器的主机名）。这里的地址是一个格式为(host, port)的元组，其中host是主机名（如www.example.com），而port是端口号（一个整数）。

方法listen接受一个参数——待办任务清单的长度（即最多可有多少个连接在队列中等待接纳，到达这个数量后将开始拒绝连接）

服务器套接字开始监听后，就可接受客户端连接了，这是使用方法accept来完成的。这个方法将阻断（等待）到客户端连接到来为止，然后返回一个格式为(client, address)的元组，其中client是一个客户端套接字，而address是前面解释过的地址。服务器能以其认为合适的方式处理客户端连接，然后再次调用accept以接着等待新连接到来。这通常是在一个无限循环中完成的。

```java
import socket
s = socket.socket()
host = socket.gethostname()
port = 1234
s.bind((host,port))
s.listen(5)
while True:
    c,addr = s.accept()
    print('Got connection from',addr)
    c.send('Thank you for connecting')
    c.close()
```

**最简单的客户端**

```java
import socket
s = socket.socket()
host = socket.gethostname()
port = 1234
s.connect((host,port))
print(s.recv(1024))
```

### 模块urllib和urllib2

**1，打开远程文件**

```java
from urllib.request import urlopen
import re
webpage = urlopen('https://beyondyanyu.blog.csdn.net')#变量webpage将包含一个类似于文件的对象，这个对象与该网站相关联
text = webpage.read()
m = re.search(b'<a href="([^"]+)".*?>about</a>',text,re.IGNORECASE)
m.group(1)
```

**2，获取远程文件**

函数`urlopen`返回一个类似于文件的对象，可从中读取数据。

可使用`urlretrieve`，下载文件，并将其副本存储在一个本地文件中。

这个函数不返回一个类似于文件的对象，而返回一个格式为(filename, headers)的元组，其中filename是本地文件的名称（由urllib自动创建），而headers包含一些有关远程文件的信息。

调用函数`urlcleanup`且不提供任何参数，清空所有临时文件。

**获取CSDN的主页，并将其存储到文件C:\webpage.html中。**

```java
urlretrieve('https://beyondyanyu.blog.csdn.net', 'C:\\python_webpage.html')
```

**一些实用的函数**

函数名称
描述

quote(string[, safe])
返回一个字符串，其中所有的特殊字符（在URL中有特殊意义的字符）都已替换为对URL友好的版本（如将~替换为%7E）参数safe是一个字符串（默认为’/’），包含不应像这样对其进行编码的字符。

quote_plus(string[, safe])
类似于quote，但也将空格替换为加号。

unquote(string)
与quote相反。

unquote_plus(string)
与quote_plus相反。

urlencode(query[, doseq])
将映射（如字典）或由包含两个元素的元组（形如(key,value)）组成的序列转换为“使用URL编码的”字符串。

### 其他模块

模块
描述

asynchat
包含补充asyncore的功能

asyncore
异步套接字处理程序

cgi
基本的CGI支持

Cookie
Cookie对象操作，主要用于服务器

cookielib
客户端Cookie支持

email
电子邮件（包括MIME）支持

ftplib
FTP客户端模块

gopherlib
Gopher客户端模块

httplib
HTTP 客户端模块

imaplib
IMAP4客户端模块

mailbox
读取多种邮箱格式

mailcap
通过mailcap文件访问MIME配置

mhlib
访问MH邮箱

nntplib
NNTP客户端模块

poplib
POP客户端模块

robotparser
解析Web服务器robot文件

SimpleXMLRPCServer
一个简单的XML-RPC服务器

smtpd
SMTP服务器模块

smtplib
SMTP客户端模块

telnetlib
Telnet客户端模块

urlparse
用于解读URL

xmlrpclib
XML-RPC客户端支持

## SocketServer及相关的类

模块**SocketServer**是标准库提供的服务器框架的基石，这个框架包括BaseHTTPServer、SimpleHTTPServer、CGIHTTPServer、SimpleXMLRPCServer和DocXMLRPCServer等服务器，它们在基本服务器的基础上添加了各种功能。

SocketServer包含4个基本的服务器：`TCPServer`（支持TCP套接字流）、UDPServer（支持UDP数据报套接字）以及更难懂的UnixStreamServer和UnixDatagramServer。后面3个你可能不会用到。

使用模块SocketServer编写服务器时，大部分代码都位于请求处理器中。

基本请求处理程序类BaseRequestHandler将所有操作都放在一个方法中——服务器调用的方法handle。这个方法可通过属性self.request来访问客户端套接字。

如果处理的是流（使用TCPServer时很可能如此），可使用StreamRequestHandler类，它包含另外两个属性：self.rfile（用于读取）和self.wfile（用于写入）。

**基于SocketServer的极简服务器**

```java
from socketserver import TCPServer,StreamRequestHandler
class Handler(StreamRequestHandler):
    def handle(self):
        addr = self.request.getpeername()
        print('Got connection from',addr)
        self.wfile.write('Thank you for connecting')
server = TCPServer(('',1234),Handler)
server.serve_forever()
```

## 多个连接

处理多个连接的主要方式有三种：**分叉**（forking）、**线程化**和**异步I/O**。

分叉占用的资源较多，且在客户端很多时可伸缩性不佳。

**进程：运行着的程序**

**分叉：对进程（运行的程序）进行分叉时，基本上是复制它，而这样得到的两个进程都将从当前位置开始继续往下执行，且每个进程都有自己的内存副本（变量等）。原来的进程为父进程，复制的进程为子进程。查看函数fork的返回值可以区别父子进程。**

在分叉服务器中，对于每个客户端连接，都将通过分叉创建一个子进程。父进程继续监听新连接，而子进程负责处理客户端请求。客户端请求结束后，子进程直接退出。由于分叉出来的进程并行地运行，因此客户端无需等待。

鉴于分叉占用的资源较多（每个分叉出来的进程都必须有自己的内存），还有另一种解决方案：**线程化**。

线程是轻量级进程（子进程），都位于同一个进程中并共享内存。

这减少了占用的资源，但也带来了一个缺点：由于线程共享内存，你必须确保它们不会彼此干扰或同时修改同一项数据，否则将引起混乱。这些问题都属于**同步**问题。

种避免线程和分叉的办法是使用**Stackless Python**。它是一个能够快速而轻松地在不同上下文之间切换的Python版本。它支持一种类似于线程的并行方式，名为**微线程**，其可伸缩性比真正的线程高得多。

### 使用SocketServer实现分叉和线程化

仅当方法handle需要很长时间才能执行完毕时，分叉和线程化才能提供帮助。请注意，**Windows不支持分叉**。

**分叉服务器**

```java
from socketserver import TCPSercer,ForkingMixIn,StreamRequestHandler
class Server(ForkingMixIn,TCPSercer):pass
class Handler(StreamRequestHandler):
    def handle(self):
        addr = self.request.getpeername()
        print('Got connection from',addr)
        self.wfile.write('Thank you for connecting')
server = Server(('',1234),Handler)
server.serve_forever()
```

**线程化服务器**

```java
from socketserver import TCPServer, ThreadingMixIn, StreamRequestHandler
class Server(ThreadingMixIn, TCPServer): pass
class Handler(StreamRequestHandler):
    def handle(self):
        addr = self.request.getpeername()
        print('Got connection from', addr)
        self.wfile.write('Thank you for connecting')
server = Server(('', 1234), Handler)
server.serve_forever()
```

### 使用select和poll实现异步I/O

当服务器与客户端通信时，来自客户端的数据可能时断时续。如果使用了分叉和线程化，这就不是问题：因为一个进程（线程）等待数据时，其他进程（线程）可继续处理其客户端。

然而，另一种做法是只处理当前正在通信的客户端。你甚至无需不断监听，只需监听后将客户端加入队列即可。这就是框架asyncore/asynchat和Twisted采取的方法。

这种功能的基石是函数select或poll）。这两个函数都位于模块select中，其中poll的可伸缩性更高，但只有UNIX系统支持它（Windows不支持）。

**使用select的简单服务器**

函数select接受三个必不可少的参数和一个可选参数，其中前三个参数为序列，而第四个参数为超时时间（单位为秒）。这三个序列分别表示需要输入和输出以及发生异常（错误等）的连接。

如果没有指定超时时间，select将阻断（即等待）到有文件描述符准备就绪；

如果指定了超时时间，select将最多阻断指定的秒数；

如果超时时间为零，select将不断轮询（即不阻断）。

select返回三个序列（即一个长度为3的元组），其中每个序列都包含相应参数中处于活动状态的文件描述符。

```java
import socket,select
s = socket.socket()
host = socket.gethostname()
port = 1234
s.bind((host,port))
s.listen(5)
inputs = [s]
while True:
    rs,ws,es = select.select(inputs,[],[])
    for r in rs:
        if r is s:
            c,addr = s.accept()
            print('Got connection from',addr)
            inputs.append(c)
        else:
            try:
                data = r.recv(1024)
                disconnected = not data
            except socket.error:
                disconnected = True
            if disconnected:
                print(r.getpeername(),'disconnected')
                inputs.remove(r)
            else:
                print(data)
```

**select模块中的轮询事件常量**

事件名
描述

POLLIN
文件描述符中有需要读取的数据

POLLPRI
文件描述符中有需要读取的紧急数据

POLLOUT
文件描述符为写入数据做好了准备

POLLERR
文件描述符出现了错误状态

POLLHUP
挂起。连接已断开。

POLLNVAL
无效请求。连接未打开

**使用poll的简单服务器**

方法poll使用起来比select容易。调用poll时，将返回一个轮询对象。

使用方法register向这个对象注册文件描述符（或包含方法fileno的对象）。

注册后可使用方法unregister将它们删除。注册对象（如套接字）后，可调用其方法poll（它接受一个可选的超时时间参数）。

这将返回一个包含(fd, event)元组的列表（可能为空），其中fd为文件描述符，而event是发生的事件。event是一个位掩码，这意味着它是一个整数，其各个位对应于不同的事件。

```java
import socket,select
s = socket.socket()
host = socket.gethostname()
port = 1234
s.bind((host,port))
fdmap = {
     s.fileno():s}
s.listen(5)
p = select.poll()
p.register(s)
while True:
    events = p.poll()
    for fd, event in events:
        if fd in fdmap:
            c, addr = s.accept()
            print('Got connection from', addr)
            p.register(c)
            fdmap[c.fileno()] = c
        elif event & select.POLLIN:
            data = fdmap[fd].recv(1024)
            if not data: 没有数据 --连接已关闭
                print(fdmap[fd].getpeername(), 'disconnected')
                p.unregister(fd)
                del fdmap[fd]
            else:
                print(data)
```

## Twisted

Twisted是由Twisted Matrix Laboratories（http://twistedmatrix.com）开发的，这是一个事件驱动的Python网络框架。

**使用Twisted创建的简单服务器**

事件处理程序是在协议中定义的。

你还需要一个工厂，它能够在新连接到来时创建这样的协议对象。

如果你只想创建自定义协议类的实例，可使用Twisted自带的工厂——模块**twisted.internet.protocol**中 的**Factory**类。

编写自定义协议时，将模块**twisted.internet.protocol**中的Protocol作为超类。

有新连接到来时，将调用事件处理程序connectionMade；

连接中断时，将调用connectionLost。

来自客户端的数据是通过处理程序dataReceived接收的。

```java
from twisted.internet import reactor
from twisted.internet.protocol import Protocol, Factory
class SimpleLogger(Protocol):
    def connectionMade(self):
        print('Got connection from', self.transport.client)
    def connectionLost(self, reason):
        print(self.transport.client, 'disconnected')
    def dataReceived(self, data):
        print(data)
factory = Factory()
factory.protocol = SimpleLogger
reactor.listenTCP(1234, factory)
reactor.run()
```

**使用协议LineReceiver改进后的日志服务器**

如果使用telnet连接到这个服务器以便测试它，每行输出可能只有一个字符，是否如此取决于缓冲等因素。

为此，可编写一个自定义协议。模块twisted.protocols.basic包含几个预定义的协议，其中一个就是LineReceiver。

它实现了dataReceived，并在每收到一整行后调用事件处理程序lineReceived。

```java
from twisted.internet import reactor 
from twisted.internet.protocol import Factory 
from twisted.protocols.basic import LineReceiver
class SimpleLogger(LineReceiver):
    def connectionMade(self): 
        print('Got connection from', self.transport.client)
    def connectionLost(self, reason): 
        print(self.transport.client, 'disconnected')
    def lineReceived(self, line): 
        print(line)
factory = Factory() 
factory.protocol = SimpleLogger 
reactor.listenTCP(1234, factory) 
reactor.run()
```

## 小结

概念
描述

套接字和模块socket
套接字是让程序（进程）能够通信的信息通道，这种通信可能需要通过网络进行。模块socket让你能够在较低的层面访问客户端套接字和服务器套接字。服务器套接字在指定的地址处监听客户端连接，而客户端套接字直接连接到服务器。

urllib和urllib2
这些模块让你能够从各种服务器读取和下载数据，为此你只需提供指向数据源的URL即可。模块urllib是一种比较简单的实现，而urllib2功能强大、可扩展性极强。这两个模块都通过诸如urlopen等函数来完成工作。

框架SocketServer
这个框架位于标准库中，包含一系列同步服务器基类，让你能够轻松地编写服务器。它还支持使用CGI的简单Web（HTTP）服务器。如果要同时处理多个连接，必须使用支持分叉或线程化的混合类。

select和poll
这两个函数让你能够在一组连接中找出为读取和写入准备就绪的连接。这意味着你能够以循环的方式依次为多个连接提供服务，从而营造出同时处理多个连接的假象。另外，相比于线程化或分叉，虽然使用这两个函数编写的代码要复杂些，但解决方案的可伸缩性和效率要高得多。

Twisted
这是Twisted Matrix Laboratories开发的一个框架，功能丰富而复杂，支持大多数主要的网络协议。虽然这个框架很大且其中使用的一些成例看起来宛如天书，但其基本用法简单而直观。框架Twisted也是异步的，因此效率和可伸缩性都非常高。对很多自定义网络应用程序来说，使用Twisted来开发很可能是最佳的选择。

### 本章介绍的新函数

函数
描述

urllib.urlopen(url[, data[, proxies]])
根据指定的URL打开一个类似于文件的对象

urllib.urlretrieve(url[,fname[,hook[,data]]])
下载URL指定的文件

urllib.quote(string[, safe])
替换特殊的URL字符

urllib.quote_plus(string[, safe])
与quote一样，但也将空格替换为+

urllib.unquote(string)
与quote相反

urllib.unquote_plus(string)
与quote_plus相反

urllib.urlencode(query[, doseq])
对映射进行编码，以便用于CGI查询中

select.select(iseq, oseq, eseq[, timeout])
找出为读/写做好了准备的套接字

select.poll()
创建一个轮询对象，用于轮询套接字

reactor.listenTCP(port, factory)
监听连接的Twisted函数

reactor.run()
启动主服务器循环的Twisted函数
