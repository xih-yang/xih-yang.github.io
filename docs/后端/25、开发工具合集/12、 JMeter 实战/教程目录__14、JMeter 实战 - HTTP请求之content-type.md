# 14、JMeter 实战 - HTTP请求之content-type
- 来源：https://ddkk.com/zhuanlan/tools/jmeter/2/14.html
- 分类：开发工具
- 分组：教程目录
**本文讲三种content-type以及在Jmeter中对应的参数输入方式**

**第一部分：目前工作中涉及到的content-type 有三种：**

content-type：在Request Headers里，告诉服务器我们发送的请求信息是哪种格式的。

**1content-type:****application/x-www-form-urlencoded**

默认的。如果不指定content-type，默认使用此格式。

参数格式：key1=value1&key2=value2

**2content-type:application/json**

参数为json格式

{

"key1":"value1",

"key2":"value2"

}

**3content-type:multipart/form-data [[dinghanhua](http://www.cnblogs.com/)]**

上传文件用这种格式

发送的请求示例：

**第二部分 不同的content-type如何输入参数**

**1content-type:application/x-www-form-urlencoded**

**参数可以在Parameters或Body D****ata里输入，格式不同，如下图所示。**

**这两个参数输入的tab页只能使用一个，某一个有数据后不能切换到另一个。**

**Parameters：**

**Body Data：**

**2content-type:application/json**

**2.1 首先添加信息头管理。http请求上点击右键》添加》配置元件》 HTTP信息头管理器**

**2.2 信息头编辑页面，点击添加，输入content-type application/json**

**2.3 在http请求，Body Data中输入json格式的参数**

**3content-type:multipart/form-data [[dinghanhua](http://www.cnblogs.com/)]**

**在http请求编辑页面，选中Use multipart/form-data for POST**

**Parameters中输入除了上传的文件以外的参数：参数名和参数值**

**Files Upload中上传文件，参数名和MIME类型**

上传文件如果不成功，修改Implementation为java试一下。
