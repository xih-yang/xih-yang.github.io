# 20、Drools 规则引擎 - CEP 的属性更改设置和监听器
- 来源：https://ddkk.com/zhuanlan/other/drools/1/20.html
- 分类：Drools 教程
- 分组：教程目录
#### 事实类型的属性更改设置和监听器

默认的，Drools不会为了事实类型，在每一次的规则触发时重新评估所有的事实模式，而是对会对受限制或者内部给定模式绑定的属性修改做出反应。例如，如果规则调用modify()作为规则操作的一部分，但是操作没有在KIE库中产生新的数据，Drools不会自动的重新评估所有事实模式，因为没有数据被修改。这种属性反应行为可以防止KIE库中的没必要的递归，并且可以让规则评估更有效率。这种行为也意味着，你不需要总是使用no-loop属性去防止无限递归。

你可以修改或者禁用这种属性反应行为，使用下面KnowledgeBuilderConfiguration 选项，然后在你的Java类或者DRL文件使用属性更改设置对属性反应按照需要进行调整：

- ALWAYS：（默认）所有类型都是属性反应，但是你可以取消某些指定类型的属性反应，使用@classReactivbe属性更改设置。
- ALLOWED：没有类型是属性反映的，但是你可以使用@propertyReactive属性设置为指定的类型开启属性反应。
- DISABLED：没有类型是属性反映的，所有的属性更改监听器都被忽略。

在KnowledgeBuilderConfiguration设置属性反应的例子

```java
KnowledgeBuilderConfiguration config = KnowledgeBuilderFactory.newKnowledgeBuilderConfiguration();
config.setOption(PropertySpecificOption.ALLOWED);
KnowledgeBuilder kbuilder = KnowledgeBuilderFactory.newKnowledgeBuilder(config);
```

或者，你可以更新在standalone.xml中的drools.propertySpecific系统属性

如下所示：

```java
<system-properties>
  ...
  <property name="drools.propertySpecific" value="ALLOWED"/>
  ...
</system-properties>
```

Drools支持下面的属性更改设置和监听器

@classReactive

如果属性反应设置时ALWAYS，这个标签可以禁用指定类或者声明的DRL事实类型的默认的属性反应行为。如果您希望Drools规则引擎在每次触发规则时重新评估指定事实类型的所有事实模式，而不是仅对在给定模式内约束或绑定的修改属性作出反应，则可以使用此标记。

DRL类型声明时禁用默认属性反应

```java
declare Person
  @classReactive
    firstName : String
    lastName : String
end
```

在Java类中禁用默认属性反应

```java
@classReactivepublic static class Person {
    private String firstName;
    private String lastName;
}
```

@propertyReactive

如果属性反应卑职成ALLOWED，你可以使用这个标签指定设置属性反应的类型

DRL类型声明启动属性反应（当反应被全局禁用）

```java
declare Person
  @propertyReactive
    firstName : String
    lastName : String
end
```

在Java类里面启用属性反应

```java
@propertyReactivepublic static class Person {
    private String firstName;
    private String lastName;
}
```

@watch

这个标签对额外属性启用属性反应，额外属性是在事实模式中指定的内联属性。这个标签只在设置为ALWAYS时有效，或者属性反应式ALLOWED时，相关事实类型使用了@propertyReactive标签。你可以在DRL规则中使用这个标签去添加或者移除指定属性。

默认参数：没有

支持的参数：属性名，*（代表所有），！（表示取反），！*（没有属性有属性反应）

```java
<factPattern> @watch ( <property> )
```

在实施模式中启用或者禁用属性反应

```java
// Listens for changes in both firstName (inferred) and lastName:
Person(firstName == $expectedFirstName) @watch( lastName )
// Listens for changes in all properties of the Person fact:
Person(firstName == $expectedFirstName) @watch( * )
// Listens for changes in lastName and explicitly excludes changes in firstName:
Person(firstName == $expectedFirstName) @watch( lastName, !firstName )
// Listens for changes in all properties of the Person fact except age:
Person(firstName == $expectedFirstName) @watch( , !age )
// Excludes changes in all properties of the Person fact (equivalent to using @classReactivity tag):
Person(firstName == $expectedFirstName) @watch( ! )
```

如果你在使用了@classReactive的事实类型上使用了@watch标签，或者在属性反应设置成ALLOWED时没有使用@propertyReactive标签，Drools会产生一个编译错误。如果你在监听器注解中重复属性，例如@watch（firstName，！firstName），也会产生编译错误。

@propertyChangeSupport

对于在JavaBeans规范中定义的支持属性更改的事实，这个标签启动对事实属性更改的监测。

在JavaBeans对象中声明属性更改支持：

```java
declare Person
    @propertyChangeSupport
end
```
