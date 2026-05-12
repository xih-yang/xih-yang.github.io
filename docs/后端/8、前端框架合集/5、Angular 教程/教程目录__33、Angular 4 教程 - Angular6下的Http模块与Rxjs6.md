# 33、Angular 4 教程 - Angular6下的Http模块与Rxjs6
- 来源：https://ddkk.com/zhuanlan/qianduan/angular/1/33.html
- 分类：前端框架
- 分组：教程目录
Angular6的升级，略有影响的地方应该主要集中在Rxjs6，而至于http，在Angular4.3之后就发生了变化，如果没有欠债的话，升级应该很简单。即使有欠债的话，修改的内容也不多。

## rxjs的变换

rxjs6主要在包的结构/pipe的使用方式/API的重命名这几点与旧版本的使用方式不相容的变更，所以导致在实际使用中，有如下的变化

### import的方式

import类型
旧版方式
新版方式（rxjs6）

Observable
import { Observable } from ‘rxjs/observable’
import { Observable } from ‘rxjs’

map
import ‘rxjs/add/operator/map’
import { map } from ‘rxjs/operator’

fromPromise
import ‘rxjs/add/observable/fromPromise’
import { fromPromise } from ‘rxjs’

常见的一些导入方式：

```java
import { Observable, Subject, asapScheduler, pipe, of, from, interval, merge, fromEvent, combineLatest, SubscriptionLike, PartialObserver,concat,combineLatest } from 'rxjs';
import { map, filter, scan } from 'rxjs/operators';
import { webSocket } from 'rxjs/webSocket';
import { ajax } from 'rxjs/ajax';
import { TestScheduler } from 'rxjs/testing';
```

### API 重命名

旧版
新版（rxjs6）

do()
tap()

catch()
catchError()

switch()
switchAll()

finally()
finalize()

throw()
throwError()

整体来说，这次变更使得包的结构更为清晰，缺省利用rxjs进行引用，operator全部集中到rxjs/operator下进行管理

## http调用部分

angular的调用可以简单分为使用Http提供的服务取得Observable的返回值，根据Observable的返回值进行subscribe操作两段，这里也简单地整理一下两种方式下的使用方法的不同

旧版
新版（4.3之后）

Http
HttpClient

Response
HttpResponse

Request
HttpRequest

Headers
HttpHeaders

首先在http调用部分，最大的区别在于直接返回

### get

#### 旧版

```java
http为@angular/http下的Http
http.get(url).map(response: Response) => {
    response.json().xxxx进行引用
}
```

#### 新版

```java
http为@angular/common/http下的HttpClient
http.get(url).pipe(map(item => item['xxxxxx']));
}
```

### put/post

#### 旧版

```java
http为@angular/http下的Http
headers = new Headers({
    'Content-type': 'application/json'});
http.put(url, JSON.stringify(body),{headers: headers}).map((response: Response) => {
    response.json.xxxxx进行引用
})
```

#### 新版

```java
http为@angular/common/http下的HttpClient
headers = new HttpHeaders({
    'Content-type': 'application/json'});
http.put(url)put(url, JSON.stringify(body),{headers: headers}).pipe(map(item => {
  item['xxxxxx']引用
  }));
}
```

### delete

#### 旧版

```java
http为@angular/http下的Http
http.delete(url).map(response: Response) => {
    response.json().xxxx进行引用
}
```

#### 新版

```java
http为@angular/common/http下的HttpClient
http.delete(url).pipe(map(item => item['xxxxxx']));
}
```

## subscribe调用部分

对Observable值进行subscribe的使用：

```java
Observable值
.subscribe(respose => {
  使用response进行引用
})
```

## 总结

这篇文章整理了一下关于Angular6中使用http和rxjs相关的一些基础以及新旧的使用方式的一些差别，下篇文章开始使用rxjs6等进行一个Rest的CRUD操作。
