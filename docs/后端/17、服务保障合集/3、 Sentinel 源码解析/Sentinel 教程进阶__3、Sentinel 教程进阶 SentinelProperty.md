# 3、Sentinel 教程进阶 SentinelProperty
- 来源：https://ddkk.com/zhuanlan/guarantee/sentinelym/23.html
- 分类：服务保障
- 分组：Sentinel 教程进阶
## SentinelProperty

sentinelProperty在sentinel中非常常用，如果要阅读代码，sentinelProperty必须先理解，我们先看看它是什么？

既然叫SentinelProperty，那么它的主要角色肯定就是一个property，主要方法是updateValue

同时它还提供了两个方法addListener和removeListener, 添加监听器（PropertyListener）和删除监听器，监听什么呢？监听updateValue，当updateValue触发时，触发对应的listener。

## DynamicSentinelProperty

它是SentinelProperty的一个实现类

```java
public class DynamicSentinelProperty<T> implements SentinelProperty<T> {
    //listener集合，是一个hashset
    protected Set<PropertyListener<T>> listeners = Collections.synchronizedSet(new HashSet());
    //property的值
    private T value = null;
    public DynamicSentinelProperty() {
    }
    public DynamicSentinelProperty(T value) {
        this.value = value;
    }
    public void addListener(PropertyListener<T> listener) {
        //添加一个listener，并触发lister的configLoad方法
        this.listeners.add(listener);
        listener.configLoad(this.value);
    }
    public void removeListener(PropertyListener<T> listener) {
        //删掉listener
        this.listeners.remove(listener);
    }
    public boolean updateValue(T newValue) {
        if (this.isEqual(this.value, newValue)) {
            return false;
        } else {
            RecordLog.info("[DynamicSentinelProperty] Config will be updated to: {}", new Object[]{newValue});
            this.value = newValue;
            Iterator var2 = this.listeners.iterator();
			//当value更新时，触发所有listener的configUpdate
            while(var2.hasNext()) {
                PropertyListener<T> listener = (PropertyListener)var2.next();
                listener.configUpdate(newValue);
            }
            return true;
        }
    }
    ...
}
```

## PropertyListener

```java
public interface PropertyListener<T> {
    //监听property的改变
    void configUpdate(T var1);
	//addListener时触发
    void configLoad(T var1);
}
```
