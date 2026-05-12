# 17、PHP设计模式 - 单例模式
- 来源：https://ddkk.com/zhuanlan/design/php/17.html
- 分类：设计模式
- 分组：教程目录
### 单例模式

保证一个类仅有一个实例，并提供一个访问它的全局访问点。

### 模式特点

**1、** 一个类只能有一个实例；

**2、** 它必须自行创建这个实例；

**3、** 它必须自行向整个系统提供这个实例；

### 结构图

### PHP代码实现

```java
<?php
/**
 * 懒汉式单例模式
 */
class Singleton
{
    private static $instance;
    private function __construct(){
     }
    public static function GetInstance(){
        if(self::$instance==null){
            self::$instance=new Singleton();
        }
        return self::$instance;
    }
}
$a1=Singleton::GetInstance();
$a2=Singleton::GetInstance();
if ($a1===$a2){
    var_dump('两个对象是相同的实例');
}
```

### 运行结果

```java
string '两个对象是相同的实例' (length=30)
```
