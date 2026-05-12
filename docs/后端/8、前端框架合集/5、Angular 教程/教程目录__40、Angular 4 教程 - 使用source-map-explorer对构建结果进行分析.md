# 40、Angular 4 教程 - 使用source-map-explorer对构建结果进行分析
- 来源：https://ddkk.com/zhuanlan/qianduan/angular/1/40.html
- 分类：前端框架
- 分组：教程目录
在前面一篇文章中介绍了使用webpack-bundle-analyzer对构建结果大小进行分析的方法，这篇文章来介绍另外一种工具：source-map-explorer的使用方式。

## 概要介绍

source-map-explorer是通过对source map文件进行确认之后得出各个组件的分析结果的。而这些source map文件在Angular中则体现为后缀为.map的文件，而这些文件就是source map的文件。

- 为什么会有source map文件呢？

> 以Angular为例，我们在Angular中已经不再是使用原生的JavaScript，而是使用typescript，而我们所写的的这些后缀为.ts的typescript代码作为前端应用运行起来的时候则需要经过编译的过程，而编译则是将这些代码转换为JavaScript代码。而当问题出现的时候，为了定位则需要了解这些转换后的代码和Angular的代码之间的关联映射关系，而这正是source map的作用。
>
> 除此之外，随着前端框架的蓬勃发展，在使用的过程中，JavaScript代码的压缩、合并与转换操作也越来越常见，所以作用于定位的source map也非常之重要。

## source-map-explorer

- URL链接：https://github.com/danvk/source-map-explorer

## 使用方法

### 步骤1: 安装source-map-explorer

> 安装方法：npm install -g source-map-explorer

### 步骤2: 构建打包并生成sourcemap文件

以下对ng-alain的demo应用进行结果分析，使用ng-alain的方法可参看：

- /zhuanlan/qianduan/angular/1/38.html

使用如下命令对上述应用进行打包并生成结果的json文件

> 执行命令：ng build --prod --source-map

执行日志如下所示

```java
liumiaocn:alain-demo liumiao$ ng build --prod --source-map
92% chunk asset optimization TerserPlugin
<--- Last few GCs --->
...省略
FATAL ERROR: Ineffective mark-compacts near heap limit Allocation failed - JavaScript heap out of memory
 ...省略
Abort trap: 6
liumiaocn:alain-demo liumiao$ 
```

#### 问题与对应方法

可以看到上述结果中出现了FATAL ERROR：

```java
FATAL ERROR: Ineffective mark-compacts near heap limit Allocation failed - JavaScript heap out of memory
```

原因是因为堆空间不足, 使用如下命令在npm中设定max_old_space_size即可

> 对应方法：npm run color-less && node --max_old_space_size=5120 ./node_modules/@angular/cli/bin/ng build --prod --source-map

执行日志如下所示：

