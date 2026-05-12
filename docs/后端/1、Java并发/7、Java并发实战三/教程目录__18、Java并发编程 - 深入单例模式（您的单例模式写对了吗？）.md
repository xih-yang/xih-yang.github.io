# 18、Java并发编程 - 深入单例模式（您的单例模式写对了吗？）
- 来源：https://ddkk.com/zhuanlan/java/concurrency/7/18.html
- 分类：Java并发
- 分组：教程目录
## 18、深入单例模式

单例模式编码模型：

1、构造器私有：这是单例模式的思想；

```java
// 单例模式核心思想，构造器私有！
 private Hungry(){
//这里可以编写相关逻辑
 }
```

2、编写静态获取对象方法，至于方法中的实例怎么创建，有各种方法。

```java
public static Hungry getInstance(){
     return ......;
 }
```

### 18.1. 饿汉式

饿汉式:类一加载，就创建对象

缺陷：

1、如果此类中还有其他占用内存的对象存在，一单此类加载，就会占用大量的内存

2、高并发下不安全。

```java
package com.coding.single;
public class Hungry {
    private byte[] data1 = new  byte[10240];
    private byte[] data2 = new  byte[10240];
    private byte[] data3 = new  byte[10240];
    private byte[] data4 = new  byte[10240];
      private final static Hungry HUNGRY = new Hungry();
    // 单例模式核心思想，构造器私有！
    private Hungry(){
    }
    public static Hungry getInstance(){
        return HUNGRY;
    }
}
```

### 18.2. 懒汉式 DCL ：Double Check Lock双重检测锁

#### 18.2.1. 懒汉式DCL + volatile形成的三级检测锁**

双重检测：if(lazyman == null)

锁：对类加锁,synchronized (Lazyman.class)

缺陷：可能存在指令重排，导致高并发下不安全。

创建对象时，cpu运行情况：

1. 分配对象的内存空间
2. 执行构造方法初始化对象
3. 设置实例对象指向刚分配的内存的地址， instance = 0xfffff;

线程A执行顺序可能是： 1 3 2

线程B： lazyMan = null ；

解决方案，对实例添加volatile，禁止指令重排

破坏单例方案：反射

所以，懒汉式DCL 也是不安全的

```java
package com.interview.concurrent.single;
import java.lang.reflect.Constructor;
/**
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @description 描述:懒汉式DCL:Double Check Lock双重检测锁
 * 双重检测：if(lazyman == null)
 * 锁：对类加锁,synchronized (Lazyman.class)
 * 缺陷：可能存在指令重排
 * 创建对象时，cpu运行情况：
 *     1. 分配对象的内存空间
 *     2. 执行构造方法初始化对象
 *     3. 设置实例对象指向刚分配的内存的地址， instance = 0xfffff;
 *        线程A执行顺序可能是：  1    3    2
 *        线程B：  lazyMan = null ；
 * 解决方案，对实例添加volatile，禁止指令重排
 * 破坏单例方案：反射
 * 所以，懒汉式DCL + volatile形成的三级检测锁 也是不安全的
 * @date 2023/2/25 0:02
 */
public class Lazyman {
    private static volatile Lazyman lazyman;
    private Lazyman(){
        System.out.println(Thread.currentThread().getName() + ":create Lazyman");
    }
    public static Lazyman getInstance(){
        if(lazyman == null){
            synchronized (Lazyman.class){
                if(lazyman == null){
                    lazyman = new Lazyman();
                }
            }
        }
        return lazyman;
    }
    public static void main(String[] args)throws Exception {
        //1、多线程测试
        //mutilThreadTest();
        //2、使用反射破坏单例
        reflectBreakSingle();
    }
    /**
     *  @description:懒汉式DCL + volatile形成的三级检测锁 ,在多线程下相对是安全的。
     *  @author DDKK.COM 弟弟快看，程序员编程资料站
     *  @date 2023/2/25 0:37
     */
    private static void mutilThreadTest() throws NoSuchMethodException{
        for (int i = 0; i < 10000; i++) {
            new Thread(() ->{
                Lazyman.getInstance();
            }).start();
        }
    }
    /**
     *  @description:使用反射破坏单例
     *  @author DDKK.COM 弟弟快看，程序员编程资料站
     *  @date 2023/2/25 0:41
     */
    private static void reflectBreakSingle() throws Exception{
        //使用反射破坏
        Constructor<Lazyman> declaredConstructor = Lazyman.class.getDeclaredConstructor(null);
        declaredConstructor.setAccessible(true);//无视构造器的private关键字
        Lazyman lazyman1 = declaredConstructor.newInstance();
        Lazyman lazyman2 = declaredConstructor.newInstance();
        System.out.println(lazyman1);
        System.out.println(lazyman2);
    }
}
```

