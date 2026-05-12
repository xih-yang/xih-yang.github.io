# 13、PHP设计模式 - 适配器模式
- 来源：https://ddkk.com/zhuanlan/design/php/13.html
- 分类：设计模式
- 分组：教程目录
### 适配器模式

适配器模式(Adapter Pattern) ：将一个接口转换成客户希望的另一个接口，适配器模式使接口不兼容的那些类可以一起工作，其别名为包装器(Wrapper)。适配器模式既可以作为类结构型模式，也可以作为对象结构型模式。

### 模式结构

适配器模式包含如下角色：

- Target：目标抽象类
- Adapter：适配器类
- Adaptee：适配者类

适配器模式有对象适配器和类适配器两种实现,但由于类适配器模式通过多重继承对一个接口与另一个接口进行匹配，而PHP并不支持多重继承（尽管可以同时通过继承类和接口的方式进行模拟多重继承），也就是一个类只有一个父类，所以我们这里实现的是对象适配器。

### 对象适配器：结构图

### PHP代码实现

```java
<?php
/**
 * 适配器模式
 */
//Target：目标抽象类
class Target
{
    public function Request(){
        var_dump('普通请求');
    }
}
//Adaptee：适配者类
class Adaptee
{
    public function SpecificRequest(){
        var_dump('特殊请求');
    }
}
//Adapter：适配器类
class Adapter extends Target
{
    public function __construct()
    {
        $this->adaptee=new Adaptee();
    }
    public function Request()
    {
        $this->adaptee->SpecificRequest();
    }
}
$a=new Adapter();
$a->Request();
```

### 运行结果

```java
string '特殊请求' (length=12)
```
