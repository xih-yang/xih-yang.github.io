# 01、Golang 教程 - 开发环境安装
- 来源：https://ddkk.com/zhuanlan/other/golang/4/1.html
- 分类：其他语言
- 分组：教程目录
#### go安装

分别下载对应系统的版本，下载地址：[http://www.golangtc.com/download](http://www.golangtc.com/download)

##### Windows golang安装

下载go1.9.2.windows-386.msi文件,然后傻瓜式安装。安装路径就使用它默认的 C:\Go\ 即可，之后一路 Next 。

## windows配置环境变量

Go语言需要配置 GOROOT 和 Path 两个环境变量：GOROOT 和 GOPATH。

## 根目录 GOROOT 和 Path

如果第一步安装使用的是默认安装目录 C:\Go\，那么安装程序就已经将 GOROOT 和 Path 两个环境变量设置好了，无须再对其进行手工设置。

如果你第一步没有使用默认安装目录，那么需要对上述两个变量进行手工配置

## Go 工作目录 GOPATH

这个是后续代码目录，新建系统变量 GOPATH，将其指向你的代码目录：

##### Mac 安装go

下载go1.9.2.darwin-amd64.pkg文件,然后傻瓜式安装。默认会安装到/usr/local/go

## 配置环境变量

上面安装完成之后,还需要配置环境变量，在当前用户的目录下创建 .bash_profile 文件 ，如果有的话不用创建

```java
#进入home目录
cd ~
#创建.bash_profile
touch .bash_profile
#创建完成后 vi 打开对应的文件 
vim .bash_profile
#修改文件内容为:
export GOROOT=/usr/local/go
export GOPATH=/Users/wangsaichao/goProjects
export PATH=$PATH:$GOROOT/bin:$GOPATH/bin
#保存退出 运行下面命令 使刚刚配置的环境变量生效
source ~/.bash_profile
```

##### Linux安装go

下载go1.9.2.linux-amd64.tar.gz文件

由于默认的go路径，在/usr/local下， 所以用如下命令，解压创建/usr/local/go

```java
tar -C /usr/local -xzf go1.9.2.linux-amd64.tar.gz 
```

## 配置环境变量

```java
#编辑profile
vi /etc/profile 
#然后加入下面内容: 
export PATH=$PATH:/usr/local/go/bin 
export GOPATH=/home/gopath
#保存后，执行以下命令，使环境变量立即生效: 
source /etc/profile 
```

至此，Go语言 在不同环境下安装完毕。

##### 关于GOPATH

Go的工作空间（例如：我们的开发目录 /Users/wangsaichao/goProjects）。工作空间的概念搞清楚。用户源代码目录。也就是放我们项目源代码的地方。

根据约定，工作空间GOPATH是一个目录层次结构，其根目录包含三个子目录：

- src：包含 Go 源文件（例如：.go、.c、.h、.s 等）
- pkg：包含包对象，编译好的库文件（例如：.a）
- bin：包含可执行命令(为了方便，可以把此目录加入到 系统 的 PATH 变量中，在环境变量 PATH 后追加 %GOPATH%\bin)

环境安装完成 使用 `go version` 查看go版本

使用`go env` 查看Go语言通用环境信息,如下：

参考官网：[https://golang.org/cmd/go/#hdr-Environment_variables](https://golang.org/cmd/go/#hdr-Environment_variables)

```java
#程序构建环境的目标计算架构
GOARCH="amd64"
#存放可执行文件的目录的绝对路径
GOBIN=""
#可执行文件的后缀
GOEXE=""
#程序运行环境的目标计算架构
GOHOSTARCH="amd64"
#程序运行环境的目标操作系统
GOHOSTOS="darwin"
#程序构建环境的目标操作系统
GOOS="darwin"
#工作区目录的绝对路径
GOPATH="/Users/wangsaichao/goProjects"
#用于数据竞争检测的相关选项
GORACE=""
#Go语言的安装目录的绝对路径
GOROOT="/usr/local/go"
#Go工具目录的绝对路径
GOTOOLDIR="/usr/local/go/pkg/tool/darwin_amd64"
#运行'go build -compiler = gccgo'的gccgo命令。
GCCGO="gccgo"
#下面C开头命令都是与cgo一起使用的环境变量
#用于编译C代码的命令
CC="clang"
#
GOGCCFLAGS="-fPIC -m64 -pthread -fno-caret-diagnostics -Qunused-arguments -fmessage-length=0 -fdebug-prefix-map=/var/folders/42/zqjbvnv57wdbtq531w9nxy900000gn/T/go-build768187669=/tmp/go-build -gno-record-gcc-switches -fno-common"
#用于编译C ++代码的命令
CXX="clang++"
#是否支持cgo命令。0或1
CGO_ENABLED="1"
#在编译C代码时cgo将传递给编译器的标志
CGO_CFLAGS="-g -O2"
CGO_CPPFLAGS=""
CGO_CXXFLAGS="-g -O2"
CGO_FFLAGS="-g -O2"
CGO_LDFLAGS="-g -O2"
PKG_CONFIG="pkg-config"
```

##### Go常用命令简介

类似于java中常用的命令,例如 javac java等等。

`goget`：获取远程包（需 提前安装 git或hg）

`gorun`：直接运行程序

`gobuild`：测试编译，检查是否有编译错误

`gofmt`：格式化源码（部分IDE在保存时自动调用）

`goinstall`：编译包文件并编译整个程序

`gotest`：运行测试文件

`godoc`：查看文档 例如： go doc fmt 显示fmt所有的函数，使用godoc fmt Println查看单个函数

## 运行本地官网

使用godoc -http=:8080 命令可以在本地的8080端口启动一个和官网一样的网站。
