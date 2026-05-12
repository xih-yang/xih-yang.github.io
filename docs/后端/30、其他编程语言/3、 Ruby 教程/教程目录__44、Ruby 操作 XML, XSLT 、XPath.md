# 44、Ruby 操作 XML, XSLT 、XPath
- 来源：https://ddkk.com/zhuanlan/other/ruby/44.html
- 分类：Ruby 教程
- 分组：教程目录
XML指可扩展标记语言 (eXtensible Markup Language)

XML是一种用于标记电子文件使其具有结构性的标记语言

XML可以用来标记数据、定义数据类型，是一种允许用户对自己的标记语言进行定义的源语言，它非常适合万维网传输，提供统一的方法来描述和交换独立于应用程序或供应商的结构化数据

更多XML 相关的知识，可以移步通过 XML 基础教程

## XML 解析器结构 和 API

XML的解析器主要有 DOM 和 SAX 两种

**1、** SAX解析器是基于事件处理的，需要从头到尾把XML文档扫描一遍，在扫描的过程中，每次遇到一个语法结构时，就会调用这个特定语法结构的事件处理程序，向应用程序发送一个事件；

**2、** DOM是文档对象模型解析，构建文档的分层语法结构，在内存中建立DOM树，DOM树的节点以对象的形式来标识，文档解析文成以后，文档的整个DOM树都会放在内存中；

## Ruby 语言解析和创建 XML

Ruby 语言可以使用 REXML 库来解析 XML 文档

REXML 库是 Ruby 的一个 XML 工具包，使用纯 Ruby 语言编写的，遵守 XML1.0规范

从Ruby 1.8 开始， Ruby 标准库中已经包含 REXML

REXML 库的加载路径是： rexml/document

### REXML 库的优点

REXML 解析器比其它的解析器有以下优点

**1、** 100%由Ruby编写；

**2、** 可适用于SAX和DOM解析器；

**3、** 它是轻量级的,不到2000行代码；

**4、** 很容易理解的方法和类；

**5、** 基于SAX2API和完整的XPath支持；

**6、** 使用Ruby安装，而无需单独安装；

假设存在 movies.xml 文件，文件内容如下

#### movies.xml

```ruby
<collection shelf="New Arrivals">
<movie title="Enemy Behind">
   <type>War, Thriller</type>
   <format>DVD</format>
   <year>2003</year>
   <rating>PG</rating>
   <stars>10</stars>
   <description>Talk about a US-Japan war</description>
</movie>
<movie title="Transformers">
   <type>Anime, Science Fiction</type>
   <format>DVD</format>
   <year>1989</year>
   <rating>R</rating>
   <stars>8</stars>
   <description>A schientific fiction</description>
</movie>
   <movie title="Trigun">
   <type>Anime, Action</type>
   <format>DVD</format>
   <episodes>4</episodes>
   <rating>PG</rating>
   <stars>10</stars>
   <description>Vash the Stampede!</description>
</movie>
<movie title="Ishtar">
   <type>Comedy</type>
   <format>VHS</format>
   <rating>PG</rating>
   <stars>2</stars>
   <description>Viewable boredom</description>
</movie>
</collection>
```

### DOM 解析器

#### main.rb

```ruby
# !/usr/bin/ruby -w
# -*- encoding:utf-8 -*-
# filename: main.rb
# author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
# Copyright © 2015-2065 www.ddkk.com. All rights reserved.
require 'rexml/document'
include REXML
xmlfile = File.new("movies.xml")
xmldoc = Document.new(xmlfile)
# 获取 root 元素
root = xmldoc.root
puts "Root element : " + root.attributes["shelf"]
# 以下将输出电影标题
xmldoc.elements.each("collection/movie"){ 
   |e| puts "Movie Title : " + e.attributes["title"] 
}
# 以下将输出所有电影类型
xmldoc.elements.each("collection/movie/type") {
   |e| puts "Movie Type : " + e.text 
}
# 以下将输出所有电影描述
xmldoc.elements.each("collection/movie/description") {
   |e| puts "Movie Description : " + e.text 
}
```

运行以上 Ruby 范例，输出结果如下

```ruby
$ ruby main.rb
Root element : New Arrivals
Movie Title : Enemy Behind
Movie Title : Transformers
Movie Title : Trigun
Movie Title : Ishtar
Movie Type : War, Thriller
Movie Type : Anime, Science Fiction
Movie Type : Anime, Action
Movie Type : Comedy
Movie Description : Talk about a US-Japan war
Movie Description : A schientific fiction
Movie Description : Vash the Stampede!
Movie Description : Viewable boredom
SAX-like Parsing:
```

## SAX 解析器

#### main.rb

