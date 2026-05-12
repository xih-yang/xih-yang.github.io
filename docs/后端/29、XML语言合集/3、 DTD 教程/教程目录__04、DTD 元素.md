# 04、DTD 元素
- 来源：https://ddkk.com/zhuanlan/xml/dtd/4.html
- 分类：XML语言教程
- 分组：教程目录
在DTD 中，使用 `` 声明元素

## 声明元素的语法

在DTD 中，使用 !ELEMENT 声明元素

```xml
<!ELEMENT 元素名称 类别>
```

或者

```xml
<!ELEMENT 元素名称 (元素内容)>
```

## 空元素

空元素的类别为关键字 EMPTY ：

```xml
<!ELEMENT 元素名称 EMPTY>
```

### DTD 范例

```xml
<!ELEMENT hr EMPTY>
```

### XML 范例：

```xml
<hr />
```

## 声明只有 PCDATA 的元素

通过 (#PCDATA) 声明只有 PCDATA 的元素：

```xml
<!ELEMENT 元素名称 (#PCDATA)>
```

### DTD 范例：

```xml
<!ELEMENT name (#PCDATA)>
```

## 声明带有任何内容的元素

通过类别关键词 ANY 声明的元素，可包含任何可解析数据的组合：

```xml
<!ELEMENT 元素名称 ANY>
```

### DTD 范例：

```xml
<!ELEMENT article ANY>
```

## 声明带有子元素（序列）的元素

带有一个或多个子元素的元素通过圆括号中的子元素名进行声明：

```xml
<!ELEMENT 元素名称 (子元素名称 1)>
```

或者

```xml
<!ELEMENT 元素名称 (子元素名称 1,子元素名称 2,.....)>
```

### 例子：

```xml
<!ELEMENT article (author,created_at,summary,content)>
```

> 当子元素按照由逗号分隔开的序列进行声明时，这些子元素必须按照相同的顺序出现在文档中。 在一个完整的声明中，子元素也必须被声明，同时子元素也可拥有子元素。

article 元素的完整声明是：

```xml
<!ELEMENT article (author,created_at,summary,content)>
<!ELEMENT author      (#PCDATA)>
<!ELEMENT created_at  (#PCDATA)>
<!ELEMENT summary     (#PCDATA)>
<!ELEMENT content     (#PCDATA)>
```

## 声明只出现一次的元素

```xml
<!ELEMENT 元素名称 (子元素名称)>
```

### DTD 范例：

下面的范例声明了：content 子元素必须出现一次，并且必须只在 "article" 元素中出现一次

```xml
<!ELEMENT article (content)>
```

## 声明至少出现一次的元素

```xml
<!ELEMENT 元素名称 (子元素名称+)>
```

### DTD 范例：

下面的范例中的加号声明了：category 子元素必须在 "article" 元素内出现至少一次。

```xml
<!ELEMENT article (category+)>
```

## 声明可出现零次或多次的元素

```xml
<!ELEMENT 元素名称 (子元素名称*)>
```

### DTD 范例：

下面的范例中的星号声明了：子元素 tag 可在 "article" 元素内出现零次或多次。

```xml
<!ELEMENT article (tag*)>
```

## 声明出现零次或一次的元素

```xml
<!ELEMENT 元素名称 (子元素名称?)>
```

### DTD 范例：

下面的范例中的问号声明了：子元素 subtitle 可在 "article" 元素内出现零次或一次。

```xml
<!ELEMENT article (subtitle?)>
```

## 声明多选一类型的内容

### DTD 范例：

```xml
<!ELEMENT article (author,created_at,summary,(content|body))>
```

上面的例子声明了："article" 元素必须包含 "author" 元素、"created_at" 元素、"summary" 元素，以及在 content,body 中二选一的元素

## 声明混合型的内容

### dtd：

```xml
<!ELEMENT article (#PCDATA|updated_at|tag|category)*>
```

上面的例子声明了："article" 元素可包含出现零次或多次的 PCDATA、"updated_at"、"tag"、"category"。
