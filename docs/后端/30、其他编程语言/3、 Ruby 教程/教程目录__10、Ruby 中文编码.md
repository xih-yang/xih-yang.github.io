# 10、Ruby 中文编码
- 来源：https://ddkk.com/zhuanlan/other/ruby/10.html
- 分类：Ruby 教程
- 分组：教程目录
在前面的章节中，我相信你已经输出了好几次 Hello, World 了

当然，你也可能会输出中文版的 你好，世界，比如下面这段代码

```ruby
#!/usr/bin/ruby -w
puts "你好，世界！";
```

运行这段代码，如果你得到的是

```ruby
你好，世界！
```

那么，恭喜你，你使用的是最新几个版本的 Ruby

如果你得到的是下面这样的

```ruby
invalid multibyte char (US-ASCII)
```

那就不好意思了，这就是 **编码问题**

说来也奇怪，这门语言的创建者是日本人，当初创建的时候就没考虑过输出日文也会出现这个看似 bug 的 bug

算了，不细究了，反正最新的几个版本都修复了这个问题，如果是老的版本，解决办法也很简单

就是在在文件开头加入 **# -- coding: UTF-8 --** 或者 #coding=utf-8 就行了

```ruby
#!/usr/bin/ruby -w
# -*- coding: UTF-8 -*-
puts "你好，世界！";
```

运行这段代码，输出结果如下

```ruby
你好，世界！
```
