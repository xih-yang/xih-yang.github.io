# 05、DTD 属性
- 来源：https://ddkk.com/zhuanlan/xml/dtd/5.html
- 分类：XML语言教程
- 分组：教程目录
在DTD 中，属性通过 ATTLIST 声明来进行声明

## 声明属性语法

```xml
<!ATTLIST 元素名称 属性名称 属性类型 默认值>
```

### DTD 范例:

```xml
<!ATTLIST person tel CDATA "check">
```

### XML 范例:

```xml
<person tel="check" />
```

### 属性类型的选项：

类型
描述

CDATA
值为字符数据 (character data)

(en1|en2|..)
此值是枚举列表中的一个值

ID
值为唯一的 id

IDREF
值为另外一个元素的 id

IDREFS
值为其他 id 的列表

NMTOKEN
值为合法的 XML 名称

NMTOKENS
值为合法的 XML 名称的列表

ENTITY
值是一个实体

ENTITIES
值是一个实体列表

NOTATION
此值是符号的名称

xml:
值是一个预定义的 XML 值

### 默认值参数可使用下列值：

值
解释

值
属性的默认值

#REQUIRED
属性值是必需的

#IMPLIED
属性不是必需的

#FIXED value
属性值是固定的

## 规定一个默认的属性值

### DTD:

```xml
<!ELEMENT point EMPTY>
<!ATTLIST point x CDATA "0.0">
```

### 合法的 XML:

```xml
<point x="100.0" />
```

在上面的例子中，point 被定义为带有 CDATA 类型的 x 属性的空元素。

如果宽度没有被设定，其默认值为 0.0

## #IMPLIED

假如不希望强制作者包含属性，并且您没有默认值选项的话，请使用关键词 #IMPLIED

### 语法

```xml
<!ATTLIST 元素名称 属性名称 属性类型 #IMPLIED>
```

### DTD 范例:

```xml
<!ATTLIST contact tel CDATA #IMPLIED>
```

合法的XML:

```xml
<contact tel="13888888888" />
```

合法的XML:

```xml
<contact />
```

## #REQUIRED

如果没有默认值选项，但是仍然希望强制作者提交属性的话，可以使用关键词 #REQUIRED

### 语法

```xml
<!ATTLIST 元素名称 属性名称 属性类型 #REQUIRED>
```

### DTD 范例:

```xml
<!ATTLIST person tel CDATA #REQUIRED>
```

合法的XML:

```xml
<person tel="13888888888" />
```

非法的XML:

```xml
<person />
```

## #FIXED

如果希望属性拥有固定的值，并不允许作者改变这个值，使用 #FIXED 关键词

如果作者使用了不同的值，XML 解析器会提示出错

### 语法

```xml
<!ATTLIST 元素名称 属性名称 属性类型 #FIXED "value">
```

### DTD 范例:

```xml
<!ATTLIST writer website CDATA #FIXED "DDKK.COM 弟弟快看，程序员编程资料站">
```

合法的XML:

```xml
<writer website="DDKK.COM 弟弟快看，程序员编程资料站" />
```

非法的XML:

```xml
<writer website="ddkk" />
```

## 列举属性值

如果在定义 DTD 时希望属性值为一系列固定的合法值之一，使用列举属性值

### 语法：

```xml
<!ATTLIST 元素名称 属性名称 (en1|en2|..) 默认值>
```

### DTD 范例:

```xml
<!ATTLIST sex type (男|女|未知) "未知">
```

### XML 范例:

```xml
<sex type="男" />
```

或者

```xml
<sex type="未知" />
```
