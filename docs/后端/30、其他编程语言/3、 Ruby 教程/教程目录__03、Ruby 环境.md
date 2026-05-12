# 03、Ruby 环境
- 来源：https://ddkk.com/zhuanlan/other/ruby/3.html
- 分类：Ruby 教程
- 分组：教程目录
运行Ruby 代码需要配置 Ruby 编程语言的环境。本章我们会学习到如何在各个平台上配置安装 Ruby 环境。

### 各个平台上安装 Ruby 环境

- Linux/Unix 上的 Ruby 安装 如果你的操作系统是 Linux/Unix ，那么请查看本章节的内容
- Mac OS 上的 Ruby 安装 如果你的操作系统是 Mac OS ，那么请查看本章节的内容
- Windows 上的 Ruby 安装 如果你的操作系统是 Windows，那么请查看本章节的内容
- Ruby 命令行选项 本章列出了所有的命令行选项，您可以和 Ruby 解释器一起使用这些命令行选项
- Ruby 环境变量 本章列出了跟 Ruby 相关的环境变量，设置这些环境变量可以让 Ruby 解释器工作

### 流行的 Ruby 编辑器

为了编写 Ruby 程序，您需要一个编辑器

作为初学者，本教程推荐你使用集成开发环境。现在流行的 Ruby 的集成开发环境有

- [RubyMine](http://www.jetbrains.com/ruby/) 虽然是收费的，但有 30 天的免费试用期，这个时间，够我们学会 Ruby 开发了

RubyMine 是一个为 Ruby 和 Rails开发者准备的 IDE，其带有所有开发者必须的功能，并将之紧密集成于便捷的开发环境中，号称最智能的 Ruby 和 Rails 的 IDE，能够大大增加 Ruby 和 Rails 开发者的开发效率

- [Visual Studio Code](https://code.visualstudio.com/) Microsoft 在 2015 年 4 月 30 日 Build 开发者大会上正式宣布的一款真正的跨平台编辑器

一个运行于 Mac OS X、Windows 和 Linux 之上的，针对于编写现代 Web 和云应用的跨平台源代码编辑器

Visual Studio Code 与 CodeRunner 插件配合，可以很好的运行 Ruby 代码

- [VIM](http://vim.sourceforge.net/) VIM 是一个简单的文本编辑器，几乎在所有的 Unix 上都是可用的，现在也能在 Windows 上使用。 另外，您还可以使用您喜欢的 vi 编辑器来编写 Ruby 程序。

### 交互式 Ruby（IRb）

交互式Ruby（IRb）是 Ruby 提供的一个可以直接执行 Ruby 的 shell 使用 IRb shell 可以逐行立即查看解释结果

IRb会随着 Ruby 自动安装，所以你不需要做其它额外的事情，IRb 即可正常工作

只需要在命令提示符中键入 **irb** ，一个交互式 Ruby Session 将会开始

```ruby
$ irb
2.4.0 :001 > def hello
2.4.0 :002?>   out = "Hello World"
2.4.0 :003?>   puts out
2.4.0 :004?>   end
 => :hello 
2.4.0 :005 > hello
Hello World
 => nil 
2.4.0 :006 > 
```

你可以先忽略上面具体的命令的执行内容，因为我们将在后续的章节学习到

## 接下来将学习什么？

如果你已经配置好了 Ruby 环境，且已经做好编写第一个 Ruby 程序的准备。那么记下来我们可以开始学习 Ruby 语法
