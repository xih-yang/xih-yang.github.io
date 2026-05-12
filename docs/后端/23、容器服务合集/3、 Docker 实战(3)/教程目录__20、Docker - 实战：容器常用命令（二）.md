# 20、Docker - 实战：容器常用命令（二）
- 来源：https://ddkk.com/zhuanlan/container/docker/3/20.html
- 分类：容器服务
- 分组：教程目录
## 9、后台启动容器

后台启动容器也叫启动守护式容器。

命令：`docker run -d 镜像ID或镜像名`

查看本地镜像。

```java
[root@192 ~]# docker images
REPOSITORY   TAG       IMAGE ID       CREATED        SIZE
centos       latest    300e315adb2f   3 months ago   209MB
```

以后台模式启动`centos`容器。

```java
# 使用镜像centos:latest以后台模式启动一个容器
[root@192 ~]# docker run -d centos
57fbb28467164eedf38f118530807840cdaab8497c43d6741a93c36f7ea408a3
```

执行命令后，返回了创建容器的ID，说明该容器一定启动了。

我们通过`docker ps`命令查看启动的容器。

```java
[root@192 ~]# docker ps 
CONTAINER ID   IMAGE     COMMAND   CREATED   STATUS    PORTS     NAMES
```

发现此时宿主机中并没有正在运行的容器。

通过`docker ps -a`命令查看本地容器。

可以发现`57fbb2846716`容器确实被创建过了。

**重点：**

这里就有问题了，使用后台模式启动容器，然后使用`docker ps -a`命令查看到CentOS容器已经停止了。

很重要的说明的一点：**Docker容器后台模式运行，但是容器中要必须有一个前台进程运行。**

Docker容器的运行，如果不是那些一直挂起的命令（比如运行`top`，`tail`），就是会自动退出的，这个是Docker的机制问题。

**说明：**

比如，Docker中的容器，我们还以CentOS容器为例进行说明。

在Docker中CentOS容器使用后台进程模式运行，而CentOS容器中并没有配置项目或者其他应用，也就是没有对外提供的服务，就导致Docker发现该容器前台没有运行的应用，这样的容器启动后Docker会立即杀掉，因为Docker觉得他没事可做了。

所以，最佳的解决方案是，将你要运行的程序以前台进程的形式运行，就是这种容器加上`-it`参数运行。

如下：

（这种模式也是有使用场景的，我们先知道Docker的这种机制就好。）

## 10、查看容器日志

命令：`docker logs -f -t --tail 容器ID`

常用参数说明

- -t：日志信息中入时间截。
- -f：实时追加最新的日志信息。
- --tail 数字：显示最后多少条日志信息。

示例：

如果一个容器没有启动，是无法查看容器的日志信息的。

```java
[root@192 ~]# docker logs -f -t --tail 10 bb442a5cb49d
2021-03-16T08:45:06.614560901Z [root@bb442a5cb49d /]# exit
```

下面以后台的方式运行CentOS镜像，并执行`/bin/sh`的shell脚本语句。

`docker run -d centos /bin/sh -c "while true; do echo hello docker;sleep 5; done"`

`"while true; do echo hello docker; sleep 2; done"`是一个Shell脚本，`while`循环语句，每个5秒钟输出一条信息，打印到控制台上。这样前台就会有一个响应，该容器不会被自动关闭。

```java
# 启动容器
[root@192 ~]# docker run -d centos /bin/sh -c "while true; do echo hello docker;sleep 5; done"
9dcc4c7d9bb832bae1ae09b65d7369a87574d6bd8feee6a21b290405956262fb
# 查看容器是否正在运行
[root@192 ~]# docker ps
CONTAINER ID   IMAGE     COMMAND                  CREATED         STATUS         PORTS     NAMES
9dcc4c7d9bb8   centos    "/bin/sh -c 'while t…"   5 seconds ago   Up 5 seconds             tender_tu
# 查看9dcc4c7d9bb8的日志内容
[root@192 ~]# docker logs -f -t --tail 10 9dcc4c7d9bb8 
2021-03-16T08:50:52.620056356Z hello docker
2021-03-16T08:50:57.625131661Z hello docker
2021-03-16T08:51:02.635728333Z hello docker
2021-03-16T08:51:07.636232055Z hello docker
2021-03-16T08:51:12.639010605Z hello docker
2021-03-16T08:51:17.646571107Z hello docker
2021-03-16T08:51:22.650222917Z hello docker
2021-03-16T08:51:27.655182933Z hello docker
2021-03-16T08:51:32.658490433Z hello docker
2021-03-16T08:51:37.668576884Z hello docker
2021-03-16T08:51:42.672759944Z hello docker
2021-03-16T08:51:47.681343058Z hello docker
```

如果容器没有日志信息，就什么也不显示，`ctrl+c`退出查看日志。

## 11、查看容器内运行的进程

命令：`docker top 容器ID`

示例：

