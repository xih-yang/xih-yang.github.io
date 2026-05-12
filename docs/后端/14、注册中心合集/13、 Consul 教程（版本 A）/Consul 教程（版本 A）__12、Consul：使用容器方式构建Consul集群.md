# 12、Consul：使用容器方式构建Consul集群
- 来源：https://ddkk.com/zhuanlan/registered/consul/d-1/12.html
- 分类：注册中心
- 分组：Consul 教程（版本 A）
这篇文章介绍使用官方镜像构建Consul集群的方式。

## 启动Consul服务

使用如下命令，使用Consul官方镜像以开发模式启动Consul服务，将Consul web UI端口映射出来给用户提供访问。

> 执行命令：docker run -d --name=agent1 -p 8500:8500 consul:1.7.1 agent -dev -client=0.0.0.0 -bind=0.0.0.0

执行日志如下所示：

```sh
liumiaocn:~ liumiao$ docker run -d --name=agent1 -p 8500:8500 consul:1.7.1 agent -dev -client=0.0.0.0 -bind=0.0.0.0
bed6136ca254a22ffa6cab24b7db6b30c0bbb209525f503b9c4e665657fd94f3
liumiaocn:~ liumiao$ docker ps |grep consul
bed6136ca254        consul:1.7.1                                   "docker-entrypoint.s…"   5 seconds ago       Up 3 seconds        8300-8302/tcp, 8301-8302/udp, 8600/tcp, 8600/udp, 0.0.0.0:8500->8500/tcp   agent1
liumiaocn:~ liumiao$
```

- 查看集群成员状态

```sh
liumiaocn:~ liumiao$ docker exec -t agent1 consul members
Node          Address          Status  Type    Build  Protocol  DC   Segment
bed6136ca254  172.17.0.3:8301  alive   server  1.7.1  2         dc1  <all>
liumiaocn:~ liumiao$ 
```

## 获取Consul容器的IP

使用如下命令获取新启动的Consul容器的IP：

> 执行命令：docker inspect --format ‘{ { .NetworkSettings.IPAddress }}’ agent1

执行命令可以看到IP为172.17.0.3

```sh
liumiaocn:~ liumiao$ docker inspect --format '{
    { .NetworkSettings.IPAddress }}' agent1
172.17.0.3
liumiaocn:~ liumiao$ 
```

## 加入新的节点：agent2

使用如下命令将新的Consul节点加入到Consul集群中。

> 执行命令：docker run -d --name agent2 consul agent -dev -bind=0.0.0.0 -join=172.17.0.3

执行日志信息如下所示：

```sh
liumiaocn:~ liumiao$ docker run -d --name agent2 consul agent -dev -bind=0.0.0.0 -join=172.17.0.3
c40fc4bcf34ded511e8055e075ac82480890dc5d652dcd37d513211dcb937716
liumiaocn:~ liumiao$
```

当然也可以使用docker logs agent1/agent2来确认启动日志信息。登录任意一台集群的节点均可确认成员信息

```sh
liumiaocn:~ liumiao$ docker exec -t agent1 consul members
Node          Address          Status  Type    Build  Protocol  DC   Segment
bed6136ca254  172.17.0.3:8301  alive   server  1.7.1  2         dc1  <all>
c40fc4bcf34d  172.17.0.4:8301  alive   server  1.7.1  2         dc1  <all>
liumiaocn:~ liumiao$ 
liumiaocn:~ liumiao$ docker exec -t agent2 consul members
Node          Address          Status  Type    Build  Protocol  DC   Segment
bed6136ca254  172.17.0.3:8301  alive   server  1.7.1  2         dc1  <all>
c40fc4bcf34d  172.17.0.4:8301  alive   server  1.7.1  2         dc1  <all>
liumiaocn:~ liumiao$ 
```

当然也可以从web UI上进行节点信息的确认

## 加入新的节点：agent3

使用如下命令将新的Consul节点加入到Consul集群中。

> 执行命令：docker run -d --name agent3 consul agent -dev -bind=0.0.0.0 -join=172.17.0.3

执行日志信息如下所示：

```sh
liumiaocn:~ liumiao$ docker run -d --name agent3 consul agent -dev -bind=0.0.0.0 -join=172.17.0.3
e487800cf9c2c8889c9a9fcb808bbac9b31322a22676ffca4df464743ec0c203
liumiaocn:~ liumiao$ 
```

当然也可以使用docker logs agent3来确认启动日志信息。登录任意一台集群的节点均可确认成员信息

```sh
liumiaocn:~ liumiao$ docker exec -t agent1 consul members
Node          Address          Status  Type    Build  Protocol  DC   Segment
bed6136ca254  172.17.0.3:8301  alive   server  1.7.1  2         dc1  <all>
c40fc4bcf34d  172.17.0.4:8301  alive   server  1.7.1  2         dc1  <all>
e487800cf9c2  172.17.0.5:8301  alive   server  1.7.1  2         dc1  <all>
liumiaocn:~ liumiao$ 
liumiaocn:~ liumiao$ docker exec -t agent3 consul members
Node          Address          Status  Type    Build  Protocol  DC   Segment
bed6136ca254  172.17.0.3:8301  alive   server  1.7.1  2         dc1  <all>
c40fc4bcf34d  172.17.0.4:8301  alive   server  1.7.1  2         dc1  <all>
e487800cf9c2  172.17.0.5:8301  alive   server  1.7.1  2         dc1  <all>
liumiaocn:~ liumiao$ 
```

当然也可以从web UI上进行节点信息的确认（注意在本文示例中此时Leader已经变了）

## 节点异常

节点在实际使用的过程中可能会发生问题，比如这里我们将身为Leader的172.17.0.4这个容器停止，再来确认会发生什么，首先停止agent2容器

```sh
liumiaocn:~ liumiao$ docker stop agent2
agent2
liumiaocn:~ liumiao$
```

此时再确认Consul集群节点的状态，可以看到此节点的状态为failed

```sh
liumiaocn:~ liumiao$ docker exec -t agent1 consul members
Node          Address          Status  Type    Build  Protocol  DC   Segment
bed6136ca254  172.17.0.3:8301  alive   server  1.7.1  2         dc1  <all>
c40fc4bcf34d  172.17.0.4:8301  failed  server  1.7.1  2         dc1  <all>
e487800cf9c2  172.17.0.5:8301  alive   server  1.7.1  2         dc1  <all>
liumiaocn:~ liumiao$ 
```

稍等片刻状态则变为left,当然使用docker logs能看到更加具体的日志信息。

```sh
liumiaocn:~ liumiao$ docker exec -t agent1 consul members
Node          Address          Status  Type    Build  Protocol  DC   Segment
bed6136ca254  172.17.0.3:8301  alive   server  1.7.1  2         dc1  <all>
c40fc4bcf34d  172.17.0.4:8301  left    server  1.7.1  2         dc1  <all>
e487800cf9c2  172.17.0.5:8301  alive   server  1.7.1  2         dc1  <all>
liumiaocn:~ liumiao$ 
```

当然此时也可以通过web UI来确认当前Consul集群的各节点的状态，详细如下图所示

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有

> 来源：https://blog.csdn.net/liumiaocn/category_9752887.html
