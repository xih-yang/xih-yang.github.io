# 07、Consul：Connect使用示例(自动sideCar代理)
- 来源：https://ddkk.com/zhuanlan/registered/consul/d-1/7.html
- 分类：注册中心
- 分组：Consul 教程（版本 A）
微服务架构的实施会遇到基础架构的困难，从传统的基于节点的网络基础框架到基于服务的动态基础框架是微服务框架所需要解决的问题。Consul在1.2的时候推出了Connection的功能，在这篇文章中结合一个具体的例子来看一下Consul在服务网格的架构下能够做些什么。

## 服务网格 & Consul

服务网格（Service Mesh）为微服务的实施提供了一种高可用的分布式解决方案，相较于传统依托与主机的网络安全机制，服务网格能够适应基于服务的这样的一种动态的需求，主要通过如下几个关键因素进行管理：

- 服务发现：不同的服务之间必须能够相互识别和发现
- 服务配置：需要能够通过统一的方式进行动态的配置
- 服务安全：服务之间的通信必须是安全的，需要进行授权和加密

Consul整体上使用HTTP API和DNS协议方式的服务发现，使用Consul KV进行配置的存储，使用Connect解决了服务间通信的安全问题，提供了基于Consul的服务网格的解决方案。
- Consul Connect

在Consul 1.2推出了Connect功能，可以通过自动TLS加密提供服务间的安全通信。

## Consul Connect使用示例

在这篇文章中，我们将继续通过具体的实例来介绍Consul Connect的使用，使用如下步骤进行。

## 使用socat启动一个用于验证的服务

可以使用socat，也可以使用其他的任何服务均可，只要可以验证操作即可，执行如下命令在8181端口提供一个基于socat的可以进行结果回显的服务。

> 执行命令：socat -v tcp-l:8181,fork exec:"/bin/cat"

结果确认，使用nc连接8181端口，并随意输入内容，在8181端口提供的TCP的回显的socat服务会将输入的内容返回给nc，nc侧执行结果如下所示：

```sh
liumiaocn:~ liumiao$ nc localhost 8181
hello, this is greetings from liumiao
hello, this is greetings from liumiao
```

socat端的服务由于使用了-v参数，也会显示如下内容

```sh
liumiaocn:~ liumiao$ socat -v tcp-l:8181,fork exec:"/bin/cat"
> 2021/03/01 16:58:58.069067  length=38 from=0 to=37
hello, this is greetings from liumiao
< 2021/03/01 16:58:58.069554  length=38 from=0 to=37
hello, this is greetings from liumiao
```

## 启动Consul并注册服务

## 事前准备：服务定义

```sh
liumiaocn:consul.d liumiao$ ls
socat.json
liumiaocn:consul.d liumiao$ cat socat.json 
{
    "service":{
        "name":"socat",
        "port":8181,
        "connect":{
            "sidecar_service":{
            }
        }
    }
}
liumiaocn:consul.d liumiao$ 
```

## 启动Consul并加载服务

使用如下命令启动Consul并加载服务

> 执行命令：consul agent -dev -enable-script-checks -config-dir=.

注：如果已经启动服务，可以将上述json文件放置与config-dir指定的目录中，使用consul reload命令或者想Consul进程发送SIGHUP信号达到同样目的。

