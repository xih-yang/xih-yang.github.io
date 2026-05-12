# 06、Tomcat8 源码解析 - 生命周期
- 来源：https://ddkk.com/zhuanlan/server/tomcat/1/6.html
- 分类：服务器框架
- 分组：教程目录
Tomcat源码版本：apache-tomcat-8.5.54-src

JDK源码版本：jdk1.8.0_171

**1、** Lifecycle接口；

Lifecycle接口统一管理Tomcat生命周期。

1、接口定义

```java
public interface Lifecycle {
    // 13个状态常量值
    public static final String BEFORE_INIT_EVENT = "before_init";
    public static final String AFTER_INIT_EVENT = "after_init";
    public static final String START_EVENT = "start";
    public static final String BEFORE_START_EVENT = "before_start";
    public static final String AFTER_START_EVENT = "after_start";
    public static final String STOP_EVENT = "stop";
    public static final String BEFORE_STOP_EVENT = "before_stop";
    public static final String AFTER_STOP_EVENT = "after_stop";
    public static final String AFTER_DESTROY_EVENT = "after_destroy";
    public static final String BEFORE_DESTROY_EVENT = "before_destroy";
    public static final String PERIODIC_EVENT = "periodic";
    public static final String CONFIGURE_START_EVENT = "configure_start";
    public static final String CONFIGURE_STOP_EVENT = "configure_stop";
    // 3个监听器方法
    public void addLifecycleListener(LifecycleListener listener);
    public LifecycleListener[] findLifecycleListeners();
    public void removeLifecycleListener(LifecycleListener listener);
    // 4个生命周期方法
    public void init() throws LifecycleException;
    public void start() throws LifecycleException;
    public void stop() throws LifecycleException;
    public void destroy() throws LifecycleException;
    // 2个当前状态方法
    public LifecycleState getState();
    public String getStateName();
}
```

2、生命周期的状态转化

```java
 *            start()
 *  -----------------------------
 *  |                           |
 *  | init()                    |
 * NEW -»-- INITIALIZING        |
 * | |           |              |     ------------------«-----------------------
 * | |           |auto          |     |                                        |
 * | |          \|/    start() \|/   \|/     auto          auto         stop() |
 * | |      INITIALIZED --»-- STARTING_PREP --»- STARTING --»- STARTED --»---  |
 * | |         |                                                            |  |
 * | |destroy()|                                                            |  |
 * | --»-----«--    ------------------------«--------------------------------  ^
 * |     |          |                                                          |
 * |     |         \|/          auto                 auto              start() |
 * |     |     STOPPING_PREP ----»---- STOPPING ------»----- STOPPED -----»-----
 * |    \|/                               ^                     |  ^
 * |     |               stop()           |                     |  |
 * |     |       --------------------------                     |  |
 * |     |       |                                              |  |
 * |     |       |    destroy()                       destroy() |  |
 * |     |    FAILED ----»------ DESTROYING ---«-----------------  |
 * |     |                        ^     |                          |
 * |     |     destroy()          |     |auto                      |
 * |     --------»-----------------    \|/                         |
 * |                                 DESTROYED                     |
 * |                                                               |
 * |                            stop()                             |
 * ----»-----------------------------»------------------------------
 *
```

**2、** LifecycleBase类；

LifecycleBase 类是Lifecycle 接口的默认实现，所有实现了生命周期的组件都直接或者间接的继承自LifecycleBase。

```java
//由 standardContext#startInternal来注入监听器 
private final List<LifecycleListener> lifecycleListeners = new CopyOnWriteArrayList<>();
/**
* 添加监听器
*/
@Override
public void addLifecycleListener(LifecycleListener listener) {
    lifecycleListeners.add(listener);
}
/**
 * 返回监听器列表
 */
@Override
public LifecycleListener[] findLifecycleListeners() {
    return lifecycleListeners.toArray(new LifecycleListener[0]);
}
/**
 * 移除监听器
 */
@Override
public void removeLifecycleListener(LifecycleListener listener) {
    lifecycleListeners.remove(listener);
}
/**
 * 触发监听器
 */
protected void fireLifecycleEvent(String type, Object data) {
    //组装事件对象
    LifecycleEvent event = new LifecycleEvent(this, type, data);
    for (LifecycleListener listener : lifecycleListeners) {
        listener.lifecycleEvent(event);
    }
}
```

**3、** 生命周期事件监听机制；

事件监听器需要三个参与者：

1、事件对象：用于封装事件的信息:表示一个生命周期事件。

```java
public final class LifecycleEvent extends EventObject{}
```

2、事件监听器：负责监听事件源发出的事件,表示生命周期的监听器.

```java
public interface LifecycleListener {
    public void lifecycleEvent(LifecycleEvent event);
}
```

举例：

```java
public class VersionLoggerListener implements LifecycleListener {
    .....
    @Override
    public void lifecycleEvent(LifecycleEvent event) {
        if (Lifecycle.BEFORE_INIT_EVENT.equals(event.getType())) {
            ......
        }
    }
    ...
}
```

3、事件源：触发事件的源头，不同事件源触发不同事件类型。

举例：

```java
StandardServer.java::init
-->LifecycleBase::init
---->setStateInternal
------>fireLifecycleEvent
```

另外：start|stop|detroy是类似的.
