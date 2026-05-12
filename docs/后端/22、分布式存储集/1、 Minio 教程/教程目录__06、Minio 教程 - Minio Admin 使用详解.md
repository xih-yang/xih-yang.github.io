# 06、Minio 教程 - Minio Admin 使用详解
- 来源：https://ddkk.com/zhuanlan/filestorage/minio/1/6.html
- 分类：分布式存储
- 分组：教程目录
### 概述

MinIO Client（mc）提供了“ admin”子命令来对您的MinIO部署执行管理任务。

```java
service     服务重启并停止所有MinIO服务器
update      更新更新所有MinIO服务器
info        信息显示MinIO服务器信息
user        用户管理用户
group       小组管理小组
policy      MinIO服务器中定义的策略管理策略
config      配置管理MinIO服务器配置
heal        修复MinIO服务器上的磁盘，存储桶和对象
profile     概要文件生成概要文件数据以进行调试
top         顶部提供MinIO的顶部统计信息
trace       跟踪显示MinIO服务器的http跟踪
console     控制台显示MinIO服务器的控制台日志
prometheus  Prometheus管理Prometheus配置
kms         kms执行KMS管理操作
```

### 命名

#### 1. 命令update-更新所有MinIO服务器

update命令提供了一种更新集群中所有MinIO服务器的方法。您还可以使用带有update命令的私有镜像服务器来更新MinIO集群。如果MinIO在无法访问Internet的环境中运行，这很有用。

示例：更新所有MinIO服务器。

```java
[root@hadoop001 minio]# mc admin update s3
Server s3 updated successfully from RELEASE.2019-08-14T20-49-49Z to RELEASE.2019-08-21T19-59-10Z
```

**使用私有镜像更新MinIO的步骤**

为了在私有镜像服务器上使用update命令，您需要在私有镜像服务器上的https://dl.minio.io/server/minio/release/linux-amd64/上镜像目录结构，然后提供：

```java
mc admin update myminio https://myfavorite-mirror.com/minio-server/linux-amd64/minio.sha256sum
Server myminio updated successfully from RELEASE.2019-08-14T20-49-49Z to RELEASE.2019-08-21T19-59-10Z
```

**注意**： -指向分布式安装程序的别名，此命令将自动更新群集中的所有MinIO服务器。 -update是您的MinIO服务的破坏性操作，任何正在进行的API操作都将被强制取消。因此，仅在计划为部署进行MinIO升级时才应使用它。 -建议在更新成功完成后执行重新启动。

#### 2. 命令service-重新启动并停止所有MinIO服务器

服务命令提供了一种重新启动和停止所有MinIO服务器的方法。

**注意**： -指向分布式设置的别名，此命令将在所有服务器上自动执行相同的操作。 -restart和stop子命令是MinIO服务的破坏性操作，任何正在进行的API操作都将被强制取消。因此，仅应在管理环境下使用。请谨慎使用。

```java
NAME:
  mc admin service - restart and stop all MinIO servers
FLAGS:
  --help, -h                       show help
COMMANDS:
  restart  restart all MinIO servers
  stop     stop all MinIO servers
```

示例：重新启动所有MinIO服务器。

```java
[root@hadoop001 minio]# mc admin service restart s3
```

#### 3. 命令info-显示MinIO服务器信息

“info”命令显示一台或多台MinIO服务器的服务器信息（在分布式集群下）

```java
NAME:
  mc admin info - get MinIO server information
FLAGS:
  --help, -h                       show help
```

示例：显示MinIO服务器信息。

```java
mc admin info play
●  play.minio.io
   Uptime: 11 hours
   Version: 2020-01-17T22:08:02Z
   Network: 1/1 OK
   Drives: 4/4 OK
2.1 GiB Used, 158 Buckets, 12,092 Objects
4 drives online, 0 drives offline
```

#### 4. 命令policy-管理固定策略

policy命令，用于添加，删除，列出策略，获取有关策略的信息并为MinIO服务器上的用户设置策略。

