# 11、Intellij Idea 代码重构
- 来源：https://ddkk.com/zhuanlan/tools/idea/11.html
- 分类：开发工具
- 分组：教程目录
重构是改变现有程序结构而不改变其功能和用途的过程。重构还用于提高代码的可重用性、提高性能并删除重复的功能或未使用的功能。重构是一项应该非常小心地执行的任务，因为一个错误可能会产生很多错误。

在重构菜单中，我们可以找到所有可能的重构选项。还有一个可用于重构的快捷方式选项。“Ctrl+Alt+Shift+T”快捷键将打开一个弹出窗口，其中显示光标悬停在代码段上的所有可用重构选项。

一些重要的重构选项如下：

- 重命名
- 复制重构
- 移动重构
- 安全删除
- 查找和替换代码重复

## Intellij Idea 重命名

此操作提供了重命名方法、属性、参数等的工具。在这里，我们将创建一个类名为 Person 的示例。

```java
public class Person {  
    private String name;  
    private String address;  
    private int age;  
    public Person() {  
        this("PeterJohn", 30);  
    }  
    public Person(String name, int age) {  
        this.name = name;  
        this.age = age;  
    }  
    public String getName() {  
        return name;  
    }  
    public void setName(String name) {  
        this.name = name;  
    }  
    public int getAge() {  
        return age;  
    }  
    public void setAge(int age) {  
        this.age = age;  
    }  
    @Override  
    public String toString() {  
        return "Person{" +  
                "name='" + name + '\'' +  
                ", age=" + age +  
                '}';  
    }  
    public static void main(String args[]) {  
        Person e = new Person();  
        System.out.println(e);  
    }  
}  
```

现在我们将使用Employee更改Person类的名称，然后它将修改构造函数和main()方法。为此，请按照以下步骤操作：

- 选择Person类名
- 在菜单栏中，转到Refactor -> Rename。出现以下画面。更改名称并单击重构按钮。

## Intellij Idea 复制重构

此操作用于将一个类复制到另一个类。它可以在现有的一个或新的一个中完成。为此，请按照以下步骤操作：

- 转到Refactor -> Copy。出现以下画面。

- 输入新名称，选择目标包，然后单击确定按钮。

## Intellij Idea 移动重构

它为我们提供了将文件移动到另一个地方或创建另一个类的内部类的工具。为此，请按照以下步骤操作：

- 转到**Refactor -> Move**。出现以下画面。
- 提供目的地。单击**Refactor**。

## Intellij Idea 安全删除

此选项将删除对象、类、方法、接口、参数等，仅当它在项目中的任何地方都没有被引用时。为此，请按照以下步骤操作：

在编辑器中输入以下代码并选择“sayHi”

```java
package MyPackage;  
public class HelloWorld {  
    static void sayHi(){  
        System.out.println("Hi");  
    }  
    public static void main(String[] args) {  
        sayHi();  
    }  
}  
```

现在去**Refactor -> Safe Delete**

如果在任何地方使用sayHi方法，它将显示在下面的屏幕上。

## Intellij Idea 查找和替换重复代码

此重构选项可识别与所选方法或常量字段相似的重复代码，并将其替换为合适的代码。为此，请按照以下步骤操作：

- 输入以下代码，定位我们要搜索的重复项的光标。

```java
package MyPackage;  
public class Person {  
    private String name;  
    private int age;  
    public Person() {  
        this("PeterJohn", 40);  
    }  
    public Person(String name, int age) {  
        this.name = name;  
        this.age = age;  
    }  
    public void setData(String name, int age) {  
        this.name = name;  
        this.age = age;  
    }  
    public void showPersonDetail() {  
        System.out.println("Name = " + name + ", Age = " + age);  
    }  
    public static void main(String args[]) {  
        Person e = new Person();  
        e.showPersonDetail();  
    }  
} 
```

- 转到**Refactor -> Find and Replace Code Duplicates**
- 打开对话框，选择 IDE 查找重复项的范围

- 重构后，它给出确认消息，单击Refactor。输出是：

```java
package MyPackage;  
public class Person {  
    private String name;  
    private int age;  
    public Person() {  
        this("PeterJohn", 40);  
    }  
    public Person(String name, int age) {  
        setData(name, age);  
    }  
    public void setData(String name, int age) {  
        this.name = name;  
        this.age = age;  
    }  
    public void showPersonDetail() {  
        System.out.println("Name = " + name + ", Age = " + age);  
    }  
    public static void main(String args[]) {  
        Person e = new Person();  
        e.showPersonDetail();  
    }  
}  
```
