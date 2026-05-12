# 24、Ruby 哈希表（Hash）
- 来源：https://ddkk.com/zhuanlan/other/ruby/24.html
- 分类：Ruby 教程
- 分组：教程目录
Ruby 的 哈希表（Hash）是类似 "key" => "value" 这样的键值对集合

哈希类似于一个数组，只不过它的索引不局限于使用数字。

Hash 的键可以是任何对象。

Hash 虽然和数组类似，但却有一个很重要的区别：

```ruby
Hash 的元素没有特定的顺序
```

## 创建哈希表 (Hash)

创建哈希表(Hash) 有很多种方式

### 1. 使用 new 类方法创建一个空的哈希

```ruby
myhash = Hash.new
```

### 2. 使用 new 创建带有默认值的哈希

默认传递的参数是 **nil**

```ruby
myhash = Hash.new( "month" )
```

或

```ruby
myhash = Hash.new "month"
```

访问带有默认值的哈希中的任意键时，如果键或值不存在，哈希表将返回默认值

#### main.rb

```ruby
# !/usr/bin/ruby -w
# -*- encoding:utf-8 -*-
# filename: main.rb
# author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
# Copyright © 2015-2065 www.ddkk.com. All rights reserved.
myhash = Hash.new( "ddkk.cn" )
puts "#{myhash[0]}"
puts "#{myhash[72]}"
```

运行范例 »

运行以上范例，输出结果如下：

```ruby
$ ruby main.rb
ddkk.cn
ddkk.cn
```

#### main.rb

```ruby
# !/usr/bin/ruby -w
# -*- encoding:utf-8 -*-
# filename: main.rb
# author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
# Copyright © 2015-2065 www.ddkk.com. All rights reserved.
myhash = Hash["baidu" => "baidu.com", "ali" => "taobao.com"]
puts "#{myhash['baidu']}"
puts "#{myhash['ali']}"
puts "#{myhash['tencent']}"
```

尝试一下 »

运行以上范例，输出结果如下

```ruby
$ ruby main.rb
baidu.com
taobao.com
```

Ruby 语言允许使用任何的 Ruby 对象作为键或值，甚至可以使用数组

```ruby
[1,"jan"] => "January"
```

## 哈希表内置方法

调用 **哈希表(Hash)** 的方法需要先实例化一个 Hash 对象

创建Hash 对象实例的方法有四种方式：

```ruby
Hash[[key =>|, value]* ]
```

```ruby
Hash.new
```

```ruby
Hash.new(obj)
```

```ruby
Hash.new { |**hash, key| block }
```

它们都会返回一个使用给定对象进行填充的新的哈希。

创建了哈希表对象之后，就可以调用任意可用的方法

#### main.rb

```ruby
# !/usr/bin/ruby -w
# -*- encoding:utf-8 -*-
# filename: main.rb
# author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
# Copyright © 2015-2065 www.ddkk.com. All rights reserved.
$, = ", "
months = Hash.new( "month" )
months = {"1" => "January", "2" => "February"}
keys = months.keys
puts "#{keys}"
```

运行范例 »

运行以上范例，输出结果如下

```ruby
$ ruby main.rb
["1", "2"]
```

### 下表列出了哈希表(Hash)对象的方法

*hash* 是一个 Hash 对象

序号
方法 & 描述

1
hash == other_hash
检查两个哈希是否具有相同的键值对个数，键值对是否相互匹配，来判断两个哈希是否相等

2
hash.[key]
使用键，从哈希引用值。如果未找到键，则返回默认值

3
hash.[key]=value
把value给定的值与key给定的键进行关联

4
hash.clear
从哈希中移除所有的键值对

5
hash.default(key = nil)
返回 hash 的默认值，如果未通过 default= 进行设置，则返回 nil。（如果键在hash中不存在，则 [] 返回一个默认值。）

6
hash.default = obj
为 hash 设置默认值

7
hash.default_proc
如果 hash 通过块来创建，则返回块

