# 11、Consul：官方镜像使用说明
- 来源：https://ddkk.com/zhuanlan/registered/consul/d-1/11.html
- 分类：注册中心
- 分组：Consul 教程（版本 A）
这篇文章介绍一下Consul的官方镜像的使用方法。

## 镜像拉取

以1.7.1为例，可以使用如下命令进行官方镜像的拉取。

> 执行命令：docker pull consul:1.7.1

```sh
liumiaocn:~ liumiao$ docker images |grep consul
consul                                          1.7.1                           7f2bcf61cdf1        9 days ago          116MB
liumiaocn:~ liumiao$
```

## Dockerfile

以1.7.1为例，官方镜像的Dockerfile链接为：[Dockerfile](https://github.com/hashicorp/docker-consul/blob/6de10a87fa9bc8b881047d543a5c6567e0c7ec5c/0.X/Dockerfile)

可以确认的内容如下：

- 基础镜像使用Alpine：FROM alpine:3.9
- 环境变量明示地设定了如下几个：

ENV CONSUL_VERSION=1.7.1

ENV HASHICORP_RELEASES=https://releases.hashicorp.com
- 提供了不同类型的二进制版本，比如arm64、x86（32位）和x86（64位）等
- EXPOSE的端口主要如下：

8300: 用于Client和Server之间的通信

8301、8302: 用于LAN GOSIP 和WAN GOSIP方式的通信

8500、8600: 用于HTTP或者DNS方式的用户交互
- 缺省方式启动使用开发模式，生产环境需要注意不要直接使用：CMD [“agent”, “-dev”, “-client”, “0.0.0.0”]
- 挂载卷：使用VOLUME声明的可用于挂载的卷为/consul/data，主要用于Consul的数据的存储。
- 配置目录：在Dockerfile中创建了/consul/config，结合官方镜像的说明可以看到，此目录用于Consul的配置，虽然在Dockerfile中没有使用VOLUME进行声明，用户可以直接将配置文件与此目录进行挂载关联，另外还可以通过CONSUL_LOCAL_CONFIG环境变量进行修改。
- 其他环境变量：在Dockerfile中使用ENV声明和设定的环境变量只有VERSION和RELEASES两个，但是除此之外还有Consul自身的环境变量，比如：CONSUL_LOCAL_CONFIG、CONSUL_CLIENT_INTERFACE和CONSUL_BIND_INTERFACE等。

## 启动服务

执行如下命令即可启动Consul服务

> docker run -d --name=dev-consul -e CONSUL_BIND_INTERFACE=eth0 consul

```sh
liumiaocn:~ liumiao$ docker run -d --name=dev-consul -e CONSUL_BIND_INTERFACE=eth0 consul
6e9e999be7b0c7825d62efb30dfa62d7f5b3cd4c43e3c476807ca3df3e6384e7
liumiaocn:~ liumiao$ docker ps |grep consul
6e9e999be7b0        consul                                         "docker-entrypoint.s…"   6 seconds ago       Up 4 seconds        8300-8302/tcp, 8500/tcp, 8301-8302/udp, 8600/tcp, 8600/udp   dev-consul
liumiaocn:~ liumiao$ 
```

从日志中可以看到Consul的启动的详细信息

```sh
liumiaocn:~ liumiao$ docker logs dev-consul
==> Found address '172.17.0.3' for interface 'eth0', setting bind option...
==> Starting Consul agent...
           Version: 'v1.7.1'
           Node ID: '5dab51ac-5463-e398-3c9b-0b177538b823'
         Node name: '6e9e999be7b0'
        Datacenter: 'dc1' (Segment: '<all>')
            Server: true (Bootstrap: false)
       Client Addr: [0.0.0.0] (HTTP: 8500, HTTPS: -1, gRPC: 8502, DNS: 8600)
      Cluster Addr: 172.17.0.3 (LAN: 8301, WAN: 8302)
           Encrypt: Gossip: false, TLS-Outgoing: false, TLS-Incoming: false, Auto-Encrypt-TLS: false
==> Log data will now stream in as it occurs:
    2021-03-01T22:51:51.640Z [DEBUG] agent: Using random ID as node ID: id=5dab51ac-5463-e398-3c9b-0b177538b823
    2021-03-01T22:51:51.641Z [DEBUG] agent.tlsutil: Update: version=1
    2021-03-01T22:51:51.642Z [DEBUG] agent.tlsutil: OutgoingRPCWrapper: version=1
    2021-03-01T22:51:51.642Z [INFO]  agent.server.raft: initial configuration: index=1 servers="[{Suffrage:Voter ID:5dab51ac-5463-e398-3c9b-0b177538b823 Address:172.17.0.3:8300}]"
    2021-03-01T22:51:51.642Z [INFO]  agent.server.raft: entering follower state: follower="Node at 172.17.0.3:8300 [Follower]" leader=
    2021-03-01T22:51:51.643Z [INFO]  agent.server.serf.wan: serf: EventMemberJoin: 6e9e999be7b0.dc1 172.17.0.3
    2021-03-01T22:51:51.644Z [INFO]  agent.server.serf.lan: serf: EventMemberJoin: 6e9e999be7b0 172.17.0.3
    2021-03-01T22:51:51.644Z [INFO]  agent.server: Handled event for server in area: event=member-join server=6e9e999be7b0.dc1 area=wan
    2021-03-01T22:51:51.644Z [INFO]  agent.server: Adding LAN server: server="6e9e999be7b0 (Addr: tcp/172.17.0.3:8300) (DC: dc1)"
    2021-03-01T22:51:51.645Z [INFO]  agent: Started DNS server: address=0.0.0.0:8600 network=tcp
    2021-03-01T22:51:51.645Z [INFO]  agent: Started DNS server: address=0.0.0.0:8600 network=udp
    2021-03-01T22:51:51.645Z [INFO]  agent: Started HTTP server: address=[::]:8500 network=tcp
    2021-03-01T22:51:51.645Z [INFO]  agent: Started gRPC server: address=[::]:8502 network=tcp
    2021-03-01T22:51:51.645Z [INFO]  agent: started state syncer
==> Consul agent running!
    2021-03-01T22:51:51.714Z [WARN]  agent.server.raft: heartbeat timeout reached, starting election: last-leader=
    2021-03-01T22:51:51.714Z [INFO]  agent.server.raft: entering candidate state: node="Node at 172.17.0.3:8300 [Candidate]" term=2
    2021-03-01T22:51:51.714Z [DEBUG] agent.server.raft: votes: needed=1
    2021-03-01T22:51:51.714Z [DEBUG] agent.server.raft: vote granted: from=5dab51ac-5463-e398-3c9b-0b177538b823 term=2 tally=1
    2021-03-01T22:51:51.714Z [INFO]  agent.server.raft: election won: tally=1
    2021-03-01T22:51:51.714Z [INFO]  agent.server.raft: entering leader state: leader="Node at 172.17.0.3:8300 [Leader]"
    2021-03-01T22:51:51.715Z [INFO]  agent.server: cluster leadership acquired
    2021-03-01T22:51:51.715Z [INFO]  agent.server: New leader elected: payload=6e9e999be7b0
    2021-03-01T22:51:51.718Z [DEBUG] connect.ca.consul: consul CA provider configured: id=07:80:c8:de:f6:41:86:29:8f:9c:b8:17:d6:48:c2:d5:c5:5c:7f:0c:03:f7:cf:97:5a:a7:c1:68:aa:23:ae:81 is_primary=true
    2021-03-01T22:51:51.729Z [INFO]  agent.server.connect: initialized primary datacenter CA with provider: provider=consul
    2021-03-01T22:51:51.729Z [INFO]  agent.leader: started routine: routine="CA root pruning"
    2021-03-01T22:51:51.729Z [DEBUG] agent.server: Skipping self join check for node since the cluster is too small: node=6e9e999be7b0
    2021-03-01T22:51:51.729Z [INFO]  agent.server: member joined, marking health alive: member=6e9e999be7b0
    2021-03-01T22:51:51.890Z [DEBUG] agent: Skipping remote check since it is managed automatically: check=serfHealth
    2021-03-01T22:51:51.892Z [INFO]  agent: Synced node info
    2021-03-01T22:51:53.154Z [DEBUG] agent: Skipping remote check since it is managed automatically: check=serfHealth
    2021-03-01T22:51:53.154Z [DEBUG] agent: Node info in sync
    2021-03-01T22:51:53.154Z [DEBUG] agent: Node info in sync
    2021-03-01T22:51:53.719Z [DEBUG] agent.tlsutil: OutgoingRPCWrapper: version=1
liumiaocn:~ liumiao$ 
```

缺省方式将所有的信息没有做持久化保存，但是非常容易使用，比如将启动的8500端口映射出来，即可通过8500访问web UI界面了

> 执行命令：docker run -d --name=dev-consul -p 8500:8500 -e CONSUL_BIND_INTERFACE=eth0 consul

进入到容器中确认Consul信息

```sh
liumiaocn:~ liumiao$ docker exec -it dev-consul sh
/ consul members
Node          Address          Status  Type    Build  Protocol  DC   Segment
fce21704e8a1  172.17.0.3:8301  alive   server  1.7.1  2         dc1  <all>
/ 
```

## 参考内容

https://hub.docker.com/_/consul?tab=description

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有

> 来源：https://blog.csdn.net/liumiaocn/category_9752887.html
