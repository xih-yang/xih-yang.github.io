# 08、JDK 25 新特性：AOT 命令行人体工程学（JEP 514）优化启动性能
- 来源：https://ddkk.com/zhuanlan/java/java25/8.html
- 分类：JDK 25 新特性
- 分组：教程目录
- 日期：2025-11-27
你有没有遇到过 Java 应用启动慢的问题？特别是那些微服务或者无服务器函数，启动时间直接影响用户体验。鹏磊我之前就遇到过，应用启动要好几秒，用户等得都着急了。后来发现可以用 AOT（Ahead-of-Time）编译来优化，但以前用起来太麻烦了，得两步操作，还得手动管理临时文件，整得人头疼。

JDK 25 里的 JEP 514 就是为了解决这个问题而生的，它简化了 AOT 缓存的创建过程，让优化启动性能变得更容易。以前创建 AOT 缓存得先记录应用行为，再创建缓存，两步操作；现在一个命令就搞定了，临时文件也自动管理，省事多了。

这个特性主要是改进了 AOT 的命令行体验，让开发者用起来更方便。通过训练运行记录应用行为，保存到 AOT 缓存，后续启动和预热时间都能缩短。特别是对那些启动性能要求高的应用，这个特性还是挺有用的。

## AOT 是啥

先说说啥是 AOT 吧。AOT 就是 Ahead-of-Time 编译，提前编译的意思。传统的 Java 程序是运行时编译的，JIT 编译器在运行的时候把字节码编译成本地代码，这样启动的时候得先解释执行，等热点代码被编译了才能跑得快。

AOT 就不一样了，它在运行前就把代码编译好了，启动的时候直接加载编译好的本地代码，不用等 JIT 编译，启动速度能快不少。AOT 缓存就是存储这些编译好的代码的文件，应用启动的时候加载这个缓存，就能直接用了。

AOT 的核心优势有几个：第一是启动速度快，不用等 JIT 编译，启动就能用优化后的代码；第二是预热时间短，热点代码已经编译好了，不用等运行时编译；第三是内存占用可能更小，因为不用存储那么多编译信息。

## 为啥需要简化 AOT 命令行

以前用 AOT 的时候，创建缓存得两步操作：第一步是记录阶段（record），运行应用记录行为，生成配置文件；第二步是创建阶段（create），根据配置文件创建 AOT 缓存。这两步操作得手动执行，还得管理临时文件，用起来挺麻烦的。

第一个问题是操作复杂。得先运行一次应用记录行为，再运行一次创建缓存，两步操作，容易出错。而且得记住各种命令行参数，用起来不直观。

第二个问题是临时文件管理麻烦。记录阶段会生成临时配置文件，得手动管理，容易搞混。如果忘了清理，还可能占用磁盘空间。

第三个问题是学习成本高。得理解 AOT 的工作原理，知道什么时候用 record，什么时候用 create，对新手来说门槛比较高。

JEP 514 就是为了解决这些问题而设计的，它简化了命令行操作，让创建 AOT 缓存变得更简单。

## 基本用法

先看看新的基本用法。主要是用 `-XX:AOTCacheOutput=` 这个选项，一个命令就能完成记录和创建两个步骤。

```bash
# 新的简化方式：一个命令搞定记录和创建
java -XX:AOTCacheOutput=app.aot -cp app.jar com.example.App
```

这个命令会执行训练运行，记录应用行为，然后自动创建 AOT 缓存文件 `app.aot`。临时配置文件会自动管理，不用手动处理了。

以前得这样用：

```bash
# 第一步：记录阶段，生成配置文件
java -XX:AOTMode=record -XX:AOTConfiguration=app.aotconfig -XX:AOTCacheOutput=app.aot -cp app.jar com.example.App
# 第二步：创建阶段，根据配置文件创建缓存
java -XX:AOTMode=create -XX:AOTConfiguration=app.aotconfig -XX:AOTCacheOutput=app.aot
```

