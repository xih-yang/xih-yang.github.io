# 17、Docker - 实战：帮助命令
- 来源：https://ddkk.com/zhuanlan/container/docker/3/17.html
- 分类：容器服务
- 分组：教程目录
## 1、docker version命令

命令：`docker version`，作用是显示显示Docker的版本信息。

```java
# 显示docker的版本信息
[root@192 docker]# docker version
Client: Docker Engine - Community
 Version:           20.10.5
 API version:       1.41
 Go version:        go1.13.15
 Git commit:        55c4c88
 Built:             Tue Mar  2 20:33:55 2021
 OS/Arch:           linux/amd64
 Context:           default
 Experimental:      true
Server: Docker Engine - Community
 Engine:
  Version:          20.10.5
  API version:      1.41 (minimum version 1.12)
  Go version:       go1.13.15
  Git commit:       363e9a8
  Built:            Tue Mar  2 20:32:17 2021
  OS/Arch:          linux/amd64
  Experimental:     false
 containerd:
  Version:          1.4.4
  GitCommit:        05f951a3781f4f2c1911b05e61c160e9c30eaa8e
 runc:
  Version:          1.0.0-rc93
  GitCommit:        12644e614e25b05da6fd08a38ffa0cfe1903fdec
 docker-init:
  Version:          0.19.0
  GitCommit:        de40ad0
```

## 2、docker info命令

命令：`docker info`，作用是显示Docker的系统信息，比`docker version`显示的信息更加详细，包括镜像和容器的数量。

```java
[root@192 docker]# docker info
Client:  docker客户端信息
 Context:    default
 Debug Mode: false
 Plugins:  插件信息
  app: Docker App (Docker Inc., v0.9.1-beta3)
  buildx: Build with BuildKit (Docker Inc., v0.5.1-docker)
Server:  docker服务器端信息
 Containers: 1  容器数量
  Running: 0  正在运行的容器数量
  Paused: 0  暂停的容器数量
  Stopped: 1  已停止的容器数量
 Images: 1  镜像数量
 Server Version: 20.10.5  docker服务器版本
 Storage Driver: overlay2  docker存储驱动程序
  Backing Filesystem: xfs  文件系统
  Supports d_type: true
  Native Overlay Diff: true
 Logging Driver: json-file  日志驱动程序
 Cgroup Driver: cgroupfs  Cgroup驱动程序
 Cgroup Version: 1  Cgroup驱动版本
 Plugins:  插件信息
  Volume: local
  Network: bridge host ipvlan macvlan null overlay
  Log: awslogs fluentd gcplogs gelf journald json-file local logentries splunk syslog
 Swarm: inactive  Swarm状态
 Runtimes: runc io.containerd.runc.v2 io.containerd.runtime.v1.linux  runtimes信息
 Default Runtime: runc  默认runtime
 Init Binary: docker-init
 containerd version: 05f951a3781f4f2c1911b05e61c160e9c30eaa8e
 runc version: 12644e614e25b05da6fd08a38ffa0cfe1903fdec
 init version: de40ad0
 Security Options:  安全选项
  seccomp
   Profile: default
 Kernel Version: 3.10.0-1127.el7.x86_64  linux内核版本
 Operating System: CentOS Linux 7 (Core)  linux操作系统
 OSType: linux  操作系统类型
 Architecture: x86_64
 CPUs: 1  宿主机CPU数量
 Total Memory: 972.3MiB  宿主机内存
 Name: 192.168.134.129  宿主机名称
 ID: 3FXQ:IECC:SYGU:OZEZ:JFUM:2N57:WS2M:FUJW:CJAE:ILZT:2NDL:UAAB
 Docker Root Dir: /var/lib/docker  docker根目录
 Debug Mode: false
 Registry: https://index.docker.io/v1/  
 Labels:
 Experimental: false
 Insecure Registries:
  127.0.0.0/8
 Registry Mirrors: 镜像仓库
  https://y29l3pxp.mirror.aliyuncs.com/
 Live Restore Enabled: false
WARNING: bridge-nf-call-iptables is disabled
WARNING: bridge-nf-call-ip6tables is disabled
```

