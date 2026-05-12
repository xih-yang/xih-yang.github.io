# 06、Caché 设计模式 - 原型模式
- 来源：https://ddkk.com/zhuanlan/design/cache/6.html
- 分类：设计模式
- 分组：教程目录
## 定义

用原型实例指定创建对象的种类，并且通过拷贝这些原型创建新的对象。

原型模式其实就是从一个对象再创建另外一个可定制的对象，而且不需要知道任何创建的细节。

## 使用场景

使用原形模式可以解决复杂对象构建资源消耗的问题。也可以用来只读保护。注意其java里继承Cloneable接口。C#继承ICloneable接口。Caché 直接使用[%ConstructClone()](https://blog.csdn.net/yaoxin521123/article/details/104940703)方法，克隆时不会走构造函数。

## 优点

一般在初始化的信息不发生变的情况下，克隆是最好的办法，这即隐藏了对象创建的细节，又对性能是大大的提高。

不用重新初始化对象，而是动态地获得对象运行时的状态。

## 结构图

## 描述

要求有一个简历类，必须要有姓名，可以设置性别和年龄，可以设置工作经历。最终需要三分简历。

## 示例

简历类

```java
Class PHA.YX.Design.Prototype.Resume Extends %RegisteredObject
{
Property name As %String [ Private ];
Property sex As %String [ Private ];
Property age As %String [ Private ];
Property timeArea As %String [ Private ];
Property company As %String [ Private ];
Method %OnNew(name As %String) As %Status [ Private, ServerOnly = 1 ]
{
	s $this.name = name
	Quit $$$OK
}
Method SetPersonalInfo(sex As %String, age As %String)
{
	s $this.sex=sex
	s $this.age=age
}
Method SetWorkExperience(timeArea As %String, company As %String)
{
	s $this.timeArea=timeArea
	s $this.company=company
}
Method Display()
{
	w ..name _ " " _ ..sex _ " " _ ..age,!
	w "工作经历：" _ ..timeArea _ " " _ ..company,!
}
}
```

### 初级写法

```java
/// dclass(PHA.YX.Design.Program).PrototypeExamplePrimary() 
ClassMethod PrototypeExamplePrimary()
{
	s mResumeA =class(PHA.YX.Design.Prototype.Resume).%New("姚鑫")
	d mResumeA.SetPersonalInfo("男","30")
	d mResumeA.SetWorkExperience("2015-2020","XX公司")
	s mResumeB =class(PHA.YX.Design.Prototype.Resume).%New("姚鑫")
	d mResumeB.SetPersonalInfo("男","30")
	d mResumeB.SetWorkExperience("2015-2020","XX公司")
	s mResumeC =class(PHA.YX.Design.Prototype.Resume).%New("姚鑫")
	d mResumeC.SetPersonalInfo("男","30")
	d mResumeC.SetWorkExperience("2015-2020","XX公司")
	d mResumeA.Display()
	d mResumeB.Display()
	d mResumeC.Display()
}
```

```java
DHC-APP>dclass(PHA.YX.Design.Program).PrototypeExamplePrimary()
姚鑫 男 30
工作经历：2015-2020 XX公司
姚鑫 男 30
工作经历：2015-2020 XX公司
姚鑫 男 30
工作经历：2015-2020 XX公司
```

#### 缺点

三分简历需要实例化三次，如果需要一百份，就需要实例化一百次，徒增内存。

### 中级写法

```java
/// dclass(PHA.YX.Design.Program).PrototypeExampleIntermediate() 
ClassMethod PrototypeExampleIntermediate()
{
	s mResumeA =class(PHA.YX.Design.Prototype.Resume).%New("姚鑫")
	d mResumeA.SetPersonalInfo("男","30")
	d mResumeA.SetWorkExperience("2015-2020","XX公司")
	# dim mResumeB as PHA.YX.Design.Prototype.Resume
	s mResumeB = mResumeA
	# dim mResumeC as PHA.YX.Design.Prototype.Resume
	s mResumeC = mResumeA
	d mResumeA.Display()
	d mResumeB.Display()
	d mResumeC.Display()
}
```

