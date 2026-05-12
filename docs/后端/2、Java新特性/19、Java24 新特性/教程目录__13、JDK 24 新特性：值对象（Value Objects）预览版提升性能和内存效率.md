# 13、JDK 24 新特性：值对象（Value Objects）预览版提升性能和内存效率
- 来源：https://ddkk.com/zhuanlan/java/java24/13.html
- 分类：JDK 24 新特性
- 分组：教程目录
- 日期：2025-11-27
写Java代码的时候，最头疼的就是内存占用问题了。特别是那种需要创建大量小对象的场景，比如坐标点、颜色值、金额这些，每个对象都要在堆上分配内存，对象头还要占不少空间，内存开销大得不行。鹏磊我之前写过一个图形处理的应用，每秒要创建几万个Point对象，内存占用蹭蹭往上涨，GC压力也大，性能一直上不去。

现在好了，JDK 24终于引入了值对象（Value Objects）这个预览特性，虽然还在完善阶段，但已经能解决不少问题了。值对象是不可变的、无身份的对象，内存占用更小，性能也更好，特别适合那种需要大量小对象的场景。兄弟们别磨叽，咱这就开始整活，把这个特性给整明白。

## 什么是值对象

先说说啥是值对象。值对象（Value Objects）是JDK 24引入的一个预览特性，用来创建轻量级的、不可变的对象。它和传统的Java对象不一样，值对象没有身份（Identity），只有值（Value），所以JVM可以在内存布局和垃圾回收方面做优化，提升性能和内存效率。

值对象的核心思想是：消除对象的身份特性，让对象只表示数据本身，不关心对象在内存里的位置。这样JVM就可以把值对象当成原始类型（primitive types）那样处理，内存占用更小，访问效率更高。

以前创建一个简单的数据对象，得这么写：

```java
// 老写法，用普通类
public class Point {
    private final int x;  // x坐标
    private final int y;  // y坐标
    public Point(int x, int y) {
        this.x = x;
        this.y = y;
    }
    public int getX() { return x; }
    public int getY() { return y; }
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;  // 身份比较
        if (o == null || getClass() != o.getClass()) return false;
        Point point = (Point) o;
        return x == point.x && y == point.y;  // 值比较
    }
    @Override
    public int hashCode() {
        return Objects.hash(x, y);
    }
}
// 使用
Point p1 = new Point(10, 20);  // 在堆上分配内存
Point p2 = new Point(10, 20);  // 又分配一块内存
System.out.println(p1 == p2);  // false，身份不同
System.out.println(p1.equals(p2));  // true，值相同
```

现在用值对象，直接就能这么写：

```java
// 新写法，用值对象（原始类）
public primitive class Point {
    private final int x;  // x坐标
    private final int y;  // y坐标
    public Point(int x, int y) {
        this.x = x;
        this.y = y;
    }
    public int getX() { return x; }
    public int getY() { return y; }
}
// 使用
Point p1 = new Point(10, 20);  // 值对象，内存占用更小
Point p2 = new Point(10, 20);  // 值对象
System.out.println(p1 == p2);  // true，值相同就相等
System.out.println(p1.equals(p2));  // true，值比较
```

是不是清爽多了？值对象没有身份，只有值，所以值相同就相等，不用再写那些`equals()`和`hashCode()`的破事了。而且内存占用更小，性能也更好。

## 值对象的核心特性

值对象有几个核心特性，咱一个个来看。

### 1. 无身份性（Identity-less）

值对象没有身份，只有值。这意味着两个值对象如果值相同，它们就是相等的，不用关心对象在内存里的位置。

```java
// 值对象无身份性示例
public primitive class Money {
    private final double amount;  // 金额
    private final String currency;  // 货币
    public Money(double amount, String currency) {
        this.amount = amount;
        this.currency = currency;
    }
    public double getAmount() { return amount; }
    public String getCurrency() { return currency; }
}
// 使用
Money m1 = new Money(100.0, "CNY");  // 创建值对象
Money m2 = new Money(100.0, "CNY");  // 创建另一个值对象
// 值对象比较的是值，不是身份
System.out.println(m1 == m2);  // true，值相同就相等
System.out.println(m1.equals(m2));  // true，值比较
```

### 2. 不可变性（Immutability）

