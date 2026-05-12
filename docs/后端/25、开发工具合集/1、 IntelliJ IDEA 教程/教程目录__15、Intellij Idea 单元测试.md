# 15、Intellij Idea 单元测试
- 来源：https://ddkk.com/zhuanlan/tools/idea/15.html
- 分类：开发工具
- 分组：教程目录
我们可以在 IntelliJ IDEA 中运行所有单元测试。IntelliJ IDEA 有各种单元测试框架，如 JUnit、TestNG 等等。在本节中，我们将了解单元测试的工作原理。在这里，我们将使用 JUnit 4：

## 创建单元测试

按照下面给出的步骤创建单元测试：

**1、** 创建项目；

**2、** 在src文件夹中，创建一个Java类文件并输入以下代码；

```java
public class HelloWorld {  
    private String name;  
    public HelloWorld(String name) {  
        this.name = name;  
    }  
    public String getName() {  
        return name;  
    }  
}  
```

**3、** 创建一个名为Test的新目录来执行单元测试；

**4、** 现在我们的项目结构将如下所示；

**5、** 转到**File->ProjectStructure->Module**将打开一个新窗口屏幕在Source菜单中选择TestDirectory进行测试，然后单击Ok按钮；

**6、** 转到**Navigate->Test**.将出现一个对话框；

**7、** 单击**CreateNewTest**将打开一个新窗口填写窗口中给出的详细信息单击确定按钮；

**8、** 新的HelloWorldTest.java文件将打开在此文件中，我们必须键入以下代码；

```java
public class HelloWorldTest {  
    @Test  
    public void getName() throws Exception {  
        HelloWorld john = new HelloWorld("John");  
        assertEquals("John",john.getName());  
    }  
}  
```

**9、** 现在点击“Run”我们可以在编辑器的底部看到生成的结果；
