# 24、Perl Socket 编程
- 来源：https://ddkk.com/zhuanlan/other/perl/24.html
- 分类：Perl 教程
- 分组：教程目录
Socket 又称 **套接字**，应用程序通常通过 **套接字** 向网络发出请求或者应答网络请求，使主机间或者一台计算机上的进程间可以通讯。

本章节我们将开始学习 Perl 中的 套接字编程

### Perl 中创建服务端 socket

Perl 中创建服务器端 socket 一般需要经过以下步骤：

**1、** 使用**socket**函数来创建socket服务；

**2、** 使用**bind**函数绑定端口；

**3、** 使用**listen**函数监听端口；

**4、** 使用**accept**函数接收客户端请求；

### Perl 中创建客户端 socket

Perl 中创建客户端 socket 一般需要经过以下步骤：

**1、** 使用**socket**函数来创建socket服务；

**2、** 使用**connect**函数连接到socket服务端；

### 下图演示了客户端与服务端之间的通信流程

## 服务端 socket 函数

### socket 函数

Perl 中，socket() 函数用来创建套接字

#### socket() 函数语法格式如下：

```sh
socket( SOCKET, DOMAIN, TYPE, PROTOCOL );
```

#### 参数说明：

**DOMAIN**

创建的套接字指定协议集。 套接字协议有以下几种：

- AF_INET 表示IPv4网络协议
- AF_INET6 表示IPv6
- AF_UNIX 表示本地套接字（使用一个文件）

**TYPE**

套接字类型 可以根据是面向连接的还是非连接分为 SOCK_STREAM 或 SOCK_DGRAM 也就是俗称的 tcp 和 udp

**PROTOCOL**

指定实际使用的传输协议，是 **(getprotobyname('tcp'))[2]** 返回的结果

因此，socket 函数调用方式如下：

```sh
use Socket     # 定义了 PF_INET 和 SOCK_STREAM
socket(SOCKET,PF_INET,SOCK_STREAM,(getprotobyname('tcp'))[2]);
```

### bind() 函数

Perl 中的 bind() 函数为套接字分配一个地址

#### bind() 函数语法格式如下所示

```sh
bind( SOCKET, ADDRESS );
```

#### 参数说明

SOCKET

一个socket的描述符，函数 socket() 的返回值

ADDRESS

是socket 地址 ( TCP/IP ) 包含了三个元素:

- 地址簇 (TCP/IP, 是 AF_INET, 在你系统上可能是 2)
- 端口号 (例如 21)
- 网络地址 (例如 10.12.12.168)

使用socket() 函数创建套接字后，只赋予其所使用的协议，并未分配地址。 在接受其它主机的连接前，必须先调用 bind() 为套接字分配一个地址

```sh
use Socket        # 定义了 PF_INET 和 SOCK_STREAM
$port = 6288;     # 监听的端口
$server_ip_address = "0.0.0.0";
bind( SOCKET, pack_sockaddr_in($port, inet_aton($server_ip_address)))
   or die "无法绑定端口! \n";
```

- **or die** 在绑定地址失败后执行。
- 通过设置 setsockopt() 可选项 SO_REUSEADDR 可以让端口可立即重复使用。
- **pack_sockaddr_in()** 函数将地址转换为二进制格式

### listen() 函数

当socket 和一个地址绑定之后，listen()函数会开始监听可能的连接请求。

但这只能在有可靠数据流保证的时候使用：

#### listen() 函数语法格式如下

```sh
listen( SOCKET, QUEUESIZE );
```

#### 参数说明

SOCKET

一个socket的描述符，socket() 函数调用返回的结果

QUEUESIZE

是一个决定监听队列大小的整数，当有一个连接请求到来，就会进入此监听队列； 当一个连接请求被 accept()接受，则从监听队列中移出； 当队列满后，新的连接请求会返回错误

#### 返回值

一旦连接被接受，返回 0 表示成功，错误返回 -1

### accept() 函数

accept() 函数接受请求的socket连接。

如果成功则返回压缩形式的网络地址，否则返回 FALSE

#### accept() 函数语法格式如下

```sh
accept( NEW_SOCKET, SOCKET );
```

#### 参数说明

SOCKET

一个socket的描述符，socket() 函数调用返回的结果

ADDRESS

ADDRESS 是 socket 地址 ( TCP/IP ) 包含了三个元素:

- 地址簇 (TCP/IP, 是 AF_INET, 在你系统上可能是 2)
- 端口号 (例如 21)
- 网络地址 (例如 10.12.12.168)

#### accept() 函数通常应用在无限循环当中

```sh
while(1) {
   accept( NEW_SOCKET, SOCKT );
   .......
}
```

介绍了一系列的函数，现在我们用这些函数创建一个服务器端 socket

```sh
#!/usr/bin/perl
=pod
  file: serv.pl
  author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
  Copyright © 2015-2065 www.ddkk.com. All rights reserved.
=cut
use strict;
use Socket;
# 使用端口 6288 作为默认值
my $port = shift || 6288;
my $proto = getprotobyname('tcp');
my $server = "localhost";  # 设置本地地址
# 创建 socket, 端口可重复使用，创建多个连接
socket(SOCKET, PF_INET, SOCK_STREAM, $proto)
   or die "无法打开 socket $!\n";
setsockopt(SOCKET, SOL_SOCKET, SO_REUSEADDR, 1)
   or die "无法设置 SO_REUSEADDR $!\n";
# 绑定端口并监听
bind( SOCKET, pack_sockaddr_in($port, inet_aton($server)))
   or die "无法绑定端口 $port! \n";
listen(SOCKET, 5) or die "listen: $!";
print "访问启动：$port\n";
# 接收请求
my $client_addr;
while ($client_addr = accept(NEW_SOCKET, SOCKET)) {
   # send them a message, close connection
   my $name = gethostbyaddr($client_addr, AF_INET );
   print NEW_SOCKET "我是来自服务端的信息";
   print "Connection recieved from $name\n";
   close NEW_SOCKET;
}
```

新开一个终端，输入以下命令运行 serv.pl

```sh
$ perl serv.pl
访问启动：6288
```

## 客户端 socket 函数

### connect() 函数

connect() 函数调用为一个套接字设置连接，参数有文件描述符和主机地址

#### connect() 函数语法格式如下

```sh
connect( SOCKET, ADDRESS );
```

下面的代码创建了一个连接到服务器 127.0.0.1:6288 的连接

```sh
$port = 6288;
$server_ip_address = "127.0.0.1";
connect( SOCKET, pack_sockaddr_in($port, inet_aton($server_ip_address)))
    or die "无法绑定端口! \n";
```

我们已经创建了一个监听 127.0.0.1:6288 的服务器， 现在我们使用以下代码访问它们

```sh
#!/usr/bin/perl
=pod
  file: serv.pl
  author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
  Copyright © 2015-2065 www.ddkk.com. All rights reserved.
=cut
use strict;
use Socket;
# 初始化地址与端口
my $host = shift || 'localhost';
my $port = shift || 6288;
my $server = "localhost";  # 主机地址
# 创建 socket 并连接
socket(SOCKET,PF_INET,SOCK_STREAM,(getprotobyname('tcp'))[2])
   or die "无法创建 socket $!\n";
connect( SOCKET, pack_sockaddr_in($port, inet_aton($server)))
   or die "无法连接：port $port! \n";
my $line;
while ($line = <SOCKET>) {
        print "$line\n";
}
close SOCKET or die "close: $!";
```

打开另外一个终端，执行以下代码：

```sh
$ perl client.pl
我是来自服务端的信息
```
