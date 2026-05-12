# 02、Jenkins 进阶：Jenkins共享库(ShareLibrary)
- 来源：https://ddkk.com/zhuanlan/tools/jenkins/1/2.html
- 分类：开发工具
- 分组：教程目录
### 一、目录结构

**共享库的目录结构如下:**

```java
(root)
+- src                     Groovy source files
|   +- org
|       +- foo
|           +- Bar.groovy  for org.foo.Bar class
+- vars
|   +- foo.groovy          for global 'foo' variable
|   +- foo.txt             help for 'foo' variable
+- resources               resource files (external libraries only)
|   +- org
|       +- foo
|           +- bar.json    static helper data for org.foo.Bar
src 目录应该看起来像标准的 Java 源目录结构。当执行流水线时，该目录被添加到类路径下。
vars 目录定义可从流水线访问的全局变量的脚本。 每个 *.groovy 文件的基名应该是一个 Groovy (~ Java) 标识符, 通常是 camelCased。 匹配 *.txt, 如果存在, 可以包含文档, 通过系统的配置标记格式化从处理 (所以可能是 HTML, Markdown 等，虽然 txt 扩展是必需的)。
这些目录中的 Groovy 源文件 在脚本化流水线中的 “CPS transformation” 一样。
resources 目录允许从外部库中使用 libraryResource 步骤来加载有关的非 Groovy 文件。 目前，内部库不支持该特性。
根目录下的其他目录被保留下来以便于将来的增强。
注：src目录必须存在，其他可以没有
```

### 二、创建git仓库，存放library文件

**为了避免网络问题，我使用里gitlab，网络正常的可以使用github**

****

**src目录下创建library测试文件(可以在输入框中连同目录一起创建)**

****

**var目录下创建library测试文件（可以全局被访问）**

****

**完整格式如下：**

****

### 三、jenkins引用shareLibrary

**点击系统管理-->系统配置，搜索 'Pipeline Libraries'，点击新增**

****

****

**确保验证通过，其他保持默认即可**

****

### 四、创建jenkinsfile(项目下)

****

### 五、定义jenkins流水线配置

****

****

**查看执行结果：**

****

****
