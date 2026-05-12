# 14、Docker 实战：Portainer可视化面板安装
- 来源：https://ddkk.com/zhuanlan/container/docker/4/14.html
- 分类：容器服务
- 分组：教程目录
## 官网

[https://documentation.portainer.io/v2.0-be/deploy/beinstalldocker/](https://documentation.portainer.io/v2.0-be/deploy/beinstalldocker/)

## 可视化

- portainer

```java
docker run -d -p 8088:9000 --restart=always -v /var/run/docker.sock:/var/run/docker.sock --privileged=true portainer/portainer
```

- Rancher（[测试高级进阶 - CI/CD][- CI_CD]）

### 什么是portainer

Docker图形化界面管理工具！提供一个后天面板供我们操作！

```java
# 运行portainer
[root@ddkk.com ~]# docker run -d -p 8088:9000 --restart=always -v /var/run/docker.sock:/var/run/docker.sock --privileged=true portainer/portainer
Unable to find image 'portainer/portainer:latest' locally
latest: Pulling from portainer/portainer
94cfa856b2b1: Pull complete 
49d59ee0881a: Pull complete 
a2300fd28637: Pull complete 
Digest: sha256:fb45b43738646048a0a0cc74fcee2865b69efde857e710126084ee5de9be0f3f
Status: Downloaded newer image for portainer/portainer:latest
3b6ca0890fa0b220896752457e61b1139bbf0014f5f405a8b47868cfc7d0aba6
#访问portainer  宿主机IP:8088
```

```java
#选择本地的Docker
```

```java
#实际工作中，不会用这个可视化面板，搭建起来，玩一玩，扩充知识面
```
