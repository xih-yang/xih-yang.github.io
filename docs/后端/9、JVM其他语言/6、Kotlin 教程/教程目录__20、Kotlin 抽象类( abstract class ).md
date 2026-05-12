# 20、Kotlin 抽象类( abstract class )
- 来源：https://ddkk.com/zhuanlan/java/kotlin/20.html
- 分类：Kotlin 教程
- 分组：教程目录
抽象是面向对象编程的特征之一，类本身，或类中的部分成员，都可以声明为abstract的

抽象成员在类中不存在具体的实现

Kotlin 支持抽象类

Kotlin 使用 abstract 关键字来定义抽象类

Kotlin 无需对抽象类或抽象成员标注 open 注解

```java
open class Base {
    open fun f() {}
}
abstract class Derived : Base() {
    override abstract fun f()
}
```