使用反射破坏单例，运行效果如下：

#### 18.2.2. 使用标志位 + 三级检测锁（懒汉式DCL + volatile）

使用标志位，加强懒汉式DCL + volatile形成的三级检测锁的安全性

- 使用标志位，对构造方法进行检测
- 破坏单例方案：反射
- 所以，标志位 + 三级检测锁（懒汉式DCL + volatile）也是不安全的

```java
package com.interview.concurrent.single;
import java.lang.reflect.Constructor;
import java.lang.reflect.Field;
/**
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @description 描述:使用标志位，加强懒汉式DCL + volatile形成的三级检测锁的安全性
 * 使用标志位，对构造方法进行检测
 * 破坏单例方案：反射
 * 所以，标志位 + 三级检测锁（懒汉式DCL + volatile）也是不安全的
 * @date 2023/2/25 0:02
 */
public class LazymanFlag {
    private static volatile LazymanFlag lazyman;
    private static boolean flag = false;
    private LazymanFlag(){
        synchronized (LazymanFlag.class){
            if(flag == false){
                flag = true;
            }else{
                System.out.println(Thread.currentThread().getName() + ":不要试图用反射机制破坏单例模式");
            }
        }
    }
    public static LazymanFlag getInstance(){
        if(lazyman == null){
            synchronized (LazymanFlag.class){
                if(lazyman == null){
                    lazyman = new LazymanFlag();
                }
            }
        }
        return lazyman;
    }
    public static void main(String[] args)throws Exception {
        //1、多线程测试
        //mutilThreadTest();
        //2、使用反射破坏单例
        reflectBreakSingle();
    }
    /**
     *  @description:标志位 + 三级检测锁（懒汉式DCL + volatile） ,在多线程下相对是安全的
     *  @author DDKK.COM 弟弟快看，程序员编程资料站
     *  @date 2023/2/25 0:37
     */
    private static void mutilThreadTest() throws NoSuchMethodException{
        for (int i = 0; i < 10000; i++) {
            new Thread(() ->{
                LazymanFlag.getInstance();
            }).start();
        }
    }
    /**
     *  @description:使用反射破坏单例
     *  @author DDKK.COM 弟弟快看，程序员编程资料站
     *  @date 2023/2/25 0:41
     */
    private static void reflectBreakSingle() throws Exception{
        //使用反射破坏
        Constructor<LazymanFlag> declaredConstructor = LazymanFlag.class.getDeclaredConstructor(null);
        declaredConstructor.setAccessible(true);//无视构造器的private关键字
        //只要你的代码被别人看到，别人就能拿到属性
        Field flag = LazymanFlag.class.getDeclaredField("flag");
        flag.setAccessible(true);//无视这个属性
        LazymanFlag lazyman1 = declaredConstructor.newInstance();
        //创建了一个对象后，将此对象的flag属性设置为false，又可以继续创建新的对象。
        flag.set(lazyman1,false);
        LazymanFlag lazyman2 = declaredConstructor.newInstance();
        System.out.println(lazyman1);
        System.out.println(lazyman2);
    }
}
```

反射方法运行效果如下：

### 18.3. 静态内部类

```java
package com.interview.concurrent.single;
import java.lang.reflect.Constructor;
/**
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @description 描述:静态内部类实现单例模式
 * 缺陷：反射也能破坏，也是不安全的
 * @date 2023/2/25 0:20
 */
public class StaticInnerClass {
    private static StaticInnerClass instance;
    private StaticInnerClass(){
        System.out.println(Thread.currentThread().getName() + ":create StaticInnerClass");
    }
    public static StaticInnerClass getInstance(){
        return InnerClass.INNERCLASS;
    }
    private static class InnerClass{
        private final static StaticInnerClass INNERCLASS = new StaticInnerClass();
    }
    public static void main(String[] args) throws Exception{
       // mutilThreadTest();
        reflectBreakSingle();
    }
    /**
     *  @description:静态内部类 ,在多线程下相对是安全的
     *  @author DDKK.COM 弟弟快看，程序员编程资料站
     *  @date 2023/2/25 0:37
     */
    private static void mutilThreadTest() throws NoSuchMethodException{
        for (int i = 0; i < 10000; i++) {
            new Thread(() ->{
                StaticInnerClass.getInstance();
            }).start();
        }
    }
    /**
     *  @description:使用反射破坏单例
     *  @author DDKK.COM 弟弟快看，程序员编程资料站
     *  @date 2023/2/25 0:41
     */
    private static void reflectBreakSingle() throws Exception{
        //使用反射破坏
        Constructor<StaticInnerClass> declaredConstructor = StaticInnerClass.class.getDeclaredConstructor(null);
        declaredConstructor.setAccessible(true);//无视构造器的private关键字
        StaticInnerClass instance1 = declaredConstructor.newInstance();
        StaticInnerClass instance2 = declaredConstructor.newInstance();
        System.out.println(instance1);
        System.out.println(instance2);
    }
}
```

