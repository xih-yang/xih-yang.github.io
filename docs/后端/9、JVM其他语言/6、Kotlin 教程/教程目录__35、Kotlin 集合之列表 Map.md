# 35、Kotlin 集合之列表 Map
- 来源：https://ddkk.com/zhuanlan/java/kotlin/35.html
- 分类：Kotlin 教程
- 分组：教程目录
映射 **Map**，又称散列表，或者是 散列表 kotlin 的哈希表分为**不可变映射**和**可变映射**

### 不可变映射

```java
val map = mapOf("a" to 1, "b" to 2, "c" to 3)
```

### 可变映射

```java
val mMap = hashMapOf("a" to 1, "b" to 2, "c" to 3)
```

## 判断指定 key 是否存在

```java
mMap.getOrDefault("e", 10)
```

或者

```java
val x = if (mMap.containsKey("e"))
```

## 访问元素

```java
mMap.get("d")
```

如果试图访问不存在的 key 时，会抛出 NullPointerException 异常，所以需要在访问前先进行判断

```java
val x = if (mMap.containsKey("e")) mMap.get("e") else 0
```

### 可变映射更新或插入新元素

```java
mMap.put("d", 20)
```

### 可变映射删除元素

```java
mMap.remove("c")
```

> 不可变映射不可以被修改

### 遍历 entry

```java
for ((k, v) in map) {
    println("$k -> $v")
}
```

### 只遍历 key 或 value

```java
val keys = map.keySet()
val values = map.values()
for (k in keys) {
    println(k)
}
```
