# 15、Docker - 实战：Docker配置阿里云镜像加速器
- 来源：https://ddkk.com/zhuanlan/container/docker/3/15.html
- 分类：容器服务
- 分组：教程目录
Docker官方镜像仓库地址：[https://hub.docker.com/](https://hub.docker.com/)，因为是该地址是国外地址，如果我们使用的镜像从这里下载，就会非常非常的慢。

所以，我们需要配置一个Docker的国内镜像仓库地址，可以使用阿里云的镜像仓库，这就是Docker配置阿里云镜像加速器。

前提，注册一个阿里云账号。（支付宝和淘宝账号可以直接复用）

### 步骤1：

**登陆阿里云网站。**

### 步骤2：

**找到镜像加速器页面。**

操作：产品 —> 容器与中间件 —> 容器镜像服务ACR。

如下图所示：

进入页面后，点击管理控制台。

进入管理控制台页面后，在左侧栏选项中选择“镜像加速器”。

说明：

我们根据自己的操作系统，选择对应的操作文档，然后按照文档中的内容进行配置即可。

以CentOS系统为例，进行说明，如下：

```java
# 说明脚本片段
# 1.在etc目录下新建一个docker目录
sudo mkdir -p /etc/docker
# 2.在docker目录下创建一个daemon.json文件，并配置阿里云镜像加速地址
sudo tee /etc/docker/daemon.json <<-'EOF'
{
  "registry-mirrors": ["https://y29l3pxp.mirror.aliyuncs.com"]
}
EOF
# 3.重新加载某个服务的配置文件
# 如果新安装了一个服务，归属于systemctl管理，要使新服务的服务程序配置文件生效，需重新加载。
sudo systemctl daemon-reload
# 4.重启docker
sudo systemctl restart docker
```

### 步骤3：

**依次执行上面命令。**

```java
[root@192 ~]# sudo mkdir -p /etc/docker
[root@192 ~]# sudo tee /etc/docker/daemon.json <<-'EOF'
> {
>   "registry-mirrors": ["https://y29l3pxp.mirror.aliyuncs.com"]
> }
> EOF
{
  "registry-mirrors": ["https://y29l3pxp.mirror.aliyuncs.com"]
}
[root@192 ~]# sudo systemctl daemon-reload
[root@192 ~]# sudo systemctl restart docker
```

### 步骤4：

**检查阿里云镜像加速器是否生效。**

可以用`docker info`命令，查看`Registry Mirrors`那一项是否是阿里云的镜像加速地址。

如下：

```java
[root@192 docker]# docker info
Client:
 Context:    default
 Debug Mode: false
 Plugins:
  app: Docker App (Docker Inc., v0.9.1-beta3)
  buildx: Build with BuildKit (Docker Inc., v0.5.1-docker)
Server:
 Containers: 1
  Running: 0
  Paused: 0
  Stopped: 1
 Images: 1
 Server Version: 20.10.5
 Storage Driver: overlay2
  Backing Filesystem: xfs
  Supports d_type: true
  Native Overlay Diff: true
 Logging Driver: json-file
 Cgroup Driver: cgroupfs
 Cgroup Version: 1
 Plugins:
  Volume: local
  Network: bridge host ipvlan macvlan null overlay
  Log: awslogs fluentd gcplogs gelf journald json-file local logentries splunk syslog
 Swarm: inactive
 Runtimes: io.containerd.runc.v2 io.containerd.runtime.v1.linux runc
 Default Runtime: runc
 Init Binary: docker-init
 containerd version: 05f951a3781f4f2c1911b05e61c160e9c30eaa8e
 runc version: 12644e614e25b05da6fd08a38ffa0cfe1903fdec
 init version: de40ad0
 Security Options:
  seccomp
   Profile: default
 Kernel Version: 3.10.0-1127.el7.x86_64
 Operating System: CentOS Linux 7 (Core)
 OSType: linux
 Architecture: x86_64
 CPUs: 1
 Total Memory: 972.3MiB
 Name: 192.168.134.129
 ID: 3FXQ:IECC:SYGU:OZEZ:JFUM:2N57:WS2M:FUJW:CJAE:ILZT:2NDL:UAAB
 Docker Root Dir: /var/lib/docker
 Debug Mode: false
 Registry: https://index.docker.io/v1/
 Labels:
 Experimental: false
 Insecure Registries:
  127.0.0.0/8
 看这里
 Registry Mirrors:
  https://yxxl3pxp.mirror.aliyuncs.com/
 Live Restore Enabled: false
WARNING: bridge-nf-call-iptables is disabled
WARNING: bridge-nf-call-ip6tables is disabled
```

如果是CentOS6.8系统，可以执行`ps -ef | grep docker`命令进行验证。

```java
[root@192 docker]# ps -ef | grep docker
root       1590      1  0 11:54 ?        00:00:00 /usr/bin/docker -d --registry-mirror=https://yxxl3pxp.mirror.aliyuncs.com/
root       1723   1381  0 11:57 pts/0    00:00:00 grep --color=auto docker
```

在`/usr/bin/docker`进程（Docker的守护进程在Linux系统中的名称）后边有阿里云镜像仓库地址，就说明阿里云镜像加速器配置成功。

> 说明：阿里云镜像加速器地址，每个人都是不一样的，自己使用自己的就可以。
