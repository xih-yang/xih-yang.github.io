# 04、Minio 教程 - Minio 纠删码及分布式Minio集群环境搭建
- 来源：https://ddkk.com/zhuanlan/filestorage/minio/1/4.html
- 分类：分布式存储
- 分组：教程目录
### 纠删码

Minio使用纠删码erasure code和校验和checksum来保护数据免受硬件故障和无声数据损坏。 即便您丢失一半数量（N/2）的硬盘，您仍然可以恢复数据

#### 什么是纠删码？

纠删码是一种用于重建丢失或损坏数据的数学算法。

纠删码（erasure coding，EC）是一种数据保护方法，它将数据分割成片段，把冗余数据块扩展、编码，并将其存储在不同的位置，比如磁盘、存储节点或者其它地理位置。

Minio采用Reed-Solomon code将对象拆分成N/2数据和N/2 奇偶校验块。 这就意味着如果是12块盘，一个对象会被分成6个数据块、6个奇偶校验块，你可以丢失任意6块盘（不管其是存放的数据块还是奇偶校验块），你仍可以从剩下的盘中的数据进行恢复。

#### 为什么纠删码有用?

纠删码的工作原理和RAID或者复制不同，像RAID6可以在损失两块盘的情况下不丢数据，而Minio纠删码可以在丢失一半的盘的情况下，仍可以保证数据安全。 而且Minio纠删码是作用在对象级别，可以一次恢复一个对象，而RAID是作用在卷级别，数据恢复时间很长。 Minio对每个对象单独编码，存储服务一经部署，通常情况下是不需要更换硬盘或者修复。Minio纠删码的设计目标是为了性能和尽可能的使用硬件加速。

#### 什么是位衰减bit rot保护?

位衰减又被称为数据腐化Data Rot、无声数据损坏Silent Data Corruption,是目前硬盘数据的一种严重数据丢失问题。硬盘上的数据可能会神不知鬼不觉就损坏了，也没有什么错误日志。正所谓明枪易躲，暗箭难防，这种背地里犯的错比硬盘直接咔咔宕了还危险。 不过不用怕，Minio纠删码采用了高速 HighwayHash 基于哈希的校验和来防范位衰减。

### 纠错码单机模式环境搭建

#### 1. 创建存储文件夹

我这里直接在D盘下创建了四个文件夹，也可以在不同的盘符下创建。

#### 2. 启动

直接在启动命名最后添加多个存贮位置就可以了。

```java
# 设置用户名
set MINIO_ROOT_USER=admin
# 设置密码（8位）
set MINIO_ROOT_PASSWORD=admin123
# 指定启动端口(未指定默认9000)、控制台端口90001及存储位置
minio.exe  server  --address :9000 --console-address :9001 D:\tools\minio\data01  D:\tools\minio\data02 D:\tools\minio\data03 D:\tools\minio\data04
```

启动命令后，控制台显示了警告信息，这里只配置了4个位置，所以两个以上损坏就会造成数据不可用。

```java
警告：主机本地有2个以上的驱动器故障，将导致数据变得不可用。
```

Status显示当前4个驱动器在线，0个不在线。

登录后查看控制台，也能看到当前所有驱动器的状态。

#### 3. 测试

首先上传一张150K大小的照片。

查看硬盘中文件，发现这4个文件下都存在以上传文件名命名的文件夹，而不是直接的文件了，是以文件名创建文件夹，然后将文件分片为了文件块的元数据。

然后我们删除data03和data04文件夹，然后会发现，被删除的文件夹竟然马上自动恢复了过来。然后直接删除data03和data04文件夹下的元数据：

发现尽管删除了两份分片数据，依然可以正常下载。

接着再删了一个元数据，发现该文件就会找不到了，说明半数以上元数据丢失，这个文件就真的找不到了。。。

### 分布式MinIO

分布式Minio可以让你将多块硬盘（甚至在不同的机器上）组成一个对象存储服务。由于硬盘分布在不同的节点上，分布式Minio避免了单点故障。

#### 分布式存储可靠性常用方法

分布式存储，很关键的点在于数据的可靠性，即保证数据的完整，不丢失，不损坏。只有在可靠性实现的前提下，才有了追求一致性、高可用、高性能的基础。而对于在存储领域，一般对于保证数据可靠性的方法主要有两类，一类是冗余法，一类是校验法。

##### 冗余

