# 08、Docker 实战：常用其他命令(1) | 日志、元数据、进程的查看
- 来源：https://ddkk.com/zhuanlan/container/docker/4/8.html
- 分类：容器服务
- 分组：教程目录
### 后台启动容器

```java
# 命令 docker run -d 镜像名
[root@ddkk.com ~]# docker run -d centos
#问题：docker ps，发现centos停止了
#常见的坑：docker容器使用后台运行，就必须要有一个前台进程，docker发现没有应用，就会自动停止
#nginx，容器启动后，发现自己没有提供服务，就会立刻停止，就是没有程序了
```

### 查看日志命令

```java
命令：docker logs -f -t --tail 显示多少条 容器ID
#自己编写一段shell脚本，输出日志
[root@ddkk.com ~]# docker run -d centos /bin/bash -c "while true;do echo gelaotou;sleep 2;done"
#查看当前容器是否正在运行
[root@ddkk.com ~]# docker ps
CONTAINER ID   IMAGE     COMMAND                  CREATED         STATUS         PORTS     NAMES
6a6584c42e03   centos    "/bin/bash -c 'while…"   4 seconds ago   Up 4 seconds             inspiring_sanderson
#显示日志
-tf　　　　　　　　　　　　#显示日志
　　--tail number　　　　#要显示的日志条数
[root@ddkk.com ~]# docker logs -f -t --tail 10 6a6584c42e03
```

### 查看容器中进程信息

```java
#命令：docker top 容器ID
[root@ddkk.com ~]# docker top 6a6584c42e03
UID                 PID                 PPID                C                   STIME               TTY                 TIME                CMD
root                51000               50979               0                   18:58               ?                   00:00:00            /bin/bash -c while true;do echo gelaotou;sleep 2;done
root                51415               51000               0                   19:07               ?                   00:00:00            /usr/bin/coreutils --coreutils-prog-shebang=sleep /usr/bin/sleep 2
```

### 查看容器元数据

```java
#命令：docker inspect 容器ID
#测试
[root@ddkk.com ~]# docker inspect 6a6584c42e03
[
    {
        "Id": "6a6584c42e03848a0758154af092f29f9a5fc8aecc0c1141e992777fd6c78ab4",
        "Created": "2021-08-25T10:58:55.237518044Z",
        "Path": "/bin/bash",
        "Args": [
            "-c",
            "while true;do echo gelaotou;sleep 2;done"
        ],
        "State": {
            "Status": "running",
            "Running": true,
            "Paused": false,
            "Restarting": false,
            "OOMKilled": false,
            "Dead": false,
            "Pid": 51000,
            "ExitCode": 0,
            "Error": "",
            "StartedAt": "2021-08-25T10:58:55.562799979Z",
            "FinishedAt": "0001-01-01T00:00:00Z"
        },
        "Image": "sha256:300e315adb2f96afe5f0b2780b87f28ae95231fe3bdd1e16b9ba606307728f55",
        "ResolvConfPath": "/var/lib/docker/containers/6a6584c42e03848a0758154af092f29f9a5fc8aecc0c1141e992777fd6c78ab4/resolv.conf",
        "HostnamePath": "/var/lib/docker/containers/6a6584c42e03848a0758154af092f29f9a5fc8aecc0c1141e992777fd6c78ab4/hostname",
        "HostsPath": "/var/lib/docker/containers/6a6584c42e03848a0758154af092f29f9a5fc8aecc0c1141e992777fd6c78ab4/hosts",
        "LogPath": "/var/lib/docker/containers/6a6584c42e03848a0758154af092f29f9a5fc8aecc0c1141e992777fd6c78ab4/6a6584c42e03848a0758154af092f29f9a5fc8aecc0c1141e992777fd6c78ab4-json.log",
        "Name": "/inspiring_sanderson",
        "RestartCount": 0,
        "Driver": "overlay2",
        "Platform": "linux",
        "MountLabel": "",
        "ProcessLabel": "",
        "AppArmorProfile": "",
        "ExecIDs": null,
        "HostConfig": {
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
                "LowerDir": "/var/lib/docker/overlay2/ddb28e0803ddb17fddd599156bf2972e622e2b9cf54113749615486fe80591a1-init/diff:/var/lib/docker/overlay2/faab2e64b4dd218161992d5efe5b6e8e44ccf5521803fc5649fb77db73288f1f/diff",
                "MergedDir": "/var/lib/docker/overlay2/ddb28e0803ddb17fddd599156bf2972e622e2b9cf54113749615486fe80591a1/merged",
                "UpperDir": "/var/lib/docker/overlay2/ddb28e0803ddb17fddd599156bf2972e622e2b9cf54113749615486fe80591a1/diff",
                "WorkDir": "/var/lib/docker/overlay2/ddb28e0803ddb17fddd599156bf2972e622e2b9cf54113749615486fe80591a1/work"
            },
            "Name": "overlay2"
        },
        "Mounts": [],
        "Config": {
            "Hostname": "6a6584c42e03",
            "Domainname": "",
            "User": "",
            "AttachStdin": false,
            "AttachStdout": false,
            "AttachStderr": false,
            "Tty": false,
            "OpenStdin": false,
            "StdinOnce": false,
            "Env": [
                "PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
            ],
            "Cmd": [
                "/bin/bash",
                "-c",
                "while true;do echo gelaotou;sleep 2;done"
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
        "NetworkSettings": {
            "Bridge": "",
            "SandboxID": "10d59ad59c9be98cc6e612f1bf3e830b0eabf447326c4d2ba51509dac5e22ff5",
            "HairpinMode": false,
            "LinkLocalIPv6Address": "",
            "LinkLocalIPv6PrefixLen": 0,
            "Ports": {},
            "SandboxKey": "/var/run/docker/netns/10d59ad59c9b",
            "SecondaryIPAddresses": null,
            "SecondaryIPv6Addresses": null,
            "EndpointID": "ebe304791568263b91f5c86170880878c2b9d683e5643e8e25604b160d02fd30",
            "Gateway": "172.17.0.1",
            "GlobalIPv6Address": "",
            "GlobalIPv6PrefixLen": 0,
            "IPAddress": "172.17.0.2",
            "IPPrefixLen": 16,
            "IPv6Gateway": "",
            "MacAddress": "02:42:ac:11:00:02",
            "Networks": {
                "bridge": {
                    "IPAMConfig": null,
                    "Links": null,
                    "Aliases": null,
                    "NetworkID": "11632f3244eab18afa1c1339d4298e0c535ed6bff5fc6522f50b11f5f286ee30",
                    "EndpointID": "ebe304791568263b91f5c86170880878c2b9d683e5643e8e25604b160d02fd30",
                    "Gateway": "172.17.0.1",
                    "IPAddress": "172.17.0.2",
                    "IPPrefixLen": 16,
                    "IPv6Gateway": "",
                    "GlobalIPv6Address": "",
                    "GlobalIPv6PrefixLen": 0,
                    "MacAddress": "02:42:ac:11:00:02",
                    "DriverOpts": null
                }
            }
        }
    }
]
```
