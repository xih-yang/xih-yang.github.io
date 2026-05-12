# 08、Angular 4 教程 - TypeScript：ECMAScript之前世今生
- 来源：https://ddkk.com/zhuanlan/qianduan/angular/1/8.html
- 分类：前端框架
- 分组：教程目录
在以例子为主的官方介绍中，我们学习到了npm install typescript，也看过tsconfig.json的typescript配置文件的配置文件，比如里面写的ES5到底是什么。另外那些.ts的文件，都是typescript的，跟angular有什么关系，这篇文章将会介绍一下最基础的知识，大体对其有些概念上的认识。

## Angular与typescript

### typescript

> typescript是javascript的超集，是由微软开发的开源的编程语言，对javascript进行了可选的类型检查和类与接口等概念。

#### 安德斯·海尔斯伯格

1960年出生于丹麦的安德斯·海尔斯伯格（Anders Hejlsberg）被称为typescript之父，同时他也是Delphi和c#的父亲。作为C#的首席架构师，他向javascript中添加面向对象的编程特性方面可谓得心应手。

#### 版本发布

从2012年公开首个版本，typescript在2017年11月1号已经发布了2.6版本。

时间
版本和说明

2012/10
首个公开版本

2014/4
1.0

2014/10/8
从1.1.0.1开始在github上进行托管

2018/8/31
2.0 RC

2017/11/1
2.6

### 为何选择typescript

Angular2开始google的团队使用typescript对angular进行了重构。其实除去typescript，类似封装javascript的语言不止一家，也包括google当初准备使用的自己的atscript。为什么选择typescript，除了非技术性因素之外，作为曾经的angular核心团队成员，Victor Savkin的看法如下

- **Typescript有丰富的工具**
- **是javascript的超集**
- **可以进行更好的抽象设计**
- **易于阅读和理解**
- **依然可以使用javascript的生态系统**

## Typescript和JavaScript

Javascript原生似乎看起来不是很招人待见，其实更多的原因则是相反，而是javascript太热了，而且现在的前端也远远不是十年前的前端在做的的事情，要复杂的多，催生出了与之相关的无数的框架和语言。所以我们静下心来，看一下20年前的javascript。

1994年的Netscape推出了名噪一时的Navigator0.9版本，这是第一个成熟的浏览器，但是碰到的问题是无法与用户进行交互，所有的事情只能有服务器侧去判断。而紧接着1995年SUN正式推出了Java，敏锐的Netscape公司判断出了这个”一次构建,处处运行”的语言的未来的可能性，与之合作去试图解决用户交互问题，像我这么老的程序员都知道java小程序（applet）的概念，允许java以applet的形式直接运行，这就是当时他们堆出的方案，但是实际还是过于复杂，最终算是夭折了吧。

Netscape决定设计一个”简化版的java”，而且和当时的SUN也在蜜月期，最终携手将javascript推向了市场。而这里面最主要的人物另外一个父亲，javascript之父Brendan Eich登场了。

### Brendan Eich

1961年出生于美国加州的Brendan Eich为Mozilla的CTO，曾担任过10天CEO，2008年，艾克曾经出资1000美元支持加州的反同性恋婚姻的宪法修正案8号提案。此事2012年被曝光后，艾克就曾经遭到硅谷业内人士和相关媒体的广泛批评。而Brendan Eich最终也因为这个事情的发酵和他自己倔强的态度不得不辞职。

而在1995年4月，年仅34岁的Brendan Eich被Netscape所雇佣，给他的任务就是做这个“简化版java”的设计。而设计原型由高层决定为java，Brendan Eich本人很不喜欢java，据说10天就交了作业。Brendan Eich本人对自己现在风靡一时的作品并不满意，应用文学家Johnson的话对自己的作品进行自嘲：the part that is good is not original, and the part that is original is not good.人生就是这样，往往有心插花未必能开，无心栽柳绿柳成荫。

## JavaScript与ECMAScript

除了Netscape和SUN合力推出的javascript，微软于1996年同IE3.0也一同发布了JScript。当我们说IE中的javascript的时候，一般指的是JScript, 另外还有Cenvi的ScriptEase。于是三种客户端脚本语言同时存在，于是ECMAScript应运而生。

### 两个组织

组织
全称
说明

ECMA
European Computer Manufacturers Association
欧洲计算机制造商协会

ISO/IEC
International Organization for Standardization/International Electro technical Commission
国际标准化组织

### ECMAScript-262

> ECMAScript-262: JavaScript的标准化
>
> ECMAScript标准目前已经到了第八个版本，自从1997年的第一版之后，ECMAScript得到了及其快速的发展和接受。ECMAScript是基于一些既有的技术诸如NetScape的Javascript和Microsoft的JScript。规范说明的详细地址：http://www.ecma-international.org/ecma-262/#

### TC39

