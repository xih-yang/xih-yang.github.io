# 06、Hadoop 入门：HDFS命令
- 来源：https://ddkk.com/zhuanlan/bigdata/hadoop/1/6.html
- 分类：大数据框架
- 分组：教程目录
## 常用命令

*HDFS文件操作命令风格有两种*

*两种命令效果一样*

#### hdfs dfs 开头

#### hadoop fs 开头

### 查看帮助信息

```java
hdfs dfs -help [cmd]
hadoop  fs -help [cmd]  两个命令等价
```

### 查看指定目录文件列表

- -ls [-C] [-d] [-h] [-q] [-R] [-t] [-S] [-r] [-u] [-e] [`` ...]

```java
  -C  只显示文件和目录的路径。
  -d  目录以普通文件的形式列出。
  -h  以人类可读的方式格式化文件的大小而不是字节数。
  -q  打印 ? 而不是不可打印的字符。
  -R  递归地列出目录的内容。
  -t  根据修改时间(最近的先修改)对文件进行排序。
  -S  按大小排序文件。
  -r  颠倒排序的顺序。
  -u  使用最后访问时间代替修改显示和排序。
  -e  显示文件和目录的擦除编码策略。
```

### 创建文件

- -touchz `` ... # 创建一个长度为0的文件，路径为，时间戳为当前时间``。如果文件存在且长度非零，则返回错误
- -touch [-a] [-m] [-t TIMESTAMP ] [-c] `` ... # 更新指定文件的访问和修改次数到当前时间。如果该文件不存在，则创建一个零长度的文件在处，当前时间作为的时间戳。

```java
-a 只修改访问时间
-m 只修改修改时间
-t TIMESTAMP使用指定的时间戳(格式为yyyyMMddHHmmss)代替当前时间
-c 不创建任何文件
```

### 移动文件(移动的时候可以更改名称

- -mv `` ... `` #将匹配指定文件模式的文件移动到目标。移动多个文件时，目标必须是一个目录。

### 查找文件

- -find `` ... `` ... # 查找与指定表达式和匹配的所有文件将选定的操作应用于它们。如果不指定然后默认为当前工作目录。如果没有表达式被指定，然后默认为-print。

```java
-name pattern
-iname pattern
  如果文件的basename与使用标准文件系统通配符的模式。
  如果使用-iname，则匹配不区分大小写
-print
-print0
  总是求值为真。使当前路径名为写入标准输出，后跟换行符。
  如果-print0如果使用了表达式，则会添加一个ASCII NULL字符比一个换行符。
```

### 创建文件夹

- -mkdir [-p] `` ... # 在指定位置创建目录。

```java
-p  如果目录已经存在，不会失败 
```

### 删除文件

- -rm [-f] [-r|-R] [-skipTrash] [-safely] `` ... # 删除所有匹配指定文件模式的文件。相当于Unix的rm命令”`` "

```java
  -f          如果该文件不存在，则不显示诊断消息或修改退出状态以反映一个错误。                        
  -[rR]      递归删除目录。                                  
  -skipTrash  选项绕过回收站(如果启用)，并立即删除。 
  -safely     选项需要安全确认，如果启用，则需要大于等于的大目录删除前请确认\<hadoop.shell.delete.limit.num.files\>文件。预计延迟时间为递归遍历大目录以计算确认前需要删除的文件。
```

### 拷贝文件

- -cp [-f] [-p | -p[topax]] [-d] `` ... `` # 将匹配文件模式的文件复制到目标。当复制多个文件，目标必须是一个目录。

*传递-p保留状态topax。如果-p没有指定，那么保留时间戳、所有权和权限。*

*如果指定了-pa，则保留权限，这也是因为ACL是权限的超集。*

*如果目标已经存在，传递-f将覆盖它。*

*原始的命名空间扩展属性被保留，如果(1)它们被支持(仅适用于HDFS)，(2)所有的源和目标路径名都在/。保留/原始的层次结构。原始命名空间xattr的保留完全由/的存在(或不存在)决定。保留/原始前缀，而不是-p选项。传递-d将跳过临时文件的创建(. copying)。*

### 追加内容

