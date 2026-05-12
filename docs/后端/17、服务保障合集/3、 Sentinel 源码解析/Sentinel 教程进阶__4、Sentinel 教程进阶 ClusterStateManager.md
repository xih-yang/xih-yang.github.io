# 4、Sentinel 教程进阶 ClusterStateManager
- 来源：https://ddkk.com/zhuanlan/guarantee/sentinelym/24.html
- 分类：服务保障
- 分组：Sentinel 教程进阶
当我们设置token-server或token-client时，sentinel-dashboard第一步就会调用api: /setClusterMode

```java
public static void applyState(Integer state) {
    stateProperty.updateValue(state);
}
```

从上图我们看出，收到请求后的主要逻辑在ClusterStateManager.applyState(mode)中，因此我们要了解ClusterStateManager。

## ClusterStateManager

该类主要负责管理集群的状态，我们看一下它的属性

```java
private static volatile SentinelProperty<Integer> stateProperty = new DynamicSentinelProperty();
private static final PropertyListener<Integer> PROPERTY_LISTENER = new ClusterStateManager.ClusterStatePropertyListener();
```

- stateProperty：类型为DynamicSentinelProperty
- PROPERTY_LISTENER：类型为ClusterStatePropertyListener

ClusterStateManager中的静态方法会将PROPERTY_LISTENER注册到stateProperty中

```java
static {
    InitExecutor.doInit();
    stateProperty.addListener(PROPERTY_LISTENER);
}
```

**ClusterStatePropertyListener**

## PropertyListener的实现类

```java
private static class ClusterStatePropertyListener implements PropertyListener<Integer> {
    private ClusterStatePropertyListener() {
    }
    public synchronized void configLoad(Integer value) {
        ClusterStateManager.applyStateInternal(value);
    }
    public synchronized void configUpdate(Integer value) {
        ClusterStateManager.applyStateInternal(value);
    }
}
```

当触发configLoad或configUpdate方法后都会执行ClusterStateManager.applyStateInternal(value);

## applyStateInternal的逻辑：

- state=0：启动集群client，setToClient()
- state=1：启动集群server，setToServer()
- state=-1：停止集群client和集群server，setStop()

```java
private static boolean applyStateInternal(Integer state) {
    if (state != null && state >= -1) {
        if (state == mode) {
            return true;
        } else {
            try {
                switch(state) {
                case -1:
                    setStop();
                    return true;
                case 0:
                    return setToClient();
                case 1:
                    return setToServer();
                default:
                    RecordLog.warn("[ClusterStateManager] Ignoring unknown cluster state: " + state, new Object[0]);
                    return false;
                }
            } catch (Throwable var2) {
                RecordLog.warn("[ClusterStateManager] Fatal error when applying state: " + state, var2);
                return false;
            }
        }
    } else {
        return false;
    }
}
```
