# 05、Minio 教程 - Minio Client使用详解
- 来源：https://ddkk.com/zhuanlan/filestorage/minio/1/5.html
- 分类：分布式存储
- 分组：教程目录
### 简介

MinIO Client 简称mc，是minio服务器的客户端，对ls，cat，cp，mirror，diff，find等UNIX命令提供了一种替代方案，它支持文件系统和兼容Amazon S3的云存储服务（AWS Signature v2和v4）。

```java
ls       列出文件和文件夹。
mb       创建一个存储桶或一个文件夹。
cat      显示文件和对象内容。
pipe     将一个STDIN重定向到一个对象或者文件或者STDOUT。
share    生成用于共享的URL。
cp       拷贝文件和对象。
mirror   给存储桶和文件夹做镜像。
find     基于参数查找文件。
diff     对两个文件夹或者存储桶比较差异。
rm       删除文件和对象。
events   管理对象通知。
watch    监听文件和对象的事件。
policy   管理访问策略。
session  为cp命令管理保存的会话。
config   管理mc配置文件。
update   检查软件更新。
version  输出版本信息。
```

### Centos 7 安装mc

下载mc:

```java
[root@hadoop001 minio]# wget http://dl.minio.org.cn/client/mc/release/linux-amd64/mc
[root@hadoop001 minio]# chmod +x mc 
[root@hadoop001 minio]# mv mc /usr/bin/
# 查看帮助
[root@hadoop001 minio]# mc -h
```

添加服务器节点：

```java
[root@hadoop001 minio]# mc config host add s3 http://192.168.58.201:9000  admin  admin123  --api s3v4
[root@hadoop001 minio]# mc config host ls
# 查看s3下的所有存储桶
[root@hadoop001 minio]# mc ls s3
```

可以看到当前我们添加名称为s3的节点，及这个节点下的所有存储桶：

### 常用命令

#### 1. ls 列出存储桶和对象

ls命令列出文件、对象和存储桶。使用–incomplete flag可列出未完整拷贝的内容。

```java
用法：
   mc ls [FLAGS] TARGET [TARGET ...]
FLAGS:
  --help, -h                       显示帮助。
  --recursive, -r          递归。
  --incomplete, -I         列出未完整上传的对象。
```

示例：列出所有s3上的存储桶。

```java
[root@hadoop001 minio]# mc ls s3
```

示例：列出所有s3上的存储桶qqqqq下的文件。

```java
[root@hadoop001 minio]# mc ls s3/qqqqq
```

#### 2. mb命令 - 创建存储桶

mb命令在对象存储上创建一个新的存储桶。在文件系统，它就和mkdir -p命令是一样的。存储桶相当于文件系统中的磁盘或挂载点，不应视为文件夹。MinIO对每个用户创建的存储桶数量没有限制。 在Amazon S3上，每个帐户被限制为100个存储桶。

```java
用法：
   mc mb [FLAGS] TARGET [TARGET...]
FLAGS:
  --help, -h                       显示帮助。
  --region "us-east-1"         指定存储桶的region，默认是‘us-east-1’.
```

示例：在s3上创建一个名叫"mybucket"的存储桶。

```java
[root@hadoop001 minio]# mc mb s3/mybucket
```

#### 3. cat命令 - 合并对象

cat命令将一个文件或者对象的内容合并到另一个上。你也可以用它将对象的内容输出到stdout。

```java
用法：
   mc cat [FLAGS] SOURCE [SOURCE...]
FLAGS:
  --help, -h                       显示帮助。
```

示例：显示myobject.txt文件的内容

```java
[root@hadoop001 minio]# mc cat s3/mybucket/aa.txt
```

#### 4. pipe命令 - Pipe到对象

pipe命令拷贝stdin里的内容到目标输出，如果没有指定目标输出，则输出到stdout。

```java
用法：
   mc pipe [FLAGS] [TARGET]
FLAGS:
  --help, -h                    显示帮助。
```

