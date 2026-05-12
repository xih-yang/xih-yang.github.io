# 5、JDK 24 新特性：AOT 类加载与链接（JEP 483）提升启动性能
- 来源：https://ddkk.com/zhuanlan/java/java24/5.html
- 分类：JDK 24 新特性
- 分组：教程目录
- 日期：2025-11-27
以前Java启动慢是出了名的，特别是云原生场景下，冷启动时间直接影响用户体验。一个Spring Boot应用启动要十几秒甚至几十秒，这在Kubernetes这种需要频繁启停容器的环境里，简直就是灾难。用户请求来了，容器还在启动，等半天才能响应，体验差得不行。

鹏磊我之前就遇到过这种破事，一个微服务应用，每次重启都要等20多秒，Kubernetes扩容的时候，新实例启动慢，流量都压到老实例上了，压力大得不行。后来一查，发现大部分时间都花在类加载和链接上了，每次启动都要重新加载一遍类，解析字节码、验证类、准备类、解析符号引用，这些操作都要时间，特别是类多的时候，这时间就上去了。

现在好了，JDK 24的JEP 483（AOT类加载与链接）终于把这个痛点给解决了。这个特性引入了AOT（Ahead-of-Time）优化机制，可以把类提前加载和链接好，存到缓存里，启动时直接从缓存读取，不用再走一遍类加载流程，启动速度能提升不少。兄弟们别磨叽，咱这就开始整活，把这个特性给整明白。

## 什么是AOT类加载与链接

先说说啥是AOT。AOT是Ahead-of-Time的缩写，意思是"提前编译"或者"提前优化"。以前Java是运行时加载类，启动的时候才去加载、验证、准备、解析，这些操作都要时间。AOT就是把这些操作提前做了，把结果存到缓存里，启动时直接用，不用再走一遍流程。

AOT类加载与链接（AOT Class Loading and Linking）就是JEP 483引入的特性，它可以把类的加载和链接操作提前做好，存到AOT缓存（AOT Cache）里。启动的时候，JVM直接从缓存里读取已经加载和链接好的类，不用再重新加载，启动速度自然就上去了。

这个特性特别适合云原生场景，因为容器经常要启停，每次启动都要重新加载类，AOT缓存可以复用，启动速度能提升不少。对于那种类特别多的应用，比如Spring Boot这种框架应用，效果更明显。

## JEP 483 的核心特性

JEP 483是JDK 24引入的一个特性，主要做了这么几件事：

1. **AOT缓存机制**：引入AOT缓存（AOT Cache），可以存储提前加载和链接好的类
2. **类加载优化**：启动时直接从缓存读取类，不用重新加载
3. **类链接优化**：提前解析符号引用、验证类、准备类，启动时直接使用
4. **训练模式**：可以运行应用收集类使用情况，生成优化的缓存
5. **自动模式**：自动检测是否可以使用AOT缓存，兼容性更好

这个特性不是实验性的，是正式特性，可以直接用。但要注意，AOT缓存和某些JVM选项不兼容，需要确保训练时和生产时用的选项一致，否则缓存可能用不了。

## AOT缓存的工作流程

AOT缓存的工作流程分三个阶段：训练（Training）、创建（Create）、使用（Use）。咱一个个来看。

### 1. 训练阶段（Training）

训练阶段就是运行应用，收集哪些类被使用了，哪些类需要提前加载和链接。这个阶段会生成一个AOT配置文件（AOT Configuration），记录哪些类需要放到缓存里。

```bash
# 训练模式，收集类使用情况
java -XX:AOTMode=record -XX:AOTCacheOutput=myapp.aot -XX:AOTConfigOutput=myapp.aotconfig -jar myapp.jar
```

训练的时候要跑一个代表性的工作负载，确保收集到的类使用情况能反映实际使用场景。训练完成后，会生成AOT配置文件和缓存文件。

### 2. 创建阶段（Create）

创建阶段就是根据训练阶段收集的配置，生成AOT缓存。这个阶段会加载配置里指定的类，进行链接和优化，然后把结果存到缓存里。

