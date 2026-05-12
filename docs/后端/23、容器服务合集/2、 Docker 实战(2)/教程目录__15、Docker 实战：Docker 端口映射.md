# 15、Docker 实战：Docker 端口映射
- 来源：https://ddkk.com/zhuanlan/container/docker/2/15.html
- 分类：容器服务
- 分组：教程目录
前面章节中，当我们从一个镜像创建一个容器时，都会看到一个 -p 参数，这个 -p 参数就是用来实现端口映射的

网络应用程序都要开放端口供其它程序使用，Docker 容器中运行的网络应用程序也一样

如果要访问一个容器中的网络服务，方法之一就是先将容器中网络应用程序的端口映射到母机的一个端口上，这样，其它应用程序通过访问母机的端口来访问容器中的服务

## 网络端口映射

docker run 命令创建容器时添加端口映射的方法有两种： -P ( 大写的 P ) 和 -p (小写的 p )

这两种方法的区别是：

**1、** **-P:**是容器内部端口随机映射到主机的高端口；

**2、** **-p:**是容器内部端口绑定到指定的主机端口；

### 使用 -P ( 大写的 P ) 参数

例如下面的命令使用 -P 参数随机绑定本机端口

```sh
[root@ddkk.com ~]# docker run -d -P jcdemo/flaskapp
f6a0e149983a29294abd76c141f44e8da59bcbaf1d283be63fca803a486f9582
[root@ddkk.com ~]# docker run -d -P jcdemo/flaskapp
23f628a826340f24921233a1a48d3b3d4eedd23c9a5ee05abdf8f5e21fcf9c03
```

然后使用 docker ps -a 命令可以看到 PORTS 栏的本地端口，具有一定的随机性

```sh
[root@ddkk.com ~]# docker ps -a
CONTAINER ID  IMAGE               PORTS                  
23f628a82634  jcdemo/flaskapp     0.0.0.0:32769->5000/tcp
f6a0e149983a  jcdemo/flaskapp     0.0.0.0:32768->5000/tcp
```

### 使用 -p ( 小写的 p ) 参数指定端口映射

如果要指定映射到某个端口，则可以使用 -p [port]:[port] 参数

但这种方式需要我们实现知道容器内的网络服务的端口号

例如下面的应用程序使用 **-p** 标识来指定容器端口绑定到主机端口

```sh
[root@ddkk.com ~]# docker run -d -p 5555:5000 jcdemo/flaskapp
74795df6fcb856cdaf84d8222b27960774ba0b0f8d5ce40e8f12c26ac9c35a3a
```

使用docker ps 命令得到如下结果

```sh
[root@ddkk.com ~]# docker ps -a
CONTAINER ID   IMAGE               PORTS 
74795df6fcb8   jcdemo/flaskapp     0.0.0.0:5555->5000/tcp
23f628a82634   jcdemo/flaskapp     0.0.0.0:32769->5000/tcp
f6a0e149983a   jcdemo/flaskapp     0.0.0.0:32768->5000/tcp
```

如果指定的端口已经存在，容器仍然会被创建但出于停止状态，而且报错

```sh
[root@ddkk.com ~]# docker run -d -p 5000:5000 jcdemo/flaskapp
ac8dade70e675beecd02e18fb8af2c064b1700a38a58c6179f68fdcb2fefba9b
docker: Error response from daemon: driver failed programming external connectivity on endpoint hopeful_bassi (6cf77c7df2e9caaa2f4819cbbe82f2004fb75d2a221a1e90fbadb492dd32b9b5): Error starting userland proxy: Bind for 0.0.0.0:5000 failed: port is already allocated.
```

因为5000 端口已经被使用了，所以报错了，绑定端口错误

另外，我们可以指定容器绑定的网络地址，比如绑定 127.0.0.1

```sh
[root@ddkk.com ~]# docker run -d -p 127.0.0.1:5554:5000 jcdemo/flaskapp
a43d61d10e12802b4f108481cfb4f5008f11d2531d1e4715bd6f9a5dd39e17c1
```

使用docker ps -a 输出结果如下

```sh
[root@ddkk.com ~]# docker ps -a
CONTAINER ID   IMAGE               PORTS 
a43d61d10e12   jcdemo/flaskapp     127.0.0.1:5554->5000/tcp
74795df6fcb8   jcdemo/flaskapp     0.0.0.0:5555->5000/tcp
23f628a82634   jcdemo/flaskapp     0.0.0.0:32769->5000/tcp
f6a0e149983a   jcdemo/flaskapp     0.0.0.0:32768->5000/tcp
```

## 绑定 UDP 端口

默认情况下 -p 和 -P 绑定的都是 tcp 协议端口

如果要绑定 udp 协议端口，只能使用 -p 参数，且在最后添加 /udp 字符串

例如下面的命令绑定了一个 udp 端口

```sh
[root@ddkk.com ~]# docker run -d -p 127.0.0.1:5553:5000/udp jcdemo/flaskapp
6aa30aa070a6e77f0d3f8653df69c654edf6e8bb68cea475aefbc68f6f7f9572
```

然后使用 docker ps -a 可以看到输出如下

```sh
[root@ddkk.com ~]# docker ps -a
CONTAINER ID   IMAGE               PORTS 
6aa30aa070a6   jcdemo/flaskapp     127.0.0.1:5553->5000/udp
a43d61d10e12   jcdemo/flaskapp     127.0.0.1:5554->5000/tcp
74795df6fcb8   jcdemo/flaskapp     0.0.0.0:5555->5000/tcp
23f628a82634   jcdemo/flaskapp     0.0.0.0:32769->5000/tcp
f6a0e149983a   jcdemo/flaskapp     0.0.0.0:32768->5000/tcp
```

## docker port 命令查看端口绑定情况

可以使用 docker port 命令查看某个容器的端口绑定情况

```sh
docker port <CONTAINER_id> [PRIVATE_PORT[/PROTO]]
```

例如我们使用 docker port a43d61d10e12 查看容器 a43d61d10e12 的端口绑定情况如下

```sh
[root@ddkk.com ~]# docker port a43d61d10e12
5000/tcp -> 127.0.0.1:5554
```

## 绑定多个端口

多次使用 -p 参数可以映射多个端口

```sh
[root@ddkk.com ~]# docker run -d -p 5552:5000  -p 5551:5001 jcdemo/flaskapp
fa116ae4f5c19d82d9d4f40560c3219c85540a21d88f7fa999b60382ab57524a
```

使用docker ps 输出结果如下

```sh
[root@ddkk.com ~]# docker ps -a
CONTAINER ID   IMAGE               PORTS 
fa116ae4f5c1   jcdemo/flaskapp     0.0.0.0:5552->5000/tcp, 0.0.0.0:5551->5001/tcp
6aa30aa070a6   jcdemo/flaskapp     127.0.0.1:5553->5000/udp
a43d61d10e12   jcdemo/flaskapp     127.0.0.1:5554->5000/tcp
74795df6fcb8   jcdemo/flaskapp     0.0.0.0:5555->5000/tcp
23f628a82634   jcdemo/flaskapp     0.0.0.0:32769->5000/tcp
f6a0e149983a   jcdemo/flaskapp     0.0.0.0:32768->5000/tcp
```
