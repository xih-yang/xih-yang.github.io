# 30、AWK 用户自定义函数
- 来源：https://ddkk.com/zhuanlan/other/awk/30.html
- 分类：Awk 教程
- 分组：教程目录
函数是现代编程语言的基本组成单元，大型的应用程序都是通过独立的可重用的 **函数** 来划分一个个功能。

现代的编程语言中，如果不能够自定义函数，那简直无法想象，就像电一样，突然间没有了，感觉都活不下去了。

不过放心，虽然日常使用 AWK 时并不会需要自己定义函数，并不代表 AWK 不能够自定义函数。本章节，我们就来研究研究 AWK 中如何自定义函数。

> AWK 内建的函数能够满足大部分的使用场景，如非必要，请不要自己定义函数。

### AWK 函数定义语法

```sh
function function_name(argument1, argument2, ...) { 
   function body
}
```

从AWK 函数的语法中可以看出，AWK 中定义函数的方式跟 C 语言 是类似的。当然了，如果你会 JavaScript，就会发现，简直一模一样。

AWK中的函数定义由以下几个部分组成

**1、** 必须以function关键字开始，然后紧跟着一个或多个**空格('')**；

**2、** 在空格的后面紧跟着**函数名**，函数名必须以**字母开始，可以由字母、数字、下划线组成**，但是AWK同时规定，所有的AWK**保留字**都不能用于函数名；

**3、** 在函数名字后，必须紧跟着**一对英文括号**；

**4、** 在**右括号(()之后，必须有一对**英文大括号({})；

- 大括号可以和小括号同一行，也可以不同行，这个没有限制。
- 右小括号和左大括号之间可以有任意数量的空格，这个也没有限制。

下面的三种语法都是正确的

```sh
// 大括号和小括号在同一行
function hello(){}
// 左大括号和小括号在同一行
function hello(){
}
// 左大括号和右大括号都在新的一行
function hello()
{
}
```

**5、** 如果函数可有有一个或多个参数，但参数必须放在**小括号内**，每个参数由**英文逗号（,）** 分隔；

```sh
// 没有参数
function hello(){
}
// 有一个参数 username
function hello(username){
}
// 两个或两个以上参数需要逗号分隔
function hello(username,greeting) {
}
```

**6、** 大括号内可以有任意数量的AWK语句，语句之间必须以**分号(;)**分隔；

```sh
// 一条语句
function hello(username,greeting) {
    printf "%s,%s\n", greeting, username;
}
// 多条语句
function hello(username,greeting) {
    print "Hello DDKK.COM 弟弟快看，程序员编程资料站";
    printf "%s,%s\n", greeting, username;
}
```

**7、** 函数可以有返回值，也可以没有，如果需要返回值，则必须在大括号里使用return关键字，语法格式如下；

```sh
return [要返回的值]
```

例如要返回用户名，可以直接使用

```sh
return 'penglei'
```

更详细的例子

```sh
// 多条语句
function hello(username,greeting) {
    print "Hello DDKK.COM 弟弟快看，程序员编程资料站";
    printf "%s,%s\n", greeting, username;
    return username;
}
```

AWK自定义函数的语法就这些，日常多多使用，很快就会熟能生巧的。

### AWK 函数调用语法

定义好了函数之后，我们就能像调用内置函数那样调用我们自定义的函数

调用无参数 hello

```sh
hello;
```

调用有参数函数

```sh
hello("DDKK.COM 弟弟快看，程序员编程资料站","你好");
```

调用有返回值的函数

```sh
username = hello("DDKK.COM 弟弟快看，程序员编程资料站","你好");
```

## 范例

接下来我们创建两个自定义函数，用来返回两个参数中较小/较大的那个。

函数的名字我们定为 find_min 和 find_max，两个参数分别叫 num1 和 num2

```sh
# 返回较小的那个数字
function find_min(num1, num2)
{
    if (num1 < num2)
        return num1
    return num2
}
# 返回较大的那个数字
function find_max(num1, num2)
{
    if (num1 > num2)
        return num1
    return num2
}
```

为了方便调用函数，我们再创建一个函数 main，同时接受两个数字作为参数，并在这个 main 函数中调用上面创建的两个函数

```sh
function main(num1, num2)
{
   # 找出较小的数字
   result = find_min(10, 20)
   print "Minimum =", result
   # 找出较大的数字
   result = find_max(10, 20)
   print "Maximum =", result
}
```

至于调用函数 main，我们可以像平时调用内置函数一样

```sh
awk BEGIN {main(10, 20)}'
```

## AWK 命令文件

一般情况下，当语句比较复杂的时候，我们习惯于把所有代码都放到文件中，这样既方便修改，也不会搞得那么复杂

我们可以在当前目录下新建一个文件 fns.awk 文件名随意，但一般都以 .awk 结尾，然后将以下内容复制其中

```sh
# 返回较小的那个数字
function find_min(num1, num2)
{
    if (num1 < num2)
        return num1
    return num2
}
# 返回较大的那个数字
function find_max(num1, num2)
{
    if (num1 > num2)
        return num1
    return num2
}
function main(num1, num2)
{
   # 找出较小的数字
   result = find_min(10, 20)
   print "Minimum =", result
   # 找出较大的数字
   result = find_max(10, 20)
   print "Maximum =", result
}
# 调用 main()
BEGIN {main(10, 20)}
```

然后使用下面的命令运行我们的 fns.awk 文件

```sh
awk -f fns.awk 
```

运行结果如下

```sh
Minimum = 10
Maximum = 20
```
