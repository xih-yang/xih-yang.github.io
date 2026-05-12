# 04、Intellij Idea 创建一个Java项目
- 来源：https://ddkk.com/zhuanlan/tools/idea/4.html
- 分类：开发工具
- 分组：教程目录
在此，我们将创建我们的第一个 Java 项目。我们将编写并执行Hello World程序。

## 创建项目

启动IntelliJ IDEA。转到File->New->Project。出现以下画面。

选择“Java”项目和适当的项目 SDK。单击Next。

现在，输入项目名称并选择项目位置。单击Finish。

单击Finish按钮后，将打开以下屏幕。

## 创建包

转到Project Structure，右键单击src -> New -> Package。输入包名称并单击Finish按钮。

## 创建Java类

转到Project Structure，右键单击src -> New -> Java Class。创建新的类名并单击Finish按钮。

一旦我们点击Ok按钮，带有类声明的编辑器窗口将打开。在这里，我们编写要运行和执行的代码。

## 运行应用程序

在编辑器窗口中输入以下代码，它将在控制台上打印输出。

```java
public class MyClass {  
    public static void main(String[] args) {  
        System.out.println("Hello World !!");  
    }  
}  
```

转到“Run”菜单并选择“Run”选项。

再次选择类名并运行。该输出会出现在控制台。
