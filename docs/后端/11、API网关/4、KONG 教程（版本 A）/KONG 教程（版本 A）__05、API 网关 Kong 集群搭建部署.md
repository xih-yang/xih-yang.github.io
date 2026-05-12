# 05、API 网关 Kong 集群搭建部署
- 来源：https://ddkk.com/zhuanlan/gateway/kong/d-1/5.html
- 分类：API网关
- 分组：KONG 教程（版本 A）
kong 集群将使得系统通过增加更多机器，从而实现水平扩展，承接更多的请求流量。它们将共享同样的配置且使用同一个数据库。kong 集群中的的所有节点都连接同一个数据库。

你需要在 kong 集群的上一层架设一个负载均衡的代理服务器，以便请求能够平均分散转发到 kong 的各个节点上。

## 1、kong 集群能做什么和不能做什么

拥有Kong群集并不意味着客户端流量将在开箱即用的Kong节点中实现负载平衡，仍然需要在Kong节点前面使用负载平衡器来分配流量。相反，Kong群集意味着这些节点将共享相同的配置。

出于性能原因，Kong在代理请求时避免数据库连接，并将数据库的内容缓存到内存中。cached实体包括services，routes，consumers，plugins，credentials等...由于这些值在内存中，因此通过其中一个节点的Admin API进行的任何更改都需要传播到其他节点。

本文档将介绍，如何使得这些本地缓存失效，并且如何配置 kong 集群节点，以便支持更多的使用场景，从而在性能和数据强一致性两方面做出平衡的选择。

## 2、单节点kong 集群

只有一个 kong 节点连接数据库（Cassandra或PostgreSQL）的单节点 kong 集群，任何通过 Admin api 的更改，都会立即全局生效。比如：

假设只有一个kong单节点A ，如果我们删除一个已经注册的Service：

```sh
$ curl -X DELETE http://127.0.0.1:8001/services/test-service
```

随后任何关于 kong节点A 请求都将会返回 “404 Not Found”，因为该节点已经在本地删除中清除了缓存。

```sh
$ curl -i http://127.0.0.1:8000/test-service
```

## 3、多节点kong 集群

在一个多节点 kong 集群中，当我们通过A 节点的Admin api删除某条信息，其他节点虽然都连接同一个数据库，但由于本地缓存存在，所以并不会立即生效。虽然API 不再存储在数据库中（通过A 节点的Admin api 删除的），但它仍然存在 B以及其他节点的内存中。

所有节点将会周期性执行后台同步任务，同步其他节点触发的变化。该同步任务执行频率可以通过配置下面的配置项：

`◦db_update_frequency (默认: 5 秒)`

每db_update_frequency 秒，所有 kong 节点将从数据库中拉取所有更新，如果有同步到更新变化，将清理本地相关缓存。

如果我们通过 kong-A 节点删除一个 API，这个更新变化将不会立即在 B 节点生效，直到 B 节点下一次从数据库拉取变更，这将会是在db_update_frequency 秒后才会发生（也有可能会更早）。

这个过程将会使 kong 集群最终保持一致性。

## 4、什么是缓存

所有核心实体（如服务，路由，插件，消费者，凭证）都由Kong存储在内存中，缓存失效则依赖后台任务同步更新。此外，kong 也会缓存数据库遗漏（数据库中有的数据，但本地不存在的）。这意味着如果你配置一个没有插件的服务，Kong会缓存这些信息。例：

在节点A上，我们添加一个Service和一个Route

```sh
# node A
$ curl -X POST http://127.0.0.1:8001/services \
    --data "name=example-service" \
    --data "url=http://example.com"
$ curl -X POST http://127.0.0.1:8001/services/example-service/routes \
    --data "paths[]=/example"
```

（请注意，我们使用/services/example-service/routes作为快捷方式：也可以使用/routes endpoint代替，但我们需要将service_id作为参数传递给新服务的UUID。）

对节点A和节点B的代理端口的请求将缓存该服务，并且没有在其上配置插件：

```sh
# node A
$ curl http://127.0.0.1:8000/example
HTTP 200 OK
...
# node B
$ curl http://127.0.0.2:8000/example
HTTP 200 OK
...
```

现在，假设我们通过节点A的管理API向该服务添加一个插件：

```sh
# node A
$ curl -X POST http://127.0.0.1:8001/services/example-service/plugins \
    --data "name=example-plugin"
```

由于此请求是通过节点A的Admin API发出的，因此节点A将在本地使其缓存无效，并在随后的请求中检测到此API配置了插件。

但是，kong-B 节点还没有执行数据库同步更新缓存任务，本地缓存的API信息并没有配置插件，直到 kong-B 节点执行数据库同步操作之后，API新增插件的功能才会生效。

**结论**：所有CRUD操作都会触发缓存失效。创建（POST，PUT）将使缓存的数据库未命中失效，更新/删除（PATCH，DELETE）将使缓存的数据库命中无效。

