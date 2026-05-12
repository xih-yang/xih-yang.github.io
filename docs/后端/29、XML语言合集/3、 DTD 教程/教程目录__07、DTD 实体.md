# 07、DTD 实体
- 来源：https://ddkk.com/zhuanlan/xml/dtd/7.html
- 分类：XML语言教程
- 分组：教程目录
实体(entites) 用于定义引用普通文本或特殊字符的快捷方式的变量，可在内部或外部进行声明

实体引用是对实体的引用

## 声明一个内部实体

### 语法：

```xml
<!ENTITY 实体名称 "实体的值">
```

### DTD 范例:

```xml
<!ENTITY writer "DDKK.COM 弟弟快看，程序员编程资料站">
<!ENTITY copyright "Copyright ddkk.com.cn">
```

XML范例:

```xml
<author>&writer;&copyright;</author>
```

> 一个实体由三部分构成: 一个和号 (&), 一个实体名称, 以及一个分号 (;)。

## 声明一个外部实体

### 语法：

```xml
<!ENTITY 实体名称 SYSTEM "URI/URL">
```

### DTD 范例:

```xml
<!ENTITY writer SYSTEM "/dtd/entities.dtd">
<!ENTITY copyright SYSTEM "/dtd/entities.dtd">
```

XML范例:

```xml
<author>&writer;&copyright;</author>
```
