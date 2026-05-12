# 02、Zookeeper 持久节点、临时节点及ACL
- 来源：https://ddkk.com/zhuanlan/registered/zookeeper/d-3/2.html
- 分类：注册中心
- 分组：ZooKeeper 教程（版本 C）
## znode回顾

我们回顾zookeeper中数据节点(znode)相关定义，然后进行实验验证。

znode相关定义如下：

- znode是zookeeper树形结构中的数据节点，用于存储数据；
- zookeeper中有两种类型的节点：
- 持久节点(PERSISENT)：一旦创建，除非主动调用删除操作，否则一直存储在zk上；
- 临时节点(EPHEMERAL)：与客户端会话绑定，一旦客户端会话失效，这个客户端所创建的所有临时节点都会被移除；
- 节点的顺序(SEQUENTIAL)属性：创建子节点时，如果设置SEQUENTIAL属性，则会自动在节点名后追加一个整形数字，上限是整形的最大值；

实验验证：

```java
=========================临时节点测试=========================
// 在第一个链接的客户端上创建临时节点
[zk: localhost:2181(CONNECTED) 15] ls /
[zookeeper]
[zk: localhost:2181(CONNECTED) 16] create -e /ephemeraltest ephemeraltestdata  // -e选项表示创建临时节点
Created /ephemeraltest
[zk: localhost:2181(CONNECTED) 17] ls /
[zookeeper, ephemeraltest]
[zk: localhost:2181(CONNECTED) 18]
// 在第二个链接的客户端上观察该临时节点是否存在
[zk: localhost:2181(CONNECTED) 1] ls /
[zookeeper, ephemeraltest]
// 关闭第一个客户端的链接
[zk: localhost:2181(CONNECTED) 18] close
2018-09-14 07:37:50,509 [myid:] - INFO  [main:ZooKeeper@693] - Session: 0x100063d34d50000 closed
[zk: localhost:2181(CLOSED) 19] 2018-09-14 07:37:50,565 [myid:] - INFO  [main-EventThread:ClientCnxn$EventThread@522] - EventThread shut down for session: 0x100063d34d50000
[zk: localhost:2181(CLOSED) 19]
// 再次在第二个客户端观察临时节点是否还存在，可以看到临时节点已经移除
[zk: localhost:2181(CONNECTED) 2] ls /
[zookeeper]
=========================顺序属性测试=========================
// 我们使用临时节点来测试顺序属性
// 在链接的客户端上连续创建三个带前缀的顺序临时节点
[zk: localhost:2181(CONNECTED) 21] create -s -e /sequentialtest sequentialtestdata1  // -s代表创建的节点具有顺序的属性，-e代表创建的是临时节点，sequentialtest是节点名称前缀
Created /sequentialtest0000000008
[zk: localhost:2181(CONNECTED) 22] create -s -e /sequentialtest sequentialtestdata2
Created /sequentialtest0000000009
[zk: localhost:2181(CONNECTED) 23] create -s -e /sequentialtest sequentialtestdata3
Created /sequentialtest0000000010
[zk: localhost:2181(CONNECTED) 24] ls /
[sequentialtest0000000010, sequentialtest0000000008, sequentialtest0000000009, zookeeper]
// 不带节点名称前缀
[zk: localhost:2181(CONNECTED) 28] create -s -e / sequentialtestdata1              
Created /0000000011
[zk: localhost:2181(CONNECTED) 29] create -s -e / sequentialtestdata2
Created /0000000012
[zk: localhost:2181(CONNECTED) 30] create -s -e / sequentialtestdata3
Created /0000000013
[zk: localhost:2181(CONNECTED) 31] ls /
[0000000012, 0000000011, 0000000013, zookeeper]
```

## Znode的访问控制

ACL全称是Access Control List，访问控制列表，zookeeper中ACL由三部分组成，即`Scheme:id:permission`，其中

