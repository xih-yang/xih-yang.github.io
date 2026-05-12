# 18、Kubernetes - 实战：Helm（语法说明）
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/9/18.html
- 分类：容器服务
- 分组：教程目录
## 内置对象

前面提到过可以在模板中使用 `{{ .Release.Name }}` 获取 release 的名称，Release 是模板中可以访问的几个顶级对象之一：

- Release：该对象描述了 release 本身的相关信息
- `Release.Name`：release 名称
- `Release.Namespace`：release 安装到的命名空间
- `Release.IsUpgrade`：如果当前操作是升级或回滚，是为 true
- `Release.IsInstall`：如果当前操作是否是安装，是为 true
- `Release.Revision`：release 的 revision 版本号，在安装时为1，每次升级或回滚都会+1
- `Release.Service`：渲染当前模板的服务，在 Helm 上，实际上该值始终为 Helm
- Values：从 values.yaml 文件和用户提供的 values 文件传递到模板的 Values 值
- Chart：获取 Chart.yaml 文件的内容，该文件中的任何数据都可以访问
- Files：可以访问 chart 中的所有非特殊文件，虽然无法使用它来访问模板文件，但是可以来访问 chart 中的其他文件。
- `Files.Get`：用于根据名称获取文件（比如 `.Files.Get config.ini`）
- `Files.GetBytes`：用于以 bytes 数组而不是字符串的形式来获取文件内容的函数
- `Files.Glob`：用于返回名称于给定的 shell glob 模式匹配的文件列表
- `Files.Lines`：可以逐行读取文件的函数，对于遍历文件中的每行内容很有用
- `Files.AsSecrets`：将文件内容以 Base64 编码的字符串返回的函数
- `Files.AsConfig`：将文件正文作为 YAML 字典返回的函数
- Capabilities：获取有关 Kubernetes 集群的信息的对象
- `Capabilities.APIVersions`：支持的版本集合
- `Capabilities.APIVersions.Has $version`：判断一个版本（比如 `batch/v1`）或资源（比如 `apps/v1/Deployment`）是否可用
- `Capabilities.Kube.Version`：Kubernetes 的版本
- `Capabilities.Kube`：是 Kubernetes 版本的缩写
- `Capabilities.Kube.Major`：Kubernetes 主版本
- `Capabilities.Kube.Minor`：Kubernetes 的次版本
- Template：当前正在执行的模板的相关信息
- `Name`：当前模板的命名空间文件路径（比如 `mychart/templates/mytemplate.yaml`）
- `BasePath`：当前 chart 的模板目录的命名空间路径（比如 `mychart/templates`）

更多具体用法可以参考官方文档：

> https://helm.sh/zh/docs/howto/charts_tips_and_tricks/

## 函数和管道

通过Values 获取到的数据不一定就是需要的，可能需要经过一定的处理之后才能正常的使用。此时就需要使用到函数。

Helm 有60多种可用的函数，其中一些是由 Go 模板语言本身定义的，其他大多数都是 Sprig 模板库提供的，一般常用的也就是 Spig 模板库的函数 。

同时，模板语言有一个强大的功能就是 `管道（Pipeline）`，它可以将一系列模板命令链接在一起，一起对外提供服务，换句话说，管道能让我们一次使用多个函数。

为了方便测试验证，创建一个新的 helm chart 包，然后清理掉没用的文件：

```java
helm create chartdemo
echo > chartdemo/values.yaml 
rm -rf chartdemo/templates/*
```

创建测试数据：

```java
# chartdemo/values.yaml
name: dylan
age: 18
sports:
  - basketball
  - volleball
  - soccerball
language:
  - name: chinese
    years: 18
  - name: english
    years: 2
```

创建ConfigMap：

```java
# chartdemo/templates/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: {{ .Release.Name }}-ConfigMap
data:
  default 函数，设置默认值
  DefaultFunc1: {{ .Values.name | default "abc" }}
  DefaultFunc2: {{ .Values.app | default "abc" }}
  upper 函数，转换成大写
  UpperFunc: {{ .Values.name | default "abc" | upper }}
  quote 函数，加引号
  QuoteFunc: {{ .Values.name | quote }}
  repeat 函数，重复数据
  RepeatFunc: {{ .Values.name | repeat 5 }}
```

此时可以测试安装，查看输出是否正确：

```java
helm install --generate-name --dry-run chartdemo/
```

想要使用更多函数，可以查看文档：

> https://masterminds.github.io/sprig/

另外需要注意的是：在模板中，运算符（eq、ne、lt、gt、and、or 等等）均实现为函数，在管道中，运算符可以用括号 `()` 进行分割。

## 流程控制

Helm 的模板语言提供了以下一些流程控制：

- if/ else 条件语句
- with 指定一个作用域范围
- range 提供类似于 for each 这样的循环样式