```java
DHC-APP>dclass(PHA.YX.Design.Program).PrototypeExampleIntermediate()
姚鑫 男 30
工作经历：2015-2020 XX公司
姚鑫 男 30
工作经历：2015-2020 XX公司
姚鑫 男 30
工作经历：2015-2020 XX公司
```

#### 缺点

引用传值，改动其中一处其他复制实例一起改动。把mResumeB设置一下年龄，mResumeC设置一下公司。如下：

```java
/// dclass(PHA.YX.Design.Program).PrototypeExampleIntermediate() 
ClassMethod PrototypeExampleIntermediate()
{
	s mResumeA =class(PHA.YX.Design.Prototype.Resume).%New("姚鑫")
	d mResumeA.SetPersonalInfo("男","30")
	d mResumeA.SetWorkExperience("2015-2020","XX公司")
	# dim mResumeB as PHA.YX.Design.Prototype.Resume
	s mResumeB = mResumeA
	d mResumeB.SetPersonalInfo("男","31")
	# dim mResumeC as PHA.YX.Design.Prototype.Resume
	s mResumeC = mResumeA
	d mResumeC.SetWorkExperience("2017-2020","SS公司")
	d mResumeA.Display()
	d mResumeB.Display()
	d mResumeC.Display()
}
```

运行结果

```java
DHC-APP>dclass(PHA.YX.Design.Program).PrototypeExampleIntermediate()
姚鑫 男 31
工作经历：2017-2020 SS公司
姚鑫 男 31
工作经历：2017-2020 SS公司
姚鑫 男 31
工作经历：2017-2020 SS公司
```

### 高级写法 (浅复制)

使用.%ConstructClone()方法复制

```java
/// dclass(PHA.YX.Design.Program).PrototypeExampleSenior() 
ClassMethod PrototypeExampleSenior()
{
	s mResumeA =class(PHA.YX.Design.Prototype.Resume).%New("姚鑫")
	d mResumeA.SetPersonalInfo("男","30")
	d mResumeA.SetWorkExperience("2015-2020","XX公司")
	# dim mResumeB as PHA.YX.Design.Prototype.Resume
	s mResumeB = mResumeA.%ConstructClone()
	d mResumeB.SetPersonalInfo("男","31")
	# dim mResumeC as PHA.YX.Design.Prototype.Resume
	s mResumeC =mResumeA.%ConstructClone()
	d mResumeC.SetWorkExperience("2017-2020","SS公司")
	d mResumeA.Display()
	d mResumeB.Display()
	d mResumeC.Display()
}
```

```java
DHC-APP> dclass(PHA.YX.Design.Program).PrototypeExampleSenior()
姚鑫 男 30
工作经历：2015-2020 XX公司
姚鑫 男 31
工作经历：2015-2020 XX公司
姚鑫 男 30
工作经历：2017-2020 SS公司
```

### 浅复制

如果字段是值类型的，则对该字段执行逐位复制，如果字段是引用类型，则复制引用但不复制引用的对象，因此原始对象及其副本引用统一对象。如下增加一个工作经验类的引用字段：

增加一个WorkExperience类

```java
Class PHA.YX.Design.Prototype.WorkExperience Extends %RegisteredObject
{
Property workDate As %String [ Private ];
Method workDateGet() As %String [ ServerOnly = 1 ]
{
	Quit i%workDate
}
Method workDateSet(Arg As %String) As %Status [ ServerOnly = 1 ]
{
	s i%workDate = Arg
	Quit $$$OK
}
Property company As %String [ Private ];
Method companyGet() As %String [ ServerOnly = 1 ]
{
	Quit i%company
}
Method companySet(Arg As %String) As %Status [ ServerOnly = 1 ]
{
	s i%company = Arg
	Quit $$$OK
}
}
```

