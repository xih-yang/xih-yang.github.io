# 10、Consul：Consul KV的增删改查
- 来源：https://ddkk.com/zhuanlan/registered/consul/d-1/10.html
- 分类：注册中心
- 分组：Consul 教程（版本 A）
Consul 中支持对于KV（Key/Value）对的操作，这篇文章对简单的增删改查操作进行示例说明。

## 事前准备

以开发模式启动Consul服务，执行示例日志如下所示：

```sh
liumiaocn:~ liumiao$ consul --version
Consul v1.7.1
Protocol 2 spoken by default, understands 2 to 3 (agent will automatically use protocol >2 when speaking to compatible agents)
liumiaocn:~ liumiao$ consul agent -dev
==> Starting Consul agent...
           Version: 'v1.7.1'
           Node ID: 'f9f3f33a-765d-fedd-ec31-0db5bd3a4173'
         Node name: 'liumiaocn'
        Datacenter: 'dc1' (Segment: '<all>')
            Server: true (Bootstrap: false)
       Client Addr: [127.0.0.1] (HTTP: 8500, HTTPS: -1, gRPC: 8502, DNS: 8600)
      Cluster Addr: 127.0.0.1 (LAN: 8301, WAN: 8302)
           Encrypt: Gossip: false, TLS-Outgoing: false, TLS-Incoming: false, Auto-Encrypt-TLS: false
省略...           
```

此时从Consul web UI可以看到并没有Key/Value的存在。

也可以用如下命令进行kv的查询

```sh
liumiaocn:~ liumiao$ consul kv get -recurse
liumiaocn:~ liumiao$ 
```

## 新建数据

使用如下命令即可添加username/liumiaocn的KV对

```sh
liumiaocn:~ liumiao$ consul kv put username liumiaocn
Success! Data written to: username
liumiaocn:~ liumiao$ 
```

## 查询数据

使用-recurse可以查询所有的数据，目前只有一条数据

```sh
liumiaocn:~ liumiao$ consul kv get -recurse
username:liumiaocn
liumiaocn:~ liumiao$ 
```

也可以在get后直接指定KEY的名称

```sh
liumiaocn:~ liumiao$ consul kv get username
liumiaocn
liumiaocn:~ liumiao$ 
```

可以通过加上detailed参数查询详细信息

```sh
liumiaocn:~ liumiao$ consul kv get -detailed username
CreateIndex      32
Flags            0
Key              username
LockIndex        0
ModifyIndex      32
Session          -
Value            liumiaocn
liumiaocn:~ liumiao$ 
```

也可以通过Consul web UI进行结果的查看

## 更新数据

更新可以和新建数据使用同样的语法，比如此处将username/liumiaocn更新为username/liumiao，执行结果如下所示：

```sh
liumiaocn:~ liumiao$ consul kv put username liumiao
Success! Data written to: username
liumiaocn:~ liumiao$ 
```

结果确认

```sh
liumiaocn:~ liumiao$ consul kv get -detailed username
CreateIndex      32
Flags            0
Key              username
LockIndex        0
ModifyIndex      49
Session          -
Value            liumiao
liumiaocn:~ liumiao$ 
```

## 删除数据

指定要删除的KEY即可对数据进行删除，当然也可以使用recurse进行指定部分的全部删除，执行示例日志如下所示：

```sh
liumiaocn:~ liumiao$ consul kv get -recurse
username:liumiao
liumiaocn:~ liumiao$ consul kv get -recurse
username:liumiao
liumiaocn:~ liumiao$ consul kv delete username
Success! Deleted key: username
liumiaocn:~ liumiao$ consul kv get -recurse
liumiaocn:~ liumiao$ 
```

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有

> 来源：https://blog.csdn.net/liumiaocn/category_9752887.html