```sh
lliumiaocn:consul.d liumiao$ consul agent -dev -enable-script-checks -config-dir=.
==> Starting Consul agent...
           Version: 'v1.7.1'
           Node ID: '3178223e-a4eb-a627-9e5f-ac37368b923d'
         Node name: 'liumiaocn'
        Datacenter: 'dc1' (Segment: '<all>')
            Server: true (Bootstrap: false)
       Client Addr: [127.0.0.1] (HTTP: 8500, HTTPS: -1, gRPC: 8502, DNS: 8600)
      Cluster Addr: 127.0.0.1 (LAN: 8301, WAN: 8302)
           Encrypt: Gossip: false, TLS-Outgoing: false, TLS-Incoming: false, Auto-Encrypt-TLS: false
==> Log data will now stream in as it occurs:
    2021-03-01T16:59:45.969+0800 [DEBUG] agent: Using random ID as node ID: id=3178223e-a4eb-a627-9e5f-ac37368b923d
    2021-03-01T16:59:45.969+0800 [DEBUG] agent.tlsutil: Update: version=1
    2021-03-01T16:59:45.970+0800 [DEBUG] agent.tlsutil: OutgoingRPCWrapper: version=1
    2021-03-01T16:59:45.970+0800 [INFO]  agent.server.raft: initial configuration: index=1 servers="[{Suffrage:Voter ID:3178223e-a4eb-a627-9e5f-ac37368b923d Address:127.0.0.1:8300}]"
    2021-03-01T16:59:45.970+0800 [INFO]  agent.server.raft: entering follower state: follower="Node at 127.0.0.1:8300 [Follower]" leader=
    2021-03-01T16:59:45.970+0800 [INFO]  agent.server.serf.wan: serf: EventMemberJoin: liumiaocn.dc1 127.0.0.1
    2021-03-01T16:59:45.971+0800 [INFO]  agent.server.serf.lan: serf: EventMemberJoin: liumiaocn 127.0.0.1
    2021-03-01T16:59:45.971+0800 [INFO]  agent.server: Adding LAN server: server="liumiaocn (Addr: tcp/127.0.0.1:8300) (DC: dc1)"
    2021-03-01T16:59:45.971+0800 [INFO]  agent.server: Handled event for server in area: event=member-join server=liumiaocn.dc1 area=wan
    2021-03-01T16:59:45.971+0800 [INFO]  agent: Started DNS server: address=127.0.0.1:8600 network=tcp
    2021-03-01T16:59:45.971+0800 [INFO]  agent: Started DNS server: address=127.0.0.1:8600 network=udp
    2021-03-01T16:59:45.971+0800 [INFO]  agent: Started HTTP server: address=127.0.0.1:8500 network=tcp
    2021-03-01T16:59:45.972+0800 [INFO]  agent: Started gRPC server: address=127.0.0.1:8502 network=tcp
    2021-03-01T16:59:45.972+0800 [INFO]  agent: started state syncer
==> Consul agent running!
    2021-03-01T16:59:46.036+0800 [WARN]  agent.server.raft: heartbeat timeout reached, starting election: last-leader=
    2021-03-01T16:59:46.036+0800 [INFO]  agent.server.raft: entering candidate state: node="Node at 127.0.0.1:8300 [Candidate]" term=2
    2021-03-01T16:59:46.036+0800 [DEBUG] agent.server.raft: votes: needed=1
    2021-03-01T16:59:46.036+0800 [DEBUG] agent.server.raft: vote granted: from=3178223e-a4eb-a627-9e5f-ac37368b923d term=2 tally=1
    2021-03-01T16:59:46.036+0800 [INFO]  agent.server.raft: election won: tally=1
    2021-03-01T16:59:46.036+0800 [INFO]  agent.server.raft: entering leader state: leader="Node at 127.0.0.1:8300 [Leader]"
    2021-03-01T16:59:46.036+0800 [INFO]  agent.server: cluster leadership acquired
    2021-03-01T16:59:46.036+0800 [INFO]  agent.server: New leader elected: payload=liumiaocn
    2021-03-01T16:59:46.037+0800 [DEBUG] connect.ca.consul: consul CA provider configured: id=07:80:c8:de:f6:41:86:29:8f:9c:b8:17:d6:48:c2:d5:c5:5c:7f:0c:03:f7:cf:97:5a:a7:c1:68:aa:23:ae:81 is_primary=true
    2021-03-01T16:59:46.049+0800 [INFO]  agent.server.connect: initialized primary datacenter CA with provider: provider=consul
    2021-03-01T16:59:46.049+0800 [INFO]  agent.leader: started routine: routine="CA root pruning"
    2021-03-01T16:59:46.049+0800 [DEBUG] agent.server: Skipping self join check for node since the cluster is too small: node=liumiaocn
    2021-03-01T16:59:46.049+0800 [INFO]  agent.server: member joined, marking health alive: member=liumiaocn
    2021-03-01T16:59:46.170+0800 [DEBUG] agent: Skipping remote check since it is managed automatically: check=serfHealth
    2021-03-01T16:59:46.170+0800 [INFO]  agent: Synced node info
    2021-03-01T16:59:46.170+0800 [INFO]  agent: Synced service: service=socat
    2021-03-01T16:59:46.171+0800 [INFO]  agent: Synced service: service=socat-sidecar-proxy
    2021-03-01T16:59:46.171+0800 [DEBUG] agent: Check in sync: check=service:socat-sidecar-proxy:1
    2021-03-01T16:59:46.171+0800 [DEBUG] agent: Check in sync: check=service:socat-sidecar-proxy:2
    2021-03-01T16:59:46.284+0800 [WARN]  agent: Check socket connection failed: check=service:socat-sidecar-proxy:1 error="dial tcp 127.0.0.1:21000: connect: connection refused"
    2021-03-01T16:59:46.284+0800 [WARN]  agent: Check is now critical: check=service:socat-sidecar-proxy:1
    2021-03-01T16:59:47.156+0800 [DEBUG] agent: Skipping remote check since it is managed automatically: check=serfHealth
    2021-03-01T16:59:47.156+0800 [DEBUG] agent: Node info in sync
    2021-03-01T16:59:47.156+0800 [DEBUG] agent: Service in sync: service=socat-sidecar-proxy
    2021-03-01T16:59:47.156+0800 [DEBUG] agent: Service in sync: service=socat
    2021-03-01T16:59:47.156+0800 [DEBUG] agent: Check in sync: check=service:socat-sidecar-proxy:1
    2021-03-01T16:59:47.156+0800 [DEBUG] agent: Check in sync: check=service:socat-sidecar-proxy:2
    2021-03-01T16:59:47.156+0800 [DEBUG] agent: Node info in sync
    2021-03-01T16:59:47.156+0800 [DEBUG] agent: Service in sync: service=socat
    2021-03-01T16:59:47.156+0800 [DEBUG] agent: Service in sync: service=socat-sidecar-proxy
    2021-03-01T16:59:47.156+0800 [DEBUG] agent: Check in sync: check=service:socat-sidecar-proxy:1
    2021-03-01T16:59:47.156+0800 [DEBUG] agent: Check in sync: check=service:socat-sidecar-proxy:2
    2021-03-01T16:59:48.042+0800 [DEBUG] agent.tlsutil: OutgoingRPCWrapper: version=1
    2021-03-01T16:59:56.289+0800 [WARN]  agent: Check socket connection failed: check=service:socat-sidecar-proxy:1 error="dial tcp 127.0.0.1:21000: connect: connection refused"
    2021-03-01T16:59:56.289+0800 [WARN]  agent: Check is now critical: check=service:socat-sidecar-proxy:1
    2021-03-01T17:00:06.291+0800 [WARN]  agent: Check socket connection failed: check=service:socat-sidecar-proxy:1 error="dial tcp 127.0.0.1:21000: connect: connection refused"
```