```bash
# 创建模式，生成AOT缓存
java -XX:AOTMode=create -XX:AOTCache=myapp.aot -XX:AOTConfig=myapp.aotconfig -XX:AOTCacheOutput=myapp.aot
```

创建阶段会读取AOT配置文件，加载指定的类，进行链接和优化，然后把结果存到缓存文件里。这个缓存文件可以在后续启动时使用。

### 3. 使用阶段（Use）

使用阶段就是正常启动应用，JVM会自动检测是否有AOT缓存，如果有就直接用，没有就正常加载。默认是自动模式（auto），会自动检测。

```bash
# 使用模式，从缓存加载
java -XX:AOTMode=on -XX:AOTCache=myapp.aot -jar myapp.jar
# 或者自动模式（默认）
java -XX:AOTMode=auto -XX:AOTCache=myapp.aot -jar myapp.jar
```

使用阶段JVM会读取AOT缓存，直接加载已经准备好的类，不用再走一遍加载和链接流程，启动速度能提升不少。

## 实际应用场景

AOT类加载与链接适合哪些场景呢？鹏磊我觉得主要有这么几类：

### 1. 云原生场景

云原生场景下，容器经常要启停，每次启动都要重新加载类，启动时间直接影响用户体验。AOT缓存可以复用，启动速度能提升不少，特别适合Kubernetes这种需要频繁启停容器的环境。

```java
// 云原生微服务示例
@SpringBootApplication
public class MicroserviceApplication {
    public static void main(String[] args) {
        // 启用AOT缓存后，启动速度更快
        // 类加载和链接操作已经提前做好，直接从缓存读取
        SpringApplication.run(MicroserviceApplication.class, args);
    }
}
```

启动脚本：

```bash
#!/bin/bash
# 训练阶段（首次运行或更新后）
if [ ! -f "app.aot" ]; then
    echo "训练AOT缓存..."
    java -XX:AOTMode=record \
         -XX:AOTCacheOutput=app.aot \
         -XX:AOTConfigOutput=app.aotconfig \
         -jar microservice.jar --spring.profiles.active=training
fi
# 创建AOT缓存
if [ ! -f "app.aot" ] || [ "app.aotconfig" -nt "app.aot" ]; then
    echo "创建AOT缓存..."
    java -XX:AOTMode=create \
         -XX:AOTConfig=app.aotconfig \
         -XX:AOTCacheOutput=app.aot \
         -jar microservice.jar --spring.profiles.active=create
fi
# 使用AOT缓存启动
echo "使用AOT缓存启动..."
java -XX:AOTMode=auto \
     -XX:AOTCache=app.aot \
     -jar microservice.jar
```

### 2. 命令行工具

命令行工具启动频繁，每次启动都要加载类，启动时间影响用户体验。AOT缓存可以大幅提升启动速度，用户体验更好。

```java
// 命令行工具示例
public class CliTool {
    public static void main(String[] args) {
        // 启用AOT缓存后，启动速度更快
        // 类加载操作已经提前做好，直接从缓存读取
        if (args.length == 0) {
            printUsage();
            return;
        }
        String command = args[0];
        switch (command) {
            case "process":
                processFiles(args);
                break;
            case "analyze":
                analyzeData(args);
                break;
            default:
                printUsage();
        }
    }
    private static void processFiles(String[] args) {
        // 处理文件逻辑
        System.out.println("处理文件...");
    }
    private static void analyzeData(String[] args) {
        // 分析数据逻辑
        System.out.println("分析数据...");
    }
    private static void printUsage() {
        System.out.println("用法: cli-tool <command> [options]");
    }
}
```

### 3. 服务器应用

服务器应用虽然启动不频繁，但启动时间长了也影响部署效率。AOT缓存可以提升启动速度，部署更快，特别是那种需要频繁重启的场景。

