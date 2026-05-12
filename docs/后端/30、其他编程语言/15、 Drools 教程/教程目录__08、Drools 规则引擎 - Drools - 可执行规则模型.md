# 08、Drools 规则引擎 - Drools - 可执行规则模型
- 来源：https://ddkk.com/zhuanlan/other/drools/1/8.html
- 分类：Drools 教程
- 分组：教程目录
这应该是Drools的新东西，我之前使用的时候都没注意到还有这么一个东西，据说是可以让Drools变得更高更快更强，这里面有比较详细的介绍，感兴趣就去来看看。

### 可执行规则模型

在Drools中规则素材默认使用标准的kie-maven-plugion插件从可执行的规则模型构建。可执行规则模型是嵌入式模型，可执行模型在执行构建时，提供了一套基于java的规则集的表示。可执行模型和Drools之前版本相比，是一个更高效的选择，可以使KieContainer和KieBase更快的被创建出来，尤其是当你有一个DRL文件和其他Drools素材的大列表时。

如果你不使用kie-maven-plugin插件，或者如果你的项目中缺少需要的drools-model-compiler依赖，那么规则素材是在没有可执行模型的情况下构建的。因此，为了在构建期间产生可执行模型，要确保你项目中的pom.xml文件中添加了kie-maven-plugin插件和drools-model-copmiler依赖。

> 从Drools8.33开始，如果你的项目有drools引擎或者drools规则单元引擎依赖，你不需要添加drools-model-compiler依赖就可以使用kie-maven-plugin插件去生成可执行模型。

可执行模型的优势：

编译期：传统的，一个Drools项目的包包含了DRL文件和其他工件的列表，这些文件和工件定义了规则库，和一些实现了约束和结果的提前生成的类。当KJAR被从Maven仓库中下载并在KIEContainer中被安装时，那些DRL文件必须被解析和编译。这个过程会慢一些，尤其是规则集很大的时候。使用可执行模型，你可以在KJAR内部打包那些实现了项目规则库的可执行模型的Jave类，并以更快的方式重新创建KIEContainer和他的KieBase。在Maven项目里，你使用kie-maven-plugin插件在编译过程中，从DRL文件中去自动生成可执行模型的源代码。

运行时：在可执行模型中，所有的约束都是用java的lambda表达式定义的。相同的lambda表示也可以用于约束计算，所以你不再需要为了解释求值使用mvel表达式，也不需要使用JIT过程将基于mvel的约束转换成字节码。这样创造了一个更快更有效的运行时间。

开发期：可执行模型可以让你使用Drools的新特性去开发和实验，而不需要以DRL形式编码或者修改DRL解析器。

> 对于在可执行规则模型的查询定义，最多只能设置10个参数。
>
> 对于在可执行规则模型中规则结果中的变量，最多可以设置24个变量（包括drools的内置变量）。举例来说，下面的规则结果使用了超过24个变量，造成了编译错误：
>
> …
>
> then
>
> $input.setNo25Count(functions.sumOf(new Object[]{$no1Count_1, $no2Count_1, $no3Count_1, ..., $no25Count_1}).intValue());
>
> $input.getFirings().add("fired");
>
> update($input);

#### 在Drools项目中修改或者停用可执行模型

使用kie-maven-plugin插件默认从可执行规则模型构建Drools中的规则素材。可执行模型比Drools之前版本的标准素材打包更高效。但是，如果需要，你可以修改或者停用可执行规则模型，以将Drools项目构建作为基于DRL的KJAR，而不是默认的基于模型的KJAR。

过程

使用通常的方式构建Drools项目，但是根据项目的类型提供了备用的构建选项：

- 对于Maven项目，用命令终端打开maven项目所在的文件夹，然后运行下面的命令：

```java
mvn clean install -DgenerateModel=<VALUE>
```

用下面的三个值中的一个代替命令中的:

- YES_WITHDRL:(默认)生成原项目DRL文件对应的可执行模型，DRL文件也要添加到生成的KJAR中做留档（不管怎么说，KieBase是从可执行模型被构建的）。
- YES：生成原项目DRL文件对应的可执行模型，DRL文件不放入生成的KJAR。
- NO：不生成可执行模型。

构建命令去停用默认执行模型的行为的例子：

```java
mvn clean install -DgenerateModel=NO
```

对于以java编程方式配置的应用，可执行模型默认就是停用的。添加规则素材到KIE虚拟的文件系统KieFileSystem，并使用KieBuilder的下面方法之一：

- buildAll()(默认)或者buildAll(DrlProject.class):不生成可执行模型。
- buildAll(ExecutableModelProject.class):生成原项目DRL文件对应的可执行模型。

启用可执行模型的例子代码：

```java
import org.kie.api.KieServices;
import org.kie.api.builder.KieFileSystem;
import org.kie.api.builder.KieBuilder;
  KieServices ks = KieServices.Factory.get();
  KieFileSystem kfs = ks.newKieFileSystem()
  kfs.write("src/main/resources/KBase1/ruleSet1.drl", stringContainingAValidDRL)
  .write("src/main/resources/dtable.xls",
    kieServices.getResources().newInputStreamResource(dtableFileStream));
  KieBuilder kieBuilder = ks.newKieBuilder( kfs );
  // Enable executable model
  kieBuilder.buildAll(ExecutableModelProject.class)
  assertEquals(0, kieBuilder.getResults().getMessages(Message.Level.ERROR).size());
```

#### 当升级到7.39版本的Drool时，启用可执行规则模型

从Drools7.39开始，使用标准kie-maven-plugin插件默认是从可执行规则模型构建规则素材。可执行模型是比以前Drools的标准素材包更高效的选择。

当你安装Drools7.39时，这个默认执行模型的行为会对所有新项目配置。但是如果你从一个以前版本升级到7.39版本，并且没有启动可执行规则模型，你必须添加需要的依赖到该项目，好让你可以用可执行模型去构建规则素材。如果你没有使用kie-maven-plugin插件或者需要的drools-model-compiler依赖没有添加，规则素材的构建依旧不会使用可执行模型。

想要了解更多关于可执行的规则模型的信息，可参考：

[https://docs.drools.org/8.40.0.Final/drools-docs/drools/KIE/index.html#executable-model-con_packaging-deploying。](https://docs.drools.org/8.40.0.Final/drools-docs/drools/KIE/index.html#executable-model-con_packaging-deploying%E3%80%82)

过程

在你的Maven项目中的pom.xml文件或者你的Java项目的相关类路径上，添加下面依赖，使得规则素材默认从可执行文件构建：

```java
<dependency>
    <groupId>org.drools</groupId>
    <artifactId>drools-model-compiler</artifactId>
    <version>${drools.version}</version>
</dependency>
```

这个依赖将可执行模型编译成Drools内部数据结构，这样就可以通过Drools的规则引擎去执行了。

是maven工件的版本号（举个例子，7.59.0.Final）。
