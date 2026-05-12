# 11、HBase版本号和兼容性
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/11.html
- 分类：大数据框架
- 分组：教程目录
## HBase版本号和兼容性

HBase 有两种版本控制方案，分别是：pre-1.0 和 post-1.0。在本节内容中将作出详细的说明。

### HBase post-1.0

从1、0.0 版本开始，HBase 正在致力于 [Semantic Versioning](https://semver.org/) 的发布版本。综上所述：

对于给定的版本号 MAJOR.MINOR.PATCH，增加如下内容：

- MAJOR 版本，当你进行不兼容的 API 更改时
- MINOR 版本，当您以向后兼容的方式添加功能时
- PATCH 版本，当您进行向后兼容的错误修复时
- 预发布和构建元数据的其他标签可作为MAJOR.MINOR.PATCH格式的扩展。

兼容性维度：

除了通常的 API 版本考虑之外，HBase 还有其他需要考虑的兼容性维度。

Client-Server 线协议兼容性：

- 允许不同步更新客户端和服务器。
- 我们只能允许先升级服务器。也就是说，服务器将向后兼容旧客户端，这样新的 API 就可以使用。
- 示例：用户应该能够使用旧客户端连接到升级的群集。

Server-Server 协议兼容性：

- 不同版本的服务器可以共存于同一个群集中。
- 服务器之间的有线协议是兼容的。
- 分布式任务的工作人员（如复制和日志拆分）可以共存于同一个群集中。
- 相关协议（如使用ZK进行协调）也不会改变。
- 示例：用户可以执行滚动升级。

文件格式兼容性：

- 支持文件格式向前和向后兼容
- 示例：文件、ZK 编码、目录布局自动升级为 HBase 升级的一部分。用户可以降级到旧版本，并且一切都将继续工作。

客户端API 兼容性：

- 允许更改或删除现有的客户端 API。
- 在我们更改/删除主要版本之前，API 需要被弃用。
- 修补程序（patch）版本中提供的 API 将在所有后续修补程序版本中提供。但是，可能会添加新的 API，这些 API 在以前的修补程序版本中将不可用。
- 修补程序版本中引入的新 API 只能以源代码兼容的方式添加：即实现公共 API 的代码将继续编译。示例：使用新废用的 API 的用户不需要使用 HBase API 调用修改应用程序代码，直到下一个主要版本。*

客户端二进制兼容性：

- 写入给定修补程序版本中提供的 API 的客户端代码可以运行不变（不需要重新编译），以抵补新的 jar 后续补丁版本。
- 写入给定修补程序版本中提供的 API 的客户端代码可能无法针对早期修补程序版本中的旧 jar 运行。示例：旧编译的客户端代码将在 jar 中保持不变。
- 如果客户端实现 HBase 接口，则可能需要重新编译升级到较新的次要（minor）版本。

服务器端有限的 API 兼容性（取自 Hadoop）：

- 内部API被标记为“稳定（Stable）”，“正在发展（Evolving）”或“不稳定（Unstable）”。
- 这意味着协处理器和插件（可插入类，包括复制）的二进制兼容性，只要这些只使用标记的接口/类。
- 例如：旧编译的协处理器，过滤器或插件代码将在新 jar 中保持不变。

相关性兼容性：

- HBase 的升级不需要依赖项目的兼容升级，包括运行 Java 时。
- 示例：Hadoop 的升级不会使我们所做的任何兼容性保证失效。

操作兼容性：

- 度量标准的更改
- 服务的行为变化
- 通过 /jmx/ 端点公开的 JMX API

概要

- 修补程序（patch）升级是一种直接替代方案。任何不是 Java 二进制和源代码兼容的更改都将不被允许。在修补程序版本中降级版本可能不兼容。
- 次要（minor）升级不需要修改应用程序/客户端代码。理想情况下，这将是一个直接替换，但如果使用新的 jar，则客户端代码，协处理器，过滤器等可能必须重新编译。
- 主要（major）升级允许 HBase 做出重大改变。

以下是兼容性矩阵列表：

Major

Minor

Patch

客户端 – 服务器线路兼容性

不兼容

兼容

兼容

服务器 – 服务器兼容性

不兼容

兼容

兼容

文件格式兼容性

不兼容

兼容

兼容

客户端API兼容性

不兼容

兼容

兼容

客户端二进制兼容性

不兼容

不兼容

兼容

服务器端有限的API兼容性

稳定性（Stable）

不兼容

兼容

兼容

发展性（Evolving）

不兼容

不兼容

兼容

不稳定性（Unstable）

不兼容

不兼容

不兼容

相关性兼容性

不兼容

兼容

兼容

操作兼容性

不兼容

不兼容

兼容

HBase 有很多 API 要点，但对于上面的兼容性矩阵，我们区分了Client API（客户端 API），Limited Private API（有限的私有 API）和 Private API（私有 API）。

- InterfaceAudience（javadocs）：捕捉预期的受众，可能的值包括：
- Public：对于最终用户和外部项目是安全的；
- LimitedPrivate：用于我们期望可插入的内部组件，如协处理器；
- Private：严格用于 HBase 自身内部定义为 IA 的类中，Private 可以用作声明 IA.LimitedPrivate 接口的参数或返回值。将IA.Private对象视为不透明；不要尝试直接访问其方法或字段。
- InterfaceStability（javadocs）：描述允许接口更改的类型。可能的值包括：
- Stable：接口是固定的，预计不会改变；
- Evolving：界面可能会在未来的minor 版本中改变；
- Unstable：界面可能随时更改

请记住HBase 项目中 InterfaceAudience 注释和 InterfaceStability 注释之间的以下相互作用：

- IA.Public 类本质上是稳定的，并坚持我们有关升级类型（主要，次要或修补程序）的稳定性保证。
- IA.LimitedPrivate 类应始终使用给定的 InterfaceStability 值的其中一个进行注释。如果他们不是，你应该假定他们是 IS.Unstable。
- IA.Private 类应该被认为是隐含不稳定的，不能保证发布之间的稳定性。

HBase 客户端 API

HBase 客户端 API 由所有标记有 InterfaceAudience.Public 接口的类或方法组成。hbase-client 和依赖模块中的所有主类都有InterfaceAudience.Public，InterfaceAudience.LimitedPrivate或InterfaceAudience.Private标记。并非所有其他模块（hbase-server等）中的类都有标记。如果一个类没有使用上述中的一个注释，则它被认为是一个InterfaceAudience.Private类。

HBase Limited Private API

LimitedPrivate 注释为接口附带了一组目标使用者。这些使用者是协处理器，phoenix，复制端点实现等。此时，HBase 只能保证修补程序版本之间的这些接口的源和二进制兼容性。

HBase Private API

所有使用InterfaceAudience.Private注释的类或没有注释的所有类仅在HBase内部使用。接口和方法签名可以随时改变。如果您依赖于标记为Private的特定界面，则应打开jira以建议将界面更改为Public或LimitedPrivate，或者为此目的公开的接口。

### HBase Pre 1.0

HBase Pre-1.0 版本都是 EOM：对于新的安装，请勿部署：0.94.y、0.96.y 或 0.98.y，应该部署稳定的版本。

在语义版本化方案 pre-1.0 之前，HBase 追随 Hadoop 的 0.2x 或 0.9x 版本。

二进制兼容性：

当我们说两个 HBase 版本是兼容的时，我们的意思是这些版本是线（wire）和二进制兼容的。兼容的HBase版本意味着客户可以与兼容但不同版本的服务器通话。这也意味着你可以换出一个版本的 jar，并用另一个兼容版本的 jar 替换它们，所有的 jar 都可以工作。除非另有说明，否则 HBase 主要的版本都是二进制兼容的。您可以安全地在二进制兼容版本之间进行滚动升级。

### 滚动升级

滚动升级是您一次更新服务器群集中的服务器的过程。如果它们是二进制或线路兼容的，则可以跨 HBase 版本进行滚动升级。粗略地说，滚动升级是正常地停止每台服务器，更新软件，然后重新启动。您可以为集群中的每个服务器执行此操作。通常先升级 Master，然后再升级 RegionServers。

例如，下面的 HBase 是 symlinked 实际的 HBase 安装。在升级之前，在群集上运行滚动重启之前，我们将 symLink更改为指向新的 HBase 软件版本，然后运行：

```java
$ HADOOP_HOME=~/hadoop-2.6.0-CRC-SNAPSHOT ~/hbase/bin/rolling-restart.sh --config ~/conf_hbase
```

滚动重新启动脚本将首先正常停止并重新启动主服务器，然后依次重新启动每个 RegionServer。由于 symLink被更改，所以重新启动时，服务器将使用新的HBase 版本。随着滚动升级的进行，检查日志中是否有错误。

在兼容二进制/Wire的版本之间进行滚动升级：

除非另有说明，否则 HBase 指向的版本是二进制兼容的。您可以在 HBase 主要版本之间进行滚动升级。例如，您可以通过在集群中进行滚动升级，使用0.94.6二进制文件替换0.94.5二进制文件，从而从 0.94.5 转到 0.94.6。

在次要（minor）版本中，我们调用的版本是有线/协议兼容的，在这种情况下，也可以执行滚动升级。例如，在从 0.98.x 升级到 HBase 1.0.0 时，我们声明可以在 hbase-0.98.x 和 hbase-1.0.0 之间进行滚动升级。
