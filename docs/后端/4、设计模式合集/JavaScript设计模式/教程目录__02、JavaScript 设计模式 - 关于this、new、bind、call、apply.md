# 02、JavaScript 设计模式 - 关于this、new、bind、call、apply
- 来源：https://ddkk.com/zhuanlan/design/javascript/2.html
- 分类：设计模式
- 分组：教程目录
虽然标题关于this、new、bind、call、apply，但实际上这些都离不开 this，因此本文将着重讨论 this，在此过程中分别讲解其他知识点。

## 1. this 指向的类型

刚开始学习 JavaScript 的时候，this总是最能让人迷惑，下面我们一起看一下在 JavaScript 中应该如何确定 this的指向。

this是在函数被调用时确定的，它的指向完全取决于函数调用的地方，而不是它被声明的地方（除箭头函数外）。当一个函数被调用时，会创建一个执行上下文，它包含函数在哪里被调用（调用栈）、函数的调用方式、传入的参数等信息，this就是这个记录的一个属性，它会在函数执行的过程中被用到。

在函数的指向有以下几种场景：

**1、** 作为构造函数被new调用；

**2、** 作为对象的方法使用；

**3、** 作为函数直接调用；

**4、** 被call、apply、bind调用；

**5、** 箭头函数中的this；

### 1.1. new 绑定

函数如果作为构造函数使用 new 调用时， this绑定的是新创建的构造函数的实例。

```javascript
function Foo() {
    console.log(this)
    // Foo {}
};
var bar = new Foo();
```

上面的代码中输出了Foo 实例，this 就是 bar，实际上使用 new调用构造函数时，会依次执行下面的操作：

**1、** 创建一个新对象；

**2、** 构造函数的prototype被赋值给这个新对象的__proto__；

**3、** 将新对象赋给当前的this；

**4、** 执行构造函数；

**5、** 如果函数没有返回其他对象，那么new表达式中的函数调用会自动返回这个新对象，如果返回的不是对象将被忽略；

### 1.2. 显式绑定

通过call、apply、bind 我们可以修改函数绑定的 this，使其成为我们指定的对象。通过这些方法的第一个参数我们可以显式地绑定 this。

```javascript
function foo(name, price) {
    this.name = name
    this.price = price
};
function Food(category, name, price) {
    this.category = category;
    // call 方式调用
    foo.call(this, name, price);
    // apply 方式调用    
    // foo.apply(this, [name, price]);  
};
var eat = new Food('食品', '汉堡', '5块钱');
console.log(eat);
// {category: "食品", name: "汉堡", price: "5块钱"};
```

call和 apply的区别是 call 方法接受的是参数列表，而 apply方法接受的是一个参数数组。

```javascript
// call 用法
func.call(thisArg, arg1, arg2, ...)；
// apply 用法       
func.apply(thisArg, [arg1, arg2, ...])；    
```

而bind方法是设置 this为给定的值，并返回一个新的函数，且在调用新函数时，将给定参数列表作为原函数的参数序列的前若干项。

```javascript
// bind 用法
func.bind(thisArg[, arg1[, arg2[, ...]]])   
```

举个栗子：

```javascript
var food = {
    name: '汉堡',
    price: '5块钱',
    getPrice: function (place) {
        console.log(place + this.name + this.price)
    }
};
food.getPrice('KFC ')   
// KFC汉堡5块钱
var getOtherPrice = food.getPrice.bind(
    { name: '鸡腿', price: '7块钱' }, 
    '肯打鸡 '
);
// 上面的代码中的绑定的this为{ name: '鸡腿', price: '7块钱' },
getOtherPrice();      
// 肯打鸡鸡腿7块钱
```

关于bind的原理，我们可以使用 apply方法自己实现一个 bind看一下：

