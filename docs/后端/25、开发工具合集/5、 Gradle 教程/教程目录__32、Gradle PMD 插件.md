# 32、Gradle PMD 插件
- 来源：https://ddkk.com/zhuanlan/tools/gradle/32.html
- 分类：开发工具
- 分组：教程目录
## PMD 插件

PMD插件使用 PMD 对项目的 Java 源文件执行质量检查，并从检查结果中生成报告。

## 用法

要使用PMD 插件，请在构建脚本中包含以下语句：

**使用 PMD 插件**

build.gradle

```sh
apply plugin: 'pmd'  
```

该插件向你的项目添加了大量的执行质量检查的任务。你可以通过运行 gradle check 执行检查。

## 任务

PMD插件向 project 中添加了以下任务：

表33.1. PMD 插件 – 任务

任务名称
 依赖于
 类型
 描述

pmdMain
 –
 pmd
 针对生产Java 源文件运行 PMD。

pmdTest
 –
 pmd
 针对测试 Java 源文件运行 PMD。

SourceSet
 –
 pmd
 针对source set 的 Java 源文件运行 PMD。

PMD插件向 Java 插件所加入的任务添加了以下的依赖。

表33.2. PMD 插件 – 附加的任务依赖

任务名称
 依赖于

check
 所有的 PMD 任务，包括pmdTest。

## 依赖管理

PMD插件添加了下列的依赖配置：

表33、3. PMD 插件 – 依赖配置

名称
 意义

pmd
 使用的 PMD 库
