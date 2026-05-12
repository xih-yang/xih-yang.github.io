# 13、JUnit – 异常测试
- 来源：https://ddkk.com/zhuanlan/tools/junit/13.html
- 分类：开发工具
- 分组：教程目录
## JUnit – 异常测试

Junit 用代码处理提供了一个追踪异常的选项。你可以测试代码是否它抛出了想要得到的异常。**expected** 参数和 @Test 注释一起使用。现在让我们看看活动中的 *@Test(expected)*。

## 创建一个类

- 在 **C:\ > JUNIT_WORKSPACE** 中创建一个叫做 MessageUtil.java 的 java 类来测试。
- 在 printMessage()方法中添加一个错误条件。

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
   public void printMessage(){
      System.out.println(message);
      int a =0;
      int b = 1/a;
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

- 创建一个叫做 TestJunit.java 的 java 测试类。
- 给 testPrintMessage() 测试用例添加需要的异常 ArithmeticException。

在 **C:> JUNIT_WORKSPACE** 中创建一个文件名为 TestJunit.java 的 java 类

```java
import org.junit.Test;
import org.junit.Ignore;
import static org.junit.Assert.assertEquals;
public class TestJunit {
   String message = "Robert";   
   MessageUtil messageUtil = new MessageUtil(message);
   @Test(expected = ArithmeticException.class)
   public void testPrintMessage() { 
      System.out.println("Inside testPrintMessage()");     
      messageUtil.printMessage();     
   }
   @Test
   public void testSalutationMessage() {
      System.out.println("Inside testSalutationMessage()");
      message = "Hi!" + "Robert";
      assertEquals(message,messageUtil.salutationMessage());
   }
}
```

## 创建 TestRunner 类

在 **C:> JUNIT_WORKSPACE** 中创建一个文件名为 TestJunit.java 的 java 类来执行测试用例。

```java
import org.junit.runner.JUnitCore;
import org.junit.runner.Result;
import org.junit.runner.notification.Failure;
public class TestRunner {
   public static void main(String[] args) {
      Result result = JUnitCore.runClasses(TestJunit.class);
      for (Failure failure : result.getFailures()) {
         System.out.println(failure.toString());
      }
      System.out.println(result.wasSuccessful());
   }
}
```

用javac 编译 MessageUtil，Test case 和 Test Runner 类。

```java
C:\JUNIT_WORKSPACE>javac MessageUtil.java TestJunit.java TestRunner.java
```

现在运行 Test Runner，它将运行由提供的 Test Case 类中所定义的测试用例。

```java
C:\JUNIT_WORKSPACE>java TestRunner
```

验证输出。testPrintMessage() 测试用例将通过。

```java
Inside testPrintMessage()
Robert
Inside testSalutationMessage()
Hi!Robert
true
```
