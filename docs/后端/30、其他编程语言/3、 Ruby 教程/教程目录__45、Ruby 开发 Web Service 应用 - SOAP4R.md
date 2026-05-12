# 45、Ruby 开发 Web Service 应用 - SOAP4R
- 来源：https://ddkk.com/zhuanlan/other/ruby/45.html
- 分类：Ruby 教程
- 分组：教程目录
SOAP，全写为 Simple Object Access Protocol，中文名是简单对象访问协议，是交换数据的一种协议规范。

SOAP 是一种简单的基于 XML 的协议，它使应用程序通过 HTTP 来交换信息。

简单对象访问协议是交换数据的一种协议规范，是一种轻量的、简单的、基于 XML（标准通用标记语言下的一个子集）的协议，它被设计成在 WEB 上交换结构化的和固化的信息

想要了解 SOAP 更多知识请移步 SOAP 基础教程

## SOAP4R 安装

SOAP4R 由 Hiroshi Nakamura 开发实现，用于开发 Ruby 的 SOAP 应用

SOAP4R 下载地址 ：[https://github.com/rubyjedi/soap4r](https://github.com/rubyjedi/soap4r)

> 注意： 你的 Ruby 环境可能已经安装了该该组件

### Linux 安装 SOAP4R

Linux 环境下可以使用 gem 来安装该组件

```ruby
gem install soap4r --include-dependencies
```

### Windows 安装 SOAP4R

如果是Window 环境下开发，则需要下载 zip 压缩文件，并通过执行 install.rb 来安装

## SOAP4R 服务

SOAP4R 支持两种不同的服务类型：

**1、** 基于CGI/FastCGI服务(SOAP::RPC::CGIStub)；

**2、** 独立服务(SOAP::RPC:StandaloneServer)；

### 1. 继承 SOAP::RPC::StandaloneServer

为了实现自己的独立的 SOAP 服务器，需要编写一个新的类，继承 SOAP::RPC::StandaloneServer

```ruby
class MyServer < SOAP::RPC::StandaloneServer
  ...............
end
```

如果编写一个基于 FastCGI 的服务器，则需要继承 SOAP::RPC::CGIStub

```ruby
class MyServer < SOAP::RPC::CGIStub
  ...............
end
```

### 2. 定义处理方法

下面我们开始定义两个 Web Service 的方法：一个是两个数相加，一个是两个数相除

```ruby
class MyServer < SOAP::RPC::StandaloneServer
   ...............
   # soap add 处理方法
   def add(a, b)
      return a + b
   end
   def div(a, b) 
      return a / b 
   end
end
```

### 3. 添加 SOAP 服务

现在，可以发布我们定义的两个 SOAP 方法了。

initialize 方法是公开的，用于外部的连接

```ruby
class MyServer < SOAP::RPC::StandaloneServer
   def initialize(*args)
      add_method(receiver, methodName, *paramArg)
   end
end
```

下表是各参数的说明：

参数
描述

receiver
包含方法名的方法的对象。 如果你在同一个类中定义服务方法，该参数为 self

methodName
调用 RPC 请求的方法名

paramArg
参数名和参数模式

为了理解 *inout* 和 *out* 参数，考虑以下服务方法，需要输入两个参数:inParam 和 inoutParam，函数执行完成后返回三个值：retVal、inoutParam 、outParam

```ruby
def aMeth(inParam, inoutParam)
   retVal = inParam + inoutParam
   outParam = inParam . inoutParam
   inoutParam = inParam * inoutParam
   return retVal, inoutParam, outParam
end
```

公开的调用方法如下

```ruby
add_method(self, 'aMeth', [
    %w(in inParam),
    %w(inout inoutParam),
    %w(out outParam),
    %w(retval return)
])
```

### 4. 开启 SOAP 服务

最后，实例化 MyServer 然后调用 start 方法来启动服务

```ruby
myServer = MyServer.new('ServerName','urn:ruby:ServiceName', 
      hostname, port)
myServer.start
```

下表是请求参数的说明

参数
描述

ServerName
服务名

urn:ruby:ServiceName
Hereurn:ruby 是固定的，ServiceName 则可以自定义

hostname
指定主机名

port
web 服务端口

### 范例

把上面的所有源码组合在一起，就可以创建一个独立的服务

#### main.rb

```ruby
# !/usr/bin/ruby -w
# -*- encoding:utf-8 -*-
# filename: main.rb
# author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
# Copyright © 2015-2065 www.ddkk.com. All rights reserved.
require "soap/rpc/standaloneserver"
begin
   class MyServer < SOAP::RPC::StandaloneServer
      # 添加 SOAP 服务
      def initialize(*args)
         add_method(self, 'add', 'a', 'b')
         add_method(self, 'div', 'a', 'b')
      end
      # SOAP 方法名
      def add(a, b)
         return a + b
      end
      def div(a, b) 
         return a / b 
      end
  end
  server = MyServer.new("MyServer", "urn:ruby:calculation", 'localhost', 8080)
  trap('INT){
     server.shutdown
  }
  server.start
rescue => err
  puts err.message
end
```

运行了以上范例后，就启动了一个监听 8080 端口的本地服务，并发布了两个方法：add 和 div

我们可以通过在运行命令后加 & 开启后台运行

```ruby
$ ruby main.rb &
```

## SOAP4R 客户端

Ruby 语言可以使用 SOAP::RPC::Driver 类开发 SOAP 客户端来调用我们开发的 SOAP 服务

调用SOAP 服务需要以下信息

**1、** SOAP服务URL地址(SOAPEndpointURL)；

**2、** 服务方法的命名空间（MethodNamespaceURI）；

**3、** 服务方法名及参数信息；

下面我们就一步一步创建 SOAP 客户端来调用以上的 SOAP 方法：add 、 div

### 1. 创建 SOAP Driver 实例

可以通过实例化 SOAP::RPC::Driver 类来调用它的新方法

```ruby
driver = SOAP::RPC::Driver.new(endPoint, nameSpace, soapAction)
```

下表是参数的描述

参数
描述

endPoint
连接 SOAP 服务的 URL 地址

nameSpace
命名空间用于 SOAP::RPC::Driver 对象的所有 RPC

soapAction
用于 HTTP 头部的 SOAPAction 字段值。如果是字符串是"" 则默认为nil

### 2. 添加服务方法

可以通过 driver.add_method 为 SOAP::RPC::Driver 添加 SOAP 服务方法

```ruby
driver.add_method(name, *paramArg)
```

下表是参数的说明

参数
描述

name
远程 WEB 服务的方法名

paramArg
指定远程程序的参数

### 3. 调用 SOAP 服务

最后可以使用 driver.serviceMethod 来调用调用 SOAP 服务

```ruby
result = driver.serviceMethod(paramArg...)
```

- serviceMethod SOAP服务的实际方法名
- paramArg 为方法的参数列表

### 范例

把上面的所有源码组合在一起，就可以访问我们的 SOAP 服务了

#### driver.rb

```ruby
# !/usr/bin/ruby -w
# -*- encoding:utf-8 -*-
# filename: driver.rb
# author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
# Copyright © 2015-2065 www.ddkk.com. All rights reserved.
require 'soap/rpc/driver'
NAMESPACE = 'urn:ruby:calculation'
URL = 'http://localhost:8080/'
begin
   driver = SOAP::RPC::Driver.new(URL, NAMESPACE)
   # Add remote sevice methods
   driver.add_method('add', 'a', 'b')
   # Call remote service methods
   puts driver.add(20, 30)
rescue => err
   puts err.message
end
```

使用ruby driver.rb 就可以访问我们刚刚创建的 SOAP 服务
