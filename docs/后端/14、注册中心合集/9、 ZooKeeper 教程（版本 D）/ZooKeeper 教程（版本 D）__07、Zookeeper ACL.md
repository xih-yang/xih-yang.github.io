# 07、Zookeeper ACL
- 来源：https://ddkk.com/zhuanlan/registered/zookeeper/d-4/7.html
- 分类：注册中心
- 分组：ZooKeeper 教程（版本 D）
## 摘要

DataTree涉及到ACL，本节先讲解ACL相关内容

讲ACL的参考资料并不是很多，书上也没有讲原理实现，这里自己整理一下

本文主要讲解

```java
ACL简介
ACL数据结构
  perms
  Id(id,schema)
  内置权限，ACL列表，Id，schema
ACL的创建，修改
ACL的验证
  ACL创建修改的验证(create,setACL)
  ACL申请权限的验证(各种操作)
```

## 简介

ZooKeeper使用ACL来控制访问其znode（ZooKeeper的数据树的数据节点）。ACL的实现方式非常类似于UNIX文件的访问权限：它采用访问权限位 允许/禁止 对节点的各种操作以及能进行操作的范围。不同于UNIX权限的是，ZooKeeper的节点不局限于 用户（文件的拥有者），组和其他人（其它）这三个标准范围。ZooKeeper不具有znode的拥有者的概念。相反，ACL指定id集以及与之对应的权限。

***还要注意的是一条ACL仅针对于一个特定的节点。尤其不适用于子节点。***

例如，如果/app 只对IP：172.16.16.1可读 而 / APP/status 是对任何人可读的，ACL不是递归的。

ZooKeeper支持可插拔的身份验证方案。 id使用如下形式 scheme：id，其中 scheme 是 id 所对应一个认证方案。例如，IP：172.16.16.1，id为主机的地址 172.16.16.1。

当客户端连接到ZooKeeper验证自己时，ZooKeeper将有关该客户端的所有Id与客户连接关联。客户端试图访问一个节点时，这些ID与该znodes的ACL验证。 ***ACL是由（scheme:expression, perms）对构成。其中expression的格式指定为scheme。***例如，（IP：19.22.0.0/16，READ）表示对所有起始IP为19.22的客户端具有读权限。

***一个ZooKeeper的节点（znode）存储两部分内容：数据和状态，状态中包含ACL信息。创建一个znode会产生一个ACL列表。***

那么，ACL具体是什么呢，怎么实现的?

## ACL数据结构

代码里面涉及ACL机制的类有

```java
org.apache.zookeeper.data.ACL
  包含权限perms与Id(见下)
org.apache.zookeeper.data.Id
  包含验证模式schema和提供的验证内容id
org.apache.zookeeper.ZooDefs
  提供内置的OpCode
  权限Perms
  ACL列表定义Ids
```

先用一张图说明ACL与Id这两个类的依赖关系

ACL与Id依赖关系

也可以说,每个ACL包括：

```java
验证模式(scheme)
具体内容(Id)（当scheme=“digest”时，Id为用户名密码，例如“root：J0sTy9BCUKubtK1y8pkbL7qoxSw=”）
权限(perms)
```

下面分开进行介绍这两个结构(perms,Id),也可以说是三个结构(perms,id,schema),这里根据类的定义来，还是当成两个数据结构来讲,ACL数据结构如下

```java
public class ACL implements Record {
  private int perms;
  private Id id;
}
```

### 权限perms

目前，节点的权限（perms）有以下几种，在org.apache.zookeeper.ZooDefs.Perms 中定义

```java
int READ = 1 << 0;//允许对本节点GetChildren和GetData操作
int WRITE = 1 << 1;//允许对本节点SetData操作
int CREATE = 1 << 2;//允许对子节点Create操作
int DELETE = 1 << 3;//允许对子节点Delete操作
int ADMIN = 1 << 4;//允许对本节点setAcl操作
int ALL = READ | WRITE | CREATE | DELETE | ADMIN;//这个是组合权限
```

ACL权限用一个int型数字perms表示

perms的5个二进制位分别表示setacl、delete、create、write、read

