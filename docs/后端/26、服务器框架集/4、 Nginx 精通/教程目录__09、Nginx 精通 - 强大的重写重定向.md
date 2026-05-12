# 09、Nginx 精通 - 强大的重写重定向
- 来源：https://ddkk.com/zhuanlan/server/nginx/4/9.html
- 分类：服务器框架
- 分组：教程目录
Nginx重写主要目标是基于[PCRE正则表达式](https://blog.csdn.net/qq_27623337/article/details/53292053)改写URI，返回重定向和有条件地选择配置。

**目录**

指令

rewrite

rewrite_log

if

set

break

return

uninitialized_variable_warn

执行规则

## 指令

### rewrite

格式：rewrite regex replacement [flag];

如果指定的正则表达式与请求URI匹配，则URI将按照替换字符串中的指定进行更改。重写指令按照它们在配置文件中出现的顺序依次执行。可以使用标志终止对指令的进一步处理。参数：

reg e x ： 要匹配的P C R E 正则表达式

rep l a c e m e n t ：替换字符串。如果替换字符串以“http://”、“https://”或“s c h e m e ”开头，则处理将停止，重定向将返回到客户端。 替换字符串中以$字符开头有特定意义：

- `$`1,`$`2…`$`9 : 代表regex中从左到右每对()匹配结果。
- `$`& : 与 regexp 相匹配的整个子串
- `$`\ : 位于匹配子串左侧的文本
- `$`’ : 位于匹配子串右侧的文本
- `$``$` : `$`符号本身

flag ：处理标志，有 last | break | redirect | permanent。

- last - 停止处理ngx_http_rewrite_module指令的当前集合，并开始搜索与改变的URI匹配的新位置；
- break - 停止处理当前ngx_http_rewrite_module指令集
- redirect - 返回带有302代码的临时重定向；替换字符串不是以“http://”、“https://”或“`$`scheme”开头
- permanent - 返回一个带有301代码的永久重定向

示例：

```java
location /download/ {
   rewrite ^(/download/.*)/media/(.*)\..*$ $1/mp3/$2.mp3 break;
}
```

如果是http://www.example.com/download/tyl/media/01/aa.abc

rewrite 结果是：http://www.example.com/download/tyl/mp3/01/aa.mp3

### rewrite_log

格式：rewrite_log on | off; 默认off;

启用或禁用在通知级别将处理结果的ngx_http_rewrite_module模块指令记录到error_log中。

启用日志，在调试rewrite处理是否正确很有用。打开后日志如下：

### if

格式：if (condition) { … }

如果条件为true，则执行在大括号中指定的此模块指令，并在If指令中为请求分配配置。if指令中的配置是从以前的配置级别继承的。

示例：

```java
if ($slow) {
    limit_rate 10k;
}
if ($http_user_agent ~ MSIE) {
    rewrite ^(.*)$ /msie/$1 break;
}
if ($http_cookie ~* "id=([^;]+)(?:;|$)") {
    set $id $1;
}
if ($request_method = POST) {
    return 405;
}
if ($invalid_referer) {
    return 403;
}
```

判断规则：

**1、** 单变量名称；如果变量的值是空字符串或“0”，则为false；

**2、** 使用“=”和“！=”运算符将变量与字符串进行比较；

**3、** 使用"~"（区分大小写匹配）和"~*"（不区分大小写的匹配）运算符将变量与正则表达式进行匹配正则表达式可以包含()，这些()可供以后在$1…$9变量中重用负运算符“！~”和“！~*”也可用如果正则表达式包含“｝”或“；”字符，则整个表达式应该用单引号或双引号括起来；

**4、** 使用“-f”和“！-f”运算符检查文件是否存在；

**5、** 使用“-d”和“！-d”运算符检查目录是否存在；

**6、** 使用“-e”和“！-e”运算符检查文件、目录或符号链接是否存在；

**7、** 使用“-x”和“！-x”运算符检查可执行文件；

### set

格式：set $variable value;

设置指定变量的值。该值可以包含文本、变量及其组合。

### break

格式：break

停止处理当前ngx_http_rewrite_module指令集。

如果位置是在"location"指令内，则在该位置继续对请求进行进一步处理。

### return

有三种格式：

return code [text]; #code 不为301, 302, 303, 307, 或308，返回文本

return code URL; #code 为301, 302, 303, 307, 或308，返回URL

return URL;

停止处理并将指定的代码返回给客户端。非标准代码444在不发送响应报头的情况下关闭连接。

响应正文文本和重定向URL可以包含变量。

### uninitialized_variable_warn

格式：uninitialized_variable_warn on | off;默认off

是否在日志中记录有关未初始化变量的警告。

## 执行规则

指令break, if, return, rewrite, and set 执行规则如下：

**1、** 在server级别顺序执行；

**2、** 按以下重复：；

- 按请求URI匹配location ；
- 在所找到的location内按指令顺序执行；
- 如果请求URI被rewrite，则循环继续执行直到正则不匹配，最多不超过10次。

举例：

**1、** 在server级别顺序执行；

```java
server {
    ...
    rewrite ^(/download/.*)/media/(.*)\..*$ $1/mp3/$2.mp3 last;
    rewrite ^(/download/.*)/audio/(.*)\..*$ $1/mp3/$2.ra  last;
    return  403;
    ...
}
```

**2、** 在location级别执行；

```java
location /download/ {
    rewrite ^(/download/.*)/media/(.*)\..*$ $1/mp3/$2.mp3 break;
    rewrite ^(/download/.*)/audio/(.*)\..*$ $1/mp3/$2.ra  break;
    return  403;
}
```

location是匹配“/download/”，例子中替换结果包含“/download/”（$1内容），如果最后不用break代替，nginx将进行10个循环并返回500错误。

这篇文章如果对您有所帮助或者启发的话，帮忙关注或点赞，有问题请评论，必有所复。您的支持是我写作的最大动力！
