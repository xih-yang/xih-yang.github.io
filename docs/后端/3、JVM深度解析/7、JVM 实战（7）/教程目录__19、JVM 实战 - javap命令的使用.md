# 19、JVM 实战 - javap命令的使用
- 来源：https://ddkk.com/zhuanlan/java/jvm/7/19.html
- 分类：JVM 实战
- 分组：教程目录
### 1、javap 的参数

通过反编译生成的字节码文件，我们可以深入的了解java代码的工作机制。但是，自己分析类文件结构太麻烦了！除了使用第三方的jclasslib工具之外，oracle官方也提供了工具：javap。

javap是jdk自带的反解析工具。它的作用就是根据class字节码文件，反解析出当前类对应的code区 （字节码指令）、局部变量表、异常表和代码行偏移量映射表、常量池等信息。

通过局部变量表，我们可以查看局部变量的作用域范围、所在槽位等信息，甚至可以看到槽位复用等信息。

### 2、javap 的用法

一般常用的是-v -l -c三个选项。

- javap -l 会输出行号和本地变量表信息。
- javap -c 会对当前class字节码进行反编译生成汇编代码。
- javap -v classxx除了包含一c内容外，还会输出行号、局部变量表信息、常量池等信息。

以如下代码为例来学习javap的使用方法

① **javap -public** JavapTest.class 显示公共信息

② **javap -protected** JavapTest.class 显示受保护的/公共类和成员

③ **javap -p(或-private)** JavapTest.class 显示所有类和成员（大于private的）

④ **javap -package** JavapTest.class 显示程序包/受保护的/公共类和成员（默认）,非私有的信息

⑤ **javap -sysinfo** JavapTest.class 显示正在处理的类的系统信息（路径，大小，日期，MD5 散列，源文件名）

⑥ **javap -constants** JavapTest.class 与前面命令的主要区别，常量值会显示出来COUNTS = 1;

#### 字节码细节相关

- **-s** 输出内部类型签名(描述符)

- **-l** 输出行号和本地变量表

- **-c** 对代码进行反汇编

- **-v 或 -verbose** 输出附加信息（包括行号、本地变量表、反汇编等详细信息），**-v是最全的**

#### 组合使用

-v不包含私有信息，所以可以使用组合方式获取更全的信息 `java -v -p JavapTest.class`

### 3、小结

**1、** 通过javap命令可以查看一个java类反汇编得到的Class文件版本号、常量池、访问标识、变量表、指令代码行号表等等信息不显示类索引、父类索引、接口索引集合、()、()等结构；

**2、** 通过对前面例子代码反汇编文件的简单分析，可以发现，一个方法的执行通常会涉及下面几块内存的操作：；

- java栈：局部变量表、操作数栈。
- java堆：通过对象的地址引用去操作。
- 常量池。
