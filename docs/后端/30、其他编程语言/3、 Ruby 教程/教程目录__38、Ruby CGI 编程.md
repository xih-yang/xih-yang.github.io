# 38、Ruby CGI 编程
- 来源：https://ddkk.com/zhuanlan/other/ruby/38.html
- 分类：Ruby 教程
- 分组：教程目录
Ruby 不仅可以编写自己的 SMTP 服务器，FTP程序，或 Web 服务器，而且还可以开发 CGI 程序

接下来，我们将花几节时间来学习 Ruby 的 CGI 开发

## 网页浏览过程

为了更好的了解 CGI 是如何工作的，我们可以从在网页上点击一个链接或 URL 来了解网页请求响应流程：

**1、** 打开浏览器访问URL并连接到HTTPweb服务器；

**2、** WEB服务器接收到请求信息后会解析URL，并查找访问的文件在服务器上是否存在，如果存在返回文件的内容，否则返回错误信息；

**3、** 浏览器从服务器上接收信息，并显示接收的文件或者错误信息；

CGI程序可以是 Ruby 脚本，Python 脚本，PERL 脚本，SHELL 脚本，C 或者 C++ 程序等

## CGI 架构图

## Web服务器支持及配置

在开发CGI 程序前，我们先要配置 WEB 服务器支持 CGI 及 CGI 的处理程序

#### Apache 支持 CGI 配置：

设置好CGI目录：

```ruby
ScriptAlias /cgi-bin/ /var/www/cgi-bin/
```

所有的HTTP 服务器执行 CGI 程序都保存在一个预先配置的目录。 这个目录被称为 CGI 目录，并按照惯例，它被命名为 /var/www/cgi-bin 目录

CGI程序的扩展名为 .cgi，Ruby 也可以使用 .rb 扩展名

默认情况下，Linux 服务器配置运行的 cgi-bin 目录中为 /var/www

如果想指定其它运行 CGI 脚本的目录，可以修改 httpd.conf 配置文件

```ruby
<Directory "/var/www/cgi-bin">
   AllowOverride None
   Options +ExecCGI
   Order allow,deny
   Allow from all
</Directory>
```

在AddHandler 中添加 .rb 后缀，这样我们就可以访问 .rb 结尾的 Ruby 脚本文件

```ruby
AddHandler cgi-script .cgi .pl .rb
```

## 编写 CGI 脚本

一个简单的 Ruby CGI 脚本如下所示

#### hello.cgi

```ruby
# !/usr/bin/ruby -w
# -*- encoding:utf-8 -*-
# filename: hello.cgi
# author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
# Copyright © 2015-2065 www.ddkk.com. All rights reserved.
puts "Content-type: text/html\n\n"
puts "<html><body>Hello World</body></html>"
```

将以上代码保持到 hello.cgi 文件中，上传到服务器并赋予足够权限，即可作为 CGI 脚本执行

假设我们站点的地址为: http://localhost:8080/ 那么可以通过 http://localhost:8080/hello.cgi 访问 CGI 程序，输出结果为： "Hello World"

浏览器访问该网址后，Web 服务器会在站点目录下找到 hello.cgi 文件，然后通过 Ruby 解析器来解析脚本代码并访问 HTML 文档

## 使用 cgi.rb

Ruby 可以调用 CGI 库来编写更复杂的 CGI 脚本

#### print_header.cgi

```ruby
# !/usr/bin/ruby -w
# -*- encoding:utf-8 -*-
# filename: print_header.cgi
# author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
# Copyright © 2015-2065 www.ddkk.com. All rights reserved.
require 'cgi'
cgi = CGI.new
puts cgi.header
puts "<html><body>Hello World</body></html>"
```

上面的代码，创建了 CGI 对象并打印头部信息

## 表单处理

CGI程序可以通过两种方式获取表单提交的数据

例如URL： /cgi-bin/form_get.cgi?FirstName=Li&LastName=Hong

可以使用 CGI#[] 来直接获取参数 FirstName 和 LastName

```ruby
# !/usr/bin/ruby -w
# -*- encoding:utf-8 -*-
# filename: form_get.cgi
# author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
# Copyright © 2015-2065 www.ddkk.com. All rights reserved.
require 'cgi'
cgi = CGI.new
cgi['FirstName'] # =>  ["Li"]
cgi['LastName']  # =>  ["Hong"]
```

另外一种获取表单数据的方法：

