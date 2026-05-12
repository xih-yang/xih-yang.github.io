# 20、PHP设计模式 - 职责链模式
- 来源：https://ddkk.com/zhuanlan/design/php/20.html
- 分类：设计模式
- 分组：教程目录
### 职责链模式

使多个对象都有机会处理请求，从而避免请求的发送者和接收者之间的耦合关系。将这个对象连成一条链，并沿着这条链传递该请求，直到有一个对象处理它为止。

### 模式结构

- 抽象处理者角色(Handler:Approver):定义一个处理请求的接口，和一个后继连接(可选)
- 具体处理者角色(ConcreteHandler:President):处理它所负责的请求，可以访问后继者，如果可以处理请求则处理，否则将该请求转给他的后继者。

### 结构图

### PHP代码实现

```java
<?php
/**
 * 职责链模式
 */
//抽象处理者角色(Handler:Approver)
abstract class Handler
{
    public function SetSuccessor(Handler $successor){
        $this->successor=$successor;
    }
    abstract public function HandleRequest($request);
}
//具体处理者角色(ConcreteHandler:President)
class ConcreteHandle1 extends Handler
{
    public function HandleRequest($request)
    {
        if($request>=0&&$request<10){
            var_dump(self::class.':'.$request);
        }elseif ($this->successor!=null){
            $this->successor->HandleRequest($request);
        }
    }
}
class ConcreteHandle2 extends Handler
{
    public function HandleRequest($request)
    {
        if($request>=10&&$request<20){
            var_dump(self::class.':'.$request);
        }elseif ($this->successor!=null){
            $this->successor->HandleRequest($request);
        }
    }
}
class ConcreteHandle3 extends Handler
{
    public function HandleRequest($request)
    {
        if($request>=20&&$request<30){
            var_dump(self::class.':'.$request);
        }elseif ($this->successor!=null){
            $this->successor->HandleRequest($request);
        }
    }
}
$h1=new ConcreteHandle1();
$h2=new ConcreteHandle2();
$h3=new ConcreteHandle3();
$h1->SetSuccessor($h2);
$h2->SetSuccessor($h3);
$h1->HandleRequest(5);
$h1->HandleRequest(15);
$h1->HandleRequest(25);
```

### 运行结果

```java
string 'ConcreteHandle1:5' (length=17)
string 'ConcreteHandle2:15' (length=18)
string 'ConcreteHandle3:25' (length=18)
```
