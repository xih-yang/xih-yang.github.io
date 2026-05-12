# 4.2 Interceptor
- 来源：https://ddkk.com/zhuanlan/orm/jfinal/34.html
- 分类：ORM框架
- 分组：4 AOP
## 1、基本用法

Interceptor 可以对方法进行拦截，并提供机会在方法的前后添加切面代码，实现 AOP 的核心目标。Interceptor 接口仅仅定义了一个方法 public void intercept(Invocation inv)。以下是简单示例：

```java
public class DemoInterceptor implements Interceptor {
    public void intercept(Invocation inv) {
       System.out.println("Before method invoking");
       inv.invoke();
       System.out.println("After method invoking");
    }
}
```

以上代码中的 DemoInterceptor 将拦截目标方法，并且在目标方法调用前后向控制台输出文本。inv.invoke() 这一行代码是对目标方法的调用，在这一行代码的前后插入切面代码可以很方便地实现AOP。

**注意：****必须调用 inv.invoke() 方法**，才能将当前调用传递到后续的 Interceptor 与 Action。

**常见错误**：目前为止仍有很多同学忘了调用 inv.invoke() 方法，造成 controller 中的 action 不会被执行。在此再次强调一次，一定要调用一次 inv.invoke()，除非是刻意不去调用剩下的拦截器与 action，这种情况仍然需要使用 inv.getController().render()/renderJson() 调用一下相关的 render() 方法为客户端响应数据。

Invocation 作为 Interceptor 接口 intercept 方法中的唯一参数，提供了很多便利的方法在拦截器中使用。以下为 Invocation 中的方法：

更正一下上面截图中倒数第三行的一处手误：setArg(int) 应该改为 setArg(int, Object)

**注意**：jfinal 4.9.03 版本将 getControllerKey() 更名为了 **getControllerPath()**，原方法被保留仍然可用。更名为 getControllerPath() 是为了让多个 Controller 可以共享同一个 controllerPath 值。

## 2､ 全局共享，注意线程安全问题

Interceptor 是全局共享的，所以如果要在其中使用属性需要保证其属性是线程安全的，如下代码将是**错误**的：

```java
public class MyInterceptor implements Interceptor {
   private int value = 123;
   public void intercept(Invocation inv) {
       // 多线程将会并发访问 value 值，造成错乱
       value++;
       inv.invoke();
   }
}
```

如上代码所示，其中的 value 属性将会被多线程访问到，从而引发线程安全问题。

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有

> JFinal 官方 | https://jfinal.com
