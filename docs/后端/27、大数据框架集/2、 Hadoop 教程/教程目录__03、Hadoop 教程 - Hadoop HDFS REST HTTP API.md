# 03、Hadoop 教程 - Hadoop HDFS REST HTTP API
- 来源：https://ddkk.com/zhuanlan/bigdata/hadoop/2/3.html
- 分类：大数据框架
- 分组：教程目录
## 1. HDFS REST HTTP API

上一篇讲的 HDFS shell 客户端和 Java 客户端，都安装了HDFS客户端。在 windows 上也配置了 HDFS 的 windows 版本客户端，否则，我们将无法操作 HDFS。而且，客户端的版本如果不匹配，有可能会导致无法操作。

如果出现了譬如下面这种没有安装HDFS客户端的机器上操作该如何呢？

下面我们讲几种基于 HTTP 协议的客户端，HTTP 是跨平台的，它不要求客户端上必须安装 Hadoop，就可以直接操作 HDFS。

### 1.1 WebHDFS

#### 1.1.1 简介

WebHDFS 其实是 HDFS 提供的 HTTP RESTFul API 接口，并且它是独立于 Hadoop 的版本的，它支持 HDFS 的完整 FileSystem / FileContext 接口。它可以让客户端发送 http 请求的方式来操作 HDFS，而无需安装 Hadoop。

#### 1.1.2 关于RESTful

##### 1.1.2.1 REST

- REST（表现层状态转换，英语：Representational State Transfer）是 Roy Thomas Fielding 博士于 2000 年在博士论文中提出来的一种万维网软件架构风格，目的是便于不同软件/程序在网络（例如互联网）中互相传递信息。
- REST 是基于超文本传输协议（HTTP）之上而确定的一组约束和属性，是一种设计提供万维网络服务的软件构建风格。符合或兼容于这种架构风格（简称为 REST 或 RESTful）的网络服务，允许客户端发出以统一资源标识符访问和操作网络资源的请求，而与预先定义好的无状态操作集一致化。
- 因此 REST 提供了在互联网络的计算系统之间，彼此资源可交互使用的协作性质（interoperability）。相对于其它种类的网络服务，例如 SOAP 服务，则是以本身所定义的操作集，来访问网络上的资源。
- 目前在三种主流的 Web 服务实现方案中，因为 REST 模式与复杂的 SOAP 和 XML-RPC 相比更加简洁，越来越多的 Web 服务开始采用 REST 风格设计和实现。例如，Amazon.com 提供接近 REST 风格的 Web 服务运行图书查询；雅虎提供的 Web 服务也是 REST 风格的。
- 需要注意的是，REST 是设计风格而不是标准。REST 通常基于 HTTP、URI、XML 以及 HTML 这些现有的广泛流行的协议和标准。
- 资源是由 URI 来指定。
- 对资源的操作包括获取、创建、修改和删除，这些操作正好对应 HTTP 协议提供的 GET、POST、PUT 和 DELETE 方法。
- 通过操作资源的表现形式来操作资源。
- 资源的表现形式则是 XML 或者 HTML，取决于读者是机器还是人、是消费 Web 服务的客户软件还是 Web 浏览器。当然也可以是任何其他的格式，例如 JSON。

##### 1.1.2.2 RESTful API

- 符合 REST 设计风格的 Web API 称为 RESTful API。它从以下三个方面资源进行定义：
- 直观简短的资源地址：URI，比如：http://example.com/resources
- 传输的资源：Web 服务接受与返回的互联网媒体类型，比如：JSON，XML，YAML 等。
- 对资源的操作：Web 服务在该资源上所支持的一系列请求方法（比如：POST，GET，PUT 或 DELETE）。

资源
GET
PUT
POST
DELETE

一组资源的URI，比如https://example.com/resources
列出URI，以及该资源组中每个资源的详细信息。
使用给定的一组资源替换当前整组资源。
在本组资源中创建/追加一个新的资源。该操作往往返回新资源的URL。
删除整组资源。

单个资源的URI，比如https://example.com/resources/142
获取指定的资源的详细信息，格式可以自选一个合适的网络媒体类型（比如：XML、JSON等）
替换/创建指定的资源。并将其追加到相应的资源组中。
把指定的资源当做一个资源组，并在其下创建/追加一个新的元素，使其隶属于当前资源。
删除指定的元素。

