# 05、Zookeeper 的客户端 API 操作
- 来源：https://ddkk.com/zhuanlan/registered/zookeeper/d-2/5.html
- 分类：注册中心
- 分组：ZooKeeper 教程（版本 B）
## 1. IDEA环境搭建

在IDEA中创建一个Maven工程

其中pom依赖如下：

```xml
<dependencies>
    <dependency>
        <groupId>junit</groupId>
        <artifactId>junit</artifactId>
        <version>RELEASE</version>
    </dependency>
    <dependency>
        <groupId>org.apache.logging.log4j</groupId>
        <artifactId>log4j-core</artifactId>
        <version>2.8.2</version>
    </dependency>
    <dependency>
        <groupId>org.apache.zookeeper</groupId>
        <artifactId>zookeeper</artifactId>
        <version>3.5.7</version>
    </dependency>
    <dependency>
        <groupId>org.apache.curator</groupId>
        <artifactId>curator-framework</artifactId>
        <version>4.3.0</version>
    </dependency>
    <dependency>
        <groupId>org.apache.curator</groupId>
        <artifactId>curator-recipes</artifactId>
        <version>4.3.0</version>
    </dependency>
    <dependency>
        <groupId>org.apache.curator</groupId>
        <artifactId>curator-client</artifactId>
        <version>4.3.0</version>
    </dependency>
</dependencies>
```

在resources下添加log4j.properties文件，具体内容如下：

```java
log4j.rootLogger=INFO, stdout  
log4j.appender.stdout=org.apache.log4j.ConsoleAppender  
log4j.appender.stdout.layout=org.apache.log4j.PatternLayout  
log4j.appender.stdout.layout.ConversionPattern=%d %p [%c] - %m%n  
log4j.appender.logfile=org.apache.log4j.FileAppender  
log4j.appender.logfile.File=target/spring.log  
log4j.appender.logfile.layout=org.apache.log4j.PatternLayout  
log4j.appender.logfile.layout.ConversionPattern=%d %p [%c] - %m%n 
```

创建对应的包名和类名

## 2. 创建 ZooKeeper 客户端

具体代码如下：

```java
// 注意：逗号左右不能有空格
private String connectString = "yangshibiao:2181";
private int sessionTimeout = 2000;
private ZooKeeper zkClient;
@Before
public void init() throws IOException {
    zkClient = new ZooKeeper(connectString, sessionTimeout, new Watcher() {
        @Override
        public void process(WatchedEvent watchedEvent) {
            // 收到事件通知后的回调函数（用户的业务逻辑）
            System.out.println(watchedEvent.getType() + "--" + watchedEvent.getPath());
            // 再次启动监听
            try {
                List<String> children = zkClient.getChildren("/", true);
                for (String child : children) {
                    System.out.println("init==> "+child);
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
    });
}
```

## 3. 创建子节点

具体代码如下：

```java
    // 创建子节点
    @Test
    public void create() throws KeeperException, InterruptedException {
        // 参数 1：要创建的节点的路径； 参数 2：节点数据 ； 参数 3：节点权限 ；参数 4：节点的类型
        String nodeCreated = zkClient.create(
                "/yangshibiao",
                "ss.avi".getBytes(),
                ZooDefs.Ids.OPEN_ACL_UNSAFE,
                CreateMode.PERSISTENT
        );
    }
```

## 4. 获取子节点并监听节点变化

具体代码如下：

```java
// 获取子节点
@Test
public void getChildren() throws KeeperException, InterruptedException {
    List<String> children = zkClient.getChildren("/", true);
    for (String child : children) {
        System.out.println("getChildren ==> " + child);
    }
    // 延时
    Thread.sleep(Long.MAX_VALUE);
}
```

当在idea中启动程序后会将 zookeeper 跟目录下对应的子节点打印出来

但此时通过 zookeeper 命令行在创建一个 子节点，然后观察IDEA命令行会发现会重新打印所有子节点

当通过zookeeper 命令行删除一个子节点时，同样的会重新打印所有子节点

## 5. 判断 Znode 是否存在

具体代码如下：

```java
// 判断 znode 是否存在
@Test
public void exist() throws KeeperException, InterruptedException {
    Stat stat = zkClient.exists("/yangshibiao", false);
    System.out.println(stat == null ? "not exist " : "exist");
}
```

## 6. 上述操作代码汇总

```java
package com.ouyang.zookeeper;
import org.apache.zookeeper.*;
import org.apache.zookeeper.data.Stat;
import org.junit.Before;
import org.junit.Test;
import java.io.IOException;
import java.util.List;
/**
 * @ date: 2022/4/6
 * @ author: yangshibiao
 * @ desc: 项目描述
 */
public class ZookeeperClient {
    // 注意：逗号左右不能有空格
    private String connectString = "yangshibiao:2181";
    private int sessionTimeout = 2000;
    private ZooKeeper zkClient;
    @Before
    public void init() throws IOException {
        zkClient = new ZooKeeper(connectString, sessionTimeout, new Watcher() {
            @Override
            public void process(WatchedEvent watchedEvent) {
                // 收到事件通知后的回调函数（用户的业务逻辑）
                System.out.println(watchedEvent.getType() + "--" + watchedEvent.getPath());
                // 再次启动监听
                try {
                    List<String> children = zkClient.getChildren("/", true);
                    for (String child : children) {
                        System.out.println("init==> "+child);
                    }
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
        });
    }
    // 创建子节点
    @Test
    public void create() throws KeeperException, InterruptedException {
        // 参数 1：要创建的节点的路径； 参数 2：节点数据 ； 参数 3：节点权限 ；参数 4：节点的类型
        String nodeCreated = zkClient.create(
                "/yangshibiao",
                "ss.avi".getBytes(),
                ZooDefs.Ids.OPEN_ACL_UNSAFE,
                CreateMode.PERSISTENT
        );
    }
    // 获取子节点
    @Test
    public void getChildren() throws KeeperException, InterruptedException {
        List<String> children = zkClient.getChildren("/", true);
        for (String child : children) {
            System.out.println("getChildren ==> " + child);
        }
        // 延时
        Thread.sleep(Long.MAX_VALUE);
    }
    // 判断 znode 是否存在
    @Test
    public void exist() throws KeeperException, InterruptedException {
        Stat stat = zkClient.exists("/yangshibiao", false);
        System.out.println(stat == null ? "not exist " : "exist");
    }
}
```

## 7. 客户端向服务端写数据流程

## 7.1. 写流程之写入请求直接发送给Leader节点

## 7.2. 写流程之写入请求发送给follower节点

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有
