# 9.4 高级用法
- 来源：https://ddkk.com/zhuanlan/orm/jfinal/81.html
- 分类：ORM框架
- 分组：9 Cron4jPlugin
除了可以对实现了Runnable接口的java类进行调度以外，还可以直接调度外部的应用程序，例如windows或linux下的某个可执行程序，如下是代码示例：

```java
String[] command = { "C:\\tomcat\\bin\\catalina.bat", "start" };
String[] envs = { "CATALINA_HOME=C:\\tomcat", "JAVA_HOME=C:\\jdks\\jdk5" };
File directory = "C:\\MyDirectory";
ProcessTask task = new ProcessTask(command, envs, directory);
cron4jPlugin.addTask(task);
me.add(cron4jPlugin);
```

如上所示，只需要创建一个ProcessTask对象，并让其指向某个应用程序，再通过addTask添加进来，就可以实现对其的调度，这种方式实现类似于每天半夜备份服务器数据库并打包成zip的功能，变得极为简单便捷。更加详细的用法，可以看一下Cron4jPlugin.java源代码中的注释。

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有

> JFinal 官方 | https://jfinal.com