## 5、怎样配置DB缓存

可以在Kong配置文件中配置3个属性，其中最重要的一个属性是**db_update_frequency**，它决定了Kong节点在性能与一致性之间的权衡。

kong 已经提供了默认的配置，为了让你权衡集群性能和数据一致性两个方面，避免意外的结果。你可以按照下面的配置步骤，改变配置的值，从而确保性能和数据一致性能够被接受。

- 1.db_update_frequency (default: 5s)

该配置决定 kong 节点从数据库拉取缓存无效事件，同步任务执行的频率。一个更小的值意味着同步任务将会更频繁的执行，kong 节点的缓存数据将保持和数据库更强的一致性。一个更大的值，意味着你的 kong 节点花更少的时间去处理同步任务，从而更加将更多资源集中去处理请求。

Note：变更将会在db_update_frequency 秒后在整个集群节点中生效。

- 2.db_update_propagation (default: 0s)

如果你的数据库也是集群的并且最终一致性的（比如：Cassandra），你必须配置该值。它将确保db_update_propagation秒后，数据库节点间的变化在整个数据库集群中所有节点生效。当配置了该值，kong 节点从同步任务中接收无效事件，清除本地缓存将会延迟 db_update_propagation 秒。

如果一个 kong 节点连接到最终一致性数据库上，且没有延迟事件需要处理，它可能会清除缓存，然后把没有更新的值再次缓存起来。（因为这个改变还没有传播到数据库集群的每一个节点，注释：数据库一致性还没有在数据库集群中达到一致，此时kong缓存到期了，但是没有更新到变化事件，此时会把没有更新的值再次缓存起来，导致kong也出现不一致，即便kong执行了同步任务。）。

你应该配置该值，通过评估数据库集群发生变更后，最终达到一致性所需要的时间。（确保数据库一致之后，才去执行 kong 同步任务处理变更事件，从而达到kong 数据一致性）

Note：当配置了该配置项，数据变更传播到 kong 集群的最大时间是 db_update_frequency + db_update_propagation 秒。

- 3.db_cache_ttl (default: 3600s)

该配置项的时间（单位秒）是 kong 缓存数据库实体的时间（包括缓存命中或者穿透），该存活时间是一种保护措施，以防 kong 节点漏掉处理缓存无效事件，避免旧数据长时间没有被清理。当缓存生存时间到了，缓存值将会被清理掉，下一次将会从数据库读取数据并再次缓存起来。

- 4.当使用 Cassandra 数据库

如果使用 Cassandra 作为 kong 的数据库，你必须配置 db_update_propagation 为一个非零值。由于 Cassandra 本身是最终一致性数据库，这将确保 kong 节点不会过早地使本地缓存失效，仅仅当再次获取到一个不是最新值的时候。如果你使用了 Cassandra 但你没有配置该值时，kong 将会输出一条警告日志。

此外，你可以配置 cassandra_consistency 的值为：比如 QUORUM 或者 LOCAL_QUORUM，确保被kong 缓存的值是数据库中最新的。

## 6、通过Admin Api操作缓存

由于某些原因，你希望通过 kong 查看缓存的值，或者手动清理缓存（当缓存被命中或者丢失），你可以通过使用 Admin api /cache 接口进行管理。

### 6.1、查看缓存值-Inspect a cached value

Endpoint

```sh
GET  /cache/{cache_key}
```

Response

```sh
返回值
当 key 被有效缓存：
HTTP 200 OK
...
{
    ...
}
否则：
HTTP 404 Not Found
```

注意：检索由Kong缓存的每个实体的cache_key目前是一个未公开的过程。 Admin API的未来版本将使此过程更加简单。

### 6.2、清除缓存值-Purge a cached value

Endpoint

```sh
DELETE  /cache/{cache_key}
```

Response

```sh
HTTP 204 No Content
...
```

### 6.3、清除节点缓存-Purge a node's cache

Endpoint

```sh
DELETE  /cache
```

Response

```sh
HTTP 204 No Content
```

注意：请谨慎在生产运行节点上使用此接口。如果节点接收到大量流量，同时清除其缓存将触发对数据库的许多请求，并可能导致DB请求堆积现象。

## 7、集群搭建

### 7.1、cluster来世今生

