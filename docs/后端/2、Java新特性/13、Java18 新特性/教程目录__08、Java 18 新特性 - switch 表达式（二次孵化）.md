# 08、Java 18 新特性 - switch 表达式（二次孵化）
- 来源：https://ddkk.com/zhuanlan/java/java18/8.html
- 分类：Java 18 新特性
- 分组：教程目录
从Java 17 开始，对于 Switch 的改进就已经在进行了，Java 17 的 JEP 406 已经对 Switch 表达式进行了增强，使之可以减少代码量。

下面是几个例子：

```java
// JDK 17 以前
static String formatter(Object o) {
    String formatted = "unknown";
    if (o instanceof Integer i) {
        formatted = String.format("int %d", i);
    } else if (o instanceof Long l) {
        formatted = String.format("long %d", l);
    } else if (o instanceof Double d) {
        formatted = String.format("double %f", d);
    } else if (o instanceof String s) {
        formatted = String.format("String %s", s);
    }
    return formatted;
}
```

而在Java 17 之后，可以通过下面的写法进行改进：

```java
// JDK 17 之后
static String formatterPatternSwitch(Object o) {
    return switch (o) {
        case Integer i -> String.format("int %d", i);
        case Long l    -> String.format("long %d", l);
        case Double d  -> String.format("double %f", d);
        case String s  -> String.format("String %s", s);
        default        -> o.toString();
    };
}
```

switch 可以和 `null` 进行结合判断：

```java
static void testFooBar(String s) {
    switch (s) {
        case null         -> System.out.println("Oops");
        case "Foo", "Bar" -> System.out.println("Great");
        default           -> System.out.println("Ok");
    }
}
```

case 时可以加入复杂表达式：

```java
static void testTriangle(Shape s) {
    switch (s) {
        case Triangle t && (t.calculateArea() > 100) ->
            System.out.println("Large triangle");
        default ->
            System.out.println("A shape, possibly a small triangle");
    }
}
```

case 时可以进行类型判断：

```java
sealed interface S permits A, B, C {
     }
final class A implements S {
     }
final class B implements S {
     }
record C(int i) implements S {
     }  // Implicitly final
static int testSealedExhaustive(S s) {
    return switch (s) {
        case A a -> 1;
        case B b -> 2;
        case C c -> 3;
    };
}
```
