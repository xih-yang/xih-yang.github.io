# 10、Java JUC 源码分析 - JAVA伪共享
- 来源：https://ddkk.com/zhuanlan/java/concurrency/9/10.html
- 分类：Java并发
- 分组：教程目录
## 1.1什么是伪共享

为了解决计算机系统主内存与CPU之间运行速度差的问题，我们会在CPU和主内存之间加一级或者多级高速缓冲存储器（Cache）。这个Cache一般是被集成到我们的CPU内部的，所以也叫CPU Cache。下面有一幅图，可以帮助你理解哦。

在Cache内部是按行存储的，其中每一行被称为一个Cache行。Cache行是Cache与主内存进行数据交换的单位，Cache行的大小一般为2的幂次数字节

当CPU访问某个变量的时候，首先他会去Cache1内看一下是否有该变量，如果有直接获得，没有就去Cache2里面查看，如果还没有，就去主内存获取该变量，然后把该变量所在的内存区域的一个Cache行大小的内存复制到我们的Cache1中，由于存放到Cache行的是内存块而不是单个变量，所以可能会把多个变量存放到Cache行中。当多个线程同时修改一个缓存行里面的多个变量时，由于同时只能有一个线程操作缓存行，所以相比每个变量放到一个缓存行，性能会有所下降，这就是伪共享。

## 1.2为什么会出现伪共享

通过刚才的说明，我们可以很容易知道。伪共享产生的原因是因为多个变量放入到了一个缓存行中，并且多个线程同时去写入该缓存行中的不同变量。那么大家思考一下，为什么我们一个缓存行里面放入多个变量呢？其实是因为缓存与内存之间交换的数据单位为缓存行，当CPU访问的变量没有在缓存里面找到的时候，根据程序运行的局部性原理，会把该变量所在的内存中大小为缓存行的内存放入缓存中。

假如我声明了四个Long类型变量a,b,c,d,假设缓存行的大小为32字节，那么当CPU访问变量a的时候，发现该变量没有在缓存中，就会去主内存把变量a以及内存地址附近的b、c、d放入缓存行。也就是地址连续的多个变量才有可能会被放到一个缓存行中。当创建数组时，数组里面的元素就会被放到一个缓存行中。那么单线程下多个变量被放入同一个缓存对性能有影响吗？其实正常情况下单线程访问时将数组元素放入一个或多个缓存行，对代码执行是有利的。但是在多线程中就不一定了。我们来比较一下下面两段代码：

```java
public class FalseShareDemo1 {
    static final int LINE_NUM = 1024;
    static final int COLUM_NUM = 1024;
    public static void main(String[] args) {
        long[] [] array = new long[LINE_NUM][COLUM_NUM];
        long startTime = System.currentTimeMillis();
        for(int i = 0 ; i < LINE_NUM ; ++i){
            for(int j = 0 ; j < COLUM_NUM ; ++j){
                array[i][j]=i*2+j;
            }
        }
        long endTime = System.currentTimeMillis();
        long cacheTime = endTime - startTime;
        System.out.println("cache Time:"+cacheTime);
    }
}
```

```java
public class FalseShareDemo2 {
    static final int LINE_NUM = 1024;
    static final int COLUM_NUM = 1024;
    public static void main(String[] args) {
        long[] [] array = new long[LINE_NUM][COLUM_NUM];
        long startTime = System.currentTimeMillis();
        for(int i = 0 ; i < COLUM_NUM ; ++i){
            for(int j = 0 ; j < LINE_NUM ; ++j){
                array[j][i]=i*2+j;
            }
        }
        long endTime = System.currentTimeMillis();
        System.out.println(" no cache Time:"+(endTime-startTime));
    }
}
```

第一段代码执行的时间为3，第二段代码执行的时间是6。这是为什么呢？因为数组内元素存储的地址是连续的，当访问数组第一个元素的时候，会把数组后的若干个元素也一起放入到缓存行，这样顺序访问元素的话，第二次访问会在缓存里直接命中，因而不必要再去内存里面取数据了。也就是说，当顺序访问的时候数组里面的元素的时候，一次访问可以方便后续的若干次访问。而我们的代码（2）是跳跃式的访问数据的，不是顺序的，者破坏了程序访问的局部性原则，并且缓存是有容量控制的，当缓存满了的时候会根据一定的淘汰算法替换缓存行，这会导致内存置换过来的缓存行的元素还没等到被读取就被替换掉了。

所以单个线程下顺序修改一个缓存行中的多个变量，会充分利用程序运行的局部性原则，从而加速了程序的运行。而在多线程下并发修改一个缓存行中的多个变量就会竞争缓存行，从而降低程序运行的性能。

## 1.3伪共享如何避免

在JDK8之前一般都是通过字节填充的方式来避免该问题，也就是创建一个变量时使用填充字段填充该变量所在的缓存行，这样就避免了将多个变量存放在同一个缓存行中，例如如下代码：

```java
public class FalseShareDemo3 {
    public volatile long value = 0L;
    public long p1,p2,p3,p4,p5,p6;
}
```

假如缓存行的大小为64字节，那么我们现在在FalseShareDemo3类里面填充了6个long类型的变量，每个long占8个字节，加上value，总共56字节。另外这里FalseShareDemo3是一个类对象，类对象的字节码对象头占用8字节，所以这样一个FalseShareDemo3对象实际会占64字节，正好可以放入一个缓存行。这样我们经过精心计算，完成了字节填充。那么有没有简单一点的方法呢？

答案是肯定的，JDK8提供了一个sun.misc.Contented的注解，用来解决伪共享问题。所以我们可以把上面代码修改为这样：

```java
@sun.misc.Contended
public class FalseShareDemo3 {
    public volatile long value = 0L;
    @sun.misc.Contended("tlr")
    int threadLocalRandomProbe;
}
```

无论是在类上，还是变量上都可以修饰。

需要注意的是，在默认情况下，@Contended这个注解只用于JAVA核心类，例如rt包下面的类。如果用户类路径下的类需要使用的话，则需要添加JVM参数

> -XX:-RestrictContended

这样的默认填充的宽度为128，如果要自定义宽度，可以设置这个参数：

> -XX:ContendedPaddingWidth