> 评估规范的专家技术组为TC39，详细信息可以参看：http://www.ecma-international.org/memento/TC39.htm

#### ECMAScript历史

- **ECMAScript语言规格的规范开始于1996年11月，第一版Ecma标准发布于1997年6月。**
- **1998年4月，Ecma第二版发布，同时ECMA标准提也交给国际标准化组织ISO/IEC，并作为ISO/IEC 16262获得批准**
- **1999年12月，Ecma第三版携同强大的正则表达，更好的字符处理功能，try/catch的异常处理机制等进行了发布**
- **2007年10月，Ecma的第四版草案对第三版做了大幅升级，一经发出便引起巨大争论。以微软和google为首的 大厂商进行了激烈的反对，提议小幅改动，而Javascript的爸爸Brendan Eich为首的改革派毫不退让，最终此版夭折，最终以小幅的变更，作为EcmaScript 3.1进行发布. 其实在第三版之后，ECMAScript已经得到了广泛的认可和接受，而第四版也确实做了非常多的重大工作，夭折的第四版一直能引起无数话题**
- **2009年12月, 第五版最终还是在第三版的基础上增加了一些新的特性而进行了发布，诸如对JSON对象编码的支持，以及支持和强化错误检查和程序安全的严格模式的提供等特性做了增强。**
- **2015年6月，第六版终于携带大量特性进行了真正意义上的强化。从某种意义上来说，由于第四版的夭折带来的，第六版才是1999年的第三版之后的进一步大幅度特性的增强版，十年磨一剑，这次磨了十五年，带来了模块/类/异步编程诸如Promises/以及生成器等等. 而从2015年的版本开始了每年更新的进程，而且名称也变成了ECMAScript YYYY，所以这第六版的名称一般来说就是ECMAScript 2015**
- **2016年6月，发布了ECMAScript 2016，增加了数组方法和一个幂运算符等。严格意义上来说，这是TC39使用新的流程之后的第一个版本。**
- **2017年6月，ECMAScript 2017也已经发布，提出了异步函数/共享内存和Atomics/字符串填充等增强特性**

由于熟悉特性的开发者经常会有ES6/ES7/ES8等用之进行称呼，简单整理如下

版本
简称
一般称呼
发布时间

第1版
ES1
ECMAScript 1
1997年6月

第2版
ES2
ECMAScript 2
1998年4月

第3版
ES3
ECMAScript 3
1999年12月

第4版
ES4
ECMAScript 4
2007年10月草案

第5版
ES5
ECMAScript 5
2009年12月

第6版
ES6
ECMAScript 2015
2015年6月

第7版
ES7
ECMAScript 2016
2016年6月

第8版
ES8
ECMAScript 2017
2017年6月

PS：因为第4版是只有草案的夭折版本，所以没有严格意义上的ES4。

### 六大浏览器&渲染引擎&javascript引擎

项番
浏览器
公司
内核
javascript引擎

No.1
Chrome
Google
WebKit
V8

No.2
Firefox
Mozilla
Gecko
SpiderMonkey

No.3
IE
微软
Trident
Chakra

No.4
Safari
苹果
WebKit
JavaScriptCore

No.5
Edge
微软
Trident
Chakra

No.5
Opera
Opera Software ASA
Presto
Carakan

以下附上2017年10月由statcounter提供的全球浏览器市场份额占比：

之所以列在这里是因为目前ECMAScript的评审的规范是至少有2个javascrip引擎已经支持的特性才能近收入规范的评审，目前核心的javascrip引擎也不会超过5个，基本上需要接近半数共同支持的新特性才能纳入视线，短时间内想出现ES6那样的大规模特性的增加应该是不现实的，因为ES6养个意义上来说是15年的总集，是一个还债的版本。

## 如何选择

直接是用原生态的javascript，还是使用typescript/coffeescript等，还是直接按照ES规范写，到這里可以重新去在看一下Angular团队他们选择typescript的原因，结合自己的情况，进行选择吧。

## tsconfig.json

我们学习angular的时候使用angular cli创建了一个骨架，那个骨架包含29个文件我们进行了一一简单的介绍，其中tsconfig.json是typescript的编译器设置，学习了这篇文章的基础知识，再来重新看一下这个文件的内容，相信你会多少理解更多。

```java
/workspace/HelloAngular cat tsconfig.json
{
  "compileOnSave": false,
  "compilerOptions": {
    "outDir": "./dist/out-tsc",
    "sourceMap": true,
    "declaration": false,
    "moduleResolution": "node",
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "target": "es5",
    "typeRoots": [
      "node_modules/@types"
    ],
    "lib": [
      "es2017",
      "dom"
    ]
  }
}
/workspace/HelloAngular
```

## 总结

这篇文章学习和回顾了一下javascript和typescript以及ECMAScript相关的一些基础知识。
