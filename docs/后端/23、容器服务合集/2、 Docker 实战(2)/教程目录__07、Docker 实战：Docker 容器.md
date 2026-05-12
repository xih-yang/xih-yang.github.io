# 07、Docker 实战：Docker 容器
- 来源：https://ddkk.com/zhuanlan/container/docker/2/7.html
- 分类：容器服务
- 分组：教程目录
在上一章节中我们使用 docker run 命令运行了一个 Hello World 开启了 Docker 容器的使用

每次遇到这种新的技术，我都有一个待解问题，到底有多少命令，我要怎么使用它们

那么，**Docker** 中到底有多少命令呢？

## docker 命令

上一章节中我们所使用的所有命令都以 docker 开头，那如果直接运行 docker 命令会怎么样呢？

答案就是列出 **Docker** 所支持的所有命令

```sh
[root@ddkk.com ~]# docker 
Usage:  docker COMMAND
A self-sufficient runtime for containers
Options:
      --config string      Location of client config files (default "/Users/luojianguo/.docker")
  -D, --debug              Enable debug mode
  -H, --host list          Daemon socket(s) to connect to
  -l, --log-level string   Set the logging level ("debug"|"info"|"warn"|"error"|"fatal") (default "info")
      --tls                Use TLS; implied by --tlsverify
      --tlscacert string   Trust certs signed only by this CA (default "/Users/luojianguo/.docker/ca.pem")
      --tlscert string     Path to TLS certificate file (default "/Users/luojianguo/.docker/cert.pem")
      --tlskey string      Path to TLS key file (default "/Users/luojianguo/.docker/key.pem")
      --tlsverify          Use TLS and verify the remote
  -v, --version            Print version information and quit
Management Commands:
  checkpoint  Manage checkpoints
  config      Manage Docker configs
  container   Manage containers
  image       Manage images
  network     Manage networks
  node        Manage Swarm nodes
  plugin      Manage plugins
  secret      Manage Docker secrets
  service     Manage services
  swarm       Manage Swarm
  system      Manage Docker
  trust       Manage trust on Docker images
  volume      Manage volumes
Commands:
  attach      Attach local standard input, output, and error streams to a running container
  build       Build an image from a Dockerfile
  commit      Create a new image from a container's changes
  cp          Copy files/folders between a container and the local filesystem
  create      Create a new container
  deploy      Deploy a new stack or update an existing stack
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

很长的命令列表，不过只要关注最后一行就好了

大概意思是说可以通过命令 **docker command –help** 更深入的了解指定的 Docker 命令使用方法

例如我们要查看 **docker stats** 指令的具体使用方法

可以输入如下的命令

```sh
[root@ddkk.com ~]# docker stats --help
Usage:  docker stats [OPTIONS] [CONTAINER...]
Display a live stream of container(s) resource usage statistics
Options:
  -a, --all             Show all containers (default shows just running)
      --format string   Pretty-print images using a Go template
      --no-stream       Disable streaming stats and only pull the first result
      --no-trunc        Do not truncate output
```
