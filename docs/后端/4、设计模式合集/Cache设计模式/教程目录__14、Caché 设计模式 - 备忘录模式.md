# 14、Caché 设计模式 - 备忘录模式
- 来源：https://ddkk.com/zhuanlan/design/cache/14.html
- 分类：设计模式
- 分组：教程目录
## 定义

在不破坏封装性的前提下，捕获一个对象的内部状态，并在该对象之外保存这个状态。这样以后就可将该对象回复到原先保存的状态。

## 使用场景

备忘录模式比较适用于功能比较复杂的，但需要维护或记录属性历史的类，或者需要保存的属性只是众多属性中的一小部分时，Originator可以根据保存的Memento信息还原到前一状态。

如果在某个系统中使用命令模式时，需要实现命令的撤销功能，那么命令模式可以使用备忘录模式来储存可撤销操作的状态。

当角色的状态改变的时候，有可能在这个状态无效，这时候就可以使用暂时储存起来的备忘录将状态复原。

## 结构图

## 描述

玩游戏时，角色有体力值，攻击力，防御力。保存这些状态并恢复。

## 完整示例

### 角色类

```java
Class PHA.YX.Design.Memento.GameRole Extends %RegisteredObject
{
Property vitality As %Integer [ Private ];
Method vitalityGet() As %Integer [ ServerOnly = 1 ]
{
	Quit i%vitality
}
Method vitalitySet(Arg As %Integer) As %Status [ ServerOnly = 1 ]
{
	s i%vitality = Arg
	Quit $$$OK
}
Property attact As %Integer [ Private ];
Method attactGet() As %Integer [ ServerOnly = 1 ]
{
	Quit i%attact
}
Method attactSet(Arg As %Integer) As %Status [ ServerOnly = 1 ]
{
	s i%attact = Arg
	Quit $$$OK
}
Property defense As %Integer [ Private ];
Method defenseGet() As %Integer [ ServerOnly = 1 ]
{
	Quit i%defense
}
Method defenseSet(Arg As %Integer) As %Status [ ServerOnly = 1 ]
{
	s i%defense = Arg
	Quit $$$OK
}
Method StateDisplay()
{
	w "当前角色状态：",!
	w "体力：" _ ..vitalityGet(),!
	w "攻击力：" _ ..attactGet(),!
	w "防御力：" _ ..defenseGet(),!
	w "",!
}
Method GetInitState()
{
	s ..vitality = 100
	s ..attact = 100
	s ..defense = 100
}
Method Fight()
{
	s ..vitality = 0
	s ..attact = 0
	s ..defense = 0
}
Method SaveState() As RoleStateMemento
{
	qclass(RoleStateMemento).%New(..vitality, ..attact, ..defense)
}
Method RecoveryState(memento As RoleStateMemento)
{
	s ..vitality = memento.vitalityGet()
	s ..attact = memento.attactGet()
	s ..defense = memento.defenseGet()
}
}
```

### 储存类

```java
Class PHA.YX.Design.Memento.RoleStateMemento Extends %RegisteredObject
{
Property vitality As %Integer [ Private ];
Method vitalityGet() As %Integer [ ServerOnly = 1 ]
{
	Quit i%vitality
}
Method vitalitySet(Arg As %Integer) As %Status [ ServerOnly = 1 ]
{
	s i%vitality = Arg
	Quit $$$OK
}
Property attact As %Integer [ Private ];
Method attactGet() As %Integer [ ServerOnly = 1 ]
{
	Quit i%attact
}
Method attactSet(Arg As %Integer) As %Status [ ServerOnly = 1 ]
{
	s i%attact = Arg
	Quit $$$OK
}
Property defense As %Integer [ Private ];
Method defenseGet() As %Integer [ ServerOnly = 1 ]
{
	Quit i%defense
}
Method defenseSet(Arg As %Integer) As %Status [ ServerOnly = 1 ]
{
	s i%defense = Arg
	Quit $$$OK
}
Method %OnNew(vitality, attact, defense) As %Status [ Private, ServerOnly = 1 ]
{
	s ..vitality = vitality
	s ..attact = attact
	s ..defense = defense
	Quit $$$OK
}
}
```

### 管理类

```java
Class PHA.YX.Design.Memento.RoleStateCaretaker Extends %RegisteredObject
{
Property memento As RoleStateMemento [ Private ];
Method mementoGet() As RoleStateMemento [ ServerOnly = 1 ]
{
	Quit i%memento
}
Method mementoSet(Arg As RoleStateMemento) As %Status [ ServerOnly = 1 ]
{
	s i%memento = Arg
	Quit $$$OK
}
}
```

### 调用

```java
/// dclass(PHA.YX.Design.Program).Memento() 
ClassMethod Memento()
{
	/*进入游戏*/
	#dim yx as PHA.YX.Design.Memento.GameRole
	s yx =class(PHA.YX.Design.Memento.GameRole).%New()
	d yx.GetInitState()
	d yx.StateDisplay()
	/*保存进度*/
	#dim state as PHA.YX.Design.Memento.RoleStateCaretaker
	s state =class(PHA.YX.Design.Memento.RoleStateCaretaker).%New()
	d state.mementoSet(yx.SaveState())
	/*大战BOSS，损耗严重*/
	d yx.Fight()
	d yx.StateDisplay()
	/*恢复之前状态*/
	d yx.RecoveryState(state.mementoGet())
	d yx.StateDisplay()
}
```

```java
DHC-APP>dclass(PHA.YX.Design.Program).Memento()
当前角色状态：
体力：100
攻击力：100
防御力：100
当前角色状态：
体力：0
攻击力：0
防御力：0
当前角色状态：
体力：100
攻击力：100
防御力：100
```

## 思考

记录听歌时的状态（歌曲名称，百分比，播放模式）。感兴趣的同学实现后可以发我一起参考下。
