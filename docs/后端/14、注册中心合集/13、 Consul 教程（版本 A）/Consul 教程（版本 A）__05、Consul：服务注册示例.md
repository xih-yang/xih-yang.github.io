# 05、Consul：服务注册示例
- 来源：https://ddkk.com/zhuanlan/registered/consul/d-1/5.html
- 分类：注册中心
- 分组：Consul 教程（版本 A）
这篇文章结合具体的示例来介绍如何在Consul中进行服务的注册。

## 事前准备

## Consul安装

本文示例使用的Consul版本信息如下

```sh
liumiaocn:~ liumiao$ consul --version
Consul v1.7.1
Protocol 2 spoken by default, understands 2 to 3 (agent will automatically use protocol >2 when speaking to compatible agents)
liumiaocn:~ liumiao$ 
```

## 服务定义

使用服务定义只最为通用的服务注册的方式，在Consul中也可以通过HTTP API方式进行，在本文中直接使用Consul配置方式，通过-config-dir选项指定配置文件所在的目录，在启动时会讲指定目录下服务定义文件全部读入并进行注册。

本文示例中使用如下两个服务定义在Consul启动时进行注册：

```sh
liumiaocn:consul.d liumiao$ ls
service-nginx.json	service-tornado.json
liumiaocn:consul.d liumiao$ cat service-nginx.json 
{
	"service": {
		"name": "nginx",
		"tags": ["nginx-tag"],
		"port": 80
	}
}
liumiaocn:consul.d liumiao$ 
liumiaocn:consul.d liumiao$ cat service-tornado.json 
{
	"service": {
		"name": "tornado",
		"tags": ["tornado-tag"],
		"port": 8080
	}
}
liumiaocn:consul.d liumiao$ 
```

服务定义文件名称
服务名称
tag信息
端口信息

service-nginx.json
nginx
nginx-tag
80

service-tornado.json
tornado
tornado-tag
8080

## 启动Consul服务

使用开发模式启动Consul服务，并指定配置文件所在的目录（本例中使用当前目录）

> 执行命令：consul agent -dev -enable-script-checks -config-dir=.

注意事项：注意enable-script-checks选项中可能会有一定的安全隐患，某些设定可能引入远程执行的漏洞从而被恶意软件所利用，在生产环境中官方建议使用enable-local-script-checks选项进行替代。

启动日志如下所示：

