# 32、Kotlin 包(Package)
- 来源：https://ddkk.com/zhuanlan/java/kotlin/32.html
- 分类：Kotlin 教程
- 分组：教程目录
Kotlin 使用 **package** 关键字定义包，使用 **import** 关键字导入包

为了更好地组织类，**Kotlin** 提供了包机制，用于区别类名的命名空间

### Kotlin 包的作用

**1、** 把功能相似或相关的类或接口组织在同一个包中，方便类的查找和使用；

**2、** 如同文件夹一样，包也采用了树形目录的存储方式同一个包中的类名字是不同的，不同的包中的类的名字是可以相同的，当同时调用两个不同包中相同类名的类时，应该加上包名加以区别因此，包可以避免名字冲突；

**3、** 包也限定了访问权限，拥有包访问权限的类才能访问某个包中的类；

包（package）这种机制是为了防止命名冲突，访问控制，提供搜索和定位类（class）、接口、枚举（enumerations）和注释（annotation）等

## 创建包

使用 **package** 进行声明，但是包名和文件夹名可以不一致

```java
package a.b
```

## 导入包

使用import 导入一个包

```java
import foo.info
```

> 默认包 如果一个 kotlin 源文件中没有任何包声明，则其当中的代码均属于默认包，导入时包名即为函数名

```java
fun hello() {
    println("hello, Default Package")
}
import hello
hello()
```

### 导入别名

导入类时可以为类起一个别名

```java
import foo.bar as b
b.bar()
```

### Kotlin 作用域

访问标识符
说明

private
在声明范围及同模块的子作用域内可见

protected
类似 private，但是对子类也可见

internal
默认作用域，同模块中都可见

public
总是可见
