# 07、Spring Boot 3.x 特性-事件与监听
- 来源：https://ddkk.com/zhuanlan/j2ee/springboot/9/7.html
- 分类：Spring Boot 3.x 实战
- 分组：教程目录
### 1.Spring事件与监听

`ApplicationContext`中的事件处理是通过`ApplicationEvent`类和`ApplicationListener`接口提供的。

如果实现`ApplicationListener`接口的`bean`加载到上下文中。每次`ApplicationEvent`事件被发布到`ApplicationContext`,该`bean`会接受到通知。实际上这是标准的`Observer`设计模式。

下表描述了`Spring`提供的标准事件:

ContextRefreshedEvent
当ApplicationContext被初始化或刷新时发布(例如，通过使用ConfigurableApplicationContext接口上的refresh()方法)。在这里，“初始化”意味着加载了所有bean，检测并激活了后处理器bean，预实例化了单例，ApplicationContext对象已准备好使用。只要上下文没有关闭，就可以多次触发刷新，前提是所选的ApplicationContext实际上支持这样的“热”刷新。例如，XmlWebApplicationContext支持热刷新，但是GenericApplicationContext不支持

ContextStartedEvent
通过使用ConfigurableApplicationContext接口上的start()方法，在ApplicationContext启动时发布。在这里，“started”意味着所有生命周期bean都接收一个显式的开始信号。通常，此信号用于在显式停止后重新启动bean，但也可用于启动未配置为自动启动的组件(例如，在初始化时尚未启动的组件)。

ContextStoppedEvent
通过使用ConfigurableApplicationContext接口上的stop()方法，在ApplicationContext停止时发布。在这里，“stopped”意味着所有生命周期bean都接收到一个显式的停止信号。已停止的上下文可以通过start()调用重新启动。

ContextRefreshedEvent
在ApplicationContext被关闭时发布，关闭的方法是使用ConfigurableApplicationContext接口上的close()方法或通过JVM关闭钩子。在这里，“close”意味着所有的单例bean都将被销毁。一旦上下文被关闭，它将到达生命周期的尽头，并且不能被刷新或重新启动。

RequestHandledEvent
一个特定的web事件，告诉所有bean一个HTTP请求已经得到服务。此事件在请求完成后发布。这个事件只适用于使用Spring的DispatcherServlet的web应用程序。

ServletRequestHandledEvent
RequestHandledEvent子类,添加了特定的Servlet上下文信息

### 2.Spring Boot 事件与监听

除了Spring框架事件， `SpringApplication`还会发送一些额外的应用事件。

当应用程序运行时,事件按照如下顺序发送:

**1、**`ApplicationStartingEvent`:在应用运行开始发送,但是在所有处理之前除了监听器的注册和初始化；

**2、**`ApplicationEnvironmentPreparedEvent`:在`context`被创建之前,当`Environment`被`context`使用的时候触发执行；

**3、**`ApplicationContextInitializedEvent`:当`ApplicationContext`已经准备好,并且`ApplicationContextInitializers`已经被调用，但是任何bean还没定义加载；

**4、**`ApplicationPreparedEvent`:在启动刷新之前,但是在bean定义加载之后；

**5、**`ApplicationStartedEvent`:在刷新上下文之后，但在调用任何应用程序和命令行运行程序之前；

**6、**`AvailabilityChangeEvent`:在应用`LivenessState.CORRECT`之后发送,表示应用是活动状态；

**7、**`ApplicationReadyEvent`:在调用了任意应用程序和命令行运行程序之后；

**8、**`AvailabilityChangeEvent`:在应用`ReadinessState.ACCEPTING_TRAFFIC`之后发送,表示应用是准备好为请求提供服务；

**9、**`ApplicationFailedEvent`:应用启动时出现异常；

上面的列表只包括绑定到`SpringApplication`的`SpringApplicationEvents`。除此之外，以下事件也会在`ApplicationPreparedEvent`之后和`ApplicationStartedEvent`之前发布:

**1、** 一个`WebServerInitializedEvent`在`WebServer`准备好之后被发送`ServletWebServerInitializedEvent`和`ReactiveWebServerInitializedEvent`分别是`servlet`和`webflux`变量；

**2、** 当`ApplicationContext`刷新时，`ContextRefreshedEvent`被发送；