8
hash.delete(key)
array.delete(key) { |key| block }
通过key从hash中删除键值对。如果使用了块 且未找到匹配的键值对，则返回块的结果。把它与delete_if进行比较

9
hash.delete_if { |key,value| block }
block 为 true 的每个块，从hash中删除键值对

10
hash.each { |key,value| block }
遍历hash，为每个key调用一次 block，传递 key-value 作为一个二元素数组

11
hash.each_key { |key| block }
遍历 hash，为每个key调用一次 block，传递key作为参数

12
hash.each_key { |key_value_array| block }
遍历hash，为每个key调用一次 block，传递key和value作为参数

13
**hash.each_value

14
hash.empty?
检查 hash 是否为空（不包含键值对），返回true或false

15
hash.fetch(key [, default] )
hash.fetch(key) { | key | block }
通过给定的key从hash返回值。如果未找到key，且未提供其他参数，则抛出IndexError异常；如果给出了default，则返回default；如果指定了可选的 block，则返回 block 的结果

16
hash.has_key?(key)
hash.include?(key)
hash.key?(key)
hash.member?(key)
检查给定的key是否存在于哈希中，返回true或false

17
hash.has_value?(value)
检查哈希是否包含给定的value

18
hash.index(value)
为给定的value返回哈希中的key，如果未找到匹配值则返回nil

19
hash.indexes(keys)
返回一个新的数组，由给定的键的值组成。找不到的键将插入默认值。该方法已被废弃，请使用 select

20
hash.indices(keys)
返回一个新的数组，由给定的键的值组成。找不到的键将插入默认值。该方法已被废弃，请使用 select

21
hash.inspect
返回哈希的打印字符串版本

22
hash.invert
创建一个新的hash，倒置hash中的keys和values。也就是说，在新的哈希中，hash中的键将变成值，值将变成键

23
hash.keys
创建一个新的数组，带有hash中的键。/td>

24
hash.length
以整数形式返回hash的大小或长度

25
hash.merge(other_hash)
hash.merge(other_hash) { |key, oldval, newval| block }
返回一个新的哈希，包含 hash 和 other_hash 的内容，重写 hash 中与 other_hash 带有重复键的键值对

26
hash.merge!(other_hash)
hash.merge!(other_hash) { |key, oldval, newval| block }
与 merge 相同，但实际上 hash 发生了变化

27
hash.rehash
基于每个key的当前值重新建立hash。如果插入后值发生了改变，该方法会重新索引hash

28
hash.reject { |key, value| block }
类似 delete_if, 但作用在一个拷贝的哈希上。相等于 hsh.dup.delete_if

29
hash.reject! { |key, value| block }
相等于 delete_if, 但是如果没有修改，返回 nil

30
hash.replace(other_hash)
把hash的内容替换为other_hash的内容

31
hash.select { |key, value| block }
返回一个新的数组，由block返回true的hash中的键值对组成

32
hash.shift
从hash中移除一个键值对，并把该键值对作为二元素数组返回

33
hash.size
以整数形式返回 hash 的 size 或 length

34
hash.sort
把 hash 转换为一个包含键值对数组的二维数组，然后进行排序

35
hash.store(key, value)
存储 hash 中的一个键值对

36
hash.to_a
从 hash 中创建一个二维数组。每个键值对转换为一个数组，所有这些数组都存储在一个数组中

37
hash.to_hash
返回 hash（self）

38
hash.to_s
把hash转换为一个数组，然后把该数组转换为一个字符串

39
hash.update(other_hash)
hash.update(other_hash) {|key, oldval, newval| block}
返回一个新的哈希，包含hash和other_hash的内容，重写hash中与other_hash带有重复键的键值对

40
hash.value?(value)
检查hash是否包含给定的value

41
hash.values
返回一个新的数组，包含hash的所有值

42
hash.values_at(obj, ...)
返回一个新的数组，包含hash中与给定的键相关的值
