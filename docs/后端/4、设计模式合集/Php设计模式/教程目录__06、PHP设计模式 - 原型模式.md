# 06、PHP设计模式 - 原型模式
- 来源：https://ddkk.com/zhuanlan/design/php/6.html
- 分类：设计模式
- 分组：教程目录
### 原型模式

原型对象，用原型实例指定创建对象的种类，并且通过拷贝这些原型创建新的对象。

原型模式就是clone就是内存拷贝，比new的好处是创建对象快速，适合大对象创建。

**1、** 原型模式与工厂模式作用类似,都是用来创建对象；

**2、** 与工厂模式的实现不同,原型模式是先创建好一个原型对象,然后通过clone原型对象来创建新的对象,这样就免去了类创建时重复的初始化操作；

**3、** 原型模式适用于大对象的创建,创建一个大对象需要很大的开销,如果每次new就会消耗很大,原型模式仅需内存拷贝即可；

### 模式结构

- 抽象原型(Prototype)角色：声明一个克隆自身的接口
- 具体原型(Concrete Prototype)角色：实现一个克隆自身的操作

### 结构图

### 浅拷贝与深拷贝

#### 浅拷贝

被拷贝对象的所有变量都含有与原对象相同的值，而且对其他对象的引用仍然是指向原来的对象。

即浅拷贝只负责当前对象实例，对引用的对象不做拷贝。

#### 深拷贝

被拷贝对象的所有的变量都含有与原来对象相同的值，除了那些引用其他对象的变量。那些引用其他对象的变量将指向一个被拷贝的新对象，而不再是原有那些被引用对象。

即深拷贝把要拷贝的对象所引用的对象也都拷贝了一次，而这种对被引用到的对象拷贝叫做间接拷贝。

深拷贝要深入到多少层，是一个不确定的问题。

在决定以深拷贝的方式拷贝一个对象的时候，必须决定对间接拷贝的对象是采取浅拷贝还是深拷贝还是继续采用深拷贝。

因此，在采取深拷贝时，需要决定多深才算深。此外，在深拷贝的过程中，很可能会出现循环引用的问题。

### PHP代码实现

#### 浅拷贝实现

直接拷贝，拷贝了源对象的引用地址等，所以原来内容变化，新内容变化。

```java
<?php
//原型类
abstract class Prototype
{
    public function __construct($id){
        $this->id=$id;
    }
    public function __get($name){
        return $this->$name;
    }
    public function __set($name, $value)
    {
        $this->$name=$value;
    }
    public abstract  function clone();
}
//具体原型类
class ConcretePrototype extends Prototype
{
    //返回自身
    public function clone()
    {
        return clone $this;//浅拷贝
    }
}
//测试浅拷贝
class DeepCopyDemo
{
    public $array;
}
$demo=new DeepCopyDemo();
$demo->array=array(1,2);
$obj1=new ConcretePrototype($demo);
$obj2=$obj1->clone();
var_dump($obj1);
var_dump($obj2);
$demo->array=array(3,4);
var_dump($obj1);
var_dump($obj2);
```

#### 浅拷贝运行结果

```java
object(ConcretePrototype)[2]
  public 'id' => 
    object(DeepCopyDemo)[1]
      public 'array' => 
        array (size=2)
          0 => int 1
          1 => int 2
object(ConcretePrototype)[3]
  public 'id' => 
    object(DeepCopyDemo)[1]
      public 'array' => 
        array (size=2)
          0 => int 1
          1 => int 2
object(ConcretePrototype)[2]
  public 'id' => 
    object(DeepCopyDemo)[1]
      public 'array' => 
        array (size=2)
          0 => int 3
          1 => int 4
object(ConcretePrototype)[3]
  public 'id' => 
    object(DeepCopyDemo)[1]
      public 'array' => 
        array (size=2)
          0 => int 3
          1 => int 4
```

#### 深拷贝实现

深拷贝通过序列化和反序列化完成拷贝，新拷贝的内容完全复制原来的内容。原来的内容变化，新内容不变。

```java
<?php
//原型类
abstract class Prototype
{
    public function __construct($id){
        $this->id=$id;
    }
    public function __get($name){
        return $this->$name;
    }
    public function __set($name, $value)
    {
        $this->$name=$value;
    }
    public abstract  function clone();
}
//具体原型类
class ConcretePrototype extends Prototype
{
    //返回自身
    public function clone()
    {
        $serialize_obj=serialize($this);
        $clone_obj=unserialize($serialize_obj);
        return $clone_obj;
    }
}
//测试深拷贝
class DeepCopyDemo
{
    public $array;
}
$demo=new DeepCopyDemo();
$demo->array=array(1,2);
$obj1=new ConcretePrototype($demo);
$obj2=$obj1->clone();
var_dump($obj1);
var_dump($obj2);
$demo->array=array(3,4);
var_dump($obj1);
var_dump($obj2);
```

#### 深拷贝运行结果

```java
object(ConcretePrototype)[2]
  public 'id' => 
    object(DeepCopyDemo)[1]
      public 'array' => 
        array (size=2)
          0 => int 1
          1 => int 2
object(ConcretePrototype)[3]
  public 'id' => 
    object(DeepCopyDemo)[4]
      public 'array' => 
        array (size=2)
          0 => int 1
          1 => int 2
object(ConcretePrototype)[2]
  public 'id' => 
    object(DeepCopyDemo)[1]
      public 'array' => 
        array (size=2)
          0 => int 3
          1 => int 4
object(ConcretePrototype)[3]
  public 'id' => 
    object(DeepCopyDemo)[4]
      public 'array' => 
        array (size=2)
          0 => int 1
          1 => int 2
```
