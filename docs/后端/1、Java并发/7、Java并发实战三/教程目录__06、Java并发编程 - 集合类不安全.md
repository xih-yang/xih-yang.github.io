# 06、Java并发编程 - 集合类不安全
- 来源：https://ddkk.com/zhuanlan/java/concurrency/7/6.html
- 分类：Java并发
- 分组：教程目录
## 6、集合类不安全

### 6.1. List不安全

> list 不安全

#### 6.1.1. 单线程：安全

```java
package com.coding.collunsafe;
import java.util.Arrays;
import java.util.List;
public class UnsafeList1 {
    public static void main(String[] args) {
        List<String> list = Arrays.asList("a", "b", "c");
        list.forEach(System.out::println);
    }
}
```

#### 6.1.2. 多线程：不安全

```java
package com.coding.collunsafe;
import java.util.ArrayList;
import java.util.Random;
import java.util.UUID;
public class UnsafeList2 {
    public static void main(String[] args) {
        // 代码实现
        ArrayList<Object> list = new ArrayList<>();
        // 测试多线程下是否安全List，3条线程都不安全了
        // 多线程下记住一个异常，并发修改异常 java.util.ConcurrentModificationException
        // Exception  ConcurrentModificationException
        for (int i = 1; i <= 30; i++) {
            new Thread(()->{
                // 3个结果
                list.add(UUID.randomUUID().toString().substring(0,5));
                System.out.println(list);
            },String.valueOf(i)).start();
        }
    }
}
```

#### 6.1.3. 不安全怎么解决

```java
package com.coding.collunsafe;
import java.util.*;
import java.util.concurrent.CopyOnWriteArrayList;
/**
 * 善于总结：
 * 1、 故障现象： ConcurrentModificationException
 * 2、 导致原因： 多线程操作集合类不安全
 * 3、 解决方案：
 *      List<String> list = new Vector<>(); // Vector 是一个线程安全的类,效率低下 
 *      List<String> list = Collections.synchronizedList(new ArrayList<>()); 
 *      List<String> list = new CopyOnWriteArrayList<>(); // JUC 100 推荐使用
 */
public class UnsafeList2 {
    public static void main(String[] args) {
        // 代码实现
        // ArrayList<Object> list = new ArrayList<>(); // 效率高，不支持并发！
        // List<String> list = new Vector<>(); // Vector 是一个线程安全的类,效率低下 
        // List<String> list = Collections.synchronizedList(new ArrayList<>()); 
        // 多线程高并发程序中，一致性最为重要
        // 写入时复制；  COW 思想，计算机设计领域。优化策略
        //  思想： 多个调用者，想调用相同的资源； 指针
        // 只是去读，就不会产生锁！
        // 假如你是去写，就需要拷贝一份都自己哪里，修改完毕后，在替换指针！
        List<String> list = new CopyOnWriteArrayList<>(); // JUC 
        // 测试多线程下是否安全List，3条线程都不安全了
        // 多线程下记住一个异常，并发修改异常 java.util.ConcurrentModificationException
        // Exception  ConcurrentModificationException
        for (int i = 1; i <= 30; i++) {
            new Thread(()->{
                // 3个结果
                list.add(UUID.randomUUID().toString().substring(0,5));
                System.out.println(list);
            },String.valueOf(i)).start();
        }
    }
}
```

> 1、多线程高并发程序中，一致性最为重要
>
> 2、CopyOnWriteArrayList写入时复制； 底层原理就是给数组添加volatile关键字（有关volatile后面章节会详细讲解）
>
> 思想： 多个调用者，想调用相同的资源； 如果线程只是去读，就不会产生锁！
>
> 如果线程是去写，就需要拷贝一份到自己那里，修改完毕后，在替换原指针！原先读的线程指针就移到新的指针。

写入时复制（COW）思想原理：指针，复制指向的问题

### 6.2. Set不安全

> set 不安全

