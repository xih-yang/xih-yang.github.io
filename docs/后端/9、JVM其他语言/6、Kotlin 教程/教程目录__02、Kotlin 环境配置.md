# 02、Kotlin 环境配置
- 来源：https://ddkk.com/zhuanlan/java/kotlin/2.html
- 分类：Kotlin 教程
- 分组：教程目录
Kotlin 命令行编译工具下载地址：[https://github.com/JetBrains/kotlin/releases/latest](https://github.com/JetBrains/kotlin/releases/latest)，目前最新为 1.1.51

推荐下载最新的 Release 版本，本教程基于最新的 V 1.1.51

下载完成后，解压到指定目录，然后将 bin 目录添加到系统环境变量 `$` PATH

bin目录包含编译和运行 Kotlin 所需的脚本

## SDKMAN 安装 Kotlin

MACOS X、Linux、Cygwin、FreeBSD 和 Solaris 系统上也可以使用 SDKMAN 来安装

```java
$ curl -s https://get.sdkman.io | bash
$ sdk install kotlin
```

## Homebrew

MACOS X 下，可以使用 Homebrew 安装

```java
$ brew update
$ brew install kotlin
```

### MacPorts

如果你是 MacPorts 用户，可以使用下面的命令安装：

```java
$ sudo port install kotlin
```

## 查看 Kotlin 版本

使用下面的命令可以查看 Kotlin 的版本

```java
$ kotlinc -version
info: kotlinc-jvm 1.1.51 (JRE 1.8.0_101-b13)
```

## 创建和运行第一个程序

#### 1. 首先创建一个名为 hello.kt 文件，代码如下：

#### hello.kt

```java
fun main(args: Array<String>) {
    println("Hello, World!")
    println("Hello DDKK.COM 弟弟快看，程序员编程资料站!")
}
```

#### 2. 然后使用 Kotlin 编译器编译文件:

```java
$ kotlinc hello.kt -include-runtime -d hello.jar
```

- **-d** : 用来设置编译输出的名称，可以是 .class 或 .jar 文件，也可以是目录
- **-include-runtime** : 让 .jar 文件包含 Kotlin 运行库，从而可以直接运行

编译运行以上 Kotlin 范例，输出结果如下

```java
$ kotlinc hello.kt -include-runtime -d hello.jar 
$ java -jar hello.jar
Hello, World!
Hello DDKK.COM 弟弟快看，程序员编程资料站!
```

如果想查看 kotlinc 的所有可用选项，可以使用下面的命令

```java
$ kotlinc -help
```

### 编译成 .jar 库

如果想让生成的 jar 包供其他 Kotlin 程序使用，则无需包含 Kotlin 的运行库

```java
$ kotlinc hello.kt -d hello.jar
```

因为生成的 .jar 文件不包含 Kotlin 运行库，所以在使用时，要确保在 classpath 路径上

### kotlin 命令

我们也可以直接使用 kotlin 命令来运行 Kotlin 编译器生成的 .jar 文件

```java
$ kotlin -classpath hello.jar HelloKt
```

- **HelloKt** 为编译器为 hello.kt 文件生成的默认类名

## 运行 REPL（ 交互式解释器 )

在终端下可以直接输入 kotlinc 或 kotlinc-jvm 进入 Kotlin 提供的 REPL

我们可以在 REPL 里输入任何有效的 Kotlin 代码，而且能立即看到结果

```java
$ kotlinc  
Welcome to Kotlin version 1.1.51 (JRE 1.8.0_101-b13)
Type :help for help, :quit for quit
>>> 7 + 13
20
>>> 7 * 13
91
>>> 13 / 7
1
>>> println("Hello World");
Hello World
>>> println("Hello DDKK.COM 弟弟快看，程序员编程资料站!")
Hello DDKK.COM 弟弟快看，程序员编程资料站!
>>> 
>>> :quit
```

## 使用命令行执行脚本

Kotlin 可以当做脚本语言使用，此时的文件扩展名为 .kts ( Kotlin Script )

下面我们就创建一个名为 ls_folders.kts 的 Kotlin 脚本，用来列出当前目录下的文件

#### ls_folders.kts

```java
import java.io.File
val folders = File(args[0]).listFiles { file -> file.isDirectory() }
folders?.forEach { folder -> println(folder) }
```

然后使用 kotlinc -script 来运行这个脚本文件

```java
$ kotlinc -script ls_folders.kts /tmp
/tmp/com.apple.launchd.4RKRpFihtd
/tmp/zxpsignOszJgcYeeaqBa3rZ
/tmp/powerlog
/tmp/zxpsignmKRyJ0GQ5ihCZGgU
/tmp/zxpsignA109TCaX9Ge1R0aA
/tmp/zxpsignwwLNsCvhUYSwN00B
/tmp/zxpsignzZeMmmsog9IrLbGP
/tmp/zxpsignRFkexLkSxdc0BXCf
/tmp/zxpsignnidXdFMd3VQOHKH7
/tmp/zxpsignOzWp4UnMinNKP7A2
/tmp/lilo.49106
/tmp/com.apple.launchd.jWXPKDhtci
/tmp/zxpsignvHKfHArLA79z6pBN
/tmp/zxpsign6roHO13COPKo9kFc
/tmp/zxpsignXH6f4knomrLBbcno
/tmp/zxpsignMfJEiIgnH9vRzzC0
```
