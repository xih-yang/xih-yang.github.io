# 06、Zookeeper 的服务器动态上下线监听案例
- 来源：https://ddkk.com/zhuanlan/registered/zookeeper/d-2/6.html
- 分类：注册中心
- 分组：ZooKeeper 教程（版本 B）
## 1. 需求

某分布式系统中，主节点可以有多台，可以动态上下线，任意一台客户端都能实时感知到主节点服务器的上下线。

## 2. 需求分析

## 3. 具体实现

1）先在集群上创建/servers 节点

```java
create /servers "servers"
```

2）在Idea 项目中创建对应包

3）服务器端向 Zookeeper 注册代码

```java
package com.ouyang.zookeeper.case2;
import java.io.IOException;
import org.apache.zookeeper.CreateMode;
import org.apache.zookeeper.WatchedEvent;
import org.apache.zookeeper.Watcher;
import org.apache.zookeeper.ZooKeeper;
import org.apache.zookeeper.ZooDefs.Ids;
public class DistributeServer {
    private static String connectString = "yangshibiao:2181";
    private static int sessionTimeout = 2000;
    private ZooKeeper zk = null;
    private String parentNode = "/servers";
    // 创建到 zk 的客户端连接
    public void getConnect() throws IOException {
        zk = new ZooKeeper(connectString, sessionTimeout, new Watcher() {
            @Override
            public void process(WatchedEvent event) {
            }
        });
    }
    // 注册服务器
    public void registServer(String hostname) throws Exception {
        String create = zk.create(
                parentNode + "/server",
                hostname.getBytes(),
                Ids.OPEN_ACL_UNSAFE,
                CreateMode.EPHEMERAL_SEQUENTIAL
        );
        System.out.println(hostname + " is online " + create);
    }
    // 业务功能
    public void business(String hostname) throws Exception {
        System.out.println(hostname + " is working ...");
        Thread.sleep(Long.MAX_VALUE);
    }
    public static void main(String[] args) throws Exception {
        // 1 获取 zk 连接
        DistributeServer server = new DistributeServer();
        server.getConnect();
        // 2 利用 zk 连接注册服务器信息
        server.registServer(args[0]);
        // 3 启动业务功能
        server.business(args[0]);
    }
}
```

4）客户端代码

```java
package com.ouyang.zookeeper.case2;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import org.apache.zookeeper.WatchedEvent;
import org.apache.zookeeper.Watcher;
import org.apache.zookeeper.ZooKeeper;
public class DistributeClient {
    private static String connectString = "yangshibiao:2181";
    private static int sessionTimeout = 2000;
    private ZooKeeper zk = null;
    private String parentNode = "/servers";
    // 创建到 zk 的客户端连接
    public void getConnect() throws IOException {
        zk = new ZooKeeper(connectString, sessionTimeout, new Watcher() {
            @Override
            public void process(WatchedEvent event) {
                // 再次启动监听
                try {
                    getServerList();
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
        });
    }
    // 获取服务器列表信息
    public void getServerList() throws Exception {
        // 1 获取服务器子节点信息，并且对父节点进行监听
        List<String> children = zk.getChildren(parentNode, true);
        // 2 存储服务器信息列表
        ArrayList<String> servers = new ArrayList<>();
        // 3 遍历所有节点，获取节点中的主机名称信息
        for (String child : children) {
            byte[] data = zk.getData(parentNode + "/" + child, false, null);
            servers.add(new String(data));
        }
        // 4 打印服务器列表信息
        System.out.println(servers);
    }
    // 业务功能
    public void business() throws Exception {
        System.out.println("client is working ...");
        Thread.sleep(Long.MAX_VALUE);
    }
    public static void main(String[] args) throws Exception {
        // 1 获取 zk 连接
        DistributeClient client = new DistributeClient();
        client.getConnect();
        // 2 获取 servers 的子节点信息，从中获取服务器信息列表
        client.getServerList();
        // 3 业务进程启动
        client.business();
    }
}
```

## 4. 测试

### 4.1. 在Linux命令行上操作增加减少服务器

1）启动 DistributeClient 客户端

2）在bigdata1上 zk 的客户端/servers 目录上创建临时带序号节点

```java
create -e -s /servers/bigdata1 "bigdata1"
create -e -s /servers/bigdata2 "bigdata2"
```

3）观察 Idea 控制台变化

```java
[bigdata1, bigdata2]
```

4）执行删除操作

```java
delete /servers/bigdata10000000000
```

5）观察 Idea 控制台变化

```java
[bigdata2]
```

### 4.2. 在IDEA上操作增加减少服务器

1）启动 DistributeClient 客户端（如果已经启动过，不需要重启）

2）启动 DistributeServer 服务

> ①点击 Edit Configurations…
>
> ②在弹出的窗口中（Program arguments）输入想启动的主机，例如， bigdata1
>
> ③回 到 DistributeServer 的 main 方 法 ， 右 键 ， 在 弹 出 的 窗 口 中 点 击 Run“DistributeServer.main()”
>
> ④观察 DistributeServer 控制台，提示 bigdata1 is working
>
> ⑤观察 DistributeClient 控制台，提示 bigdata1 已经上线

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有
