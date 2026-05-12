# 15、TypeScript 实战 - 配置文件-初识 tsconfig.json
- 来源：https://ddkk.com/zhuanlan/qianduan/typescript/1/15.html
- 分类：前端框架
- 分组：教程目录
## 生成tsconfig.json文件

**1、** 新建一个名为`TsDemo`的文件夹；

**2、** 在`VScode`编译器中打开；

**3、** 打开终端输入`tsc--init`；

这样生成tsconfig.json文件了

## 生效tsconfig.json文件

在文件的根目录下建立一个Demo.ts文件，然后可以编写一段简单的代码

```java
let person:string = "小哈"
```

这时候我们不在使用`ts-node`直接执行了，需要用`tsc Demo.ts`进行编译，编译后会得到`Demo.js`文件。 生成的代码如下:

```java
var perosn = "小哈";
```

感觉一切都是正常，但是`tsconfig.json`这个编译配置文件并没有生效

我们打开`tsconfig.json`文件，找到`complilerOptions`属性下的`removeComments:true`选项，把注释去掉

`removeComments:true`：意思是编译时不显示注释，也就是编译出来的js文件不显示注释内容

我们在Demo.ts文件中加入一些注释，例如：

```java
// 在tsconfig.json文件中开启是removeComments:true配置项 编译之后注释不会再显示
let perosn:string ="小哈"
```

此时运行编译代码`tsc Demo.ts`，编译后打开`Demo.js`文件，你会发现注释依然存在，说明`tsconfig.json`**文件没有起作用**。

**如果要想编译配置文件起作用**，我们可以**直接运行**`tsc`命令，这时候`tsconfig.json`才起作用，可以看到生成的js文件已经不带注释了。如下图：

## include，exclude 和 files

当我们有多个ts文件时，而我们只想编译其中的一个文件时，我们可以这样做

我们在项目根目录，新建一个文件Demo2.ts文件，然后也写一段最简单的 ts 代码。

```java
let person1:string="小嘻"
```

## 方法一：使用 include 配置

`include`属性是用来指定要编译的文件的，比如现在我们只编译`Demo.ts`文件，而不编译`Demo1.ts`文件，就可以这样写

```java
{
  "include":["Demo.ts"],
  "compilerOptions": {
      //any something
      //........
  }
}
```

**注意:写配置文件时不支持单引号，所以里边都要使用双引号**

这时候再编译，就只编译Demo.ts文件了。如下图：

## 方法二：使用 exclude 配置

`exclude`**是不包含，除什么文件之外，意思是写再这个属性之外的而文件才进行编译**。比如你还是要编译`Demo.ts`文件，这时候的写法就应该是这样了。

```java
{
  "include":["Demo1.ts"],
  "compilerOptions": {
      //any something
      //........
  }
}
```

除了`Demo1.ts`文件不被编译之外，其他文件均被编译成`js`文件

## 方法三：使用 files 配置

个人感觉`files`的配置效果和`include`几乎一样

在tsconfig.json文件添加 “files”: [“Demo.ts”],只编译Demo.ts文件

```java
{
  "files":["Demo.ts"],
  "compilerOptions": {
      //any something
      //........
  }
}
```

运行之后只有`Demo.ts`文件被编译成`js`文件。如下图：
