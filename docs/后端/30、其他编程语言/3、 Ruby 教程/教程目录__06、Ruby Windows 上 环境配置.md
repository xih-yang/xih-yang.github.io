# 06、Ruby Windows 上 环境配置
- 来源：https://ddkk.com/zhuanlan/other/ruby/6.html
- 分类：Ruby 教程
- 分组：教程目录
在Windows 上安装 Ruby 很简单，因为 https://rubyinstaller.org 提供了 .exe 可以自动安装

### 在 Windows 机器上安装 Ruby 的步骤如下

**1、** Window系统下，我们可以使用RubyInstaller来安装Ruby环境下载地址为：[请点击这里下载](http://rubyinstaller.org/downloads/)；

**2、** 双击rubyinstaller-2.4.2.x.exe文件，启动Ruby安装向导；

**3、** 点击Next，继续向导，记得勾选**AddRubyexecutablestoyourPATH**，直到Ruby安装程序完成Ruby安装为止；

如果你的安装没有配置环境变量，接下来你可能需要进行环境变量的配置

**1、** 右键点击**我的电脑"，选择**属性**，单击左侧的**高级系统设置**，单击**环境变量**；

2、** 选择Path**然后点击编辑，添加**分号(;)**和Ruby目录；

3、** 选择PATHEXT**然后点击编辑，添加.RB;.RBW；

**4、** 安装后，通过在命令行中输入以下命令来确保一切工作正常：

```ruby
$ ruby -v
ruby 2.4.2
```

如果一切工作正常，将会输出所安装的 Ruby 解释器的版本，如上所示。 如果您安装了其他版本，则会显示其他不同的版本
