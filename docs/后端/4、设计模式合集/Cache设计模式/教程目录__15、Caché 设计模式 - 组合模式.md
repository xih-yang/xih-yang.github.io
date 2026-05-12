# 15、Caché 设计模式 - 组合模式
- 来源：https://ddkk.com/zhuanlan/design/cache/15.html
- 分类：设计模式
- 分组：教程目录
## 定义

将对象组合成树形结构以表示“部分-整体”的层次结构。组合模式使得用户对单个对象和组合对象的使用具有一致性。

## 使用场景

需求中是体现部分与整体层次的结构时，可以忽略组合对象与单个对象的不同，统一地使用组合结构中的所有对象时，就应该考虑用组合模式了。

## 优点

组合模式可以以层次结构清楚的定义复杂对象。让高层次忽略层次差异。

高层次可以使用统一的方法而不用担心它是枝干还是叶子。

组合模式可以形成复杂的树形结构，但对树形机构的控制却非常简单。

## 缺点

叶子类型不能控制。

## 结构图

## 思考

总公司，分公司都有HR部门，财政部门，总公司有多个分公司。

## 完整示例

### 抽象类

```java
Class PHA.YX.Design.Composite.Company Extends %RegisteredObject
{
Property name As %String;
Method %OnNew(name As %String) As %Status [ Private, ServerOnly = 1 ]
{
	s ..name = name
	Quit $$$OK
}
Method Add(c As Company)
{
}
Method Remove(index As %Integer)
{
}
Method Display(depth As %Integer)
{
}
Method LineOfDuty()
{
}
}
```

### 具体类

#### 树枝节点

```java
Class PHA.YX.Design.Composite.ConcreteCompany Extends Company
{
Property children As list Of Company;
Method Add(c As Company)
{
	d ..children.Insert(c)
}
Method Display(depth As %Integer)
{
	w depth _ "级" _ ..name,!
	f i = 1 : 1 : ..children.Size  d
	.d ..children.GetAt(i).Display(depth + 1)
}
Method LineOfDuty()
{
	f i = 1 : 1 : ..children.Size  d
	.d ..children.GetAt(i).LineOfDuty()
}
Method Remove(index As %Integer)
{
	d ..children.RemoveAt(index)
}
}
```

#### 树叶节点

```java
Class PHA.YX.Design.Composite.HRDepartment Extends Company
{
Method Add(c As Company)
{
}
Method Remove(index As %Integer)
{
}
Method Display(depth As %Integer)
{
	w depth _ "级" _ ..name,!
}
Method LineOfDuty()
{
	w ..name _ "员工招聘培训管理",!
}
}
```

```java
Class PHA.YX.Design.Composite.FinanceDepartment Extends Company
{
Method Add(c As Company)
{
}
Method Remove(index As %Integer)
{
}
Method Display(depth As %Integer)
{
	w depth _ "级" _ ..name,!
}
Method LineOfDuty()
{
	w ..name _ "公司财务收支管理",!
}
}
```

### 调用

```java
/// dclass(PHA.YX.Train.Progream).Composite()
ClassMethod Composite()
{
	#dim root as PHA.YX.Train.Composite.Company
	s root =class(PHA.YX.Train.Composite.ConcreteCompany).%New("北京总公司")
	d root.Add(##class(PHA.YX.Train.Composite.HRDepartment).%New("总公司人力资源"))
	d root.Add(##class(PHA.YX.Train.Composite.FinanceDepartment).%New("总公司财富部"))
	#dim comp as PHA.YX.Train.Composite.Company
	s comp =class(PHA.YX.Train.Composite.ConcreteCompany).%New("天津总公司")
	d comp.Add(##class(PHA.YX.Train.Composite.HRDepartment).%New("天津人力资源"))
	d comp.Add(##class(PHA.YX.Train.Composite.FinanceDepartment).%New("天津财富部"))
	d root.Add(comp)
	#dim comp1 as PHA.YX.Train.Composite.Company
	s comp1 =class(PHA.YX.Train.Composite.ConcreteCompany).%New("火星总公司")
	d comp1.Add(##class(PHA.YX.Train.Composite.HRDepartment).%New("火星人力资源"))
	d comp1.Add(##class(PHA.YX.Train.Composite.FinanceDepartment).%New("火星财富部"))
	d comp.Add(comp1)
	#dim comp2 as PHA.YX.Train.Composite.Company
	s comp2 =class(PHA.YX.Train.Composite.ConcreteCompany).%New("美国总公司")
	d comp2.Add(##class(PHA.YX.Train.Composite.HRDepartment).%New("美国人力资源"))
	d comp2.Add(##class(PHA.YX.Train.Composite.FinanceDepartment).%New("美国财富部"))
	d comp1.Add(comp2)
	w "结构图",!
	d root.Display(1)
	w "职责",!
	d root.LineOfDuty()
}
```

```java
DHC-APP>dclass(PHA.YX.Train.Progream).Composite()
结构图
1级北京总公司
2级总公司人力资源
2级总公司财富部
2级天津总公司
3级天津人力资源
3级天津财富部
3级火星总公司
4级火星人力资源
4级火星财富部
4级美国总公司
5级美国人力资源
5级美国财富部
职责
总公司人力资源员工招聘培训管理
总公司财富部公司财富收支管理
天津人力资源员工招聘培训管理
天津财富部公司财富收支管理
火星人力资源员工招聘培训管理
火星财富部公司财富收支管理
美国人力资源员工招聘培训管理
美国财富部公司财富收支管理
```

## 思考

画出本组产品线结构组织图。
