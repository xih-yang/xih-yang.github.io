# 27、Perl CGI 编程
- 来源：https://ddkk.com/zhuanlan/other/perl/27.html
- 分类：Perl 教程
- 分组：教程目录
CGI(Common Gateway Interface)，通用网关接口，是 WWW 技术中最重要的技术之一。

CGI是外部应用程序（ CGI程序 ）与 WEB 服务器之间的接口标准，是在 CGI 程序和 Web 服务器之间传递信息的过程。

CGI规范允许 Web 服务器执行外部程序，并将它们的输出发送给 Web 浏览器，CGI 将 Web 的一组简单的静态超媒体文档变成一个完整的新的交互式媒体

## CGI 运行机制

为了更好的了解 CGI 是如何工作的，我们可以从在网页上点击一个链接或 URL 的流程：

**1、** 使用你的浏览器访问URL并连接到HTTPweb服务器；

**2、** Web服务器接收到请求信息后会解析URL，并查找访问的文件在服务器上是否存在，如果存在返回文件的内容，否则返回错误信息；

**3、** 浏览器从服务器上接收信息，并渲染接收的文件或者错误信息；

CGI程序可以是 Python 脚本，Perl 脚本，Shell 脚本，C 或者 C++ 程序等

## CGI 架构图

下图是一般的 CGI 的构架图

## Web服务器支持及配置

在我们继续进行 CGI 编程前，先确保我们的的 Web 服务器支持 CGI 及已经配置了 CGI 的处理程序

### Apache Perl CGI 配置

设置好CGI 目录：

```sh
ScriptAlias /cgi-bin/ /mnt/data/www/cgi-bin/
```

所有的HTTP 服务器执行 CGI 程序都保存在一个预先配置的目录。 这个目录被称为 CGI 目录，并按照惯例，它被命名为 /mnt/data/www/cgi-bin 目录

CGI文件的扩展名为 .cgi，Perl 也可以使用 .pl 扩展名

默认情况下，Linux 服务器配置运行的 cgi-bin 目录中为 /mnt/data/www/

我们可以指定其他运行 CGI 脚本的目录，可以修改 httpd.conf 配置文件

如下所示：

```sh
<Directory "/mnt/data/www/cgi-bin">
   AllowOverride None
   Options +ExecCGI
   Order allow,deny
   Allow from all
</Directory>
```

在AddHandler 中添加 .pl 后缀，这样我们就可以访问 .pl 结尾的 Perl 脚本文件

```sh
AddHandler cgi-script .cgi .pl .py
```

## Hello World Perl CGI 程序

我们创建一个 helloworld.cgi Perl CGI 程序，代码如下

```sh
#!/usr/bin/perl
=pod
  file: helloworld.cgi
  author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
  Copyright © 2015-2065 www.ddkk.com. All rights reserved.
=cut
print "Content-type:text/html\r\n\r\n";
print '<html>';
print '<head>';
print '<meta charset="utf-8">';
print '<title>DDKK.COM 弟弟快看，程序员编程资料站，DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)</title>';
print '</head>';
print '<body>';
print '<h2>Hello Word! </h2>';
print '<p>DDKK.COM 弟弟快看，程序员编程资料站，DDKK.COM 弟弟快看，程序员编程资料站!</p>';
print '<p>这是来自DDKK.COM 弟弟快看，程序员编程资料站的第一个 Perl CGI 程序。</p>';
print '</body>';
print '</html>';
1;
```

然后通过浏览器打开 http://localhost:8080/cgi-bin/helloworld.cgi 输出结果如下：

脚本第一行的输出内容 Content-type:text/html\r\n\r\n 发送到浏览器并告知浏览器显示的内容类型为 text/html

## HTTP 头部

helloworld.cgi 文件内容中的 Content-type:text/html 即为 HTTP 头部的一部分。

Content-Type 会告诉浏览器发送给浏览器文件的内容类型。

### HTTP 头部的格式如下：

```sh
HTTP 字段名: 字段内容
```

例如：

```sh
Content-type:text/html\r\n\r\n
```

