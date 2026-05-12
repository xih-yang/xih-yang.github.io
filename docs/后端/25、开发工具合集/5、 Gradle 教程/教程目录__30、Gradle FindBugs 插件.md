# 30、Gradle FindBugs 插件
- 来源：https://ddkk.com/zhuanlan/tools/gradle/30.html
- 分类：开发工具
- 分组：教程目录
## FindBugs 插件

FindBugs 插件使用 FindBugs 对项目的 Java 源文件执行质量检查，并从检查结果中生成报告。

## 用法

要使用FindBugs 插件，请在构建脚本中包含以下语句：

**使用 FindBugs 插件**

build.gradle

```sh
apply plugin: 'findbugs'  
```

该插件向你的项目添加了大量的执行质量检查的任务。你可以通过运行 gradle check 执行检查。

## 任务

FindBugs 插件向 project 中添加了以下任务：

表31.1. FindBugs 插件 – 任务

任务名称
 依赖于
 类型
 描述

findbugsMain
classes
 findbugs
 针对生产Java 源文件运行 FindBugs。

findbugsTest
testClasses
 findbugs
 针对测试 Java 源文件运行 FindBugs。

SourceSet
sourceSetClasses
 findbugs
 针对source set 的 Java 源文件运行 FindBugs。

FindBugs 插件向 Java 插件所加入的任务添加了以下的依赖。

表31.2. FindBugs 插件 – 附加的任务依赖

任务名称
 依赖于

check
 所有 FindBugs 任务，包括findbugsTest。

## 依赖管理

FindBugs 插件增加了下列的依赖配置：

表31.3. FindBugs 插件 – 依赖配置

名称
 意义

findbugs
 使用的 FindBugs 库
