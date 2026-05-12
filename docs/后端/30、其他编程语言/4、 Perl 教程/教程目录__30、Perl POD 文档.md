# 30、Perl POD 文档
- 来源：https://ddkk.com/zhuanlan/other/perl/30.html
- 分类：Perl 教程
- 分组：教程目录
POD英文全称（Plain Old Documentation） 是一种简单而易用的标记型语言(置标语言)

### POD 语法格式

```sh
=head1
[your_content_here]
=cut
```

**1、** POD文档以**=head1**开始；

2、** POD文档以=cut**结束；

3、** 而且在=head1**前与**=cut**后需要添加一空行；

### POD 范例

```sh
=head1
我是POD，我爱DDKK.COM 弟弟快看，程序员编程资料站
=cut
```

## Perl 与 POD 关系

Perl 中可以在模块或脚本中嵌入 POD 文档，而且Perl 会忽略 POD 中的文档

Perl 与 POD 的这种关系，可以用 POD 写 Perl 的注释，也就是说 POD 是 Perl 注释的一种格式

### 范例

```sh
#!/usr/bin/perl
print "你好，世界\n";
=head1 Hello, World 范例
这是一个 Perl 的简单范例。
=cut
print "你好，DDKK.COM 弟弟快看，程序员编程资料站\n";
```

运行范例 »

运行结果为：

```sh
你好，世界
你好，DDKK.COM 弟弟快看，程序员编程资料站
```

## __END__ 与 __DATA__

我们看到 Perl 会主动忽略 POD 文档。

当然，我们还可以使用 **END** 或 **DATA** 将所在行之后的内容全部 **注释** 掉

```sh
#!/usr/bin/perl
print "你好，世界\n";
while(<DATA>){
  print $_;
}
__END__
=head1 输出DDKK.COM 弟弟快看，程序员编程资料站 范例
这是一个 Perl 的简单范例
print "你好，DDKK.COM 弟弟快看，程序员编程资料站\n";
```

运行范例 »

运行结果为:

```sh
你好，世界
=head1 输出DDKK.COM 弟弟快看，程序员编程资料站 范例
这是一个 Perl 的简单范例
print "你好，DDKK.COM 弟弟快看，程序员编程资料站\n";
```

如果只有 **END** 没有 **DATA**, 那么 Perl 也不会读取 POD 文档

```sh
#!/usr/bin/perl
print "你好，世界\n";
__END__
=head1 输出DDKK.COM 弟弟快看，程序员编程资料站 范例
这是一个 Perl 的简单范例
print "你好，DDKK.COM 弟弟快看，程序员编程资料站\n";
```

运行范例 »

运行结果

```sh
你好，世界
```

## 什么是 POD？

Pod(Plain Old Documentation), 是一种简单而易用的标记型语言（置标语言）

它经常用来书写 perl 程序和模块中的文档

Pod的 转化器可以将 Pod 转换成很多种格式，例如 text, html, man 等

### POD 基本类型

Pod标记语言包含三种基本基本类型： 普通、原文、命令

- **普通段落** : 可以在普通段落中使用格式化代码，如黑体，斜体，下划线等
- **原文段落** : 用于代码块或者其他不需要转换器处理的部分，而且不需要段落重排
- **命令段落** : 命令段落作用于整个的文档，通常用于标题设置或列表标记

所有的命令段落（只有一行的长度）使用 =\ 开始，紧接着是一个标识符。随后的文本将被这条命令所影响。

#### 现在广泛使用的命令有

```sh
=pod (开始文档)
=head1 标题文本
=head2 标题文本
=head3 标题文本
=head4 标题文本
=over 缩进空格数量
=item 前缀
=back (结束列表)
=begin 文档格式
=end 结束文档格式
=for 格式文本
=encoding 编码类型
=cut (文档结束)
```

可以使用 Perl 的命令行工具 pod2html 将 pod 转换成 html 文档

```sh
$ pod2html  [your_pod_doc_name].pod  > [name_to_html].html
```

假设我们有一个 POD 文档 hello_world.pod 内容如下

```sh
=begin html
=encoding utf-8
=head1 DDKK.COM 弟弟快看，程序员编程资料站
=cut
```

使用以下 pod2html 格式转换

```sh
$ pod2html hello_world.pod > hello_world.html
```

用文本打开 hello_world.html 内容如下

```sh
<?xml version="1.0" ?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
<title></title>
<meta http-equiv="content-type" content="text/html; charset=utf-8" />
<Linkrev="made" href="mailto:_netbios@osx320.apple.com" />
</head>
<body style="background-color: white">
<ul id="index">
  <li><a href="#pod">DDKK.COM 弟弟快看，程序员编程资料站</a></li>
</ul>
<h1 id="pod">DDKK.COM 弟弟快看，程序员编程资料站</h1>
</body>
</html>
```

在浏览器中打开 hello_world.html，显示如图

### 如果我们直接在 POD 中写 HTML

创建一个 hello_world_1.pod 内容如下

```sh
=begin html
=encoding utf-8
<h1>DDKK.COM 弟弟快看，程序员编程资料站</h1>
<p> www.ddkk.com </p>
=end html
```

使用以下 pod2html 格式转换成 HTML

```sh
$ pod2html hello_world_1.pod > hello_world_1.html
```

用文本打开 hello_world_1.html 内容如下

```sh
<?xml version="1.0" ?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
<title></title>
<meta http-equiv="content-type" content="text/html; charset=utf-8" />
<Linkrev="made" href="mailto:_netbios@osx320.apple.com" />
</head>
<body style="background-color: white">
<h1>DDKK.COM 弟弟快看，程序员编程资料站</h1>
<p> www.ddkk.com </p>
</body>
</html>
```

在浏览器中打开 hello_world_.html，显示如图
