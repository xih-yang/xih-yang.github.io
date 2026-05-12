# 12、Docker - 实战：通过RPM软件包方式安装Docker
- 来源：https://ddkk.com/zhuanlan/container/docker/3/12.html
- 分类：容器服务
- 分组：教程目录
> CentOS环境下的Docker官方推荐的三种安装方式
>
>
> yum安装方式
> 本地RPM安装方式
> 脚本安装方式

如果无法使用`yum`方式安装Docker，可以通过先下载Docker的RPM包，然后在本地进行安装。

这种方式在工作的时候推荐使用，因为容易统一环境。

## 1、下载Docker的RPM安装包

**（1）方式一**

通过阿里云镜像网站下载RPM包。

[https://mirrors.aliyun.com/docker-ce/linux/centos/7/x86_64/stable/Packages/](https://links.jianshu.com/go?to=https%3A%2F%2Fmirrors.aliyun.com%2Fdocker-ce%2Flinux%2Fcentos%2F7%2Fx86_64%2Fstable%2FPackages%2F)

> 注意：如果是安装17.03版Docker，还需要下载对应版本的docker-ce-selinux的RPM包，都在上边网址可下载。

**（2）方式二**

可以通过`wget`方式，直接下载到服务器或虚拟机中。

```java
# 下载docker-ce
wget https://mirrors.aliyun.com/docker-ce/linux/centos/7/x86_64/stable/Packages/docker-ce-17.03.0.ce-1.el7.centos.x86_64.rpm 
# 下载docker-ce-selinux
wget https://mirrors.aliyun.com/docker-ce/linux/centos/7/x86_64/stable/Packages/docker-ce-selinux-17.03.0.ce-1.el7.centos.noarch.rpm
```

如果新安装的CentOS系统版本中没有带`wget`工具，执行`$ sudo yum -y install wget`命令即可。

下载好后，把两个包放在同一个文件夹下。

## 2、安装Docker

进入到安装包所在路径，执行 `$ sudo yum -y install *.rpm`

等待安装完成即可。也是非常简单。

## 3、通过RPM安装包安装Docker出现的问题

在执行`$ sudo yum -y install *.rpm`命令的时候，出现了`Transaction check error:`这种情况，说明RPM软件包出现了冲突。

解决方法是：卸载下面的软件包，然后重新安装。

```java
Transaction check error:
  file /usr/bin/docker from install of docker-ce-17.03.0.ce-1.el7.centos.x86_64 conflicts with file from package docker-ce-cli-1:19.03.5-3.el7.x86_64
  file /usr/share/bash-completion/completions/docker from install of docker-ce-17.03.0.ce-1.el7.centos.x86_64 conflicts with file from package docker-ce-cli-1:19.03.5-3.el7.x86_64
  file /usr/share/fish/vendor_completions.d/docker.fish from install of docker-ce-17.03.0.ce-1.el7.centos.x86_64 conflicts with file from package docker-ce-cli-1:19.03.5-3.el7.x86_64
...
...
...
  file /usr/share/man/man8/dockerd.8.gz from install of docker-ce-17.03.0.ce-1.el7.centos.x86_64 conflicts with file from package docker-ce-cli-1:19.03.5-3.el7.x86_64
  file /usr/share/zsh/vendor-completions/_docker from install of docker-ce-17.03.0.ce-1.el7.centos.x86_64 conflicts with file from package docker-ce-cli-1:19.03.5-3.el7.x86_64
错误概要
-------------
```

我们可以看到上边提示中第一行`from package docker-ce-cli-1:19.03.5-3.el7.x86_64`，提示冲突的软件包，所以要删除`docker-ce-cli-1:19.03.5-3.el7.x86_64`这个包。

执行`$ sudo yum erase docker-ce-cli-1:19.03.5-3.el7.x86_64`删除即可。（`erase`：擦除）

```java
删除:
  docker-ce-cli.x86_64 1:19.03.5-3.el7
完毕！
```

再次执行`$ sudo yum -y install *.rpm`就可以正常安装了。

```java
已安装:
  docker-ce.x86_64 0:17.03.0.ce-1.el7.centos                   docker-ce-selinux.noarch 0:17.03.0.ce-1.el7.centos
完毕！
```
