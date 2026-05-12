# 01、Java 7 新特性 - Switch中添加对String类型的支持
- 来源：https://ddkk.com/zhuanlan/java/java7/1.html
- 分类：Java 7 新特性
- 分组：教程目录
Switch语句可以使用原始类型或枚举类型。Java引入了另一种类型，我们可以在switch语句中使用：字符串类型。

说我们有一个根据其地位来处理贸易的要求。直到现在，我们使用if-其他语句来完成这个任务。

```java
private voidprocessTrade(Trade t){
            String status = t.getStatus();
            if(status.equalsIgnoreCase(NEW)) {
                  newTrade(t);
            } else if(status.equalsIgnoreCase(EXECUTE)) {
                  executeTrade(t);
            } else if(status.equalsIgnoreCase(PENDING)) {
                  pendingTrade(t);
            }
}
```

这种处理字符串的方法是粗糙的。在Java中，我们可以使用增强的switch语句来改进程序，该语句以String类型作为参数。

```java
public String generate(String name, String gender) {  
       String title = "";  
       switch (gender) {  
           case "男":  
               title = name + " 先生";  
               break;  
           case "女":  
               title = name + " 女士";  
               break;  
           default:  
               title = name;  
       }  
       return title;  
}
```

**编译器在编译时先做处理**

case仅仅有一种情况。直接转成if。

假设仅仅有一个case和default，则直接转换为if…else…。

有多个case。先将String转换为hashCode，然后相应的进行处理，JavaCode在底层兼容Java7曾经版本号。
