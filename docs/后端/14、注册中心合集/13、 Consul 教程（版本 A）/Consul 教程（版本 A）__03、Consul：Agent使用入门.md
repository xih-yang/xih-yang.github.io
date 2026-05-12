# 03、Consul：Agent使用入门
- 来源：https://ddkk.com/zhuanlan/registered/consul/d-1/3.html
- 分类：注册中心
- 分组：Consul 教程（版本 A）
Consul使用起来非常简单，这篇文章继续以示例的方式介绍Consul Agent的使用方法。

## 事前准备

```sh
liumiaocn:~ liumiao$ consul --version
Consul v1.7.1
Protocol 2 spoken by default, understands 2 to 3 (agent will automatically use protocol >2 when speaking to compatible agents)
liumiaocn:~ liumiao$ 
```

## 启动Consul Agent

为了能够使用Consul，在安装之后需要启动Consul Agent。执行命令如下所示：

> 执行命令：consul agent -dev

```sh
liumiaocn:~ liumiao$ consul agent -dev
==> Starting Consul agent...
           Version: 'v1.7.1'
           Node ID: 'e95df364-000e-e590-6bd4-ceb947b8c90b'
         Node name: 'liumiaocn'
        Datacenter: 'dc1' (Segment: '<all>')
            Server: true (Bootstrap: false)
       Client Addr: [127.0.0.1] (HTTP: 8500, HTTPS: -1, gRPC: 8502, DNS: 8600)
      Cluster Addr: 127.0.0.1 (LAN: 8301, WAN: 8302)
           Encrypt: Gossip: false, TLS-Outgoing: false, TLS-Incoming: false, Auto-Encrypt-TLS: false
```

详细日志信息如下

