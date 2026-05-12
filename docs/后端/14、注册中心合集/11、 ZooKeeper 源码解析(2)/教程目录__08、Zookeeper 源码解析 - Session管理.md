# 08、Zookeeper 源码解析 - Session管理
- 来源：https://ddkk.com/zhuanlan/registered/zookeeper/2/8.html
- 分类：注册中心
- 分组：教程目录
### 一、Session

客户端成功连接到服务端表示一个会话建立成功，会话成功建立后，客户端和服务端就可以正常的交互，所以本文将从服务端源码级来探寻ZooKeeper中的Session管理机制。

还是先回到NIOServerCnxn的doIO方法，这是处理客户端连接的入口方法，由之前的分析我们知道，客户端请求建立连接时候，会先调用readConnectRequest()方法，这个方法是处理客户端的连接请求，转而又调用ZooKeeperServer中的processConnectRequest方法（省略了部分代码）。

```java
public void processConnectRequest(ServerCnxn cnxn, ByteBuffer incomingBuffer)
    throws IOException, ClientCnxnLimitException {
    //把当前的连接请求，反序列化到ConnectRequest对象中
    BinaryInputArchive bia = BinaryInputArchive.getArchive(new ByteBufferInputStream(incomingBuffer));
    ConnectRequest connReq = new ConnectRequest();
    connReq.deserialize(bia, "connect");
    //读取客户端传递过来的sessionId，从这里可以知道sessionId是一个long类型数据
    long sessionId = connReq.getSessionId();
    boolean readOnly = false;
    //获取session过期时间
    int sessionTimeout = connReq.getTimeOut();
    //获取客户端传递过来的秘密
    byte[] passwd = connReq.getPasswd();
    //获取最短过期时间
    int minSessionTimeout = getMinSessionTimeout();
    if (sessionTimeout < minSessionTimeout) {
        sessionTimeout = minSessionTimeout;
    }
    //服务端最长过期时间
    int maxSessionTimeout = getMaxSessionTimeout();
    if (sessionTimeout > maxSessionTimeout) {
        sessionTimeout = maxSessionTimeout;
    }
    //保存当前session过期时间值
    cnxn.setSessionTimeout(sessionTimeout);
    //表示当前的请求连接数据接收完成，暂停接收当前的数据
    cnxn.disableRecv();
    //如果客户端传递过来的sessionId是0，
    if (sessionId == 0) {
        //服务端创建一个sessionId，此时会提交一个OpCode.createSession的Request进行处理，此时我们先分析第二种
        long id = createSession(cnxn, passwd, sessionTimeout);
    } else {
    //验证当前的sessionId是否是合法id，方法的实现为空
        validateSession(cnxn, sessionId);
       //关闭旧的sessionId
        if (serverCnxnFactory != null) {
            serverCnxnFactory.closeSession(sessionId, ServerCnxn.DisconnectReason.CLIENT_RECONNECT);
        }
        if (secureServerCnxnFactory != null) {
            secureServerCnxnFactory.closeSession(sessionId, ServerCnxn.DisconnectReason.CLIENT_RECONNECT);
        }
        //设置sessionId，此时也会往ServerCnxnFactory的sessionMap集合中添加当前的session和cnxn
        cnxn.setSessionId(sessionId);
        //重置sessionId
        reopenSession(cnxn, sessionId, passwd, sessionTimeout);
        ServerMetrics.getMetrics().CONNECTION_REVALIDATE_COUNT.add(1);
    }
}
```

简单看看reopenSession方法：

```java
public void reopenSession(ServerCnxn cnxn, long sessionId, byte[] passwd, int sessionTimeout) throws IOException {
   //会根据传递过来的秘密和sessionId检查是否合法
    if (checkPasswd(sessionId, passwd)) {
        revalidateSession(cnxn, sessionId, sessionTimeout);
    } else {
   //如果秘密不对，结束session初始化过程，然后返回
        finishSessionInit(cnxn, false);
    }
}
```

秘密验证通过后，重新验证session：

```java
protected void revalidateSession(ServerCnxn cnxn, long sessionId, int sessionTimeout) throws IOException {
       //保存session
    boolean rc = sessionTracker.touchSession(sessionId, sessionTimeout);
    //结束session验证，并响应客户端
    finishSessionInit(cnxn, rc);
}
```

touchSession方法：

```java
public synchronized boolean touchSession(long sessionId, int timeout) {
    SessionImpl s = sessionsById.get(sessionId);
    if (s == null) {
        logTraceTouchInvalidSession(sessionId, timeout);
        return false;
    }
    if (s.isClosing()) {
        logTraceTouchClosingSession(sessionId, timeout);
        return false;
    }
   //更新当前的session过期队列（sessionExpiryQueue）
    updateSessionExpiry(s, timeout);
    return true;
}
```

