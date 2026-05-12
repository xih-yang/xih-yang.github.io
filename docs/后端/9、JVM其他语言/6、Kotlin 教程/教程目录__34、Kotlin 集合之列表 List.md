# 34、Kotlin 集合之列表 List
- 来源：https://ddkk.com/zhuanlan/java/kotlin/34.html
- 分类：Kotlin 教程
- 分组：教程目录
**List** 在 Kotlin 中是不可变的，创建后就不允许作任何修改操作。

## 定义 List

可以使用 **listOf()** 来创建含有元素的 List，数据类型由 Kotlin 根据初始化元素自动进行推断 可以使用 emptyList () 创建空 List，但是必须显示指定数据类型

```java
val empty = emptyList<Int>()
val list = listOf("a", "b", "c")
println(list)   //  [a, b, c]
```

## Kotlin 集合之可变列表 MutableList

MutableList 是可变的 List。底层由 LinkedList 实现。

```java
val mList = linkedListOf("a", "b", "c")
mList.add("d")
println(mList)  //  [a, b, c, d]
```

## List 相关操作

```java
val names = listOf("Mike", "Peter", "Jane", "Mary")
names filter {
    it.startsWith("M")
} sortBy {
    it
}map {
    it.toUpperCase()
}forEach { print("${it},") }
println()   //  MARY,MIKE,
```