默认情况下，事件侦听器在同一线程中执行时，不应运行可能冗长的任务。如有需要可以使用`ApplicationRunner` 或者 `CommandLineRunner`

有些事件实际上是在`ApplicationContext`创建之前被触发的，所以不能将这些事件的侦听器注册为`@Bean`。

可以用`SpringApplication.addListeners(…)`方法或`SpringApplicationBuilder.listeners(…)`方法注册它们。 如果您希望自动注册这些侦听器，而不管应用程序是以何种方式创建的，那么您可以添加一个`META-INF/spring.factories`文件到你的项目，并通过使用`org.springframework.context.ApplicationListener`键引用你的`listener(s)`，如下所示:

```java
org.springframework.context.ApplicationListener=com.example.project.MyListener
```

### 3.自已定义事件与监听

#### 1.自定义事件(继承ApplicationEvent)

```java
public class BlockedListEvent extends ApplicationEvent {
    private final String address;
    private final String content;
    public BlockedListEvent(Object source, String address, String content) {
        super(source);
        this.address = address;
        this.content = content;
    }
    public String getAddress() {
        return address;
    }
    public String getContent() {
        return content;
    }
}
```

#### 2.发布事件

要发布一个自定义的`ApplicationEvent`，在`ApplicationEventPublisher`上调用`publishEvent()`方法。通常这是通过创建一个实现`ApplicationEventPublisherAware`的类并将其注册为Spring bean来完成的。

```java
@Service
public class EmailService implements ApplicationEventPublisherAware {
    private List<String> blockedList;
    private ApplicationEventPublisher publisher;
    public void setBlockedList(List<String> blockedList) {
        this.blockedList = blockedList;
    }
    public void setApplicationEventPublisher(ApplicationEventPublisher publisher) {
        this.publisher = publisher;
    }
    public void sendEmail(String address, String content) {
        if (blockedList.contains(address)) {
            System.out.println("EmailService发送邮件...");
            publisher.publishEvent(new BlockedListEvent(this, address, content));
            return;
        }
    }
}
```

在配置时，Spring容器检测到`EmailService`实现了`ApplicationEventPublisherAware`并自动调用`setApplicationEventPublisher()`。实际上传入的参数是Spring容器本身。你正在通过它的`ApplicationEventPublisher`接口与应用程序上下文交互。

#### 3.事件监听

要接收自定义的`ApplicationEvent`，你可以创建一个实现`ApplicationListener`的类，并将其注册为Spring bean。

```java
public class BlockedListNotifier implements ApplicationListener<BlockedListEvent> {
    private String notificationAddress;
    public void setNotificationAddress(String notificationAddress) {
        this.notificationAddress = notificationAddress;
    }
    @Override
    public void onApplicationEvent(BlockedListEvent event) {
        System.out.println("我是BlockedListNotifier准备向外发布消息了....");
    }
}
```

`ApplicationListener`通常是用自定义事件的类型参数化的(在前面的示例中是`BlockedListEvent`)。

这意味着`onApplicationEvent()`方法可以保持类型安全，避免任何向下类型转换。你可以注册任意数量的事件监听器，但请注意在默认情况下，事件监听器是同步接收事件的。这意味着`publishEvent()`方法会一直阻塞，直到所有侦听器都完成了对事件的处理。这种同步和单线程方法的一个优点是，当侦听器接收到一个事件时，如果事务上下文可用，它将在发布者的事务上下文内操作。 如果需要另一种事件发布策略，请参阅`ApplicationEventMulticaster`接口和`SimpleApplicationEventMulticaster`实现的配置选项。

#### 4.注册监听器

**1、** 代码方式注册:；

```java
@SpringBootApplication
public class SpringEventListenerApplication {
    public static void main(String[] args) {
        SpringApplication application = new SpringApplication(SpringEventListenerApplication.class);
        application.addListeners(new BlockedListNotifier());
        application.run(args);
    }
}
```

**2、** 配置文件注册`resources/META-INF/spring.factories`；

```java
org.springframework.context.ApplicationListener=com.example.springeventlistener.listener.BlockedListNotifier
```

#### 5.测试

```java
@SpringBootTest
class SpringEventListenerApplicationTests {
    @Autowired
    private EmailService emailService;
    @Test
    void contextLoads() {
        emailService.setBlockedList(Arrays.asList("known.spammer@example.org", "known.hacker@example.org", "john.doe@example.org"));
        emailService.sendEmail("known.spammer@example.org", "我是known.spammer要发邮件了");
    }
}
```

