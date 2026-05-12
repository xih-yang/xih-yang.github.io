# 33、Kotlin 集合之 数组 array
- 来源：https://ddkk.com/zhuanlan/java/kotlin/33.html
- 分类：Kotlin 教程
- 分组：教程目录
Array 类代表着数组

## 创建数据有四种方法

### 直接指定长度

```java
val fixedSizeArray = arrayOfNulls<Int>(5)
```

### 使用装箱操作

```java
val arr = arrayOf(1, 2, 3)
val intArr = intArrayOf(1, 2, 3)    //同理还有 booleanArrayOf() 等
```

### 使用闭包进行初始化

```java
val asc = Array(5, { i -> i * i })  //0,1,4,9,16
```

### 空数组

长度为0 的空数组

```java
 val empty = emptyArray<Int>()
```

## 访问数组元素

[] 可以用于访问数组的元素，实际上 [] 被进行了操作符的重载，调用的是 Array 类的 setter 和 getter 方法

```java
val arr = arrayOf(1, 2, 3)
println(asc[1])         //  1
println(asc.get(1))     //  1
// println(asc[10])      ArrayIndexOutOfBoundsException
```

[] 虽然调用的是 setter 和 getter 方法，但是编译成字节码时会被进行优化，变成直接访问数组的内存地址，所以不会造成性能损失。

## 修改元素

```java
asc[1] = 10
```

## 遍历数组

```java
for (i in asc) {
    println(i)
}
```

此操作不会创建 iterator 对象，不会影响性能

## 遍历数组下标

```java
for (j in asc.indices) {
    println(j)
}
```

此操作不会创建 iterator 对象，不会影响性能

## 检查下标

```java
if (i in asc.indices) { // i>=0 && i<asc.size()
    println("indices:" + i)
}
```
