# 09、PHP设计模式 - 建造者模式
- 来源：https://ddkk.com/zhuanlan/design/php/9.html
- 分类：设计模式
- 分组：教程目录
### 建造者模式

建造者模式(Builder Pattern)：将一个复杂对象的构建与它的表示分离，使得同样的构建过程可以创建不同的表示。

建造者模式是一步一步创建一个复杂的对象，它允许用户只通过指定复杂对象的类型和内容就可以构建它们，用户不需要知道内部的具体构建细节。建造者模式属于对象创建型模式。根据中文翻译的不同，建造者模式又可以称为生成器模式。

### 模式结构

建造者模式包含如下角色：

- Builder：抽象建造者
- ConcreteBuilder：具体建造者
- Director：指挥者
- Product：产品角色

### 结构图

### PHP代码实现

```java
<?php
/**
 * 建造者模式
 */
//Product：产品角色
class Product
{
    public function Add($part){
        $this->parts[]=$part;
    }
    public function show(){
        var_dump('产品创建');
        foreach ($this->parts as $part){
            var_dump($part);
        }
    }
}
//Builder：抽象建造者
interface Builder
{
    public function BuildPartA();
    public function BuildPartB();
    public function GetResult();
}
//ConcreteBuilder：具体建造者
class ConcreteBuilder1 implements Builder
{
    public function __construct(){
        $this->product=new Product();
    }
    public function BuildPartA()
    {
        $this->product->Add('部件A');
    }
    public function BuildPartB()
    {
        $this->product->Add('部件B');
    }
    public function GetResult()
    {
        return $this->product;
    }
}
class ConcreteBuilder2 implements Builder
{
    public function __construct(){
        $this->product=new Product();
    }
    public function BuildPartA()
    {
        $this->product->Add('部件X');
    }
    public function BuildPartB()
    {
        $this->product->Add('部件Y');
    }
    public function GetResult()
    {
        return $this->product;
    }
}
//Director：指挥者
class Director
{
    public function Construct($builder){
        $builder->BuildPartA();
        $builder->BuildPartB();
    }
}
$a=new Director();
$b1=new ConcreteBuilder1();
$b2=new ConcreteBuilder2();
$a->Construct($b1);
$p1=$b1->GetResult();
$p1->show();
$a->Construct($b2);
$p2=$b2->GetResult();
$p2->show();
```

### 运行结果

```java
string '产品创建' (length=12)
string '部件A' (length=7)
string '部件B' (length=7)
string '产品创建' (length=12)
string '部件X' (length=7)
string '部件Y' (length=7)
```
