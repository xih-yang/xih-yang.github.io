# 12、JMeter 教程 - Meter导入自定义的Jar包
- 来源：https://ddkk.com/zhuanlan/tools/jmeter/1/12.html
- 分类：开发工具
- 分组：教程目录
## 1.简介

怎么导入自定义的Jar包，前置处理器会用到这个自定义的Jar包。

## 2.环境准备

（1）idea

我们要引入自定义的Jar包，所以你需要一个可以编写脚本生成Jar的工具，当然了你可以选择其他的开发工具，这里选择idea。

（2）JMeter

JMeter就更不用多说了。

## 3.具体思路

**1、** 开发脚本；

**2、** 将脚本导出Jar包；

**3、** JMeter引入Jar包；

### 4.思路实现

**1、** 首先我们开发一个简单的接口；

**4、** 1代码实现；

**4、** 2参考代码；

```java
package com.test;
/**
 * @author 小羊
 *
 * 2023年12月15日
 */
public interface BeanJMeterUtil {
    //获取名字方法
    public String getUserName();
    //获取年龄方法
    public String getAge();
}
```

**2、** 开发一个实现接口的类；

**4、** 3代码实现；

**4、** 4参考代码；

```java
package com.test;
/**
 * @author 小羊
 *
 * 2023年12月15日
 */
public class BeanShellJMeter implements BeanJMeterUtil{
    //定义变量名字
    private String userName;
    //定义变量年龄
    private String age;
    public BeanShellJMeter(String name) {
        this.userName = name;
    }
    public BeanShellJMeter(String name,String age){
        this.userName = name;
        this.age = age;
    }
    public String getUserName() {
        return userName;
    }
    public void setUserName(String userName){
        this.userName = userName;
    }
    public String getAge(){
        return age;
    }
    public void setAge(String age)
    {
        this.age = age;
    }
}
```

**3、** 测试接口是否实现创建测试类test，实例化接口的实现类BeanShellJMeter，调用该类中的方法并输出结果；

**4、** 5代码实现；

**4、** 6参考代码；

```java
package com.test;
/**
 * @author 小羊
 *
 * 2023年12月15日
 */
public class test {
    public static void main(String[] args) {
        // 创建实现类的对象
        BeanShellJMeter user = new BeanShellJMeter("易烊千玺","23");
        System.out.println("Hello！他是"+ user.getUserName()+"，今年"+user.getAge()+"岁" );
    }
}
```

**4、** 7运行结果；

**5、** 将脚本导出Jar包；

**5、** 1右键File,然后继续点击“openmodulesettings”，如下图所示：；

**5、** 2选中“Artifacts”，点击“+”->“JAR”->“from…”如下图所示：；

**5、** 3选择内容，选择copyto…，选择默认项目的路径，点击“OK”；

（1）extract …:表示导出jar包，没有依赖关系

（2）copy …:表示导出jar包，有依赖关系，一般选择这个选项

**5、** 4选择想要导出jar包放置的位置，点击ok；

**5、** 5输出jar包；

**5、** 6查看导出的Jar包，如下图所示：；

**6、** JMeter引入自定义Jar包；

**6、** 1新建测试计划，导入自定义的Jar包，如下图所示：；

**6、** 2线程组下添加BeanShell预处理程序（放入2个参数易烊千玺23），如下图所示：；

**3、** 脚本参考代码：；

```java
import com.test.BeanShellJMeter;
BeanShellJMeter bs = new BeanShellJMeter(bsh.args[0],bsh.args[1]);
vars.put("username",bs.getUserName());
vars.put("age",bs.getAge());
```

**4、** 然后再添加添加1个调试取样器；

**5、** 配置好以后，运行JMeter，查看表格结果（把读到的数据放入username和age中），如下图所示：；
