# 07、Resilience4j 源码解析 CircuitBreakerEvents
- 来源：https://ddkk.com/zhuanlan/guarantee/resilience4j/7.html
- 分类：服务保障
- 分组：Resilience4j 源码解析（A）
## CircuitBreakerEvent

> 熔断事件，有以下几种场景

```java
enum Type {
    /** 请求失败，且不是可被忽略异常，失败次数+1时发布 */
    ERROR(false),
    /**  请求失败，但是是可被忽略异常，失败次数+1时发布 */
    IGNORED_ERROR(false),
    /**  请求成功时发布 */
    SUCCESS(false),
    /** 熔断打开，请求不允许被调用时发布*/
    NOT_PERMITTED(false),
    /** 熔断状态发生变化时发布 */
    STATE_TRANSITION(true),
    /**  熔断被重置时发布 */
    RESET(true),
    /**  熔断被强制开启时发布 */
    FORCED_OPEN(false),
    /** 熔断被强制停止工作时发布 */
    DISABLED(false);
    public final boolean forcePublish;//表示是否强制发布事件
}
```

CircuitBreaker向订阅的任何订阅者/消费者发布CircuitBreakerEvents流。

**消费或订阅方式**

注册EventConsumer

```java
circuitBreaker.getEventPublisher()
    .onSuccess(event -> logger.info(...))
    .onError(event -> logger.info(...))
    .onIgnoredError(event -> logger.info(...))
    .onReset(event -> logger.info(...))
    .onStateTransition(event -> logger.info(...));
// Or if you want to register a consumer listening to all events, you can do:
circuitBreaker.getEventPublisher()
    .onEvent(event -> logger.info(...));
```

CircularEventConsumer

```java
CircularEventConsumer<CircuitBreakerEvent> ringBuffer = new CircularEventConsumer<>(10);
circuitBreaker.getEventPublisher().onEvent(ringBuffer);
List<CircuitBreakerEvent> bufferedEvents = ringBuffer.getBufferedEvents()
```

RxJava2

```java
RxJava2Adapter.toFlowable(circuitBreaker.getEventPublisher())
    .filter(event -> event.getEventType() == Type.ERROR)
    .cast(CircuitBreakerOnErrorEvent.class)
    .subscribe(event -> logger.info(...))
```

**发布事件源码**

从源码看出是否发布熔断事件，有两重判断：

shouldPublishEvents是根据EventType或CircuitBreaker.State枚举中的配置进行判断

```java
boolean shouldPublishEvents(CircuitBreakerEvent event){
    return event.getEventType().forcePublish || getState().allowPublish;
}
```

eventProcessor.hasConsumers是根据有没有注册消费者或者订阅者进行判断

```java
public boolean hasConsumers(){
        return consumerRegistered;
    }
```

**事件消费**

> CircuitBreakerEventProcessor::consumeEvent > EventProcessor::processEvent

```java
public <E extends T> boolean processEvent(E event) {
    boolean consumed = false;
    EventConsumer<T> onEventConsumer = this.onEventConsumer;
    if(onEventConsumer != null){
        //该段主要是注册了事件消费者处理逻辑，
        //比如circuitBreaker.getEventPublisher() .onSuccess(event -> logger.info(...))
        onEventConsumer.consumeEvent(event);
        consumed = true;
    }
    if(!eventConsumers.isEmpty()){
        EventConsumer<T> eventConsumer = (EventConsumer<T>) eventConsumers.get(event.getClass());
        if(eventConsumer != null){
            //该段主要是CircularEventConsumer使用场景
            //如CircularEventConsumer<CircuitBreakerEvent> ringBuffer = new CircularEventConsumer<>(10);
            //circuitBreaker.getEventPublisher().onEvent(ringBuffer);
            eventConsumer.consumeEvent(event);
            consumed = true;
        }
    }
    return consumed;
}
```