示例：将MySQL数据库dump文件输出到Amazon S3。

```java
mysqldump -u root -p ******* accountsdb | mc pipe s3/sql-backups/backups/accountsdb-oct-9-2015.sql
```

#### 5. cp命令 - 拷贝对象

cp命令拷贝一个或多个源文件目标输出。所有到对象存储的拷贝操作都进行了MD4SUM checkSUM校验。可以从故障点恢复中断或失败的复制操作。

```java
用法：
   mc cp [FLAGS] SOURCE [SOURCE...] TARGET
FLAGS:
  --help, -h                       显示帮助。
  --recursive, -r          递归拷贝。
```

示例：拷贝一个本地文本文件到对象存储s3/aaaa。

```java
[root@hadoop001 minio]# mc cp starh.sh s3/aaaa
```

#### 6. rm命令 - 删除存储桶和对象。

使用rm命令删除文件对象或者存储桶。

```java
用法：
   mc rm [FLAGS] TARGET [TARGET ...]
FLAGS:
  --help, -h                       显示帮助。
  --recursive, -r              递归删除。
  --force              强制执行删除操作。
  --prefix             删除批配这个前缀的对象。
  --incomplete, -I      删除未完整上传的对象。
  --fake               模拟一个假的删除操作。
  --stdin              从STDIN中读对象列表。
  --older-than value               删除N天前的对象（默认是0天）。
```

示例：删除一个对象。

```java
[root@hadoop001 minio]# mc rm s3/aaaa/starh.sh 
```

示例：删除一个存储桶并递归删除里面所有的内容。由于这个操作太危险了，你必须传–force参数指定强制删除。

```java
[root@hadoop001 minio]# mc rm --recursive --force s3/qqqqq
```

示例：从mybucket里删除所有未完整上传的对象。

```java
[root@hadoop001 minio]# mc rm  --incomplete --recursive --force s3/mybucket
```

示例：删除一天前的对象。

```java
[root@hadoop001 minio]# mc rm --force --older-than=1 s3/mybucket/oldsongs
```

#### 7. share命令 - 共享

share命令安全地授予上传或下载的权限。此访问只是临时的，与远程用户和应用程序共享也是安全的。如果你想授予永久访问权限，你可以看看mc policy命令。

生成的网址中含有编码后的访问认证信息，任何企图篡改URL的行为都会使访问无效。想了解这种机制是如何工作的，请参考Pre-Signed URL技术。

```java
用法：
   mc share [FLAGS] COMMAND
FLAGS:
  --help, -h                       显示帮助。
COMMANDS:
   download   生成有下载权限的URL。
   upload     生成有上传权限的URL。
   list       列出先前共享的对象和文件夹。
```

#### 8. 子命令share download - 共享下载

share download命令生成不需要access key和secret key即可下载的URL，过期参数设置成最大有效期（不大于7天），过期之后权限自动回收。

```java
用法：
   mc share download [FLAGS] TARGET [TARGET...]
FLAGS:
  --help, -h                       显示帮助。
  --recursive, -r          递归共享所有对象。
  --expire, -E "168h"          设置过期时限，NN[h|m|s]。
```

示例：生成一个对一个对象有4小时访问权限的URL。

```java
[root@hadoop001 minio]# mc share download --expire 4h s3/aaaa/aa.txt
```

#### 9. 子命令share upload - 共享上传

share upload命令生成不需要access key和secret key即可上传的URL。过期参数设置成最大有效期（不大于7天），过期之后权限自动回收。 Content-type参数限制只允许上传指定类型的文件。

```java
用法：
   mc share upload [FLAGS] TARGET [TARGET...]
FLAGS:
  --help, -h                       显示帮助。
  --recursive, -r              递归共享所有对象。
  --expire, -E "168h"          设置过期时限，NN[h|m|s].
```

示例：生成一个curl命令，赋予上传到play/mybucket/myotherobject.txt的权限。