```java
NAME:
  mc admin policy - manage policies
FLAGS:
  --help, -h                       show help
COMMANDS:
  add      add new policy
  remove   remove policy
  list     list all policies
  info     show info on a policy
  set      set IAM policy on a user or group
```

示例：列出MinIO上的所有固定策略。

```java
[root@hadoop001 minio]# mc admin policy list s3
```

示例：在MinIO上添加新策略’listbucketsonly’，策略来自/tmp/listbucketsonly.json。 *对用户应用此策略时，该用户只能列出顶层存储桶，而不能列出其他内容，没有前缀，没有对象。

首先使用以下信息创建json文件/tmp/listbucketsonly.json。

```java
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:ListAllMyBuckets"
      ],
      "Resource": [
        "arn:aws:s3:::*"
      ]
    }
  ]
}
```

将策略作为“ listbucketsonly”添加到策略数据库中

```java
mc admin policy add myminio/ listbucketsonly /tmp/listbucketsonly.json
Added policy listbucketsonly successfully.
```

示例：在MinIO上删除策略“ listbucketsonly”。

```java
mc admin policy remove myminio/ listbucketsonly
Removed policy listbucketsonly successfully.
```

示例：显示罐头策略的信息，“只写”

```java
mc admin policy info myminio/ writeonly
{
     "Version":"2012-10-17","Statement":[{
     "Effect":"Allow","Action":["s3:PutObject"],"Resource":["arn:aws:s3:::*"]}]}
```

示例：在用户或组上设置固定策略。“只写”

```java
mc admin policy set myminio/ writeonly user=someuser
Policy writeonly is set on user someuser
```

```java
mc admin policy set myminio/ writeonly group=somegroup
Policy writeonly is set on group somegroup
```

#### 5. 命令user-管理用户

用户命令，用于添加，删除，启用，禁用MinIO服务器上的用户。

```java
NAME:
  mc admin user - manage users
FLAGS:
  --help, -h                       show help
COMMANDS:
  add      add new user
  disable  disable user
  enable   enable user
  remove   remove user
  list     list all users
  info     display info of a user
```

示例：在MinIO上添加新用户’newuser’。

```java
mc admin user add myminio/ newuser newuser123
```

示例：使用标准输入在MinIO上添加新用户’newuser’。

```java
mc admin user add myminio/
Enter Access Key: newuser
Enter Secret Key: newuser123
```

示例：在MinIO上禁用用户“ newuser”。

```java
mc admin user disable myminio/ newuser
```

示例：在MinIO上启用用户“ newuser”。

```java
mc admin user enable myminio/ newuser
```

示例：在MinIO上删除用户’newuser’。

```java
mc admin user remove myminio/ newuser
```

示例：列出MinIO上的所有用户。

```java
mc admin user list --json myminio/
{
     "status":"success","accessKey":"newuser","userStatus":"enabled"}
```

示例：显示用户信息

```java
mc admin user info myminio someuser
```

#### 6. 命令group-管理组

使用group命令在MinIO服务器上添加，删除，信息，列出，启用，禁用组。

```java
NAME:
  mc admin group - manage groups
USAGE:
  mc admin group COMMAND [COMMAND FLAGS | -h] [ARGUMENTS...]
COMMANDS:
  add      add users to a new or existing group
  remove   remove group or members from a group
  info     display group info
  list     display list of groups
  enable   Enable a group
  disable  Disable a group
```

示例：将一对用户添加到MinIO上的“ somegroup”组中。 如果组不存在，则会创建该组。

```java
mc admin group add myminio somegroup someuser1 someuser2
```

示例：从MinIO的“ somegroup”组中删除一对用户。

```java
mc admin group remove myminio somegroup someuser1 someuser2
```

示例：在MinIO上删除组“ somegroup”。 仅在给定组为空时有效。

```java
mc admin group remove myminio somegroup
```

示例：在MinIO上获取有关“ somegroup”组的信息。

```java
mc admin group info myminio somegroup
```

示例：列出MinIO上的所有组。

```java
mc admin group list myminio
```

示例：在MinIO上启用组“ somegroup”。

