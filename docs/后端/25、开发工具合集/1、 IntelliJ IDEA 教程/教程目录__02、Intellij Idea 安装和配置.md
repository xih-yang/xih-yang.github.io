# 02、Intellij Idea 安装和配置
- 来源：https://ddkk.com/zhuanlan/tools/idea/2.html
- 分类：开发工具
- 分组：教程目录
在本章中，我们将了解如何安装和配置 IntelliJ IDEA。该过程的第一步从选择版本开始。根据您的要求，您可以下载社区版或商业版。顾名思义，社区版是完全免费的，我们也可以将其用于商业开发。不过商业版是付费版，我们可以免费试用30天。

## Window安装

IntelliJ 与 2003 年之前的几乎所有版本的 Windows 兼容。综合列表将是：Windows 10/8/7/Vista/2003/XP。建议您在 Windows 上安装 IntelliJ 之前关闭所有其他应用程序。

### 系统要求

- 建议至少 2 GB 的 RAM 容量以达到更好的性能。
- 为了更好地可视化，建议使用 1024x768 屏幕分辨率。
- 至少 300 MB 磁盘空间用于安装，另外 1 GB 用于缓存。

### 下载安装

- 下载： 您可以从他们的官方网站下载 Windows 安装程序。
- 安装：让我们从安装开始，然后是配置步骤。IntelliJ 的安装与其他软件包类似。只需双击安装程序并按照屏幕上的说明完成安装过程。

## Linux安装

在Linux平台上安装Intellij Idea，需要注意没有捆绑32位JDK，所以推荐64位系统。

### 系统要求

- GNOME、KDE 或 XFCE 桌面环境
- 建议至少 2 GB 的 RAM 以达到更好的性能要求
- 300 MB 磁盘空间用于安装和添加 1 GB 用于缓存
- 为了更好的可视化，建议使用 1024x768 的屏幕分辨率

### 下载安装

- 下载：您可以从他们的官方网站下载 IntelliJ for Linux。
- 安装： 我们已经下载了 tar.gz 包。请注意，在我们的示例中，bundle 的名称是 ideaIC-2017.2.5.tar.gz。它可能会随着版本/版本而变化。请使用适当的捆绑包名称。

```java
First extract it using following command:
$ tar xvf ideaIC-2017.2.5.tar.gz
It will create new directory with idea-IC-172.4343.14 name. 
Now change directory to idea-IC-172.4343.14/bin/ and execute idea.sh shell script as shown below:
$ cd idea-IC-172.4343.14/bin/
$ ./idea.sh
Follow on-screen instructions to complete installation procedure.
```

## 配置Intellij Idea

两个平台上的配置步骤相似。要开始配置，请启动 IntelliJ 应用程序。或者，您可以从此向导导入现有配置。单击下一步按钮继续。

第一步：如果您使用的是商业版，则会弹出许可证激活窗口。选择免费评估选项并单击评估按钮，如下图所示。

第二步： 接受许可协议以继续并按照屏幕上的说明启动 IntelliJ。您将看到 IntelliJ 的欢迎屏幕。

第三步： 现在，是时候使用 IntelliJ 配置 Java 开发工具包（此后，我们将其称为 JDK）。如果尚未安装 JDK，请先[安装JDK](http://www.yiidian.com/java/jdk-install-env-setup.html)。

- 在欢迎屏幕上，单击“configure”
- 从下拉列表中选择“project defaults”
- 选择“project structure”选项

- 从“platform settings”菜单中选择“SDK”选项。
- 单击“加号”图标并选择“JDK”选项。
- 选择 JDK 的主目录并按照屏幕上的说明进行操作。