```java
[root@hadoop001 minio]# mc share upload s3/mybucket/myotherobject.txt
```

#### 10. 子命令share list - 列出之前的共享

share list列出没未过期的共享URL。

```java
用法：
   mc share list COMMAND
COMMAND:
   upload:   列出先前共享的有上传权限的URL。
   download: 列出先前共享的有下载权限的URL。
```

#### 11. mirror命令 - 存储桶镜像

mirror命令和rsync类似，只不过它是在文件系统和对象存储之间做同步。

```java
用法：
   mc mirror [FLAGS] SOURCE TARGET
FLAGS:
  --help, -h                       显示帮助。
  --force              强制覆盖已经存在的目标。
  --fake               模拟一个假的操作。
  --watch, -w                      监听改变并执行镜像操作。
  --remove             删除目标上的外部的文件。
```

示例：将一个本地文件夹minio镜像到https://play.min.io上的’mybucket’存储桶。

```java
[root@hadoop001 minio]# mc mirror ../minio/ play/mybucket
```

示例：持续监听本地文件夹修改并镜像到https://play.min.io上的’mybucket’存储桶。

```java
[root@hadoop001 minio]# mc mirror -w ../minio/ play/mybucket
```

#### 12 .find命令 - 查找文件和对象

find命令通过指定参数查找文件，它只列出满足条件的数据。

```java
用法：
  mc find PATH [FLAGS]
FLAGS:
  --help, -h                       显示帮助。
  --exec value                     为每个匹配对象生成一个外部进程（请参阅FORMAT）
  --name value                     查找匹配通配符模式的对象。
  ...
  ...
```

示例：持续从s3存储桶中查找所有jpeg图像，并复制到minio "play/bucket"存储桶

```java
[root@hadoop001 minio]# mc find s3/bucket --name "*.jpg" --watch --exec "mc cp {} play/bucket"
```

#### 13.diff命令 - 显示差异

diff命令计算两个目录之间的差异。它只列出缺少的或者大小不同的内容。

它不比较内容，所以可能的是，名称相同，大小相同但内容不同的对象没有被检测到。这样，它可以在不同站点或者大量数据的情况下快速比较。

```java
用法：
  mc diff [FLAGS] FIRST SECOND
FLAGS:
  --help, -h                       显示帮助。
```

示例：比较一个本地文件夹和一个远程对象存储服务

```java
[root@hadoop001 minio]# mc diff localdir play/mybucket
```

#### 14. watch命令 - 监听文件和对象存储事件。

watch命令提供了一种方便监听对象存储和文件系统上不同类型事件的方式。

```java
用法：
  mc watch [FLAGS] PATH
FLAGS:
  --events value                   过滤不同类型的事件，默认是所有类型的事件 (默认： "put,delete,get")
  --prefix value                   基于前缀过滤事件。
  --suffix value                   基于后缀过滤事件。
  --recursive                      递归方式监听事件。
  --help, -h                       显示帮助。
```

示例：监听对象存储的所有事件

```java
[root@hadoop001 minio]# mc watch s3/aaaa
```

示例：监听本地文件夹的所有事件

```java
[root@hadoop001 minio]# mc watch ~/Photos
```

#### 15. events命令 - 管理存储桶事件通知。

events提供了一种方便的配置存储桶的各种类型事件通知的方式。MinIO事件通知可以配置成使用 AMQP，Redis，ElasticSearch，NATS和PostgreSQL服务。MinIO configuration提供了如何配置的更多细节。

```java
用法：
  mc events COMMAND [COMMAND FLAGS | -h] [ARGUMENTS...]
COMMANDS:
  add     添加一个新的存储桶通知。
  remove  删除一个存储桶通知。使用'--force'可以删除所有存储桶通知。
  list    列出存储桶通知。
FLAGS:
  --help, -h                       显示帮助。
```

示例：列出所有存储桶通知。

```java
mc events list play/andoria
```

