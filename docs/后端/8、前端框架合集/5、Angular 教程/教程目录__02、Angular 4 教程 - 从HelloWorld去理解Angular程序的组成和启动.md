# 02、Angular 4 教程 - 从HelloWorld去理解Angular程序的组成和启动
- 来源：https://ddkk.com/zhuanlan/qianduan/angular/1/2.html
- 分类：前端框架
- 分组：教程目录
上篇文章中我们了解到了如何使用cli创建一个项目骨架，接下来我们来学习一下这个项目骨架的组成以及Angular程序的启动过程。

## ng new HelloAngular

ngnew HelloAngular创建了名为HelloAngular的一个Angular项目框架，创建了程序骨架，然后下载了所需的依赖库。创建了程序的骨架，具体有如下29个文件：

```java
/workspace ng new HelloAngular
  create HelloAngular/README.md (1028 bytes)
  create HelloAngular/.angular-cli.json (1290 bytes)
  create HelloAngular/.editorconfig (245 bytes)
  create HelloAngular/.gitignore (516 bytes)
  create HelloAngular/src/assets/.gitkeep (0 bytes)
  create HelloAngular/src/environments/environment.prod.ts (51 bytes)
  create HelloAngular/src/environments/environment.ts (387 bytes)
  create HelloAngular/src/favicon.ico (5430 bytes)
  create HelloAngular/src/index.html (299 bytes)
  create HelloAngular/src/main.ts (370 bytes)
  create HelloAngular/src/polyfills.ts (2667 bytes)
  create HelloAngular/src/styles.css (80 bytes)
  create HelloAngular/src/test.ts (1085 bytes)
  create HelloAngular/src/tsconfig.app.json (211 bytes)
  create HelloAngular/src/tsconfig.spec.json (304 bytes)
  create HelloAngular/src/typings.d.ts (104 bytes)
  create HelloAngular/e2e/app.e2e-spec.ts (295 bytes)
  create HelloAngular/e2e/app.po.ts (208 bytes)
  create HelloAngular/e2e/tsconfig.e2e.json (235 bytes)
  create HelloAngular/karma.conf.js (923 bytes)
  create HelloAngular/package.json (1318 bytes)
  create HelloAngular/protractor.conf.js (722 bytes)
  create HelloAngular/tsconfig.json (363 bytes)
  create HelloAngular/tslint.json (2985 bytes)
  create HelloAngular/src/app/app.module.ts (314 bytes)
  create HelloAngular/src/app/app.component.css (0 bytes)
  create HelloAngular/src/app/app.component.html (1120 bytes)
  create HelloAngular/src/app/app.component.spec.ts (986 bytes)
  create HelloAngular/src/app/app.component.ts (207 bytes)
Installing packages for tooling via yarn.
Installed packages for tooling via yarn.
Project 'HelloAngular' successfully created.
```

## 程序骨架文件

ngnew创建了29个文件组成了一个Angular项目的程序骨架，大体这29个文件是用于什么，简单整理如下：

文件
用途

HelloAngular/README.md
项目的基本信息，主要包含使用cli命令如何对项目进行构建/测试/运行等

HelloAngular/.angular-cli.json
CLI的配置文件，可以设定项目的基础信息，比如构建后的目标目录名称等

HelloAngular/.editorconfig
编辑器的配置文件

HelloAngular/.gitignore
为了保证自动生成的文件不被提交的git配置文件

HelloAngular/src/assets/.gitkeep
assets目录用于存放图片等静态资源文件，构建时会拷贝到发布包里。新创建时一般为空，但是由于git会忽略空文件夹，放置.gitkeep这个空文件以保证目录得到管理

HelloAngular/src/environments/environment.prod.ts
生产环境配置文件，在.angular-cli.json中被mapping，mapping值为：prod

HelloAngular/src/environments/environment.ts
开发环境配置，在.angular-cli.json中被mapping，mapping值为：dev

HelloAngular/src/favicon.ico
网页左上角显示的图标

HelloAngular/src/index.html
项目主页

HelloAngular/src/main.ts
Angular程序的入口

HelloAngular/src/polyfills.ts
不同浏览器，比如一些老旧的浏览器及版本的支持

HelloAngular/src/styles.css
全局的样式

HelloAngular/src/test.ts
单元测试入口

HelloAngular/src/tsconfig.app.json
Angular应用的typescript编译器的配置文件

HelloAngular/src/tsconfig.spec.json
单元测试的typescirpt编译器的配置文件

HelloAngular/src/typings.d.ts
项目中使用的typescript类型的引用文件

HelloAngular/e2e/app.e2e-spec.ts
端到端测试文件

HelloAngular/e2e/app.po.ts
端到端测试入口文件

HelloAngular/e2e/tsconfig.e2e.json
用于端到端测试的typescript编译器的配置文件

HelloAngular/karma.conf.js
karma单元测试的配置文件

HelloAngular/package.json
npm的配置文件以及第三方依赖包

HelloAngular/protractor.conf.js
protractor的端到端测试的配置文件

