# 10、JUnit – 套件测试
- 来源：https://ddkk.com/zhuanlan/tools/junit/10.html
- 分类：开发工具
- 分组：教程目录
## JUnit – 套件测试

## 测试套件

**测试套件**意味着捆绑几个单元测试用例并且一起执行他们。在 JUnit 中，**@RunWith** 和 **@Suite** 注释用来运行套件测试。这个教程将向您展示一个例子，其中含有两个测试样例 TestJunit1 & TestJunit2 类，我们将使用测试套件一起运行他们。

## 创建一个类

在目录**C:\ > JUNIT_WORKSPACE** 中创建一个被测试的 java 类命名为 MessageUtil.java

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

## 创建 Test Case 类

在目录**C:\ > JUNIT_WORKSPACE** 创建一个 java 测试类叫做 TestJunit1.java。

```java
import org.junit.Test;
import org.junit.Ignore;
import static org.junit.Assert.assertEquals;
public class TestJunit1 {
   String message = "Robert";   
   MessageUtil messageUtil = new MessageUtil(message);
   @Test
   public void testPrintMessage() { 
      System.out.println("Inside testPrintMessage()");    
      assertEquals(message, messageUtil.printMessage());     
   }
}
```

在目录**C:\ > JUNIT_WORKSPACE** 创建一个 java 测试类叫做 TestJunit2.java。

```java
import org.junit.Test;
import org.junit.Ignore;
import static org.junit.Assert.assertEquals;
public class TestJunit2 {
   String message = "Robert";   
   MessageUtil messageUtil = new MessageUtil(message);
   @Test
   public void testSalutationMessage() {
      System.out.println("Inside testSalutationMessage()");
      message = "Hi!" + "Robert";
      assertEquals(message,messageUtil.salutationMessage());
   }
}
```

## 使用 Test Suite 类

- 创建一个 java 类。
- 在类中附上 @RunWith(Suite.class) 注释。
- 使用 @Suite.SuiteClasses 注释给 JUnit 测试类加上引用。

在目录**C:\ > JUNIT_WORKSPACE** 创建一个 java 类文件叫做 TestSuite.java 来执行测试用例。

```java
import org.junit.runner.RunWith;
import org.junit.runners.Suite;
@RunWith(Suite.class)
@Suite.SuiteClasses({
   TestJunit1.class,
   TestJunit2.class
})
public class JunitTestSuite {   
}  
```

## 创建 Test Runner 类

在目录**C:\ > JUNIT_WORKSPACE** 创建一个 java 类文件叫做 TestRunner.java 来执行测试用例。

```java
import org.junit.runner.JUnitCore;
import org.junit.runner.Result;
import org.junit.runner.notification.Failure;
public class TestRunner {
   public static void main(String[] args) {
      Result result = JUnitCore.runClasses(JunitTestSuite.class);
      for (Failure failure : result.getFailures()) {
         System.out.println(failure.toString());
      }
      System.out.println(result.wasSuccessful());
   }
}  
```

使用javac 命令编译所有的 java 类

```java
C:\JUNIT_WORKSPACE>javac MessageUtil.java TestJunit1.java 
TestJunit2.java JunitTestSuite.java TestRunner.java
```

现在运行 Test Runner，即运行所有的在之前 Test Case 类中定义的测试用例。

```java
C:\JUNIT_WORKSPACE>java TestRunner
```

验证输出

```java
Inside testPrintMessage()
Robert
Inside testSalutationMessage()
Hi Robert
true
```
