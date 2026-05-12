# 08、SpringCloud Alibaba - OpenFeign中动态代理和方法句柄的结合使用
- 来源：https://ddkk.com/zhuanlan/j2ee/springcloudalibaba/3/8.html
- 分类：J2EE框架
- 分组：Spring Cloud Alibaba 教程
## 前言

在学习OpenFeign的过程中，发现了一个好玩的地方，就是动态代理和方法句柄的结合使用，分别用来处理接口远程方法调用和本地接口默认方法调用。本篇文章对此做一些测试。

## 一、接口定义

**1、** 实际接口；

定义了两个方法，work( )方法需要被代理处理实际的业务，eat( )方法是默认方法，不需要被代理。

```java
public interface People {
    String work();
    default String eat() {
        return "吃饭";
    }
}
```

**2、** 目标接口；

定义了一个类型方法，和一个具体的业务方法

```java
public interface Target<T> {
    Class<T> type();
    String concreteWork();
}
```

**3、** 目标实现类；

```java
public class ConcreteTarget<T> implements Target<T>{
    private final Class<T> type;
    public ConcreteTarget(Class<T> type) {
        this.type = type;
    }
    @Override
    public Class type() {
        return type;
    }
    @Override
    public String concreteWork() {
        System.out.println("程序员写代码...");
        return "编程";
    }
}
```

## 二、创建代理

1、定义两个全局变量

```java
	//代理对象
    public static People proxy;
	//方法句柄
    public static MethodHandle handle;
```

2、InvocationHandler

```java
public class CustomInvocationHandler implements InvocationHandler {
    //目标对象
    private Object target;
    public CustomInvocationHandler(Object target) {
        this.target = target;
    }
    @Override
    public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
        String methodName = method.getName();
        Object invoke = null;
        //在真实的对象执行之前增强方法
        System.out.println(methodName + ": before invoke。。。");
        if (methodName.equals("work")) {
        	//这里访问实际的业务逻辑，在feign中是访问远程服务端接口
            Method concreteWork = target.getClass().getMethod("concreteWork", null);
            invoke = concreteWork.invoke(target, args);
        } else {
            invoke = "进入了代理方法";
        }
        //在真实的对象执行之后增强方法
        System.out.println(methodName + ": after invoke。。。");
        return methodName + ": " + invoke;
    }
}
```

3、创建代理：

```java
 private static void createProxy() {
        //真实对象
        Target target = new ConcreteTarget(People.class);
        //代理对象调用真实对象的方法
        InvocationHandler handler = new InvocationHandlerTest(target);
        /**
         * 创建代理对象
         * 第一个参数：handler.getClass().getClassLoader()，使用handler对象的classloader对象来加载代理对象
         * 第二个参数： new Class<?>[] {target.type()}，代理接口
         * 第三个参数：handler，将代理对象关联到InvocationHandler对象上
         */
        proxy = (People) Proxy.newProxyInstance(handler.getClass().getClassLoader(), new Class<?>[]{
     target.type()}, handler);
    }
```

## 三、创建方法句柄

对eat( )方法创建方法句柄

```java
 private static void createMethodHandle() {
        String methodName = "eat";
        try {
            Method defaultMethod = People.class.getMethod(methodName, null);
            Class<?> declaringClass = defaultMethod.getDeclaringClass();
            Field field = MethodHandles.Lookup.class.getDeclaredField("IMPL_LOOKUP");
            field.setAccessible(true);
            MethodHandles.Lookup lookup = (MethodHandles.Lookup) field.get(null);
            MethodHandle unboundHandle = lookup.unreflectSpecial(defaultMethod, declaringClass);
            //绑定代理对象
            handle = unboundHandle.bindTo(proxy);
        } catch (Exception ex) {
            throw new IllegalStateException(ex);
        }
    }
```

## 四、测试

**1、** 调用代理对象的work()方法；

```java
String result = proxy.work();
System.out.println(result);
```

结果：

```java
work: before invoke。。。
程序员写代码...
work: after invoke。。。
work: 编程
```

可以看出，调用 work( ) 方法进入了代理invoke( )方法。

**2、** 调用代理对象的eat()方法；

```java
String result = proxy.eat();
System.out.println(result);
```

结果：

```java
eat: before invoke。。。
eat: after invoke。。。
eat: 进入了代理方法
```

可以看出，调用 eat( ) 方法同样进入了代理invoke( )方法。

**3、** 调用方法句柄；

```java
Object result = handle.invokeWithArguments();
System.out.println(result);
```

结果：

```java
吃饭
```

可以看出，通过方法句柄方式调用，这样就能动态的访问到接口的默认方法，而不会进入到代理的invoke( )方法。