反射方法运行效果如下：

### 18.4. 枚举 （最安全的）

枚举类实现单例编码模型：

1、定义枚举类对象INSTANCE(不一定是INSTANCE，但是为了书写规范，建议写成INSTANCE。)

2、定义私有的被实例化对象

3、定义枚举构造器，在里面创建要被实例化的类

4、编写公共静态获取方法，返回被实例化的类对象

示例：

**1、** 创建一个要被实例化的类；

```java
class ResourceClass {
    int i = 0;
    public ResourceClass() {
        System.out.println("ResourceClass被初始化 " + ++i + " 次");
    }
}
```

**2、** 创建枚举类，用来实例化ResourceClass；

```java
/**
 *  @description:枚举类实现单例编码模型：
 *  1、定义枚举类对象INSTANCE(不一定是INSTANCE，但是为了书写规范，建议写成INSTANCE。)
 *  2、定义私有的被实例化对象；
 *  3、定义枚举构造器，在里面创建要被实例化的类
 *  4、编写公共静态获取方法，返回被实例化的类对象。
 *  @author DDKK.COM 弟弟快看，程序员编程资料站
 *  @date 2023/2/25 12:37
 */
public enum EnumSingle {
    //1、定义枚举类对象INSTANCE
    INSTANCE;
    //2、定义私有的被实例化对象
    private ResourceClass instance;
    //3、定义枚举构造器，在里面创建要被实例化的类
    EnumSingle() {
        this.instance = new ResourceClass();
        System.out.println("枚举类构造函数");
    }
    //4、编写公共静态获取方法，返回被实例化的类对象。
    public ResourceClass getInstance() {
        return this.instance;
    }
}
```

**3、** 编写测试类；

```java
class ResourceClassEnumTest {
    public static void main(String[] args) throws Exception {
        //mutilThreadTest();
        reflectBreakSingle();
    }
     /**
     *  @description:多线程测试
     *  @author DDKK.COM 弟弟快看，程序员编程资料站
     *  @date 2023/2/25 13:43
     */
    private static void mutilThreadTest() throws NoSuchMethodException{
        for (int i = 0; i < 100; i++) {
            new Thread(() ->{
                ResourceClass instance1 = EnumSingle.INSTANCE.getInstance();
            }).start();
        }
    }
    /**
     *  @description:使用反射试图破坏单例
     *  @author DDKK.COM 弟弟快看，程序员编程资料站
     *  @date 2023/2/25 0:41
     */
    private static void reflectBreakSingle() throws Exception{
        ResourceClass instance1 = EnumSingle.INSTANCE.getInstance();
        Constructor<EnumSingle> declaredConstructor = EnumSingle.class.getDeclaredConstructor();
        declaredConstructor.setAccessible(true);
        // 期望的异常 throw new IllegalArgumentException("Cannot reflectively create enum objects");
        // Exception in thread "main" java.lang.IllegalArgumentException: Cannot reflectively create enum objects
        // java.lang.NoSuchMethodException: com.coding.single.EnumSingle.<init>()
        ResourceClass instance2 = declaredConstructor.newInstance().getInstance();
        ResourceClass instance3 = declaredConstructor.newInstance().getInstance();
        System.out.println(instance1);
        System.out.println(instance2);
        System.out.println(instance3);
    }
}
```

多线程下运行正常

反射破坏单例运行情况：

试图使用反射破坏单例，报错

```java
java.lang.IllegalArgumentException: Cannot reflectively create enum objects
```

查看Constructor源码

发现如果类是枚举类，将报异常

```java
IllegalArgumentException("Cannot reflectively create enum objects");
```

与我们运行得到的异常不一样

**(1)javap反编译class文件**

将我们的枚举类使用javap反编译，查看字节码

```java
javap -p ***.class
```

**（2）jad 反编译工具**

```java
Jad -s .java -8 EnumSingle.class
```

找到万恶之源，经过jad反编译出来的java文件，有两个参数的构造器，没有无参数构造器，如下：