- scheme是验证过程中使用的检验策略
- id是权限被赋予的对象，比如ip或某个用户
- permission为可以操作的权限，有5个值：crdwa，分别表示create、read、delete、write、admin,具体含义在[zookeeper ACL](https://blog.csdn.net/zkp_java/article/details/82635101#t14)中已经描述过

通过`setAcl path acl`命令可以设置节点的访问权限，path是节点路径，acl是要设置的权限(crdwa)。通过`getAcl path`可以查看节点的权限信息。需要注意的是`节点的acl不具有继承关系`。

权限检验策略即scheme有五种类型：`world`、`auth`、`digest`、`IP`、`super`，我们结合示例对着五种检验策略进行一一详解。

### world检验策略

ACL格式：`world:anyone:permission`

检测策略为world则id固定位anyone，如果permission为crdwa则ACL为`world:anyone:crdwa`，表示任何用户都具有创建子节点(c)、读取节点数据(r)、删除子节点(d)、更新子节点数据(w)、设置节点ACL权限的权限。

示例：

```java
// 创建新节点的ACL默认为：world:anyone:crdwa
[zk: localhost:2181(CONNECTED) 43] create -e /acltest acltestdata
Created /acltest
[zk: localhost:2181(CONNECTED) 44] getAcl /acltest
'world,'anyone
: cdrwa
// 设置为ca权限
[zk: localhost:2181(CONNECTED) 46] setAcl /acltest world:anyone:ca
cZxid = 0x6e
ctime = Fri Sep 14 08:13:07 PDT 2018
mZxid = 0x6e
mtime = Fri Sep 14 08:13:07 PDT 2018
pZxid = 0x6e
cversion = 0
dataVersion = 0
aclVersion = 1
ephemeralOwner = 0x100063d34d50005
dataLength = 11
numChildren = 0
[zk: localhost:2181(CONNECTED) 47] getAcl /acltest
'world,'anyone
: ca
// 无法再读取数据
[zk: localhost:2181(CONNECTED) 48] get /acltest   
Authentication is not valid : /acltest
```

### auth检验策略

ACL格式：`auth:id:permission`

比如`auth:username:password:crdwa`，auth检验策略表示给认证通过的所有用户设置acl权限。

可以通过`addauth digest :`命令添加用户。

如果通过`addauth`创建多组用户和密码，当使用setAcl修改权限时，所有的用户和密码的权限都会跟着修改，通过`addauth`新创建的用户和密码组需要重新调用setAcl才会加入到权限组当中去。

示例：

```java
==================客户端1操作===========================
[zk: localhost:2181(CONNECTED) 66] create -e /acltest acltestdata  // 创建测试的临时节点
Created /acltest
[zk: localhost:2181(CONNECTED) 67] getAcl /acltest
'world,'anyone
: cdrwa
[zk: localhost:2181(CONNECTED) 68] addauth digest acluser1:111111  // 添加acluser1用户
[zk: localhost:2181(CONNECTED) 69] addauth digest acluser2:222222  // 添加acluser2用户
// 设置acl权限，此处的用户名和密码并非一定要是上面创建的两个
// 用户名和密码，任何用户名和密码都可以，甚至不存在的用户名和
// 密码都可以,设置完后当前会话中所有用户对/acltest节点都具
// 有crdwa权限
[zk: localhost:2181(CONNECTED) 70] setAcl /acltest auth:acluser1:111111:crdwa  
cZxid = 0x76
ctime = Fri Sep 14 09:13:12 PDT 2018
mZxid = 0x76
mtime = Fri Sep 14 09:13:12 PDT 2018
pZxid = 0x76
cversion = 0
dataVersion = 0
aclVersion = 1
ephemeralOwner = 0x100063d34d50007
dataLength = 11
numChildren = 0
[zk: localhost:2181(CONNECTED) 71] get /acltest
acltestdata
cZxid = 0x76
ctime = Fri Sep 14 09:13:12 PDT 2018
mZxid = 0x76
mtime = Fri Sep 14 09:13:12 PDT 2018
pZxid = 0x76
cversion = 0
dataVersion = 0
aclVersion = 1
ephemeralOwner = 0x100063d34d50007
dataLength = 11
numChildren = 0
=====================客户端2的操作====================
// 此时在另一个客户端中get /acltest会发现没有权限
[zk: localhost:2181(CONNECTED) 7] ls /
[acltest, zookeeper]
[zk: localhost:2181(CONNECTED) 8] get /acltest
Authentication is not valid : /acltest
=====================回到客户端1操作=====================
// 添加一个新的用户acluser3
[zk: localhost:2181(CONNECTED) 72] addauth digest acluser3:333333 
=====================回到客户端2的操作====================
// 添加用户acluser3，发现还是没有访问/acltest的权限
[zk: localhost:2181(CONNECTED) 9] addauth digest acluser3:333333
[zk: localhost:2181(CONNECTED) 10] get /acltest
Authentication is not valid : /acltest
=====================回到客户端1操作=====================
// 重新设置/acltest权限
[zk: localhost:2181(CONNECTED) 73] setAcl /acltest auth:acluser1:111111:crdwa
cZxid = 0x76
ctime = Fri Sep 14 09:13:12 PDT 2018
mZxid = 0x76
mtime = Fri Sep 14 09:13:12 PDT 2018
pZxid = 0x76
cversion = 0
dataVersion = 0
aclVersion = 2  // aclVersion发生了变化
ephemeralOwner = 0x100063d34d50007
dataLength = 11
numChildren = 0
// 重新设置acl后三个用户均具有了访问/acltest节点的权限
[zk: localhost:2181(CONNECTED) 75] getAcl /acltest  
'digest,'acluser1:hHUVzmra9P/TbXlP/4jRhG9jZm8=
: cdrwa
'digest,'acluser2:s097oNh4MU8FGvmhrQLPAUjmIs4=
: cdrwa
'digest,'acluser3:ML31yxAbaJNcHmBdnsIvVnUy+AI=
: cdrwa
=====================回到客户端2的操作====================
// 此时发现acluser3已经能够访问/acltest节点了
[zk: localhost:2181(CONNECTED) 12] get /acltest
acltestdata
cZxid = 0x76
ctime = Fri Sep 14 09:13:12 PDT 2018
mZxid = 0x76
mtime = Fri Sep 14 09:13:12 PDT 2018
pZxid = 0x76
cversion = 0
dataVersion = 0
aclVersion = 2
ephemeralOwner = 0x100063d34d50007
dataLength = 11
numChildren = 0
```

总结起来就是：auth检验策略下setAcl会设置当前会话所有拥有的所有用户访问节点的权限，当前回话先添加的用户需要重新设置节点的ACL权限才会把新用户对节点的操作权限加上去。

### digest检验策略

ACL格式：`digest:id:permission`

digest和auth类似，只不过digest格式中的id需要使用sha1进行加密，zookeeper已经为我们提供了相关加密的类，如下所示为对id进行加密的代码：

```java
public class DigestTest {
    public static void main(String[] args) {
        try {
            System.out.println(DigestAuthenticationProvider.generateDigest("acluser1:111111"));
        } catch (Exception ex) {
            ex.printStackTrace();
        }
    }
}
```

示例：

```java
=========================客户端1上的操作======================
[zk: localhost:2181(CONNECTED) 86] create /acltest acltestdata  // 添加测试节点
Node already exists: /acltest
// 添加三个用户
[zk: localhost:2181(CONNECTED) 87] addauth digest acluser1:111111
[zk: localhost:2181(CONNECTED) 88] addauth digest acluser2:222222
[zk: localhost:2181(CONNECTED) 89] addauth digest acluser3:333333
// 设置digest类型的acl权限
[zk: localhost:2181(CONNECTED) 90] setAcl /acltest digest:acluser1:hHUVzmra9P/TbXlP/4jRhG9jZm8=:crdwa
cZxid = 0x7c
ctime = Fri Sep 14 18:42:17 PDT 2018
mZxid = 0x7c
mtime = Fri Sep 14 18:42:17 PDT 2018
pZxid = 0x7c
cversion = 0
dataVersion = 0
aclVersion = 1
ephemeralOwner = 0x0
dataLength = 11
numChildren = 0
// 发现只有acluser1用户具有对/acltest节点的crdwa权限
[zk: localhost:2181(CONNECTED) 91] getAcl /acltest
'digest,'acluser1:hHUVzmra9P/TbXlP/4jRhG9jZm8=
: cdrwa
======================客户端2上的操作=======================
// 只添加acluser2用户，发现没有权限读取/acltest节点
[zk: localhost:2181(CONNECTED) 14] addauth digest acluser2:222222
[zk: localhost:2181(CONNECTED) 15] get /acltest
Authentication is not valid : /acltest
// 添加acluser1后，能够读取/acltest节点
[zk: localhost:2181(CONNECTED) 16] addauth digest acluser1:111111
[zk: localhost:2181(CONNECTED) 17] get /acltest                  
acltestdata
cZxid = 0x7c
ctime = Fri Sep 14 18:42:17 PDT 2018
mZxid = 0x7c
mtime = Fri Sep 14 18:42:17 PDT 2018
pZxid = 0x7c
cversion = 0
dataVersion = 0
aclVersion = 1
ephemeralOwner = 0x0
dataLength = 11
numChildren = 0
```

小结：调用setAcl时不像auth那样会设置当前会话中所有用户访问节点的权限，只会设置指定的单个用户对节点的访问权限；setAcl设置中id需要使用sha1进行加密。

### IP检验策略

ACL格式：`ip:id:permission`

id是ip地址，指定某个ip地址可以访问。

示例：

```java
[zk: localhost:2181(CONNECTED) 96] create -e /acltest acltestdata
Created /acltest
// 设置只有192.168.1.1这台机器可以访问
[zk: localhost:2181(CONNECTED) 97] setAcl /acltest ip:192.168.1.1:crdwa
cZxid = 0x85
ctime = Fri Sep 14 18:59:23 PDT 2018
mZxid = 0x85
mtime = Fri Sep 14 18:59:23 PDT 2018
pZxid = 0x85
cversion = 0
dataVersion = 0
aclVersion = 1
ephemeralOwner = 0x100063d34d5000b
dataLength = 11
numChildren = 0
// 本机地址为127.0.0.1,无法访问
[zk: localhost:2181(CONNECTED) 98] get /acltest
Authentication is not valid : /acltest
```

### super检验策略

super检验策略主要供运维人员维护节点使用，acl中指定的用户具有任何操作任何节点的权限，启动时需要在启动脚本配置如下参数：

```java
-Dzookeeper.DigestAuthenticationProvider.superDigest=admin:015uTByzA4zSglcmseJsxTo7n3c=
```

因为我喜欢在本地测试时前台启动zookeeper，因此我在zkServer.sh的如下位置加上该配置：

```java
start-foreground)
    ZOO_CMD=(exec "$JAVA")
    if [ "${ZOO_NOEXEC}" != "" ]; then
      ZOO_CMD=("$JAVA")
    fi
    "${ZOO_CMD[@]}" "-Dzookeeper.log.dir=${ZOO_LOG_DIR}" "-Dzookeeper.root.logger=${ZOO_LOG4J_PROP}" \
    "-Dzookeeper.DigestAuthenticationProvider.superDigest=admin:015uTByzA4zSglcmseJsxTo7n3c=" \
    -cp "$CLASSPATH" $JVMFLAGS $ZOOMAIN "$ZOOCFG"
```

测试示例，重新启动zookeeper服务：

```java
=========================客户端1上操作=======================
[zk: localhost:2181(CONNECTED) 104] create -e /acltest acltestdata
Created /acltest
[zk: localhost:2181(CONNECTED) 105] addauth digest acluser1:111111
[zk: localhost:2181(CONNECTED) 107] setAcl /acltest digest:acluser1:hHUVzmra9P/TbXlP/4jRhG9jZm8=:crdwa     
cZxid = 0x8a
ctime = Fri Sep 14 19:17:37 PDT 2018
mZxid = 0x8a
mtime = Fri Sep 14 19:17:37 PDT 2018
pZxid = 0x8a
cversion = 0
dataVersion = 0
aclVersion = 1
ephemeralOwner = 0x10006e2720e0000
dataLength = 11
numChildren = 0
[zk: localhost:2181(CONNECTED) 108] getAcl /acltest
'digest,'acluser1:hHUVzmra9P/TbXlP/4jRhG9jZm8=
: cdrwa
========================客户端2上操作=========================
[zk: localhost:2181(CONNECTED) 20] ls /
[acltest, zookeeper]
[zk: localhost:2181(CONNECTED) 21] get /acltest
Authentication is not valid : /acltest
// 添加启动脚本配置的super用户
[zk: localhost:2181(CONNECTED) 22] addauth digest admin:111111
// 可以访问到节点
[zk: localhost:2181(CONNECTED) 23] get /acltest               
acltestdata
cZxid = 0x8a
ctime = Fri Sep 14 19:17:37 PDT 2018
mZxid = 0x8a
mtime = Fri Sep 14 19:17:37 PDT 2018
pZxid = 0x8a
cversion = 0
dataVersion = 0
aclVersion = 1
ephemeralOwner = 0x10006e2720e0000
dataLength = 11
numChildren = 0
```

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有
