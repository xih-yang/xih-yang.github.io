# 11、Docker - 实战：Docker安装的问题补充
- 来源：https://ddkk.com/zhuanlan/container/docker/3/11.html
- 分类：容器服务
- 分组：教程目录
通过`yum`安装Docker的时候，安装20版本的Docker没有出现问题，在安装17版本的时候，出现了问题。

问题复现，下面记录一下这个问题。

## 1、问题复现

**（1）安装17.03版本Docker**

```java
执行
[root@ddkk.com ~]# yum install docker-ce-17.03.0.ce
已加载插件：fastestmirror
Loading mirror speeds from cached hostfile
 * base: mirrors.aliyun.com
 * extras: mirrors.aliyun.com
 * updates: mirrors.aliyun.com
正在解决依赖关系
--> 正在检查事务
---> 软件包 docker-ce.x86_64.0.17.03.0.ce-1.el7.centos 将被 安装
--> 正在处理依赖关系 docker-ce-selinux >= 17.03.0.ce-1.el7.centos，它被软件包 docker-ce-17.03.0.ce-1.el7.centos.x86_64 需要
软件包 docker-ce-selinux 已经被 docker-ce 取代，但是取代的软件包并未满足需求
--> 解决依赖关系完成
错误：软件包：docker-ce-17.03.0.ce-1.el7.centos.x86_64 (docker-ce-stable)
          需要：docker-ce-selinux >= 17.03.0.ce-1.el7.centos
          可用: docker-ce-selinux-17.03.0.ce-1.el7.centos.noarch (docker-ce-stable)
              docker-ce-selinux = 17.03.0.ce-1.el7.centos
          可用: docker-ce-selinux-17.03.1.ce-1.el7.centos.noarch (docker-ce-stable)
              docker-ce-selinux = 17.03.1.ce-1.el7.centos
          可用: docker-ce-selinux-17.03.2.ce-1.el7.centos.noarch (docker-ce-stable)
              docker-ce-selinux = 17.03.2.ce-1.el7.centos
          可用: docker-ce-selinux-17.03.3.ce-1.el7.noarch (docker-ce-stable)
              docker-ce-selinux = 17.03.3.ce-1.el7
 您可以尝试添加 --skip-broken 选项来解决该问题
 您可以尝试执行：rpm -Va --nofiles --nodigest
```

看到上边提示，需要一个依赖包。这个依赖包就是`docker-ce-selinux-17.03.0.ce-1.el7.centos.noarch.rpm`。其实只有`docker-ce`的`17.03`的前几个版本需要上边的依赖包，其他版本不需要。

**（2）安装依赖包docker-ce-selinux**

执行语句：

`yum install https://download.docker.com/linux/centos/7/x86_64/stable/Packages/docker-ce-selinux-17.03.0.ce-1.el7.centos.noarch.rpm`

提示如下：

```java
已加载插件：fastestmirror
docker-ce-selinux-17.03.0.ce-1.el7.centos.noarch.rpm                                                         |  28 kB  00:00:00
正在检查 /var/tmp/yum-root-81R4tG/docker-ce-selinux-17.03.0.ce-1.el7.centos.noarch.rpm: docker-ce-selinux-17.03.0.ce-1.el7.centos.noarch
/var/tmp/yum-root-81R4tG/docker-ce-selinux-17.03.0.ce-1.el7.centos.noarch.rpm 将被安装
正在解决依赖关系
--> 正在检查事务
---> 软件包 docker-ce-selinux.noarch.0.17.03.0.ce-1.el7.centos 将被 安装
--> 处理 docker-ce-selinux-17.03.0.ce-1.el7.centos.noarch 与 docker-selinux 的冲突
Loading mirror speeds from cached hostfile
 * base: mirrors.aliyun.com
 * extras: mirrors.aliyun.com
 * updates: mirrors.aliyun.com
--> 解决依赖关系完成
错误：docker-ce-selinux conflicts with 2:container-selinux-2.107-3.el7.noarch
 您可以尝试添加 --skip-broken 选项来解决该问题
 您可以尝试执行：rpm -Va --nofiles --nodigest
```

可以看到上边显示`错误：docker-ce-selinux conflicts with 2:container-selinux-2.107-3.el7.noarch`，说要安装的`docker-ce-selinux`和主机上已经安装的`container-selinux-2.107-3.el7.noarch`冲突了。

## 2、解决冲突

现在官网上给的解决卸载旧版本Docker命令如下：

```java
$ sudo yum remove docker \
                  docker-client \
                  docker-client-latest \
                  docker-common \
                  docker-latest \
                  docker-latest-logrotate \
                  docker-logrotate \
                  docker-engine
```

命令中并没有关于`docker-ce-selinux`的相关卸载。

添加过滤`docker-selinux`和`docker-engine-selinux`的卸载就可以了。

```java
yum remove docker \
                  docker-client \
                  docker-client-latest \
                  docker-common \
                  docker-latest \
                  docker-latest-logrotate \
                  docker-logrotate \
                  docker-selinux \
                  docker-engine-selinux \
                  docker-engine
```

执行上边语句，如下显示：

```java
已加载插件：fastestmirror
参数 docker 没有匹配
参数 docker-client 没有匹配
参数 docker-client-latest 没有匹配
参数 docker-common 没有匹配
参数 docker-latest 没有匹配
参数 docker-latest-logrotate 没有匹配
参数 docker-logrotate 没有匹配
参数 docker-engine 没有匹配
正在解决依赖关系
--> 正在检查事务
---> 软件包 container-selinux.noarch.2.2.107-3.el7 将被 删除
--> 解决依赖关系完成
依赖关系解决
====================================================================================================================================
 Package                              架构                      版本                               源                          大小
====================================================================================================================================
正在删除:
 container-selinux                    noarch                    2:2.107-3.el7                      @extras                     40 k
事务概要
====================================================================================================================================
移除  1 软件包
安装大小：40 k
是否继续？[y/N]：y
Downloading packages:
Running transaction check
Running transaction test
Transaction test succeeded
Running transaction
  正在删除    : 2:container-selinux-2.107-3.el7.noarch                                                                          1/1 
  验证中      : 2:container-selinux-2.107-3.el7.noarch                                                                          1/1 
删除:
  container-selinux.noarch 2:2.107-3.el7
完毕！
```

可以看到上边已经删除了有冲突的包`container-selinux.noarch 2:2.107-3.el7`.

## 3、重新安装docker-ce-selinux

继续安装`docker-ce-selinux-17.03.0.ce-1.el7.centos.noarch.rpm`

执行语句：

`yum install https://download.docker.com/linux/centos/7/x86_64/stable/Packages/docker-ce-selinux-17.03.0.ce-1.el7.centos.noarch.rpm`

安装结果如下：

```java
已安装:
  docker-ce-selinux.noarch 0:17.03.0.ce-1.el7.centos
完毕！
```

## 4、安装Docker-ce

解决完上边的依赖问题，就可以继续安装Docker-ce。

执行[root@ddkk.com ~]# yum install docker-ce-17.03.0.ce

```java
已安装:
  docker-ce.x86_64 0:17.03.0.ce-1.el7.centos
完毕！
```

到这里问题就解决了。

## 5、总结

这个问题会出现的原因，应该是系统之前安装过Docker，有依赖的包没有卸载干净。如果是新装的系统，应该不会出现上述问题。

以后在出现这样的情况，可以直接按此解决。
