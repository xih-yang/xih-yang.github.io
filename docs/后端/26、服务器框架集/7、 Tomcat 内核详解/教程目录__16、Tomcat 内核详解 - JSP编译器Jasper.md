# 16、Tomcat 内核详解 - JSP编译器Jasper
- 来源：https://ddkk.com/zhuanlan/server/tomcat/3/16.html
- 分类：服务器框架
- 分组：教程目录
Jasper模块是Tomcat的JSP核心引擎，我们知道JSP本质上是一个Servlet。

Tomcat使用Jasper对JSP语法进行解析，生成Servlet并生成Class字节码。另外，在运行的时候，Jasper还会检测JSP文件是否修改，如果修改，则会重新编译JSP文件。

## 1.从JSP到Servlet

### 1.语法树的生成——语法解析

### 2.语法树的遍历——访问者模式

访问者模式可以将数据结构和处理逻辑很好的解耦出来，这种模式可以很好的

### 3.JSP编译后的Servlet

## 2.从Servlet到Class字节码

### 1.JSR45标准

JSR-45规范的核心对象是资源映射表（Source Map），简称SMAP，这里只是JSP文件名以及行号的映射表，把这个映射表存放在Class文件中，在基于JPDA的调试工具中就可以通过此映射表获取到对应的JSP文件以及行号，向开发者提示对应JSP文件的信息；

### 2.JDT Compile编译器

优秀的编译器例如Eclipse JDT Java编译器和Ant编译器

### 3.Jasper自动检测机制