除此之外，还提供了一些声明和使用命名模板的操作：

- define 在模板内部声明一个新的命名模板
- template 导入一个命名模板
- block 声明了一种特殊的可填充模板区域

if/ else 语法模板：

```java
{{ if PIPELINE }}
  todo
{{ else if PIPELINE }}
  todo
{{ else }}
  todo
{{ end }}
```

这里判断内容是管道，而不是一个 values 值。因为控制结构可以执行整个管道，而不仅仅是判断值。如果值为以下内容则为 false：

- 布尔 false
- 数字零
- 一个空字符串
- nil（empty 或者 null）
- 一个空集合（map、slice、tuple、dict、array）

在其他条件下，条件都为真。

测试示例：

```java
apiVersion: v1
kind: ConfigMap
metadata:
  name: {{ .Release.Name }}-ConfigMap
data:
  {{- if eq .Values.name "dylan" }}
  name: {{ .Values.name }}
  {{- else if eq .Values.name "abc" }}
  name: "abc"
  {{- else }}
  name: "no"
  {{- end }}
```

为了方便阅读，每行都单独另起一行，这会导致一个问题，最终生成的数据前面后面都会有一个空行。为了解决这个问题，在每个流程控制函数前面都加了 `-`，这个方法可以去掉空行。

with 语法模板：

```java
{{ with PIPELINE }}
  限制范围
{{ end }}
```

用于控制变量的作用域，然后重新用 `.` 调用就表示对当前作用域的引用。

测试示例：

```java
apiVersion: v1
kind: ConfigMap
metadata:
  name: {{ .Release.Name }}-ConfigMap
data:
  {{- with .Values }}
  {{ .name }}
  {{ .age }}
  {{- end }}
```

range 语法模板：

```java
{{ range PIPELINE }}
  循环
{{ end }}
```

Helm 得模板语言中，迭代集合得方法是使用 `range` 运算符。

测试示例：

```java
apiVersion: v1
kind: ConfigMap
metadata:
  name: {{ .Release.Name }}-ConfigMap
data:
  sports: |-
  {{- range .Values.sports }}
    - {{ . | title }}
  {{- end }}
```

还可以直接循环给出的数据：

```java
sizes: |-
  {{- range tuple "small" "medium" "large" }}
    - {{ . }}
  {{- end }}
```

## 变量

在模板中，变量的使用频率较低，但可以用他们来简化代码，以及更好地使用 `with` 和 `range`。

在前面使用 with 的时候，如果在内部使用 Release 或者其它外部的值得时候是会出错的。原因很简单，他不知道在 with 下面是用的作用域里面的值还是外部的值。为了解决这个问题，就需要使用变量来进行改进。

```java
apiVersion: v1
kind: ConfigMap
metadata:
  name: {{ .Release.Name }}-ConfigMap
data:
  {{- $releaseName := .Release.Name }}
  {{- with .Values }}
  releaseName: {{ $releaseName }}
  name: {{ .name }}
  {{- end }}
```

定义变量的方法有点类似 Golang 中的定义方法，只是需要一个 `$` 符号前缀。

同样在range 循环中也可以用这个特性：

```java
apiVersion: v1
kind: ConfigMap
metadata:
  name: {{ .Release.Name }}-ConfigMap
data: |-
  数组遍历
  {{- range $index, $value := .Values.sports }}
  {{ $index }}:{{ $value }} 
  {{- end }}
  对象遍历
  {{- range $index, $data := .Values.language }}
  {{- range $k, $v := $data }}
  {{ $k }}: {{ $v }}
  {{- end }}
  {{- end }}
```

## 命令模板

之前都是操作的一个模板，有些复杂的需求可能需要操作多个模板文件。可以通过在一个文件中定义命名模板，然后在其他地方使用它们。

当使用命名模板时需要注意：

- 模板名称是全局的，如果声明两个相同名称的模板，则会使用最后被加载的模板。
- 由于子 chart 中的模板是与顶级模板一起编译的，所以需要谨慎命名。

一种流行的命名约定是在每个定义的模板前添加 chart 名称：`{{ define "chartdemo.labels" }}`，通过使用特定的 chart 名作为前缀，可以避免由于两个不同的 chart 实现了相同名称的模板而引起的冲突。

Helm 的模板语言允许创建命名的嵌入式模板，可以在其他位置进行访问。但是需要注意以下命名约定：

- templates/ 中的大多数文件都被视为 Kubernetes 资源清单文件（NOTES.txt 除外）
- 以 _ 开头命名的文件也不会被当做 Kubernetes 资源清单文件
- 下划线开头的文件不会被当做资源清单之外，还可以被其他 chart 模板调用

