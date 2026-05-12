# 05、Kotlin Android 环境配置
- 来源：https://ddkk.com/zhuanlan/java/kotlin/5.html
- 分类：Kotlin 教程
- 分组：教程目录
Google I/O 2017 中，Google 宣布 Kotlin 成为 Android 官方开发语言

于是用Kotlin 开发 Android 似乎就顺理成章了

## 安装 Kotlin 插件

Android Studio 3.0 正式版已经发布了，正式支持 Kotlin，如果你是刚下载的或者已经升级到 3.0 就不用配置了，直接能用了

Android Studio 从 3.0（preview）版本开始将内置安装 Kotlin 插件

这之前的版本则需要安装 Kotlin 插件才能使用

> 推荐使用 3.0 正式版

打开Settings ( Mac 为 Preferences) 面板，在右侧找到 Plugins 选项 (快捷键 Ctrl+, Mac 下为 command+)，搜索框输入 "Kotlin" 查找，点击 Search in repositories(仓库中搜索)，然后安装即可，安装完成之后需要重启 Android Studio

## Android 创建 Kotlin 工程

选择Start a new Android Studio project 或者 File | New project，大多数选项均有默认值 ，只需要按几次"回车"键即可

Android Studio 3.0 在当前对话框中提供启用 Kotlin 支持的选项，勾选后可以跳过 "配置 Kotlin 工程（Configuring Kotlin in the project）"的步骤。

选择Android 版本:

选择需要创建的 Activity 样式:

命名该Activity:

在Android Studio 3.0 中，可以选择使用 Kotlin 创建 activity，因此也不需要"将Java 代码转换为 Kotlin（Converting Java code to Kotlin）"这一步骤。

早期版本中则会先使用 Java 创建 activity，然后再使用自动转换工具 进行转换

## 将 Java 代码转换为 Kotlin

重新打开 Android Studio，新建一个 Android 项目吧，添加一个默认的 MainActivity

打开MainActivity.java 文件，通过菜单栏依次调出 Code | Convert Java File to Kotlin File：

转换完成后即可看到使用 Kotlin 编写的 activity

### 工程中配置 Kotlin

在开始编辑此文件时，Android Studio 会提示当前工程还未配置 Kotlin，根据提示完成操作即可，或者可以在菜单栏中选择 Tools

选择配置时有如下对话框，选择已安装的最新版本即可

Kotlin 配置完成后，应用程序的 build.gradle 文件会更新，我们就能看到新增了 apply plugin: 'kotlin-android' 及其依赖

同步工程，在提示框中点击"立即同步（Sync Now）"或者使用 Sync Project with Gradle Files命令
