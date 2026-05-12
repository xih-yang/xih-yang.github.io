# 17、Caché 设计模式 - 单例模式
- 来源：https://ddkk.com/zhuanlan/design/cache/17.html
- 分类：设计模式
- 分组：教程目录
## 定义

保证一个类仅有一个实例，并提供一个访问它的全局访问点。

我们让一个全局变量使得一个对象访问，但它不能防止你实例化多个对象。一个最好的办法就是，让类自身负责保存它的唯一实例。这个类可以保证没有其他实例可以被创建，并且它可以提供一个访问该实例的方法。

## 使用场景

整个项目需要一个共享访问点或共享数据

创一个对象需要耗费的资源过多，比如访问I/O或者数据库等资源

工具类对象。

## 结构图

## 完整示例

### 双重锁定

```java
Class PHA.YX.Design.Singleton.Singleton Extends %RegisteredObject
{
Parameter instance As COSEXPRESSION = "##class(PHA.YX.Design.Singleton.Singleton).%New()";
Method %OnNew() As %Status [ Private, ServerOnly = 1 ]
{
	Quit $$$OK
}
ClassMethod GetInstance() As Singleton
{
	# dim %instance as PHA.YX.Design.Singleton.Singleton
	i '$d(%instance) || (%instance = "") d
	.l +^INSTANCE("INSTANCE"):5  d
	..i '$d(%instance) || (%instance = "") d
	...s %instance =class(PHA.YX.Design.Singleton.Singleton).%New()
	l -^INSTANCE("INSTANCE")
	q %instance
}
Method Call()
{
	w "实例方法",!
}
}
```

为什么里面还有判断一次？

因为当instanc为null并且同时有个线程调用GetInstance()方法时，他们都将可以通过第一重instance=null的判断，然后由于lock机制，这两个变成则只有一个进入，另外一个在外排队等待，必须要其中的一个进入并出来后另外一个才能进入。而此时如果没有了第二重的instance是否为null判断，则第一个线程创建了实例，而第二个线程还是可以继续再创建新的实例，这就没有达到单例的目的。

## 调用

```java
/// dclass(PHA.YX.Design.Program).Singleton() 
ClassMethod Singleton()
{
	#dim s1 as PHA.YX.Design.Singleton.Singleton
	s s1 =class(PHA.YX.Design.Singleton.Singleton).GetInstance()
	d s1.Call()
	#dim s2 as PHA.YX.Design.Singleton.Singleton
	s s2 =class(PHA.YX.Design.Singleton.Singleton).GetInstance()	
	d s2.Call()
	if (s1 = s2) d
	.w "两个对象是相同的实例"
}
```

```java
DHC-APP>dclass(PHA.YX.Design.Program).Singleton()
实例方法
实例方法
两个对象是相同的实例
```

### 思考

其他语言，还有懒加载，饿汉模式。感兴趣的同学实现后可以发我一起参考下。