`_`开头的这些文件其实就是 Helm 中的 `partials` 文件，所以我们完全可以将命名模板定义在这些 `partials` 文件中，默认就是 `_helpers.tpl` 文件。

通过define 创建命名模板：

```java
{{ define "MY.NAME" }}
  模板内容区域
{{ end }}
```

示例：

```java
# chartdemo/templates/configmap.yaml
{{ define "chartdemo.labels" }}
labels:
  app: nginx
  author: {{ .Values.name }}
{{ end }}
apiVersion: v1
kind: ConfigMap
metadata:
  name: myapp
  {{- template "chartdemo.labels" -}}
data:
  key: value
```

可以直接在资源清单中定义，并通过 template 调用它。

不过一般来说，Helm 中约定将这些模板统一放到一个 partials 文件中，通常就是 `_helpers.tpl` 文件中。

此时模板中没有使用到 values 或者预定义的数据，如果使用了，会出现获取不到值的情况。原因在于作用域的问题，想要解决这个问题也很简单，只需要在使用 template 调用的时候将其传过去即可。

```java
{{ template "chartdemo.labels" . }}
```

因为后面的 . 将当期作用域传递过去，所以能在模板中使用 values 等值。

特别注意，在有些时候使用 template 的时候，如 ConfigMap 的 data 数据中。由于 template 只是一个动作，而不是一个函数，所以无法将模板调用的输出传递给其他函数，只是内联插入，所以不能继续用其它函数来对它进行格式调整，那么此时就可能出现 YAML 格式错误的问题。

为了解决这个问题，引入了 `include` 导入模板的方式，该方式就可以利用函数进行二次调整格式，比如：

```java
{{ include "chartdemo.labels" . | indent 2 }}
```

在数据前面空两个格，实现数据 YAML 格式的合法性。通常在使用中也是推荐使用 include 而不是 template。

## 访问文件

有时候需要导入一个不是模板的文件并注入其内容，此时就需要用到 `.Files`。

Helm 提供了一个 `.Files` 对象对文件的访问，但在使用之前需要注意：

- 可以在 Helm chart 中添加额外的文件，但这些文件也会被打包，由于 Kubernetes 对象的存储限制，Charts 必须小于 1M
- 由于一些安全原因，通过 .Files 对象无法访问某些文件
- 无法访问 `templates/` 下面的文件
- 无法访问使用 `.helmignore` 排除的文件
- Chart 不会保留 UNIX 模式的信息，所以，当使用 .Files 对象时，文件级别的权限不会对文件的可用性产生影响。

使用示例 1：读取三个文件

```java
apiVersion: v1
kind: ConfigMap
metadata:
  name: {{ .Release.Name }}-ConfigMap
data:
  {{- $files := .Files }}
  {{- range tuple "f1.conf" "f2.conf" "f3.conf" }}
  {{ . }}: |-
    {{ $files.Get . }}
  {{- end }}
```

结果：

```java
apiVersion: v1
kind: ConfigMap
metadata:
  name: mychart-1576046462-ConfigMap
data:
  f1.conf: |-
    message = 1
  f2.conf: |-
    message = 2
  f3.conf: |-
    message = 3
```

ConfigMap 和 Secret 类型的数据：

```java
apiVersion: v1
kind: ConfigMap
metadata:
  name: configmap-demo
data:
{{ (.Files.Glob "foo/*").AsConfig | indent 2 }}
---
apiVersion: v1
kind: Secret
metadata:
  name: secret-demo
type: Opaque
data:
{{ (.Files.Glob "bar/*").AsSecrets | indent 2 }}
```

base64 编码示例：

```java
apiVersion: v1
kind: Secret
metadata:
  name: {{ .Release.Name }}-secret
type: Opaque
data:
  token: |-
    {{ .Files.Get "f1.config" | b64enc }}
```

逐行读取文件示例：

```java
data:
  some-file.txt: {{ range .Files.Lines "foo/bar.txt" }}
    {{ . }}{{ end }}
```

## NOTES.txt

在chart 安装或者升级结束时，Helm 可以为用户打印出一些有用的信息，使用模板也可以自定义这些信息。

要将安装说明添加到 chart 中，只需要创建一个 `templates/NOTES.txt` 文件，该文件纯文本的，但是可以像模板一样进行处理，并具有所有常规模板的功能和可用对象。

示例：

```java
Thank you for installing {{ .Chart.Name }}.
Your release is named {{ .Release.Name }}.
To learn more about the release, try:
  $ helm status {{ .Release.Name }}
  $ helm get {{ .Release.Name }}
```

用这种方式可以向用户提供一个有关如何使用其新安装的 chart 的详细信息，强烈建议创建 `NOTES.txt` 文件，虽然这不是必须的。

## 子 Chart

上面的操作都是针对于一个 Chart 进行的，某些复杂的操作可能还需要一些依赖项目，也就是子 Chart，也叫 subcharts。