```javascript
// ES5 方式
Function.prototype.bind = Function.prototype.bind || function () {
    var self = this;
    // 将类数组对象转换成数组
    var rest1 = Array.prototype.slice.call(arguments);
    // 获取第一个参数，this的指向
    var context = rest1.shift();
    return function () {
        // 将类数组对象转换成数组
        var rest2 = Array.prototype.slice.call(arguments);
        return self.apply(context, rest1.concat(rest2));
    }
};
// ES6 方式
Function.prototype.bind = Function.prototype.bind || function (...rest1) {
    const self = this;
    // 获取第一个参数，this的指向
    const context = rest1.shift();
    return function (...rest2) {
        return self.apply(context, [...rest1, ...rest2]);
    };
};
```

ES6方式用了一些 ES6 的知识比如 rest参数、数组解构，感兴趣的话可以看看后面的文章  中的详细介绍。

注意：如果你把 null 或 undefined 作为 this的绑定对象传入 call、apply、bind，这些值在调用时会被忽略，实际应用的是默认绑定规则。

```javascript
var a = 'hello'
function foo() {
    console.log(this.a)
};
foo.call(null);   
// hello     
```

### 1.3. 隐式绑定

函数是否在某个上下文对象中调用，如果是的话 this绑定的是那个上下文对象。

```javascript
var a = 'hello'
function foo() {
    console.log(this.a)
};
foo.call(null);   
// hello     
```

下面代码中，foo方法是作为对象的属性调用的，那么此时 foo方法执行时，this 指向 obj 对象。也就是说，此时 this 指向调用这个方法的对象，如果嵌套了多个对象，那么指向 最后一个 调用这个方法的对象：

```javascript
var a = 'hello';
var obj = {
    a: 'world',
    b: {
        a: 'China',
        foo: function () {
            console.log(this.a)
        }
    }
};
obj.b.foo();  
// China
```

最后一个对象是 obj上的 b，那么此时 foo方法执行时，其中的 this指向的就是 b对象。

### 1.4. 默认绑定

函数独立调用，直接使用不带任何修饰的函数引用进行调用，也是上面几种绑定途径之外的方式。非严格模式下 this 绑定到全局对象（浏览器下是 winodw，node 环境是 global），严格模式下 this绑定到 undefined（因为严格模式不允许 this指向全局对象）。

```javascript
var a = 'hello'
function foo() {
    var a = 'world'
    console.log(this.a)
    console.log(this)
};
foo(); // 相当于执行 window.foo();
// hello
// Window {parent: Window, postMessage: ƒ, blur: ƒ, focus: ƒ, close: ƒ, …}
```

上面代码中，变量 a 被声明在全局作用域，成为全局对象 window 的一个同名属性。函数 foo 被执行时，this 此时指向的是全局对象，因此打印出来的 a 是全局对象的属性。

注意有一种情况：

```javascript
var a = 'hello'
var obj = {
    a: 'world',
    foo: function () {
        console.log(this.a)
    }
};
var bar = obj.foo;
bar();             
// hello
```

此时bar函数，也就是 obj上的 foo 方法为什么又指向了全局对象呢，是因为 bar方法此时是作为函数独立调用的，所以此时的场景属于默认绑定，而不是隐式绑定。这种情况和把方法作为回调函数的场景类似：

```javascript
var a = 'hello'
var obj = {
    a: 'world',
    foo: function () {
        console.log(this.a)
    }
};
function func(fn) {
    fn()
};
func(obj.foo);
// hello
```

参数传递实际上也是一种隐式的赋值，只不过这里 obj.foo 方法是被隐式赋值给了函数 func 的形参 fn ，而之前的情景是自己赋值，两种情景实际上类似。这种场景我们遇到的比较多的是 setTimeout 和 setInterval，如果回调函数不是箭头函数，那么其中的 this指向的就是全局对象。

其实我们可以把默认绑定当作是隐式绑定的特殊情况，比如上面的 bar()，我们可以当作是使用 window.bar() 的方式调用的，此时 bar中的 this 根据隐式绑定的情景指向的就是 window。

## 2. this 绑定的优先级

this 存在多个使用场景，那么多个场景同时出现的时候，this到底应该如何指向呢。这里存在一个优先级的概念，this 根据优先级来确定指向。优先级：new 绑定 >显示绑定 >隐式绑定 >默认绑定。

所以this 的判断顺序：

**1、** new绑定：函数是否在new中调用？如果是的话this绑定的是新创建的对象；

