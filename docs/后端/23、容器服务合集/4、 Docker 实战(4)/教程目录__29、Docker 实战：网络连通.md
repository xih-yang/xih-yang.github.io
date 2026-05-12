# 29、Docker 实战：网络连通
- 来源：https://ddkk.com/zhuanlan/container/docker/4/29.html
- 分类：容器服务
- 分组：教程目录
## 网络连通

### 背景

- 基于docker0建了两个容器tomcat01和tomcat02，网段位于172.12.0.0/16
- 我们又新建了一个网络，网段为192.168.0.0/16，基于此网段新建了两个容器tomcat-net-01和tomcat-net-02

### 问

不同网段的容器能否相互访问，例如tomcat01能否ping通tomcat-net-01

```java
[root@ddkk.com ~]# docker exec tomcat01 ping tomcat-net-01
ping: tomcat-net-01: Name or service not known
```

### 如何解决

```java
# 测试打通 tomcat01 和mynet网络
# 连通之后就是将tomcat01 放到可 mynet 网络下 
[root@ddkk.com ~]# docker network connect mynet tomcat01
[root@ddkk.com ~]# docker inspect mynet
# 相当于就是一个容器两个ip；比如就是阿里云服务，有一个公网ip，还有一个私网ip
```

```java
# tomcat01 成功连接不同网段的 tomcat-net-01
[root@ddkk.com ~]# docker exec -it tomcat01 ping tomcat-net-01
PING tomcat-net-01 (192.168.0.3) 56(84) bytes of data.
64 bytes from tomcat-net-01.mynet (192.168.0.3): icmp_seq=1 ttl=64 time=0.147 ms
64 bytes from tomcat-net-01.mynet (192.168.0.3): icmp_seq=2 ttl=64 time=0.062 ms
^Z64 bytes from tomcat-net-01.mynet (192.168.0.3): icmp_seq=3 ttl=64 time=0.063 ms
64 bytes from tomcat-net-01.mynet (192.168.0.3): icmp_seq=4 ttl=64 time=0.045 ms
```

**总结**

**假设要跨网络操作别人，就需要使用docker network connect 连通**
