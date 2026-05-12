# 04、API 网关 Kong 负载均衡理论及实现
- 来源：https://ddkk.com/zhuanlan/gateway/kong/d-1/4.html
- 分类：API网关
- 分组：KONG 教程（版本 A）
负载均衡（Load balancing）是一种计算机网络技术，用来在多个计算机（计算机集群）、网络连接、CPU、磁盘驱动器或其他资源中分配负载，以达到最佳化资源使用、最大化吞吐率、最小化响应时间、同时避免过载的目的。

使用带有负载均衡的多个服务器组件，取代单一的组件，可以通过冗余提高可靠性。负载均衡服务通常是由专用软体和硬件来完成。

对于互联网服务，负载均衡器通常是一个软体程序，这个程序侦听一个外部端口，互联网用户可以通过这个端口来访问服务，而作为负载均衡器的软体会将用户的请求转发给后台内网服务器，内网服务器将请求的响应返回给负载均衡器，负载均衡器再将响应发送到用户，这样就向互联网用户隐藏了内网结构，阻止了用户直接访问后台（内网）服务器，使得服务器更加安全，可以阻止对核心网络栈和运行在其它端口服务的攻击。

当所有后台服务器出现故障时，有些负载均衡器会提供一些特殊的功能来处理这种情况。例如转发请求到一个备用的负载均衡器、显示一条关于服务中断的消息等。负载均衡器使得 IT 团队可以显著提高容错能力。它可以自动提供大量的容量以处理任何应用程序流量的增加或减少。

对于核心 api，需要保证搞可靠性，那么就要对于该 api 有多个 backend service，即实际后端对该 api 有多个服务的节点；那么最好在 api-gateway 即 kong 这一层实现负载均衡。

Kong为多个后端服务提供了多种负载平衡请求方式：一种基于DNS的简单方法，以及一种更加动态的环平衡器，该方法还允许在不需要DNS服务器的情况下进行服务注册。

## 基于DNS的负载均衡

当使用基于DNS的负载均衡时，后端服务的注册是在Kong以外完成的，而Kong仅接收来自DNS服务器的更新。 如果名称解析为多个IP地址，并且主机名未解析为上游名称或名称，则每个使用包含hostname（而不是IP地址）的host定义的service都将自动使用基于DNS的负载平衡你的DNS hosts文件。 DNS记录ttl设置（生存时间）决定信息刷新的频率。当使用0的ttl时，每个请求都将使用自己的DNS查询来解析。很明显，这会导致性能下降，但更新/更改的延迟将非常低。

### A记录

A记录包含一个或多个IP地址。因此，当主机名解析为A记录时，每个后端服务都必须具有自己的IP地址。 由于没有weight信息，因此所有条目在负载平衡器中将被视为具有相同的权重，并且平衡器(balancer)将进行简单的循环。

### SRV记录

SRV记录包含所有IP地址的权重(weight)和端口(port)信息。后端服务可以通过IP地址和端口号的唯一组合来识别。因此，单个IP地址可以在不同的端口上托管同一服务的多个实例。 由于weight信息可用，每个条目将在负载均衡器中获得自己的权重，并执行加权循环。 同样，任何给定的端口信息都将被来自DNS服务器的端口信息覆盖。如果服务具有host = myhost.com和port = 123的属性，并且myhost.com解析为具有127.0.0.1:456的SRV记录，则该请求将被代理到http://127.0.0.1:456/somepath，因为123端口将被456覆盖。

### DNS优先级

DNS解析器将按顺序解析以下记录类型：

- 上次解析的最后一次成功类型（LAST）
- SRV记录
- A记录
- CNAME记录

该顺序可通过dns_order配置属性进行配置。

解析不同记录类型的顺序。 LAST类型表示上次成功查找的类型（用于指定的名称）。格式是一个（不区分大小写）逗号分隔的列表。 默认值：LAST，SRV，A，CNAME

### DNS警告（DNS caveats）

