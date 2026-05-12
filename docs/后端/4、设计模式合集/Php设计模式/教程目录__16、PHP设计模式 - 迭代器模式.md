# 16、PHP设计模式 - 迭代器模式
- 来源：https://ddkk.com/zhuanlan/design/php/16.html
- 分类：设计模式
- 分组：教程目录
### 迭代器模式

提供一种方法顺序访问一个聚合对象中的各个元素，而不是暴露其内部的表示。

### 模式结构

- Iterator: 抽象迭代器：所有迭代器都需要实现的接口，提供了游走聚合对象元素之间的方法。
- ConcreteIterator:具体迭代器：利用这个具体的迭代器能够对具体的聚合对象进行遍历。每一个聚合对象都应该对应一个具体的迭代器。
- Aggregate: 抽象聚合类。
- ConcreteAggregate:具体聚合类：实现creatorIterator()方法，返回该聚合对象的迭代器。

### 结构图

### PHP代码实现

PHPSPL中已经提供了迭代器接口Iterator和容器接口IteatorAggragate，这里直接实现spl的里的迭代器。

```java
<?php
/**
 * 迭代器模式
 */
//ConcreteIterator:具体迭代器
class ConcreteIterator implements Iterator
{
    private $_key;
    private $_array;
    public function __construct($array){
        $this->_array=$array;
        $this->_key=0;
    }
    public function rewind(){
        $this->_key=0;
    }
    public function valid(){
        return isset($this->_array[$this->_key]);
    }
    public function current(){
        return $this->_array[$this->_key];
    }
    public function key(){
        return $this->_key;
    }
    public function next(){
        return ++$this->_key;
    }
}
//ConcreteAggregate:具体聚合类
class ConcreteAggregate implements IteratorAggregate
{
    protected $_arr;
    public function __construct($array){
        $this->_arr = $array;
    }
    public function getIterator(){
        return new ConcreteIterator($this->_arr);
    }
}
$arr = array(5,8,1,3,2);
$a=new ConcreteAggregate($arr);
$b=$a->getIterator();
foreach($b as $key=>$value){
    var_dump($key.':'.$value.'<br/>') ;
}
```

### 运行结果

```java
string '0:5<br/>' (length=8)
string '1:8<br/>' (length=8)
string '2:1<br/>' (length=8)
string '3:3<br/>' (length=8)
string '4:2<br/>' (length=8)
```
