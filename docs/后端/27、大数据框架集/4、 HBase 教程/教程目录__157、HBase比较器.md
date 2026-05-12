# 157、HBase比较器
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/157.html
- 分类：大数据框架
- 分组：教程目录
## 比较器

HBase比较器可以是以下任何一种：

**1、** BinaryComparator–使用Bytes.compareTo(byte[]，byte[])比较指定的字节数组；

**2、** BinaryPrefixComparator–按字典顺序与指定的字节数组进行比较它只比较该字节数组的长度；

**3、** RegexStringComparator–使用给定的正则表达式与指定的字节数组进行比较只有EQUAL和NOT_EQUAL比较对此比较器有效；

**4、** SubStringComparator–测试给定的子字符串是否出现在指定的字节数组中比较不区分大小写只有EQUAL和NOT_EQUAL比较对此比较器有效；

比较器的一般语法是： ComparatorType:ComparatorValue

各种比较器的ComparatorType如下：

**1、** BinaryComparator-二进制；

**2、** BinaryPrefixComparator–binaryprefix；

**3、** RegexStringComparator–regexstring；

**4、** SubStringComparator–substring；

ComparatorValue可以是任何值。

示例-ComparatorValues

**1、** binary:abc将匹配所以字典顺序大于“abc”的所有内容；

**2、** binaryprefix:abc将匹配前3个字符在词典上等于“abc”的所有内容；

**3、** regexstring:ab*yz将匹配所有不以“ab”开头并以“yz”结尾的内容；

**4、** substring:abc123将匹配以子串“abc123”开头的所有内容；
