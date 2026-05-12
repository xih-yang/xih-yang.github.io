# 18、Flink 基础 - 支持的数据类型
- 来源：https://ddkk.com/zhuanlan/bigdata/flink/2/18.html
- 分类：大数据框架
- 分组：教程目录
## 一、Flink支持的数据类型

Flink流应用程序处理的是以数据对象表示的事件流。所以在Flink内部，我们需要能够处理这些对象。它们需要被序列化和反序列化，以便通过网络传送它们；或者从状态后端、检查点和保存点读取它们。为了有效地做到这一点，Flink需要明确知道应用程序所处理的数据类型。Flink使用类型信息的概念来表示数据类型，并为每个数据类型生成特定的序列化器、反序列化器和比较器。

Flink还具有一个类型提取系统，该系统分析函数的输入和返回类型，以自动获取类型信息，从而获得序列化器和反序列化器。但是，在某些情况下，例如lambda函数或泛型类型，需要显式地提供类型信息，才能使应用程序正常工作或提高其性能。

Flink支持Java和Scala中所有常见数据类型。使用最广泛的类型有以下几种。

## 1.1 基础数据类型

Flink支持所有的Java和Scala基础数据类型，Int, Double, Long, String, …

```java
DataStream<Integer> numberStream = env.fromElements(1, 2, 3, 4);
numberStream.map(data -> data * 2);
```

## 1.2 Java和Scala元组(Tuples)

java不像Scala天生支持元组Tuple类型，java的元组类型由Flink的包提供，默认提供Tuple0~Tuple25

```java
DataStream<Tuple2<String, Integer>> personStream = env.fromElements( 
  new Tuple2("Adam", 17), 
  new Tuple2("Sarah", 23) 
); 
personStream.filter(p -> p.f1 > 18);
```

## 1.3 Scala样例类(case classes)

```java
case class Person(name:String,age:Int)
val numbers: DataStream[(String,Integer)] = env.fromElements(
  Person("张三",12),
  Person("李四"，23)
)
```

## 1.4 Java简单对象(POJO)

java的POJO这里要求必须提供无参构造函数

成员变量要求都是public（或者private但是提供get、set方法）

```java
public class Person{
  public String name;
  public int age;
  public Person() {
     }
  public Person( String name , int age) {
    this.name = name;
    this.age = age;
  }
}
DataStream Pe rson > persons = env.fromElements(
  new Person (" Alex", 42),
  new Person (" Wendy",23)
);
```

## 1.5 其他(Arrays, Lists, Maps, Enums,等等)

Flink对Java和Scala中的一些特殊目的的类型也都是支持的，比如Java的ArrayList，HashMap，Enum等等。
