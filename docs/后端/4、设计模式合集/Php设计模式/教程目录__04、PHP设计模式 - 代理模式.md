# 04、PHP设计模式 - 代理模式
- 来源：https://ddkk.com/zhuanlan/design/php/4.html
- 分类：设计模式
- 分组：教程目录
### 代理模式

代理模式(Proxy Pattern) ：给某一个对象提供一个代 理，并由代理对象控制对原对象的引用。代理模式的英 文叫做Proxy或Surrogate，它是一种对象结构型模式。

### 模式结构

代理模式包含如下角色：

- Subject: 抽象主题角色
- Proxy: 代理主题角色
- RealSubject: 真实主题角色

### 结构图

### PHP代码实现

```java
<?php
//Subject: 抽象主题角色
interface Subject
{
    public function request();
}
//RealSubject: 真实主题角色
class RealSubject implements Subject
{
    public function request(){
        var_dump('真实的请求');
    }
}
//Proxy: 代理主题角色
class Proxy implements Subject
{
    public function request(){
        $realSubject=new RealSubject();
        $realSubject->request();
    }
}
$a=new Proxy();
$a->request();
```

### 运行结果

```java
string '真实的请求' (length=15)
```
