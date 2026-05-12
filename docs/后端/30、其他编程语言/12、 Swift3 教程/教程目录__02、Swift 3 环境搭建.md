# 02、Swift 3 环境搭建
- 来源：https://ddkk.com/zhuanlan/other/swift3/2.html
- 分类：Swift 3 教程
- 分组：教程目录
Swift 是一门开源的编程语言，该语言用于开发 MacOS APP 和 iOS APP

在正式开发应用程序前，我们需要搭建 Swift 开发环境，以便更好友好的使用各种开发工具和语言进行快速应用开发

由于Swift 开发环境需要在 OS X 系统中运行，因此其环境的搭建将不同于 Windows 环境

### 搭建 Swift 开发环境的准备工作

**1、** 必须拥有一台苹果电脑，因为集成开发环境XCode只能运行在OSX系统上；

**2、** Mac电脑必须是OS10.9.3及以上操作系统；

### Swift 开发工具 Xcode 下载

安装Xcode 开发工具有两种方法

**1、** 可以在AppStore中搜索Xcode安装(推荐)；

**2、** 下载.dmg安装包；

**Swift 开发工具官网地址：**[https://developer.apple.com/xcode/download/](https://developer.apple.com/xcode/download/)

下载完成后，双击下载的 dmg 文件安装，安装完成后我们将 Xcode 图标踢移动到应用文件夹

## 第一个 Swift 程序

Xcode 安装完成后，我们就可以开始编写 Swift 代码了

**1、** 在应用文件夹打开Xcode，打开后在屏幕顶部选择File=>New=>Playground；

**2、** 然后为Playground设置一个名字并选择iOS平台；

Swift 的 Playground 就像是一个可交互的文档，它是用来练手学 Swift的，写一句代码出一行结果（右侧），可以实时查看代码结果，是学习swift语言的利器！

以下是 Swift Playground 窗口默认的代码：

```swift
import UIKit
var str = "Hello, playground"
```

如果想创建 OS X 程序，需要导入 Cocoa 包 **import Cocoa**

```swift
import Cocoa
var str = "Hello, playground"
```

**3、** 以上程序载入后，会在Playground窗口右侧显示程序执行结果；

```swift
Hello, playground
```

至此，我们已经完成了第一个 Swift 程序的学习

## 创建第一个项目

**1、** 打开xcode工具，选择File=>New=>Project；

**2、** 在左侧选择iOS下的Application，然后在右侧选择"SingleViewApplication"，并点击"next"，创建一个单视图应用程序；

**3、** 输入项目名称（ProductName),公司名称（OrganizationName),公司标识前缀名（Organizationidentifier)还要选择开发语言(Language),选择设备（Devices)其中Language有两个选项：Objective-C和Swift，因为我们是学习Swift当然选择Swift项了，点击"Next"下一步；

**4、** 选择存放的目录，如果要使用Git源代码管理，将勾上SourceControl的creategitrepositoryonMyMac，点击create创建项目；

**5、** 项目创建后，默认生成了一个示例文件，可以看到Swift将oc中的h和m文件合并成了一个文件（即Swift后缀名文件)；

Main.storyboard 相当于 xib 文件，有比 xib 更多的功能

**6、** 打开main.storyboard,默认看到一个简单的空白的应用界面，大小为平板界面大小；

如果开发都只需要开发兼容 iPhone 手机的 app,那么可以把 Use Auto Layout的勾去掉（默认为勾上）

**7、** 弹出了一个对话框，让我们选择界面尺寸，iPhone或都iPad我们选择iPhone的尺寸；

**8、** 可以看到，界面大小变为了手机iPhone的宽度和高度；

大家可以记住界面相关的尺寸，方便以后布局计算位置

**9、** 为界面添加点内容，在右下方找到TextField控件，将它拖入Storyboard上；

双击写入文本 "Hello World!"

**10、** 运行一下模拟器（command+R快捷键或在菜单栏中选择Product=>Run)；

至此，我们的第一个 Swift 项目就完成了
