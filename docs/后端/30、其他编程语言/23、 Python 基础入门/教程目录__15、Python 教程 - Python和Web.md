# 15、Python 教程 - Python和Web
- 来源：https://ddkk.com/zhuanlan/other/python/6/15.html
- 分类：Python 基础入门
- 分组：教程目录
本章讨论Python Web编程的一些方面。

三个重要的主题：**屏幕抓取、CGI和mod_python**。

## 屏幕抓取

屏幕抓取是通过程序下载网页并从中提取信息的过程。

**下载数据并对其进行分析**。

**从Python Job Board（http://python.org/jobs）提取招聘单位的名称和网站。**

```java
from urllib.request import urlopen
import re
p = re.compile('<a href="(/jobs/\\d+)/">(.*?)</a>')
text = urlopen('http://python.org/jobs').read().decode()
for url,name in p.findall(text):
    print('{}({})'.format(name,url))#结果为：
'''
PhD Position in Computer Simulation & Machine Learning(/jobs/6173)
Data Engineering Senior Lead(/jobs/6172)
Python Systems / Infrastructure Engineer(/jobs/6171)
Django Backend Engineer(/jobs/6170)
Senior Full Stack Engineer(/jobs/6169)
Head of Software Engineering - Python (Python Stack/ Django / FinTech / Google Cloud) – Johannesburg(/jobs/6168)
Senior Software Engineer (Remote)(/jobs/6166)
(Senior) Software Engineer (80-100%, f::m::d)(/jobs/6164)
Senior Backend Developer (Python)(/jobs/6163)
Python/GoLang Developer (Web Scraping)(/jobs/6161)
Scientific Software Developer(/jobs/6160)
Sr. Developer for Python, Django(/jobs/6159)
Data Scientist(/jobs/6156)
Data Scientist (Delivery)(/jobs/6155)
Backend Software Engineer(/jobs/6152)
Senior Python Developer (remote)(/jobs/6151)
REMOTE PYTHON/REACT JOBS(/jobs/6150)
Remote Python Developer(/jobs/6149)
Senior Python Developer(/jobs/6148)
Data Engineer(/jobs/6147)
Distinguished Machine Learning Engineer(/jobs/6146)
Senior Python Engineer(/jobs/6145)
Full Stack Software Engineer(/jobs/6144)
Open Source Engineering Manager(/jobs/6143)
Senior Python Engineer(/jobs/6142)
'''
```

### Tidy和XHTML解析

**1，Tidy是什么？**

Tidy是用于对格式不正确且不严谨的HTML进行修复的工具。

Tidy并不能修复HTML文件存在的所有问题，但确实能够确保文件是格式良好的（即所有元素都嵌套正确）

**2，获取Tidy**

找出可供使用的包装器： `pip search tidy`

安装PyTidyLib：`pip install pytidylib`

**3，为何使用XHTML**

XHTML和旧式HTML的主要区别在于，XHTML非常严格，要求显式地结束所有的元素。

在HTML中，可通过（使用标签``）开始另一个段落来结束当前段落，但在XHTML中，必须先（使用标签`
`）显式地结束当前段落。

XHTML是一种XML方言，可使用各种出色的工具（如XPath）来处理。

要对Tidy生成的格式良好的XHTML进行解析，一种非常简单的方式是使用标准库模块html.parser中的HTMLParser类。

**4，使用HTMLParser**

使用HTMLParser意味着继承它，并重写各种事件处理方法。

**HTMLParser中的回调方法**

回调方法
何时被调用

handle_starttag(tag, attrs)
遇到开始标签时调用。attrs是一个由形如(name, value)的元组组成的序列

handle_startendtag(tag, attrs)
遇到空标签时调用。默认分别处理开始标签和结束标签

handle_endtag(tag)
遇到结束标签时调用

handle_data(data)
遇到文本数据时调用

handle_charref(ref)
遇到形如&#ref;的字符引用时调用

handle_entityref(name)
遇到形如&name;的实体引用时调用

handle_comment(data)
遇到注释时；只对注释内容调用

handle_decl(decl)
遇到形如的声明时调用

handle_pi(data)
用于处理指令

unknown_decl(data)
遇到未知声明时调用

**使用模块HTMLParser的屏幕抓取程序**