PHA.YX.Design.Prototype.Resume 增加一个work字段引用WorkExperience

```java
Property work As WorkExperience [ Private ];
```

并且在构造方法初始化它

```java
Method %OnNew(name As %String) As %Status [ Private, ServerOnly = 1 ]
{
	s $this.name = name
	s ..work =class(WorkExperience).%New()
	Quit $$$OK
}
```

给对象添加WorkExperience数据方法

```java
Method CloneWorkExperience()
{
	s ..work = ..work.%ConstructClone()
}
```

输出也修改一下

```java
Method Display()
{
	w ..name _ " " _ ..sex _ " " _ ..age,!
	w "工作经历：" _ ..timeArea _ " " _ ..company,!
	w "工作经历Object：" _ ..work.workDateGet() _ " " _ ..work.companyGet(),!
}
```

```java
/// dclass(PHA.YX.Design.Program).PrototypeExampleShallow() 
ClassMethod PrototypeExampleShallow()
{
	s mResumeA =class(PHA.YX.Design.Prototype.Resume).%New("姚鑫")
	d mResumeA.SetPersonalInfo("男","30")
	d mResumeA.SetWorkExperience("2015-2020","XX公司")
	d mResumeA.SetWorkExperienceObject("2010-2011","腾讯")
	# dim mResumeB as PHA.YX.Design.Prototype.Resume
	s mResumeB = mResumeA.%ConstructClone()
	d mResumeB.SetPersonalInfo("男","31")
	d mResumeB.SetWorkExperienceObject("2011-2012","阿里")
	# dim mResumeC as PHA.YX.Design.Prototype.Resume
	s mResumeC =mResumeA.%ConstructClone()
	d mResumeC.SetWorkExperience("2017-2020","SS公司")
	d mResumeC.SetWorkExperienceObject("2012-2013","百度")
	d mResumeA.Display()
	d mResumeB.Display()
	d mResumeC.Display()
}
```

```java
DHC-APP> dclass(PHA.YX.Design.Program).PrototypeExampleShallow()
姚鑫 男 30
工作经历：2015-2020 XX公司
工作经历Object：2012-2013 百度
姚鑫 男 31
工作经历：2015-2020 XX公司
工作经历Object：2012-2013 百度
姚鑫 男 30
工作经历：2017-2020 SS公司
工作经历Object：2012-2013 百度
```

结果发现。引用的字段并没有重新复制。

### 深复制

我们在PHA.YX.Design.Prototype.Resume里给work属性，增加一个克隆方法。

```java
Method CloneWorkExperience()
{
	s ..work = ..work.%ConstructClone()
}
```

```java
/// dclass(PHA.YX.Design.Program).PrototypeExampleDeep() 
ClassMethod PrototypeExampleDeep()
{
	s mResumeA =class(PHA.YX.Design.Prototype.Resume).%New("姚鑫")
	d mResumeA.SetPersonalInfo("男","30")
	d mResumeA.SetWorkExperience("2015-2020","XX公司")
	d mResumeA.CloneWorkExperience()
	d mResumeA.SetWorkExperienceObject("2010-2011","腾讯")
	# dim mResumeB as PHA.YX.Design.Prototype.Resume
	s mResumeB = mResumeA.%ConstructClone()
	d mResumeB.SetPersonalInfo("男","31")
	d mResumeB.CloneWorkExperience()
	d mResumeB.SetWorkExperienceObject("2011-2012","阿里")
	# dim mResumeC as PHA.YX.Design.Prototype.Resume
	s mResumeC =mResumeA.%ConstructClone()
	d mResumeC.SetWorkExperience("2017-2020","SS公司")
	d mResumeC.CloneWorkExperience()
	d mResumeC.SetWorkExperienceObject("2012-2013","百度")
	d mResumeA.Display()
	d mResumeB.Display()
	d mResumeC.Display()
}
```

