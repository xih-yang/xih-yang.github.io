# 15、JUnit – ANT 插件
- 来源：https://ddkk.com/zhuanlan/tools/junit/15.html
- 分类：开发工具
- 分组：教程目录
## JUnit – ANT 插件

在这个例子中，我们将展示如何使用 ANT 运行 JUnit。让我们跟随以下步骤：

## 步骤 1:下载 Apache Ant

下载 **[Apache ANT](http://ant.apache.org/bindownload.cgi)**

操作系统
文件名

Windows
apache-ant-1.8.4-bin.zip

Linux
apache-ant-1.8.4-bin.tar.gz

Mac
apache-ant-1.8.4-bin.tar.gz

## 步骤 2:设置 Ant 环境

设置 **ANT_HOME** 环境变量来指向 ANT 函数库在机器中存储的基本文件地址。例如，我们已经在不同的操作系统的 apache-ant-1.8.4 文件夹中存储了 ANT 函数库。

操作系统
输出

Windows
在 C:\Program Files\Apache Software Foundation
\apache-ant-1.8.4 中设置环境变量 ANT_HOME

Linux
导出 ANT_HOME=/usr/local/\apache-ant-1.8.4

Mac
export ANT_HOME=/Library/\apache-ant-1.8.4

附加ANT 编译器地址到系统路径，对于不同的操作系统来说如下所示：

操作系统
输出

Windows
附加字符串 ;%ANT_HOME\bin to the end of the
 system variable, Path.

Linux
导出 PATH= `$` PATH: `$` ANT_HOME/bin/

Mac
不需要

## 步骤 3:下载 Junit Archive

下载 **[JUnit Archive](https://github.com/downloads/KentBeck/junit/junit-4.10.jar)**

操作系统
输出

Windows
junit4.10.jar

Linux
junit4.10.jar

Mac
junit4.10.jar

## 步骤 4:创建项目结构

- 在 **C:\ > JUNIT_WORKSPACE** 中创建文件夹 **TestJunitWithAnt**
- 在 **C:\ > JUNIT_WORKSPACE > TestJunitWithAnt** 中创建文件夹 **src**
- 在 **C:\ > JUNIT_WORKSPACE > TestJunitWithAnt** 中创建文件夹 **test**
- 在 **C:\ > JUNIT_WORKSPACE > TestJunitWithAnt** 中创建文件夹 **lib**
- 在 **C:\ > JUNIT_WORKSPACE > TestJunitWithAnt >src** 文件夹中创建 MessageUtil 类

```java
/*
* This class prints the given message on console.
*/
public class MessageUtil {
   private String message;
   //Constructor
   //@param message to be printed
   public MessageUtil(String message){
      this.message = message; 
   }
   // prints the message
   public String printMessage(){
      System.out.println(message);
      return message;
   }   
   // add "Hi!" to the message
   public String salutationMessage(){
      message = "Hi!" + message;
      System.out.println(message);
      return message;
   }   
}
```

- 在 **C:\ > JUNIT_WORKSPACE > TestJunitWithAnt > src** 文件夹中创建 TestMessageUtil 类。

```java
import org.junit.Test;
import org.junit.Ignore;
import static org.junit.Assert.assertEquals;
public class TestMessageUtil {
   String message = "Robert";   
   MessageUtil messageUtil = new MessageUtil(message);
   @Test
   public void testPrintMessage() { 
      System.out.println("Inside testPrintMessage()");     
      assertEquals(message,messageUtil.printMessage());
   }
   @Test
   public void testSalutationMessage() {
      System.out.println("Inside testSalutationMessage()");
      message = "Hi!" + "Robert";
      assertEquals(message,messageUtil.salutationMessage());
   }
}
```

- 在 **C:\ > JUNIT_WORKSPACE > TestJunitWithAnt > lib** 文件夹中复制 junit-4.10.jar。

## 创建 ANT Build.xml

我们将使用 ANT 中的 任务来执行我们的 junit 测试样例。

```java
<project name="JunitTest" default="test" basedir=".">
   <property name="testdir" location="test" />
   <property name="srcdir" location="src" />
   <property name="full-compile" value="true" />
   <path id="classpath.base"/>
   <path id="classpath.test">
      <pathelement location="/lib/junit-4.10.jar" />
      <pathelement location="${testdir}" />
      <pathelement location="${srcdir}" />
      <path refid="classpath.base" />
   </path>
   <target name="clean" >
      <delete verbose="${full-compile}">
         <fileset dir="${testdir}" includes="**/*.class" />
      </delete>
   </target>
   <target name="compile" depends="clean">
      <javac srcdir="${srcdir}" destdir="${testdir}" 
         verbose="${full-compile}">
         <classpath refid="classpath.test"/>
      </javac>
   </target>
   <target name="test" depends="compile">
      <junit>
         <classpath refid="classpath.test" />
         <formatter type="brief" usefile="false" />
         <test name="TestMessageUtil" />
      </junit>
   </target>
</project>
```

运行下列的 ant 命令

```java
C:\JUNIT_WORKSPACE\TestJunitWithAnt>ant
```

验证输出。

```java
Buildfile: C:\JUNIT_WORKSPACE\TestJunitWithAnt\build.xml
clean:  
compile:  
   [javac] Compiling 2 source files to C:\JUNIT_WORKSPACE\TestJunitWithAnt\test
   [javac] [parsing started C:\JUNIT_WORKSPACE\TestJunitWithAnt\src\
   MessageUtil.java]
   [javac] [parsing completed 18ms]
   [javac] [parsing started C:\JUNIT_WORKSPACE\TestJunitWithAnt\src\
   TestMessageUtil.java]
   [javac] [parsing completed 2ms]
   [javac] [search path for source files: C:\JUNIT_WORKSPACE\
   TestJunitWithAnt\src]    
   [javac] [loading java\lang\Object.class(java\lang:Object.class)]
   [javac] [loading java\lang\String.class(java\lang:String.class)]
   [javac] [loading org\junit\Test.class(org\junit:Test.class)]
   [javac] [loading org\junit\Ignore.class(org\junit:Ignore.class)]
   [javac] [loading org\junit\Assert.class(org\junit:Assert.class)]
   [javac] [loading java\lang\annotation\Retention.class
   (java\lang\annotation:Retention.class)]
   [javac] [loading java\lang\annotation\RetentionPolicy.class
   (java\lang\annotation:RetentionPolicy.class)]
   [javac] [loading java\lang\annotation\Target.class
   (java\lang\annotation:Target.class)]
   [javac] [loading java\lang\annotation\ElementType.class
   (java\lang\annotation:ElementType.class)]
   [javac] [loading java\lang\annotation\Annotation.class
   (java\lang\annotation:Annotation.class)]
   [javac] [checking MessageUtil]
   [javac] [loading java\lang\System.class(java\lang:System.class)]
   [javac] [loading java\io\PrintStream.class(java\io:PrintStream.class)]
   [javac] [loading java\io\FilterOutputStream.class
   (java\io:FilterOutputStream.class)]
   [javac] [loading java\io\OutputStream.class(java\io:OutputStream.class)]
   [javac] [loading java\lang\StringBuilder.class
   (java\lang:StringBuilder.class)]
   [javac] [loading java\lang\AbstractStringBuilder.class
   (java\lang:AbstractStringBuilder.class)]
   [javac] [loading java\lang\CharSequence.class(java\lang:CharSequence.class)]
   [javac] [loading java\io\Serializable.class(java\io:Serializable.class)]
   [javac] [loading java\lang\Comparable.class(java\lang:Comparable.class)]
   [javac] [loading java\lang\StringBuffer.class(java\lang:StringBuffer.class)]
   [javac] [wrote C:\JUNIT_WORKSPACE\TestJunitWithAnt\test\MessageUtil.class]
   [javac] [checking TestMessageUtil]
   [javac] [wrote C:\JUNIT_WORKSPACE\TestJunitWithAnt\test\TestMessageUtil.class]
   [javac] [total 281ms]
test:
    [junit] Testsuite: TestMessageUtil
    [junit] Tests run: 2, Failures: 0, Errors: 0, Time elapsed: 0.008 sec
    [junit]
    [junit] ------------- Standard Output ---------------
    [junit] Inside testPrintMessage()
    [junit] Robert
    [junit] Inside testSalutationMessage()
    [junit] Hi!Robert
    [junit] ------------- ---------------- ---------------
BUILD SUCCESSFUL
Total time: 0 seconds
```
