# 24、Solr4.8.0源码分析(24)之SolrCloud的Recovery策略(五)
- 来源：https://ddkk.com/zhuanlan/search/solr/1/24.html
- 分类：搜索引擎
- 分组：教程目录
题记：关于SolrCloud的Recovery策略已经写了四篇了，这篇应该是系统介绍Recovery策略的最后一篇了。本文主要介绍Solr的主从同步复制。它与前文 Solr4.8.0源码分析(22)之SolrCloud的Recovery策略(三) 略有不同，前文讲到的是SolrCloud的leader与replica之间的同步，不需要通过配置solrconfig.xml来实现。而本文主要介绍单机模式下，利用solrconfig.xml来实现主从服务器的同步。

分布式环境下，由于高并发的问题，通常我们需要部署多台服务器来负载均衡，从而避免，单点访问的热点问题，或者因负载过高而造成服务器瘫痪的问题等等。 solr4.x之后推出了solrcloud的分布式集群方案，与4.x之前的Master/Slave集群模式，架构上发生了重大变化，solrcloud不仅仅解决了，高并发的负载均衡问题,也解决了海量数据的检索性能问题，对一份巨大的索引，采用分而治之的方法索引到多个独立的节点上，但是这样并不代表，4.x之前的Master/Slave架构就被淘汰出局了，其实solrcloud里面也是综合运用了主从的方式，来解决并发的问题。 如果数据量不是很大的情况下，没必要采用solrcloud方案，但这时候，又需要解决高并发问题，或者服务器单点故障问题怎么办？ 答案还是采取经典的主从架构模式来解决，

## 1. 配置

- master 模式

```xml
<requestHandler name="/replication" class="solr.ReplicationHandler" >
<lst name="master">
    <!--什么时候出发同步，参数名replicateAfter，取值可以是startup commit optimize  -->
    <str name="replicateAfter">startup</str>
    <str name="replicateAfter">commit</str>
    <!--数据备份 参数名backupAfter 同样可以似乎startup commit optimize -->
    <!-- <str name="backupAfter">optimize</str> -->
    <!--配置要同步的配置文件 -->
    <str name="confFiles">schema.xml,stopwords.txt,elevate.xml</str>
    <!--提交同步时间间隔，默认是10秒，一般不用改动 -->
    <str name="commitReserveDuration">00:00:10</str>
    <!--备份的个数-->
    <str name="maxNumberOfBackups">1</str>
</lst> 
</requestHandler>
```

参数说明：

- 如果commit比较频繁，或者网络比较慢，则需要微调， ``00:00:10``.这是大致的master下载5M大小的数据到slave所花的时间，默认是10.

如果你设置replicateAfter为startup，如果需要在以后触发commit/optimize，那么同样需要设置commit/optimize。如果只设置了startup，那么在启动的时候触发过replication之后不会在随后的commit/optimize中触发。
slave 模式

```xml
<requestHandler name="/replication" class="solr.ReplicationHandler" >
    <lst name="slave">
        <!--主服务的同步地址-->
        <str name="masterUrl">http://master_host:port/corename/replication</str>  
        <!--同步轮询的时间间隔，是应用还击而定 -->
        <str name="pollInterval">00:00:20</str>  
        <str name="compression">internal</str>
        <!--Http相关参数设置-->
        <str name="httpConnTimeout">5000</str>
        <str name="httpReadTimeout">10000</str>
        <!-- 如果主服务设置认证，在此设置登录用户名密码 -->
        <str name="httpBasicAuthUser">username</str>
        <str name="httpBasicAuthPassword">password</str>
     </lst>
</requestHandler>
```

参数说明：

- Compression 设置可以设为internal或者external，该设置是用于传输文件时候是否需要进行压缩。如果设为external，则是压缩传输，设为internal则正常传输。除非网络带宽喜爱，否则不要设置external，因为会影响replication。

Repeater模式

如果是一个master，多个slave时候，当多个slave从master下载文件时候对master的负荷会特别大。为了避免这种情况，可以使用repeater模式来改善，即一个节点即当master又当slave：

- 同样在solrconfig.xml上配置

即使在repeater上的master设置了replicateAfter为optimize，也需要设置commit。这是因为在slave中optimize是无效的。
在repeater中Compression还是有效的

```xml
<requestHandler name="/replication" class="solr.ReplicationHandler">
<lst name="master">
  <str name="replicateAfter">commit</str>
  <str name="confFiles">schema.xml,stopwords.txt,synonyms.txt</str>
</lst>
<lst name="slave">
  <str name="masterUrl">http://master.solr.company.com:8080/solr</str>
  <str name="pollInterval">00:00:60</str>
</lst>
</requestHandler>
```

