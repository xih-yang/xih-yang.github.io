# 04、JVM 实战 - GC-对象的生命周期、对象访问、回收方法区
- 来源：https://ddkk.com/zhuanlan/java/jvm/2/4.html
- 分类：JVM 实战
- 分组：教程目录
## 一、对象访问

对象访问会涉及到Java栈、Java堆、方法区这三个内存区域。

如下面这句代码：

```java
Object objectRef = new Object(); 
```

假设这句代码出现在方法体中，"Object objectRef” 这部分将会反映到Java栈的本地变量中，作为一个reference类型数据出现。而“new Object()”这部分将会反映到Java堆中，形成一块存储Object类型所有实例数据值的结构化内存，根据具体类型以及虚拟机实现的对象内存布局的不同，这块内存的长度是不固定。另外，在java堆中还必须包括能查找到此对象类型数据（如对象类型、父类、实现的接口、方法等）的地址信息，这些数据类型存储在方法区中。

reference类型在java虚拟机规范里面只规定了一个指向对象的引用地址，并没有定义这个引用应该通过那种方式去定位，访问到java堆中的对象位置，因此不同的虚拟机实现的访问方式可能不同,主流的方式有两种：使用句柄和直接指针。

## 1.1、句柄访问方式

java堆中将划分出一块内存来作为句柄池，reference中存储的就是对象的句柄地址，而句柄中包含了对象实例数据和类型数据各自的具体地址信息。

## 1.2、指针访问方式

reference变量中直接存储的就是对象的地址，而java堆对象一部分存储了对象实例数据，另外一部分存储了对象类型数据。

这两种访问对象的方式各有优势，使用句柄访问方式最大好处就是reference中存储的是稳定的句柄地址，在对象移动时只需要改变句柄中的实例数据指针，而reference不需要改变。使用指针访问方式最大好处就是速度快，它节省了一次指针定位的时间开销，就虚拟机而言，它使用的是第二种方式(直接指针访问)。

## 二、对象的生命周期

确定哪些对象还存活，哪些已经死去。

## 2.1、判断对象是否存活

这里有比较多的算法，后续会介绍，

**2.1.1、引用计数算法**

采用的是分散式管理方式，给对象添加一个引用计数器，每当有一个地方引用它时计数器就+1，当引用失效时计数器就-1,。只要计数器等于0的对象就是不可能再被使用的。 实现简单、判断效率高。

很多使用场景，但是JVM没有使用，主要是很难解决对象之间循环引用的问题

主要缺点：循环引用的场景下无法实现回收，例如下面的图中，ObjectC和ObjectB相互引用，那么ObjectA即便释放了对ObjectC、ObjectB的引用，也无法回收。sunJDK在实现GC时未采用这种方式。

### 2.1.2、可达性分析算法

通过一系列的称为“GC Roots”的对象作为起始点，从这些节点开始向下搜索，搜索所走过的路径称为引用链，当一个对象到GC Roots没有使用任何引用链时，则说明该对象是不可用的。

主流的商用程序语言（Java、C#等）在主流的实现中，都是通过可达性分析来判定对象是否存活的。

通过下图来清晰的感受gc root与对象展示的联系。所示灰色区域对象是存活的，Object5/6/7均是可回收的对象

**在Java语言中，可作为GC Roots 的对象包括下面几种**

虚拟机栈（栈帧中的本地变量表）中引用的对象

方法区中静态变量引用的对象

方法区中常量引用的对象

本地方法栈（即一般说的 Native 方法）中JNI引用的对象

**优点**：更加精确和严谨，可以分析出循环数据结构相互引用的情况；

**缺点**：实现比较复杂、需要分析大量数据，消耗大量时间、分析过程需要GC停顿（引用关系不能发生变化），即停顿所有Java执行线程（称为"Stop The World"，是垃圾回收重点关注的问题）。

## 2.2、引用

无论哪种算法，判断对象是否存活都与“引用”有关。在jdk1.2之后，Java对引用的概念进行了扩充，总体分为4类：强引用、软引用、弱引用、虚引用，这4中引用强度依次逐渐减弱。

**强引用**：指在代码中普遍存在的，类似 Object obj = new Object(); 这类的引用，只有强引用还存在，GC就永远不会收集被引用的对象。

**软引用**：指一些还有用但并非必须的对象。直到内存空间不够时（抛出OutOfMemoryError之前），才会被垃圾回收。采用SoftReference类来实现软引用