示例：添加一个新的’sqs’通知，仅接收ObjectCreated事件。

```java
mc events add play/andoria arn:minio:sqs:us-east-1:1:your-queue --events put
```

示例：添加一个带有过滤器的’sqs’通知。

给sqs通知添加prefix和suffix过滤规则。

```java
mc events add play/andoria arn:minio:sqs:us-east-1:1:your-queue --prefix photos/ --suffix .jpg
```

示例：删除一个’sqs’通知

```java
mc events remove play/andoria arn:minio:sqs:us-east-1:1:your-queue
```

#### 16. policy命令 - 管理存储桶策略

管理匿名访问存储桶和其内部内容的策略。

```java
用法：
  mc policy [FLAGS] PERMISSION TARGET
  mc policy [FLAGS] TARGET
  mc policy list [FLAGS] TARGET
PERMISSION:
  Allowed policies are: [none, download, upload, public].
FLAGS:
  --help, -h                       显示帮助。
```

示例：显示当前匿名存储桶策略

显示当前mybucket/myphotos/2020/子文件夹的匿名策略。

```java
mc policy play/mybucket/myphotos/2020/
Access permission for ‘play/mybucket/myphotos/2020/’ is ‘none’
```

示例：设置可下载的匿名存储桶策略。

设置mybucket/myphotos/2020/子文件夹可匿名下载的策略。现在，这个文件夹下的对象可被公开访问。比如：mybucket/myphotos/2020/yourobjectname可通过这个URL https://play.min.io/mybucket/myphotos/2020/yourobjectname访问。

```java
mc policy set download play/mybucket/myphotos/2020/
Access permission for ‘play/mybucket/myphotos/2020/’ is set to 'download'
```

示例：删除当前的匿名存储桶策略

删除所有mybucket/myphotos/2020/这个子文件夹下的匿名存储桶策略。

```java
mc policy set none play/mybucket/myphotos/2020/
Access permission for ‘play/mybucket/myphotos/2020/’ is set to 'none'
```

#### 17. config命令 - 管理配置文件

config host命令提供了一个方便地管理~/.mc/config.json配置文件中的主机信息的方式，你也可以用文本编辑器手动修改这个配置文件。

```java
用法：
  mc config host COMMAND [COMMAND FLAGS | -h] [ARGUMENTS...]
COMMANDS:
  add, a      添加一个新的主机到配置文件。
  remove, rm  从配置文件中删除一个主机。
  list, ls    列出配置文件中的主机。
FLAGS:
  --help, -h                       显示帮助。
```

示例：管理配置文件

添加MinIO服务的access和secret key到配置文件，注意，shell的history特性可能会记录这些信息，从而带来安全隐患。在bash shell,使用set -o和set +o来关闭和开启history特性。

```java
set +o history
mc config host add myminio http://localhost:9000 OMQAGGOL63D7UNVQFY8X GcY5RHNmnEWvD/1QxD3spEIGj+Vt9L7eHaAaBTkJ
set -o history
```

#### 18. update命令 - 软件更新

从https://dl.min.io检查软件更新。Experimental标志会检查unstable实验性的版本，通常用作测试用途。

```java
用法：
  mc update [FLAGS]
FLAGS:
  --quiet, -q  关闭控制台输出。
  --json       使用JSON格式输出。
  --help, -h   显示帮助。
```

示例：检查更新

```java
mc update
You are already running the most recent version of ‘mc’.
```

#### 19. version命令 - 显示版本信息

显示当前安装的mc版本。

```java
用法：
  mc version [FLAGS]
FLAGS:
  --quiet, -q  关闭控制台输出。
  --json       使用JSON格式输出。
  --help, -h   显示帮助。
```

示例：输出mc版本。

```java
mc version
Version: 2016-04-01T00:22:11Z
Release-tag: RELEASE.2016-04-01T00-22-11Z
Commit-id: 12adf3be326f5b6610cdd1438f72dfd861597fce
```