## 3、docker --help命令（重点）

Docker的帮助命令：

可以执行`docker --help`，查看Docker的全部命令。

也可以执行`docker 命令 --help`，查看具体命令的使用说明。

示例如下：

```java
[root@192 docker]# docker --help
Usage:  docker [OPTIONS] COMMAND docker命令的使用方式 ,[]表示可以省略
A self-sufficient runtime for containers
Options: 选项
      --config string      Location of client config files (default "/root/.docker")
  -c, --context string     Name of the context to use to connect to the daemon (overrides DOCKER_HOST env var and default context set with "docker context use")
  -D, --debug              Enable debug mode
  -H, --host list          Daemon socket(s) to connect to
  -l, --log-level string   Set the logging level ("debug"|"info"|"warn"|"error"|"fatal") (default "info")
      --tls                Use TLS; implied by --tlsverify
      --tlscacert string   Trust certs signed only by this CA (default "/root/.docker/ca.pem")
      --tlscert string     Path to TLS certificate file (default "/root/.docker/cert.pem")
      --tlskey string      Path to TLS key file (default "/root/.docker/key.pem")
      --tlsverify          Use TLS and verify the remote
  -v, --version            Print version information and quit
Management Commands: docker管理类命令
  app*        Docker App (Docker Inc., v0.9.1-beta3)
  builder     Manage builds
  buildx*     Build with BuildKit (Docker Inc., v0.5.1-docker)
  config      Manage Docker configs
  container   Manage containers
  context     Manage contexts
  image       Manage images
  manifest    Manage Docker image manifests and manifest lists
  network     Manage networks
  node        Manage Swarm nodes
  plugin      Manage plugins
  secret      Manage Docker secrets
  service     Manage services
  stack       Manage Docker stacks
  swarm       Manage Swarm
  system      Manage Docker
  trust       Manage trust on Docker images
  volume      Manage volumes
Commands:  docker命令
  attach      Attach local standard input, output, and error streams to a running container
  build       Build an image from a Dockerfile
  commit      Create a new image from a container's changes
  cp          Copy files/folders between a container and the local filesystem
  create      Create a new container
  diff        Inspect changes to files or directories on a container's filesystem
  events      Get real time events from the server
  exec        Run a command in a running container
  export      Export a container's filesystem as a tar archive
  history     Show the history of an image
  images      List images
  import      Import the contents from a tarball to create a filesystem image
  info        Display system-wide information
  inspect     Return low-level information on Docker objects
  kill        Kill one or more running containers
  load        Load an image from a tar archive or STDIN
  login       Log in to a Docker registry
  logout      Log out from a Docker registry
  logs        Fetch the logs of a container
  pause       Pause all processes within one or more containers
  port        List port mappings or a specific mapping for the container
  ps          List containers
  pull        Pull an image or a repository from a registry
  push        Push an image or a repository to a registry
  rename      Rename a container
  restart     Restart one or more containers
  rm          Remove one or more containers
  rmi         Remove one or more images
  run         Run a command in a new container
  save        Save one or more images to a tar archive (streamed to STDOUT by default)
  search      Search the Docker Hub for images
  start       Start one or more stopped containers
  stats       Display a live stream of container(s) resource usage statistics
  stop        Stop one or more running containers
  tag         Create a tag TARGET_IMAGE that refers to SOURCE_IMAGE
  top         Display the running processes of a container
  unpause     Unpause all processes within one or more containers
  update      Update configuration of one or more containers
  version     Show the Docker version information
  wait        Block until one or more containers stop, then print their exit codes
Run 'docker COMMAND --help' for more information on a command.
```

我们也可以在Docker的官方文档中，来查看Docker所有命令的使用方法。

网址：[https://docs.docker.com/](https://docs.docker.com/)

在页面中点击`Reference`(参考)。

然后在左侧栏中`Command-line reference —> Docker CLI (docker)`，即可查看Docker的所有命令。

直达地址：[https://docs.docker.com/reference/](https://docs.docker.com/reference/)
