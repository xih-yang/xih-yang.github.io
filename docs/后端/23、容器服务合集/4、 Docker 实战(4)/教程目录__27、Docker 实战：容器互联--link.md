# 27、Docker 实战：容器互联--link
- 来源：https://ddkk.com/zhuanlan/container/docker/4/27.html
- 分类：容器服务
- 分组：教程目录
### 思考

思考一个场景，我们编写了一个微服务，database url=IP：，项目不重启，数据库ip换掉了，我们希望可以处理这个问题，可以使用**名字来进行访问容器**吗

### 实践

```java
[root@ddkk.com ~]# docker exec -it tomcat02 ping tomcat01
ping: tomcat01: Name or service not known
# 如何可以解决呢？
# 通过 --link 即可以解决了网络连通问题
[root@ddkk.com ~]# docker run -d -P --name tomcat03 --link tomcat02 tomcat
9e655559aba4b48c79d775fa8dd995cc7342578b8c21864200eeb2cf9349b231
[root@ddkk.com ~]# docker exec -it tomcat03 ping tomcat02
PING tomcat02 (172.17.0.4) 56(84) bytes of data.
64 bytes from tomcat02 (172.17.0.4): icmp_seq=1 ttl=64 time=0.148 ms
64 bytes from tomcat02 (172.17.0.4): icmp_seq=2 ttl=64 time=0.067 ms
64 bytes from tomcat02 (172.17.0.4): icmp_seq=3 ttl=64 time=0.067 ms
64 bytes from tomcat02 (172.17.0.4): icmp_seq=4 ttl=64 time=0.059 ms
# 反向可以ping通吗？
[root@ddkk.com ~]# docker exec -it tomcat02 ping tomcat03
ping: tomcat03: Name or service not known
```

探究：inspect

```java
# 查看host 配置，在这里发现
[root@ddkk.com ~]# docker exec -it tomcat03 cat /etc/hosts
127.0.0.1    localhost
::1    localhost ip6-localhost ip6-loopback
fe00::0    ip6-localnet
ff00::0    ip6-mcastprefix
ff02::1    ip6-allnodes
ff02::2    ip6-allrouters
172.17.0.4    tomcat02 fc32be6aff5c
172.17.0.5    9e655559aba4
```

**总结：**

- --link就是在hosts配置中增加了目标对象的网络信息，是单向的
- 不建议使用--link，推荐使用自定义网络
