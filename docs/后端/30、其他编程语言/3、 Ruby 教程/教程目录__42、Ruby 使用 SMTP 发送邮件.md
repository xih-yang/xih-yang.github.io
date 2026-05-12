# 42、Ruby 使用 SMTP 发送邮件
- 来源：https://ddkk.com/zhuanlan/other/ruby/42.html
- 分类：Ruby 教程
- 分组：教程目录
SMTP（Simple Mail Transfer Protocol）即简单邮件传输协议,它是一组用于由源地址到目的地址传送邮件的规则，由它来控制信件的中转方式

Ruby提供了 Net::SMTP 来发送邮件，并提供了两个方法 new 和 start:

**new** 方法有两个参数：

- *server name* 默认为 localhost
- *port number* 默认为 25

**start** 方法有以下参数：

- *server* SMTP 服务器 IP, 默认为 localhost
- *port* 端口号，默认为 25
- *domain* 邮件发送者域名，默认为 ENV["HOSTNAME"]
- *account* 用户名，默认为 nil
- *password* 用户密码，默认为nil
- *authtype* 验证类型，默认为 *cram_md5*

SMTP 对象实例化方法调用了 sendmail, 参数如下：

- *source* 一个字符串或数组或每个迭代器在任一时间中返回的任何东西。
- *sender* 一个字符串，出现在 email 的表单字段。
- *recipients* 一个字符串或字符串数组，表示收件人的地址。

### 范例

#### main.rb

```ruby
require 'net/smtp'
message = <<MESSAGE_END
From: Simple Developer <services@ddkk.cn>
To: A Test User <test@ddkk.cn>
Subject: SMTP e-mail test
This is a test e-mail message.
MESSAGE_END
Net::SMTP.start('localhost') do |smtp|
  smtp.send_message message, 'services@ddkk.cn', 
                             'test@ddkk.cn'
end
```

> 注意： 可以指定多个发送的地址，但需要使用逗号隔开

上面的代码，我们设置了一个基本的电子邮件消息，注意正确的标题格式。

一个电子邮件要 From，To和Subject，文本内容与头部信息间需要一个空行。

使用 **Net::SMTP** 连接到本地机器上的 *SMTP* 服务器，使用 send_message 方法来发送邮件，方法参数为发送者邮件与接收者邮件。

如果本机没有 SMTP 服务器，可以使用 Net::SMTP 与远程 SMTP 服务器进行通信。 也可以使用网络邮件服务（如 exmail.qq.com 或 mail.163.com），电子邮件提供者会提供发送邮件服务器的详细信息

```ruby
Net::SMTP.start('mail.your-domain.com')
```

以上代码将连接主机为 mail.your-domain.com，端口号为 25的邮件服务器 如果需要填写用户名密码，则代码如下：

```ruby
Net::SMTP.start('mail.your-domain.com', 25, 'localhost', 'username', 'password', :plain)
```

上面的代码使用了指定的用户名密码连接到主机为 mail.your-domain.com，端口号为 25的邮件服务器

## 使用 Ruby 发送 HTML 邮件

Net::SMTP 同样提供了支持发送 HTML 格式的邮件

可以通过设置 MIME 版本，文档类型，字符集来发送 HTML 格式的邮件

#### main.rb

```ruby
require 'net/smtp'
message = <<MESSAGE_END
From: Simple Developer <services@ddkk.cn>
To: A Test User <test@ddkk.cn>
MIME-Version: 1.0
Content-type: text/html
Subject: SMTP e-mail test
This is an e-mail message to be sent in HTML format
<b>This is HTML message.</b>
<h1>This is headline.</h1>
MESSAGE_END
Net::SMTP.start('localhost') do |smtp|
  smtp.send_message message, 'services@ddkk.cn', 
                             'test@ddkk.cn'
end
```

## 发送带附件的邮件

如果需要发送带附件的的电子邮件，需要设置 Content-type 为 multipart/mixed

附件在传输前需要使用 **pack("m")** 函数将其内容转为 base64 格式

下面的范例将发送附件为 /tmp/test.txt 的邮件

#### main.rb

```ruby
require 'net/smtp'
filename = "/tmp/test.txt"
# 读取文件并编码为base64格式
filecontent = File.read(filename)
encodedcontent = [filecontent].pack("m")   # base64
marker = "AUNIQUEMARKER"
body =<<EOF
This is a test email to send an attachement.
EOF
# 定义主要的头部信息
part1 =<<EOF
From: Simple Developer <services@ddkk.cn>
To: A Test User <test@ddkk.cn>
Subject: Sending Attachement
MIME-Version: 1.0
Content-Type: multipart/mixed; boundary=#{marker}
--#{marker}
EOF
# 定义消息动作
part2 =<<EOF
Content-Type: text/plain
Content-Transfer-Encoding:8bit
#{body}
--#{marker}
EOF
# 定义附件部分
part3 =<<EOF
Content-Type: multipart/mixed; name=\"#{filename}\"
Content-Transfer-Encoding:base64
Content-Disposition: attachment; filename="#{filename}"
#{encodedcontent}
--#{marker}--
EOF
mailtext = part1 + part2 + part3
# 发送邮件
begin 
  Net::SMTP.start('localhost') do |smtp|
     smtp.sendmail(mailtext, 'services@ddkk.cn',
                          ['test@ddkk.cn'])
  end
rescue Exception => e  
  print "Exception occured: " + e  
end
```
