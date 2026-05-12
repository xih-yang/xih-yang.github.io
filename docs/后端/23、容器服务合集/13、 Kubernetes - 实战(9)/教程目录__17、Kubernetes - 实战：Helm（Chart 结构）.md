# 17、Kubernetes - 实战：Helm（Chart 结构）
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/9/17.html
- 分类：容器服务
- 分组：教程目录
## Chart

Helm 使用一种名为 charts 的包格式，一个 chart 是描述一组相关的 Kubernetes 资源的文件集合。单个 chart 既可以用于部署简单的应用，也可以是复杂的应用。

Charts 是创建在特定目录下面的文件集合，然后可以将它们打包到一个版本化的存档中来部署。

## 目录结构

chart 被组织为一个目录中的文件集合，目录名称就是 chart 的名称（不包含版本信息），下面是一个 WordPress 的 chart，会被存储在 `wordpress/` 目录下面，基本结构如下所示：

```java
wordpress/
  Chart.yaml          包含当前 chart 信息的 YAML 文件
  LICENSE             可选：包含 chart 的 license 的文本文件
  README.md           可选：说明介绍文件
  values.yaml         当前 chart 的默认配置 values
  values.schema.json  可选: 一个作用在 values.yaml 文件上的 JSON 模式
  charts/             包含该 chart 依赖的所有 chart 的目录
  crds/               Custom Resource Definitions
  templates/          模板目录，与 values 结合使用时，将渲染生成 Kubernetes 资源清单文件
  templates/NOTES.txt 可选: 包含简短使用使用的文本文件
```

## Chart.yaml

对于一个 chart 包来说 `Chart.yaml` 文件是必须的，它包含下面的这些字段：

```java
apiVersion: chart API 版本 (必须)，对于 Helm 3 以上的版本应该是 v2
name: chart 名 (必须)
version: SemVer 2版本 (必须)，比如设置为：1.2.3，则 chart 最终名称为 xxx-1.2.3.tgz
kubeVersion: 兼容的 Kubernetes 版本 (可选)
description: 一句话描述 (可选)
type: chart 类型 (可选)，可以定义两种类型：应用程序（application）和库（library）
keywords:
  - 当前项目关键字集合 (可选)
home: 当前项目的 URL (可选)
sources:
  - 当前项目源码 URL (可选)
dependencies: chart 依赖列表 (可选)
  - name: chart 名称 (nginx)
    version: chart 版本 ("1.2.3")
    repository: 字段是 chart 仓库的完整 URL，必须使用 helm repo add 在本地添加该 repo
    alias: 定义别名 (可选)
maintainers: (可选)
  - name: 维护者名字 (对每个 maintainer 是必须的)
    email: 维护者的 email (可选)
    url: 维护者 URL (可选)
icon: chart 的 SVG 或者 PNG 图标 URL (可选).
appVersion: 包含的应用程序版本 (可选). 比如 MySQL 5.7，这里可以设置为 5.7，该设置并不会影响包
deprecated: chart 是否已被弃用 (可选, boolean)
```

## LICENSE，README.md，NOTES.txt

LICENSE 是一个纯文本文件，其中包含 Chart 的许可证书。

README.md 文件采用 Markdown 格式编写，一般用于介绍该 Chart 的用途，使用方法等。

NOTES.txt 是一个纯文本文件，该文件将在安装后以及查看 release 状态的时候打印出来。通常被用于显示使用说明。比如 MySQL 在安装之后弹出的提示信息。

## charts

一个chart 包可能会依赖许多其他的 chart。这些依赖关系可以使用 `Chart.yaml` 中的 dependencies 字段动态链接，也可以引入到 `charts/` 目录手动进行管理。

在Charts.yaml 文件中，通过 dependencies 字段定义的依赖 chart，可以使用 `helm dependency update` 进行更新。它会根据依赖项文件把指定的 chart 包下载到 `charts/` 目录中。

## templates 和 values

Helm Chart 模板是用 `Go template` 语言进行编写的，另外还额外增加了 `Sprig` 库中的 50 个左右的附加模板函数和一些其他 `专用函数`。

GoTemplate：

> https://golang.org/pkg/text/template/

Spring 库：

> https://github.com/Masterminds/sprig

其它函数：

> https://helm.sh/docs/howto/charts_tips_and_tricks/

所有模板文件都存储在 chart 的 `templates/` 目录下面，当 Helm 渲染 charts 的时候，它将通过模板引擎传递该目录中的每个文件。

模板的`Values` 可以通过两种方式提供：

- values.yaml 文件，包含默认的 values 值。
- 用户自定义包含 values 值的 YAML 文件，在 helm install 的时候指定文件。

需要注意的是：用户自定义 values 会覆盖 chart 中 `values.yaml` 文件中相应的值。

templates 目录下资源清单示例：