```java
from urllib.request import urlopen 
from html.parser import HTMLParser
def isjob(url):
    try:
        a, b, c, d = url.split('/')
    except ValueError:
        return False
    return a == d == '' and b == 'jobs' and c.isdigit()
class Scraper(HTMLParser):
    in_link = False使用了一个布尔状态变量（属性）来跟踪是否位于相关的链接中
    def handle_starttag(self, tag, attrs):handle_starttag的参数是一个由形如(key, value)的元组组成的列表
        attrs = dict(attrs)因此使用dict将它们转换为字典，以便管理
        url = attrs.get('href', '')
        if tag == 'a' and isjob(url):
            self.url = url
            self.in_link = True
            self.chunks = []
    def handle_data(self, data):
        if self.in_link:
            self.chunks.append(data)
    def handle_endtag(self, tag):
        if tag == 'a' and self.in_link:
            print('{} ({})'.format(''.join(self.chunks), self.url))为了（在方法handle_endtag中）输出结果，将所有的文本块合并在一起。
            self.in_link = False
text = urlopen('http://python.org/jobs').read().decode() 
parser = Scraper() 
parser.feed(text)为运行这个解析器，调用其方法feed将并text作为参数
parser.close()然后调用其方法close。
'''
PhD Position in Computer Simulation & Machine Learning (/jobs/6173/)
Data Engineering Senior Lead (/jobs/6172/)
Python Systems / Infrastructure Engineer (/jobs/6171/)
Django Backend Engineer (/jobs/6170/)
Senior Full Stack Engineer (/jobs/6169/)
Head of Software Engineering - Python (Python Stack/ Django / FinTech / Google Cloud) – Johannesburg (/jobs/6168/)
Senior Software Engineer (Remote) (/jobs/6166/)
(Senior) Software Engineer (80-100%, f::m::d) (/jobs/6164/)
Senior Backend Developer (Python) (/jobs/6163/)
Python/GoLang Developer (Web Scraping) (/jobs/6161/)
Scientific Software Developer (/jobs/6160/)
Sr. Developer for Python, Django (/jobs/6159/)
Data Scientist (/jobs/6156/)
Data Scientist (Delivery) (/jobs/6155/)
Backend Software Engineer (/jobs/6152/)
Senior Python Developer (remote) (/jobs/6151/)
REMOTE PYTHON/REACT JOBS (/jobs/6150/)
Remote Python Developer (/jobs/6149/)
Senior Python Developer (/jobs/6148/)
Data Engineer (/jobs/6147/)
Distinguished Machine Learning Engineer (/jobs/6146/)
Senior Python Engineer (/jobs/6145/)
Full Stack Software Engineer (/jobs/6144/)
Open Source Engineering Manager (/jobs/6143/)
Senior Python Engineer (/jobs/6142/)
'''
```

### Beautiful Soup

Beautiful Soup是一个小巧而出色的模块，用于解析你在Web上可能遇到的不严谨且格式糟糕的HTML。

下载并安装Beautiful Soup：`pip install beautifulsoup4`

**使用Beautiful Soup的屏幕抓取程序**

```java
from urllib.request import urlopen 
from bs4 import BeautifulSoup
text = urlopen('http://python.org/jobs').read() 
soup = BeautifulSoup(text, 'html.parser')
jobs = set() 
for job in soup.body.section('h2'):使用soup.body来获取文档体，再访问其中的第一个section。 使用参数'h2'调用返回的对象。
    jobs.add('{} ({})'.format(job.a.string, job.a['href']))属性string是链接的文本内容，而a['href']为属性href。
print('\n'.join(sorted(jobs, key=str.lower)))
'''
(Senior) Software Engineer (80-100%, f::m::d) (/jobs/6164/)
Backend Software Engineer (/jobs/6152/)
Data Engineer (/jobs/6147/)
Data Engineering Senior Lead (/jobs/6172/)
Data Scientist (/jobs/6156/)
Data Scientist (Delivery) (/jobs/6155/)
Distinguished Machine Learning Engineer (/jobs/6146/)
Django Backend Engineer (/jobs/6170/)
Full Stack Software Engineer (/jobs/6144/)
Head of Software Engineering - Python (Python Stack/ Django / FinTech / Google Cloud) – Johannesburg (/jobs/6168/)
Open Source Engineering Manager (/jobs/6143/)
PhD Position in Computer Simulation & Machine Learning (/jobs/6173/)
Python Systems / Infrastructure Engineer (/jobs/6171/)
Python/GoLang Developer (Web Scraping) (/jobs/6161/)
Remote Python Developer (/jobs/6149/)
REMOTE PYTHON/REACT JOBS (/jobs/6150/)
Scientific Software Developer (/jobs/6160/)
Senior Backend Developer (Python) (/jobs/6163/)
Senior Full Stack Engineer (/jobs/6169/)
Senior Python Developer (/jobs/6148/)
Senior Python Developer (remote) (/jobs/6151/)
Senior Python Engineer (/jobs/6142/)
Senior Python Engineer (/jobs/6145/)
Senior Software Engineer (Remote) (/jobs/6166/)
Sr. Developer for Python, Django (/jobs/6159/)
'''
```

