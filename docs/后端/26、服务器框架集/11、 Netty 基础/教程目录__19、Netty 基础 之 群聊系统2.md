# 19、Netty 基础 之 群聊系统2
- 来源：https://ddkk.com/zhuanlan/server/netty/4/19.html
- 分类：服务器框架
- 分组：教程目录
## 一、在群聊系统里加入点对点聊天

**1、** 思路；

**2、** 在GroupChatServerHandler.java中增加一个集合维护用户信息；

```java
//方式一：放在一个hashmap里
public static Map<String, Channel> channels = new ConcurrentHashMap<>();
//方式二：用User对象作为key
public static Map<User, Channel> channels2 = new ConcurrentHashMap<>();
```

**3、** 登录的时候，把用户id存入集合中；

**4、** 转发或者聊天的时候通过id找到对应的channel，然后把数据扔过去；