HelloAngular/tsconfig.json
typescirpt编译器的配置文件

HelloAngular/tslint.json
提供给TSLint和Codelyzer的配置信息

HelloAngular/src/app/app.module.ts
模块定义配置文件

HelloAngular/src/app/app.component.css
组件的样式文件

HelloAngular/src/app/app.component.html
组件的HTML模板文件

HelloAngular/src/app/app.component.spec.ts
组件的单元测试文件

HelloAngular/src/app/app.component.ts
组件定义文件

## Angular整体架构

Angular使用扩展语法编写HTML模板，使用组件对其进行管理，通过服务来添加应用逻辑，最后使用模块来对组件进行打包。通过引导根模块来启动该应用， Angular 在浏览器中接管、展现应用的内容，根据操作指令响应用户的交互。

## 启动过程

整个启动过程是通过引导模块来进行的，每个Angular应用至少应该有一个模块，而此模块被称为根模块，一般被习惯命名为App Module，而根模块在Angular程序的入口main.ts中被使用：

```java
/workspace/HelloAngular/src cat main.ts
import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';
import { environment } from './environments/environment';
if (environment.production) {
  enableProdMode();
}
platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.log(err));
/workspace/HelloAngular/src 
```

可以看到，使用Angular的platformBrowserDynamic().bootstrapModule对AppModule进行引导。

## 根模块

### @NgModule装饰器

Angular应用是模块化的，被称为NgModules。@NgModule是一个装饰器，Angular有很多的装饰器，装饰器其实是函数，是用来”装饰”javascript类的函数，它可以把元素据附加到类上。

NgModule装饰器用来描述模块属性，而常见的模块属性为：

属性
说明

declarations
声明本模块中拥有的视图类。Angular 有三种视图类：组件、指令和管道。

exports
declarations 的子集，可用于其它模块的组件模板。

imports
本模块声明的组件模板需要的类所在的其它模块。

providers
服务的创建者，并加入到全局服务列表中，可用于应用任何部分。

bootstrap
指定应用的主视图（称为根组件），它是所有其它视图的宿主。

注意exports属性并不是必须的，因为其他组件无需导入根模块，所以跟模块也不需要导出。

```java
/workspace/HelloAngular/src/app cat app.module.ts
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { AppComponent } from './app.component';
@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
/workspace/HelloAngular/src/app
```

注意只有根模块才能设置bootstrap属性，此例中配置了bootstrap属性的AppModule为此Angular应用的根模块，当然我们也无需犯难，因为此例也只有一个模块。

### Angular的模块库

另外javascript也有模块，javascript的模块用于管理一组javascript的对象，Angular的模块与Javascript的模块不是同一个东西，但是可以有效地互补。

Angular提供了一组javascript的模块库，比如NgModule就是angular/core的Angular库中的模块。Angular的库都带有@angular的前缀。

## 组件

同@NgModule类似，@Component为Angular的组件装饰器，它的常用主要属性有：

属性
说明

selector
CSS 选择器，它告诉 Angular 在父级 HTML 中查找selector中定义的标签，创建并插入该组件。 比如本例中应用的 HTML 包含， Angular 就会把AppComponent 的一个实例插入到这个标签中。

templateUrl
组件 HTML 模板的模块相对地址，如前所示。

providers
组件所需服务的依赖注入提供商数组。 这是在告诉 Angular：该组件的构造函数需要一个HeroService服务，这样组件就可以从服务中获得英雄数据。

在跟模块的bootstrap属性中设定了AppComponent组件，说明根模块引导的为AppComponent组件。AppComponent的具体内容如下：

```java
/workspace/HelloAngular/src/app cat app.component.ts
import { Component } from '@angular/core';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'Angular Examples';
}
/workspace/HelloAngular/src/app 
```

可以看到，所显示的插值变量在此处被设定为显示的值，同时组件装饰器@Component将三个东西结合在了一起，selector和HTML模板以及css样式，而通过插值的方式保证数据进行交互和传递，通过修改该title的内容则可以直接影响输出，通过CSS样式直接调整显示，做到数据和显示的分离，这就是整体Angular程序的启动过程。

## 数据和显示的分离

组件中提供的stypeUrls属性则为了定义组件自己的样式，以做到数据和显示的分离，这里我们再修改一下样式文件已确认效果，修改前样式文件内容为空，显示为：

修改h1/h2/h3标签的样式

```java
/workspace/HelloAngular/src/app cat app.component.css
h1 {
  color:369;
  font-family: Arial, Helvetica, sans-serif;
  font-size: 250%;
}
h2, h3 {
  color:444;
  font-family: Arial, Helvetica, sans-serif;
  font-weight: lighter;
}
/workspace/HelloAngular/src/app
```

修改后显示结果

## 总结

通过这篇文章，我们了解到了cli创建的文件的用途以及Angular程序运行时是如何调用的。接下来我们将会对官方文档中的Tour of Heroes的程序进行解析和确认。