- -appendToFile `` ... `` # 将所有给定本地文件的内容追加到给定的``t文件。如果``t的文件不存在，将创建该文件。如果``是-，则输入是从stdin读取。

### 查看内容

- -cat [-ignoreCrc] `` ... # 获取所有匹配文件模式的文件，并显示其内容在stdout。

### 上传文件

- -put [-f] [-p] [-l] [-d] [-t ``] `` ... `` # 将文件从本地文件系统复制到fs。如果文件已经存在会复制失败，除非指定了-f标志。

```java
  -p                 保存时间戳、所有权和模式。               
  -f                 如果目标已经存在，则覆盖它。            
  -t <thread count>  使用的线程数，默认为1。                
  -l                 允许DataNode将文件延迟持久化到磁盘。强制复制因子为1。这个标志将导致耐久性下降。小心使用。                                  
  -d                 跳过临时文件的创建(<dst>._COPYING_)
```

- -copyFromLocal [-f] [-p] [-l] [-d] [-t ``] `` ... `` # 与-put命令相同。
- -moveFromLocal [-f] [-p] [-l] [-d] `` ... `` # 除了源文件在复制后被删除与-put相同，而且-t选项还没有实现.

### 下载文件

- -get [-f] [-p] [-ignoreCrc] [-crc] `` ... `` # 将匹配文件模式的文件复制到本地名称。``保存。复制多个文件时，目标必须是一个目录。传递- f如果目标已经存在，则覆盖目标，而-p保留访问和修改时间、所有权和方式。
- -copyToLocal [-f] [-p] [-ignoreCrc] [-crc] `` ... `` # 和get命令相同

## 其它命令

### hdfs+getconf+[cmd]

*从配置中获取配置值*

```java
  -namenodes			        获取群集中的namenode列表。
  -secondaryNameNodes			# 获取集群中secondaryNameNode的列表。
  -backupNodes			# 获取群集中的备份节点列表。
  -journalNodes			# 获取群集中的日志节点列表。
  -includeFile			# 获取定义可加入群集的datanode的包含文件路径。
  -excludeFile			# 获取定义需要退役的datanode的排除文件路径。
  -nnRpcAddresses			# 获取namenode RPC地址
  -confKey [key]			# 从配置中获取特定的key
```

### hdfs+dfsadmin+[cmd]

*运行DFS管理员客户端*

```java
[-help [cmd]]          帮助
[-safemode <enter | leave | get | wait>]      安全模式 <进入｜离开｜获取｜等待>
...
```

### hdfs+fsck+ +[cmd]

*运行文件系统检查工具*

*可选一*

`[-list-corruptfileblocks | [-move | -delete | -openforwrite] [-files [-blocks [-locations | -racks | -replicaDetails | -upgradedomains]]]]`

```java
-list-corruptfileblocks	# 打印出丢失的块和它们所属的文件列表
-move	# 移动损坏的文件到/丢失+发现
-delete	# 删除的文件
-files	# 打印出正在检查的文件
-openforwrite	# 打印出打开要写入的文件
-files -blocks	# 打印块报告
-files -blocks -locations	# 打印出每个区块的位置
-files -blocks -racks	# 打印出数据节点位置的网络拓扑结构
-files -blocks -replicaDetails	# 打印出每个副本的细节
-files -blocks -upgradedomains	# 打印出每个块的升级域
# 例：显示HDFS块信息
hdfs fsck 文件路径 -files -blocks -locations
```

*可选二*

`[-includeSnapshots] [-showprogress] [-storagepolicies] [-maintenance] [-blockId ]`

```java
-includeSnapshots	 如果给定的路径指示一个可快照目录，或者该目录下有可快照目录，则包含快照数据
-showprogress	# 弃用,现在默认显示进度
-storagepolicies	# 打印出块的存储策略摘要
-maintenance	# 打印维护状态节点详细信息
-blockId	# 打印出该块属于哪个文件，该块的位置(节点、机架)，以及其他诊断信息(复制不足、损坏或未损坏等)
```

### 其它

```java
hadoop checknative  检测压缩库本地安装情况
hadoop namenode -format  格式化namenode，往往是第一次启动集群使用
# 执行自定义jar包
hadoop jar xxx
yarn jar xxx
```
