# 01、Java 19 新特性 - HashMap 新的构造方法
- 来源：https://ddkk.com/zhuanlan/java/java19/1.html
- 分类：Java 19 新特性
- 分组：教程目录
Java SE 19，构造哈希表的时候，由于有扩容因子 0.75 的设置，所以如果要开辟一个 120 空间的哈希表，需要如下定义

```java
Map<Integer,Integer> map1 = new HashMap<>(160);
```

Java SE 19 中，HashMap 有了新的构造方法，可以用 newHashMap 直接指定具体大小，不需要提前做换算。

这个用法类似 [Guava][] 的集合构造方式。

如上例，可以使用

```java
Map<Integer, Integer> map2 = HashMap.newHashMap(120);
```

代码如下

```java
import java.util.*;
public class NewHashMapMethodTest {
    public static void main(String[] arg) {
        // jdk 19之前
        // 由于有 扩容因子 0.75 的设置，所以如果要开辟一个120的哈希表，需要如下定义
        Map<Integer,Integer> map1 = new HashMap<>(160);
        for (int i = 0; i < 10; i++) {
            map1.put(i,i);
        }
        System.out.println(map1);
        // jdk 19及以后
        // 可以用newHashMap直接指定具体大小，不需要提前做换算
        Map<Integer, Integer> map2 = HashMap.newHashMap(120);
        for (int i = 0; i < 10; i++) {
            map2.put(i,i);
        }
        System.out.println(map2);
    } 
}
```
