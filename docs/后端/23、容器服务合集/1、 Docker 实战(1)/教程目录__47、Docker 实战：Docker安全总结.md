# 47、Docker 实战：Docker安全总结
- 来源：https://ddkk.com/zhuanlan/container/docker/1/47.html
- 分类：容器服务
- 分组：教程目录
总体来看，Docker 容器还是十分安全的，特别是在容器内不使用 root 权限来运行进程的话。

另外，用户可以使用现有工具，比如 Apparmor, SELinux, GRSEC 来增强安全性；甚至自己在内核中实现更复杂的安全机制。
