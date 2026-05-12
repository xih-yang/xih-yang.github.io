# 47、Ruby JSON
- 来源：https://ddkk.com/zhuanlan/other/ruby/47.html
- 分类：Ruby 教程
- 分组：教程目录
JSON(JavaScript Object Notation, JS 对象标记) 是一种轻量级的数据交换格式

JSON 是当前最流行的数据交换格式

如果你从未了解过 JSON，可以学习我们的 JSON 基础教程

本章节将为大家介绍如何使用 Ruby 语言来编码和解码 JSON 对象

## 安装 Ruby JSON 模块

使用Ruby 编码或解码 JSON 数据前，我们需要先使用 gem 安装 Ruby JSON 模块

```ruby
$ gem install json
Fetching: json-2.1.0.gem (100%)
Building native extensions.  This could take a while...
Successfully installed json-2.1.0
Parsing documentation for json-2.1.0
Installing ri documentation for json-2.1.0
Done installing documentation for json after 1 seconds
1 gem installed
```

## 使用 Ruby 解析 JSON

假设我们有一些 JSON 数据，存储在 demo.json 文件中

#### demo.json

##

```ruby
[{
    "id": 1,
    "name": "北京市",
    "weight": 1,
    "remark": "直辖市"
}, {
    "id": 3,
    "name": "河北省",
    "weight": 5,
    "remark": "省份"
}, {
    "id": 5,
    "name": "内蒙古自治区",
    "weight": 32,
    "remark": "自治区"
},{
    "id": 34,
    "name": "香港特别行政区",
    "weight": 34,
    "remark": "特别行政区"
}]
```

#### main.rb

```ruby
# !/usr/bin/ruby -w
# -*- encoding:utf-8 -*-
# filename: main.rb
# author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
# Copyright © 2015-2065 www.ddkk.com. All rights reserved.
require 'rubygems'
require 'json'
require 'pp'
json = File.read('demo.json')
obj = JSON.parse(json)
pp obj
```

运行以上 Ruby 脚本，输出结果如下

```ruby
$ ruby main.rb
[{"id"=>1, "name"=>"北京市", "weight"=>1, "remark"=>"直辖市"},
 {"id"=>3, "name"=>"河北省", "weight"=>5, "remark"=>"省份"},
 {"id"=>5, "name"=>"内蒙古自治区", "weight"=>32, "remark"=>"自治区"},
 {"id"=>34, "name"=>"香港特别行政区", "weight"=>34, "remark"=>"特别行政区"}]
```