```java
# 查看本地镜像
[root@192 ~]# docker images
REPOSITORY   TAG       IMAGE ID       CREATED        SIZE
centos       latest    300e315adb2f   3 months ago   209MB
# 后台模式运行该镜像
[root@192 ~]# docker run -d -it centos /bin/sh
584d65a113b4c102506127a7353869c2be851a63200861c1afae6b68500b3044
# 查看宿主机正在运行的容器
[root@192 ~]# docker ps
CONTAINER ID   IMAGE     COMMAND     CREATED         STATUS       PORTS   NAMES
584d65a113b4   centos    "/bin/sh"   5 seconds ago   Up 4 seconds         great_golick
# 查看该容器中运行的进程
[root@192 ~]# docker top 584d65a113b4
UID    PID    PPID   C   STIME    TTY     TIME      CMD
root   3887   3866   0   16:59    pts/0   00:00:00  /bin/sh
```

同Linux系统中的`top`命令一样。

如果以后`kill`容器中的进程的时候，就可以通过`docker top`来查看对应程序的进程。

## 12、查看容器内部细节

命令：`docker inspect 容器ID`（重要命令）

先来查看一下当前宿主机的容器。

```java
[root@192 ~]# docker ps -n 2
CONTAINER ID   IMAGE     COMMAND                  CREATED          STATUS
584d65a113b4   centos    "/bin/sh"                13 minutes ago   Exited (0) 4 minutes
9dcc4c7d9bb8   centos    "/bin/sh -c 'while t…"   21 minutes ago   Exited (137) 19
```

查看第一个容器的内部数据，结果是数组格式的Json串。（对一些内容进行了简单的注释）

