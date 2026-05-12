# 13、JMeter 实战 - 常见问题及解决方法
- 来源：https://ddkk.com/zhuanlan/tools/jmeter/2/13.html
- 分类：开发工具
- 分组：教程目录
jmeter作为一个开源的纯Java性能测试工具，工作中极大的方便了我们进行接口、性能测试，但使用过程中也遇到了很多的问题，下面就记录一下自己遇到的问题，后续会不断更新。。。

**1、获取日志**

在使用jmeter过程中，如果想获得更详细的日志，可以修改jmeter\bin\jmeter.properties文件中的一个属性：所有log_level.jmeter的后缀由info改为debug，如下：

**2、jmeter安装**

安装使用jmeter时候不需要设置classpath以及class变量，只需要默认安装好JDK即可（通常情况下），然后解压jmeter安装包，启动jmeter\bin\jmeter.bat程序即可；

因为jmeter是以Java_jar的方式启动，而且会忽略该变量，这对所有Java程序都适用。

**3、请求/响应数据显示乱码**

有时候在发送请求/查看响应数据时，服务端接收到的请求中包含乱码，导致无法解析报错，解决方法有如下几种：

**①**请求数据显示乱码，可以在请求中如下设置：

**②**返回数据包含乱码时，可以修改jmeter\bin\jmeter.properties文件中的一个属性：将encoding=后面的编码格式改为utf-8，如下：

**4、内存OOM（OutOfMemoryError：内存溢出）**

在执行压力测试时候，有时候会遇到OutOfMemoryError这样的异常；JMeter是一个纯Java开发的工具，内存是由java虚拟机JVM管理；如果出现了内存溢出的问题，

可以通过调整JVM内存相关的参数进行优化。

具体过程如下：

①找到jmeter.bat文件，也就是我们启动jmeter的脚本：

②打开jmeter.bat文件，对一下这些配置项进行编辑：

③参数调整：

调整堆内存的大小：

将默认的set HEAP=-Xms512m -Xmx512m，调整为set HEAP=-Xms1024m -Xmx1024m；

调整堆内存中新生带的大小：

将默认的set NEW=-XX:NewSize=128m -XX:MaxNewSize=128m，调整为set NEW=-XX:NewSize=256m -XX:MaxNewSize=256m；

调整堆内存中永久带的大小：

将默认的set PERM=-XX:PermSize=64m -XX:MaxPermSize=128m，调整为set PERM=-XX:PermSize=128m -XX:MaxPermSize=256m；

调整后重启jmeter，问题一般可以得到解决（参数的调整不能一概而论，具体根据测试机的硬件配置来决定）。

**5、Listener使用技巧**

listener作为一个收集sampler的结果数据和呈现结果的文件，其本身会在每次sampler运行完成后执行一次，即一个test plan中的listener数量越多，运行时listener本身带来的资源消耗

就越大（尤其是view results in table以及view results tree等）。

因此实际执行test plan时，应首先禁用不需要的listener，再开始执行；更好的方式是每次运行时将生成的结果写入结果文件中，方便以后用不同的listener展现保存的结果数据。

当然，在并发量较大的情况下，一般的测试机限于配置等因素，无法支撑较大的并发数，可以用以下的方法来进行测试，方法如下：

去掉listener，为sampler添加断言（一般是响应断言），根据断言结果来判断请求是否成功，测试报告以plugins插件中的报告形式或文本形式写入文件中来提升测试效率。

**6、调试test plan**

很多测试人员在初始进行性能测试时，脚本都是录制得到的，但录制的脚本一般都包含很多对本次测试来说无用的sampler，以及录制的sampler需要重新修改参数等内容，才能使用。

所以调试test plan就很有必要，常用的有以下2种方法：

**①使用listener观察sampler的请求和相应**

录制的脚本，一般都需要剔除无用的sampler，然后修改参数，进行调试，才能用于测试执行，一般用于调试的listener是结果树，可以在测试计划中将线程组的数量修改为1，然后执行。

listener显示的每一个sampler结果为绿色（表示通过），但jmeter仅根据http返回码来判断sampler执行是否成功，这样无法判断sampler语义上的错误；因此，一般都是在sampler

中插入对应的检查点（Assertion：断言），根据返回的内容，来判断sampler是否真正成功。

**②使用http Mirror server观察sampler发出的请求**

在调试和修改sampler时，经常会为其增加一些额外的设置，例如额外的信息头、cookie管理器等，但设置完成后直接运行脚本进行测试，并不能保证请求真的和我们预期的一致。

如果不想将请求发送给被测应用，可以使用http mirror server组件（http镜像服务器）。

http mirror server可以启动一个镜像服务器，其可以把所有接收到的请求原封不动的返回，这样就可以查看发出的请求的具体内容。

使用方法如下：

点击工作台，右键添加→http mirror server，如有必要修改服务器端口（一般修改为localhost：8080，方便调试），然后启动镜像服务器；

其次修改需要调试的sampler，将其请求发送到mirror server启动的端口，运行测试计划，即可以从listener中查看响应数据。

**PS：** 其实http mirror server更大的作用是检查浏览器是否发送了特殊的http头，启动mirror server，使用浏览器访问该server，则可以在返回页面看到浏览器发送请求的完整内容。
