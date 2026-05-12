# 35、Ruby gem 切换国内源
- 来源：https://ddkk.com/zhuanlan/other/ruby/35.html
- 分类：Ruby 教程
- 分组：教程目录
gem命令用于构建、上传、下载以及安装 Gem 包

gem从官方库上下载 Ruby 包会因为网络原因而太慢，导致 rubygems.org 存放在 Amazon S3 上面的资源文件间歇性连接失败

所以会遇到 gem install rack 或 bundle install 的时候半天没有响应 可以用 gem install rails -V 来查看执行过程

幸好，淘宝提供了 ruby 镜像，因此我们可以修改为淘宝下载源: http://ruby.taobao.org/

将Ruby 包下载地址切换到 ruby.taobao.com 的步骤如下

**1、** 查看当前源；

```ruby
$ gem sources -l
*** CURRENT SOURCES ***
https://rubygems.org/
```

**2、** 移除https://rubygems.org/，并添加淘宝下载源http://ruby.taobao.org/；

```ruby
$ gem sources --remove https://rubygems.org/
$ gem sources -a https://ruby.taobao.org/
$ gem sources -l
*** CURRENT SOURCES ***
https://ruby.taobao.org
# 请确保只有 ruby.taobao.org
```

**1、** 现在可以从ruby.taobao.org上下载包了，比如我们安装rails；

`$` gem install rails

### 使用 Gemfile 和 Bundle (例如：Rails 项目)

我们也可以用 bundle 的 gem 源代码镜像命令

```ruby
$ bundle config mirror.https://rubygems.org https://ruby.taobao.org
```

这样就不需要更改 Gemfile 的 source

```ruby
$ source 'https://rubygems.org/'
gem 'rails', '4.1.0'
...
```