比如0x1f=adcwr，0x1=----r，0x15=a-c-r。

除了ALL以外，其他都是最细粒度的权限，可以用|,&来自己定义perms的组合权限

### Id

包含验证模式schema以及提供验证的内容id

目前zk提供了两个内置的Id，在org.apache.zookeeper.ZooDefs.Ids中定义

```java
/**
* This Id represents anyone.
*/
public final Id ANYONE_ID_UNSAFE = new Id("world", "anyone");//固定用户为anyone，为所有Client端开放权限
/**
* This Id is only usable to set ACLs. It will get substituted with the
* Id's the client authenticated with.
*/
public final Id AUTH_IDS = new Id("auth", "");//不使用任何id，代表任何已确认用户。
```

以及在org.apache.zookeeper.server.auth.DigestAuthenticationProvider#handleAuthentication 定义的

```java
new Id("super", "")//在这种scheme情况下，对应的id拥有超级权限，可以做任何事情(cdrwa）
```

除了内置Id以外，还有内置的schema提供认证模式，但是没有对应的默认id(因为都是动态提供的)

schema

除了上面内置Id定义的world和auth,super这三个schema，还有无固定id的内置的schema即验证模式

验证模式以及验证方法通过AuthenticationProvider实现

AuthenticationProvider的三种实现

最终在ProviderRegistry中进行注册

```java
digest：Client端由用户名和密码验证，譬如user:password，digest的密码生成方式是Sha1摘要的base64形式
ip：Client端由IP地址验证，譬如172.2.0.0/24
Sasl: 这个类定义了，但是并没有注册,我也并不清楚这个认证方式
```

下面对Id做一个总结

schema
id
意义
备注

auth
""
不使用任何id，代表任何已确认用户
自带Id

world
anyone
固定用户，为所有Client端开放权限
自带Id

