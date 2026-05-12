# 39、Angular 4 教程 - 使用webpack-bundle-analyzer对构建结果进行分析
- 来源：https://ddkk.com/zhuanlan/qianduan/angular/1/39.html
- 分类：前端框架
- 分组：教程目录
webpack-bundle-analyzer是一个npm的package，可以用于构建结果的分析。在实际的使用中，由于Angular页面的特点，项目稍大一些之后，即使使用了prod等选项进行优化，也往往编译后会有数M之大。这时使用webpack-bundle-analyzer即可对结果进行分析，可以通过webpack-bundle-analyzer生成的分析结果对各个组成部分的大小进行非常方便的确认。

## webpack-bundle-analyzer

- URL链接：https://www.npmjs.com/package/webpack-bundle-analyzer

## 使用方法

### 步骤1: 安装webpack-bundle-analyzer

> 安装方法：npm install -g webpack-bundle-analyzer

### 步骤2: 构建打包并生成json文件

以下对ng-alain的demo应用进行结果分析，使用ng-alain的方法可参看：

- /zhuanlan/qianduan/angular/1/38.html

使用如下命令对上述应用进行打包并生成结果的json文件

> 执行命令：ng build --prod --stats-json

执行日志如下所示

```java
liumiaocn:alain-demo liumiao$ ng build --prod --stats-json
Generating ES5 bundles for differential loading...
ES5 bundle generation complete.
chunk {2} polyfills-es2015.0ef207fb7b4761464817.js (polyfills) 36.4 kB [initial] [rendered]
...省略
WARNING in budgets, maximum exceeded for initial. Budget 2 MB was exceeded by 2.51 MB.
liumiaocn:alain-demo liumiao$ 
liumiaocn:alain-demo liumiao$ ls dist/alain-demo/*.json
dist/alain-demo/stats-es2015.json
liumiaocn:alain-demo liumiao$
```

#### 问题与对应方法

可以看到上述结果中出现了WARNING：

```java
WARNING in budgets, maximum exceeded for initial. Budget 2 MB was exceeded by 2.51 MB.
```

原因是因为angular.json中maximumWarning的最小设定2MB过小，实际达到了4.51MB(超出了2.51MB)

```java
 57               "budgets": [
 58                 {
 59                   "type": "initial",
 60                   "maximumWarning": "2mb",
 61                   "maximumError": "5mb"
 62                 },
```

> 对应方法：将上述文件的maximumWarning从2mb修改为5mb即可

### 步骤3: 确认结果

正常的情况下，应该会在dist目录下生成一个名为stats.json的文件，然后使用此文件作为webpack-bundle-analyzer的输入即可确认构建之后各个部分的大小。这里使用的ng-alain缺省的情况下的目录为dist/alain-demo，这个原因是因为angular.json中的路径配置差生的，另外文件名也变成了stats-es2015.json，但是了解到这个是webpack-bundle-analyzer所分析的内容，直接作为参数传入即可。

> 命令：webpack-bundle-analyzer dist/alain-demo/stats-es2015.json
>
> 或者
>
> npx webpack-bundle-analyzer dist/alain-demo/stats-es2015.json

注：如果一直提示端口8888被占用，有时可以考虑重启一下有可能这种奇怪的问题就会消失。

正常的情况下，会自动打开浏览器在本地的8888端口显示分析结果，执行日志信息如下所示：

```java
liumiaocn:alain-demo liumiao$ webpack-bundle-analyzer dist/alain-demo/stats-es2015.json 
Error parsing bundle asset "/Users/liumiao/alain-demo/dist/alain-demo/polyfills-es5-es2015.2b9ce34c123ac007a8ba.js": no such file
Webpack Bundle Analyzer is started at http://127.0.0.1:8888
Use Ctrl+C to close it
```

本例的结果显示如下图所示：