```java
apiVersion: apps/v1
kind: Deployment
metadata:
  name: chart-deploy-demo
spec:
  selector:
    matchLabels:
      app: nginx
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
      - name: nginx
        image: {{ .Values.ImageName }}:{{ .Values.ImageTag | default latest }}
        ports:
        - containerPort: {{ .Values.ServicePort }}
```

在模板资源清单中，可以通过 `.Values` 获取到 values.yaml（或者 --set）里面定义的 values 值。此外，还可以访问一些在 Helm 中预定义的值：

- Release.Name：Release 的名称，该值在使用 install 安装之后才会生成，可能是用户指定的也可能是自动生成的。
- Release.Namespace：Release 运行之后的名称空间。
- Release.Service：理想中是渲染该模板的 Service 名称。
- Release.IsUpgrade：判断当前操作时 Upgrade 还是 Rollout。
- Release.IsInstall：如果当前操作时 install，则为 true。
- Chart：可以获取到 Chart.yaml 文件中的内容，比如 Chart.Version 可以获取到 Version 字段。
- Capabilities：类 map 对象，包含了 Kubernetes 信息。比如：{{ .Capabilities.KubeVersion }}

> 任何未知的 Chart.yaml 字段都可能会被删除，导致在 Chart 对象内部无法访问他们，所以只推荐使用 values 文件来传递。

示例values.yaml：

```java
name: dylan
age: 18
service:
  name: apache
  version: 1.0
config:
  port: 80
global:
  app: nginx
```

values.yaml 文件可以为 chart 以及他的任何依赖项提供 values 值。通过 `.Values.name` 或者 `.Values.service.name` 获取对应的值。

global 可以设置一个全局的值，这意味着既可以通过 `.Values.global.app` 获取到值，也可以在 service 或者 config下面获取：`.Values.service.global.app` 或者 `.Values.config.global.app`。

values.shema.json 文件和 values.yaml 的用途一样，不过该文件时 JSON 格式的数据，而不是 YAML。

## crds

Kubernetes 提供了一种声明新类型的 Kubernetes 对象的机制，使用 `CustomResourceDefinitions（CRDS）`，可以让 Kubernetes 开发人员声明自定义资源类型。

在Helm 3 中，CRD 被视为一种特殊的对象，它们在 chart 部署之前被安装，并且会受到一些限制。CRD YAML 放在 `crds/` 目录下。多个 CRDS 可以放在同一个文件中，Helm 将尝试将 CRD 目录中的所有文件加载到 Kubernetes 中。

> CRD 文件不能模板化，它们必须是纯的 YAML 文件。

当Helm 安装一个新的 chart 的时候，它将会安装 CRDS，然后会暂停直到 API Server 提供 CRD 为止，然后才开始启动模板引擎，渲染其余的 chart 模板，并将其安装到 Kubernetes 中。

所以CRD 信息在 Helm 模板的 `.Capabilities` 对象中是可以获取到的，并且 Helm 模板可能会创建在 CRD 中声明的对象的新实例。

与Kubernetes 中的大多数对象不同，CRDS 是全局安装的，所以 Helm 在管理 CRD 的时候会有一些限制：

- CRDS 不会重新安装，如果 Helm 确定 crds/ 目录中的 CRD 已经存在（无论版本如何），Helm 都不会重新安装或升级。
- CRDS 不会在升级或回滚的时候安装，只会在安装操作的时候创建。
- CRDS 不会被删除，删除 CRD 会自动删除集群中所有 namespace 中的 CRDS 内容。

Helm 希望想要升级或删除 CRDS 的操作人员可以手动来仔细地操作。

## 管理 Chart

**1、** 拉取仓库中的现有的Chart包：；

```java
helm pull stable/mysql
```

如图所示：

**1、** 创建自己的Chart：；

```java
helm create mychart
```

如图所示：

通过脚手架创建的模板 Chart，可以在它基础上进行修改。里面包含了很多资源清单的模板用法。

**1、** 将编辑好的Chart打包：；

```java
helm package mychart
```

**1、** 格式检查：；

```java
helm lint mychart
```

**1、** 试运行资源清单，查看生成的资源清单：；

```java
helm install mychart mychart/ --dry-run
# 或者
helm template mychart mychart/
```

install 相对于 template 能多初始化一些参数。

## Chart 仓库

chart 仓库实际上就是一个 HTTP 服务器，其中包含一个或多个打包的 chart 包，虽然可以使用 helm 来管理本地 chart 目录，但是在共享 charts 的时候，最好的还是使用 chart 仓库。

可以提供 `YAML` 文件和 `tar` 文件并可以相应 GET 请求的任何 HTTP 服务器都可以作为 chart 仓库服务器。仓库的主要特征是存在一个名为 `index.yaml` 的特殊文件，该文件具有仓库中提供的所有软件包的列表以及允许检索和验证这些软件包的元数据。

在客户端，可以使用 `helm repo` 命令来管理仓库，但是 Helm 不提供用于将 chart 上传到远程 chart 仓库的工具。
