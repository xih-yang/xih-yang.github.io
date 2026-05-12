# 13、Java集合：Set总结
- 来源：https://ddkk.com/zhuanlan/java/concurrency/3/13.html
- 分类：Java并发
- 分组：教程目录
## Set

**1、** 无重复元素；

**2、** 重写了equals和hashCode方法；

## TreeSet

**1、** 基于TreeMap的红黑树结构实现；

**2、** 非同步、fail-fast；

**3、** 不允许使用NULL元素；

**4、** 适用于排序、不包含重复元素场景；

## HashSet

**1、** 基于哈希表(HashMap)实现；

**2、** 允许使用null元素；

**3、** 非同步，fail-fast；

**4、** 适用于快速查找、不包含重复元素场景；

## LinkedHashSet

**1、** 基于LinkedHashMap的Set接口的哈希表和链接列表实现；

**2、** 非同步，fail-fast；

**3、** 适用于快速查找、有序、不包含重复元素场景；

## CopyOnWriteArraySet

**1、** 基于CopyOnWriteArrayList的Set；

**2、** 同步、fail-safe；

**3、** 迭代器不支持可变remove操作；

**4、** 适用于：set大小通常保持很小，只读操作远多于可变操作，需要在遍历期间防止线程间的冲突；

## ConcurrentSkipListSet

**1、** 基于ConcurrentSkipListMap的可缩放并发NavigableSet实现；

**2、** 不允许使用null元素；

**3、** 有序；

## EnumSet

**1、** 与枚举类型一起使用的专用Set实现；

**2、** 不允许使用null元素；

**3、** 非同步；
