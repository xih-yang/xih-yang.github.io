# 08、Consul：配置方式设定upstream
- 来源：https://ddkk.com/zhuanlan/registered/consul/d-1/8.html
- 分类：注册中心
- 分组：Consul 教程（版本 A）
上一篇文章中我们通过使用一个空的sidecar_service来创建了自动sideCar代理，使用consul connect proxy -service指定了upstream，这篇文章将通过配置文件对其进行设定。

## 事前准备

## 使用socat启动一个用于验证的服务

可以使用socat，也可以使用其他的任何服务均可，只要可以验证操作即可，执行如下命令在8181端口提供一个基于socat的可以进行结果回显的服务。

> 执行命令：socat -v tcp-l:8181,fork exec:"/bin/cat"

## 配置文件

```sh
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
liumiaocn:consul.d liumiao$ cat web.json 
{
    "service":{
        "name":"web",
        "port":8080,
        "connect":{
            "sidecar_service":{
                "proxy":{
                    "upstreams":[
                        {
                            "destination_name":"socat",
                            "local_bind_port":9191
                        }
                    ]
                }
            }
        }
    }
}
liumiaocn:consul.d liumiao$
```

## 启动Consul并注册服务

执行如下命令启动并注册服务

> 执行命令：consul agent -dev -enable-script-checks -config-dir=.

执行日志示例如下所示：

```sh
liumiaocn:consul.d liumiao$ consul agent -dev -enable-script-checks -config-dir=.
==> Starting Consul agent...
           Version: 'v1.7.1'
           Node ID: '6cd30b34-bdfe-ed34-5e84-01a9cb5360f5'
         Node name: 'liumiaocn'
        Datacenter: 'dc1' (Segment: '<all>')
            Server: true (Bootstrap: false)
       Client Addr: [127.0.0.1] (HTTP: 8500, HTTPS: -1, gRPC: 8502, DNS: 8600)
      Cluster Addr: 127.0.0.1 (LAN: 8301, WAN: 8302)
           Encrypt: Gossip: false, TLS-Outgoing: false, TLS-Incoming: false, Auto-Encrypt-TLS: false
省略...    
```

## 连接socat服务

执行如下命令连接socat服务

> 执行命令：consul connect proxy -sidecar-for socat

```sh
liumiaocn:consul.d liumiao$ consul connect proxy -sidecar-for socat
==> Consul Connect proxy starting...
    Configuration mode: Agent API
        Sidecar for ID: socat
              Proxy ID: socat-sidecar-proxy
==> Log data will now stream in as it occurs:
    2021-03-01T17:43:32.293+0800 [INFO]  proxy: Proxy loaded config and ready to serve
    2021-03-01T17:43:32.293+0800 [INFO]  proxy: Parsed TLS identity: uri=spiffe://ba7c4c87-0d9a-d6a5-3de0-6a3a72598360.consul/ns/default/dc/dc1/svc/socat roots=[pri-1j5dmyo.consul.ca.ba7c4c87.consul]
    2021-03-01T17:43:32.294+0800 [INFO]  proxy: Starting listener: listener="public listener" bind_addr=0.0.0.0:21000
```

## 连接web服务

执行如下命令连接web服务

> 执行命令：consul connect proxy -sidecar-for web

```sh
liumiaocn:~ liumiao$ consul connect proxy -sidecar-for web
==> Consul Connect proxy starting...
    Configuration mode: Agent API
        Sidecar for ID: web
              Proxy ID: web-sidecar-proxy
==> Log data will now stream in as it occurs:
    2021-03-01T17:44:31.665+0800 [INFO]  proxy: Starting listener: listener=127.0.0.1:9191->service:default/socat bind_addr=127.0.0.1:9191
    2021-03-01T17:44:31.675+0800 [INFO]  proxy: Proxy loaded config and ready to serve
    2021-03-01T17:44:31.675+0800 [INFO]  proxy: Parsed TLS identity: uri=spiffe://ba7c4c87-0d9a-d6a5-3de0-6a3a72598360.consul/ns/default/dc/dc1/svc/web roots=[pri-1j5dmyo.consul.ca.ba7c4c87.consul]
    2021-03-01T17:44:31.675+0800 [INFO]  proxy: Starting listener: listener="public listener" bind_addr=0.0.0.0:21001
```

注意：由于本示例中使用的官方的内容8080的端口在本地没有服务，可能会出现connection refused的信息，但对于本文示例并不影响。

## 结果确认

此时即可使用nc确认9191端口的回显功能了

```sh
liumiaocn:~ liumiao$ nc localhost 9191
hello, this is greetings from web upstream proxy
hello, this is greetings from web upstream proxy
```

而从socat服务中也可以同样对结果进行确认。

```sh
liumiaocn:~ liumiao$ socat -v tcp-l:8181,fork exec:"/bin/cat"
> 2021/03/01 17:45:47.948710  length=49 from=0 to=48
hello, this is greetings from web upstream proxy
< 2021/03/01 17:45:47.949273  length=49 from=0 to=48
hello, this is greetings from web upstream proxy
```

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有

> 来源：https://blog.csdn.net/liumiaocn/category_9752887.html
