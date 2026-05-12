# 06、Consul：HTTP和DNS服务发现协议的支持
- 来源：https://ddkk.com/zhuanlan/registered/consul/d-1/6.html
- 分类：注册中心
- 分组：Consul 教程（版本 A）
这篇文章继续结合实际的例子介绍在Consul提供的HTTP协议的服务发现和DNS协议的服务发现机制。

## 事前准备

启动Consul并注册如下两个服务

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

详细可参看：[Consul服务注册示例](https://liumiaocn.blog.csdn.net/article/details/104571356)

## HTTP协议方式

使用HTTP协议可以确认已经注册的服务信息，比如确认所做注册的服务的信息可以使用如下命令：

> 执行命令：curl http://localhost:8500/v1/catalog/services

本文示例的执行结果如下所示：

```sh
liumiaocn:~ liumiao$ curl http://localhost:8500/v1/catalog/services
{
    "consul": [],
    "nginx": [
        "nginx-tag"
    ],
    "tornado": [
        "tornado-tag"
    ]
}
liumiaocn:~ liumiao$ 
```

确认单个服务，比如本文中的nginx

> 执行命令：curl http://localhost:8500/v1/catalog/service/nginx

执行日志示例如下所示：

```sh
liumiaocn:~ liumiao$ curl http://localhost:8500/v1/catalog/service/nginx
[
    {
        "ID": "714da227-6852-8f47-4734-acfd64f09dee",
        "Node": "liumiaocn",
        "Address": "127.0.0.1",
        "Datacenter": "dc1",
        "TaggedAddresses": {
            "lan": "127.0.0.1",
            "lan_ipv4": "127.0.0.1",
            "wan": "127.0.0.1",
            "wan_ipv4": "127.0.0.1"
        },
        "NodeMeta": {
            "consul-network-segment": ""
        },
        "ServiceKind": "",
        "ServiceID": "nginx",
        "ServiceName": "nginx",
        "ServiceTags": [
            "nginx-tag"
        ],
        "ServiceAddress": "",
        "ServiceWeights": {
            "Passing": 1,
            "Warning": 1
        },
        "ServiceMeta": {},
        "ServicePort": 80,
        "ServiceEnableTagOverride": false,
        "ServiceProxy": {
            "MeshGateway": {},
            "Expose": {}
        },
        "ServiceConnect": {},
        "CreateIndex": 12,
        "ModifyIndex": 12
    }
]
liumiaocn:~ liumiao$
```

日志信息如下所示

```sh
    2021-02-29T15:47:04.289+0800 [DEBUG] agent.http: Request finished: method=GET url=/v1/catalog/service/nginx from=127.0.0.1:49837 latency=208.383µs
```

确认tornado服务信息

```sh
liumiaocn:~ liumiao$ curl http://localhost:8500/v1/catalog/service/tornado
[
    {
        "ID": "714da227-6852-8f47-4734-acfd64f09dee",
        "Node": "liumiaocn",
        "Address": "127.0.0.1",
        "Datacenter": "dc1",
        "TaggedAddresses": {
            "lan": "127.0.0.1",
            "lan_ipv4": "127.0.0.1",
            "wan": "127.0.0.1",
            "wan_ipv4": "127.0.0.1"
        },
        "NodeMeta": {
            "consul-network-segment": ""
        },
        "ServiceKind": "",
        "ServiceID": "tornado",
        "ServiceName": "tornado",
        "ServiceTags": [
            "tornado-tag"
        ],
        "ServiceAddress": "",
        "ServiceWeights": {
            "Passing": 1,
            "Warning": 1
        },
        "ServiceMeta": {},
        "ServicePort": 8080,
        "ServiceEnableTagOverride": false,
        "ServiceProxy": {
            "MeshGateway": {},
            "Expose": {}
        },
        "ServiceConnect": {},
        "CreateIndex": 13,
        "ModifyIndex": 13
    }
]
liumiaocn:~ liumiao$ 
```

执行日志信息如下所示

```sh
    2021-02-29T15:47:24.150+0800 [DEBUG] agent.http: Request finished: method=GET url=/v1/catalog/service/tornado from=127.0.0.1:49860 latency=147.932µs
```

## DNS协议方式

DNS在Consul中缺省情况下的服务注册为NMAE.service.consul，所以本文示例的两个服务分别是nginx.service.consul和tornado.service.consul，以nginx服务为例，详细的信息如下所示：

```sh
liumiaocn:~ liumiao$ dig @127.0.0.1 -p 8600 nginx.service.consul
; <<>> DiG 9.10.6 <<>> @127.0.0.1 -p 8600 nginx.service.consul
; (1 server found)
;; global options: +cmd
;; Got answer:
;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 20037
;; flags: qr aa rd; QUERY: 1, ANSWER: 1, AUTHORITY: 0, ADDITIONAL: 1
;; WARNING: recursion requested but not available
;; OPT PSEUDOSECTION:
; EDNS: version: 0, flags:; udp: 4096
;; QUESTION SECTION:
;nginx.service.consul.		IN	A
;; ANSWER SECTION:
nginx.service.consul.	0	IN	A	127.0.0.1
;; Query time: 1 msec
;; SERVER: 127.0.0.1#8600(127.0.0.1)
;; WHEN: Sat Feb 29 15:55:43 CST 2021
;; MSG SIZE  rcvd: 65
liumiaocn:~ liumiao$ 
```

然后也可以加上SRV查看更加详细的信息

```sh
liumiaocn:~ liumiao$ dig @127.0.0.1 -p 8600 nginx.service.consul SRV
; <<>> DiG 9.10.6 <<>> @127.0.0.1 -p 8600 nginx.service.consul SRV
; (1 server found)
;; global options: +cmd
;; Got answer:
;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 42007
;; flags: qr aa rd; QUERY: 1, ANSWER: 1, AUTHORITY: 0, ADDITIONAL: 3
;; WARNING: recursion requested but not available
;; OPT PSEUDOSECTION:
; EDNS: version: 0, flags:; udp: 4096
;; QUESTION SECTION:
;nginx.service.consul.		IN	SRV
;; ANSWER SECTION:
nginx.service.consul.	0	IN	SRV	1 1 80 liumiaocn.node.dc1.consul.
;; ADDITIONAL SECTION:
liumiaocn.node.dc1.consul. 0	IN	A	127.0.0.1
liumiaocn.node.dc1.consul. 0	IN	TXT	"consul-network-segment="
;; Query time: 0 msec
;; SERVER: 127.0.0.1#8600(127.0.0.1)
;; WHEN: Sat Feb 29 15:57:02 CST 2021
;; MSG SIZE  rcvd: 146
liumiaocn:~ liumiao$ 
```

## 参考内容

https://learn.hashicorp.com/consul/getting-started/services?utm_source=consul.io&utm_medium=docs

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有

> 来源：https://blog.csdn.net/liumiaocn/category_9752887.html