```java
mc admin group enable myminio somegroup
```

示例：在MinIO上禁用组“ somegroup”。

```java
mc admin group disable myminio somegroup
```

#### 7. 命令config-管理服务器配置

config命令用于管理MinIO服务器配置。

```java
NAME:
  mc admin config - manage configuration file
USAGE:
  mc admin config COMMAND [COMMAND FLAGS | -h] [ARGUMENTS...]
COMMANDS:
  get     get config of a MinIO server/cluster.
  set     set new config file to a MinIO server/cluster.
FLAGS:
  --help, -h                       Show help.
```

示例：获取MinIO服务器/集群的服务器配置。

```java
mc admin config get myminio > /tmp/my-serverconfig
```

示例：设置MinIO服务器/集群的服务器配置。

```java
mc admin config set myminio < /tmp/my-serverconfig
```

#### 8. 命令heal-修复MinIO服务器上的磁盘，存储桶和对象

使用heal命令修复MinIO服务器上的磁盘，丢失的存储桶和对象。 注意：此命令仅适用于MinIO擦除编码设置（独立和分布式）。

服务器已经有一个浅色的后台进程，可以在必要时修复磁盘，存储桶和对象。 但是，它不会检测某些类型的数据损坏，尤其是很少发生的数据损坏，例如静默数据损坏。 在这种情况下，您需要隔一段时间手动运行提供以下标志的heal命令：–scan deep。

要显示后台恢复过程的状态，只需键入以下命令：mc admin heal your-alias。

要扫描和修复所有内容，请输入：mc admin heal -r your-alias。

```java
NAME:
  mc admin heal - heal disks, buckets and objects on MinIO server
FLAGS:
  --scan value                     select the healing scan mode (normal/deep) (default: "normal")
  --recursive, -r                  heal recursively
  --dry-run, -n                    only inspect data, but do not mutate
  --force-start, -f                force start a new heal sequence
  --force-stop, -s                 force stop a running heal sequence
  --remove                         remove dangling objects in heal sequence
  --help, -h                       show help
```

示例：更换新磁盘后修复MinIO集群，递归修复所有存储桶和对象，其中’myminio’是MinIO服务器别名。

```java
mc admin heal -r myminio
```

示例：递归修复特定存储桶上的MinIO集群，其中“ myminio”是MinIO服务器别名。

```java
mc admin heal -r myminio/mybucket
```

示例：递归修复特定对象前缀上的MinIO集群，其中“ myminio”是MinIO服务器别名。

```java
mc admin heal -r myminio/mybucket/myobjectprefix
```

示例：显示MinIO集群中自我修复过程的状态。

```java
mc admin heal myminio/
```

#### 9. 命令profile-生成用于调试目的的配置文件数据

```java
NAME:
  mc admin profile - generate profile data for debugging purposes
COMMANDS:
  start  start recording profile data
  stop   stop and download profile data
```

开始进行CPU分析

```java
mc admin profile start --type cpu myminio/
```

#### 10. 命令top-为MinIO提供类似top的统计信息

注意：此命令仅适用于分布式MinIO设置。 单节点和网关部署不支持此功能。

```java
NAME:
  mc admin top - provide top like statistics for MinIO
COMMANDS:
  locks  Get a list of the 10 oldest locks on a MinIO cluster.
```

示例：获取分布式MinIO群集上10个最旧锁的列表，其中’myminio’是MinIO群集别名。

```java
mc admin top locks myminio
```

#### 11. 命令trace-显示MinIO服务器的http跟踪

trace命令显示一台或所有MinIO服务器（在分布式集群下）的服务器http跟踪

```java
NAME:
  mc admin trace - show http trace for MinIO server
FLAGS:
  --verbose, -v                 print verbose trace
  --all, -a                     trace all traffic (including internode traffic between MinIO servers)
  --errors, -e                  trace failed requests only
  --help, -h                    show help
```

示例：显示MinIO服务器http跟踪。

