# 20、XML 编码
- 来源：https://ddkk.com/zhuanlan/xml/xml/20.html
- 分类：其他语言
- 分组：教程目录
XML文档可以包含非 ASCII 字符，比如挪威语 æ ø å，或者法语 ê è é

为了避免错误，需要规定 XML 编码，或者将 XML 文件存为 Unicode

## XML 编码错误

有时候载入一个 XML 文档，可能会得到两个不同的错误，表示编码问题：

### 在文本内容中发现无效字符

如果我们的 XML 中包含非 ASCII 字符，且文件保存为没有指定编码的单字节 ANSI（或 ASCII），就会得到一个错误

**1、** 单字节编码属性的XML文件；

**2、** 相同的单字节没有编码属性的XML文件；

### 将当前编码切换为不被支持的指定编码

如果我们的 XML 文件保存为带有指定的单字节编码（WINDOWS-1252、ISO-8859-1、UTF-8）的双字节 Unicode（或 UTF-16），会得到一个错误。

如果我们的 XML 文件保存为带有指定的双字节编码（UTF-16）的单字节 ANSI（或 ASCII），也会得到一个错误

**1、** 双字节没有编码的XML文件；

**2、** 相同的双字节具有单字节编码的XML文件；

## Windows 记事本

Windows 记事本默认会将文件保存为单字节的 ANSI ( ASCII )

如果我们选择 "另存为..."，就可以指定 ANSI、UTF-8、Unicode（UTF-16）或 GBK 等编码

将下面的 XML 保存为 ANSI、UTF-8 和 Unicode（注意文档不包含任何编码属性）

```xml
<?xml version="1.0"?><note><from>Jani</from><to>Tove</to><message>Norwegian: æøå. French: êèé</message></note>
```

然后尝试将文件拖到浏览器，并查看结果。不同的浏览器会显示不同的结果

不同编码的体验

```xml
<?xml version="1.0" encoding="us-ascii"?>
<?xml version="1.0" encoding="windows-1252"?>
<?xml version="1.0" encoding="ISO-8859-1"?>
<?xml version="1.0" encoding="UTF-8"?>
<?xml version="1.0" encoding="UTF-16"?>
```

请尝试：

**1、** 带有正确编码的保存；

**2、** 带有错误编码的保存；

## 结论

**1、** 始终使用编码属性；

**2、** 使用支持编码的编辑器；

**3、** 确保你知道编辑器使用什么编码；

**4、** 在编码属性中使用相同的编码；
