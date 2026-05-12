# 04、Docker 实战：run的流程和docker原理
- 来源：https://ddkk.com/zhuanlan/container/docker/4/4.html
- 分类：容器服务
- 分组：教程目录
### 回顾HelloWorld流程

### 底层工作原理

**Docker是怎么工作的？**

- Docker是一个Client-Server结构的系统，Docker的守护进程运行在宿主机上。通过Socket从客户端访问
- DockerServer接收到Docker-Client的执行，就会实行这个命令

**Docker为什么比VM快**

- Docker有着比虚拟机更少的抽象层
- Docker利用的是宿主机的内核，VM需要Guest OS

所以说，新建一个容器的时候，docker不需要像虚拟机一样重新加载一个操作系统内核，避免引导。虚拟机是加载Guest OS，分钟级别的；而docker是利用宿主机的操作系统，省略了这个复杂的过程，秒级