值对象是不可变的，一旦创建就不能修改。这保证了值对象的值不会改变，可以安全地共享和传递。

```java
// 值对象不可变性示例
public primitive class Color {
    private final int red;  // 红色分量
    private final int green;  // 绿色分量
    private final int blue;  // 蓝色分量
    public Color(int red, int green, int blue) {
        this.red = red;
        this.green = green;
        this.blue = blue;
    }
    public int getRed() { return red; }
    public int getGreen() { return green; }
    public int getBlue() { return blue; }
    // 值对象不能有setter方法，因为是不可变的
    // public void setRed(int red) { this.red = red; }  // 编译错误！
}
// 使用
Color c1 = new Color(255, 0, 0);  // 红色
// c1.setRed(128);  // 编译错误！值对象不可变
```

### 3. 内存效率（Memory Efficiency）

值对象的内存占用更小，因为JVM可以把值对象当成原始类型那样处理，不需要对象头，也不需要身份信息。

```java
// 值对象内存效率示例
public primitive class Complex {
    private final double real;  // 实部
    private final double imag;  // 虚部
    public Complex(double real, double imag) {
        this.real = real;
        this.imag = imag;
    }
    public double getReal() { return real; }
    public double getImag() { return imag; }
}
// 创建大量值对象，内存占用更小
List<Complex> numbers = new ArrayList<>();
for (int i = 0; i < 1000000; i++) {
    numbers.add(new Complex(i, i * 2));  // 值对象，内存占用小
}
// 相比普通对象，内存占用能减少30-50%
```

## 如何定义值对象

定义值对象很简单，就是在类声明前加上`primitive`关键字。

### 基本语法

```java
// 基本语法：primitive class
public primitive class Point {
    private final int x;
    private final int y;
    public Point(int x, int y) {
        this.x = x;
        this.y = y;
    }
    public int getX() { return x; }
    public int getY() { return y; }
}
```

### 值对象的限制

值对象有一些限制，主要是为了保证不可变性和无身份性：

1. **所有字段必须是final**：保证不可变性
2. **不能继承其他类**：值对象不能有父类
3. **不能实现某些接口**：比如`Cloneable`、`Serializable`等
4. **不能有身份相关的方法**：比如`==`比较的是值，不是身份

```java
// 值对象的限制示例
public primitive class Example {
    private final int value;
    // private int mutable;  // 编译错误！字段必须是final
    public Example(int value) {
        this.value = value;
    }
    // 值对象不能继承其他类
    // public primitive class Child extends Example { }  // 编译错误！
    // 值对象不能实现某些接口
    // public primitive class SerializableExample implements Serializable { }  // 可能不支持
}
```

## 值对象的使用场景

值对象适合哪些场景呢？鹏磊我觉得主要有这么几类：

### 场景1：数学计算

数学计算里经常要用到坐标、向量、复数这些，值对象特别适合：

```java
// 数学计算场景
public primitive class Vector2D {
    private final double x;
    private final double y;
    public Vector2D(double x, double y) {
        this.x = x;
        this.y = y;
    }
    public double getX() { return x; }
    public double getY() { return y; }
    // 向量加法
    public Vector2D add(Vector2D other) {
        return new Vector2D(x + other.x, y + other.y);
    }
    // 向量减法
    public Vector2D subtract(Vector2D other) {
        return new Vector2D(x - other.x, y - other.y);
    }
    // 向量点积
    public double dot(Vector2D other) {
        return x * other.x + y * other.y;
    }
}
// 使用
Vector2D v1 = new Vector2D(1.0, 2.0);
Vector2D v2 = new Vector2D(3.0, 4.0);
Vector2D sum = v1.add(v2);  // 值对象，内存占用小
double dot = v1.dot(v2);  // 计算点积
```

### 场景2：金融计算

金融计算里经常要用到金额、汇率这些，值对象能保证数据的一致性和安全性：