## 使用CGI创建动态网页

通用网关接口（CGI）

CGI是一种标准机制，Web服务器可通过它将（通常是通过Web表达提供的）查询交给专用程序，并以网页的方式显示查询结果。

要让CGI脚本能够通过Web进行访问（和运行），必须将其放在Web服务器能够访问的地方、添加!#行并设置合适的文件权限。

对于重要的Web应用，大多数人都不会直接为其编写CGI脚本，而是选择使用Web框架，因为它会替你完成很多繁重的工作。

**Python Web应用框架**

名称
网站

Django
https://djangoproject.com

TurboGears
http://turbogears.org

web2py
http://web2py.com

Grok
https://pypi.python.org/pypi/grok

Zope2
https://pypi.python.org/pypi/Zope2

Pyramid
https://trypyramid.com

Flask
http://flask.pocoo.org

## Web服务：更高级的抓取

鉴于实现Web服务的方式众多（且涉及大量的协议），同时每个Web服务系统都可能提供多种服务，因此有时必须以客户端能够自动解读的方式描述服务，这被称为`元服务`。

有关这种描述的标准是Web服务描述语言（WSDL）。

WSDL是一种XML格式，描述了通过服务可使用哪些方法以及这些方法的参数和返回值等方面。

除支持SOAP等服务协议外，很多乃至大部分Web服务工具包都支持WSDL。

### RSS和相关内容

RSS指的是富网站摘要（Rich Site Summary）、RDF网站摘要（RDF Site Summary）或简易信息聚合（Really Simple Syndication），具体指哪个取决于版本。

在最简单的情况下，RSS是一种以XML方式列出新闻的格式。

### 使用XML—RPC进行远程过程调用

除简单的RSS下载和解析机制外，还有远程过程调用。远程过程调用是对基本网络交互的抽象：客户端程序请求服务器程序执行计算并返回结果，但这个过程被伪装成简单的过程（函数或方法）调用。

在客户端代码中，远程过程调用看起来就像普通方法调用，但用来调用方法的对象实际上位于另一台计算机中。

XML-RPC可能是最简单的远程过程调用机制，它使用HTTP和XML来实现网络通信。

### SOAP

SOAP也是一种将XML和HTTP用作底层技术的消息交换协议。

与XML-RPC一样，SOAP也支持远程过程调用，但SOAP规范比XML-RPC规范复杂得多。

SOAP是异步的，支持有关路由的元请求，而且类型系统非常复杂（而XML-RPC使用简单而固定的类型集）。

## 小结

概念
解释

屏幕抓取
指的是自动下载网页并从中提取信息。程序Tidy及其库版本是很有用的工具，可用来修复格式糟糕的HTML，然后使用HTTML解析器进行解析。另一种抓取方式是使用Beautiful Soup，即便面对混乱的输入，它也可以处理。

CGI
通用网关接口是一种创建动态网页的方式，这是通过让Web服务器运行、与客户端程序通信并显示结果而实现的。模块cgi和cgitb可用于编写CGI脚本。CGI脚本通常是在HTML表单中调用的。

Flask
一个简单的Web框架，让你能够将代码作为Web应用发布，同时不用过多操心Web部分。

Web应用框架
要使用Python开发复杂的大型Web应用，Web应用框架必不可少。对简单的项目来说，Flask是不错的选择；但对于较大的项目，你可能应考虑使用Django或TurboGears。

Web服务
Web服务之于程序犹如网页之于用户。可以认为，Web服务让你能够以更抽象的方式进行网络编程。常用的Web服务标准包括RSS（以及与之类似的RDF和Atom）、XML-RPC和SOAP。

### 本章介绍的新函数

函数
描述

cgitb.enable()
在CGI脚本中启用栈跟踪
