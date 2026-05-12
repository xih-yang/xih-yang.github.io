# 16、Kubernetes - 实战：Helm 基础使用
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/9/16.html
- 分类：容器服务
- 分组：教程目录
## Helm

Helm 可以帮助管理 Kubernetes 应用程序，其作用类似于 CentOS 的 yum。对于越来越复杂的 Kubernetes 应用程序来说，如果单纯依靠手动维护应用程序的 YAML 资源清单文件，成本是巨大的，此时 Helm 就解决了这方面的难题。通过使用 Helm Charts，可以定义、安装和升级复杂的 Kubernetes 应用程序。

## 安装 Helm

安装前提：在需要使用 Helm 命令的节点上能够通过 kubectl 访问集群，Helm 其实就是读取的 kubeconfig 文件来访问集群。

同时由于 Helm V2 版本必须在 Kubernetes 集群中安装一个 Tiller 服务进行通信，这样大大降低了其安全性和可用性，所以在 V3 版本中移除了服务端，采用了通用的 Kubernetes CRD 资源来进行管理，这样就只需要连接上 Kubernetes 即可。直接去 Github 下载即可，我这里采用的最新版 `3.11.1`。

```java
# 下载解压安装
wget https://get.helm.sh/helm-v3.11.1-linux-amd64.tar.gz
tar -zxf helm-v3.11.1-linux-amd64.tar.gz 
mv linux-amd64/helm  /opt/service/kubernetes/server/bin/
# 查看安装结果
helm version
# 配置命令提示补全
echo "source <(helm completion bash)" >> /etc/profile
source /etc/profile
```

Helm 客户端安装完成后，就需要类似 yum 配置 yum 源一样进行仓库配置。最常用的就是官方的 Helm stable charts 仓库，但由于国内网络问题，可以使用微软的 charts 仓库代替：

```java
# 添加名称为 stable 的仓库
helm repo add stable http://mirror.azure.cn/kubernetes/charts/
# 查看仓库列表
helm repo list
```

如图所示：

## 安装 Chart 包

可以使用 `helm install` 命令安装一个 chart 包。Helm 有多种方法来找到和安装 chart 包，最简单的就是使用官方的 `stable` 这个仓库直接安装。

首先从仓库中将可用的 charts 信息同步到本地，可以确保获取到最新的 charts 列表：

```java
# 同步信息
helm repo update
# 安装包
helm install stable/mysql --generate-name
```

如果没有指定名称，则此时会提示 `Error: INSTALLATION FAILED: must either provide a name or specify --generate-name`，让配置或随机生成一个。同时需要注意，名称只支持 `_`，不支持 `-`。

完成后会输出 MySQL 一些部署信息：

安装成功的应用叫做一个 `release`，可以通过它进行筛选查看对应 release 创建的所有资源：

```java
kubectl get all -l release="mysql-1677926923"
```

如图所示：

相当于创建了一个 Deployment 和一个 Service。

其它操作：

```java
# 查看 chart 包的相关信息
helm show chart stable/mysql
# 查看已经通过 helm 安装的 release，想要看到 uninstalled 状态的 release 则需要 -a 参数
helm ls -a
# 查看 release 状态
helm status mysql-1677926923
# 删除 release
helm uninstall mysql-1677926923
```

注意：`uninstall` 命令会从 Kubernetes 中删除 release，也会删除与 release 相关的所有 Kubernetes 资源以及 release 历史记录。如果想要保留 release 的历史记录，可以在删除的时候使用 `--keep-history` 参数。通过该删除删除的 release，查看 status 的时候显示的状态会是 `uninstalled`，而不是找不到。

如图所示：

如果是uninstalled 状态，还可以对它进行回滚：

```java
# 回滚 release，需要指定对应的 reversion 版本
helm rollback mysql-1677926923 1
```

`helm install` 命令可以从多个源进行安装：

- chart 仓库（类似于上面的方法）
- 本地 chart 压缩包（helm install foo-0.1.1.tgz）
- 本地解压缩的 chart 目录（helm install foo path/foo）
- 在线的 URL（helm install foo [https://example.com/charts/foo-1.2.3.tgz](https://example.com/charts/foo-1.2.3.tgz)）

## 定制 Chart 包

通过上面的方法直接 install 安装的 Chart 包只会是默认的配置，这在生产中往往是不够用的。一般都需要用户对它进行配置。

```java
# 查看 Chart 包支持自定义的配置参数
helm show values stable/mysql
```

可以通过创建 YAML 对显示的字段进行覆写，新建 config.yaml：

```java
mysqlRootPassword: root123
mysqlUser: hello
mysqlPassword: world
mysqlDatabase: demo
```

安装的时候指定文件：

```java
helm install mysql -f config.yaml stable/mysql
```

通过查看 Pod 的环境变量可以看到配置：

在安装过程中，有两种方法可以传递配置数据：

- --values（-f）：指定一个 YAML 文件来覆盖 values 值，可以指定多个值。
- --set：在命令行上指定覆盖的配置。

如果同时使用这两个参数，`--values（-f）` 将被合并到具有更高优先级的 `--set`。使用 --set 指定的值将持久化在 ConfigMap 中。

已经存在的 release 可以获取到设置的 values：

```java
helm get values mysql
```

已设置的值也通过允许 `helm upgrade` 并指定 `--reset` 值来清除。

`--set` 的用法与 YAML 对应关系：

```java
# 单个值，YAML 示例：
# name: dylan
--set name=dylan
# 多个值，YAML 示例：
# name: dylan
# age: 18
--set name=dylan,age=18
# 多层级，YAML 示例：
# info:
#   name: dylan
--set info.name=dylan
# 列表数组，YAML 示例：
# list:
#   - a
#   - b
--set list={a,b}
# 设置数组中的某个值，YAML 示例：
# info:
#   - name: user1
#     age: 18
--set info[0].age=18
# 特殊字符转义，YAML 示例：
# nodeSelector:
#   kubernetes.io/role: master
--set nodeSelector."kubernetes\.io/role"=master
```

可以看出 --set 很多时候对于复杂的结构是很难用，所有更推荐 YAML 的方式。

## 升级和回滚

当新版本的 chart 包发布的时候，或者想要更改 release 的配置的时候，可以使用 `helm upgrade` 命令来操作。

升级需要一个现有的 release，并根据提供的信息对其进行升级。因为 Kubernetes charts 可能很大而且很复杂，Helm 会尝试以最小的侵入性进行升级，它只会更新自上一版本以来发生的变化：

```java
# 升级
helm upgrade mysql-1677927765 -f config.yaml stable/mysql
# 查看更新的 value
helm get values mysql-1677927765
```

每一次upgrade，REVISION 的值就会 +1。

如果升级不符合预期，需要回滚到之前的版本，就需要执行下面的命令：

```java
# 查看当前的版本
helm ls
# 查看历史版本
helm history mysql-1677927765
# 回滚到指定版本
helm rollback mysql-1677927765 2
# 查看之前的更新是否还在
helm get values mysql-1677927765
```

如图所示：

相当于发布了一个新版本，只是这个版本跟之前的版本一样。

除此之外，还可以指定一些选项来定制 install/upgrade/rollback 的一些行为，常用的参数有：

- --timeout：等待 Kubernetes 命令完成的时间，默认是 300（5分钟）。
- --wait：等待直到所有 Pods 和其它资源都就绪，然后才标记 release 为成功。将等待与 --timeout 一样长的时间，如果超时，则 release 将标记为失败。
- --no-hooks：将会跳过命令的运行 hooks。
- --recreate-pods：仅适用于 upgrade 和 rollback，这个标志将导致重新创建所有的 Pods。