了解子Chart 之前，需要了解子 chart 相关的一些信息：

- 子 chart 是独立的，这意味着子 chart 不能显示依赖其父 chart
- 所以子 chart 无法访问其父级的值
- 父 chart 可以覆盖子 chart 的值
- Helm 中有可以被所有 charts 访问的全局值的概念

比如上面的 chartdemo 项目，可以去该项目下创建子 Chart：

```java
cd chartdemo/charts/
helm create subchartdemo
echo > subchartdemo/values.yaml 
rm -rf subchartdemo/templates/*
```

此时可以在 subchartdemo 的 values.yaml 文件中添加值：

```java
name: subchart
```

通过父Chart 的 values 覆盖子 Chart 中的值：

```java
subchartdemo:
  name: overvalue
```

subchartdemo 中所有的值都会被传递给子 Chart subchartdemo 中进行覆盖。

同时也可以通过 global 定义全局 value，这样父子都可以拿来直接使用。

父级chart 和子 chart 也可以共享模板，任何 chart 中已定义的块都可以用于其他 chart。

## Chart Hook

Helm 也提供了一种 Hook 机制，可以允许 chart 开发人员在 release 生命周期的某些时间点进行干预。比如，可以使用 hook 来进行下面的操作：

- 在加载任何 charts 之前，在安装的时候加载 ConfigMap 或者 Secret
- 在安装新的 chart 之前，执行一个 Job 来备份数据库，然后在升级后执行第二个 Job 还原数据
- 在删除 release 之前运行一个 Job，以在删除 release 之前适当地取消相关服务

Hooks 的工作方式类似于普通的模板，但是他们具有特殊的注解，这些注解使 Helm 可以用不同的方式来使用他们。

在Helm 中定义了如下一些可供使用的 Hooks：

- 预安装 pre-install：在模板渲染后，kubernetes 创建任何资源之前执行
- 安装后 post-install：在所有 kubernetes 资源安装到集群后执行
- 预删除 pre-delete：在从 kubernetes 删除任何资源之前执行删除请求
- 删除后 post-delete：删除所有 release 的资源后执行
- 升级前 pre-upgrade：在模板渲染后，但在任何资源升级之前执行
- 升级后 post-upgrade：在所有资源升级后执行
- 预回滚 pre-rollback：在模板渲染后，在任何资源回滚之前执行
- 回滚后 post-rollback：在修改所有资源后执行回滚请求
- 测试 test：在调用 Helm test 子命令的时候执行

Hooks 就是 Kubernetes 资源清单文件，在元数据部分带有一些特殊的注解，因为他们是模板文件，所以你可以使用普通模板所有的功能，包括读取 `.Values`、`.Release` 和 `.Template`。

```java
apiVersion: batch/v1
kind: Job
metadata:
  name: "{{ .Release.Name }}"
  labels:
    app.kubernetes.io/managed-by: {{ .Release.Service | quote }}
    app.kubernetes.io/instance: {{ .Release.Name | quote }}
    app.kubernetes.io/version: {{ .Chart.AppVersion }}
    helm.sh/chart: "{{ .Chart.Name }}-{{ .Chart.Version }}"
  annotations:
    因为添加了这个 hook，所以这个资源被定义为了 hook
    如果没有这行，则当前这个 Job 会被当成 release 的一部分内容。
    "helm.sh/hook": post-install
    "helm.sh/hook-weight": "-5"
    "helm.sh/hook-delete-policy": hook-succeeded
spec:
  template:
    metadata:
      name: "{{ .Release.Name }}"
      labels:
        app.kubernetes.io/managed-by: {{ .Release.Service | quote }}
        app.kubernetes.io/instance: {{ .Release.Name | quote }}
        helm.sh/chart: "{{ .Chart.Name }}-{{ .Chart.Version }}"
    spec:
      restartPolicy: Never
      containers:
      - name: post-install-job
        image: "busybox:latest"
        command: ["/bin/sleep","{{ default "10" .Values.sleepyTime }}"]
```

同时也可以属于多个 Hook：

```java
annotations:
  "helm.sh/hook": post-install,post-upgrade
```

hook 权重可以是正数也可以是负数，但是必须用字符串表示，当 Helm 开始执行特定种类的 hooks 的时候，它将以升序的方式对这些 hooks 进行排序。

同时，还可以定义确定何时删除相应 hook 资源的策略，hook 删除策略可以使用下面的注解进行定义：

```java
annotations:
  "helm.sh/hook-delete-policy": before-hook-creation,hook-succeeded
```

可以选择一个或多个已定义的注解：

- before-hook-creation：运行一个新的 hook 之前删除前面的资源（默认）
- hook-succeeded：hook 成功执行后删除资源
- hook-failed：hook 如果执行失败则删除资源
