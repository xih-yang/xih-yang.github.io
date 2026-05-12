# 02、JDK 17 新特性：密封类（Sealed Classes）JEP 409 基础：限制类继承的精确控制
- 来源：https://ddkk.com/zhuanlan/java/java17/2.html
- 分类：JDK 17 新特性
- 分组：教程目录
- 日期：2025-11-28
搞 Java 开发这么多年，鹏磊最烦的就是类继承这事儿。你写个基类，本来想着就几个子类用用，结果不知道哪个哥们儿又继承了一个，搞得代码越来越乱，维护起来贼麻烦。JDK 17 的密封类（Sealed Classes）终于解决了这个问题，让你能精确控制哪些类可以继承你的类，这玩意儿用起来是真香。

密封类是 JEP 409 引入的特性，允许你明确指定哪些类可以继承或实现特定的类或接口。这就像给类加了一把锁，只有你授权的子类才能继承，其他的想继承？门儿都没有。这样设计 API 的时候就能更好地控制类的层次结构，避免意外的继承。

## 密封类的基本语法

定义一个密封类很简单，用 `sealed` 关键字，然后用 `permits` 指定允许的子类：

```java
// 定义一个密封类 Shape，只允许 Circle 和 Rectangle 继承
public sealed class Shape permits Circle, Rectangle {
    // Shape 的基础实现
    protected double area() {
        return 0.0;  // 默认实现，子类可以覆盖
    }
}
// Circle 必须声明为 final、sealed 或 non-sealed
public final class Circle extends Shape {
    private final double radius;  // 半径
    public Circle(double radius) {
        this.radius = radius;  // 初始化半径
    }
    @Override
    public double area() {
        return Math.PI * radius * radius;  // 计算圆的面积
    }
}
// Rectangle 也必须是 final、sealed 或 non-sealed
public final class Rectangle extends Shape {
    private final double width, height;  // 宽度和高度
    public Rectangle(double width, double height) {
        this.width = width;  // 初始化宽度
        this.height = height;  // 初始化高度
    }
    @Override
    public double area() {
        return width * height;  // 计算矩形的面积
    }
}
```

看，就这么简单。`sealed` 关键字告诉编译器这个类是密封的，`permits` 后面跟着允许的子类列表。子类必须声明为 `final`、`sealed` 或 `non-sealed`，不能啥都不写。

## 子类的三种类型

密封类的子类有三种类型，每种有不同的含义：

### final 子类

`final` 子类是最常见的，表示这个类不能再被继承了，是继承链的终点：

```java
public sealed class Animal permits Dog, Cat {
    // Animal 的基础实现
}
public final class Dog extends Animal {
    // Dog 是最终类，不能再被继承
    public void bark() {
        System.out.println("汪汪汪");  // 狗叫的方法
    }
}
public final class Cat extends Animal {
    // Cat 也是最终类
    public void meow() {
        System.out.println("喵喵喵");  // 猫叫的方法
    }
}
```

### sealed 子类

`sealed` 子类表示这个类也是密封的，可以继续限制它的子类：

```java
// 第一层密封类
public sealed class Vehicle permits Car, Truck {
    // Vehicle 的基础实现
}
// Car 也是密封的，可以继续限制子类
public sealed class Car extends Vehicle permits Sedan, SUV {
    // Car 的基础实现
}
// Sedan 是最终类
public final class Sedan extends Car {
    // Sedan 的实现
}
// SUV 也是最终类
public final class SUV extends Car {
    // SUV 的实现
}
// Truck 是最终类
public final class Truck extends Vehicle {
    // Truck 的实现
}
```

这样就能构建多层次的密封类层次结构，每一层都能精确控制。

### non-sealed 子类

`non-sealed` 子类表示这个类不再密封，任何类都可以继承它：

```java
public sealed class Expression permits Constant, Variable, Operation {
    // Expression 的基础实现
}
// Constant 是最终类
public final class Constant extends Expression {
    private final double value;  // 常量的值
    public Constant(double value) {
        this.value = value;  // 初始化值
    }
}
// Variable 也是最终类
public final class Variable extends Expression {
    private final String name;  // 变量名
    public Variable(String name) {
        this.name = name;  // 初始化变量名
    }
}
// Operation 是非密封的，可以继续被继承
public non-sealed class Operation extends Expression {
    // Operation 的实现，可以被其他类继承
}
// 现在可以继承 Operation 了
public class Addition extends Operation {
    // Addition 的实现
}
public class Multiplication extends Operation {
    // Multiplication 的实现
}
```

`non-sealed` 用得不多，但有些场景确实需要，比如你想让某个分支可以自由扩展。

## 密封接口

接口也可以密封，语法和类一样：

```java
// 定义一个密封接口
public sealed interface Result<T> permits Success, Failure {
    // Result 的基础方法
}
// Success 是记录类（record），实现了 Result
public record Success<T>(T value) implements Result<T> {
    // Success 的实现，record 自动生成构造方法和访问器
}
// Failure 也是记录类
public record Failure<T>(Throwable error) implements Result<T> {
    // Failure 的实现，包含错误信息
}
```