```java
liumiaocn:alain-demo liumiao$ npm run color-less && node --max_old_space_size=5120 ./node_modules/@angular/cli/bin/ng build --prod --source-map
> alain-demo@0.0.0 color-less /Users/liumiao/alain-demo
> node scripts/color-less.js
? Theme generated successfully. OutputFile: /Users/liumiao/alain-demo/src/assets/alain-default.less
Theme generated successfully
Generating ES5 bundles for differential loading...
ES5 bundle generation complete.
chunk {0} runtime-es2015.3bbf450ebabafdcfd0b8.js, runtime-es2015.3bbf450ebabafdcfd0b8.js.map (runtime) 2.32 kB [entry] [rendered]
chunk {0} runtime-es5.3bbf450ebabafdcfd0b8.js, runtime-es5.3bbf450ebabafdcfd0b8.js.map (runtime) 2.26 kB [entry] [rendered]
chunk {2} polyfills-es2015.34c1a0caedadd28b3680.js, polyfills-es2015.34c1a0caedadd28b3680.js.map (polyfills) 36.5 kB [initial] [rendered]
chunk {5} 5-es2015.4d947d6ee420fb167b65.js, 5-es2015.4d947d6ee420fb167b65.js.map () 11.7 kB  [rendered]
chunk {5} 5-es5.4d947d6ee420fb167b65.js, 5-es5.4d947d6ee420fb167b65.js.map () 11.7 kB  [rendered]
chunk {6} 6-es2015.708bea98660cf0bdf3fd.js, 6-es2015.708bea98660cf0bdf3fd.js.map () 113 kB  [rendered]
chunk {6} 6-es5.708bea98660cf0bdf3fd.js, 6-es5.708bea98660cf0bdf3fd.js.map () 113 kB  [rendered]
chunk {3} polyfills-es5.da4d0bf97e8123004df6.js, polyfills-es5.da4d0bf97e8123004df6.js.map (polyfills-es5) 122 kB [initial] [rendered]
chunk {1} main-es2015.ad8342eee00c48d310f4.js, main-es2015.ad8342eee00c48d310f4.js.map (main) 1.69 MB [initial] [rendered]
chunk {1} main-es5.ad8342eee00c48d310f4.js, main-es5.ad8342eee00c48d310f4.js.map (main) 1.85 MB [initial] [rendered]
chunk {4} styles.f4bc93f25260a03907f9.css, styles.f4bc93f25260a03907f9.css.map (styles) 549 kB [initial] [rendered]
chunk {scripts} scripts.954dac1e94a9b5d3eaad.js, scripts.954dac1e94a9b5d3eaad.js.map (scripts) 1.13 MB [entry] [rendered]
Date: 2019-10-11T20:16:36.820Z - Hash: d03446ba0ef36f47e208 - Time: 200344ms
liumiaocn:alain-demo liumiao$
```

而生成的结果如下所示，有map文件和js文件

```java
liumiaocn:alain-demo liumiao$ ls dist/alain-demo/
3rdpartylicenses.txt                         favicon.ico                                  runtime-es2015.3bbf450ebabafdcfd0b8.js
5-es2015.4d947d6ee420fb167b65.js             index.html                                   runtime-es2015.3bbf450ebabafdcfd0b8.js.map
5-es2015.4d947d6ee420fb167b65.js.map         main-es2015.ad8342eee00c48d310f4.js          runtime-es5.3bbf450ebabafdcfd0b8.js
5-es5.4d947d6ee420fb167b65.js                main-es2015.ad8342eee00c48d310f4.js.map      runtime-es5.3bbf450ebabafdcfd0b8.js.map
5-es5.4d947d6ee420fb167b65.js.map            main-es5.ad8342eee00c48d310f4.js             scripts.954dac1e94a9b5d3eaad.js
6-es2015.708bea98660cf0bdf3fd.js             main-es5.ad8342eee00c48d310f4.js.map         scripts.954dac1e94a9b5d3eaad.js.map
6-es2015.708bea98660cf0bdf3fd.js.map         polyfills-es2015.34c1a0caedadd28b3680.js     styles.f4bc93f25260a03907f9.css
6-es5.708bea98660cf0bdf3fd.js                polyfills-es2015.34c1a0caedadd28b3680.js.map styles.f4bc93f25260a03907f9.css.map
6-es5.708bea98660cf0bdf3fd.js.map            polyfills-es5.da4d0bf97e8123004df6.js
assets                                       polyfills-es5.da4d0bf97e8123004df6.js.map
liumiaocn:alain-demo liumiao$ 
```

### 步骤3: 确认结果

以生成的main*的js文件为例，进行分析，使用命令和结果如下所示：

> 命令：source-map-explorer 文件名称

正常的情况下，会将生成的html文件自动打开浏览器进行显示，执行日志信息如下所示：

```java
liumiaocn:alain-demo liumiao$ source-map-explorer main-es2015.ad8342eee00c48d310f4.js
main-es2015.ad8342eee00c48d310f4.js
  Unable to map 140/1773942 bytes (0.01%)
liumiaocn:alain-demo liumiao$
```

本例的结果显示如下图所示：
