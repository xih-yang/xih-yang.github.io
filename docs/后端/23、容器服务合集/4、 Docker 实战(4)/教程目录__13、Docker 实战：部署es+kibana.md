# 13、Docker 实战：部署es+kibana
- 来源：https://ddkk.com/zhuanlan/container/docker/4/13.html
- 分类：容器服务
- 分组：教程目录
### 部署elasticsearch

```java
# es 暴露的端口很多
# es 十分的消耗内存
# es 的数据一帮需要放置到安全目录！通过挂载实现
# 👇DockerHub上安装文档，其中 --net somenetwork 选项是网络配置
```

```java
# 启动 elasticsearch
[root@ddkk.com ~]# docker run -d --name elasticsearch -p 9200:9200 -p 9300:9300 -e "discovery.type=single-node" elasticsearch:7.14.0
# 启动了发现Linux卡住了，使用命令 docker status 查看cpu、内存的状况；发现光elasticsearch就吃了4个多G内存。
[root@ddkk.com ~]# docker stats
CONTAINER ID 　　　　NAME 　　　　CPU % 　　MEM USAGE / LIMIT      MEM %      NET I/O        BLOCK I/O     PIDS
a0843281f9b6   elasticsearch   0.04%     4.026GiB / 7.293GiB   55.20%    44MB / 354kB   10.6MB / 172MB   63
#测试一下es
[root@ddkk.com ~]# curl localhost:9200
{
"name" : "a0843281f9b6",
"cluster_name" : "docker-cluster",
"cluster_uuid" : "Oiy5w7f0Sbm9VNH2Rz-ppg",
"version" : {
"number" : "7.14.0",
"build_flavor" : "default",
"build_type" : "docker",
"build_hash" : "dd5a0a2acaa2045ff9624f3729fc8a6f40835aa1",
"build_date" : "2021-07-29T20:49:32.864135063Z",
"build_snapshot" : false,
"lucene_version" : "8.9.0",
"minimum_wire_compatibility_version" : "6.8.0",
"minimum_index_compatibility_version" : "6.0.0-beta1"
},
"tagline" : "You Know, for Search"
}
```

```java
#赶紧关闭，增加启动时对elasticsearch的内存限制,修改配置文件 -e 环境配置修改
[root@ddkk.com ~]# docker run -d --name elasticsearch02 -p 9200:9200 -p 9300:9300 -e "discovery.type=single-node" -e ES_JAVA_OPTS="-Xms64m -Xmx512m" elasticsearch:7.14.0
#查看 docker stats
```

```java
[root@ddkk.com ~]# curl localhost:9200
{
  "name" : "b1c497c3d1ab",
  "cluster_name" : "docker-cluster",
  "cluster_uuid" : "OInWXUf-SuuqJiISHHWnpA",
  "version" : {
    "number" : "7.14.0",
    "build_flavor" : "default",
    "build_type" : "docker",
    "build_hash" : "dd5a0a2acaa2045ff9624f3729fc8a6f40835aa1",
    "build_date" : "2021-07-29T20:49:32.864135063Z",
    "build_snapshot" : false,
    "lucene_version" : "8.9.0",
    "minimum_wire_compatibility_version" : "6.8.0",
    "minimum_index_compatibility_version" : "6.0.0-beta1"
  },
  "tagline" : "You Know, for Search"
}
```

### 部署kibana，连接es

部署了es，下面就是部署kibana连接es，如何连接，这两个都是独立的容器；需要通过linux进行跳转，具体怎么实现，后面的docker网络原理笔记会进行记录
