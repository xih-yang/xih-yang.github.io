# 40、Hadoop 教程 - Hadoop YARN Resource 资源配置
- 来源：https://ddkk.com/zhuanlan/bigdata/hadoop/2/40.html
- 分类：大数据框架
- 分组：教程目录
## 1. YARN Resource资源配置

YARN 支持可扩展的资源模型。**默认情况下，YARN会跟踪所有节点，应用程序和队列的CPU和内存**，但资源定义可以扩展为包含任意 “countable” 资源。`可数资源是在容器运行时消耗的资源，但之后会释放`，CPU 和内存都是可数资源。

此外，YARN 还支持使用 “resource profiles”，允许用户通过单个配置文件指定多个资源请求，例如，“large” 可能意味着 8 个虚拟内核和 16GB RAM。

默认情况，提交 MapReduce 程序运行至 YARN 集群时，日志信息中显示出`resource-types.xml资源类型配置文件未到`，原因在于没有进行 YARN Resource 配置。

## 2. 资源配置参数

如果进行 YARN Resource 配置，相关参数说明如下：

**启动资源配置：yarn-site.xml**

- 参数：`yarn.resourcemanager.resource-profiles.enabled`，是否启用资源配置文件支持，默认为 false；
- **资源类型配置：resource-types.xml**
- 参数：`yarn.resource-types`，逗号分隔的附加资源列表；
- 参数：`yarn.resource-types..units`，指定资源类型的默认单位；
- 参数：`yarn.resource-types..minimum-allocation`，指定资源类型的最小请求；
- 参数：`yarn.resource-types..minimum-allocation`，指定资源类型的最大请求；
- **节点资源配置：node-resource.xml**

参数：`yarn.nodemanager.resource-type.`，节点管理器中可用的指定资源的数量；

注意，如果使用`resource-types.xml`和`node-resources.xml`文件，则还需要将它们放在与`yarn-site.xml`相同的配置目录`[$HADOOP_HOME/etc/hadoop]`中，或者将属性放入`yarn-site.xml`文件中。

## 3. YARN资源模型

YARN 在资源模型设置与管理中，可以分为2个方面：ResourceManager 和 NodeManager 设置。

### 3.1 Resource Manager

资源管理器是跟踪集群中哪些资源的最终仲裁者。资源管理器从 XML 配置文件加载其资源定义。例如，要定义除 CPU 和内存之外的新资源，应配置以下属性：

```java
<property>
	<name>yarn.resource-types</name>
	<value>resource1,resource2</value>
	<description>
		The resources to be used for scheduling. 
Use resource-types.xml to specify details about the individual resource types.
	</description>
</property>
```

对于定义的每个新资源类型，可以添加可选的单元属性以设置资源类型的默认单位，及具有可选的最小和最大属性。可以定义`yarn-site.xml`文件或在一个文件名为`resource-types.xml`中。

```java
<configuration>
	<property>
		<name>yarn.resource-types</name>
		<value>resource1, resource2</value>
	</property>
	<property>
		<name>yarn.resource-types.resource1.units</name>
		<value>G</value>
	</property>
	<property>
		<name>yarn.resource-types.resource2.minimum-allocation</name>
		<value>1</value>
	</property>
	<property>
		<name>yarn.resource-types.resource2.maximum-allocation</name>
		<value>1024</value>
	</property>
</configuration>
```

### 3.2 Node Manager

每个节点管理器独立定义该节点可用的资源。资源定义是通过为每个可用资源设置属性来完成的，可以放在通常的`yarn-site.xml`文件或名为`noderesources.xml`的文件中。属性的值应该是节点提供的资源量。例如：

```java
<configuration>
	<property>
		<name>yarn.nodemanager.resource-type.resource1</name>
		<value>5G</value>
	</property>
	<property>
		<name>yarn.nodemanager.resource-type.resource2</name>
		<value>2m</value>
	</property>
</configuration>
```

注意，此处资源的单位不需要与资源管理器持有的定义匹配，如果单位不匹配，会自动进行转换。

## 4. MapReduce 使用 Resource

MapReduce 从 YARN 请求三种不同类型的容器：master container，map containers 和 reduce containers 。对于每种容器类型，都有一组相应的属性可用于设置所请求的资源。

在MapReduce 中设置资源请求的属性是：

属性
描述

yarn.app.mapreduce.am.resource.memory-mb
将应用程序主容器请求的内存设置为以 MB 为单位的值。默认为 1536

yarn.app.mapreduce.am.resource.vcores
将应用程序 master container 请求的 CPU 设置为该值。默认为 1

yarn.app.mapreduce.am.resource.
将应用程序 master container 的 请求的数量设置为该值

mapreduce.map.resource.memory-mb
将所有 map master container 请求的内存设置为以 MB 为单位的值。默认为 1024

mapreduce.map.resource.vcores
将所有映射 map master container 请求的 CPU 设置为该值。默认为 1

mapreduce.map.resource.
将所有 map master container 的  请求的数量设置为该值

mapreduce.reduce.resource.memory-mb
将所有 educe task container 请求的内存设置为以 MB 为单位的值。默认为 1024

mapreduce.reduce.resource.
将所有 educe task container 的  请求的数量设置为该值

注意，YARN 可以修改这些资源请求以满足配置的最小和最大资源值，或者是配置增量的倍数。