```ruby
# !/usr/bin/ruby -w
# -*- encoding:utf-8 -*-
# filename: main.rb
# author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
# Copyright © 2015-2065 www.ddkk.com. All rights reserved.
require 'rexml/document'
require 'rexml/streamlistener'
include REXML
class MyListener
  include REXML::StreamListener
  def tag_start(*args)
    puts "tag_start: #{args.map {|x| x.inspect}.join(', ')}"
  end
  def text(data)
    return if data =~ /^\w*$/     # whitespace only
    abbrev = data[0..40] + (data.length > 40 ? "..." : "")
    puts "  text   :   #{abbrev.inspect}"
  end
end
list = MyListener.new
xmlfile = File.new("movies.xml")
Document.parse_stream(xmlfile, list)
```

运行以上范例，输出结果如下

```ruby
$ ruby main.rb 
tag_start: "collection", {"shelf"=>"New Arrivals"}
tag_start: "movie", {"title"=>"Enemy Behind"}
tag_start: "type", {}
  text   :   "War, Thriller"
tag_start: "format", {}
tag_start: "year", {}
tag_start: "rating", {}
tag_start: "stars", {}
tag_start: "description", {}
  text   :   "Talk about a US-Japan war"
tag_start: "movie", {"title"=>"Transformers"}
tag_start: "type", {}
  text   :   "Anime, Science Fiction"
tag_start: "format", {}
tag_start: "year", {}
tag_start: "rating", {}
tag_start: "stars", {}
tag_start: "description", {}
  text   :   "A schientific fiction"
tag_start: "movie", {"title"=>"Trigun"}
tag_start: "type", {}
  text   :   "Anime, Action"
tag_start: "format", {}
tag_start: "episodes", {}
tag_start: "rating", {}
tag_start: "stars", {}
tag_start: "description", {}
  text   :   "Vash the Stampede!"
tag_start: "movie", {"title"=>"Ishtar"}
tag_start: "type", {}
tag_start: "format", {}
tag_start: "rating", {}
tag_start: "stars", {}
tag_start: "description", {}
  text   :   "Viewable boredom"
```

> 不推荐 SAX 解析 XML 小文件

## XPath 和 Ruby

我们还可以使用 XPath 解析 XML

XPath 是一种用于在 XML 文档中查询信息的语言

XPath 即为 XML 路径语言，它是一种用来确定XML（标准通用标记语言的子集）文档中某部分位置的语言 XPath 基于 XML 的树状结构，提供在数据结构树中找寻节点的能力

更多XPath 知识，请移步 XPath 基础教程

Ruby 语言通过 REXML 的 XPath 类支持 XPath，它是基于树的分析

#### main.rb

```ruby
# !/usr/bin/ruby -w
# -*- encoding:utf-8 -*-
# filename: main.rb
# author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
# Copyright © 2015-2065 www.ddkk.com. All rights reserved.
require 'rexml/document'
include REXML
xmlfile = File.new("movies.xml")
xmldoc = Document.new(xmlfile)
# 第一个电影的信息
movie = XPath.first(xmldoc, "//movie")
p movie
# 打印所有电影类型
XPath.each(xmldoc, "//type") { |e| puts e.text }
# 获取所有电影格式的类型，返回数组
names = XPath.match(xmldoc, "//format").map {|x| x.text }
p names
```

运行以上范例，输出结果如下

```ruby
$ ruby main.rb
<movie title='Enemy Behind'> ... </>
War, Thriller
Anime, Science Fiction
Anime, Action
Comedy
["DVD", "DVD", "DVD", "VHS"]
```

## Ruby 和 XSLT

Ruby 语言中中有两个 XSLT 解析器

### 1. Ruby-Sablotron

Ruby-Sablotron 解析器主要是为 Linux 操作系统编写的，它依赖以下库：

**1、** Sablot；

**2、** Iconv；

**3、** Expat；

### 2. XSLT4R

XSLT4R 用于简单的命令行交互，可以被第三方应用程序用来转换 XML 文档

XSLT4R 需要 XMLScan 操作，包含了 XSLT4R 归档， XSLT4R 是一个100%的 Ruby 的模块

这些模块可以使用标准的 Ruby 安装方法（Ruby install.rb）进行安装

#### XSLT4R 语法格式如下：

```ruby
ruby xslt.rb stylesheet.xsl document.xml [arguments]
```

#### main.rb

```ruby
# !/usr/bin/ruby -w
# -*- encoding:utf-8 -*-
# filename: main.rb
# author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
# Copyright © 2015-2065 www.ddkk.com. All rights reserved.
require "xslt"
stylesheet = File.readlines("stylesheet.xsl").to_s
xml_doc = File.readlines("document.xml").to_s
arguments = { 'image_dir' => '/....' }
sheet = XSLT::Stylesheet.new( stylesheet, arguments )
# output to StdOut
sheet.apply( xml_doc )
# output to 'str'
str = ""
sheet.output = [ str ]
sheet.apply( xml_doc )
```

## 延伸阅读

**1、** 完整的REXML解析器,请查看文档[REXML解析器文档](http://www.germane-software.com/software/rexml/)；