**弱引用**：用来描述非必须对象。当垃圾收集器工作时就会回收掉此类对象。采用WeakReference类来实现弱引用。

**虚引用**：一个对象是否有虚引用的存在，完全不会对其生存时间构成影响， 唯一目的就是能在这个对象被回收时收到一个系统通知， 采用PhantomRenference类实现

### 2.2.1、判断一个对象生存还是死亡

宣告一个对象死亡，至少要经历两次标记。

#### 1、第一次标记

如果对象进行可达性分析算法之后没发现与GC Roots相连的引用链，那它将会第一次标记并且进行一次筛选。

**筛选条件**：判断此对象是否有必要执行finalize()方法。

**筛选结果**：当对象没有覆盖finalize()方法、或者finalize()方法已经被JVM执行过，则判定为可回收对象。如果对象有必要执行finalize()方法，则被放入F-Queue队列中。稍后在JVM自动建立、低优先级的Finalizer线程（可能多个线程）中触发这个方法；

#### 2、第二次标记

GC对F-Queue队列中的对象进行二次标记。

如果对象在finalize()方法中重新与引用链上的任何一个对象建立了关联，那么二次标记时则会将它移出“即将回收”集合。如果此时对象还没成功逃脱，那么只能被回收了。

#### 3、finalize() 方法

finalize()是Object类的一个方法、一个对象的finalize()方法只会被系统自动调用一次，经过finalize()方法逃脱死亡的对象，第二次不会再调用；

特别说明：并不提倡在程序中调用finalize()来进行自救。建议忘掉Java程序中该方法的存在。因为它执行的时间不确定，甚至是否被执行也不确定（Java程序的不正常退出），而且运行代价高昂，无法保证各个对象的调用顺序（甚至有不同线程中调用）。

代码说明

```java
public class FinalizeEscapeGC {
    public static FinalizeEscapeGC SAVE_HOOK = null;
    public void isAlive(){
        System.out.println("yes , I am still alive:)");
    }
    @Override
    protected void finalize() throws Throwable {
        super.finalize();
        System.out.println("finalize method execued!");
        FinalizeEscapeGC.SAVE_HOOK=this;
    }
    public static void main(String[] args) throws Throwable {
        SAVE_HOOK=new FinalizeEscapeGC();
        //对象第一次成功拯救自己
        SAVE_HOOK=null;
        System.gc();
        //因为finalize 方法优先级底，暂停0.5s等待他
        Thread.sleep(500);
        if(SAVE_HOOK!=null){
            SAVE_HOOK.isAlive();
        }else{
            System.out.println("no, I am dead1:(");
        }
        //合上面代码一样，自救失败
        SAVE_HOOK=null;
        System.gc();
        Thread.sleep(500);
        if(SAVE_HOOK!=null){
            SAVE_HOOK.isAlive();
        }else{
            System.out.println("no, I am dead2:(");
        }
    }
}
```

输出

```java
finalize method execued!
yes , I am still alive:)
no, I am dead2:( 
```

finalize只会被系统自动调用执行一次。

## 三、回收方法区

永久代的垃圾收集主要分为两部分内容：废弃常量和无用的类。

### 3.1 回收废弃常量

回收废弃常量与Java堆的回收类似。

假如一个字符串“abc” 已经进入常量池中，但当前系统没有一个string对象是叫做abc的，也就是说，没有任何string对象的引用指向常量池中的abc常量，也没用其他地方引用这个字面量。如果这是发生内存回收，那么这个常量abc将会被清理出常量池。常量池中的其他类（接口）、方法、字段的符号引用也与此类似。

### 3.2 回收无用的类

需要同时满足下面3个条件的才能算是无用的类。

**1、** 该类所有的实例都已经被回收，也就是Java堆中无任何改类的实例；

**2、** 加载该类的ClassLoader已经被回收；

**3、** 该类对应的java.lang.Class对象没有在任何地方被引用，无法在任何地方通过反射访问该类的方法；

虚拟机可以对同时满足这三个条件的类进行回收，但不是必须进行回收的。是否对类进行回收，HotSpot虚拟机提供了-Xnoclassgc参数进行控制。

在大量使用反射、动态代理、CGLib等ByteCode框架、动态生成jsp以及OSGi这个频繁自定义ClassLoader的场景都需要虚拟机具备类卸载的功能，以保证永久代不会溢出。