### 下表列出了 CGI 程序中经常使用的 HTTP 头部

HTTP 头部字段
描述

Content-type:
请求的与实体对应的MIME信息

Expires: Date
响应过期的日期和时间

Location: URL
重定向接收方到非请求URL的位置来完成请求或标识新的资源

Last-modified: Date
请求资源的最后修改时间

Content-length: N
请求的内容长度

Set-Cookie: String
设置Http Cookie

## CGI环境变量

所有的CGI 程序都接收以下的环境变量，这些变量在 CGI 程序中发挥了重要的作用

变量名
描述

CONTENT_TYPE
这个环境变量的值指示所传递来的信息的MIME类型。目前，环境变量CONTENT_TYPE一般都是：application/x-www-form-urlencoded,他表示数据来自于HTML表单

CONTENT_LENGTH
如果服务器与CGI程序信息的传递方式是POST，这个环境变量即使从标准输入STDIN中可以读到的有效数据的字节数。这个环境变量在读取所输入的数据时必须使用

HTTP_COOKIE
客户机内的 COOKIE 内容

HTTP_USER_AGENT
提供包含了版本数或其他专有数据的客户浏览器信息

PATH_INFO
这个环境变量的值表示紧接在CGI程序名之后的其他路径信息。它常常作为CGI程序的参数出现

QUERY_STRING
如果服务器与CGI程序信息的传递方式是GET，这个环境变量的值即使所传递的信息。这个信息经跟在CGI程序名的后面，两者中间用一个问号'?'分隔

REMOTE_ADDR
这个环境变量的值是发送请求的客户机的IP地址，例如上面的192.168.1.67。这个值总是存在的。而且它是Web客户机需要提供给Web服务器的唯一标识，可以在CGI程序中用它来区分不同的Web客户机

REMOTE_HOST
这个环境变量的值包含发送CGI请求的客户机的主机名。如果不支持你想查询，则无需定义此环境变量。

REQUEST_METHOD
提供脚本被调用的方法。对于使用 HTTP/1.0 协议的脚本，仅 GET 和 POST 有意义。

SCRIPT_FILENAME
CGI脚本的完整路径

SCRIPT_NAME
CGI脚本的的名称

SERVER_NAME
这是你的 WEB 服务器的主机名、别名或IP地址

SERVER_SOFTWARE
这个环境变量的值包含了调用CGI程序的HTTP服务器的名称和版本号。例如，上面的值为Apache/2.2.14(Unix)

### 范例 ： 输出 CGI 的环境变量

```sh
#!/usr/bin/perl
=pod
  file: printenv.cgi
  author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
  Copyright © 2015-2065 www.ddkk.com. All rights reserved.
=cut
print "Content-type:text/html\r\n\r\n";
print '<html>';
print '<head>';
print '<meta charset="utf-8">';
print '<title>环境变量 | DDKK.COM 弟弟快看，程序员编程资料站，DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)</title>';
print '</head>';
print '<body>';
print "<h1>环境变量：</h1>\n";
print "<pre><code>";
foreach (sort keys %ENV)
{
  print "$_</b>: $ENV{$_}\n";
}
print "</code></pre>";
1;
```

通过浏览器打开 http://localhost:8080/cgi-bin/printenv.cgi 输出结果如下：

## 文件下载

通过设置 Content-Disposition HTTP 头部字段可以实现 Perl CGI 文件下载。

通过设置 Content-Disposition: attachment; filename="helloworld.txt"\r\n\n 可以下把 demo.txt 下载为 helloworld.txt

```sh
#!/usr/bin/perl
=pod
  file: download.cgi
  author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
  Copyright © 2015-2065 www.ddkk.com. All rights reserved.
=cut
# HTTP Header
print "Content-Type:application/octet-stream; name=\"demo.txt\"\r\n";
print "Content-Disposition: attachment; filename=\"demo.txt\"\r\n\n";
# Actual File Content will go hear.
open( FILE, "<demo.txt" );
while(read(FILE, $buffer, 100) )
{
   print("$buffer");
}
```

通过浏览器打开 http://localhost:8080/cgi-bin/download.cgi 输出结果如下：

