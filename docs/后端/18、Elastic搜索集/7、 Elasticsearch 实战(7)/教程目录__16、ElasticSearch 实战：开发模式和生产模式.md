# 16、ElasticSearch 实战：开发模式和生产模式
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/7/16.html
- 分类：搜索引擎
- 分组：教程目录
## Elasticsearch开发模式和生产模式

### 模式切换

在默认配置中，Elasticsearch绑定到用于HTTP 和传输通信的环回地址。对于个人练习和开发来说无需配置其他网络内容，使项目运行变得简单。

但是对于生产来说，因为要保证高可用，需要加入集群。每个节点需要部署在不同的主机上，这就使得非环回地址加入集群，节点必须将传输绑定到非环回地址，并且不能使用单节点发现。

所以Elasticsearch发现网络通信绑定到回环地址就认为其为开发模式，当有非回环地址加入集群则认为该节点处于开发模式。

主要用于识别开发和生成模式的网络配置为

```java
network.host: 0.0.0.0 
```

一般情况此参数仅绑定到环回地址（例如127.0.0.1和）[::1]，当你配置了非回环的网络主机后，会被切换为生产模式。

**回环地址**

> 环回地址是主机用于向自身发送通信的一个特殊地址。环回地址为同一台设备上运行的 TCP/IP应用程序和服务之间相互通信提供了一条捷径。同一台主机上的两项服务若使用环回地址而非分配的主机地址，就可以绕开 TCP/IP 协议栈的下层。通过 ping 环回地址，还可以测试本地主机上的 TCP/IP 配置。IPv4 的环回地址是保留地址之一 127.0.0.1。尽管只使用 127.0.0.1 这一个地址，但地址 127.0.0.0 到 127.255.255.255均予以保留。此地址块中的任何地址都将环回到本地主机中。此地址块中的任何地址都绝不会出现在任何网络中。

### 两者区别

在开发模式时，当配置出现错误的时候，将在日志文件中写入警告，但是启动和运行Elasticsearch节点不会受到影响。

但是在生产模式的时候。上述警告升级为异常。这些异常将阻止Elasticsearch节点启动。

### 生产模式引导检查

在生产模式启动的时候会强制进行一系列配置的检查，其主要分为下面的内容。

#### 禁用交换（Disable swapping）

大多数操作系统都试图使用尽可能多的内存来进行文件系统缓存，并急切地调出未使用的应用程序内存。这可能导致部分JVM堆甚至其可执行页面被交换到磁盘。

而系统的内存交换对于Elasticsearch节点的稳定性不利。可能导致节点响应缓慢，甚至脱离集群。

关于禁用交换有下面几种方式：

**临时性的禁用交换**

```java
sudo swapoff -a
```

**永久性禁用**

编辑`/etc/fstab`文件并注释掉包含单词`swap`的所有行