由于尚未进行连接，日志中出现了Warning信息提示

## 执行连接

执行如下命令进行连接

> 执行命令：consul connect proxy -sidecar-for socat

执行日志示例如下所示：

```sh
liumiaocn:~ liumiao$ consul connect proxy -sidecar-for socat
==> Consul Connect proxy starting...
    Configuration mode: Agent API
        Sidecar for ID: socat
              Proxy ID: socat-sidecar-proxy
==> Log data will now stream in as it occurs:
    2021-03-01T17:01:09.577+0800 [INFO]  proxy: Proxy loaded config and ready to serve
    2021-03-01T17:01:09.577+0800 [INFO]  proxy: Parsed TLS identity: uri=spiffe://1e49513d-16ec-1ce8-70ef-08429872feeb.consul/ns/default/dc/dc1/svc/socat roots=[pri-i8njcplx.consul.ca.1e49513d.consul]
    2021-03-01T17:01:09.577+0800 [INFO]  proxy: Starting listener: listener="public listener" bind_addr=0.0.0.0:21000
```

此时refused的错误信息就不再出现了

```sh
    2021-03-01T17:01:09.564+0800 [DEBUG] agent.http: Request finished: method=GET url=/v1/agent/services from=127.0.0.1:54084 latency=695.884µs
    2021-03-01T17:01:09.565+0800 [DEBUG] agent.http: Request finished: method=GET url=/v1/agent/service/socat-sidecar-proxy from=127.0.0.1:54084 latency=101.405µs
    2021-03-01T17:01:09.567+0800 [DEBUG] agent.http: Request finished: method=GET url=/v1/agent/connect/ca/roots from=127.0.0.1:54086 latency=1.261811ms
    2021-03-01T17:01:09.567+0800 [DEBUG] agent.http: Request finished: method=GET url=/v1/agent/connect/ca/leaf/socat from=127.0.0.1:54085 latency=1.288009ms
    2021-03-01T17:01:16.308+0800 [DEBUG] agent: Check status updated: check=service:socat-sidecar-proxy:1 status=passing
    2021-03-01T17:01:16.308+0800 [DEBUG] agent: Node info in sync
    2021-03-01T17:01:16.308+0800 [DEBUG] agent: Service in sync: service=socat
    2021-03-01T17:01:16.308+0800 [DEBUG] agent: Service in sync: service=socat-sidecar-proxy
    2021-03-01T17:01:16.308+0800 [INFO]  agent: Synced check: check=service:socat-sidecar-proxy:1
    2021-03-01T17:01:16.308+0800 [DEBUG] agent: Check in sync: check=service:socat-sidecar-proxy:2
```

