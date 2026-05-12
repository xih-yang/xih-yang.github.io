# 05、Zookeeper 自带客户端原生api的使用
- 来源：https://ddkk.com/zhuanlan/registered/zookeeper/d-3/5.html
- 分类：注册中心
- 分组：ZooKeeper 教程（版本 C）
## 引入依赖

zookeeper中自带一个客户端，只需要引入zookeeper，在`build.gradle`中添加以下依赖即可：

```java
compile ('org.apache.zookeeper:zookeeper:3.4.13')
```

## 创建zookeeper会话

`org.apache.zookeeper.ZooKeeper`类的构造方法用于创建zookeeper客户端与服务端之间的会话。该类提供了如下几个构造方法：

```java
public ZooKeeper(String connectString, int sessionTimeout, Watcher watcher)
public ZooKeeper(String connectString, int sessionTimeout, Watcher watcher, boolean canBeReadOnly)
public ZooKeeper(String connectString, int sessionTimeout, Watcher watcher, long sessionId, byte[] sessionPasswd)
public ZooKeeper(String connectString, int sessionTimeout, Watcher watcher, long sessionId, byte[] sessionPasswd, boolean canBeReadOnly)
```

构造方法参数说明：

- **connectString**：指zk的服物器列表，以英文输入法下逗号分割的host:port，比如?192.168.1.1:2181， 192.168.1.2:2181，也可以通过在后面跟着根目录，表示此客户端的操作都是在此根目录下，比如:比如192.168.1.1:2181，192.168.1.2:2181/zk-book,表示此客户端操作的节点都是在/zk-book根目录下，比如创建/foo/bar，实际完整路径为/zk-book/foo/bar；
- **sessionTimeout**：会话超时时间，单位是毫秒，当在这个时间内没有收到心跳检测，会话就会失效；
- **watcher**：注册的watcher，null表示不设置；
- **canBeReadOnly**：用于标识当前会话是否支持”read-only”模式? ”，“read-only”模式是指当zk集群中的某台机器与集群中过半以上的机器网络端口不同，则此机器将不会接受客户端的任何读写请求，但是，有时候，我们希望继续提供读请求，因此设置此参数为true， 即客户端还以从与集群中半数以上节点网络不通的机器节点中读?数据；
- **sessionId**和**sessionPasswd**：分别代表会话ID和会话密钥，这两个个参数一起可以唯一确定一个会话，客户端通过这两个参数可以实现客户端会话复用；

## 创建zookeeper节点

`org.apache.zookeeper.ZooKeeper`类提供了如下创建zk节点的api：

```java
public String create(final String path, byte data[], List<ACL> acl, CreateMode createMode)
public void create(final String path, byte data[], List<ACL> acl, CreateMode createMode, StringCallback cb, Object ctx)
```

第一个方法以同步的方式创建节点，第二个方法以异步的方式创建节点，需要注意`不论同步或异步都不支持递归创建节点，当节点已经存在时，会抛出NodeExistsException异常`。

`create`方法参数说明：

- **path**：被创建的节点路径，比如：/zk-book/foo；
- **data[]**：节点中的数据，是一个字节数组；
- **acl**：acl策略
- **createMode**：节点类型，枚举类型，有四种选择：持久(PERSISTENT)、持久顺序(PERSISTENT_SEQUENTIAL)、临时(EPHEMERAL)、临时顺序(EPHEMERAL_SEQUENTIAL)；
- **cb**：异步回调函数，需要实现接StringCallback接口，当服物器端创建完成后，客户端会自动调用 这个对象的方法processResult；
- **ctx**：用于传递一个对象，可以在回调方法执行的时候使用，通常用于传递业务的上下文信息；

其中`org.apache.zookeeper.data.ACL`类中有两个成员：

```java
private int perms;
private org.apache.zookeeper.data.Id id;
```

`perms`成员是ACL组成`Scheme:id:permission`中的`permission`，zk中`perms`定义如下：

```java
public interface Perms {
    int READ = 1 << 0;
    int WRITE = 1 << 1;
    int CREATE = 1 << 2;
    int DELETE = 1 << 3;
    int ADMIN = 1 << 4;
    int ALL = READ | WRITE | CREATE | DELETE | ADMIN;
}
```

`org.apache.zookeeper.data.Id`类中定义了如下成员：

```java
private String scheme;
private String id;
```

