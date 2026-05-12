# 11、Caché 设计模式 - 抽象工厂模式
- 来源：https://ddkk.com/zhuanlan/design/cache/11.html
- 分类：设计模式
- 分组：教程目录
## 定义

提供一个创建一系列相关或相互依赖的接口，而无需制定它们具体的类。

## 优点

相比与简单工厂，没有违背开放封闭原则。

可直接创建产品即可。

## 结构图

## 描述

连接数据库SQL和Caché并且每个数据库映射的同张的表的类型是不同的。

## 完整示例

### 实体类

```java
Class PHA.YX.Design.AbstractFactory.User Extends %RegisteredObject
{
Property ID As %String;
Method IDGet() As %String [ ServerOnly = 1 ]
{
	Quit i%ID
}
Method IDSet(Arg As %String) As %Status [ ServerOnly = 1 ]
{
	s i%ID = Arg
	Quit $$$OK
}
Property name As %String;
Method nameGet() As %String [ ServerOnly = 1 ]
{
	Quit i%name
}
Method nameSet(Arg As %String) As %Status [ ServerOnly = 1 ]
{
	s i%name = Arg
	Quit $$$OK
}
}
```

```java
Class PHA.YX.Design.AbstractFactory.Department Extends %RegisteredObject
{
Property ID As %String;
Method IDGet() As %String [ ServerOnly = 1 ]
{
	Quit i%ID
}
Method IDSet(Arg As %String) As %Status [ ServerOnly = 1 ]
{
	s i%ID = Arg
	Quit $$$OK
}
Property name As %String;
Method nameGet() As %String [ ServerOnly = 1 ]
{
	Quit i%name
}
Method nameSet(Arg As %String) As %Status [ ServerOnly = 1 ]
{
	s i%name = Arg
	Quit $$$OK
}
}
```

### 抽象产品类

```java
Class PHA.YX.Design.AbstractFactory.IDepartment Extends %RegisteredObject
{
Method Insert(department As Department)
{
}
Method GetDepartment(ID As %Integer)
{
}
}
```

```java
Class PHA.YX.Design.AbstractFactory.IUser Extends %RegisteredObject
{
Method Insert(user As User)
{
}
Method GetUser(ID As %Integer)
{
}
}
```

### 具体产品类

#### User

```java
Class PHA.YX.Design.AbstractFactory.SqlUser Extends IUser
{
Method Insert(user As User)
{
	w "在SQL中给User表添加一条记录",!
}
Method GetUser(ID As %Integer)
{
	w "在SQL中根据ID得到User表一条记录",!
}
ClassMethod CreatObject()
{
	qclass(PHA.YX.Design.AbstractFactory.SqlUser).%New()
}
}
```

```java
Class PHA.YX.Design.AbstractFactory.CacheUser Extends IUser
{
Method Insert(user As User)
{
	w "在Cache中给User表添加一条记录",!
}
Method GetUser(ID As %Integer)
{
	w "在Cache中根据ID得到User表一条记录",!
}
ClassMethod CreatObject()
{
	qclass(PHA.YX.Design.AbstractFactory.CacheUser).%New()
}
}
```

#### Department

```java
Class PHA.YX.Design.AbstractFactory.SqlDepartment Extends IDepartment
{
Method Insert(department As Department)
{
	w "在SQL中给Department表添加一条记录",!
}
Method GetDepartment(ID As %Integer)
{
	w "在SQL中根据ID得到Department表一条记录",!
}
ClassMethod CreatObject()
{
	qclass(PHA.YX.Design.AbstractFactory.SqlDepartment).%New()
}
}
```

```java
Class PHA.YX.Design.AbstractFactory.CacheDepartment Extends IDepartment
{
Method Insert(department As Department)
{
	w "在Cache中给Department表添加一条记录",!
}
Method GetDepartment(ID As %Integer)
{
	w "在Cache中根据ID得到Department表一条记录",!
}
ClassMethod CreatObject()
{
	qclass(PHA.YX.Design.AbstractFactory.CacheDepartment).%New()
}
}
```

### 抽象工厂类

因为Caché 系统`$`反射方法没有创建对象的方法。所以采用了一种讨巧的方式.

$classmethod 可以直接调用静态方法。

通过给实体类创建一个静态方法返回该对象的实例。

直接用XECUTE命令直接反射，然后获取引用对象。

配置的字符串可以通过inc文件来制定，符合开放封闭原则，又可配置。

**注意：本章使用的反射+配置实现访问程序**

```java
Include PHA.YX.Design.AbstractFactory.Data
Class PHA.YX.Design.AbstractFactory.DataAccess Extends %RegisteredObject
{
Parameter sqlDatabase = "Sql";
Parameter cacheDatabase = "Cache";
ClassMethod CreateUser() As IUser
{
	# dim mUser as PHA.YX.Design.AbstractFactory.IUser
	s classNmae = "PHA.YX.Design.AbstractFactory." _ ..#sqlDatabase _ "User"
	s mUser = $classmethod(classNmae,"CreatObject")
	q mUser
}
ClassMethod CreateDepartment() As IDepartment
{
	# dim mUser as PHA.YX.Design.AbstractFactory.IDepartment
	s classNmae = "PHA.YX.Design.AbstractFactory." _ ..#sqlDatabase _ "Department"
	s mUser = $classmethod(classNmae,"CreatObject")
	q mUser
}
ClassMethod CreateUserTwo() As IUser
{
	# dim mUser as PHA.YX.Design.AbstractFactory.IUser
	s classNmae = "PHA.YX.Design.AbstractFactory." _ $$$database _ "User"
	x ("(mUser) s mUser =class(" _ classNmae _ ").%New()", .mUser)
	q mUser
}
}
```

```java
#define database "Cache"
```

## 思考

改写第一章思考生产电脑的例子。感兴趣的同学实现后可以发我一起参考下。