```java
[root@192 ~]# docker inspect 584d65a113b4 
[
    {	# 镜像的ID
        "Id": "584d65a113b4c102506127a7353869c2be851a63200861c1afae6b68500b3044",
        "Created": "2021-03-16T08:59:07.033486283Z", 镜像创建的时间
        "Path": "/bin/sh", 默认的/bin/sh控制台
        "Args": [], 给容器传递的参入，如之前的循环shell脚本，就会显示在这里。
        "State": {
            "Status": "exited",  当前容器的状态
            "Running": false,
            "Paused": false,
            "Restarting": false,
            "OOMKilled": false,
            "Dead": false,
            "Pid": 0,
            "ExitCode": 0,
            "Error": "",
            "StartedAt": "2021-03-16T08:59:07.63603117Z",
            "FinishedAt": "2021-03-16T09:08:22.076447319Z"
        }, Image通过哪个镜像创建的
        "Image": "sha256:300e315adb2f96afe5f0b2780b87f28ae95231fe3bdd1e16b9ba606307728f55",
        "ResolvConfPath": "/var/lib/docker/containers/584d65a113b4c102506127a7353869c2be851a63200861c1afae6b68500b3044/resolv.conf",
        "HostnamePath": "/var/lib/docker/containers/584d65a113b4c102506127a7353869c2be851a63200861c1afae6b68500b3044/hostname",
        "HostsPath": "/var/lib/docker/containers/584d65a113b4c102506127a7353869c2be851a63200861c1afae6b68500b3044/hosts",
        "LogPath": "/var/lib/docker/containers/584d65a113b4c102506127a7353869c2be851a63200861c1afae6b68500b3044/584d65a113b4c102506127a7353869c2be851a63200861c1afae6b68500b3044-json.log",
        "Name": "/great_golick",
        "RestartCount": 0,
        "Driver": "overlay2",
        "Platform": "linux",
        "MountLabel": "",
        "ProcessLabel": "",
        "AppArmorProfile": "",
        "ExecIDs": null,
        "HostConfig": { 关于主机的配置
            "Binds": null,
            "ContainerIDFile": "",
            "LogConfig": {
                "Type": "json-file",
                "Config": {}
            },
            "NetworkMode": "default",
            "PortBindings": {},
            "RestartPolicy": {
                "Name": "no",
                "MaximumRetryCount": 0
            },
            "AutoRemove": false,
            "VolumeDriver": "",
            "VolumesFrom": null,
            "CapAdd": null,
            "CapDrop": null,
            "CgroupnsMode": "host",
            "Dns": [],
            "DnsOptions": [],
            "DnsSearch": [],
            "ExtraHosts": null,
            "GroupAdd": null,
            "IpcMode": "private",
            "Cgroup": "",
            "Links": null,
            "OomScoreAdj": 0,
            "PidMode": "",
            "Privileged": false,
            "PublishAllPorts": false,
            "ReadonlyRootfs": false,
            "SecurityOpt": null,
            "UTSMode": "",
            "UsernsMode": "",
            "ShmSize": 67108864,
            "Runtime": "runc",
            "ConsoleSize": [
                0,
                0
            ],
            "Isolation": "",
            "CpuShares": 0,
            "Memory": 0,
            "NanoCpus": 0,
            "CgroupParent": "",
            "BlkioWeight": 0,
            "BlkioWeightDevice": [],
            "BlkioDeviceReadBps": null,
            "BlkioDeviceWriteBps": null,
            "BlkioDeviceReadIOps": null,
            "BlkioDeviceWriteIOps": null,
            "CpuPeriod": 0,
            "CpuQuota": 0,
            "CpuRealtimePeriod": 0,
            "CpuRealtimeRuntime": 0,
            "CpusetCpus": "",
            "CpusetMems": "",
            "Devices": [],
            "DeviceCgroupRules": null,
            "DeviceRequests": null,
            "KernelMemory": 0,
            "KernelMemoryTCP": 0,
            "MemoryReservation": 0,
            "MemorySwap": 0,
            "MemorySwappiness": null,
            "OomKillDisable": false,
            "PidsLimit": null,
            "Ulimits": null,
            "CpuCount": 0,
            "CpuPercent": 0,
            "IOMaximumIOps": 0,
            "IOMaximumBandwidth": 0,
            "MaskedPaths": [
                "/proc/asound",
                "/proc/acpi",
                "/proc/kcore",
                "/proc/keys",
                "/proc/latency_stats",
                "/proc/timer_list",
                "/proc/timer_stats",
                "/proc/sched_debug",
                "/proc/scsi",
                "/sys/firmware"
            ],
            "ReadonlyPaths": [
                "/proc/bus",
                "/proc/fs",
                "/proc/irq",
                "/proc/sys",
                "/proc/sysrq-trigger"
            ]
        },
        "GraphDriver": {
            "Data": {
                "LowerDir": "/var/lib/docker/overlay2/3369ebf4eef0b52a8f86cdf1bf0ffffcf4742a688f1d71535480a8796ef94004-init/diff:/var/lib/docker/overlay2/83104bc5fd9a73441b58817e409b2d96eb833d823663aa9d18bb095f63b81348/diff",
                "MergedDir": "/var/lib/docker/overlay2/3369ebf4eef0b52a8f86cdf1bf0ffffcf4742a688f1d71535480a8796ef94004/merged",
                "UpperDir": "/var/lib/docker/overlay2/3369ebf4eef0b52a8f86cdf1bf0ffffcf4742a688f1d71535480a8796ef94004/diff",
                "WorkDir": "/var/lib/docker/overlay2/3369ebf4eef0b52a8f86cdf1bf0ffffcf4742a688f1d71535480a8796ef94004/work"
            },
            "Name": "overlay2"
        },
        "Mounts": [],  关于挂着的配置
        "Config": { 主机的基本配置
            "Hostname": "584d65a113b4", 系统的Hostname名称，就是命令提示符中的名称。
            "Domainname": "",
            "User": "",
            "AttachStdin": false,
            "AttachStdout": false,
            "AttachStderr": false,
            "Tty": true,
            "OpenStdin": true,
            "StdinOnce": false,
            "Env": [ 基本的环境变量配置
                "PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
            ],
            "Cmd": [ cmd可以使用命令的配置
                "/bin/sh"
            ],
            "Image": "centos",
            "Volumes": null,
            "WorkingDir": "",
            "Entrypoint": null,
            "OnBuild": null,
            "Labels": {
                "org.label-schema.build-date": "20201204",
                "org.label-schema.license": "GPLv2",
                "org.label-schema.name": "CentOS Base Image",
                "org.label-schema.schema-version": "1.0",
                "org.label-schema.vendor": "CentOS"
            }
        },
        "NetworkSettings": { 关于网络的相关配置
            "Bridge": "",
            "SandboxID": "5a19bf6168476cde70fdbf051d02f87b29b64bdbe6ea4cd8239b1c20e7a26334",
            "HairpinMode": false,
            "LinkLocalIPv6Address": "",
            "LinkLocalIPv6PrefixLen": 0,
            "Ports": {},
            "SandboxKey": "/var/run/docker/netns/5a19bf616847",
            "SecondaryIPAddresses": null,
            "SecondaryIPv6Addresses": null,
            "EndpointID": "",
            "Gateway": "",
            "GlobalIPv6Address": "",
            "GlobalIPv6PrefixLen": 0,
            "IPAddress": "",
            "IPPrefixLen": 0,
            "IPv6Gateway": "",
            "MacAddress": "",
            "Networks": {
                "bridge": { 桥接的网卡配置
                    "IPAMConfig": null,
                    "Links": null,
                    "Aliases": null,
                    "NetworkID": "dad7da5bcfec541f2c8b9182444c6f23e5c681d8c55e39b9a871b3b312362a61",
                    "EndpointID": "",
                    "Gateway": "",
                    "IPAddress": "",
                    "IPPrefixLen": 0,
                    "IPv6Gateway": "",
                    "GlobalIPv6Address": "",
                    "GlobalIPv6PrefixLen": 0,
                    "MacAddress": "",
                    "DriverOpts": null
                }
            }
        }
    }
]
```
