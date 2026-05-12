# 13、JMeter 教程 - JMeter前置处理器
- 来源：https://ddkk.com/zhuanlan/tools/jmeter/1/13.html
- 分类：开发工具
- 分组：教程目录
## 1.简介

前置处理器是在发出“取样器请求”之前执行一些操作。如果将前置处理器附加到取样器元件，则它将在该取样器元件运行之前执行。前置处理器最常用于在取样器请求运行前修改其设置，或更新未从响应文本中提取的变量。前置处理器主要是用来处理请求前的一些准备工作，比如参数设置、环境变量设置等等。

## 2.预览前置处理器

首先我们来看一下JMeter的前置处理器，路径：线程组（用户）->添加->前置处理器（）；我们可以清楚地看到共有8个前置处理器（不包括jp@gc开头的前置处理器，这个是安装的插件），如下图所示：

## 3.常用前置处理器详解

### 3.1JSR223 PreProcessor

JSR223 预处理程序，用于对于采集器进行处理，且是在sampler启动之前 。

**3、** 1.1新建：线程组>添加>前置处理器>JSR223预处理程序，如下图所示：；

**3、** 1.2关键参数说明如下：；

语言：开发脚本选择的语言，使用的JSR223语言，可根据需要选择；

参数：传递给脚本的参数；

文件名：本地开发的脚本文件（会覆盖在JMeter里编写的脚本）；

脚本编译缓存：存储编译的脚本，默认勾选；

Script：要运行脚本。编写脚本的区域。

**3、** 1.3实例；

用法类似Beanshell 取样器，可以参考：Jmeter(十一) - JMeter导入自定义的Jar包 这篇文章。具体用法如下：

**1、** 新建测试计划，线程组下添加JSR223预处理程序，如下图所示：；

**2、** 参考脚本代码：；

```java
import com.test.BeanShellJMeter;
BeanShellJMeter bs = new BeanShellJMeter("迪丽热巴","31");
vars.put("username",bs.getUserName());
vars.put("age",bs.getAge());
```

**3、** 然后再添加调试取样器；

**4、** 配置好以后，运行JMeter，查看表格结果，如下图所示：；

### 3.2用户参数

用户参数，用于做几组参数给线程组的各个线程使用，如果线程数多于用户参数组数，则多出来的线程则从第一组用户参数开始依次调用参数组；简单来说就是给不同线程组（用户）使用不一样的变量值。

**3、** 2.1新建：线程组>添加>前置处理器>用户参数，如下图所示：；

**3、** 2.2关键参数说明如下：；

每次迭代更新一次：标识是否每轮迭代更新一次元素；

**3、** 2.3实例；

**1、** 新建测试计划，线程组下添加用户参数，如下图所示：；

**2、** 然后再设置线程数为3；

**3、** 配置好以后，运行JMeter，查看表格结果，如下图所示：；

### 3.3HTML链接解析器

HTML链接解析器，用于从前一个sampler返回的html页面中按照规则解析链接和表单，再根据此处理器所在的sampler中的规则进行匹配修改，而后该sampler会执行；

**3、** 3.1新建：线程组>添加>前置处理器>HTML链接解析器，如下图所示：；

**3、** 3.2实例；

**1、** 新建测试计划，线程组下添加1个仅此一次控制器，在仅此一次控制器下再添加1个HTTP信息头管理器，2个取样器百度搜索和点击链接，如下图所示：；

（1）HTTP信息头管理器

（2）百度搜索（此取样器为一个搜索请求，返回HTML页面）

（3）点击搜索（此取样器添加一个HTML链接解析器，解析器会将取样器返回的HTML页面按照取样器中的各个正则表达式匹配并发送此取样器）

**2、** 然后再在点击链接添加HTML链接解析器；

**3、** 配置好以后，运行JMeter，查看结果，如下图所示：；

（1）百度搜索结果

（2）点击链接结果

### 3.4HTTP URL 重写修饰符

HTTP URL重写修改器，此处理器与HTTP LinkParser类似，但专用于使用url重写来存储sessionId而非cookie的http request，在线程组级别添加此修改器则应用于所有sample，若为单个sample添加则只适用该sample。顾名思义就是帮我们重定向URL请求；重写URL来存储会话id。我们知道浏览器与服务器之间的会话一般用cookie来管理，在JMeter中就是HTTP Cookie管理器，但是在实践工作中还有另外一种会话保持方式。比如系统只允许登录成功的用户才可以访问系统，当用户登录成功后返回一个SessionID（或者JsessionId）给用户，后续访问都需要验证这个SessionID。如果后续请求都是以Get的方式提交表单，那么SessionID需要附加在URL链接中，而且每一个Get的请求都是如此，这种重复的工作，显然是可以用一个操作来完成的，在JMeter中这个操作就是HTTP URL重写修饰符。