- PUT 和 DELETE 方法是幂等方法
- GET 方法是安全方法（不会对服务器端有修改，因此当然也是幂等的）

##### 1.1.2.3 PUT请求类型和POST请求类型的区别

- PUT 和 POST 均可用于创建或者更新某个资源（例如：添加一个用户、添加一个文件），用哪种请求方式取决我们自己。
- 我们主要使用是否需要有幂等性来判断到底用 PUT、还是 POST。PUT 是幂等的，也就是将一个对象进行两次 PUT 操作，是不会起作用的。而如果使用 POST，会同时收到两个请求。

#### 1.1.3 HDFS HTTP RESTFUL API

HDFS HTTP RESTFUL API支持以下操作：

##### 1.1.3.1 HTTP GET

- OPEN (等同于 FileSystem.open)
- GETFILESTATUS (等同于 FileSystem.getFileStatus)
- LISTSTATUS (等同于 FileSystem.listStatus)
- LISTSTATUS_BATCH (等同于 FileSystem.listStatusIterator)
- GETCONTENTSUMMARY (等同于 FileSystem.getContentSummary)
- GETQUOTAUSAGE (等同于 FileSystem.getQuotaUsage)
- GETFILECHECKSUM (等同于 FileSystem.getFileChecksum)
- GETHOMEDIRECTORY (等同于 FileSystem.getHomeDirectory)
- GETDELEGATIONTOKEN (等同于 FileSystem.getDelegationToken)
- GETTRASHROOT (等同于 FileSystem.getTrashRoot)
- GETXATTRS (等同于 FileSystem.getXAttr)
- GETXATTRS (等同于 FileSystem.getXAttrs)
- GETXATTRS (等同于 FileSystem.getXAttrs)
- LISTXATTRS (等同于 FileSystem.listXAttrs)
- CHECKACCESS (等同于 FileSystem.access)
- GETALLSTORAGEPOLICY (等同于 FileSystem.getAllStoragePolicies)
- GETSTORAGEPOLICY (等同于 FileSystem.getStoragePolicy)
- GETSNAPSHOTDIFF
- GETSNAPSHOTTABLEDIRECTORYLIST
- GETECPOLICY (等同于 HDFSErasureCoding.getErasureCodingPolicy)
- GETFILEBLOCKLOCATIONS (等同于 FileSystem.getFileBlockLocations)

##### 1.1.3.2 HTTP PUT

- CREATE (等同于 FileSystem.create)
- MKDIRS (等同于 FileSystem.mkdirs)
- CREATESYMLINK (等同于 FileContext.createSymlink)
- RENAME (等同于 FileSystem.rename)
- SETREPLICATION (等同于 FileSystem.setReplication)
- SETOWNER (等同于 FileSystem.setOwner)
- SETPERMISSION (等同于 FileSystem.setPermission)
- SETTIMES (等同于 FileSystem.setTimes)
- RENEWDELEGATIONTOKEN (等同于 DelegationTokenAuthenticator.renewDelegationToken)
- CANCELDELEGATIONTOKEN (等同于 DelegationTokenAuthenticator.cancelDelegationToken)
- CREATESNAPSHOT (等同于 FileSystem.createSnapshot)
- RENAMESNAPSHOT (等同于 FileSystem.renameSnapshot)
- SETXATTR (等同于 FileSystem.setXAttr)
- REMOVEXATTR (等同于 FileSystem.removeXAttr)
- SETSTORAGEPOLICY (等同于 FileSystem.setStoragePolicy)
- ENABLEECPOLICY (等同于 HDFSErasureCoding.enablePolicy)
- DISABLEECPOLICY (等同于 HDFSErasureCoding.disablePolicy)
- SETECPOLICY (等同于 HDFSErasureCoding.setErasureCodingPolicy)

##### 1.1.3.3 HTTP POST

- APPEND (等同于 FileSystem.append)
- CONCAT (等同于 FileSystem.concat)
- TRUNCATE (等同于 FileSystem.truncate)
- UNSETSTORAGEPOLICY (等同于 FileSystem.unsetStoragePolicy)
- UNSETECPOLICY (等同于 HDFSErasureCoding.unsetErasureCodingPolicy)

