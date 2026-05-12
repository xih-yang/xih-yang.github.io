# 05、Node.js 使用淘宝 NPM 镜像
- 来源：https://ddkk.com/zhuanlan/qianduan/nodejs/5.html
- 分类：前端框架
- 分组：教程目录
大家都知道国内直接使用 npm 的官方镜像是非常慢的，这里推荐使用淘宝 NPM 镜像

淘宝NPM 镜像是一个完整 npmjs.org 镜像，可以用来代替官方版本(只读)，同步频率目前为 10 分钟 一次以保证尽量与官方服务同步

我们可以使用淘宝定制的 cnpm (gzip 压缩支持) 命令行工具代替默认的 npm

### 安装 cnpm

```javascript
$ npm install -g cnpm --registry=https://registry.npm.taobao.org
```

然后就可以使用 cnpm 命令来安装模块了

```javascript
$ cnpm install [name]
```

### npm –registry

当然，我们也可以不安装 cnpm 而直接使用 npm

只要加上 --registry=https://registry.npm.taobao.org 属性即可

比如安装 express 可以使用下面的命令

```javascript
$ npm install express --registry=https://registry.npm.taobao.org
```

更多信息可以查阅： [http://npm.taobao.org/](http://npm.taobao.org/)
