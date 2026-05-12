# 07、PHP设计模式 - 模板方法模式
- 来源：https://ddkk.com/zhuanlan/design/php/7.html
- 分类：设计模式
- 分组：教程目录
### 模板方法模式

定义一个操作中的算法的骨架，而将一些步骤延迟到子类中。模板方法使得子类可以不改变一个算法的结构即可重定义该算法的某些特定步骤。

### 模式结构

抽象模板(AbstractClass)角色: 定义一个或多个抽象方法让子类实现。这些抽象方法叫做基本操作，它们是顶级逻辑的组成部分。

定义一个模板方法。这个模板方法一般是一个具体方法，它给出顶级逻辑的骨架，而逻辑的组成步骤在对应的抽象操作中，这些操作将会推迟到子类中实现。同时，顶层逻辑也可以调用具体的实现方法。

具体模板(ConcrteClass)角色：实现父类的一个或多个抽象方法，作为顶层逻辑的组成而存在。

每个抽象模板可以有多个具体模板与之对应，而每个具体模板有其自己对抽象方法（也就是顶层逻辑的组成部分）的实现，从而使得顶层逻辑的实现各不相同。

### 结构图

### PHP代码实现

```java
<?php
//抽象模板(AbstractClass)角色
abstract class AbstractClass
{
    public abstract function PrimitiveOperation1();
    public abstract function PrimitiveOperation2();
    public function method(){
        $this->PrimitiveOperation1();
        $this->PrimitiveOperation2();
        var_dump('method');
    }
}
//具体模板(ConcrteClass)角色
class ConcreteClassA extends AbstractClass
{
    public function PrimitiveOperation1()
    {
        var_dump('类A方法1实现');
    }
    public function PrimitiveOperation2()
    {
        var_dump('类A方法2实现');
    }
}
class ConcreteClassB extends AbstractClass
{
    public function PrimitiveOperation1()
    {
        var_dump('类B方法1实现');
    }
    public function PrimitiveOperation2()
    {
        var_dump('类B方法2实现');
    }
}
$a=new ConcreteClassA();
$a->method();
$b=new ConcreteClassB();
$b->method();
```

### 运行结果

```java
string '类A方法1实现' (length=17)
string '类A方法2实现' (length=17)
string 'method' (length=6)
string '类B方法1实现' (length=17)
string '类B方法2实现' (length=17)
string 'method' (length=6)
```