super
""
拥有超级权限，可以做任何事情(cdrwa）
自带Id

ip
无固定值，有固定格式(ip expression)
IP验证方式
自带schema

digest
无固定值，有固定格式(digest expression)
用户名和密码验证，再生成摘要
自带schema

sasl
无固定值，有固定格式(sasl expression)
sasl验证方式，这个我并不是很懂
自带schema

## ACL的创建与修改

```java
只有两类API会改变Znode的ACL列表：一个是create()，一个是setACL()。
这两个方法都要求传入一个List。Server接到这两种更新请求后，会判断指定的每一个ACL中，scheme对应的AuthenticationProvider是否存在。
如果存在，调用其isValid(String)方法判断对应的id表达式是否合法
具体参见PrepRequestProcessor.fixupACL()方法。
```

## ACL的验证

### ACL创建修改时的验证

只在create和setACL操作中涉及ACL的创建与修改，具体参见PrepRequestProcessor.fixupACL()

```java
private boolean fixupACL(List<Id> authInfo, List<ACL> acl) {
    if (skipACL) {
        return true;
    }
    if (acl == null || acl.size() == 0) {
        return false;
    }
    Iterator<ACL> it = acl.iterator();
    LinkedList<ACL> toAdd = null;
    while (it.hasNext()) {
        ACL a = it.next();
        Id id = a.getId();
        if (id.getScheme().equals("world") && id.getId().equals("anyone")) {//如果是固定用户，为所有Client端开放权限
            // wide open
        } else if (id.getScheme().equals("auth")) {
            // This is the "auth" id, so we have to expand it to the
            // authenticated ids of the requestor
            it.remove();//如果是auth，把这个从acl的List中删掉
            if (toAdd == null) {
                toAdd = new LinkedList<ACL>();
            }
            boolean authIdValid = false;
            for (Id cid : authInfo) {
                /*
                一般情况下，默认的Id只有IP这一种(org.apache.zookeeper.server.NIOServerCnxn.NIOServerCnxn)，里面调用了
                authInfo.add(new Id("ip", addr.getHostAddress()));
                 */
                AuthenticationProvider ap =
                    ProviderRegistry.getProvider(cid.getScheme());
                if (ap == null) {
                    LOG.error("Missing AuthenticationProvider for "
                            + cid.getScheme());
                } else if (ap.isAuthenticated()) {//如果验证过了,三种实现中，IP返回false，其他两种返回true
                    authIdValid = true;
                    toAdd.add(new ACL(a.getPerms(), cid));
                }
            }
            if (!authIdValid) {
                return false;
            }
        } else {//其他认证模式的话,如ip，digest，sasl
            AuthenticationProvider ap = ProviderRegistry.getProvider(id
                    .getScheme());
            if (ap == null) {
                return false;
            }
            if (!ap.isValid(id.getId())) {//如果id的格式不valid
                return false;
            }
        }
    }
    if (toAdd != null) {
        for (ACL a : toAdd) {
            acl.add(a);
        }
    }
    return acl.size() > 0;//确保有一种方式认证通过了
}
```

简而言之，这个函数就是看设置的ACL值是否合理,基本过程如下

```java
1.如果acl列表有("world","anyone"),那么一定认证通过
2.上述情况外，如果是Id的schema是"auth"，那么要看请求携带的authInfo是否是isAuthenticated的,是的话认证通过
3.上述情况外,一般就是“ip”,"digest","sasl"，调用对应认证提供器的isValid方法校验id内容格式是否valid,是的话认证通过
```

### 实例分析

下面分析一个用"auth",""这个Id创建节点出现的异常

### 背景

```java
String path1 = zk.create("/test21", "asd".getBytes(),
                    ZooDefs.Ids.CREATOR_ALL_ACL,
                    CreateMode.EPHEMERAL);
```

其中CREATOR_ALL_ACL定义在org.apache.zookeeper.ZooDefs.Ids#CREATOR_ALL_ACL中

```java
public final ArrayList<ACL> CREATOR_ALL_ACL = new ArrayList<ACL>(
                Collections.singletonList(new ACL(Perms.ALL, AUTH_IDS)));//用到了"auth",""
```

出现了异常

```java
org.apache.zookeeper.KeeperException$InvalidACLException: KeeperErrorCode = InvalidACL for /test21
```

### 原理分析

NIOServerCnxn#NIOServerCnxn只给request的authInfo加了"ip"这个schema

PrepRequestProcessor#fixupACL中，处理逻辑如下

异常分析

也就是说("auth","")应该和sasl或者digest这种schema配合起来使用才行，这里就深究如何使用"auth",""了

### 申请权限时的验证(以create为例)

应该会在后面处理链的时候讲，这里带过一下

比如在parentNode中进行createNode操作，参见

org.apache.zookeeper.server.PrepRequestProcessor#pRequest2Txn 中 case OpCode.create

调用了

```java
checkACL(zks, parentRecord.acl, ZooDefs.Perms.CREATE,
                        request.authInfo);//验证是否有create权限
```

checkACL函数如下

```java
/**
 *
 * @param zks
 * @param acl 对应节点或者父节点拥有的权限
 * @param perm 目前操作需要的权限
 * @param ids 目前请求提供的权限
 * @throws KeeperException.NoAuthException
 */
static void checkACL(ZooKeeperServer zks, List<ACL> acl, int perm,
        List<Id> ids) throws KeeperException.NoAuthException {
    if (skipACL) {//如果跳过ACL
        return;
    }
    if (acl == null || acl.size() == 0) {//如果没有要求的ACL
        return;
    }
    for (Id authId : ids) {
        if (authId.getScheme().equals("super")) {//如果提供的ACL有超级权限
            return;
        }
    }
    for (ACL a : acl) {
        Id id = a.getId();
        if ((a.getPerms() & perm) != 0) {//如果对应的节点拥有perm权限
            if (id.getScheme().equals("world")
                    && id.getId().equals("anyone")) {
                return;//如果请求提供了超级权限
            }
            AuthenticationProvider ap = ProviderRegistry.getProvider(id
                    .getScheme());//根据策略模式获取对应的认证提供器
            if (ap != null) {
                for (Id authId : ids) {//用认证器一个个 认证 请求提供的Id
                    if (authId.getScheme().equals(id.getScheme())
                            && ap.matches(authId.getId(), id.getId())) {//模式相同并且匹配通过
                        //这要有一个匹配通过就行
                        return;
                    }
                }
            }
        }
        //如果对应的节点都没有要求的perm权限，那就验证失败，和请求提供什么权限无关
    }
    throw new KeeperException.NoAuthException();
}
```

简而言之，就是***当前节点acl包含当前操作权限perm,并且当前节点acl能够认证通过请求提供的ids权限(有一个认证通过就行)***

## 思考

### 注意上面描述的Id与id的区别

在Id这个类中，有id这个属性，注意大小写

### ACL与Id的关系

```java
ACL包含perms与Id
Id包含Id和schema
```

### ("super","")和("world","anyone")权限比较

从上面的checkACL函数来讲，先遇到("super","")就return

实际上，("super","")并没有分配权限，就像是程序开的后门，遇到了这个Id，就通行。

而("world","anyone")，还进行了perm的分配，有对应的ACL,参照ZooDefs.Ids#ANYONE_ID_UNSAFE

在上面checkACL函数中，该Id还受限于

```java
if ((a.getPerms() & perm) != 0)
```

也就是说，原来的节点权限不包含当前需要的perm权限时，("world","anyone")也没用

所以结论就是*** ("super","")权限更大***

### 权限的创建修改，以及申请权限的验证

```java
在对节点进行create和setACL时涉及权限的创建和修改，主要验证acl列表的合理性
在org.apache.zookeeper.server.PrepRequestProcessor#fixupACL判断
在对节点进行操作时，需要验证当前请求以及相关节点是否有对应的权限
在org.apache.zookeeper.server.PrepRequestProcessor#checkACL判断
```

## 问题

创建最后将ACL信息保存在znode状态中，这是怎么实现的?

这个在后面请求链中再看

(auth,"")这个Id到底该怎么配合digest或者sasl使用，没有深究

## 吐槽

Id对应常量的地方有点乱，比如super定义在DigestAuthenticationProvider中

AuthenticationProvider 三个实现类的#isValid都没有注释

要自己看才知道对应schema该写的id(即验证内容)的格式应该是怎么样的

(auth,"")这个Id,使用说明太少了，没看到demo也没见到合理的资料

## 介绍

DataTree依赖ReferenceCountedACLCache，这里讲解一下ReferenceCountedACLCache

这个类主要是完成一个`List`与Long的互相转换，

因为DataNode中,acl值是一个Long值，并不是ACL列表

类图如下

ReferenceCountedACLCache类图

## 源码

### 属性

```java
private static final Logger LOG = LoggerFactory.getLogger(ReferenceCountedACLCache.class);
final Map<Long, List<ACL>> longKeyMap =
        new HashMap<Long, List<ACL>>();//一个long值对应的ACL列表
final Map<List<ACL>, Long> aclKeyMap =
        new HashMap<List<ACL>, Long>();//一个ACL列表对应的long值
final Map<Long, AtomicLongWithEquals> referenceCounter =
        new HashMap<Long, AtomicLongWithEquals>();//Key是一个ACL列表的映射值，value是记录引用次数
private static final long OPEN_UNSAFE_ACL_ID = -1L;//默认不安全的权限，对应("world","anyone")
/**
 * these are the number of acls that we have in the datatree
 */
long aclIndex = 0;//记录当前acl对应的long值的id(不断增加)
```

### 内部类AtomicLongWithEquals

```java
//继承AtomicLong类，实现equals方法
//用来记录引用次数
private static class AtomicLongWithEquals extends AtomicLong {
    private static final long serialVersionUID = 3355155896813725462L;
    public AtomicLongWithEquals(long i) {
        super(i);
    }
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        return equals((AtomicLongWithEquals) o);
    }
    public boolean equals(AtomicLongWithEquals that) {
        return get() == that.get();
    }
    @Override
    public int hashCode() {
        return 31 * Long.valueOf(get()).hashCode();
    }
}
```

### 方法

把一个acls列表转换成一个long

```java
public synchronized Long convertAcls(List<ACL> acls) {
    if (acls == null)
        return OPEN_UNSAFE_ACL_ID;
    // get the value from the map
    Long ret = aclKeyMap.get(acls);
    if (ret == null) {
        ret = incrementIndex();//如果没有记录，就对aclIndex进行incr，然后加入表
        longKeyMap.put(ret, acls);
        aclKeyMap.put(acls, ret);
    }
    addUsage(ret);//记录long的引用次数+1
    return ret;
}
```

根据一个long找到对应的acl列表

```java
public synchronized List<ACL> convertLong(Long longVal) {
    if (longVal == null)
        return null;
    if (longVal == OPEN_UNSAFE_ACL_ID)
        return ZooDefs.Ids.OPEN_ACL_UNSAFE;//-1的long对应OPEN_ACL_UNSAFE即("world","anyone")的ACL
    List<ACL> acls = longKeyMap.get(longVal);//根据Long值拿到对应ACL列表
    if (acls == null) {
        LOG.error("ERROR: ACL not available for long " + longVal);
        throw new RuntimeException("Failed to fetch acls for " + longVal);
    }
    return acls;
}
```

long的index+1

```java
private long incrementIndex() {
    return ++aclIndex;//存储在map中的下一个long值
}
```

反序列化

```java
public synchronized void deserialize(InputArchive ia) throws IOException {
    clear();//反序列化就清空所有记录
    int i = ia.readInt("map");
    while (i > 0) {
        Long val = ia.readLong("long");
        if (aclIndex < val) {
            aclIndex = val;
        }
        List<ACL> aclList = new ArrayList<ACL>();
        Index j = ia.startVector("acls");
        while (!j.done()) {
            ACL acl = new ACL();
            acl.deserialize(ia, "acl");
            aclList.add(acl);
            j.incr();
        }
        longKeyMap.put(val, aclList);//因为上面已经调用了clear操作，这里直接put即可，不会有残留的数据
        aclKeyMap.put(aclList, val);
        referenceCounter.put(val, new AtomicLongWithEquals(0));
        i--;
    }
}
```

序列化

```java
public synchronized void serialize(OutputArchive oa) throws IOException {
    oa.writeInt(longKeyMap.size(), "map");
    Set<Map.Entry<Long, List<ACL>>> set = longKeyMap.entrySet();
    for (Map.Entry<Long, List<ACL>> val : set) {
        oa.writeLong(val.getKey(), "long");
        List<ACL> aclList = val.getValue();
        oa.startVector(aclList, "acls");
        for (ACL acl : aclList) {
            acl.serialize(oa, "acl");
        }
        oa.endVector(aclList, "acls");
    }
}
```

得到size

```java
public int size() {
    return aclKeyMap.size();
}
```

清空记录

```java
private void clear() {//清空所有记录
    aclKeyMap.clear();
    longKeyMap.clear();
    referenceCounter.clear();
}
```

增加引用次数

```java
public synchronized void addUsage(Long acl) {
    if (acl == OPEN_UNSAFE_ACL_ID) {
        return;
    }
    if (!longKeyMap.containsKey(acl)) {
        LOG.info("Ignoring acl " + acl + " as it does not exist in the cache");
        return;
    }
    AtomicLong count = referenceCounter.get(acl);//计数器取出
    if (count == null) {
        referenceCounter.put(acl, new AtomicLongWithEquals(1));
    } else {
        count.incrementAndGet();//计数器+1
    }
}
```

减少引用次数

```java
public synchronized void removeUsage(Long acl) {//一个long值对应的acl的引用次数-1
    if (acl == OPEN_UNSAFE_ACL_ID) {
        return;
    }
    if (!longKeyMap.containsKey(acl)) {
        LOG.info("Ignoring acl " + acl + " as it does not exist in the cache");
        return;
    }
    long newCount = referenceCounter.get(acl).decrementAndGet();
    if (newCount <= 0) {//如果引用次数<=0
        referenceCounter.remove(acl);
        aclKeyMap.remove(longKeyMap.get(acl));
        longKeyMap.remove(acl);
    }
}
```

去掉没有用到的(引用次数 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有
