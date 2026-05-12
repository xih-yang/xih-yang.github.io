# 41、Angular 4 教程 - Jasmine使用介绍
- 来源：https://ddkk.com/zhuanlan/qianduan/angular/1/41.html
- 分类：前端框架
- 分组：教程目录
在Angular中进行单体测试，使用的是Jasmine，这篇文章将就ng new demo所生成出来的代码为例进行说明Angular中是如何使用Jasmine的。

## 什么是Jasmine

Jasmine是一个基于BDD(行为驱动开发)的JavaScript测试框架。它不依赖于其他的JavaScript框架，语法和使用都并不复杂，是前端应用的单元测试常用框架之一。

## 测试执行结果

在前面的文章中，在Angular的工程中，只需要使用ng test，测试就会自动执行，这里我们从测试结果出发，来看一下在Angular工程中Jasmine所起到的作用。结果信息如下

### 结果说明

- 提示有3个specs（测试用例，在Jasmine中被成为specs），0个失败
- 名称为AppComponent的测试用例集包含如下三个测试用例：
- should create the app
- should have as title ‘demo’
- should render title

### 测试对象代码

测试是关于AppComponent组件的，此组件的代码信息如下所示：

```java
liumiaocn:app liumiao$ cat app.component.ts 
import { Component } from '@angular/core';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.less']
})
export class AppComponent {
  title = 'demo';
}
liumiaocn:app liumiao$ grep running app.component.html 
    <span>{
    { title }} app is running!</span>
liumiaocn:app liumiao$
```

代码实际上的作用只是将页面的标题设定为了demo

### 测试页面

前端测试还是有些内容会跟页面显示相关的，比如上述app.component.ts所对应的页面如下所示，三个测试用例中有两个都是与实际的显示相关，比如title应该是demo，另外页面上应该出现demo app is running这2点的测试。

### 测试代码

> 测试文件命名规范与存放位置一般进行如下要求：
>
> 测试文件命名规范：测试对象文件名称.spec.ts
>
> 测试文件存放位置：将测试文件和测试对象文件放在一起

为什么建议放在一起主要有如下原因：

- 测试代码容易找，不必一个一个对应到别的目录去看
- 可以快速看到缺乏测试程序的文件
- 当需要改名文件或者重构的时候，能够记得同时修改测试文件
- 需要移动代码结构的时候，可以很容易地同时移动测试代码

这是Angular官方的解释，在实际的情况下，显然还有更多其他的情况不希望放到一起：

- 测试和开发是彻底分开的，甚至是不同的团队实施
- 希望提供纯粹的源代码
- 开发者或者框架的偏好

不过无论哪种情况，足够的测试都会是一个好的习惯。知道怎么做是一回事，在高强度的工作下，能够做到什么样的平衡则是技术之外的事情。demo的测试代码如下所示：

```java
liumiaocn:app liumiao$ cat app.component.spec.ts 
import { TestBed, async } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AppComponent } from './app.component';
describe('AppComponent', () => {
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        RouterTestingModule
      ],
      declarations: [
        AppComponent
      ],
    }).compileComponents();
  }));
  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app).toBeTruthy();
  });
  it(should have as title 'demo', () =>` {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app.title).toEqual('demo');
  });
  it('should render title', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.debugElement.nativeElement;
    expect(compiled.querySelector('.content span').textContent).toContain('demo app is running!');
  });
});
liumiaocn:app liumiao$
```

可以看到，测试对象只有两行，测试代码却写了这么多，实际上是有如下原因的：

- 包含了测试代码框架的初始化内容，即使只有一行，也是有一部分内容需要做的
- 另外，Angular的测试代码虽然是ts文件，但是测试页面上出现demo app is running的验证项目实际上是在html中的，Angular的框架使之变得简洁，如果是编译后的js文件不会只有两行。
- 自动化测试本身就是需要和开发一样，是需要成本的投入的，自动化测试聚焦更多的是质量。如果期待与自动化测试之后测试成本的大幅降低，一个很重要的前提是，代码更新或者特性更新的比例也是相对较小的，因为代码的变化自然会带来自动化测试代码的变化，牵一发而动一发。
- 自动化测试虽然可能会很多，但是基本上聚焦于事前的数据准备以及断言的执行等较为简单的代码级别。

对上述代码除了Angular本身的功能之外，测试和Jasmine相关的内容进行如下说明：

> TestBed是Angular提供的重要的测试工具，可以用来模拟Angular的@NgModule，一般来说，测试对象的创建往往是通过TestBed来进行的，比如AppComponent的生成就是通过TestBed的createComponent方法来进行的。当然也可以在将其作为事前准备的一部分，在beforeEach中使用configureTestingModule和get方法来获取测试对象。
> describe是Jasmine的语法，相当于单元测试中测试用例集（Test Suite）的概念。使用格式为describe(string, function)，string类型的参数为此测试用例集的名称，用于描述测试用例集的信息。function类型的参数为测试用例集的具体实现。
> it也是Jasmine的语法，相当于单元测试中测试用例（Test Case，在Jasmine中称为spec）的概念。使用格式为describe(string, function)，string类型的参数为此测试用例的名称，用于描述测试用例的信息。function类型的参数为测试用例的具体实现。
> expect类似与其他Unit测试框架中的asset，用于确认期待值和测试结果是否一致。
> 就像普通的测试框架一样，测试用例集中可以包含多个测试用例，每个测试用例中可以有多个expect断言，一个测试文件中可以包含多个测试用例集。测试用例集和测试用例都可以嵌套使用。

## ng test的执行过程

Angular中使用Jasmine，有如下相关的设定：

### angular.json

```java
 84         "test": {
 85           "builder": "@angular-devkit/build-angular:karma",
 86           "options": {
 87             "main": "src/test.ts",
 88             "polyfills": "src/polyfills.ts",
 89             "tsConfig": "tsconfig.spec.json",
 90             "karmaConfig": "karma.conf.js",
 91             "assets": [
 92               "src/favicon.ico",
 93               "src/assets"
 94             ],
 95             "styles": [
 96               "src/styles.less"
 97             ],
 98             "scripts": []
 99           }
100         },
```

可以看到此处测试的入口为src/test.ts文件

```java
liumiaocn:demo liumiao$ cat src/test.ts 
// This file is required by karma.conf.js and loads recursively all the .spec and framework files
import 'zone.js/dist/zone-testing';
import { getTestBed } from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting
} from '@angular/platform-browser-dynamic/testing';
declare const require: any;
// First, initialize the Angular testing environment.
getTestBed().initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting()
);
// Then we find all the tests.
const context = require.context('./', true, /\.spec\.ts$/);
// And load the modules.
context.keys().map(context);
liumiaocn:demo liumiao$ 
```

通过上述文件中的`require.context('./', true, /\.spec\.ts$/)`就可以了解到为何测试文件的名称需要为.spec.ts 了。
