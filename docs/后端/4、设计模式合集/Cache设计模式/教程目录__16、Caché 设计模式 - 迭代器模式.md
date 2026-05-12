# 16、Caché 设计模式 - 迭代器模式
- 来源：https://ddkk.com/zhuanlan/design/cache/16.html
- 分类：设计模式
- 分组：教程目录
## 定义

提供一种方法顺序访问个聚合对象中各个元素，而又不暴露该对象的内部表示。

## 使用场景

提供一个list的遍历方法。目的很明确，弱化遍历算法和容器之间的关系。

根据传入的list额外提供一个遍历方法。

当需要对聚集有多种方式遍历时，可以考虑用迭代器模式。

## 结构图

## 描述

创建一个数组集合。

## 完整示例

### 定义迭代器接口

```java
Class PHA.YX.Design.Iterator.Iterator Extends %RegisteredObject
{
Method HasNext() As %Boolean
{
}
Method Next()
{
}
}
```

### 实现迭代器接口

```java
Class PHA.YX.Design.Iterator.IteratorImpl Extends Iterator
{
Property list As list Of %String;
Property cursor As %Integer [ InitialExpression = 0 ];
Method %OnNew(list) As %Status [ Private, ServerOnly = 1 ]
{
	s ..list = list
	Quit $$$OK
}
Method HasNext() As %Boolean
{
	q ..cursor '= ..list.Count()
}
Method Next()
{
	s obj = ""
	i ..HasNext() d
	.s ..cursor = ..cursor +1
	.s obj = ..list.GetAt(..cursor)
	q obj
}
}
```

### 定义容器接口

```java
Class PHA.YX.Design.Iterator.Container Extends %RegisteredObject
{
Method add(obj)
{
}
Method remove(obj)
{
}
Method Iterator(obj) As Iterator
{
}
}
```

### 实现容器接口

```java
Class PHA.YX.Design.Iterator.ContainerImpl Extends Container
{
Property list As List Of %String;
Method add(obj)
{
	d ..list.Insert(obj)
}
Method remove(obj)
{
	d ..list.RemoveAt(obj)
}
Method Iterator() As Iterator
{
	qclass(IteratorImpl).%New(..list)
}
}
```

### 调用

```java
/// dclass(PHA.YX.Design.Program).Iterator() 
ClassMethod Iterator()
{
	#dim container as PHA.YX.Design.Iterator.ContainerImpl
	s container =class(PHA.YX.Design.Iterator.ContainerImpl).%New()
	d container.add("Java")
	d container.add("Cache")
	d container.add("Kotlin")
	d container.add("Flutter")
	d container.add("Python")
	d container.add("Swfit")
	d container.add("Objective-c")
	d container.add("C#")
	#dim iterator as PHA.YX.Design.Iterator.Iterator
	s iterator = container.Iterator()
	while (iterator.HasNext()){
		w iterator.Next(),!
	}
}
```

```java
DHC-APP>dclass(PHA.YX.Design.Program).Iterator()
Java
Cache
Kotlin
Flutter
Python
Swfit
Objective-c
C#
```

## 思考

创建一个Person类有Name属性，添加，然后用迭代器模式遍历。