## Perl CGI 使用 GET 方法传输数据

GET方法发送编码后的用户信息到服务端，数据信息包含在请求页面的 URL 上，以问号 ? 分割。

### GET 请求语法如下：

```sh
http://localhost:8080/cgi-bin/get.cgi?greeting=www.ddkk.com
```

### GET 请求的说明：

- GET 请求可被缓存
- GET 请求保留在浏览器历史记录中
- GET 请求可被收藏为书签
- GET 请求不应在处理敏感数据时使用
- GET 请求有长度限制
- GET 请求只应当用于取回数据

### 范例 ： 简单的 GET 请求

下面是一个简单的 URL，使用 GET 方法向 get.cgi 程序发送两个参数：

```sh
/cgi-bin/get.cgi?name=DDKK.COM 弟弟快看，程序员编程资料站&url=https://www.ddkk.com
```

get.cgi 代码如下

```sh
#!/usr/bin/perl
=pod
  file: download.cgi
  author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
  Copyright © 2015-2065 www.ddkk.com. All rights reserved.
=cut
local ($buffer, @pairs, $pair, $name, $value, %FORM);
# 读取文本信息
$ENV{'REQUEST_METHOD'} =~ tr/a-z/A-Z/;
if ($ENV{'REQUEST_METHOD'} eq "GET")
{
   $buffer = $ENV{'QUERY_STRING'};
}
# 读取 name/value 对信息
@pairs = split(/&/, $buffer);
foreach $pair (@pairs)
{
   ($name, $value) = split(/=/, $pair);
   $value =~ tr/+/ /;
   $value =~ s/%(..)/pack("C", hex($1))/eg;
   $FORM{$name} = $value;
}
$name = $FORM{name};
$url  = $FORM{url};
print "Content-type:text/html\r\n\r\n";
print "<html>";
print "<head>";
print '<meta charset="utf-8">';
print '<title>GET 请求 | DDKK.COM 弟弟快看，程序员编程资料站，DDKK.COM 弟弟快看，程序员编程资料站(ddkk.cn)</title>';
print "</head>";
print "<body>";
print "<h2>$name 网址：$url </h2>";
print "</body>";
print "</html>";
1;
```

通过浏览器打开 http://localhost:8080/cgi-bin/get.cgi?name=DDKK.COM 弟弟快看，程序员编程资料站&url=https://www.ddkk.com 输出结果如下：

### 范例 ： 使用 GET 方法提交表单

下面的范例是通过 HTML 的表单使用 GET 方法向服务器 get.cgi 发送两个数据

#### form_get.html

```sh
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>GET 表单 | DDKK.COM 弟弟快看，程序员编程资料站，DDKK.COM 弟弟快看，程序员编程资料站(ddkk.cn)</title>
</head>
<body>
<form action="/cgi-bin/test.cgi" method="get">
站点名称: <input type="text" name="name">  <br />
站点 URL: <input type="text" name="url" />
<input type="submit" value="提交" />
</form>
</body>
</html>
```

通过浏览器打开 http://localhost:8080/form_get.html 输出结果如下：

提交表单后输出结果如下

## Perl CGI 使用 POST 方法传递数据

使用POST 方法向服务器传递数据是更安全可靠的，像一些敏感信息如用户密码等需要使用 POST传输数据。

我们先制作一个 POST 表单，命名为 get_post.html

```sh
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title> POST 传递参数 |DDKK.COM 弟弟快看，程序员编程资料站(ddkk.cn)</title>
</head>
<body>
<form action="/cgi-bin/post.cgi" method="post">
站点名称: <input type="text" name="name">  <br />
站点 URL: <input type="text" name="url" />
<input type="submit" value="提交" />
</form>
</body>
</html>
```

然后写一个 post.cgi 来接收 POST 传递过来的参数

