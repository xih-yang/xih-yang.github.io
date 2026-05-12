# 29、Gradle CodeNarc 插件
- 来源：https://ddkk.com/zhuanlan/tools/gradle/29.html
- 分类：开发工具
- 分组：教程目录
## CodeNarc 插件

CodeNarc 插件使用 CodeNarc 对项目的 Groovy 源文件执行质量检查并生成报告。

## 用法

要使用CodeNarc 插件，请在构建脚本中包含以下语句：

**使用 CodeNarc 插件**

build.gradle

```sh
apply plugin: 'codenarc'  
```

该插件向你的项目添加了大量的执行质量检查的任务。你可以通过运行 gradle check 执行检查。

## 任务

CodeNarc 插件向project 中添加了以下任务：

表30.1. CodeNarc 插件 – 任务

任务名称
 依赖于
 类型
 描述

codenarcMain
 –
 codenarc
 针对生产 Groovy 源文件运行 CodeNarc。

codenarcTest
 –
 codenarc
 针对测试 Groovy 源文件运行 CodeNarc。

SourceSet
 –
 codenarc
 针对给定的source set 的 Groovy 源文件运行 CodeNarc。

CodeNarc 插件向 Groovy 插件所加入的任务添加了以下的依赖。

表30.2. CodeNarc 插件 – 附加的任务依赖

任务名称
 依赖于

check
 所有的 CodeNarc 任务，包括codenarcTest。

## 项目布局

CodeNarc 插件预计是以下的项目布局：

表30.3. CodeNarc 插件 – 项目布局

File
 意义

config/codenarc/codenarc.xml
 CodeNarc 配置文件

## 依赖管理

CodeNarc 插件添加了下列的依赖配置：

表30、4. CodeNarc 插件 – 依赖配置

名称
 意义

codenarc
 使用的 CodeNarc 库