```java
// 服务器应用示例
@SpringBootApplication
public class ServerApplication {
    public static void main(String[] args) {
        // 启用AOT缓存后，启动速度更快
        // 类加载和链接操作已经提前做好，直接从缓存读取
        ConfigurableApplicationContext context = 
            SpringApplication.run(ServerApplication.class, args);
        // 注册关闭钩子
        Runtime.getRuntime().addShutdownHook(new Thread(() -> {
            context.close();
        }));
    }
}
```

## AOT类链接优化

JEP 483还引入了AOT类链接优化，可以通过 `-XX:+AOTClassLinking` 选项启用。这个选项会在创建AOT缓存时进行更高级的优化，比如提前解析invokedynamic指令，进一步提升启动和预热性能。

```bash
# 启用AOT类链接优化
java -XX:AOTMode=create \
     -XX:+AOTClassLinking \
     -XX:AOTConfig=app.aotconfig \
     -XX:AOTCacheOutput=app.aot \
     -jar myapp.jar
```

启用AOT类链接后，创建缓存时会进行更多优化，但要注意，用这个选项创建的缓存，在使用时某些命令行参数可能不兼容，需要确保训练时和生产时用的选项一致。

## 性能影响分析

启用AOT类加载与链接后，性能会有啥变化？鹏磊我总结了一下：

### 启动时间降低

最明显的就是启动时间降了。类加载和链接操作已经提前做好，启动时直接从缓存读取，不用再走一遍流程，启动速度能提升不少。对于那种类特别多的应用，比如Spring Boot这种框架应用，效果更明显。

### 预热时间缩短

除了启动时间，预热时间也能缩短。类已经提前加载和链接好，JIT编译可以更快开始，整体预热时间能缩短。

### 内存占用

AOT缓存会占用一些磁盘空间，但运行时内存占用基本不变。缓存文件通常不大，几MB到几十MB，对于启动性能的提升来说，这点空间不算啥。

### 兼容性限制

虽然整体是正向的，但也有一些限制：

1. **JVM选项兼容性**：训练时和生产时用的JVM选项要一致，否则缓存可能用不了
2. **类路径兼容性**：类路径变了，缓存可能用不了，需要重新生成
3. **动态类加载**：动态加载的类可能不在缓存里，需要正常加载

## 最佳实践

用AOT类加载与链接的时候，鹏磊我建议注意这么几点：

### 1. 训练要代表性

训练的时候要跑一个代表性的工作负载，确保收集到的类使用情况能反映实际使用场景。如果训练不充分，缓存可能不完整，效果不好。

```bash
# 训练时要跑完整的业务流程
java -XX:AOTMode=record \
     -XX:AOTCacheOutput=app.aot \
     -XX:AOTConfigOutput=app.aotconfig \
     -jar myapp.jar \
     --run-full-workload  # 运行完整工作负载
```

### 2. 保持选项一致

训练时和生产时用的JVM选项要一致，否则缓存可能用不了。可以用配置文件记录选项，确保一致性。

```bash
# 训练时记录选项
java -XX:AOTMode=record \
     -XX:AOTCacheOutput=app.aot \
     -XX:AOTConfigOutput=app.aotconfig \
     -Xmx2g -Xms2g \
     -jar myapp.jar > training-options.log
# 生产时使用相同选项
java -XX:AOTMode=auto \
     -XX:AOTCache=app.aot \
     -Xmx2g -Xms2g \
     -jar myapp.jar
```

### 3. 定期更新缓存

如果应用更新了，类变了，需要重新训练和创建缓存。可以在CI/CD流程里自动更新缓存，确保缓存是最新的。

```bash
#!/bin/bash
# CI/CD流程中更新AOT缓存
# 1. 训练
echo "训练AOT缓存..."
java -XX:AOTMode=record \
     -XX:AOTCacheOutput=app.aot \
     -XX:AOTConfigOutput=app.aotconfig \
     -jar myapp.jar
# 2. 创建
echo "创建AOT缓存..."
java -XX:AOTMode=create \
     -XX:AOTConfig=app.aotconfig \
     -XX:AOTCacheOutput=app.aot \
     -jar myapp.jar
# 3. 验证
echo "验证AOT缓存..."
java -XX:AOTMode=auto \
     -XX:AOTCache=app.aot \
     -jar myapp.jar --verify-only
```

