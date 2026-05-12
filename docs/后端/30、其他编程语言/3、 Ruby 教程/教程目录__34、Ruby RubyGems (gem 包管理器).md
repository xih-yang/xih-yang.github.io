# 34、Ruby RubyGems (gem 包管理器)
- 来源：https://ddkk.com/zhuanlan/other/ruby/34.html
- 分类：Ruby 教程
- 分组：教程目录
RubyGems 是 Ruby 最流行的包管理器，它不仅提供一个分发 Ruby 程序和库的标准格式，还提供一个管理程序包安装的工具

RubyGems 旨在方便地管理 gem 安装的工具，以及用于分发 gem 的服务器。 RubyGems 似于 Ubuntu 下的apt-get, Centos 的 yum，Python 的 pip

RubyGems 首次发布于2003年11月，从 Ruby 1.9 版起成为 Ruby 标准库的一部分

### Ruby `< 1.9

如果你的的 Ruby 低于 1.9 版本，可以通过手动安装

**1、** 首先下载安装包：[https://rubygems.org/pages/download](https://rubygems.org/pages/download)；

**2、** 解压并进入目录，执行命令：rubysetup.rb；

### 更新 RubyGems 命令：

RubyGems 为 Ruby 提供了 gem Shell 命令

```ruby
$ gem update --system          # 需要管理员或 root用户
```

## Gem

Gem是 Ruby 模块 (叫做 Gems) 的包管理器 Gem 包含包信息，以及用于安装的文件

Gem是依照 .gemspec 文件构建的，包含了有关 Gem 信息的 YAML文件。 Ruby 代码也可以直接建立 Gem，这种情况下通常利用 Rake 来进行

### gem 命令

gem命令用于构建、上传、下载以及安装 Gem 包

### gem 用法

RubyGems 提供的 **gem** 在功能上与 apt-get、portage、yum 和 npm 非常相似

#### 安装 gem 包：

```ruby
gem install mygem
```

#### 卸载

```ruby
gem uninstall mygem
```

#### 列出已安装的 gem

```ruby
gem list --local
```

#### 列出可用的 gems

```ruby
gem list --remote
```

#### 为所有的 gems 创建 RDoc 文档

```ruby
gem rdoc --all
```

#### 下载一个gem，但不安装：

```ruby
gem fetch mygem
```

#### 从可用的 gem 中搜索

```ruby
gem search STRING --remote
```

## gem 包的构建

gem命令可以用来构建和维护 .gemspec 和 .gem 文件

利用.gemspec 文件构建 .gem

```ruby
$ gem build mygem.gemspec
```