```ruby
# !/usr/bin/ruby -w
# -*- encoding:utf-8 -*-
# filename: form_get.cgi
# author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
# Copyright © 2015-2065 www.ddkk.com. All rights reserved.
require 'cgi'
cgi = CGI.new
h = cgi.params  # =>  {"FirstName"=>["Li"],"LastName"=>["Hong"]}
h['FirstName']  # =>  ["Li"]
h['LastName']   # =>  ["Hong"]
```

以下代码用于检索所有的表单键值：

```ruby
# !/usr/bin/ruby -w
# -*- encoding:utf-8 -*-
# filename: form_get.rb
# author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
# Copyright © 2015-2065 www.ddkk.com. All rights reserved.
require 'cgi'
cgi = CGI.new
cgi.keys         # =>  ["FirstName", "LastName"]
```

如果表单包含了多个相同名称的字段，则该相同字段的值将保存在数组中

以下范例中，指定表单中三个相同的字段 "name"，值分别为 "XiaoHong", "XiaoMing" 和 "XiaoZhang"

```ruby
#!/usr/bin/ruby
require 'cgi'
cgi = CGI.new
cgi['name']        # => "XiaoHong"
cgi.params['name'] # => ["XiaoHong", "XiaoMing", "XiaoZhang"]
cgi.keys           # => ["name"]
cgi.params         # => {"name"=>["XiaoHong", "XiaoMing", "XiaoZhang"]}
```

> 注意： Ruby 会自动判断 GET 和 POST 方法，所以无需对两种方法区别对待

下面是相关的 HTML 代码

#### form_get.html

```ruby
<html>
<body>
<form method="POST" action="/form_get.cgi">
<p>First Name :<input type="text" name="FirstName" value="" /></p>
<p>Last Name :<input type="text" name="LastName" value="" /></p>
<p><input type="submit" value="Submit Data" /></p>
</form>
</body>
</html>
```

## 创建 Form 表单和 HTML

Ruby CGI 模块包含了大量的方法来创建 HTML，每个HTML标签都有相对应的方法。

在使用这些方法前，必须通过 CGI.new 来创建 CGI 对象

为了使标签的嵌套更加的简单，这些方法将内容作为了代码块，代码块将返回字符串作为标签的内容

```ruby
# !/usr/bin/ruby -w
# -*- encoding:utf-8 -*-
# filename: main.rb
# author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
# Copyright © 2015-2065 www.ddkk.com. All rights reserved.
require "cgi"
cgi = CGI.new("html5")
cgi.out{
   cgi.html{
      cgi.head{ "\n"+cgi.title{"Hello World"} } +
      cgi.body{ "\n"+
         cgi.form{"\n"+
            cgi.hr +
            cgi.h1 { "A Form: " } + "\n"+
            cgi.textarea("get_text") +"\n"+
            cgi.br +
            cgi.submit
         }
      }
   }
}
```

## 字符串转义

处理URL 中的参数或者 HTML 表单数据时，需要对指定的特殊字符进行转义，如：引号（"）,反斜杠(/)

Ruby CGI 对象提供了 CGI.escape 和 CGI.unescape 方法来处理特殊字符

```ruby
# !/usr/bin/ruby -w
# -*- encoding:utf-8 -*-
# filename: main.rb
# author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
# Copyright © 2015-2065 www.ddkk.com. All rights reserved.
require 'cgi'
puts CGI.escape("Li XiaoMing /A Sweet & Sour Girl")
```

运行以上范例，输出结果如下

```ruby
$ ruby main.rb
Li+XiaoMing+%2FA+Sweet+%26+Sour+Girl
```

另一组范例

```ruby
# !/usr/bin/ruby -w
# -*- encoding:utf-8 -*-
# filename: main.rb
# author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
# Copyright © 2015-2065 www.ddkk.com. All rights reserved.
require 'cgi'
puts CGI.escapeHTML("<h1>Li XiaoMing /A Sweet & Sour Girl</h1>")
```

运行以上脚本，输出结果如下

```ruby
$ ruby main.rb
<h1>Li XiaoMing /A Sweet & Sour Girl</h1>
```

## CGI 类中常用的方法

如果想知道 Ruby 中完整的 CGI 类的方法，请移步 Ruby CGI

## Cookies 和 Sessions

- Ruby CGI Cookies - 如何处理 CGI Cookies
- Ruby CGI Sessions - 如何处理 CGI sessions
