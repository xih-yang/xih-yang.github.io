# 17、Kubernetes - 实战：自己创建一个Helm Chart
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/11/17.html
- 分类：容器服务
- 分组：教程目录
## 1、创建与打包

创建一个自己的chart，叫mychart，执行后，自动生成一系列文件，结构如图

进入mychart，

编辑Chart.yaml文件，指定chart的版本为0.1.0，app版本为v1

编辑values.yaml 文件，指定镜像为myapp，版本为v1

检查是否有语句错误

仓库新建一个项目charts

将应用打包

添加认证密钥，更新密钥，添加自己的私有仓库路径。`helm repo list`可以查看已经添加的仓库路径

## 2、上传到私有仓库

现在我想上传我的mychart到仓库，但是默认没有push命令，需要手动添加push插件。

下载helm-push_0.9.0_linux_amd64.tar.gz包，查看变量，plugins

根据上面看到的路径，创建子目录，

解压tar包到指定路径，查看，现在使用helm可以补齐出push

```java
helm push mychart-0.1.0.tgz westos --insecure -u admin -p westos
	%上传mychart，起名字为westos，登陆用户为admin，密码为westos
```

现在在仓库就可以查看到了

刷新repo，就可查找到mychart包

## 3、安装mychart

从仓库中安装mychart

查看pod和服务都正常启动。测试访问成功，版本为v1

## 4、升级

```java
[root@server1 helm]# cd mychart/		%进入mychart目录
[root@server1 mychart]# vim Chart.yaml 
version: 0.2.0		%版本升级为0.2.0
appversion : v2
[root@server1 mychart]# vim values.yaml 
tag: "v2"		%镜像修改为v2版本
```

检测语法错误，再次打包，上传

刷新repo，`-l`参数可以查看到所有的版本

升级时，只要upgrade就可以更换版本

测试，更换成功

## 5、回滚

当然如果升级版本后发现问题，我们可以很方便的回滚

## 6、卸载

如果完全不想要了，可以`helm uninstall mychart`卸载chart