```sh
==> Log data will now stream in as it occurs:
    2021-02-29T06:58:17.094+0800 [DEBUG] agent: Using random ID as node ID: id=e95df364-000e-e590-6bd4-ceb947b8c90b
    2021-02-29T06:58:17.094+0800 [DEBUG] agent.tlsutil: Update: version=1
    2021-02-29T06:58:17.095+0800 [DEBUG] agent.tlsutil: OutgoingRPCWrapper: version=1
    2021-02-29T06:58:17.096+0800 [INFO]  agent.server.raft: initial configuration: index=1 servers="[{Suffrage:Voter ID:e95df364-000e-e590-6bd4-ceb947b8c90b Address:127.0.0.1:8300}]"
    2021-02-29T06:58:17.096+0800 [INFO]  agent.server.raft: entering follower state: follower="Node at 127.0.0.1:8300 [Follower]" leader=
    2021-02-29T06:58:17.096+0800 [INFO]  agent.server.serf.wan: serf: EventMemberJoin: liumiaocn.dc1 127.0.0.1
    2021-02-29T06:58:17.096+0800 [INFO]  agent.server.serf.lan: serf: EventMemberJoin: liumiaocn 127.0.0.1
    2021-02-29T06:58:17.096+0800 [INFO]  agent.server: Adding LAN server: server="liumiaocn (Addr: tcp/127.0.0.1:8300) (DC: dc1)"
    2021-02-29T06:58:17.096+0800 [INFO]  agent.server: Handled event for server in area: event=member-join server=liumiaocn.dc1 area=wan
    2021-02-29T06:58:17.097+0800 [INFO]  agent: Started DNS server: address=127.0.0.1:8600 network=tcp
    2021-02-29T06:58:17.097+0800 [INFO]  agent: Started DNS server: address=127.0.0.1:8600 network=udp
    2021-02-29T06:58:17.097+0800 [INFO]  agent: Started HTTP server: address=127.0.0.1:8500 network=tcp
    2021-02-29T06:58:17.097+0800 [INFO]  agent: Started gRPC server: address=127.0.0.1:8502 network=tcp
    2021-02-29T06:58:17.097+0800 [INFO]  agent: started state syncer
==> Consul agent running!
    2021-02-29T06:58:17.161+0800 [WARN]  agent.server.raft: heartbeat timeout reached, starting election: last-leader=
    2021-02-29T06:58:17.161+0800 [INFO]  agent.server.raft: entering candidate state: node="Node at 127.0.0.1:8300 [Candidate]" term=2
    2021-02-29T06:58:17.161+0800 [DEBUG] agent.server.raft: votes: needed=1
    2021-02-29T06:58:17.161+0800 [DEBUG] agent.server.raft: vote granted: from=e95df364-000e-e590-6bd4-ceb947b8c90b term=2 tally=1
    2021-02-29T06:58:17.161+0800 [INFO]  agent.server.raft: election won: tally=1
    2021-02-29T06:58:17.161+0800 [INFO]  agent.server.raft: entering leader state: leader="Node at 127.0.0.1:8300 [Leader]"
    2021-02-29T06:58:17.161+0800 [INFO]  agent.server: cluster leadership acquired
    2021-02-29T06:58:17.162+0800 [INFO]  agent.server: New leader elected: payload=liumiaocn
    2021-02-29T06:58:17.162+0800 [DEBUG] connect.ca.consul: consul CA provider configured: id=07:80:c8:de:f6:41:86:29:8f:9c:b8:17:d6:48:c2:d5:c5:5c:7f:0c:03:f7:cf:97:5a:a7:c1:68:aa:23:ae:81 is_primary=true
    2021-02-29T06:58:17.173+0800 [INFO]  agent.server.connect: initialized primary datacenter CA with provider: provider=consul
    2021-02-29T06:58:17.173+0800 [INFO]  agent.leader: started routine: routine="CA root pruning"
    2021-02-29T06:58:17.173+0800 [DEBUG] agent.server: Skipping self join check for node since the cluster is too small: node=liumiaocn
    2021-02-29T06:58:17.173+0800 [INFO]  agent.server: member joined, marking health alive: member=liumiaocn
    2021-02-29T06:58:17.499+0800 [DEBUG] agent: Skipping remote check since it is managed automatically: check=serfHealth
    2021-02-29T06:58:17.499+0800 [INFO]  agent: Synced node info
    2021-02-29T06:58:17.499+0800 [DEBUG] agent: Node info in sync
    2021-02-29T06:58:19.165+0800 [DEBUG] agent.tlsutil: OutgoingRPCWrapper: version=1
    2021-02-29T06:58:20.295+0800 [DEBUG] agent: Skipping remote check since it is managed automatically: check=serfHealth
    2021-02-29T06:58:20.295+0800 [DEBUG] agent: Node info in sync
```

注意事项：Consul会使用hostname作为缺省的节点名称，比如本文示例中的liumiaocn，但是如果hostname中包含.的情况下，Consul中的DNS查询将不会起效，此时需要使用-node选项设定节点名称。

## 查询节点信息

另起一个终端，执行如下命令即可确认Consul节点信息

> 执行命令：consul members

```sh
liumiaocn:~ liumiao$ consul members
Node       Address         Status  Type    Build  Protocol  DC   Segment
liumiaocn  127.0.0.1:8301  alive   server  1.7.1  2         dc1  <all>
liumiaocn:~ liumiao$ 
```

执行的时候可以确认到如下类似信息：

```sh
    2021-02-29T07:10:25.609+0800 [DEBUG] agent.http: Request finished: method=GET url=/v1/agent/members?segment=_all from=127.0.0.1:53489 latency=113.689µs
```

使用detailed选项可以确认更加详细的信息

```sh
liumiaocn:~ liumiao$ consul members -detailed
Node       Address         Status  Tags
liumiaocn  127.0.0.1:8301  alive   acls=0,build=1.7.1:2cf0a3c8,dc=dc1,id=e95df364-000e-e590-6bd4-ceb947b8c90b,port=8300,raft_vsn=3,role=consul,segment=<all>,vsn=2,vsn_max=3,vsn_min=2,wan_join_port=8302
liumiaocn:~ liumiao$
```