- 可以通过以下配置来开启repeater中的master或者slave。开启了之后会在相应的core里面solrcore.properties 的文件中保持信息

```xml
<requestHandler name="/replication" class="solr.ReplicationHandler" >
  <lst name="master">
    <str name="enable">${enable.master:false}</str>
    <str name="replicateAfter">commit</str>
    <str name="confFiles">schema.xml,stopwords.txt</str>
 </lst>
 <lst name="slave">
    <str name="enable">${enable.slave:false}</str>
   <str name="masterUrl">http://master_host:8983/solr</str>
   <str name="pollInterval">00:00:60</str>
 </lst>
</requestHandler>
```

```bash
solrcore.properties in master
enable.master=true
enable.slave=false
solrcore.properties in slave
enable.master=false
enable.slave=true
```

## 2. 工作原理

- 当master发生commit或者optimize时候，ReplicationHandle会获取到这个commit点的文件名字，然后根据replicateAfter参数来决定将这些文件存放与lucene还是进行提取。
- master并不知道有多少slave，Slave周期性轮询(pollInterval)来检查Master的版本，如果Master有新版本，那么就开始同步复制。步骤为以下：
- Slave发出一个filelist命令来收集文件列表。这个命令将返回一系列元数据（size，lastmodified，alias等等）.
- Slave查看它本地是否有这些文件，然后它会开始下载缺失的文件(使用命令filecontent)。如果连接失败，则会从失败的点重新开始下。它将重试5次，如果仍然失败则放弃。
- 文件被下载到了一个临时目录。因此，下载中途出错不会影响到slave。
- 完成下载后，所有新的文件会被移动到正在工作的目录内，而文件的timestamp会被匹配成master的timestamp。
- 一个commit命令被ReplicationHandler执行，然后新的索引被加载进来。
- 配置文件的replication步骤是如下的：
- 需要被复制的文件必须明确的用confFiles标记。
- 只有是Solr实例的conf目录下的文件才能被复制。
- 配置文件是跟着新的index一起进行复制的，也就是说即使master的配置文件被修改了也不会立马进行复制，只有当master的optimize或者commit被触发了。
- 不同于index文件通过timestamp来进行文件的匹配比较，配置文件是通过他们的checksum来进行匹配比较的，checksum相同则文件相同。
- 配置文件下载好之后会放入临时目录，然后旧的配置文件被重命名但是仍然放在原始目录下，ReplicationHandle并不会去删除它，然后再把新的文件移动到工作目录下。
- 如果有配置文件下来了，slave会进行reload。
- 如果向slave添加数据或者slave的索引坏掉了怎么办？
- 如果master那边没有新的index 数据，那么Slave不会与master进行同步。当master发生commit时候，master的index version不再与slave相同了。slave就会从master抓取这些文件，然后发现自己本地的文件与master不同，他就会复制所有master的index文件到新的目录下，然后要求Solr更新索引的目录。

## 3. Http API

说明
命令

获取master 可以复制的索引的最近的version
http://master_host:port/solr/replication?command=indexversion

取消master到slave 索引的复制
http://slave_host:port/solr/replication?command=abortfetch

如果有commit的索引数据，在master上创建一个备份
http://master_host:port/solr/replication?command=backup

同时提供备份的目录路径
&location=/foo/bar

同样可以设置备份的个数numberToKeep，旧的备份会被自动删除，

如果配置文件中设置了maxNumberOfBackups则numberToKeep无效

&numberToKeep=2

强制slave从master上获取数据
http://slave_host:port/solr/replication?command=fetchindex

可以设置额外的属性“masterUrl”或者“compression”等（ 中的配置）进行一次性的replication操作

禁止slave向master进行轮询
http://slave_host:port/solr/replication?command=disablepoll

开启slave向master进行轮询
http://slave_host:port/solr/replication?command=enablepoll

获取目前所有的状态以及配置信息
http://slave_host:port/solr/replication?command=details

获取索引的version信息
http://host:port/solr/replication?command=indexversion

获取当前version下的lucene索引文件信息
http://host:port/solr/replication?command=filelist&indexversion=

禁止master向索引slave的replication功能
http://master_host:port/solr/replication?command=disablereplication

开启master向索引slave的replication功能
http://master_host:port/solr/replication?command=enablereplication

从master传输文件

1.如果是index 文件则添加参数file=

2.如果是配置   文件则添加参数cf=

http://master_host:port/solr/replication?command=filecontent&wt=filestream&indexversion=

## 总结：

本节主要介绍了Replication的主从复制的配置，实现过程，以及HTTP API。从实现过程中看，跟前文讲的还是保持一致的。到目前为止终于把SolrCloud的recovery的策略这一系列写完了。下一个系列想学习下SolrCloud的OverSee,感觉网上将OverSee的不怎么多，正好来学习下这个。