```java
EmailService发送邮件...
我是BlockedListNotifier准备向外发布消息了....
```

### 4.基于注解的事件监听器

可以使用`@EventListener`注解在托管bean的任何方法上注册事件侦听器,`BlockedListNotifier`重写如下:

```java
public class BlockedListNotifierAnnotation {
    private String notificationAddress;
    public void setNotificationAddress(String notificationAddress) {
        this.notificationAddress = notificationAddress;
    }
    @EventListener
    public void processBlockedListEvent(BlockedListEvent event) {
        System.out.println("我是基于 @EventListener注解的监听！！！");
    }
}
```

```java
 @Bean
    public BlockedListNotifierAnnotation blockedListNotifierAnnotation() {
        return new BlockedListNotifierAnnotation();
    }
```

方法签名声明它监听的事件类型，但是这次使用了一个灵活的名称，并且没有实现特定的监听接口。

如果你的方法应该监听几个事件，或者你想要定义一个完全不带参数的方法，那么事件类型也可以在注解本身上指定。下面的例子展示了如何做到这一点:

```java
@EventListener({
     ContextStartedEvent.class, ContextRefreshedEvent.class})
public void handleContextStart() {
    // ...
}
```

还可以通过使用定义`SpEL`表达式的注解的`condition`属性来添加额外的运行时过滤，该注解应该与针对特定事件实际调用方法相匹配。

下面的例子展示了如何重写监听器，使其仅在事件的`content`属性等于`my-event`时才被调用:

```java
@EventListener(condition = "#blEvent.content == 'my-event'")
public void processBlockedListEvent(BlockedListEvent blEvent) {
    // notify appropriate parties via notificationAddress...
}
```

如果你需要发布一个事件作为处理另一个事件的结果，你可以改变方法签名来返回应该发布的事件，如下所示:

```java
@EventListener
public ListUpdateEvent handleBlockedListEvent(BlockedListEvent event) {
    // notify appropriate parties via notificationAddress and
    // then publish a ListUpdateEvent...
}
```

监听处理完`BlockedListEvent`事件后,再发布一个`ListUpdateEvent`事件。如果要发布多个时间可以返回`Collection`或事件数组。**但是这个特性不支持异步监听**，接下来详细了解异步监听。

### 5.异步监听

如果你希望特定的监听器异步处理事件，可以使用常规的`@Async`。下面的例子展示了如何做到这一点:

```java
@EventListener
@Async
public void processBlockedListEvent(BlockedListEvent event) {
    // BlockedListEvent 执行在单独的线程
}
```

使用异步事件时的以下限制:

**1、** :如果异步事件监听器抛出异常，则不会将其传播到调用方(详细信息参考`AsyncUncaughtExceptionHandler`)；

**2、** 异步事件监听器方法不能通过返回值来发布后续事件；

**3、** 如果需要发布另一个事件作为处理的结果，请注入`ApplicationEventPublisher`来手动发布事件；

### 6.监听器顺序

如果你需要在另一个侦听器之前调用一个侦听器，你可以在方法声明中添加`@Order`注释，如下面的示例所示:

```java
@EventListener
@Order(42)
public void processBlockedListEvent(BlockedListEvent event) {
    // notify appropriate parties via notificationAddress...
}
```

### 7.通用的事件

你还可以使用泛型来进一步定义事件的结构。考虑使用`EntityCreatedEvent`，其中T是被创建的实际实体的类型。例如，你可以创建以下监听器定义来仅接收`Person`的`EntityCreatedEvent`:

```java
@EventListener
public void onPersonCreated(EntityCreatedEvent<Person> event) {
    // ...
}
```

由于类型擦除,不是所有的事件类型都是相同的结构,为了保证事件监听能获取正确的实体类型，可以按照如下方式:

```java
public class EntityCreatedEvent<T> extends ApplicationEvent implements ResolvableTypeProvider {
    public EntityCreatedEvent(T entity) {
        super(entity);
    }
    @Override
    public ResolvableType getResolvableType() {
        return ResolvableType.forClassWithGenerics(getClass(), ResolvableType.forInstance(getSource()));
    }
}
```
