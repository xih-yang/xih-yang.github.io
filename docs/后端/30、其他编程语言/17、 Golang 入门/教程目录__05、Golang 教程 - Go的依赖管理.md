# 05、Golang 教程 - Go的依赖管理
- 来源：https://ddkk.com/zhuanlan/other/golang/3/5.html
- 分类：其他语言
- 分组：教程目录
## 依赖

依赖就是别人写的库

## 依赖管理的三个阶段

```java
- GOPATH
- GOVENDOR
- go mod 
```

## GOPATH

- 就是给一个目录，然后我的所有的依赖就来这个目录下面找
- 默认在～/go
- 默认会去GOPATH的src目录下找
- 问题：所有项目都在GOPATH目录下，这样会导致目录越来越大，几乎所有的github都镜像到GOPATH下

## GOVENDOR

- 每一个项目都有一个vendor目录，用来存放第三方的库，这样的话，默认先去vendor目录下面找，然后如果找不到再去go的安装目录找，再找不到去GOPATH下面找。

## go mod

- 用go命令统一管理，用户不必关心目录结构
- 会生成一个go.mod文件(会自动生成)
- 第一种： 用命令行拉取

```java
go get -u xxx@版本号  拉取制定版本号
go get -u xxx 拉取最新版本
go get -u go.uber.org/zap
go get -u go.uber.org/zap@v1.11
```

- 第二种：直接在代码里面写入import, 会直接帮你拉下来。
- 初始化：go mod init xxx(xxx 为module名称 可以自定义)
- 增加依赖:go get xxx 或者import然后get build或者点击快捷方式时自动生成依赖
- 更新依赖：go get [@v...]
- 更新依赖后移除多余依赖：go mod tidy
- 项目迁移到go mod：

```java
go mod init xxx
go build ./... build当前目录下的所有子目录
```

### 目录整理

- go bulid：默认会编译该目录下的所有go文件（go build 后面也可以带具体的文件名，只编译那个文件，不会报错）
- 可能会报错，因为多个`go`文件中可能存在重复的main函数
- 解决办法：将main函数文件存放在各自的单独的目录下（这个方法也是go语言官方的解决办法，一个项目其实也不会有很多的main函数，所以这个是可行的）

```java
go build ./... 编译
go install ./... 产生的结果在GOPATH目录下的bin目录
```