**2、** 显式绑定：函数是否是通过bind、call、apply调用？如果是的话，this绑定的是指定的对象；

**3、** 隐式绑定：函数是否在某个上下文对象中调用？如果是的话，this绑定的是那个上下文对象；

**4、** 如果都不是的话，使用默认绑定如果在严格模式下，就绑定到undefined，否则绑定到全局对象；

## 3. 箭头函数中的 this

箭头函数是根据其声明的地方来决定 this 的，它是 ES6 中出现的知识点，在后文 《基础篇：ES6 中可能遇到的知识点》中会有更详细讲解。

箭头函数的 this 绑定是无法通过 call、apply、bind 被修改的，因为箭头函数没有构造函数 constructor，所以也不可以使用 new 调用，即不能作为构造函数，否则会报错。

```javascript
var a = 'hello';
var obj = {
    a: 'world',
    foo: () => {
        console.log(this.a)
    },
    bar:function(){
        console.log(this.a);
    }
};
obj.foo();           
// hello
obj.bar();
// world
```

我们可以看看 ECMAScript 标准中对箭头函数的描述：

原文：An ArrowFunction does not define local bindings for arguments, super, this, or new.target. Any reference to arguments, super, this, or new.target within an ArrowFunction must resolve to a binding in a lexically enclosing environment. Typically this will be the Function Environment of an immediately enclosing function.

翻译：箭头函数不为 arguments、super、this 或 new.target 定义本地绑定。箭头函数中对 arguments、super、this 或 new.target 的任何引用都解析为当前所在词法作用域中的绑定。通常，这是箭头函数所在的函数作用域。

[—ECMAScript Language Specification - Arrow Function | ECMA 标准 - 箭头函数](https://tc39.github.io/ecma262/#sec-arrow-function-definitions-runtime-semantics-evaluation)

## 4. 一个 this 的小练习

用一个小练习来实战一下：

```javascript
var a = 20;
var obj = {
    a: 40,
    foo: () => {
        console.log(this.a);
        function func() {
            this.a = 60
            console.log(this.a);
        };
        func.prototype.a = 50;
        return func
    }
};
var bar = obj.foo();
// 20
bar();
// 60
new bar();
// 60
```

稍微解释一下：

**1、** vara=20这句在全局变量window上创建了个属性a并赋值为20；

**2、** 首先执行的是obj.foo()，这是一个箭头函数，箭头函数不创建新的函数作用域直接沿用语句外部的作用域，因此obj.foo()执行时箭头函数中this是全局window，首先打印出window上的属性a的值20，箭头函数返回了一个原型上有个值为50的属性a的函数对象func给bar；

**3、** 继续执行的是bar()，这里执行的是刚刚箭头函数返回的闭包func，其内部的this指向window，因此this.a修改了window.a的值为60并打印出来；

**4、** 然后执行的是newbar()，根据之前的表述，new操作符会在func函数中创建一个继承了func原型的实例对象并用this指向它，随后this.a=60又在实例对象上创建了一个属性a，在之后的打印中已经在实例上找到了属性a，因此就不继续往对象原型上查找了，所以打印出第三个60；

如果把上面例子的箭头函数换成普通函数呢，结果会是什么样？

```javascript
var a = 20;
var obj = {
    a: 40,
    foo: function () {
        console.log(this.a);
        function func() {
            this.a = 60
            console.log(this.a);
        };
        func.prototype.a = 50;
        return func
    }
};
var bar = obj.foo();
// 40
bar();
// 60
new bar();
// 60
```

这个例子就不详细讲解了。

如果把上面两个例子弄懂原理，基本上 this 的指向就掌握的差不多啦~

推荐阅读

**1、** [Function.prototype.bind()-JavaScript|MDN][Function.prototype.bind_-JavaScript_MDN]；

**2、** [Function.prototype.call()-JavaScript|MDN][Function.prototype.call_-JavaScript_MDN]；

**3、** [Function.prototype.apply()-JavaScript|MDN][Function.prototype.apply_-JavaScript_MDN]；

**4、** [this-JavaScript|MDN][this-JavaScript_MDN]；
