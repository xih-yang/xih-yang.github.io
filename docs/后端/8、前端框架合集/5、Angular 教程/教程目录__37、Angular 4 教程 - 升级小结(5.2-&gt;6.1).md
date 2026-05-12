# 37、Angular 4 教程 - 升级小结(5.2-&gt;6.1)
- 来源：https://ddkk.com/zhuanlan/qianduan/angular/1/37.html
- 分类：前端框架
- 分组：教程目录
在前面的文章中也曾经分别提到过，angular6由于存在一些稍大的变化，所以不能像Angular4到Angular5那样基本无感地进行升级，这里结合官方提示，简单整理一下Angular5.2到目前稳定的6.1的升级要点。

> 升级前后版本：
>
>
>
>
> 升级前版本
> 升级后版本
>
>
>
>
> 5.2
> 6.1

## 事前准备

### 变更内容

V5.2
V6.1
说明

HttpModule
HttpClientModule
修改import与import

Http
HttpClient
修改import与import

@angular/core
@angular/animations
使用animation服务或工具的情况时

ngOutletContext
ngTemplateOutletContext
事前确认使用状况

CollectionChangeRecord
IterableChangeRecord
事前确认使用状况

Renderer
Renderer2
事前确认使用状况

preserveQueryParams
queryParamsHandling
事前确认使用状况

@angular/platform-browser里的DOCUMENT
@angular/common
事前确认使用状况

ReflectiveInjector
StaticInjector
事前确认使用状况

versionedFiles
files
使用了Angular Service worker的状况下

除此之外，还需要确认如下内容：

- tsconfig.json: preserveWhitespaces设定为off（v6缺省设定）
- package.json中scripts的使用，所有的cli命令统一使用两个横线–传入参数（POSIX规范）
- ngModelChange行为发生变化，请确认使用相关方式，升级后动作是否正常。
- Typescript使用strict模式的情况下（tsconfig.json的strict被设定为true时）,更新tsconfig.json使strictPropertyInitialization无效，或者在ngOnInit中移除属性的初期化

## 更新

### 更新cli

- Node版本确认：Node8及其以上
- 更新本地和全局的angular cli
- 修改配置文件angular.json

可以使用如下命令实现：

> sudo npm install -g @angular/cli@6.1.5
>
> npm install @angular/cli@6.1.5
>
> ng update @angular/cli

### 更新angular framework

> 更新Angular framework到v6，以及相应的RxJS和TypeScript版本
>
> ng update @angular/core

### 更新Angular Material

> ng update @angular/material

### 更新其他package

> ng update

## rxjs的修改

rxjs可以使用rxjs-compat模式进行兼容，对应完毕之后，再移除即可。

关于http和rxjs的使用详细的变化的使用，前面的几篇文章中有所提到，这里不再赘述。

## 参考内容

[https://update.angular.io/](https://update.angular.io/)

[https://github.com/angular/angular-cli/wiki/angular-workspace](https://github.com/angular/angular-cli/wiki/angular-workspace)

[https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-7.html#strict-class-initialization](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-7.html#strict-class-initialization)

[https://github.com/ReactiveX/rxjs-tslint](https://github.com/ReactiveX/rxjs-tslint)
