# 05、Ruby Mac OS X 上环境配置
- 来源：https://ddkk.com/zhuanlan/other/ruby/5.html
- 分类：Ruby 教程
- 分组：教程目录
Linux 系统一般已经安装了 Ruby 语言，你只要在 **终端** 里输入 ruby -v 如果类似下面则说明已经安装了 Ruby

```ruby
$ ruby -v
ruby 2.4.0p0 (2016-12-24 revision 57164) [x86_64-darwin16]
```

如果没有任何输出，那么表示你的系统上没有安装 Ruby 语言，你可以使用下面两种方式安装

> 注意： 在安装之前，请确保你有 root 权限。

## 自动安装 Ruby

最简单的安装 Ruby 的方式是使用 **brew** 命令 在命令提示符中输入以下的命令，即可在您的计算机上安装 Ruby

```ruby
$ sudo brew install ruby
```

## 源码安装

系统自动安装的 Ruby 版本可能有点低，或者你无法使用自动安装，则可以使用源码编译的方法来配置 Ruby 环境

### 源码编译 Ruby 的步骤如下

**1、** 下载最新版的Ruby压缩文件[请点击这里下载](http://www.ruby-lang.org/en/downloads/)；

```ruby
$ cd ~/Downloads
$ wget https://cache.ruby-lang.org/pub/ruby/2.4/ruby-2.4.2.tar.gz
```

**2、** 下载Ruby之后，使用下面的命令解压：

```ruby
$ tar -xvzf ruby-2.4.2.tgz    
$ cd ruby-2.4.2
```

**3、** 配置并编译源代码；

```ruby
$ ./configure
$ make
$ sudo make install
```

**4、** 安装后，通过在命令行中输入以下命令来确保一切工作正常；

```ruby
$ ruby -v
ruby 2.4.2...
```

如果一切工作正常，将会输出所安装的 Ruby 解释器的版本，如上所示。如果您安装了其他版本，则会显示其他不同的版本。