现在一个命令就搞定了，简单多了。

## AOT 模式详解

AOT 有几种模式，理解这些模式对用好 AOT 很重要。

### auto 模式（默认）

`auto` 模式是默认模式，会自动选择合适的 AOT 模式。如果指定了 `-XX:AOTCacheOutput`，就自动切换到 `record` 模式；如果能加载 AOT 缓存，就自动切换到 `on` 模式；否则就切换到 `off` 模式。

```bash
# 不指定任何 AOT 选项，默认是 auto 模式
java -cp app.jar com.example.App
# 如果指定了 AOTCacheOutput，自动切换到 record 模式
java -XX:AOTCacheOutput=app.aot -cp app.jar com.example.App
```

### record 模式

`record` 模式是训练阶段，运行应用记录行为，生成配置文件。必须指定 `-XX:AOTConfiguration` 或 `-XX:AOTCacheOutput`。

```bash
# record 模式：记录应用行为
java -XX:AOTMode=record -XX:AOTConfiguration=app.aotconfig -XX:AOTCacheOutput=app.aot -cp app.jar com.example.App
```

如果只指定了 `-XX:AOTCacheOutput`，JVM 会自动生成临时配置文件，不用手动指定。

### create 模式

`create` 模式是创建阶段，根据配置文件创建 AOT 缓存。必须指定 `-XX:AOTConfiguration`。

```bash
# create 模式：根据配置文件创建缓存
java -XX:AOTMode=create -XX:AOTConfiguration=app.aotconfig -XX:AOTCacheOutput=app.aot
```

注意 `create` 模式不会执行应用，只是创建缓存。

### on 模式

`on` 模式是生产阶段，使用 AOT 缓存运行应用。如果缓存加载失败，JVM 会打印错误并退出。

```bash
# on 模式：使用 AOT 缓存运行应用
java -XX:AOTMode=on -XX:AOTCache=app.aot -cp app.jar com.example.App
```

### off 模式

`off` 模式是禁用 AOT，不使用 AOT 缓存。

```bash
# off 模式：禁用 AOT
java -XX:AOTMode=off -cp app.jar com.example.App
```

## 简化的使用流程

有了 JEP 514，使用 AOT 的流程变得简单多了。主要分两个阶段：训练阶段和生产阶段。

### 训练阶段

训练阶段就是创建 AOT 缓存的过程。现在一个命令就搞定了：

```bash
# 训练阶段：运行应用并创建 AOT 缓存
java -XX:AOTCacheOutput=app.aot -cp app.jar com.example.App
```

这个命令会：

1. 运行应用，记录应用行为
2. 自动生成临时配置文件（如果没指定 `-XX:AOTConfiguration`）
3. 自动创建 AOT 缓存文件 `app.aot`
4. 自动清理临时文件

不用手动管理临时文件了，省事多了。

### 生产阶段

生产阶段就是使用 AOT 缓存运行应用。可以用 `auto` 模式（默认），自动加载缓存：

```bash
# 生产阶段：使用 AOT 缓存运行应用（auto 模式）
java -XX:AOTCache=app.aot -cp app.jar com.example.App
```

或者用 `on` 模式，强制使用缓存：

```bash
# 生产阶段：强制使用 AOT 缓存（on 模式）
java -XX:AOTMode=on -XX:AOTCache=app.aot -cp app.jar com.example.App
```

如果缓存加载失败，`auto` 模式会继续运行（不用缓存），`on` 模式会退出（fail-fast）。

## 配置文件管理

虽然 JEP 514 简化了临时文件管理，但有时候还是需要手动指定配置文件，特别是想复用配置文件的时候。

### 手动指定配置文件

如果想手动指定配置文件，可以用 `-XX:AOTConfiguration` 选项：