```sh
liumiaocn:consul.d liumiao$ ls
service-nginx.json	service-tornado.json
liumiaocn:consul.d liumiao$ consul agent -dev -enable-script-checks -config-dir=.
==> Starting Consul agent...
           Version: 'v1.7.1'
           Node ID: '714da227-6852-8f47-4734-acfd64f09dee'
         Node name: 'liumiaocn'
        Datacenter: 'dc1' (Segment: '<all>')
            Server: true (Bootstrap: false)
       Client Addr: [127.0.0.1] (HTTP: 8500, HTTPS: -1, gRPC: 8502, DNS: 8600)
      Cluster Addr: 127.0.0.1 (LAN: 8301, WAN: 8302)
           Encrypt: Gossip: false, TLS-Outgoing: false, TLS-Incoming: false, Auto-Encrypt-TLS: false
==> Log data will now stream in as it occurs:
    2021-02-29T11:52:46.162+0800 [DEBUG] agent: Using random ID as node ID: id=714da227-6852-8f47-4734-acfd64f09dee
    2021-02-29T11:52:46.163+0800 [DEBUG] agent.tlsutil: Update: version=1
    2021-02-29T11:52:46.163+0800 [DEBUG] agent.tlsutil: OutgoingRPCWrapper: version=1
    2021-02-29T11:52:46.164+0800 [INFO]  agent.server.raft: initial configuration: index=1 servers="[{Suffrage:Voter ID:714da227-6852-8f47-4734-acfd64f09dee Address:127.0.0.1:8300}]"
    2021-02-29T11:52:46.164+0800 [INFO]  agent.server.raft: entering follower state: follower="Node at 127.0.0.1:8300 [Follower]" leader=
    2021-02-29T11:52:46.164+0800 [INFO]  agent.server.serf.wan: serf: EventMemberJoin: liumiaocn.dc1 127.0.0.1
    2021-02-29T11:52:46.165+0800 [INFO]  agent.server.serf.lan: serf: EventMemberJoin: liumiaocn 127.0.0.1
    2021-02-29T11:52:46.165+0800 [INFO]  agent.server: Adding LAN server: server="liumiaocn (Addr: tcp/127.0.0.1:8300) (DC: dc1)"
    2021-02-29T11:52:46.165+0800 [INFO]  agent.server: Handled event for server in area: event=member-join server=liumiaocn.dc1 area=wan
    2021-02-29T11:52:46.165+0800 [INFO]  agent: Started DNS server: address=127.0.0.1:8600 network=tcp
    2021-02-29T11:52:46.165+0800 [INFO]  agent: Started DNS server: address=127.0.0.1:8600 network=udp
    2021-02-29T11:52:46.165+0800 [INFO]  agent: Started HTTP server: address=127.0.0.1:8500 network=tcp
    2021-02-29T11:52:46.165+0800 [INFO]  agent: Started gRPC server: address=127.0.0.1:8502 network=tcp
    2021-02-29T11:52:46.165+0800 [INFO]  agent: started state syncer
==> Consul agent running!
    2021-02-29T11:52:46.218+0800 [WARN]  agent.server.raft: heartbeat timeout reached, starting election: last-leader=
    2021-02-29T11:52:46.218+0800 [INFO]  agent.server.raft: entering candidate state: node="Node at 127.0.0.1:8300 [Candidate]" term=2
    2021-02-29T11:52:46.218+0800 [DEBUG] agent.server.raft: votes: needed=1
    2021-02-29T11:52:46.218+0800 [DEBUG] agent.server.raft: vote granted: from=714da227-6852-8f47-4734-acfd64f09dee term=2 tally=1
    2021-02-29T11:52:46.218+0800 [INFO]  agent.server.raft: election won: tally=1
    2021-02-29T11:52:46.218+0800 [INFO]  agent.server.raft: entering leader state: leader="Node at 127.0.0.1:8300 [Leader]"
    2021-02-29T11:52:46.218+0800 [INFO]  agent.server: cluster leadership acquired
    2021-02-29T11:52:46.218+0800 [INFO]  agent.server: New leader elected: payload=liumiaocn
    2021-02-29T11:52:46.222+0800 [DEBUG] connect.ca.consul: consul CA provider configured: id=07:80:c8:de:f6:41:86:29:8f:9c:b8:17:d6:48:c2:d5:c5:5c:7f:0c:03:f7:cf:97:5a:a7:c1:68:aa:23:ae:81 is_primary=true
    2021-02-29T11:52:46.235+0800 [INFO]  agent.server.connect: initialized primary datacenter CA with provider: provider=consul
    2021-02-29T11:52:46.235+0800 [INFO]  agent.leader: started routine: routine="CA root pruning"
    2021-02-29T11:52:46.235+0800 [DEBUG] agent.server: Skipping self join check for node since the cluster is too small: node=liumiaocn
    2021-02-29T11:52:46.235+0800 [INFO]  agent.server: member joined, marking health alive: member=liumiaocn
    2021-02-29T11:52:46.308+0800 [DEBUG] agent: Skipping remote check since it is managed automatically: check=serfHealth
    2021-02-29T11:52:46.308+0800 [INFO]  agent: Synced node info
    2021-02-29T11:52:46.309+0800 [INFO]  agent: Synced service: service=nginx
    2021-02-29T11:52:46.309+0800 [INFO]  agent: Synced service: service=tornado
    2021-02-29T11:52:48.224+0800 [DEBUG] agent.tlsutil: OutgoingRPCWrapper: version=1
    2021-02-29T11:52:48.751+0800 [DEBUG] agent: Skipping remote check since it is managed automatically: check=serfHealth
    2021-02-29T11:52:48.751+0800 [DEBUG] agent: Node info in sync
    2021-02-29T11:52:48.751+0800 [DEBUG] agent: Service in sync: service=tornado
    2021-02-29T11:52:48.751+0800 [DEBUG] agent: Service in sync: service=nginx
    2021-02-29T11:52:48.751+0800 [DEBUG] agent: Node info in sync
    2021-02-29T11:52:48.751+0800 [DEBUG] agent: Service in sync: service=nginx
    2021-02-29T11:52:48.751+0800 [DEBUG] agent: Service in sync: service=tornado
```

从日志信息中我们可以看到如下内容，可以看到Synced service: service=nginx和Synced service: service=tornado的提示信息，这些就是Consul在加载指定配置目录下的服务定义文件的输出信息。

```sh
    2021-02-29T11:52:46.308+0800 [INFO]  agent: Synced node info
    2021-02-29T11:52:46.309+0800 [INFO]  agent: Synced service: service=nginx
    2021-02-29T11:52:46.309+0800 [INFO]  agent: Synced service: service=tornado
    ... 省略
    2021-02-29T11:52:48.751+0800 [DEBUG] agent: Node info in sync
    2021-02-29T11:52:48.751+0800 [DEBUG] agent: Service in sync: service=tornado
    2021-02-29T11:52:48.751+0800 [DEBUG] agent: Service in sync: service=nginx
    2021-02-29T11:52:48.751+0800 [DEBUG] agent: Node info in sync
    2021-02-29T11:52:48.751+0800 [DEBUG] agent: Service in sync: service=nginx
    2021-02-29T11:52:48.751+0800 [DEBUG] agent: Service in sync: service=tornado
```

## 结果确认

从Consul的web UI也能很清楚地进行结果的确认

nginx服务的详细信息

tornado服务的详细信息

注意：本文示例中注册的服务还尚未启动，我们并没有事前在80端口启动一个nginx服务，在8080端口启动一个tornado服务，在Consul中可以注册尚未启动和运行的服务。

## 参考内容

https://learn.hashicorp.com/consul/getting-started/services?utm_source=consul.io&utm_medium=docs

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有

> 来源：https://blog.csdn.net/liumiaocn/category_9752887.html
