# 02、Perl 简介
- 来源：https://ddkk.com/zhuanlan/other/perl/2.html
- 分类：Perl 教程
- 分组：教程目录
Perl 像 C 一样强大，像 awk、sed 等脚本描述语言一样方便

Perl 又名实用报表提取语言， 是 Practical Extraction and Report Language 的缩写

Perl 是 Linux 和 MacOS 系统自身携带的编程语言之一，大量的 Linux 和 MacOS 脚本使用 Perl 来编写。

Perl 经过几十年的发展，目前最新版本是 Perl6

Perl 语言的应用范围很广，除 CGI 以外，Perl 被用于图形编程、系统管理、网络编程、金融、生物以及其他领域。

由于其灵活性，Perl 被称为脚本语言中的瑞士军刀。

## 什么是 Perl？

Perl是由 Larry Wall 设计的，并由他不断更新和维护的编程语言。

Perl具有高级语言（如 C 语言）的强大能力和灵活性。事实上，从今后的学习中可以看到，它的许多特性是从C语言中借用来的。

Perl与脚本语言一样，Perl不需要编译器和链接器来运行代码，我们要做的只是写出程序并告诉 Perl 来运行而已。 这意味着Perl对于小的编程问题的快速解决方案和为大型事件创建原型来测试潜在的解决方案是十分理想的。

Perl提供脚本语言（如 sed 和 awk ）的所有功能，还具有它们所不具备的很多功能。 Perl还支持 sed 到 Perl 及 awk 到 Perl 的翻译器。

## Perl 优点

- 相比 C、Pascal这样的 **高级** 语言而言，Perl语言直接提供泛型变量、动态数组、Hash表等更加便捷的编程元素。
- Perl具有动态语言的强大灵活的特性，并且还从C/C++、Basic、Pascal等语言中分别借鉴了语法规则，从而提供了许多冗余语法。
- 在统一变量类型和掩盖运算细节方面，Perl做得比其他高级语言(如：Python）更为出色。
- 由于从其他语言大量借鉴了语法，使得从其他编程语言转到Perl语言的程序员可以迅速上手写程序并完成任务，这使得Perl语言是一门容易用的语言。
- Perl 是可扩展的，我们可以通过 [CPAN (the Comprehensive Perl Archive Network Perl 包管理器)](http://cpan.perl.org/) 中心仓库找到很多我们需要的模块。
- Perl 的 [mod_perl](http://perl.apache.org) 的模块允许 Apache web 服务器使用 Perl 解释器，我们就可以用 Apache 和 mod_perl 来开发 CGI 网络应用

## Perl 缺点

- 也正是因为Perl的灵活性和"过度"的冗余语法，也因此获得了只写（write-only）的"美誉"，因为Perl程序可以写得很随意（例如，变量不经声明就可以直接使用），但是可能少写一些字母就会得到意想不到的结果（而不报错），许多Perl程序的代码令人难以阅读，实现相同功能的程序代码长度可以相差十倍百倍，这就令程序的维护者（甚至是编写者）难以维护。
- 同样的，因为Perl这样随意的特点，可能会导致一些Perl程序员遗忘语法，以至于不得不经常查看 Perl 手册

建议的解决方法是 **在程序里使用use strict;以及use warnings;，并统一代码风格，使用库，而不是自己使用"硬编码"** 。

Perl 同样可以将代码书写得像 Python 或 Ruby 等语言一样优雅。

- 很多时候，perl.exe 进程会占用很多的内存空间，虽然只是一时，但是感觉不好。