## 创建upstream

执行如下命令，将socat服务通过proxy在9191端口进行服务

> 执行命令：consul connect proxy -service web -upstream socat:9191

```sh
liumiaocn:consul.d liumiao$ consul connect proxy -service web -upstream socat:9191
==> Consul Connect proxy starting...
    Configuration mode: Flags
               Service: web
              Upstream: socat => :9191
       Public listener: Disabled
==> Log data will now stream in as it occurs:
    2021-03-01T17:02:26.838+0800 [INFO]  proxy: Starting listener: listener=127.0.0.1:9191->service:default/socat bind_addr=127.0.0.1:9191
    2021-03-01T17:02:26.849+0800 [INFO]  proxy: Proxy loaded config and ready to serve
    2021-03-01T17:02:26.849+0800 [INFO]  proxy: Parsed TLS identity: uri=spiffe://1e49513d-16ec-1ce8-70ef-08429872feeb.consul/ns/default/dc/dc1/svc/web roots=[pri-i8njcplx.consul.ca.1e49513d.consul]
```

## 结果确认

这样在8181端口直接提供的socat服务，通过Consul Connect创建了9191端口的服务，我们可以通过nc直接对9191确认socat的回显服务

```sh
liumiaocn:consul.d liumiao$ nc localhost 9191
hello, this is greetings from proxy from port 9191
hello, this is greetings from proxy from port 9191
```

而在socat服务端也可以看到相应的连接信息

```sh
liumiaocn:~ liumiao$ socat -v tcp-l:8181,fork exec:"/bin/cat"
> 2021/03/01 16:58:58.069067  length=38 from=0 to=37
hello, this is greetings from liumiao
< 2021/03/01 16:58:58.069554  length=38 from=0 to=37
hello, this is greetings from liumiao
> 2021/03/01 17:03:00.037260  length=51 from=0 to=50
hello, this is greetings from proxy from port 9191
< 2021/03/01 17:03:00.037753  length=51 from=0 to=50
hello, this is greetings from proxy from port 9191
```

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有

> 来源：https://blog.csdn.net/liumiaocn/category_9752887.html