关于修改swap的内容可以查看[Linux禁用内存交换](https://blog.csdn.net/qq330983778/article/details/103228723)

**降低交换趋势**

Linux系统上可用的另一个选项是确保sysctl值 vm.swappiness设置为1。这减少了内核的交换趋势，并且在正常情况下不应导致交换，同时仍允许整个系统在紧急情况下进行交换。

**锁定elasticsearch内存**

在Linux/Unix系统上使用mlockall，尝试将进程地址空间锁定到RAM中，以防止任何Elasticsearch内存被换出。可以在config/elasticsearch.yml文件中增加此配置：

```java
bootstrap.memory_lock: true
```

在启动项目后，通过此API验证是否配置成功

```java
GET _nodes?filter_path=**.mlockall
```

如果是false，这意味着mlockall请求失败了。

#### 配置文件描述符（File Descriptors）

这个配置仅在Linux和macOS环境上需要配置，在Windows上运行Elasticsearch，则可以忽略它。

Elasticsearch可能使用很多文件描述符，确保将运行Elasticsearch的用户的打开文件描述符的数量限制增加到65536或更高。

> 每一个文件描述符会与一个打开文件相对应，同时，不同的文件描述符也会指向同一个文件。相同的文件可以被不同的进程打开也可以在同一个进程中被多次打开。系统为每一个进程维护了一个文件描述符表，该表的值都是从0开始的，所以在不同的进程中你会看到相同的文件描述符，这种情况下相同文件描述符有可能指向同一个文件，也有可能指向不同的文件。

**修改配置**

**1、** 修改limits.conf配置,修改/etc/security/limits.conf参数nofile设置为65535；

**2、** 使用.zip和.tar.gz包安装软件的用户，可以在启动Elasticsearch之前，执行`ulimit-n65535`；

**查看配置**

可以通过下面的API查询每个节点的配置信息

```java
GET _nodes/stats/process?filter_path=**.max_file_descriptors
```

#### 保证足够的内存

默认情况下，Elasticsearch使用mmapfs目录存储其索引。mmap计数的默认限制可能太低，这可能会导致内存不足异常。

**修改配置**

在Linux系统上可以使用命令修改配置

```java
sysctl -w vm.max_map_count=262144
```

当然假如希望永久修改此配置，可以修改`/etc/sysctl.conf`中的`vm.max_map_count`。

以上内容方便使用.zip和.tar.gz包安装软件的用户，而使用RPM和Debian软件包安装，将自动配置此设置。

#### 保证足够的线程数

Elasticsearch对不同类型的操作使用许多线程池。能够在需要时创建新线程很重要。确保Elasticsearch用户可以创建的线程数至少为4096。

在Linux / Unix系统上，假如没有锁定内存，最可能的原因是运行Elasticsearch的用户没有相关权限。关于授权不同的安装途径有不同的方式

**.zip 或 .tar.gz**

**1、** 在启动Elasticsearch之前，使用root权限，设置ulimit-lunlimited；

**2、** 或者设置/etc/security/limits.conf.中memlock为unlimited在；

**使用RPM或Debian软件包**

在系统配置文件中设置MAX_LOCKED_MEMORY为unlimitedsystemd

**使用systemd系统**

添加一个名为的文件 /etc/systemd/system/elasticsearch.service.d/override.conf

添加或者修改配置

```java
[Service]
LimitMEMLOCK=infinity
```

进行配置重载

```java
sudo systemctl daemon-reload
```

#### 配置JVM的DNS缓存设置

在主机名解析为 IP 地址后，资源 IP 地址将保存在 JVM 的高速缓存中。默认配置中当解析成功后JVM会将其永久缓存起来，而解析失败则缓存10秒。Elasticsearch并没有使用此配置，而是在解析成功后缓存60秒，解析失败后缓存10秒。

**修改配置**

Elasticsearch的默认配置适用于大多数的情况，但是需要修改的话可以在JVM的选项中修改参数`es.networkaddress.cache.ttl`和`es.networkaddress.cache.negative.ttl`。

当配置了`es.networkaddress.cache.ttl`和`es.networkaddress.cache.negative.ttl`后Elasticsearch将会忽略Java安全策略中的`networkaddress.cache.ttl=`和`networkaddress.cache.negative.ttl`值。

#### 未使用noexecedit装入JNA临时目录

Elasticsearch使用Java本机访问（JNA）库来执行一些平台相关的本机代码的时候会从JNA存档中提取支持该库的本机代码。默认情况下此代码被提取到Elasticsearch临时目录中。该目录默认为的子目录 /tmp。因为需要将本机库以可执行文件形式映射到JVM虚拟的空间中。如果将此代码提取到此位置的基础挂载点使用noexec挂载，noexec会阻止JVM进程将此代码映射为可执行文件。

当使用noexec挂载基础挂载点的时候,JNA将无法启动，并且抛出一个错误`along the lines of failed to map segment from shared object`(未能映射来自共享对象的段)。这个异常将会因为JVM版本不同有所区别。

Elasticsearch中依赖于通过JNA执行本机代码的组件将失败，并显示消息，表明这是因为JNA不可用。如果您出现这样的错误消息，则必须重新装载用于JNA的临时目录，以使其不与noexec一起装载。

> 挂载概念简述：根文件系统之外的其他文件要想能够被访问，都必须通过“关联”至根文件系统上的某个目录来实现，此关联操作即为“挂载”，此目录即为“挂载点”,解除此关联关系的过程称之为“卸载”

### 强制使用引导检查

上面说过，当`network.host: 0.0.0.0`参数配置为非回环地址后会被系统认定为生产模式从而启动一系列的严格的引导检查。当我们使用单机模式会被认为是开发模式从而逃避引导检查。

但是在某些情况下（单机的线上版本、保证开发和生产一样的严格配置）我们需要在开发模式下强制进行引导检查。这个时候我们可以配置

您可以通过将system属性设置`es.enforce.bootstrap.checks`为`true`

> 上面内容是基于7.2的官方文档整理而来，中间只配置过部分参数，所以并未全部验证，后续（等我凑足时间搭建一个生产集群）我会尝试将上述配置配制一遍附上截图或者链接。