```java
// 金融计算场景
public primitive class Money {
    private final long amount;  // 金额（以分为单位，避免浮点数精度问题）
    private final String currency;  // 货币代码
    public Money(long amount, String currency) {
        this.amount = amount;
        this.currency = currency;
    }
    public long getAmount() { return amount; }
    public String getCurrency() { return currency; }
    // 金额加法（同货币）
    public Money add(Money other) {
        if (!currency.equals(other.currency)) {
            throw new IllegalArgumentException("货币不一致");
        }
        return new Money(amount + other.amount, currency);
    }
    // 金额乘法
    public Money multiply(double factor) {
        return new Money((long)(amount * factor), currency);
    }
}
// 使用
Money m1 = new Money(10000, "CNY");  // 100元
Money m2 = new Money(5000, "CNY");  // 50元
Money total = m1.add(m2);  // 150元
```

### 场景3：图形处理

图形处理里经常要用到颜色、坐标、矩形这些，值对象能提升性能：

```java
// 图形处理场景
public primitive class Color {
    private final int red;
    private final int green;
    private final int blue;
    private final int alpha;
    public Color(int red, int green, int blue, int alpha) {
        this.red = red;
        this.green = green;
        this.blue = blue;
        this.alpha = alpha;
    }
    public int getRed() { return red; }
    public int getGreen() { return green; }
    public int getBlue() { return blue; }
    public int getAlpha() { return alpha; }
    // 颜色混合
    public Color blend(Color other) {
        double ratio = alpha / 255.0;
        int r = (int)(red * ratio + other.red * (1 - ratio));
        int g = (int)(green * ratio + other.green * (1 - ratio));
        int b = (int)(blue * ratio + other.blue * (1 - ratio));
        return new Color(r, g, b, Math.max(alpha, other.alpha));
    }
}
// 使用
Color red = new Color(255, 0, 0, 255);
Color blue = new Color(0, 0, 255, 255);
Color purple = red.blend(blue);  // 混合颜色
```

### 场景4：配置和元数据

配置和元数据也可以用值对象，保证不可变性：

```java
// 配置场景
public primitive class DatabaseConfig {
    private final String host;
    private final int port;
    private final String database;
    private final String username;
    public DatabaseConfig(String host, int port, String database, String username) {
        this.host = host;
        this.port = port;
        this.database = database;
        this.username = username;
    }
    public String getHost() { return host; }
    public int getPort() { return port; }
    public String getDatabase() { return database; }
    public String getUsername() { return username; }
}
// 使用
DatabaseConfig config = new DatabaseConfig("localhost", 3306, "mydb", "user");
// config是不可变的，可以安全地共享
```

## 值对象与普通对象的对比

值对象和普通对象有啥区别？咱来看看：

### 内存占用对比

值对象的内存占用更小，因为不需要对象头和身份信息：

```java
// 普通对象
public class Point {
    private final int x;
    private final int y;
    // 对象头：12-16字节
    // x字段：4字节
    // y字段：4字节
    // 总计：20-24字节
}
// 值对象
public primitive class Point {
    private final int x;
    private final int y;
    // 不需要对象头
    // x字段：4字节
    // y字段：4字节
    // 总计：8字节（可能更小）
}
```

### 性能对比

值对象的性能更好，因为：

1. 内存占用小，缓存命中率高
2. 不需要GC标记，GC压力小
3. 值比较比身份比较快

```java
// 性能测试示例
long start1 = System.nanoTime();
List<Point> points1 = new ArrayList<>();
for (int i = 0; i < 1000000; i++) {
    points1.add(new Point(i, i * 2));  // 普通对象
}
long end1 = System.nanoTime();
long start2 = System.nanoTime();
List<PointValue> points2 = new ArrayList<>();
for (int i = 0; i < 1000000; i++) {
    points2.add(new PointValue(i, i * 2));  // 值对象
}
long end2 = System.nanoTime();
// 值对象的创建和访问通常更快
```

### 相等性比较

值对象的相等性比较更直观，值相同就相等：

```java
// 普通对象
Point p1 = new Point(10, 20);
Point p2 = new Point(10, 20);
System.out.println(p1 == p2);  // false，身份不同
System.out.println(p1.equals(p2));  // true，需要实现equals方法
// 值对象
PointValue pv1 = new PointValue(10, 20);
PointValue pv2 = new PointValue(10, 20);
System.out.println(pv1 == pv2);  // true，值相同就相等
System.out.println(pv1.equals(pv2));  // true，自动值比较
```

## 值对象的限制和注意事项

用值对象的时候，有几个地方需要注意。

