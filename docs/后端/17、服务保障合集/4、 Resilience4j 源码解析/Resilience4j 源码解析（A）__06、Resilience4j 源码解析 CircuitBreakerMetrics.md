# 06、Resilience4j 源码解析 CircuitBreakerMetrics
- 来源：https://ddkk.com/zhuanlan/guarantee/resilience4j/6.html
- 分类：服务保障
- 分组：Resilience4j 源码解析（A）
## CircuitBreakerMetrics

> 熔断器度量指标，熔断器在工作中，熔断相关实际数据，均存储在此。

类图关系如下：

## 成员变量

```java
private final int ringBufferSize;//熔断在CLOSED，HALF_OPEN状态下的环形区缓冲大小
```

```java
private final RingBitSet ringBitSet;//存储请求通过或被熔断次数
```

```java
private final LongAdder numberOfNotPermittedCalls;//请求被熔断的次数
```

### RingBitSet

CircuitBreaker在CLOSED 或 HALF_OPEN状态时，成功调用会在bit位存0，失败的调用会存储1。Ring Bit Buffer具有（可配置的）固定大小。Ring Bit Buffer 原理类似于[java.util.BitSet](https://docs.oracle.com/javase/8/docs/api/java/util/BitSet.html)。BitSet使用long []数组来存储这些位，意味着BitSet只需要一个16个长（64位）的long型数组就可存储1024个请求的调用状态。

在计算失败率之前，环位缓冲器必须已满。

例如，如果环形缓冲区的大小为10，则必须至少有10次请求，然后才能计算失败率。如果只请求了9次，哪怕9次都失败，CircuitBreaker也不会切换至OPEN状态。

在等待一段时间后，CircuitBreaker状态从OPEN → HALF_OPEN，并允许请求调用以观察后续请求是否仍然不可用或已再次可用。CircuitBreaker使用另一个（可配置的）环位缓冲区来评估HALF_OPEN状态中的失败率。如果失败率高于配置的阈值，则状态将更改回OPEN。如果失败率低于或等于阈值，则状态变回CLOSED。

CircuitBreaker::onError检查是否应将异常记录为失败或应忽略。可以配置自定义Predicate，以确定是否应将异常记录为失败。默认将所有异常记录为失败。

CircuitBreaker支持重置为原始状态（circuitBreaker::reset），丢失所有指标并重置其Ring Bit Buffer。

从截图中可以看出，请求成功时，setNextBit返回值不变，请求失败时，setNextBit返回值+1，从而可以得出setNextBit返回的是失败次数的结论，且该方法thread-safe。

```java
public synchronized int setNextBit(boolean value) {
    //调用次数+1
    increaseLength();
    index = (index + 1) % size;
    //更新位值
    int previous = bitSet.set(index, value);
    int current = value ? 1 : 0;
    cardinality = cardinality - previous + current;
    //失败请求对应的number
    return cardinality;
}
//通俗的可以理解成比如设置环形缓冲区长度为10，则前9次，单纯调用次数length + 1，第10次，length为0，后续不再增加调用次数
private void increaseLength() {
    if (notFull) {
        //计算至本次总调用次数
        int nextLength = length + 1;
        if (nextLength < size) {
            //容量没满，总调用次数+1
            length = nextLength;
        } else {
            length = size;
            notFull = false;
        }
    }
}
```

总结：

- RingBitSet::length 表示总请求次数
- RingBitSet::setNextBit:（更新RingBitSet::cardinality）表示失败次数
- 请求成功次数 = RingBitSet::length - RingBitSet::cardinality

检查阀值

```java
private float getFailureRate(int numberOfFailedCalls) {
    //当总调用次数未达到环形缓冲区size时，暂不进行熔断检查
    if (getNumberOfBufferedCalls() < ringBufferSize) {
        return -1.0f;
    }
    //失败率 = 失败次数/环形缓冲区size * 100%
    return numberOfFailedCalls * 100.0f / ringBufferSize;
}
```
