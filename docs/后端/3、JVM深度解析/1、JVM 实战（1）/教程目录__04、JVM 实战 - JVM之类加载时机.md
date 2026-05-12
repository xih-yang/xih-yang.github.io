# 04、JVM 实战 - JVM之类加载时机
- 来源：https://ddkk.com/zhuanlan/java/jvm/1/4.html
- 分类：JVM 实战
- 分组：教程目录
Java程序对类的使用分为主动引用和被动引用，主动引用时，会触发类的初始化（在JVM虚拟机规范中，对于类在什么时候加载并没有做限定，但是对类的初始化时机有规定），而被动引用则不会。

### 主动引用

主动引用有八种情况：

- 1、创建类的实例。
- 2、访问某个类或者接口的静态变量，或者对该静态变量进行赋值（被final修饰的静态变量、已在编译期间进入常量池的静态字段除外）。
- 3、调用类的静态方法。
- 4、使用java.lang.reflect包下的方法对类进行反射调用的时候，如果类没有初始化，则触发初始化。
- 5、初始化子类时，如果父类没有初始化，则触发初始化。
- 6、JVM虚拟机启动被标明为启动类的类(包含main()方法的类)。
- 7、当使用JDK7新加入的动态语言支持时，如果一个java.langinvoke.MethodHandle实例最后的解析结果为REF_getStatic、REF_putStatic、REF_invokeStatic、REF_newInvokeSpecial四 种类型的方法句柄，并且这个方法句柄对应的类没有进行过初始化，则需要先触发其初始化。
- 8、当一个接口中定义了JDK8新加入的默认方法(被default关键字修饰的接口方法)时，如果有这个接口的实现类发生了初始化，那该接口要在其之前被初始化。

```java
public class ClassInitTest {
    static {
        System.out.println("启动类初始化...");
    }
    public static void main(String[] args) throws ClassNotFoundException {
        // 1. 创建实例
//        InitTest1 it1 = new InitTest1();
        // 2. 访问静态属性
//        System.out.println(InitTest1.n);
        // 3. 调用静态方法
//        InitTest1.method();
        // 4. 反射
//        Class cls = Class.forName("classloder.initialization.InitTest1");
        // 5. 初始化子类
//        InitTest2 it2 = new InitTest2();
        // 6. 启动类触发初始化,执行main()触发
        // 7. 跳过
        // 8. 当一个接口中的默认方法(被default关键字修饰的接口方法)初始化时,IfTestImpl初始化时会触发InitTest1 it1 = new InitTest1(),证明IfTest接口初始化
//        IfTest ifTest = new IfTestImpl();
    }
}
// 类初始化会执行初始化类静态属性
class InitTest1 {
    static {
        System.out.println("InitTest1初始化...");
    }
    public static int n = 10; // 静态变量
    public static void method() { // 静态方法
        n = 30;
    }
}
class InitTest2 extends InitTest1 {
    static {
        System.out.println("InitTest2初始化...");
    }
}
// 接口，验证第8条
interface IfTest {
    InitTest1 it1 = new InitTest1();
    default void method() {
    }
}
class IfTestImpl implements IfTest {
    static {
        System.out.println("IfTestImpl初始化...");
    }
}
```

### 被动引用

除了上述主动引用的八种情况会触发类的初始化，其他的引用都不会触发初始化，被称为被动引用，以下是被动引用的其中几种情况举例：

1、通过子类的引用父类的静态属性，不会导致子类初始化。

2、通过定义数组引用类，不会导致该类初始化。

3、访问类中final修饰的静态变量（常量在编译期间会存入常量池，本质上并没有直接引用到定义该常量的类，所以不会触发该类的初始化）。

```java
public class ClassInitTest2 {
    public static void main(String[] args) {
        // 1. 通过子类的引用父类的静态属性，不会导致子类初始化
//        System.out.println(Child.n);
        // 2. 通过定义数组引用类，不会导致该类初始化。
//        Parent[] array = new Parent[10];
        // 3. 访问类中final修饰的静态变量
//        System.out.println(Parent.m);
    }
}
class Parent {
    static {
        System.out.println("Parent 初始化...");
    }
    public final static int m = 20;
    public static int n = 10;
}
class Child extends Parent {
    static {
        System.out.println("Child 初始化...");
    }
}
```