```sh
#!/usr/bin/perl
=pod
  file: download.cgi
  author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
  Copyright © 2015-2065 www.ddkk.com. All rights reserved.
=cut
local ($buffer, @pairs, $pair, $name, $value, %FORM);
# 读取文本信息
$ENV{'REQUEST_METHOD'} =~ tr/a-z/A-Z/;
if ($ENV{'REQUEST_METHOD'} eq "POST")
{
   read(STDIN, $buffer, $ENV{'CONTENT_LENGTH'});
}else {
   $buffer = $ENV{'QUERY_STRING'};
}
# 读取 name/value 对信息
@pairs = split(/&/, $buffer);
foreach $pair (@pairs)
{
   ($name, $value) = split(/=/, $pair);
   $value =~ tr/+/ /;
   $value =~ s/%(..)/pack("C", hex($1))/eg;
   $FORM{$name} = $value;
}
$name = $FORM{name};
$url  = $FORM{url};
print "Content-type:text/html\r\n\r\n";
print "<html>";
print "<head>";
print '<meta charset="utf-8">';
print '<title>DDKK.COM 弟弟快看，程序员编程资料站(ddkk.cn)</title>';
print "</head>";
print "<body>";
print "<h2>$name网址：$url</h2>";
print "</body>";
print "</html>";
1;
```

通过浏览器打开 http://localhost:8080/get_post.html 输出结果如下：

输入数据，点击提交按钮，浏览器输出结果如下：

## 通过 CGI 程序传递下拉数据

dropdown.html 文件的 HTML 代码如下：

```sh
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title> 下拉列表 |DDKK.COM 弟弟快看，程序员编程资料站(ddkk.cn)</title>
</head>
<body>
<form action="/cgi-bin/get_dropdown.cgi" method="post" target="_blank">
<select name="dropdown">
<option value="DDKK.COM 弟弟快看，程序员编程资料站" selected>DDKK.COM 弟弟快看，程序员编程资料站</option>
<option value="google">Google</option>
</select>
<input type="submit" value="提交"/>
</form>
</body>
</html>
```

get_dropdown.cgi 脚本代码如下

```sh
#!/usr/bin/perl
=pod
  file: setcookie.cgi
  author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
  Copyright © 2015-2065 www.ddkk.com. All rights reserved.
=cut
local ($buffer, @pairs, $pair, $name, $value, %FORM);
# 读取信息
$ENV{'REQUEST_METHOD'} =~ tr/a-z/A-Z/;
if ($ENV{'REQUEST_METHOD'} eq "POST")
{
   read(STDIN, $buffer, $ENV{'CONTENT_LENGTH'});
}else {
   $buffer = $ENV{'QUERY_STRING'};
}
# 读取 name/value 对信息
@pairs = split(/&/, $buffer);
foreach $pair (@pairs)
{
   ($name, $value) = split(/=/, $pair);
   $value =~ tr/+/ /;
   $value =~ s/%(..)/pack("C", hex($1))/eg;
   $FORM{$name} = $value;
}
$site = $FORM{dropdown};
print "Content-type:text/html\r\n\r\n";
print "<html>";
print "<head>";
print '<meta charset="utf-8">';
print '<title>DDKK.COM 弟弟快看，程序员编程资料站(ddkk.cn)</title>';
print "</head>";
print "<body>";
print "<h2>选择的网站是：$site</h2>";
print "</body>";
print "</html>";
1;
```

通过浏览器打开 http://localhost:8080/dropdown.html 输出结果如下：

点击提交按钮，页面输出如下

## CGI 中使用 Cookie

在HTTP 协议一个很大的缺点就是不对用户身份的进行判断，这样给编程人员带来很大的不便， 而 Cookie 功能的出现弥补了这个不足。

Cookie 就是在客户访问脚本的同时，通过客户的浏览器，在客户硬盘上写入纪录数据 ，当下次客户访问脚本时取回数据信息，从而达到身份判别的功能，cookie 常用在身份校验中。

### cookie的语法

HTTP Cookie 的发送是通过 HTTP 头部来实现的，他早于文件的传递，头部 set-cookie 的语法如下：

```sh
Set-cookie:name=name;expires=date;path=path;domain=domain;secure
```