## 停止Agent

另起一个终端，执行如下命令即可停止Agent，准确地来说是将此节点从Consul集群中脱离并停止Consul Agent

> 执行命令：consul leave

停止命令执行示例如下所示：

```sh
liumiaocn:~ liumiao$ consul leave
Graceful leave complete
liumiaocn:~ liumiao$ 
```

日志信息如下所示：

```sh
2021-02-29T07:12:20.113+0800 [INFO]  agent.server: server starting leave
2021-02-29T07:12:20.113+0800 [INFO]  agent.server.serf.wan: serf: EventMemberLeave: liumiaocn.dc1 127.0.0.1
2021-02-29T07:12:20.113+0800 [INFO]  agent.server: Handled event for server in area: event=member-leave server=liumiaocn.dc1 area=wan
2021-02-29T07:12:20.113+0800 [INFO]  agent.server.router.manager: shutting down
2021-02-29T07:12:23.113+0800 [INFO]  agent.server.serf.lan: serf: EventMemberLeave: liumiaocn 127.0.0.1
2021-02-29T07:12:23.113+0800 [INFO]  agent.server: Removing LAN server: server="liumiaocn (Addr: tcp/127.0.0.1:8300) (DC: dc1)"
2021-02-29T07:12:23.113+0800 [WARN]  agent.server: deregistering self should be done by follower: name=liumiaocn
2021-02-29T07:12:23.138+0800 [ERROR] agent.server.autopilot: Error updating cluster health: error="error getting server raft protocol versions: No servers found"
2021-02-29T07:12:25.138+0800 [ERROR] agent.server.autopilot: Error updating cluster health: error="error getting server raft protocol versions: No servers found"
2021-02-29T07:12:26.113+0800 [INFO]  agent.server: Waiting to drain RPC traffic: drain_time=5s
2021-02-29T07:12:27.137+0800 [ERROR] agent.server.autopilot: Error updating cluster health: error="error getting server raft protocol versions: No servers found"
2021-02-29T07:12:27.137+0800 [ERROR] agent.server.autopilot: Error promoting servers: error="error getting server raft protocol versions: No servers found"
2021-02-29T07:12:29.137+0800 [ERROR] agent.server.autopilot: Error updating cluster health: error="error getting server raft protocol versions: No servers found"
2021-02-29T07:12:31.116+0800 [INFO]  agent: Requesting shutdown
2021-02-29T07:12:31.116+0800 [INFO]  agent.server: shutting down server
2021-02-29T07:12:31.116+0800 [DEBUG] agent.leader: stopping routine: routine="CA root pruning"
2021-02-29T07:12:31.116+0800 [DEBUG] agent.leader: stopped routine: routine="CA root pruning"
2021-02-29T07:12:31.116+0800 [INFO]  agent: consul server down
2021-02-29T07:12:31.116+0800 [INFO]  agent: shutdown complete
2021-02-29T07:12:31.117+0800 [DEBUG] agent.http: Request finished: method=PUT url=/v1/agent/leave from=127.0.0.1:53565 latency=11.004059585s
2021-02-29T07:12:31.117+0800 [INFO]  agent: Stopping server: protocol=DNS address=127.0.0.1:8600 network=tcp
2021-02-29T07:12:31.117+0800 [INFO]  agent: Stopping server: protocol=DNS address=127.0.0.1:8600 network=udp
2021-02-29T07:12:31.117+0800 [INFO]  agent: Stopping server: protocol=HTTP address=127.0.0.1:8500 network=tcp
2021-02-29T07:12:31.117+0800 [INFO]  agent: Waiting for endpoints to shut down
2021-02-29T07:12:31.117+0800 [INFO]  agent: Endpoints down
2021-02-29T07:12:31.117+0800 [INFO]  agent: Exit code: code=0
liumiaocn:~ liumiao$
```

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有

> 来源：https://blog.csdn.net/liumiaocn/category_9752887.html