在kong v0.11版本去除了cluster这个命令和api的管理，我也是吭哧吭哧花了好长时间找到了如下[珍贵的文档](https://github.com/Kong/kong/blob/master/UPGRADE.md#upgrade-to-013x)（upgrade to 0.11.x这一节）：

```sh
kong 0.11 changeLog节选：
Due to the removal of Serf, Kong is now entirely stateless. As such, the /cluster endpoint has for now disappeared. This endpoint, in previous versions of Kong, retrieved the state of the Serf agent running on other nodes to ensure they were part of the same cluster. Starting from 0.11, all Kong nodes connected to the same datastore are guaranteed to be part of the same cluster without requiring additional channels of communication.
The Admin API /status endpoint does not return a count of the database entities anymore. Instead, it now returns a database.reachable boolean value, which reflects the state of the connection between Kong and the underlying database. Please note that this flag does not reflect the health of the database itself.
```

意思是说在kong 0.11之前的版本有cluster命令和/cluster接口来管理kong集群（难怪在0.13中死活提示cluster命令不存在），默认配置文件中有相关cluster参数（网上能搜到很多此类的文档，不过都是0.10之前的版本），也会有个数据库表来存储kong 集群节点相关信息。

但是0.11版本后去除了这个cluster管理这个功能，kong变成完全无状态的，只要是连接到同一个kong数据库的节点都认为是同一个kong集群而不需要额外的通信机制。因此也不需要在kong.conf中配置cluster相关参数了。

### 7.2、集群实践

在0.10之前的版本集群配置也很简单，参考官方文档通过cluster命令即可，配置文件默认也是生成好的。相关可参考：[http://blog.100dos.com/2016/08/01/kong-cluster-introduction/](http://blog.100dos.com/2016/08/01/kong-cluster-introduction/)

接下来我来尝试一下部署将两个kong节点连接到同一个pg数据库，并验证是否在一个集群。

node1 : 172.18.18.1

node2：172.18.18.2

首先[部署好两个kong节点](https://www.cnblogs.com/zhoujie/p/kong5.html)，并且配置文件连接到同一postgres数据库。便于测试， 将两个kong节点的配置文件下面两个参数为：

```sh
proxy_listen = 0.0.0.0:8000
admin_listen = 0.0.0.0:8001
```

连接相同的数据库，在kong.conf中设置posgres的连接参数：

```sh
pg_host = 172.1.1.2             # The PostgreSQL host to connect to.
pg_port = 5432                  # The port to connect to.
pg_user = kong                  # The username to authenticate if required.
pg_password = kong               # The password to authenticate if required.
pg_database = kong              # The database name to connect to.
```

注意：数据库部署的配置文件需要设置允许外部连接，详见[centeos部署pg和kong](https://www.cnblogs.com/zhoujie/p/kong5.html)

配置好后重启两个节点的kong服务。

curl 172.18.18.1:8001/status 和curl 172.18.18.2:8001/status 的数据库连接均为true

```json
{
    "database": {
        "reachable": true
    },
    "server": {
        "connections_writing": 1,
        "total_requests": 5,
        "connections_handled": 4,
        "connections_accepted": 4,
        "connections_reading": 0,
        "connections_active": 1,
        "connections_waiting": 0
    }
}
```

通过node1来注册一个服务：

```sh
curl -i -X POST \
  --url  http://172.18.18.1:8001/services/ \
  --data 'name=service-stock' \
  --data 'url=http://hq.sinajs.cn'
```

显示注册成功：

```sh
HTTP/1.1 201 Created
Date: Sun, 10 Jun 2018 09:43:49 GMT
Content-Type: application/json; charset=utf-8
Transfer-Encoding: chunked
Connection: keep-alive
Access-Control-Allow-Origin: *
Server: kong/0.13.1
{
    "host": "hq.sinajs.cn",
    "created_at": 1528595029,
    "connect_timeout": 60000,
    "id": "0032fa88-c457-4d35-b1e7-b5b6f872e2fe",
    "protocol": "http",
    "name": "service-stock",
    "read_timeout": 60000,
    "port": 80,
    "path": null,
    "updated_at": 1528595029,
    "retries": 5,
    "write_timeout": 60000
}
```

通过node2来查询这个Service:

```sh
$  curl -i -X GET   --url  http://172.18.18.2:8001/services/service-stock
HTTP/1.1 200 OK
Date: Sun, 10 Jun 2018 09:47:05 GMT
Content-Type: application/json; charset=utf-8
Transfer-Encoding: chunked
Connection: keep-alive
Access-Control-Allow-Origin: *
Server: kong/0.13.1
{"host":"hq.sinajs.cn","created_at":1528595029,"connect_timeout":60000,"id":"0032fa88-c457-4d35-b1e7-b5b6f872e2fe","protocol":"http","name":"service-stock","read_timeout":60000,"port":80,"path":null,"updated_at":1528595029,"retries":5,"write_timeout":60000}
```

因为二者是共享同一数据库的，所以这显然没有问题。

现在则可以横向扩展任意多个node节点，只要它们连接的是同一个数据库(或集群)即可，如果kong对外希望是一个入口，则可以将这些kong节点作为反向代理的上游，通过nginx转发即可。

参考文档：

[kong更新log](https://github.com/Kong/kong/blob/master/CHANGELOG.md#0131---20180423)

[kong升级参考](https://github.com/Kong/kong/blob/master/UPGRADE.md#upgrade-to-013x)

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有

> 来源：https://www.cnblogs.com/zhoujie/tag/kong/