分别代表ACL组成`Scheme:id:permission`中的`Scheme`和`id`。(ACL参考文档[[zookeeper] zookeeper系列二：zookeeper持久节点、临时节点及ACL](https://blog.csdn.net/zkp_java/article/details/82709708) )

其中`org.apache.zookeeper.ZooDefs.Ids`接口中有预先定义的几种ACL策略：

```java
public interface Ids {
    /**
     * This Id represents anyone.
     */
    public final Id ANYONE_ID_UNSAFE = new Id("world", "anyone");
    /**
     * This Id is only usable to set ACLs. It will get substituted with the
     * Id's the client authenticated with.
     */
    public final Id AUTH_IDS = new Id("auth", "");
    /**
     * This is a completely open ACL .
     * 相当于 world:anyone:cdrwa
     */
    public final ArrayList<ACL> OPEN_ACL_UNSAFE = new ArrayList<ACL>(
            Collections.singletonList(new ACL(Perms.ALL, ANYONE_ID_UNSAFE)));
    /**
     * This ACL gives the creators authentication id's all permissions.
     * 相当于  相?于auth:用户:密码,但是需要通过ZooKeeper的addAuthInfo添加对应的用户和密码对
     */
    public final ArrayList<ACL> CREATOR_ALL_ACL = new ArrayList<ACL>(
            Collections.singletonList(new ACL(Perms.ALL, AUTH_IDS)));
    /**
     * This ACL gives the world the ability to read.
     * 相当于world:anyone:r，即所有人拥有读权限
     */
    public final ArrayList<ACL> READ_ACL_UNSAFE = new ArrayList<ACL>(
            Collections
                    .singletonList(new ACL(Perms.READ, ANYONE_ID_UNSAFE)));
}
```

## 删除zookeeper节点

`org.apache.zookeeper.ZooKeeper`类提供了如下删除zk节点的api：

```java
// 以同步的方式删除节点
public void delete(final String path, int version)
        throws InterruptedException, KeeperException
// 以异步的方式删除节点，如果写测试代码，客户端主线程不能退出，否则可能请求没有发到服物器或者异步回调不成功
public void delete(final String path, int version, VoidCallback cb, Object ctx)
```

参数说明：

- **path**：被删除节点的路径
- **version**：节点的数据版本，如果指定的版本不是最新版本，将会报错
- **cb**：异步回调函数
- **ctx**：传递的上下文信息，即操作之前的信息传递到删除之后的异步回调函数里面

## 获取zookeeper子节点

`org.apache.zookeeper.ZooKeeper`类提供了如下获取zk子节点的api：

```java
public List<String> getChildren(final String path, Watcher watcher) throws KeeperException, InterruptedException
public List<String> getChildren(String path, boolean watch) throws KeeperException, InterruptedException
public void getChildren(final String path, Watcher watcher, ChildrenCallback cb, Object ctx)
public void getChildren(String path, boolean watch, ChildrenCallback cb, Object ctx)
public List<String> getChildren(final String path, Watcher watcher, Stat stat)
public List<String> getChildren(String path, boolean watch, Stat stat) throws KeeperException, InterruptedException
public void getChildren(final String path, Watcher watcher, Children2Callback cb, Object ctx)
public void getChildren(String path, boolean watch, Children2Callback cb, Object ctx)
```

参数说明：

- **path**：数据节点路径，比如?/zk-book/foo，获取该路径下的子节点列表
- **watcher**：给节点设置的watcher，如果path对应节点的子节点数量发生变化，将会得到通知，允许?null
- **watch**：使用使用默认watch，true的话当删除path节点或path子节点数量发生变化则默认watch或得到通知
- **stat**：指定数据节点的状态信息
- **cb**：异步回调函数
- **ctx**：用于传递一个对象，可以在回调方法执行的时候使用，通常用于传递业务的上文信息

## 获取zookeeper节点数据

`org.apache.zookeeper.ZooKeeper`类提供了如下获取zk节点数据的api：

```java
public byte[] getData(final String path, Watcher watcher, Stat stat) throws KeeperException, InterruptedException
public byte[] getData(String path, boolean watch, Stat stat) throws KeeperException, InterruptedException
public void getData(final String path, Watcher watcher, DataCallback cb, Object ctx)
public void getData(String path, boolean watch, DataCallback cb, Object ctx)
```

参数说明：

- **path**:数据节点的路径，比如：/zk-book/foo，获取该路径节点的数据；
- **watcher**:设置watcher后，如果path对应节点的数据发生变化(设置新的数据或删除节点)，将会得到通知，允许?null；
- **watch**:是否使用默认的watcher；
- **stat**:获取到的数据节点的状态信息将会保存到stat变量中，stat定义如下成员：

```java
private long czxid;
private long mzxid;
private long ctime;
private long mtime;
private int version;
private int cversion;
private int aversion;
private long ephemeralOwner;
private int dataLength;
private int numChildren;
private long pzxid;
```

代表了数据节点的状态信息；

- **cb**:异步回调函数；
- **ctx**:用于传递一个对象，可以在回调方法执行的时候用，通常用于传递业务的上下文信息；

## 修改zookeeper节点数据

`org.apache.zookeeper.ZooKeeper`类提供了如下修改zk节点数据的api：

```java
public Stat setData(final String path, byte data[], int version) throws KeeperException, InterruptedException
public void setData(final String path, byte data[], int version, StatCallback cb, Object ctx)
```

参数说明：

- **path**:被修改的节点路径；
- **data**:新的数据
- **version**:指定的数据节点的版本，如果指定的版本不是最新版本，将会报错；
- **cb**:异步回调函数；
- **ctx**:传递的上下文信息，即操作之前的信息传递到删除之后的异步回调函数里面；

## 检查zookeeper节点是否存在

`org.apache.zookeeper.ZooKeeper`类提供了如下检查zk节点是否存在的api：

```java
public Stat exists(final String path, Watcher watcher) throws KeeperException, InterruptedException
public Stat exists(String path, boolean watch) throws KeeperException, InterruptedException
public void exists(final String path, Watcher watcher, StatCallback cb, Object ctx)
public void exists(String path, boolean watch, StatCallback cb, Object ctx)
```

参数说明：

- **path**:数据节点的路径；
- **watcher**:需要注册的watcher，当监听的节点被创建、被删除或者被更新时该watcher会得到通知；
- **watch**:是否使用默认的watcher；
- **cb**:异步回调函数；
- **ctx**:用于传递一个对象，可以在回调方法执行的时候用，通常用于传递业务的上下文信息；

## zookeeper API使用示例

如下示例演示了zookeeper api的使用：

```java
package com.ctrip.flight.test.zookeeper;
import org.apache.zookeeper.CreateMode;
import org.apache.zookeeper.ZooDefs;
import org.apache.zookeeper.ZooKeeper;
import org.apache.zookeeper.data.ACL;
import org.apache.zookeeper.data.Id;
import org.apache.zookeeper.data.Stat;
import org.apache.zookeeper.server.auth.DigestAuthenticationProvider;
import java.util.ArrayList;
import java.util.List;
public class ZkClientTest {
    private static final String PARENT_PATH = "/zkClientTest";
    private static final String CHILD_PATH = "/zkClientTest/childNodeTest";
    private static final String IDENTITY = "zhangsan:123456";
    public static void main(String[] args) {
        try {
            DefaultWatcher defaultWatcher = new DefaultWatcher();
            ChildrenWatcher childrenWatcher = new ChildrenWatcher();
            ParentWatcher parentWatcher = new ParentWatcher();
            // 创建会话
            ZooKeeper client = new ZooKeeper("192.168.0.102:2181,192.168.0.102:2182,192.168.0.102:2183", 30000, defaultWatcher);
            client.addAuthInfo("digest", IDENTITY.getBytes());
            Stat stat = client.exists(PARENT_PATH, false);
            if (null != stat) {
                client.delete(PARENT_PATH, -1);
            }
            // 创建节点，临时节点不能有子节点，所以父节点是持久节点
            client.create(PARENT_PATH, "zkClientTestData_v1".getBytes(), getAcl(), CreateMode.PERSISTENT);
            // 创建子节点
            client.create(CHILD_PATH, "childNodeData_v1".getBytes(), getAcl(), CreateMode.EPHEMERAL);
            // 获取子节点信息
            Stat childStat = new Stat();
            List<String> childs = client.getChildren(PARENT_PATH, childrenWatcher, childStat);
            System.out.println(PARENT_PATH + "'s childs:" + childs);
            System.out.println(PARENT_PATH + "'s stat:" + childStat);
            Thread.sleep(1000);
            // 获取父节点数据
            Stat parentStat = new Stat();
            byte[] parentData = client.getData(PARENT_PATH, parentWatcher, parentStat);
            System.out.println(PARENT_PATH + "'s data: " + new String(parentData));
            System.out.println(PARENT_PATH + "'s stat: " + parentStat);
            Thread.sleep(1000);
            // 设置子节点数据
            childStat = client.setData(CHILD_PATH, "childNodeData_v2".getBytes(), -1);
            System.out.println(CHILD_PATH + "'s stat:" + childStat);
            byte[] childData = client.getData(CHILD_PATH, false, childStat);
            System.out.println(CHILD_PATH + "'s data:" + new String(childData));
            Thread.sleep(1000);
            // 删除子节点
            client.delete(CHILD_PATH, -1);
            // 判断子节点是否存在
            childStat = client.exists(CHILD_PATH, false);
            System.out.println(CHILD_PATH + " is exist: " + (childStat != null));
            client.delete(PARENT_PATH, -1);
            client.close();
            Thread.sleep(1000);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
    /**
     * ACL格式为：schema：id：permission
     * @return
     */
    private static List<ACL> getAcl() throws Exception {
        List<ACL> acls = new ArrayList<>();
        // 指定schema
        String scheme = "auth";
        // 指定id
        // String identity = "zhangsan:123456";
        Id id = new Id(scheme, DigestAuthenticationProvider.generateDigest(IDENTITY));
        // Perms.ALL的权限为crdwa
        ACL acl = new ACL(ZooDefs.Perms.ALL, id);
        acls.add(acl);
        return acls;
    }
}
```

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有