```bash
# 手动指定配置文件
java -XX:AOTCacheOutput=app.aot -XX:AOTConfiguration=app.aotconfig -cp app.jar com.example.App
```

这样配置文件会保存到 `app.aotconfig`，可以后续复用。

### 使用配置文件创建缓存

如果已经有了配置文件，可以用 `create` 模式创建缓存：

```bash
# 使用已有配置文件创建缓存
java -XX:AOTMode=create -XX:AOTConfiguration=app.aotconfig -XX:AOTCacheOutput=app.aot
```

这在需要多次创建缓存的时候很有用，不用每次都运行应用。

## 实际应用场景

AOT 在实际开发中还是挺有用的，下面举几个常见的应用场景。

### 场景一：微服务应用

微服务应用启动频繁，启动性能直接影响用户体验。用 AOT 可以显著提升启动速度。

```bash
# 训练阶段：创建 AOT 缓存
java -XX:AOTCacheOutput=service.aot -jar service.jar
# 生产阶段：使用 AOT 缓存运行
java -XX:AOTCache=service.aot -jar service.jar
```

### 场景二：无服务器函数

无服务器函数每次调用都可能启动新的实例，启动性能特别重要。用 AOT 可以缩短冷启动时间。

```bash
# 训练阶段：创建 AOT 缓存
java -XX:AOTCacheOutput=function.aot -cp function.jar com.example.Function
# 生产阶段：使用 AOT 缓存运行
java -XX:AOTCache=function.aot -cp function.jar com.example.Function
```

### 场景三：命令行工具

命令行工具启动频繁，用 AOT 可以提升响应速度。

```bash
# 训练阶段：创建 AOT 缓存
java -XX:AOTCacheOutput=tool.aot -cp tool.jar com.example.Tool --help
# 生产阶段：使用 AOT 缓存运行
java -XX:AOTCache=tool.aot -cp tool.jar com.example.Tool
```

## 高级选项

除了基本的选项，AOT 还有一些高级选项，可以更精细地控制行为。

### AOTClassLinking

`-XX:+AOTClassLinking` 选项可以启用更高级的优化，比如提前解析 `invokedynamic` 指令，进一步提升启动和预热性能。

```bash
# 启用 AOTClassLinking
java -XX:AOTCacheOutput=app.aot -XX:+AOTClassLinking -cp app.jar com.example.App
```

注意，用 `AOTClassLinking` 创建的缓存可能跟某些生产环境的命令行参数不兼容，用的时候要注意。

### 环境变量配置

可以用 `JDK_AOT_VM_OPTIONS` 环境变量给第二个 JVM 进程传递额外的选项（在 record 模式下）：

```bash
# 设置环境变量，给第二个 JVM 进程传递选项
export JDK_AOT_VM_OPTIONS="-Xmx2g -XX:+UseG1GC"
# 运行训练
java -XX:AOTCacheOutput=app.aot -cp app.jar com.example.App
```

### 文件路径占位符

可以用占位符在文件路径中包含进程 ID 或启动时间戳：

```bash
# 使用进程 ID 占位符
java -XX:AOTConfiguration=foo%p.aotconfig -XX:AOTCacheOutput=foo%p.aot -cp app.jar com.example.App
# 使用时间戳占位符
java -XX:AOTConfiguration=foo%t.aotconfig -XX:AOTCacheOutput=foo%t.aot -cp app.jar com.example.App
```

这在需要为不同进程或不同时间创建不同缓存的时候很有用。

## 调试和故障排查

如果 AOT 缓存有问题，可以用一些选项来调试。

### 检查缓存兼容性

用 `-XX:AOTMode=on` 可以检查命令行选项是否兼容 AOT 缓存：

```bash
# 检查兼容性（fail-fast 模式）
java -XX:AOTMode=on -XX:AOTCache=app.aot -cp app.jar com.example.App
```

如果缓存加载失败，JVM 会立即退出，这样可以快速发现问题。

### 查看 AOT 日志