### 不能有可变字段

值对象的所有字段必须是final，保证不可变性：

```java
// 错误示例
public primitive class BadExample {
    private int value;  // 编译错误！字段必须是final
    public BadExample(int value) {
        this.value = value;
    }
}
// 正确示例
public primitive class GoodExample {
    private final int value;  // 必须是final
    public GoodExample(int value) {
        this.value = value;
    }
}
```

### 不能继承其他类

值对象不能继承其他类，但可以实现接口：

```java
// 错误示例
public class BaseClass { }
public primitive class Child extends BaseClass { }  // 编译错误！
// 正确示例
public interface Drawable {
    void draw();
}
public primitive class Point implements Drawable {
    private final int x;
    private final int y;
    public Point(int x, int y) {
        this.x = x;
        this.y = y;
    }
    @Override
    public void draw() {
        // 绘制逻辑
    }
}
```

### 不能有身份相关操作

值对象没有身份，所以不能做身份相关的操作：

```java
// 值对象示例
PointValue p1 = new PointValue(10, 20);
PointValue p2 = new PointValue(10, 20);
// 值对象比较的是值，不是身份
System.out.println(p1 == p2);  // true，值相同就相等
// 不能做身份相关的操作
// System.identityHashCode(p1);  // 可能不支持或返回相同值
```

## 预览特性说明

值对象在JDK 24中还是预览特性，需要启用预览功能才能用。

### 编译时启用预览

编译的时候需要加`--enable-preview`参数：

```bash
# 编译时启用预览特性
javac --enable-preview --release 24 Point.java
```

### 运行时启用预览

运行的时候也需要加`--enable-preview`参数：

```bash
# 运行时启用预览特性
java --enable-preview Main
```

### Maven配置

如果用Maven，需要在`pom.xml`里配置：

```xml
<build>
    <plugins>
        <plugin>
            <groupId>org.apache.maven.plugins</groupId>
            <artifactId>maven-compiler-plugin</artifactId>
            <version>3.11.0</version>
            <configuration>
                <source>24</source>
                <target>24</target>
                <compilerArgs>
                    <arg>--enable-preview</arg>
                </compilerArgs>
            </configuration>
        </plugin>
    </plugins>
</build>
```

## 最佳实践

用值对象的时候，有几个最佳实践：

### 1. 适合小对象

值对象适合那种字段不多、数据量不大的小对象：

```java
// 适合：小对象
public primitive class Point {
    private final int x;
    private final int y;
}
// 不适合：大对象
public primitive class LargeObject {
    private final String field1;
    private final String field2;
    // ... 很多字段
    // 值对象适合小对象，大对象可能不适合
}
```

### 2. 保证不可变性

值对象必须是不可变的，所有字段都应该是final：

```java
// 正确：不可变
public primitive class Money {
    private final long amount;
    private final String currency;
}
// 错误：可变
public primitive class BadMoney {
    private long amount;  // 编译错误！
    private String currency;  // 编译错误！
}
```

### 3. 值语义优先

值对象应该表示值语义，而不是实体语义：

```java
// 适合：值语义
public primitive class Money { }  // 金额是值
public primitive class Color { }  // 颜色是值
public primitive class Point { }  // 坐标是值
// 不适合：实体语义
// public primitive class User { }  // 用户是实体，有身份
// public primitive class Order { }  // 订单是实体，有身份
```

## 总结

值对象是JDK 24引入的一个很实用的预览特性，虽然还在完善阶段，但已经能解决不少内存和性能的问题了。它让代码更简洁、更高效，特别适合那种需要大量小对象的场景。

主要优势：

1. **内存效率高**：不需要对象头，内存占用更小
2. **性能更好**：缓存命中率高，GC压力小
3. **语义清晰**：值相同就相等，逻辑更直观
4. **不可变**：保证数据安全性

适用场景：

- 数学计算（坐标、向量、复数）
- 金融计算（金额、汇率）
- 图形处理（颜色、坐标、矩形）
- 配置和元数据

虽然还是预览特性，但已经能看到Java在朝着更高效的方向发展了。兄弟们可以试试，特别是那些需要大量小对象的场景，用起来确实方便。等正式发布后，肯定会成为Java开发的标准做法。