```java
package com.interview.concurrent.collection;
import java.util.Collections;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.CopyOnWriteArraySet;
/**
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @description 描述：Set不安全，以及解决方案
 *  善于总结：
 *  1、 故障现象： ConcurrentModificationException 并发修改异常！
 *  2、 导致原因： 并发下 HashSet 存在安全的问题
 *  3、 解决方案：
 *      Set<String> set = Collections.synchronizedSet(new HashSet<>());  60
 *      Set<String> set =new CopyOnWriteArraySet<>();  // 100
 * @date 2023/2/22 19:56
 */
public class SetUnSafe {
    public static void main(String[] args) {
        //1、HashSet不安全测试
        //hashSet();
        //2、Set不安全解决方案一
        //collections();
        //3、Set不安全解决方案二
        copyOnWriteArraySet();
    }
    /**
     *  @description:   HashSet不支持并发
     *  1、效率高，不支持并发！
     *  2、多线程下使用HashSet，报错：线程修改异常java.util.ConcurrentModificationException
     *  @author DDKK.COM 弟弟快看，程序员编程资料站
     *  @date 2023/2/22 23:39
     */
    public static void hashSet(){
        Set<String> set = new HashSet<>(); // 底层是什么
        for (int i = 1; i <=100 ; i++) {
            new Thread(()->{
                set.add(UUID.randomUUID().toString().substring(0,5));
                System.out.println(set);
            },String.valueOf(i)).start();
        }
    }
    public static void collections(){
        Set<String> set = Collections.synchronizedSet(new HashSet<>());
        for (int i = 1; i <=100 ; i++) {
            new Thread(()->{
                set.add(UUID.randomUUID().toString().substring(0,5));
                System.out.println(set);
            },String.valueOf(i)).start();
        }
    }
    public static void copyOnWriteArraySet(){
        Set<String> set =new CopyOnWriteArraySet<>();
        for (int i = 1; i <=100 ; i++) {
            new Thread(()->{
                set.add(UUID.randomUUID().toString().substring(0,5));
                System.out.println(set);
            },String.valueOf(i)).start();
        }
    }
}
```

### 6.3. map 不安全

> map 不安全

```java
package com.interview.concurrent.collection;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
/**
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @description 描述:
 * 1、Map的加载因子，初始值
 * 在开发中会这样使用 HashMap 吗？ 不会  一开始就知道 100大小的容量
 * 根据实际的业务设置初始值
 * 加载因子，初始值
 * Map<String, String> map = new HashMap<>(100，0.75);
 *
 * 任何存在想修改JDK源码都是不可取的
 *
 * 并发下 HashMap 不安全,ConcurrentModificationException
 * 解决方案：Map<String, String> map = new ConcurrentHashMap<>();
 * @date 2023/2/22 19:58
 */
public class MapUnSafe {
    public static void main(String[] args) {
        //1、HashMap的不安全测试
        //hashMap();
        //2、Map不安全解决方案一
        //collections();
        //3、Map不安全解决方案二
        concurrentHashMap();
    }
    /**
     *  @description:
     *  1、线程不安全,高并发下报错：java.util.ConcurrentModificationException
     *  2、key、value允许为Null
     *  @author DDKK.COM 弟弟快看，程序员编程资料站
     *  @date 2023/2/23 0:00
     */
    public static void hashMap(){
        // 人生如程序，不是选择，就是循环，学习和总结十分重要！
        Map<String, String> map = new HashMap<>();
        // 加载因子，初始值
        // Map<String, String> map = new HashMap<>(100，0.75);
        for (int i = 1; i <= 100; i++) {
            new Thread(()->{
                map.put(Thread.currentThread().getName(), UUID.randomUUID().toString().substring(0,5));
                System.out.println(map);
            },String.valueOf(i)).start();
        }
    }
    public static void collections(){
        Map<String, String> map = Collections.synchronizedMap(new HashMap<>());
        for (int i = 1; i <= 100; i++) {
            new Thread(()->{
                map.put(Thread.currentThread().getName(), UUID.randomUUID().toString().substring(0,5));
                System.out.println(map);
            },String.valueOf(i)).start();
        }
    }
    public static void concurrentHashMap(){
        /**
         * 针对Map,没有 CopyOnWrite**类，与之对应的是ConcurrentHashMap
         */
        Map<String, String> map = new ConcurrentHashMap<>();
        for (int i = 1; i <= 100; i++) {
            new Thread(()->{
                map.put(Thread.currentThread().getName(), UUID.randomUUID().toString().substring(0,5));
                System.out.println(map);
            },String.valueOf(i)).start();
        }
    }
}
```