```java
// Decompiled by Jad v1.5.8g. Copyright 2001 Pavel Kouznetsov.
// Jad home page: http://www.kpdus.com/jad.html
// Decompiler options: packimports(3) ansi 
// Source File Name:   EnumSingle.java
package com.interview.concurrent.single;
import java.io.PrintStream;
// Referenced classes of package com.interview.concurrent.single:
//            ResourceClass
public final class EnumSingle extends Enum
{
    public static EnumSingle[] values()
    {
        return (EnumSingle[])$VALUES.clone();
    }
    public static EnumSingle valueOf(String name)
    {
        return (EnumSingle)Enum.valueOf(com/interview/concurrent/single/EnumSingle, name);
    }
    private EnumSingle(String s, int i)
    {
        super(s, i);
        instance = new ResourceClass();
        System.out.println("枚举类构造函数");
    }
    public ResourceClass getInstance()
    {
        return instance;
    }
    public static final EnumSingle INSTANCE;
    private ResourceClass instance;
    private static final EnumSingle $VALUES[];
    static 
    {
        INSTANCE = new EnumSingle("INSTANCE", 0);
        $VALUES = (new EnumSingle[] {
            INSTANCE
        });
    }
}
```

我们将我们的反射破坏单例方法进行修改，使用有参方法获取反射构造器，如下：

```java
Constructor<EnumSingle> declaredConstructor = EnumSingle.class.getDeclaredConstructor(String.class,int.class);
```

完整代码如下：

```java
package com.interview.concurrent.single;
import java.lang.reflect.Constructor;
/**
 *  @description:枚举类实现单例编码模型：
 *  1、定义枚举类对象INSTANCE(不一定是INSTANCE，但是为了书写规范，建议写成INSTANCE。)
 *  2、定义私有的被实例化对象；
 *  3、定义枚举构造器，在里面创建要被实例化的类
 *  4、编写公共静态获取方法，返回被实例化的类对象。
 *  @author DDKK.COM 弟弟快看，程序员编程资料站
 *  @date 2023/2/25 12:37
 */
public enum EnumSingle {
    //1、定义枚举类对象INSTANCE
    INSTANCE;
    //2、定义私有的被实例化对象
    private ResourceClass instance;
    //3、定义枚举构造器，在里面创建要被实例化的类
    EnumSingle() {
        this.instance = new ResourceClass();
        System.out.println("枚举类构造函数");
    }
    //4、编写公共静态获取方法，返回被实例化的类对象。
    public ResourceClass getInstance() {
        return this.instance;
    }
}
class ResourceClass {
    int i = 0;
    public ResourceClass() {
        System.out.println("ResourceClass被初始化 " + ++i + " 次");
    }
}
class ResourceClassEnumTest {
    public static void main(String[] args) throws Exception {
        //mutilThreadTest();
        reflectBreakSingle();
    }
    /**
     *  @description:多线程测试
     *  @author DDKK.COM 弟弟快看，程序员编程资料站
     *  @date 2023/2/25 13:43
     */
    private static void mutilThreadTest() throws NoSuchMethodException{
        for (int i = 0; i < 100; i++) {
            new Thread(() ->{
                ResourceClass instance1 = EnumSingle.INSTANCE.getInstance();
            }).start();
        }
    }
    /**
     *  @description:使用反射试图破坏单例
     *  @author DDKK.COM 弟弟快看，程序员编程资料站
     *  @date 2023/2/25 0:41
     */
    private static void reflectBreakSingle() throws Exception{
        ResourceClass instance1 = EnumSingle.INSTANCE.getInstance();
        //无参构造方法
        //Constructor<EnumSingle> declaredConstructor = EnumSingle.class.getDeclaredConstructor(null);
        //有参构造方法
        Constructor<EnumSingle> declaredConstructor = EnumSingle.class.getDeclaredConstructor(String.class,int.class);
        declaredConstructor.setAccessible(true);
        // 期望的异常 throw new IllegalArgumentException("Cannot reflectively create enum objects");
        // Exception in thread "main" java.lang.IllegalArgumentException: Cannot reflectively create enum objects
        // java.lang.NoSuchMethodException: com.coding.single.EnumSingle.<init>()
        ResourceClass instance2 = declaredConstructor.newInstance().getInstance();
        ResourceClass instance3 = declaredConstructor.newInstance().getInstance();
        System.out.println(instance1);
        System.out.println(instance2);
        System.out.println(instance3);
    }
}
```

测试，运行效果如下：

**注：枚举没有无参构造，只有有参构造。**