用 `-Xlog:aot` 可以查看 AOT 相关的日志：

```bash
# 查看 AOT 日志
java -XX:AOTMode=auto -XX:AOTCache=app.aot -Xlog:aot -cp app.jar com.example.App
```

这样可以了解缓存是否被使用，以及使用的情况。

### 自动模式调试

如果不想用 fail-fast 模式，可以用 `auto` 模式配合日志：

```bash
# 自动模式 + 日志，查看缓存使用情况
java -XX:AOTMode=auto -XX:AOTCache=app.aot -Xlog:aot -cp app.jar com.example.App
```

这样即使缓存加载失败，应用也能继续运行，同时能看到日志信息。

## 性能影响

AOT 对性能的影响主要体现在启动时间和预热时间上。

### 启动时间

AOT 可以显著缩短启动时间，因为不用等 JIT 编译，启动就能用优化后的代码。根据应用的不同，启动时间可能缩短 20% 到 50%，甚至更多。

### 预热时间

AOT 可以缩短预热时间，因为热点代码已经编译好了，不用等运行时编译。这对那些需要快速达到峰值性能的应用特别有用。

### 内存占用

AOT 可能影响内存占用，因为需要存储编译好的代码。但另一方面，可能不需要存储那么多编译信息，总体影响取决于具体情况。

### 运行时性能

AOT 编译的代码可能不如 JIT 编译的代码优化得好，因为 JIT 可以根据运行时信息做更激进的优化。但对于启动性能要求高的应用，这个权衡通常是值得的。

## 注意事项

用 AOT 的时候有几个注意事项：

第一个是缓存兼容性。AOT 缓存跟应用、JDK 版本、操作系统、CPU 架构都有关系，不兼容的缓存不能使用。如果应用代码变了，可能需要重新创建缓存。

第二个是命令行选项兼容性。某些 JVM 选项可能跟 AOT 缓存不兼容，特别是那些会修改类的诊断选项。生产环境通常不会有这个问题，但要注意。

第三个是训练运行的代表性。训练运行应该能代表实际使用场景，这样创建的缓存才有效。如果训练运行跟实际使用差别很大，缓存的效果可能不好。

第四个是缓存文件管理。AOT 缓存文件可能比较大，要注意磁盘空间。而且缓存文件需要跟应用一起部署，部署流程可能需要调整。

## 与 JEP 515 的配合

JEP 515（AOT 方法性能分析）跟 JEP 514 配合使用效果更好。JEP 515 可以在训练运行期间收集方法性能分析数据，让 JIT 编译器在应用启动时就能生成优化的代码。

```bash
# JEP 514 + JEP 515：创建带性能分析数据的 AOT 缓存
java -XX:AOTCacheOutput=app.aot -cp app.jar com.example.App
```

这样创建的缓存不仅包含编译好的代码，还包含性能分析数据，启动时就能用优化的代码，预热时间更短。

## 总结

AOT 命令行人体工程学（JEP 514）是 JDK 25 引入的一个很实用的特性，它简化了 AOT 缓存的创建过程，让优化启动性能变得更容易。主要改进包括：简化命令行操作，一个命令就能完成记录和创建；自动管理临时文件，不用手动处理；降低学习成本，用起来更直观。

在实际开发中，AOT 特别适合用在微服务应用、无服务器函数、命令行工具等启动性能要求高的场景。配合 JEP 515 使用，效果更好。

虽然 AOT 有一些限制，比如缓存兼容性、命令行选项兼容性等，但对于启动性能要求高的应用，这个特性还是很值得尝试的。特别是现在命令行操作简化了，用起来更方便了。

鹏磊我觉得这个特性还是挺实用的，特别是对那些启动性能要求高的应用。建议大家在合适的场景下试试，应该会有不错的体验。不过要注意缓存兼容性和训练运行的代表性，这样才能发挥出 AOT 的最大效果。