- 无论何时刷新DNS记录，都会生成一个列表以正确处理权重。尽量保持权重为对方的倍数以保持算法的高效性，例如，17和31的2个权重将导致具有527个项目的结构，而权重16和32（或其最小的相对对应项1和2）将导致在只有3个条目的结构中，尤其是具有非常小（甚至0）ttl值的结构。
- 在这些情况下，某些域名服务器不会返回所有条目（由于UDP数据包的大小）（例如Consul最多返回3个），给定的Kong节点将只使用由名称服务器提供的少数上游服务实例。在这种情况下，由于名称服务器提供的信息有限，Kong节点实际上不了解某些实例，因此上游实例池可能会不一致地加载。为了缓解这种情况，可以使用不同的名称服务器，使用IP地址而不是名称，或者确保使用足够的Kong节点来继续使用所有上游服务。
- 当名称服务器返回3 name error时，那么对于Kong来说这是一个有效的响应。如果这是意外，请首先验证是否正在查询正确的name，然后检查您的nameserver配置。
- 从DNS记录（A或SRV）中初始选择IP地址不是随机的。因此，当使用ttl为0的记录时，nameserver应该随机记录条目。

## 环平衡器(ring-balancer)

当使用环平衡器时，添加和删除后端服务将由Kong处理，并且不需要DNS更新。kong将担任服务登记。节点可以通过一个HTTP请求added/deleted，并立即start/stop接收流量。 **配置环平衡器是通过上游和目标实体完成的**。

target：具有后端服务驻留端口号的IP地址或主机名，例如。 “192.168.100.12:80”。每个target都会得到一个额外的权重来指示它获得的相对负载。 IP地址可以是IPv4和IPv6两种格式。

upstream：可以在路由主机字段中使用的'virtual hostname'，例如，上游命名的weather.v2.service将从具有host = weather.v2.service的服务获得所有请求

### 上游（upstream）

每个upstream都有自己的环形平衡器。每个upstream可以有许多target条目附加到它，代理到'virtual hostname'的请求将在target上进行负载平衡。环形平衡器具有预定义(pre-defined)数量的槽(number of slots)，并且基于目标权重，槽(slots)被分配给上游的目标。