接下来我们看看服务端创建session的过程createSession(cnxn, passwd, sessionTimeout)：

```java
long createSession(ServerCnxn cnxn, byte[] passwd, int timeout) {
    if (passwd == null) {
        passwd = new byte[0];
    }
    //此时调用sessionTracker来创建一个sessionId
    long sessionId = sessionTracker.createSession(timeout);
    Random r = new Random(sessionId ^ superSecret);
    r.nextBytes(passwd);
    ByteBuffer to = ByteBuffer.allocate(4);
    to.putInt(timeout);
    cnxn.setSessionId(sessionId);
    Request si = new Request(cnxn, sessionId, 0, OpCode.createSession, to, null);
    //提交当前的session创建请求，最后在处理的时候也是调用finishSessionInit(cnxn, rc);方法
    submitRequest(si);
    return sessionId;
}
```

所以我们需要查看sessionTracker.createSession(timeout)创建过程，sessionTracker是SessionTrackerImpl的实例，在服务启动的时候就已经创建。

createSession：

```java
public long createSession(int sessionTimeout) {
    //nextSessionId是一个原子类AtomicLong，其初始值不是从0开始
    long sessionId = nextSessionId.getAndIncrement();
    trackSession(sessionId, sessionTimeout);
    return sessionId;
}
```

如下方法是设置AtomicLong的起始值，也就是会根据传递过来的id做初始值

```java
public static long initializeNextSessionId(long id) {
    long nextSid;
    nextSid = (Time.currentElapsedTime() << 24) >>> 8;
    nextSid = nextSid | (id << 56);
    if (nextSid == EphemeralType.CONTAINER_EPHEMERAL_OWNER) {
        ++nextSid;   
    }
    return nextSid;
}
```

得到sessionId之后调用trackSession方法：

```java
public synchronized boolean trackSession(long id, int sessionTimeout) {
    boolean added = false;
    //创建对象session对象
    SessionImpl session = sessionsById.get(id);
    if (session == null) {
        session = new SessionImpl(id, sessionTimeout);
    }
    SessionImpl existedSession = sessionsById.putIfAbsent(id, session);
   //也是更新当前session过期队列
    updateSessionExpiry(session, sessionTimeout);
    return added;
}
```

SessionTrackerImpl中维护着sessionExpiryQueue队列，他是ExpiryQueue的实例，此时SessionTrackerImpl中的run方法会去消费这个队列中的值。

```java
public void run() {
    try {
        while (running) {
        //获取一个阻塞时间
            long waitTime = sessionExpiryQueue.getWaitTime();
            if (waitTime > 0) {
                Thread.sleep(waitTime);
                continue;
            }
          //消费队列中的值，这里是取出已经到了过期时间的session值，然后设置状态为过期，并提交过期请求
            for (SessionImpl s : sessionExpiryQueue.poll()) {
                ServerMetrics.getMetrics().STALE_SESSIONS_EXPIRED.add(1);
                setSessionClosing(s.sessionId);
                expirer.expire(s);
            }
        }
    } catch (InterruptedException e) {
        handleException(this.getName(), e);
    }
}
```

以上简单分析了session的创建，session的过期管理，当我们在执行具体指令操作的时候，还会进行session检测，如果当前session已经过期，或者不存在就会抛出异常。

既然session有过期时间，那么在我们执行任何指令操作的时候就需要更新session的过期时间，所以继续跟踪代码可以发现在ZooKeeperServer的submitRequestNow方法中有这么个调用touch(si.cnxn)：

```java
void touch(ServerCnxn cnxn) throws MissingSessionException {
    if (cnxn == null) {
        return;
    }
    long id = cnxn.getSessionId();
    int to = cnxn.getSessionTimeout();
    if (!sessionTracker.touchSession(id, to)) {
        throw new MissingSessionException("No session with sessionid 0x"
                                          + Long.toHexString(id)
                                          + " exists, probably expired and removed");
    }
}
```

此时会调用sessionTracker中的touchSession方法：

```java
public synchronized boolean touchSession(long sessionId, int timeout) {
    SessionImpl s = sessionsById.get(sessionId);
    if (s == null) {
        logTraceTouchInvalidSession(sessionId, timeout);
        return false;
    }
    if (s.isClosing()) {
        logTraceTouchClosingSession(sessionId, timeout);
        return false;
    }
  //更新session过期时间
    updateSessionExpiry(s, timeout);
    return true;
}
```

在touchSession方法中就会更新当前session的过期时间，所以只要客户端和服务端在session过期时间内一直存在交互，这个会话就会一直维持，有时候为了保持当前的会话，还会进行心跳检测，根据固定的时间频率，客户端向服务端发送心跳检测包，服务端响应当前请求，依次来维持当前会话。

以上，有任何不对的地方，请留言指正，敬请谅解。
