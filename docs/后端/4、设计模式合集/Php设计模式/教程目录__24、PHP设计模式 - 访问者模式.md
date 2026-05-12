# 24、PHP设计模式 - 访问者模式
- 来源：https://ddkk.com/zhuanlan/design/php/24.html
- 分类：设计模式
- 分组：教程目录
### 访问者模式

表示一个作用于某对象结构中的各元素的操作。它使你可以在不改变各元素的类的前提下定义作用于这些元素的新操作。

### 模式结构

- 抽象访问者角色(Visitor)：为该对象结构(ObjectStructure)中的每一个具体元素提供一个访问操作接口。该操作接口的名字和参数标识了要访问的具体元素角色。这样访问者就可以通过该元素角色的特定接口直接访问它。
- 具体访问者角色(ConcreteVisitor):实现抽象访问者角色接口中针对各个具体元素角色声明的操作。
- 抽象节点（Node）角色(Element):该接口定义一个accept操作接受具体的访问者。
- 具体节点（Node）角色(ConcreteElement):实现抽象节点角色中的accept操作。
- 对象结构角色(ObjectStructure)：这是使用访问者模式必备的角色。它要具备以下特征：能枚举它的元素；可以提供一个高层的接口以允许该访问者访问它的元素；可以是一个复合（组合模式）或是一个集合，如一个列表或一个无序集合(在PHP中我们使用数组代替，因为PHP中的数组本来就是一个可以放置任何类型数据的集合)

### 结构图

### PHP代码实现

```java
<?php
/**
 * 访问者模式
 */
//抽象访问者角色(Visitor)
abstract class Visitor {
    abstract public function visitConcreteElementA(ConcreteElementA $elementA);
    abstract public function visitConcreteElementB(concreteElementB $elementB);
}
//抽象节点（Node）角色(Element)
abstract class Element
{
    abstract public function accept(Visitor $visitor);
}
//具体访问者角色(ConcreteVisitor)
class ConcreteVisitor1 extends Visitor {
    public function visitConcreteElementA(ConcreteElementA $elementA) {
        var_dump($elementA->getName() . " visited by ConcerteVisitor1");
    }
    public function visitConcreteElementB(ConcreteElementB $elementB) {
        var_dump($elementB->getName() . " visited by ConcerteVisitor1");
    }
}
class ConcreteVisitor2 extends Visitor {
    public function visitConcreteElementA(ConcreteElementA $elementA) {
        var_dump($elementA->getName() . " visited by ConcerteVisitor2");
    }
    public function visitConcreteElementB(ConcreteElementB $elementB) {
        var_dump($elementB->getName() . " visited by ConcerteVisitor2");
    }
}
//具体节点（Node）角色(ConcreteElement)
class ConcreteElementA extends Element {
    private $name;
    public function __construct($name) {
        $this->name = $name;
    }
    public function getName() {
        return $this->name;
    }
    public function accept(Visitor $visitor) {
        $visitor->visitConcreteElementA($this);
    }
}
class ConcreteElementB extends Element {
    private $name;
    public function __construct($name) {
        $this->name = $name;
    }
    public function getName() {
        return $this->name;
    }
    public function accept(Visitor $visitor) {
        $visitor->visitConcreteElementB($this);
    }
}
//对象结构角色(ObjectStructure)
class ObjectStructure {
    private $collection;
    public function __construct() {
        $this->collection = array();
    }
    public function attach(Element $element) {
        return array_push($this->collection, $element);
    }
    public function detach(Element $element) {
        $index = array_search($element, $this->collection);
        if ($index !== FALSE) {
            unset($this->collection[$index]);
        }
        return $index;
    }
    public function accept(Visitor $visitor) {
        foreach ($this->collection as $value) {
            $value->accept($visitor);
        }
    }
}
$elementA = new ConcreteElementA("ElementA");
$elementB = new ConcreteElementB("ElementB");
$elementA2 = new ConcreteElementB("ElementA2");
$visitor1 = new ConcreteVisitor1();
$visitor2 = new ConcreteVisitor2();
$os = new ObjectStructure();
$os->attach($elementA);
$os->attach($elementB);
$os->attach($elementA2);
$os->detach($elementA);
$os->accept($visitor1);
$os->accept($visitor2);
```

### 运行结果

```java
string 'ElementB visited by ConcerteVisitor1' (length=36)
string 'ElementA2 visited by ConcerteVisitor1' (length=37)
string 'ElementB visited by ConcerteVisitor2' (length=36)
string 'ElementA2 visited by ConcerteVisitor2' (length=37)
```