- **name=name:** 需要设置cookie的值(name不能使用" **;** "和" **,** "号),有多个name值时用 " **;** " 分隔，例如： **name1=name1;name2=name2;name3=name3** 。
- **expires=date:** cookie的有效期限,格式： expires="Wdy,DD-Mon-YYYY HH:MM:SS"
- **path=path:** 设置cookie支持的路径,如果path是一个路径，则cookie对这个目录下的所有文件及子目录生效，例如： path="/cgi-bin/"，如果path是一个文件，则cookie指对这个文件生效，例如：path="/cgi-bin/cookie.cgi"。
- **domain=domain:** 对cookie生效的域名，例如：domain="www.ddkk.com"
- **secure:** 如果给出此标志，表示cookie只能通过SSL协议的https服务器来传递。
- cookie 的接收是通过设置环境变量 HTTP_COOKIE 来实现的，CGI 程序可以通过检索该变量获取 cookie 信息

## Cookie 设置

Cookie 的设置非常简单，cookie 会在 HTTP 头部单独发送。

下面的范例中设置了 UserID 和 Password 两个 Cookie

```sh
#!/usr/bin/perl
=pod
  file: setcookie.cgi
  author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
  Copyright © 2015-2065 www.ddkk.com. All rights reserved.
=cut
print "Set-Cookie:UserID=123;\n";
print "Set-Cookie:Password=123456;Expires=Tuesday, 31-Dec-2018 23:12:40 GMT;Domain=localhost;Path=/cgi-bin;\n";
print "Content-type:text/html\r\n\r\n";
print '<html>';
print '<head>';
print '<meta charset="utf-8">';
print '<title>设置 Cookie | DDKK.COM 弟弟快看，程序员编程资料站，DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)</title>';
print '</head>';
print '<body>';
print '<h2>Hello Word! </h2>';
print '<p>DDKK.COM 弟弟快看，程序员编程资料站，DDKK.COM 弟弟快看，程序员编程资料站!</p>';
print '<p>这个脚本用来设置 Cookie</p>';
print '</body>';
print '</html>';
```

通过浏览器打开 http://localhost:8080/cgi-bin/setcookie.cgi 输出结果如下：

### 查找 Cookie

检索Cookie 信息非常简单。

Cookie 信息存储在 CGI 的环境变量 HTTP_COOKIE 中，存储格式如下：

```sh
UserID=123; Password=123456
```

可以使用以下代码来显示我们刚刚设置的 Cookie

```sh
#!/usr/bin/perl
=pod
  file: mail.pl
  author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
  Copyright © 2015-2065 www.ddkk.com. All rights reserved.
=cut
$rcvd_cookies = $ENV{'HTTP_COOKIE'};
@cookies = split /;/, $rcvd_cookies;
foreach $cookie ( @cookies ){
   ($key, $val) = split(/=/, $cookie); # splits on the first =.
   $key =~ s/^\s+//;
   $val =~ s/^\s+//;
   $key =~ s/\s+$//;
   $val =~ s/\s+$//;
   if( $key eq "UserID" ){
      $user_id = $val;
   }elsif($key eq "Password"){
      $password = $val;
   }
}
print "Content-type:text/html\r\n\r\n";
print '<html>';
print '<head>';
print '<meta charset="utf-8">';
print '<title>设置 Cookie | DDKK.COM 弟弟快看，程序员编程资料站，DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)</title>';
print '</head>';
print '<body>';
print '<h2>Hello Word! </h2>';
print '<p>DDKK.COM 弟弟快看，程序员编程资料站，DDKK.COM 弟弟快看，程序员编程资料站!</p>';
print '<p>这个脚本用来显示 Cookie</p>';
print '<p>';
print "User ID  = $user_id<br/>";
print "Password = $password<br/>";
print '</p>';
print '</body>';
print '</html>';
```

通过浏览器打开 http://localhost:8080/cgi-bin/getcookie.cgi 输出结果如下：

## CGI 模块

Perl 提供了很多内置的 CGI 模块，常用以下两个：

- [CGI 模块](http://search.cpan.org/src/LDS/CGI.pm-3.25/cgi_docs.html)
- [Berkeley cgi-lib.pl](http://cgi-lib.berkeley.edu/)
