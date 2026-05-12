# 22、PHP设计模式 - 享元模式
- 来源：https://ddkk.com/zhuanlan/design/php/22.html
- 分类：设计模式
- 分组：教程目录
### 享元模式

享元模式(Flyweight Pattern)：运用共享技术有效地支持大量细粒度对象的复用。系统只使用少量的对象，而这些对象都很相似，状态变化很小，可以实现对象的多次复用。由于享元模式要求能够共享的对象必须是细粒度对象，因此它又称为轻量级模式，它是一种对象结构型模式。

### 模式结构

享元模式包含如下角色：

- Flyweight: 抽象享元类
- ConcreteFlyweight: 具体享元类
- UnsharedConcreteFlyweight: 非共享具体享元类
- FlyweightFactory: 享元工厂类

### 结构图

### PHP代码实现

```java
<?php
/**
 * 享元模式
 */
abstract class Flyweight {
    abstract public function operation($state);
}
//具体享元角色
class ConcreteFlyweight extends Flyweight {
    private $state = null;
    public function __construct($state) {
        $this->state = $state;
    }
    public function operation($state) {
        var_dump('具体Flyweight:'.$state);
    }
}
//不共享的具体享元，客户端直接调用
class UnsharedConcreteFlyweight extends Flyweight {
    private $state = null;
    public function __construct($state) {
        $this->state = $state;
    }
    public function operation($state) {
        var_dump('不共享的具体Flyweight:'.$state);
    }
}
//享元工厂角色
class FlyweightFactory {
    private $flyweights;
    public function __construct() {
        $this->flyweights = array();
    }
    public function getFlyweigth($state) {
        if (isset($this->flyweights[$state])) {
            return $this->flyweights[$state];
        } else {
            return $this->flyweights[$state] = new ConcreteFlyweight($state);
        }
    }
}
$f = new FlyweightFactory();
$a = $f->getFlyweigth('state A');
$a->operation("other state A");
$b = $f->getFlyweigth('state B');
$b->operation('other state B');
/* 不共享的对象，单独调用 */
$u = new UnsharedConcreteFlyweight('state A');
$u->operation('other state A');
```

### 运行结果

```java
string '具体Flyweight:other state A' (length=29)
string '具体Flyweight:other state B' (length=29)
string '不共享的具体Flyweight:other state A' (length=41)
```