添加和删除目标可以通过[Admin API](https://www.cnblogs.com/zhoujie/p/kong2.html)上的简单HTTP请求完成。这个操作相对便宜。改变上游本身更昂贵，因为例如当槽的数量改变时平衡器将需要重建。

自动重建平衡器的唯一情况是清理目标历史记录时;除此之外，它只会在改变时重建。

在平衡器内部有（从1到slots）的位置，它们随机分布( randomly distributed)在环上。在运行时需要随机性来调用环平衡器。轮子上的简单循环（位置）将为目标提供良好的分布式加权循环，同时在插入/删除目标时也具有廉价的操作。

每个目标使用的插槽数量（至少）应该在100个左右，以确保插槽正确分布。例如。对于预期最多8个目标，即使初始设置仅包含2个目标，上游应至少定义为slot = 800。

这里的折衷是，插槽数量越多，随机分布越好，但更改更为昂贵（添加/删除目标）

有关添加和操作上游的详细信息，请参阅[Admin API](https://www.cnblogs.com/zhoujie/p/kong2.html)

### 目标（target）

由于上游保留了更改历史记录，目标只能添加，不能修改或删除。要更改目标，只需为目标添加一个新条目，然后更改重量值。最后一个条目是将要使用的条目。因为这样的设置权重= 0将禁用目标，有效地从平衡器中删除它。有关添加和操作目标的详细信息，请参阅Admin API参考的目标部分。

当活动条目比活动条目多10倍时，目标将自动清除。清洁将涉及重建平衡器，因此比添加目标条目更昂贵。 目标也可以具有主机名而不是IP地址，在这种情况下，名称将被解析，所有找到的条目将被单独添加到环形平衡器中，例如，添加api.host.com:123且权重= 100。名称'api.host.com'解析为具有2个IP地址的A记录。然后这两个IP地址将被添加为目标，每个获得weight = 100和端口123.注意：权重用于单个条目，而不是整个！ 它是否会解析为SRV记录，然后DNS记录中的端口和权重字段将被拾取，并且会否定给定的端口123和权重= 100。 平衡器将遵守DNS记录的ttl设置和重新查询，并在平衡器到期时更新。 例外情况：当DNS记录的ttl = 0时，主机名将被添加为具有指定权重的单个目标。在对该目标的每个代理请求时，它将再次查询名称服务器。

### 平衡算法

默认情况下，环平衡器将使用加权循环方案。另一种方法是使用基于散列的算法。散列的输入可以是none，consumer，ip或header。如果设置为none，则将使用加权循环方案，并且散列将被禁用。

有两种选择，一种primary 和 一种回退(fallback)，以防primary失败（例如，如果primary设置为consumer，但没有consumer通过验证）

不同的散列选项：

- none：不要使用散列，而是使用weighted-round-robin（默认）。
- consumer：使用消费者ID作为散列输入。如果没有消费者ID可用（如果使用外部身份验证，如ldap），此选项将回退到凭证ID。
- ip：远程（始发）IP地址将用作输入。在使用此设置时，查看确定真实IP的配置设置。
- header：使用指定的标题（在hash_on_header或hash_fallback_header字段中）作为散列的输入。

哈希算法基于'一致哈希'（或'ketama原理'），它确保当平衡器通过改变目标（添加，移除，失败或改变权重）而被修改时，只有最小数量的哈希损失发生。这将最大化上游缓存命中。

有关确切设置的更多信息，请参阅Admin API参考的上游upstream部分。

### 平衡警告（Balancing caveats）

环平衡器设计为既可以在单个节点上工作，也可以在群集中工作。对于加权循环算法没有太大的区别，但是当使用基于散列的算法时，重要的是所有节点构建完全相同的环平衡器以确保它们都工作一致。要做到这一点，平衡器必须以确定性的方式构建。

不要在平衡器中使用主机名称，因为平衡器可能会/会慢慢发生分歧，因为DNS ttl只有第二精度，更新取决于实际请求名称的时间。最重要的是一些域名服务器没有返回所有条目的问题，这加剧了这个问题。因此，在Kong群集中使用哈希方法时，只能通过IP地址添加目标实体，而不能通过名称添加target实体。

当选择你的散列输入时，确保输入具有足够的方差以得到散布良好的散列。哈希将使用CRC-32摘要进行计算。例如，如果您的系统有成千上万的用户，但只有少数用户（每个平台定义了3个用户：Web，iOS和Android），那么挑选consumer散列输入是不够的，通过设置使用远程IP地址对于ip的哈希将提供更多的输入差异，从而更好地分配哈希输出

## 蓝绿部署（Blue-Green Deployments）

使用环形平衡器，可以轻松地为一项服务策划一个蓝绿色部署。切换目标基础架构只需要服务上的PATCH请求，即可更改其主机值。

设置“blue”环境，运行version 1 of the address service：

```sh
# create an upstream
$ curl -X POST http://kong:8001/upstreams \
    --data "name=address.v1.service"
# add two targets to the upstream
$ curl -X POST http://kong:8001/upstreams/address.v1.service/targets \
    --data "target=192.168.34.15:80"
    --data "weight=100"
$ curl -X POST http://kong:8001/upstreams/address.v1.service/targets \
    --data "target=192.168.34.16:80"
    --data "weight=50"
# create a Service targeting the Blue upstream
$ curl -X POST http://kong:8001/services/ \
    --data "name=address-service" \
    --data "host=address.v1.service" \
    --data "path=/address"
# finally, add a Route as an entry-point into the Service
$ curl -X POST http://kong:8001/services/address-service/routes/ \
    --data "hosts[]=address.mydomain.com"
```

在部署version 2 of the address service之前，请设置“green”环境：

```sh
# create a new Green upstream for address service v2
$ curl -X POST http://kong:8001/upstreams \
    --data "name=address.v2.service"
# add targets to the upstream
$ curl -X POST http://kong:8001/upstreams/address.v2.service/targets \
    --data "target=192.168.34.17:80"
    --data "weight=100"
$ curl -X POST http://kong:8001/upstreams/address.v2.service/targets \
    --data "target=192.168.34.18:80"
    --data "weight=100"
```

要激活blue/green开关，现在只需要更新服务:

```sh
# Switch the Service from Blue to Green upstream, v1 -> v2
$ curl -X PATCH http://kong:8001/services/address-service \
    --data "host=address.v2.service"
```

主机头设置为address.mydomain.com的传入请求现在由Kong代理到新目标; 1/2的请求将转到http://192.168.34.17:80/address（权重= 100），另一半将转到http://192.168.34.18:80/address（权重= 100 ）。

与往常一样，通过Kong Admin API进行的更改是动态的，并且会立即生效。不需要重新加载或重新启动，并且没有进行中的请求将被丢弃。

## 金丝雀版本（Canary Releases）

使用环形平衡器，可以精确调整目标重量，从而实现平稳.。

使用一个非常简单的2 target示例：

```sh
# first target at 1000
$ curl -X POST http://kong:8001/upstreams/address.v2.service/targets \
    --data "target=192.168.34.17:80"
    --data "weight=1000"
# second target at 0
$ curl -X POST http://kong:8001/upstreams/address.v2.service/targets \
    --data "target=192.168.34.18:80"
    --data "weight=0"
```

通过重复请求，但每次改变权重，流量将缓慢路由到另一个target。例如，将其设置为10％：

```sh
# first target at 900
$ curl -X POST http://kong:8001/upstreams/address.v2.service/targets \
    --data "target=192.168.34.17:80"
    --data "weight=900"
# second target at 100
$ curl -X POST http://kong:8001/upstreams/address.v2.service/targets \
    --data "target=192.168.34.18:80"
    --data "weight=100"
```

通过Kong Admin API进行的更改是动态的，并会立即生效。不需要重新加载或重新启动，并且没有进行中的请求将被丢弃。

## KONG负载均衡实现

实际在操作过程中，采用的是 kong 的 Ring-balancer 做负载均衡。

使用 Kong Community Edition（社区版 v0.13）来搭建一个负载均衡器，由于 Kong 是基于 Openresty 的，而 Openresty 又是 Nginx 的二次封装，所有很多配置项和 Nginx 类似。

来看一个较为典型的 Nginx 负载均衡配置：

```sh
upstream hello {  
    server localhost:3000 weight=100;  
    server localhost:3001 weight=50;  
}  
server {  
    listen  80;  
    location /hello {  
        proxy_pass http://hello;  
    }  
} 
```

nginx 监听来自本地 80 端口的请求，如果路径与 /hello 匹配，便将请求原封不动的转发到名称为 hello 的upstream，而该 upstream 我们配置了一个负载均衡器，会路由到本地的 3000 端口和 3001 端口。

接下来便可以针对 Kong 进行负载均衡的配置了。

### 配置 upstream 和 target

创建一个名称 hello 的 upstream

```sh
curl -X POST http://localhost:8001/upstreams --data "name=hello"  
```

为hello 添加两个负载均衡节点

```sh
curl -X POST http://localhost:8001/upstreams/hello/targets --data "target=localhost:3000" --data "weight=100" 
```

```sh
curl -X POST http://localhost:8001/upstreams/hello/targets --data "target=localhost:3001" --data "weight=50" 
```

如上的配置对应了 Nginx 的配置：

```sh
upstream hello {  
    server localhost:3000 weight=100;  
    server localhost:3001 weight=50;  
}  
```

### 配置 service 和 route

使用 Kong v0.13之前版本的用户可能会接触过 api 这个概念，但是在 Kong v0.13.0 中，已经被废除了，取而代之的是 service 和 route 的配置。

配置一个 service

```sh
curl -X POST http://localhost:8001/services --data "name=hello" --data "host=hello" 
```

host 的值便对应了 upstream 的名称，配置成功后会返回生成的 service 的 id，返回结果：8695cc65-16c1-43b1-95a1-5d30d0a50409。

为上面的 service 配置路由信息

```sh
curl -X POST http://localhost:8001/routes --data "paths[]=/hello" --data "service.id=8695cc65-16c1-43b1-95a1-5d30d0a50409"
```

请求路径包含 /hello 的请求都会被转移到对应的 service 进行处理。

如上的配置便对应了Nginx的配置：

```sh
location /hello {  
    proxy_pass http://hello;  
}  
```

### 测试 Kong 的负载均衡

```sh
curl http://localhost:8000/hello/hi 
```

因为复杂均衡的原因，需要多测试几次，多次 curl 之后结果如下：

```sh
3000  
3000  
3000  
3000  
3000  
3000  
3001  
3001  
3001  
3000  
3001 
```

reference：

[https://getkong.org/docs/0.13.x/loadbalancing/](https://getkong.org/docs/0.13.x/loadbalancing/)

[https://getkong.org/docs/0.13.x/configuration/](https://getkong.org/docs/0.13.x/configuration/)

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有

> 来源：https://www.cnblogs.com/zhoujie/tag/kong/