冗余法最简单直接，即对存储的数据进行副本备份，当数据出现丢失，损坏，即可使用备份内容进行恢复，而副本备份的多少，决定了数据可靠性的高低。这其中会有成本的考量，副本数据越多，数据越可靠，但需要的设备就越多，成本就越高。可靠性是允许丢失其中一份数据。当前已有很多分布式系统是采用此种方式实现，如Hadoop的文件系统（3个副本)，Redis的集群，MySQL的主备模式等。

##### 校验

校验法即通过校验码的数学计算的方式，对出现丢失、损坏的数据进行校验、还原。注意，这里有两个作用，一个校验，通过对数据进行校验和( checksum )进行计算，可以检查数据是否完整，有无损坏或更改，在数据传输和保存时经常用到，如TCP协议;二是恢复还原，通过对数据结合校验码，通过数学计算，还原丢失或损坏的数据，可以在保证数据可靠的前提下，降低冗余，如单机硬盘存储中的RAID技术，纠删码(Erasure Code)技术等。MinlO采用的就是纠删码技术。

#### 分布式Minio有什么好处?

在大数据领域，通常的设计理念都是无中心和分布式。Minio分布式模式可以帮助你搭建一个高可用的对象存储服务，你可以使用这些存储设备，而不用考虑其真实物理位置。

##### 数据保护

分布式Minio采用 纠删码来防范多个节点宕机和位衰减bit rot。

分布式Minio至少需要4个硬盘，使用分布式Minio自动引入了纠删码功能。

##### 高可用

单机Minio服务存在单点故障，相反，如果是一个有N块硬盘的分布式Minio,只要有N/2硬盘在线，你的数据就是安全的。不过你需要至少有N/2+1个硬盘来创建新的对象。

例如，一个16节点的Minio集群，每个节点16块硬盘，就算8台服務器宕机，这个集群仍然是可读的，不过你需要9台服務器才能写数据。

注意，只要遵守分布式Minio的限制，你可以组合不同的节点和每个节点几块硬盘。比如，你可以使用2个节点，每个节点4块硬盘，也可以使用4个节点，每个节点两块硬盘，诸如此类。

##### 一致性

Minio在分布式和单机模式下，所有读写操作都严格遵守read-after-write一致性模型。

### 分布式Minio环境搭建

#### 注意事项

启动一个分布式Minio实例，你只需要把硬盘位置做为参数传给minio server命令即可，然后，你需要在所有其它节点运行同样的命令。

注意事项：

- 分布式Minio里所有的节点需要有同样的access秘钥和secret秘钥，这样这些节点才能建立联接。为了实现这个，你需要在执行minio server命令之前，先将access秘钥和secret秘钥export成环境变量。
- 分布式Minio使用的磁盘里必须是干净的，里面没有数据。
- 下面示例里的IP仅供示例参考，你需要改成你真实用到的IP和文件夹路径。
- 分布式Minio里的节点时间差不能超过3秒，你可以使用NTP 来保证时间一致。
- 在Windows下运行分布式Minio处于实验阶段，请悠着点使用。

#### 示例1:

##### 1. Centos 7 环境准备

启动分布式Minio实例，4个节点，每节点1块盘(可以多块)。

首先准备四台Linux服务器，千万不要使用Windows服务器：

服务器IP
存储目录

192.168.58.201
/data/minio/data01

192.168.58.202
/data/minio/data01

192.168.58.203
/data/minio/data01

192.168.58.204
/data/minio/data01

###### 1.1 修改主机名#

很简单，不赘述

###### 1.2 配置时间同步#

###### 1.3 系统最大文件数修改#

```java
[root@hadoop001 ~]# echo "*   soft    nofile  65535" >> /etc/security/limits.conf
[root@hadoop001 ~]# echo "*   hard    nofile  65535" >> /etc/security/limits.conf
```

###### 1.4 下载安装包#