密封接口配合记录类用起来特别爽，代码简洁，类型安全。

## 实际应用场景

### 场景一：状态机

状态机是密封类的典型应用场景，每个状态都是固定的，不允许随意添加：

```java
// 定义订单状态为密封类
public sealed class OrderState permits Pending, Processing, Shipped, Delivered, Cancelled {
    // OrderState 的基础方法
    public abstract String getStatus();  // 获取状态描述
}
// 待处理状态
public final class Pending extends OrderState {
    @Override
    public String getStatus() {
        return "待处理";  // 返回状态描述
    }
}
// 处理中状态
public final class Processing extends OrderState {
    @Override
    public String getStatus() {
        return "处理中";  // 返回状态描述
    }
}
// 已发货状态
public final class Shipped extends OrderState {
    @Override
    public String getStatus() {
        return "已发货";  // 返回状态描述
    }
}
// 已送达状态
public final class Delivered extends OrderState {
    @Override
    public String getStatus() {
        return "已送达";  // 返回状态描述
    }
}
// 已取消状态
public final class Cancelled extends OrderState {
    @Override
    public String getStatus() {
        return "已取消";  // 返回状态描述
    }
}
```

这样设计的好处是状态是固定的，不会有人随意添加新状态，代码更安全。

### 场景二：表达式树

表达式树也是密封类的经典应用：

```java
// 定义表达式为密封类
public sealed class Expr permits Literal, Variable, Add, Multiply {
    // Expr 的基础方法
}
// 字面量表达式
public final class Literal extends Expr {
    private final int value;  // 字面量的值
    public Literal(int value) {
        this.value = value;  // 初始化值
    }
    public int getValue() {
        return value;  // 获取值
    }
}
// 变量表达式
public final class Variable extends Expr {
    private final String name;  // 变量名
    public Variable(String name) {
        this.name = name;  // 初始化变量名
    }
    public String getName() {
        return name;  // 获取变量名
    }
}
// 加法表达式
public final class Add extends Expr {
    private final Expr left, right;  // 左右操作数
    public Add(Expr left, Expr right) {
        this.left = left;  // 初始化左操作数
        this.right = right;  // 初始化右操作数
    }
    public Expr getLeft() {
        return left;  // 获取左操作数
    }
    public Expr getRight() {
        return right;  // 获取右操作数
    }
}
// 乘法表达式
public final class Multiply extends Expr {
    private final Expr left, right;  // 左右操作数
    public Multiply(Expr left, Expr right) {
        this.left = left;  // 初始化左操作数
        this.right = right;  // 初始化右操作数
    }
    public Expr getLeft() {
        return left;  // 获取左操作数
    }
    public Expr getRight() {
        return right;  // 获取右操作数
    }
}
```

配合模式匹配，处理表达式树特别方便，后面会详细讲。

## 反射 API

JDK 17 还提供了反射 API 来检查密封类：

```java
// 检查类是否是密封的
if (Shape.class.isSealed()) {
    System.out.println("Shape 是密封类");  // 输出确认信息
}
// 获取允许的子类
Class<?>[] permittedSubclasses = Shape.class.getPermittedSubclasses();
for (Class<?> subclass : permittedSubclasses) {
    System.out.println("允许的子类: " + subclass.getName());  // 打印子类名
}
```

这些 API 在运行时检查密封类信息很有用。

## 注意事项和最佳实践

### 注意事项

1. **子类必须在同一模块或包中**：密封类和它的子类必须在同一个模块中，或者如果不在模块中，必须在同一个包中。这是编译器的限制。
2. **子类必须显式声明**：子类必须明确声明为 `final`、`sealed` 或 `non-sealed`，不能省略。
3. **permits 列表必须完整**：`permits` 后面必须列出所有直接子类，不能遗漏。

### 最佳实践

1. **优先使用 final**：如果子类不需要再被继承，优先使用 `final`，这样最清晰。
2. **合理使用 sealed**：如果某个子类也需要限制继承，使用 `sealed` 构建层次结构。
3. **谨慎使用 non-sealed**：`non-sealed` 会打破密封性，除非确实需要，否则不要用。
4. **配合模式匹配**：密封类配合 switch 模式匹配用起来特别爽，类型安全，代码简洁。
5. **文档说明**：在类的 JavaDoc 中说明为什么这个类是密封的，帮助其他开发者理解设计意图。

## 总结

密封类是 JDK 17 的一个重磅特性，让你能精确控制类的继承层次。用起来简单，但能解决很多实际问题。特别是设计 API 的时候，能避免意外的继承，让代码更安全、更易维护。

配合模式匹配用起来更爽，下一篇文章咱就聊聊模式匹配，看看怎么和密封类配合使用。兄弟们有啥问题随时问，鹏磊会尽量解答。
