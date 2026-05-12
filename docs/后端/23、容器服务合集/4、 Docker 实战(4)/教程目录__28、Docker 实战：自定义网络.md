# 28、Docker 实战：自定义网络
- 来源：https://ddkk.com/zhuanlan/container/docker/4/28.html
- 分类：容器服务
- 分组：教程目录
### 自定义网络

**网络模式**

- bridge：桥接docker（默认，自己创建也可以使用bridge模式）
- none：不配置网络
- host：和宿主机共享网络
- container：容器网络联通！（用的少！局限性大）

**测试**

```java
# 我们直接启动的命令 --net bridge,而这个就是我们的docker0
docker run -d -P --name tomcat01 tomcat
docker run -d -P --name tomcat01 --net bridge tomcat
#docker0特点：默认，域名不能访问，--link可以打通连接
```

```java
# 我们可以自定义一个网络
[root@ddkk.com ~]# docker network create --driver bridge --subnet 192.168.0.0/16 --gateway 192.168.0.1 mynet
05ae4e10b2e876177c40a9c8aa9507169e02783934c433ad12cf4ae26713858b
[root@ddkk.com ~]# docker network ls
NETWORK ID     NAME      DRIVER    SCOPE
11632f3244ea   bridge    bridge    local
ddcb49155b29   host      host      local
05ae4e10b2e8   mynet     bridge    local
5613165b4f9c   none      null      local
```

```java
[root@ddkk.com ~]# docker run -d -P --name tomcat-net-01 --net mynet tomcat
5e4adafd341eea41cd31589d25d7b8ee53fa33df5cc66148676a522d4a0044c6
[root@ddkk.com ~]# docker run -d -P --name tomcat-net-02 --net mynet tomcat
6a0a608ba03d693b88a387141750a585db6beb434b4b8d799412bb6b6074cc6c
[root@ddkk.com ~]# docker inspect mynet
[
    {
        "Name": "mynet",
        "Id": "05ae4e10b2e876177c40a9c8aa9507169e02783934c433ad12cf4ae26713858b",
        "Created": "2021-08-30T20:46:39.917882973+08:00",
        "Scope": "local",
        "Driver": "bridge",
        "EnableIPv6": false,
        "IPAM": {
            "Driver": "default",
            "Options": {},
            "Config": [
                {
                    "Subnet": "192.168.0.0/16",
                    "Gateway": "192.168.0.1"
                }
            ]
        },
        "Internal": false,
        "Attachable": false,
        "Ingress": false,
        "ConfigFrom": {
            "Network": ""
        },
        "ConfigOnly": false,
        "Containers": {
            "5e4adafd341eea41cd31589d25d7b8ee53fa33df5cc66148676a522d4a0044c6": {
                "Name": "tomcat-net-01",
                "EndpointID": "6b3c784f32759e45c43391a8a79a00937e0c347a4cccffc5bdcb3de6d709c6e0",
                "MacAddress": "02:42:c0:a8:00:02",
                "IPv4Address": "192.168.0.2/16",
                "IPv6Address": ""
            },
            "6a0a608ba03d693b88a387141750a585db6beb434b4b8d799412bb6b6074cc6c": {
                "Name": "tomcat-net-02",
                "EndpointID": "4d8fff4471f6164aa3cf33af8686cc737cd8b9e73d6bdc2851e04f5095395a39",
                "MacAddress": "02:42:c0:a8:00:03",
                "IPv4Address": "192.168.0.3/16",
                "IPv6Address": ""
            }
        },
        "Options": {},
        "Labels": {}
    }
]
```

```java
#测试
[root@ddkk.com ~]# docker exec -it tomcat-net-01 ping tomcat-net-02
PING tomcat-net-02 (192.168.0.3) 56(84) bytes of data.
64 bytes from tomcat-net-02.mynet (192.168.0.3): icmp_seq=1 ttl=64 time=0.096 ms
64 bytes from tomcat-net-02.mynet (192.168.0.3): icmp_seq=2 ttl=64 time=0.059 ms
[root@ddkk.com ~]#  docker exec -it tomcat-net-02 ping tomcat-net-01
PING tomcat-net-01 (192.168.0.2) 56(84) bytes of data.
64 bytes from tomcat-net-01.mynet (192.168.0.2): icmp_seq=1 ttl=64 time=0.128 ms
64 bytes from tomcat-net-01.mynet (192.168.0.2): icmp_seq=2 ttl=64 time=0.061 ms
```

**总结**

自定义网络，不同的集群使用不同的网络，保证集群是安全和健康的