[下载地址](http://dl.minio.org.cn/server/minio/release/)

##### 2. 安装（每台服务器都需要执行以下操作）

首先各个服务器创建存储目录及minio启动文件存储目录：

```java
[root@hadoop001 ~]# mkdir -p /data/minio/data01
[root@hadoop001 ~]# mkdir -p /opt/soft/minio 
```

将minio启动文件上传到这个服务器的/opt/soft/minio目录：

编写启动脚本：

```java
[root@hadoop001 minio]# chmod +x minio
[root@hadoop002 minio]# vim minio-start.sh 
# 添加内容
#!/bin/bash
export MINIO_ROOT_USER=admin
export MINIO_ROOT_PASSWORD=admin123
nohup /opt/soft/minio/minio server --address :9000 --console-address :9001  \
http://192.168.58.201/data/minio/data01 \
http://192.168.58.202/data/minio/data01 \
http://192.168.58.203/data/minio/data01 \
http://192.168.58.204/data/minio/data01 \
>/root/minio.log 2>&1 &
```

##### 3. 启动

启动四台服务器启动脚本：

```java
[root@hadoop002 minio]# sh minio-start.sh 
```

##### 4. 登录控制台

随便输入一台服务器的IP+9000地址，都可以登录控制台，在首页可以可以查看到这些节点的健康状态：

##### 5. Nginx 负载均衡

上面的案例中，安装了四个节点，每个节点的IP的端口都可以访问，实际场景中，可以通过 Nginx 负载均衡进行反向代理，统一一个地址进行转发。

首先下载安装一个Nginx，这里就不赘述了，然后在nginx中添加转发配置。

添加upstream，添加节点的服务端口9000和控制台端口地址，服务采用轮询模式，分摊上传下载文件的流量。控制台采用ip_hash，保证来自于同一个客户端的请求始终被转发至同一个upstream服务器（不然不同地址的控制台需要登录密码）。

```java
 upstream minio {
        server 192.168.58.201:9000;
        server 192.168.58.202:9000;
        server 192.168.58.203:9000;
        server 192.168.58.204:9000;
    }
upstream console {
        ip_hash;
        server 192.168.58.201:9001;
        server 192.168.58.202:9001;
        server 192.168.58.203:9001;
        server 192.168.58.204:9001;
    }
```

添加两个server模块，一个代理9000，一个代理9001端口。

```java
	server {
        listen       9000;
        listen  [::]:9000;
        server_name  localhost;
        To allow special characters in headers
        ignore_invalid_headers off;
        Allow any size file to be uploaded.
        Set to a value such as 1000m; to restrict file size to a specific value
        client_max_body_size 0;
        To disable buffering
        proxy_buffering off;
        location / {
            proxy_set_header Host $http_host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_connect_timeout 300;
            Default is HTTP/1, keepalive is only enabled in HTTP/1.1
            proxy_http_version 1.1;
            proxy_set_header Connection "";
            chunked_transfer_encoding off;
            proxy_pass http://minio;
        }
    }
    server {
        listen       9001;
        listen  [::]:9001;
        server_name  localhost;
        To allow special characters in headers
        ignore_invalid_headers off;
        Allow any size file to be uploaded.
        Set to a value such as 1000m; to restrict file size to a specific value
        client_max_body_size 0;
        To disable buffering
        proxy_buffering off;
        location / {
            proxy_set_header Host $http_host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_set_header X-NginX-Proxy true;
            This is necessary to pass the correct IP to be hashed
            real_ip_header X-Real-IP;
            proxy_connect_timeout 300;
            To support websocket
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            chunked_transfer_encoding off;
            proxy_pass http://console;
        }
    }
```

使用nginx服务器地址+9001端口访问控制台：

#### 扩容（摘自官网）

扩容需要修改启动命令，命令后天添加新的节点地址即可，然后重新启动，所以不能动态扩容。。。

例如我们是通过区的方式启动MinIO集群，命令行如下：

```java
export MINIO_ACCESS_KEY=<ACCESS_KEY>
export MINIO_SECRET_KEY=<SECRET_KEY>
minio server http://host{
     1...32}/export{
     1...32}
```

MinIO支持通过命令，指定新的集群来扩展现有集群（纠删码模式），命令行如下：

```java
Copyexport MINIO_ACCESS_KEY=<ACCESS_KEY>
export MINIO_SECRET_KEY=<SECRET_KEY>
minio server http://host{
     1...32}/export{
     1...32} http://host{
     33...64}/export{
     1...32}
```

现在整个集群就扩展了1024个磁盘，总磁盘变为2048个，新的对象上传请求会自动分配到最少使用的集群上。通过以上扩展策略，您就可以按需扩展您的集群。重新配置后重启集群，会立即在集群中生效，并对现有集群无影响。如上命令中，我们可以把原来的集群看做一个区，新增集群看做另一个区，新对象按每个区域中的可用空间比例放置在区域中。在每个区域内，基于确定性哈希算法确定位置。

**说明: 您添加的每个区域必须具有与原始区域相同的磁盘数量（纠删码集）大小，以便维持相同的数据冗余SLA。 例如，第一个区有8个磁盘，您可以将集群扩展为16个、32个或1024个磁盘的区域，您只需确保部署的SLA是原始区域的倍数即可。**