结果发现，把引用字段work的值也修改成功。

```java
DHC-APP>dclass(PHA.YX.Design.Program).PrototypeExampleDeep()
姚鑫 男 30
工作经历：2015-2020 XX公司
工作经历Object：2010-2011 腾讯
姚鑫 男 31
工作经历：2015-2020 XX公司
工作经历Object：2011-2012 阿里
姚鑫 男 30
工作经历：2017-2020 SS公司
工作经历Object：2012-2013 百度
```

## 完整示例

### 简历类(复制类)

```java
Class PHA.YX.Design.Prototype.Resume Extends %RegisteredObject
{
Property name As %String [ Private ];
Property sex As %String [ Private ];
Property age As %String [ Private ];
Property timeArea As %String [ Private ];
Property company As %String [ Private ];
Property work As WorkExperience [ Private ];
Method %OnNew(name As %String) As %Status [ Private, ServerOnly = 1 ]
{
	s $this.name = name
	s ..work =class(WorkExperience).%New()
	Quit $$$OK
}
Method CloneWorkExperience()
{
	s ..work = ..work.%ConstructClone()
}
Method SetPersonalInfo(sex As %String, age As %String)
{
	s $this.sex=sex
	s $this.age=age
}
Method SetWorkExperience(timeArea As %String, company As %String)
{
	s $this.timeArea=timeArea
	s $this.company=company
}
Method SetWorkExperienceObject(workDate As %String, company As %String)
{
	d ..work.workDateSet(workDate)
	d ..work.companySet(company)
}
Method Display()
{
	w ..name _ " " _ ..sex _ " " _ ..age,!
	w "工作经历：" _ ..timeArea _ " " _ ..company,!
	w "工作经历Object：" _ ..work.workDateGet() _ " " _ ..work.companyGet(),!
}
}
```

### 对象类（工作经验类）

```java
Class PHA.YX.Design.Prototype.WorkExperience Extends %RegisteredObject
{
Property workDate As %String [ Private ];
Method workDateGet() As %String [ ServerOnly = 1 ]
{
	Quit i%workDate
}
Method workDateSet(Arg As %String) As %Status [ ServerOnly = 1 ]
{
	s i%workDate = Arg
	Quit $$$OK
}
Property company As %String [ Private ];
Method companyGet() As %String [ ServerOnly = 1 ]
{
	Quit i%company
}
Method companySet(Arg As %String) As %Status [ ServerOnly = 1 ]
{
	s i%company = Arg
	Quit $$$OK
}
}
```

## 调用