```java
mc admin trace myminio
172.16.238.1 [REQUEST (objectAPIHandlers).ListBucketsHandler-fm] [154828542.525557] [2019-01-23 23:17:05 +0000]
172.16.238.1 GET /
172.16.238.1 Host: 172.16.238.3:9000
172.16.238.1 X-Amz-Date: 20190123T231705Z
172.16.238.1 Authorization: AWS4-HMAC-SHA256 Credential=minio/20190123/us-east-1/s3/aws4_request, SignedHeaders=host;x-amz-content-sha256;x-amz-date, Signature=8385097f264efaf1b71a9b56514b8166bb0a03af8552f83e2658f877776c46b3
172.16.238.1 User-Agent: MinIO (linux; amd64) minio-go/v6.0.8 mc/2019-01-23T23:15:38Z
172.16.238.1 X-Amz-Content-Sha256: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
172.16.238.1
172.16.238.1 <BODY>
172.16.238.1 [RESPONSE] [154828542.525557] [2019-01-23 23:17:05 +0000]
172.16.238.1 200 OK
172.16.238.1 X-Amz-Request-Id: 157C9D641F42E547
172.16.238.1 X-Minio-Deployment-Id: 5f20fd91-6880-455f-a26d-07804b6821ca
172.16.238.1 X-Xss-Protection: 1; mode=block
172.16.238.1 Accept-Ranges: bytes
172.16.238.1 Content-Security-Policy: block-all-mixed-content
172.16.238.1 Content-Type: application/xml
172.16.238.1 Server: MinIO/RELEASE.2019-09-05T23-24-38Z
172.16.238.1 Vary: Origin
...
```

#### 12. 命令console-显示MinIO服务器的控制台日志

“console”命令显示一台或所有MinIO服务器的服务器日志（在分布式集群下）

```java
NAME:
  mc admin console - show console logs for MinIO server
FLAGS:
  --limit value, -l value       show last n log entries (default: 10)
  --help, -h                    show help
```

示例：显示MinIO服务器http跟踪。

```java
mc admin console myminio
 API: SYSTEM(bucket=images)
 Time: 22:48:06 PDT 09/05/2019
 DeploymentID: 6faeded5-5cf3-4133-8a37-07c5d500207c
 RequestID: <none>
 RemoteHost: <none>
 UserAgent: <none>
 Error: ARN 'arn:minio:sqs:us-east-1:1:webhook' not found
        4: cmd/notification.go:1189:cmd.readNotificationConfig()
        3: cmd/notification.go:780:cmd.(*NotificationSys).refresh()
        2: cmd/notification.go:815:cmd.(*NotificationSys).Init()
        1: cmd/server-main.go:375:cmd.serverMain()
```

#### 13. 命令prometheus-管理prometheus配置设置

“generate”命令生成prometheus配置（要粘贴到“prometheus.yml”中）

```java
NAME:
  mc admin prometheus - manages prometheus config
USAGE:
  mc admin prometheus COMMAND [COMMAND FLAGS | -h] [ARGUMENTS...]
COMMANDS:
  generate  generates prometheus config
```

_示例：为生成prometheus配置。

```java
mc admin prometheus generate <alias>
- job_name: minio-job
  bearer_token: <token>
  metrics_path: /minio/prometheus/metrics
  scheme: http
  static_configs:
  - targets: ['localhost:9000']
```

#### 14. 命令kms-执行KMS管理操作

kms命令可用于执行KMS管理操作。

```java
NAME:
  mc admin kms - perform KMS management operations
USAGE:
  mc admin kms COMMAND [COMMAND FLAGS | -h] [ARGUMENTS...]
```

#### 15. key子命令可用于执行主密钥管理操作。

```java
NAME:
  mc admin kms key - manage KMS keys
USAGE:
  mc admin kms key COMMAND [COMMAND FLAGS | -h] [ARGUMENTS...]
```

示例：显示默认主键的状态信息

```java
mc admin kms key status play
Key: my-minio-key
     • Encryption ✔
     • Decryption ✔
示例：显示一个特定主键的状态信息
Copymc admin kms key status play test-key-1
Key: test-key-1
     • Encryption ✔
     • Decryption ✔
```
