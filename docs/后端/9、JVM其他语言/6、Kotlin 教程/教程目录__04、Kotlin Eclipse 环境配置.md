# 04、Kotlin Eclipse 环境配置
- 来源：https://ddkk.com/zhuanlan/java/kotlin/4.html
- 分类：Kotlin 教程
- 分组：教程目录
Eclipse是著名的跨平台的自由集成开发环境（IDE）

Eclipse 最初主要用来 Java 语言开发，通过安装不同的插件 Eclipse 可以支持不同的计算机语言，比如C++和Python等开发工具

Eclipse 可以通过安装插件支持 Kotlin 语言开发

本章，我们将主要学习如何配置 Eclispe Kotlin 插件

## Kotlin Eclipse 环境搭建

Eclipse 通过可以通过 Marketplace 安装 Kotlin 插件

**1、** 打开Eclipse，选择Help->EclipseMarketplace…菜单，搜索Kotlin插件；

**2、** 然后重启Eclipse选择Window->OpenPerspective->Other...，如果看到了Kotlin选项表明安装成功；

### Eclipse 创建 Kotlin 新项目

**1、** 选择File->New->KotlinProject来创建Kotlin项目：

**2、** 创建成功后，项目结构如下：

**3、** 接下来右键点击src文件夹，创建一个Kotlin文件，不用写".kt"，Eclipse默认自动添加，它可以任意命名，这里我们创建hello；

**4、** 接下来在hello.kt文件中写点代码；

Eclipse 提供了一个快速完成此操作的模板，只需键入 main 然后按 Enter 即可

## 运行应用

**1、** 在hello.kt的编辑框内右击鼠标选择RunAs->KotlinApplication即可运行；

**2、** 运行成功后就可以在窗口Console中看到结果；

这样我们第一个 Kotlin 代码就运行起来了

我们就可以使用 Eclipse 来开发 Kotlin 项目了
