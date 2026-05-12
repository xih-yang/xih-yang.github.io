# 01、Zookeeper 源码解析 - 初识ZooKeeper
- 来源：https://ddkk.com/zhuanlan/registered/zookeeper/2/1.html
- 分类：注册中心
- 分组：教程目录
### 一、什么是ZooKeeper？

ZooKeeper是Apache旗下开源的分布式协调服务，可以支持分布式配置、分布式同步、命名注册等服务，这是进行分布式系统开发中非常重要的一个软件，本文开始将从源码级来认识ZooKeeper。

### 二、ZooKeeper安装

第一步：从[官网](https://zookeeper.apache.org/releases.html)下载对应版本的安装包

第二步：修改conf目录下的zoo_sample.cfg为zoo.cfg

第三步：编辑zoo.cfg 找到dataDir字符配置好对应的位置

第四步：启动zkServer.cmd，此时ZooKeeper就可以正常启动

### 三、使用

可以通过help指令查看帮助命令：

常用命令介绍如下：

- ls：查看节点信息，后接节点路径，必须以“/”开头，如 ls /
- get：获取节点信息，后接节点路径，必须以“/”开头，如 get /
- create：创建节点信息，节点分为临时节点和永久节点，临时节点的生命周期在于当前的回话，回话结束临时节点也跟着失效，创建临时节点需要加上-e参数，这里还有一个-s参数，表示的是创建带顺序的节点，-t 表示是创建一个带过期时间的节点默认是关闭的，需要zookeeper.extendedTypesEnabled=true进行打开，-c是创建容器节点，容器节点特性是，当容器节点中最后一个子节点被删除，那么容器节点本身也要被删除。
- set ：修改节点值，-s表示显示当前节点状态信息，-v表示当前节点版本
- delete：删除节点，-v是表示版本号
- deleteall：删除所有节点
- close：关闭当前会话
- quit：退出当前会话
- addWatch：给某个节点加上事件监听器，-m表示监听器类型，有两个取值PERSISTENT和PERSISTENT_RECURSIVE，默认是后者，如果是新增和删除子节点时：前者返回的事件类型是NodeChildrenChanged后者返回的是NodeCreated，修改自身节点时都是返回NodeDataChanged，如果是子节点前者没反应，后者返回NodeDataChanged。

-stat：列出节点信息
- ACL：权限控制，ZooKeeper中权限控制是针对某个节点，每个节点可以设置多种权限，子节点不继承父节点权限。权限控制一般采用如下方式：scheme🆔permission

secheme：授权模式，有world、auth、digest、ip，world是默认模式，表示所有用户都可以操作，auth，表示已经通过认证的用户（可以通过命令addauth来认证），digest表示需要username和password的认证方式，ip使用客户端的ip作为认证方式

ID：授权对象，也就是当前需要授权的用户或者ip地址等

permission：权限简写是crwda，也就是增删改查管理

ACL的命令有getAcl、setAcl和addauth

getAcl：后接节点路径-s表示列出节点信息，如下图，权限模式是world，id是anyone，权限是cdrwa

setAcl：setAcl path acl，我们主要说说auth和digest模式

auth：我们先创建一个节点 acl，其次我们创建一个授权用户 addauth digest acl:123456，最后设置权限setAcl /acl auth:acl:123456:cdwra,此时，退出重新登录，通过get /acl去获取节点是你就会得到NoAuth for /acl返回，此时需要重新加权限addauth digest acl:123456，这样就可以正常取值。

digest：和auth一样的模式，不同的地方在于密码是通过用户名和原始密码加密之后得到的（加密方式是先sha1后base64）如果要进行删除等操作也需要addauth digest username:password

以上就是简单命令介绍。

**数据结构：**

ZooKeeper是以树的结构保存数据，每个节点成为znode，他是以键值对的形式存储数据，用get命令去获取一个节点信息如下：

第一行是节点中保存的值，接下来就是节点的信息。

- cZxid：表示创建节点时的事务id
- ctime：创建节点时的时间
- mZxid：最后修改节点的事务id
- mtime：最后修改节点的时间
- pZxid：当前节点中子节点列表变化的事务id（修改子节点内容，这个id不会变）
- cversion：子节点版本号（增加删除子节点时会加1操作）
- dataVersion：数据版本号，修改节点数据的时候，版本号加1
- aclVersion：权限版本号，修改当前节点权限的时候加1
- ephemeralOwner：创建临时节点的sessionId，如果是持久化节点值为0
- dataLength：内容大小
- numChildren：子节点个数

**Java api：**

ZooKeeper提供了一套原生api，供开发者使用，Netflix 公司也开发了一套开源的ZooKeeper客户端框架Curator，将简单介绍一下这两种api。

***原生api：***

引入jar包

```java
<dependency>
  <groupId>org.apache.zookeeper</groupId>
  <artifactId>zookeeper</artifactId>
  <version>3.4.8</version>
</dependency>
```

如下就是简单的连接测试代码：

```java
public class ZkTest {
    public static void main(String[] args) throws IOException, InterruptedException {
        CountDownLatch latch=new CountDownLatch(1);
        ZooKeeper zk=new ZooKeeper("127.0.0.1:2181", 10000, new Watcher() {
            @Override
            public void process(WatchedEvent event) {
                if (event.getState()== Event.KeeperState.SyncConnected){
                    latch.countDown();
                    System.out.println("成功连接！");
                }
            }
        });
        //因为连接需要时间，所以需要进行连接等待。
        latch.await();
        Stat stat=new Stat();
        byte[] nn= zk.getData("/zktest",null,stat);
        System.out.println(new String(nn));
        zk.setData("/zktest","test".getBytes(),stat.getVersion());
        nn= zk.getData("/zktest",null,stat);
        System.out.println(new String(nn));
    }
}
```

然后我们就可以通过zk对象去进行对应的操作，如果是集群下，我们只需要把集群地址以逗号分隔方式传入即可。

***Curator框架：***

同样需要引入对应的jar包：

```java
<dependency>
  <groupId>org.apache.curator</groupId>
  <artifactId>curator-framework</artifactId>
  <version>4.0.0</version>
</dependency>
<dependency>
  <groupId>org.apache.curator</groupId>
  <artifactId>curator-recipes</artifactId>
  <version>4.0.0</version>
</dependency>
```

如下所示：

```java
public class CuratorTest {
    public static void main(String[] args) throws Exception {
        CuratorFramework cf= CuratorFrameworkFactory.builder().connectString("127.0.0.1:2181").sessionTimeoutMs(10000).retryPolicy(new
                ExponentialBackoffRetry(1000,1)).build();
        cf.start();
        Stat stat=new Stat();
        byte[] nn= cf.getData().storingStatIn(stat).forPath("/zktest");
        System.out.println(new String(nn));
        cf.create().forPath("/zksss","zktttttttttttt".getBytes());
        nn= cf.getData().storingStatIn(stat).forPath("/zksss");
        System.out.println(new String(nn));
        System.out.println(stat.getCtime());
    }
}
```

基本demo比较简单，具体的可以自行研究。

### 四、源码构建

第一步安装Ant环境，这个比较简单（有的较低版本需要）。

第二步下载源码：[https://github.com/apache/zookeeper](https://github.com/apache/zookeeper)，本文下载的版本是3.7.0

第三步编译源码，直接导入到Idea中，然后install即可

第四步运行源代码，设置好运行参数，如下所示

### 五、总结

本文简单介绍了ZooKeeper的安装、命令的简单实用以及api的使用过程，以及源代码的构建过程，后续针对源代码进行分析，从底层逻辑来看ZooKeeper的实现过程。

以上，有任何不对的地方，请留言指正，敬请谅解。
