# 04、Consul：可视化UI界面
- 来源：https://ddkk.com/zhuanlan/registered/consul/d-1/4.html
- 分类：注册中心
- 分组：Consul 教程（版本 A）
Consul本身提供了一个可视化的UI界面，这篇文章对此进行简单介绍。

## Consul web UI

Consul的web UI提供了一个用户与Consul进行图形化交互的接口，在用户使用的时候降低了入门的门槛，在故障诊断的时候也更加方便。

在生产环境中运行Consul，如果需要启动Consul的UI配置需要使用-ui选项，但是在开发模式中可以直接使用，这也是前面的文章中我们提到的为何开发模式不建议在生产中使用，但是入手时建议使用的原因，可以免去配置直接体验Consul的功能，在选型验证的时候更加方便。

## 事前准备

本文示例使用的Consul版本信息如下

```sh
liumiaocn:~ liumiao$ consul --version
Consul v1.7.1
Protocol 2 spoken by default, understands 2 to 3 (agent will automatically use protocol >2 when speaking to compatible agents)
liumiaocn:~ liumiao$ 
```

以开发模式启动Consul服务

```sh
liumiaocn:~ liumiao$ consul agent -dev
==> Starting Consul agent...
           Version: 'v1.7.1'
           Node ID: 'd9f2a680-02ae-1369-c005-dc3f55a8d683'
         Node name: 'liumiaocn'
        Datacenter: 'dc1' (Segment: '<all>')
            Server: true (Bootstrap: false)
       Client Addr: [127.0.0.1] (HTTP: 8500, HTTPS: -1, gRPC: 8502, DNS: 8600)
      Cluster Addr: 127.0.0.1 (LAN: 8301, WAN: 8302)
           Encrypt: Gossip: false, TLS-Outgoing: false, TLS-Incoming: false, Auto-Encrypt-TLS: false
...省略
```

本地没有环境的话也可以直接使用Consul提供的demo界面进行查看：[Consul web UI](https://demo.consul.io/ui/dc1/nodes)

## UI界面

## 访问地址

缺省方式下，本地可以通过如下方式进行Consul web UI的访问

> 访问方式: http://localhost:8500/ui
>
> 或者
>
> 访问方式: http://localhost:8500

结合日志的输出也可以看到信息的获取是通过HTTP API方式进行的

```sh
    2021-02-29T08:28:45.007+0800 [DEBUG] agent.http: Request finished: method=GET url=/v1/catalog/datacenters from=127.0.0.1:55473 latency=603.233µs
    2021-02-29T08:28:45.012+0800 [DEBUG] agent.http: Request finished: method=GET url=/v1/catalog/datacenters from=127.0.0.1:55473 latency=187.085µs
    2021-02-29T08:28:45.050+0800 [DEBUG] agent.http: Request finished: method=GET url=/v1/catalog/datacenters from=127.0.0.1:55473 latency=239.929µs
    2021-02-29T08:28:45.054+0800 [DEBUG] agent.http: Request finished: method=GET url=/v1/internal/ui/services?dc=dc1 from=127.0.0.1:55473 latency=279.497µs
```

## Services

缺省方式下显示的服务页面，在这个页面中可以看到注册了的所有服务的信息，这些信息包括服务的健康状况、标签、类型和源

缺省情况下有一个名为consul的服务，这是自管理的典型做法，点击服务名称即可看到服务的详细信息，比如相应实例的信息：

路由信息

## Nodes

在Nodes页面可以确认整个数据中心相关的节点的概要信息，包括每个节点的健康状态，本文使用开发模式只有一个名为liumiaocn的Consul节点。

选择节点可以查看更加详细的信息，比如改节点的健康状况的信息

以及该节点上所注册的服务的信息等

## Key/Value

通过Key/Value页面可以在Consul中进行Consul KV的管理

这里我们创建一个Key/Value对，Consul的web UI界面支持多种方式

创建之后会看到Key/Value页面中已经有了一条信息了

可以点击确认此Key/Value对的信息，也可以通过如下命令来进行确认

```sh
liumiaocn:~ liumiao$ consul kv get username
liumiaocn
liumiaocn:~ liumiao$ 
```

## ACL

Consul使用访问控制列表ACL（Access Control Lists）来对UI、API、CLI以及服务通信进行安全上的保证，在生产环境中需要配置ACL来进行安全上的设定，而在开发模式下使用者可以看到如下的信息

## Intentions

可以通过此页面对Intention进行增删改查的操作。

## 总结

通过Consul提供的web UI，Consul主要可以提供如下图形化界面操作功能

功能页面名称
web UI提供的功能说明

Services
查询（R）

Nodes
查询（R）

Key/Value
增删改查（CRUD）

Intentions
增删改查（CRUD）

ACLs
增删改查（CRUD）

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有

> 来源：https://blog.csdn.net/liumiaocn/category_9752887.html
