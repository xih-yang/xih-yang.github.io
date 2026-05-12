# 12、Angular 4 教程 - TypeScript：类与接口
- 来源：https://ddkk.com/zhuanlan/qianduan/angular/1/12.html
- 分类：前端框架
- 分组：教程目录
传统的javascript使用函数来创建可重用的组件，而熟悉面向对象设计和开发的则更加熟悉类/接口/集成等面向对象的方式。而这些在ECMAScript 2015得到了支持，javascript也可以使用面向对象的设计方法了，但是在ES5尚未完全得到全部支持的现在，通过使用typescript了先行使用此类特性在我们的项目之中。

由于面向对象的编程已经是极为基础，我们只需要看一下typescript中是如何实现的即可。我们将会通过几个简单的例子来研究一下相关的基本使用方法。

## Animal类

这篇文章的例子，将会写在一个名为class-practice.ts的文件之中。首先我们先在这个文件之中实现一个Animal的类。

```java
[root@angular proj]# grep class tsconfig.json 
        "src/class-practice.ts"
[root@angular proj]# 
[root@angular proj]# cat src/class-practice.ts 
class Animal {
    public name: string;
    public constructor(theName: string) { this.name = theName; }
    public move(distanceInMeters: number) {
        console.log(${
    this.name} moved ${distanceInMeters}m.);
    }
}
let animal = new Animal("Dog");
animal.move(100);
[root@angular proj]#
```

编译&结果确认

```java
[root@angular proj]# gulp
[07:14:13] Using gulpfile /tmp/proj/gulpfile.js
[07:14:13] Starting 'default'...
[07:14:22] Finished 'default' after 9.17 s
[root@angular proj]# node dist/class-practice.js 
Dog moved 100m.
[root@angular proj]# 
```

确认编译生成的js代码：

```java
[root@angular proj]# cat dist/class-practice.js 
var Animal = /** @class */ (function () {
    function Animal(theName) {
        this.name = theName;
    }
    Animal.prototype.move = function (distanceInMeters) {
        console.log(this.name + " moved " + distanceInMeters + "m.");
    };
    return Animal;
}());
var animal = new Animal("Dog");
animal.move(100);
[root@angular proj]#
```

Animal的类写的非常的简单，但是从这几行简单的代码中，我们可以了解到typescript的一些使用的特点：

- **成员函数需要用this指针进行引用**
- **修饰符也是有public/private/protected三种**
- **缺省的情况下，成员时public的**
- **private只能在定义的类中进行使用**
- **protected能够在定义的类和继承的类中使用，但不能在实例中直接引用**
- **整体的类等相关使用方式和C#或者C++非常类似**
- **readonly修饰符设定只读属性，只能在声明或者构造函数中被初始化**
- **虚函数的使用也同C++大同小异**

## Horse类

稍微对程序进行修改，创建一个Horse类继承Animal类，同时将Animal类的name设定为protected方式。具体代码如下：

```java
[root@angular proj]# cat src/class-practice.ts 
class Animal {
    protected name: string;
    public constructor(theName: string) { this.name = theName; }
    public move(distanceInMeters: number) {
        console.log(${
    this.name} moved ${distanceInMeters}m.);
    }
}
class Horse extends Animal {
    public constructor(name: string) { super(name); }
    public move(distanceInMeters = 45) {
        console.log("super name: " + this.name);
        console.log("Galloping...");
        super.move(distanceInMeters);
    }
}
let animal = new Animal("Dog");
animal.move(100);
let horse = new Horse("Horse");
horse.move(200);
[root@angular proj]# 
```

执行和结果确认

```java
[root@angular proj]# gulp
[07:27:38] Using gulpfile /tmp/proj/gulpfile.js
[07:27:38] Starting 'default'...
[07:27:52] Finished 'default' after 14 s
[root@angular proj]# node dist/class-practice.js 
Dog moved 100m.
super name: Horse
Galloping...
Horse moved 200m.
[root@angular proj]# 
```

## get/set

就像javabean的get和set方法那样，typescript也支持get和set方式，只是写法稍有不同，比如如下一个例子，我们有一个private的成员变量，而对实例进行直接赋值的使用方式则是因为set和get存在的原因。

```java
[root@angular proj]# grep 2 tsconfig.json
        "src/class-practice-2.ts"
[root@angular proj]# cat src/class-practice-2.ts 
let passcode = "secret passcode";
class Employee {
    private _fullName: string;
    get fullName(): string {
        return this._fullName;
    }
    set fullName(newName: string) {
        if (passcode && passcode == "secret passcode") {
            this._fullName = newName;
        }
        else {
            console.log("Error: Unauthorized update of employee!");
        }
    }
}
let employee = new Employee();
employee.fullName = "Bob Smith";
if (employee.fullName) {
    console.log(employee.fullName);
}
[root@angular proj]#
```

执行和结果确认

```java
[root@angular proj]# gulp
[07:39:42] Using gulpfile /tmp/proj/gulpfile.js
[07:39:42] Starting 'default'...
[07:39:55] Finished 'default' after 13 s
[root@angular proj]# node dist/class-practice-2.js 
Bob Smith
[root@angular proj]# 
```

## interface

接口方式使用也比较类似，比如如下例子：

```java
[root@angular proj]# cat src/interface-practice.ts 
interface LabelledValue {
  label: string;
}
function printLabel(labelledObj: LabelledValue) {
  console.log(labelledObj.label);
}
let myObj = {size: 10, label: "Size 10 Object"};
printLabel(myObj);
[root@angular proj]#
```

执行&结果确认

```java
[root@angular proj]# gulp
[07:43:25] Using gulpfile /tmp/proj/gulpfile.js
[07:43:25] Starting 'default'...
[07:43:35] Finished 'default' after 10 s
[root@angular proj]# node dist/interface-practice.js 
Size 10 Object
[root@angular proj]#
```

## 总结

这篇文章练习和确认了typescript中如何进行面向对象编程方式进行设计和编码。
