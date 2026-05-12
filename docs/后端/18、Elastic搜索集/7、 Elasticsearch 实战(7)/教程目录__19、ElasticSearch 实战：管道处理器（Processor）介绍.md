# 19、ElasticSearch 实战：管道处理器（Processor）介绍
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/7/19.html
- 分类：搜索引擎
- 分组：教程目录
## 管道处理器

之前介绍摄取节点的管道。而管道中具体的处理逻辑取决于其处理。目前在7.X版本中一共存在三十二个不同的处理器。处理两个属于`X-Pack`的一共是三十个

**目前存在的管道处理器**

管道处理器
处理器名称

HTML Strip Processor
HTML标签处理器

Lowercase Processor
小写处理器

Uppercase Processor
大写处理器

Trim Processor
空符号去除处理器

Set Processor
设置参数处理器

Bytes Processor
字节处理器

Convert Processor
类型转换处理器

Date Processor
日期转换处理器

JSON Processor
JSON对象转换处理器

URL Decode Processor
URL解码处理器

Dissect Processor
数据解析处理器

Dot Expander Processor
点扩展解析处理器

GeoIP Processor
IP解析处理器

Grok Processor
Grok解析处理器

Gsub Processor
Gsub解析处理器

KV Processor
键值对解析处理器

Append Processor
数据追加处理器

Join Processor
拼接处理器

Split Processor
分割处理器

Sort Processor
排序处理器

Date Index Name Processor
日期类索引定位处理器

Drop Processor
降级处理器

Fail Processor
故障处理

Foreach Processor
循环处理

Pipeline Processor
管道委托

Remove Processor
移除处理器

Rename Processor
重命名处理器

Script Processor
脚本处理器

Set Security User Processor
设置安全用户处理器

User Agent processor
用户代理处理器

### 处理器分类

官方文档中并没有针对这些处理器进行进一步分类，个人结合使用中和学习中的个人体会很粗略的将其分为5个比较大的类型，这个类型的划分完全取决于个人经验，并不是很正式的东西，假如划分的有不合理的地方也接受大家批评。

#### 参数修改处理器

**第一类主要是对文档中字段的值进行处理或者修改的处理器**。此类处理器主要包含

**1. HTML Strip Processor**

此处理器的作用是将字段中的HTML标签移除

**2. Lowercase Processor**

此处理器的作用是将字段中的字符串转换为其等效的小写形式。

**3. Uppercase Processor**

此处理器的作用是将字段中的字符串转换为其等效的大写形式。

**4. Trim Processor**

此处理器的作用是将字段内容开头和结尾处的空白字符删除。

**5. Set Processor**

此处理器的作用是将指定内容的值设置到指定的字段中。

**5. Gsub Processor**

通过应用正则表达式和替换来转换字符串字段。如果字段不是字符串。

#### 参数转换处理器

**此类主要是对文档中字段进行类型转换或者数据转换，其并不修改字段中实际的结果而是将其转换成目标格式**。此类处理器主要包含

**1. Bytes Processor**

此处理器将可读的字节值(如1kb)转换为其实际的字节数值值(如1024)。可读的字节单位包含“b”、“kb”、“mb”、“gb”、“tb”、“pb”。

此单位不区分大小写。如果字段中单位不符合支持的内容，或者结果大于2^63，则会出现错误。

**2. Convert Processor**

此处理器将输入的文档字段转换为另外一种数据类型，如果字段的值是一个数组，将会将其内部成员进行转换。

**3. Date Processor**

此处理器将字段内容按照日期格式进行解析，默认情况下，日期处理器将解析后的日期添加为一个名为@timestamp的新字段。

**4. JSON Processor**

此处理器将文档字段中JSON字符串解析成JSON对象的处理器

**5. URL Decode Processor**

此处理器对文档中URL-decodes进行解码转换成字符串

#### 数据解析处理器 ，数据解析处理器补充

**此类主要是对文档中字段内容进行解析，根据指定的格式获取字段内容中的数据**。此类处理器主要包含

**1. Dissect Processor**

此处理器根据预设的格式从文档中的单个文本字段中提取结构化字段。dissect不使用正则表达式。这使得dissect语法简单，在某些情况下比Grok处理器更快

**2. Dot Expander Processor**

此处理器将文档字段中带`.`的内容展开为对象，该处理器允许名称中带有`.`的字段可由管道中的其他处理器访问。这些内容在被其处理之前，其他处理器无法访问这些字段。

**3. GeoIP Processor**

此处理器根据Maxmind数据库中的数据添加关于IP地址地理位置的信息

**4. Grok Processor**

此处理器从文档中的单个文本字段中提取结构化字段。

**5. KV Processor**

此处理器帮助自动解析键值对类型的消息(或特定的事件字段)。

#### 和数组相关的处理器

**此类主要是对文档中字段为数组或者将字段内容解析为数组的处理器**。此类处理器主要包含

**1. Append Processor**

如果字段是一个数组，此处理器将指定的一个或多个值追加到现有字段中，如果不存在则创建包含所提供值的数组。

**2. Join Processor**

此处理器将字段中每个元素通过指定的分隔符进行拼接，返回拼接后的字符串。当指定的字段不是数组的时候会抛出异常。

**3. Split Processor**

此处理器作用是使用分隔符将字段分割为数组。仅对字符串字段有效。

**4. Sort Processor**

此处理器对数组中的元素进行排序，数字的同构数组将按数字顺序排序，而字符串数组或字符串+数字的异构数组将按字典顺序排序。当字段不是数组时抛出错误。

#### 需要配合业务逻辑的处理器

**此类处理器没有对值的修改和解析，但是会执行某些行为，类似循环、异常处理相关，需要配合实际业务逻辑的处理**。此类处理器主要包含

**1. Date Index Name Processor**

该处理器可以根据文档中的日期或者时间戳将文档指向基于时间的索引。处理器根据设置的索引名称前缀，将文档中的日期或者时间戳用日期数学索引名称表达式设置到索引元数据中。

**2. Drop Processor**

将符合条件的文档从请求中剔除出去，防止文档在某些情况下创建索引。

**3. Fail Processor**

此处理器用于把符合条件的管道失败并返回特定消息到请求者。

**4. Foreach Processor**

当数组中所有的元素都需要以相同的方式处理，这个时候为每个元素定义处理器就变得非常麻烦。而使用foreach处理器可以通过指定数组元素的字段以及每个元素的处理方式来对整个数组进行操作。

**5. Pipeline Processor**

此处理器可以根据条件将某些处理委托给指定的管道进行处理。

**6. Remove Processor**

删除文档中的字段，如果字段不存在则抛出异常。

**7. Rename Processor**

重命名现有字段。如果字段不存在或已经使用了新名称，则会引发异常。

#### 其他

**1. Script Processor**

此处理器允许在接收管道中执行内联和存储的脚本

**2. Set Security User Processor**

此处理器，将当前经过身份验证的用户的用户相关详细信息（如用户名、角色、电子邮件、全名和元数据）设置为当前文档。

**3. User Agent processor**

此处理器从浏览器随其web请求发送的用户代理字符串中提取详细信息。

后面几篇博客中我会根据上面的分类大概介绍下每个管道处理器的简单用法。
