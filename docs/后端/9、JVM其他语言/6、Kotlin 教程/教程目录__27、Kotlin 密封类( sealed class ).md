# 27、Kotlin 密封类( sealed class )
- 来源：https://ddkk.com/zhuanlan/java/kotlin/27.html
- 分类：Kotlin 教程
- 分组：教程目录
Kotlin 使用 **sealed class** 关键字创建一个密封类

Kotlin 密封类用来表示受限的类继承结构：当一个值为有限集中的类型, 而不能有任何其他类型时

在某种意义上，它们是枚举类的扩展：枚举类型的值集合 也是受限的，但每个枚举常量只存在一个实例，而密封类 的一个子类可以有可包含状态的多个实例

声明一个密封类，使用 **sealed** 修饰类，密封类可以有子类，但是所有的子类都必须要内嵌在密封类中

sealed 关键字不能修饰 interface ,abstract class(会报 warning,但是不会出现编译错误)

```java
sealed class Expr
data class Const(val number: Double) : Expr()
data class Sum(val e1: Expr, val e2: Expr) : Expr()
object NotANumber : Expr()
fun eval(expr: Expr): Double = when (expr) {
    is Const -> expr.number
    is Sum -> eval(expr.e1) + eval(expr.e2)
    NotANumber -> Double.NaN
}
```

使用密封类的关键好处在于使用 when 表达式的时候，如果能够 验证语句覆盖了所有情况，就不需要为该语句再添加一个 else 子句了

```java
fun eval(expr: Expr): Double = when(expr) {
    is Expr.Const -> expr.number
    is Expr.Sum -> eval(expr.e1) + eval(expr.e2)
    Expr.NotANumber -> Double.NaN
    // 不再需要 else 子句，因为我们已经覆盖了所有的情况
}
```
