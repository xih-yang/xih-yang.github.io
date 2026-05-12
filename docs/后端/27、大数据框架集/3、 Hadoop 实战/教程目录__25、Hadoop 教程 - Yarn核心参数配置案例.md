# 25、Hadoop 教程 - Yarn核心参数配置案例
- 来源：https://ddkk.com/zhuanlan/bigdata/hadoop/3/25.html
- 分类：大数据框架
- 分组：教程目录
## 1. Yarn核心参数

### 1.1. ResourceManager相关

yarn.resourcemanager.scheduler.class
配置调度器，默认容量

yarn.resourcemanager.scheduler.client.thread-count
ResourceManager处理调度器请求的线程数量，默认50

### 1.2. NodeManager相关

yarn.nodemanager.resource.detect-hardware-capabilities
是否让yarn自己检测硬件进行配置，默认false

yarn.nodemanager.resource.count-logical-processors-as-cores
是否将虚拟核数当作CPU核数，默认false

yarn.nodemanager.resource.pcores-vcores-multiplier
虚拟核数和物理核数乘数，例如：4核8线程，该参数就应设为2，默认1.0

yarn.nodemanager.resource.memory-mb
NodeManager使用内存，默认8G

yarn.nodemanager.resource.system-reserved-memory-mb
NodeManager为系统保留多少内存，使用内存 和 为系统保留多少内存 二个参数配置一个即可

yarn.nodemanager.resource.cpu-vcores
NodeManager使用CPU核数，默认8个

yarn.nodemanager.pmem-check-enabled
是否开启物理内存检查限制container，默认打开

yarn.nodemanager.vmem-check-enabled
是否开启虚拟内存检查限制container，默认打开

yarn.nodemanager.vmem-pmem-ratio
虚拟内存物理内存比例，默认2.1

### 1.3. Container相关

yarn.scheduler.minimum-allocation-mb
容器最最小内存，默认1G

yarn.scheduler.maximum-allocation-mb
容器最最大内存，默认8G

yarn.scheduler.minimum-allocation-vcores
容器最小CPU核数，默认1个

yarn.scheduler.maximum-allocation-vcores
容器最大CPU核数，默认4个

## 2. Yarn案例实操

### 2.1. 需求

从1G数据中，统计每个单词出现次数。服务器3台，每台配置4G内存，4核CPU，4线程。

### 2.2. 需求分析

1G/ 128m = 8个MapTask；1个ReduceTask；1个mrAppMaster

平均每个节点运行10个 / 3台 ≈ 3个任务（4 3 3）

### 2.3. 修改yarn-site.xml配置参数如下