##### 1.1.3.4 HTTP DELETE

- DELETE (等同于 FileSystem.delete)
- DELETESNAPSHOT (等同于 FileSystem.deleteSnapshot)

#### 1.1.4 文件系统URL和HTTP URL

WebHDFS 的文件系统 schema 是`webhdfs://`。WebHDFS 文件系统 URI 具有以下格式：

```java
webhdfs://<HOST>:<HTTP_PORT>/<PATH>
```

上面的 WebHDFS URI 对应于下面的 HDFS URI。

```java
hdfs://<HOST>:<RPC_PORT>/<PATH>
```

在RESTAPI 中，在路径中插入前缀`/webhdfs/v1`，并在末尾追加一个查询。因此，对应的 HTTPURL 具有以下格式：

```java
http://<HOST>:<HTTP_PORT>/webhdfs/v1/<PATH>?op=...
```

先安装 Postman 进行测试，中文版安装链接（建议不要安装最新版，因为汉化包的更新速度跟不上软件更新速度）：[https://github.com/hlmd/Postman-cn#1%E4%B8%8B%E8%BD%BD%E5%AE%89%E8%A3%85postman](https://github.com/hlmd/Postman-cn#1%E4%B8%8B%E8%BD%BD%E5%AE%89%E8%A3%85postman)

请求URL：`http://192.168.68.101:9870/webhdfs/v1/?op=LISTSTATUS`

该操作表示要查看根目录下的所有文件以及目录，相当于`hdfs dfs -ls /`

在Postman 中，HDFS 给我们返回了以下信息：

```java
{
    "FileStatuses": {
        "FileStatus": [
            {
                "accessTime": 0,
                "blockSize": 0,
                "childrenNum": 0,
                "fileId": 16558,
                "group": "supergroup",
                "length": 0,
                "modificationTime": 1641885901721,
                "owner": "hadoop",
                "pathSuffix": "benchmarks",
                "permission": "755",
                "replication": 0,
                "storagePolicy": 0,
                "type": "DIRECTORY"
            },
            {
                "accessTime": 0,
                "blockSize": 0,
                "childrenNum": 0,
                "fileId": 16639,
                "group": "supergroup",
                "length": 0,
                "modificationTime": 1641964154596,
                "owner": "hadoop",
                "pathSuffix": "hdfsapi",
                "permission": "755",
                "replication": 0,
                "storagePolicy": 0,
                "type": "DIRECTORY"
            },
            {
                "accessTime": 0,
                "blockSize": 0,
                "childrenNum": 3,
                "fileId": 16386,
                "group": "supergroup",
                "length": 0,
                "modificationTime": 1641967935593,
                "owner": "hadoop",
                "pathSuffix": "input",
                "permission": "755",
                "replication": 0,
                "storagePolicy": 0,
                "type": "DIRECTORY"
            },
            {
                "accessTime": 0,
                "blockSize": 0,
                "childrenNum": 2,
                "fileId": 16388,
                "group": "supergroup",
                "length": 0,
                "modificationTime": 1641879269605,
                "owner": "hadoop",
                "pathSuffix": "tmp",
                "permission": "700",
                "replication": 0,
                "storagePolicy": 0,
                "type": "DIRECTORY"
            },
            {
                "accessTime": 0,
                "blockSize": 0,
                "childrenNum": 1,
                "fileId": 16425,
                "group": "supergroup",
                "length": 0,
                "modificationTime": 1641874559479,
                "owner": "hadoop",
                "pathSuffix": "user",
                "permission": "755",
                "replication": 0,
                "storagePolicy": 0,
                "type": "DIRECTORY"
            }
        ]
    }
}
```

#### 1.1.5 使用WebHDFS创建并写入到一个文件

##### 1.1.5.1 创建文件

提交 HTTP PUT 请求，而不会自动跟随重定向，也不会发送文件数据。

```java
curl -i -X PUT "http://<HOST>:<PORT>/webhdfs/v1/<PATH>?op=CREATE
                    [&overwrite=<true |false>][&blocksize=<LONG>][&replication=<SHORT>]
                    [&permission=<OCTAL>][&buffersize=<INT>][&noredirect=<true|false>]"
```

通常，请求被重定向到要写入文件数据的 DataNode。

```java
HTTP/1.1 307 TEMPORARY_REDIRECT
Location: http://<DATANODE>:<PORT>/webhdfs/v1/<PATH>?op=CREATE...
Content-Length: 0
```

如果不希望自动重定向，则可以设置 noredirected 标志。

```java
HTTP/1.1 200 OK
Content-Type: application/json
{"Location":"http://<DATANODE>:<PORT>/webhdfs/v1/<PATH>?op=CREATE..."}
```

**示例：**

在`/test`目录中创建一个名字为`webhdfs_api.txt`文件，并写入内容。

使用 postman 创建一个请求，设置请求方式为 PUT，请求 url 为：

```java
http://192.168.68.101:9870/webhdfs/v1/test/webhdfs_api.txt?op=CREATE&overwrite=true&replication=2&noredirect=true
```

HTTP 会响应一个用于上传数据的 URL 链接：

```java
{
    "Location": "http://hadoop1:9864/webhdfs/v1/test/webhdfs_api.txt?op=CREATE&namenoderpcaddress=192.168.68.101:8020&createflag=&createparent=true&overwrite=true&replication=2"
}
```

##### 1.1.5.2 写入数据

使用 Location 标头中的 URL 提交另一个 HTTP PUT 请求（如果指定了 noredirect，则返回返回的响应），并写入要写入的文件数据。

```java
curl -i -X PUT -T <LOCAL_FILE> "http://<DATANODE>:<PORT>/webhdfs/v1/<PATH>?op=CREATE..."
```

客户端接收到一个 201 创建的响应，该响应的内容长度为零，位置头中文件的 WebHDFS URI 为：

```java
HTTP/1.1 201 Created
Location: webhdfs://<HOST>:<PORT>/<PATH>
Content-Length: 0
```

**示例：**

使用 postman 基于之前返回的 http 响应，上传文件。

上传之后，通过 WebUI 发现，已经上传成功。

**更多操作请参考：**[https://hadoop.apache.org/docs/r3.3.1/hadoop-project-dist/hadoop-hdfs/WebHDFS.html#Cross-Site_Request_Forgery_Prevention](https://hadoop.apache.org/docs/r3.3.1/hadoop-project-dist/hadoop-hdfs/WebHDFS.html#Cross-Site_Request_Forgery_Prevention)

### 1.2 HttpFS

- HttpFS 本质上和 WebHDFS 是一样的，都是提供 HTTP REST API 功能，但它们的区别是 HttpFS 是一个独立于 HadoopNameNode 的服务，它本身就是 Java JettyWeb 应用程序。
- 因为是可以独立部署的，所以可以对 HttpFS 设置防火墙，而避免 NameNode 暴露在墙外，对一些安全性要求比较高的系统，HttpFS 会更好些。
- HttpFS 是一种服务器，它提供 REST HTTP 网关，支持所有 HDFS 文件系统操作（读和写）。
- HttpFS 可用于在运行不同版本 Hadoop（克服RPC版本控制问题）的集群之间传输数据，例如使用 HadoopDiscreCP。
- HttpFS 可用于在防火墙后面的集群上访问 HDFS 中的数据（HttpFS 服务器充当网关，是允许跨越防火墙进入集群的唯一系统）。
- HttpFS 可以使用 HTTP 实用程序（例如 curl 和 wget）和来自 Java 以外的其他语言的 HTTP 库 Perl 来访问 HDFS 中的数据。
- 这个 Webhdfs 客户端文件系统实现可以使用 Hadoop 文件系统命令访问 HttpFS（hdfs dfs）行工具以及使用 Hadoop 文件系统 JavaAPI 的 Java 应用程序。
- HttpFS 内置了支持 Hadoop 伪身份验证和 HTTP、SPNEGO Kerberos 和其他可插拔身份验证机制的安全性。它还提供 Hadoop 代理用户支持。

#### 1.2.1 HttpFS是如何工作的

- HttpFS 是一个独立于 HadoopNameNode 的服务。
- HttpFS 本身就是 Java JettyWeb 应用程序。
- HttpFS HTTP Web 服务 API 调用是 HTTPREST 调用，映射到 HDFS 文件系统操作。例如，使用 curl/Unix 命令：

```java
$curl ‘http://httpfs-host:14000/webhdfs/v1/user/foo/README.txt?op=OPEN&user.name=foo’
返回HDFS的内容/user/foo/README.txt档案。
$curl ‘http://httpfs-host:14000/webhdfs/v1/user/foo?op=LISTSTATUS&user.name=foo’
返回HDFS的内容/user/foo目录中的JSON格式。
$curl ‘http://httpfs-host:14000/webhdfs/v1/user/foo?op=GETTRASHROOT&user.name=foo’
返回路径/user/foo/.trash，如果/是加密区域，则返回路径。/.Trash/Foo。看见更多细节关于加密区域中的垃圾路径。
$curl -X POST‘http://httpfs-host:14000/webhdfs/v1/user/foo/bar?op=MKDIRS&user.name=foo’
创建HDFS/user/foo/bar目录。
```

- HttpFS 默认端口号为 14000

#### 1.2.2 配置Hadoop

编辑 Hadoop 的 core-site.xml，并将运行 HttpFS 服务器的 Unix 用户定义为 proxyuser。例如：

```java
<property>
	<name>hadoop.proxyuser.#HTTPFSUSER#.hosts</name>
	<value>httpfs-host.foo.com</value>
</property>
<property>
	<name>hadoop.proxyuser.#HTTPFSUSER#.groups</name>
	<value>*</value>
</property>
```

**注意：**替换#HTTPFSUSER#使用将启动 HttpFS 服务器的 Unix 用户。

例如：

```java
<property>
	<name>hadoop.proxyuser.hadoop.hosts</name>
	<value>*</value>
</property>
<property>
	<name>hadoop.proxyuser.hadoop.groups</name>
	<value>*</value>
</property>
```

#### 1.2.3 重启服务

重启 Hadoop 服务，启动 HttpFS

```java
hdfs --daemon start httpfs
```

#### 1.2.4 测试HttpFS工作

```java
http://192.168.68.101:14000/webhdfs/v1?user.name=root&op=LISTSTATUS
```

#### 1.2.5 HTTP默认服务

Name
Description

/conf
Display configuration properties

/jmx
Java JMX management interface

/logLevel
Get or set log level per class

/logs
Display log files

/stacks
Display JVM stacks

/static/index.html
The static home page

**例：**`http://192.168.68.101:14000/conf?user.name=hadoop`

## 2. 两者区别

- HttpFS 和 WebHDFS 本质上是一样的，都是提供 HTTP REST API 功能，使得一个集群外的 host 可以不用安装 HADOOP 和 JAVA 环境就可以对集群内的 Hadoop 进行访问，并且 Client 不受语言的限制。但它们的区别是 HttpFS 是一个独立于 HadoopNameNode 的服务，它本身就是 Java JettyWeb 应用程序，而 WebHDFS 是 HDFS 内置的、默认开启的一个服务。
- HttpHDFS 是可以独立部署的，所以可以对 HttpFS 设置防火墙，而避免 NameNode 暴露在墙外，对一些安全性要求比较高的系统，HttpHDFS 会更好些。
- WebHDFS 是 HortonWorks 开发的，然后捐给了 Apache；而 HttpFS 是 Cloudera 开发的，也捐给了 Apache。
- 当 Client 请求某文件时，WebHDFS 会将其重定向到该资源所在的 DataNode，而 HttpFs 相等于一个“网关”，所有的数据先传输到该 HttpFS Server，再由该 HttpFS Server 传输到 Client。
- 以打开某一文件为例，由于HttpFS会首先将数据传输到 HttpFS Server,再由该 Server 传输到 Client，故当数据量比较大或并发访问次数比较多时，HttpFS Server 将会成为数据传输的瓶颈，出现传输失败的情况。
- 一般来说两个都可以使用，而且差别不大。但若集群配置了 HA，那就最好使用 HttpFS 了，因为 NameNode 的地址一直在变化，我们是不可能也随时修改脚本里的请求地址的，故在这种情况下直接写 HttpFS Server 的地址好了。