```java
/// dclass(PHA.YX.Design.Program).PrototypeExamplePrimary() 
ClassMethod PrototypeExamplePrimary()
{
	s mResumeA =class(PHA.YX.Design.Prototype.Resume).%New("姚鑫")
	d mResumeA.SetPersonalInfo("男","30")
	d mResumeA.SetWorkExperience("2015-2020","XX公司")
	s mResumeB =class(PHA.YX.Design.Prototype.Resume).%New("姚鑫")
	d mResumeB.SetPersonalInfo("男","30")
	d mResumeB.SetWorkExperience("2015-2020","XX公司")
	s mResumeC =class(PHA.YX.Design.Prototype.Resume).%New("姚鑫")
	d mResumeC.SetPersonalInfo("男","30")
	d mResumeC.SetWorkExperience("2015-2020","XX公司")
	d mResumeA.Display()
	d mResumeB.Display()
	d mResumeC.Display()
}
/// dclass(PHA.YX.Design.Program).PrototypeExampleIntermediate() 
ClassMethod PrototypeExampleIntermediate()
{
	s mResumeA =class(PHA.YX.Design.Prototype.Resume).%New("姚鑫")
	d mResumeA.SetPersonalInfo("男","30")
	d mResumeA.SetWorkExperience("2015-2020","XX公司")
	# dim mResumeB as PHA.YX.Design.Prototype.Resume
	s mResumeB = mResumeA
	d mResumeB.SetPersonalInfo("男","31")
	# dim mResumeC as PHA.YX.Design.Prototype.Resume
	s mResumeC = mResumeA
	d mResumeC.SetWorkExperience("2017-2020","SS公司")
	d mResumeA.Display()
	d mResumeB.Display()
	d mResumeC.Display()
}
/// dclass(PHA.YX.Design.Program).PrototypeExampleSenior() 
ClassMethod PrototypeExampleSenior()
{
	s mResumeA =class(PHA.YX.Design.Prototype.Resume).%New("姚鑫")
	d mResumeA.SetPersonalInfo("男","30")
	d mResumeA.SetWorkExperience("2015-2020","XX公司")
	# dim mResumeB as PHA.YX.Design.Prototype.Resume
	s mResumeB = mResumeA.%ConstructClone()
	d mResumeB.SetPersonalInfo("男","31")
	# dim mResumeC as PHA.YX.Design.Prototype.Resume
	s mResumeC =mResumeA.%ConstructClone()
	d mResumeC.SetWorkExperience("2017-2020","SS公司")
	d mResumeA.Display()
	d mResumeB.Display()
	d mResumeC.Display()
}
/// dclass(PHA.YX.Design.Program).PrototypeExampleShallow() 
ClassMethod PrototypeExampleShallow()
{
	s mResumeA =class(PHA.YX.Design.Prototype.Resume).%New("姚鑫")
	d mResumeA.SetPersonalInfo("男","30")
	d mResumeA.SetWorkExperience("2015-2020","XX公司")
	d mResumeA.SetWorkExperienceObject("2010-2011","腾讯")
	# dim mResumeB as PHA.YX.Design.Prototype.Resume
	s mResumeB = mResumeA.%ConstructClone()
	d mResumeB.SetPersonalInfo("男","31")
	d mResumeB.SetWorkExperienceObject("2011-2012","阿里")
	# dim mResumeC as PHA.YX.Design.Prototype.Resume
	s mResumeC =mResumeA.%ConstructClone()
	d mResumeC.SetWorkExperience("2017-2020","SS公司")
	d mResumeC.SetWorkExperienceObject("2012-2013","百度")
	d mResumeA.Display()
	d mResumeB.Display()
	d mResumeC.Display()
}
/// dclass(PHA.YX.Design.Program).PrototypeExampleDeep() 
ClassMethod PrototypeExampleDeep()
{
	s mResumeA =class(PHA.YX.Design.Prototype.Resume).%New("姚鑫")
	d mResumeA.SetPersonalInfo("男","30")
	d mResumeA.SetWorkExperience("2015-2020","XX公司")
	d mResumeA.CloneWorkExperience()
	d mResumeA.SetWorkExperienceObject("2010-2011","腾讯")
	# dim mResumeB as PHA.YX.Design.Prototype.Resume
	s mResumeB = mResumeA.%ConstructClone()
	d mResumeB.SetPersonalInfo("男","31")
	d mResumeB.CloneWorkExperience()
	d mResumeB.SetWorkExperienceObject("2011-2012","阿里")
	# dim mResumeC as PHA.YX.Design.Prototype.Resume
	s mResumeC =mResumeA.%ConstructClone()
	d mResumeC.SetWorkExperience("2017-2020","SS公司")
	d mResumeC.CloneWorkExperience()
	d mResumeC.SetWorkExperienceObject("2012-2013","百度")
	d mResumeA.Display()
	d mResumeB.Display()
	d mResumeC.Display()
}
```

## 思考

用深复制实现，Java，Python，C#，连接Caché数据库（有连接属性，连接时间），Caché数据库持有SQL数据库连接（有连接属性，连接时间）。感兴趣的同学实现后可以发我一起参考下。
