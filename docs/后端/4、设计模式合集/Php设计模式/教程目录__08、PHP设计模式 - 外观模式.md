# 08、PHP设计模式 - 外观模式
- 来源：https://ddkk.com/zhuanlan/design/php/8.html
- 分类：设计模式
- 分组：教程目录
### 外观模式

外观模式(Facade Pattern)：外部与一个子系统的通信必须通过一个统一的外观对象进行，为子系统中的一组接口提供一个一致的界面，外观模式定义了一个高层接口，这个接口使得这一子系统更加容易使用。外观模式又称为门面模式，它是一种对象结构型模式。

### 模式结构

外观模式包含如下角色：

- Facade: 外观角色
- SubSystem:子系统角色

### 结构图

### PHP代码实现

```java
<?php
/**
 * 外观模式
 */
//SubSystem:子系统角色
class SubSystemOne
{
    public function MethodOne(){
        var_dump('子系统方法一');
    }
}
class SubSystemTwo
{
    public function MethodTwo(){
        var_dump('子系统方法二');
    }
}
class SubSystemThree
{
    public function MethodThree(){
        var_dump('子系统方法三');
    }
}
class SubSystemFour
{
    public function MethodFour(){
        var_dump('子系统方法四');
    }
}
//Facade: 外观角色
class Facade
{
    public function __construct(){
        $this->one=new SubSystemOne();
        $this->two=new SubSystemTwo();
        $this->three=new SubSystemThree();
        $this->four=new SubSystemFour();
    }
    public function MethodA(){
        var_dump('方法组A');
        $this->one->MethodOne();
        $this->two->MethodTwo();
    }
    public function MethodB(){
        var_dump('方法组B');
        $this->three->MethodThree();
        $this->four->MethodFour();
    }
}
$a=new Facade();
$a->MethodA();
$a->MethodB();
```

### 运行结果

```java
string '方法组A' (length=10)
string '子系统方法一' (length=18)
string '子系统方法二' (length=18)
string '方法组B' (length=10)
string '子系统方法三' (length=18)
string '子系统方法四' (length=18)
```