```java
<!-- 选择调度器，默认容量 -->
<property>
	<description>The class to use as the resource scheduler.</description>
	<name>yarn.resourcemanager.scheduler.class</name>
	<value>org.apache.hadoop.yarn.server.resourcemanager.scheduler.capacity.CapacityScheduler</value>
</property>
<!-- ResourceManager处理调度器请求的线程数量,默认50；如果提交的任务数大于50，可以增加该值，但是不能超过3台 * 4线程 = 12线程（去除其他应用程序实际不能超过8） -->
<property>
	<description>Number of threads to handle scheduler interface.</description>
	<name>yarn.resourcemanager.scheduler.client.thread-count</name>
	<value>8</value>
</property>
<!-- 是否让yarn自动检测硬件进行配置，默认是false，如果该节点有很多其他应用程序，建议手动配置。如果该节点没有其他应用程序，可以采用自动 -->
<property>
	<description>Enable auto-detection of node capabilities such as
	memory and CPU.
	</description>
	<name>yarn.nodemanager.resource.detect-hardware-capabilities</name>
	<value>false</value>
</property>
<!-- 是否将虚拟核数当作CPU核数，默认是false，采用物理CPU核数 -->
<property>
	<description>Flag to determine if logical processors(such as
	hyperthreads) should be counted as cores. Only applicable on Linux
	when yarn.nodemanager.resource.cpu-vcores is set to -1 and
	yarn.nodemanager.resource.detect-hardware-capabilities is true.
	</description>
	<name>yarn.nodemanager.resource.count-logical-processors-as-cores</name>
	<value>false</value>
</property>
<!-- 虚拟核数和物理核数乘数，默认是1.0 -->
<property>
	<description>Multiplier to determine how to convert phyiscal cores to
	vcores. This value is used if yarn.nodemanager.resource.cpu-vcores
	is set to -1(which implies auto-calculate vcores) and
	yarn.nodemanager.resource.detect-hardware-capabilities is set to true. The	number of vcores will be calculated as	number of CPUs * multiplier.
	</description>
	<name>yarn.nodemanager.resource.pcores-vcores-multiplier</name>
	<value>1.0</value>
</property>
<!-- NodeManager使用内存数，默认8G，修改为4G内存 -->
<property>
	<description>Amount of physical memory, in MB, that can be allocated 
	for containers. If set to -1 and
	yarn.nodemanager.resource.detect-hardware-capabilities is true, it is
	automatically calculated(in case of Windows and Linux).
	In other cases, the default is 8192MB.
	</description>
	<name>yarn.nodemanager.resource.memory-mb</name>
	<value>4096</value>
</property>
<!-- nodemanager的CPU核数，不按照硬件环境自动设定时默认是8个，修改为4个 -->
<property>
	<description>Number of vcores that can be allocated
	for containers. This is used by the RM scheduler when allocating
	resources for containers. This is not used to limit the number of
	CPUs used by YARN containers. If it is set to -1 and
	yarn.nodemanager.resource.detect-hardware-capabilities is true, it is
	automatically determined from the hardware in case of Windows and Linux.
	In other cases, number of vcores is 8 by default.</description>
	<name>yarn.nodemanager.resource.cpu-vcores</name>
	<value>4</value>
</property>
<!-- 容器最小内存，默认1G -->
<property>
	<description>The minimum allocation for every container request at the RM	in MBs. Memory requests lower than this will be set to the value of this	property. Additionally, a node manager that is configured to have less memory	than this value will be shut down by the resource manager.
	</description>
	<name>yarn.scheduler.minimum-allocation-mb</name>
	<value>1024</value>
</property>
<!-- 容器最大内存，默认8G，修改为2G -->
<property>
	<description>The maximum allocation for every container request at the RM	in MBs. Memory requests higher than this will throw an	InvalidResourceRequestException.
	</description>
	<name>yarn.scheduler.maximum-allocation-mb</name>
	<value>2048</value>
</property>
<!-- 容器最小CPU核数，默认1个 -->
<property>
	<description>The minimum allocation for every container request at the RM	in terms of virtual CPU cores. Requests lower than this will be set to the	value of this property. Additionally, a node manager that is configured to	have fewer virtual cores than this value will be shut down by the resource	manager.
	</description>
	<name>yarn.scheduler.minimum-allocation-vcores</name>
	<value>1</value>
</property>
<!-- 容器最大CPU核数，默认4个，修改为2个 -->
<property>
	<description>The maximum allocation for every container request at the RM	in terms of virtual CPU cores. Requests higher than this will throw an
	InvalidResourceRequestException.</description>
	<name>yarn.scheduler.maximum-allocation-vcores</name>
	<value>2</value>
</property>
<!-- 虚拟内存检查，默认打开，修改为关闭 -->
<property>
	<description>Whether virtual memory limits will be enforced for
	containers.</description>
	<name>yarn.nodemanager.vmem-check-enabled</name>
	<value>false</value>
</property>
<!-- 虚拟内存和物理内存设置比例,默认2.1 -->
<property>
	<description>Ratio between virtual memory to physical memory when	setting memory limits for containers. Container allocations are	expressed in terms of physical memory, and virtual memory usage	is allowed to exceed this allocation by this ratio.
	</description>
	<name>yarn.nodemanager.vmem-pmem-ratio</name>
	<value>2.1</value>
</property>
```

关闭虚拟内存检查的原因：

> Ratio between virtual memory to physical memory when setting memory limits for containers. Container allocations are expressed in terms of physical memory, and virtual memory usage is allowed to exceed this allocation by this ratio.
>
> yarn.nodemanager.vmem-pmem-ratio
>
> 2.1

### 2.4. 分发配置

将配置分发到所有节点，但是要注意：如果集群的硬件资源不一致，要每个NodeManager单独配置

### 2.5. 重启集群

```java
sbin/stop-yarn.sh
sbin/start-yarn.sh
```

### 2.6. 执行WordCount程序

```java
hadoop jar share/hadoop/mapreduce/hadoop-mapreduce-examples-3.1.3.jar wordcount /input /output
```

### 2.7. 观察Yarn任务执行页面

http://bigdata1:8088/cluster/apps
