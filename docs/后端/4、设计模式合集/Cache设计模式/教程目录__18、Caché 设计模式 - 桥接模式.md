# 18、Caché 设计模式 - 桥接模式
- 来源：https://ddkk.com/zhuanlan/design/cache/18.html
- 分类：设计模式
- 分组：教程目录
## 定义

将抽象部分与它的实现部分分离，使它们都可以独立地变化。

## 优点

两个维度，独立变化。

灵活的扩展，透明实现。

桥接模式将抽象部分和实现部分分离，解耦。

## 结构图

## 描述

有苹果和三星手机，都可以实现通讯录和游戏。思考如果再加一个华为手机和听歌功能。

## 完整示例

### 手机软件抽象类

```java
Class PHA.YX.Design.Bridge.HandsetSoft Extends %RegisteredObject
{
Method Run() [ Abstract ]
{
}
}
```

### 游戏，通讯录具体类

```java
Class PHA.YX.Design.Bridge.HandsetGame Extends HandsetSoft
{
Method Run()
{
	w "运行手机游戏",!
}
}
```

```java
Class PHA.YX.Design.Bridge.HandsetAddressList Extends HandsetSoft
{
Method Run()
{
	w "运行手机通讯录",!
}
}
```

### 抽象手机品牌类

```java
Class PHA.YX.Design.Bridge.HandsetBrand Extends %RegisteredObject
{
Property soft As HandsetSoft;
Method SetHandsetSoft(soft As HandsetSoft)
{
	s ..soft = soft
}
Method Run() [ Abstract ]
{
}
}
```

### 手机品牌具体类

```java
Class PHA.YX.Design.Bridge.HandsetBrandApple Extends HandsetBrand
{
Method Run()
{
	w "苹果手机"
	d ..soft.Run()
}
}
```

```java
Class PHA.YX.Design.Bridge.HandsetBrandSamsung Extends HandsetBrand
{
Method Run()
{
	w "三星手机"
	d ..soft.Run()
}
}
```

### 调用

```java
/// dclass(PHA.YX.Design.Program).Bridge() 
ClassMethod Bridge()
{
	#dim brand as PHA.YX.Design.Bridge.HandsetBrand
	s brand =class(PHA.YX.Design.Bridge.HandsetBrandApple).%New()
	d brand.SetHandsetSoft(##class(PHA.YX.Design.Bridge.HandsetGame).%New())
	d brand.Run()
	d brand.SetHandsetSoft(##class(PHA.YX.Design.Bridge.HandsetAddressList).%New())
	d brand.Run()
	s brand =class(PHA.YX.Design.Bridge.HandsetBrandSamsung).%New()
	d brand.SetHandsetSoft(##class(PHA.YX.Design.Bridge.HandsetGame).%New())
	d brand.Run()
	d brand.SetHandsetSoft(##class(PHA.YX.Design.Bridge.HandsetAddressList).%New())
	d brand.Run()
}
```

```java
DHC-APP>dclass(PHA.YX.Design.Program).Bridge()
苹果手机运行手机游戏
苹果手机运行手机通讯录
三星手机运行手机游戏
三星手机运行手机通讯录
```

## 思考

有三种图形，正方形，圆形，三角形，分别上白色，红色，黑色。