### 4. 监控缓存使用情况

启用后要监控缓存使用情况，看看有没有问题。可以用 `-Xlog:aot` 选项记录AOT日志，观察缓存加载情况。

```bash
# 启用AOT日志
java -XX:AOTMode=auto \
     -XX:AOTCache=app.aot \
     -Xlog:aot \
     -jar myapp.jar
```

### 5. 处理兼容性问题

如果遇到兼容性问题，缓存用不了，可以先用自动模式（auto），JVM会自动检测，用不了就正常加载。或者用严格模式（strict）做调试，看看哪里不兼容。

```bash
# 自动模式（推荐）
java -XX:AOTMode=auto -XX:AOTCache=app.aot -jar myapp.jar
# 严格模式（调试用）
java -XX:AOTMode=strict -XX:AOTCache=app.aot -jar myapp.jar
```

## 与其他优化结合

AOT类加载与链接可以和其他JVM优化结合使用，效果更好：

### 1. CDS（类数据共享）

CDS可以把类元数据存到共享归档文件里，AOT可以把类加载和链接结果存到缓存里，两者可以一起用，效果更好。

```bash
# 结合CDS和AOT
java -XX:AOTMode=auto \
     -XX:AOTCache=app.aot \
     -Xshare:on \
     -jar myapp.jar
```

### 2. AppCDS（应用类数据共享）

AppCDS可以把应用类也存到共享归档文件里，和AOT一起用，启动速度能进一步提升。

```bash
# 结合AppCDS和AOT
java -XX:AOTMode=auto \
     -XX:AOTCache=app.aot \
     -Xshare:on \
     -XX:SharedArchiveFile=app.jsa \
     -jar myapp.jar
```

### 3. 分层编译

AOT优化启动性能，分层编译优化运行时性能，两者可以一起用，整体性能更好。

```bash
# 结合分层编译
java -XX:AOTMode=auto \
     -XX:AOTCache=app.aot \
     -XX:+TieredCompilation \
     -jar myapp.jar
```

## 常见问题

### Q1: AOT缓存会影响运行时性能吗？

不会。AOT缓存只是优化启动时的类加载和链接，运行时性能不受影响。实际上，因为类已经提前链接好，运行时性能可能还有轻微提升。

### Q2: 所有类都能用AOT缓存吗？

基本上都可以。但动态加载的类可能不在缓存里，需要正常加载。JVM会自动处理，不需要改代码。

### Q3: AOT缓存什么时候需要更新？

如果应用更新了，类变了，或者JVM选项变了，需要重新训练和创建缓存。可以在CI/CD流程里自动更新。

### Q4: AOT缓存和CDS有什么区别？

CDS存的是类元数据，AOT存的是类加载和链接的结果。两者可以一起用，效果更好。CDS主要优化类加载，AOT主要优化类链接。

### Q5: 启用AOT后启动时间一定会降低吗？

不一定。虽然理论上能降低，但实际效果要看具体场景。类特别多的应用效果更明显，类少的应用可能没啥变化。建议先做性能测试。

## 总结

AOT类加载与链接（JEP 483）是JDK 24引入的一个特性，可以大幅提升启动性能。它引入了AOT缓存机制，可以把类提前加载和链接好，存到缓存里，启动时直接从缓存读取，不用再走一遍类加载流程，启动速度能提升不少。

特别适合云原生场景，因为容器经常要启停，AOT缓存可以复用，启动速度能提升不少。对于那种类特别多的应用，比如Spring Boot这种框架应用，效果更明显。

使用要注意训练要代表性、保持选项一致、定期更新缓存、监控使用情况、处理兼容性问题。可以和其他JVM优化结合使用，效果更好。

虽然有一些兼容性限制，但整体是正向的，启动性能能提升不少。兄弟们可以试试，特别是那种启动频繁的场景，效果更明显。启动快了，部署更快，用户体验更好，何乐而不为呢？