为什么使用URL地址重写? 因为有些浏览器的安全设置，禁用了session.而session的原理则是把session的ID保存在客户端的cookie中。所以这个时候如果cookie功能被禁用的话,所有使用session的功能将失效.如果采用url地址重写技术,则server会把session经过编码以后，写到url地址后面当做参数来传递.这样既提高了客户端的安全性,同时也避免了功能被屏蔽的风险。

**3、** 4.1新建：线程组>添加>前置处理器>HTTPURL重写修饰符，如下图所示：；

**3、** 4.2关键参数说明如下：；

会话参数名称：用于搜索sessionId，其他sample也可通过此参数来 调用其获取的sessionId；

路径扩展：如url添加了分号作为分割，则勾选此项；

Donot use equals in path extension：用于url不用等号来分割key和value的类型；

Donot use questionmark in path extension：用于不带？的类型；

缓存会话 Id?：勾选此项则会存储在其挂载的sample上获取到的sessionId供后边的其他sample使用；

URL编码：是否使用url编码；

**3、** 4.3实例HTTPURL重写修饰符原理；

### 3.5JDBC PreProcessor

JDBC预处理器，用于在sample开始前查询数据库并获取一些值； jdbc预处理程序，和取样器的JDBC Request一样。可以参考这一篇文章：Jmeter(六) - 建立数据库测试计划实战

**3、** 5.1新建：线程组>添加>前置处理器>JDBC预处理程序，如下图所示：；

**3、** 5.2关键参数说明如下：；

Variable Name Bound to Pool：连接池名称，需与JDBC链接配置中的Variable Name相同（此预处理器需要一个JDBC Connection Configuration，此配置器在配置元件中）；

Query Type：数据库查询类型，根据需要自行选择；

Query：数据库语句输入框，根据需要输入，注意结尾不要加”;”；

Parameter values：参数名称，如果Query的语句中有”?”则此处填值，可以使用调用参数方式；

Parameter types：参数类型，与Parameter values对应，设置参数类型，与sql字段类型相同；

Variable names：设定此项可以获取固定列的所有值；

Result variable name：随意设定一个名称，则此名称会被作为一个参数并对应Query出来的内容；可以使用参数调用的方法来获取此设置的名称对应的值；

Query timeout（s）：超时时间；

Handle ResultSet：有四个选项，结果保存的方式；

### 3.6取样器超时

超时器，用于设定sample的超时时间，如果完成时间过长，此预处理器会调度计时器任务以中断样本；

**3、** 6.1新建：线程组>添加>前置处理器>SampleTimeout，如下图所示：；

**3、** 6.2关键参数说明如下：；

Sample timeout：超时时间；

### 3.7RegEx User Parameters正则表达式用户参数

RegEx User Parameters，使用正则表达式为从另一个HTTP请求中提取的HTTP参数指定动态值，配合regular expression extractor使用。暂时没找到好的例子，后面想到补充。。

**3、** 7.1新建：线程组>添加>前置处理器>JSR223预处理程序，如下图所示：；

**3、** 7.2关键参数说明如下：；

Regular Expression Reference Name：调用的正则表达式提取器中的引用名称；

Parameter names regexp group number：用于提取参数名称的正则表达式的组编号；

Parameter values regex group number：用于提取参数值的正则表达式的组编号。

### 3.8BeanShell PreProcessor

BeanShell是一种免费的java源码解释器，支持对象式的脚本语言，也可以嵌入到java源码中。添加了该处理器后，可直接在里面编写java代码，实现你要的功能操作。

用法类似Beanshell 取样器，可以参考：Jmeter(十二) - 从入门到精通 - JMeter导入自定义的Jar包 这篇文章。

**3、** 8.1新建：线程组>添加>前置处理器>BeanShell预处理程序，如下图所示：；

**3、** 8.2关键参数说明如下：；

重置解释器: 每次迭代是否重置解释器

参数：传递给脚本的参数；

文件名：本地开发的脚本文件（会覆盖在JMeter里编写的脚本）；

Script：要运行脚本。编写脚本的区域。
